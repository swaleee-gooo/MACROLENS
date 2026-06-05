import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function argValue(argv, name) {
  const arg = argv.find((candidate) => candidate.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : null;
}

function readJsonl(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    throw new Error(`file_missing_${resolved}`);
  }

  return readFileSync(resolved, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

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

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name}_must_be_positive_integer`);
  }
}

function wait(delayMs) {
  return new Promise((resolveWait) => {
    setTimeout(resolveWait, delayMs);
  });
}

function imageUrlFor(row) {
  return row.imageUrl ?? row.imageUrls?.overheadRgb ?? null;
}

function massFromMealItems(meal) {
  return Math.round(
    (meal.items ?? [])
      .filter((item) => typeof item.estimatedQuantity === 'number' && /^g(ram|rams)?$/i.test(String(item.unit ?? '')))
      .reduce((sum, item) => sum + item.estimatedQuantity, 0) * 10,
  ) / 10;
}

function predictionFromPayload(payload) {
  const meal = payload?.meal;
  if (!meal) {
    throw new Error('prediction_missing_meal');
  }

  return {
    provider: meal.scene?.modelId ?? 'analyze-meal',
    evidenceLevel: meal.scene?.evidenceLevel ?? 'ESTIMATED_VISUAL_ONLY',
    prediction: {
      kcal: meal.caloriesEstimate,
      massGrams: massFromMealItems(meal),
      kcalRange: {
        min: meal.caloriesLow,
        max: meal.caloriesHigh,
      },
    },
  };
}

async function invokeAnalyzeMeal({ supabaseUrl, supabaseAnonKey, accessToken }, imageUrl) {
  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-meal`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ imageUrl }),
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

async function main() {
  const argv = process.argv.slice(2);
  const manifestPath = argValue(argv, '--manifest');
  const outputPath = argValue(argv, '--output') ?? '../../docs/benchmarks/nutrition5k/predictions-live.jsonl';
  const limitArg = argValue(argv, '--limit');
  const delayArg = argValue(argv, '--delay-ms');

  if (!manifestPath) {
    throw new Error('manifest_arg_missing');
  }

  const limit = limitArg ? Number(limitArg) : null;
  const delayMs = delayArg ? Number(delayArg) : 750;
  if (limit !== null) {
    assertPositiveInteger(limit, 'limit');
  }
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

  const manifestRows = readJsonl(manifestPath).filter((row) => typeof imageUrlFor(row) === 'string');
  const selectedRows = limit === null ? manifestRows : manifestRows.slice(0, limit);
  if (selectedRows.length === 0) {
    throw new Error('nutrition5k_no_rows_with_remote_image_url');
  }

  const outputRows = [];
  for (const row of selectedRows) {
    if (outputRows.length > 0 && delayMs > 0) {
      await wait(delayMs);
    }

    const result = await invokeAnalyzeMeal(
      {
        supabaseUrl,
        supabaseAnonKey,
        accessToken: auth.data.session.access_token,
      },
      imageUrlFor(row),
    );

    if (!result.ok) {
      outputRows.push({ id: row.id, ok: false, error: result });
      continue;
    }

    outputRows.push({ id: row.id, ok: true, ...predictionFromPayload(result.body) });
  }

  const output = `${outputRows.map((row) => JSON.stringify(row)).join('\n')}\n`;
  writeFileSync(resolve(outputPath), output);
  console.log(JSON.stringify({ output: resolve(outputPath), rows: outputRows.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
