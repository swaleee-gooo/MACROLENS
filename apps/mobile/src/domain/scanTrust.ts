import type { ConfidenceTier, CorrectionSuggestion } from './types';

type MealTrustInput = {
  caloriesEstimate: number;
  caloriesLow: number;
  caloriesHigh: number;
  proteinG: number;
  confidence: ConfidenceTier;
  uncertaintyReasons?: string[];
  correctionSuggestions?: CorrectionSuggestion[];
};

export type ScanTrustViewModel = {
  confidenceTier: ConfidenceTier;
  confidenceLabel: string;
  calorieRangeLabel: string;
  proteinLabel: string;
  prompts: string[];
};

function confidenceLabel(confidence: ConfidenceTier): string {
  if (confidence === 'high') {
    return 'High confidence';
  }

  if (confidence === 'medium') {
    return 'Needs review';
  }

  return 'Conservative estimate';
}

function hasAmbiguousHiddenCalories(uncertaintyReasons: string[]): boolean {
  return uncertaintyReasons.some((reason) => /sauce|oil|huile|cheese|fromage|hidden|cache|salad|salade|mixed|mixte|restaurant|portion/i.test(reason));
}

function hasPackagedFoodSignal(uncertaintyReasons: string[]): boolean {
  return uncertaintyReasons.some((reason) => /packaged|package|barcode|label|nutrition table|industrial|emballe|etiquette|produit/i.test(reason));
}

export function effectiveScanConfidence(confidence: ConfidenceTier, uncertaintyReasons: string[] = []): ConfidenceTier {
  if (confidence === 'high' && (hasAmbiguousHiddenCalories(uncertaintyReasons) || hasPackagedFoodSignal(uncertaintyReasons))) {
    return 'medium';
  }

  return confidence;
}

export function buildScanTrustViewModel(meal: MealTrustInput): ScanTrustViewModel {
  const uncertaintyReasons = meal.uncertaintyReasons ?? [];
  const correctionSuggestions = meal.correctionSuggestions ?? [];
  const confidenceTier = effectiveScanConfidence(meal.confidence, uncertaintyReasons);
  let primaryPrompt: string | null = null;

  if (hasPackagedFoodSignal(uncertaintyReasons)) {
    primaryPrompt = 'Scan barcode or label instead?';
  } else if (hasAmbiguousHiddenCalories(uncertaintyReasons)) {
    primaryPrompt = 'Sauce, oil, or cheese added?';
  } else if (confidenceTier === 'low') {
    primaryPrompt = 'Bigger portion than expected?';
  } else if (correctionSuggestions.some((suggestion) => suggestion.correctionType === 'add_sauce')) {
    primaryPrompt = 'Add sauce';
  }

  return {
    confidenceTier,
    confidenceLabel: confidenceLabel(confidenceTier),
    calorieRangeLabel: `${meal.caloriesLow}-${meal.caloriesHigh} kcal`,
    proteinLabel: `${Math.round(meal.proteinG)}g protein`,
    prompts: primaryPrompt ? [primaryPrompt] : [],
  };
}
