# MacroLens MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Expo React Native MVP for MacroLens: photo-first meal logging with mocked AI nutrition analysis, confidence-aware macro results, corrections, daily summary, timeline, and Supabase-ready backend contracts.

**Architecture:** Keep the first version shippable without live secrets by using a typed analysis service interface with a deterministic mock implementation. The mobile app owns UI state and local persistence, while domain logic for nutrition math, corrections, schemas, and repositories lives in focused modules that can later connect to Supabase Edge Functions and OpenAI without rewriting screens.

**Tech Stack:** Expo React Native, TypeScript, Zod, Vitest, Expo ImagePicker, AsyncStorage, Supabase SQL/Edge Function source files, optional OpenAI vision integration behind a server-side function.

---

## File Structure

- `apps/mobile/`: Expo React Native app.
- `apps/mobile/App.tsx`: top-level app state machine and screen routing for the MVP.
- `apps/mobile/src/domain/types.ts`: shared MacroLens domain types.
- `apps/mobile/src/domain/nutrition.ts`: deterministic nutrition math and macro ranges.
- `apps/mobile/src/domain/corrections.ts`: one-tap correction engine.
- `apps/mobile/src/analysis/analysisSchema.ts`: Zod schemas for AI/edge-function responses.
- `apps/mobile/src/analysis/mockAnalysisService.ts`: deterministic mock photo analysis service.
- `apps/mobile/src/storage/mealRepository.ts`: repository abstraction and AsyncStorage-backed persistence.
- `apps/mobile/src/ui/theme.ts`: colors, spacing, typography values.
- `apps/mobile/src/ui/dashboardViewModel.ts`: daily totals and display formatting.
- `apps/mobile/src/components/*.tsx`: focused reusable UI pieces.
- `apps/mobile/src/screens/*.tsx`: onboarding, home, analysis, result, and timeline screens.
- `supabase/migrations/20260523170000_create_macrolens_schema.sql`: database schema and RLS policies.
- `supabase/functions/analyze-meal/index.ts`: server-side analysis contract with mock fallback and OpenAI-ready boundary.
- `docs/superpowers/specs/2026-05-23-macrolens-design.md`: approved product spec.
- `docs/superpowers/plans/2026-05-23-macrolens-mvp.md`: this plan.

## Task 1: Scaffold The Expo Workspace

**Files:**
- Create: `apps/mobile/`
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/App.tsx`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`

- [ ] **Step 1: Create the Expo app**

Run:

```powershell
New-Item -ItemType Directory -Force -Path apps | Out-Null
npx create-expo-app@latest apps/mobile --template blank-typescript
```

Expected: `apps/mobile/package.json`, `apps/mobile/App.tsx`, `apps/mobile/app.json`, and `apps/mobile/tsconfig.json` exist.

- [ ] **Step 2: Install runtime dependencies**

Run:

```powershell
Set-Location apps/mobile
npm install zod @tanstack/react-query @react-native-async-storage/async-storage expo-image-picker @supabase/supabase-js
```

Expected: npm exits with code `0` and the dependencies appear in `apps/mobile/package.json`.

- [ ] **Step 3: Install test dependencies**

Run:

```powershell
npm install --save-dev vitest @types/node
```

Expected: npm exits with code `0` and dev dependencies appear in `apps/mobile/package.json`.

- [ ] **Step 4: Add Vitest config**

Create `apps/mobile/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
```

- [ ] **Step 5: Add package scripts**

Modify `apps/mobile/package.json` so `scripts` contains these entries while preserving any Expo-generated scripts:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: Verify the scaffold**

Run:

```powershell
npm test
```

Expected: Vitest starts successfully and reports no matching tests or zero tests, without TypeScript config errors.

- [ ] **Step 7: Commit scaffold**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile
git commit -m "chore: scaffold MacroLens mobile app"
```

Expected: commit succeeds.

## Task 2: Add Domain Types And Nutrition Math

**Files:**
- Create: `apps/mobile/src/domain/types.ts`
- Create: `apps/mobile/src/domain/nutrition.ts`
- Create: `apps/mobile/src/domain/nutrition.test.ts`

- [ ] **Step 1: Write the failing nutrition tests**

Create `apps/mobile/src/domain/nutrition.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { recalculateMeal, scaleFoodItem, sumFoodItems } from './nutrition';
import type { FoodItem, Meal } from './types';

const items: FoodItem[] = [
  {
    id: 'item-1',
    mealId: 'meal-1',
    name: 'Chicken breast',
    canonicalFoodName: 'chicken breast cooked',
    estimatedQuantity: 150,
    unit: 'g',
    calories: 248,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    fiberG: 0,
    confidence: 'high',
    dataSource: 'usda',
    sourceFoodId: '171077',
  },
  {
    id: 'item-2',
    mealId: 'meal-1',
    name: 'Rice',
    canonicalFoodName: 'white rice cooked',
    estimatedQuantity: 180,
    unit: 'g',
    calories: 234,
    proteinG: 4.9,
    carbsG: 51.1,
    fatG: 0.5,
    fiberG: 0.7,
    confidence: 'medium',
    dataSource: 'usda',
    sourceFoodId: '169756',
  },
];

describe('nutrition math', () => {
  it('sums food items with rounded macro totals and a calorie range', () => {
    expect(sumFoodItems(items)).toEqual({
      calories: 482,
      caloriesLow: 410,
      caloriesHigh: 554,
      proteinG: 51.4,
      carbsG: 51.1,
      fatG: 5.9,
      fiberG: 0.7,
    });
  });

  it('scales a food item without mutating the original', () => {
    const scaled = scaleFoodItem(items[0], 1.2);

    expect(scaled.calories).toBe(298);
    expect(scaled.proteinG).toBe(55.8);
    expect(items[0].calories).toBe(248);
  });

  it('recalculates a meal from its items', () => {
    const meal: Meal = {
      id: 'meal-1',
      userId: 'local-user',
      imageUri: 'file://meal.jpg',
      capturedAt: '2026-05-23T12:30:00.000Z',
      mealName: 'Chicken rice bowl',
      caloriesEstimate: 0,
      caloriesLow: 0,
      caloriesHigh: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      confidence: 'medium',
      notes: '',
      source: 'mock',
      items,
    };

    expect(recalculateMeal(meal).caloriesEstimate).toBe(482);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
Set-Location apps/mobile
npm test -- src/domain/nutrition.test.ts
```

Expected: FAIL because `./nutrition` and `./types` do not exist.

- [ ] **Step 3: Create domain types**

Create `apps/mobile/src/domain/types.ts`:

```ts
export type ConfidenceTier = 'high' | 'medium' | 'low';

export type NutritionSource = 'open_food_facts' | 'usda' | 'estimated' | 'mock';

export type NutritionTotals = {
  calories: number;
  caloriesLow: number;
  caloriesHigh: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FoodItem = {
  id: string;
  mealId: string;
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
  dataSource: NutritionSource;
  sourceFoodId: string | null;
};

export type Meal = {
  id: string;
  userId: string;
  imageUri: string;
  capturedAt: string;
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
  source: NutritionSource;
  items: FoodItem[];
};

export type UserGoal = 'lose_fat' | 'build_muscle' | 'maintain' | 'understand_eating';

export type UserProfile = {
  id: string;
  goal: UserGoal;
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  sex: 'female' | 'male' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  activityLevel: 'low' | 'moderate' | 'high';
  targetWeightKg: number | null;
  proteinTargetG: number;
  calorieTarget: number;
};
```

- [ ] **Step 4: Create nutrition math**

Create `apps/mobile/src/domain/nutrition.ts`:

```ts
import type { FoodItem, Meal, NutritionTotals } from './types';

const CALORIE_RANGE_FACTOR = 0.15;

export function roundWhole(value: number): number {
  return Math.round(value);
}

export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calorieRange(calories: number): Pick<NutritionTotals, 'caloriesLow' | 'caloriesHigh'> {
  return {
    caloriesLow: roundWhole(calories * (1 - CALORIE_RANGE_FACTOR)),
    caloriesHigh: roundWhole(calories * (1 + CALORIE_RANGE_FACTOR)),
  };
}

export function sumFoodItems(items: FoodItem[]): NutritionTotals {
  const calories = roundWhole(items.reduce((sum, item) => sum + item.calories, 0));
  const range = calorieRange(calories);

  return {
    calories,
    caloriesLow: range.caloriesLow,
    caloriesHigh: range.caloriesHigh,
    proteinG: roundMacro(items.reduce((sum, item) => sum + item.proteinG, 0)),
    carbsG: roundMacro(items.reduce((sum, item) => sum + item.carbsG, 0)),
    fatG: roundMacro(items.reduce((sum, item) => sum + item.fatG, 0)),
    fiberG: roundMacro(items.reduce((sum, item) => sum + item.fiberG, 0)),
  };
}

export function scaleFoodItem(item: FoodItem, factor: number): FoodItem {
  return {
    ...item,
    estimatedQuantity: roundMacro(item.estimatedQuantity * factor),
    calories: roundWhole(item.calories * factor),
    proteinG: roundMacro(item.proteinG * factor),
    carbsG: roundMacro(item.carbsG * factor),
    fatG: roundMacro(item.fatG * factor),
    fiberG: roundMacro(item.fiberG * factor),
  };
}

export function recalculateMeal(meal: Meal): Meal {
  const totals = sumFoodItems(meal.items);

  return {
    ...meal,
    caloriesEstimate: totals.calories,
    caloriesLow: totals.caloriesLow,
    caloriesHigh: totals.caloriesHigh,
    proteinG: totals.proteinG,
    carbsG: totals.carbsG,
    fatG: totals.fatG,
    fiberG: totals.fiberG,
  };
}
```

- [ ] **Step 5: Run the nutrition tests**

Run:

```powershell
npm test -- src/domain/nutrition.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit domain model**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/vitest.config.ts
git commit -m "feat: add nutrition domain model"
```

Expected: commit succeeds.

## Task 3: Add AI Analysis Contract And Mock Service

**Files:**
- Create: `apps/mobile/src/analysis/analysisSchema.ts`
- Create: `apps/mobile/src/analysis/mockAnalysisService.ts`
- Create: `apps/mobile/src/analysis/analysisService.test.ts`

- [ ] **Step 1: Write the failing analysis service tests**

Create `apps/mobile/src/analysis/analysisService.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analysisResultSchema } from './analysisSchema';
import { createMockAnalysisService } from './mockAnalysisService';

describe('mock analysis service', () => {
  it('returns schema-valid meal analysis for a local image', async () => {
    const service = createMockAnalysisService();
    const result = await service.analyzeMealPhoto({
      imageUri: 'file://croissant-bowl.jpg',
      userId: 'local-user',
    });

    expect(() => analysisResultSchema.parse(result)).not.toThrow();
    expect(result.meal.mealName).toBe('Poulet, riz et legumes');
    expect(result.meal.confidence).toBe('medium');
    expect(result.uncertaintyReasons).toContain('portion_size_estimated_from_photo');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
Set-Location apps/mobile
npm test -- src/analysis/analysisService.test.ts
```

Expected: FAIL because `analysisSchema` and `mockAnalysisService` do not exist.

- [ ] **Step 3: Create the schema**

Create `apps/mobile/src/analysis/analysisSchema.ts`:

```ts
import { z } from 'zod';

export const confidenceTierSchema = z.enum(['high', 'medium', 'low']);
export const nutritionSourceSchema = z.enum(['open_food_facts', 'usda', 'estimated', 'mock']);

export const foodItemSchema = z.object({
  id: z.string().min(1),
  mealId: z.string().min(1),
  name: z.string().min(1),
  canonicalFoodName: z.string().min(1),
  estimatedQuantity: z.number().positive(),
  unit: z.string().min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  confidence: confidenceTierSchema,
  dataSource: nutritionSourceSchema,
  sourceFoodId: z.string().nullable(),
});

export const mealSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  imageUri: z.string().min(1),
  capturedAt: z.string().datetime(),
  mealName: z.string().min(1),
  caloriesEstimate: z.number().nonnegative(),
  caloriesLow: z.number().nonnegative(),
  caloriesHigh: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  confidence: confidenceTierSchema,
  notes: z.string(),
  source: nutritionSourceSchema,
  items: z.array(foodItemSchema).min(1),
});

export const analysisResultSchema = z.object({
  meal: mealSchema,
  uncertaintyReasons: z.array(z.string()).default([]),
  correctionSuggestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      correctionType: z.enum(['portion_up', 'portion_down', 'add_oil', 'add_sauce', 'remove_item']),
      targetItemId: z.string().nullable(),
    }),
  ),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export type AnalyzeMealInput = {
  imageUri: string;
  userId: string;
};

export type AnalysisService = {
  analyzeMealPhoto(input: AnalyzeMealInput): Promise<AnalysisResult>;
};
```

- [ ] **Step 4: Create the mock analysis service**

Create `apps/mobile/src/analysis/mockAnalysisService.ts`:

```ts
import type { AnalysisService } from './analysisSchema';
import { analysisResultSchema } from './analysisSchema';
import { recalculateMeal } from '../domain/nutrition';
import type { FoodItem, Meal } from '../domain/types';

function createItem(overrides: Omit<FoodItem, 'mealId'>, mealId: string): FoodItem {
  return {
    ...overrides,
    mealId,
  };
}

export function createMockAnalysisService(): AnalysisService {
  return {
    async analyzeMealPhoto({ imageUri, userId }) {
      const mealId = `meal-${Date.now()}`;
      const capturedAt = new Date().toISOString();

      const items: FoodItem[] = [
        createItem(
          {
            id: `${mealId}-chicken`,
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
          mealId,
        ),
        createItem(
          {
            id: `${mealId}-rice`,
            name: 'Riz blanc',
            canonicalFoodName: 'white rice cooked',
            estimatedQuantity: 170,
            unit: 'g',
            calories: 221,
            proteinG: 4.6,
            carbsG: 48.3,
            fatG: 0.5,
            fiberG: 0.6,
            confidence: 'medium',
            dataSource: 'mock',
            sourceFoodId: null,
          },
          mealId,
        ),
        createItem(
          {
            id: `${mealId}-vegetables`,
            name: 'Legumes verts',
            canonicalFoodName: 'mixed green vegetables cooked',
            estimatedQuantity: 120,
            unit: 'g',
            calories: 54,
            proteinG: 3,
            carbsG: 9,
            fatG: 0.6,
            fiberG: 4,
            confidence: 'high',
            dataSource: 'mock',
            sourceFoodId: null,
          },
          mealId,
        ),
      ];

      const meal: Meal = recalculateMeal({
        id: mealId,
        userId,
        imageUri,
        capturedAt,
        mealName: 'Poulet, riz et legumes',
        caloriesEstimate: 0,
        caloriesLow: 0,
        caloriesHigh: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        confidence: 'medium',
        notes: 'Estimation basee sur une portion visuelle standard.',
        source: 'mock',
        items,
      });

      return analysisResultSchema.parse({
        meal,
        uncertaintyReasons: ['portion_size_estimated_from_photo', 'hidden_oil_or_sauce_possible'],
        correctionSuggestions: [
          {
            id: 'portion-up',
            label: 'Portion +15%',
            correctionType: 'portion_up',
            targetItemId: null,
          },
          {
            id: 'portion-down',
            label: 'Portion -15%',
            correctionType: 'portion_down',
            targetItemId: null,
          },
          {
            id: 'add-oil',
            label: 'Huile ajoutee',
            correctionType: 'add_oil',
            targetItemId: null,
          },
        ],
      });
    },
  };
}
```

- [ ] **Step 5: Run analysis tests**

Run:

```powershell
npm test -- src/analysis/analysisService.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit analysis contract**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/analysis apps/mobile/src/domain
git commit -m "feat: add meal analysis contract"
```

Expected: commit succeeds.

## Task 4: Add Correction Engine And Local Repository

**Files:**
- Create: `apps/mobile/src/domain/corrections.ts`
- Create: `apps/mobile/src/domain/corrections.test.ts`
- Create: `apps/mobile/src/storage/mealRepository.ts`
- Create: `apps/mobile/src/storage/mealRepository.test.ts`

- [ ] **Step 1: Write failing correction tests**

Create `apps/mobile/src/domain/corrections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyMealCorrection } from './corrections';
import type { Meal } from './types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'file://meal.jpg',
  capturedAt: '2026-05-23T12:30:00.000Z',
  mealName: 'Poulet, riz et legumes',
  caloriesEstimate: 506,
  caloriesLow: 430,
  caloriesHigh: 582,
  proteinG: 51,
  carbsG: 57.3,
  fatG: 6.1,
  fiberG: 4.6,
  confidence: 'medium',
  notes: '',
  source: 'mock',
  items: [
    {
      id: 'item-1',
      mealId: 'meal-1',
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
};

describe('applyMealCorrection', () => {
  it('increases all portions by 15 percent', () => {
    const corrected = applyMealCorrection(meal, { type: 'portion_up', targetItemId: null });

    expect(corrected.items[0].estimatedQuantity).toBe(161);
    expect(corrected.caloriesEstimate).toBe(266);
  });

  it('adds oil as a new estimated item', () => {
    const corrected = applyMealCorrection(meal, { type: 'add_oil', targetItemId: null });

    expect(corrected.items.some((item) => item.name === 'Huile de cuisson')).toBe(true);
    expect(corrected.fatG).toBe(19);
  });

  it('removes a target item', () => {
    const corrected = applyMealCorrection(meal, { type: 'remove_item', targetItemId: 'item-1' });

    expect(corrected.items).toHaveLength(0);
    expect(corrected.caloriesEstimate).toBe(0);
  });
});
```

- [ ] **Step 2: Run correction tests to verify failure**

Run:

```powershell
Set-Location apps/mobile
npm test -- src/domain/corrections.test.ts
```

Expected: FAIL because `./corrections` does not exist.

- [ ] **Step 3: Create correction engine**

Create `apps/mobile/src/domain/corrections.ts`:

```ts
import { recalculateMeal, scaleFoodItem } from './nutrition';
import type { FoodItem, Meal } from './types';

export type MealCorrection =
  | { type: 'portion_up'; targetItemId: string | null }
  | { type: 'portion_down'; targetItemId: string | null }
  | { type: 'add_oil'; targetItemId: string | null }
  | { type: 'add_sauce'; targetItemId: string | null }
  | { type: 'remove_item'; targetItemId: string };

function appliesToItem(item: FoodItem, targetItemId: string | null): boolean {
  return targetItemId === null || item.id === targetItemId;
}

function addEstimatedItem(meal: Meal, item: Omit<FoodItem, 'mealId'>): Meal {
  return {
    ...meal,
    items: [
      ...meal.items,
      {
        ...item,
        mealId: meal.id,
      },
    ],
    confidence: meal.confidence === 'high' ? 'medium' : meal.confidence,
  };
}

export function applyMealCorrection(meal: Meal, correction: MealCorrection): Meal {
  if (correction.type === 'portion_up') {
    return recalculateMeal({
      ...meal,
      items: meal.items.map((item) => (appliesToItem(item, correction.targetItemId) ? scaleFoodItem(item, 1.15) : item)),
    });
  }

  if (correction.type === 'portion_down') {
    return recalculateMeal({
      ...meal,
      items: meal.items.map((item) => (appliesToItem(item, correction.targetItemId) ? scaleFoodItem(item, 0.85) : item)),
    });
  }

  if (correction.type === 'add_oil') {
    return recalculateMeal(
      addEstimatedItem(meal, {
        id: `${meal.id}-oil-${meal.items.length + 1}`,
        name: 'Huile de cuisson',
        canonicalFoodName: 'olive oil',
        estimatedQuantity: 14,
        unit: 'g',
        calories: 119,
        proteinG: 0,
        carbsG: 0,
        fatG: 14,
        fiberG: 0,
        confidence: 'medium',
        dataSource: 'estimated',
        sourceFoodId: null,
      }),
    );
  }

  if (correction.type === 'add_sauce') {
    return recalculateMeal(
      addEstimatedItem(meal, {
        id: `${meal.id}-sauce-${meal.items.length + 1}`,
        name: 'Sauce',
        canonicalFoodName: 'generic sauce',
        estimatedQuantity: 30,
        unit: 'g',
        calories: 80,
        proteinG: 0.5,
        carbsG: 4,
        fatG: 7,
        fiberG: 0.2,
        confidence: 'low',
        dataSource: 'estimated',
        sourceFoodId: null,
      }),
    );
  }

  return recalculateMeal({
    ...meal,
    items: meal.items.filter((item) => item.id !== correction.targetItemId),
  });
}
```

- [ ] **Step 4: Run correction tests**

Run:

```powershell
npm test -- src/domain/corrections.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing repository tests**

Create `apps/mobile/src/storage/mealRepository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createMealRepository, createMemoryStorageAdapter } from './mealRepository';
import type { Meal } from '../domain/types';

const meal: Meal = {
  id: 'meal-1',
  userId: 'local-user',
  imageUri: 'file://meal.jpg',
  capturedAt: '2026-05-23T12:30:00.000Z',
  mealName: 'Poulet, riz et legumes',
  caloriesEstimate: 506,
  caloriesLow: 430,
  caloriesHigh: 582,
  proteinG: 51,
  carbsG: 57.3,
  fatG: 6.1,
  fiberG: 4.6,
  confidence: 'medium',
  notes: '',
  source: 'mock',
  items: [],
};

describe('meal repository', () => {
  it('saves and lists meals newest first', async () => {
    const repository = createMealRepository(createMemoryStorageAdapter());

    await repository.saveMeal(meal);
    await repository.saveMeal({ ...meal, id: 'meal-2', capturedAt: '2026-05-23T13:30:00.000Z' });

    expect((await repository.listMeals()).map((savedMeal) => savedMeal.id)).toEqual(['meal-2', 'meal-1']);
  });

  it('deletes a meal', async () => {
    const repository = createMealRepository(createMemoryStorageAdapter());

    await repository.saveMeal(meal);
    await repository.deleteMeal('meal-1');

    expect(await repository.listMeals()).toEqual([]);
  });
});
```

- [ ] **Step 6: Run repository tests to verify failure**

Run:

```powershell
npm test -- src/storage/mealRepository.test.ts
```

Expected: FAIL because `mealRepository` does not exist.

- [ ] **Step 7: Create repository implementation**

Create `apps/mobile/src/storage/mealRepository.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Meal } from '../domain/types';

const MEALS_KEY = 'macrolens.meals.v1';

export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type MealRepository = {
  listMeals(): Promise<Meal[]>;
  saveMeal(meal: Meal): Promise<void>;
  deleteMeal(mealId: string): Promise<void>;
};

async function readMeals(storage: StorageAdapter): Promise<Meal[]> {
  const raw = await storage.getItem(MEALS_KEY);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as Meal[];
  return parsed.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

async function writeMeals(storage: StorageAdapter, meals: Meal[]): Promise<void> {
  await storage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function createMealRepository(storage: StorageAdapter): MealRepository {
  return {
    async listMeals() {
      return readMeals(storage);
    },

    async saveMeal(meal) {
      const meals = await readMeals(storage);
      const withoutExisting = meals.filter((existingMeal) => existingMeal.id !== meal.id);
      await writeMeals(storage, [meal, ...withoutExisting]);
    },

    async deleteMeal(mealId) {
      const meals = await readMeals(storage);
      await writeMeals(
        storage,
        meals.filter((meal) => meal.id !== mealId),
      );
    },
  };
}

export function createAsyncStorageMealRepository(): MealRepository {
  return createMealRepository(AsyncStorage);
}

export function createMemoryStorageAdapter(): StorageAdapter {
  const values = new Map<string, string>();

  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}
```

- [ ] **Step 8: Run repository tests**

Run:

```powershell
npm test -- src/storage/mealRepository.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit corrections and repository**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain apps/mobile/src/storage apps/mobile/package.json apps/mobile/package-lock.json
git commit -m "feat: add meal corrections and local storage"
```

Expected: commit succeeds.

## Task 5: Build Dashboard View Models And UI Foundation

**Files:**
- Create: `apps/mobile/src/ui/theme.ts`
- Create: `apps/mobile/src/ui/dashboardViewModel.ts`
- Create: `apps/mobile/src/ui/dashboardViewModel.test.ts`
- Create: `apps/mobile/src/components/ConfidenceBadge.tsx`
- Create: `apps/mobile/src/components/MetricPill.tsx`
- Create: `apps/mobile/src/components/MealCard.tsx`

- [ ] **Step 1: Write failing dashboard view-model tests**

Create `apps/mobile/src/ui/dashboardViewModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildDailySummary, formatConfidenceLabel } from './dashboardViewModel';
import type { Meal } from '../domain/types';

const meals: Meal[] = [
  {
    id: 'meal-1',
    userId: 'local-user',
    imageUri: 'file://meal.jpg',
    capturedAt: '2026-05-23T12:30:00.000Z',
    mealName: 'Poulet, riz et legumes',
    caloriesEstimate: 506,
    caloriesLow: 430,
    caloriesHigh: 582,
    proteinG: 51,
    carbsG: 57.3,
    fatG: 6.1,
    fiberG: 4.6,
    confidence: 'medium',
    notes: '',
    source: 'mock',
    items: [],
  },
];

describe('dashboard view model', () => {
  it('builds a daily summary for the selected date', () => {
    expect(buildDailySummary(meals, '2026-05-23')).toEqual({
      mealCount: 1,
      calories: 506,
      proteinG: 51,
      carbsG: 57.3,
      fatG: 6.1,
      fiberG: 4.6,
    });
  });

  it('formats confidence labels in French', () => {
    expect(formatConfidenceLabel('high')).toBe('Fiabilite elevee');
    expect(formatConfidenceLabel('medium')).toBe('Fiabilite moyenne');
    expect(formatConfidenceLabel('low')).toBe('A verifier');
  });
});
```

- [ ] **Step 2: Run view-model tests to verify failure**

Run:

```powershell
Set-Location apps/mobile
npm test -- src/ui/dashboardViewModel.test.ts
```

Expected: FAIL because `dashboardViewModel` does not exist.

- [ ] **Step 3: Create dashboard view model**

Create `apps/mobile/src/ui/dashboardViewModel.ts`:

```ts
import { roundMacro } from '../domain/nutrition';
import type { ConfidenceTier, Meal } from '../domain/types';

export type DailySummary = {
  mealCount: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export function buildDailySummary(meals: Meal[], isoDate: string): DailySummary {
  const mealsForDate = meals.filter((meal) => meal.capturedAt.startsWith(isoDate));

  return {
    mealCount: mealsForDate.length,
    calories: Math.round(mealsForDate.reduce((sum, meal) => sum + meal.caloriesEstimate, 0)),
    proteinG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.proteinG, 0)),
    carbsG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.carbsG, 0)),
    fatG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.fatG, 0)),
    fiberG: roundMacro(mealsForDate.reduce((sum, meal) => sum + meal.fiberG, 0)),
  };
}

export function formatConfidenceLabel(confidence: ConfidenceTier): string {
  if (confidence === 'high') {
    return 'Fiabilite elevee';
  }

  if (confidence === 'medium') {
    return 'Fiabilite moyenne';
  }

  return 'A verifier';
}
```

- [ ] **Step 4: Run view-model tests**

Run:

```powershell
npm test -- src/ui/dashboardViewModel.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create theme tokens**

Create `apps/mobile/src/ui/theme.ts`:

```ts
export const colors = {
  ink: '#171717',
  muted: '#666A73',
  background: '#FAFAF7',
  surface: '#FFFFFF',
  line: '#E2E0D8',
  green: '#1F7A4D',
  blue: '#275EFE',
  amber: '#B66A00',
  red: '#B42318',
  protein: '#1F7A4D',
  carbs: '#275EFE',
  fat: '#B66A00',
  fiber: '#7157D9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
};

export const typography = {
  title: 30,
  heading: 22,
  body: 16,
  small: 13,
  tiny: 11,
};
```

- [ ] **Step 6: Create ConfidenceBadge component**

Create `apps/mobile/src/components/ConfidenceBadge.tsx`:

```tsx
import { Text, View } from 'react-native';
import type { ConfidenceTier } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';
import { formatConfidenceLabel } from '../ui/dashboardViewModel';

type Props = {
  confidence: ConfidenceTier;
};

export function ConfidenceBadge({ confidence }: Props) {
  const accent = confidence === 'high' ? colors.green : confidence === 'medium' ? colors.amber : colors.red;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderColor: accent,
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Text style={{ color: accent, fontSize: typography.small, fontWeight: '700' }}>
        {formatConfidenceLabel(confidence)}
      </Text>
    </View>
  );
}
```

- [ ] **Step 7: Create MetricPill component**

Create `apps/mobile/src/components/MetricPill.tsx`:

```tsx
import { Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  label: string;
  value: string;
  accent?: string;
};

export function MetricPill({ label, value, accent = colors.ink }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.sm,
        borderWidth: 1,
        minWidth: 94,
        padding: spacing.md,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '700', textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ color: accent, fontSize: typography.body, fontWeight: '800', marginTop: spacing.xs }}>
        {value}
      </Text>
    </View>
  );
}
```

- [ ] **Step 8: Create MealCard component**

Create `apps/mobile/src/components/MealCard.tsx`:

```tsx
import { Image, Pressable, Text, View } from 'react-native';
import type { Meal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';
import { ConfidenceBadge } from './ConfidenceBadge';

type Props = {
  meal: Meal;
  onPress: (meal: Meal) => void;
};

export function MealCard({ meal, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(meal)}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <Image
        source={{ uri: meal.imageUri }}
        style={{
          backgroundColor: colors.line,
          borderRadius: radius.sm,
          height: 76,
          width: 76,
        }}
      />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>
          {meal.mealName}
        </Text>
        <Text style={{ color: colors.muted, fontSize: typography.small }}>
          {meal.caloriesEstimate} kcal · {meal.proteinG} g proteines
        </Text>
        <ConfidenceBadge confidence={meal.confidence} />
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 9: Run all tests**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 10: Commit UI foundation**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/ui apps/mobile/src/components
git commit -m "feat: add MacroLens UI foundation"
```

Expected: commit succeeds.

## Task 6: Build Mobile Screens And App Flow

**Files:**
- Modify: `apps/mobile/App.tsx`
- Create: `apps/mobile/src/screens/OnboardingScreen.tsx`
- Create: `apps/mobile/src/screens/HomeScreen.tsx`
- Create: `apps/mobile/src/screens/AnalyzingScreen.tsx`
- Create: `apps/mobile/src/screens/ResultScreen.tsx`
- Create: `apps/mobile/src/screens/TimelineScreen.tsx`

- [ ] **Step 1: Create onboarding screen**

Create `apps/mobile/src/screens/OnboardingScreen.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import type { UserGoal } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onComplete: (goal: UserGoal) => void;
};

const goals: { value: UserGoal; label: string; description: string }[] = [
  { value: 'lose_fat', label: 'Perdre du gras', description: 'Priorite aux calories et aux proteines.' },
  { value: 'build_muscle', label: 'Construire du muscle', description: 'Suivre les proteines sans friction.' },
  { value: 'maintain', label: 'Maintenir', description: 'Comprendre tes repas sans obsession.' },
  { value: 'understand_eating', label: 'Mieux manger', description: 'Voir les tendances repas apres repas.' },
];

export function OnboardingScreen({ onComplete }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, flex: 1, gap: spacing.xl, justifyContent: 'center', padding: spacing.xl }}>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>MacroLens</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 23 }}>
          Estime tes macros a partir d'une photo. Les resultats sont des estimations, pas des conseils medicaux.
        </Text>
      </View>
      <View style={{ gap: spacing.md }}>
        {goals.map((goal) => (
          <Pressable
            key={goal.value}
            onPress={() => onComplete(goal.value)}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.line,
              borderRadius: radius.md,
              borderWidth: 1,
              padding: spacing.lg,
            }}
          >
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{goal.label}</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, marginTop: spacing.xs }}>{goal.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Create analyzing screen**

Create `apps/mobile/src/screens/AnalyzingScreen.tsx`:

```tsx
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  imageUri: string;
};

export function AnalyzingScreen({ imageUri }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
      <Image source={{ uri: imageUri }} style={{ aspectRatio: 1, borderRadius: radius.lg, width: '100%' }} />
      <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xl }}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Analyse du repas</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, textAlign: 'center' }}>
          Detection des aliments, portions et macros probables.
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create home screen**

Create `apps/mobile/src/screens/HomeScreen.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Meal } from '../domain/types';
import { MealCard } from '../components/MealCard';
import { MetricPill } from '../components/MetricPill';
import { colors, spacing, typography } from '../ui/theme';
import { buildDailySummary } from '../ui/dashboardViewModel';

type Props = {
  meals: Meal[];
  onCapture: () => void;
  onOpenTimeline: () => void;
  onOpenMeal: (meal: Meal) => void;
};

export function HomeScreen({ meals, onCapture, onOpenTimeline, onOpenMeal }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const summary = buildDailySummary(meals, today);
  const recentMeals = meals.slice(0, 3);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>MacroLens</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>Photo, macros, confiance.</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <MetricPill label="Calories" value={`${summary.calories}`} />
        <MetricPill label="Proteines" value={`${summary.proteinG} g`} accent={colors.protein} />
        <MetricPill label="Glucides" value={`${summary.carbsG} g`} accent={colors.carbs} />
        <MetricPill label="Lipides" value={`${summary.fatG} g`} accent={colors.fat} />
      </View>

      <Pressable
        onPress={onCapture}
        style={{
          alignItems: 'center',
          backgroundColor: colors.green,
          borderRadius: 999,
          padding: spacing.lg,
        }}
      >
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Scanner un repas</Text>
      </Pressable>

      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Recents</Text>
          <Pressable onPress={onOpenTimeline}>
            <Text style={{ color: colors.blue, fontSize: typography.small, fontWeight: '800' }}>Voir tout</Text>
          </Pressable>
        </View>
        {recentMeals.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: typography.body }}>Ton premier scan apparaitra ici.</Text>
        ) : (
          recentMeals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
        )}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Create result screen**

Create `apps/mobile/src/screens/ResultScreen.tsx`:

```tsx
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { Meal } from '../domain/types';
import type { MealCorrection } from '../domain/corrections';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { MetricPill } from '../components/MetricPill';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  onApplyCorrection: (correction: MealCorrection) => void;
  onSave: () => void;
  onBack: () => void;
};

const correctionButtons: { label: string; correction: MealCorrection }[] = [
  { label: 'Portion +15%', correction: { type: 'portion_up', targetItemId: null } },
  { label: 'Portion -15%', correction: { type: 'portion_down', targetItemId: null } },
  { label: 'Huile ajoutee', correction: { type: 'add_oil', targetItemId: null } },
  { label: 'Sauce ajoutee', correction: { type: 'add_sauce', targetItemId: null } },
];

export function ResultScreen({ meal, onApplyCorrection, onSave, onBack }: Props) {
  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack}>
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>
      <Image source={{ uri: meal.imageUri }} style={{ aspectRatio: 1, borderRadius: radius.lg, width: '100%' }} />
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>{meal.mealName}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>
          {meal.caloriesEstimate} kcal · probablement {meal.caloriesLow}-{meal.caloriesHigh}
        </Text>
        <ConfidenceBadge confidence={meal.confidence} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <MetricPill label="Proteines" value={`${meal.proteinG} g`} accent={colors.protein} />
        <MetricPill label="Glucides" value={`${meal.carbsG} g`} accent={colors.carbs} />
        <MetricPill label="Lipides" value={`${meal.fatG} g`} accent={colors.fat} />
        <MetricPill label="Fibres" value={`${meal.fiberG} g`} accent={colors.fiber} />
      </View>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Corrections rapides</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {correctionButtons.map((button) => (
            <Pressable
              key={button.label}
              onPress={() => onApplyCorrection(button.correction)}
              style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 999, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
            >
              <Text style={{ color: colors.ink, fontWeight: '800' }}>{button.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Aliments detectes</Text>
        {meal.items.map((item) => (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, padding: spacing.md }}>
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{item.name}</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small }}>
              {item.estimatedQuantity} {item.unit} · {item.calories} kcal · {item.proteinG} g proteines
            </Text>
          </View>
        ))}
      </View>
      <Pressable onPress={onSave} style={{ alignItems: 'center', backgroundColor: colors.green, borderRadius: 999, padding: spacing.lg }}>
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Enregistrer le repas</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Create timeline screen**

Create `apps/mobile/src/screens/TimelineScreen.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Meal } from '../domain/types';
import { MealCard } from '../components/MealCard';
import { colors, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onBack: () => void;
  onOpenMeal: (meal: Meal) => void;
};

export function TimelineScreen({ meals, onBack, onOpenMeal }: Props) {
  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl }}>
      <Pressable onPress={onBack}>
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>
      <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Timeline</Text>
      {meals.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: typography.body }}>Aucun repas enregistre.</Text>
      ) : (
        meals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 6: Wire the app state machine**

Replace `apps/mobile/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockAnalysisService } from './src/analysis/mockAnalysisService';
import { applyMealCorrection } from './src/domain/corrections';
import type { Meal, UserGoal } from './src/domain/types';
import { createAsyncStorageMealRepository } from './src/storage/mealRepository';
import { colors } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';

type ScreenState =
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'analyzing'; imageUri: string }
  | { name: 'result'; meal: Meal; isSaved: boolean }
  | { name: 'timeline' };

const queryClient = new QueryClient();
const localUserId = 'local-user';

function MacroLensApp() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'onboarding' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const repository = useMemo(() => createAsyncStorageMealRepository(), []);
  const analysisService = useMemo(() => createMockAnalysisService(), []);

  useEffect(() => {
    repository.listMeals().then(setMeals).catch(() => setMeals([]));
  }, [repository]);

  async function captureMeal() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera indisponible', 'Autorise la camera ou choisis une photo depuis ta galerie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const imageUri = result.assets[0].uri;
    setScreen({ name: 'analyzing', imageUri });

    try {
      const analysis = await analysisService.analyzeMealPhoto({ imageUri, userId: localUserId });
      setScreen({ name: 'result', meal: analysis.meal, isSaved: false });
    } catch {
      Alert.alert('Analyse impossible', 'Reessaie avec une photo plus claire ou ajoute le repas manuellement.');
      setScreen({ name: 'home' });
    }
  }

  function completeOnboarding(_goal: UserGoal) {
    setScreen({ name: 'home' });
  }

  async function saveMeal(meal: Meal) {
    await repository.saveMeal(meal);
    const nextMeals = await repository.listMeals();
    setMeals(nextMeals);
    setScreen({ name: 'home' });
  }

  if (screen.name === 'onboarding') {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  if (screen.name === 'analyzing') {
    return <AnalyzingScreen imageUri={screen.imageUri} />;
  }

  if (screen.name === 'result') {
    return (
      <ResultScreen
        meal={screen.meal}
        onApplyCorrection={(correction) =>
          setScreen({
            name: 'result',
            meal: applyMealCorrection(screen.meal, correction),
            isSaved: false,
          })
        }
        onBack={() => setScreen({ name: 'home' })}
        onSave={() => saveMeal(screen.meal)}
      />
    );
  }

  if (screen.name === 'timeline') {
    return (
      <TimelineScreen
        meals={meals}
        onBack={() => setScreen({ name: 'home' })}
        onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
      />
    );
  }

  return <HomeScreen meals={meals} onCapture={captureMeal} onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })} onOpenTimeline={() => setScreen({ name: 'timeline' })} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <MacroLensApp />
      </SafeAreaView>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Typecheck and test**

Run:

```powershell
Set-Location apps/mobile
npm test
npx tsc --noEmit
```

Expected: tests PASS and TypeScript exits with code `0`.

- [ ] **Step 8: Launch Expo for manual verification**

Run:

```powershell
npm run web
```

Expected: Expo serves the app. On web, camera permissions may depend on the browser; verify onboarding, home, result screen with a mock service path if camera is available. On iOS/Android via Expo Go, verify camera capture, analysis loading, result, correction buttons, save, and timeline.

- [ ] **Step 9: Commit mobile flow**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile
git commit -m "feat: build MacroLens mobile flow"
```

Expected: commit succeeds.

## Task 7: Add Supabase Schema And Edge Function Contract

**Files:**
- Create: `supabase/migrations/20260523170000_create_macrolens_schema.sql`
- Create: `supabase/functions/analyze-meal/index.ts`

- [ ] **Step 1: Create Supabase schema migration**

Create `supabase/migrations/20260523170000_create_macrolens_schema.sql`:

```sql
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in ('lose_fat', 'build_muscle', 'maintain', 'understand_eating')),
  age_range text not null,
  sex text not null check (sex in ('female', 'male', 'prefer_not_to_say')),
  height_cm integer not null check (height_cm between 80 and 260),
  weight_kg numeric(5, 1) not null check (weight_kg between 25 and 350),
  activity_level text not null check (activity_level in ('low', 'moderate', 'high')),
  target_weight_kg numeric(5, 1),
  protein_target_g integer not null check (protein_target_g between 30 and 350),
  calorie_target integer not null check (calorie_target between 800 and 6000),
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  captured_at timestamptz not null,
  meal_name text not null,
  calories_estimate integer not null check (calories_estimate >= 0),
  calories_low integer not null check (calories_low >= 0),
  calories_high integer not null check (calories_high >= calories_low),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  fiber_g numeric(6, 1) not null check (fiber_g >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  notes text not null default '',
  source text not null check (source in ('open_food_facts', 'usda', 'estimated', 'mock')),
  created_at timestamptz not null default now()
);

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  canonical_food_name text not null,
  estimated_quantity numeric(8, 1) not null check (estimated_quantity > 0),
  unit text not null,
  calories integer not null check (calories >= 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbs_g numeric(6, 1) not null check (carbs_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  fiber_g numeric(6, 1) not null check (fiber_g >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  data_source text not null check (data_source in ('open_food_facts', 'usda', 'estimated', 'mock')),
  source_food_id text
);

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  type text not null check (type in ('portion_up', 'portion_down', 'add_oil', 'add_sauce', 'remove_item')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.food_items enable row level security;
alter table public.corrections enable row level security;

create policy "Users manage their own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users manage their own meals"
on public.meals for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users read meal items through their meals"
on public.food_items for select
using (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users insert meal items through their meals"
on public.food_items for insert
with check (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users update meal items through their meals"
on public.food_items for update
using (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()))
with check (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users delete meal items through their meals"
on public.food_items for delete
using (exists (select 1 from public.meals where meals.id = food_items.meal_id and meals.user_id = auth.uid()));

create policy "Users manage corrections through their meals"
on public.corrections for all
using (exists (select 1 from public.meals where meals.id = corrections.meal_id and meals.user_id = auth.uid()))
with check (exists (select 1 from public.meals where meals.id = corrections.meal_id and meals.user_id = auth.uid()));

create index meals_user_captured_at_idx on public.meals(user_id, captured_at desc);
create index food_items_meal_id_idx on public.food_items(meal_id);
create index corrections_meal_id_idx on public.corrections(meal_id);
```

- [ ] **Step 2: Create Edge Function contract**

Create `supabase/functions/analyze-meal/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type AnalyzeRequest = {
  imageUrl: string;
  userId: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  let payload: AnalyzeRequest;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!payload.imageUrl || !payload.userId) {
    return jsonResponse({ error: 'missing_image_url_or_user_id' }, 400);
  }

  const mealId = crypto.randomUUID();
  const openAiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openAiKey) {
    return jsonResponse({
      meal: {
        id: mealId,
        userId: payload.userId,
        imageUri: payload.imageUrl,
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
    });
  }

  return jsonResponse({
    error: 'openai_pipeline_not_enabled_in_mvp',
    message: 'The mobile MVP uses local mock analysis. Replace this branch with a structured OpenAI vision call when secrets and nutrition API keys are configured.',
  }, 501);
});
```

- [ ] **Step 3: Validate SQL locally if Supabase CLI is available**

Run:

```powershell
npx supabase@latest --version
```

Expected: Supabase CLI version prints. If the CLI is unavailable, install it before running database commands:

```powershell
npm install --save-dev supabase
```

- [ ] **Step 4: Commit backend contract**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add supabase
git commit -m "feat: add Supabase schema and analysis contract"
```

Expected: commit succeeds.

## Task 8: Final Verification And MVP Readiness

**Files:**
- Modify: `apps/mobile/README.md`
- Modify: `README.md`

- [ ] **Step 1: Create mobile README**

Create `apps/mobile/README.md`:

```md
# MacroLens Mobile

Expo React Native MVP for photo-first macro tracking.

## Commands

- `npm install`
- `npm test`
- `npx tsc --noEmit`
- `npm run web`
- `npm run ios`
- `npm run android`

## Current Analysis Mode

The MVP uses `createMockAnalysisService()` so the app works without API keys. The Supabase Edge Function contract exists in `../../supabase/functions/analyze-meal/index.ts` and returns the same JSON shape.

## Safety Note

MacroLens shows nutrition estimates. It does not provide medical advice, diagnosis, or treatment guidance.
```

- [ ] **Step 2: Create root README**

Create `README.md`:

```md
# MacroLens

MacroLens is a mobile MVP for estimating calories and macros from a food photo with a confidence-first user experience.

## Structure

- `apps/mobile`: Expo React Native app.
- `supabase`: database migration and Edge Function contract.
- `docs/superpowers/specs`: product and technical spec.
- `docs/superpowers/plans`: implementation plans.

## Verify

```powershell
Set-Location apps/mobile
npm test
npx tsc --noEmit
npm run web
```

## Product Principle

The app avoids fake precision. Every scan presents an estimate, a plausible calorie range, and a confidence level.
```

- [ ] **Step 3: Run automated verification**

Run:

```powershell
Set-Location apps/mobile
npm test
npx tsc --noEmit
```

Expected: tests PASS and TypeScript exits with code `0`.

- [ ] **Step 4: Run manual smoke test**

Run:

```powershell
npm run web
```

Expected manual checks:

- onboarding renders and goal taps enter the home screen;
- home screen shows MacroLens, daily summary, and scan button;
- camera flow opens the device/browser permission flow;
- successful capture shows analyzing state then result state;
- correction chips update macro totals;
- save returns to home;
- timeline shows the saved meal;
- opening a saved meal shows the editable result screen.

- [ ] **Step 5: Commit final readiness docs**

Run:

```powershell
Set-Location C:\Users\idris\OneDrive\Documents\AppMobile
git add README.md apps/mobile/README.md
git commit -m "docs: add MacroLens MVP verification guide"
```

Expected: commit succeeds.

## Self-Review

Spec coverage:

- Photo-first mobile app: Task 1 and Task 6.
- Macros, calories, fiber, confidence: Task 2, Task 3, Task 5, Task 6.
- Correction loop: Task 4 and Task 6.
- Daily summary and timeline: Task 5 and Task 6.
- Local persistence: Task 4.
- Backend readiness: Task 7.
- Safety disclaimers: Task 6 onboarding and Task 8 docs.
- Market differentiation through honest ranges and confidence: Task 2, Task 5, Task 6.

Placeholder scan:

- The plan contains no open placeholder tokens and no unspecified file responsibilities.

Type consistency:

- `Meal`, `FoodItem`, `ConfidenceTier`, `NutritionSource`, `MealCorrection`, `AnalysisResult`, and `AnalysisService` are introduced before use.
- Later tasks reuse the same property names defined in `apps/mobile/src/domain/types.ts`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-23-macrolens-mvp.md`. Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
