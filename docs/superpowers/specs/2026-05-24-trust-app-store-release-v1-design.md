# MacroLens Trust And App Store Release V1 Design

Date: 2026-05-24
Status: Active execution
Owner: Codex

## Goal

Turn MacroLens from a visually promising prototype into a product that users and App Review can trust.

The next release should prove three things:

- the same or near-identical food photo does not produce credibility-breaking macro drift;
- the app is honest about uncertainty and nutrition accuracy;
- monetization uses real Apple In-App Purchase before App Store submission.

## Product Thesis

The biggest blocker is not adding more screens. The blocker is trust.

If a user scans the same poke bowl twice and gets a 10 g protein difference, the product feels random. MacroLens must feel stable even when it is not perfectly exact. The product should show realistic estimates, ranges, confidence, and correction tools instead of pretending a food photo can produce laboratory precision.

## Release Pillars

### 1. Repeatability

Create a repeatability benchmark for the same image and near-identical recrops.

Initial gates:

- same image, five runs;
- calories spread <= 8 percent;
- protein spread <= 3 g;
- carbs spread <= 8 g;
- fat spread <= 6 g;
- fiber spread <= 4 g.

If a case fails, it cannot be used in marketing claims. If common foods fail often, release is blocked until the calibration pipeline improves.

### 2. Accuracy

Keep the existing 50-case nutrition benchmark and add repeatability reporting.

Accuracy gates:

- benchmark average >= 80 before any public "accurate" claim;
- no hard-case category average below 65;
- no marketing copy implying medical precision;
- every result remains framed as an estimate.

### 3. Real Monetization

The current paywall is only a local Expo Go entitlement gate. It validates UX, not payment.

Before App Store submission:

- replace local dev unlock with RevenueCat or StoreKit-backed entitlement;
- create monthly and annual subscriptions in App Store Connect;
- test in a development build and TestFlight;
- verify restore purchases;
- remove or hide the local Expo Go unlock from production builds.

Relevant docs checked on 2026-05-24:

- Expo SDK v56 reference: https://docs.expo.dev/versions/v56.0.0/
- Expo in-app purchases guide: https://docs.expo.dev/guides/in-app-purchases/
- RevenueCat Expo installation: https://www.revenuecat.com/docs/getting-started/installation/expo
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

### 4. App Store Compliance

MacroLens deals with health and fitness-adjacent nutrition data. The app must avoid unsupported claims and protect user trust.

Required behavior:

- no medical diagnosis wording;
- clear methodology statement in App Store notes and app copy;
- no hidden use of health or nutrition data for advertising;
- clear subscription terms;
- restore purchases available;
- support and privacy policy URLs prepared.

### 5. TestFlight Beta

Run a small beta before submission.

Target:

- 10 to 20 testers;
- each tester scans at least 5 meals;
- at least 5 repeatability cases with same photo repeated 3 to 5 times;
- track trust complaints, repeated scans, corrections, and paywall confusion.

## UX Trust Rules

- Prefer ranges for uncertain calories.
- Keep proteins visible but avoid fake decimal precision when confidence is low.
- Show confidence and uncertainty reasons near the result.
- Make correction actions obvious.
- Never hide that the output is an estimate.

## Done When

Trust And App Store Release V1 is complete when:

- repeatability metrics are implemented and tested;
- repeatability benchmark protocol exists;
- at least one live repeatability run is recorded;
- production paywall plan is ready for RevenueCat/TestFlight;
- verification commands pass;
- project status records remaining App Store blockers.

