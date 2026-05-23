import type { FoodItem, Meal, NutritionTotals } from './types';

const CALORIE_RANGE_FACTOR = 0.15;

export function roundWhole(value: number): number {
  return Math.round(value);
}

export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calorieRange(calories: number): Pick<NutritionTotals, 'caloriesLow' | 'caloriesHigh'> {
  return {
    caloriesLow: roundWhole(calories * (1 - CALORIE_RANGE_FACTOR)),
    caloriesHigh: roundWhole(calories * (1 + CALORIE_RANGE_FACTOR)),
  };
}

export function sumFoodItems(items: FoodItem[]): NutritionTotals {
  const calories = roundWhole(items.reduce((sum, item) => sum + item.calories, 0));
  const range = calorieRange(calories);

  return {
    calories,
    caloriesLow: range.caloriesLow,
    caloriesHigh: range.caloriesHigh,
    proteinG: roundMacro(items.reduce((sum, item) => sum + item.proteinG, 0)),
    carbsG: roundMacro(items.reduce((sum, item) => sum + item.carbsG, 0)),
    fatG: roundMacro(items.reduce((sum, item) => sum + item.fatG, 0)),
    fiberG: roundMacro(items.reduce((sum, item) => sum + item.fiberG, 0)),
  };
}

export function scaleFoodItem(item: FoodItem, factor: number): FoodItem {
  return {
    ...item,
    estimatedQuantity: roundMacro(item.estimatedQuantity * factor),
    calories: roundWhole(item.calories * factor),
    proteinG: roundMacro(item.proteinG * factor),
    carbsG: roundMacro(item.carbsG * factor),
    fatG: roundMacro(item.fatG * factor),
    fiberG: roundMacro(item.fiberG * factor),
  };
}

export function recalculateMeal(meal: Meal): Meal {
  const totals = sumFoodItems(meal.items);

  return {
    ...meal,
    caloriesEstimate: totals.calories,
    caloriesLow: totals.caloriesLow,
    caloriesHigh: totals.caloriesHigh,
    proteinG: totals.proteinG,
    carbsG: totals.carbsG,
    fatG: totals.fatG,
    fiberG: totals.fiberG,
  };
}
