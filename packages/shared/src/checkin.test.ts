import { describe, expect, it } from 'vitest';
import { type z } from 'zod';
import { createCheckInSchema, overallRating, updateCheckInSchema } from './checkin';

const cafeId = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const valid = { cafeId, ratingCoffee: 5, ratingService: 4, ratingAmbiance: 3 };

function issues(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('createCheckInSchema', () => {
  it('accepts the minimum and defaults brew methods to none', () => {
    expect(createCheckInSchema.parse(valid)).toEqual({ ...valid, brewMethods: [] });
  });

  it.each([0, 6, 3.5])('rejects rating %s', (rating) => {
    expect(issues(createCheckInSchema.safeParse({ ...valid, ratingCoffee: rating }))).toEqual({
      ratingCoffee: 'Valora de 1 a 5',
    });
  });

  it('requires all three ratings', () => {
    expect(issues(createCheckInSchema.safeParse({ cafeId }))).toEqual({
      ratingCoffee: 'Valora de 1 a 5',
      ratingService: 'Valora de 1 a 5',
      ratingAmbiance: 'Valora de 1 a 5',
    });
  });

  it('trims notes and caps them at 500 characters', () => {
    expect(createCheckInSchema.parse({ ...valid, notes: '  cacao  ' }).notes).toBe('cacao');
    expect(
      Object.keys(issues(createCheckInSchema.safeParse({ ...valid, notes: 'a'.repeat(501) }))),
    ).toEqual(['notes']);
  });

  it('rejects unknown or repeated brew methods', () => {
    expect(
      Object.keys(issues(createCheckInSchema.safeParse({ ...valid, brewMethods: ['nope'] }))),
    ).toEqual(['brewMethods.0']);
    expect(
      issues(createCheckInSchema.safeParse({ ...valid, brewMethods: ['espresso', 'espresso'] })),
    ).toEqual({ brewMethods: 'No repitas métodos' });
  });

  it.each([
    [0, true],
    [3.5, true],
    [2.35, true],
    [100, true],
    [-1, false],
    [100.5, false],
    [3.333, false],
  ])('price %s valid=%s', (pricePaid, ok) => {
    expect(createCheckInSchema.safeParse({ ...valid, pricePaid }).success).toBe(ok);
  });
});

describe('updateCheckInSchema', () => {
  it('rejects an empty update', () => {
    expect(updateCheckInSchema.safeParse({}).success).toBe(false);
  });

  it('allows clearing the note and the price', () => {
    expect(updateCheckInSchema.parse({ notes: null, pricePaid: null })).toEqual({
      notes: null,
      pricePaid: null,
    });
  });
});

describe('overallRating', () => {
  it('averages the three ratings to one decimal', () => {
    expect(overallRating({ ratingCoffee: 5, ratingService: 4, ratingAmbiance: 4 })).toBe(4.3);
    expect(overallRating({ ratingCoffee: 5, ratingService: 4, ratingAmbiance: 3 })).toBe(4);
  });
});
