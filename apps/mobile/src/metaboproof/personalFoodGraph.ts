import type { FoodItem, Meal } from '../domain/types';
import type { PortionCalibrationRecord } from '../storage/metaboProofRepository';
import type { CorrectionRecord } from './correctionLoop';

export type PersonalGraphConfidence = 'low' | 'medium' | 'high';

export type PersonalGraphStats = {
  p10: number;
  p50: number;
  p90: number;
  count: number;
  confidence: PersonalGraphConfidence;
  lastObservedAt: string;
};

export type FoodNode = {
  key: string;
  canonicalFoodName: string;
  observedGrams: PersonalGraphStats;
  correctionRate: number;
  lastSeenAt: string;
  confidence: PersonalGraphConfidence;
};

export type ContainerNode = {
  key: string;
  verifiedGrams: PersonalGraphStats;
  foodLabels: string[];
  confidence: PersonalGraphConfidence;
};

export type MealTemplateNode = {
  key: string;
  mealName: string;
  itemSet: string[];
  count: number;
  macroDistribution: {
    caloriesP50: number;
    proteinP50: number;
    carbsP50: number;
    fatP50: number;
  };
  lastSeenAt: string;
  confidence: PersonalGraphConfidence;
};

export type CorrectionEdge = {
  key: string;
  modelId: string;
  foodLabel: string;
  correctionType: string;
  count: number;
  lastSeenAt: string;
};

export type PersonalFoodGraph = {
  userId: string;
  foods: Record<string, FoodNode>;
  containers: Record<string, ContainerNode>;
  mealTemplates: Record<string, MealTemplateNode>;
  correctionEdges: Record<string, CorrectionEdge>;
  answeredRiskKeys: string[];
};

type GraphInput = {
  userId: string;
  meals: Meal[];
  corrections: CorrectionRecord[];
  calibrations: PortionCalibrationRecord[];
};

type Observation = {
  value: number;
  observedAt: string;
};

function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function displayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function confidenceForCount(count: number): PersonalGraphConfidence {
  if (count >= 5) {
    return 'high';
  }

  if (count >= 3) {
    return 'medium';
  }

  return 'low';
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = (sortedValues.length - 1) * percentileValue;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return roundOne(sortedValues[lowerIndex]);
  }

  const fraction = index - lowerIndex;
  return roundOne(sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * fraction);
}

function statsFromObservations(observations: Observation[]): PersonalGraphStats {
  const valid = observations.filter((observation) => Number.isFinite(observation.value) && observation.value > 0);
  const values = valid.map((observation) => observation.value).sort((a, b) => a - b);
  const lastObservedAt = valid.reduce((latest, observation) => (observation.observedAt > latest ? observation.observedAt : latest), '');

  return {
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    count: values.length,
    confidence: confidenceForCount(values.length),
    lastObservedAt,
  };
}

function gramsForItem(item: FoodItem): number {
  return item.quantityGrams?.p50 ?? item.estimatedQuantity;
}

function latestNumericCorrectionByItem(corrections: CorrectionRecord[]): Map<string, CorrectionRecord> {
  const byItem = new Map<string, CorrectionRecord>();

  for (const correction of [...corrections].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if ((correction.field === 'grams' || correction.field === 'portion') && typeof correction.nextValue === 'number') {
      byItem.set(correction.itemId, correction);
    }
  }

  return byItem;
}

function correctedItemGrams(item: FoodItem, correctionByItem: Map<string, CorrectionRecord>): Observation {
  const correction = correctionByItem.get(item.id);
  return {
    value: typeof correction?.nextValue === 'number' ? correction.nextValue : gramsForItem(item),
    observedAt: correction?.createdAt ?? '',
  };
}

function correctionRate(foodKey: string, observations: number, corrections: CorrectionRecord[]): number {
  if (observations === 0) {
    return 0;
  }

  const correctionCount = corrections.filter((correction) => normalizeKey(correction.foodLabel) === foodKey).length;
  return roundOne((correctionCount / observations) * 100);
}

function riskKeyForCorrection(correction: CorrectionRecord): string | null {
  const correctionType = correction.correctionType ?? correction.field;

  if (correctionType === 'add_sauce') {
    return `${correction.itemId}:sauce`;
  }

  if (correctionType === 'add_oil') {
    return `${correction.itemId}:oil`;
  }

  if (correctionType === 'add_cheese') {
    return `${correction.itemId}:cheese`;
  }

  if (correctionType.startsWith('portion_') || correction.field === 'grams' || correction.field === 'portion') {
    return `${correction.itemId}:portion_depth`;
  }

  return null;
}

function buildFoodNodes(meals: Meal[], corrections: CorrectionRecord[]): Record<string, FoodNode> {
  const correctionByItem = latestNumericCorrectionByItem(corrections);
  const observationsByFood = new Map<string, Observation[]>();
  const canonicalNames = new Map<string, string>();

  for (const meal of meals) {
    for (const item of meal.items) {
      const key = normalizeKey(item.canonicalFoodName || item.name);
      if (!key) {
        continue;
      }

      const observation = correctedItemGrams(item, correctionByItem);
      observationsByFood.set(key, [...(observationsByFood.get(key) ?? []), { ...observation, observedAt: observation.observedAt || meal.capturedAt }]);
      canonicalNames.set(key, displayName(item.canonicalFoodName || item.name));
    }
  }

  return Object.fromEntries(
    Array.from(observationsByFood.entries()).map(([key, observations]) => {
      const observedGrams = statsFromObservations(observations);
      return [
        key,
        {
          key,
          canonicalFoodName: canonicalNames.get(key) ?? key,
          observedGrams,
          correctionRate: correctionRate(key, observations.length, corrections),
          lastSeenAt: observedGrams.lastObservedAt,
          confidence: observedGrams.confidence,
        },
      ];
    }),
  );
}

function buildContainerNodes(calibrations: PortionCalibrationRecord[]): Record<string, ContainerNode> {
  const byContainer = new Map<string, PortionCalibrationRecord[]>();

  for (const calibration of calibrations) {
    const key = normalizeKey(calibration.containerKey);
    if (!key) {
      continue;
    }

    byContainer.set(key, [...(byContainer.get(key) ?? []), calibration]);
  }

  return Object.fromEntries(
    Array.from(byContainer.entries()).map(([key, records]) => {
      const verifiedGrams = statsFromObservations(records.map((record) => ({ value: record.verifiedGrams, observedAt: record.createdAt })));
      return [
        key,
        {
          key,
          verifiedGrams,
          foodLabels: Array.from(new Set(records.map((record) => displayName(record.foodLabel)))).sort(),
          confidence: verifiedGrams.confidence,
        },
      ];
    }),
  );
}

function buildMealTemplateNodes(meals: Meal[]): Record<string, MealTemplateNode> {
  const byMealName = new Map<string, Meal[]>();

  for (const meal of meals) {
    const key = normalizeKey(meal.mealName);
    if (!key) {
      continue;
    }

    byMealName.set(key, [...(byMealName.get(key) ?? []), meal]);
  }

  return Object.fromEntries(
    Array.from(byMealName.entries()).map(([key, group]) => {
      const calories = statsFromObservations(group.map((meal) => ({ value: meal.caloriesEstimate, observedAt: meal.capturedAt })));
      const protein = statsFromObservations(group.map((meal) => ({ value: meal.proteinG, observedAt: meal.capturedAt })));
      const carbs = statsFromObservations(group.map((meal) => ({ value: meal.carbsG, observedAt: meal.capturedAt })));
      const fat = statsFromObservations(group.map((meal) => ({ value: meal.fatG, observedAt: meal.capturedAt })));
      const latest = [...group].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];

      return [
        key,
        {
          key,
          mealName: displayName(latest.mealName),
          itemSet: Array.from(new Set(group.flatMap((meal) => meal.items.map((item) => normalizeKey(item.canonicalFoodName || item.name))))).sort(),
          count: group.length,
          macroDistribution: {
            caloriesP50: calories.p50,
            proteinP50: protein.p50,
            carbsP50: carbs.p50,
            fatP50: fat.p50,
          },
          lastSeenAt: latest.capturedAt,
          confidence: confidenceForCount(group.length),
        },
      ];
    }),
  );
}

function buildCorrectionEdges(corrections: CorrectionRecord[]): Record<string, CorrectionEdge> {
  const edges = new Map<string, CorrectionEdge>();

  for (const correction of corrections) {
    const correctionType = correction.correctionType ?? correction.field;
    const key = `${correction.modelId}:${correction.foodLabel}:${correctionType}`;
    const existing = edges.get(key);

    edges.set(key, {
      key,
      modelId: correction.modelId,
      foodLabel: correction.foodLabel,
      correctionType,
      count: (existing?.count ?? 0) + 1,
      lastSeenAt: existing && existing.lastSeenAt > correction.createdAt ? existing.lastSeenAt : correction.createdAt,
    });
  }

  return Object.fromEntries(edges);
}

export function buildPersonalFoodGraph({ userId, meals, corrections, calibrations }: GraphInput): PersonalFoodGraph {
  const userMeals = meals.filter((meal) => meal.userId === userId);
  const userCorrections = corrections.filter((correction) => correction.userId === userId);
  const userCalibrations = calibrations.filter((calibration) => calibration.userId === userId);
  const answeredRiskKeys = Array.from(new Set(userCorrections.map(riskKeyForCorrection).filter((key): key is string => Boolean(key)))).sort();

  return {
    userId,
    foods: buildFoodNodes(userMeals, userCorrections),
    containers: buildContainerNodes(userCalibrations),
    mealTemplates: buildMealTemplateNodes(userMeals),
    correctionEdges: buildCorrectionEdges(userCorrections),
    answeredRiskKeys,
  };
}
