# MacroLens Repeatability Required Cases V1

Date: 2026-06-01

## Release Requirement

Commercial launch requires 10 live same-photo cases in `apps/mobile/scripts/repeatability-cases.json`.

## Current Case Coverage

The benchmark file now contains 10 executable public HTTPS image cases:

- Salmon poke bowl.
- Single banana.
- Chicken Caesar salad.
- Spaghetti Bolognese.
- Burger and fries.
- Croissant.
- Chicken, rice, vegetables.
- Chicken curry rice.
- Lasagna portion.
- Second poke bowl.

## Current Gate

The 10-case live run is configured and passing. See `docs/benchmarks/macrolens-repeatability-results-v1.md` for the latest same-photo repeatability evidence.

## Acceptance Rules

- Each case has a stable HTTPS image URL or signed Supabase URL.
- The image can be used for internal benchmark logging.
- The label states the category and expected risk.
- Marketing demos use only cases where `marketingEligible` is true and the case passes the benchmark.
- A public "same photo, stable macros" claim requires all 10 live cases to pass.
