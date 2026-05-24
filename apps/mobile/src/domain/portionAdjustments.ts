import { recalculateMeal, scaleFoodItem } from './nutrition';
import type { Meal } from './types';

export const portionGramPresets = [100, 150, 200, 250];

export function clampGrams(grams: number): number {
  return Math.max(25, Math.min(1000, Math.round(grams)));
}

export function adjustMealItemGrams(meal: Meal, itemId: string, grams: number): Meal {
  const targetGrams = clampGrams(grams);

  return recalculateMeal({
    ...meal,
    items: meal.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      const currentQuantity = item.unit === 'g' && item.estimatedQuantity > 0 ? item.estimatedQuantity : 100;

      return {
        ...scaleFoodItem(item, targetGrams / currentQuantity),
        estimatedQuantity: targetGrams,
        unit: 'g',
      };
    }),
  });
}
