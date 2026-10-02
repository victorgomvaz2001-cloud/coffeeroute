import { type AuthTokens, type UserRole } from '@coffeeroute/shared';

export const ACCESS_COOKIE = 'cr_access';
export const REFRESH_COOKIE = 'cr_refresh';

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export const API_URL = process.env.API_URL ?? 'http://localhost:3000/api/v1';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
}

interface CookieWriter {
  set(name: string, value: string, options: CookieOptions): unknown;
}

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const;

/** Tokens live in httpOnly cookies so client-side scripts can never read them. */
export function writeSessionCookies(store: CookieWriter, tokens: AuthTokens) {
  store.set(ACCESS_COOKIE, tokens.accessToken, { ...baseOptions, maxAge: tokens.expiresIn });
  store.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseOptions, maxAge: REFRESH_MAX_AGE });
}

export interface AccessClaims {
  sub: string;
  role: UserRole;
  exp: number;
}

/**
 * Reads the JWT payload WITHOUT verifying the signature. Only used for routing decisions
 * in the panel; the API verifies every token it receives.
 */
export function readAccessClaims(token: string | undefined): AccessClaims | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Partial<AccessClaims>;
    return json.sub && json.role && typeof json.exp === 'number' ? (json as AccessClaims) : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, malformed or expires within `skewSeconds`. */
export function isExpired(claims: AccessClaims | null, skewSeconds = 15): boolean {
  return !claims || claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
