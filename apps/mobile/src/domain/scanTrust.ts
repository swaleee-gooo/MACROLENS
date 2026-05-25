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
  confidenceLabel: string;
  calorieRangeLabel: string;
  proteinLabel: string;
  prompts: string[];
};

function confidenceLabel(confidence: ConfidenceTier): string {
  if (confidence === 'high') {
    return 'Haute confiance';
  }

  if (confidence === 'medium') {
    return 'A verifier';
  }

  return 'Estimation prudente';
}

export function buildScanTrustViewModel(meal: MealTrustInput): ScanTrustViewModel {
  const uncertaintyReasons = meal.uncertaintyReasons ?? [];
  const correctionSuggestions = meal.correctionSuggestions ?? [];
  const prompts = new Set<string>();

  if (meal.confidence === 'low') {
    prompts.add('Portion plus grande que prevu ?');
  }

  if (uncertaintyReasons.some((reason) => /sauce|oil|huile|hidden|cache/i.test(reason))) {
    prompts.add('Sauce ou huile visible ?');
  }

  if (correctionSuggestions.some((suggestion) => suggestion.correctionType === 'add_sauce')) {
    prompts.add('Ajouter une sauce');
  }

  return {
    confidenceLabel: confidenceLabel(meal.confidence),
    calorieRangeLabel: `${meal.caloriesLow}-${meal.caloriesHigh} kcal`,
    proteinLabel: `${Math.round(meal.proteinG)}g proteines`,
    prompts: Array.from(prompts),
  };
}
