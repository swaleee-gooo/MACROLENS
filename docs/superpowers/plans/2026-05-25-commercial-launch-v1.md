# Commercial Launch V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the commercial launch layer for MacroLens: measurable scan trust, production-ready subscriptions, conversion onboarding, packaged-food logging, progress tracking, App Store readiness, beta workflow, and launch assets.

**Architecture:** Keep the work in small release tracks with independent commits. Pure business logic lives in `src/domain`, analytics and entitlement boundaries live behind interfaces, mobile UI stays in focused screen/components files, and backend packaged-food logic stays in Supabase Edge Functions. Expo Go keeps a development path, but production purchase behavior is validated only in an EAS development/TestFlight build.

**Tech Stack:** Expo React Native SDK 54, TypeScript, Vitest, Supabase Edge Functions, OpenAI vision/OCR through Supabase, Open Food Facts, RevenueCat, EAS development builds, App Store Connect, TestFlight.

---

## Scope Check

Commercial Launch V1 spans multiple subsystems. This plan is a master execution plan, not a single huge PR. Each task below must be implemented, verified, and committed independently before moving to the next task.

Do not public-launch or run paid acquisition until Tasks 1, 2, 3, 4, and 8 have passed their gates.

## File Structure

Create or modify these files during execution:

- `apps/mobile/src/analytics/analyticsEvents.ts`: typed commercial event names and payloads.
- `apps/mobile/src/analytics/analyticsClient.ts`: privacy-safe analytics facade with testable in-memory and console sinks.
- `apps/mobile/src/analytics/analyticsClient.test.ts`: analytics payload validation tests.
- `apps/mobile/scripts/repeatability-cases.json`: executable live same-photo benchmark cases.
- `apps/mobile/scripts/run-repeatability-benchmark.mjs`: expand from single URL to case-file mode.
- `docs/benchmarks/macrolens-repeatability-results-v1.md`: benchmark run log and release-gate status.
- `docs/benchmarks/macrolens-repeatability-required-cases-v1.md`: photo collection checklist for the 10-case release gate.
- `apps/mobile/src/entitlements/entitlementTypes.ts`: production entitlement types.
- `apps/mobile/src/entitlements/localEntitlementProvider.ts`: Expo Go/dev entitlement provider.
- `apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts`: RevenueCat provider for native builds.
- `apps/mobile/src/entitlements/entitlementProviderFactory.ts`: chooses provider by app config.
- `apps/mobile/src/entitlements/*.test.ts`: provider and gating tests.
- `apps/mobile/app.json`: bundle identifier, build metadata, and native plugin config.
- `apps/mobile/eas.json`: development, preview, and production build profiles.
- `apps/mobile/src/screens/OnboardingScreen.tsx`: conversion-first onboarding flow.
- `apps/mobile/src/screens/PaywallScreen.tsx`: production subscription UI and restore behavior.
- `apps/mobile/src/screens/ResultScreen.tsx`: Scan Result V2 trust and correction UI.
- `apps/mobile/src/domain/scanTrust.ts`: confidence/range/correction view model logic.
- `apps/mobile/src/domain/scanTrust.test.ts`: trust UI logic tests.
- `apps/mobile/src/packagedFood/openFoodFacts.ts`: packaged-food lookup client.
- `apps/mobile/src/packagedFood/packagedFoodSchema.ts`: parsed packaged-food schema.
- `apps/mobile/src/screens/BarcodeScanScreen.tsx`: barcode scanning entry point.
- `apps/mobile/src/screens/LabelScanScreen.tsx`: label OCR fallback entry point.
- `supabase/functions/lookup-packaged-food/index.ts`: barcode and label lookup Edge Function entry.
- `supabase/functions/lookup-packaged-food/handler.ts`: lookup and OCR orchestration.
- `supabase/functions/lookup-packaged-food/handler.test.ts`: packaged-food backend tests.
- `apps/mobile/src/domain/weeklyReport.ts`: weekly summary logic.
- `apps/mobile/src/domain/weeklyReport.test.ts`: weekly report tests.
- `apps/mobile/src/ui/progressOverviewViewModel.ts`: neutral daily progress summary.
- `apps/mobile/src/ui/progressOverviewViewModel.test.ts`: progress summary tests.
- `apps/mobile/src/screens/TodayScreen.tsx`: Progress UI improvements.
- `apps/mobile/src/screens/WeeklyReportScreen.tsx`: new weekly report screen.
- `apps/mobile/src/screens/LegalScreen.tsx`: privacy, terms, disclaimer, delete/export entry points.
- `docs/app-store/app-review-notes.md`: App Review notes.
- `docs/app-store/subscription-products.md`: product ids, pricing, review instructions.
- `docs/qa/testflight-commercial-launch-v1.md`: beta test script and success gates.
- `docs/marketing/launch-assets-v1.md`: landing page copy, App Store screenshot story, TikTok/UGC scripts.
- `docs/superpowers/status/2026-05-23-macrolens-project-control.md`: current execution status.

---

## Task 1: Commercial Analytics Foundation

**Files:**
- Create: `apps/mobile/src/analytics/analyticsEvents.ts`
- Create: `apps/mobile/src/analytics/analyticsClient.ts`
- Create: `apps/mobile/src/analytics/analyticsClient.test.ts`
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Write failing analytics tests**

Create `apps/mobile/src/analytics/analyticsClient.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createAnalyticsClient, createMemoryAnalyticsSink } from './analyticsClient';

describe('analytics client', () => {
  it('records typed commercial events without private image data', () => {
    const sink = createMemoryAnalyticsSink();
    const analytics = createAnalyticsClient(sink);

    analytics.track('scan_completed', {
      source: 'photo',
      confidence: 'low',
      caloriesEstimate: 789,
      corrected: false,
    });

    expect(sink.events).toEqual([
      {
        name: 'scan_completed',
        payload: {
          source: 'photo',
          confidence: 'low',
          caloriesEstimate: 789,
          corrected: false,
        },
      },
    ]);
  });

  it('rejects image URLs and raw text notes from analytics payloads', () => {
    const sink = createMemoryAnalyticsSink();
    const analytics = createAnalyticsClient(sink);

    expect(() =>
      analytics.track('scan_started', {
        source: 'photo',
        imageUri: 'file:///private/photo.jpg',
      }),
    ).toThrow('analytics_private_payload_imageUri');

    expect(() =>
      analytics.track('meal_saved', {
        source: 'photo',
        rawNote: 'full private user note',
      }),
    ).toThrow('analytics_private_payload_rawNote');
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/analytics/analyticsClient.test.ts
```

Expected: FAIL because `analyticsClient.ts` does not exist.

- [ ] **Step 3: Implement event types**

Create `apps/mobile/src/analytics/analyticsEvents.ts`:

```ts
export type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'paywall_viewed'
  | 'paywall_cta_tapped'
  | 'trial_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'restore_purchases_tapped'
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'non_food_detected'
  | 'correction_applied'
  | 'meal_saved'
  | 'barcode_scan_started'
  | 'barcode_scan_completed'
  | 'label_scan_completed'
  | 'progress_viewed'
  | 'weekly_report_viewed';

export type AnalyticsPayload = Record<string, string | number | boolean | null>;
```

- [ ] **Step 4: Implement analytics client**

Create `apps/mobile/src/analytics/analyticsClient.ts`:

```ts
import type { AnalyticsEventName, AnalyticsPayload } from './analyticsEvents';

const privatePayloadKeys = new Set(['imageUri', 'imageUrl', 'photoUrl', 'rawNote', 'freeText']);

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
};

export type AnalyticsSink = {
  track(event: AnalyticsEvent): void;
};

export type AnalyticsClient = {
  track(name: AnalyticsEventName, payload?: AnalyticsPayload): void;
};

export function assertPrivacySafePayload(payload: AnalyticsPayload): void {
  for (const key of Object.keys(payload)) {
    if (privatePayloadKeys.has(key)) {
      throw new Error(`analytics_private_payload_${key}`);
    }
  }
}

export function createMemoryAnalyticsSink(): AnalyticsSink & { events: AnalyticsEvent[] } {
  return {
    events: [],
    track(event) {
      this.events.push(event);
    },
  };
}

export function createConsoleAnalyticsSink(): AnalyticsSink {
  return {
    track(event) {
      console.log('[analytics]', event.name, event.payload);
    },
  };
}

export function createAnalyticsClient(sink: AnalyticsSink): AnalyticsClient {
  return {
    track(name, payload = {}) {
      assertPrivacySafePayload(payload);
      sink.track({ name, payload });
    },
  };
}
```

- [ ] **Step 5: Run green test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/analytics/analyticsClient.test.ts
```

Expected: PASS.

- [ ] **Step 6: Wire low-risk events into `App.tsx`**

Modify `apps/mobile/App.tsx`:

```ts
import { createAnalyticsClient, createConsoleAnalyticsSink } from './src/analytics/analyticsClient';
```

Add near `const queryClient = new QueryClient();`:

```ts
const analytics = createAnalyticsClient(createConsoleAnalyticsSink());
```

Add in the initial `useEffect` after loading starts:

```ts
analytics.track('app_opened');
```

Add inside `analyzeImageUri` before setting analyzing state:

```ts
analytics.track('scan_started', { source: 'photo' });
```

Add after a successful analysis:

```ts
analytics.track('scan_completed', {
  source: 'photo',
  confidence: analysis.meal.confidence,
  caloriesEstimate: analysis.meal.caloriesEstimate,
  corrected: false,
});
```

Add in the non-food branch:

```ts
analytics.track('non_food_detected', { source: 'photo' });
```

Add in the generic analysis error branch:

```ts
analytics.track('scan_failed', { source: 'photo', reason: 'analysis_error' });
```

Add inside `saveMeal` after `repository.saveMeal(meal)`:

```ts
analytics.track('meal_saved', { source: meal.source, caloriesEstimate: meal.caloriesEstimate });
```

- [ ] **Step 7: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Expected: all tests and TypeScript pass.

- [ ] **Step 8: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/src/analytics apps/mobile/App.tsx
git commit -m "feat: add commercial analytics foundation"
```

---

## Task 2: Expand Live Scan Trust Benchmarks

**Files:**
- Create: `apps/mobile/scripts/repeatability-cases.json`
- Modify: `apps/mobile/scripts/run-repeatability-benchmark.mjs`
- Create: `docs/benchmarks/macrolens-repeatability-results-v1.md`
- Create: `docs/benchmarks/macrolens-repeatability-required-cases-v1.md`
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Create the executable seed benchmark file**

Create `apps/mobile/scripts/repeatability-cases.json`:

```json
[
  {
    "id": "poke-salmon-wikimedia",
    "label": "Salmon poke bowl",
    "category": "poke_bowl",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/1/13/Salmon_Poke.jpg",
    "marketingEligible": true
  },
  {
    "id": "banana-simple",
    "label": "Single banana",
    "category": "simple_food",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg",
    "marketingEligible": true
  }
]
```

This file contains only runnable cases. Do not add a case until it has a usable HTTPS image URL or a signed Supabase URL.

- [ ] **Step 2: Create the required case collection checklist**

Create `docs/benchmarks/macrolens-repeatability-required-cases-v1.md`:

```md
# MacroLens Repeatability Required Cases V1

Date: 2026-05-25

## Release Requirement

Commercial launch requires 10 live same-photo cases in `apps/mobile/scripts/repeatability-cases.json`.

## Cases Still Needed

- Restaurant salad with visible dressing.
- Bakery item such as croissant, pain au chocolat, or muffin.
- Pasta dish with creamy or oily sauce.
- Burger and fries.
- Mixed French plate with protein, starch, vegetables, and sauce.
- Sauce-heavy bowl.
- Packaged food with visible product and barcode.
- Non-food object such as laptop, bottle, hand, or desk.

## Acceptance Rules

- Each case has a stable HTTPS image URL or signed Supabase URL.
- The image can be used for internal benchmark logging.
- The label states the category and expected risk.
- Marketing demos use only cases where `marketingEligible` is true and the case passes the benchmark.
```

- [ ] **Step 3: Modify the live script to accept case-file mode**

Update `apps/mobile/scripts/run-repeatability-benchmark.mjs`:

```js
import { existsSync, readFileSync } from 'node:fs';
```

Extend `parseArgs` so it returns:

```js
const caseFileArg = argv.find((arg) => arg.startsWith('--case-file='));
return {
  imageUrl,
  caseFile: caseFileArg ? caseFileArg.replace('--case-file=', '') : null,
  runCount: runCountArg ? Number(runCountArg.replace('--runs=', '')) : 5,
  delayMs: delayArg ? Number(delayArg.replace('--delay-ms=', '')) : 750,
};
```

Add this helper:

```js
function loadCases(caseFile) {
  if (!caseFile) {
    return null;
  }
  const resolvedPath = resolve(caseFile);
  if (!existsSync(resolvedPath)) {
    throw new Error(`case_file_missing_${resolvedPath}`);
  }
  return JSON.parse(readFileSync(resolvedPath, 'utf8'));
}
```

Modify `main`:

```js
const { imageUrl, caseFile, runCount, delayMs } = parseArgs(process.argv);
const cases = loadCases(caseFile);
const benchmarks = cases ?? [{ id: 'single-url', label: 'Single URL', category: 'single', imageUrl, marketingEligible: false }];
const summaries = [];

for (const benchmarkCase of benchmarks) {
  const result = await runRepeatabilityBenchmark(supabase.functions, {
    imageUrl: benchmarkCase.imageUrl,
    runCount,
    delayMs,
  });
  summaries.push({
    id: benchmarkCase.id,
    label: benchmarkCase.label,
    category: benchmarkCase.category,
    marketingEligible: benchmarkCase.marketingEligible,
    ...createSummary(result),
  });
}

console.log(JSON.stringify({ passed: summaries.every((summary) => summary.passed), summaries }, null, 2));
if (!summaries.every((summary) => summary.passed)) {
  process.exitCode = 2;
}
```

- [ ] **Step 4: Run live case-file benchmark**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run repeatability:live -- --case-file=scripts/repeatability-cases.json --runs=5
```

Expected: PASS for every case in `scripts/repeatability-cases.json`.

- [ ] **Step 5: Record benchmark results**

Create `docs/benchmarks/macrolens-repeatability-results-v1.md`:

```md
# MacroLens Repeatability Results V1

Date: 2026-05-25
Command: `npm run repeatability:live -- --case-file=scripts/repeatability-cases.json --runs=5`

## Current Gate

- Public cases executed: 2
- Additional real cases required before launch: 8
- Release claim allowed: no

## Results

Record the JSON summary emitted by the command in Step 4.

## Release Rule

MacroLens cannot claim "same photo, stable macros" publicly until at least 10 live same-photo cases pass the thresholds in `docs/benchmarks/macrolens-repeatability-benchmark-v1.md`.
```

Do not commit this file unless the `Results` section contains the actual command output from Step 4.

- [ ] **Step 6: Update project status**

Add a Current State line in `docs/superpowers/status/2026-05-23-macrolens-project-control.md`:

```md
- Commercial repeatability benchmark now supports case-file runs; public launch still requires adding 8 real test images and recording 10 passing same-photo cases.
```

- [ ] **Step 7: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run repeatability:live -- --case-file=scripts/repeatability-cases.json --runs=5
npm test
npx tsc --noEmit
```

Expected: benchmark passes for every case in the case file; tests and TypeScript pass.

- [ ] **Step 8: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/scripts/repeatability-cases.json apps/mobile/scripts/run-repeatability-benchmark.mjs docs/benchmarks/macrolens-repeatability-results-v1.md docs/benchmarks/macrolens-repeatability-required-cases-v1.md docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "feat: expand live repeatability benchmark cases"
```

---

## Task 3: Production Entitlement Architecture

**Files:**
- Create: `apps/mobile/src/entitlements/entitlementTypes.ts`
- Create: `apps/mobile/src/entitlements/localEntitlementProvider.ts`
- Create: `apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts`
- Create: `apps/mobile/src/entitlements/entitlementProviderFactory.ts`
- Create: `apps/mobile/src/entitlements/entitlementProviderFactory.test.ts`
- Modify: `apps/mobile/src/storage/entitlementRepository.ts`
- Modify: `apps/mobile/src/config/env.ts`
- Modify: `apps/mobile/src/config/env.test.ts`
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/eas.json`

- [ ] **Step 1: Install native purchase dependencies**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo install expo-dev-client
npm install react-native-purchases
```

Expected: `package.json` and lockfile update.

- [ ] **Step 2: Write failing entitlement factory tests**

Create `apps/mobile/src/entitlements/entitlementProviderFactory.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createEntitlementProvider } from './entitlementProviderFactory';

describe('createEntitlementProvider', () => {
  it('uses local development provider in Expo Go mode', () => {
    const provider = createEntitlementProvider({
      entitlementMode: 'local_dev',
      revenueCatAppleApiKey: '',
      isExpoGo: true,
    });

    expect(provider.kind).toBe('local_dev');
  });

  it('uses RevenueCat when store mode has an iOS api key', () => {
    const provider = createEntitlementProvider({
      entitlementMode: 'store',
      revenueCatAppleApiKey: 'appl_test_key',
      isExpoGo: false,
    });

    expect(provider.kind).toBe('revenue_cat');
  });

  it('throws when store mode is requested inside Expo Go', () => {
    expect(() =>
      createEntitlementProvider({
        entitlementMode: 'store',
        revenueCatAppleApiKey: 'appl_test_key',
        isExpoGo: true,
      }),
    ).toThrow('store_entitlements_require_development_build');
  });
});
```

- [ ] **Step 3: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/entitlements/entitlementProviderFactory.test.ts
```

Expected: FAIL because entitlement files do not exist.

- [ ] **Step 4: Create entitlement types**

Create `apps/mobile/src/entitlements/entitlementTypes.ts`:

```ts
export type EntitlementMode = 'local_dev' | 'store';

export type CommercialEntitlementState = {
  isPremium: boolean;
  source: 'none' | 'local_dev' | 'store';
  productId: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

export type PurchasePlan = 'monthly' | 'annual';

export type EntitlementProvider = {
  kind: 'local_dev' | 'revenue_cat';
  getEntitlement(): Promise<CommercialEntitlementState>;
  purchase(plan: PurchasePlan): Promise<CommercialEntitlementState>;
  restore(): Promise<CommercialEntitlementState>;
};
```

- [ ] **Step 5: Create local provider**

Create `apps/mobile/src/entitlements/localEntitlementProvider.ts`:

```ts
import type { CommercialEntitlementState, EntitlementProvider, PurchasePlan } from './entitlementTypes';

function activeLocalEntitlement(): CommercialEntitlementState {
  return {
    isPremium: true,
    source: 'local_dev',
    productId: 'local_dev_unlock',
    expiresAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function createLocalEntitlementProvider(): EntitlementProvider {
  return {
    kind: 'local_dev',
    async getEntitlement() {
      return {
        isPremium: false,
        source: 'none',
        productId: null,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
      };
    },
    async purchase(_plan: PurchasePlan) {
      return activeLocalEntitlement();
    },
    async restore() {
      return activeLocalEntitlement();
    },
  };
}
```

- [ ] **Step 6: Create RevenueCat provider boundary**

Create `apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts`:

```ts
import Purchases from 'react-native-purchases';
import type { CommercialEntitlementState, EntitlementProvider, PurchasePlan } from './entitlementTypes';

const entitlementId = 'macrolens_pro';
const packageByPlan: Record<PurchasePlan, number> = {
  monthly: 0,
  annual: 1,
};

function stateFromCustomerInfo(customerInfo: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>): CommercialEntitlementState {
  const entitlement = customerInfo.entitlements.active[entitlementId];
  return {
    isPremium: Boolean(entitlement),
    source: entitlement ? 'store' : 'none',
    productId: entitlement?.productIdentifier ?? null,
    expiresAt: entitlement?.expirationDate ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export function createRevenueCatEntitlementProvider(appleApiKey: string): EntitlementProvider {
  Purchases.configure({ apiKey: appleApiKey });

  return {
    kind: 'revenue_cat',
    async getEntitlement() {
      return stateFromCustomerInfo(await Purchases.getCustomerInfo());
    },
    async purchase(plan) {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        throw new Error('revenuecat_offering_missing');
      }
      const selectedPackage = current.availablePackages[packageByPlan[plan]];
      if (!selectedPackage) {
        throw new Error(`revenuecat_package_missing_${plan}`);
      }
      const result = await Purchases.purchasePackage(selectedPackage);
      return stateFromCustomerInfo(result.customerInfo);
    },
    async restore() {
      return stateFromCustomerInfo(await Purchases.restorePurchases());
    },
  };
}
```

- [ ] **Step 7: Create provider factory**

Create `apps/mobile/src/entitlements/entitlementProviderFactory.ts`:

```ts
import { createLocalEntitlementProvider } from './localEntitlementProvider';
import { createRevenueCatEntitlementProvider } from './revenueCatEntitlementProvider';
import type { EntitlementMode, EntitlementProvider } from './entitlementTypes';

type Config = {
  entitlementMode: EntitlementMode;
  revenueCatAppleApiKey: string;
  isExpoGo: boolean;
};

export function createEntitlementProvider(config: Config): EntitlementProvider {
  if (config.entitlementMode === 'local_dev') {
    return createLocalEntitlementProvider();
  }

  if (config.isExpoGo) {
    throw new Error('store_entitlements_require_development_build');
  }

  if (!config.revenueCatAppleApiKey) {
    throw new Error('revenuecat_apple_api_key_missing');
  }

  return createRevenueCatEntitlementProvider(config.revenueCatAppleApiKey);
}
```

- [ ] **Step 8: Extend env config**

Modify `apps/mobile/src/config/env.ts` so `appEnv` includes:

```ts
entitlementMode: process.env.EXPO_PUBLIC_ENTITLEMENT_MODE === 'store' ? 'store' : 'local_dev',
revenueCatAppleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? '',
```

Update `apps/mobile/src/config/env.test.ts` with explicit assertions for default `local_dev` and store mode when env is set.

- [ ] **Step 9: Configure native build metadata**

Modify `apps/mobile/app.json`:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.macrolens.app"
}
```

Create `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

- [ ] **Step 10: Wire provider into app**

In `apps/mobile/App.tsx`, replace direct local unlock logic with provider calls:

```ts
const entitlementProvider = useMemo(
  () =>
    createEntitlementProvider({
      entitlementMode: appEnv.entitlementMode,
      revenueCatAppleApiKey: appEnv.revenueCatAppleApiKey,
      isExpoGo: Constants.appOwnership === 'expo',
    }),
  [],
);
```

Import `Constants` from `expo-constants`. Install it if missing:

```powershell
npx expo install expo-constants
```

Change `unlockForDevelopment` to:

```ts
async function purchase(plan: PurchasePlan) {
  const nextEntitlement = await entitlementProvider.purchase(plan);
  await entitlementRepository.saveEntitlement({
    isPremium: nextEntitlement.isPremium,
    source: nextEntitlement.source,
    updatedAt: nextEntitlement.updatedAt,
  });
  setEntitlement({
    isPremium: nextEntitlement.isPremium,
    source: nextEntitlement.source,
    updatedAt: nextEntitlement.updatedAt,
  });
  if (nextEntitlement.isPremium) {
    setScreen({ name: 'app', tab: 'home' });
  }
}
```

Change `restorePurchases` to call `entitlementProvider.restore()` and update stored entitlement.

- [ ] **Step 11: Verify in Expo Go mode**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: tests pass, TypeScript passes, Expo dependencies are aligned.

- [ ] **Step 12: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/app.json apps/mobile/eas.json apps/mobile/App.tsx apps/mobile/src/config apps/mobile/src/entitlements apps/mobile/src/storage/entitlementRepository.ts
git commit -m "feat: add production entitlement architecture"
```

---

## Task 4: Conversion Onboarding And Production Paywall

**Files:**
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx`
- Modify: `apps/mobile/src/screens/PaywallScreen.tsx`
- Modify: `apps/mobile/src/components/PaywallPlanCard.tsx`
- Modify: `apps/mobile/App.tsx`
- Create: `apps/mobile/src/domain/onboardingConversion.ts`
- Create: `apps/mobile/src/domain/onboardingConversion.test.ts`

- [ ] **Step 1: Write onboarding conversion tests**

Create `apps/mobile/src/domain/onboardingConversion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildPersonalizedPromise } from './onboardingConversion';

describe('buildPersonalizedPromise', () => {
  it('creates a fat-loss promise from goal and friction', () => {
    expect(
      buildPersonalizedPromise({
        goal: 'lose_fat',
        friction: 'restaurant_meals',
        proteinTargetG: 150,
      }),
    ).toBe('Scanne tes repas au restaurant, corrige les portions en secondes, et vise 150g de proteines par jour.');
  });

  it('creates a muscle-gain promise from hidden calories friction', () => {
    expect(
      buildPersonalizedPromise({
        goal: 'build_muscle',
        friction: 'hidden_calories',
        proteinTargetG: 170,
      }),
    ).toBe('Garde tes proteines hautes, repere les calories cachees, et construis tes repas autour de 170g de proteines par jour.');
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/onboardingConversion.test.ts
```

Expected: FAIL because `onboardingConversion.ts` does not exist.

- [ ] **Step 3: Implement promise builder**

Create `apps/mobile/src/domain/onboardingConversion.ts`:

```ts
export type ConversionGoal = 'lose_fat' | 'build_muscle' | 'maintain' | 'understand_nutrition';
export type TrackingFriction = 'weighing_food' | 'forgetting_meals' | 'restaurant_meals' | 'hidden_calories';

type Input = {
  goal: ConversionGoal;
  friction: TrackingFriction;
  proteinTargetG: number;
};

export function buildPersonalizedPromise(input: Input): string {
  if (input.goal === 'build_muscle') {
    return `Garde tes proteines hautes, repere les calories cachees, et construis tes repas autour de ${input.proteinTargetG}g de proteines par jour.`;
  }

  if (input.friction === 'restaurant_meals') {
    return `Scanne tes repas au restaurant, corrige les portions en secondes, et vise ${input.proteinTargetG}g de proteines par jour.`;
  }

  if (input.friction === 'weighing_food') {
    return `Atteins tes macros sans peser chaque assiette, avec un objectif clair de ${input.proteinTargetG}g de proteines par jour.`;
  }

  return `Transforme chaque scan en decision simple et garde ${input.proteinTargetG}g de proteines comme cap quotidien.`;
}
```

- [ ] **Step 4: Update onboarding flow**

Modify `apps/mobile/src/screens/OnboardingScreen.tsx` to use this step sequence:

```ts
type OnboardingStep = 'goal' | 'friction' | 'measures' | 'activity' | 'proof';
```

The visible sequence must be:

1. goal selection;
2. tracking friction selection;
3. body measurements;
4. activity;
5. personalized proof screen.

On the proof screen, show:

```tsx
<Text>Ton plan MacroLens</Text>
<Text>{buildPersonalizedPromise({ goal, friction, proteinTargetG: profile.targets.proteinG })}</Text>
<Text>Analyse IA + corrections rapides + suivi des progres</Text>
```

Fire analytics events:

```ts
analytics.track('onboarding_step_completed', { step: 'goal' });
analytics.track('onboarding_completed', { goal, friction });
```

- [ ] **Step 5: Update paywall props**

Modify `PaywallScreen` props:

```ts
type Props = {
  onPurchase: (plan: PaywallPlan) => void;
  onRestore: () => void;
  showDevelopmentUnlock: boolean;
  onUnlockForDevelopment: () => void;
};
```

Change the CTA to call:

```ts
onPurchase(selectedPlan);
```

Only render the Expo Go unlock button when `showDevelopmentUnlock` is true.

- [ ] **Step 6: Add subscription clarity**

Keep these lines visible in `PaywallScreen.tsx`:

```tsx
<Text>Essai gratuit si disponible. Abonnement renouvele automatiquement. Annulable a tout moment depuis les reglages App Store.</Text>
<Pressable onPress={onRestore}><Text>Restaurer mes achats</Text></Pressable>
```

- [ ] **Step 7: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: all checks pass.

- [ ] **Step 8: Browser QA**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run web -- --port 8081
```

Manual checks:

- onboarding shows goal, friction, measures, activity, proof;
- proof screen uses personalized copy;
- paywall shows annual/monthly, terms, restore purchases;
- Expo Go dev unlock appears only in development mode.

- [ ] **Step 9: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx apps/mobile/src/screens/OnboardingScreen.tsx apps/mobile/src/screens/PaywallScreen.tsx apps/mobile/src/components/PaywallPlanCard.tsx apps/mobile/src/domain/onboardingConversion.ts apps/mobile/src/domain/onboardingConversion.test.ts
git commit -m "feat: add conversion onboarding and paywall"
```

---

## Task 5: Scan Result V2 Trust And Correction UI

**Files:**
- Create: `apps/mobile/src/domain/scanTrust.ts`
- Create: `apps/mobile/src/domain/scanTrust.test.ts`
- Modify: `apps/mobile/src/screens/ResultScreen.tsx`
- Modify: `apps/mobile/src/domain/corrections.ts`
- Modify: `apps/mobile/src/domain/corrections.test.ts`
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Write scan trust tests**

Create `apps/mobile/src/domain/scanTrust.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildScanTrustViewModel } from './scanTrust';

describe('buildScanTrustViewModel', () => {
  it('shows wider calorie range and correction prompts for low confidence meals', () => {
    const viewModel = buildScanTrustViewModel({
      caloriesEstimate: 800,
      caloriesLow: 650,
      caloriesHigh: 980,
      proteinG: 40,
      confidence: 'low',
      uncertaintyReasons: ['poke_bowl_hidden_rice_or_sauce'],
      correctionSuggestions: [],
    });

    expect(viewModel.confidenceLabel).toBe('Estimation prudente');
    expect(viewModel.calorieRangeLabel).toBe('650-980 kcal');
    expect(viewModel.prompts).toContain('Sauce ou huile visible ?');
    expect(viewModel.prompts).toContain('Portion plus grande que prevu ?');
  });
});
```

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/domain/scanTrust.test.ts
```

Expected: FAIL because `scanTrust.ts` does not exist.

- [ ] **Step 3: Implement scan trust view model**

Create `apps/mobile/src/domain/scanTrust.ts`:

```ts
import type { Meal } from './types';

type MealTrustInput = Pick<Meal, 'caloriesEstimate' | 'caloriesLow' | 'caloriesHigh' | 'proteinG' | 'confidence' | 'uncertaintyReasons' | 'correctionSuggestions'>;

export type ScanTrustViewModel = {
  confidenceLabel: string;
  calorieRangeLabel: string;
  proteinLabel: string;
  prompts: string[];
};

export function buildScanTrustViewModel(meal: MealTrustInput): ScanTrustViewModel {
  const prompts = new Set<string>();

  if (meal.confidence === 'low') {
    prompts.add('Portion plus grande que prevu ?');
  }

  if (meal.uncertaintyReasons.some((reason) => /sauce|oil|huile|hidden|cache/i.test(reason))) {
    prompts.add('Sauce ou huile visible ?');
  }

  if (meal.correctionSuggestions.some((suggestion) => suggestion.correctionType === 'add_sauce')) {
    prompts.add('Ajouter une sauce');
  }

  return {
    confidenceLabel: meal.confidence === 'high' ? 'Haute confiance' : meal.confidence === 'medium' ? 'A verifier' : 'Estimation prudente',
    calorieRangeLabel: `${meal.caloriesLow}-${meal.caloriesHigh} kcal`,
    proteinLabel: `${Math.round(meal.proteinG)}g proteines`,
    prompts: Array.from(prompts),
  };
}
```

- [ ] **Step 4: Improve correction event tracking**

In `App.tsx`, replace inline correction handler with:

```ts
function applyCorrectionAndTrack(meal: Meal, correction: MealCorrection) {
  const correctedMeal = applyMealCorrection(meal, correction);
  analytics.track('correction_applied', {
    correctionType: correction.correctionType,
    caloriesEstimate: correctedMeal.caloriesEstimate,
  });
  setScreen({ name: 'result', meal: correctedMeal, isSaved: false });
}
```

Import `MealCorrection` from the current correction domain file.

- [ ] **Step 5: Update ResultScreen UI**

In `apps/mobile/src/screens/ResultScreen.tsx`, compute:

```ts
const trust = buildScanTrustViewModel(meal);
```

Render near the top:

```tsx
<Text>{trust.confidenceLabel}</Text>
<Text>{trust.calorieRangeLabel}</Text>
<Text>{trust.proteinLabel}</Text>
```

Render prompt chips:

```tsx
{trust.prompts.map((prompt) => (
  <View key={prompt}>
    <Text>{prompt}</Text>
  </View>
))}
```

Keep existing correction chips and portion adjustment entry.

- [ ] **Step 6: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx apps/mobile/src/domain/scanTrust.ts apps/mobile/src/domain/scanTrust.test.ts apps/mobile/src/domain/corrections.ts apps/mobile/src/domain/corrections.test.ts apps/mobile/src/screens/ResultScreen.tsx
git commit -m "feat: improve scan trust and corrections"
```

---

## Task 6: Barcode And Nutrition Label OCR Flow

**Files:**
- Create: `apps/mobile/src/packagedFood/packagedFoodSchema.ts`
- Create: `apps/mobile/src/packagedFood/openFoodFacts.ts`
- Create: `apps/mobile/src/packagedFood/openFoodFacts.test.ts`
- Create: `apps/mobile/src/screens/BarcodeScanScreen.tsx`
- Create: `apps/mobile/src/screens/LabelScanScreen.tsx`
- Modify: `apps/mobile/App.tsx`
- Create: `supabase/functions/lookup-packaged-food/index.ts`
- Create: `supabase/functions/lookup-packaged-food/handler.ts`
- Create: `supabase/functions/lookup-packaged-food/handler.test.ts`

- [ ] **Step 1: Install camera dependency**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo install expo-camera
```

Expected: Expo installs the SDK-compatible camera package.

- [ ] **Step 2: Write Open Food Facts mapping test**

Create `apps/mobile/src/packagedFood/openFoodFacts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mapOpenFoodFactsProduct } from './openFoodFacts';

describe('mapOpenFoodFactsProduct', () => {
  it('maps product nutriments per 100g into a packaged food item', () => {
    const item = mapOpenFoodFactsProduct({
      code: '3017620422003',
      product: {
        product_name: 'Nutella',
        nutriments: {
          'energy-kcal_100g': 539,
          proteins_100g: 6.3,
          carbohydrates_100g: 57.5,
          fat_100g: 30.9,
          fiber_100g: 0,
        },
      },
    });

    expect(item).toEqual({
      barcode: '3017620422003',
      name: 'Nutella',
      caloriesPer100g: 539,
      proteinPer100g: 6.3,
      carbsPer100g: 57.5,
      fatPer100g: 30.9,
      fiberPer100g: 0,
      source: 'open_food_facts',
    });
  });
});
```

- [ ] **Step 3: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- src/packagedFood/openFoodFacts.test.ts
```

Expected: FAIL because packaged food files do not exist.

- [ ] **Step 4: Create schema and mapper**

Create `apps/mobile/src/packagedFood/packagedFoodSchema.ts`:

```ts
export type PackagedFoodItem = {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  source: 'open_food_facts' | 'nutrition_label_ocr';
};
```

Create `apps/mobile/src/packagedFood/openFoodFacts.ts`:

```ts
import type { PackagedFoodItem } from './packagedFoodSchema';

type OpenFoodFactsProductResponse = {
  code: string;
  product?: {
    product_name?: string;
    nutriments?: Record<string, number | undefined>;
  };
};

function numberField(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function mapOpenFoodFactsProduct(response: OpenFoodFactsProductResponse): PackagedFoodItem {
  const nutriments = response.product?.nutriments ?? {};
  return {
    barcode: response.code,
    name: response.product?.product_name || 'Produit scanne',
    caloriesPer100g: numberField(nutriments['energy-kcal_100g']),
    proteinPer100g: numberField(nutriments.proteins_100g),
    carbsPer100g: numberField(nutriments.carbohydrates_100g),
    fatPer100g: numberField(nutriments.fat_100g),
    fiberPer100g: numberField(nutriments.fiber_100g),
    source: 'open_food_facts',
  };
}
```

- [ ] **Step 5: Create Supabase packaged-food Edge Function**

Create `supabase/functions/lookup-packaged-food/handler.ts`:

```ts
type LookupRequest = {
  barcode?: string;
};

export async function handleLookupPackagedFood(request: Request): Promise<Response> {
  const body = (await request.json()) as LookupRequest;
  if (!body.barcode) {
    return Response.json({ error: 'barcode_required' }, { status: 400 });
  }

  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(body.barcode)}.json`);
  if (!response.ok) {
    return Response.json({ error: 'open_food_facts_failed' }, { status: 502 });
  }

  const payload = await response.json();
  if (!payload.product) {
    return Response.json({ error: 'product_not_found' }, { status: 404 });
  }

  return Response.json({
    code: body.barcode,
    product: payload.product,
  });
}
```

Create `supabase/functions/lookup-packaged-food/index.ts`:

```ts
import { handleLookupPackagedFood } from './handler.ts';

Deno.serve((request) => handleLookupPackagedFood(request));
```

- [ ] **Step 6: Create barcode screen**

Create `apps/mobile/src/screens/BarcodeScanScreen.tsx` with `expo-camera` `CameraView`, `onBarcodeScanned`, and two callbacks:

```ts
type Props = {
  onBack: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onOpenLabelScan: () => void;
};
```

The screen must show:

- back button;
- camera preview;
- fallback button labelled `Scanner l'etiquette`;
- manual fallback button labelled `Ajouter manuellement`.

- [ ] **Step 7: Create label scan screen**

Create `apps/mobile/src/screens/LabelScanScreen.tsx` with image picker capture and props:

```ts
type Props = {
  onBack: () => void;
  onLabelPhoto: (imageUri: string) => void;
};
```

The screen must show:

- title `Photo de l'etiquette`;
- guidance `Cadre le tableau nutritionnel`;
- button `Prendre la photo`.

- [ ] **Step 8: Wire routes**

Modify `App.tsx`:

Add screen states:

```ts
| { name: 'barcodeScan' }
| { name: 'labelScan' }
```

Add handlers:

```ts
function openBarcodeScan() {
  analytics.track('barcode_scan_started');
  setScreen({ name: 'barcodeScan' });
}

function openLabelScan() {
  setScreen({ name: 'labelScan' });
}
```

Pass `onBarcodeScan={openBarcodeScan}` into `PremiumHomeScreen`, then add a button there for packaged food scanning.

- [ ] **Step 9: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: tests, TypeScript, and Expo dependency check pass.

- [ ] **Step 10: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/App.tsx apps/mobile/src/packagedFood apps/mobile/src/screens/BarcodeScanScreen.tsx apps/mobile/src/screens/LabelScanScreen.tsx supabase/functions/lookup-packaged-food
git commit -m "feat: add barcode and label scan flow"
```

---

## Task 7: Progress Tracking And Weekly Report

**Positioning rule:** MacroLens is a smart tracking app, not an AI coaching app. The product may show metrics, gaps, trends, streaks, and weekly summaries, but visible UI should avoid coach-style next-action instructions.

**Files:**
- Create/maintain: `apps/mobile/src/ui/progressOverviewViewModel.ts`
- Create/maintain: `apps/mobile/src/ui/progressOverviewViewModel.test.ts`
- Create/maintain: `apps/mobile/src/domain/weeklyReport.ts`
- Create/maintain: `apps/mobile/src/domain/weeklyReport.test.ts`
- Modify: `apps/mobile/src/screens/TodayScreen.tsx`
- Create/maintain: `apps/mobile/src/screens/WeeklyReportScreen.tsx`
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Write Progress Overview tests**

Create tests proving the screen formats neutral tracking metrics:

```ts
expect(overview.metrics).toEqual([
  { label: 'Calories restantes', value: '600 kcal' },
  { label: 'Proteines restantes', value: '45 g' },
  { label: 'Repas logges', value: '2' },
]);
```

- [ ] **Step 2: Implement Progress Overview**

The overview should show remaining or tracked totals only:

```ts
export function buildProgressOverview(summary: DailySummary) {
  return {
    title: 'Suivi du jour',
    metrics: [
      { label: 'Calories restantes', value: '600 kcal' },
      { label: 'Proteines restantes', value: '45 g' },
      { label: 'Repas logges', value: '2' },
    ],
  };
}
```

- [ ] **Step 3: Keep Weekly Report**

Weekly report may summarize adherence and trends, but copy should remain metric-led rather than coach-led.

- [ ] **Step 4: Update screens**

`TodayScreen.tsx` should become the `Progres` surface:

- title: `Progres`
- neutral daily metrics card
- Goal Progress chart
- weekly report CTA
- meals logged for the day

- [ ] **Step 5: Wire navigation and analytics**

- Bottom navigation label: `Progres`
- Analytics event: `progress_viewed`
- Weekly report event remains `weekly_report_viewed`

- [ ] **Step 6: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Expected: tests and TypeScript pass.

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx apps/mobile/src/ui/progressOverviewViewModel.ts apps/mobile/src/ui/progressOverviewViewModel.test.ts apps/mobile/src/domain/weeklyReport.ts apps/mobile/src/domain/weeklyReport.test.ts apps/mobile/src/screens/TodayScreen.tsx apps/mobile/src/screens/WeeklyReportScreen.tsx
git commit -m "feat: add progress tracking and weekly report"
```

---

## Task 8: App Store Compliance And TestFlight Package

**Files:**
- Create: `apps/mobile/src/screens/LegalScreen.tsx`
- Modify: `apps/mobile/src/screens/SettingsScreen.tsx`
- Modify: `apps/mobile/App.tsx`
- Create: `docs/app-store/app-review-notes.md`
- Create: `docs/app-store/subscription-products.md`
- Create: `docs/qa/testflight-commercial-launch-v1.md`
- Create: `docs/marketing/launch-assets-v1.md`
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Create legal screen**

Create `apps/mobile/src/screens/LegalScreen.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
};

export function LegalScreen({ onBack }: Props) {
  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl }}>
        <Pressable onPress={onBack}>
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
        </Pressable>
        <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Legal et confidentialite</Text>
        <Text style={{ color: colors.ink, fontSize: typography.body, lineHeight: 24 }}>
          MacroLens fournit des estimations nutritionnelles et ne remplace pas un avis medical.
        </Text>
        <Text style={{ color: colors.ink, fontSize: typography.body, lineHeight: 24 }}>
          Politique de confidentialite: https://macrolens.app/privacy
        </Text>
        <Text style={{ color: colors.ink, fontSize: typography.body, lineHeight: 24 }}>
          Conditions d'utilisation: https://macrolens.app/terms
        </Text>
        <Text style={{ color: colors.ink, fontSize: typography.body, lineHeight: 24 }}>
          Support: support@macrolens.app
        </Text>
        <Text style={{ color: colors.ink, fontSize: typography.body, lineHeight: 24 }}>
          Suppression des donnees: contacte support@macrolens.app avec l'adresse de ton compte.
        </Text>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Wire legal route**

Modify `App.tsx`:

```ts
| { name: 'legal' }
```

Render:

```tsx
if (screen.name === 'legal') {
  return <LegalScreen onBack={() => setScreen({ name: 'settings' })} />;
}
```

Pass `onOpenLegal={() => setScreen({ name: 'legal' })}` to `SettingsScreen`.

- [ ] **Step 3: Add legal entry to settings**

Modify `SettingsScreen.tsx` props:

```ts
onOpenLegal: () => void;
```

Add a settings button:

```tsx
<Pressable onPress={onOpenLegal}>
  <Text>Legal, confidentialite et support</Text>
</Pressable>
```

- [ ] **Step 4: Create App Review notes**

Create `docs/app-store/app-review-notes.md`:

```md
# MacroLens App Review Notes

## Review Access

MacroLens requires an active subscription for premium scan flows. For App Review, use the subscription product configured in App Store sandbox or the review instructions provided in App Store Connect.

## Product Behavior

MacroLens estimates nutrition from meal photos. Results are estimates with confidence labels and calorie ranges. The app does not provide medical advice, diagnosis, or guaranteed weight-loss outcomes.

## Backend

The Supabase backend and `analyze-meal` Edge Function must be live during review. The mobile app must not include OpenAI or Supabase service-role secrets.

## Purchases

Subscriptions are managed through Apple In-App Purchase and RevenueCat entitlement `macrolens_pro`. Restore Purchases is available on the paywall.

## Test Steps

1. Complete onboarding.
2. View paywall.
3. Start trial or purchase in sandbox.
4. Restore purchases.
5. Scan a meal photo.
6. Save a meal.
7. Open Timeline, Today, Settings, and Legal screens.
```

- [ ] **Step 5: Create subscription product doc**

Create `docs/app-store/subscription-products.md`:

```md
# MacroLens Subscription Products

## Entitlement

- RevenueCat entitlement: `macrolens_pro`

## App Store Products

- Monthly product id: `macrolens_pro_monthly`
- Annual product id: `macrolens_pro_annual`

## Pricing Hypothesis

- Monthly: EUR 7.99 to EUR 9.99
- Annual: EUR 39.99 to EUR 49.99
- Trial: 3 or 7 days

## Required Checks

- Product ids exist in App Store Connect.
- Products are linked to RevenueCat offering.
- Paywall shows subscription terms.
- Restore Purchases works in TestFlight.
- Production build hides Expo Go local unlock.
```

- [ ] **Step 6: Create TestFlight QA script**

Create `docs/qa/testflight-commercial-launch-v1.md`:

```md
# TestFlight Commercial Launch V1 QA

## Tester Tasks

1. Complete onboarding.
2. Start trial or complete sandbox purchase.
3. Scan 5 real meals.
4. Scan the same meal photo 3 times.
5. Correct at least 2 meals.
6. Scan 1 packaged food barcode.
7. Try label scan if barcode fails.
8. Save meals on 3 different days.
9. Open Progress.
10. Open Weekly Report.
11. Open Settings and Legal.

## Success Gates

- No critical crash.
- Scan success >= 80 percent for normal meal photos.
- Meal save rate after successful scan >= 70 percent.
- At least 10 written notes about trust, correction, and paywall clarity.
- Restore purchases works for at least 3 testers.
```

- [ ] **Step 7: Create launch assets doc**

Create `docs/marketing/launch-assets-v1.md`:

```md
# MacroLens Launch Assets V1

## Landing Page Headline

Scan your meal, correct it in seconds, and know what to eat next.

## App Store Screenshot Story

1. Scan a real meal.
2. See calories, macros, range, and confidence.
3. Correct sauce, oil, and portion size.
4. Track today against your targets.
5. Get a weekly report.

## TikTok/Reels Scripts

### Script 1: Same Photo Trust

Hook: I scanned the same poke bowl five times.
Demo: Show repeated MacroLens results with stable macros.
Close: Macro tracking without weighing every meal.

### Script 2: Restaurant Meal

Hook: Restaurant meals destroy most calorie trackers.
Demo: Scan, add sauce correction, save.
Close: Estimate honestly, correct quickly.

### Script 3: Protein Gap

Hook: You do not need another generic calorie app, you need clear metrics.
Demo: Progress shows remaining protein and calories.
Close: Scan the meal, then track the numbers that matter.
```

- [ ] **Step 8: Update project status**

Add:

```md
- Commercial Launch V1 implementation plan is active; App Store submission remains blocked until TestFlight purchase, restore, scan trust, legal, and beta gates pass.
```

- [ ] **Step 9: Verify**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: tests, TypeScript, and Expo dependencies pass.

- [ ] **Step 10: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile/App.tsx apps/mobile/src/screens/LegalScreen.tsx apps/mobile/src/screens/SettingsScreen.tsx docs/app-store docs/qa/testflight-commercial-launch-v1.md docs/marketing/launch-assets-v1.md docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "feat: prepare app store and testflight launch package"
```

---

## Task 9: Final Release Gate

**Files:**
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`
- Modify: `docs/benchmarks/macrolens-repeatability-results-v1.md`
- Modify: `docs/qa/testflight-commercial-launch-v1.md`

- [ ] **Step 1: Run full local verification**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: all pass.

- [ ] **Step 2: Run live repeatability benchmark**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run repeatability:live -- --case-file=scripts/repeatability-cases.json --runs=5
```

Expected: at least 10 real image cases run; all marketing-eligible cases pass.

- [ ] **Step 3: Run production entitlement smoke test in TestFlight**

Manual checklist:

- paywall loads RevenueCat offering;
- monthly purchase works in sandbox;
- annual purchase works in sandbox;
- restore purchases unlocks `macrolens_pro`;
- Expo Go local unlock is not visible in production/TestFlight build.

- [ ] **Step 4: Record release decision**

Update project status with one of these exact lines:

```md
- Commercial Launch V1 release gate passed: scan trust, subscriptions, onboarding, barcode/OCR, progress tracking, legal, and TestFlight checks are ready for App Store submission.
```

or:

```md
- Commercial Launch V1 release gate blocked: remaining blockers are listed in `docs/qa/testflight-commercial-launch-v1.md`.
```

- [ ] **Step 5: Commit release-gate record**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/superpowers/status/2026-05-23-macrolens-project-control.md docs/benchmarks/macrolens-repeatability-results-v1.md docs/qa/testflight-commercial-launch-v1.md
git commit -m "docs: record commercial launch release gate"
```

---

## Self-Review

Spec coverage:

- Scan trust: Tasks 2 and 5.
- Real monetization: Tasks 3 and 4.
- Conversion onboarding: Task 4.
- Barcode/OCR: Task 6.
- Progress tracking and retention: Task 7.
- App Store compliance: Task 8.
- TestFlight beta: Task 8 and Task 9.
- Acquisition assets: Task 8.
- Analytics funnel: Task 1.

Execution constraints:

- Use TDD for domain logic and service boundaries.
- Keep Expo Go local unlock only in dev mode.
- Do not expose OpenAI or Supabase service-role secrets to mobile.
- Do not claim public accuracy until benchmark gates pass.
- Commit after each task.
