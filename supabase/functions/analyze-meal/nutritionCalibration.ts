import type { ConfidenceTier, RawMealAnalysis } from './openaiMealAnalyzer.ts';

type CorrectionType = 'portion_up' | 'portion_down' | 'add_oil' | 'add_sauce' | 'remove_item';

type NutritionProfile = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type CalibratedItem = {
  name: string;
  canonicalFoodName: string;
  estimatedQuantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: ConfidenceTier;
};

export type CalibratedMealAnalysis = {
  mealName: string;
  caloriesEstimate: number;
  caloriesLow: number;
  caloriesHigh: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: ConfidenceTier;
  notes: string;
  items: CalibratedItem[];
  uncertaintyReasons: string[];
  correctionSuggestions: Array<{
    id: string;
    label: string;
    correctionType: CorrectionType;
    targetItemId: string | null;
  }>;
};

const PROFILES: Array<{ patterns: RegExp[]; profile: NutritionProfile }> = [
  { patterns: [/banana|banane/i], profile: { calories: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fiberG: 2.6 } },
  { patterns: [/white rice|cooked rice|riz blanc|riz cuit|sushi rice|riz sushi/i], profile: { calories: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, fiberG: 0.4 } },
  { patterns: [/pasta|pates|spaghetti|penne|tagliatelle/i], profile: { calories: 158, proteinG: 5.8, carbsG: 30.9, fatG: 0.9, fiberG: 1.8 } },
  { patterns: [/salmon|saumon/i], profile: { calories: 208, proteinG: 20.4, carbsG: 0, fatG: 13.4, fiberG: 0 } },
  { patterns: [/tuna|thon/i], profile: { calories: 132, proteinG: 28, carbsG: 0, fatG: 1.3, fiberG: 0 } },
  { patterns: [/chicken|poulet/i], profile: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0 } },
  { patterns: [/tofu/i], profile: { calories: 144, proteinG: 15.7, carbsG: 3.5, fatG: 8.7, fiberG: 2.3 } },
  { patterns: [/beef|boeuf|steak/i], profile: { calories: 250, proteinG: 26, carbsG: 0, fatG: 15, fiberG: 0 } },
  { patterns: [/egg|oeuf/i], profile: { calories: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5, fiberG: 0 } },
  { patterns: [/avocado|avocat/i], profile: { calories: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 } },
  { patterns: [/edamame/i], profile: { calories: 121, proteinG: 11.9, carbsG: 8.9, fatG: 5.2, fiberG: 5.2 } },
  { patterns: [/vegetable|legume|crudite|cucumber|concombre|carrot|carotte/i], profile: { calories: 30, proteinG: 1.8, carbsG: 6, fatG: 0.2, fiberG: 2.2 } },
  { patterns: [/olive oil|huile|\boil\b/i], profile: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 } },
  { patterns: [/sauce|dressing|vinaigrette|mayo|mayonnaise|creamy/i], profile: { calories: 300, proteinG: 1, carbsG: 10, fatG: 28, fiberG: 0 } },
  { patterns: [/cheese|fromage|parmesan|chevre/i], profile: { calories: 380, proteinG: 24, carbsG: 2, fatG: 31, fiberG: 0 } },
  { patterns: [/fries|frites/i], profile: { calories: 312, proteinG: 3.4, carbsG: 41, fatG: 15, fiberG: 3.8 } },
  { patterns: [/bun|pain burger|burger bun/i], profile: { calories: 270, proteinG: 8.7, carbsG: 49, fatG: 4.3, fiberG: 2.3 } },
  { patterns: [/croissant/i], profile: { calories: 406, proteinG: 8.2, carbsG: 45.8, fatG: 21, fiberG: 2.6 } },
];

const AMBIGUOUS_MEAL_CATEGORIES = new Set<RawMealAnalysis['mealCategory']>([
  'poke_bowl',
  'salad',
  'mixed_plate',
  'burger_fries',
  'sandwich',
  'pasta',
]);
const PROTEIN_SOURCE_PATTERN = /salmon|saumon|tuna|thon|chicken|poulet|tofu|beef|boeuf|steak|egg|oeuf|protein/i;

function roundWhole(value: number): number {
  return Math.round(value);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function profileFor(name: string): NutritionProfile | null {
  return PROFILES.find((entry) => entry.patterns.some((pattern) => pattern.test(name)))?.profile ?? null;
}

function computeFromProfile(profile: NutritionProfile, grams: number): NutritionProfile {
  const ratio = grams / 100;
  return {
    calories: profile.calories * ratio,
    proteinG: profile.proteinG * ratio,
    carbsG: profile.carbsG * ratio,
    fatG: profile.fatG * ratio,
    fiberG: profile.fiberG * ratio,
  };
}

function stableProteinAnchor(raw: RawMealAnalysis): number | null {
  if (!AMBIGUOUS_MEAL_CATEGORIES.has(raw.mealCategory)) {
    return null;
  }

  if (raw.portionSize === 'small') {
    return 110;
  }

  if (raw.portionSize === 'large') {
    return 180;
  }

  return 145;
}

function stabilizedQuantity(raw: RawMealAnalysis, item: RawMealAnalysis['items'][number], normalizedName: string): number {
  if (item.unit.toLowerCase() !== 'g' || !PROTEIN_SOURCE_PATTERN.test(normalizedName)) {
    return item.estimatedQuantity;
  }

  const anchor = stableProteinAnchor(raw);
  if (!anchor) {
    return item.estimatedQuantity;
  }

  const lowerBound = anchor * 0.65;
  const upperBound = anchor * 1.35;
  if (item.estimatedQuantity < lowerBound || item.estimatedQuantity > upperBound) {
    return item.estimatedQuantity;
  }

  return anchor;
}

function rawItemToCalibratedItem(raw: RawMealAnalysis, item: RawMealAnalysis['items'][number]): CalibratedItem {
  const normalizedName = `${item.canonicalFoodName} ${item.name}`;
  const estimatedQuantity = stabilizedQuantity(raw, item, normalizedName);
  const profile = item.unit.toLowerCase() === 'g' ? profileFor(normalizedName) : null;
  const macros = profile ? computeFromProfile(profile, estimatedQuantity) : item;

  return {
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: roundMacro(estimatedQuantity),
    unit: item.unit,
    calories: roundWhole(macros.calories),
    proteinG: roundMacro(macros.proteinG),
    carbsG: roundMacro(macros.carbsG),
    fatG: roundMacro(macros.fatG),
    fiberG: roundMacro(macros.fiberG),
    confidence: item.confidence,
  };
}

function addProfileItem(
  items: CalibratedItem[],
  params: {
    name: string;
    canonicalFoodName: string;
    grams: number;
    confidence: ConfidenceTier;
  },
): void {
  const profile = profileFor(`${params.canonicalFoodName} ${params.name}`);
  if (!profile) {
    return;
  }

  const macros = computeFromProfile(profile, params.grams);
  items.push({
    name: params.name,
    canonicalFoodName: params.canonicalFoodName,
    estimatedQuantity: roundMacro(params.grams),
    unit: 'g',
    calories: roundWhole(macros.calories),
    proteinG: roundMacro(macros.proteinG),
    carbsG: roundMacro(macros.carbsG),
    fatG: roundMacro(macros.fatG),
    fiberG: roundMacro(macros.fiberG),
    confidence: params.confidence,
  });
}

function ensureMinimumItemGrams(items: CalibratedItem[], pattern: RegExp, grams: number): boolean {
  const item = items.find((candidate) => pattern.test(`${candidate.canonicalFoodName} ${candidate.name}`));
  if (!item || item.unit.toLowerCase() !== 'g' || item.estimatedQuantity >= grams) {
    return false;
  }

  const profile = profileFor(`${item.canonicalFoodName} ${item.name}`);
  if (!profile) {
    return false;
  }

  const macros = computeFromProfile(profile, grams);
  item.estimatedQuantity = roundMacro(grams);
  item.calories = roundWhole(macros.calories);
  item.proteinG = roundMacro(macros.proteinG);
  item.carbsG = roundMacro(macros.carbsG);
  item.fatG = roundMacro(macros.fatG);
  item.fiberG = roundMacro(macros.fiberG);
  item.confidence = 'low';
  return true;
}

function sumItems(items: CalibratedItem[]) {
  return {
    caloriesEstimate: roundWhole(items.reduce((sum, item) => sum + item.calories, 0)),
    proteinG: roundMacro(items.reduce((sum, item) => sum + item.proteinG, 0)),
    carbsG: roundMacro(items.reduce((sum, item) => sum + item.carbsG, 0)),
    fatG: roundMacro(items.reduce((sum, item) => sum + item.fatG, 0)),
    fiberG: roundMacro(items.reduce((sum, item) => sum + item.fiberG, 0)),
  };
}

function hasItem(items: CalibratedItem[], pattern: RegExp): boolean {
  return items.some((item) => pattern.test(`${item.canonicalFoodName} ${item.name}`));
}

function applyPokeBowlRules(raw: RawMealAnalysis, items: CalibratedItem[], reasons: string[]): ConfidenceTier {
  if (raw.mealCategory !== 'poke_bowl') {
    return raw.confidence;
  }

  const riceFloor = raw.portionSize === 'large' ? 280 : raw.portionSize === 'small' ? 170 : 220;
  const proteinFloor = raw.portionSize === 'large' ? 160 : raw.portionSize === 'small' ? 100 : 130;

  if (!hasItem(items, /rice|riz/i)) {
    addProfileItem(items, {
      name: 'Base riz estimee',
      canonicalFoodName: 'cooked white rice',
      grams: riceFloor,
      confidence: 'low',
    });
  } else {
    ensureMinimumItemGrams(items, /rice|riz/i, riceFloor);
  }

  ensureMinimumItemGrams(
    items,
    /salmon|saumon|tuna|thon|chicken|poulet|tofu|beef|boeuf|steak|egg|oeuf|protein/i,
    proteinFloor,
  );

  if (hasItem(items, /avocado|avocat/i)) {
    ensureMinimumItemGrams(items, /avocado|avocat/i, 70);
  }

  if (!hasItem(items, /sauce|dressing|vinaigrette|mayo|mayonnaise|creamy/i)) {
    addProfileItem(items, {
      name: 'Sauce estimee',
      canonicalFoodName: 'creamy sauce',
      grams: raw.portionSize === 'large' ? 45 : 35,
      confidence: 'low',
    });
  }

  const totals = sumItems(items);
  const floor = raw.portionSize === 'small' ? 650 : raw.portionSize === 'large' ? 880 : 780;
  if (totals.caloriesEstimate < floor) {
    addProfileItem(items, {
      name: 'Toppings et assaisonnement estimes',
      canonicalFoodName: 'creamy sauce',
      grams: Math.ceil(((floor - totals.caloriesEstimate) / 300) * 100),
      confidence: 'low',
    });
  }

  if (!reasons.includes('poke_bowl_hidden_rice_or_sauce')) {
    reasons.push('poke_bowl_hidden_rice_or_sauce');
  }

  return 'low';
}

function confidenceRange(confidence: ConfidenceTier, hiddenRiskCount: number) {
  if (confidence === 'high') {
    return { low: 0.92, high: 1.1 };
  }

  if (confidence === 'medium') {
    return { low: 0.85, high: hiddenRiskCount > 0 ? 1.25 : 1.18 };
  }

  return { low: 0.75, high: hiddenRiskCount > 0 ? 1.35 : 1.28 };
}

function mergeConfidence(a: ConfidenceTier, b: ConfidenceTier): ConfidenceTier {
  if (a === 'low' || b === 'low') {
    return 'low';
  }
  if (a === 'medium' || b === 'medium') {
    return 'medium';
  }
  return 'high';
}

export function isNonFoodAnalysis(raw: RawMealAnalysis): boolean {
  return !raw.isFoodPhoto || raw.items.length === 0;
}

export function calibrateMealAnalysis(raw: RawMealAnalysis): CalibratedMealAnalysis {
  const items = raw.items.map((item) => rawItemToCalibratedItem(raw, item));
  const uncertaintyReasons = [...raw.uncertaintyReasons];
  let confidence = raw.confidence;

  confidence = mergeConfidence(confidence, applyPokeBowlRules(raw, items, uncertaintyReasons));

  const totals = sumItems(items);
  const range = confidenceRange(confidence, raw.hiddenCalorieRisks.length);

  const correctionSuggestions: CalibratedMealAnalysis['correctionSuggestions'] = [
    { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: null },
    { id: 'portion-down', label: 'Portion -15%', correctionType: 'portion_down', targetItemId: null },
  ];

  const hiddenRiskText = raw.hiddenCalorieRisks.join(' ').toLowerCase();
  if (/oil|huile/.test(hiddenRiskText)) {
    correctionSuggestions.push({ id: 'add-oil', label: 'Huile ajoutee', correctionType: 'add_oil', targetItemId: null });
  }
  if (/sauce|dressing|vinaigrette/.test(hiddenRiskText) || raw.mealCategory === 'poke_bowl') {
    correctionSuggestions.push({ id: 'add-sauce', label: 'Sauce ajoutee', correctionType: 'add_sauce', targetItemId: null });
  }

  return {
    mealName: raw.mealName || 'Repas analyse',
    caloriesEstimate: totals.caloriesEstimate,
    caloriesLow: roundWhole(totals.caloriesEstimate * range.low),
    caloriesHigh: roundWhole(totals.caloriesEstimate * range.high),
    proteinG: totals.proteinG,
    carbsG: totals.carbsG,
    fatG: totals.fatG,
    fiberG: totals.fiberG,
    confidence,
    notes: 'Estimated by AI vision and MacroLens nutrition calibration.',
    items,
    uncertaintyReasons,
    correctionSuggestions,
  };
}
