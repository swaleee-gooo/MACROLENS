# MacroLens Product Quality V1 QA

## Positioning

MacroLens is a smart macro and progress tracker. It is not positioned as an AI coach.

## Must-Pass User Journeys

1. Complete onboarding and reach the paywall.
2. Unlock dev mode in Expo Go.
3. Scan a real meal and save it.
4. Scan the same meal photo 3 times and compare calories/protein drift.
5. Scan a packaged product barcode.
6. If product is not found, use label OCR or manual product entry.
7. Save a product with a custom serving.
8. Open Progress and inspect daily metrics, Goal Progress, and weekly report.
9. Relog a recent meal.
10. Open Timeline and inspect a past day.

## Credibility Gates

- Same-photo calories drift <= 8 percent.
- Same-photo protein drift <= 3 g for simple meals and <= 5 g for mixed bowls.
- Barcode lookup resolves 8 of 10 common French/EU products.
- Product not found never routes to generic meal result.
- Progress tab has no coach-first language.
- No red screen, unhandled promise rejection, or console error during QA.
