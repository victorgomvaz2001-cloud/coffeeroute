import { describe, expect, it } from 'vitest';
import {
  estimateWalk,
  estimateWalkingMatrix,
  haversineMeters,
  pathTotals,
  shortestOpenPath,
} from './route-planning';

const cost = (matrix: number[][], order: number[]) =>
  order.slice(1).reduce((sum, node, i) => sum + matrix[order[i]!]![node]!, 0);

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

/** Deterministic pseudo-random asymmetric matrix. */
function randomMatrix(n: number, seed: number): number[][] {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 1000;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : rand())),
  );
}

describe('haversineMeters', () => {
  it('matches a known distance (Puerta del Sol → Plaza Mayor ≈ 410 m)', () => {
    const d = haversineMeters(
      { latitude: 40.41693, longitude: -3.70358 },
      { latitude: 40.41553, longitude: -3.70742 },
    );
    expect(d).toBeGreaterThan(350);
    expect(d).toBeLessThan(400);
  });

  it('estimates walks with a detour factor at 4.8 km/h', () => {
    const walk = estimateWalk({ latitude: 0, longitude: 0 }, { latitude: 0.01, longitude: 0 });
    expect(walk.distance).toBeCloseTo(1112 * 1.3, -1);
    expect(walk.duration).toBeCloseTo(walk.distance / (4.8 / 3.6), 5);
  });
});

describe('shortestOpenPath', () => {
  it('finds the optimum of every small instance (checked by brute force)', () => {
    for (let n = 2; n <= 7; n++) {
      for (let seed = 1; seed <= 5; seed++) {
        const matrix = randomMatrix(n, seed * 31 + n);
        const optimum = Math.min(...permutations([...Array(n).keys()]).map((p) => cost(matrix, p)));
        const order = shortestOpenPath(matrix);
        expect(order.slice().sort()).toEqual([...Array(n).keys()]);
        expect(cost(matrix, order)).toBeCloseTo(optimum, 6);
      }
    }
  });

  it('respects a fixed start', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const matrix = randomMatrix(6, seed);
      const order = shortestOpenPath(matrix, 3);
      expect(order[0]).toBe(3);
      const optimum = Math.min(
        ...permutations([0, 1, 2, 4, 5]).map((rest) => cost(matrix, [3, ...rest])),
      );
      expect(cost(matrix, order)).toBeCloseTo(optimum, 6);
    }
  });

  it('orders points along a line', () => {
    const points = [0.004, 0.0, 0.003, 0.001, 0.002].map((longitude) => ({
      latitude: 40,
      longitude,
    }));
    const order = shortestOpenPath(estimateWalkingMatrix(points).durations);
    const lngs = order.map((i) => points[i]!.longitude);
    expect(lngs[0] === 0 ? lngs : lngs.reverse()).toEqual([0, 0.001, 0.002, 0.003, 0.004]);
  });

  it('solves the largest route size quickly', () => {
    const started = performance.now();
    shortestOpenPath(randomMatrix(11, 7), 0);
    expect(performance.now() - started).toBeLessThan(500);
  });
});

describe('pathTotals', () => {
  it('adds up consecutive legs', () => {
    const matrix = {
      durations: [
        [0, 10, 50],
        [10, 0, 20],
        [50, 20, 0],
      ],
      distances: [
        [0, 1, 5],
        [1, 0, 2],
        [5, 2, 0],
      ],
    };
    expect(pathTotals([0, 1, 2], matrix)).toEqual({ travelSeconds: 30, distanceMeters: 3 });
  });
});
