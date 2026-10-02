import {
  type AdminCafe,
  type Amenity,
  type BrewMethod,
  type CafeDetail,
  type CafeSummary,
  type OpeningHours,
  type PriceRange,
  isOpenNow,
} from '@coffeeroute/shared';
import { Cafe, User } from '../generated/prisma/client';

/** Row shape returned by the raw search query (see SUMMARY_COLUMNS). */
export interface CafeSearchRow {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  openingHours: unknown;
  priceRange: string;
  brewMethods: string[];
  amenities: string[];
  roasters: string[];
  averageRating: number;
  totalReviews: number;
  distanceKm: number | null;
}

type SummarySource = Omit<CafeSearchRow, 'distanceKm'> & { distanceKm?: number | null };

export function toCafeSummary(row: SummarySource, now = new Date()): CafeSummary {
  const hours = (row.openingHours ?? null) as OpeningHours | null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: row.city,
    country: row.country,
    neighborhood: row.neighborhood,
    latitude: row.latitude,
    longitude: row.longitude,
    priceRange: row.priceRange as PriceRange,
    brewMethods: row.brewMethods as BrewMethod[],
    amenities: row.amenities as Amenity[],
    roasters: row.roasters,
    averageRating: Number(row.averageRating),
    totalReviews: row.totalReviews,
    isOpenNow: isOpenNow(hours, row.timezone, now),
    distanceKm: row.distanceKm == null ? null : Math.round(row.distanceKm * 100) / 100,
  };
}

type DetailExtras = Pick<CafeDetail, 'ratings' | 'myCheckInToday'>;

const NO_EXTRAS: DetailExtras = { ratings: null, myCheckInToday: null };

export function toCafeDetail(cafe: Cafe, extras: DetailExtras = NO_EXTRAS): CafeDetail {
  return {
    ...toCafeSummary(cafe),
    website: cafe.website,
    instagram: cafe.instagram,
    phone: cafe.phone,
    timezone: cafe.timezone,
    openingHours: (cafe.openingHours ?? null) as OpeningHours | null,
    equipment: (cafe.equipment ?? null) as CafeDetail['equipment'],
    totalCheckIns: cafe.totalCheckIns,
    status: cafe.status,
    rejectionReason: cafe.rejectionReason,
    createdAt: cafe.createdAt.toISOString(),
    ...extras,
  };
}

export function toAdminCafe(
  cafe: Cafe & { proposedBy: Pick<User, 'id' | 'name' | 'email'> | null },
): AdminCafe {
  return {
    ...toCafeDetail(cafe),
    proposedBy: cafe.proposedBy,
    verifiedAt: cafe.verifiedAt?.toISOString() ?? null,
  };
}
