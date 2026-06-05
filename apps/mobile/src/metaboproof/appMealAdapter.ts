import type { ConfidenceTier, FoodItem, Meal, NutritionSource as AppNutritionSource } from '../domain/types';
import { proofStatusForEvidence } from './proofEngine';
import type { MealAnalysis, MealItem, NutritionSourceProvider } from './types';

function roundWhole(value: number): number {
  return Math.round(value);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function gramsForItem(item: MealItem): number {
  return item.grams ?? item.estimatedGrams ?? 0;
}

function confidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.8) {
    return 'high';
  }

  if (confidence >= 0.6) {
    return 'medium';
  }

  return 'low';
}

function appSource(provider: NutritionSourceProvider): AppNutritionSource {
  if (provider === 'USDA_FDC') {
    return 'usda';
  }

  if (provider === 'OPEN_FOOD_FACTS') {
    return 'open_food_facts';
  }

  return 'estimated';
}

function itemNutrition(item: MealItem) {
  const grams = gramsForItem(item);
  return {
    calories: roundWhole((grams * item.source.kcalPer100g) / 100),
    proteinG: roundMacro((grams * item.source.proteinPer100g) / 100),
    carbsG: roundMacro((grams * item.source.carbsPer100g) / 100),
    fatG: roundMacro((grams * item.source.fatPer100g) / 100),
  };
}

function foodItemFromMealItem(item: MealItem, mealId: string): FoodItem {
  const nutrition = itemNutrition(item);
  return {
    id: item.id,
    mealId,
    name: item.label,
    canonicalFoodName: item.source.name,
    estimatedQuantity: gramsForItem(item),
    unit: 'g',
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: 0,
    confidence: confidenceTier(item.confidence),
    dataSource: appSource(item.source.provider),
    sourceFoodId: item.source.externalId,
  };
}

function mealSource(items: MealItem[]): AppNutritionSource {
  const providers = new Set(items.map((item) => item.source.provider));
  return providers.size === 1 ? appSource(items[0]?.source.provider ?? 'USER_CUSTOM') : 'estimated';
}

function mealConfidence(items: MealItem[]): ConfidenceTier {
  const average = items.length > 0 ? items.reduce((sum, item) => sum + item.confidence, 0) / items.length : 0.5;
  return confidenceTier(average);
}

function uniqueSources(items: MealItem[]) {
  const seen = new Set<string>();
  return items
    .map((item) => item.source)
    .filter((source) => {
      const key = `${source.provider}:${source.externalId}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((source) => ({
      provider: source.provider,
      externalId: source.externalId,
      name: source.name,
    }));
}

export function createAppMealFromMetaboProofAnalysis({
  userId,
  mealName,
  imageUri,
  capturedAt = new Date().toISOString(),
  analysis,
}: {
  userId: string;
  mealName: string;
  imageUri: string;
  capturedAt?: string;
  analysis: MealAnalysis;
}): Meal {
  const caloriesLow = analysis.kcalRange?.min ?? analysis.totalKcal;
  const caloriesHigh = analysis.kcalRange?.max ?? analysis.totalKcal;

  return {
    id: analysis.id,
    userId,
    imageUri,
    capturedAt,
    mealName,
    caloriesEstimate: analysis.totalKcal,
    caloriesLow,
    caloriesHigh,
    proteinG: analysis.totalProtein,
    carbsG: analysis.totalCarbs,
    fatG: analysis.totalFat,
    fiberG: 0,
    confidence: mealConfidence(analysis.items),
    notes: 'Created by MetaboProof.',
    source: mealSource(analysis.items),
    items: analysis.items.map((item) => foodItemFromMealItem(item, analysis.id)),
    proof: {
      engine: 'MetaboProof',
      evidenceLevel: analysis.evidenceLevel,
      status: proofStatusForEvidence(analysis.evidenceLevel),
      kcalRange: analysis.kcalRange,
      warnings: analysis.warnings,
      explanation: analysis.explanation,
      sources: uniqueSources(analysis.items),
    },
  };
}
