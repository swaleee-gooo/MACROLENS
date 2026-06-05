import { describe, expect, it } from 'vitest';
import type { Meal } from '../domain/types';
import type { PortionCalibrationRecord } from '../storage/metaboProofRepository';
import type { CorrectionRecord } from './correctionLoop';
import { buildPersonalFoodGraph } from './personalFoodGraph';

function meal(params: {
  id: string;
  mealName: string;
  itemId: string;
  itemName: string;
  canonicalFoodName: string;
  grams: number;
  capturedAt: string;
}): Meal {
  return {
    id: params.id,
    userId: 'user-1',
    imageUri: `file://${params.id}.jpg`,
    capturedAt: params.capturedAt,
    mealName: params.mealName,
    caloriesEstimate: Math.round(params.grams * 1.3),
    caloriesLow: Math.round(params.grams),
    caloriesHigh: Math.round(params.grams * 1.6),
    proteinG: 20,
    carbsG: 45,
    fatG: 12,
    fiberG: 4,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [
      {
        id: params.itemId,
        mealId: params.id,
        name: params.itemName,
        canonicalFoodName: params.canonicalFoodName,
        estimatedQuantity: params.grams,
        quantityGrams: { p10: params.grams - 20, p50: params.grams, p90: params.grams + 20 },
        unit: 'g',
        calories: Math.round(params.grams * 1.3),
        proteinG: 4,
        carbsG: 28,
        fatG: 1,
        fiberG: 1,
        confidence: 'medium',
        dataSource: 'estimated',
        sourceFoodId: null,
      },
    ],
  };
}

function calibration(id: string, verifiedGrams: number): PortionCalibrationRecord {
  return {
    id,
    userId: 'user-1',
    foodLabel: 'Rice',
    containerKey: 'blue-bowl',
    estimatedGrams: 200,
    verifiedGrams,
    residualGrams: verifiedGrams - 200,
    source: 'manual_verified_weight',
    createdAt: `2026-06-04T10:0${id.slice(-1)}:00.000Z`,
  };
}

describe('buildPersonalFoodGraph', () => {
  it('learns a habitual bowl median after three confirmed records', () => {
    const graph = buildPersonalFoodGraph({
      userId: 'user-1',
      meals: [
        meal({ id: 'meal-1', mealName: 'Rice bowl', itemId: 'rice-1', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 230, capturedAt: '2026-06-01T12:00:00.000Z' }),
        meal({ id: 'meal-2', mealName: 'Rice bowl', itemId: 'rice-2', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 240, capturedAt: '2026-06-02T12:00:00.000Z' }),
        meal({ id: 'meal-3', mealName: 'Rice bowl', itemId: 'rice-3', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 250, capturedAt: '2026-06-03T12:00:00.000Z' }),
      ],
      corrections: [],
      calibrations: [calibration('calibration-1', 240), calibration('calibration-2', 250), calibration('calibration-3', 260)],
    });

    expect(graph.containers['blue-bowl'].verifiedGrams.p50).toBe(250);
    expect(graph.containers['blue-bowl'].confidence).toBe('medium');
    expect(graph.foods['rice cooked'].observedGrams.p50).toBe(240);
    expect(graph.mealTemplates['rice bowl'].count).toBe(3);
  });

  it('does not overfit when a habit has fewer than three observations', () => {
    const graph = buildPersonalFoodGraph({
      userId: 'user-1',
      meals: [
        meal({ id: 'meal-1', mealName: 'Rice bowl', itemId: 'rice-1', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 230, capturedAt: '2026-06-01T12:00:00.000Z' }),
        meal({ id: 'meal-2', mealName: 'Rice bowl', itemId: 'rice-2', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 250, capturedAt: '2026-06-02T12:00:00.000Z' }),
      ],
      corrections: [],
      calibrations: [calibration('calibration-1', 240), calibration('calibration-2', 260)],
    });

    expect(graph.foods['rice cooked'].confidence).toBe('low');
    expect(graph.containers['blue-bowl'].confidence).toBe('low');
    expect(graph.mealTemplates['rice bowl'].confidence).toBe('low');
  });

  it('preserves separate habits for rice bowl, pasta plate, and packaged item', () => {
    const graph = buildPersonalFoodGraph({
      userId: 'user-1',
      meals: [
        meal({ id: 'rice', mealName: 'Rice bowl', itemId: 'item-rice', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 240, capturedAt: '2026-06-01T12:00:00.000Z' }),
        meal({ id: 'pasta', mealName: 'Pasta plate', itemId: 'item-pasta', itemName: 'Pasta', canonicalFoodName: 'pasta cooked', grams: 320, capturedAt: '2026-06-02T12:00:00.000Z' }),
        meal({ id: 'bar', mealName: 'Protein bar', itemId: 'item-bar', itemName: 'Protein bar', canonicalFoodName: 'protein bar packaged', grams: 60, capturedAt: '2026-06-03T12:00:00.000Z' }),
      ],
      corrections: [],
      calibrations: [],
    });

    expect(Object.keys(graph.foods).sort()).toEqual(['pasta cooked', 'protein bar packaged', 'rice cooked']);
    expect(Object.keys(graph.mealTemplates).sort()).toEqual(['pasta plate', 'protein bar', 'rice bowl']);
  });

  it('updates graph stats when a correction changes grams or hidden sauce amount', () => {
    const corrections: CorrectionRecord[] = [
      {
        id: 'correction-grams',
        userId: 'user-1',
        mealId: 'meal-1',
        itemId: 'item-rice',
        foodLabel: 'Rice',
        modelId: 'gpt-4o',
        field: 'grams',
        previousValue: 180,
        nextValue: 240,
        correctionType: 'portion_up',
        createdAt: '2026-06-04T10:00:00.000Z',
      },
      {
        id: 'correction-sauce',
        userId: 'user-1',
        mealId: 'meal-1',
        itemId: 'item-sauce',
        foodLabel: 'Sauce',
        modelId: 'gpt-4o',
        field: 'portion',
        previousValue: 1,
        nextValue: 2,
        correctionType: 'add_sauce',
        createdAt: '2026-06-04T10:01:00.000Z',
      },
    ];

    const graph = buildPersonalFoodGraph({
      userId: 'user-1',
      meals: [meal({ id: 'meal-1', mealName: 'Rice bowl', itemId: 'item-rice', itemName: 'Rice', canonicalFoodName: 'rice cooked', grams: 180, capturedAt: '2026-06-01T12:00:00.000Z' })],
      corrections,
      calibrations: [],
    });

    expect(graph.foods['rice cooked'].observedGrams.p50).toBe(240);
    expect(graph.answeredRiskKeys).toContain('item-sauce:sauce');
    expect(graph.correctionEdges['gpt-4o:Sauce:add_sauce'].count).toBe(1);
  });
});
