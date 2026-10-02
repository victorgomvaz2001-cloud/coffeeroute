import {
  type BrewMethod,
  type CheckIn,
  overallRating,
  type PublicCheckIn,
  type UserCheckIn,
} from '@coffeeroute/shared';
import { Prisma } from '../generated/prisma/client';
import { toIsoDate } from './visit-date';

export const checkInInclude = {
  user: { select: { id: true, name: true, avatarUrl: true } },
  cafe: { select: { id: true, name: true, city: true, country: true } },
} as const satisfies Prisma.CheckInInclude;

export type CheckInRow = Prisma.CheckInGetPayload<{ include: typeof checkInInclude }>;

/** Lists fields one by one so `pricePaid` can never leak into a public response. */
export function toPublicCheckIn(row: CheckInRow): PublicCheckIn {
  return {
    id: row.id,
    ratingCoffee: row.ratingCoffee,
    ratingService: row.ratingService,
    ratingAmbiance: row.ratingAmbiance,
    overallRating: overallRating(row),
    brewMethods: row.brewMethods as BrewMethod[],
    notes: row.notes,
    visitedOn: toIsoDate(row.visitedOn),
    createdAt: row.createdAt.toISOString(),
    author: row.user,
  };
}

export function toUserCheckIn(row: CheckInRow): UserCheckIn {
  return { ...toPublicCheckIn(row), cafe: row.cafe };
}

export function toCheckIn(row: CheckInRow): CheckIn {
  return { ...toUserCheckIn(row), pricePaid: row.pricePaid };
}
