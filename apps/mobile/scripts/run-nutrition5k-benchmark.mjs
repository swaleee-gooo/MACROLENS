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

function roundMetric(value) {
  return Math.round(value * 10) / 10;
}

function average(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function summarize(rows) {
  const successful = rows.filter((row) => row.ok);
  const kcalErrors = successful.map((row) => Math.abs(row.prediction.kcal - row.groundTruth.kcal));
  const massErrors = successful.map((row) => Math.abs(row.prediction.massGrams - row.groundTruth.massGrams));
  const covered = successful.filter((row) => row.groundTruth.kcal >= row.prediction.kcalRange.min && row.groundTruth.kcal <= row.prediction.kcalRange.max).length;

  return {
    caseCount: rows.length,
    successCount: successful.length,
    failureCount: rows.length - successful.length,
    maeKcal: roundMetric(average(kcalErrors)),
    massMaeGrams: roundMetric(average(massErrors)),
    intervalCoverage: roundMetric(successful.length > 0 ? (covered / successful.length) * 100 : 0),
  };
}

function joinPredictions(manifestRows, predictionRows) {
  const predictionsById = new Map(predictionRows.map((row) => [row.id, row]));

  return manifestRows.map((manifestRow) => {
    const prediction = predictionsById.get(manifestRow.id);
    if (!prediction) {
      return {
        id: manifestRow.id,
        ok: false,
        error: 'prediction_missing',
        groundTruth: manifestRow.groundTruth,
      };
    }

    return {
      id: manifestRow.id,
      ok: true,
      split: manifestRow.split,
      provider: prediction.provider ?? 'unknown',
      evidenceLevel: prediction.evidenceLevel ?? 'unknown',
      groundTruth: manifestRow.groundTruth,
      prediction: prediction.prediction,
    };
  });
}

function main() {
  const argv = process.argv.slice(2);
  const manifestPath = argValue(argv, '--manifest');
  const predictionsPath = argValue(argv, '--predictions');
  const outputPath = argValue(argv, '--output');
  const limitArg = argValue(argv, '--limit');

  if (!manifestPath) {
    throw new Error('manifest_arg_missing');
  }

  if (!predictionsPath) {
    throw new Error('predictions_arg_missing');
  }

  const limit = limitArg ? Number(limitArg) : null;
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error('limit_must_be_positive_integer');
  }

  const manifestRows = readJsonl(manifestPath);
  const selectedRows = limit === null ? manifestRows : manifestRows.slice(0, limit);
  const predictionRows = readJsonl(predictionsPath);
  const results = joinPredictions(selectedRows, predictionRows);
  const report = {
    generatedAt: new Date().toISOString(),
    manifestPath,
    predictionsPath,
    summary: summarize(results),
    results,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  console.log(output);

  if (outputPath) {
    writeFileSync(resolve(outputPath), output);
  }
}

main();
