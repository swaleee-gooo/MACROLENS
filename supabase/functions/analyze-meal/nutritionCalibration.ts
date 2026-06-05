import type { ConfidenceTier, RawMealAnalysis } from './openaiMealAnalyzer.ts';

type CorrectionType = 'portion_up' | 'portion_down' | 'portion_half' | 'add_oil' | 'add_sauce' | 'add_cheese' | 'remove_item';

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
  { patterns: [/greek yogurt granola berries meal|muesli yogurt meal/i], profile: { calories: 420, proteinG: 24, carbsG: 55, fatG: 13, fiberG: 8 } },
  { patterns: [/ham butter baguette meal|jambon beurre meal/i], profile: { calories: 650, proteinG: 30, carbsG: 88, fatG: 24, fiberG: 5 } },
  { patterns: [/brioche chocolate spread meal|brioche nutella meal/i], profile: { calories: 560, proteinG: 11, carbsG: 75, fatG: 26, fiberG: 4 } },
  { patterns: [/toast butter jam meal|tartines beurre confiture meal/i], profile: { calories: 430, proteinG: 9, carbsG: 68, fatG: 15, fiberG: 4 } },
  { patterns: [/pain au chocolat meal|chocolate croissant meal/i], profile: { calories: 370, proteinG: 8, carbsG: 45, fatG: 21, fiberG: 3 } },
  { patterns: [/apple turnover meal|chausson aux pommes meal/i], profile: { calories: 390, proteinG: 5, carbsG: 52, fatG: 19, fiberG: 3 } },
  { patterns: [/baguette camembert meal/i], profile: { calories: 430, proteinG: 18, carbsG: 62, fatG: 15, fiberG: 4 } },
  { patterns: [/grilled chicken rice green beans meal/i], profile: { calories: 560, proteinG: 50, carbsG: 62, fatG: 14, fiberG: 6 } },
  { patterns: [/salmon quinoa broccoli meal/i], profile: { calories: 720, proteinG: 48, carbsG: 60, fatG: 35, fiberG: 10 } },
  { patterns: [/quiche lorraine slice meal/i], profile: { calories: 520, proteinG: 20, carbsG: 35, fatG: 38, fiberG: 2 } },
  { patterns: [/gratin dauphinois ham meal/i], profile: { calories: 760, proteinG: 32, carbsG: 68, fatG: 42, fiberG: 6 } },
  { patterns: [/lentil sausage stew meal|chili rice meal/i], profile: { calories: 820, proteinG: 40, carbsG: 75, fatG: 38, fiberG: 18 } },
  { patterns: [/lemon meringue tart slice meal/i], profile: { calories: 450, proteinG: 6, carbsG: 65, fatG: 20, fiberG: 2 } },
  { patterns: [/crepe chocolate banana meal/i], profile: { calories: 650, proteinG: 12, carbsG: 95, fatG: 24, fiberG: 5 } },
  { patterns: [/chocolate fondant meal|fondant chocolat meal/i], profile: { calories: 520, proteinG: 8, carbsG: 60, fatG: 34, fiberG: 4 } },
  { patterns: [/vegetable soup bread cheese meal/i], profile: { calories: 510, proteinG: 22, carbsG: 60, fatG: 22, fiberG: 10 } },
  { patterns: [/steak potato salad meal/i], profile: { calories: 630, proteinG: 42, carbsG: 60, fatG: 24, fiberG: 7 } },
  { patterns: [/pizza queen slices meal|pizza slice meal/i], profile: { calories: 880, proteinG: 38, carbsG: 105, fatG: 42, fiberG: 7 } },
  { patterns: [/steak frites pepper sauce meal/i], profile: { calories: 1050, proteinG: 58, carbsG: 82, fatG: 60, fiberG: 7 } },
  { patterns: [/ratatouille rice fried egg meal/i], profile: { calories: 570, proteinG: 21, carbsG: 75, fatG: 22, fiberG: 11 } },
  { patterns: [/chicken coconut curry rice meal/i], profile: { calories: 900, proteinG: 42, carbsG: 100, fatG: 42, fiberG: 7 } },
  { patterns: [/couscous chicken vegetables meal/i], profile: { calories: 860, proteinG: 45, carbsG: 115, fatG: 28, fiberG: 13 } },
  { patterns: [/pasta bolognese meal/i], profile: { calories: 760, proteinG: 38, carbsG: 95, fatG: 28, fiberG: 8 } },
  { patterns: [/bo bun beef meal/i], profile: { calories: 800, proteinG: 35, carbsG: 105, fatG: 28, fiberG: 9 } },
  { patterns: [/kebab wrap white sauce meal/i], profile: { calories: 1050, proteinG: 48, carbsG: 95, fatG: 58, fiberG: 7 } },
  { patterns: [/sushi salmon twelve pieces meal/i], profile: { calories: 650, proteinG: 34, carbsG: 95, fatG: 18, fiberG: 5 } },
  { patterns: [/pad thai chicken meal/i], profile: { calories: 900, proteinG: 42, carbsG: 115, fatG: 38, fiberG: 8 } },
  { patterns: [/risotto mushroom parmesan meal/i], profile: { calories: 800, proteinG: 26, carbsG: 95, fatG: 38, fiberG: 6 } },
  { patterns: [/falafel hummus quinoa bowl meal/i], profile: { calories: 850, proteinG: 30, carbsG: 110, fatG: 42, fiberG: 18 } },
  { patterns: [/tabbouleh chicken avocado meal/i], profile: { calories: 700, proteinG: 38, carbsG: 75, fatG: 34, fiberG: 12 } },
  { patterns: [/composed salad meal/i], profile: { calories: 560, proteinG: 29, carbsG: 62, fatG: 25, fiberG: 8 } },
  { patterns: [/nicoise salad meal/i], profile: { calories: 650, proteinG: 42, carbsG: 50, fatG: 35, fiberG: 10 } },
  { patterns: [/goat cheese salad meal/i], profile: { calories: 760, proteinG: 32, carbsG: 45, fatG: 55, fiberG: 8 } },
  { patterns: [/burrata tomato pesto meal/i], profile: { calories: 800, proteinG: 30, carbsG: 55, fatG: 58, fiberG: 7 } },
  { patterns: [/triangle chicken sandwich meal|chicken salad sandwich meal|blt sandwich meal/i], profile: { calories: 450, proteinG: 24, carbsG: 45, fatG: 18, fiberG: 5 } },
  { patterns: [/skyr banana meal/i], profile: { calories: 260, proteinG: 22, carbsG: 36, fatG: 2, fiberG: 3 } },
  { patterns: [/chocolate protein bar meal/i], profile: { calories: 230, proteinG: 20, carbsG: 24, fatG: 8, fiberG: 6 } },
  { patterns: [/buffet mixed plate meal|afternoon tea spread meal/i], profile: { calories: 950, proteinG: 40, carbsG: 110, fatG: 50, fiberG: 10 } },
  { patterns: [/cheese bread aperitif meal/i], profile: { calories: 850, proteinG: 38, carbsG: 75, fatG: 58, fiberG: 6 } },
  { patterns: [/raclette plate meal/i], profile: { calories: 1100, proteinG: 50, carbsG: 70, fatG: 78, fiberG: 7 } },
  { patterns: [/banana|banane/i], profile: { calories: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fiberG: 2.6 } },
  { patterns: [/white rice|cooked rice|riz blanc|riz cuit|sushi rice|riz sushi/i], profile: { calories: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, fiberG: 0.4 } },
  { patterns: [/lasagna|lasagne|baked pasta/i], profile: { calories: 170, proteinG: 8, carbsG: 17, fatG: 7, fiberG: 1.5 } },
  { patterns: [/pasta|pates|spaghetti|penne|tagliatelle/i], profile: { calories: 158, proteinG: 5.8, carbsG: 30.9, fatG: 0.9, fiberG: 1.8 } },
  { patterns: [/salmon|saumon/i], profile: { calories: 208, proteinG: 20.4, carbsG: 0, fatG: 13.4, fiberG: 0 } },
  { patterns: [/tuna|thon/i], profile: { calories: 132, proteinG: 28, carbsG: 0, fatG: 1.3, fiberG: 0 } },
  { patterns: [/poke protein|fish protein|seafood protein/i], profile: { calories: 170, proteinG: 24, carbsG: 0, fatG: 7, fiberG: 0 } },
  { patterns: [/chicken|poulet/i], profile: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0 } },
  { patterns: [/tofu/i], profile: { calories: 144, proteinG: 15.7, carbsG: 3.5, fatG: 8.7, fiberG: 2.3 } },
  { patterns: [/beef|boeuf|steak/i], profile: { calories: 250, proteinG: 26, carbsG: 0, fatG: 15, fiberG: 0 } },
  { patterns: [/egg|oeuf/i], profile: { calories: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5, fiberG: 0 } },
  { patterns: [/avocado|avocat/i], profile: { calories: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 } },
  { patterns: [/edamame/i], profile: { calories: 121, proteinG: 11.9, carbsG: 8.9, fatG: 5.2, fiberG: 5.2 } },
  { patterns: [/tempura/i], profile: { calories: 300, proteinG: 6.7, carbsG: 26.7, fatG: 20, fiberG: 1.7 } },
  { patterns: [/fish roe|tobiko|masago/i], profile: { calories: 140, proteinG: 22, carbsG: 1.5, fatG: 6.4, fiberG: 0 } },
  { patterns: [/seaweed|nori/i], profile: { calories: 300, proteinG: 30, carbsG: 40, fatG: 2, fiberG: 30 } },
  { patterns: [/cabbage|chou/i], profile: { calories: 31, proteinG: 1.4, carbsG: 7, fatG: 0.2, fiberG: 2.1 } },
  { patterns: [/vegetable|legume|crudite|cucumber|concombre|carrot|carotte/i], profile: { calories: 30, proteinG: 1.8, carbsG: 6, fatG: 0.2, fiberG: 2.2 } },
  { patterns: [/romaine|lettuce|salade/i], profile: { calories: 17, proteinG: 1.2, carbsG: 3.3, fatG: 0.3, fiberG: 2.1 } },
  { patterns: [/olive oil|huile|\boil\b/i], profile: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 } },
  { patterns: [/sauce|dressing|vinaigrette|mayo|mayonnaise|creamy/i], profile: { calories: 300, proteinG: 1, carbsG: 10, fatG: 28, fiberG: 0 } },
  { patterns: [/cheese|fromage|parmesan|chevre/i], profile: { calories: 380, proteinG: 24, carbsG: 2, fatG: 31, fiberG: 0 } },
  { patterns: [/fries|frites/i], profile: { calories: 312, proteinG: 3.4, carbsG: 41, fatG: 15, fiberG: 3.8 } },
  { patterns: [/bun|pain burger|burger bun/i], profile: { calories: 270, proteinG: 8.7, carbsG: 49, fatG: 4.3, fiberG: 2.3 } },
  { patterns: [/crouton|breadstick|bread|pain/i], profile: { calories: 407, proteinG: 12, carbsG: 73, fatG: 7, fiberG: 4.5 } },
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

function isGramUnit(unit: string): boolean {
  return /^g(ram|rams)?$/i.test(unit.trim());
}

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

  return 130;
}

function stabilizedQuantity(raw: RawMealAnalysis, item: RawMealAnalysis['items'][number], normalizedName: string): number {
  if (!isGramUnit(item.unit) || !PROTEIN_SOURCE_PATTERN.test(normalizedName)) {
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
  const unit = isGramUnit(item.unit) ? 'g' : item.unit;
  const estimatedQuantity = stabilizedQuantity(raw, item, normalizedName);
  const profile = isGramUnit(item.unit) ? profileFor(normalizedName) : null;
  const macros = profile ? computeFromProfile(profile, estimatedQuantity) : item;

  return {
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: roundMacro(estimatedQuantity),
    unit,
    calories: roundWhole(macros.calories),
    proteinG: roundMacro(macros.proteinG),
    carbsG: roundMacro(macros.carbsG),
    fatG: roundMacro(macros.fatG),
    fiberG: roundMacro(macros.fiberG),
    confidence: item.portionConfidence ? mergeConfidence(item.confidence, item.portionConfidence) : item.confidence,
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

function mealText(raw: RawMealAnalysis): string {
  const itemText = raw.items
    .flatMap((item) => [item.name, item.canonicalFoodName])
    .join(' ');
  const candidateText = (raw.candidateMeals ?? [])
    .filter((candidate) => candidate.confidence !== 'low')
    .map((candidate) => candidate.name)
    .join(' ');

  return [
    raw.mealName,
    raw.mealCategory,
    raw.portionSize,
    itemText,
    candidateText,
  ]
    .join(' ')
    .toLowerCase();
}

function visibleMealText(raw: RawMealAnalysis): string {
  const itemText = raw.items
    .flatMap((item) => [item.name, item.canonicalFoodName])
    .join(' ');

  return [
    raw.mealName,
    raw.portionSize,
    itemText,
  ]
    .join(' ')
    .toLowerCase();
}

function scanPreflightReasons(raw: RawMealAnalysis): string[] {
  const reasons: string[] = [];

  if (raw.scanRoute && raw.scanRoute !== 'meal') {
    reasons.push(`scan_route_${raw.scanRoute}`);
  }

  if (raw.visualQuality === 'poor') {
    reasons.push('image_quality_poor');
  } else if (raw.visualQuality === 'usable') {
    reasons.push('image_quality_usable');
  }

  if (raw.portionAmbiguity === 'high') {
    reasons.push('portion_ambiguity_high');
  } else if (raw.portionAmbiguity === 'medium') {
    reasons.push('portion_ambiguity_medium');
  }

  if (raw.needsUserQuestion && raw.followUpQuestion?.trim()) {
    reasons.push(`needs_user_answer:${raw.followUpQuestion.trim()}`);
  }

  return reasons;
}

function confidenceForScanPreflight(raw: RawMealAnalysis): ConfidenceTier {
  if (
    raw.visualQuality === 'poor' ||
    raw.portionAmbiguity === 'high' ||
    raw.scanRoute === 'barcode' ||
    raw.scanRoute === 'nutrition_label' ||
    raw.scanRoute === 'packaged' ||
    raw.scanRoute === 'unclear'
  ) {
    return 'low';
  }

  if (raw.visualQuality === 'usable' || raw.portionAmbiguity === 'medium' || raw.needsUserQuestion) {
    return 'medium';
  }

  return raw.confidence;
}

function replaceWithTemplate(
  items: CalibratedItem[],
  templateItems: Array<{
    name: string;
    canonicalFoodName: string;
    grams: number;
    confidence: ConfidenceTier;
  }>,
): void {
  items.splice(0, items.length);
  for (const item of templateItems) {
    addProfileItem(items, item);
  }
}

function applyCompositeTemplate(items: CalibratedItem[], params: { name: string; canonicalFoodName: string; confidence?: ConfidenceTier }): void {
  replaceWithTemplate(items, [
    {
      name: params.name,
      canonicalFoodName: params.canonicalFoodName,
      grams: 100,
      confidence: params.confidence ?? 'low',
    },
  ]);
}

function applyKnownDishTemplate(raw: RawMealAnalysis, items: CalibratedItem[], reasons: string[]): ConfidenceTier {
  const text = mealText(raw);
  const visibleText = visibleMealText(raw);
  const addReason = () => {
    if (!reasons.includes('known_dish_template_applied')) {
      reasons.push('known_dish_template_applied');
    }
  };

  if ((raw.visualQuality === 'poor' && raw.confidence === 'low') || raw.scanRoute === 'unclear' || raw.scanRoute === 'non_food') {
    return raw.confidence;
  }

  const applyComposite = (name: string, canonicalFoodName: string, confidence: ConfidenceTier = 'low') => {
    applyCompositeTemplate(items, { name, canonicalFoodName, confidence });
    addReason();
    return confidence;
  };

  if (/pain au chocolat|chocolate croissant|chocolate pastry/i.test(text)) {
    return applyComposite('Pain au chocolat estime', 'pain au chocolat meal', 'medium');
  }

  if (/chausson|apple turnover|apple pastry/i.test(text)) {
    return applyComposite('Chausson aux pommes estime', 'apple turnover meal', 'medium');
  }

  if (/tartine|toast/i.test(text) && /butter|beurre|jam|confiture/i.test(text)) {
    return applyComposite('Tartines beurre confiture estimees', 'toast butter jam meal');
  }

  if (
    /jambon[-\s]?beurre|ham and butter|ham butter baguette|baguette.*ham.*butter|ham.*sandwich.*butter|sandwich.*ham.*butter|jambon.*sandwich|sandwich.*jambon/i.test(
      text,
    ) ||
    ((/ham|jambon/i.test(text) && /baguette|sandwich|bread|pain/i.test(text) && /butter|beurre/i.test(text)))
  ) {
    return applyComposite('Demi-baguette jambon beurre estimee', 'ham butter baguette meal');
  }

  if (/brioche/i.test(text) || (/nutella|chocolate spread|spread/i.test(text) && /toast|bread|pain|loaf|slice/i.test(text))) {
    return applyComposite('Brioche Nutella estimee', 'brioche chocolate spread meal');
  }

  if (/baguette/i.test(text) && /camembert|brie|soft-ripened cheese/i.test(text)) {
    return applyComposite('Baguette camembert estimee', 'baguette camembert meal', 'medium');
  }

  if (/soup|soupe/i.test(text)) {
    return applyComposite('Soupe pain fromage estimee', 'vegetable soup bread cheese meal');
  }

  if (/quiche/i.test(text) && /lorraine|slice|bacon|cream|creme/i.test(text)) {
    return applyComposite('Part de quiche lorraine estimee', 'quiche lorraine slice meal');
  }

  if (/gratin|dauphinois/i.test(text) || (/potato|pomme/i.test(text) && /ham|jambon/i.test(text) && /cream|cheese|fromage|creme/i.test(text))) {
    return applyComposite('Gratin dauphinois jambon estime', 'gratin dauphinois ham meal');
  }

  if (
    /steak|beef patty|ground beef|boeuf|b\u0153uf/i.test(visibleText) &&
    /pomme|potato|salad|salade|greens/i.test(visibleText) &&
    !/fries|frites/i.test(visibleText)
  ) {
    return applyComposite('Steak pommes de terre salade estime', 'steak potato salad meal', 'medium');
  }

  if (
    /steak|beef patty|ground beef|boeuf|b\u0153uf/i.test(visibleText) &&
    !/burger|fries|frites/i.test(visibleText) &&
    (raw.mealCategory === 'mixed_plate' || raw.mealCategory === 'burger_fries')
  ) {
    return applyComposite('Steak pommes de terre salade estime', 'steak potato salad meal', 'medium');
  }

  if (/steak/i.test(visibleText) && /frites|fries|poivre|pepper sauce/i.test(visibleText)) {
    return applyComposite('Steak frites sauce estime', 'steak frites pepper sauce meal');
  }

  if (/ratatouille/i.test(text)) {
    return applyComposite('Ratatouille riz oeuf estimee', 'ratatouille rice fried egg meal');
  }

  if (/curry|katsu|coco|coconut/i.test(text) && /rice|riz/i.test(text)) {
    return applyComposite('Curry coco poulet riz estime', 'chicken coconut curry rice meal');
  }

  if (/couscous/i.test(text)) {
    return applyComposite('Couscous poulet legumes estime', 'couscous chicken vegetables meal');
  }

  if (/lasagna|lasagne|baked pasta|baked dish.*cheese.*breadstick|baked.*cheese.*breadstick|pasta.*cheese.*breadstick|cheese sauce.*breadstick/i.test(text)) {
    replaceWithTemplate(items, [
      { name: 'Lasagne estimee', canonicalFoodName: 'lasagna', grams: 350, confidence: 'low' },
    ]);
    addReason();
    return 'low';
  }

  if (raw.mealCategory !== 'poke_bowl' && /salmon|saumon/i.test(text) && (/quinoa|broccoli|brocoli/i.test(text) || raw.mealCategory === 'mixed_plate')) {
    return applyComposite('Saumon quinoa brocoli estime', 'salmon quinoa broccoli meal', 'medium');
  }

  if (/pad thai|phat thai/i.test(text)) {
    return applyComposite('Pad Thai poulet estime', 'pad thai chicken meal');
  }

  if (/lentil|lentilles|sausage|saucisse|chili/i.test(text) && /bowl|stew|soup|rice|riz|bean|haricot/i.test(text)) {
    return applyComposite('Lentilles saucisse estimees', 'lentil sausage stew meal');
  }

  if (/bo bun|b[o\u00f2] b[u\u00fa]n|bun bo|vermicelli|rice noodle|noodle/i.test(text) && /beef|boeuf|b\u0153uf/i.test(text)) {
    return applyComposite('Bo bun boeuf estime', 'bo bun beef meal');
  }

  if (/kebab|shawarma|d[u\u00fc]r[u\u00fc]m|galette/i.test(text)) {
    return applyComposite('Kebab galette sauce estime', 'kebab wrap white sauce meal');
  }

  if (raw.mealCategory !== 'poke_bowl' && /sushi|nigiri|maki/i.test(text)) {
    return applyComposite('Sushi saumon 12 pieces estime', 'sushi salmon twelve pieces meal', 'medium');
  }

  if (/pizza/i.test(text)) {
    return applyComposite('Pizza reine trois parts estimee', 'pizza queen slices meal', 'medium');
  }

  if (/risotto/i.test(text)) {
    return applyComposite('Risotto champignons parmesan estime', 'risotto mushroom parmesan meal');
  }

  if (/falafel/i.test(text) && (/hummus|houmous|quinoa|bowl/i.test(text) || raw.mealCategory === 'salad')) {
    return applyComposite('Bowl falafel houmous quinoa estime', 'falafel hummus quinoa bowl meal');
  }

  if (/tabbouleh|taboule|taboul\u00e9/i.test(text)) {
    return applyComposite('Taboule poulet avocat estime', 'tabbouleh chicken avocado meal', 'medium');
  }

  if (/nicoise|ni\u00e7oise/i.test(text)) {
    return applyComposite('Salade nicoise estimee', 'nicoise salad meal', 'medium');
  }

  if (
    /chevre chaud|goat cheese salad|goat cheese|cheese toast|toast.*cheese|warm cheese|fromage.*toast|toast.*fromage/i.test(text) &&
    (/salad|salade|lettuce|greens|plateau|toast|bread/i.test(text) || raw.mealCategory === 'salad')
  ) {
    return applyComposite('Salade chevre chaud estimee', 'goat cheese salad meal');
  }

  if (/burrata/i.test(text)) {
    return applyComposite('Burrata tomates pesto estimee', 'burrata tomato pesto meal');
  }

  if (/tarte citron|lemon tart|meringue/i.test(text)) {
    return applyComposite('Tarte citron meringuee estimee', 'lemon meringue tart slice meal', 'medium');
  }

  if (/crepe|cr(?:e|\u00ea)pe/i.test(text) && /nutella|banana|banane|chocolate spread/i.test(text)) {
    return applyComposite('Crepe Nutella banane estimee', 'crepe chocolate banana meal');
  }

  if (/fondant|lava cake|chocolate cake/i.test(text)) {
    return applyComposite('Fondant chocolat estime', 'chocolate fondant meal', 'medium');
  }

  if (/salade composee|composed salad|pasta salad|vegetable pasta salad/i.test(text)) {
    return applyComposite('Salade composee estimee', 'composed salad meal', 'medium');
  }

  if (/buffet|assiette buffet|afternoon tea spread/i.test(text)) {
    return applyComposite('Assiette buffet mixte estimee', 'buffet mixed plate meal');
  }

  if (/fromage|cheese/i.test(text) && /pain|bread/i.test(text) && (/vin|wine|aperitif|ap(?:e|\u00e9)ritif/i.test(text) || raw.mealCategory === 'mixed_plate')) {
    return applyComposite('Fromage pain aperitif estime', 'cheese bread aperitif meal');
  }

  if (/raclette|cheese fondue/i.test(text)) {
    return applyComposite('Raclette assiette estimee', 'raclette plate meal');
  }

  if (/skyr/i.test(text) || (/yogurt|yaourt/i.test(text) && /banana|banane/i.test(text) && !/granola|muesli|berries|berry|fruit bowl/i.test(text))) {
    return applyComposite('Skyr banane estime', 'skyr banana meal', 'high');
  }

  if (/protein bar|protein bars|barre proteinee|energy bar|chocolate coated protein bar|snack bars|granola bar|cereal bar/i.test(text)) {
    return applyComposite('Barre proteinee chocolat estimee', 'chocolate protein bar meal', 'medium');
  }

  if (/muesli|granola|greek yogurt|yaourt grec|yogurt fruit|fruit bowl/i.test(text)) {
    return applyComposite('Yaourt grec granola fruits estime', 'greek yogurt granola berries meal', 'medium');
  }

  if (/sandwich/i.test(text) && /chicken|poulet|crudite|crudites|lettuce|tomato|avocado|bacon/i.test(text)) {
    return applyComposite('Sandwich triangle poulet crudites estime', 'triangle chicken sandwich meal', 'medium');
  }

  if (/bolognese|bolognaise|spaghetti.*meat sauce|meat sauce.*spaghetti|pasta.*meat sauce|meat sauce.*pasta/i.test(text)) {
    return applyComposite('Pates bolognaise estimees', 'pasta bolognese meal');
  }

  if (/caesar/i.test(text)) {
    replaceWithTemplate(items, [
      { name: 'Poulet estime', canonicalFoodName: 'chicken breast cooked', grams: 130, confidence: 'low' },
      { name: 'Romaine estimee', canonicalFoodName: 'romaine lettuce', grams: 120, confidence: 'low' },
      { name: 'Sauce Caesar estimee', canonicalFoodName: 'creamy dressing', grams: 35, confidence: 'low' },
      { name: 'Croutons estimes', canonicalFoodName: 'croutons bread', grams: 30, confidence: 'low' },
      { name: 'Parmesan estime', canonicalFoodName: 'parmesan cheese', grams: 15, confidence: 'low' },
    ]);
    addReason();
    return 'low';
  }

  if (raw.mealCategory === 'poke_bowl') {
    const proteinTemplate = /tofu/i.test(text)
      ? { name: 'Tofu estime', canonicalFoodName: 'tofu', grams: 130, confidence: 'low' as const }
      : /chicken|poulet/i.test(text)
        ? { name: 'Poulet estime', canonicalFoodName: 'chicken breast cooked', grams: 130, confidence: 'low' as const }
        : { name: 'Proteine poke estimee', canonicalFoodName: 'poke protein', grams: 130, confidence: 'low' as const };

    replaceWithTemplate(items, [
      proteinTemplate,
      { name: 'Base riz estimee', canonicalFoodName: 'cooked white rice', grams: 220, confidence: 'low' },
      { name: 'Legumes et toppings estimes', canonicalFoodName: 'mixed vegetables', grams: 120, confidence: 'low' },
      { name: 'Avocat estime', canonicalFoodName: 'avocado', grams: 70, confidence: 'low' },
      { name: 'Edamame estime', canonicalFoodName: 'edamame', grams: 50, confidence: 'low' },
      { name: 'Sauce estimee', canonicalFoodName: 'creamy sauce', grams: 35, confidence: 'low' },
    ]);
    addReason();
    return 'low';
  }

  if (
    /\b(burger|hamburger|cheeseburger)\b/i.test(visibleText) &&
    (raw.mealCategory === 'burger_fries' || /\b(fries|frites)\b/i.test(visibleText))
  ) {
    replaceWithTemplate(items, [
      { name: 'Pain burger estime', canonicalFoodName: 'burger bun', grams: 75, confidence: 'low' },
      { name: 'Steak hache estime', canonicalFoodName: 'beef patty', grams: 120, confidence: 'low' },
      { name: 'Fromage estime', canonicalFoodName: 'cheese', grams: 25, confidence: 'low' },
      { name: 'Sauce estimee', canonicalFoodName: 'creamy sauce', grams: 30, confidence: 'low' },
      { name: 'Frites estimees', canonicalFoodName: 'fries', grams: 130, confidence: 'low' },
    ]);
    addReason();
    return 'low';
  }

  if (/chicken|poulet/i.test(text) && /green beans|haricot/i.test(text)) {
    return applyComposite('Poulet riz haricots verts estime', 'grilled chicken rice green beans meal', 'medium');
  }

  if (
    /chicken|poulet/i.test(text) &&
    /rice|riz/i.test(text) &&
    !/curry|katsu|coco|coconut|pad thai|couscous/i.test(text) &&
    (/vegetable|vegetables|legume|legumes|broccoli|brocoli|bell pepper|pepper|poivron/i.test(text) || raw.mealCategory === 'mixed_plate')
  ) {
    replaceWithTemplate(items, [
      { name: 'Poulet estime', canonicalFoodName: 'chicken breast cooked', grams: 130, confidence: 'low' },
      { name: 'Riz estime', canonicalFoodName: 'cooked white rice', grams: 170, confidence: 'low' },
      { name: 'Legumes estimes', canonicalFoodName: 'mixed vegetables', grams: 120, confidence: 'low' },
      { name: 'Huile de cuisson estimee', canonicalFoodName: 'olive oil', grams: 10, confidence: 'low' },
    ]);
    addReason();
    return 'low';
  }

  if (/lasagna|lasagne|baked pasta|baked dish.*cheese.*breadstick|baked.*cheese.*breadstick|pasta.*cheese.*breadstick|cheese sauce.*breadstick/i.test(text)) {
    replaceWithTemplate(items, [
      { name: 'Lasagne estimee', canonicalFoodName: 'lasagna', grams: 350, confidence: 'low' },
    ]);
    addReason();
    return 'low';
  }

  return raw.confidence;
}

function ensureMinimumItemGrams(items: CalibratedItem[], pattern: RegExp, grams: number): boolean {
  const item = items.find((candidate) => pattern.test(`${candidate.canonicalFoodName} ${candidate.name}`));
  if (!item || !isGramUnit(item.unit) || item.estimatedQuantity >= grams) {
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

function confidenceForAmbiguity(raw: RawMealAnalysis): ConfidenceTier {
  const riskText = [...raw.hiddenCalorieRisks, ...raw.uncertaintyReasons].join(' ');
  if (
    /hidden|oil|huile|sauce|dressing|vinaigrette|cheese|fromage|butter|beurre|cream|creme|cr\u00e8me|portion|depth|amount|estimated|unclear|unknown/i.test(
      riskText,
    )
  ) {
    return 'low';
  }

  if (AMBIGUOUS_MEAL_CATEGORIES.has(raw.mealCategory) && raw.items.length > 2 && raw.confidence === 'high') {
    return 'medium';
  }

  return raw.confidence;
}

function confidenceForPackagedPhoto(raw: RawMealAnalysis, reasons: string[]): ConfidenceTier {
  if (raw.mealCategory !== 'packaged') {
    return raw.confidence;
  }

  if (!reasons.includes('packaged_food_barcode_or_label_preferred')) {
    reasons.push('packaged_food_barcode_or_label_preferred');
  }

  return 'low';
}

function confidenceRange(confidence: ConfidenceTier, hiddenRiskCount: number, raw: RawMealAnalysis) {
  const preflightPenalty =
    (raw.visualQuality === 'poor' ? 1 : 0) +
    (raw.portionAmbiguity === 'high' ? 1 : 0) +
    (raw.scanRoute === 'unclear' ? 1 : 0) +
    (raw.needsUserQuestion ? 1 : 0);

  if (confidence === 'high') {
    return { low: 0.92, high: 1.1 };
  }

  if (confidence === 'medium') {
    return {
      low: preflightPenalty > 0 ? 0.8 : 0.85,
      high: hiddenRiskCount > 0 || preflightPenalty > 0 ? 1.28 : 1.18,
    };
  }

  return {
    low: preflightPenalty >= 2 ? 0.68 : 0.75,
    high: hiddenRiskCount > 0 || preflightPenalty > 0 ? 1.42 : 1.28,
  };
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
  for (const reason of scanPreflightReasons(raw)) {
    if (!uncertaintyReasons.includes(reason)) {
      uncertaintyReasons.push(reason);
    }
  }
  let confidence = raw.confidence;

  confidence = mergeConfidence(confidence, confidenceForScanPreflight(raw));
  confidence = mergeConfidence(confidence, applyPokeBowlRules(raw, items, uncertaintyReasons));
  confidence = mergeConfidence(confidence, applyKnownDishTemplate(raw, items, uncertaintyReasons));
  confidence = mergeConfidence(confidence, confidenceForAmbiguity(raw));
  confidence = mergeConfidence(confidence, confidenceForPackagedPhoto(raw, uncertaintyReasons));

  const totals = sumItems(items);
  const range = confidenceRange(confidence, raw.hiddenCalorieRisks.length, raw);

  const correctionSuggestions: CalibratedMealAnalysis['correctionSuggestions'] = [
    { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: null },
    { id: 'portion-down', label: 'Portion -15%', correctionType: 'portion_down', targetItemId: null },
    { id: 'portion-half', label: 'Ate half', correctionType: 'portion_half', targetItemId: null },
  ];

  const hiddenRiskText = raw.hiddenCalorieRisks.join(' ').toLowerCase();
  if (/oil|huile/.test(hiddenRiskText)) {
    correctionSuggestions.push({ id: 'add-oil', label: 'Huile ajoutee', correctionType: 'add_oil', targetItemId: null });
  }
  if (/sauce|dressing|vinaigrette/.test(hiddenRiskText) || raw.mealCategory === 'poke_bowl') {
    correctionSuggestions.push({ id: 'add-sauce', label: 'Sauce ajoutee', correctionType: 'add_sauce', targetItemId: null });
  }
  if (/cheese|fromage|parmesan|chevre/.test(hiddenRiskText)) {
    correctionSuggestions.push({ id: 'add-cheese', label: 'Cheese added', correctionType: 'add_cheese', targetItemId: null });
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
