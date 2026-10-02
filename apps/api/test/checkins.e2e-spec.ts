import {
  type CafeDetail,
  type CafeSummary,
  type CheckIn,
  type Paginated,
} from '@coffeeroute/shared';
import { createCafe, createTestApp, resetState, signup, type TestContext } from './helpers';

const ratings = { ratingCoffee: 5, ratingService: 4, ratingAmbiance: 3 };

describe('Check-ins (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx?.app.close());

  const post = (bearer: string, body: object) =>
    ctx.http().post('/api/v1/checkins').set('Authorization', bearer).send(body);

  async function cafeDetail(id: string, bearer?: string): Promise<CafeDetail> {
    const req = ctx.http().get(`/api/v1/cafes/${id}`);
    if (bearer) void req.set('Authorization', bearer);
    return (await req.expect(200)).body as CafeDetail;
  }

  /** Moves a check-in to an earlier day so its author can check in again today. */
  function backdate(id: string, daysAgo: number) {
    const when = new Date(Date.now() - daysAgo * 86_400_000);
    return ctx.prisma.checkIn.update({
      where: { id },
      data: {
        createdAt: when,
        visitedOn: new Date(`${when.toISOString().slice(0, 10)}T00:00:00Z`),
      },
    });
  }

  it('requires authentication', async () => {
    await ctx.http().post('/api/v1/checkins').send({}).expect(401);
    await ctx.http().get('/api/v1/checkins/me').expect(401);
  });

  it('creates a check-in and refreshes the café aggregates', async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);

    const res = await post(user.bearer, {
      cafeId: cafe.id,
      ...ratings,
      brewMethods: ['espresso', 'pour-over'],
      notes: '  Chocolate y acidez media ',
      pricePaid: 3.5,
    }).expect(201);
    const created = res.body as CheckIn;

    expect(created).toMatchObject({
      ...ratings,
      overallRating: 4,
      brewMethods: ['espresso', 'pour-over'],
      notes: 'Chocolate y acidez media',
      pricePaid: 3.5,
      author: { id: user.user.id, name: 'Tester' },
      cafe: { id: cafe.id, name: cafe.name, city: 'Málaga' },
    });
    expect(created.visitedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(await cafeDetail(cafe.id, user.bearer)).toMatchObject({
      averageRating: 4,
      totalReviews: 1,
      totalCheckIns: 1,
      ratings: { coffee: 5, service: 4, ambiance: 3 },
      myCheckInToday: { id: created.id },
    });
  });

  it('shows no ratings and no own check-in to anonymous viewers of an unrated café', async () => {
    const cafe = await createCafe(ctx);
    expect(await cafeDetail(cafe.id)).toMatchObject({
      averageRating: 0,
      totalReviews: 0,
      ratings: null,
      myCheckInToday: null,
    });
  });

  it('allows one check-in per café and day', async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    const other = await createCafe(ctx);
    await post(user.bearer, { cafeId: cafe.id, ...ratings }).expect(201);

    const res = await post(user.bearer, { cafeId: cafe.id, ...ratings }).expect(409);
    expect(res.body).toMatchObject({
      code: 'CHECKIN_ALREADY_TODAY',
      message: 'Ya hiciste check-in aquí hoy.',
    });
    await post(user.bearer, { cafeId: other.id, ...ratings }).expect(201);
  });

  it('turns a double tap into one check-in and one 409', async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    const results = await Promise.all([
      post(user.bearer, { cafeId: cafe.id, ...ratings }),
      post(user.bearer, { cafeId: cafe.id, ...ratings }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await cafeDetail(cafe.id)).totalCheckIns).toBe(1);
  });

  it('survives simultaneous check-ins from different users', async () => {
    const users = await Promise.all([signup(ctx), signup(ctx), signup(ctx)]);
    const cafe = await createCafe(ctx);
    const results = await Promise.all(
      users.map((u) => post(u.bearer, { cafeId: cafe.id, ...ratings })),
    );
    expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
    expect(await cafeDetail(cafe.id)).toMatchObject({ totalReviews: 3, totalCheckIns: 3 });
  });

  it('rejects unknown and unverified cafés', async () => {
    const user = await signup(ctx);
    const pending = await createCafe(ctx, { status: 'PENDING' });
    const res = await post(user.bearer, { cafeId: pending.id, ...ratings }).expect(404);
    expect(res.body.message).toBe('Este café no existe o aún no está verificado.');
    await post(user.bearer, { cafeId: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b', ...ratings }).expect(
      404,
    );
  });

  it('validates the body', async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    const res = await post(user.bearer, {
      cafeId: cafe.id,
      ...ratings,
      ratingCoffee: 0,
      notes: 'a'.repeat(501),
      pricePaid: 150,
    }).expect(400);
    expect(Object.keys(res.body.fieldErrors).sort()).toEqual([
      'notes',
      'pricePaid',
      'ratingCoffee',
    ]);
  });

  it('stores a whitespace-only note as no note', async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    const res = await post(user.bearer, { cafeId: cafe.id, ...ratings, notes: '   ' }).expect(201);
    expect(res.body.notes).toBeNull();
  });

  it('counts one vote per user: their latest check-in', async () => {
    const [a, b] = await Promise.all([signup(ctx), signup(ctx)]);
    const cafe = await createCafe(ctx);
    const old = await post(a.bearer, {
      cafeId: cafe.id,
      ratingCoffee: 1,
      ratingService: 1,
      ratingAmbiance: 1,
    }).expect(201);
    await backdate(old.body.id, 3);
    await post(a.bearer, {
      cafeId: cafe.id,
      ratingCoffee: 5,
      ratingService: 5,
      ratingAmbiance: 5,
    }).expect(201);
    await post(b.bearer, {
      cafeId: cafe.id,
      ratingCoffee: 3,
      ratingService: 3,
      ratingAmbiance: 3,
    }).expect(201);

    expect(await cafeDetail(cafe.id)).toMatchObject({
      averageRating: 4,
      totalReviews: 2,
      totalCheckIns: 3,
      ratings: { coffee: 4, service: 4, ambiance: 4 },
    });
  });

  it('lets only the author read, edit and delete, recomputing each time', async () => {
    const [author, other] = await Promise.all([signup(ctx), signup(ctx)]);
    const cafe = await createCafe(ctx);
    const { body } = await post(author.bearer, {
      cafeId: cafe.id,
      ...ratings,
      pricePaid: 3,
    }).expect(201);
    const url = `/api/v1/checkins/${body.id}`;

    await ctx.http().get(url).set('Authorization', author.bearer).expect(200);
    await ctx.http().get(url).set('Authorization', other.bearer).expect(404);
    await ctx
      .http()
      .patch(url)
      .set('Authorization', other.bearer)
      .send({ ratingCoffee: 1 })
      .expect(404);
    await ctx.http().delete(url).set('Authorization', other.bearer).expect(404);

    const patched = await ctx
      .http()
      .patch(url)
      .set('Authorization', author.bearer)
      .send({ ratingCoffee: 2, notes: null, pricePaid: null })
      .expect(200);
    expect(patched.body).toMatchObject({
      ratingCoffee: 2,
      notes: null,
      pricePaid: null,
      overallRating: 3,
    });
    expect((await cafeDetail(cafe.id)).averageRating).toBe(3);

    await ctx.http().patch(url).set('Authorization', author.bearer).send({}).expect(400);

    await ctx.http().delete(url).set('Authorization', author.bearer).expect(204);
    expect(await cafeDetail(cafe.id)).toMatchObject({
      averageRating: 0,
      totalReviews: 0,
      totalCheckIns: 0,
      ratings: null,
    });
  });

  it("edits yesterday's check-in after checking in today, keeping its day", async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    const old = await post(user.bearer, { cafeId: cafe.id, ...ratings }).expect(201);
    const moved = await backdate(old.body.id, 1);
    await post(user.bearer, { cafeId: cafe.id, ...ratings }).expect(201);

    const res = await ctx
      .http()
      .patch(`/api/v1/checkins/${old.body.id}`)
      .set('Authorization', user.bearer)
      .send({ ratingAmbiance: 5 })
      .expect(200);
    expect(res.body.visitedOn).toBe(moved.visitedOn.toISOString().slice(0, 10));
  });

  it('lists my check-ins newest first, with the price', async () => {
    const user = await signup(ctx);
    const [first, second] = await Promise.all([createCafe(ctx), createCafe(ctx)]);
    const older = await post(user.bearer, { cafeId: first.id, ...ratings, pricePaid: 2.2 }).expect(
      201,
    );
    await backdate(older.body.id, 2);
    await post(user.bearer, { cafeId: second.id, ...ratings }).expect(201);

    const res = await ctx
      .http()
      .get('/api/v1/checkins/me?limit=1')
      .set('Authorization', user.bearer)
      .expect(200);
    const page = res.body as Paginated<CheckIn>;
    expect(page).toMatchObject({ total: 2, page: 1, limit: 1 });
    expect(page.items[0]!.cafe.id).toBe(second.id);
    expect(page.items[0]).toHaveProperty('pricePaid', null);
  });

  it('refreshes cached search results after a check-in', async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    const search = async () =>
      (
        (await ctx.http().get('/api/v1/cafes?city=Málaga').expect(200))
          .body as Paginated<CafeSummary>
      ).items[0]!;

    expect((await search()).averageRating).toBe(0); // now cached
    await post(user.bearer, { cafeId: cafe.id, ...ratings }).expect(201);
    expect(await search()).toMatchObject({ averageRating: 4, totalReviews: 1 });
  });

  it("lists a café's visits publicly, without prices", async () => {
    const user = await signup(ctx);
    const cafe = await createCafe(ctx);
    await post(user.bearer, { cafeId: cafe.id, ...ratings, notes: 'Panela', pricePaid: 4 }).expect(
      201,
    );

    const res = await ctx.http().get(`/api/v1/cafes/${cafe.id}/checkins?limit=3`).expect(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, limit: 3 });
    expect(res.body.items[0]).toMatchObject({
      notes: 'Panela',
      overallRating: 4,
      author: { id: user.user.id, name: 'Tester' },
    });
    expect(res.body.items[0]).not.toHaveProperty('pricePaid');
    expect(res.body.items[0]).not.toHaveProperty('cafe');
  });

  it('hides visit lists of unverified cafés', async () => {
    const pending = await createCafe(ctx, { status: 'PENDING' });
    await ctx.http().get(`/api/v1/cafes/${pending.id}/checkins`).expect(404);
  });

  it("lists a user's public check-ins with the café, only for verified cafés", async () => {
    const user = await signup(ctx);
    const [kept, rejected] = await Promise.all([createCafe(ctx), createCafe(ctx)]);
    await post(user.bearer, { cafeId: kept.id, ...ratings, pricePaid: 3 }).expect(201);
    await post(user.bearer, { cafeId: rejected.id, ...ratings }).expect(201);
    await ctx.prisma.cafe.update({ where: { id: rejected.id }, data: { status: 'REJECTED' } });

    const res = await ctx.http().get(`/api/v1/users/${user.user.id}/checkins`).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].cafe).toMatchObject({ id: kept.id, name: kept.name });
    expect(res.body.items[0]).not.toHaveProperty('pricePaid');

    await ctx.http().get('/api/v1/users/6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b/checkins').expect(404);
  });
});
