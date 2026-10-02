import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type MeResponse,
  type PublicUserResponse,
  type UpdateProfileInput,
  type UserStats,
} from '@coffeeroute/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CafeSearchCache } from '../cafes/cafe-search-cache.service';
import { recomputeCafeRatings } from '../checkins/cafe-ratings';
import { toPublicUserProfile, toUserProfile } from './user.mapper';

const notFound = () =>
  new NotFoundException({ message: 'El usuario no existe.', code: 'NOT_FOUND' });

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchCache: CafeSearchCache,
  ) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound();
    return { ...toUserProfile(user), stats: await this.getStats(userId) };
  }

  async updateMe(userId: string, input: UpdateProfileInput): Promise<MeResponse> {
    await this.prisma.user.update({ where: { id: userId }, data: input });
    return this.getMe(userId);
  }

  /** GDPR right to erasure (RNF20/RNF21): personal data cascades, proposed cafés are kept anonymised. */
  async deleteMe(userId: string): Promise<void> {
    const touchedCafes = await this.prisma.$transaction(async (tx) => {
      // Sorted so concurrent deletions lock cafés in the same order.
      const visited = await tx.checkIn.findMany({
        where: { userId },
        distinct: ['cafeId'],
        select: { cafeId: true },
        orderBy: { cafeId: 'asc' },
      });
      await tx.user.delete({ where: { id: userId } });
      // Their check-ins cascaded away; drop their votes from those cafés' averages.
      for (const { cafeId } of visited) await recomputeCafeRatings(tx, cafeId);
      return visited.length;
    });
    if (touchedCafes) await this.searchCache.invalidate();
  }

  async getPublicProfile(userId: string): Promise<PublicUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound();
    return { ...toPublicUserProfile(user), stats: await this.getStats(userId) };
  }

  private async getStats(userId: string): Promise<UserStats> {
    const [visits] = await this.prisma.$queryRaw<
      { checkIns: number; cafesVisited: number; citiesVisited: number }[]
    >`
      SELECT COUNT(*)::int AS "checkIns",
             COUNT(DISTINCT ci."cafeId")::int AS "cafesVisited",
             COUNT(DISTINCT (c.city, c.country))::int AS "citiesVisited"
      FROM check_ins ci
      JOIN cafes c ON c.id = ci."cafeId"
      WHERE ci."userId" = ${userId}`;
    const routesCreated = await this.prisma.route.count({ where: { authorId: userId } });
    return {
      checkIns: visits?.checkIns ?? 0,
      cafesVisited: visits?.cafesVisited ?? 0,
      citiesVisited: visits?.citiesVisited ?? 0,
      routesCreated,
    };
  }
}
