import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, hashToken } from './auth.service';

const user = {
  id: '6f1c2a3e-0000-4000-8000-000000000001',
  email: 'ana@example.com',
  passwordHash: bcrypt.hashSync('correct-horse', 4),
  role: 'USER' as const,
  name: 'Ana',
  avatarUrl: null,
  bio: null,
  authProvider: 'EMAIL' as const,
  lastActiveAt: new Date(),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date(),
};

function setup() {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('access.jwt') };
  const config = {
    get: jest.fn((key: string) => ({ JWT_REFRESH_TTL_DAYS: 30, JWT_ACCESS_TTL_SECONDS: 900 })[key]),
  };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
    config as unknown as ConfigService<Env, true>,
  );
  return { service, prisma, jwt };
}

describe('AuthService', () => {
  it('rejects signup with an email that already exists', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(
      service.signup({ email: user.email, password: 'whatever123', acceptTerms: true }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('hashes the password and stores only a hash of the refresh token', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve({ ...user, ...data }));

    const result = await service.signup({
      email: 'new@example.com',
      password: 'whatever123',
      acceptTerms: true,
    });

    const created = prisma.user.create.mock.calls[0][0].data;
    expect(created.passwordHash).not.toBe('whatever123');
    expect(await bcrypt.compare('whatever123', created.passwordHash)).toBe(true);

    const stored = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(stored.tokenHash).toBe(hashToken(result.tokens.refreshToken));
    expect(stored.tokenHash).not.toBe(result.tokens.refreshToken);
    expect(result.tokens).toMatchObject({ accessToken: 'access.jwt', expiresIn: 900 });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
    await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toMatchObject({
      response: { code: 'INVALID_CREDENTIALS' },
    });
    await expect(
      service.login({ email: 'nobody@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      response: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('revokes every session when a revoked refresh token is reused', async () => {
    const { service, prisma } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      userId: user.id,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
      user,
    });
    await expect(service.refresh('stolen')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('rotates a valid refresh token', async () => {
    const { service, prisma } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      userId: user.id,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.user.update.mockResolvedValue(user);

    const result = await service.refresh('valid');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result.tokens.refreshToken).not.toBe('valid');
  });
});
