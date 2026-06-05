import type { FoodItem, Meal, MealProofMetadata, NutritionSource as AppNutritionSource } from '../domain/types';
import { analyzeMealEvidence, proofStatusForEvidence } from './proofEngine';
import type { EvidenceLevel, MealItem, NutritionSource, NutritionSourceProvider } from './types';

function providerForAppSource(source: AppNutritionSource): NutritionSourceProvider {
  if (source === 'open_food_facts') {
    return 'OPEN_FOOD_FACTS';
  }

  if (source === 'usda') {
    return 'USDA_FDC';
  }

  return 'USER_CUSTOM';
}

function per100g(value: number, grams: number): number {
  return grams > 0 ? Math.round((value / grams) * 1000) / 10 : 0;
}

function nutritionSourceFromFoodItem(item: FoodItem): NutritionSource {
  const grams = item.unit === 'g' ? item.estimatedQuantity : 100;
  return {
    provider: providerForAppSource(item.dataSource),
    externalId: item.sourceFoodId ?? item.id,
    name: item.canonicalFoodName || item.name,
    kcalPer100g: per100g(item.calories, grams),
    proteinPer100g: per100g(item.proteinG, grams),
    carbsPer100g: per100g(item.carbsG, grams),
    fatPer100g: per100g(item.fatG, grams),
  };
}

function defaultEvidenceLevel(meal: Meal): EvidenceLevel {
  const isProduct = meal.source === 'open_food_facts' && meal.items.length > 0 && meal.items.every((item) => item.unit === 'g' && item.estimatedQuantity > 0);
  return isProduct ? 'VERIFIED_BARCODE_WEIGHT' : 'ESTIMATED_VISUAL_ONLY';
}

function mealItemFromFoodItem(item: FoodItem, evidenceLevel: EvidenceLevel): MealItem {
  const measuredGrams = item.unit === 'g' ? item.estimatedQuantity : undefined;
  const estimatedGrams = item.unit === 'g' ? item.estimatedQuantity : 100;
  const isMeasuredEvidence = evidenceLevel.startsWith('VERIFIED_');

  return {
    id: item.id,
    label: item.name,
    grams: isMeasuredEvidence ? measuredGrams : undefined,
    estimatedGrams: isMeasuredEvidence ? undefined : estimatedGrams,
    confidence: item.confidence === 'high' ? 0.9 : item.confidence === 'medium' ? 0.7 : 0.45,
    source: nutritionSourceFromFoodItem(item),
    evidenceLevel,
  };
}

function uniqueSources(items: MealItem[]): MealProofMetadata['sources'] {
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

export function createMealProofMetadata(meal: Meal, options: { evidenceLevel?: EvidenceLevel } = {}): MealProofMetadata {
  const evidenceLevel = options.evidenceLevel ?? defaultEvidenceLevel(meal);
  const items = meal.items.map((item) => mealItemFromFoodItem(item, evidenceLevel));
  const analysis = analyzeMealEvidence({ id: meal.id, items });

  return {
    engine: 'MetaboProof',
    evidenceLevel: analysis.evidenceLevel,
    status: proofStatusForEvidence(analysis.evidenceLevel),
    kcalRange: analysis.kcalRange,
    warnings: analysis.warnings,
    explanation: analysis.explanation,
    sources: uniqueSources(items),
  };
}
