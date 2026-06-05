import type { RecipePlatform } from './recipeSchema';

/**
 * Pure helpers for turning whatever the OS share sheet (or a paste) hands us into
 * a clean, classified recipe URL. Share payloads are messy — TikTok sends text
 * like "Regarde cette vidéo 🤤 https://vm.tiktok.com/ZGabc/ ..." — so we extract
 * the first http(s) URL, trim it, and detect the platform from the host.
 */

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/i;

const PLATFORM_HOST_MATCHERS: Array<{ platform: RecipePlatform; hosts: RegExp }> = [
  { platform: 'tiktok', hosts: /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i },
  { platform: 'instagram', hosts: /(^|\.)instagram\.com$|(^|\.)instagr\.am$/i },
  { platform: 'youtube', hosts: /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/i },
];

/** Extract the first http(s) URL embedded in arbitrary shared text. */
export function extractFirstUrl(input: string): string | null {
  const match = input.match(URL_PATTERN);
  if (!match) {
    return null;
  }

  // Trim trailing punctuation that commonly clings to a pasted/shared URL.
  return match[0].replace(/[.,);!?]+$/, '');
}

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Classify a URL's host into a known platform, defaulting to a generic web page. */
export function detectRecipePlatform(url: string): RecipePlatform {
  const parsed = safeParseUrl(url);
  if (!parsed) {
    return 'web';
  }

  const host = parsed.hostname.toLowerCase();
  for (const matcher of PLATFORM_HOST_MATCHERS) {
    if (matcher.hosts.test(host)) {
      return matcher.platform;
    }
  }

  return 'web';
}

export type NormalizedRecipeUrl = {
  url: string;
  platform: RecipePlatform;
};

/**
 * Normalize a raw share/paste payload into a usable recipe URL + platform, or
 * `null` when no http(s) URL is present. We keep query strings (TikTok/IG need
 * the path + id) but drop whitespace and surrounding noise.
 */
export function normalizeRecipeUrl(input: string): NormalizedRecipeUrl | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const candidate = extractFirstUrl(trimmed) ?? (safeParseUrl(trimmed) ? trimmed : null);
  if (!candidate) {
    return null;
  }

  const parsed = safeParseUrl(candidate);
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    return null;
  }

  return {
    url: parsed.toString(),
    platform: detectRecipePlatform(candidate),
  };
}

const PLATFORM_LABELS: Record<RecipePlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  web: 'Web',
};

export function recipePlatformLabel(platform: RecipePlatform): string {
  return PLATFORM_LABELS[platform];
}
