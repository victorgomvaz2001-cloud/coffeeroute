import { type CafeSummary } from '@coffeeroute/shared';
import { createCafe, createTestApp, resetState, signup, type TestContext } from './helpers';

const names = (body: { items: CafeSummary[] }) => body.items.map((c) => c.name);

describe('Cafés (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx?.app.close());

  it('finds verified cafés within the radius, nearest first', async () => {
    // Plaza de la Constitución, Málaga is the origin.
    await createCafe(ctx, { name: 'Far', latitude: 36.7213, longitude: -4.3807 }); // ~3.6 km
    await createCafe(ctx, { name: 'Near', latitude: 36.7219, longitude: -4.4196 }); // ~0.2 km
    await createCafe(ctx, { name: 'Mid', latitude: 36.7161, longitude: -4.4241 }); // ~0.6 km
    await createCafe(ctx, {
      name: 'Pending',
      status: 'PENDING',
      latitude: 36.7214,
      longitude: -4.4213,
    });
    await createCafe(ctx, {
      name: 'Madrid',
      city: 'Madrid',
      latitude: 40.4252,
      longitude: -3.7048,
    });

    const res = await ctx
      .http()
      .get('/api/v1/cafes')
      .query({ lat: 36.7208, lng: -4.4198, radiusKm: 2 })
      .expect(200);

    expect(names(res.body)).toEqual(['Near', 'Mid']);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].distanceKm).toBeLessThan(res.body.items[1].distanceKm);
  });

  it('searches by city ignoring accents and case', async () => {
    await createCafe(ctx, { name: 'Uno', city: 'Málaga' });
    await createCafe(ctx, { name: 'Dos', city: 'Lisboa', country: 'Portugal' });
    const res = await ctx.http().get('/api/v1/cafes').query({ city: 'MALAGA' }).expect(200);
    expect(names(res.body)).toEqual(['Uno']);
    expect(res.body.items[0].distanceKm).toBeNull();
  });

  it('filters by brew methods (all required), amenities, price and roaster', async () => {
    await createCafe(ctx, {
      name: 'Match',
      brewMethods: ['espresso', 'pour-over', 'siphon'],
      amenities: ['wifi', 'laptop-friendly'],
      priceRange: '€',
      roasters: ['Atlântico Torrefação'],
    });
    await createCafe(ctx, {
      name: 'OnlyEspresso',
      brewMethods: ['espresso'],
      amenities: ['wifi'],
      priceRange: '€',
    });
    await createCafe(ctx, {
      name: 'Pricey',
      brewMethods: ['espresso', 'pour-over'],
      amenities: ['wifi'],
      priceRange: '€€€',
    });

    const res = await ctx
      .http()
      .get('/api/v1/cafes')
      .query({
        brewMethods: 'espresso,pour-over',
        amenities: 'wifi',
        priceRange: '€,€€',
        roaster: 'atlantico',
      })
      .expect(200);
    expect(names(res.body)).toEqual(['Match']);
  });

  it('filters cafés open now using each café timezone', async () => {
    await createCafe(ctx, { name: 'Open' });
    await createCafe(ctx, { name: 'Closed', openingHours: {} });
    const res = await ctx.http().get('/api/v1/cafes').query({ openNow: 'true' }).expect(200);
    expect(names(res.body)).toEqual(['Open']);
    expect(res.body.items[0].isOpenNow).toBe(true);
  });

  it('paginates results', async () => {
    for (const name of ['A', 'B', 'C']) await createCafe(ctx, { name });
    const res = await ctx.http().get('/api/v1/cafes').query({ limit: 2, page: 2 }).expect(200);
    expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(res.body.items).toHaveLength(1);
  });

  it('rejects invalid queries with a readable error', async () => {
    const res = await ctx
      .http()
      .get('/api/v1/cafes')
      .query({ lat: 36.7, brewMethods: 'instant' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.fieldErrors).toHaveProperty(['brewMethods.0']);
  });

  it('returns café details, hiding unverified ones from strangers', async () => {
    const verified = await createCafe(ctx, {
      name: 'Verified',
      equipment: { machine: 'La Marzocco' },
    });
    const pending = await createCafe(ctx, { name: 'Hidden', status: 'PENDING' });

    const res = await ctx.http().get(`/api/v1/cafes/${verified.id}`).expect(200);
    expect(res.body).toMatchObject({
      name: 'Verified',
      equipment: { machine: 'La Marzocco' },
      status: 'VERIFIED',
    });

    await ctx.http().get(`/api/v1/cafes/${pending.id}`).expect(404);
    await ctx.http().get('/api/v1/cafes/not-a-uuid').expect(404);
  });

  it('lets registered users propose cafés that stay pending', async () => {
    const user = await signup(ctx);
    const proposal = {
      name: 'Nuevo Café',
      address: 'Calle Larios 1',
      city: 'Málaga',
      country: 'España',
      latitude: 36.7196,
      longitude: -4.4214,
      brewMethods: ['espresso', 'pour-over'],
      openingHours: { monday: { open: '08:00', close: '18:00' } },
    };

    await ctx.http().post('/api/v1/cafes').send(proposal).expect(401);
    const created = await ctx
      .http()
      .post('/api/v1/cafes')
      .set('Authorization', user.bearer)
      .send(proposal)
      .expect(201);
    expect(created.body).toMatchObject({ status: 'PENDING', slug: 'nuevo-cafe-malaga' });

    // The proposer can see it; the public search cannot.
    await ctx
      .http()
      .get(`/api/v1/cafes/${created.body.id}`)
      .set('Authorization', user.bearer)
      .expect(200);
    const search = await ctx.http().get('/api/v1/cafes').query({ q: 'nuevo' }).expect(200);
    expect(search.body.total).toBe(0);

    // A second café with the same name gets a unique slug.
    const again = await ctx
      .http()
      .post('/api/v1/cafes')
      .set('Authorization', user.bearer)
      .send(proposal)
      .expect(201);
    expect(again.body.slug).toMatch(/^nuevo-cafe-malaga-[0-9a-f]{6}$/);
  });
});
