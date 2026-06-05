import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_COLUMNS = ['dish_id', 'total_calories', 'total_mass', 'total_fat', 'total_carb', 'total_protein', 'num_ingrs'];
const INGREDIENT_COLUMNS = ['id', 'name', 'grams', 'calories', 'fat', 'carb', 'protein'];
const DEFAULT_OUTPUT = '../../docs/benchmarks/nutrition5k/manifest.jsonl';
const DEFAULT_REMOTE_ROOT = 'gs://nutrition5k_dataset/nutrition5k_dataset';

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);
}

function numeric(value, field, dishId) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`nutrition5k_invalid_number_${dishId}_${field}`);
  }
  return parsed;
}

function assertRequiredColumns(header) {
  const available = new Set(header);
  for (const column of REQUIRED_COLUMNS) {
    if (!available.has(column)) {
      throw new Error(`nutrition5k_missing_columns_${column}`);
    }
  }
}

function rowObject(header, row) {
  return Object.fromEntries(header.map((column, index) => [column, row[index] ?? '']));
}

function ingredientColumn(index, suffix) {
  return `ingr_${index}_${suffix}`;
}

function parseIngredients(row, dishId) {
  const count = numeric(row.num_ingrs, 'num_ingrs', dishId);
  const ingredients = [];

  for (let index = 1; index <= count; index += 1) {
    for (const suffix of INGREDIENT_COLUMNS) {
      const column = ingredientColumn(index, suffix);
      if (!(column in row)) {
        throw new Error(`nutrition5k_missing_columns_${column}`);
      }
    }

    ingredients.push({
      id: row[ingredientColumn(index, 'id')],
      name: row[ingredientColumn(index, 'name')],
      grams: numeric(row[ingredientColumn(index, 'grams')], ingredientColumn(index, 'grams'), dishId),
      kcal: numeric(row[ingredientColumn(index, 'calories')], ingredientColumn(index, 'calories'), dishId),
      fatG: numeric(row[ingredientColumn(index, 'fat')], ingredientColumn(index, 'fat'), dishId),
      carbsG: numeric(row[ingredientColumn(index, 'carb')], ingredientColumn(index, 'carb'), dishId),
      proteinG: numeric(row[ingredientColumn(index, 'protein')], ingredientColumn(index, 'protein'), dishId),
    });
  }

  return ingredients;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function portablePath(path) {
  return path.replace(/\\/g, '/');
}

function joinUrl(baseUrl, relativePath) {
  return `${baseUrl.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
}

function joinRemotePath(root, relativePath) {
  return `${root.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
}

function imageRelativePaths(dishId) {
  return {
    overheadRgb: portablePath(join('imagery', 'realsense_overhead', dishId, 'rgb.png')),
    overheadDepthRaw: portablePath(join('imagery', 'realsense_overhead', dishId, 'depth_raw.png')),
    sideAnglesDir: portablePath(join('imagery', 'side_angles', dishId)),
  };
}

function ingredientTotals(ingredients) {
  return {
    kcal: roundOne(sum(ingredients.map((ingredient) => ingredient.kcal))),
    massGrams: roundOne(sum(ingredients.map((ingredient) => ingredient.grams))),
    fatG: roundOne(sum(ingredients.map((ingredient) => ingredient.fatG))),
    carbsG: roundOne(sum(ingredients.map((ingredient) => ingredient.carbsG))),
    proteinG: roundOne(sum(ingredients.map((ingredient) => ingredient.proteinG))),
  };
}

function assertTotalsConsistent(dishId, groundTruth, totals) {
  const checks = [
    ['kcal', groundTruth.kcal, totals.kcal],
    ['massGrams', groundTruth.massGrams, totals.massGrams],
    ['fatG', groundTruth.fatG, totals.fatG],
    ['carbsG', groundTruth.carbsG, totals.carbsG],
    ['proteinG', groundTruth.proteinG, totals.proteinG],
  ];

  if (checks.some(([, expected, actual]) => Math.abs(expected - actual) > 1)) {
    throw new Error(`nutrition5k_dish_total_mismatch_${dishId}`);
  }
}

async function readIdFile(path) {
  if (!existsSync(path)) {
    return [];
  }

  return (await readFile(path, 'utf8'))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function loadSplits(root) {
  const splitsDir = join(root, 'dish_ids', 'splits');
  const trainIds = new Set(await readIdFile(join(splitsDir, 'rgb_train_ids.txt')));
  const testIds = new Set(await readIdFile(join(splitsDir, 'rgb_test_ids.txt')));

  return (dishId) => {
    if (trainIds.has(dishId)) {
      return 'train';
    }

    if (testIds.has(dishId)) {
      return 'test';
    }

    return 'unknown';
  };
}

async function readMetadataRows(root) {
  const metadataFiles = ['dish_metadata_cafe1.csv', 'dish_metadata_cafe2.csv']
    .map((file) => join(root, 'metadata', file))
    .filter((path) => existsSync(path));

  if (metadataFiles.length === 0) {
    throw new Error('nutrition5k_metadata_missing');
  }

  const rows = [];
  for (const file of metadataFiles) {
    const parsed = parseCsv(await readFile(file, 'utf8'));
    if (parsed.length === 0) {
      continue;
    }

    const [header, ...records] = parsed;
    assertRequiredColumns(header);
    rows.push(...records.map((record) => rowObject(header, record)));
  }

  return rows;
}

function manifestRow(root, row, splitForDish, { publicBaseUrl = null, remoteRoot = DEFAULT_REMOTE_ROOT } = {}) {
  const dishId = row.dish_id;
  const ingredients = parseIngredients(row, dishId);
  const relativePaths = imageRelativePaths(dishId);
  const groundTruth = {
    kcal: numeric(row.total_calories, 'total_calories', dishId),
    massGrams: numeric(row.total_mass, 'total_mass', dishId),
    fatG: numeric(row.total_fat, 'total_fat', dishId),
    carbsG: numeric(row.total_carb, 'total_carb', dishId),
    proteinG: numeric(row.total_protein, 'total_protein', dishId),
  };
  const totals = ingredientTotals(ingredients);
  assertTotalsConsistent(dishId, groundTruth, totals);

  return {
    id: dishId,
    source: 'nutrition5k',
    split: splitForDish(dishId),
    groundTruth,
    ingredientTotals: totals,
    totalsConsistent: true,
    ingredients,
    imagePaths: {
      overheadRgb: portablePath(join(root, relativePaths.overheadRgb)),
      overheadDepthRaw: portablePath(join(root, relativePaths.overheadDepthRaw)),
      sideAnglesDir: portablePath(join(root, relativePaths.sideAnglesDir)),
    },
    imageUrls: publicBaseUrl
      ? {
          overheadRgb: joinUrl(publicBaseUrl, relativePaths.overheadRgb),
          overheadDepthRaw: joinUrl(publicBaseUrl, relativePaths.overheadDepthRaw),
          sideAnglesDir: joinUrl(publicBaseUrl, relativePaths.sideAnglesDir),
        }
      : null,
    remoteSourcePaths: {
      overheadRgb: joinRemotePath(remoteRoot, relativePaths.overheadRgb),
      overheadDepthRaw: joinRemotePath(remoteRoot, relativePaths.overheadDepthRaw),
      sideAnglesDir: joinRemotePath(remoteRoot, relativePaths.sideAnglesDir),
    },
    imageCopied: false,
  };
}

export async function ingestNutrition5k({ root, output = DEFAULT_OUTPUT, publicBaseUrl = null, remoteRoot = DEFAULT_REMOTE_ROOT }) {
  const resolvedRoot = resolve(root);
  if (!existsSync(resolvedRoot)) {
    throw new Error(`nutrition5k_root_missing_${resolvedRoot}`);
  }

  const splitForDish = await loadSplits(resolvedRoot);
  const rows = (await readMetadataRows(resolvedRoot)).map((row) => manifestRow(resolvedRoot, row, splitForDish, { publicBaseUrl, remoteRoot }));
  const resolvedOutput = resolve(output);
  await mkdir(dirname(resolvedOutput), { recursive: true });
  await writeFile(resolvedOutput, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  return rows;
}

function argValue(argv, name) {
  const arg = argv.find((candidate) => candidate.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : null;
}

async function main() {
  const root = argValue(process.argv.slice(2), '--root') ?? process.env.NUTRITION5K_ROOT;
  if (!root) {
    throw new Error('nutrition5k_root_env_missing');
  }

  const output = argValue(process.argv.slice(2), '--output') ?? DEFAULT_OUTPUT;
  const publicBaseUrl = argValue(process.argv.slice(2), '--public-base-url') ?? process.env.NUTRITION5K_PUBLIC_BASE_URL ?? null;
  const remoteRoot = argValue(process.argv.slice(2), '--remote-root') ?? process.env.NUTRITION5K_REMOTE_ROOT ?? DEFAULT_REMOTE_ROOT;
  const rows = await ingestNutrition5k({ root, output, publicBaseUrl, remoteRoot });
  console.log(JSON.stringify({ output: resolve(output), rows: rows.length }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
