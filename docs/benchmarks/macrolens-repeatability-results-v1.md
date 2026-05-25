# MacroLens Repeatability Results V1

Date: 2026-05-25
Command: `npm run repeatability:live:cases`

## Current Gate

- Public cases executed: 2
- Additional real cases required before launch: 8
- Release claim allowed: no

## Results

```json
{
  "passed": true,
  "summaries": [
    {
      "id": "poke-salmon-wikimedia",
      "label": "Salmon poke bowl",
      "category": "poke_bowl",
      "marketingEligible": true,
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/1/13/Salmon_Poke.jpg",
      "passed": true,
      "failedMetrics": [],
      "metrics": {
        "caloriesEstimate": { "min": 789, "max": 819, "spread": 30, "percentSpread": 3.7 },
        "proteinG": { "min": 39.7, "max": 41, "spread": 1.3, "percentSpread": 3.2 },
        "carbsG": { "min": 80.3, "max": 83, "spread": 2.7, "percentSpread": 3.3 },
        "fatG": { "min": 33.4, "max": 35.4, "spread": 2, "percentSpread": 5.9 },
        "fiberG": { "min": 4.6, "max": 4.8, "spread": 0.2, "percentSpread": 4.2 }
      }
    },
    {
      "id": "banana-simple",
      "label": "Single banana",
      "category": "simple_food",
      "marketingEligible": true,
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg",
      "passed": true,
      "failedMetrics": [],
      "metrics": {
        "caloriesEstimate": { "min": 105, "max": 105, "spread": 0, "percentSpread": 0 },
        "proteinG": { "min": 1.3, "max": 1.3, "spread": 0, "percentSpread": 0 },
        "carbsG": { "min": 26.9, "max": 26.9, "spread": 0, "percentSpread": 0 },
        "fatG": { "min": 0.4, "max": 0.4, "spread": 0, "percentSpread": 0 },
        "fiberG": { "min": 3.1, "max": 3.1, "spread": 0, "percentSpread": 0 }
      }
    }
  ]
}
```

## Release Rule

MacroLens cannot claim "same photo, stable macros" publicly until at least 10 live same-photo cases pass the thresholds in `docs/benchmarks/macrolens-repeatability-benchmark-v1.md`.
