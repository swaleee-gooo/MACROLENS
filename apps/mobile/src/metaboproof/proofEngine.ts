import type { EvidenceLevel, KcalRange, MealAnalysis, MealItem, ProofStatus } from './types';

const evidenceRank: Record<EvidenceLevel, number> = {
  ESTIMATED_VISUAL_ONLY: 0,
  RESEARCH_PREDICTED_MASS: 1,
  CALIBRATED_TOTAL_WEIGHT: 2,
  VERIFIED_PLATE_WEIGHT: 3,
  VERIFIED_RECIPE_WEIGHT: 4,
  VERIFIED_BARCODE_WEIGHT: 5,
};

function roundWhole(value: number): number {
  return Math.round(value);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function isVerifiedEvidence(evidenceLevel: EvidenceLevel): boolean {
  return evidenceLevel.startsWith('VERIFIED_');
}

function gramsForItem(item: MealItem): number {
  if (isVerifiedEvidence(item.evidenceLevel) && item.grams === undefined) {
    throw new Error('verified_requires_grams');
  }

  return item.grams ?? item.estimatedGrams ?? 0;
}

function calculateNutrient(grams: number, per100g: number): number {
  return (grams * per100g) / 100;
}

function aggregateEvidenceLevel(items: MealItem[]): EvidenceLevel {
  return items.reduce<EvidenceLevel>((current, item) => (evidenceRank[item.evidenceLevel] < evidenceRank[current] ? item.evidenceLevel : current), items[0]?.evidenceLevel ?? 'ESTIMATED_VISUAL_ONLY');
}

export function proofStatusForEvidence(evidenceLevel: EvidenceLevel): ProofStatus {
  if (isVerifiedEvidence(evidenceLevel)) {
    return 'verified';
  }

  if (evidenceLevel === 'CALIBRATED_TOTAL_WEIGHT') {
    return 'calibrated';
  }

  if (evidenceLevel === 'RESEARCH_PREDICTED_MASS') {
    return 'research';
  }

  return 'estimated';
}

function kcalRangeForEvidence(totalKcal: number, evidenceLevel: EvidenceLevel): KcalRange | undefined {
  const margin =
    evidenceLevel === 'ESTIMATED_VISUAL_ONLY'
      ? 0.35
      : evidenceLevel === 'RESEARCH_PREDICTED_MASS'
        ? 0.3
        : evidenceLevel === 'CALIBRATED_TOTAL_WEIGHT'
          ? 0.2
          : 0;

  if (margin === 0) {
    return undefined;
  }

  return {
    min: Math.max(0, roundWhole(totalKcal * (1 - margin))),
    max: roundWhole(totalKcal * (1 + margin)),
  };
}

function warningsForEvidence(evidenceLevel: EvidenceLevel): string[] {
  if (evidenceLevel === 'ESTIMATED_VISUAL_ONLY') {
    return ['Photo-only analysis cannot be verified without a measured quantity.'];
  }

  if (evidenceLevel === 'RESEARCH_PREDICTED_MASS') {
    return ['Research mass prediction is for benchmarking until checked against a measured quantity.'];
  }

  return [];
}

function explanationForEvidence(evidenceLevel: EvidenceLevel): string[] {
  if (evidenceLevel === 'VERIFIED_BARCODE_WEIGHT') {
    return ['Barcode source plus consumed weight produced verified nutrition math.'];
  }

  if (evidenceLevel === 'VERIFIED_RECIPE_WEIGHT') {
    return ['All ingredients use weighed recipe quantities and nutrition sources.'];
  }

  if (evidenceLevel === 'VERIFIED_PLATE_WEIGHT') {
    return ['The plated meal weight and confirmed composition support verified nutrition math.'];
  }

  if (evidenceLevel === 'CALIBRATED_TOTAL_WEIGHT') {
    return ['A measured total or user calibration reduced the visual portion uncertainty.'];
  }

  if (evidenceLevel === 'RESEARCH_PREDICTED_MASS') {
    return ['A model predicted mass or volume for research benchmarking, not verification.'];
  }

  return ['Photo-only analysis can identify foods and estimate portions, but measured quantity is required for verification.'];
}

export function analyzeMealEvidence({ id, items }: { id: string; items: MealItem[] }): MealAnalysis {
  const totals = items.reduce(
    (sum, item) => {
      const grams = gramsForItem(item);
      return {
        kcal: sum.kcal + calculateNutrient(grams, item.source.kcalPer100g),
        protein: sum.protein + calculateNutrient(grams, item.source.proteinPer100g),
        carbs: sum.carbs + calculateNutrient(grams, item.source.carbsPer100g),
        fat: sum.fat + calculateNutrient(grams, item.source.fatPer100g),
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const evidenceLevel = aggregateEvidenceLevel(items);
  const totalKcal = roundWhole(totals.kcal);

  return {
    id,
    items,
    totalKcal,
    totalProtein: roundMacro(totals.protein),
    totalCarbs: roundMacro(totals.carbs),
    totalFat: roundMacro(totals.fat),
    evidenceLevel,
    kcalRange: kcalRangeForEvidence(totalKcal, evidenceLevel),
    warnings: warningsForEvidence(evidenceLevel),
    explanation: explanationForEvidence(evidenceLevel),
  };
}
