# MetaboProof Deeptech Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current partial MetaboProof foundation into a real production-grade pipeline for food scene parsing, uncertainty quantiles, best-next-question selection, portion evidence, personal learning, persistent correction loops, model integrations, and Nutrition5k benchmarking.

**Architecture:** Keep the mobile app as the user workflow and local trust layer. Keep expensive vision/model work behind Supabase Edge Function adapters or an external GPU vision-signal service. Store all estimates as evidence-backed ranges, never as exact truth unless the user provides verified weight, barcode, or label data.

**Tech Stack:** Expo React Native mobile app in `apps/mobile`, TypeScript, Zod, Vitest, AsyncStorage, Supabase Edge Functions, Supabase Postgres/RLS, OpenAI Responses API, Gemini API, optional external GPU service for SAM 2/GroundingDINO/Depth Anything, Nutrition5k local dataset ingestion.

---

## Research Summary

Primary sources checked before coding:

- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI image inputs: https://developers.openai.com/api/docs/guides/images-vision
- OpenAI GPT-4o model capabilities: https://developers.openai.com/api/docs/models/gpt-4o
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- Gemini image understanding: https://ai.google.dev/gemini-api/docs/image-understanding
- Expo SDK 56 Camera: https://docs.expo.dev/versions/v56.0.0/sdk/camera/
- Expo SDK 56 ImagePicker: https://docs.expo.dev/versions/v56.0.0/sdk/imagepicker/
- ARCore Depth API: https://developers.google.com/ar/develop/depth
- ARCore Raw Depth API: https://developers.google.com/ar/develop/java/depth/raw-depth
- Apple ARKit sceneDepth: https://developer.apple.com/documentation/arkit/arframe/scenedepth
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide/
- Open Food Facts docs: https://openfoodfacts.github.io/documentation/docs/
- Open Food Facts API guidance: https://openfoodfacts.github.io/openfoodfacts-server/api/
- Nutrition5k repository: https://github.com/google-research-datasets/Nutrition5k
- Nutrition5k CVPR paper: https://openaccess.thecvf.com/content/CVPR2021/papers/Thames_Nutrition5k_Towards_Automatic_Nutritional_Understanding_of_Generic_Food_CVPR_2021_paper.pdf
- Image-based food recognition systematic review: https://www.sciencedirect.com/science/article/pii/S2161831323000935
- Food recognition and volume estimation survey: https://www.mdpi.com/2227-9032/9/12/1676
- Multi-task food recognition and portion estimation: https://arxiv.org/abs/2004.13188
- Personalized food image classification: https://arxiv.org/abs/2309.08744
- Human-in-the-loop active learning with verification/correction: https://arxiv.org/abs/2306.01277
- SAM 2: https://ai.meta.com/research/sam2/
- SAM 2 GitHub: https://github.com/facebookresearch/sam2
- GroundingDINO GitHub: https://github.com/IDEA-Research/GroundingDINO
- GroundingDINO paper: https://arxiv.org/abs/2303.05499
- Depth Anything V2 GitHub: https://github.com/DepthAnything/Depth-Anything-V2
- Depth Anything V2 paper: https://arxiv.org/abs/2406.09414

Technical conclusions:

- OpenAI and Gemini can accept images and can produce structured JSON, but schema-conformant output still needs semantic validation, business-rule validation, and retry/error handling.
- Expo Camera/ImagePicker can support multi-photo capture and EXIF, but not production ARKit/ARCore depth from standard Expo Camera APIs. AR/depth must be a separate dev-client/native module or external service, with feature detection.
- ARCore depth works only on supported devices, depth quality is distance/device/motion dependent, and raw depth has confidence maps plus missing pixels. Apple sceneDepth is only available on selected ARKit/LiDAR-capable configurations.
- SAM 2, GroundingDINO, and Depth Anything V2 are useful as backend/offline vision signals. They should not be shipped inside the Expo mobile bundle for first production use.
- Nutrition5k is the right real benchmark substrate because it includes side views, RGB-D imagery, ingredient mass, dish mass, calories, macros, official splits, and eval scripts. It is large, biased toward California cafeteria food, and should not be committed to the repo.
- USDA FDC is the best base for generic food nutrient density because it is public-domain/CC0, but it requires an API key and rate-limit handling. Open Food Facts is valuable for packaged/barcode foods, but it is volunteer-maintained and must be scored as source evidence, not treated as guaranteed truth.
- The product should expose uncertainty as p10/p50/p90 and evidence level, not "accurate calories." The benchmark gate already in `docs/benchmarks/macrolens-nutrition-benchmark-v1.md` uses the right public wording constraint.

## Current Code Findings

- Mobile meal shape lives in `apps/mobile/src/domain/types.ts`. `FoodItem` has point estimates only. `ScanReview` has one `followUpQuestion`, but no systematic best-next-question engine.
- Zod validation lives in `apps/mobile/src/analysis/analysisSchema.ts`. It does not validate item quantiles, per-item hidden risks, or scene-level uncertainty drivers.
- MetaboProof types live in `apps/mobile/src/metaboproof/types.ts`. `MealItem` has `grams` or `estimatedGrams`, but no p10/p50/p90 distribution.
- `apps/mobile/src/metaboproof/uncertaintyEngine.ts` already has interval logic, including conformal residual support for calibrated total weight.
- `apps/mobile/src/metaboproof/visualNutritionEngine.ts` has a mockable model router and cost ledger hook, but only accepts one image URI and returns candidates without quantiles or risk metadata.
- `apps/mobile/src/metaboproof/correctionLoop.ts` stores correction records in memory only.
- `apps/mobile/src/storage/mealRepository.ts` persists meals under `macrolens.meals.v1`; there is no persistent correction/calibration/personal-graph repository yet.
- `apps/mobile/src/domain/recurringMeals.ts` groups repeated meals by normalized meal name only; it is not a personal food graph.
- Backend schema in `supabase/functions/analyze-meal/mealSchema.ts` already requests `quantityLow`, `quantityHigh`, `portionConfidence`, `role`, `visualEvidence`, top-level `hiddenCalorieRisks`, and `followUpQuestion`.
- Backend conversion in `supabase/functions/analyze-meal/nutritionEstimator.ts` currently discards low/high item quantities and hidden risk details when building the mobile meal payload.
- Existing verification commands are `npm test` and `npx tsc --noEmit` from `apps/mobile`. `vitest.config.ts` includes `src/**/*.test.ts`, `scripts/**/*.test.mjs`, and `../../supabase/functions/**/*.test.ts`.

## Implementation Strategy

Build this in seven vertical slices:

1. Food scene contract and quantiles.
2. Best-next-question engine.
3. Persistent correction/calibration ledger.
4. Personal Food Graph.
5. Portion evidence engine.
6. Real model router and optional vision-signal service.
7. Nutrition5k ingestion and benchmark reporting.

Do not implement AR/depth as a UI promise until device support is proven. Do not train or fine-tune on Nutrition5k until dataset license, storage location, and contamination policy are documented for the run.

## Phase 1 - Food Scene Contract

- [ ] Add a pure TypeScript scene contract in `apps/mobile/src/metaboproof/foodScene.ts`.
- [ ] Extend `apps/mobile/src/metaboproof/types.ts` with:
  - `QuantileEstimate` containing `p10`, `p50`, `p90`, `unit`, `method`.
  - `FoodSceneItem` containing item id, label, canonical name, role, visual evidence, grams quantiles, kcal quantiles, confidence, data source, source id, hidden calorie risks.
  - `HiddenCalorieRisk` containing risk type, target item id, description, kcal impact p10/p50/p90, evidence, answerable question text.
  - `FoodSceneAnalysis` containing scene id, model id, image inputs, visual quality, portion ambiguity, items, top-level risks, uncertainty drivers, candidate meals, evidence level, and parser version.
- [ ] Extend `apps/mobile/src/domain/types.ts` without removing old fields:
  - Add optional `quantityGrams?: { p10: number; p50: number; p90: number }`.
  - Add optional `calorieQuantiles?: { p10: number; p50: number; p90: number }`.
  - Add optional `hiddenCalorieRisks?: HiddenCalorieRisk[]` on `FoodItem`.
  - Add optional `scene?: FoodSceneAnalysis` on `Meal`.
- [ ] Extend `apps/mobile/src/analysis/analysisSchema.ts` to validate the new optional fields.
- [ ] Extend `supabase/functions/analyze-meal/mealSchema.ts` to output item-level `quantityP10`, `quantityP50`, `quantityP90`, `calorieP10`, `calorieP50`, `calorieP90`, and per-item `hiddenCalorieRisks`.
- [ ] Update `supabase/functions/analyze-meal/openaiMealAnalyzer.ts` prompt to require the quantile fields and per-item risks.
- [ ] Update `supabase/functions/analyze-meal/nutritionEstimator.ts` so raw quantity ranges survive into the mobile payload.

Tests:

- [ ] Add `apps/mobile/src/metaboproof/foodScene.test.ts`.
- [ ] Extend `apps/mobile/src/analysis/analysisSchema.test.ts` or create it if missing.
- [ ] Extend `supabase/functions/analyze-meal/openaiMealAnalyzer.test.ts`.
- [ ] Extend `supabase/functions/analyze-meal/handler.test.ts`.

Acceptance checks:

- [ ] A raw item with `quantityLow=80`, `estimatedQuantity=120`, `quantityHigh=180` maps to p10/p50/p90 without losing the old `estimatedQuantity`.
- [ ] Hidden rice, sauce, oil, cheese, nuts, cream, avocado, and bowl-depth risks can attach to a specific item.
- [ ] Existing meals without scene metadata still parse.

## Phase 2 - Best Next Question

- [ ] Add `apps/mobile/src/metaboproof/questionEngine.ts`.
- [ ] Define `QuestionCandidate` with id, target item id, question text, answer type, uncertainty driver, expected kcal impact p90, confidence impact, and priority.
- [ ] Implement `selectBestNextQuestion(scene: FoodSceneAnalysis, graph?: PersonalFoodGraphSnapshot): QuestionCandidate | null`.
- [ ] Scoring rule:
  - Start with `expectedKcalImpactP90`.
  - Multiply by answerability weight: yes/no and small-choice questions score higher than free text.
  - Multiply by evidence gap weight: hidden base, sauce, oil, bowl depth, and unknown portion depth outrank generic low confidence.
  - Reduce score if personal graph already has strong evidence for the item/container.
  - Return exactly one question only when score exceeds the configured threshold.
- [ ] Update `supabase/functions/analyze-meal/nutritionEstimator.ts` or mobile analysis adapter to set `scanReview.followUpQuestion` from this deterministic engine when scene metadata exists.
- [ ] Keep OpenAI/Gemini-generated questions as candidate inputs, not as the final selector.

Tests:

- [ ] `questionEngine.test.ts` selects "Was there rice under the toppings?" over a generic portion question when hidden rice has the largest p90 impact.
- [ ] It selects sauce/dressing question when sauce has larger p90 impact than visible item portion spread.
- [ ] It returns null for verified barcode/label or verified plate weight.
- [ ] It de-prioritizes a question answered by a strong personal bowl/recurring-meal pattern.

## Phase 3 - Persistent Active Learning Ledger

- [ ] Add `apps/mobile/src/storage/metaboProofRepository.ts`.
- [ ] Persist local records under:
  - `macrolens.metaboproof.analysis_events.v1`
  - `macrolens.metaboproof.corrections.v1`
  - `macrolens.metaboproof.calibrations.v1`
  - `macrolens.metaboproof.personal_graph.v1`
- [ ] Add Supabase migration `supabase/migrations/20260604_create_metaboproof_feedback_tables.sql`.
- [ ] Create tables:
  - `meal_analysis_events`: user id, client id, meal id, model id, provider, image count, scene payload, token usage, latency ms, cost estimate, created at.
  - `meal_corrections`: user id, client id, meal id, item id, food label, field, previous value, next value, correction type, source model id, created at.
  - `portion_calibrations`: user id, client id, food label, container key, estimated grams, verified grams, residual grams, source, created at.
  - `personal_food_stats`: user id, graph key, graph type, stats payload, updated at.
- [ ] Add RLS so each user can read/write only their rows.
- [ ] Extend `apps/mobile/src/storage/cloudSyncRepository.ts` or add a parallel synced repository for these records.
- [ ] Update `apps/mobile/src/metaboproof/correctionLoop.ts` so repositories are pluggable and persistent, not in-memory-only.

Tests:

- [ ] Repository roundtrip test for local AsyncStorage adapter.
- [ ] Merge test for local plus remote correction records.
- [ ] Supabase REST row shape tests using existing mock REST client pattern.
- [ ] Correction summary test confirms model and food correction rates survive app restart.

## Phase 4 - Personal Food Graph

- [ ] Add `apps/mobile/src/metaboproof/personalFoodGraph.ts`.
- [ ] Build graph snapshots from meals, corrections, and calibrations:
  - Food node: canonical food name, observed grams p10/p50/p90, correction rate, last seen.
  - Container node: user-named bowl/plate/cup, optional verified capacity, observed fill levels.
  - Meal template node: recurring meal composition, time-of-day, item set, macro distribution.
  - Correction edge: model/item/risk patterns that repeatedly under- or over-estimate.
- [ ] Use robust stats: median, p10, p90, count, last observed timestamp, and confidence tier by sample count.
- [ ] Feed the graph into `questionEngine.ts` and `portionEngine.ts`.
- [ ] Keep graph data local-first and user-scoped; never mix across users.

Tests:

- [ ] `personalFoodGraph.test.ts` learns a habitual bowl median after three confirmed records.
- [ ] It does not overfit with fewer than three observations.
- [ ] It preserves separate habits for rice bowl, pasta plate, and packaged item.
- [ ] It updates graph stats when a correction changes grams or hidden sauce/oil.

## Phase 5 - Portion Evidence Engine

- [ ] Add `apps/mobile/src/metaboproof/portionEngine.ts`.
- [ ] Define `PortionEvidence` inputs:
  - `single_photo`
  - `multi_photo_top_side`
  - `reference_object`
  - `known_container`
  - `manual_verified_weight`
  - `device_depth`
  - `ar_session`
- [ ] Extend scanner state in `apps/mobile/src/screens/ScannerScreen.tsx` to capture optional top and side photos without blocking simple one-photo scans.
- [ ] Add a reference object catalog that stores dimensions only, not sensitive labels:
  - standard card-sized object
  - 330 ml can
  - teaspoon/tablespoon
  - user-entered object dimension
- [ ] Add known-container calibration flow in `apps/mobile/src/screens/CalibrationScreen.tsx`.
- [ ] Record device/depth metadata only when a native module provides it. For Expo-only builds, store `depthAvailable=false` and use photo/reference/container evidence only.
- [ ] Use `apps/mobile/src/metaboproof/calibrationEngine.ts` as the bridge from verified/corrected portions to future estimates.

Tests:

- [ ] Multi-photo evidence narrows grams p10/p90 compared with single-photo evidence when top and side are both present.
- [ ] Known container evidence narrows bowl estimates only after enough confirmed samples.
- [ ] Reference object evidence is ignored when the object is not detected or the user cancels.
- [ ] Expo-only builds do not expose AR/depth claims.

## Phase 6 - Real Model Router And Vision Signals

- [ ] Add `supabase/functions/analyze-meal/modelRouter.ts`.
- [ ] Keep `supabase/functions/analyze-meal/openaiMealAnalyzer.ts` as one provider adapter using strict structured output.
- [ ] Add `supabase/functions/analyze-meal/geminiMealAnalyzer.ts` using Gemini structured output and the same raw schema.
- [ ] Add `supabase/functions/analyze-meal/visionSignalsClient.ts` for optional external service output:
  - object boxes from GroundingDINO
  - masks from SAM 2
  - relative or metric depth map stats from Depth Anything V2
  - per-region confidence and failure modes
- [ ] The external service URL must be configured by env var `VISION_SIGNALS_URL`; the app must work without it.
- [ ] Add feature flags:
  - `MEAL_ANALYSIS_PROVIDER=openai|gemini|mock`
  - `MEAL_ANALYSIS_FALLBACK_PROVIDER=openai|gemini|none`
  - `VISION_SIGNALS_PROVIDER=none|external`
  - `MEAL_ANALYSIS_ESCALATION_THRESHOLD=0.65`
- [ ] Extend `apps/mobile/src/metaboproof/costLedger.ts` or backend analysis-event logging so model provider, image count, token usage, latency, and fallback path are recorded.

Tests:

- [ ] Router uses default provider for normal confidence.
- [ ] Router escalates to fallback when confidence is below threshold or schema validation fails.
- [ ] Gemini/OpenAI adapters normalize into identical `RawMealAnalysis`.
- [ ] Vision-signal failures do not fail meal analysis; they add a warning and keep estimated evidence.
- [ ] Cost ledger records one row per provider attempt.

## Phase 7 - Nutrition5k Ingestion And Benchmarking

- [ ] Add `apps/mobile/scripts/ingest-nutrition5k.mjs`.
- [ ] The script reads dataset from `NUTRITION5K_ROOT` and refuses to run if the folder is missing.
- [ ] The script writes generated case manifests to `docs/benchmarks/nutrition5k/manifest.jsonl`.
- [ ] The script must not copy raw Nutrition5k imagery into git.
- [ ] Extend `apps/mobile/src/metaboproof/benchmarkEngine.ts` to support:
  - absolute kcal error
  - kcal MAPE
  - mass MAE
  - interval coverage for p10/p90
  - hidden-risk recall for known high-fat/high-hidden-base categories
  - per-provider and per-evidence-level breakdown
- [ ] Add `apps/mobile/scripts/run-nutrition5k-benchmark.mjs` for local/offline evaluation.
- [ ] Add `docs/benchmarks/nutrition5k-ingestion.md` with setup commands, expected folder layout, storage warning, and dataset bias warning.
- [ ] Keep the existing `apps/mobile/scripts/run-nutrition-benchmark.mjs` as the product release gate for the curated 50-case MacroLens benchmark.

Tests:

- [ ] `scripts/ingest-nutrition5k.test.mjs` creates a manifest from a tiny synthetic temp fixture.
- [ ] It rejects missing metadata columns.
- [ ] It keeps official train/test split when split files are present.
- [ ] It computes dish totals from per-ingredient rows and checks against dish-level totals.
- [ ] Benchmark report test includes interval coverage and model provider breakdown.

## Phase 8 - UI Integration

- [ ] Update `apps/mobile/src/screens/ResultScreen.tsx` to show p50 estimate plus p10/p90 range for meal and key items.
- [ ] Update `apps/mobile/src/ui/resultTrustViewModel.ts` so copy reflects evidence level:
  - verified weight/barcode/label
  - calibrated personal estimate
  - benchmarked research estimate
  - visual-only estimate
- [ ] Update `apps/mobile/src/screens/PortionAdjustScreen.tsx` so corrections save to the persistent ledger.
- [ ] Update `apps/mobile/src/screens/CalibrationScreen.tsx` to let the user save habitual bowl/container evidence.
- [ ] Update scanner flow to support one-photo default and optional top/side/reference-object capture.
- [ ] Keep medical-grade and exact-accuracy language out of UI.

Tests:

- [ ] View-model tests verify p10/p50/p90 wording.
- [ ] Result screen still renders old meals without scene metadata.
- [ ] Correction action persists a correction record and updates meal totals.
- [ ] Scanner flow can finish with one photo, two photos, or a cancelled reference object.

## Verification Commands

Run these after each implementation slice:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Run this after benchmark integration has real HTTPS image URLs or local Nutrition5k manifest paths:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm run nutrition:live:cases
node scripts/run-nutrition5k-benchmark.mjs --manifest=../../docs/benchmarks/nutrition5k/manifest.jsonl --limit=50
```

Run frontend smoke verification after UI work:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start --web --port 8082
```

Expected verification state before declaring done:

- `npm test` passes.
- `npx tsc --noEmit` passes.
- Old meal payloads still parse.
- New scene payloads preserve p10/p50/p90 and item-level hidden risks.
- Exactly one best-next-question appears when uncertainty warrants it.
- Corrections survive app restart.
- Supabase sync does not expose rows across users.
- Nutrition5k ingestion works on a local dataset folder and does not commit raw dataset files.

## Execution Order

- [ ] Phase 1 first. It creates the contract every other phase depends on.
- [ ] Phase 2 second. It turns existing `followUpQuestion` into deterministic product behavior.
- [ ] Phase 3 third. Learning without persistence is not real learning.
- [ ] Phase 4 fourth. Personalization needs persisted records.
- [ ] Phase 5 fifth. Portion evidence can then consume graph and correction data.
- [ ] Phase 6 sixth. Real providers can plug into the stable contract.
- [ ] Phase 7 seventh. Benchmark ingestion should validate the full system, not precede the contract.
- [ ] Phase 8 throughout, but only after each underlying domain/API slice has tests.

## Non-Negotiable Product Constraints

- Never present photo-only calories as exact.
- Never claim AR/depth support unless the device and native build actually provide depth evidence.
- Never let model output bypass Zod/schema validation and business-rule validation.
- Never persist raw third-party dataset imagery into git.
- Never mix personal graph records across users.
- Never use Open Food Facts or model predictions as verified nutrition truth.
- Preserve existing meal payload compatibility.

## Execution Options

1. Subagent-Driven Implementation (recommended): split phases across focused workers after Phase 1 contract is fixed.
2. Inline Execution: one agent implements each phase sequentially with tests after each slice.
