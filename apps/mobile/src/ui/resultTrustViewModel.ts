import { formatConfidenceLabel } from './dashboardViewModel';
import { buildScanTrustViewModel, effectiveScanConfidence } from '../domain/scanTrust';
import type { FoodItem, Meal, MealProofMetadata, NutritionSource } from '../domain/types';

export type ResultTrustItemRow = {
  id: string;
  name: string;
  quantityLabel: string;
  caloriesLabel: string;
  macroLine: string;
  confidenceLabel: string;
  sourceLabel: string;
};

export type ResultTrustViewModel = {
  sourceLabel: string;
  sourceDetail: string;
  confidenceTitle: string;
  proofBadge?: {
    label: string;
    tone: 'green' | 'orange' | 'purple' | 'gray';
  };
  reviewQuestion?: {
    title: string;
    question: string;
  };
  primaryCaloriesLabel: string;
  rangeLabel: string;
  calorieRangeLabel: string;
  macroRanges: {
    protein: string;
    carbs: string;
    fat: string;
  };
  explanationTitle: string;
  explanationBullets: string[];
  items: ResultTrustItemRow[];
};

function sourceLabel(source: NutritionSource, imageUri: string): string {
  if (source === 'mock') {
    return 'Demo mode';
  }

  if (imageUri.startsWith('manual://')) {
    return 'Manual entry';
  }

  if (source === 'open_food_facts' || source === 'nutrition_label_ocr') {
    return 'Product database';
  }

  return 'AI analysis';
}

function sourceDetail(meal: Meal): string {
  if (meal.proof) {
    const sourceList = [...new Set(meal.proof.sources.map((source) => providerLabel(source.provider)))].join(', ');
    const sourceText = sourceList.length > 0 ? sourceList : 'nutrition source';
    return `${sourceText} with ${proofEvidenceLabel(meal.proof.evidenceLevel).toLowerCase()} evidence. Wellness only; not medical guidance.`;
  }

  if (meal.source === 'open_food_facts') {
    return 'Macros come from the product database. Double-check the serving you ate.';
  }

  if (meal.source === 'nutrition_label_ocr') {
    return 'Macros were read from the label. Check the serving and per-100g values.';
  }

  if (meal.imageUri.startsWith('manual://')) {
    return 'Values were entered or corrected manually.';
  }

  if (meal.source === 'mock') {
    return 'Sample result for testing the flow without live AI.';
  }

  return 'Photo estimate with a range. Adjust visible foods before saving.';
}

function foodSourceLabel(source: NutritionSource): string {
  if (source === 'open_food_facts') {
    return 'Open Food Facts';
  }

  if (source === 'nutrition_label_ocr') {
    return 'Label OCR';
  }

  if (source === 'usda') {
    return 'USDA';
  }

  if (source === 'mock') {
    return 'Demo';
  }

  return 'AI estimate';
}

function providerLabel(provider: MealProofMetadata['sources'][number]['provider']): string {
  if (provider === 'USDA_FDC') {
    return 'USDA FoodData Central';
  }

  if (provider === 'OPEN_FOOD_FACTS') {
    return 'Open Food Facts';
  }

  return 'Custom source';
}

function proofEvidenceLabel(evidenceLevel: MealProofMetadata['evidenceLevel']): string {
  if (evidenceLevel === 'VERIFIED_BARCODE_WEIGHT') {
    return 'Barcode + weight';
  }

  if (evidenceLevel === 'VERIFIED_RECIPE_WEIGHT') {
    return 'Weighed recipe';
  }

  if (evidenceLevel === 'VERIFIED_PLATE_WEIGHT') {
    return 'Weighed plate';
  }

  if (evidenceLevel === 'CALIBRATED_TOTAL_WEIGHT') {
    return 'Calibrated';
  }

  if (evidenceLevel === 'RESEARCH_PREDICTED_MASS') {
    return 'Research predicted';
  }

  return 'Estimated';
}

function proofBadge(proof: MealProofMetadata | undefined): ResultTrustViewModel['proofBadge'] {
  if (!proof) {
    return undefined;
  }

  if (proof.status === 'verified') {
    return { label: 'Verified', tone: 'green' };
  }

  if (proof.status === 'calibrated') {
    return { label: 'Calibrated', tone: 'orange' };
  }

  if (proof.status === 'research') {
    return { label: 'Research predicted', tone: 'purple' };
  }

  return { label: 'Estimated', tone: 'gray' };
}

function quantityLabel(item: FoodItem): string {
  if (item.quantityGrams) {
    return `${Math.round(item.quantityGrams.p50)} g p50 (${Math.round(item.quantityGrams.p10)}-${Math.round(item.quantityGrams.p90)} g)`;
  }

  const quantity = Math.round(item.estimatedQuantity * 10) / 10;
  return `${quantity}${item.unit === 'g' ? ' g' : ` ${item.unit}`}`;
}

function caloriesLabel(item: FoodItem): string {
  if (item.calorieQuantiles) {
    return `${Math.round(item.calorieQuantiles.p50)} kcal p50 (${Math.round(item.calorieQuantiles.p10)}-${Math.round(item.calorieQuantiles.p90)} kcal)`;
  }

  return `${item.calories} kcal`;
}

function uncertaintyBullets(meal: Meal): string[] {
  if (meal.proof) {
    const proofBullets = [...meal.proof.warnings, ...meal.proof.explanation].filter((reason) => reason.trim().length > 0);
    if (proofBullets.length > 0) {
      return proofBullets.slice(0, 4);
    }
  }

  const reasons = meal.uncertaintyReasons?.filter((reason) => reason.trim().length > 0) ?? [];
  if (reasons.length > 0) {
    return reasons.slice(0, 3);
  }

  if (meal.confidence === 'high') {
    return ['Foods and portions are readable enough.', 'You can still correct the meal if the real portion differs.'];
  }

  if (meal.confidence === 'medium') {
    return ['Main foods were detected, but one portion may vary.', 'Adjust quantities if the framing was incomplete.'];
  }

  return ['Review visible portions before saving.', 'Add sauce or oil if they are not clearly visible.'];
}

function reviewQuestion(meal: Meal): ResultTrustViewModel['reviewQuestion'] {
  const question = meal.scanReview?.followUpQuestion.trim();
  if (!meal.scanReview?.needsUserQuestion || !question) {
    return undefined;
  }

  return {
    title: 'Quick review',
    question,
  };
}

function buildItemRow(item: FoodItem): ResultTrustItemRow {
  return {
    id: item.id,
    name: item.name,
    quantityLabel: quantityLabel(item),
    caloriesLabel: caloriesLabel(item),
    macroLine: `${item.proteinG}g protein | ${item.carbsG}g carbs | ${item.fatG}g fat`,
    confidenceLabel: formatConfidenceLabel(item.confidence),
    sourceLabel: foodSourceLabel(item.dataSource),
  };
}

function macroRangeLabel(value: number, spread: number): string {
  const low = Math.max(0, Math.round(value * (1 - spread)));
  const high = Math.max(low, Math.round(value * (1 + spread)));
  return `${low}-${high}g`;
}

export function buildResultTrustViewModel(meal: Meal): ResultTrustViewModel {
  const calorieRangeLabel = meal.proof?.kcalRange ? `${meal.proof.kcalRange.min}-${meal.proof.kcalRange.max} kcal` : `${meal.caloriesLow}-${meal.caloriesHigh} kcal`;
  const primaryCaloriesLabel = `${Math.round(meal.caloriesEstimate)} kcal`;
  const confidenceTier = effectiveScanConfidence(meal.confidence, meal.uncertaintyReasons);
  const trust = buildScanTrustViewModel(meal);
  const isManual = meal.imageUri.startsWith('manual://');

  return {
    sourceLabel: sourceLabel(meal.source, meal.imageUri),
    sourceDetail: sourceDetail(meal),
    confidenceTitle: isManual ? 'Manual entry' : confidenceTier === meal.confidence ? formatConfidenceLabel(confidenceTier) : trust.confidenceLabel,
    proofBadge: proofBadge(meal.proof),
    reviewQuestion: reviewQuestion(meal),
    primaryCaloriesLabel,
    rangeLabel: calorieRangeLabel,
    calorieRangeLabel,
    macroRanges: {
      protein: macroRangeLabel(meal.proteinG, 0.08),
      carbs: macroRangeLabel(meal.carbsG, 0.08),
      fat: macroRangeLabel(meal.fatG, 0.14),
    },
    explanationTitle: meal.proof ? 'Why this result?' : 'Why this estimate?',
    explanationBullets: uncertaintyBullets(meal),
    items: meal.items.map(buildItemRow),
  };
}
