import { describe, expect, it } from 'vitest';
import { isExpired, readAccessClaims } from './session';

const jwt = (payload: object) =>
  ['header', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'signature'].join('.');

describe('readAccessClaims', () => {
  it('reads sub, role and exp from the payload', () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    expect(readAccessClaims(jwt({ sub: 'u1', role: 'ADMIN', exp }))).toEqual({
      sub: 'u1',
      role: 'ADMIN',
      exp,
    });
  });

  it('rejects missing, malformed or incomplete tokens', () => {
    expect(readAccessClaims(undefined)).toBeNull();
    expect(readAccessClaims('not-a-jwt')).toBeNull();
    expect(readAccessClaims('a.%%%.c')).toBeNull();
    expect(readAccessClaims(jwt({ sub: 'u1' }))).toBeNull();
  });
});

describe('isExpired', () => {
  const now = Math.floor(Date.now() / 1000);

  it('treats tokens about to expire as expired', () => {
    expect(isExpired({ sub: 'u', role: 'ADMIN', exp: now + 5 })).toBe(true);
    expect(isExpired({ sub: 'u', role: 'ADMIN', exp: now + 600 })).toBe(false);
    expect(isExpired(null)).toBe(true);
  });
});
