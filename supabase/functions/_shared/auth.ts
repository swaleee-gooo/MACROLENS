function decodeBase64Url(value: string): string {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

/**
 * Defense in depth on top of the Supabase gateway (verify_jwt = true checks the
 * signature): extracts the user id and rejects tokens whose `exp` is missing or
 * in the past. Supabase access tokens always carry `exp`, so a missing claim is
 * treated as invalid.
 */
export function getUserIdFromAuthorizationHeader(authorization: string | null, nowEpochSeconds = Math.floor(Date.now() / 1000)): string | null {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const [, payload] = match[1].split('.');
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { sub?: unknown; exp?: unknown };
    if (typeof parsed.sub !== 'string' || parsed.sub.length === 0) {
      return null;
    }

    if (typeof parsed.exp !== 'number' || !Number.isFinite(parsed.exp) || parsed.exp <= nowEpochSeconds) {
      return null;
    }

    return parsed.sub;
  } catch {
    return null;
  }
}
