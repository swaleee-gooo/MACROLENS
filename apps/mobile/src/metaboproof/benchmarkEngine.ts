export type BenchmarkMethod = 'baselinePhotoOnly' | 'calibratedUser' | 'verifiedWeight';

export type BenchmarkPrediction = {
  kcal: number;
  massGrams: number;
  kcalRange: {
    min: number;
    max: number;
  };
  provider?: string;
  evidenceLevel?: string;
  hiddenRiskTypes?: string[];
};

export type BenchmarkCase = {
  id: string;
  groundTruth: {
    kcal: number;
    massGrams: number;
    hiddenRiskTypes?: string[];
  };
  predictions: Record<BenchmarkMethod, BenchmarkPrediction>;
};

export type BenchmarkMetrics = {
  maeKcal: number;
  mapeKcal: number;
  meanMassErrorGrams: number;
  intervalCoverage: number;
  hiddenRiskRecall: number;
};

export type BenchmarkReport = {
  caseCount: number;
  metrics: Record<BenchmarkMethod, BenchmarkMetrics>;
  providerBreakdown: Record<string, BenchmarkMetrics>;
  evidenceLevelBreakdown: Record<string, BenchmarkMetrics>;
};

const methods: BenchmarkMethod[] = ['baselinePhotoOnly', 'calibratedUser', 'verifiedWeight'];

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function inInterval(value: number, range: { min: number; max: number }): boolean {
  return value >= range.min && value <= range.max;
}

type BenchmarkSample = {
  groundTruth: BenchmarkCase['groundTruth'];
  prediction: BenchmarkPrediction;
};

function hiddenRiskRecall(samples: BenchmarkSample[]): number {
  const riskSamples = samples.filter((sample) => (sample.groundTruth.hiddenRiskTypes?.length ?? 0) > 0);
  if (riskSamples.length === 0) {
    return 0;
  }

  return roundMetric(
    average(
      riskSamples.map((sample) => {
        const expected = new Set(sample.groundTruth.hiddenRiskTypes ?? []);
        const predicted = new Set(sample.prediction.hiddenRiskTypes ?? []);
        const matched = Array.from(expected).filter((risk) => predicted.has(risk)).length;
        return (matched / expected.size) * 100;
      }),
    ),
  );
}

function metricsFromSamples(samples: BenchmarkSample[]): BenchmarkMetrics {
  const kcalErrors = samples.map((sample) => Math.abs(sample.prediction.kcal - sample.groundTruth.kcal));
  const kcalPercentErrors = samples.map((sample) => (Math.abs(sample.prediction.kcal - sample.groundTruth.kcal) / sample.groundTruth.kcal) * 100);
  const massErrors = samples.map((sample) => Math.abs(sample.prediction.massGrams - sample.groundTruth.massGrams));
  const covered = samples.filter((sample) => inInterval(sample.groundTruth.kcal, sample.prediction.kcalRange)).length;

  return {
    maeKcal: roundMetric(average(kcalErrors)),
    mapeKcal: roundMetric(average(kcalPercentErrors)),
    meanMassErrorGrams: roundMetric(average(massErrors)),
    intervalCoverage: roundMetric(samples.length > 0 ? (covered / samples.length) * 100 : 0),
    hiddenRiskRecall: hiddenRiskRecall(samples),
  };
}

function methodMetrics(cases: BenchmarkCase[], method: BenchmarkMethod): BenchmarkMetrics {
  return metricsFromSamples(cases.map((benchmarkCase) => ({ groundTruth: benchmarkCase.groundTruth, prediction: benchmarkCase.predictions[method] })));
}

function allSamples(cases: BenchmarkCase[]): BenchmarkSample[] {
  return cases.flatMap((benchmarkCase) => methods.map((method) => ({ groundTruth: benchmarkCase.groundTruth, prediction: benchmarkCase.predictions[method] })));
}

function groupedMetrics(cases: BenchmarkCase[], groupKey: (prediction: BenchmarkPrediction) => string | undefined): Record<string, BenchmarkMetrics> {
  const groups = new Map<string, BenchmarkSample[]>();

  for (const sample of allSamples(cases)) {
    const key = groupKey(sample.prediction) ?? 'unknown';
    groups.set(key, [...(groups.get(key) ?? []), sample]);
  }

  return Object.fromEntries(Array.from(groups.entries()).map(([key, samples]) => [key, metricsFromSamples(samples)]));
}

export function evaluateBenchmarkCases(cases: BenchmarkCase[]): BenchmarkReport {
  return {
    caseCount: cases.length,
    metrics: {
      baselinePhotoOnly: methodMetrics(cases, 'baselinePhotoOnly'),
      calibratedUser: methodMetrics(cases, 'calibratedUser'),
      verifiedWeight: methodMetrics(cases, 'verifiedWeight'),
    },
    providerBreakdown: groupedMetrics(cases, (prediction) => prediction.provider),
    evidenceLevelBreakdown: groupedMetrics(cases, (prediction) => prediction.evidenceLevel),
  };
}

function formatMetric(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function generateBenchmarkMarkdown(report: BenchmarkReport): string {
  const rows = methods.map((method) => {
    const metrics = report.metrics[method];
    return `| ${method} | ${formatMetric(metrics.maeKcal)} | ${formatMetric(metrics.mapeKcal)} | ${formatMetric(metrics.meanMassErrorGrams)} | ${formatMetric(metrics.intervalCoverage)}% | ${formatMetric(metrics.hiddenRiskRecall)}% |`;
  });

  const providerRows = Object.entries(report.providerBreakdown).map(
    ([provider, metrics]) => `| ${provider} | ${formatMetric(metrics.maeKcal)} | ${formatMetric(metrics.intervalCoverage)}% | ${formatMetric(metrics.hiddenRiskRecall)}% |`,
  );
  const evidenceRows = Object.entries(report.evidenceLevelBreakdown).map(
    ([evidenceLevel, metrics]) => `| ${evidenceLevel} | ${formatMetric(metrics.maeKcal)} | ${formatMetric(metrics.intervalCoverage)}% | ${formatMetric(metrics.hiddenRiskRecall)}% |`,
  );

  return [
    '# MetaboProof Benchmark',
    '',
    `Cases: ${report.caseCount}`,
    '',
    '| method | MAE kcal | MAPE kcal | mass error g | coverage | hidden risk recall |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...rows,
    '',
    '## Provider breakdown',
    '',
    '| provider | MAE kcal | coverage | hidden risk recall |',
    '| --- | ---: | ---: | ---: |',
    ...providerRows,
    '',
    '## Evidence-level breakdown',
    '',
    '| evidence level | MAE kcal | coverage | hidden risk recall |',
    '| --- | ---: | ---: | ---: |',
    ...evidenceRows,
  ].join('\n');
}
