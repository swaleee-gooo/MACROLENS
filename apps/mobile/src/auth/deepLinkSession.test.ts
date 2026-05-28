import { describe, expect, it } from 'vitest';
import { parseSupabaseAuthCallback } from './deepLinkSession';

describe('parseSupabaseAuthCallback', () => {
  it('extracts Supabase session tokens from OAuth callback fragments', () => {
    const session = parseSupabaseAuthCallback('macrolens://auth-callback#access_token=access&refresh_token=refresh&expires_in=3600');

    expect(session).toMatchObject({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_in: 3600,
    });
  });

  it('returns null for non-auth urls', () => {
    expect(parseSupabaseAuthCallback('macrolens://settings')).toBeNull();
  });
});
