# Trust Result V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scan results feel credible and correctable before saving.

**Architecture:** Keep correction logic in `domain/corrections`, add a UI-facing result trust view model, then refactor `ResultScreen` to show macro summary, estimation explanation, per-food breakdown, and per-food quick correction controls.

**Tech Stack:** React Native, TypeScript, Vitest.

---

### Task 1: Result Trust View Model

**Files:**
- Create: `apps/mobile/src/ui/resultTrustViewModel.ts`
- Test: `apps/mobile/src/ui/resultTrustViewModel.test.ts`

- [ ] Test source label and explanation for photo, product, manual, and mock meals.
- [ ] Test item row labels for grams, calories, macros, confidence, and data source.
- [ ] Test uncertainty copy uses reasons and fallback confidence guidance.

### Task 2: Result Screen Redesign

**Files:**
- Modify: `apps/mobile/src/screens/ResultScreen.tsx`

- [ ] Add trust summary card.
- [ ] Add macro impact grid.
- [ ] Add estimation explanation card.
- [ ] Redesign detected food rows with item macros and quick buttons: `-15%`, `+15%`, adjust, remove.
- [ ] Preserve save, back, global sauce/oil corrections, placeholder image handling, and existing portion adjust flow.

### Task 3: Verification

- [ ] Run `npm test -- src/ui/resultTrustViewModel.test.ts src/domain/corrections.test.ts src/domain/portionAdjustments.test.ts`.
- [ ] Run full `npm test`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npx expo install --check`.
- [ ] Smoke-test local web result screen if reachable.
