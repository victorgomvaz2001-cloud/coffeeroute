import { ConfigService } from '@nestjs/config';
import { estimateWalk } from '@coffeeroute/shared';
import Redis from 'ioredis';
import { Env } from '../config/env';
import { TravelMatrixService } from './travel-matrix.service';

const A = { latitude: 36.7219, longitude: -4.4196 };
const B = { latitude: 36.7161, longitude: -4.4241 };
const C = { latitude: 36.7182, longitude: -4.4148 };

/** Minimal in-memory stand-in for the Redis calls the service makes. */
function fakeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    mget: jest.fn((keys: string[]) => Promise.resolve(keys.map((k) => store.get(k) ?? null))),
    multi: jest.fn(() => {
      const ops: [string, string][] = [];
      const chain = {
        set: (k: string, v: string) => (ops.push([k, v]), chain),
        exec: () => (ops.forEach(([k, v]) => store.set(k, v)), Promise.resolve([])),
      };
      return chain;
    }),
  };
}

function setup(token?: string) {
  const redis = fakeRedis();
  const config = { get: jest.fn(() => token) } as unknown as ConfigService<Env, true>;
  const service = new TravelMatrixService(config, redis as unknown as Redis);
  return { service, redis };
}

const mapboxOk = (durations: (number | null)[][], distances: (number | null)[][]) =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ code: 'Ok', durations, distances }),
  }) as Response;

describe('TravelMatrixService', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('uses Mapbox walking times and caches every pair', async () => {
    const { service, redis } = setup('pk.test');
    fetchMock.mockResolvedValue(
      mapboxOk(
        [
          [0, 680, 730],
          [681, 0, 680],
          [729, 679, 0],
        ],
        [
          [0, 941, 1014],
          [942, 0, 945],
          [1013, 944, 0],
        ],
      ),
    );

    const matrix = await service.walkingMatrix([A, B, C]);

    expect(matrix.source).toBe('mapbox');
    expect(matrix.durations[0]![1]).toBe(680);
    expect(matrix.distances[2]![0]).toBe(1013);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/mapbox/walking/-4.4196,36.7219;-4.4241,36.7161;-4.4148,36.7182');
    expect(url).toContain('annotations=duration,distance');
    expect(redis.store.size).toBe(6);
  });

  it('answers from cache without calling Mapbox again', async () => {
    const { service } = setup('pk.test');
    fetchMock.mockResolvedValue(
      mapboxOk(
        [
          [0, 600],
          [610, 0],
        ],
        [
          [0, 800],
          [810, 0],
        ],
      ),
    );
    await service.walkingMatrix([A, B]);
    const again = await service.walkingMatrix([A, B]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(again).toMatchObject({
      source: 'mapbox',
      durations: [
        [0, 600],
        [610, 0],
      ],
    });
  });

  it('estimates pairs Mapbox cannot route (null) and reports it', async () => {
    const { service } = setup('pk.test');
    fetchMock.mockResolvedValue(
      mapboxOk(
        [
          [0, null],
          [610, 0],
        ],
        [
          [0, null],
          [810, 0],
        ],
      ),
    );
    const matrix = await service.walkingMatrix([A, B]);

    expect(matrix.source).toBe('estimate');
    expect(matrix.durations[0]![1]).toBeCloseTo(estimateWalk(A, B).duration, 5);
    expect(matrix.durations[1]![0]).toBe(610);
  });

  it('falls back to estimates when Mapbox fails', async () => {
    const { service } = setup('pk.test');
    fetchMock.mockRejectedValue(new Error('timeout'));
    const matrix = await service.walkingMatrix([A, B]);
    expect(matrix.source).toBe('estimate');
    expect(matrix.distances[0]![1]).toBeCloseTo(estimateWalk(A, B).distance, 5);
  });

  it('never calls Mapbox without a token', async () => {
    const { service } = setup(undefined);
    const matrix = await service.walkingMatrix([A, B, C]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(matrix.source).toBe('estimate');
  });
});
