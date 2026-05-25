# MacroLens Repeatability Required Cases V1

Date: 2026-05-25

## Release Requirement

Commercial launch requires 10 live same-photo cases in `apps/mobile/scripts/repeatability-cases.json`.

## Cases Still Needed

- Restaurant salad with visible dressing.
- Bakery item such as croissant, pain au chocolat, or muffin.
- Pasta dish with creamy or oily sauce.
- Burger and fries.
- Mixed French plate with protein, starch, vegetables, and sauce.
- Sauce-heavy bowl.
- Packaged food with visible product and barcode.
- Non-food object such as laptop, bottle, hand, or desk.

## Acceptance Rules

- Each case has a stable HTTPS image URL or signed Supabase URL.
- The image can be used for internal benchmark logging.
- The label states the category and expected risk.
- Marketing demos use only cases where `marketingEligible` is true and the case passes the benchmark.
