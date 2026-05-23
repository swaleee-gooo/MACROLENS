# MacroLens Nutrition Calibration Design

Date: 2026-05-23
Status: Approved approach, pending user review of written spec
Owner: Codex

## Goal

Make MacroLens materially more trustworthy than generic photo calorie apps by replacing single-pass AI calorie guesses with a calibrated nutrition pipeline.

The immediate goal is to improve real photo estimates for mixed meals such as poke bowls, pasta, salads, burgers, and restaurant plates, and to reject non-food photos cleanly. The longer-term goal is to create a data foundation for benchmarking, fine-tuning, and proprietary accuracy improvements.

## Strategic Positioning

MacroLens should not compete on the generic claim "take a photo and get calories." The stronger wedge is:

- fast photo logging;
- backend-owned nutrition math;
- realistic ranges instead of fake precision;
- explicit uncertainty for hidden rice, sauce, oil, dressing, cheese, and portion depth;
- a correction loop that improves the estimate without making the user answer a long questionnaire.

The product promise is: MacroLens gives the most honest usable estimate from a normal meal photo, especially when the meal is ambiguous.

## Recommended Approach

Use approach B: Vision AI plus deterministic nutrition calibration.

The vision model identifies food, meal category, ingredients, visible portions, likely hidden components, and uncertainty. The backend then recalculates calories and macros using nutrition profiles, meal-category rules, and confidence-aware ranges.

The model should not be the final source of nutrition totals. It should be an observer. The backend should be the estimator.

## Problem To Fix

A user-tested poke bowl expected around 927 kcal and 38.6 g protein, but the current AI result returned 568 kcal and 28.3 g protein.

Likely root causes:

- rice base was partially hidden or visually underestimated;
- sauce and oil were undercounted;
- bowl depth was not represented in a flat image;
- the model provided direct calories instead of structured quantity assumptions;
- the backend accepted the model's totals without calibration.

This is exactly the class of failure MacroLens must handle better than competitors.

## Product Behavior

### Food Photo

For a food photo, the app returns:

- meal name;
- calories estimate;
- low and high calorie range;
- protein, carbs, fat, and fiber;
- confidence tier;
- detected items with portion assumptions;
- uncertainty reasons;
- correction suggestions.

The result copy should continue to communicate estimate, not medical precision.

### Non-Food Photo

For a non-food photo, the backend returns a typed `non_food_photo` error instead of a fake meal. The mobile app shows:

> Je ne vois pas de nourriture sur cette photo. Reprends une photo de ton repas.

The app should not save a meal when the photo is classified as non-food.

## AI Output Contract

Extend the structured OpenAI output so it returns observations rather than final truth.

Required top-level fields:

- `isFoodPhoto`: boolean
- `nonFoodReason`: string or empty string
- `mealName`: string
- `mealCategory`: enum such as `poke_bowl`, `pasta`, `burger_fries`, `salad`, `sandwich`, `mixed_plate`, `dessert`, `drink`, `packaged`, `unknown`
- `portionSize`: `small`, `standard`, `large`, or `unknown`
- `confidence`: `high`, `medium`, or `low`
- `uncertaintyReasons`: string array
- `hiddenCalorieRisks`: string array
- `items`: array, allowed to be empty only when `isFoodPhoto` is false

Each item should include:

- display name;
- canonical food name;
- estimated grams;
- unit;
- visual confidence;
- optional model-provided macro estimate as fallback.

## Calibration Engine

Add a backend calibration module that owns nutrition math before the response is returned to mobile.

Responsibilities:

- normalize canonical food names;
- map common foods to per-100g nutrition profiles;
- compute item macros from estimated grams;
- apply meal-category corrections;
- produce low/high ranges based on confidence and hidden-calorie risk;
- return useful correction suggestions.

Initial food profiles should cover:

- cooked white rice;
- sushi rice;
- pasta;
- salmon;
- tuna;
- chicken;
- tofu;
- beef;
- egg;
- avocado;
- edamame;
- vegetables;
- olive oil;
- creamy sauce;
- soy/sweet sauce;
- cheese;
- fries;
- burger bun;
- common bakery items.

## Meal Category Rules

### Poke Bowl

Poke bowls need special handling because the base is often hidden under toppings.

Rules:

- if rice is detected or implied, use a realistic cooked-rice floor for a standard restaurant bowl;
- if sauce is visible or likely, add a sauce estimate even when not explicitly detected;
- if avocado is visible, ensure fat is not undercounted;
- if salmon, tuna, chicken, or tofu is detected, enforce a realistic protein component range;
- downgrade confidence to low when the bowl base, sauce, or depth is unclear;
- keep calories in a realistic restaurant-bowl range unless the portion is clearly small.

Target behavior for the known poke case:

- avoid estimates around 568 kcal for a standard salmon rice avocado poke bowl;
- land closer to a realistic range such as 750-1000 kcal when the photo resembles a full restaurant bowl;
- keep protein around the detected protein source range, commonly 30-50 g for salmon/chicken bowls.

### Other Early Rules

Add similar first-pass rules for:

- pasta dishes: cooked pasta mass, sauce fat, cheese;
- burger and fries: sauce, fries oil, patty size;
- restaurant salads: dressing, cheese, croutons, nuts;
- curry or stew over rice: hidden rice and sauce fat;
- bakery items: size variance and butter/fat density.

## Error Handling

Backend:

- return `422` with `error: "non_food_photo"` for non-food images;
- return a recoverable analysis error for invalid model JSON;
- never save invalid analysis output;
- derive `userId` from the verified Supabase JWT instead of trusting the request body.

Mobile:

- show the non-food message without falling back to demo mode;
- keep generic retry behavior for network or AI failures;
- preserve the current demo fallback only for remote infrastructure failures, not for typed non-food results.

## Testing Strategy

Use test-driven development for the implementation.

Required tests:

- a calibrated poke bowl that starts from a low AI estimate is raised into a realistic calorie/protein range;
- non-food model output returns the typed error and is not saved;
- hidden sauce or oil expands the calorie range and adds a correction suggestion;
- high-confidence simple foods remain stable and are not overcorrected;
- mobile remote analysis shows the non-food message instead of demo fallback;
- Edge Function derives user identity from JWT, not `payload.userId`.

Verification:

- `npm test` in `apps/mobile`;
- `npx tsc --noEmit` in `apps/mobile`;
- Edge Function smoke test against Supabase after deployment;
- manual Expo Go test with one real food photo and one non-food photo.

## Dataset Roadmap

Datasets are not required to ship this calibration iteration, but they should guide the next moat-building phase.

### Nutrition5k

Best for supervised nutrition regression and benchmark calibration. It contains visual meal data with ingredient mass and macro labels for about 5,006 plates. It is large and high-value, but the repository is archived read-only as of 2026-04-19, so we should treat it as a stable research source rather than an actively maintained dependency.

Use for:

- calorie and macro benchmark evaluation;
- portion regression research;
- validating whether our calibrated pipeline beats direct model estimates.

### FoodSeg103 And UECFoodPix Complete

Best for ingredient segmentation and visible-area reasoning. These datasets provide food images with pixel-level food masks across many classes.

Use for:

- future ingredient localization;
- estimating visible area of rice, proteins, sauces, vegetables, and toppings;
- building internal evaluation cases for mixed plates.

### Food-101

Best for broad dish classification, not nutrition. It has many food images across 101 classes, but no macro ground truth and known bias/noise limitations.

Use for:

- food vs non-food pretraining/evaluation;
- dish category classification;
- broad visual robustness checks.

### Recipe1M+

Best for recipe-image-text representation learning. Useful later for ingredient priors, but less directly useful for portion and calorie accuracy.

Use for:

- ingredient co-occurrence priors;
- recipe-to-photo matching;
- future multimodal retrieval experiments.

### USDA FoodData Central

Best for generic nutrition profiles and per-100g macro references. It requires a data.gov API key and should be accessed backend-side.

Use for:

- canonical nutrition profiles;
- generic foods such as rice, chicken, salmon, pasta, avocado, eggs, vegetables;
- transparent source attribution.

### Open Food Facts

Best for packaged foods and European product data. Data is open and broad, but user-contributed, so accuracy and completeness must be treated carefully.

Use for:

- packaged product lookup;
- future barcode flow;
- European supermarket foods.

## Data Source References

- Nutrition5k: https://github.com/google-research-datasets/Nutrition5k
- Food-101: https://huggingface.co/datasets/ethz/food101
- FoodSeg103 paper: https://arxiv.org/abs/2105.05409
- UECFoodPix Complete: https://mm.cs.uec.ac.jp/uecfoodpix/
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide/
- Open Food Facts API: https://openfoodfacts.github.io/openfoodfacts-server/api/

## Scope Boundaries

In scope for the next implementation:

- schema changes;
- prompt changes;
- backend calibration module;
- non-food typed error;
- mobile non-food error display;
- tests and Supabase deployment.

Out of scope for the next implementation:

- model fine-tuning;
- downloading public datasets;
- training a custom model;
- barcode scanner;
- paywall;
- growth experiments.

## Done When

This design is ready for implementation planning when:

- the written spec is reviewed and approved by the user;
- the implementation plan breaks work into tests, backend changes, mobile error handling, deployment, and verification;
- the next branch state remains aligned with the existing MacroLens MVP architecture.
