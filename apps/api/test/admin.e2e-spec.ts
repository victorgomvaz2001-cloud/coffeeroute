import { createCafe, createTestApp, resetState, signup, type TestContext } from './helpers';

describe('Admin café verification (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx?.app.close());

  it('forbids non-admins', async () => {
    const user = await signup(ctx);
    const res = await ctx
      .http()
      .get('/api/v1/admin/cafes/pending')
      .set('Authorization', user.bearer)
      .expect(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('verifies a proposed café and makes it searchable immediately', async () => {
    const admin = await signup(ctx, { role: 'ADMIN' });
    const proposer = await signup(ctx);
    const pending = await createCafe(ctx, {
      name: 'Propuesto',
      status: 'PENDING',
      proposedById: proposer.user.id,
    });

    // Warm the search cache before verifying to prove it is invalidated.
    const before = await ctx.http().get('/api/v1/cafes').query({ q: 'propuesto' }).expect(200);
    expect(before.body.total).toBe(0);

    const list = await ctx
      .http()
      .get('/api/v1/admin/cafes/pending')
      .set('Authorization', admin.bearer)
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0]).toMatchObject({
      id: pending.id,
      proposedBy: { email: proposer.email },
    });

    const verified = await ctx
      .http()
      .patch(`/api/v1/admin/cafes/${pending.id}/verify`)
      .set('Authorization', admin.bearer)
      .expect(200);
    expect(verified.body).toMatchObject({ status: 'VERIFIED', rejectionReason: null });
    expect(verified.body.verifiedAt).toEqual(expect.any(String));

    const after = await ctx.http().get('/api/v1/cafes').query({ q: 'propuesto' }).expect(200);
    expect(after.body.total).toBe(1);
  });

  it('requires a reason to reject and removes the café from search', async () => {
    const admin = await signup(ctx, { role: 'ADMIN' });
    const cafe = await createCafe(ctx, { name: 'Dudoso' });

    const missing = await ctx
      .http()
      .patch(`/api/v1/admin/cafes/${cafe.id}/reject`)
      .set('Authorization', admin.bearer)
      .send({})
      .expect(400);
    expect(missing.body.fieldErrors).toHaveProperty('reason');

    const rejected = await ctx
      .http()
      .patch(`/api/v1/admin/cafes/${cafe.id}/reject`)
      .set('Authorization', admin.bearer)
      .send({ reason: 'No sirve café de especialidad' })
      .expect(200);
    expect(rejected.body).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'No sirve café de especialidad',
    });

    const search = await ctx.http().get('/api/v1/cafes').query({ q: 'dudoso' }).expect(200);
    expect(search.body.total).toBe(0);
  });

  it('returns 404 for unknown cafés', async () => {
    const admin = await signup(ctx, { role: 'ADMIN' });
    await ctx
      .http()
      .patch('/api/v1/admin/cafes/00000000-0000-4000-8000-000000000000/verify')
      .set('Authorization', admin.bearer)
      .expect(404);
  });
});
