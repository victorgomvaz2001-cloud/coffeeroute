import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type CheckIn,
  createCheckInSchema,
  type Paginated,
  type PaginationQuery,
  updateCheckInSchema,
} from '@coffeeroute/shared';
import { type z } from 'zod';
import { CafeSearchCache } from '../cafes/cafe-search-cache.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { recomputeCafeRatings } from './cafe-ratings';
import { checkInInclude, type CheckInRow, toCheckIn } from './checkin.mapper';
import { localVisitDate } from './visit-date';

type CreateInput = z.output<typeof createCheckInSchema>;
type UpdateInput = z.output<typeof updateCheckInSchema>;

const notFound = () =>
  new NotFoundException({ message: 'El check-in no existe.', code: 'NOT_FOUND' });

export const cafeNotFound = () =>
  new NotFoundException({
    message: 'Este café no existe o aún no está verificado.',
    code: 'NOT_FOUND',
  });

const alreadyToday = () =>
  new ConflictException({
    message: 'Ya hiciste check-in aquí hoy.',
    code: 'CHECKIN_ALREADY_TODAY',
  });

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

@Injectable()
export class CheckinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchCache: CafeSearchCache,
  ) {}

  /** UC4. The day is the café's local day, so the limit follows the café, not the phone. */
  async create(userId: string, input: CreateInput): Promise<CheckIn> {
    const cafe = await this.prisma.cafe.findUnique({
      where: { id: input.cafeId },
      select: { id: true, status: true, timezone: true },
    });
    if (cafe?.status !== 'VERIFIED') throw cafeNotFound();

    try {
      const row = await this.write(cafe.id, (tx) =>
        tx.checkIn.create({
          data: {
            userId,
            cafeId: cafe.id,
            visitedOn: localVisitDate(cafe.timezone),
            ratingCoffee: input.ratingCoffee,
            ratingService: input.ratingService,
            ratingAmbiance: input.ratingAmbiance,
            brewMethods: input.brewMethods,
            notes: input.notes || null,
            pricePaid: input.pricePaid ?? null,
          },
          include: checkInInclude,
        }),
      );
      return toCheckIn(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw alreadyToday();
      throw error;
    }
  }

  async findOwn(id: string, userId: string): Promise<CheckIn> {
    return toCheckIn(await this.loadOwned(id, userId));
  }

  listMine(userId: string, query: PaginationQuery): Promise<Paginated<CheckIn>> {
    return this.paginate({ userId }, query, toCheckIn);
  }

  async update(id: string, userId: string, input: UpdateInput): Promise<CheckIn> {
    const existing = await this.loadOwned(id, userId);
    const row = await this.write(existing.cafeId, (tx) =>
      tx.checkIn.update({
        where: { id },
        data: {
          ratingCoffee: input.ratingCoffee,
          ratingService: input.ratingService,
          ratingAmbiance: input.ratingAmbiance,
          brewMethods: input.brewMethods,
          // An emptied note is stored as "no note".
          notes: input.notes === undefined ? undefined : input.notes || null,
          pricePaid: input.pricePaid,
        },
        include: checkInInclude,
      }),
    );
    return toCheckIn(row);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.loadOwned(id, userId);
    await this.write(existing.cafeId, (tx) => tx.checkIn.delete({ where: { id } }));
  }

  /** Runs a write and the café's aggregate refresh atomically, then expires cached searches. */
  private async write<T>(
    cafeId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const result = await this.prisma.$transaction(async (tx) => {
      const value = await fn(tx);
      await recomputeCafeRatings(tx, cafeId);
      return value;
    });
    await this.searchCache.invalidate();
    return result;
  }

  private async loadOwned(id: string, userId: string): Promise<CheckInRow> {
    const row = await this.prisma.checkIn.findUnique({ where: { id }, include: checkInInclude });
    if (row?.userId !== userId) throw notFound();
    return row;
  }

  private async paginate<T>(
    where: Prisma.CheckInWhereInput,
    { page, limit }: PaginationQuery,
    map: (row: CheckInRow) => T,
  ): Promise<Paginated<T>> {
    const [rows, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        include: checkInInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.checkIn.count({ where }),
    ]);
    return { items: rows.map((row) => map(row)), total, page, limit };
  }
}
