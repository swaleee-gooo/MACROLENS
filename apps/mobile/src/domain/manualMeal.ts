import { recalculateMeal } from './nutrition';
import type { FoodItem, Meal } from './types';

type ManualMacroMealInput = {
  userId: string;
  name: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  capturedAt?: string;
};

export function createManualMacroMeal(input: ManualMacroMealInput): Meal {
  const mealId = `manual-${Date.now()}`;
  const item: FoodItem = {
    id: `${mealId}-item-1`,
    mealId,
    name: input.name.trim(),
    canonicalFoodName: 'manual meal',
    estimatedQuantity: 1,
    unit: 'portion',
    calories: Math.round(input.calories),
    proteinG: input.proteinG ?? 0,
    carbsG: input.carbsG ?? 0,
    fatG: input.fatG ?? 0,
    fiberG: input.fiberG ?? 0,
    confidence: 'low',
    dataSource: 'estimated',
    sourceFoodId: null,
  };

  return recalculateMeal({
    id: mealId,
    userId: input.userId,
    imageUri: 'manual://custom',
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    mealName: input.name.trim(),
    caloriesEstimate: 0,
    caloriesLow: 0,
    caloriesHigh: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    confidence: 'low',
    notes: 'Repas ajoute manuellement.',
    source: 'estimated',
    items: [item],
  });
}
