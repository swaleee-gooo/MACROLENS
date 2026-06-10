export const AI_FETCH_TIMEOUT_MS = 30_000;
export const VISION_FETCH_TIMEOUT_MS = 10_000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type ResilientFetchOptions = {
  timeoutMs: number;
  /** Injectable for tests; defaults to the global fetch resolved at call time. */
  fetchImpl?: FetchLike;
};

function isTimeoutAbort(error: unknown): boolean {
  // DOMException does not extend Error in every runtime, so match on the name.
  const name = typeof error === 'object' && error !== null ? (error as { name?: unknown }).name : undefined;
  return name === 'TimeoutError' || name === 'AbortError';
}

/**
 * Outbound fetch with an AbortSignal timeout and exactly one retry on transient
 * failure (fetch rejection from a network error, or a 5xx response). 4xx responses
 * are returned immediately, never retried. A timeout abort propagates without a
 * retry: the provider already hung for the full budget, so retrying would double
 * the latency cap the spec sets for the provider fallback chain (~30s per provider).
 */
export async function fetchWithTimeoutAndRetry(url: string, init: RequestInit, options: ResilientFetchOptions): Promise<Response> {
  const doFetch = () => (options.fetchImpl ?? fetch)(url, { ...init, signal: AbortSignal.timeout(options.timeoutMs) });

  let response: Response;
  try {
    response = await doFetch();
  } catch (error) {
    if (isTimeoutAbort(error)) {
      throw error;
    }
    return doFetch();
  }

  if (response.status >= 500) {
    return doFetch();
  }

  return response;
}
