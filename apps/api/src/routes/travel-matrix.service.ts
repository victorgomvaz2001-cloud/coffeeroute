import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  estimateWalk,
  type LatLng,
  type TravelMatrix,
  type TravelSource,
} from '@coffeeroute/shared';
import Redis from 'ioredis';
import { Env } from '../config/env';
import { REDIS } from '../redis/redis.module';

const MAPBOX_MATRIX_URL = 'https://api.mapbox.com/directions-matrix/v1/mapbox/walking';
const MAX_COORDINATES = 25;
const TIMEOUT_MS = 5_000;
// Walking times between two fixed points barely change; keys include the coordinates,
// so moving a café invalidates its entries automatically.
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface WalkingMatrix extends TravelMatrix {
  source: TravelSource;
}

interface MapboxMatrixResponse {
  code: string;
  durations?: (number | null)[][];
  distances?: (number | null)[][];
}

const coordKey = (p: LatLng) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
const pairKey = (a: LatLng, b: LatLng) => `travel:walking:${coordKey(a)}:${coordKey(b)}`;

/**
 * Walking durations/distances between points via the Mapbox Matrix API, cached per pair in
 * Redis. Any pair Mapbox can't answer (no token, outage, no walkable route) falls back to a
 * straight-line estimate so planning a route never fails because of a third party.
 */
@Injectable()
export class TravelMatrixService {
  private readonly logger = new Logger(TravelMatrixService.name);

  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async walkingMatrix(points: LatLng[]): Promise<WalkingMatrix> {
    const n = points.length;
    const durations = points.map(() => points.map(() => 0));
    const distances = points.map(() => points.map(() => 0));
    const pairs: [number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) pairs.push([i, j]);

    const resolved = new Set<string>();
    const fill = (i: number, j: number, duration: number, distance: number) => {
      durations[i]![j] = duration;
      distances[i]![j] = distance;
      resolved.add(`${i}:${j}`);
    };

    // 1. Cache.
    const cached = pairs.length
      ? await this.safe(() =>
          this.redis.mget(pairs.map(([i, j]) => pairKey(points[i]!, points[j]!))),
        )
      : [];
    cached?.forEach((value, index) => {
      if (!value) return;
      const [duration, distance] = value.split(',').map(Number);
      const [i, j] = pairs[index]!;
      fill(i, j, duration!, distance!);
    });

    // 2. Mapbox for whatever is missing.
    let usedEstimate = false;
    if (resolved.size < pairs.length) {
      const fresh = await this.fetchMapbox(points);
      if (fresh) {
        const toCache: string[] = [];
        for (const [i, j] of pairs) {
          if (resolved.has(`${i}:${j}`)) continue;
          const duration = fresh.durations?.[i]?.[j];
          const distance = fresh.distances?.[i]?.[j];
          if (duration == null || distance == null) continue;
          fill(i, j, duration, distance);
          toCache.push(pairKey(points[i]!, points[j]!), `${duration},${distance}`);
        }
        if (toCache.length) await this.cachePairs(toCache);
      }

      // 3. Estimate the rest.
      for (const [i, j] of pairs) {
        if (resolved.has(`${i}:${j}`)) continue;
        const leg = estimateWalk(points[i]!, points[j]!);
        fill(i, j, leg.duration, leg.distance);
        usedEstimate = true;
      }
    }

    return { durations, distances, source: usedEstimate ? 'estimate' : 'mapbox' };
  }

  private async fetchMapbox(points: LatLng[]): Promise<MapboxMatrixResponse | null> {
    const token = this.config.get('MAPBOX_ACCESS_TOKEN', { infer: true });
    if (!token || points.length < 2 || points.length > MAX_COORDINATES) return null;

    const coordinates = points.map((p) => `${p.longitude},${p.latitude}`).join(';');
    const url = `${MAPBOX_MATRIX_URL}/${coordinates}?annotations=duration,distance&access_token=${token}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const body = (await response.json()) as MapboxMatrixResponse;
      if (!response.ok || body.code !== 'Ok') {
        this.logger.warn(`Mapbox Matrix answered ${response.status} ${body.code}; using estimates`);
        return null;
      }
      return body;
    } catch (error) {
      this.logger.warn(`Mapbox Matrix unreachable (${(error as Error).message}); using estimates`);
      return null;
    }
  }

  private async cachePairs(keyValues: string[]) {
    await this.safe(async () => {
      const pipeline = this.redis.multi();
      for (let k = 0; k < keyValues.length; k += 2) {
        pipeline.set(keyValues[k]!, keyValues[k + 1]!, 'EX', CACHE_TTL_SECONDS);
      }
      await pipeline.exec();
    });
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.logger.warn(`Redis unavailable for travel cache: ${(error as Error).message}`);
      return undefined;
    }
  }
}
