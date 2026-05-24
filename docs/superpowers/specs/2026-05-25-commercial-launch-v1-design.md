# MacroLens Commercial Launch V1 Design

Date: 2026-05-25
Status: Draft for founder review
Owner: Codex

## Goal

Turn MacroLens from a promising prototype into a commercially credible nutrition app that can compete with Cal AI, Yazio, Foodvisor, MyFitnessPal, CalkAI, and MacroFactor.

Commercial Launch V1 is not a broad feature sprint. It is the minimum release system needed to sell the product with confidence:

- users trust the scan result enough to save meals;
- the app converts through a real App Store subscription;
- App Review can test the product without confusion;
- beta users produce enough evidence to know what to improve before public launch;
- acquisition has a clear promise, not a generic "AI calorie counter" message.

## Market Context

Market references checked on 2026-05-25:

- MyFitnessPal Meal Scan uses machine learning and computer vision, then asks users to choose suggestions and adjust serving size before adding the meal: https://support.myfitnesspal.com/hc/en-us/articles/360045761612-Meal-Scan-FAQ
- CalkAI positions around photo scan, barcode scan, 48+ nutrients, journal, HealthKit, and smart insights: https://www.calkai.app/
- Yazio positions as an all-in-one food, fitness, fasting, AI photo, manual, and barcode tracker with large-scale social proof: https://www.yazio.com/en
- MacroFactor now has AI food logging while keeping its core differentiation around coaching and expenditure adjustment: https://macrofactor.com/
- Expo in-app purchase docs state that IAP requires custom native code and therefore a development build, not Expo Go: https://docs.expo.dev/guides/in-app-purchases/
- RevenueCat Expo docs state that Expo Go can preview subscription UI, but real purchases require a development build: https://www.revenuecat.com/docs/getting-started/installation/expo
- Apple App Review Guidelines require complete metadata, live backend services, full app access for review, and clear IAP explanations in review notes: https://developer.apple.com/app-store/review/guidelines/

The conclusion is blunt: photo scan is table stakes. MacroLens must differentiate on trust, speed of correction, European/French meal relevance, and daily coaching.

## Product Positioning

Primary positioning:

MacroLens is the macro tracker for people who want to lose fat or build muscle without weighing every meal.

Launch promise:

"Scan your meal, correct it in seconds, and know exactly what to do next."

What MacroLens should not claim:

- medical accuracy;
- laboratory-grade nutrition analysis from a single photo;
- guaranteed weight loss;
- "most accurate app" unless backed by benchmark evidence.

What MacroLens can credibly claim after gates pass:

- built for real French and European meals;
- stable same-photo estimates;
- honest ranges and confidence;
- fast corrections for hidden sauce, oil, and portion size;
- daily macro guidance, not just passive logging.

## Release Pillars

### 1. Scan Trust

The scan result is the product. If it feels random, the paywall does not matter.

Requirements:

- expand repeatability automation beyond one live image to at least 10 live same-photo cases;
- run the 50-case nutrition benchmark before making accuracy claims;
- record hard cases separately: poke bowls, bakery, pasta, burgers, salads, restaurant plates, sauces, oil-heavy meals, and packaged foods;
- non-food rejection must be tested with real photos such as desk, bottle, hand, pet, laptop, and random object;
- scan result must show estimate ranges and confidence without fake precision.

Release gates:

- all top-10 repeatability cases pass same-photo thresholds or are explicitly blocked from marketing demos;
- 50-case benchmark average score >= 80;
- no hard category average below 65;
- obvious non-food photos return a non-food error in at least 90 percent of test cases;
- no public marketing copy says "precise" without benchmark support.

### 2. Real Monetization

The Expo Go local entitlement is useful for UX testing only. Commercial Launch V1 requires real Apple subscription infrastructure.

Recommended stack:

- RevenueCat for subscription entitlement management;
- EAS development build for native IAP testing;
- App Store Connect products for monthly and annual plans;
- TestFlight purchase and restore testing before submission.

Entitlements:

- `macrolens_pro`: unlocks scanning, barcode/OCR, corrections, coaching, weekly reports, and history;
- local dev unlock exists only in development builds and must never appear in production;
- App Review must receive either a fully functional demo path or a review account/subscription instructions through review notes.

Initial pricing hypothesis to test:

- Annual: EUR 39.99 to EUR 49.99;
- Monthly: EUR 7.99 to EUR 9.99;
- Trial: 3 or 7 days, tested during beta.

Pricing is a test variable, not a promise. Conversion data decides.

### 3. Conversion Onboarding

The current onboarding collects useful info, but it does not yet sell the transformation hard enough.

Required onboarding arc:

1. Goal: lose fat, gain muscle, maintain, understand nutrition.
2. Friction: "What makes tracking hard for you?" with choices like weighing food, forgetting meals, restaurant meals, hidden calories.
3. Personalization: age, sex, height, weight, activity, target pace.
4. Proof: show a personalized target and a sample scan result with confidence and correction controls.
5. Paywall: present MacroLens Pro as the way to unlock the personalized scan workflow.

Rules:

- do not ask for more data than needed before the first paywall;
- do not show a generic dashboard before the user understands the value;
- make the paywall hard for normal users, but App Review must still be able to evaluate the app;
- keep subscription terms clear and restore purchases visible.

### 4. Multi-Input Logging

Competitors do not rely only on meal photos. MacroLens needs multiple entry points to avoid dead ends.

V1 launch scope:

- photo scan;
- manual meal entry;
- correction chips;
- barcode scan for packaged foods;
- nutrition label OCR for packaged foods when barcode is missing or wrong.

Backend/data sources:

- Open Food Facts for European packaged foods;
- OCR for nutrition labels;
- backend-owned deterministic macro calculation;
- store source ids where available;
- keep AI vision for meal composition and portion estimation, not packaged-food truth.

### 5. Coaching And Retention

MacroLens should become a daily decision engine, not only a calculator.

Required surfaces:

- Today coach: what to eat next based on remaining calories and macros;
- protein-first guidance for fat loss and muscle gain users;
- weekly report: adherence, average calories, protein consistency, scan consistency, best day, main blocker;
- reminders that are tied to behavior, not spam;
- streaks only when they reinforce useful logging behavior.

Retention gates:

- beta users understand what to do after saving a meal;
- at least 50 percent of beta testers save meals on 3 different days during the first week;
- weekly report is opened by at least 40 percent of beta testers who qualify for it.

### 6. App Store Compliance

Commercial Launch V1 must be submission-ready, not just visually impressive.

Required:

- privacy policy URL;
- terms of use URL;
- health/nutrition disclaimer;
- support contact URL or email;
- account deletion path if accounts exist;
- data deletion/export path;
- subscription terms shown on paywall;
- restore purchases button;
- no hidden API keys in mobile code;
- App Review notes explaining AI estimation, subscription products, demo access, and backend availability;
- crash-free TestFlight build before submission.

Health wording:

- allowed: "nutrition estimates", "macro guidance", "helps you track";
- avoid: "diagnose", "treat", "medical", "guaranteed weight loss", "clinically accurate".

### 7. Acquisition And Launch Funnel

The app needs a launch story before paid acquisition.

V1 assets:

- landing page with waitlist and TestFlight CTA;
- App Store screenshots built around the actual product, not abstract marketing;
- 5 to 10 short UGC scripts for TikTok/Reels;
- one hero demo: same photo scanned repeatedly with stable results;
- one comparison angle: "photo scan plus fast corrections";
- one trust angle: "estimates with confidence, not fake certainty".

Launch metrics:

- onboarding completion rate;
- paywall view rate;
- trial start rate;
- purchase conversion;
- scan start rate;
- scan success rate;
- correction rate;
- meal save rate;
- D1 and D7 retention;
- subscription refund/cancel reasons.

## UX Scope

### Screens To Improve Or Add

- Onboarding V2: conversion-first flow with friction, proof, and personalized target.
- Production Paywall: RevenueCat-backed entitlement, subscription terms, restore purchases.
- Scan Result V2: confidence, ranges, correction controls, hidden-calorie prompts, save action.
- Barcode/OCR Flow: barcode scan, label scan fallback, manual confirmation.
- Today Coach: next best action based on remaining macros.
- Weekly Report: weekly macro adherence and practical recommendation.
- Settings/Legal: subscription, restore, support, privacy, terms, delete account/data.

### Out Of Scope For V1

- social feed;
- workout programming;
- clinician-facing features;
- full recipe database;
- restaurant menu database;
- Apple Health deep integration beyond optional later sync;
- Android launch if it slows iOS commercial validation.

## Data And Architecture Requirements

Mobile:

- entitlement provider with states: loading, active, inactive, error;
- paywall gate around premium flows;
- analytics event wrapper with no sensitive nutrition photos in event payloads;
- scan correction model that can persist user-adjusted meals;
- app config separating Expo Go dev behavior from production behavior.

Supabase:

- meal persistence in Postgres for authenticated users;
- photo storage remains private;
- Edge Function continues deriving user id from JWT;
- nutrition analysis stores estimate ranges, confidence, source, and correction history;
- barcode/OCR pipeline stores source ids and label text when available.

External services:

- OpenAI for photo analysis and OCR interpretation where needed;
- Open Food Facts for packaged food lookup;
- RevenueCat for subscription entitlement;
- analytics provider to be chosen in implementation plan, with privacy review before install.

## Error Handling

User-facing errors:

- non-food photo: ask for a meal photo, no mock fallback;
- low confidence: show estimate range and correction prompts;
- barcode not found: offer label scan and manual entry;
- OCR unclear: ask user to retake label photo or enter values manually;
- paywall load failed: allow retry and restore access if cached entitlement is active;
- offline: allow manual entry and queue sync later if persistence exists.

System behavior:

- never silently replace failed AI with a fake demo meal in production;
- log backend error categories without storing private image content in analytics;
- every premium gate should fail closed for monetization but fail gracefully for App Review and support.

## TestFlight Beta

Target:

- 20 to 50 testers;
- include people trying fat loss, muscle gain, and maintenance;
- include French/European meal patterns.

Beta tasks:

- complete onboarding;
- scan 5 real meals;
- scan the same photo 3 times;
- correct at least 2 meals;
- try one packaged food with barcode or label;
- save meals on at least 3 days;
- read the weekly report if available;
- report any result they would not trust.

Beta success gates:

- no critical crash;
- no App Review-blocking paywall issue;
- at least 80 percent scan success on normal meal photos;
- same-photo drift does not produce visible trust complaints in top cases;
- meal save rate after successful scan >= 70 percent;
- at least 10 written tester notes about trust, correction, and paywall clarity.

## Analytics Events

Minimum event taxonomy:

- `app_opened`
- `onboarding_started`
- `onboarding_step_completed`
- `onboarding_completed`
- `paywall_viewed`
- `paywall_cta_tapped`
- `trial_started`
- `purchase_completed`
- `purchase_failed`
- `restore_purchases_tapped`
- `scan_started`
- `scan_completed`
- `scan_failed`
- `non_food_detected`
- `correction_applied`
- `meal_saved`
- `barcode_scan_started`
- `barcode_scan_completed`
- `label_scan_completed`
- `today_coach_viewed`
- `weekly_report_viewed`

Do not include raw image URLs, food photo contents, full free-text notes, or private health identifiers in analytics payloads.

## Implementation Order

1. Commercial instrumentation and benchmark expansion.
2. Production entitlement architecture and RevenueCat development build.
3. Conversion onboarding and production paywall.
4. Scan Result V2 corrections and trust UI.
5. Barcode/OCR packaged food flow.
6. Today coach and weekly report.
7. Legal/settings/App Store readiness.
8. TestFlight beta and launch assets.

This order prevents selling the product before the core result is trustworthy.

## Done When

Commercial Launch V1 is complete when:

- live repeatability benchmark covers at least 10 same-photo cases;
- nutrition benchmark results are recorded and meet the release gates;
- RevenueCat or StoreKit subscription works in a development/TestFlight build;
- production paywall has clear terms and restore purchases;
- onboarding V2 reaches a hard paywall with a personalized promise;
- barcode/OCR packaged food flow works for common packaged foods;
- Today Coach and Weekly Report exist;
- privacy, terms, support, disclaimer, and delete/export flows are available;
- TestFlight beta has 20 to 50 users or an explicit founder decision to launch smaller;
- verification commands pass;
- App Store submission checklist is complete.

## Founder Decision Notes

Recommended stance:

- Do not public-launch until scan trust gates pass.
- Do not spend on paid acquisition until onboarding and paywall analytics exist.
- Do not attempt to beat MacroFactor on coaching depth in V1.
- Beat AI-first competitors on reliability, correction speed, and French/European meal fit.

