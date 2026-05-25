# Recurring Meals V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users relog frequent meals from Home in one tap.

**Architecture:** Add a small pure domain helper that groups historical meals into quick relog suggestions and clones a selected meal with fresh ids/timestamp. Home renders these suggestions and App persists cloned meals through the existing `saveMeal` path.

**Tech Stack:** React Native, TypeScript, Vitest.

---

### Task 1: Recurring Meal Helper

**Files:**
- Create: `apps/mobile/src/domain/recurringMeals.ts`
- Test: `apps/mobile/src/domain/recurringMeals.test.ts`

- [ ] Test grouping by normalized meal name.
- [ ] Test sorting by frequency then recency.
- [ ] Test cloning creates new meal and item ids with a new timestamp.

### Task 2: Home Quick Relog UI

**Files:**
- Modify: `apps/mobile/src/screens/PremiumHomeScreen.tsx`
- Modify: `apps/mobile/App.tsx`

- [ ] Add a "Repas rapides" section under macros.
- [ ] Show calories/protein/count/last logged.
- [ ] Add a one-tap `Relogger` action.
- [ ] Persist through existing `saveMeal`.

### Task 3: Verification

- [ ] Run recurring meal tests.
- [ ] Run full tests, TypeScript, Expo dependency check.
- [ ] Smoke-test Home in web.
