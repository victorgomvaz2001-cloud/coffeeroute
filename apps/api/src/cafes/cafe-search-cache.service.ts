import { Inject, Injectable, Logger } from '@nestjs/common';
import { type CafeSearchQuery, type CafeSummary, type Paginated } from '@coffeeroute/shared';
import Redis from 'ioredis';
import { createHash } from 'node:crypto';
import { REDIS } from '../redis/redis.module';

const VERSION_KEY = 'cafes:search:version';
// Short TTL: results embed `isOpenNow`, which drifts with the clock.
const TTL_SECONDS = 60;

/**
 * Read-through cache for café searches (RNF33). Invalidation bumps a version number
 * instead of scanning keys; stale entries simply expire. Redis failures never break search.
 */
@Injectable()
export class CafeSearchCache {
  private readonly logger = new Logger(CafeSearchCache.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async getOrCompute(
    query: CafeSearchQuery,
    compute: () => Promise<Paginated<CafeSummary>>,
  ): Promise<Paginated<CafeSummary>> {
    const key = await this.keyFor(query);
    if (key) {
      const cached = await this.safe(() => this.redis.get(key));
      if (cached) return JSON.parse(cached) as Paginated<CafeSummary>;
    }
    const result = await compute();
    if (key) await this.safe(() => this.redis.set(key, JSON.stringify(result), 'EX', TTL_SECONDS));
    return result;
  }

  async invalidate(): Promise<void> {
    await this.safe(() => this.redis.incr(VERSION_KEY));
  }

  private async keyFor(query: CafeSearchQuery): Promise<string | null> {
    const version = await this.safe(() => this.redis.get(VERSION_KEY));
    if (version === undefined) return null;
    const normalized = JSON.stringify(query, Object.keys(query).sort());
    const digest = createHash('sha1').update(normalized).digest('hex');
    return `cafes:search:v${version ?? 0}:${digest}`;
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.logger.warn(`Redis unavailable, skipping cache: ${(error as Error).message}`);
      return undefined;
    }
  }
}
