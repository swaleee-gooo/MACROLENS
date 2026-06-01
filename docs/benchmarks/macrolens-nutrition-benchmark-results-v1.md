# MacroLens Nutrition Benchmark Results V1

Date: 2026-06-01
Command: `npm run nutrition:live:cases`

## Current Gate

- Benchmark cases defined: 50
- Cases with executable HTTPS image URLs: 50
- Live cases executed: 50
- Passing cases: 43
- Failing cases: 7
- Average score: 84.3
- Hard-case average score: 93.0
- Benchmark-estimate claim allowed: yes; exact, guaranteed, or medical accuracy remains forbidden

## Result

The 50-case nutrition benchmark is executable against the live Supabase `analyze-meal` function. The latest release run completed all 50 cases on deployed `analyze-meal` version 15, wrote the full JSON report to `docs/benchmarks/macrolens-nutrition-benchmark-results-v1.json`, and passed the release gate.

Release failures:

- none

Observed summary:

- median calorie error: 0 kcal outside target ranges;
- inside calorie range: 78 percent;
- inside protein range: 84 percent;
- low-confidence recall: 100 percent;
- correction suggestion precision: 98 percent.

Category averages:

- Breakfast: 67.4
- Bakery: 82.2
- Home: 80.4
- Restaurant: 92.6
- Salad: 83.2
- Dessert: 81.8
- Packaged: 89.4
- Hard Case: 93.0

Remaining weak cases:

- `ML-003` tartines beurre confiture: carbs miss.
- `ML-004` yaourt grec granola fruits: calories, protein, and fat miss.
- `ML-011` poulet riz haricots verts: calories, carbs, and fat miss.
- `ML-013` saumon quinoa brocoli: calories, carbs, and fat miss.
- `ML-019` gratin dauphinois jambon: protein miss.
- `ML-031` salade chevre chaud: calories, protein, carbs, and fat miss.
- `ML-038` crepe Nutella banane: calories, carbs, and fat miss.

## Release Rule

MacroLens cannot describe nutrition results as benchmark-tested estimates until:

- all 50 benchmark cases have executable image URLs;
- all 50 cases have been run through the live analysis function;
- average score is at least 80;
- no hard-case category average is below 65;
- no result comes from the mock source;
- product copy keeps saying estimate and avoids medical precision claims.

This run satisfies the gate. Any public claim must remain scoped to the benchmarked consumer-estimate behavior, not medical-grade precision or guaranteed per-meal accuracy.
