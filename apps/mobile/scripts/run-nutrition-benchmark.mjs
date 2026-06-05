import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateBenchmarkCasesForRelease } from './benchmark-case-validation.mjs';
import { scoreNutritionCase, scoreNutritionError, summarizeNutritionBenchmark } from './nutrition-benchmark-core.mjs';

const DEFAULT_CASE_FILE = 'scripts/nutrition-benchmark-cases.json';
const TRANSIENT_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504, 546]);

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`env_file_missing_${path}`);
  }

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );
}

function argValue(argv, name) {
  const arg = argv.find((candidate) => candidate.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : null;
}

function parseArgs(argv) {
  const runArgs = argv.slice(2);
  const delayArg = argValue(runArgs, '--delay-ms');
  const limitArg = argValue(runArgs, '--limit');

  return {
    caseFile: argValue(runArgs, '--case-file') ?? DEFAULT_CASE_FILE,
    resultsFile: argValue(runArgs, '--results-file'),
    releaseGate: runArgs.includes('--release-gate'),
    delayMs: delayArg ? Number(delayArg) : 750,
    limit: limitArg ? Number(limitArg) : null,
    retries: Number(argValue(runArgs, '--retries') ?? '2'),
  };
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name}_must_be_positive_integer`);
  }
}

function loadCases(caseFile) {
  const resolvedPath = resolve(caseFile);
  if (!existsSync(resolvedPath)) {
    throw new Error(`case_file_missing_${resolvedPath}`);
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'));
}

function writeReport(report, resultsFile) {
  const output = JSON.stringify(report, null, 2);
  console.log(output);
  if (resultsFile) {
    writeFileSync(resolve(resultsFile), `${output}\n`);
  }
}

function wait(delayMs) {
  return new Promise((resolveWait) => {
    setTimeout(resolveWait, delayMs);
  });
}

async function invokeAnalyzeMeal({ supabaseUrl, supabaseAnonKey, accessToken }, benchmarkCase) {
  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-meal`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ imageUrl: benchmarkCase.imageUrl }),
  });
  const text = await response.text();
  const body = text.length > 0 ? JSON.parse(text) : null;

  if (!response.ok || body?.error) {
    return {
      ok: false,
      status: response.status,
      code: body?.error ?? `http_${response.status}`,
      message: body?.message ?? response.statusText,
    };
  }

  return { ok: true, body };
}

function isTransientFailure(result) {
  return !result.ok && TRANSIENT_HTTP_STATUSES.has(result.status);
}

async function invokeAnalyzeMealWithRetry(invoker, benchmarkCase, { retries, retryDelayMs }) {
  let lastResult = await invokeAnalyzeMeal(invoker, benchmarkCase);
  for (let attempt = 1; attempt <= retries && isTransientFailure(lastResult); attempt += 1) {
    await wait(retryDelayMs * attempt);
    lastResult = await invokeAnalyzeMeal(invoker, benchmarkCase);
  }

  return lastResult;
}

async function runNutritionBenchmark(invoker, { cases, delayMs, retries }) {
  const scores = [];

  for (const benchmarkCase of cases) {
    if (scores.length > 0 && delayMs > 0) {
      await wait(delayMs);
    }

    const result = await invokeAnalyzeMealWithRetry(invoker, benchmarkCase, { retries, retryDelayMs: Math.max(delayMs, 500) });
    if (!result.ok) {
      scores.push(scoreNutritionError(benchmarkCase, result));
      continue;
    }

    scores.push(scoreNutritionCase(benchmarkCase, result.body));
  }

  return scores;
}

async function main() {
  const { caseFile, resultsFile, releaseGate, delayMs, limit, retries } = parseArgs(process.argv);
  assertPositiveInteger(delayMs, 'delay_ms');
  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error('retries_must_be_non_negative_integer');
  }
  if (limit !== null) {
    assertPositiveInteger(limit, 'limit');
  }

  const cases = loadCases(caseFile);
  const validation = validateBenchmarkCasesForRelease({
    cases,
    minCases: 50,
    requireImageUrls: releaseGate,
    gateName: 'nutrition',
  });

  if (!validation.passed && releaseGate) {
    const report = {
      generatedAt: new Date().toISOString(),
      accuracyClaimAllowed: false,
      releaseFailures: validation.failures,
      note: 'Add stable HTTPS imageUrl values for all 50 benchmark cases before running the release nutrition benchmark.',
    };
    writeReport(report, resultsFile);
    process.exitCode = 2;
    return;
  }

  const runnableCases = cases.filter((benchmarkCase) => typeof benchmarkCase.imageUrl === 'string' && benchmarkCase.imageUrl.startsWith('https://'));
  const selectedCases = (limit === null ? runnableCases : runnableCases.slice(0, limit));
  if (selectedCases.length === 0) {
    throw new Error('nutrition_no_cases_with_https_image_url');
  }

  const env = loadEnvFile(resolve('.env.local'));
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('missing_supabase_env');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
  });

  const auth = await supabase.auth.signInAnonymously();
  if (auth.error || !auth.data.session) {
    throw auth.error ?? new Error('anonymous_auth_failed');
  }

  const scores = await runNutritionBenchmark(
    {
      supabaseUrl,
      supabaseAnonKey,
      accessToken: auth.data.session.access_token,
    },
    {
    cases: selectedCases,
    delayMs,
    retries,
    },
  );
  const summary = summarizeNutritionBenchmark(scores);
  const report = {
    generatedAt: new Date().toISOString(),
    caseFile,
    releaseGate,
    summary,
    results: scores,
  };

  writeReport(report, resultsFile);

  if (releaseGate && !summary.accuracyClaimAllowed) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
