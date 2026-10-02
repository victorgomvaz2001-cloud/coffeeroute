import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import { slugify } from '../src/cafes/slugify';
import { recomputeCafeRatings } from '../src/checkins/cafe-ratings';
import { localVisitDate } from '../src/checkins/visit-date';
import { SEED_CAFES, SEED_TASTERS, SEED_TASTING_NOTES } from './seed-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function upsertUser(
  email: string,
  password: string,
  data: { name: string; role: 'USER' | 'ADMIN' },
) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: data.role },
    create: { email, passwordHash, ...data },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in apps/api/.env before seeding.',
    );
  }
  const admin = await upsertUser(adminEmail, adminPassword, {
    name: 'Curador CoffeeRoute',
    role: 'ADMIN',
  });
  const demo = await upsertUser(
    process.env.SEED_DEMO_EMAIL ?? 'demo@coffeeroute.app',
    process.env.SEED_DEMO_PASSWORD ?? 'demo-password-123',
    { name: 'Demo Cafetero', role: 'USER' },
  );

  const seededSlugs: string[] = [];
  for (const { status = 'VERIFIED', ...cafe } of SEED_CAFES) {
    const slug = slugify(`${cafe.name} ${cafe.city}`);
    seededSlugs.push(slug);
    const verified = status === 'VERIFIED';
    const data = {
      ...cafe,
      status,
      verifiedAt: verified ? new Date() : null,
      verifiedById: verified ? admin.id : null,
      proposedById: verified ? null : demo.id,
    };
    await prisma.cafe.upsert({ where: { slug }, update: data, create: { ...data, slug } });
  }

  const tasters = await Promise.all(
    SEED_TASTERS.map(({ email, name }) =>
      prisma.user.upsert({ where: { email }, update: { name }, create: { email, name } }),
    ),
  );
  const visitors = [demo, ...tasters];
  // Re-seeding replaces these users' check-ins so averages are reproducible.
  await prisma.checkIn.deleteMany({ where: { userId: { in: visitors.map((u) => u.id) } } });

  const verifiedCafes = await prisma.cafe.findMany({
    where: { slug: { in: seededSlugs }, status: 'VERIFIED' },
    orderBy: { slug: 'asc' },
  });
  const prices = [2.2, 3, 3.5, 4.2];
  const now = Date.now();
  const checkIns = verifiedCafes.flatMap((cafe, i) =>
    visitors.flatMap((user, j) => {
      // Deterministic spread: the demo user (j = 0) visited every fourth café, tasters two in three.
      if (j === 0 ? i % 4 !== 0 : (i + j) % 3 === 0) return [];
      const base = 3 + ((i * 7 + j * 3) % 3); // 3–5
      // Always a past day, so the demo user can still check in today.
      const visited = new Date(now - (1 + ((i * 5 + j * 11) % 60)) * 86_400_000);
      return [
        {
          userId: user.id,
          cafeId: cafe.id,
          ratingCoffee: base,
          ratingService: Math.max(1, base - ((i + j) % 2)),
          ratingAmbiance: Math.min(5, base + ((i * j) % 2)),
          brewMethods: cafe.brewMethods.slice(0, 1 + (j % 2)),
          notes: SEED_TASTING_NOTES[(i + j) % SEED_TASTING_NOTES.length] ?? null,
          pricePaid: prices[(i + j) % prices.length]!,
          visitedOn: localVisitDate(cafe.timezone, visited),
          createdAt: visited,
        },
      ];
    }),
  );
  await prisma.checkIn.createMany({ data: checkIns });
  for (const cafe of verifiedCafes) {
    await prisma.$transaction((tx) => recomputeCafeRatings(tx, cafe.id));
  }
  console.log(`Seeded ${checkIns.length} check-ins from ${visitors.length} users.`);

  const counts = await prisma.cafe.groupBy({ by: ['status'], _count: true });
  console.log(`Seeded admin (${admin.email}), demo user (${demo.email}) and cafés:`, counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
