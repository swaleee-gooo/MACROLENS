import { describe, expect, it } from 'vitest';
import { evaluateBenchmarkCases, generateBenchmarkMarkdown } from './benchmarkEngine';

describe('MetaboProof benchmark engine', () => {
  it('produces MAE, MAPE, mass error, and interval coverage by method', () => {
    const report = evaluateBenchmarkCases([
      {
        id: 'N5K-1',
        groundTruth: { kcal: 500, massGrams: 420 },
        predictions: {
          baselinePhotoOnly: { kcal: 620, massGrams: 500, kcalRange: { min: 430, max: 690 } },
          calibratedUser: { kcal: 540, massGrams: 440, kcalRange: { min: 480, max: 590 } },
          verifiedWeight: { kcal: 500, massGrams: 420, kcalRange: { min: 500, max: 500 } },
        },
      },
      {
        id: 'N5K-2',
        groundTruth: { kcal: 800, massGrams: 610 },
        predictions: {
          baselinePhotoOnly: { kcal: 680, massGrams: 540, kcalRange: { min: 520, max: 760 } },
          calibratedUser: { kcal: 760, massGrams: 590, kcalRange: { min: 700, max: 830 } },
          verifiedWeight: { kcal: 800, massGrams: 610, kcalRange: { min: 800, max: 800 } },
        },
      },
    ]);

    expect(report.metrics.baselinePhotoOnly).toMatchObject({
      maeKcal: 120,
      mapeKcal: 19.5,
      meanMassErrorGrams: 75,
      intervalCoverage: 50,
    });
    expect(report.metrics.calibratedUser.maeKcal).toBe(40);
    expect(report.metrics.verifiedWeight.maeKcal).toBe(0);
  });

  it('generates a markdown report summary', () => {
    const report = evaluateBenchmarkCases([
      {
        id: 'N5K-1',
        groundTruth: { kcal: 500, massGrams: 420 },
        predictions: {
          baselinePhotoOnly: { kcal: 620, massGrams: 500, kcalRange: { min: 430, max: 690 } },
          calibratedUser: { kcal: 540, massGrams: 440, kcalRange: { min: 480, max: 590 } },
          verifiedWeight: { kcal: 500, massGrams: 420, kcalRange: { min: 500, max: 500 } },
        },
      },
    ]);

    expect(generateBenchmarkMarkdown(report)).toContain('| baselinePhotoOnly | 120 | 24 | 80 | 100% |');
  });

  it('reports hidden-risk recall plus provider and evidence-level breakdowns', () => {
    const report = evaluateBenchmarkCases([
      {
        id: 'N5K-1',
        groundTruth: { kcal: 500, massGrams: 420, hiddenRiskTypes: ['sauce', 'hidden_base'] },
        predictions: {
          baselinePhotoOnly: {
            kcal: 520,
            massGrams: 430,
            kcalRange: { min: 470, max: 560 },
            provider: 'openai',
            evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
            hiddenRiskTypes: ['sauce'],
          },
          calibratedUser: {
            kcal: 510,
            massGrams: 425,
            kcalRange: { min: 490, max: 540 },
            provider: 'openai',
            evidenceLevel: 'CALIBRATED_TOTAL_WEIGHT',
            hiddenRiskTypes: ['sauce', 'hidden_base'],
          },
          verifiedWeight: {
            kcal: 500,
            massGrams: 420,
            kcalRange: { min: 500, max: 500 },
            provider: 'manual',
            evidenceLevel: 'VERIFIED_PLATE_WEIGHT',
            hiddenRiskTypes: ['sauce', 'hidden_base'],
          },
        },
      },
    ]);

    expect(report.metrics.baselinePhotoOnly.hiddenRiskRecall).toBe(50);
    expect(report.metrics.calibratedUser.hiddenRiskRecall).toBe(100);
    expect(report.providerBreakdown.openai.maeKcal).toBe(15);
    expect(report.evidenceLevelBreakdown.ESTIMATED_VISUAL_ONLY.intervalCoverage).toBe(100);
    expect(generateBenchmarkMarkdown(report)).toContain('Provider breakdown');
  });
});
