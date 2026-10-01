import { createTestApp, resetState, signup, type TestContext } from './helpers';

describe('Auth & users (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx?.app.close());

  it('GET /health reports database and redis', async () => {
    const res = await ctx.http().get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up', redis: 'up' });
  });

  it('signs up, reads the profile and normalises the email', async () => {
    const user = await signup(ctx, { email: 'Ana@Example.COM' });
    expect(user.user).toMatchObject({ email: 'ana@example.com', role: 'USER' });

    const me = await ctx
      .http()
      .get('/api/v1/users/me')
      .set('Authorization', user.bearer)
      .expect(200);
    expect(me.body).toMatchObject({
      email: 'ana@example.com',
      stats: { checkIns: 0, cafesVisited: 0, citiesVisited: 0, routesCreated: 0 },
    });
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('requires accepting the terms and returns field errors', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.fieldErrors)).toEqual(
      expect.arrayContaining(['email', 'password', 'acceptTerms']),
    );
  });

  it('rejects duplicate emails', async () => {
    await signup(ctx, { email: 'dup@example.com' });
    const res = await ctx
      .http()
      .post('/api/v1/auth/signup')
      .send({ email: 'dup@example.com', password: 'supersecret1', acceptTerms: true })
      .expect(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('logs in and rejects wrong credentials', async () => {
    const user = await signup(ctx);
    await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    const res = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const user = await signup(ctx);
    const first = user.tokens.refreshToken;

    const rotated = await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(200);
    const second = rotated.body.tokens.refreshToken as string;
    expect(second).not.toBe(first);

    // Reusing the old token revokes the whole family, including the new one.
    await ctx.http().post('/api/v1/auth/refresh').send({ refreshToken: first }).expect(401);
    await ctx.http().post('/api/v1/auth/refresh').send({ refreshToken: second }).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const user = await signup(ctx);
    await ctx
      .http()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: user.tokens.refreshToken })
      .expect(204);
    await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: user.tokens.refreshToken })
      .expect(401);
  });

  it('protects private routes', async () => {
    const missing = await ctx.http().get('/api/v1/users/me').expect(401);
    expect(missing.body.code).toBe('UNAUTHENTICATED');
    const invalid = await ctx
      .http()
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer nope')
      .expect(401);
    expect(invalid.body.code).toBe('TOKEN_INVALID');
  });

  it('updates the profile and exposes a public profile without email', async () => {
    const user = await signup(ctx);
    await ctx
      .http()
      .patch('/api/v1/users/me')
      .set('Authorization', user.bearer)
      .send({ name: 'Ana Barista', bio: 'V60 lover' })
      .expect(200);
    const pub = await ctx.http().get(`/api/v1/users/${user.user.id}`).expect(200);
    expect(pub.body).toMatchObject({ name: 'Ana Barista', bio: 'V60 lover' });
    expect(pub.body).not.toHaveProperty('email');
  });

  it('deletes the account and its sessions (GDPR)', async () => {
    const user = await signup(ctx);
    await ctx.http().delete('/api/v1/users/me').set('Authorization', user.bearer).expect(204);
    await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(401);
    await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: user.tokens.refreshToken })
      .expect(401);
  });
});
