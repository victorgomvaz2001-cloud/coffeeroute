import { z } from 'zod';
import { type CafeSummary } from './cafe';

export const MIN_ROUTE_CAFES = 2;
export const MAX_ROUTE_CAFES = 10;
export const DEFAULT_VISIT_MINUTES = 45;

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

const cafeIds = z
  .array(z.uuid())
  .min(MIN_ROUTE_CAFES, `Una ruta necesita al menos ${MIN_ROUTE_CAFES} cafés`)
  .max(MAX_ROUTE_CAFES, `Una ruta admite como máximo ${MAX_ROUTE_CAFES} cafés`)
  .refine(uniqueIds, 'Un café no puede repetirse en la ruta');

const visitMinutes = z.number().int().min(5).max(240);

const startPoint = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Plans a sequence of cafés: travel legs and totals, optionally reordered for the
 * shortest walk (`optimize`) starting from `start` (e.g. the user's location).
 */
export const planRouteSchema = z.object({
  cafeIds,
  visitMinutes: visitMinutes.default(DEFAULT_VISIT_MINUTES),
  optimize: z.boolean().default(false),
  start: startPoint.optional(),
});
export type PlanRouteInput = z.input<typeof planRouteSchema>;

const stopInput = z.object({
  cafeId: z.uuid(),
  notes: z.string().trim().max(280).optional(),
});

const stops = z
  .array(stopInput)
  .min(MIN_ROUTE_CAFES, `Una ruta necesita al menos ${MIN_ROUTE_CAFES} cafés`)
  .max(MAX_ROUTE_CAFES, `Una ruta admite como máximo ${MAX_ROUTE_CAFES} cafés`)
  .refine((list) => uniqueIds(list.map((s) => s.cafeId)), 'Un café no puede repetirse en la ruta');

export const createRouteSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre a la ruta').max(80),
  description: z.string().trim().max(500).optional(),
  isPublic: z.boolean().default(false),
  visitMinutes: visitMinutes.default(DEFAULT_VISIT_MINUTES),
  /** Stops in visiting order. */
  stops,
});
export type CreateRouteInput = z.input<typeof createRouteSchema>;

export const updateRouteSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre a la ruta').max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  visitMinutes: visitMinutes.optional(),
  /** Replaces all stops, in visiting order. */
  stops: stops.optional(),
});
export type UpdateRouteInput = z.input<typeof updateRouteSchema>;

export const routeListQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Where travel times came from: Mapbox walking routes, or the straight-line fallback. */
export type TravelSource = 'mapbox' | 'estimate';

export interface RouteLeg {
  fromCafeId: string;
  toCafeId: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoutePlan {
  /** Café ids in visiting order (reordered when `optimize` was requested). */
  cafeIds: string[];
  legs: RouteLeg[];
  /** Leg from the start point to the first café, when a start was given. */
  approach: Omit<RouteLeg, 'fromCafeId'> | null;
  totalDistanceKm: number;
  travelMinutes: number;
  visitMinutes: number;
  totalMinutes: number;
  travelSource: TravelSource;
}

export interface RouteStop {
  order: number;
  notes: string | null;
  cafe: CafeSummary;
  /** False when the café is no longer verified (closed, rejected…). */
  available: boolean;
}

export interface RouteSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  isPublic: boolean;
  cafeCount: number;
  totalDistanceKm: number;
  totalMinutes: number;
  updatedAt: string;
}

export interface RouteDetail extends Omit<RouteSummary, 'cafeCount'> {
  description: string | null;
  authorId: string;
  visitMinutes: number;
  travelMinutes: number;
  travelSource: TravelSource;
  stops: RouteStop[];
  legs: RouteLeg[];
  createdAt: string;
}
