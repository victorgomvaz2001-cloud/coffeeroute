import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type CafeDetail,
  type CafeSearchQuery,
  type CafeSummary,
  type Paginated,
  proposeCafeSchema,
} from '@coffeeroute/shared';
import { randomBytes } from 'node:crypto';
import { type z } from 'zod';
import { readCafeRatings } from '../checkins/cafe-ratings';
import { localVisitDate } from '../checkins/visit-date';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../types/auth-user';
import { CafeSearchCache } from './cafe-search-cache.service';
import { buildCafeSearchWhere, searchOrigin, SUMMARY_COLUMNS } from './cafe-search.sql';
import { CafeSearchRow, toCafeDetail, toCafeSummary } from './cafe.mapper';
import { slugify } from './slugify';

/** Upper bound of rows scanned when `openNow` has to be filtered in memory. */
const OPEN_NOW_SCAN_LIMIT = 1000;

@Injectable()
export class CafesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CafeSearchCache,
  ) {}

  search(query: CafeSearchQuery): Promise<Paginated<CafeSummary>> {
    return this.cache.getOrCompute(query, () => this.searchUncached(query));
  }

  async findById(id: string, viewer?: AuthUser): Promise<CafeDetail> {
    const cafe = await this.prisma.cafe.findUnique({ where: { id } });
    const canSee =
      cafe &&
      (cafe.status === 'VERIFIED' || viewer?.role === 'ADMIN' || cafe.proposedById === viewer?.id);
    if (!canSee) {
      throw new NotFoundException({
        message: 'Este café no existe o aún no está verificado.',
        code: 'NOT_FOUND',
      });
    }
    const [ratings, myCheckInToday] = await Promise.all([
      readCafeRatings(this.prisma, cafe.id),
      viewer
        ? this.prisma.checkIn.findUnique({
            where: {
              userId_cafeId_visitedOn: {
                userId: viewer.id,
                cafeId: cafe.id,
                visitedOn: localVisitDate(cafe.timezone),
              },
            },
            select: { id: true },
          })
        : null,
    ]);
    return toCafeDetail(cafe, { ratings, myCheckInToday });
  }

  /** Users propose cafés; they stay PENDING until a curator verifies them (UC6). */
  async propose(input: z.output<typeof proposeCafeSchema>, userId: string): Promise<CafeDetail> {
    const cafe = await this.prisma.cafe.create({
      data: {
        ...input,
        openingHours: input.openingHours ?? Prisma.DbNull,
        equipment: input.equipment ?? Prisma.DbNull,
        slug: await this.uniqueSlug(`${input.name} ${input.city}`),
        status: 'PENDING',
        proposedById: userId,
      },
    });
    return toCafeDetail(cafe);
  }

  private async searchUncached(query: CafeSearchQuery): Promise<Paginated<CafeSummary>> {
    const where = buildCafeSearchWhere(query);
    const origin = searchOrigin(query);
    const distance = origin
      ? Prisma.sql`ST_Distance(c.location, ${origin}) / 1000.0`
      : Prisma.sql`NULL::float8`;
    const orderBy = origin
      ? Prisma.sql`"distanceKm" ASC, c.name ASC`
      : Prisma.sql`c."averageRating" DESC, c.name ASC`;
    const offset = (query.page - 1) * query.limit;

    if (query.openNow) {
      // Opening hours live in JSON with per-café timezones, so this filter runs in memory.
      const rows = await this.prisma.$queryRaw<CafeSearchRow[]>`
        SELECT ${SUMMARY_COLUMNS}, ${distance} AS "distanceKm"
        FROM cafes c WHERE ${where} ORDER BY ${orderBy} LIMIT ${OPEN_NOW_SCAN_LIMIT}`;
      const open = rows.map((row) => toCafeSummary(row)).filter((cafe) => cafe.isOpenNow);
      return {
        items: open.slice(offset, offset + query.limit),
        total: open.length,
        page: query.page,
        limit: query.limit,
      };
    }

    const [rows, [count]] = await Promise.all([
      this.prisma.$queryRaw<CafeSearchRow[]>`
        SELECT ${SUMMARY_COLUMNS}, ${distance} AS "distanceKm"
        FROM cafes c WHERE ${where} ORDER BY ${orderBy}
        LIMIT ${query.limit} OFFSET ${offset}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM cafes c WHERE ${where}`,
    ]);
    return {
      items: rows.map((row) => toCafeSummary(row)),
      total: count?.total ?? 0,
      page: query.page,
      limit: query.limit,
    };
  }

  private async uniqueSlug(source: string): Promise<string> {
    const base = slugify(source) || 'cafe';
    const taken = await this.prisma.cafe.findUnique({
      where: { slug: base },
      select: { id: true },
    });
    return taken ? `${base}-${randomBytes(3).toString('hex')}` : base;
  }
}
