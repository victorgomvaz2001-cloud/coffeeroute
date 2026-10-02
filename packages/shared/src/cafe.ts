import { z } from 'zod';
import {
  AMENITIES,
  BREW_METHODS,
  CAFE_STATUSES,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RADIUS_KM,
  MAX_PAGE_SIZE,
  MAX_RADIUS_KM,
  PRICE_RANGES,
  type Amenity,
  type BrewMethod,
  type CafeStatus,
  type PriceRange,
} from './constants';
import { openingHoursSchema, type OpeningHours } from './opening-hours';

/** Accepts `a,b`, `['a','b']` or a single value — query strings arrive in all three shapes. */
const csvArray = <T extends z.ZodType>(item: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === '') return undefined;
    const list = Array.isArray(value) ? value : [value];
    return list
      .flatMap((v) => String(v).split(','))
      .map((v) => v.trim())
      .filter(Boolean);
  }, z.array(item).optional());

const queryBoolean = z.preprocess(
  (value) => (value === 'true' || value === true ? true : value === 'false' ? false : value),
  z.boolean().optional(),
);

export const cafeSearchQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(MAX_RADIUS_KM).default(DEFAULT_RADIUS_KM),
    city: z.string().trim().min(1).optional(),
    q: z.string().trim().min(1).optional(),
    brewMethods: csvArray(z.enum(BREW_METHODS)),
    amenities: csvArray(z.enum(AMENITIES)),
    priceRange: csvArray(z.enum(PRICE_RANGES)),
    roaster: z.string().trim().min(1).optional(),
    openNow: queryBoolean,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'lat y lng deben enviarse juntos',
    path: ['lat'],
  });
export type CafeSearchQuery = z.infer<typeof cafeSearchQuerySchema>;
export type CafeSearchParams = z.input<typeof cafeSearchQuerySchema>;

const optionalUrl = z.url('URL no válida').optional();

export const proposeCafeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().max(80).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().default('Europe/Madrid'),
  website: optionalUrl,
  instagram: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(30).optional(),
  openingHours: openingHoursSchema.optional(),
  roasters: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  brewMethods: z.array(z.enum(BREW_METHODS)).default([]),
  equipment: z
    .object({ machine: z.string().max(80).optional(), grinder: z.string().max(80).optional() })
    .optional(),
  amenities: z.array(z.enum(AMENITIES)).default([]),
  priceRange: z.enum(PRICE_RANGES).default('€€'),
});
export type ProposeCafeInput = z.input<typeof proposeCafeSchema>;

export const rejectCafeSchema = z.object({
  reason: z.string().trim().min(5, 'Indica un motivo (mín. 5 caracteres)').max(500),
});
export type RejectCafeInput = z.infer<typeof rejectCafeSchema>;

export interface CafeSummary {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  priceRange: PriceRange;
  brewMethods: BrewMethod[];
  amenities: Amenity[];
  roasters: string[];
  averageRating: number;
  totalReviews: number;
  isOpenNow: boolean;
  /** Present only when the search included a location. */
  distanceKm: number | null;
}

/** Per-dimension averages over each user's latest check-in, one decimal. */
export interface CafeRatings {
  coffee: number;
  service: number;
  ambiance: number;
}

export interface CafeDetail extends CafeSummary {
  website: string | null;
  instagram: string | null;
  phone: string | null;
  timezone: string;
  openingHours: OpeningHours | null;
  equipment: { machine?: string; grinder?: string } | null;
  totalCheckIns: number;
  status: CafeStatus;
  rejectionReason: string | null;
  createdAt: string;
  /** Null until someone rates the café. */
  ratings: CafeRatings | null;
  /** The viewer's check-in for the café's current local day; null when anonymous or none. */
  myCheckInToday: { id: string } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const cafeStatusSchema = z.enum(CAFE_STATUSES);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Café as seen by curators in the admin panel. */
export interface AdminCafe extends CafeDetail {
  proposedBy: { id: string; name: string | null; email: string } | null;
  verifiedAt: string | null;
}
