# MacroLens App Core V2 Design

Date: 2026-05-24
Status: Pending user review
Owner: Codex

## Goal

Turn MacroLens from a working photo-to-macros prototype into a daily nutrition tracker that feels credible after the first scan.

This iteration adds the missing product core around the existing scan flow:

- profile;
- macro targets;
- dedicated today view;
- settings and health/privacy copy;
- full manual meal entry.

The goal is not to add monetization or growth yet. The goal is to make the app usable every day.

## Current State

The mobile app currently has these screens:

- `OnboardingScreen`
- `HomeScreen`
- `AnalyzingScreen`
- `ResultScreen`
- `TimelineScreen`

The scan flow works with remote Supabase/OpenAI analysis, local meal persistence, visual timeline, correction chips, and non-food-photo errors.

The app already defines a `UserProfile` type, but there is no screen or local repository to create, edit, or use a real profile. Macro targets are not persisted. Manual entry exists only as a fixed quick-add meal.

## Product Principle

The first screen must remain camera-first. MacroLens should not become a form-heavy calorie tracker.

The new pages should support the scan workflow, not bury it:

- Home remains the fast capture surface.
- Profile and targets make totals meaningful.
- Today explains progress without feeling like a spreadsheet.
- Manual entry is a fallback, not the main workflow.
- Settings make trust, privacy, and data control visible.

## Scope

### In Scope

1. Profile

   Add a profile screen where the user can set:

   - goal;
   - age range;
   - sex;
   - height;
   - weight;
   - activity level;
   - optional target weight.

2. Macro Targets

   Add a targets screen where the app shows calculated targets:

   - daily calorie target;
   - daily protein target;
   - carbohydrate target;
   - fat target.

   The user can adjust calorie and protein targets manually. Carbs and fats can be calculated from the remaining calories.

3. Today

   Add a dedicated today screen with:

   - calories consumed vs target;
   - protein consumed vs target;
   - carbs and fat totals;
   - meals logged today;
   - empty state encouraging a scan or manual entry.

4. Settings

   Add a settings screen with:

   - analysis mode indicator;
   - privacy note;
   - health disclaimer;
   - delete local meal history action;
   - profile and targets shortcuts.

5. Manual Meal Entry

   Replace the fixed quick-add path with a manual meal screen where the user can enter:

   - meal name;
   - calories;
   - protein;
   - carbs;
   - fat;
   - fiber.

   Saving creates a normal `Meal` object with one manual `FoodItem`, then opens the result screen or returns home after save.

6. Local Persistence

   Add local profile persistence through AsyncStorage, matching the existing meal repository style.

### Out Of Scope

- paywall;
- barcode scanning;
- Open Food Facts product lookup;
- weekly insights;
- charts beyond simple progress values;
- account email/password screens;
- cloud profile sync;
- React Navigation or Expo Router migration;
- custom model training;
- Apple Health or Google Health Connect integration.

## User Experience

### Home

Home remains camera-first.

Add compact navigation actions:

- Today;
- Profile or Targets;
- Settings.

The daily summary should compare consumed values against targets when a profile exists. If no profile exists, Home should still work and show totals only.

### Profile Screen

The profile screen should be a simple editable form using segmented options and numeric inputs.

It should avoid medical language. It should say targets are estimates, not clinical advice.

Save behavior:

- saving stores the profile locally;
- targets are recalculated from profile values;
- the user returns to Home or Targets depending on entry point.

### Targets Screen

The targets screen should show target calories, protein, carbs, and fat.

Targets are auto-calculated from the profile:

- protein target is weight-based and goal-aware;
- calorie target uses a simple BMR/TDEE estimate;
- fat and carbs split remaining calories with conservative defaults.

The user can override calorie and protein targets. Overrides are persisted.

### Today Screen

The today screen is the daily check-in view.

It should show progress values without shaming:

- "consomme" instead of "remaining" as the primary framing;
- protein progress emphasized;
- low-friction buttons for scan, gallery, and manual entry.

### Settings Screen

Settings should focus on trust:

- current analysis mode: remote or demo;
- reminder that photos are uploaded for analysis when remote mode is on;
- nutrition estimates are not medical advice;
- delete local history;
- edit profile;
- edit targets.

### Manual Meal Screen

Manual meal entry should be fast:

- one name input;
- numeric macro inputs;
- save button disabled until name and calories are valid;
- generated manual meal uses `imageUri: "manual://custom"`;
- result source is `estimated`;
- confidence is `low`.

## Data Model

Extend the domain types with:

```ts
export type MacroTargets = {
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  fiberTargetG: number;
  calorieOverride: number | null;
  proteinOverrideG: number | null;
};
```

Update `UserProfile` so it can store:

- profile fields;
- macro targets;
- updated timestamp.

Keep existing `Meal` and `FoodItem` shapes. Manual meals should use those existing shapes.

## Macro Calculation

Add a pure domain module for target calculation.

Inputs:

- goal;
- age range;
- sex;
- height;
- weight;
- activity level;
- optional target weight;
- optional calorie/protein overrides.

Outputs:

- calorie target;
- protein target;
- carbs target;
- fat target;
- fiber target.

Rules:

- estimate BMR from Mifflin-St Jeor using midpoint age per age range;
- multiply by activity factor;
- apply goal adjustment:
  - lose fat: modest deficit;
  - build muscle: modest surplus;
  - maintain: no adjustment;
  - understand eating: no aggressive adjustment;
- protein target:
  - lose fat/build muscle: higher weight-based target;
  - maintain/understand eating: moderate target;
- fat target uses a minimum sensible floor;
- carbs receive remaining calories after protein and fat.

All targets are estimates.

## Architecture

Keep the current lightweight screen-state architecture in `App.tsx` for this iteration.

Add screens:

- `apps/mobile/src/screens/ProfileScreen.tsx`
- `apps/mobile/src/screens/TargetsScreen.tsx`
- `apps/mobile/src/screens/TodayScreen.tsx`
- `apps/mobile/src/screens/SettingsScreen.tsx`
- `apps/mobile/src/screens/ManualMealScreen.tsx`

Add domain/storage modules:

- `apps/mobile/src/domain/macroTargets.ts`
- `apps/mobile/src/domain/manualMeal.ts`
- `apps/mobile/src/storage/profileRepository.ts`

Modify:

- `apps/mobile/App.tsx`
- `apps/mobile/src/domain/types.ts`
- `apps/mobile/src/screens/HomeScreen.tsx`
- `apps/mobile/src/storage/mealRepository.ts` if delete-all support is needed for settings.

The implementation should keep logic out of screen components when possible:

- target math lives in `macroTargets.ts`;
- manual meal construction lives in `manualMeal.ts`;
- AsyncStorage persistence lives in `profileRepository.ts`;
- screens receive callbacks and data as props.

## Navigation

Extend `ScreenState` with:

- `profile`
- `targets`
- `today`
- `settings`
- `manualMeal`

Navigation actions:

- Home -> Today
- Home -> Profile
- Home -> Settings
- Home -> Manual Meal
- Today -> Result for a meal
- Settings -> Profile
- Settings -> Targets
- Profile -> Targets after first save is allowed
- Targets -> Home

## Error Handling

Profile:

- invalid numeric input stays local to the field;
- save button disabled if required fields are invalid.

Targets:

- overrides must be positive numbers within broad consumer-safe bounds;
- clearing an override restores calculated target.

Manual meal:

- save disabled until meal name and calories are valid;
- missing optional macros default to zero;
- caloriesLow/caloriesHigh should use a conservative manual range around estimate.

Settings:

- deleting local history requires confirmation.

## Testing

Required tests:

- macro target calculation for lose fat, build muscle, maintain, and understand eating;
- overrides replace calculated calorie/protein targets;
- manual meal construction creates a valid `Meal` and recomputes totals;
- profile repository saves, loads, and clears a profile;
- meal repository delete-all behavior if settings uses it;
- Home daily summary still works when no profile exists;
- Today view model filters meals by current day and calculates progress against targets.

Verification commands:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Manual verification:

- complete onboarding;
- create profile;
- view generated targets;
- log a manual meal;
- scan or select a photo;
- view Today progress;
- delete local history from Settings.

## Done When

- The five new screens are reachable from the app.
- Profile and targets persist locally.
- Home and Today can show progress against targets.
- Manual meal entry creates and saves a real meal.
- Settings includes privacy/disclaimer copy and local history deletion.
- Existing scan, result, correction, and timeline flows still work.
- Tests, typecheck, Expo dependency check, and one manual smoke pass are complete.
