# Trust And App Store Release V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the release-readiness layer for MacroLens: repeatability scoring, trust gates, App Store-safe monetization plan, and TestFlight readiness.

**Architecture:** Keep trust scoring as pure TypeScript in the Supabase analysis boundary so it can evaluate backend outputs without touching mobile UI. Keep App Store monetization as a separate development-build iteration because Expo Go cannot validate real purchases.

**Tech Stack:** Expo React Native SDK 54 currently, repo-required Expo v56 docs reviewed, Supabase Edge Functions, TypeScript, Vitest, RevenueCat or StoreKit for the follow-up native purchase build.

---

## File Structure

- Create `supabase/functions/analyze-meal/repeatabilityMetrics.ts`: pure scoring for repeated macro snapshots.
- Create `supabase/functions/analyze-meal/repeatabilityMetrics.test.ts`: red/green tests for pass/fail trust gates.
- Create `docs/benchmarks/macrolens-repeatability-benchmark-v1.md`: manual repeatability protocol and release thresholds.
- Create `docs/superpowers/specs/2026-05-24-trust-app-store-release-v1-design.md`: product and compliance design.
- Create `docs/superpowers/plans/2026-05-24-trust-app-store-release-v1.md`: implementation plan.
- Modify `docs/superpowers/status/2026-05-23-macrolens-project-control.md`: record current trust-release status after verification.

---

## Task 1: Repeatability Scoring Utility

**Files:**
- Create: `supabase/functions/analyze-meal/repeatabilityMetrics.test.ts`
- Create: `supabase/functions/analyze-meal/repeatabilityMetrics.ts`

- [ ] **Step 1: Write failing tests**

Create `supabase/functions/analyze-meal/repeatabilityMetrics.test.ts` with tests for:

- passing stable repeated scans;
- failing 10 g protein drift;
- failing calorie percent drift above 8 percent;
- failing insufficient runs.

- [ ] **Step 2: Run red test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/repeatabilityMetrics.test.ts
```

Expected: FAIL because `repeatabilityMetrics.ts` does not exist.

- [ ] **Step 3: Implement utility**

Create `supabase/functions/analyze-meal/repeatabilityMetrics.ts` exporting:

- `MacroSnapshot`;
- `RepeatabilityThresholds`;
- `DEFAULT_REPEATABILITY_THRESHOLDS`;
- `RepeatabilityReport`;
- `evaluateRepeatability`.

- [ ] **Step 4: Run green test**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test -- ../../supabase/functions/analyze-meal/repeatabilityMetrics.test.ts
```

Expected: PASS.

---

## Task 2: Repeatability Benchmark Protocol

**Files:**
- Create: `docs/benchmarks/macrolens-repeatability-benchmark-v1.md`

- [ ] **Step 1: Create benchmark document**

Document:

- five exact-image runs per case;
- optional near-identical framing runs;
- default trust thresholds;
- priority cases, starting with poke bowl;
- release gate.

- [ ] **Step 2: Review protocol**

Confirm the benchmark catches the user-reported failure: same photo drifting by 10 g protein.

---

## Task 3: App Store Monetization Follow-Up

**Files:**
- Modify later: `apps/mobile/package.json`
- Modify later: `apps/mobile/app.json`
- Modify later: `apps/mobile/App.tsx`
- Create later: `apps/mobile/src/payments/revenueCatEntitlements.ts`

- [ ] **Step 1: Do not implement in Expo Go**

Keep the current local entitlement gate for Expo Go only.

- [ ] **Step 2: Prepare RevenueCat development-build plan**

The later implementation must:

- install `react-native-purchases`;
- configure EAS development build;
- create App Store Connect products;
- link products in RevenueCat offerings;
- replace `local_dev` unlock in production;
- test purchases and restore in TestFlight.

---

## Task 4: Verification

**Files:**
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Run full verification**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected:

- tests pass;
- TypeScript passes;
- Expo dependencies are aligned.

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add supabase/functions/analyze-meal/repeatabilityMetrics.ts supabase/functions/analyze-meal/repeatabilityMetrics.test.ts docs/benchmarks/macrolens-repeatability-benchmark-v1.md docs/superpowers/specs/2026-05-24-trust-app-store-release-v1-design.md docs/superpowers/plans/2026-05-24-trust-app-store-release-v1.md docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "feat: add trust release benchmark"
```

---

## Self-Review

- Spec coverage: repeatability, App Store monetization, compliance, and TestFlight readiness are represented.
- Placeholder scan: no release gate relies on unspecified accuracy claims.
- Scope check: real RevenueCat implementation is intentionally deferred to a development-build plan because Expo Go cannot validate real purchases.

