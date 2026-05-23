import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function roundWhole(value: number): number {
  return Math.round(value);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

export function toMacroLensResponse(raw: RawMealAnalysis, imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();
  const items = raw.items.map((item, index) => ({
    id: `${mealId}-item-${index + 1}`,
    mealId,
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: roundMacro(item.estimatedQuantity),
    unit: item.unit,
    calories: roundWhole(item.calories),
    proteinG: roundMacro(item.proteinG),
    carbsG: roundMacro(item.carbsG),
    fatG: roundMacro(item.fatG),
    fiberG: roundMacro(item.fiberG),
    confidence: item.confidence,
    dataSource: 'estimated',
    sourceFoodId: null,
  }));

  const calories = roundWhole(items.reduce((sum, item) => sum + item.calories, 0));
  const proteinG = roundMacro(items.reduce((sum, item) => sum + item.proteinG, 0));
  const carbsG = roundMacro(items.reduce((sum, item) => sum + item.carbsG, 0));
  const fatG = roundMacro(items.reduce((sum, item) => sum + item.fatG, 0));
  const fiberG = roundMacro(items.reduce((sum, item) => sum + item.fiberG, 0));

  return {
    meal: {
      id: mealId,
      userId,
      imageUri: imageUrl,
      capturedAt: new Date().toISOString(),
      mealName: raw.mealName,
      caloriesEstimate: calories,
      caloriesLow: roundWhole(calories * 0.85),
      caloriesHigh: roundWhole(calories * 1.15),
      proteinG,
      carbsG,
      fatG,
      fiberG,
      confidence: raw.confidence,
      notes: 'Estimated by AI vision. Nutrition data source integration comes next.',
      source: 'estimated',
      items,
    },
    uncertaintyReasons: raw.uncertaintyReasons,
    correctionSuggestions: [
      { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: null },
      { id: 'portion-down', label: 'Portion -15%', correctionType: 'portion_down', targetItemId: null },
      { id: 'add-oil', label: 'Huile ajoutee', correctionType: 'add_oil', targetItemId: null },
      { id: 'add-sauce', label: 'Sauce ajoutee', correctionType: 'add_sauce', targetItemId: null },
    ],
  };
}
