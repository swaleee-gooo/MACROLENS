import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/1/13/Salmon_Poke.jpg';
const REPEATABILITY_THRESHOLDS = {
  caloriesPercentMax: 8,
  proteinGMax: 3,
  carbsGMax: 8,
  fatGMax: 6,
  fiberGMax: 4,
};
const MACRO_METRICS = ['caloriesEstimate', 'proteinG', 'carbsG', 'fatG', 'fiberG'];

function loadEnvFile(path) {
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

function parseArgs(argv) {
  const imageUrl = argv[2] && !argv[2].startsWith('--') ? argv[2] : DEFAULT_IMAGE_URL;
  const runCountArg = argv.find((arg) => arg.startsWith('--runs='));
  const delayArg = argv.find((arg) => arg.startsWith('--delay-ms='));

  return {
    imageUrl,
    runCount: runCountArg ? Number(runCountArg.replace('--runs=', '')) : 5,
    delayMs: delayArg ? Number(delayArg.replace('--delay-ms=', '')) : 750,
  };
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name}_must_be_positive_integer`);
  }
}

function createSummary(result) {
  return {
    imageUrl: result.imageUrl,
    passed: result.report.passed,
    failedMetrics: result.report.failedMetrics,
    metrics: result.report.metrics,
    runs: result.runs.map((run) => ({
      index: run.index,
      mealName: run.mealName,
      confidence: run.confidence,
      source: run.source,
      ...run.macros,
    })),
  };
}

function roundMetric(value) {
  return Math.round(value * 10) / 10;
}

function statsFor(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    min: roundMetric(min),
    max: roundMetric(max),
    spread: roundMetric(spread),
    percentSpread: average > 0 ? roundMetric((spread / average) * 100) : 0,
  };
}

function evaluateRepeatability(runs) {
  const metrics = Object.fromEntries(
    MACRO_METRICS.map((metric) => [metric, statsFor(runs.map((run) => run[metric]))]),
  );

  if (runs.length < 2) {
    return {
      passed: false,
      runCount: runs.length,
      failedMetrics: ['insufficient_runs'],
      metrics,
    };
  }

  const failedMetrics = [];
  if (metrics.caloriesEstimate.percentSpread > REPEATABILITY_THRESHOLDS.caloriesPercentMax) {
    failedMetrics.push('caloriesEstimate');
  }
  if (metrics.proteinG.spread > REPEATABILITY_THRESHOLDS.proteinGMax) {
    failedMetrics.push('proteinG');
  }
  if (metrics.carbsG.spread > REPEATABILITY_THRESHOLDS.carbsGMax) {
    failedMetrics.push('carbsG');
  }
  if (metrics.fatG.spread > REPEATABILITY_THRESHOLDS.fatGMax) {
    failedMetrics.push('fatG');
  }
  if (metrics.fiberG.spread > REPEATABILITY_THRESHOLDS.fiberGMax) {
    failedMetrics.push('fiberG');
  }

  return {
    passed: failedMetrics.length === 0,
    runCount: runs.length,
    failedMetrics,
    metrics,
  };
}

function numberField(value, fieldName) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`repeatability_missing_${fieldName}`);
  }

  return value;
}

function stringField(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function parseRun(index, payload) {
  const meal = payload?.meal;
  if (!meal) {
    throw new Error(`repeatability_missing_meal_${index}`);
  }

  return {
    index,
    mealName: stringField(meal.mealName, 'Repas analyse'),
    confidence: stringField(meal.confidence, 'unknown'),
    source: stringField(meal.source, 'unknown'),
    macros: {
      caloriesEstimate: numberField(meal.caloriesEstimate, 'caloriesEstimate'),
      proteinG: numberField(meal.proteinG, 'proteinG'),
      carbsG: numberField(meal.carbsG, 'carbsG'),
      fatG: numberField(meal.fatG, 'fatG'),
      fiberG: numberField(meal.fiberG, 'fiberG'),
    },
  };
}

function wait(delayMs) {
  return new Promise((resolveWait) => {
    setTimeout(resolveWait, delayMs);
  });
}

async function runRepeatabilityBenchmark(functions, { imageUrl, runCount, delayMs }) {
  const runs = [];

  for (let index = 1; index <= runCount; index += 1) {
    if (index > 1 && delayMs > 0) {
      await wait(delayMs);
    }

    const result = await functions.invoke('analyze-meal', {
      body: { imageUrl },
    });

    if (result.error) {
      throw new Error(`repeatability_invoke_failed_${index}`);
    }

    runs.push(parseRun(index, result.data));
  }

  return {
    imageUrl,
    runs,
    report: evaluateRepeatability(runs.map((run) => run.macros)),
  };
}

async function main() {
  const { imageUrl, runCount, delayMs } = parseArgs(process.argv);
  assertPositiveInteger(runCount, 'runs');
  assertPositiveInteger(delayMs, 'delay_ms');

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

  const result = await runRepeatabilityBenchmark(supabase.functions, {
    imageUrl,
    runCount,
    delayMs,
  });

  console.log(JSON.stringify(createSummary(result), null, 2));

  if (!result.report.passed) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
