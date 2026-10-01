import { type CafeSearchQuery } from '@coffeeroute/shared';
import { Prisma } from '../generated/prisma/client';

/** Columns needed to build a CafeSummary; `location` is never selected (PostGIS type). */
export const SUMMARY_COLUMNS = Prisma.sql`
  c.id, c.name, c.slug, c.address, c.city, c.country, c.neighborhood, c.latitude, c.longitude,
  c.timezone, c."openingHours", c."priceRange", c."brewMethods", c.amenities, c.roasters,
  c."averageRating", c."totalReviews"`;

const escapeLike = (value: string) => `%${value.replace(/[\\%_]/g, '\\$&')}%`;

/** The search origin as a PostGIS geography, or null when searching by city/text only. */
export function searchOrigin(query: CafeSearchQuery): Prisma.Sql | null {
  if (query.lat === undefined || query.lng === undefined) return null;
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography`;
}

/** Builds the WHERE clause for GET /cafes. Only verified cafés are ever public. */
export function buildCafeSearchWhere(query: CafeSearchQuery): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`c.status = 'VERIFIED'`];

  const origin = searchOrigin(query);
  if (origin) {
    conditions.push(Prisma.sql`ST_DWithin(c.location, ${origin}, ${query.radiusKm * 1000})`);
  }
  if (query.city) {
    conditions.push(Prisma.sql`unaccent(lower(c.city)) = unaccent(lower(${query.city}))`);
  }
  if (query.q) {
    const pattern = escapeLike(query.q);
    conditions.push(Prisma.sql`(
      unaccent(c.name) ILIKE unaccent(${pattern})
      OR unaccent(coalesce(c.neighborhood, '')) ILIKE unaccent(${pattern})
      OR unaccent(c.city) ILIKE unaccent(${pattern})
    )`);
  }
  if (query.brewMethods?.length) {
    conditions.push(Prisma.sql`c."brewMethods" @> ${query.brewMethods}::text[]`);
  }
  if (query.amenities?.length) {
    conditions.push(Prisma.sql`c.amenities @> ${query.amenities}::text[]`);
  }
  if (query.priceRange?.length) {
    conditions.push(Prisma.sql`c."priceRange" = ANY(${query.priceRange}::text[])`);
  }
  if (query.roaster) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM unnest(c.roasters) AS r WHERE unaccent(r) ILIKE unaccent(${escapeLike(query.roaster)})
    )`);
  }

  return Prisma.join(conditions, ' AND ');
}
