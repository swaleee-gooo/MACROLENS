import { describe, expect, it } from 'vitest';
import { applyMealItemCorrection, createCorrectionRepository, summarizeCorrectionRecords } from './correctionLoop';
import { analyzeMealEvidence } from './proofEngine';
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

const item: MealItem = {
  id: 'rice',
  label: 'Rice',
  estimatedGrams: 180,
  confidence: 0.72,
  source: rice,
  evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
};

describe('MetaboProof correction loop', () => {
  it('changes a meal result when the user corrects consumed grams', () => {
    const analysis = analyzeMealEvidence({ id: 'meal-1', items: [item] });
    const corrected = applyMealItemCorrection(analysis, {
      itemId: 'rice',
      grams: 240,
      evidenceLevel: 'VERIFIED_PLATE_WEIGHT',
    });

    expect(corrected.totalKcal).toBe(312);
    expect(corrected.evidenceLevel).toBe('VERIFIED_PLATE_WEIGHT');
  });

  it('persists corrections and reports correction rates by food and model', async () => {
    const repository = createCorrectionRepository();

    await repository.saveCorrection({
      id: 'correction-1',
      userId: 'user-1',
      mealId: 'meal-1',
      itemId: 'rice',
      foodLabel: 'Rice',
      modelId: 'cheap-model',
      field: 'grams',
      previousValue: 180,
      nextValue: 240,
      createdAt: '2026-06-04T10:00:00.000Z',
    });

    const records = await repository.listCorrections('user-1');
    expect(records).toHaveLength(1);
    expect(summarizeCorrectionRecords(records, { totalMealsByFood: { Rice: 4 }, totalScansByModel: { 'cheap-model': 10 } })).toEqual({
      correctionRateByFood: { Rice: 25 },
      correctionRateByModel: { 'cheap-model': 10 },
    });
  });
});
