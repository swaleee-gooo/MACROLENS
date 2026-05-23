# MacroLens Design Spec

Date: 2026-05-23
Status: Approved for implementation planning
Owner: Codex

## Goal

Build a mobile app that turns a food photo into a clear nutrition estimate: calories, proteins, carbohydrates, fats, fiber, and a confidence level. The app should feel faster and more trustworthy than traditional calorie trackers, while avoiding the false precision that weakens many AI nutrition products.

## Market Context

Photo-based nutrition tracking is already validated. Cal AI grew quickly enough to be acquired by MyFitnessPal, with TechCrunch reporting more than 15 million downloads and more than $30 million in annual revenue before the acquisition. SnapCalorie, MyFitnessPal Meal Scan, and similar apps already promise photo-to-macros workflows.

This means MacroLens should not compete on the generic claim "take a photo and get calories." The defensible wedge is trust plus speed:

- estimates shown as ranges and confidence levels, not fake exactness;
- fast correction when the model is uncertain;
- strong support for French and European meals from day one;
- transparent data provenance through Open Food Facts and USDA FoodData Central;
- a visual meal history that feels lighter than database logging.

## Product Positioning

MacroLens is a photo-first nutrition copilot for people who want macro awareness without weighing food or searching databases after every meal.

The primary user is not a professional bodybuilder who needs gram-level precision. The first target is a busy consumer who wants to improve body composition, understand protein intake, lose fat, or eat more intentionally. The product should be honest about uncertainty and make correction feel effortless.

## Differentiation Strategy

The market is crowded, so the app needs differentiated behavior, not only differentiated branding.

1. Confidence-first nutrition

   Every AI result includes a confidence tier: high, medium, or low. Low-confidence outputs show why the app is uncertain, such as hidden oil, unclear portion size, sauce, mixed dish, or multiple visually similar ingredients.

2. Three-second correction loop

   The result screen suggests one-tap corrections: larger portion, smaller portion, added oil, added sauce, remove item, replace item, or split dish. Corrections immediately recompute macros.

3. European and French food fluency

   The MVP prioritizes common French meals and food contexts: bakery items, cafe lunches, bowls, home-cooked dishes, supermarket packaged foods, cheese, sauces, and restaurant plates. Open Food Facts is favored for packaged European products.

4. Honest estimates

   MacroLens shows a best estimate plus a plausible range. Example: "720 kcal, likely 620-830." This builds trust and prevents the product from overclaiming precision.

5. Visual timeline

   Meal history is image-led. Users recognize meals visually before reading numbers, making the app feel less like a spreadsheet.

## MVP Scope

The MVP should include:

- onboarding with simple goals: lose fat, build muscle, maintain, understand eating;
- profile basics: age range, sex, height, weight, activity level, optional target weight;
- camera-first home screen;
- photo upload from camera or library;
- AI meal analysis returning detected food items, portion assumptions, macros, calories, fiber, and confidence;
- result screen with editable portions and one-tap corrections;
- daily macro summary;
- visual meal timeline;
- manual quick-add fallback;
- account/session persistence;
- privacy and health disclaimers.

The MVP should not include:

- medical advice;
- eating disorder diagnosis or treatment;
- micronutrient optimization beyond a simple optional display;
- social feed;
- coach marketplace;
- barcode-first logging as the main workflow;
- complex recipe builder.

## User Experience

### Home

The home screen opens directly into a camera-focused experience. The user can take a photo, choose a recent photo, or view today's meals. The daily macro summary stays visible but compact, with protein emphasized more than calories.

### Analysis Loading

After photo capture, the app shows the image, a short progress state, and no heavy explanation. The target perceived flow is: capture, analyze, review, log.

### Result

The result screen shows:

- meal name generated from detected items;
- calories with a range;
- protein, carbohydrates, fats, and fiber;
- confidence tier;
- detected items with portion assumptions;
- one-tap correction chips;
- save button.

If confidence is low, the app asks for the smallest useful clarification in-app through correction chips, not a chat prompt.

### Timeline

The timeline groups meals by day. Each item shows the photo thumbnail, meal name, calories, protein, and confidence. Tapping a meal opens the editable result.

## Core Data Model

User:

- id
- email or anonymous auth id
- goal
- profile metrics
- macro targets
- created_at

Meal:

- id
- user_id
- image_url
- captured_at
- meal_name
- calories_estimate
- calories_low
- calories_high
- protein_g
- carbs_g
- fat_g
- fiber_g
- confidence
- notes
- source

FoodItem:

- id
- meal_id
- name
- canonical_food_name
- estimated_quantity
- unit
- calories
- protein_g
- carbs_g
- fat_g
- fiber_g
- confidence
- data_source
- source_food_id

Correction:

- id
- meal_id
- type
- payload
- created_at

## AI And Nutrition Pipeline

1. The mobile client captures or selects a food image.
2. The backend stores the image and creates a meal analysis job.
3. The vision model returns structured JSON with detected foods, quantities, uncertainty reasons, and likely preparation methods.
4. The backend normalizes detected foods into canonical search terms.
5. The backend queries nutrition sources:
   - Open Food Facts for packaged foods and European products;
   - USDA FoodData Central for generic foods and standard nutrient profiles.
6. The backend calculates macros per item and meal totals.
7. The backend returns a typed result to the mobile app.
8. User corrections update assumptions and recompute the meal totals.

The model response must be validated against a strict schema before it is saved. Invalid, incomplete, or unsafe outputs should become a recoverable error state instead of corrupting meal history.

## Technical Architecture

### Mobile

Use Expo React Native with TypeScript. Expo is suitable because the MVP needs camera access, image upload, push-ready mobile packaging, and quick iteration across iOS and Android.

Suggested libraries:

- expo-camera or expo-image-picker for image capture and selection;
- React Navigation or Expo Router for app navigation;
- TanStack Query for server state;
- Zod for runtime validation;
- Zustand or lightweight React state for local UI state.

### Backend

Use Supabase for authentication, Postgres, storage, and edge functions. The backend owns model calls and nutrition API calls so API keys are never shipped in the app.

Suggested services:

- Supabase Auth for anonymous/email auth;
- Supabase Storage for meal photos;
- Postgres for meals, items, corrections, and user profiles;
- Edge Functions for analysis orchestration.

### AI

Use an OpenAI vision-capable model with structured outputs. The model should produce only schema-conformant analysis data, not final nutrition math. Nutrition totals should be computed by deterministic backend code after database lookup.

### External Nutrition Data

USDA FoodData Central provides a REST API for food search and details. Open Food Facts provides open product and nutrition data, useful for European packaged foods and label-oriented flows. Results should store source identifiers where available.

## Safety, Trust, And Compliance

MacroLens must state that nutrition outputs are estimates, not medical advice. It should avoid prescriptive claims for disease management, pregnancy, eating disorders, or clinical nutrition.

Risk controls:

- confidence tier on every scan;
- visible uncertainty range;
- source attribution where available;
- no "guaranteed accuracy" copy;
- easy edit and delete;
- image privacy note during onboarding;
- API keys kept server-side;
- database row-level security for user data.

## Error Handling

Camera permission denied:

- show a direct permission recovery screen and allow photo library import.

Network failure:

- keep the local image preview, allow retry, and avoid creating duplicate meals.

AI failure:

- show "analysis failed" with retry and manual quick-add.

Low-confidence analysis:

- show the result, but emphasize corrections before save.

Nutrition source miss:

- use a generic fallback food match and mark the item source as estimated.

## Metrics For Rapid Market Capture

Activation:

- first photo analyzed within 60 seconds of app open;
- first saved meal completion rate.

Retention:

- meals logged per active user per day;
- day 1, day 7, and day 30 retention;
- percent of users logging at least two meals in a day.

Trust:

- correction rate by confidence tier;
- delete rate after scan;
- manual adjustment delta from AI estimate.

Growth:

- shareable before/after daily macro card usage;
- invite conversion;
- organic install source tracking.

Revenue:

- free scans per week;
- premium conversion after scan limit;
- annual plan conversion.

## Monetization

Start freemium:

- free: limited scans per week, daily summary, timeline;
- premium: unlimited scans, advanced macro targets, weekly insights, faster analysis, export, deeper history.

The paywall should appear after value is demonstrated, ideally after several successful scans, not before the first scan.

## Launch Plan

Phase 1: MVP

- camera/photo scan;
- structured AI result;
- editable macros;
- timeline;
- daily summary.

Phase 2: Trust and retention

- correction learning per user;
- weekly nutrition review;
- protein-focused recommendations;
- Apple Health / Google Health Connect integration.

Phase 3: Growth moat

- French/European dish benchmark set;
- creator-led UGC acquisition;
- restaurant and supermarket-specific improvements;
- coach or trainer share mode.

## Implementation Readiness

The next step is to create an implementation plan that scaffolds the Expo app, backend schema, analysis API contract, and a functional mock pipeline. The first build can use a mocked AI response if API keys are not configured, then swap in real model calls once secrets are available.

## References

- TechCrunch: MyFitnessPal acquired Cal AI, March 2, 2026.
- SnapCalorie App Store listing.
- MyFitnessPal Meal Scan FAQ.
- USDA FoodData Central API Guide.
- Open Food Facts documentation.
- OpenAI vision and structured outputs documentation.
- Expo Camera and ImagePicker documentation.
