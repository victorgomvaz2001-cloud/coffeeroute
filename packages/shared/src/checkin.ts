import { z } from 'zod';
import { paginationQuerySchema } from './cafe';
import { BREW_METHODS, type BrewMethod } from './constants';

export const MAX_CHECKIN_NOTES_LENGTH = 500;
export const MAX_PRICE_PAID = 100;

const RATING_MESSAGE = 'Valora de 1 a 5';

export const ratingSchema = z
  .number({ error: RATING_MESSAGE })
  .int(RATING_MESSAGE)
  .min(1, RATING_MESSAGE)
  .max(5, RATING_MESSAGE);

const brewMethods = z
  .array(z.enum(BREW_METHODS))
  .refine((list) => new Set(list).size === list.length, 'No repitas métodos');

const notes = z
  .string()
  .trim()
  .max(
    MAX_CHECKIN_NOTES_LENGTH,
    `La nota admite como máximo ${MAX_CHECKIN_NOTES_LENGTH} caracteres`,
  );

const pricePaid = z
  .number()
  .min(0, 'El precio no puede ser negativo')
  .max(MAX_PRICE_PAID, `El precio máximo es ${MAX_PRICE_PAID} €`)
  // Float-safe "at most two decimals".
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Usa como mucho 2 decimales');

/** UC4: rate a café you visited today. */
export const createCheckInSchema = z.object({
  cafeId: z.uuid(),
  ratingCoffee: ratingSchema,
  ratingService: ratingSchema,
  ratingAmbiance: ratingSchema,
  brewMethods: brewMethods.default([]),
  notes: notes.optional(),
  pricePaid: pricePaid.optional(),
});
export type CreateCheckInInput = z.input<typeof createCheckInSchema>;

/** `null` clears the note or the price. The café and the day never change. */
export const updateCheckInSchema = z
  .object({
    ratingCoffee: ratingSchema.optional(),
    ratingService: ratingSchema.optional(),
    ratingAmbiance: ratingSchema.optional(),
    brewMethods: brewMethods.optional(),
    notes: notes.nullable().optional(),
    pricePaid: pricePaid.nullable().optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'No hay cambios que guardar',
  );
export type UpdateCheckInInput = z.input<typeof updateCheckInSchema>;

export const checkInListQuerySchema = paginationQuerySchema;

export interface CheckInAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface CheckInCafe {
  id: string;
  name: string;
  city: string;
  country: string;
}

/** A check-in as anyone can see it: never includes what the author paid. */
export interface PublicCheckIn {
  id: string;
  ratingCoffee: number;
  ratingService: number;
  ratingAmbiance: number;
  /** Mean of the three ratings, one decimal. */
  overallRating: number;
  brewMethods: BrewMethod[];
  notes: string | null;
  /** Café-local calendar day of the visit, `YYYY-MM-DD`. */
  visitedOn: string;
  createdAt: string;
  author: CheckInAuthor;
}

/** Public check-in listed on a user's profile, with the café it belongs to. */
export interface UserCheckIn extends PublicCheckIn {
  cafe: CheckInCafe;
}

/** The author's own view of a check-in. */
export interface CheckIn extends UserCheckIn {
  pricePaid: number | null;
}

export function overallRating(
  r: Pick<PublicCheckIn, 'ratingCoffee' | 'ratingService' | 'ratingAmbiance'>,
): number {
  return Math.round(((r.ratingCoffee + r.ratingService + r.ratingAmbiance) / 3) * 10) / 10;
}
