# MacroLens Repeatability Benchmark V1

Date: 2026-05-24
Purpose: measure whether repeated scans of the same or near-identical food photo produce stable macros.
Status: protocol ready, first scoring utility implemented.

## Why This Exists

Accuracy is not enough. If two runs of the same photo produce visibly different macros, users lose trust.

This benchmark is designed to catch the credibility problem before release.

## Protocol

For each benchmark case:

1. Use the same image file for five runs.
2. If possible, also run two near-identical recrops or retakes with the same framing.
3. Record returned calories, protein, carbs, fat, fiber, confidence, and uncertainty reasons.
4. Score the five exact-image runs first.
5. Score the near-identical runs separately and label them as framing variance.

## Default Trust Thresholds

Exact-image repeatability gate:

| Metric | Maximum allowed spread |
| --- | ---: |
| Calories | 8 percent |
| Protein | 3 g |
| Carbs | 8 g |
| Fat | 6 g |
| Fiber | 4 g |

If a case fails the protein gate, it is considered a user-trust failure even if calories pass.

## Priority Cases

| ID | Meal | Why It Matters | Minimum Runs |
| --- | --- | --- | ---: |
| RPT-001 | Poke bowl saumon riz avocat | Known user pain point, hidden rice and sauce | 5 |
| RPT-002 | Poulet riz legumes | Simple bodybuilding-style meal | 5 |
| RPT-003 | Salade Cesar poulet | Dressing and crouton ambiguity | 5 |
| RPT-004 | Pates bolognaise | Sauce and pasta mass ambiguity | 5 |
| RPT-005 | Banane seule | Simple high-confidence control | 5 |
| RPT-006 | Burger frites | Sauce, fries oil, patty size | 5 |
| RPT-007 | Skyr + banane | Packaged/simple protein case | 5 |
| RPT-008 | Assiette buffet mixte | Hard multi-item case | 5 |

## Release Gate

Before App Store submission:

- all simple/control cases must pass;
- at least 80 percent of priority cases must pass exact-image repeatability;
- no common protein-focused meal can drift by more than 5 g protein;
- failures must be documented with the likely reason and next calibration action.

## Reporting Template

```text
Case:
Image source:
Run count:
Calories min/max/spread:
Protein min/max/spread:
Carbs min/max/spread:
Fat min/max/spread:
Fiber min/max/spread:
Passed:
Failed metrics:
Notes:
```

