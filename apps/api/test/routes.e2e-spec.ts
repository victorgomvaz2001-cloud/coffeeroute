import { type RouteDetail, type RoutePlan } from '@coffeeroute/shared';
import { createCafe, createTestApp, resetState, signup, type TestContext } from './helpers';

describe('Routes (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx?.app.close());

  /** Four cafés on an east–west line, created deliberately out of order. */
  async function lineOfCafes() {
    const east = await createCafe(ctx, { name: 'East', latitude: 36.72, longitude: -4.41 });
    const west = await createCafe(ctx, { name: 'West', latitude: 36.72, longitude: -4.44 });
    const middleEast = await createCafe(ctx, {
      name: 'MiddleEast',
      latitude: 36.72,
      longitude: -4.42,
    });
    const middleWest = await createCafe(ctx, {
      name: 'MiddleWest',
      latitude: 36.72,
      longitude: -4.43,
    });
    return { east, west, middleEast, middleWest };
  }

  it('requires authentication to plan or create', async () => {
    await ctx.http().post('/api/v1/routes/plan').send({}).expect(401);
    await ctx.http().post('/api/v1/routes').send({}).expect(401);
  });

  it('plans the optimal order from the user location', async () => {
    const user = await signup(ctx);
    const { east, west, middleEast, middleWest } = await lineOfCafes();

    const res = await ctx
      .http()
      .post('/api/v1/routes/plan')
      .set('Authorization', user.bearer)
      .send({
        cafeIds: [east.id, west.id, middleEast.id, middleWest.id],
        optimize: true,
        start: { latitude: 36.72, longitude: -4.45 }, // west of everything
      })
      .expect(200);
    const plan = res.body as RoutePlan;

    expect(plan.cafeIds).toEqual([west.id, middleWest.id, middleEast.id, east.id]);
    expect(plan.legs).toHaveLength(3);
    expect(plan.approach?.toCafeId).toBe(west.id);
    expect(plan.travelSource).toBe('estimate');
    expect(plan.visitMinutes).toBe(4 * 45);
    expect(plan.totalMinutes).toBe(plan.travelMinutes + plan.visitMinutes);
    // ~2.7 km straight line × 1.3 detour.
    expect(plan.totalDistanceKm).toBeGreaterThan(3);
    expect(plan.totalDistanceKm).toBeLessThan(4);
  });

  it('keeps the given order when not optimising', async () => {
    const user = await signup(ctx);
    const { east, west } = await lineOfCafes();
    const res = await ctx
      .http()
      .post('/api/v1/routes/plan')
      .set('Authorization', user.bearer)
      .send({ cafeIds: [east.id, west.id], visitMinutes: 30 })
      .expect(200);
    expect(res.body.cafeIds).toEqual([east.id, west.id]);
    expect(res.body.approach).toBeNull();
    expect(res.body.visitMinutes).toBe(60);
  });

  it('validates route size, duplicates and unavailable cafés', async () => {
    const user = await signup(ctx);
    const { east } = await lineOfCafes();
    const pending = await createCafe(ctx, { name: 'Pending', status: 'PENDING' });
    const plan = (body: object) =>
      ctx.http().post('/api/v1/routes/plan').set('Authorization', user.bearer).send(body);

    expect((await plan({ cafeIds: [east.id] }).expect(400)).body.fieldErrors).toHaveProperty(
      'cafeIds',
    );
    expect(
      (await plan({ cafeIds: [east.id, east.id] }).expect(400)).body.fieldErrors,
    ).toHaveProperty('cafeIds');
    expect((await plan({ cafeIds: [east.id, pending.id] }).expect(400)).body.code).toBe(
      'CAFE_UNAVAILABLE',
    );
  });

  it('creates, lists, reorders, edits and deletes a route', async () => {
    const user = await signup(ctx);
    const { east, west, middleEast } = await lineOfCafes();
    await createCafe(ctx, {
      name: 'Lisbon',
      city: 'Lisboa',
      country: 'Portugal',
      latitude: 38.71,
      longitude: -9.14,
    });

    const created = await ctx
      .http()
      .post('/api/v1/routes')
      .set('Authorization', user.bearer)
      .send({
        name: 'Centro Málaga',
        stops: [
          { cafeId: west.id, notes: 'Probar el flat white' },
          { cafeId: middleEast.id },
          { cafeId: east.id },
        ],
      })
      .expect(201);
    const route = created.body as RouteDetail;
    expect(route).toMatchObject({
      name: 'Centro Málaga',
      city: 'Málaga',
      country: 'España',
      isPublic: false,
    });
    expect(route.stops.map((s) => s.cafe.name)).toEqual(['West', 'MiddleEast', 'East']);
    expect(route.stops[0]).toMatchObject({
      order: 0,
      notes: 'Probar el flat white',
      available: true,
    });
    expect(route.legs).toHaveLength(2);
    expect(route.totalMinutes).toBe(route.travelMinutes + 3 * 45);

    const mine = await ctx
      .http()
      .get('/api/v1/routes/mine')
      .set('Authorization', user.bearer)
      .expect(200);
    expect(mine.body).toEqual([expect.objectContaining({ id: route.id, cafeCount: 3 })]);

    const updated = await ctx
      .http()
      .patch(`/api/v1/routes/${route.id}`)
      .set('Authorization', user.bearer)
      .send({
        name: 'Málaga exprés',
        visitMinutes: 20,
        stops: [{ cafeId: east.id }, { cafeId: west.id }],
      })
      .expect(200);
    expect(updated.body).toMatchObject({ name: 'Málaga exprés', visitMinutes: 20 });
    expect(updated.body.stops.map((s: { cafe: { name: string } }) => s.cafe.name)).toEqual([
      'East',
      'West',
    ]);
    expect(updated.body.totalMinutes).toBe(updated.body.travelMinutes + 2 * 20);

    await ctx
      .http()
      .delete(`/api/v1/routes/${route.id}`)
      .set('Authorization', user.bearer)
      .expect(204);
    await ctx
      .http()
      .get(`/api/v1/routes/${route.id}`)
      .set('Authorization', user.bearer)
      .expect(404);
  });

  it('hides private routes and protects them from other users', async () => {
    const author = await signup(ctx);
    const other = await signup(ctx);
    const { east, west } = await lineOfCafes();
    const create = (isPublic: boolean) =>
      ctx
        .http()
        .post('/api/v1/routes')
        .set('Authorization', author.bearer)
        .send({
          name: isPublic ? 'Pública' : 'Privada',
          isPublic,
          stops: [{ cafeId: east.id }, { cafeId: west.id }],
        })
        .expect(201)
        .then((r) => r.body as RouteDetail);
    const privateRoute = await create(false);
    const publicRoute = await create(true);

    await ctx
      .http()
      .get(`/api/v1/routes/${privateRoute.id}`)
      .set('Authorization', other.bearer)
      .expect(404);
    await ctx.http().get(`/api/v1/routes/${publicRoute.id}`).expect(200);
    await ctx
      .http()
      .patch(`/api/v1/routes/${publicRoute.id}`)
      .set('Authorization', other.bearer)
      .send({ name: 'x' })
      .expect(403);
    await ctx
      .http()
      .delete(`/api/v1/routes/${privateRoute.id}`)
      .set('Authorization', other.bearer)
      .expect(404);

    const listed = await ctx.http().get('/api/v1/routes').query({ city: 'málaga' }).expect(200);
    expect(listed.body.items.map((r: { name: string }) => r.name)).toEqual(['Pública']);
  });

  it('flags stops whose café was later closed', async () => {
    const user = await signup(ctx);
    const { east, west } = await lineOfCafes();
    const created = await ctx
      .http()
      .post('/api/v1/routes')
      .set('Authorization', user.bearer)
      .send({ name: 'Ruta', stops: [{ cafeId: east.id }, { cafeId: west.id }] })
      .expect(201);
    await ctx.prisma.cafe.update({ where: { id: west.id }, data: { status: 'REJECTED' } });

    const res = await ctx
      .http()
      .get(`/api/v1/routes/${created.body.id}`)
      .set('Authorization', user.bearer)
      .expect(200);
    expect(res.body.stops.map((s: { available: boolean }) => s.available)).toEqual([true, false]);
  });

  it('counts created routes in the profile stats', async () => {
    const user = await signup(ctx);
    const { east, west } = await lineOfCafes();
    await ctx
      .http()
      .post('/api/v1/routes')
      .set('Authorization', user.bearer)
      .send({ name: 'Ruta', stops: [{ cafeId: east.id }, { cafeId: west.id }] })
      .expect(201);
    const me = await ctx
      .http()
      .get('/api/v1/users/me')
      .set('Authorization', user.bearer)
      .expect(200);
    expect(me.body.stats.routesCreated).toBe(1);
  });
});
