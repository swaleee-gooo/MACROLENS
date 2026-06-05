import { normalizeRecipeUrl, type NormalizedRecipeUrl } from './recipeUrl';

/**
 * Turns whatever reaches the app — a `macrolens://import?url=…` deep link, or the
 * raw text/URL handed over by the OS share sheet — into a normalized recipe URL.
 *
 * Two reception paths share this one parser:
 *  1. Deep link (works today): the existing `Linking` listener forwards URLs here.
 *  2. Native share extension (enabled in an EAS build, see README): the share
 *     handler forwards the shared text here verbatim.
 */

const IMPORT_HOSTS = new Set(['import', 'import-recipe']);

function deepLinkTarget(input: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }

  // Only react to our own import deep links — never auth callbacks or others.
  const host = parsed.hostname || parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
  if (!IMPORT_HOSTS.has(host.toLowerCase())) {
    return null;
  }

  return parsed.searchParams.get('url') ?? parsed.searchParams.get('text') ?? null;
}

/** Build the canonical deep link other surfaces (share extension, push) can open. */
export function buildImportDeepLink(url: string, scheme = 'macrolens'): string {
  return `${scheme}://import?url=${encodeURIComponent(url)}`;
}

export function parseSharedRecipeUrl(input: string | null | undefined): NormalizedRecipeUrl | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const target = deepLinkTarget(trimmed);
  if (target !== null) {
    return normalizeRecipeUrl(target);
  }

  // If it parses as our scheme but isn't an import link, it's not for us.
  if (/^macrolens:\/\//i.test(trimmed)) {
    return null;
  }

  return normalizeRecipeUrl(trimmed);
}
