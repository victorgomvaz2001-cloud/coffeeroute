import { describe, expect, it } from 'vitest';
import { cafeSearchQuerySchema } from './cafe';

describe('cafeSearchQuerySchema', () => {
  it('parses query-string shaped input', () => {
    const parsed = cafeSearchQuerySchema.parse({
      lat: '36.72',
      lng: '-4.42',
      brewMethods: 'espresso,pour-over',
      amenities: ['wifi'],
      openNow: 'true',
    });
    expect(parsed).toMatchObject({
      lat: 36.72,
      lng: -4.42,
      radiusKm: 5,
      brewMethods: ['espresso', 'pour-over'],
      amenities: ['wifi'],
      openNow: true,
      page: 1,
    });
  });

  it('requires lat and lng together', () => {
    expect(cafeSearchQuerySchema.safeParse({ lat: '36.7' }).success).toBe(false);
  });

  it('rejects unknown brew methods', () => {
    expect(cafeSearchQuerySchema.safeParse({ brewMethods: 'instant' }).success).toBe(false);
  });
});
