import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import { slugify } from '../src/cafes/slugify';
import { SEED_CAFES } from './seed-data';

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

  for (const { status = 'VERIFIED', ...cafe } of SEED_CAFES) {
    const slug = slugify(`${cafe.name} ${cafe.city}`);
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

  const counts = await prisma.cafe.groupBy({ by: ['status'], _count: true });
  console.log(`Seeded admin (${admin.email}), demo user (${demo.email}) and cafés:`, counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
