import { describe, expect, it, vi } from 'vitest';
import { AI_FETCH_TIMEOUT_MS, fetchWithTimeoutAndRetry, VISION_FETCH_TIMEOUT_MS } from './resilientFetch.ts';

describe('fetchWithTimeoutAndRetry', () => {
  it('returns the first response on success and attaches an abort signal', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response('ok', { status: 200 });
    });

    const response = await fetchWithTimeoutAndRetry('https://api.example/test', { method: 'POST' }, { timeoutMs: 30_000, fetchImpl });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries exactly once on a 5xx response', async () => {
    const fetchImpl = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response('upstream down', { status: 503 }))
      .mockResolvedValueOnce(new Response('recovered', { status: 200 }));

    const response = await fetchWithTimeoutAndRetry('https://api.example/test', {}, { timeoutMs: 30_000, fetchImpl });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns the retried 5xx response without a third attempt', async () => {
    const fetchImpl = vi.fn(async () => new Response('still down', { status: 500 }));

    const response = await fetchWithTimeoutAndRetry('https://api.example/test', {}, { timeoutMs: 30_000, fetchImpl });

    expect(response.status).toBe(500);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries exactly once when the fetch rejects (network error or timeout)', async () => {
    const fetchImpl = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValueOnce(new Error('network_error'))
      .mockResolvedValueOnce(new Response('recovered', { status: 200 }));

    const response = await fetchWithTimeoutAndRetry('https://api.example/test', {}, { timeoutMs: 30_000, fetchImpl });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('propagates the failure when both attempts reject', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network_error');
    });

    await expect(fetchWithTimeoutAndRetry('https://api.example/test', {}, { timeoutMs: 30_000, fetchImpl })).rejects.toThrow('network_error');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry a timeout abort so the provider fallback chain stays within ~30s per provider', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('signal timed out', 'TimeoutError');
    });

    await expect(fetchWithTimeoutAndRetry('https://api.example/test', {}, { timeoutMs: 30_000, fetchImpl })).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never retries a 4xx response', async () => {
    const fetchImpl = vi.fn(async () => new Response('bad request', { status: 400 }));

    const response = await fetchWithTimeoutAndRetry('https://api.example/test', {}, { timeoutMs: 30_000, fetchImpl });

    expect(response.status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('pins the spec timeouts: 30s for AI providers, 10s for vision signals', () => {
    expect(AI_FETCH_TIMEOUT_MS).toBe(30_000);
    expect(VISION_FETCH_TIMEOUT_MS).toBe(10_000);
  });
});
