export type MacroSnapshot = {
  caloriesEstimate: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type MacroMetric = keyof MacroSnapshot;

export type RepeatabilityThresholds = {
  caloriesPercentMax: number;
  proteinGMax: number;
  carbsGMax: number;
  fatGMax: number;
  fiberGMax: number;
};

type MetricStats = {
  min: number;
  max: number;
  spread: number;
  percentSpread: number;
};

export type RepeatabilityReport = {
  passed: boolean;
  runCount: number;
  failedMetrics: Array<MacroMetric | 'insufficient_runs'>;
  metrics: Record<MacroMetric, MetricStats>;
};

export const DEFAULT_REPEATABILITY_THRESHOLDS: RepeatabilityThresholds = {
  caloriesPercentMax: 8,
  proteinGMax: 3,
  carbsGMax: 8,
  fatGMax: 6,
  fiberGMax: 4,
};

const macroMetrics: MacroMetric[] = ['caloriesEstimate', 'proteinG', 'carbsG', 'fatG', 'fiberG'];

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

function statsFor(values: number[]): MetricStats {
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

export function evaluateRepeatability(
  runs: MacroSnapshot[],
  thresholds: RepeatabilityThresholds = DEFAULT_REPEATABILITY_THRESHOLDS,
): RepeatabilityReport {
  const metrics = Object.fromEntries(
    macroMetrics.map((metric) => [metric, statsFor(runs.map((run) => run[metric]))]),
  ) as Record<MacroMetric, MetricStats>;

  if (runs.length < 2) {
    return {
      passed: false,
      runCount: runs.length,
      failedMetrics: ['insufficient_runs'],
      metrics,
    };
  }

  const failedMetrics: RepeatabilityReport['failedMetrics'] = [];

  if (metrics.caloriesEstimate.percentSpread > thresholds.caloriesPercentMax) {
    failedMetrics.push('caloriesEstimate');
  }
  if (metrics.proteinG.spread > thresholds.proteinGMax) {
    failedMetrics.push('proteinG');
  }
  if (metrics.carbsG.spread > thresholds.carbsGMax) {
    failedMetrics.push('carbsG');
  }
  if (metrics.fatG.spread > thresholds.fatGMax) {
    failedMetrics.push('fatG');
  }
  if (metrics.fiberG.spread > thresholds.fiberGMax) {
    failedMetrics.push('fiberG');
  }

  return {
    passed: failedMetrics.length === 0,
    runCount: runs.length,
    failedMetrics,
    metrics,
  };
}
