import { type AuthResponse } from '@coffeeroute/shared';
import { type NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  API_URL,
  isExpired,
  readAccessClaims,
  REFRESH_COOKIE,
  writeSessionCookies,
} from './lib/session';

function toLogin(request: NextRequest, reason?: 'expired' | 'forbidden') {
  const url = new URL('/login', request.url);
  if (reason) url.searchParams.set(reason, '1');
  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

async function refresh(refreshToken: string): Promise<AuthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as AuthResponse) : null;
  } catch {
    return null;
  }
}

/**
 * Guards the panel: only curators (ADMIN) get in, and access tokens are refreshed
 * here — before rendering — because Server Components cannot write cookies.
 */
export async function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === '/login';
  const claims = readAccessClaims(request.cookies.get(ACCESS_COOKIE)?.value);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!isExpired(claims)) {
    if (claims?.role !== 'ADMIN') return isLogin ? NextResponse.next() : toLogin(request, 'forbidden');
    return isLogin ? NextResponse.redirect(new URL('/cafes/pending', request.url)) : NextResponse.next();
  }

  if (!refreshToken) return isLogin ? NextResponse.next() : toLogin(request);

  const session = await refresh(refreshToken);
  if (!session) return isLogin ? NextResponse.next() : toLogin(request, 'expired');
  if (session.user.role !== 'ADMIN') return toLogin(request, 'forbidden');

  // Make the new tokens visible to this request's Server Components and to the browser.
  request.cookies.set(ACCESS_COOKIE, session.tokens.accessToken);
  request.cookies.set(REFRESH_COOKIE, session.tokens.refreshToken);
  const response = isLogin
    ? NextResponse.redirect(new URL('/cafes/pending', request.url))
    : NextResponse.next({ request: { headers: request.headers } });
  writeSessionCookies(response.cookies, session.tokens);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
