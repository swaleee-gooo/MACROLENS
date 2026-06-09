import { detectRecipePlatform } from './recipeUrl';

/**
 * Best-effort fetch of the *source post's* thumbnail (the dish photo) so the
 * recipe-import loading screen can scan the real meal instead of a placeholder.
 *
 * Runs in parallel with the AI extraction and is purely cosmetic: any failure
 * (network, rate-limit, unsupported platform) resolves to `null` and the loader
 * falls back to the brand mark. YouTube resolves with zero network (deterministic
 * thumbnail URL); TikTok uses the public oEmbed endpoint (no CORS in RN).
 */

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isValidYoutubeId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
}

function youtubeVideoId(url: string): string | null {
  const parsed = safeParseUrl(url);
  if (!parsed) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (/(^|\.)youtu\.be$/.test(host)) {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return isValidYoutubeId(id) ? id : null;
  }

  if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
    const queryId = parsed.searchParams.get('v');
    if (isValidYoutubeId(queryId)) {
      return queryId;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(segments[0]) && isValidYoutubeId(segments[1])) {
      return segments[1];
    }
  }

  return null;
}

/** Deterministic YouTube thumbnail (no network call needed). */
export function youtubeThumbnailUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** A short TikTok link (vm./vt.) needs a redirect hop before oEmbed accepts it. */
export function isTikTokShortLink(url: string): boolean {
  const parsed = safeParseUrl(url);
  if (!parsed) {
    return false;
  }

  return /(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i.test(parsed.hostname.toLowerCase());
}

/** Pull a usable https thumbnail out of an oEmbed JSON payload. */
export function pickOEmbedThumbnail(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const value = (payload as Record<string, unknown>).thumbnail_url;
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
}

export async function fetchRecipeThumbnailUrl(url: string, options: { timeoutMs?: number } = {}): Promise<string | null> {
  const timeoutMs = options.timeoutMs ?? 4500;

  const directYoutube = youtubeThumbnailUrl(url);
  if (directYoutube) {
    return directYoutube;
  }

  if (detectRecipePlatform(url) !== 'tiktok') {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let canonical = url;
    if (isTikTokShortLink(url)) {
      const resolved = await fetch(url, { redirect: 'follow', signal: controller.signal });
      if (resolved.url) {
        canonical = resolved.url;
      }
    }

    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonical)}`, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }

    return pickOEmbedThumbnail(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
