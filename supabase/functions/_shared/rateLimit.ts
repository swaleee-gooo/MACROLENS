export type RateLimitedFunction = 'analyze-meal' | 'extract-recipe' | 'scan-nutrition-label';

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export type RateLimiter = (userId: string) => Promise<RateLimitResult>;

export type IncrementUsage = (userId: string, windowStartIso: string) => Promise<number>;

type EnvReader = {
  get(name: string): string | undefined;
};

const limitEnvNames: Record<RateLimitedFunction, string> = {
  'analyze-meal': 'RATE_LIMIT_ANALYZE_PER_HOUR',
  'extract-recipe': 'RATE_LIMIT_RECIPE_PER_HOUR',
  'scan-nutrition-label': 'RATE_LIMIT_LABEL_PER_HOUR',
};

const defaultLimits: Record<RateLimitedFunction, number> = {
  'analyze-meal': 20,
  'extract-recipe': 10,
  'scan-nutrition-label': 20,
};

const hourMs = 60 * 60 * 1000;

export function currentUtcWindowStart(now: Date): Date {
  const windowStart = new Date(now.getTime());
  windowStart.setUTCMinutes(0, 0, 0);
  return windowStart;
}

export function secondsUntilNextUtcHour(now: Date): number {
  const nextWindowMs = currentUtcWindowStart(now).getTime() + hourMs;
  return Math.max(1, Math.ceil((nextWindowMs - now.getTime()) / 1000));
}

export function hourlyLimitFor(functionName: RateLimitedFunction, env: EnvReader): number {
  const parsed = Number(env.get(limitEnvNames[functionName]) ?? '');
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultLimits[functionName];
}

/**
 * Real usage incrementer: calls the increment_scan_usage RPC through Supabase REST
 * with the service-role key (both env vars are auto-provided in the Edge runtime).
 */
export function createSupabaseUsageIncrementer(env: EnvReader): IncrementUsage {
  return async (userId, windowStartIso) => {
    const supabaseUrl = env.get('SUPABASE_URL');
    const serviceRoleKey = env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('rate_limit_not_configured');
    }

    const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/increment_scan_usage`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_user_id: userId, p_window: windowStartIso }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error(`increment_scan_usage_failed_${response.status}`);
    }

    const count = await response.json();
    if (typeof count !== 'number' || !Number.isFinite(count)) {
      throw new Error('increment_scan_usage_invalid_response');
    }

    return count;
  };
}

type RateLimiterDeps = {
  incrementUsage?: IncrementUsage;
  now?: () => Date;
};

/**
 * Per-user hourly quota check. FAIL-OPEN: any error in the quota check lets the
 * request through (never break a real user to protect cents) with a console.error.
 */
export function createRateLimiter(functionName: RateLimitedFunction, env: EnvReader, deps: RateLimiterDeps = {}): RateLimiter {
  const incrementUsage = deps.incrementUsage ?? createSupabaseUsageIncrementer(env);
  const now = deps.now ?? (() => new Date());

  return async (userId) => {
    try {
      const at = now();
      const requestCount = await incrementUsage(userId, currentUtcWindowStart(at).toISOString());
      if (requestCount > hourlyLimitFor(functionName, env)) {
        return { allowed: false, retryAfterSeconds: secondsUntilNextUtcHour(at) };
      }
      return { allowed: true };
    } catch (error) {
      console.error(`rate_limit_check_failed:${functionName}`, error);
      return { allowed: true };
    }
  };
}
