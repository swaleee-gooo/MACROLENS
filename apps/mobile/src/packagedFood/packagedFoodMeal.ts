import { recalculateMeal, roundMacro, roundWhole } from '../domain/nutrition';
import type { FoodItem, Meal } from '../domain/types';
import type { PackagedFoodItem } from './packagedFoodSchema';

type Input = {
  userId: string;
  item: PackagedFoodItem;
  servingGrams?: number;
  imageUri?: string;
  capturedAt?: string;
};

function perServing(per100g: number, servingGrams: number): number {
  return (per100g * servingGrams) / 100;
}

export function createPackagedFoodMeal({ userId, item, servingGrams = 100, imageUri, capturedAt = new Date().toISOString() }: Input): Meal {
  const mealId = `packaged-${item.barcode}-${Date.now()}`;
  const foodItem: FoodItem = {
    id: `${mealId}-item-1`,
    mealId,
    name: item.name,
    canonicalFoodName: item.name.toLowerCase(),
    estimatedQuantity: servingGrams,
    unit: 'g',
    calories: roundWhole(perServing(item.caloriesPer100g, servingGrams)),
    proteinG: roundMacro(perServing(item.proteinPer100g, servingGrams)),
    carbsG: roundMacro(perServing(item.carbsPer100g, servingGrams)),
    fatG: roundMacro(perServing(item.fatPer100g, servingGrams)),
    fiberG: roundMacro(perServing(item.fiberPer100g, servingGrams)),
    confidence: 'high',
    dataSource: item.source,
    sourceFoodId: item.barcode,
  };

  return recalculateMeal({
    id: mealId,
    userId,
    imageUri: imageUri ?? `barcode://${item.barcode}`,
    capturedAt,
    mealName: item.name,
    caloriesEstimate: 0,
    caloriesLow: 0,
    caloriesHigh: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    confidence: 'high',
    notes:
      item.source === 'nutrition_label_ocr'
        ? "Produit cree depuis l'OCR de l'etiquette nutritionnelle. Verifie la portion avant d'enregistrer."
        : `Produit scanne via Open Food Facts: ${item.barcode}.`,
    source: item.source,
    items: [foodItem],
    uncertaintyReasons: [],
    correctionSuggestions: [
      { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: foodItem.id },
      { id: 'portion-down', label: 'Portion -15%', correctionType: 'portion_down', targetItemId: foodItem.id },
    ],
  });
}
