# MacroLens Repeatability Results V1

Date: 2026-06-01
Command: `npm run repeatability:live:cases`

## Current Gate

- Release same-photo cases configured: 10
- Live cases executed: 10
- Passing cases: 10
- Failing cases: 0
- Release claim allowed: yes for same-photo repeatability only

## Summary

The release gate is executable across 10 public same-photo cases. The live deployed `analyze-meal` function version 15 passed the repeatability gate after 5 same-image runs per case.

Passing cases:

- `rpt-001-poke-salmon`: no macro drift.
- `rpt-002-banana-simple`: calories spread 1.9 percent, carbs spread 0.5 g.
- `rpt-003-caesar-chicken`: no macro drift.
- `rpt-004-spaghetti-bolognese`: no macro drift.
- `rpt-005-burger-fries`: no macro drift.
- `rpt-006-croissant`: calories spread 4.7 percent, carbs spread 5.0 g.
- `rpt-007-chicken-rice-vegetables`: no macro drift.
- `rpt-008-curry-rice`: no macro drift.
- `rpt-009-lasagna`: no macro drift.
- `rpt-010-second-poke`: no macro drift.

## Release Rule

MacroLens can claim same-photo repeatability only in the narrow sense proven here: the 10 public same-photo cases pass the thresholds in `docs/benchmarks/macrolens-repeatability-benchmark-v1.md`. Nutrition accuracy claims are governed separately by the 50-case nutrition benchmark.
