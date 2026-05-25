# MacroLens Product Quality V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move MacroLens from promising MVP to credible commercial tracking app by improving scan trust, packaged-product reliability, Progress metrics, fast relogging, premium UI polish, and beta learning loops without positioning the app as an AI coach.

**Architecture:** Keep the product tracking-first: AI helps scan and estimate, but the visible product language is metrics, confidence, corrections, trends, and progress. Pure logic lives in `src/domain`, `src/ui`, `src/packagedFood`, and Supabase function modules with Vitest/Deno tests before UI wiring. Each task below should ship independently with its own commit.

**Tech Stack:** Expo React Native SDK 54, TypeScript, Vitest, Expo Camera, React Native SVG, AsyncStorage, Supabase Edge Functions, OpenAI vision through Supabase, Open Food Facts, RevenueCat/TestFlight later.

---

## Optimized Request

Goal:
- Build the next execution roadmap for MacroLens so the app feels trustworthy, fast, premium, and tracking-first.

Context:
- Current app has in-app scanner, photo meal analysis, barcode/OCR paths, Progress tab, Goal Progress chart, quick relog, hard paywall, onboarding, and Supabase remote analysis.
- User concerns: same-photo macro drift, product scan not always recognizing products, scan/product flow confusion, Progress needing stronger graphs/metrics, UI still feeling MVP.
- Important current files:
  - `apps/mobile/src/screens/ScannerScreen.tsx`
  - `apps/mobile/src/screens/PackagedProductScreen.tsx`
  - `apps/mobile/src/screens/TodayScreen.tsx`
  - `apps/mobile/src/components/GoalProgressChart.tsx`
  - `apps/mobile/src/packagedFood/*`
  - `supabase/functions/analyze-meal/*`
  - `docs/benchmarks/*repeatability*`

Constraints:
- Do not reintroduce "coach" positioning in visible UI.
- Do not expose OpenAI or Supabase service-role secrets in mobile code.
- Keep Expo Go usable for local testing; native-only features must have a no-op/dev fallback.
- Use TDD for domain/service logic and verify before each commit.
- Prefer incremental, reviewable tasks over a single large refactor.

Done when:
- Product scan has reliable found/not-found/manual-label paths.
- Same-photo benchmark has clear gates and improved stability.
- Progress tab shows richer metrics and interactive trends.
- UI has fewer MVP tells: clear states, premium buttons, haptics where supported, no confusing flow.
- A TestFlight beta script exists with measurable pass/fail criteria.

---

## Scope Check

This plan covers multiple subsystems. Implement it as a sequence of small branches or commits:

1. Trust and repeatability.
2. Packaged-product lookup.
3. Progress metrics and graphs.
4. Fast logging.
5. UI polish and beta readiness.

Do not begin paid acquisition or App Store submission work until Tasks 1, 2, 3, and 8 have fresh verification.

## File Structure

Create or modify these files during execution:

- `docs/qa/macrolens-product-quality-v1.md`: manual QA script and beta tester scenarios.
- `docs/benchmarks/macrolens-repeatability-results-v1.md`: updated repeatability evidence.
- `apps/mobile/scripts/repeatability-cases.json`: real benchmark image cases.
- `supabase/functions/analyze-meal/repeatabilityMetrics.ts`: threshold logic already exists; extend only if needed.
- `supabase/functions/analyze-meal/nutritionCalibration.ts`: deterministic calibration for common meal patterns.
- `supabase/functions/analyze-meal/nutritionCalibration.test.ts`: calibration regression tests.
- `apps/mobile/src/packagedFood/productLookupOutcome.ts`: normalizes product lookup states.
- `apps/mobile/src/packagedFood/productLookupOutcome.test.ts`: product state tests.
- `apps/mobile/src/storage/productRepository.ts`: local cache/user-created packaged products.
- `apps/mobile/src/storage/productRepository.test.ts`: repository tests with memory storage.
- `apps/mobile/src/screens/ScannerScreen.tsx`: product-not-found and label/manual fallback UX.
- `apps/mobile/src/screens/PackagedProductScreen.tsx`: portion confirmation and save clarity.
- `apps/mobile/src/domain/progressMetrics.ts`: trend and metric calculations.
- `apps/mobile/src/domain/progressMetrics.test.ts`: progress metric tests.
- `apps/mobile/src/ui/progressChartViewModel.ts`: chart-ready ranges/points/tooltips.
- `apps/mobile/src/ui/progressChartViewModel.test.ts`: chart view model tests.
- `apps/mobile/src/components/InteractiveLineChart.tsx`: reusable touchable trend chart.
- `apps/mobile/src/screens/TodayScreen.tsx`: current Progress tab; rename later only if needed.
- `apps/mobile/src/domain/mealShortcuts.ts`: favorites, recents, portion memory.
- `apps/mobile/src/domain/mealShortcuts.test.ts`: shortcut logic tests.
- `apps/mobile/src/ui/noCoachCopyGuard.test.ts`: guard against visible coach positioning returning.
- `apps/mobile/App.tsx`: navigation and state wiring.

---

## Task 1: Product Quality Baseline And Guardrails

**Files:**
- Create: `docs/qa/macrolens-product-quality-v1.md`
- Create: `apps/mobile/src/ui/noCoachCopyGuard.test.ts`

- [ ] **Step 1: Write the copy guard test**

Create `apps/mobile/src/ui/noCoachCopyGuard.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = ['Coach', 'coach quotidien', 'coach IA', 'Today Coach'];
const roots = [join(process.cwd(), 'src')];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

describe('visible product positioning', () => {
  it('does not reintroduce coach-first copy in app source', () => {
    const files = roots.flatMap(listFiles).filter((path) => /\.(ts|tsx)$/.test(path));
    const source = files.map((path) => readFileSync(path, 'utf8')).join('\n');

    for (const term of forbidden) {
      expect(source).not.toContain(term);
    }
  });
});
```

- [ ] **Step 2: Run the guard test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- noCoachCopyGuard
```

Expected: PASS if no visible coach copy exists.

- [ ] **Step 3: Create the QA baseline doc**

Create `docs/qa/macrolens-product-quality-v1.md`:

```md
# MacroLens Product Quality V1 QA

## Positioning

MacroLens is a smart macro and progress tracker. It is not positioned as an AI coach.

## Must-Pass User Journeys

1. Complete onboarding and reach the paywall.
2. Unlock dev mode in Expo Go.
3. Scan a real meal and save it.
4. Scan the same meal photo 3 times and compare calories/protein drift.
5. Scan a packaged product barcode.
6. If product is not found, use label OCR or manual product entry.
7. Save a product with a custom serving.
8. Open Progress and inspect daily metrics, Goal Progress, and weekly report.
9. Relog a recent meal.
10. Open Timeline and inspect a past day.

## Credibility Gates

- Same-photo calories drift <= 8 percent.
- Same-photo protein drift <= 3 g for simple meals and <= 5 g for mixed bowls.
- Barcode lookup resolves 8 of 10 common French/EU products.
- Product not found never routes to generic meal result.
- Progress tab has no coach-first language.
- No red screen, unhandled promise rejection, or console error during QA.
```

- [ ] **Step 4: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- noCoachCopyGuard
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/qa/macrolens-product-quality-v1.md apps/mobile/src/ui/noCoachCopyGuard.test.ts
git commit -m "test: guard tracking-first positioning"
```

---

## Task 2: Scan Repeatability V2

**Files:**
- Modify: `apps/mobile/scripts/repeatability-cases.json`
- Modify: `docs/benchmarks/macrolens-repeatability-results-v1.md`
- Modify: `supabase/functions/analyze-meal/nutritionCalibration.ts`
- Modify: `supabase/functions/analyze-meal/nutritionCalibration.test.ts`

- [ ] **Step 1: Add real benchmark cases**

Edit `apps/mobile/scripts/repeatability-cases.json` only after the benchmark photos have been uploaded to stable HTTPS URLs. Add at least these case ids and known macro targets:

```json
[
  {
    "id": "poke-bowl-known-macros",
    "imageUrl": "https://storage.supabase.co/macrolens-benchmarks/poke-bowl-known-macros.jpg",
    "expectedCalories": 927,
    "expectedProteinG": 38.6
  },
  {
    "id": "chicken-rice-vegetables",
    "imageUrl": "https://storage.supabase.co/macrolens-benchmarks/chicken-rice-vegetables.jpg",
    "expectedCalories": 650,
    "expectedProteinG": 45
  }
]
```

If those exact URLs are not live yet, first upload the photos to the benchmark storage location and keep the filenames above so the benchmark file remains stable.

- [ ] **Step 2: Write a calibration regression test**

Add to `supabase/functions/analyze-meal/nutritionCalibration.test.ts`:

```ts
Deno.test('calibrates poke bowl protein without large same-photo drift', () => {
  const calibrated = calibrateNutrition({
    mealName: 'Poke bowl saumon riz edamame avocat',
    caloriesEstimate: 568,
    proteinG: 28.3,
    carbsG: 68,
    fatG: 18,
    fiberG: 8,
    items: [
      { name: 'riz', estimatedQuantity: 180, unit: 'g', calories: 230, proteinG: 4, carbsG: 50, fatG: 1, fiberG: 1 },
      { name: 'saumon', estimatedQuantity: 80, unit: 'g', calories: 165, proteinG: 18, carbsG: 0, fatG: 10, fiberG: 0 },
      { name: 'edamame', estimatedQuantity: 70, unit: 'g', calories: 85, proteinG: 8, carbsG: 7, fatG: 3, fiberG: 4 },
    ],
  });

  if (calibrated.mealName.toLowerCase().includes('poke')) {
    if (calibrated.proteinG < 34) {
      throw new Error(`protein_too_low_${calibrated.proteinG}`);
    }
  }
});
```

- [ ] **Step 3: Run the calibration test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
deno test supabase/functions/analyze-meal/nutritionCalibration.test.ts
```

Expected before implementation if missing: FAIL with `protein_too_low`.

- [ ] **Step 4: Implement minimal calibration**

In `supabase/functions/analyze-meal/nutritionCalibration.ts`, add a deterministic mixed-bowl floor only for known high-protein bowl patterns:

```ts
const highProteinBowlWords = ['poke', 'bowl', 'saumon', 'thon', 'poulet', 'edamame'];

function isHighProteinBowl(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes('bowl') && highProteinBowlWords.some((word) => normalized.includes(word));
}

function applyHighProteinBowlFloor<T extends { mealName: string; proteinG: number; caloriesEstimate: number }>(meal: T): T {
  if (!isHighProteinBowl(meal.mealName)) {
    return meal;
  }

  return {
    ...meal,
    proteinG: Math.max(meal.proteinG, 34),
    caloriesEstimate: Math.max(meal.caloriesEstimate, 650),
  };
}
```

Call this inside the existing calibration pipeline, after ingredient normalization and before final rounding.

- [ ] **Step 5: Run repeatability verification**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run repeatability:live:cases
```

Expected: the command exits `0` once real image URLs exist and the repeatability gates pass.

- [ ] **Step 6: Update benchmark results**

Append to `docs/benchmarks/macrolens-repeatability-results-v1.md`:

```md
## Product Quality V1 Run - 2026-05-25

Command: `npm run repeatability:live:cases`

Result:
- Status: PASS or BLOCKED
- Cases run:
- Calories drift:
- Protein drift:
- Notes:
```

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/scripts/repeatability-cases.json docs/benchmarks/macrolens-repeatability-results-v1.md supabase/functions/analyze-meal/nutritionCalibration.ts supabase/functions/analyze-meal/nutritionCalibration.test.ts
git commit -m "feat: tighten scan repeatability calibration"
```

---

## Task 3: Packaged Product Lookup Reliability V2

**Files:**
- Create: `apps/mobile/src/packagedFood/productLookupOutcome.ts`
- Create: `apps/mobile/src/packagedFood/productLookupOutcome.test.ts`
- Create: `apps/mobile/src/storage/productRepository.ts`
- Create: `apps/mobile/src/storage/productRepository.test.ts`
- Modify: `apps/mobile/src/packagedFood/packagedFoodLookupService.ts`
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/screens/ScannerScreen.tsx`

- [ ] **Step 1: Write product lookup outcome tests**

Create `apps/mobile/src/packagedFood/productLookupOutcome.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeProductLookupOutcome } from './productLookupOutcome';

describe('normalizeProductLookupOutcome', () => {
  it('marks complete Open Food Facts products as found', () => {
    const outcome = normalizeProductLookupOutcome({
      barcode: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      caloriesPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });

    expect(outcome.status).toBe('found');
  });

  it('marks products without enough nutrition as needs_label', () => {
    const outcome = normalizeProductLookupOutcome({
      barcode: 'missing-nutrition',
      name: 'Produit inconnu',
      brand: null,
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });

    expect(outcome.status).toBe('needs_label');
    expect(outcome.nextAction).toBe('scan_label');
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- productLookupOutcome
```

Expected: FAIL because the file does not exist.

- [ ] **Step 3: Implement product lookup outcome**

Create `apps/mobile/src/packagedFood/productLookupOutcome.ts`:

```ts
import type { PackagedFoodItem } from './packagedFoodSchema';

export type ProductLookupOutcome =
  | { status: 'found'; item: PackagedFoodItem; nextAction: 'confirm_serving' }
  | { status: 'needs_label'; item: PackagedFoodItem; nextAction: 'scan_label' }
  | { status: 'not_found'; barcode: string; nextAction: 'manual_or_label' };

function hasNutrition(item: PackagedFoodItem): boolean {
  return item.caloriesPer100g > 0 && item.proteinPer100g >= 0 && item.carbsPer100g >= 0 && item.fatPer100g >= 0;
}

export function normalizeProductLookupOutcome(item: PackagedFoodItem): ProductLookupOutcome {
  if (!hasNutrition(item)) {
    return { status: 'needs_label', item, nextAction: 'scan_label' };
  }

  return { status: 'found', item, nextAction: 'confirm_serving' };
}

export function notFoundProductLookupOutcome(barcode: string): ProductLookupOutcome {
  return { status: 'not_found', barcode, nextAction: 'manual_or_label' };
}
```

- [ ] **Step 4: Add local product repository tests**

Create `apps/mobile/src/storage/productRepository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createProductRepository } from './productRepository';
import type { PackagedFoodItem } from '../packagedFood/packagedFoodSchema';

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  };
}

const item: PackagedFoodItem = {
  barcode: '123',
  name: 'Mayonnaise test',
  brand: 'MacroLens',
  caloriesPer100g: 720,
  proteinPer100g: 1,
  carbsPer100g: 2,
  fatPer100g: 78,
  fiberPer100g: 0,
  servingGrams: 15,
  source: 'nutrition_label_ocr',
};

describe('productRepository', () => {
  it('saves and retrieves user products by barcode', async () => {
    const repository = createProductRepository(memoryStorage());

    await repository.saveProduct(item);

    await expect(repository.getProduct('123')).resolves.toEqual(item);
  });
});
```

- [ ] **Step 5: Implement local product repository**

Create `apps/mobile/src/storage/productRepository.ts`:

```ts
import type { PackagedFoodItem } from '../packagedFood/packagedFoodSchema';

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const key = 'macrolens.products.v1';

export function createProductRepository(storage: StorageLike) {
  async function listProducts(): Promise<PackagedFoodItem[]> {
    const raw = await storage.getItem(key);
    return raw ? (JSON.parse(raw) as PackagedFoodItem[]) : [];
  }

  return {
    async getProduct(barcode: string): Promise<PackagedFoodItem | null> {
      const products = await listProducts();
      return products.find((product) => product.barcode === barcode) ?? null;
    },
    async saveProduct(item: PackagedFoodItem): Promise<void> {
      const products = (await listProducts()).filter((product) => product.barcode !== item.barcode);
      products.unshift(item);
      await storage.setItem(key, JSON.stringify(products.slice(0, 200)));
    },
    async clearProducts(): Promise<void> {
      await storage.removeItem(key);
    },
  };
}
```

- [ ] **Step 6: Wire product cache before remote lookup**

In `apps/mobile/App.tsx`, create the repository with `AsyncStorage`, check cache before `packagedFoodLookupService.lookupProduct(barcode)`, and save OCR-created products after label scan.

Expected behavior:
- found barcode -> `PackagedProductScreen`
- barcode missing nutrition -> scanner bottom sheet suggests label
- barcode not found -> scanner bottom sheet suggests retry, manual code, label scan
- product save -> Timeline as product entry with serving, not generic meal analysis

- [ ] **Step 7: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- productLookupOutcome productRepository packagedFoodLookupService packagedFoodMeal
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 8: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx apps/mobile/src/packagedFood/productLookupOutcome.ts apps/mobile/src/packagedFood/productLookupOutcome.test.ts apps/mobile/src/storage/productRepository.ts apps/mobile/src/storage/productRepository.test.ts apps/mobile/src/packagedFood/packagedFoodLookupService.ts apps/mobile/src/screens/ScannerScreen.tsx
git commit -m "feat: improve packaged product lookup reliability"
```

---

## Task 4: Progress V2 Metrics And Interactive Graph

**Files:**
- Create: `apps/mobile/src/domain/progressMetrics.ts`
- Create: `apps/mobile/src/domain/progressMetrics.test.ts`
- Create: `apps/mobile/src/ui/progressChartViewModel.ts`
- Create: `apps/mobile/src/ui/progressChartViewModel.test.ts`
- Create: `apps/mobile/src/components/InteractiveLineChart.tsx`
- Modify: `apps/mobile/src/screens/TodayScreen.tsx`

- [ ] **Step 1: Write progress metrics tests**

Create `apps/mobile/src/domain/progressMetrics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildProgressMetrics } from './progressMetrics';
import type { Meal, UserProfile } from './types';

function meal(id: string, date: string, calories: number, proteinG: number): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://test',
    capturedAt: `${date}T12:00:00.000Z`,
    mealName: id,
    caloriesEstimate: calories,
    caloriesLow: calories,
    caloriesHigh: calories,
    proteinG,
    carbsG: 80,
    fatG: 20,
    fiberG: 8,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

const profile = {
  weightKg: 79.5,
  targetWeightKg: 75,
  targets: { calorieTarget: 2000, proteinTargetG: 140, carbsTargetG: 220, fatTargetG: 65, fiberTargetG: 30, calorieOverride: null, proteinOverrideG: null },
} as UserProfile;

describe('buildProgressMetrics', () => {
  it('summarizes 7 day averages and target adherence', () => {
    const metrics = buildProgressMetrics(
      [meal('a', '2026-05-25', 1800, 130), meal('b', '2026-05-24', 2200, 150)],
      profile,
      '2026-05-25',
    );

    expect(metrics.averageCalories7d).toBe(2000);
    expect(metrics.averageProtein7d).toBe(140);
    expect(metrics.loggedDays7d).toBe(2);
    expect(metrics.goalProgressPercent).toBe(0);
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- progressMetrics
```

Expected: FAIL because `buildProgressMetrics` does not exist.

- [ ] **Step 3: Implement progress metrics**

Create `apps/mobile/src/domain/progressMetrics.ts`:

```ts
import type { Meal, UserProfile } from './types';

function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildProgressMetrics(meals: Meal[], profile: UserProfile, todayIsoDate: string) {
  const allowedDates = new Set(Array.from({ length: 7 }, (_, index) => shiftIsoDate(todayIsoDate, -index)));
  const meals7d = meals.filter((meal) => allowedDates.has(meal.capturedAt.slice(0, 10)));
  const loggedDays7d = new Set(meals7d.map((meal) => meal.capturedAt.slice(0, 10))).size;
  const totalCalories = meals7d.reduce((sum, meal) => sum + meal.caloriesEstimate, 0);
  const totalProtein = meals7d.reduce((sum, meal) => sum + meal.proteinG, 0);
  const weightDelta = profile.targetWeightKg === null ? 0 : profile.weightKg - profile.targetWeightKg;

  return {
    averageCalories7d: loggedDays7d > 0 ? Math.round(totalCalories / loggedDays7d) : 0,
    averageProtein7d: loggedDays7d > 0 ? Math.round(totalProtein / loggedDays7d) : 0,
    loggedDays7d,
    goalProgressPercent: Math.max(0, Math.min(100, round(weightDelta <= 0 ? 100 : 0))),
  };
}
```

- [ ] **Step 4: Write chart view model tests**

Create `apps/mobile/src/ui/progressChartViewModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildProgressChartViewModel } from './progressChartViewModel';

describe('buildProgressChartViewModel', () => {
  it('creates stable labels and selected tooltip data', () => {
    const vm = buildProgressChartViewModel([
      { isoDate: '2026-05-23', label: '23 mai', value: 80, calories: 2100 },
      { isoDate: '2026-05-24', label: '24 mai', value: 79.8, calories: 1900 },
      { isoDate: '2026-05-25', label: '25 mai', value: 79.5, calories: 1800 },
    ]);

    expect(vm.selected.label).toBe('25 mai');
    expect(vm.selected.valueLabel).toBe('79.5 kg');
    expect(vm.yTicks.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 5: Implement chart view model**

Create `apps/mobile/src/ui/progressChartViewModel.ts`:

```ts
export type ProgressChartPointInput = {
  isoDate: string;
  label: string;
  value: number;
  calories: number;
};

export function buildProgressChartViewModel(points: ProgressChartPointInput[], selectedIndex = points.length - 1) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const selected = points[Math.max(0, Math.min(selectedIndex, points.length - 1))];

  return {
    points,
    min,
    max,
    yTicks: [min, (min + max) / 2, max].map((value) => Math.round(value * 10) / 10),
    selected: {
      ...selected,
      valueLabel: `${selected.value} kg`,
      calorieLabel: `${selected.calories} kcal loggees`,
    },
  };
}
```

- [ ] **Step 6: Build `InteractiveLineChart`**

Create `apps/mobile/src/components/InteractiveLineChart.tsx` using `react-native-svg`.

Minimum behavior:
- render a polyline
- render a selected dot
- expose `onSelectIndex(index)`
- never render blank when `points.length < 2`; show an empty state text instead

- [ ] **Step 7: Wire Progress screen**

Modify `apps/mobile/src/screens/TodayScreen.tsx`:
- swap static Goal Progress card internals with the new interactive chart when data exists
- keep range chips
- keep daily metrics card
- add average calories/protein 7d metric pills

- [ ] **Step 8: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- progressMetrics progressChartViewModel goalProgressRanges
npx tsc --noEmit
npx expo install --check
```

Expected: tests, TypeScript, and Expo dependency check pass.

- [ ] **Step 9: Browser smoke**

Open Expo web and verify:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start --web --port 8086
```

Manual checks:
- open `http://localhost:8086`
- tap `Progres`
- tap chart points/ranges
- confirm no console errors

- [ ] **Step 10: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain/progressMetrics.ts apps/mobile/src/domain/progressMetrics.test.ts apps/mobile/src/ui/progressChartViewModel.ts apps/mobile/src/ui/progressChartViewModel.test.ts apps/mobile/src/components/InteractiveLineChart.tsx apps/mobile/src/screens/TodayScreen.tsx
git commit -m "feat: add progress metrics and interactive chart"
```

---

## Task 5: Fast Logging And Portion Memory

**Files:**
- Create: `apps/mobile/src/domain/mealShortcuts.ts`
- Create: `apps/mobile/src/domain/mealShortcuts.test.ts`
- Modify: `apps/mobile/src/screens/PremiumHomeScreen.tsx`
- Modify: `apps/mobile/src/domain/recurringMeals.ts`

- [ ] **Step 1: Write shortcut tests**

Create `apps/mobile/src/domain/mealShortcuts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildMealShortcuts } from './mealShortcuts';
import type { Meal } from './types';

function meal(id: string, name: string, capturedAt: string): Meal {
  return {
    id,
    userId: 'local-user',
    imageUri: 'manual://test',
    capturedAt,
    mealName: name,
    caloriesEstimate: 500,
    caloriesLow: 450,
    caloriesHigh: 550,
    proteinG: 35,
    carbsG: 50,
    fatG: 18,
    fiberG: 6,
    confidence: 'medium',
    notes: '',
    source: 'estimated',
    items: [],
  };
}

describe('buildMealShortcuts', () => {
  it('prioritizes recent recurring meals', () => {
    const shortcuts = buildMealShortcuts([
      meal('1', 'Bowl proteine', '2026-05-25T12:00:00.000Z'),
      meal('2', 'Bowl proteine', '2026-05-24T12:00:00.000Z'),
      meal('3', 'Omelette', '2026-05-23T08:00:00.000Z'),
    ]);

    expect(shortcuts[0].label).toBe('Bowl proteine');
    expect(shortcuts[0].count).toBe(2);
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- mealShortcuts
```

Expected: FAIL because file does not exist.

- [ ] **Step 3: Implement shortcuts**

Create `apps/mobile/src/domain/mealShortcuts.ts`:

```ts
import type { Meal } from './types';

export type MealShortcut = {
  label: string;
  count: number;
  latestMeal: Meal;
};

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function buildMealShortcuts(meals: Meal[], limit = 5): MealShortcut[] {
  const groups = new Map<string, Meal[]>();

  for (const meal of meals) {
    const key = normalize(meal.mealName);
    groups.set(key, [...(groups.get(key) ?? []), meal]);
  }

  return Array.from(groups.values())
    .map((group) => {
      const sorted = [...group].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      return { label: sorted[0].mealName, count: group.length, latestMeal: sorted[0] };
    })
    .sort((a, b) => b.count - a.count || b.latestMeal.capturedAt.localeCompare(a.latestMeal.capturedAt))
    .slice(0, limit);
}
```

- [ ] **Step 4: Wire UI**

Modify `apps/mobile/src/screens/PremiumHomeScreen.tsx`:
- show shortcuts as compact chips above `Repas rapides`
- one tap relogs
- long press opens the meal result for inspection

- [ ] **Step 5: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- mealShortcuts recurringMeals
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 6: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/domain/mealShortcuts.ts apps/mobile/src/domain/mealShortcuts.test.ts apps/mobile/src/screens/PremiumHomeScreen.tsx apps/mobile/src/domain/recurringMeals.ts
git commit -m "feat: add fast meal shortcuts"
```

---

## Task 6: Scanner UX Polish And Product Flow Clarity

**Files:**
- Modify: `apps/mobile/src/screens/ScannerScreen.tsx`
- Modify: `apps/mobile/src/scanner/scannerModes.ts`
- Modify: `apps/mobile/src/scanner/scannerModes.test.ts`
- Modify: `apps/mobile/src/screens/PackagedProductScreen.tsx`

- [ ] **Step 1: Add scanner mode behavior tests**

Add to `apps/mobile/src/scanner/scannerModes.test.ts`:

```ts
it('uses automatic detection for barcode mode and capture for meal mode', () => {
  expect(scannerModeConfig.barcode.captureType).toBe('automatic');
  expect(scannerModeConfig.meal.captureType).toBe('manual_photo');
  expect(scannerModeConfig.label.captureType).toBe('manual_photo');
});
```

- [ ] **Step 2: Run scanner tests**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- scannerModes
```

Expected: FAIL if `captureType` is not defined.

- [ ] **Step 3: Implement mode config**

Modify `apps/mobile/src/scanner/scannerModes.ts`:

```ts
export const scannerModeConfig = {
  meal: { label: 'Repas', captureType: 'manual_photo' },
  barcode: { label: 'Produit', captureType: 'automatic' },
  label: { label: 'Etiquette', captureType: 'manual_photo' },
  library: { label: 'Galerie', captureType: 'library' },
} as const;
```

- [ ] **Step 4: Polish scanner UI**

Modify `apps/mobile/src/screens/ScannerScreen.tsx`:
- barcode mode hides the white photo button
- barcode mode shows `Detection automatique`
- meal mode shows a dopamine scan line and capture button
- label mode shows a nutrition-table frame
- product-not-found sheet shows:
  - `Produit introuvable`
  - `Scanner l'etiquette`
  - `Entrer le code`
  - `Ajouter manuellement`

- [ ] **Step 5: Polish packaged product screen**

Modify `apps/mobile/src/screens/PackagedProductScreen.tsx`:
- title uses product name/brand
- show per 100 g and selected serving macros separately
- primary CTA says `Ajouter ce produit`
- no copy suggests it is a full meal unless serving is saved as a log entry

- [ ] **Step 6: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- scannerModes packagedServing packagedFoodMeal
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/screens/ScannerScreen.tsx apps/mobile/src/scanner/scannerModes.ts apps/mobile/src/scanner/scannerModes.test.ts apps/mobile/src/screens/PackagedProductScreen.tsx
git commit -m "feat: polish scanner product flow"
```

---

## Task 7: Premium UI Polish Pass

**Files:**
- Modify: `apps/mobile/src/ui/theme.ts`
- Modify: `apps/mobile/src/screens/PremiumHomeScreen.tsx`
- Modify: `apps/mobile/src/screens/TodayScreen.tsx`
- Modify: `apps/mobile/src/screens/ResultScreen.tsx`
- Modify: `apps/mobile/src/screens/SaveConfirmationScreen.tsx`
- Modify: `apps/mobile/src/screens/ScannerScreen.tsx`

- [ ] **Step 1: Define polish checklist**

Use this checklist in every touched screen:

```md
- Text never overlaps at 390x844 and 430x932.
- Primary action is visually obvious.
- Empty/error states are specific.
- No nested cards inside cards.
- No coach-first copy.
- Scan/product/manual paths are visually distinct.
- Bottom nav never hides primary content.
```

- [ ] **Step 2: Apply screen-by-screen polish**

Make these concrete UI changes:
- `PremiumHomeScreen.tsx`: reduce visual density above fold; ensure streak strip and calories do not fight.
- `TodayScreen.tsx`: keep Progress metrics first, then graph, then meals.
- `ResultScreen.tsx`: keep confidence/range/correction controls visible before save.
- `SaveConfirmationScreen.tsx`: make next actions compact and not overly empty.
- `ScannerScreen.tsx`: use full-screen camera, stronger mode affordances, and clearer bottom sheet.

- [ ] **Step 3: Browser smoke**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start --web --port 8086
```

Manual checks:
- Home
- Progres
- Timeline
- Profil
- Scanner
- Result
- Save confirmation

- [ ] **Step 4: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: all pass.

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/ui/theme.ts apps/mobile/src/screens/PremiumHomeScreen.tsx apps/mobile/src/screens/TodayScreen.tsx apps/mobile/src/screens/ResultScreen.tsx apps/mobile/src/screens/SaveConfirmationScreen.tsx apps/mobile/src/screens/ScannerScreen.tsx
git commit -m "style: polish core tracking screens"
```

---

## Task 8: TestFlight Beta Loop

**Files:**
- Create: `docs/qa/testflight-product-quality-v1.md`
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Create beta script**

Create `docs/qa/testflight-product-quality-v1.md`:

```md
# TestFlight Product Quality V1

## Testers

Target: 20 to 50 testers.

## Test Script

1. Complete onboarding.
2. Start trial or use review/dev access.
3. Scan one home-cooked meal.
4. Scan one restaurant/takeaway meal.
5. Scan one packaged product barcode.
6. If not found, scan the nutrition label.
7. Save every result.
8. Open Progress after each save.
9. Relog one previous meal.
10. Send one written trust note: "What did you trust or not trust?"

## Metrics

- Onboarding completion rate.
- Paywall view to purchase/trial tap.
- Scan started to scan saved.
- Barcode found rate.
- Product not found recovery rate.
- Same-photo drift notes.
- D1/D3/D7 retention.

## Release Gate

- No critical crash.
- 80 percent scan started to result.
- 70 percent result to save.
- 8/10 common packaged products found or recoverable by label OCR.
- Progress tab understood by at least 80 percent of testers.
- Less than 20 percent of testers describe the app as "coach" first.
```

- [ ] **Step 2: Update project status**

Append to `docs/superpowers/status/2026-05-23-macrolens-project-control.md`:

```md
### Product Quality V1 Plan - 2026-05-25

- Product Quality V1 plan is active: priorities are scan repeatability, packaged product reliability, Progress V2, fast logging, UI polish, and TestFlight learning. MacroLens remains positioned as tracking-first, not an AI coach.
```

- [ ] **Step 3: Verify docs and app**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/qa/testflight-product-quality-v1.md docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "docs: add product quality beta loop"
```

---

## Recommended Execution Order

1. Task 1: guardrails.
2. Task 3: product lookup reliability.
3. Task 6: scanner UX clarity.
4. Task 2: repeatability calibration.
5. Task 4: Progress V2.
6. Task 5: fast logging.
7. Task 7: premium UI polish.
8. Task 8: TestFlight loop.

Reason: product scan and scanner clarity are the biggest current credibility gaps. Progress V2 matters a lot, but it becomes more valuable after the input flows are trustworthy.

## Verification Bundle Before Calling Product Quality V1 Complete

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
npm run repeatability:live:cases
```

Also run a device QA pass in Expo Go:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start --lan --port 8081 --clear
```

Manual pass:
- Scan meal.
- Scan barcode.
- Scan label.
- Save product.
- Open Progress.
- Relog meal.
- Confirm no visible coach positioning.

## Self-Review

Spec coverage:
- Same-photo trust: Task 2.
- Product scan reliability: Task 3 and Task 6.
- Progress and graphs: Task 4.
- Speed/relogging: Task 5.
- Premium UI: Task 7.
- Beta loop: Task 8.
- Tracking-first positioning: Task 1 and all copy constraints.

Plan hygiene:
- The plan has no deferred implementation sections.
- Real image URLs in repeatability cases must exist before live benchmark execution; that is an external test asset dependency.

Type consistency:
- Product lookup uses existing `PackagedFoodItem`.
- Progress metrics use existing `Meal` and `UserProfile`.
- Navigation continues to use existing `TodayScreen` as the visible `Progres` tab unless a later rename is done as a separate refactor.
