import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { type AuthResponse } from '@coffeeroute/shared';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { REDIS } from '../src/redis/redis.module';
import { setupApp } from '../src/setup-app';

export interface TestContext {
  app: NestExpressApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  setupApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService), http: () => request(app.getHttpServer()) };
}

export async function resetState({ app, prisma }: TestContext): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE users, refresh_tokens, cafes, routes, route_cafes, check_ins, follows, favorites, reports CASCADE',
  );
  await app.get<Redis>(REDIS).flushdb();
}

let counter = 0;

export async function signup(ctx: TestContext, overrides: { email?: string; role?: 'ADMIN' } = {}) {
  const email = overrides.email ?? `user${++counter}-${Date.now()}@example.com`;
  const password = 'supersecret1';
  const res = await ctx
    .http()
    .post('/api/v1/auth/signup')
    .send({ email, password, name: 'Tester', acceptTerms: true })
    .expect(201);
  let auth = res.body as AuthResponse;

  if (overrides.role === 'ADMIN') {
    await ctx.prisma.user.update({ where: { id: auth.user.id }, data: { role: 'ADMIN' } });
    // The role lives in the JWT, so log in again to get an admin token.
    const login = await ctx.http().post('/api/v1/auth/login').send({ email, password }).expect(200);
    auth = login.body as AuthResponse;
  }
  return { ...auth, email, password, bearer: `Bearer ${auth.tokens.accessToken}` };
}

type CafeOverrides = Partial<Parameters<PrismaService['cafe']['create']>[0]['data']>;

export function createCafe(ctx: TestContext, overrides: CafeOverrides = {}) {
  const name = overrides.name ?? `Café ${++counter}`;
  return ctx.prisma.cafe.create({
    data: {
      name,
      slug: `${name.toLowerCase().replace(/\W+/g, '-')}-${counter}`,
      address: 'Calle Test 1',
      city: 'Málaga',
      country: 'España',
      latitude: 36.7213,
      longitude: -4.4214,
      brewMethods: ['espresso'],
      amenities: [],
      roasters: ['Faro Roasters'],
      priceRange: '€€',
      status: 'VERIFIED',
      openingHours: {
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' },
      },
      ...overrides,
    },
  });
}
