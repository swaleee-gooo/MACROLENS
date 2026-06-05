import { describe, expect, it } from 'vitest';
import { calculatePersonalPortionFactor, calibrationProgress, createCalibrationSample, calibrateVisualItems } from './calibrationEngine';
import type { MealItem, NutritionSource } from './types';

const rice: NutritionSource = {
  provider: 'USDA_FDC',
  externalId: '169756',
  name: 'White rice cooked',
  kcalPer100g: 130,
  proteinPer100g: 2.7,
  carbsPer100g: 28,
  fatPer100g: 0.3,
};

function sample(index: number, predictedKcal: number, verifiedKcal: number) {
  return createCalibrationSample({
    id: `sample-${index}`,
    userId: 'user-1',
    imageHash: `hash-${index}`,
    foods: ['rice'],
    predictedKcal,
    verifiedKcal,
    predictedGrams: 180,
    verifiedGrams: 210,
    modelId: 'cheap-model',
    createdAt: '2026-06-04T10:00:00.000Z',
  });
}

describe('MetaboProof calibration engine', () => {
  it('tracks the five weighed meals protocol', () => {
    expect(calibrationProgress([sample(1, 300, 330), sample(2, 400, 440)])).toEqual({
      requiredSamples: 5,
      completedSamples: 2,
      remainingSamples: 3,
      ready: false,
    });
  });

  it('learns a personal portion factor from verified residuals', () => {
    const factor = calculatePersonalPortionFactor([
      sample(1, 300, 330),
      sample(2, 400, 440),
      sample(3, 500, 550),
      sample(4, 600, 660),
      sample(5, 700, 770),
    ]);

    expect(factor).toBe(1.1);
  });

  it('produces calibrated predictions without verified evidence', () => {
    const visualItem: MealItem = {
      id: 'rice',
      label: 'Rice',
      estimatedGrams: 180,
      confidence: 0.7,
      source: rice,
      evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
    };

    const calibrated = calibrateVisualItems([visualItem], 1.1);

    expect(calibrated[0].estimatedGrams).toBe(198);
    expect(calibrated[0].evidenceLevel).toBe('CALIBRATED_TOTAL_WEIGHT');
    expect(calibrated[0].grams).toBeUndefined();
  });
});
