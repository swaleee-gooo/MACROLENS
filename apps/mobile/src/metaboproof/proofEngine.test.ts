import { describe, expect, it } from 'vitest';
import { analyzeMealEvidence } from './proofEngine';
import type { MealItem, NutritionSource } from './types';

const chicken: NutritionSource = {
  provider: 'USDA_FDC',
  externalId: '171077',
  name: 'Chicken breast cooked',
  kcalPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
};

const nutella: NutritionSource = {
  provider: 'OPEN_FOOD_FACTS',
  externalId: '3017620422003',
  name: 'Nutella',
  kcalPer100g: 539,
  proteinPer100g: 6.3,
  carbsPer100g: 57.5,
  fatPer100g: 30.9,
};

function item(overrides: Partial<MealItem> = {}): MealItem {
  return {
    id: 'item-1',
    label: 'Chicken',
    confidence: 0.72,
    source: chicken,
    evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
    estimatedGrams: 120,
    ...overrides,
  };
}

describe('MetaboProof proof engine', () => {
  it('keeps photo-only analysis estimated and returns a kcal range', () => {
    const analysis = analyzeMealEvidence({
      id: 'meal-1',
      items: [item()],
    });

    expect(analysis.evidenceLevel).toBe('ESTIMATED_VISUAL_ONLY');
    expect(analysis.totalKcal).toBe(198);
    expect(analysis.totalProtein).toBe(37.2);
    expect(analysis.kcalRange).toEqual({ min: 129, max: 267 });
    expect(analysis.warnings).toContain('Photo-only analysis cannot be verified without a measured quantity.');
  });

  it('refuses verified evidence when consumed grams are absent', () => {
    expect(() =>
      analyzeMealEvidence({
        id: 'meal-1',
        items: [item({ evidenceLevel: 'VERIFIED_BARCODE_WEIGHT', grams: undefined, estimatedGrams: undefined })],
      }),
    ).toThrow('verified_requires_grams');
  });

  it('marks barcode plus consumed weight as verified and uses per-100g math', () => {
    const analysis = analyzeMealEvidence({
      id: 'meal-1',
      items: [
        item({
          label: 'Nutella',
          source: nutella,
          grams: 30,
          estimatedGrams: undefined,
          confidence: 1,
          evidenceLevel: 'VERIFIED_BARCODE_WEIGHT',
        }),
      ],
    });

    expect(analysis.evidenceLevel).toBe('VERIFIED_BARCODE_WEIGHT');
    expect(analysis.totalKcal).toBe(162);
    expect(analysis.totalProtein).toBe(1.9);
    expect(analysis.totalCarbs).toBe(17.3);
    expect(analysis.totalFat).toBe(9.3);
    expect(analysis.kcalRange).toBeUndefined();
  });

  it('marks weighed recipe ingredients as verified recipe evidence', () => {
    const analysis = analyzeMealEvidence({
      id: 'recipe-1',
      items: [
        item({ id: 'chicken', grams: 150, estimatedGrams: undefined, evidenceLevel: 'VERIFIED_RECIPE_WEIGHT' }),
        item({
          id: 'nutella',
          label: 'Nutella',
          source: nutella,
          grams: 10,
          estimatedGrams: undefined,
          evidenceLevel: 'VERIFIED_RECIPE_WEIGHT',
        }),
      ],
    });

    expect(analysis.evidenceLevel).toBe('VERIFIED_RECIPE_WEIGHT');
    expect(analysis.totalKcal).toBe(301);
    expect(analysis.explanation[0]).toContain('weighed recipe');
  });
});
