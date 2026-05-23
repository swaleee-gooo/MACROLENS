# Nutrition Calibration Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct AI calorie guesses with a calibrated backend nutrition pipeline, add typed non-food-photo errors, and keep the mobile app from falling back to demo mode for non-food photos.

**Architecture:** The OpenAI vision call becomes an observer that returns food structure, meal category, portion estimates, hidden-calorie risks, and confidence. Supabase Edge Function code derives the user from the verified JWT, rejects non-food photos, and calls a pure calibration module that computes macros and ranges. The Expo app keeps its current remote/mock architecture but rethrows typed non-food errors so users see a clear message instead of a fake demo meal.

**Tech Stack:** Expo React Native SDK 54, TypeScript, Vitest, Supabase Auth/Storage/Edge Functions, OpenAI Responses API structured outputs.

---

## File Structure

- Modify `apps/mobile/vitest.config.ts`: include Supabase pure-function tests in the existing Vitest run.
- Create `supabase/functions/analyze-meal/nutritionCalibration.ts`: pure backend nutrition profiles, item normalization, meal-category rules, range logic, correction suggestions.
- Create `supabase/functions/analyze-meal/nutritionCalibration.test.ts`: backend calibration tests executed by Vitest from `apps/mobile`.
- Modify `supabase/functions/analyze-meal/nutritionEstimator.ts`: convert calibrated output into the existing MacroLens API response.
- Modify `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`: update `RawMealAnalysis` and prompt so OpenAI returns observation fields.
- Modify `supabase/functions/analyze-meal/mealSchema.ts`: update strict JSON schema to include `isFoodPhoto`, `mealCategory`, `portionSize`, `hiddenCalorieRisks`, and non-food-compatible empty items.
- Create `supabase/functions/analyze-meal/auth.ts`: parse Supabase user id from the already-verified JWT authorization header.
- Create `supabase/functions/analyze-meal/handler.ts`: testable Edge Function request handler with injected environment and analyzer dependencies.
- Create `supabase/functions/analyze-meal/handler.test.ts`: tests for JWT user derivation, non-food `422`, and no trusted body `userId`.
- Modify `supabase/functions/analyze-meal/index.ts`: delegate to `handleAnalyzeMealRequest`.
- Create `apps/mobile/src/analysis/analysisErrors.ts`: typed `NonFoodPhotoError` and shared French user-facing message.
- Modify `apps/mobile/src/analysis/remoteAnalysisService.ts`: stop sending `userId`, parse typed non-food responses, and throw `NonFoodPhotoError`.
- Modify `apps/mobile/src/analysis/analysisServiceFactory.ts`: do not fall back to mock for `NonFoodPhotoError`.
- Modify `apps/mobile/App.tsx`: show the non-food message in an alert.
- Modify `apps/mobile/src/analysis/remoteAnalysisService.test.ts`: assert body excludes `userId` and typed non-food is thrown.
- Modify `apps/mobile/src/analysis/analysisServiceFactory.test.ts`: assert non-food errors bypass demo fallback.
- Modify `docs/superpowers/status/2026-05-23-macrolens-project-control.md`: record implementation and verification status.

---

## Task 1: Enable Backend Pure Tests In Vitest

**Files:**
- Modify: `apps/mobile/vitest.config.ts`

- [ ] **Step 1: Update the Vitest include list**

Replace `apps/mobile/vitest.config.ts` with:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../../supabase/functions/**/*.test.ts'],
    globals: false,
    passWithNoTests: true,
  },
});
```

- [ ] **Step 2: Run the existing test suite**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
```

Expected: PASS. This change should not discover any new tests until the next task adds them.

- [ ] **Step 3: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/vitest.config.ts
git commit -m "test: include supabase function tests"
```

---

## Task 2: Add Calibration Tests Before Implementation

**Files:**
- Create: `supabase/functions/analyze-meal/nutritionCalibration.test.ts`
- Create: `supabase/functions/analyze-meal/nutritionCalibration.ts`

- [ ] **Step 1: Write failing calibration tests**

Create `supabase/functions/analyze-meal/nutritionCalibration.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calibrateMealAnalysis, isNonFoodAnalysis } from './nutritionCalibration.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function createPokeBowlRaw(): RawMealAnalysis {
  return {
    isFoodPhoto: true,
    nonFoodReason: '',
    mealName: 'Poke bowl saumon riz avocat',
    mealCategory: 'poke_bowl',
    portionSize: 'standard',
    confidence: 'medium',
    uncertaintyReasons: ['base_rice_partly_hidden'],
    hiddenCalorieRisks: ['hidden rice base', 'sweet sauce'],
    items: [
      {
        name: 'Saumon',
        canonicalFoodName: 'salmon raw',
        estimatedQuantity: 80,
        unit: 'g',
        calories: 160,
        proteinG: 18,
        carbsG: 0,
        fatG: 9,
        fiberG: 0,
        confidence: 'medium',
      },
      {
        name: 'Riz',
        canonicalFoodName: 'cooked white rice',
        estimatedQuantity: 120,
        unit: 'g',
        calories: 156,
        proteinG: 3,
        carbsG: 34,
        fatG: 0.3,
        fiberG: 0.5,
        confidence: 'low',
      },
      {
        name: 'Avocat',
        canonicalFoodName: 'avocado',
        estimatedQuantity: 40,
        unit: 'g',
        calories: 64,
        proteinG: 0.8,
        carbsG: 3.4,
        fatG: 5.9,
        fiberG: 2.7,
        confidence: 'medium',
      },
      {
        name: 'Edamame',
        canonicalFoodName: 'edamame',
        estimatedQuantity: 40,
        unit: 'g',
        calories: 48,
        proteinG: 4.8,
        carbsG: 3.6,
        fatG: 2.1,
        fiberG: 2,
        confidence: 'medium',
      },
      {
        name: 'Legumes',
        canonicalFoodName: 'mixed vegetables',
        estimatedQuantity: 100,
        unit: 'g',
        calories: 50,
        proteinG: 1.7,
        carbsG: 9,
        fatG: 0.5,
        fiberG: 2.5,
        confidence: 'medium',
      },
    ],
  };
}

describe('nutrition calibration', () => {
  it('raises an underestimated salmon rice avocado poke bowl into a realistic restaurant range', () => {
    const calibrated = calibrateMealAnalysis(createPokeBowlRaw());

    expect(calibrated.caloriesEstimate).toBeGreaterThanOrEqual(780);
    expect(calibrated.caloriesEstimate).toBeLessThanOrEqual(1000);
    expect(calibrated.proteinG).toBeGreaterThanOrEqual(36);
    expect(calibrated.confidence).toBe('low');
    expect(calibrated.caloriesLow).toBeLessThan(calibrated.caloriesEstimate);
    expect(calibrated.caloriesHigh).toBeGreaterThan(calibrated.caloriesEstimate);
    expect(calibrated.uncertaintyReasons).toContain('base_rice_partly_hidden');
    expect(calibrated.uncertaintyReasons).toContain('poke_bowl_hidden_rice_or_sauce');
    expect(calibrated.correctionSuggestions.map((item) => item.correctionType)).toContain('add_sauce');
  });

  it('keeps a high-confidence simple food stable instead of applying restaurant bowl floors', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: true,
      nonFoodReason: '',
      mealName: 'Banane',
      mealCategory: 'unknown',
      portionSize: 'standard',
      confidence: 'high',
      uncertaintyReasons: [],
      hiddenCalorieRisks: [],
      items: [
        {
          name: 'Banane',
          canonicalFoodName: 'banana',
          estimatedQuantity: 118,
          unit: 'g',
          calories: 105,
          proteinG: 1.3,
          carbsG: 27,
          fatG: 0.4,
          fiberG: 3.1,
          confidence: 'high',
        },
      ],
    };

    const calibrated = calibrateMealAnalysis(raw);

    expect(calibrated.caloriesEstimate).toBeGreaterThanOrEqual(95);
    expect(calibrated.caloriesEstimate).toBeLessThanOrEqual(115);
    expect(calibrated.confidence).toBe('high');
    expect(calibrated.items).toHaveLength(1);
  });

  it('detects non-food analysis outputs before a meal response is created', () => {
    const raw: RawMealAnalysis = {
      isFoodPhoto: false,
      nonFoodReason: 'The image shows a laptop keyboard.',
      mealName: '',
      mealCategory: 'unknown',
      portionSize: 'unknown',
      confidence: 'low',
      uncertaintyReasons: ['no_food_visible'],
      hiddenCalorieRisks: [],
      items: [],
    };

    expect(isNonFoodAnalysis(raw)).toBe(true);
  });
});
```

- [ ] **Step 2: Create a temporary empty module so the failure is about missing exports**

Create `supabase/functions/analyze-meal/nutritionCalibration.ts`:

```ts
export {};
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/nutritionCalibration.test.ts
```

Expected: FAIL with an export error for `calibrateMealAnalysis` or `isNonFoodAnalysis`.

---

## Task 3: Implement Calibration Engine And Wire Response Mapping

**Files:**
- Modify: `supabase/functions/analyze-meal/nutritionCalibration.ts`
- Modify: `supabase/functions/analyze-meal/nutritionEstimator.ts`
- Modify: `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`

- [ ] **Step 1: Update OpenAI raw types**

In `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`, replace the current `RawMealAnalysis` type with:

```ts
export type ConfidenceTier = 'high' | 'medium' | 'low';

export type MealCategory =
  | 'poke_bowl'
  | 'pasta'
  | 'burger_fries'
  | 'salad'
  | 'sandwich'
  | 'mixed_plate'
  | 'dessert'
  | 'drink'
  | 'packaged'
  | 'unknown';

export type PortionSize = 'small' | 'standard' | 'large' | 'unknown';

export type RawMealAnalysis = {
  isFoodPhoto: boolean;
  nonFoodReason: string;
  mealName: string;
  mealCategory: MealCategory;
  portionSize: PortionSize;
  confidence: ConfidenceTier;
  uncertaintyReasons: string[];
  hiddenCalorieRisks: string[];
  items: Array<{
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
  }>;
};
```

- [ ] **Step 2: Replace the calibration module with the implementation**

Replace `supabase/functions/analyze-meal/nutritionCalibration.ts` with:

```ts
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
  { patterns: [/olive oil|huile/i], profile: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 } },
  { patterns: [/sauce|dressing|vinaigrette|mayo|mayonnaise|creamy/i], profile: { calories: 300, proteinG: 1, carbsG: 10, fatG: 28, fiberG: 0 } },
  { patterns: [/cheese|fromage|parmesan|chevre/i], profile: { calories: 380, proteinG: 24, carbsG: 2, fatG: 31, fiberG: 0 } },
  { patterns: [/fries|frites/i], profile: { calories: 312, proteinG: 3.4, carbsG: 41, fatG: 15, fiberG: 3.8 } },
  { patterns: [/bun|pain burger|burger bun/i], profile: { calories: 270, proteinG: 8.7, carbsG: 49, fatG: 4.3, fiberG: 2.3 } },
  { patterns: [/croissant/i], profile: { calories: 406, proteinG: 8.2, carbsG: 45.8, fatG: 21, fiberG: 2.6 } },
];

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

function rawItemToCalibratedItem(item: RawMealAnalysis['items'][number]): CalibratedItem {
  const normalizedName = `${item.canonicalFoodName} ${item.name}`;
  const profile = item.unit.toLowerCase() === 'g' ? profileFor(normalizedName) : null;
  const macros = profile ? computeFromProfile(profile, item.estimatedQuantity) : item;

  return {
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: roundMacro(item.estimatedQuantity),
    unit: item.unit,
    calories: roundWhole(macros.calories),
    proteinG: roundMacro(macros.proteinG),
    carbsG: roundMacro(macros.carbsG),
    fatG: roundMacro(macros.fatG),
    fiberG: roundMacro(macros.fiberG),
    confidence: item.confidence,
  };
}

function addProfileItem(items: CalibratedItem[], params: {
  name: string;
  canonicalFoodName: string;
  grams: number;
  confidence: ConfidenceTier;
}): void {
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

  ensureMinimumItemGrams(items, /salmon|saumon|tuna|thon|chicken|poulet/i, proteinFloor);

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

  let totals = sumItems(items);
  const floor = raw.portionSize === 'small' ? 650 : raw.portionSize === 'large' ? 880 : 780;
  if (totals.caloriesEstimate < floor) {
    addProfileItem(items, {
      name: 'Toppings et assaisonnement estimes',
      canonicalFoodName: 'creamy sauce',
      grams: Math.ceil(((floor - totals.caloriesEstimate) / 300) * 100),
      confidence: 'low',
    });
    totals = sumItems(items);
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
  const items = raw.items.map(rawItemToCalibratedItem);
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
```

- [ ] **Step 3: Wire calibrated data into the existing response mapper**

Replace `supabase/functions/analyze-meal/nutritionEstimator.ts` with:

```ts
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';
import { calibrateMealAnalysis } from './nutritionCalibration.ts';

export function toMacroLensResponse(raw: RawMealAnalysis, imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();
  const calibrated = calibrateMealAnalysis(raw);
  const items = calibrated.items.map((item, index) => ({
    id: `${mealId}-item-${index + 1}`,
    mealId,
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: item.estimatedQuantity,
    unit: item.unit,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    dataSource: 'estimated',
    sourceFoodId: null,
  }));

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
    },
    uncertaintyReasons: calibrated.uncertaintyReasons,
    correctionSuggestions: calibrated.correctionSuggestions,
  };
}
```

- [ ] **Step 4: Run calibration tests**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/nutritionCalibration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full mobile test suite**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/vitest.config.ts supabase/functions/analyze-meal/nutritionCalibration.ts supabase/functions/analyze-meal/nutritionCalibration.test.ts supabase/functions/analyze-meal/nutritionEstimator.ts supabase/functions/analyze-meal/openaiMealAnalyzer.ts
git commit -m "feat: calibrate nutrition estimates"
```

---

## Task 4: Expand OpenAI Schema And Prompt

**Files:**
- Modify: `supabase/functions/analyze-meal/mealSchema.ts`
- Modify: `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`

- [ ] **Step 1: Replace the strict JSON schema**

Replace `supabase/functions/analyze-meal/mealSchema.ts` with:

```ts
const confidenceEnum = ['high', 'medium', 'low'] as const;
const mealCategoryEnum = [
  'poke_bowl',
  'pasta',
  'burger_fries',
  'salad',
  'sandwich',
  'mixed_plate',
  'dessert',
  'drink',
  'packaged',
  'unknown',
] as const;
const portionSizeEnum = ['small', 'standard', 'large', 'unknown'] as const;

export const mealAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isFoodPhoto',
    'nonFoodReason',
    'mealName',
    'mealCategory',
    'portionSize',
    'confidence',
    'uncertaintyReasons',
    'hiddenCalorieRisks',
    'items',
  ],
  properties: {
    isFoodPhoto: { type: 'boolean' },
    nonFoodReason: { type: 'string' },
    mealName: { type: 'string' },
    mealCategory: { enum: mealCategoryEnum },
    portionSize: { enum: portionSizeEnum },
    confidence: { enum: confidenceEnum },
    uncertaintyReasons: {
      type: 'array',
      items: { type: 'string' },
    },
    hiddenCalorieRisks: {
      type: 'array',
      items: { type: 'string' },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'canonicalFoodName',
          'estimatedQuantity',
          'unit',
          'calories',
          'proteinG',
          'carbsG',
          'fatG',
          'fiberG',
          'confidence',
        ],
        properties: {
          name: { type: 'string' },
          canonicalFoodName: { type: 'string' },
          estimatedQuantity: { type: 'number' },
          unit: { type: 'string' },
          calories: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
          fiberG: { type: 'number' },
          confidence: { enum: confidenceEnum },
        },
      },
    },
  },
} as const;
```

- [ ] **Step 2: Replace the prompt text**

In `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`, replace the `input_text` value with:

```ts
text:
  'Analyze this image for MacroLens, a consumer macro tracker. First decide if the image contains a real edible meal, snack, packaged food, or drink. If no food is visible, return isFoodPhoto=false, a short nonFoodReason, empty items, mealCategory="unknown", portionSize="unknown", confidence="low", and uncertaintyReasons explaining that no food is visible. If food is visible, return isFoodPhoto=true and identify the meal category, portion size, visible ingredients, estimated grams, and hidden calorie risks. Do not try to sound exact. Be conservative about restaurant bowls, pasta, salads, burgers, sauces, oil, avocado, cheese, fries, nuts, and rice hidden under toppings. For poke bowls, explicitly consider hidden rice base, sauce, avocado, edamame, toppings, and bowl depth. The calories and macros you return are fallback estimates only; backend calibration will recompute final totals.',
```

- [ ] **Step 3: Run backend calibration tests**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/nutritionCalibration.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add supabase/functions/analyze-meal/mealSchema.ts supabase/functions/analyze-meal/openaiMealAnalyzer.ts
git commit -m "feat: request structured meal observations"
```

---

## Task 5: Add Testable Edge Handler, JWT User Derivation, And Non-Food Response

**Files:**
- Create: `supabase/functions/analyze-meal/auth.ts`
- Create: `supabase/functions/analyze-meal/handler.ts`
- Create: `supabase/functions/analyze-meal/handler.test.ts`
- Modify: `supabase/functions/analyze-meal/index.ts`

- [ ] **Step 1: Write handler tests**

Create `supabase/functions/analyze-meal/handler.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { handleAnalyzeMealRequest } from './handler.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function fakeJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function foodAnalysis(): RawMealAnalysis {
  return {
    isFoodPhoto: true,
    nonFoodReason: '',
    mealName: 'Banane',
    mealCategory: 'unknown',
    portionSize: 'standard',
    confidence: 'high',
    uncertaintyReasons: [],
    hiddenCalorieRisks: [],
    items: [
      {
        name: 'Banane',
        canonicalFoodName: 'banana',
        estimatedQuantity: 118,
        unit: 'g',
        calories: 105,
        proteinG: 1.3,
        carbsG: 27,
        fatG: 0.4,
        fiberG: 3.1,
        confidence: 'high',
      },
    ],
  };
}

describe('handleAnalyzeMealRequest', () => {
  it('derives meal userId from the authorization JWT instead of the request body', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg', userId: 'spoofed-user' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => foodAnalysis(),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meal.userId).toBe('jwt-user');
  });

  it('returns a typed non-food error without creating a meal response', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeJwt('jwt-user')}` },
        body: JSON.stringify({ imageUrl: 'https://cdn.example/not-food.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => ({
          isFoodPhoto: false,
          nonFoodReason: 'The image shows a desk.',
          mealName: '',
          mealCategory: 'unknown',
          portionSize: 'unknown',
          confidence: 'low',
          uncertaintyReasons: ['no_food_visible'],
          hiddenCalorieRisks: [],
          items: [],
        }),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: 'non_food_photo',
      message: 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.',
    });
  });

  it('rejects missing authorization before analysis', async () => {
    const response = await handleAnalyzeMealRequest(
      new Request('https://example.test/analyze-meal', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://cdn.example/meal.jpg' }),
      }),
      {
        env: { get: () => 'openai-key' },
        analyzeMeal: async () => foodAnalysis(),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'missing_or_invalid_authorization' });
  });
});
```

- [ ] **Step 2: Run handler tests to verify they fail**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/handler.test.ts
```

Expected: FAIL because `handler.ts` does not exist.

- [ ] **Step 3: Create JWT parser**

Create `supabase/functions/analyze-meal/auth.ts`:

```ts
function decodeBase64Url(value: string): string {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

export function getUserIdFromAuthorizationHeader(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const [, payload] = match[1].split('.');
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { sub?: unknown };
    return typeof parsed.sub === 'string' && parsed.sub.length > 0 ? parsed.sub : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Create the testable handler**

Create `supabase/functions/analyze-meal/handler.ts`:

```ts
import { analyzeMealWithOpenAI } from './openaiMealAnalyzer.ts';
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';
import { isNonFoodAnalysis } from './nutritionCalibration.ts';
import { toMacroLensResponse } from './nutritionEstimator.ts';
import { getUserIdFromAuthorizationHeader } from './auth.ts';

type AnalyzeRequest = {
  imageUrl?: unknown;
};

type EnvProvider = {
  get(name: string): string | undefined;
};

type HandlerDeps = {
  env: EnvProvider;
  analyzeMeal?: (imageUrl: string, openAiKey: string) => Promise<RawMealAnalysis>;
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

const nonFoodMessage = 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
  });
}

function mockResponse(imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();

  return {
    meal: {
      id: mealId,
      userId,
      imageUri: imageUrl,
      capturedAt: new Date().toISOString(),
      mealName: 'Poulet, riz et legumes',
      caloriesEstimate: 506,
      caloriesLow: 430,
      caloriesHigh: 582,
      proteinG: 51,
      carbsG: 57.3,
      fatG: 6.1,
      fiberG: 4.6,
      confidence: 'medium',
      notes: 'Mock server response because OPENAI_API_KEY is not configured.',
      source: 'mock',
      items: [
        {
          id: `${mealId}-chicken`,
          mealId,
          name: 'Poulet grille',
          canonicalFoodName: 'chicken breast cooked',
          estimatedQuantity: 140,
          unit: 'g',
          calories: 231,
          proteinG: 43.4,
          carbsG: 0,
          fatG: 5,
          fiberG: 0,
          confidence: 'medium',
          dataSource: 'mock',
          sourceFoodId: null,
        },
      ],
    },
    uncertaintyReasons: ['portion_size_estimated_from_photo', 'hidden_oil_or_sauce_possible'],
    correctionSuggestions: [
      { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: null },
      { id: 'add-oil', label: 'Huile ajoutee', correctionType: 'add_oil', targetItemId: null },
    ],
  };
}

export async function handleAnalyzeMealRequest(request: Request, deps: HandlerDeps): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const userId = getUserIdFromAuthorizationHeader(request.headers.get('authorization'));
  if (!userId) {
    return jsonResponse({ error: 'missing_or_invalid_authorization' }, 401);
  }

  let payload: AnalyzeRequest;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (typeof payload.imageUrl !== 'string' || payload.imageUrl.length === 0) {
    return jsonResponse({ error: 'missing_image_url' }, 400);
  }

  const openAiKey = deps.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    return jsonResponse(mockResponse(payload.imageUrl, userId));
  }

  try {
    const analyzeMeal = deps.analyzeMeal ?? analyzeMealWithOpenAI;
    const rawAnalysis = await analyzeMeal(payload.imageUrl, openAiKey);

    if (isNonFoodAnalysis(rawAnalysis)) {
      return jsonResponse({ error: 'non_food_photo', message: nonFoodMessage }, 422);
    }

    return jsonResponse(toMacroLensResponse(rawAnalysis, payload.imageUrl, userId));
  } catch (error) {
    return jsonResponse(
      {
        error: 'analysis_failed',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      502,
    );
  }
}
```

- [ ] **Step 5: Delegate the Edge entrypoint to the handler**

Replace `supabase/functions/analyze-meal/index.ts` with:

```ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { handleAnalyzeMealRequest } from './handler.ts';

serve((request) => handleAnalyzeMealRequest(request, { env: Deno.env }));
```

- [ ] **Step 6: Run handler and calibration tests**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/handler.test.ts ../../supabase/functions/analyze-meal/nutritionCalibration.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run full test suite**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add supabase/functions/analyze-meal/auth.ts supabase/functions/analyze-meal/handler.ts supabase/functions/analyze-meal/handler.test.ts supabase/functions/analyze-meal/index.ts
git commit -m "fix: derive analysis user from jwt"
```

---

## Task 6: Add Mobile Non-Food Error Handling Without Demo Fallback

**Files:**
- Create: `apps/mobile/src/analysis/analysisErrors.ts`
- Modify: `apps/mobile/src/analysis/remoteAnalysisService.ts`
- Modify: `apps/mobile/src/analysis/remoteAnalysisService.test.ts`
- Modify: `apps/mobile/src/analysis/analysisServiceFactory.ts`
- Modify: `apps/mobile/src/analysis/analysisServiceFactory.test.ts`
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Write failing remote service expectations**

In `apps/mobile/src/analysis/remoteAnalysisService.test.ts`, change the invoke body assertion to:

```ts
expect(invoke).toHaveBeenCalledWith('analyze-meal', {
  body: { imageUrl: 'https://cdn.example/test.jpg?token=signed' },
});
```

Then add this test in the same `describe` block:

```ts
it('throws a typed non-food error from an edge function payload', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(12345);
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(4),
  } as Response);

  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'auth-user' } } }, error: null });
  const signInAnonymously = vi.fn();
  const upload = vi.fn().mockResolvedValue({ data: { path: 'auth-user/12345.jpg' }, error: null });
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: 'https://cdn.example/not-food.jpg?token=signed' },
    error: null,
  });
  const invoke = vi.fn().mockResolvedValue({
    data: {
      error: 'non_food_photo',
      message: 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.',
    },
    error: null,
  });

  const service = createRemoteAnalysisService(
    { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'sb_publishable_123' },
    {
      auth: { getSession, signInAnonymously },
      storage: { from: () => ({ upload, createSignedUrl }) },
      functions: { invoke },
    },
  );

  await expect(service.analyzeMealPhoto({ imageUri: 'file://not-food.jpg', userId: 'local-user' })).rejects.toMatchObject({
    name: 'NonFoodPhotoError',
    message: 'non_food_photo',
  });
});
```

- [ ] **Step 2: Write failing fallback factory expectation**

In `apps/mobile/src/analysis/analysisServiceFactory.test.ts`, import the new error:

```ts
import { NonFoodPhotoError } from './analysisErrors';
```

Add this test in the same `describe` block:

```ts
it('does not fall back to mock analysis for typed non-food photos', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const mock = createService(createResult('Mock meal', 'mock'));
  const service = createAnalysisService(
    {
      analysisMode: 'remote',
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'sb_publishable_123',
    },
    {
      remote: createService(new NonFoodPhotoError()),
      mock,
    },
  );

  await expect(service.analyzeMealPhoto({ imageUri: 'file://desk.jpg', userId: 'user-1' })).rejects.toBeInstanceOf(
    NonFoodPhotoError,
  );
  expect(mock.analyzeMealPhoto).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run mobile tests to verify they fail**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/analysis/remoteAnalysisService.test.ts src/analysis/analysisServiceFactory.test.ts
```

Expected: FAIL because `analysisErrors.ts` does not exist and `remoteAnalysisService` still sends `userId`.

- [ ] **Step 4: Create typed analysis error**

Create `apps/mobile/src/analysis/analysisErrors.ts`:

```ts
export const NON_FOOD_PHOTO_MESSAGE = 'Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.';

export class NonFoodPhotoError extends Error {
  readonly userMessage: string;

  constructor(userMessage = NON_FOOD_PHOTO_MESSAGE) {
    super('non_food_photo');
    this.name = 'NonFoodPhotoError';
    this.userMessage = userMessage;
  }
}

export function isNonFoodPhotoError(error: unknown): error is NonFoodPhotoError {
  return error instanceof NonFoodPhotoError;
}
```

- [ ] **Step 5: Update remote service**

In `apps/mobile/src/analysis/remoteAnalysisService.ts`, add the import:

```ts
import { NonFoodPhotoError } from './analysisErrors';
```

Add these helpers above `createRemoteAnalysisService`:

```ts
type EdgeErrorPayload = {
  error?: unknown;
  message?: unknown;
};

function getNonFoodMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as EdgeErrorPayload;
  if (candidate.error !== 'non_food_photo') {
    return null;
  }

  return typeof candidate.message === 'string' ? candidate.message : undefined ?? null;
}

async function getFunctionErrorPayload(error: unknown): Promise<unknown> {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (typeof context?.json !== 'function') {
    return null;
  }

  try {
    return await context.json();
  } catch {
    return null;
  }
}
```

Replace the invoke block with:

```ts
const functionResult = await supabase.functions.invoke('analyze-meal', {
  body: { imageUrl: signedUrlResult.data.signedUrl },
});

const nonFoodMessageFromData = getNonFoodMessage(functionResult.data);
if (nonFoodMessageFromData !== null) {
  throw new NonFoodPhotoError(nonFoodMessageFromData);
}

if (functionResult.error) {
  const errorPayload = await getFunctionErrorPayload(functionResult.error);
  const nonFoodMessageFromError = getNonFoodMessage(errorPayload);
  if (nonFoodMessageFromError !== null) {
    throw new NonFoodPhotoError(nonFoodMessageFromError);
  }

  throw new Error('analysis_function_failed');
}
```

- [ ] **Step 6: Update fallback service**

In `apps/mobile/src/analysis/analysisServiceFactory.ts`, add the import:

```ts
import { isNonFoodPhotoError } from './analysisErrors';
```

Then update the catch block inside `createFallbackAnalysisService`:

```ts
} catch (error) {
  if (isNonFoodPhotoError(error)) {
    throw error;
  }

  const message = error instanceof Error ? error.message : 'unknown_remote_error';
  console.warn(`MacroLens remote analysis failed: ${message}`);
  const fallbackResult = await fallback.analyzeMealPhoto(input);
```

- [ ] **Step 7: Update app alert message**

In `apps/mobile/App.tsx`, add the import:

```ts
import { isNonFoodPhotoError } from './src/analysis/analysisErrors';
```

Replace the `catch` block in `analyzeImageUri` with:

```ts
} catch (error) {
  if (isNonFoodPhotoError(error)) {
    Alert.alert('Photo non reconnue', error.userMessage);
  } else {
    Alert.alert('Analyse impossible', 'Reessaie avec une photo plus claire ou ajoute le repas manuellement.');
  }
  setScreen({ name: 'home' });
}
```

- [ ] **Step 8: Run targeted mobile tests**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/analysis/remoteAnalysisService.test.ts src/analysis/analysisServiceFactory.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run full mobile and backend tests**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
```

Expected: PASS.

- [ ] **Step 10: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx apps/mobile/src/analysis/analysisErrors.ts apps/mobile/src/analysis/remoteAnalysisService.ts apps/mobile/src/analysis/remoteAnalysisService.test.ts apps/mobile/src/analysis/analysisServiceFactory.ts apps/mobile/src/analysis/analysisServiceFactory.test.ts
git commit -m "fix: show non-food photo errors"
```

---

## Task 7: Typecheck, Deploy Edge Function, And Smoke Test

**Files:**
- Read: `apps/mobile/.env.local`
- Deploy: `supabase/functions/analyze-meal/index.ts`
- Deploy: `supabase/functions/analyze-meal/handler.ts`
- Deploy: `supabase/functions/analyze-meal/auth.ts`
- Deploy: `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`
- Deploy: `supabase/functions/analyze-meal/mealSchema.ts`
- Deploy: `supabase/functions/analyze-meal/nutritionEstimator.ts`
- Deploy: `supabase/functions/analyze-meal/nutritionCalibration.ts`

- [ ] **Step 1: Run verification commands**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected:

- `npm test`: PASS.
- `npx tsc --noEmit`: PASS.
- `npx expo install --check`: dependencies up to date.

- [ ] **Step 2: Deploy the Supabase Edge Function**

Use the Supabase MCP deployment tool for project `wyrfncoiubvdnrvdpads`:

```text
Deploy function: analyze-meal
Entrypoint: index.ts
verify_jwt: true
Files:
- supabase/functions/analyze-meal/index.ts
- supabase/functions/analyze-meal/handler.ts
- supabase/functions/analyze-meal/auth.ts
- supabase/functions/analyze-meal/openaiMealAnalyzer.ts
- supabase/functions/analyze-meal/mealSchema.ts
- supabase/functions/analyze-meal/nutritionEstimator.ts
- supabase/functions/analyze-meal/nutritionCalibration.ts
```

Expected: deployment status ACTIVE.

- [ ] **Step 3: Run live food smoke test**

Run an anonymous Supabase flow using the values in `apps/mobile/.env.local`:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
@'
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

async function main() {
  const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const auth = await supabase.auth.signInAnonymously();
  if (auth.error || !auth.data.user) throw auth.error ?? new Error("anonymous auth failed");

  const imageResponse = await fetch("https://upload.wikimedia.org/wikipedia/commons/4/4b/Salmon_poke_bowl.jpg");
  if (!imageResponse.ok) throw new Error("food image fetch failed");

  const buffer = await imageResponse.arrayBuffer();
  const objectPath = `${auth.data.user.id}/${Date.now()}-smoke.jpg`;
  const upload = await supabase.storage.from("meal-photos").upload(objectPath, buffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const signed = await supabase.storage.from("meal-photos").createSignedUrl(objectPath, 600);
  if (signed.error || !signed.data) throw signed.error ?? new Error("signed url failed");

  const result = await supabase.functions.invoke("analyze-meal", {
    body: { imageUrl: signed.data.signedUrl },
  });
  if (result.error) throw result.error;

  console.log(JSON.stringify({
    mealName: result.data.meal.mealName,
    caloriesEstimate: result.data.meal.caloriesEstimate,
    caloriesLow: result.data.meal.caloriesLow,
    caloriesHigh: result.data.meal.caloriesHigh,
    proteinG: result.data.meal.proteinG,
    confidence: result.data.meal.confidence,
    source: result.data.meal.source,
    itemCount: result.data.meal.items.length,
  }, null, 2));

  await supabase.storage.from("meal-photos").remove([objectPath]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@ | node
```

Expected: JSON prints an estimated food meal, no demo source, `caloriesHigh > caloriesEstimate > caloriesLow`, and no thrown error.

- [ ] **Step 4: Run live non-food smoke test**

Use the same flow with a non-food image URL:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
@'
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

async function main() {
  const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const auth = await supabase.auth.signInAnonymously();
  if (auth.error || !auth.data.user) throw auth.error ?? new Error("anonymous auth failed");

  const imageResponse = await fetch("https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg");
  if (!imageResponse.ok) throw new Error("non-food image fetch failed");

  const buffer = await imageResponse.arrayBuffer();
  const objectPath = `${auth.data.user.id}/${Date.now()}-non-food-smoke.jpg`;
  const upload = await supabase.storage.from("meal-photos").upload(objectPath, buffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const signed = await supabase.storage.from("meal-photos").createSignedUrl(objectPath, 600);
  if (signed.error || !signed.data) throw signed.error ?? new Error("signed url failed");

  const result = await supabase.functions.invoke("analyze-meal", {
    body: { imageUrl: signed.data.signedUrl },
  });

  let payload = result.data;
  if (result.error?.context?.json) {
    payload = await result.error.context.json();
  }

  console.log(JSON.stringify(payload, null, 2));
  await supabase.storage.from("meal-photos").remove([objectPath]);

  if (payload?.error !== "non_food_photo") {
    throw new Error("Expected non_food_photo");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@ | node
```

Expected: JSON contains `error: "non_food_photo"` and the French message.

---

## Task 8: Update Project Control And Final Commit

**Files:**
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Update project control**

Add this bullet under `Current State`:

```md
- Nutrition accuracy iteration implemented: OpenAI now returns structured observations, the Edge Function derives `userId` from the Supabase JWT, non-food photos return a typed `non_food_photo` error, and mixed meals are calibrated by backend nutrition profiles before returning totals to mobile.
```

Add this bullet under `Verified commands`:

```md
- Live Supabase food and non-food smoke tests for the calibrated `analyze-meal` Edge Function
```

- [ ] **Step 2: Run final git status**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git status --short
```

Expected: only `docs/superpowers/status/2026-05-23-macrolens-project-control.md` is modified.

- [ ] **Step 3: Commit docs**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "docs: record nutrition calibration rollout"
```

- [ ] **Step 4: Confirm clean working tree**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git status --short --branch
```

Expected: branch `codex/macrolens-mvp` with no uncommitted changes.

---

## Implementation Notes

- Keep `OPENAI_API_KEY` only in Supabase secrets.
- Keep `apps/mobile/.env.local` uncommitted.
- Keep the current mock fallback for network and infrastructure failures.
- Do not use mock fallback for `non_food_photo`.
- Do not add fine-tuning, dataset downloads, barcode scanning, paywall logic, or growth features in this iteration.

## Self-Review

- Spec coverage: calibration, poke bowl correction, non-food error, JWT user derivation, mobile no-demo behavior, tests, deployment, and dataset boundary are covered by Tasks 2-8.
- Scope: this plan is one implementation slice and leaves model training plus dataset ingestion outside this iteration.
- Type consistency: `RawMealAnalysis`, `ConfidenceTier`, `MealCategory`, `PortionSize`, `NonFoodPhotoError`, `calibrateMealAnalysis`, `isNonFoodAnalysis`, and `handleAnalyzeMealRequest` are introduced before use.
