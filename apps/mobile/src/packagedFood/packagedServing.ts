import { roundMacro, roundWhole } from '../domain/nutrition';
import type { PackagedFoodItem } from './packagedFoodSchema';

export type PackagedServingNutrition = {
  servingGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

function perServing(per100g: number, servingGrams: number): number {
  return (per100g * servingGrams) / 100;
}

export function calculatePackagedServingNutrition(item: PackagedFoodItem, servingGrams: number): PackagedServingNutrition {
  return {
    servingGrams,
    calories: roundWhole(perServing(item.caloriesPer100g, servingGrams)),
    proteinG: roundMacro(perServing(item.proteinPer100g, servingGrams)),
    carbsG: roundMacro(perServing(item.carbsPer100g, servingGrams)),
    fatG: roundMacro(perServing(item.fatPer100g, servingGrams)),
    fiberG: roundMacro(perServing(item.fiberPer100g, servingGrams)),
  };
}
