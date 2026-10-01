import { cafeSearchQuerySchema } from '@coffeeroute/shared';
import { buildCafeSearchWhere, searchOrigin } from './cafe-search.sql';

const parse = (input: Record<string, unknown>) => cafeSearchQuerySchema.parse(input);
const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('buildCafeSearchWhere', () => {
  it('only ever returns verified cafés', () => {
    const where = buildCafeSearchWhere(parse({}));
    expect(normalize(where.text)).toBe(`c.status = 'VERIFIED'`);
    expect(where.values).toEqual([]);
  });

  it('adds a radius filter in metres when a location is given', () => {
    const where = buildCafeSearchWhere(parse({ lat: '36.72', lng: '-4.42', radiusKm: '3' }));
    expect(where.text).toContain('ST_DWithin(c.location, ST_SetSRID(ST_MakePoint(');
    // lng comes first in ST_MakePoint.
    expect(where.values).toEqual([-4.42, 36.72, 3000]);
  });

  it('combines array, price, city and roaster filters with AND', () => {
    const where = buildCafeSearchWhere(
      parse({
        city: 'Málaga',
        brewMethods: 'espresso,pour-over',
        amenities: 'wifi',
        priceRange: '€,€€',
        roaster: 'faro',
      }),
    );
    const sql = normalize(where.text);
    expect(sql).toContain('unaccent(lower(c.city)) = unaccent(lower($1))');
    expect(sql).toContain('c."brewMethods" @> $2::text[]');
    expect(sql).toContain('c.amenities @> $3::text[]');
    expect(sql).toContain('c."priceRange" = ANY($4::text[])');
    expect(sql).toContain('unnest(c.roasters)');
    expect(where.values).toEqual([
      'Málaga',
      ['espresso', 'pour-over'],
      ['wifi'],
      ['€', '€€'],
      '%faro%',
    ]);
  });

  it('escapes LIKE wildcards in free text', () => {
    const where = buildCafeSearchWhere(parse({ q: '100%_cafe' }));
    expect(where.values).toEqual(['%100\\%\\_cafe%', '%100\\%\\_cafe%', '%100\\%\\_cafe%']);
  });
});

describe('searchOrigin', () => {
  it('is null without coordinates', () => {
    expect(searchOrigin(parse({ city: 'Madrid' }))).toBeNull();
  });
});
