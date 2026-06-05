import type { AppNutritionSource, ConfidenceTier, FoodSceneItem, FoodSceneItemRole, HiddenCalorieRisk, QuantileEstimate } from './types';

type EstimateRangeInput = {
  low?: number;
  point: number;
  high?: number;
  unit: string;
  method: string;
};

type CreateFoodSceneItemInput = {
  id: string;
  label: string;
  canonicalFoodName: string;
  role?: FoodSceneItemRole;
  visualEvidence?: string[];
  grams: EstimateRangeInput;
  kcal: EstimateRangeInput;
  confidence: ConfidenceTier;
  dataSource: AppNutritionSource;
  sourceFoodId: string | null;
  hiddenCalorieRisks?: HiddenCalorieRisk[];
};

function finiteOrFallback(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function orderedQuantiles(p10: number, p50: number, p90: number): Pick<QuantileEstimate, 'p10' | 'p50' | 'p90'> {
  const values = [p10, p50, p90].sort((a, b) => a - b);
  return { p10: values[0], p50: values[1], p90: values[2] };
}

export function quantileEstimateFromRange(input: EstimateRangeInput): QuantileEstimate {
  const point = finiteOrFallback(input.point, 0);
  const quantiles = orderedQuantiles(finiteOrFallback(input.low, point), point, finiteOrFallback(input.high, point));

  return {
    ...quantiles,
    unit: input.unit,
    method: input.method,
  };
}

export function createFoodSceneItem(input: CreateFoodSceneItemInput): FoodSceneItem & {
  quantityGrams: Pick<QuantileEstimate, 'p10' | 'p50' | 'p90'>;
  calorieQuantiles: Pick<QuantileEstimate, 'p10' | 'p50' | 'p90'>;
} {
  const grams = quantileEstimateFromRange(input.grams);
  const kcal = quantileEstimateFromRange(input.kcal);

  return {
    id: input.id,
    label: input.label,
    canonicalFoodName: input.canonicalFoodName,
    role: input.role ?? 'unknown',
    visualEvidence: input.visualEvidence ?? [],
    grams,
    kcal,
    confidence: input.confidence,
    dataSource: input.dataSource,
    sourceFoodId: input.sourceFoodId,
    hiddenCalorieRisks: input.hiddenCalorieRisks ?? [],
    quantityGrams: { p10: grams.p10, p50: grams.p50, p90: grams.p90 },
    calorieQuantiles: { p10: kcal.p10, p50: kcal.p50, p90: kcal.p90 },
  };
}
