# Mobile QA And Nutrition Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate the MacroLens MVP on real mobile devices and create the first nutrition benchmark before wiring live AI.

**Architecture:** This iteration is documentation- and validation-led. Mobile QA captures real-device behavior against the implemented Expo flow, while the nutrition benchmark defines representative French and European meal cases, expected macro ranges, confidence expectations, failure modes, and scoring rules for later OpenAI/Open Food Facts/USDA integration.

**Tech Stack:** Expo Go, Expo React Native, Vitest, TypeScript, Markdown QA notes, Markdown nutrition benchmark, current `apps/mobile` MVP.

---

## File Structure

- `docs/qa/mobile-qa-checklist.md`: real-device QA script, pass/fail table, and issue log.
- `docs/benchmarks/macrolens-nutrition-benchmark-v1.md`: 50-case nutrition benchmark with scoring rules.
- `docs/superpowers/status/2026-05-23-macrolens-project-control.md`: source-of-truth project control document, updated with links to this iteration.
- `apps/mobile`: app under test; do not change it during benchmark creation unless QA finds a blocking issue.

## Task 1: Mobile QA Checklist

**Files:**
- Create: `docs/qa/mobile-qa-checklist.md`
- Modify only if QA discovers real device issues: `apps/mobile/App.tsx`, `apps/mobile/src/screens/*.tsx`, `apps/mobile/src/components/*.tsx`

- [ ] **Step 1: Open the app with Expo Go**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start
```

Expected: Expo prints a QR code. Scan it with Expo Go on a real iOS or Android phone.

- [ ] **Step 2: Execute the QA checklist**

Use `docs/qa/mobile-qa-checklist.md`. Mark every item as `Pass`, `Fail`, or `Blocked`. If an item fails, write the device, OS, screen size, exact step, actual behavior, expected behavior, and severity.

- [ ] **Step 3: Fix only blocking or high-severity issues**

If camera, gallery, quick-add, save, or timeline is broken, fix the smallest affected files. Do not add new features during QA.

- [ ] **Step 4: Run verification after any fix**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: tests pass, TypeScript exits with code `0`, Expo dependencies are up to date.

- [ ] **Step 5: Commit QA notes and fixes**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/qa apps/mobile
git commit -m "test: add mobile QA results"
```

Expected: commit succeeds. If no app files changed, the commit should contain only QA notes.

## Task 2: Nutrition Benchmark V1

**Files:**
- Create: `docs/benchmarks/macrolens-nutrition-benchmark-v1.md`

- [ ] **Step 1: Review benchmark coverage**

Open `docs/benchmarks/macrolens-nutrition-benchmark-v1.md` and confirm it includes:

- bakery and breakfast cases;
- French home-cooked meals;
- restaurant plates;
- salads and bowls;
- desserts;
- packaged or supermarket-style foods;
- hidden oil, sauce, portion ambiguity, mixed dishes, and visually similar foods.

- [ ] **Step 2: Use benchmark before live AI**

When OpenAI Vision is integrated, run each benchmark case through the pipeline. Record estimated calories, protein, carbs, fat, fiber, model confidence, and suggested corrections.

- [ ] **Step 3: Score every run**

Use the scoring rules in the benchmark:

- calorie accuracy;
- macro accuracy;
- confidence calibration;
- correction usefulness;
- failure-mode detection.

- [ ] **Step 4: Create benchmark results file after first AI run**

Create `docs/benchmarks/macrolens-nutrition-benchmark-results-v1.md` with this structure:

```md
# MacroLens Nutrition Benchmark Results V1

Date:
Model:
Pipeline:

## Summary

- Calories within acceptable range:
- Protein within acceptable range:
- Correct confidence tier:
- Useful correction suggestions:
- Major failures:

## Case Results

| ID | Meal | Calories Result | Protein Result | Confidence Result | Pass/Fail | Notes |
| --- | --- | ---: | ---: | --- | --- | --- |
```

- [ ] **Step 5: Commit benchmark results**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/benchmarks
git commit -m "test: add nutrition benchmark results"
```

Expected: commit succeeds.

## Task 3: Merge Readiness Decision

**Files:**
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Update project control after QA**

Update the project control file with:

- tested device and OS;
- QA result summary;
- blocking issues fixed or still open;
- benchmark v1 status;
- recommendation: merge, hold, or continue polishing.

- [ ] **Step 2: Re-run final verification**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: tests pass, TypeScript exits with code `0`, Expo dependencies are up to date.

- [ ] **Step 3: Choose branch outcome**

If QA passes, merge `codex/macrolens-mvp` into `master`. If QA finds unresolved blockers, keep the branch and fix them first.

## Self-Review

Spec coverage:

- Real mobile QA is covered by Task 1.
- Nutrition benchmark requirement is covered by Task 2.
- Merge discipline and source-of-truth control are covered by Task 3.
- The plan does not add live OpenAI, Supabase auth, paywall, or growth features before the benchmark gate.

Placeholder scan:

- The plan contains no open placeholder tokens.

Type consistency:

- This iteration does not introduce new application types. It uses the existing MVP and document artifacts.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-23-mobile-qa-nutrition-benchmark.md`. Recommended execution is Inline Execution for QA notes and benchmark review, then targeted implementation only if QA finds blocking issues.
