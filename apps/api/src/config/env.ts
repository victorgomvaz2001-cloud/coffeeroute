import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  THROTTLE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(100),
  AUTH_THROTTLE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  SENTRY_DSN: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  /** Walking travel times (Matrix API). Without it, routes fall back to straight-line estimates. */
  MAPBOX_ACCESS_TOKEN: z
    .string()
    .optional()
    .transform((v) => v || undefined),
});

export type Env = z.infer<typeof envSchema>;

/** Validates process.env at boot so misconfiguration fails fast with a readable message. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
