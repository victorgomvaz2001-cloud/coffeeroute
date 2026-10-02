import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createRouteSchema,
  type LatLng,
  type Paginated,
  pathTotals,
  planRouteSchema,
  type RouteDetail,
  type RouteLeg,
  type RoutePlan,
  type RouteSummary,
  routeListQuerySchema,
  shortestOpenPath,
  updateRouteSchema,
} from '@coffeeroute/shared';
import { type z } from 'zod';
import { toCafeSummary } from '../cafes/cafe.mapper';
import { Cafe, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../types/auth-user';
import { TravelMatrixService } from './travel-matrix.service';

type PlanInput = z.output<typeof planRouteSchema>;
type CreateInput = z.output<typeof createRouteSchema>;
type UpdateInput = z.output<typeof updateRouteSchema>;
type ListQuery = z.output<typeof routeListQuerySchema>;

const withStops = {
  routeCafes: { include: { cafe: true }, orderBy: { order: 'asc' } },
} as const satisfies Prisma.RouteInclude;

type RouteWithStops = Prisma.RouteGetPayload<{ include: typeof withStops }>;

const notFound = () => new NotFoundException({ message: 'La ruta no existe.', code: 'NOT_FOUND' });
const round = (value: number, decimals: number) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly travel: TravelMatrixService,
  ) {}

  /** UC2 step 4: legs, totals and (optionally) the optimal visiting order. */
  async plan(input: PlanInput): Promise<RoutePlan> {
    const cafes = await this.loadAvailableCafes(input.cafeIds);
    return this.computePlan(cafes, input.visitMinutes, {
      optimize: input.optimize,
      start: input.start,
    });
  }

  async create(authorId: string, input: CreateInput): Promise<RouteDetail> {
    const cafes = await this.loadAvailableCafes(input.stops.map((s) => s.cafeId));
    const plan = await this.computePlan(cafes, input.visitMinutes);
    const { city, country } = mostCommonPlace(cafes);

    const route = await this.prisma.route.create({
      data: {
        name: input.name,
        description: input.description,
        isPublic: input.isPublic,
        visitMinutes: input.visitMinutes,
        city,
        country,
        totalDistance: plan.totalDistanceKm,
        estimatedTime: plan.totalMinutes,
        authorId,
        routeCafes: {
          create: input.stops.map((stop, order) => ({
            cafeId: stop.cafeId,
            order,
            notes: stop.notes,
          })),
        },
      },
      include: withStops,
    });
    return this.toDetail(route);
  }

  async listMine(authorId: string): Promise<RouteSummary[]> {
    const routes = await this.prisma.route.findMany({
      where: { authorId },
      include: { _count: { select: { routeCafes: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return routes.map((r) => toSummary(r, r._count.routeCafes));
  }

  async listPublic({ city, page, limit }: ListQuery): Promise<Paginated<RouteSummary>> {
    const where: Prisma.RouteWhereInput = {
      isPublic: true,
      ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
    };
    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        include: { _count: { select: { routeCafes: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.route.count({ where }),
    ]);
    return { items: routes.map((r) => toSummary(r, r._count.routeCafes)), total, page, limit };
  }

  async findOne(id: string, viewer?: AuthUser): Promise<RouteDetail> {
    const route = await this.prisma.route.findUnique({ where: { id }, include: withStops });
    if (!route || (!route.isPublic && route.authorId !== viewer?.id)) throw notFound();
    return this.toDetail(route);
  }

  async update(id: string, authorId: string, input: UpdateInput): Promise<RouteDetail> {
    const existing = await this.loadOwned(id, authorId);
    const stops =
      input.stops ??
      existing.routeCafes.map((rc) => ({ cafeId: rc.cafeId, notes: rc.notes ?? undefined }));
    const visitMinutes = input.visitMinutes ?? existing.visitMinutes;

    let totals: Pick<
      Prisma.RouteUpdateInput,
      'totalDistance' | 'estimatedTime' | 'city' | 'country'
    > = {};
    if (input.stops || input.visitMinutes !== undefined) {
      // New stops must be available; existing ones that were since closed may stay.
      const cafes = input.stops
        ? await this.loadAvailableCafes(stops.map((s) => s.cafeId))
        : existing.routeCafes.map((rc) => rc.cafe);
      const plan = await this.computePlan(cafes, visitMinutes);
      totals = {
        totalDistance: plan.totalDistanceKm,
        estimatedTime: plan.totalMinutes,
        ...mostCommonPlace(cafes),
      };
    }

    const route = await this.prisma.$transaction(async (tx) => {
      if (input.stops) {
        await tx.routeCafe.deleteMany({ where: { routeId: id } });
        await tx.routeCafe.createMany({
          data: stops.map((stop, order) => ({
            routeId: id,
            cafeId: stop.cafeId,
            order,
            notes: stop.notes,
          })),
        });
      }
      return tx.route.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          visitMinutes: input.visitMinutes,
          ...totals,
        },
        include: withStops,
      });
    });
    return this.toDetail(route);
  }

  async remove(id: string, authorId: string): Promise<void> {
    await this.loadOwned(id, authorId);
    await this.prisma.route.delete({ where: { id } });
  }

  private async loadOwned(id: string, authorId: string): Promise<RouteWithStops> {
    const route = await this.prisma.route.findUnique({ where: { id }, include: withStops });
    if (!route || (!route.isPublic && route.authorId !== authorId)) throw notFound();
    if (route.authorId !== authorId) {
      throw new ForbiddenException({
        message: 'Solo el autor puede modificar esta ruta.',
        code: 'FORBIDDEN',
      });
    }
    return route;
  }

  /** Verified cafés in the requested order; rejects unknown or unverified ids. */
  private async loadAvailableCafes(ids: string[]): Promise<Cafe[]> {
    const cafes = await this.prisma.cafe.findMany({
      where: { id: { in: ids }, status: 'VERIFIED' },
    });
    const byId = new Map(cafes.map((c) => [c.id, c]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) {
      throw new BadRequestException({
        message:
          missing.length === 1
            ? 'Uno de los cafés ya no está disponible. Quítalo de la ruta.'
            : `${missing.length} cafés ya no están disponibles. Quítalos de la ruta.`,
        code: 'CAFE_UNAVAILABLE',
      });
    }
    return ids.map((id) => byId.get(id)!);
  }

  private async computePlan(
    cafes: Cafe[],
    visitMinutes: number,
    options: { optimize?: boolean; start?: LatLng } = {},
  ): Promise<RoutePlan> {
    const offset = options.start ? 1 : 0;
    const points: LatLng[] = [...(options.start ? [options.start] : []), ...cafes];
    const matrix = await this.travel.walkingMatrix(points);

    let order = points.map((_, i) => i);
    if (options.optimize) order = shortestOpenPath(matrix.durations, options.start ? 0 : undefined);
    const cafeOrder = order.filter((i) => i >= offset);

    const legs: RouteLeg[] = cafeOrder.slice(1).map((to, k) => {
      const from = cafeOrder[k]!;
      return {
        fromCafeId: cafes[from - offset]!.id,
        toCafeId: cafes[to - offset]!.id,
        distanceMeters: Math.round(matrix.distances[from]![to]!),
        durationSeconds: Math.round(matrix.durations[from]![to]!),
      };
    });
    const firstCafe = cafeOrder[0]!;
    const approach = options.start
      ? {
          toCafeId: cafes[firstCafe - offset]!.id,
          distanceMeters: Math.round(matrix.distances[0]![firstCafe]!),
          durationSeconds: Math.round(matrix.durations[0]![firstCafe]!),
        }
      : null;

    // Totals cover café-to-café legs only: the approach depends on where the user is.
    const totals = pathTotals(cafeOrder, matrix);
    const travelMinutes = Math.round(totals.travelSeconds / 60);
    const visitTotal = visitMinutes * cafes.length;
    return {
      cafeIds: cafeOrder.map((i) => cafes[i - offset]!.id),
      legs,
      approach,
      totalDistanceKm: round(totals.distanceMeters / 1000, 2),
      travelMinutes,
      visitMinutes: visitTotal,
      totalMinutes: travelMinutes + visitTotal,
      travelSource: matrix.source,
    };
  }

  private async toDetail(route: RouteWithStops): Promise<RouteDetail> {
    const cafes = route.routeCafes.map((rc) => rc.cafe);
    const plan = cafes.length >= 2 ? await this.computePlan(cafes, route.visitMinutes) : null;
    return {
      ...toSummary(route, cafes.length),
      // Live figures, so they reflect any café that moved since the route was saved.
      totalDistanceKm: plan?.totalDistanceKm ?? route.totalDistance ?? 0,
      totalMinutes: plan?.totalMinutes ?? route.estimatedTime ?? 0,
      description: route.description,
      authorId: route.authorId,
      visitMinutes: route.visitMinutes,
      travelMinutes: plan?.travelMinutes ?? 0,
      travelSource: plan?.travelSource ?? 'estimate',
      stops: route.routeCafes.map((rc) => ({
        order: rc.order,
        notes: rc.notes,
        cafe: toCafeSummary(rc.cafe),
        available: rc.cafe.status === 'VERIFIED',
      })),
      legs: plan?.legs ?? [],
      createdAt: route.createdAt.toISOString(),
    };
  }
}

function toSummary(
  route: Pick<
    RouteWithStops,
    | 'id'
    | 'name'
    | 'city'
    | 'country'
    | 'isPublic'
    | 'totalDistance'
    | 'estimatedTime'
    | 'updatedAt'
  >,
  cafeCount: number,
): RouteSummary {
  return {
    id: route.id,
    name: route.name,
    city: route.city,
    country: route.country,
    isPublic: route.isPublic,
    cafeCount,
    totalDistanceKm: route.totalDistance ?? 0,
    totalMinutes: route.estimatedTime ?? 0,
    updatedAt: route.updatedAt.toISOString(),
  };
}

/** A route belongs to the city most of its cafés are in. */
function mostCommonPlace(cafes: Pick<Cafe, 'city' | 'country'>[]): {
  city: string;
  country: string;
} {
  const counts = new Map<string, { city: string; country: string; n: number }>();
  for (const { city, country } of cafes) {
    const key = `${city}|${country}`;
    const entry = counts.get(key) ?? { city, country, n: 0 };
    entry.n += 1;
    counts.set(key, entry);
  }
  const [top] = [...counts.values()].sort((a, b) => b.n - a.n);
  return { city: top!.city, country: top!.country };
}
