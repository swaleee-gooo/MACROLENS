import type { MacroLensSession } from '../supabase/client';

function paramsFromCallback(url: string): URLSearchParams | null {
  if (!url.startsWith('macrolens://auth-callback')) {
    return null;
  }

  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const rawParams = fragment || query;

  return rawParams ? new URLSearchParams(rawParams) : null;
}

export function parseSupabaseAuthCallback(url: string): MacroLensSession {
  const params = paramsFromCallback(url);
  if (!params) {
    return null;
  }

  const accessToken = params.get('access_token');
  if (!accessToken) {
    return null;
  }

  const expiresIn = params.get('expires_in');
  const expiresAt = params.get('expires_at');

  return {
    access_token: accessToken,
    refresh_token: params.get('refresh_token') ?? undefined,
    expires_in: expiresIn ? Number(expiresIn) : undefined,
    expires_at: expiresAt ? Number(expiresAt) : undefined,
  };
}
