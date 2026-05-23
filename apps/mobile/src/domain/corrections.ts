import { recalculateMeal, scaleFoodItem } from './nutrition';
import type { FoodItem, Meal } from './types';

export type MealCorrection =
  | { type: 'portion_up'; targetItemId: string | null }
  | { type: 'portion_down'; targetItemId: string | null }
  | { type: 'add_oil'; targetItemId: string | null }
  | { type: 'add_sauce'; targetItemId: string | null }
  | { type: 'remove_item'; targetItemId: string };

function appliesToItem(item: FoodItem, targetItemId: string | null): boolean {
  return targetItemId === null || item.id === targetItemId;
}

function addEstimatedItem(meal: Meal, item: Omit<FoodItem, 'mealId'>): Meal {
  return {
    ...meal,
    items: [
      ...meal.items,
      {
        ...item,
        mealId: meal.id,
      },
    ],
    confidence: meal.confidence === 'high' ? 'medium' : meal.confidence,
  };
}

export function applyMealCorrection(meal: Meal, correction: MealCorrection): Meal {
  if (correction.type === 'portion_up') {
    return recalculateMeal({
      ...meal,
      items: meal.items.map((item) =>
        appliesToItem(item, correction.targetItemId) ? scaleFoodItem(item, 1.15) : item,
      ),
    });
  }

  if (correction.type === 'portion_down') {
    return recalculateMeal({
      ...meal,
      items: meal.items.map((item) =>
        appliesToItem(item, correction.targetItemId) ? scaleFoodItem(item, 0.85) : item,
      ),
    });
  }

  if (correction.type === 'add_oil') {
    return recalculateMeal(
      addEstimatedItem(meal, {
        id: `${meal.id}-oil-${meal.items.length + 1}`,
        name: 'Huile de cuisson',
        canonicalFoodName: 'olive oil',
        estimatedQuantity: 14,
        unit: 'g',
        calories: 119,
        proteinG: 0,
        carbsG: 0,
        fatG: 14,
        fiberG: 0,
        confidence: 'medium',
        dataSource: 'estimated',
        sourceFoodId: null,
      }),
    );
  }

  if (correction.type === 'add_sauce') {
    return recalculateMeal(
      addEstimatedItem(meal, {
        id: `${meal.id}-sauce-${meal.items.length + 1}`,
        name: 'Sauce',
        canonicalFoodName: 'generic sauce',
        estimatedQuantity: 30,
        unit: 'g',
        calories: 80,
        proteinG: 0.5,
        carbsG: 4,
        fatG: 7,
        fiberG: 0.2,
        confidence: 'low',
        dataSource: 'estimated',
        sourceFoodId: null,
      }),
    );
  }

  return recalculateMeal({
    ...meal,
    items: meal.items.filter((item) => item.id !== correction.targetItemId),
  });
}
