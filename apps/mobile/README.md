# MacroLens Mobile

Expo React Native app with the MetaboProof / Visual Nutrition Verification Engine.

## Commands

- `npm install`
- `npm test`
- `npx tsc --noEmit`
- `npm run web`
- `npm run ios`
- `npm run android`
- `npm run nutrition:live:cases`

## MetaboProof Rule

A photo alone cannot verify calories. Photo analysis can identify likely foods and estimate portions with uncertainty. The `verified` badge is reserved for measured inputs: barcode plus consumed grams, weighed recipe ingredients, or weighed plate composition.

Evidence levels:

- `VERIFIED_BARCODE_WEIGHT`: barcode/product nutrition plus consumed grams.
- `VERIFIED_RECIPE_WEIGHT`: recipe ingredients weighed before calculation.
- `VERIFIED_PLATE_WEIGHT`: meal weight plus confirmed composition.
- `CALIBRATED_TOTAL_WEIGHT`: user calibration or known total weight reduces uncertainty, but is not verified.
- `ESTIMATED_VISUAL_ONLY`: photo-only estimate with a kcal range.
- `RESEARCH_PREDICTED_MASS`: model mass/volume prediction for benchmark work only.

## Core Modules

MetaboProof lives in `src/metaboproof`:

- `proofEngine.ts`: kcal and macro math, evidence aggregation, warnings, and explanations.
- `nutritionResolver.ts`: USDA FoodData Central and Open Food Facts connectors with custom fallback.
- `uncertaintyEngine.ts`: default visual margins plus conformal user residual intervals.
- `costLedger.ts`: per-scan model cost records and standard scan target checks.
- `calibrationEngine.ts`: five weighed meals protocol and personal portion factor.
- `visualNutritionEngine.ts`: mockable image pipeline and cheap-first model router.
- `benchmarkEngine.ts`: MAE kcal, MAPE kcal, mass error, and interval coverage.
- `correctionLoop.ts`: user correction application, persistence interface, and correction-rate metrics.

## Recipe Import

Import a recipe from a TikTok / Instagram Reel / YouTube Short / web link and turn it into a reviewable, savable meal. Lives in `src/recipeImport`:

- `recipeUrl.ts`: extract and classify the shared URL (platform detection plus share-text cleanup).
- `shareIntent.ts`: parse a `macrolens://import?url=…` deep link or raw shared text into a recipe URL.
- `recipeImportServiceFactory.ts`: deterministic offline mock, or the remote `extract-recipe` edge function.
- `recipeNutrition.ts`: per-serving totals and conversion into a MetaboProof meal at `ESTIMATED_VISUAL_ONLY` evidence — AI-estimated grams are never reported as verified.

Flow: `RecipeImportScreen` (paste / loading / error) → `RecipeReviewScreen` (banner, editable ingredients, live per-serving macros) → the existing Result → Save pipeline. Entry points: the Scanner "More" sheet and the scan hub. Works in mock mode with no backend.

### Real extraction (remote)

```bash
supabase functions deploy extract-recipe
supabase secrets set OPENAI_API_KEY=sk-...
```

In remote mode the function reads the post caption via oEmbed (TikTok / YouTube) or Open Graph tags (Instagram / web) and asks the model for a structured ingredient list with per-100g nutrition. Without `OPENAI_API_KEY` it returns a deterministic mock recipe so the flow still works.

### Native share sheet (EAS build required)

Today the app receives links through the `macrolens://import?url=…` deep link. To make **MacroLens appear in TikTok's native share sheet**, add a share extension in a custom dev / EAS build (this cannot run in Expo Go):

1. `npx expo install expo-share-intent`
2. Register the plugin in `app.config.js` with iOS activation rules for URLs/text and the Android `SEND` intent filter.
3. Forward the shared payload to `parseSharedRecipeUrl()` — already wired through `Linking`.
4. Rebuild with EAS (`npm run eas:build:ios:dev`).

## Configuration

The app runs without API keys in mock mode. Optional keys:

```env
EXPO_PUBLIC_USDA_FDC_API_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_VISION_MODEL_PROVIDER=mock
```

Use `EXPO_PUBLIC_VISION_MODEL_PROVIDER=gemini` for a cheap cloud model path, or `openai` for an OpenAI vision fallback when wired through the Supabase edge function. High-cost models should only be called when confidence is below `0.65`.

## UI

Integrated screens:

- Scan hub: photo, barcode, label, gallery, weighed recipe, calibration, manual entry, and dev benchmark.
- Recipe import: paste or share a TikTok / Reel / Short / web link, then review an AI-listed ingredient set with per-serving macros before saving.
- Result: calories/macros, proof badge, source detail, kcal range, and `Why this result?`.
- Weighed recipe: ingredient grams plus per-100g nutrition.
- Calibration: five weighed meals protocol and calibrated result generation.
- Benchmark/dev: local Nutrition5k-style metrics comparison.

Badge colors:

- Green: Verified.
- Orange: Calibrated.
- Purple/blue: Research predicted.
- Gray: Estimated.

## Benchmarks And Datasets

Run core tests:

```bash
npm test -- src/metaboproof
```

Run the existing live nutrition case benchmark:

```bash
npm run nutrition:live:cases
```

Dataset/source notes:

- USDA FoodData Central: nutrition source and search API.
- Open Food Facts: barcode product nutrition.
- Nutrition5k: benchmark target for visual nutrition with mass/nutrition labels.
- FoodSeg103: segmentation benchmark candidate.
- Food-101: secondary food classification benchmark.
- Recipe1M+: research only until license and usage terms are checked.

Future local model interfaces are represented in code, but not executed on-device: SAM 2 for segmentation, Depth Anything V2 for monocular depth, and GroundingDINO for open-set detection. Expo/device depth is not assumed unless the runtime actually provides it.

## Cost And Privacy

Targets:

- Standard scan: `$0.003` to `$0.01`.
- Multi-photo scan: `$0.01` to `$0.03`.

The cost ledger records model id, tokens when available, photo count, and estimated USD cost. Remote photo uploads are removed after the edge function returns. Saved meal records keep metadata, local image URI, corrections, and proof state; they do not need remote photo storage by default.

## Safety Note

MacroLens and MetaboProof are wellness tools. They do not provide medical advice, diagnosis, or treatment guidance.

## References

- USDA FoodData Central API Guide: https://fdc.nal.usda.gov/api-guide/
- Open Food Facts API docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
- Nutrition5k: https://github.com/google-research-datasets/Nutrition5k
- FoodSeg103 benchmark: https://github.com/LARC-CMU-SMU/FoodSeg103-Benchmark-v1
- Food-101: https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/
- Recipe1M+: https://pic2recipe.csail.mit.edu/
- SAM 2: https://github.com/facebookresearch/sam2
- Depth Anything V2: https://github.com/DepthAnything/Depth-Anything-V2
- GroundingDINO: https://github.com/IDEA-Research/GroundingDINO
