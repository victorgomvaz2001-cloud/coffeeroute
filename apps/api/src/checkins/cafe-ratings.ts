import { type CafeRatings } from '@coffeeroute/shared';
import { Prisma } from '../generated/prisma/client';

/** Anything that runs raw SQL: PrismaService, PrismaClient (seed) or a transaction. */
type Db = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>;

/** One vote per user: the ratings of each user's latest check-in at the café. */
const latestVotes = (cafeId: string) => Prisma.sql`
  SELECT DISTINCT ON ("userId") "ratingCoffee", "ratingService", "ratingAmbiance"
  FROM check_ins
  WHERE "cafeId" = ${cafeId}
  ORDER BY "userId", "createdAt" DESC, id DESC`;

/**
 * Rewrites the café's stored aggregates from its check-ins. Call it inside the transaction
 * that changed them. The row lock serialises concurrent recomputes of the same café; it is
 * NO KEY UPDATE because inserting a check-in already holds FOR KEY SHARE on the café (foreign
 * key), which FOR UPDATE would wait on — two simultaneous check-ins would deadlock.
 */
export async function recomputeCafeRatings(db: Db, cafeId: string): Promise<void> {
  await db.$queryRaw`SELECT id FROM cafes WHERE id = ${cafeId} FOR NO KEY UPDATE`;
  await db.$executeRaw`
    WITH latest AS (${latestVotes(cafeId)})
    UPDATE cafes SET
      "averageRating" = COALESCE(
        (SELECT ROUND(AVG(("ratingCoffee" + "ratingService" + "ratingAmbiance") / 3.0), 1) FROM latest),
        0),
      "totalReviews" = (SELECT COUNT(*) FROM latest),
      "totalCheckIns" = (SELECT COUNT(*) FROM check_ins WHERE "cafeId" = ${cafeId})
    WHERE id = ${cafeId}`;
}

/** Per-dimension averages for the café page; null when nobody has rated it. */
export async function readCafeRatings(db: Db, cafeId: string): Promise<CafeRatings | null> {
  const [row] = await db.$queryRaw<
    { coffee: number | null; service: number | null; ambiance: number | null }[]
  >`
    WITH latest AS (${latestVotes(cafeId)})
    SELECT ROUND(AVG("ratingCoffee"), 1)::float8 AS coffee,
           ROUND(AVG("ratingService"), 1)::float8 AS service,
           ROUND(AVG("ratingAmbiance"), 1)::float8 AS ambiance
    FROM latest`;
  if (!row || row.coffee === null || row.service === null || row.ambiance === null) return null;
  return { coffee: row.coffee, service: row.service, ambiance: row.ambiance };
}
