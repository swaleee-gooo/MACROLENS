import { describe, expect, it } from 'vitest';
import { buildResultTrustViewModel } from './resultTrustViewModel';
import type { FoodItem, Meal } from '../domain/types';

function item(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'item-1',
    mealId: 'meal-1',
    name: 'Grilled chicken',
    canonicalFoodName: 'chicken breast cooked',
    estimatedQuantity: 150,
    unit: 'g',
    calories: 248,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    fiberG: 0,
    confidence: 'medium',
    dataSource: 'estimated',
    sourceFoodId: null,
    ...overrides,
  };
}

function meal(overrides: Partial<Meal> = {}): Meal {
  const items = overrides.items ?? [item()];

  return {
    id: 'meal-1',
    userId: 'local-user',
    imageUri: 'file://meal.jpg',
    capturedAt: '2026-05-25T12:00:00.000Z',
    mealName: 'Grilled chicken',
    caloriesEstimate: 248,
    caloriesLow: 211,
    caloriesHigh: 285,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    fiberG: 0,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items,
    ...overrides,
  };
}

describe('buildResultTrustViewModel', () => {
  it('labels photo, product, manual and mock sources clearly', () => {
    expect(buildResultTrustViewModel(meal({ source: 'estimated' })).sourceLabel).toBe('AI analysis');
    expect(buildResultTrustViewModel(meal({ source: 'open_food_facts' })).sourceLabel).toBe('Product database');
    expect(buildResultTrustViewModel(meal({ imageUri: 'manual://custom' })).sourceLabel).toBe('Manual entry');
    expect(buildResultTrustViewModel(meal({ source: 'mock' })).sourceLabel).toBe('Demo mode');
  });

  it('formats detected item rows with quantity, macros, confidence and source', () => {
    const vm = buildResultTrustViewModel(meal());

    expect(vm.items[0]).toMatchObject({
      id: 'item-1',
      quantityLabel: '150 g',
      caloriesLabel: '248 kcal',
      macroLine: '46.5g protein | 0g carbs | 5.4g fat',
      confidenceLabel: 'Medium confidence',
      sourceLabel: 'AI estimate',
    });
  });

  it('formats item p50 estimates with p10/p90 ranges when scene quantiles are available', () => {
    const vm = buildResultTrustViewModel(
      meal({
        items: [
          item({
            estimatedQuantity: 240,
            calories: 680,
            quantityGrams: { p10: 160, p50: 240, p90: 360 },
            calorieQuantiles: { p10: 420, p50: 680, p90: 980 },
          }),
        ],
      }),
    );

    expect(vm.items[0].quantityLabel).toBe('240 g p50 (160-360 g)');
    expect(vm.items[0].caloriesLabel).toBe('680 kcal p50 (420-980 kcal)');
  });

  it('formats macro ranges for the scan result overview', () => {
    const vm = buildResultTrustViewModel(
      meal({
        caloriesLow: 520,
        caloriesHigh: 560,
        proteinG: 41,
        carbsG: 52,
        fatG: 21,
      }),
    );

    expect(vm.calorieRangeLabel).toBe('520-560 kcal');
    expect(vm.primaryCaloriesLabel).toBe('248 kcal');
    expect(vm.macroRanges.protein).toBe('38-44g');
    expect(vm.macroRanges.carbs).toBe('48-56g');
    expect(vm.macroRanges.fat).toBe('18-24g');
  });

  it('uses uncertainty reasons before fallback confidence guidance', () => {
    const uncertain = buildResultTrustViewModel(
      meal({
        confidence: 'low',
        uncertaintyReasons: ['Hidden sauce possible', 'Rice portion uncertain'],
      }),
    );
    const fallback = buildResultTrustViewModel(meal({ confidence: 'low', uncertaintyReasons: [] }));

    expect(uncertain.explanationBullets).toEqual(['Hidden sauce possible', 'Rice portion uncertain']);
    expect(fallback.explanationBullets[0]).toContain('visible portions');
  });

  it('does not present a high-confidence title for ambiguous mixed meals', () => {
    const vm = buildResultTrustViewModel(
      meal({
        confidence: 'high',
        uncertaintyReasons: ['mixed_plate_hidden_oil_or_cheese'],
      }),
    );

    expect(vm.confidenceTitle).toBe('Needs review');
  });

  it('surfaces a single scan review question when the analyzer asks for one', () => {
    const vm = buildResultTrustViewModel(
      meal({
        confidence: 'low',
        scanReview: {
          scanRoute: 'meal',
          visualQuality: 'usable',
          portionAmbiguity: 'high',
          needsUserQuestion: true,
          followUpQuestion: 'Was there rice hidden under the chicken?',
          candidateMeals: [],
        },
      }),
    );

    expect(vm.reviewQuestion).toEqual({
      title: 'Quick review',
      question: 'Was there rice hidden under the chicken?',
    });
  });

  it('surfaces MetaboProof evidence badges and source details', () => {
    const vm = buildResultTrustViewModel(
      meal({
        proof: {
          engine: 'MetaboProof',
          evidenceLevel: 'VERIFIED_BARCODE_WEIGHT',
          status: 'verified',
          warnings: [],
          explanation: ['Barcode source plus consumed weight produced verified nutrition math.'],
          sources: [{ provider: 'OPEN_FOOD_FACTS', externalId: '3017620422003', name: 'Nutella' }],
        },
      }),
    );

    expect(vm.proofBadge).toEqual({ label: 'Verified', tone: 'green' });
    expect(vm.explanationTitle).toBe('Why this result?');
    expect(vm.explanationBullets).toEqual(['Barcode source plus consumed weight produced verified nutrition math.']);
    expect(vm.sourceDetail).toContain('Open Food Facts');
  });

  it('deduplicates repeated source labels (imported recipe with many custom ingredients)', () => {
    const vm = buildResultTrustViewModel(
      meal({
        proof: {
          engine: 'MetaboProof',
          evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
          status: 'estimated',
          warnings: [],
          explanation: ['Estimated from the imported post.'],
          sources: Array.from({ length: 21 }, (_, index) => ({
            provider: 'USER_CUSTOM' as const,
            externalId: `recipe:ingredient-${index + 1}`,
            name: `Ingredient ${index + 1}`,
          })),
        },
      }),
    );

    // "Custom source" must appear exactly once, not 21 times.
    expect(vm.sourceDetail.match(/Custom source/g)).toHaveLength(1);
  });
});
