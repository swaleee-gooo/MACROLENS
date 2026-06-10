import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter, currentUtcWindowStart, secondsUntilNextUtcHour } from './rateLimit.ts';

const emptyEnv = { get: () => undefined };

function envOf(values: Record<string, string>) {
  return { get: (name: string) => values[name] };
}

describe('currentUtcWindowStart', () => {
  it('truncates to the start of the current UTC hour', () => {
    const windowStart = currentUtcWindowStart(new Date('2026-06-10T12:34:56.789Z'));
    expect(windowStart.toISOString()).toBe('2026-06-10T12:00:00.000Z');
  });
});

describe('secondsUntilNextUtcHour', () => {
  it('returns the seconds remaining until the next full UTC hour', () => {
    expect(secondsUntilNextUtcHour(new Date('2026-06-10T12:34:56.789Z'))).toBe(1504);
  });

  it('never returns less than one second at the hour boundary', () => {
    expect(secondsUntilNextUtcHour(new Date('2026-06-10T12:00:00.000Z'))).toBe(3600);
    expect(secondsUntilNextUtcHour(new Date('2026-06-10T12:59:59.900Z'))).toBe(1);
  });
});

describe('createRateLimiter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes the UTC hour window start to the usage incrementer', async () => {
    const incrementUsage = vi.fn(async () => 1);
    const checkRateLimit = createRateLimiter('analyze-meal', emptyEnv, {
      incrementUsage,
      now: () => new Date('2026-06-10T12:34:56.789Z'),
    });

    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: true });
    expect(incrementUsage).toHaveBeenCalledWith('user-1', '2026-06-10T12:00:00.000Z');
  });

  it('allows the request at exactly the default limit and blocks the next one', async () => {
    let count = 0;
    const checkRateLimit = createRateLimiter('analyze-meal', emptyEnv, {
      incrementUsage: async () => ++count,
      now: () => new Date('2026-06-10T12:34:56.789Z'),
    });

    for (let request = 1; request <= 20; request += 1) {
      await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: true });
    }

    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: false, retryAfterSeconds: 1504 });
  });

  it('uses the per-function default limit for extract-recipe', async () => {
    let count = 0;
    const checkRateLimit = createRateLimiter('extract-recipe', emptyEnv, {
      incrementUsage: async () => ++count,
      now: () => new Date('2026-06-10T12:00:00.000Z'),
    });

    for (let request = 1; request <= 10; request += 1) {
      await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: true });
    }

    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: false, retryAfterSeconds: 3600 });
  });

  it('reads the limit override from the env variable', async () => {
    let count = 0;
    const checkRateLimit = createRateLimiter('scan-nutrition-label', envOf({ RATE_LIMIT_LABEL_PER_HOUR: '2' }), {
      incrementUsage: async () => ++count,
      now: () => new Date('2026-06-10T12:00:00.000Z'),
    });

    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: true });
    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: true });
    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: false, retryAfterSeconds: 3600 });
  });

  it('fails open with a logged error when the usage incrementer throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const checkRateLimit = createRateLimiter('analyze-meal', emptyEnv, {
      incrementUsage: async () => {
        throw new Error('postgres_unavailable');
      },
    });

    await expect(checkRateLimit('user-1')).resolves.toEqual({ allowed: true });
    expect(consoleError).toHaveBeenCalledWith('rate_limit_check_failed:analyze-meal', expect.any(Error));
  });

  it('does not share the quota between two different users', async () => {
    const counts = new Map<string, number>();
    const checkRateLimit = createRateLimiter('analyze-meal', envOf({ RATE_LIMIT_ANALYZE_PER_HOUR: '1' }), {
      incrementUsage: async (userId, windowStartIso) => {
        const key = `${userId}|${windowStartIso}`;
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      },
      now: () => new Date('2026-06-10T12:30:00.000Z'),
    });

    await expect(checkRateLimit('user-a')).resolves.toEqual({ allowed: true });
    await expect(checkRateLimit('user-a')).resolves.toEqual({ allowed: false, retryAfterSeconds: 1800 });
    await expect(checkRateLimit('user-b')).resolves.toEqual({ allowed: true });
  });
});
