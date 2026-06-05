import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { ingestNutrition5k } from './ingest-nutrition5k.mjs';

let tempRoots = [];

async function fixtureRoot() {
  const root = await mkdtemp(join(tmpdir(), 'nutrition5k-'));
  tempRoots.push(root);
  await mkdir(join(root, 'metadata'), { recursive: true });
  await mkdir(join(root, 'dish_ids', 'splits'), { recursive: true });
  await mkdir(join(root, 'imagery', 'realsense_overhead', 'dish_0000000001'), { recursive: true });
  await mkdir(join(root, 'imagery', 'realsense_overhead', 'dish_0000000002'), { recursive: true });
  await writeFile(join(root, 'imagery', 'realsense_overhead', 'dish_0000000001', 'rgb.png'), 'not-an-image');
  await writeFile(join(root, 'imagery', 'realsense_overhead', 'dish_0000000002', 'rgb.png'), 'not-an-image');
  await writeFile(join(root, 'dish_ids', 'splits', 'rgb_train_ids.txt'), 'dish_0000000001\n');
  await writeFile(join(root, 'dish_ids', 'splits', 'rgb_test_ids.txt'), 'dish_0000000002\n');
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
  tempRoots = [];
});

describe('ingestNutrition5k', () => {
  it('creates a manifest from a tiny synthetic fixture without copying raw imagery', async () => {
    const root = await fixtureRoot();
    await writeFile(
      join(root, 'metadata', 'dish_metadata_cafe1.csv'),
      [
        'dish_id,total_calories,total_mass,total_fat,total_carb,total_protein,num_ingrs,ingr_1_id,ingr_1_name,ingr_1_grams,ingr_1_calories,ingr_1_fat,ingr_1_carb,ingr_1_protein',
        'dish_0000000001,300,250,10,40,12,1,ingr_0000000001,Rice,250,300,10,40,12',
      ].join('\n'),
    );
    const output = join(root, 'manifest.jsonl');

    const rows = await ingestNutrition5k({ root, output });
    const written = (await readFile(output, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));

    expect(rows).toHaveLength(1);
    expect(written[0]).toMatchObject({
      id: 'dish_0000000001',
      split: 'train',
      groundTruth: { kcal: 300, massGrams: 250, fatG: 10, carbsG: 40, proteinG: 12 },
      ingredientTotals: { kcal: 300, massGrams: 250, fatG: 10, carbsG: 40, proteinG: 12 },
      totalsConsistent: true,
    });
    expect(written[0].imagePaths.overheadRgb).toContain('imagery/realsense_overhead/dish_0000000001/rgb.png');
    expect(written[0].remoteSourcePaths.overheadRgb).toBe('gs://nutrition5k_dataset/nutrition5k_dataset/imagery/realsense_overhead/dish_0000000001/rgb.png');
    expect(written[0].imageCopied).toBe(false);
  });

  it('adds remote image urls when a public base url is provided', async () => {
    const root = await fixtureRoot();
    await writeFile(
      join(root, 'metadata', 'dish_metadata_cafe1.csv'),
      [
        'dish_id,total_calories,total_mass,total_fat,total_carb,total_protein,num_ingrs,ingr_1_id,ingr_1_name,ingr_1_grams,ingr_1_calories,ingr_1_fat,ingr_1_carb,ingr_1_protein',
        'dish_0000000001,300,250,10,40,12,1,ingr_0000000001,Rice,250,300,10,40,12',
      ].join('\n'),
    );

    const rows = await ingestNutrition5k({
      root,
      output: join(root, 'manifest.jsonl'),
      publicBaseUrl: 'https://storage.example/nutrition5k_dataset/',
    });

    expect(rows[0].imageUrls.overheadRgb).toBe('https://storage.example/nutrition5k_dataset/imagery/realsense_overhead/dish_0000000001/rgb.png');
  });

  it('rejects missing metadata columns', async () => {
    const root = await fixtureRoot();
    await writeFile(join(root, 'metadata', 'dish_metadata_cafe1.csv'), 'dish_id,total_calories\n dish_0000000001,300\n');

    await expect(ingestNutrition5k({ root, output: join(root, 'manifest.jsonl') })).rejects.toThrow('nutrition5k_missing_columns_total_mass');
  });

  it('keeps official train and test splits when split files are present', async () => {
    const root = await fixtureRoot();
    await writeFile(
      join(root, 'metadata', 'dish_metadata_cafe1.csv'),
      [
        'dish_id,total_calories,total_mass,total_fat,total_carb,total_protein,num_ingrs,ingr_1_id,ingr_1_name,ingr_1_grams,ingr_1_calories,ingr_1_fat,ingr_1_carb,ingr_1_protein',
        'dish_0000000001,300,250,10,40,12,1,ingr_0000000001,Rice,250,300,10,40,12',
        'dish_0000000002,500,400,20,60,25,1,ingr_0000000002,Pasta,400,500,20,60,25',
      ].join('\n'),
    );

    const rows = await ingestNutrition5k({ root, output: join(root, 'manifest.jsonl') });

    expect(Object.fromEntries(rows.map((row) => [row.id, row.split]))).toEqual({
      dish_0000000001: 'train',
      dish_0000000002: 'test',
    });
  });

  it('checks per-ingredient totals against dish-level totals', async () => {
    const root = await fixtureRoot();
    await writeFile(
      join(root, 'metadata', 'dish_metadata_cafe1.csv'),
      [
        'dish_id,total_calories,total_mass,total_fat,total_carb,total_protein,num_ingrs,ingr_1_id,ingr_1_name,ingr_1_grams,ingr_1_calories,ingr_1_fat,ingr_1_carb,ingr_1_protein',
        'dish_0000000001,300,250,10,40,12,1,ingr_0000000001,Rice,250,200,10,40,12',
      ].join('\n'),
    );

    await expect(ingestNutrition5k({ root, output: join(root, 'manifest.jsonl') })).rejects.toThrow('nutrition5k_dish_total_mismatch_dish_0000000001');
  });
});
