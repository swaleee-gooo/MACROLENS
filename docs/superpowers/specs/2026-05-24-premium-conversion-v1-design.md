# MacroLens Premium Conversion V1 Design

Date: 2026-05-24
Status: Approved for planning
Owner: Codex

## Goal

Turn MacroLens from a functional nutrition prototype into a premium, App Store-ready subscription product with a conversion-focused onboarding, a hard paywall, and a stronger daily UI/UX.

This iteration should make the app feel like a credible paid product before adding more nutrition features.

## Problem

The current workflow works technically, but it does not yet sell the product.

Current weaknesses:

- onboarding is too light and does not build perceived value;
- users can reach the app before understanding the promise;
- there is no hard paywall;
- Home, Timeline, Profile, and Result screens feel like MVP screens instead of App Store-ready product surfaces;
- correction flow exists, but it is not framed as a precise, premium adjustment step;
- the app does not yet have a polished post-save reward moment.

## Product Direction

MacroLens should feel direct, bold, and premium:

- high-contrast black, white, warm off-white, and restrained accent colors;
- oversized typography;
- minimal copy;
- large tappable cards;
- sticky bottom CTAs;
- bottom tab navigation after conversion;
- visible streaks, badges, and progress loops;
- no decorative marketing page before the actual product flow.

The visual direction is inspired by the user's reference screenshots:

- five-step onboarding with progress indicator;
- measurement form with strong labels and large inputs;
- activity selection cards;
- dashboard with calories ring and macro cards;
- timeline grouped by day;
- profile as success/badge surface;
- correction screen focused on portion quantity;
- post-save confirmation with streak reward.

## Compliance Constraints

### Apple App Store

This iteration must avoid the common review blockers:

- no placeholder content;
- no misleading health or medical claims;
- no claims that nutrition estimates are clinically precise;
- any paid digital functionality must use Apple In-App Purchase;
- in-app purchases must be visible and reviewable;
- restorable purchases must expose a restore mechanism;
- backend services needed for review must be live.

References:

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Store Connect IAP submission guidance: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/

### Expo

Expo Go cannot validate real native in-app purchases. The implementation must therefore be staged:

1. Build a local entitlement abstraction and a paywall UI that works in Expo Go with a controlled development override.
2. Add RevenueCat or StoreKit IAP only when moving to a development build.
3. Test real purchases in a development/TestFlight build, not Expo Go.

References:

- Expo in-app purchases guide: https://docs.expo.dev/guides/in-app-purchases/
- Expo development builds guide: https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build/

The repo instruction says to read the exact Expo v56 docs before writing code. Implementation agents must do that before editing app code.

## Scope

### In Scope

1. Premium onboarding V1

Replace the existing onboarding with a five-step conversion flow:

- Step 1: goal selection;
- Step 2: precision measurements;
- Step 3: activity level;
- Step 4: personalized plan preview;
- Step 5: hard paywall.

2. Hard paywall V1

Add a paywall screen that blocks access to Home unless the user has premium entitlement or a dev override.

The paywall must include:

- annual plan highlighted as best value;
- monthly plan secondary;
- primary subscribe CTA;
- restore purchases action;
- Terms and Privacy link rows that can point to configured URLs before App Store submission;
- compliant renewal copy;
- a development-only unlock path for Expo Go testing.

3. App shell and bottom tabs

After entitlement is granted:

- show a premium Home dashboard;
- use bottom tabs: Accueil, Timeline, Profil;
- keep camera/gallery/manual entry accessible from Home;
- keep Settings reachable from Profile or a header action.

4. Premium Home dashboard

Replace the current Home with:

- branded header with streak/notification-style badge;
- daily overview title;
- streak card;
- next badge card;
- large calories ring;
- protein/carbs/fat progress cards;
- weekly progress preview using deterministic local meal data;
- primary scan CTA.

5. Premium Timeline

Replace the current flat timeline with:

- grouped sections: Aujourd'hui, Hier, older date labels;
- meal cards with thumbnail/manual icon;
- calories;
- protein;
- confidence badge;
- empty state matching the premium style.

6. Premium Profile / Success page

Turn profile into a success surface:

- current streak;
- unlocked badges;
- locked badges;
- edit profile action;
- settings action;
- subscription state.

Keep the existing profile edit form reachable as "Modifier le profil", but restyle it.

7. Result and correction flow

Refine the result flow:

- result screen shows detected meal in premium card style;
- expose a clear "Ajuster les quantites" action;
- add a dedicated portion adjustment screen for the first item or selected item;
- adjustment supports minus/plus and preset grams;
- impact preview updates calories and protein;
- applying adjustment returns to result with recalculated meal.

8. Save confirmation

After saving a meal:

- show "Repas enregistre";
- show calories and protein added;
- show "+1 jour de streak" when applicable;
- provide explicit actions:
  - Retourner a l'accueil;
  - Voir la timeline.

No automatic redirect timer.

9. Local premium state for Expo Go

Add a local entitlement repository:

- locked by default;
- unlock only through dev-only paywall action until real IAP exists;
- easy to replace with RevenueCat customer info in the next monetization integration.

This is not production monetization. It is a local gate to validate UX and flows in Expo Go.

### Out Of Scope

- real RevenueCat integration in this iteration;
- native development build creation;
- App Store Connect product creation;
- real subscription purchase processing;
- push notifications;
- charts library;
- backend changes;
- cloud sync;
- user account login;
- Apple Health / Google Health Connect;
- barcode scanning.

## Monetization Strategy

The app should become premium by default. Free users complete onboarding, see the personalized plan promise, then hit the paywall before the dashboard.

Recommended offer framing:

- Annual highlighted: "12 mois de suivi IA";
- Monthly secondary;
- Trial copy can be included only if the actual App Store product includes a trial;
- do not promise impossible accuracy;
- sell speed, personalization, daily consistency, and correction loop.

Value propositions:

- "Scanne ton repas en quelques secondes";
- "Objectifs calories et proteines personnalises";
- "Ajuste les portions quand l'IA hesite";
- "Timeline et progression quotidienne";
- "Estimations claires, pas de tableau complique".

Hard gate:

- Home, Timeline, Profile success, scan, and manual meal require entitlement.
- Onboarding and paywall do not require entitlement.
- Settings/legal/privacy remain reachable from paywall or profile where needed.

## UX Flow

### First Launch

1. User opens MacroLens.
2. Onboarding step 1 asks objective.
3. Step 2 asks age, sex, height, current weight.
4. Step 3 asks activity level.
5. Step 4 shows personalized plan preview:
   - daily calories;
   - protein target;
   - scan workflow promise;
   - accuracy disclaimer.
6. Step 5 shows hard paywall.
7. User unlocks locally in Expo Go, then real subscription replaces that path in the development build monetization phase.
8. App opens Home.

### Returning User Without Entitlement

- If onboarding is complete but entitlement is missing, open paywall.
- Do not allow dashboard access.

### Returning User With Entitlement

- Open the premium app shell on Home.

### Meal Save

1. User scans or manually enters a meal.
2. Result screen opens.
3. User can adjust portion.
4. User taps save.
5. Save confirmation opens.
6. User chooses Home or Timeline.

## Data Model

Add local app-state types:

```ts
export type OnboardingProfileDraft = {
  goal: UserGoal;
  age: number;
  sex: 'female' | 'male';
  heightCm: number;
  weightKg: number;
  activityLevel: 'low' | 'moderate' | 'high';
};

export type EntitlementState = {
  isPremium: boolean;
  source: 'none' | 'local_dev' | 'store';
  updatedAt: string;
};

export type AppTab = 'home' | 'timeline' | 'profile';
```

Keep existing `UserProfile` and `MacroTargets`. Convert `OnboardingProfileDraft` into a `UserProfile` on onboarding completion.

## Architecture

Keep the lightweight `ScreenState` architecture for this iteration. Do not introduce React Navigation yet.

Add focused modules:

- `apps/mobile/src/storage/entitlementRepository.ts`
- `apps/mobile/src/storage/onboardingRepository.ts`
- `apps/mobile/src/domain/onboardingProfile.ts`
- `apps/mobile/src/domain/streaks.ts`
- `apps/mobile/src/domain/portionAdjustments.ts`
- `apps/mobile/src/ui/premiumDashboardViewModel.ts`
- `apps/mobile/src/ui/timelineSectionsViewModel.ts`
- `apps/mobile/src/ui/badgesViewModel.ts`

Add screens:

- `PremiumOnboardingScreen.tsx`
- `PaywallScreen.tsx`
- `PremiumHomeScreen.tsx`
- `PremiumTimelineScreen.tsx`
- `SuccessProfileScreen.tsx`
- `EditProfileScreen.tsx`
- `PortionAdjustScreen.tsx`
- `SaveConfirmationScreen.tsx`

Add reusable UI components:

- `BrandHeader.tsx`
- `BottomTabs.tsx`
- `PremiumCard.tsx`
- `RingProgress.tsx`
- `PaywallPlanCard.tsx`
- `StickyFooterButton.tsx`

Modify:

- `App.tsx` for gating, tab state, and save confirmation routing;
- `ResultScreen.tsx` to expose adjustment and premium result styling;
- `theme.ts` to support the new premium visual system.

## Visual System

Use a high-contrast editorial nutrition app style:

- background: warm off-white;
- primary text: black;
- secondary text: slate gray;
- cards: white, thin warm border;
- primary CTA: black pill;
- success/protein accent: green;
- carbs accent: blue;
- fat accent: warm orange;
- warning confidence: peach;
- danger confidence: soft red.

Typography:

- large bold titles;
- uppercase micro-labels;
- numeric values very large;
- no negative letter spacing;
- text must fit within card and button bounds on mobile.

Cards:

- radius should stay close to the current design system, but individual UI cards should be restrained and consistent;
- no nested cards;
- no decorative gradient blobs.

## Paywall Copy

Paywall title:

```text
Atteins tes macros avec l'IA
```

Subtitle:

```text
Scanne tes repas, ajuste les portions et suis tes objectifs chaque jour.
```

Benefits:

- Analyse photo IA;
- Objectifs calories et proteines personnalises;
- Corrections de portions;
- Timeline et progression quotidienne.

Compliant renewal copy:

```text
Abonnement renouvele automatiquement. Annulable a tout moment depuis les reglages App Store. Les estimations nutritionnelles ne remplacent pas un avis medical.
```

Development-only button:

```text
Continuer en mode test
```

This button must be visibly development-only and removed or hidden before production review.

## Error Handling

Onboarding:

- Continue disabled until required choice/input is valid;
- numeric fields have broad realistic ranges;
- invalid input keeps user on the same step.

Paywall:

- restore action is visible;
- in Expo Go, restore shows a friendly message that purchases require a development build;
- development unlock is local and explicit.

Result/correction:

- portion grams cannot go below a safe minimum;
- applying adjustment uses existing nutrition scaling;
- user can return without applying.

Persistence:

- repository parse failures should fail closed:
  - no entitlement;
  - onboarding incomplete;
  - no destructive data wipe.

## Testing

Required unit tests:

- onboarding draft converts to `UserProfile` and calculated targets;
- entitlement repository defaults to locked, saves unlock, clears state;
- onboarding repository saves and loads completion;
- streak calculation from saved meals;
- dashboard view model totals and progress;
- timeline section grouping;
- badge unlock logic;
- portion adjustment scaling and bounds.

Required manual verification:

- fresh launch shows onboarding step 1;
- Continue disabled until step selection/input is valid;
- onboarding creates profile and targets;
- paywall blocks Home;
- local dev unlock opens app shell;
- bottom tabs switch Home/Timeline/Profile;
- scan/manual result can open adjustment;
- adjustment changes macros;
- save opens confirmation;
- confirmation routes to Home and Timeline;
- restart app keeps onboarding and entitlement state;
- clearing local data can reset the flow for QA.

## App Store Readiness Gate

Do not submit to App Store until:

- real IAP is implemented in a development build;
- product IDs exist in App Store Connect;
- restore purchases works;
- terms/privacy URLs exist and open;
- review notes explain AI analysis, subscription, and any demo account/mode;
- no development unlock is visible in production build;
- backend is live;
- TestFlight pass is completed on a physical iPhone.

## Done When

- Onboarding V1 replaces the current onboarding.
- A hard paywall blocks the app shell until entitlement is present.
- Home, Timeline, Profile, Result, Adjustment, and Save Confirmation match the new premium direction.
- Existing scan, non-food error, manual entry, local persistence, and corrections still work.
- Unit tests and typecheck pass.
- Expo dependency check passes.
- Expo Go smoke test confirms the full local gated workflow.
