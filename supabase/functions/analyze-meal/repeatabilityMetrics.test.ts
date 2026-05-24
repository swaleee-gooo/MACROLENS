import { describe, expect, it } from 'vitest';
import { evaluateRepeatability } from './repeatabilityMetrics.ts';

describe('evaluateRepeatability', () => {
  it('passes when repeated scans stay inside trust thresholds', () => {
    const report = evaluateRepeatability([
      { caloriesEstimate: 910, proteinG: 39, carbsG: 92, fatG: 34, fiberG: 9 },
      { caloriesEstimate: 942, proteinG: 40.5, carbsG: 95, fatG: 35, fiberG: 8.5 },
      { caloriesEstimate: 895, proteinG: 38.2, carbsG: 91, fatG: 33.8, fiberG: 9.2 },
    ]);

    expect(report.passed).toBe(true);
    expect(report.failedMetrics).toEqual([]);
    expect(report.metrics.proteinG.spread).toBeLessThanOrEqual(3);
  });

  it('fails when protein drift would make the same photo feel untrustworthy', () => {
    const report = evaluateRepeatability([
      { caloriesEstimate: 910, proteinG: 34, carbsG: 92, fatG: 34, fiberG: 9 },
      { caloriesEstimate: 930, proteinG: 44, carbsG: 94, fatG: 35, fiberG: 8.5 },
      { caloriesEstimate: 918, proteinG: 39, carbsG: 91, fatG: 33.8, fiberG: 9.2 },
    ]);

    expect(report.passed).toBe(false);
    expect(report.failedMetrics).toContain('proteinG');
    expect(report.metrics.proteinG.spread).toBe(10);
  });

  it('fails when calories drift beyond the maximum percent spread', () => {
    const report = evaluateRepeatability([
      { caloriesEstimate: 780, proteinG: 39, carbsG: 92, fatG: 34, fiberG: 9 },
      { caloriesEstimate: 910, proteinG: 40, carbsG: 94, fatG: 35, fiberG: 8.5 },
    ]);

    expect(report.passed).toBe(false);
    expect(report.failedMetrics).toContain('caloriesEstimate');
    expect(report.metrics.caloriesEstimate.percentSpread).toBeGreaterThan(8);
  });

  it('fails with insufficient evidence when fewer than two scans are provided', () => {
    const report = evaluateRepeatability([{ caloriesEstimate: 910, proteinG: 39, carbsG: 92, fatG: 34, fiberG: 9 }]);

    expect(report.passed).toBe(false);
    expect(report.failedMetrics).toEqual(['insufficient_runs']);
  });
});
