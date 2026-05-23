import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';
import { calibrateMealAnalysis } from './nutritionCalibration.ts';

export function toMacroLensResponse(raw: RawMealAnalysis, imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();
  const calibrated = calibrateMealAnalysis(raw);
  const items = calibrated.items.map((item, index) => ({
    id: `${mealId}-item-${index + 1}`,
    mealId,
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: item.estimatedQuantity,
    unit: item.unit,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    dataSource: 'estimated',
    sourceFoodId: null,
  }));

  return {
    meal: {
      id: mealId,
      userId,
      imageUri: imageUrl,
      capturedAt: new Date().toISOString(),
      mealName: calibrated.mealName,
      caloriesEstimate: calibrated.caloriesEstimate,
      caloriesLow: calibrated.caloriesLow,
      caloriesHigh: calibrated.caloriesHigh,
      proteinG: calibrated.proteinG,
      carbsG: calibrated.carbsG,
      fatG: calibrated.fatG,
      fiberG: calibrated.fiberG,
      confidence: calibrated.confidence,
      notes: calibrated.notes,
      source: 'estimated',
      items,
    },
    uncertaintyReasons: calibrated.uncertaintyReasons,
    correctionSuggestions: calibrated.correctionSuggestions,
  };
}
