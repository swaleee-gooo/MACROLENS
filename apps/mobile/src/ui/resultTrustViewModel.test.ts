import { describe, expect, it } from 'vitest';
import { buildResultTrustViewModel } from './resultTrustViewModel';
import type { FoodItem, Meal } from '../domain/types';

function item(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'item-1',
    mealId: 'meal-1',
    name: 'Poulet grille',
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
    mealName: 'Poulet grille',
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
    expect(buildResultTrustViewModel(meal({ source: 'estimated' })).sourceLabel).toBe('Analyse IA');
    expect(buildResultTrustViewModel(meal({ source: 'open_food_facts' })).sourceLabel).toBe('Base produit');
    expect(buildResultTrustViewModel(meal({ imageUri: 'manual://custom' })).sourceLabel).toBe('Saisie manuelle');
    expect(buildResultTrustViewModel(meal({ source: 'mock' })).sourceLabel).toBe('Mode demo');
  });

  it('formats detected item rows with quantity, macros, confidence and source', () => {
    const vm = buildResultTrustViewModel(meal());

    expect(vm.items[0]).toMatchObject({
      id: 'item-1',
      quantityLabel: '150 g',
      caloriesLabel: '248 kcal',
      macroLine: '46.5g prot | 0g gluc | 5.4g lip',
      confidenceLabel: 'Fiabilite moyenne',
      sourceLabel: 'Estimation IA',
    });
  });

  it('uses uncertainty reasons before fallback confidence guidance', () => {
    const uncertain = buildResultTrustViewModel(
      meal({
        confidence: 'low',
        uncertaintyReasons: ['Sauce cachee possible', 'Portion de riz incertaine'],
      }),
    );
    const fallback = buildResultTrustViewModel(meal({ confidence: 'low', uncertaintyReasons: [] }));

    expect(uncertain.explanationBullets).toEqual(['Sauce cachee possible', 'Portion de riz incertaine']);
    expect(fallback.explanationBullets[0]).toContain('portions visibles');
  });
});
