import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../.env'), quiet: true });

const withPath = (url: string, path: string) => {
  const parsed = new URL(url);
  parsed.pathname = path;
  return parsed.toString();
};

/**
 * e2e tests run against a dedicated database and Redis DB so they never touch dev data.
 * Override with E2E_DATABASE_URL / E2E_REDIS_URL (CI does).
 */
export const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ??
    withPath(
      process.env.DATABASE_URL ?? 'postgresql://coffeeroute:coffeeroute@localhost:5433/coffeeroute',
      '/coffeeroute_test',
    ),
  REDIS_URL:
    process.env.E2E_REDIS_URL ?? withPath(process.env.REDIS_URL ?? 'redis://localhost:6380', '/1'),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'e2e-secret-e2e-secret-e2e-secret-e2e-secret',
  THROTTLE_LIMIT_PER_MINUTE: '10000',
  AUTH_THROTTLE_LIMIT_PER_MINUTE: '10000',
  SENTRY_DSN: '',
  // Deterministic travel times: e2e tests never call Mapbox (see travel-matrix.service.spec.ts).
  MAPBOX_ACCESS_TOKEN: '',
};
