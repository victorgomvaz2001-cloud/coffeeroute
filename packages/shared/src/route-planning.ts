/** Pure route-planning maths shared by the API and the app (works offline). */

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Square matrices indexed [from][to]. Durations in seconds, distances in metres. */
export interface TravelMatrix {
  durations: number[][];
  distances: number[][];
}

const EARTH_RADIUS_M = 6_371_000;
/** Streets are never straight: typical detour factor for walking in a city grid. */
export const URBAN_DETOUR_FACTOR = 1.3;
/** 4.8 km/h. */
export const WALKING_SPEED_MPS = 4.8 / 3.6;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Walking estimate between two points when no routing service is available. */
export function estimateWalk(a: LatLng, b: LatLng): { distance: number; duration: number } {
  const distance = haversineMeters(a, b) * URBAN_DETOUR_FACTOR;
  return { distance, duration: distance / WALKING_SPEED_MPS };
}

export function estimateWalkingMatrix(points: LatLng[]): TravelMatrix {
  const durations = points.map(() => points.map(() => 0));
  const distances = points.map(() => points.map(() => 0));
  points.forEach((from, i) =>
    points.forEach((to, j) => {
      if (i === j) return;
      const leg = estimateWalk(from, to);
      durations[i]![j] = leg.duration;
      distances[i]![j] = leg.distance;
    }),
  );
  return { durations, distances };
}

/**
 * Exact shortest open path (no return to start) visiting every node once — Held-Karp,
 * O(n²·2ⁿ). Fine for the 2–11 nodes a route can have (10 cafés + optional start).
 *
 * @param cost square cost matrix, may be asymmetric
 * @param start index the path must begin at; any node may start when omitted
 * @returns node indices in visiting order
 */
export function shortestOpenPath(cost: number[][], start?: number): number[] {
  const n = cost.length;
  if (n <= 1) return n === 1 ? [0] : [];
  if (n > 16) throw new Error('shortestOpenPath supports at most 16 nodes');

  const full = (1 << n) - 1;
  // best[mask][j]: cheapest path covering `mask` and ending at j.
  const best: number[][] = Array.from({ length: 1 << n }, () =>
    new Array<number>(n).fill(Infinity),
  );
  const parent: number[][] = Array.from({ length: 1 << n }, () => new Array<number>(n).fill(-1));

  for (let j = 0; j < n; j++) {
    if (start === undefined || start === j) best[1 << j]![j] = 0;
  }

  for (let mask = 1; mask <= full; mask++) {
    for (let last = 0; last < n; last++) {
      const current = best[mask]![last]!;
      if (!(mask & (1 << last)) || current === Infinity) continue;
      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const candidate = current + cost[last]![next]!;
        if (candidate < best[nextMask]![next]!) {
          best[nextMask]![next] = candidate;
          parent[nextMask]![next] = last;
        }
      }
    }
  }

  let end = 0;
  for (let j = 1; j < n; j++) if (best[full]![j]! < best[full]![end]!) end = j;

  const path: number[] = [];
  for (let mask = full, node = end; node !== -1;) {
    path.push(node);
    const prev = parent[mask]![node]!;
    mask &= ~(1 << node);
    node = prev;
  }
  return path.reverse();
}

export interface PathTotals {
  distanceMeters: number;
  travelSeconds: number;
}

/** Sum of consecutive legs along `order`. */
export function pathTotals(order: number[], matrix: TravelMatrix): PathTotals {
  let distanceMeters = 0;
  let travelSeconds = 0;
  for (let i = 1; i < order.length; i++) {
    distanceMeters += matrix.distances[order[i - 1]!]![order[i]!]!;
    travelSeconds += matrix.durations[order[i - 1]!]![order[i]!]!;
  }
  return { distanceMeters, travelSeconds };
}
