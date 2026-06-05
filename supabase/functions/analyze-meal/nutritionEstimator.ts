import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';
import { calibrateMealAnalysis } from './nutritionCalibration.ts';

type QuantileTriplet = { p10: number; p50: number; p90: number };
type QuestionableHiddenRisk = {
  type: string;
  targetItemId: string | null;
  kcalImpact: { p90: number };
  answerableQuestion: string;
};

const MIN_QUESTION_IMPACT_KCAL = 50;

function finiteOrFallback(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function orderedTriplet(p10: number, p50: number, p90: number): QuantileTriplet {
  const values = [p10, p50, p90].sort((a, b) => a - b);
  return { p10: values[0], p50: values[1], p90: values[2] };
}

function roundWhole(value: number): number {
  return Math.round(value);
}

function quantityTriplet(rawItem: RawMealAnalysis['items'][number], estimatedQuantity: number): QuantileTriplet {
  const p50 = finiteOrFallback(rawItem.quantityP50, finiteOrFallback(rawItem.estimatedQuantity, estimatedQuantity));
  return orderedTriplet(
    finiteOrFallback(rawItem.quantityP10, finiteOrFallback(rawItem.quantityLow, p50)),
    p50,
    finiteOrFallback(rawItem.quantityP90, finiteOrFallback(rawItem.quantityHigh, p50)),
  );
}

function confidenceCalorieTriplet(calories: number, confidence: RawMealAnalysis['confidence']): QuantileTriplet {
  if (confidence === 'high') {
    return orderedTriplet(roundWhole(calories * 0.92), roundWhole(calories), roundWhole(calories * 1.1));
  }

  if (confidence === 'medium') {
    return orderedTriplet(roundWhole(calories * 0.85), roundWhole(calories), roundWhole(calories * 1.18));
  }

  return orderedTriplet(roundWhole(calories * 0.75), roundWhole(calories), roundWhole(calories * 1.35));
}

function rawCaloriesAreCompatible(rawP50: number, calibratedP50: number): boolean {
  if (!Number.isFinite(rawP50) || rawP50 <= 0 || !Number.isFinite(calibratedP50) || calibratedP50 <= 0) {
    return false;
  }

  const allowedDrift = Math.max(200, calibratedP50 * 0.4);
  return Math.abs(rawP50 - calibratedP50) <= allowedDrift;
}

function rawCalorieTriplet(rawItem: RawMealAnalysis['items'][number], calories: number): QuantileTriplet {
  const p50 = finiteOrFallback(rawItem.calorieP50, finiteOrFallback(rawItem.calories, calories));
  return orderedTriplet(
    finiteOrFallback(rawItem.calorieP10, p50),
    p50,
    finiteOrFallback(rawItem.calorieP90, p50),
  );
}

function calorieTriplet(rawItem: RawMealAnalysis['items'][number], calories: number, confidence: RawMealAnalysis['confidence']): QuantileTriplet {
  const rawTriplet = rawCalorieTriplet(rawItem, calories);
  if (rawCaloriesAreCompatible(rawTriplet.p50, calories)) {
    return rawTriplet;
  }

  return confidenceCalorieTriplet(calories, confidence);
}

function itemHiddenRisks(rawItem: RawMealAnalysis['items'][number], itemId: string) {
  return (rawItem.hiddenCalorieRisks ?? []).map((risk) => {
    const p50 = finiteOrFallback(risk.kcalImpactP50, 0);
    return {
      type: risk.type,
      targetItemId: itemId,
      description: risk.description,
      kcalImpact: {
        ...orderedTriplet(finiteOrFallback(risk.kcalImpactP10, p50), p50, finiteOrFallback(risk.kcalImpactP90, p50)),
        unit: 'kcal',
        method: 'risk_model',
      },
      evidence: risk.evidence ?? [],
      answerableQuestion: risk.answerableQuestion ?? '',
    };
  });
}

function riskTypeWeight(type: string): number {
  const normalized = type.toLowerCase();

  if (normalized.includes('hidden') || normalized.includes('base')) {
    return 1.25;
  }

  if (normalized.includes('sauce') || normalized.includes('oil') || normalized.includes('dressing')) {
    return 1.2;
  }

  if (normalized.includes('portion') || normalized.includes('depth') || normalized.includes('volume')) {
    return 1;
  }

  return 0.9;
}

function answerabilityWeight(question: string): number {
  return /^(was|were|did|does|do|is|are|has|had|have|can)\b/i.test(question.trim()) ? 1.1 : 0.75;
}

function questionPriority(risk: QuestionableHiddenRisk): number {
  const p90 = risk.kcalImpact.p90;

  if (!Number.isFinite(p90) || p90 < MIN_QUESTION_IMPACT_KCAL || !risk.answerableQuestion.trim()) {
    return 0;
  }

  return Math.round(p90 * riskTypeWeight(risk.type) * answerabilityWeight(risk.answerableQuestion));
}

function selectHighestImpactRiskQuestion(risks: QuestionableHiddenRisk[]): string {
  const [best] = risks
    .map((risk, index) => ({ risk, index, priority: questionPriority(risk) }))
    .filter((candidate) => candidate.priority > 0)
    .sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      if (b.risk.kcalImpact.p90 !== a.risk.kcalImpact.p90) {
        return b.risk.kcalImpact.p90 - a.risk.kcalImpact.p90;
      }

      return a.index - b.index;
    });

  return best?.risk.answerableQuestion.trim() ?? '';
}

function scanReviewFromRaw(raw: RawMealAnalysis, deterministicFollowUpQuestion = '') {
  const candidateMeals = raw.candidateMeals ?? [];
  const selectedFollowUpQuestion = deterministicFollowUpQuestion.trim();
  const hasScanReview =
    raw.scanRoute ||
    raw.visualQuality ||
    raw.portionAmbiguity ||
    raw.needsUserQuestion ||
    selectedFollowUpQuestion ||
    raw.followUpQuestion?.trim() ||
    candidateMeals.length > 0;

  if (!hasScanReview) {
    return undefined;
  }

  const followUpQuestion = selectedFollowUpQuestion || raw.followUpQuestion?.trim() || '';

  return {
    scanRoute: raw.scanRoute ?? (raw.mealCategory === 'packaged' ? 'packaged' : 'meal'),
    visualQuality: raw.visualQuality ?? 'usable',
    portionAmbiguity: raw.portionAmbiguity ?? (raw.confidence === 'low' ? 'high' : 'medium'),
    needsUserQuestion: Boolean((raw.needsUserQuestion || selectedFollowUpQuestion.length > 0) && followUpQuestion.length > 0),
    followUpQuestion,
    candidateMeals,
  };
}

export function toMacroLensResponse(raw: RawMealAnalysis, imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();
  const calibrated = calibrateMealAnalysis(raw);
  const items = calibrated.items.map((item, index) => {
    const rawItem = raw.items[index] ?? raw.items[0];
    const itemId = `${mealId}-item-${index + 1}`;
    const quantityGrams = quantityTriplet(rawItem, item.estimatedQuantity);
    const calorieQuantiles =
      calibrated.items.length === 1
        ? orderedTriplet(calibrated.caloriesLow, item.calories, calibrated.caloriesHigh)
        : calorieTriplet(rawItem, item.calories, item.confidence);
    const hiddenCalorieRisks = itemHiddenRisks(rawItem, itemId);

    return {
      id: itemId,
      mealId,
      name: item.name,
      canonicalFoodName: item.canonicalFoodName,
      estimatedQuantity: item.estimatedQuantity,
      quantityGrams,
      calorieQuantiles,
      unit: item.unit,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      fiberG: item.fiberG,
      confidence: item.confidence,
      dataSource: 'estimated',
      sourceFoodId: null,
      hiddenCalorieRisks,
    };
  });

  const sceneItems = items.map((item, index) => {
    const rawItem = raw.items[index] ?? raw.items[0];

    return {
      id: item.id,
      label: item.name,
      canonicalFoodName: item.canonicalFoodName,
      role: rawItem.role ?? 'unknown',
      visualEvidence: rawItem.visualEvidence ?? [],
      grams: { ...item.quantityGrams, unit: 'g', method: 'model_range' },
      kcal: { ...item.calorieQuantiles, unit: 'kcal', method: 'model_range' },
      confidence: item.confidence,
      dataSource: item.dataSource,
      sourceFoodId: item.sourceFoodId,
      hiddenCalorieRisks: item.hiddenCalorieRisks,
    };
  });

  const sceneHiddenRisks = sceneItems.flatMap((item) => item.hiddenCalorieRisks);
  const bestFollowUpQuestion = selectHighestImpactRiskQuestion(sceneHiddenRisks);

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
      scene: {
        id: `${mealId}-scene`,
        parserVersion: 'food-scene-v1',
        modelId: 'analyze-meal:v1',
        imageInputs: [{ uri: imageUrl, role: 'primary' }],
        visualQuality: raw.visualQuality ?? 'usable',
        portionAmbiguity: raw.portionAmbiguity ?? (calibrated.confidence === 'low' ? 'high' : 'medium'),
        evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
        items: sceneItems,
        hiddenCalorieRisks: sceneHiddenRisks,
        uncertaintyDrivers: Array.from(new Set([...raw.uncertaintyReasons, ...raw.hiddenCalorieRisks])),
        candidateMeals: raw.candidateMeals ?? [],
      },
    },
    uncertaintyReasons: calibrated.uncertaintyReasons,
    correctionSuggestions: calibrated.correctionSuggestions,
    scanReview: scanReviewFromRaw(raw, bestFollowUpQuestion),
  };
}
