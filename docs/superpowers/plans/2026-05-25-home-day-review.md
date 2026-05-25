# Home Day Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home streak calendar interactive so tapping a day reviews that day's macros and meals.

**Architecture:** Keep streak data anchored to today, add a small day-review view model for selected-date totals and meals, then wire `PremiumHomeScreen` state to the calendar strip.

**Tech Stack:** React Native, TypeScript, Vitest.

---

### Task 1: Day Review View Model

**Files:**
- Create: `apps/mobile/src/ui/dayReviewViewModel.ts`
- Test: `apps/mobile/src/ui/dayReviewViewModel.test.ts`

- [ ] Test that selected-date meals are filtered and sorted.
- [ ] Test that calories/macros are calculated for the selected day.
- [ ] Test that today/yesterday/older labels are formatted.

### Task 2: Interactive Home Calendar

**Files:**
- Modify: `apps/mobile/src/screens/PremiumHomeScreen.tsx`

- [ ] Add selected day state initialized to today.
- [ ] Make each streak day pressable.
- [ ] Highlight selected day separately from today.
- [ ] Use the day-review view model for calories, macros, and meals.

### Task 3: Verification

- [ ] Run `npm test -- src/ui/dayReviewViewModel.test.ts`.
- [ ] Run `npm test`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Smoke-test home day selection in web.
