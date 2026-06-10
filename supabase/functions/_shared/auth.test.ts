import { describe, expect, it } from 'vitest';
import { getUserIdFromAuthorizationHeader } from './auth.ts';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${encodedPayload}.signature`;
}

const nowEpochSeconds = 1_780_000_000;

describe('getUserIdFromAuthorizationHeader', () => {
  it('returns the sub for a token whose exp is in the future', () => {
    const token = fakeJwt({ sub: 'user-1', exp: nowEpochSeconds + 3600 });
    expect(getUserIdFromAuthorizationHeader(`Bearer ${token}`, nowEpochSeconds)).toBe('user-1');
  });

  it('rejects an expired token', () => {
    const token = fakeJwt({ sub: 'user-1', exp: nowEpochSeconds - 1 });
    expect(getUserIdFromAuthorizationHeader(`Bearer ${token}`, nowEpochSeconds)).toBeNull();
  });

  it('rejects a token expiring exactly now', () => {
    const token = fakeJwt({ sub: 'user-1', exp: nowEpochSeconds });
    expect(getUserIdFromAuthorizationHeader(`Bearer ${token}`, nowEpochSeconds)).toBeNull();
  });

  it('rejects a token without an exp claim', () => {
    const token = fakeJwt({ sub: 'user-1' });
    expect(getUserIdFromAuthorizationHeader(`Bearer ${token}`, nowEpochSeconds)).toBeNull();
  });

  it('rejects a token with a non-numeric exp claim', () => {
    const token = fakeJwt({ sub: 'user-1', exp: 'tomorrow' });
    expect(getUserIdFromAuthorizationHeader(`Bearer ${token}`, nowEpochSeconds)).toBeNull();
  });

  it('rejects a token without a sub claim', () => {
    const token = fakeJwt({ exp: nowEpochSeconds + 3600 });
    expect(getUserIdFromAuthorizationHeader(`Bearer ${token}`, nowEpochSeconds)).toBeNull();
  });

  it('rejects a missing or malformed authorization header', () => {
    expect(getUserIdFromAuthorizationHeader(null, nowEpochSeconds)).toBeNull();
    expect(getUserIdFromAuthorizationHeader('Basic abc', nowEpochSeconds)).toBeNull();
    expect(getUserIdFromAuthorizationHeader('Bearer not-a-jwt', nowEpochSeconds)).toBeNull();
  });
});
