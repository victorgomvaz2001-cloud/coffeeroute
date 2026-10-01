import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  type AuthResponse,
  type AuthTokens,
  type LoginInput,
  type SignupInput,
} from '@coffeeroute/shared';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { Env } from '../config/env';
import { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../types/auth-user';
import { toUserProfile } from '../users/user.mapper';

const BCRYPT_ROUNDS = 12;
// Compared against when the email does not exist so response time doesn't reveal accounts.
const DUMMY_HASH = '$2b$12$x26WiXDZjOSNU646WDFm4ebeDQ20LAOONLXuNl9UrB0AC/Mf69M76';

const invalidCredentials = () =>
  new UnauthorizedException({
    message: 'Email o contraseña incorrectos.',
    code: 'INVALID_CREDENTIALS',
  });
const invalidRefresh = () =>
  new UnauthorizedException({
    message: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
    code: 'REFRESH_INVALID',
  });

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async signup(input: SignupInput): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException({
        message: 'Ya existe una cuenta con ese email.',
        code: 'EMAIL_TAKEN',
      });
    }
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      },
    });
    return { user: toUserProfile(user), tokens: await this.issueTokens(user) };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !valid) throw invalidCredentials();

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    return { user: toUserProfile(updated), tokens: await this.issueTokens(updated) };
  }

  /** Rotates the refresh token. Re-using a revoked token revokes the whole family. */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored) throw invalidRefresh();

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw invalidRefresh();
    }
    if (stored.expiresAt <= new Date()) throw invalidRefresh();

    const [, user] = await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({ where: { id: stored.userId }, data: { lastActiveAt: new Date() } }),
    ]);
    return { user: toUserProfile(user), tokens: await this.issueTokens(user) };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
    };
  }
}
