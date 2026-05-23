# MacroLens Nutrition Benchmark V1

Date: 2026-05-23
Purpose: evaluate photo-based meal analysis before enabling live AI in MacroLens.
Status: ready for first AI pipeline run.

## Benchmark Rules

This benchmark is intentionally range-based. Food photo nutrition cannot be exact without weighing ingredients, so the product should reward honest estimates, calibrated confidence, and useful corrections.

Each case defines:

- expected calories and macros as ranges;
- expected confidence tier;
- the most important failure modes;
- correction suggestions that should appear when uncertainty is meaningful.

The benchmark should be updated after real user photos are collected. Do not use it as medical advice.

## Scoring

Total: 100 points per case.

- Calories: 30 points if estimate is inside the expected range, 15 points if within 15 percent outside the range, 0 otherwise.
- Protein: 20 points if inside range, 10 points if within 20 percent outside the range, 0 otherwise.
- Carbs and fat: 20 points total, 10 points each if inside range.
- Confidence calibration: 15 points if the returned confidence tier matches expectation, 8 points if one tier away.
- Correction usefulness: 10 points if suggested corrections address the listed failure modes.
- Source handling: 5 points if output correctly marks `estimated`, `usda`, `open_food_facts`, or `mock`.

Pass thresholds:

- MVP pass: average score >= 70.
- Strong pass: average score >= 80.
- Marketable accuracy claim: average score >= 85 and no P0 failure modes.

Confidence tiers:

- `high`: simple visible food, portion likely clear, low hidden-fat risk.
- `medium`: portion or preparation is partly ambiguous.
- `low`: mixed dish, sauce/oil hidden, bakery/dessert ambiguity, or restaurant portion uncertainty.

## Benchmark Cases

| ID | Category | Meal | Photo Requirement | Calories Range | Protein Range | Carbs Range | Fat Range | Fiber Range | Confidence | Failure Modes | Useful Corrections |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| ML-001 | Breakfast | Croissant beurre + cafe noir | One bakery croissant on small plate | 220-330 | 4-8g | 25-38g | 11-20g | 1-3g | medium | bakery size, butter content | portion up/down |
| ML-002 | Breakfast | Pain au chocolat | One standard bakery pastry | 300-450 | 6-10g | 35-55g | 16-28g | 2-5g | medium | pastry size, chocolate quantity | portion up/down |
| ML-003 | Breakfast | Tartines beurre confiture | Two baguette slices with butter and jam | 330-520 | 7-13g | 55-85g | 10-22g | 2-5g | low | hidden butter, jam thickness | add butter, portion up/down |
| ML-004 | Breakfast | Yaourt grec, granola, fruits rouges | Bowl with yogurt, granola, berries | 320-520 | 18-32g | 40-70g | 8-20g | 5-11g | medium | granola density, yogurt fat level | portion up/down |
| ML-005 | Breakfast | Omelette 3 oeufs fromage | Omelette with visible cheese | 380-620 | 25-42g | 2-10g | 28-48g | 0-2g | medium | added oil, cheese amount | add oil, add cheese, portion up/down |
| ML-006 | Bakery | Demi-baguette jambon beurre | Sandwich with ham and butter | 520-760 | 22-38g | 70-105g | 18-35g | 3-7g | low | hidden butter, bread size | add butter, portion up/down |
| ML-007 | Bakery | Quiche lorraine slice | One bakery slice | 420-650 | 14-26g | 25-45g | 28-48g | 1-4g | low | slice weight, cream/bacon content | portion up/down |
| ML-008 | Bakery | Baguette tradition 100g + camembert 40g | Bread and cheese on plate | 360-500 | 14-24g | 55-75g | 10-20g | 3-6g | medium | cheese weight, bread weight | portion up/down |
| ML-009 | Bakery | Chausson aux pommes | One apple turnover | 300-480 | 4-8g | 40-65g | 14-28g | 2-5g | medium | filling and pastry size | portion up/down |
| ML-010 | Bakery | Brioche tranchee + Nutella | Two brioche slices with spread | 420-680 | 8-16g | 55-90g | 18-38g | 2-6g | low | spread thickness | add spread, portion up/down |
| ML-011 | Home | Poulet grille, riz blanc, haricots verts | Plate with chicken breast, rice, green beans | 480-720 | 38-60g | 45-80g | 8-24g | 4-10g | medium | rice portion, cooking oil | add oil, portion up/down |
| ML-012 | Home | Steak hache 5%, pommes de terre vapeur, salade | Beef patty, potatoes, salad | 520-760 | 32-52g | 45-80g | 16-32g | 5-10g | medium | meat fat, salad dressing | add sauce, portion up/down |
| ML-013 | Home | Saumon, quinoa, brocoli | Salmon fillet, quinoa, broccoli | 620-850 | 38-58g | 45-75g | 28-45g | 7-14g | medium | salmon size, oil | add oil, portion up/down |
| ML-014 | Home | Ratatouille + riz + oeuf au plat | Mixed vegetables, rice, fried egg | 450-700 | 15-28g | 60-95g | 14-32g | 8-16g | low | oil in ratatouille, egg oil | add oil, portion up/down |
| ML-015 | Home | Pates bolognaise maison | Pasta with meat tomato sauce | 650-950 | 28-48g | 75-120g | 20-42g | 6-12g | low | pasta weight, sauce fat, cheese | add cheese, portion up/down |
| ML-016 | Home | Couscous poulet legumes | Semolina, chicken, vegetables, broth | 700-1050 | 35-60g | 90-145g | 18-42g | 9-18g | low | semolina quantity, sauce/oil | portion up/down, add oil |
| ML-017 | Home | Chili con carne + riz | Bowl with chili and rice | 650-950 | 32-55g | 80-125g | 18-38g | 12-22g | low | rice hidden under chili, oil | portion up/down |
| ML-018 | Home | Lentilles saucisse | Plate of lentils with sausage | 650-950 | 32-52g | 55-95g | 28-50g | 14-24g | low | sausage weight, oil | portion up/down |
| ML-019 | Home | Gratin dauphinois + jambon | Cream potato gratin with ham | 620-900 | 25-42g | 50-85g | 30-55g | 4-8g | low | cream, cheese, portion depth | portion up/down |
| ML-020 | Home | Soupe legumes + pain + fromage | Bowl soup, bread, cheese | 380-650 | 15-30g | 45-80g | 12-34g | 7-14g | low | soup density, cheese amount | portion up/down |
| ML-021 | Restaurant | Burger boeuf frites | Restaurant burger with fries | 950-1450 | 35-65g | 95-155g | 45-85g | 6-13g | low | sauce, fries oil, patty size | add sauce, portion up/down |
| ML-022 | Restaurant | Pizza reine 3 parts | Three slices ham mushroom cheese pizza | 720-1050 | 30-50g | 80-125g | 28-55g | 5-10g | medium | slice size, cheese amount | portion up/down |
| ML-023 | Restaurant | Salade Cesar poulet | Caesar salad with chicken and croutons | 520-850 | 30-55g | 20-55g | 28-60g | 5-11g | low | dressing, parmesan, croutons | add sauce, portion up/down |
| ML-024 | Restaurant | Bo bun boeuf | Vietnamese rice noodle bowl | 650-950 | 25-45g | 85-130g | 18-38g | 6-12g | low | sauce sugar, noodle quantity | add sauce, portion up/down |
| ML-025 | Restaurant | Poké saumon riz avocat | Poke bowl with salmon, rice, avocado | 650-1000 | 28-50g | 75-125g | 25-55g | 8-16g | low | rice base hidden, sauce | add sauce, portion up/down |
| ML-026 | Restaurant | Kebab galette sauce blanche | Doner wrap with white sauce | 850-1250 | 35-60g | 75-120g | 42-75g | 5-10g | low | sauce, meat amount, wrap size | add sauce, portion up/down |
| ML-027 | Restaurant | Sushi saumon 12 pieces | Mixed salmon sushi set | 520-780 | 24-42g | 75-115g | 10-26g | 3-7g | medium | rice amount, sauce | portion up/down |
| ML-028 | Restaurant | Steak frites sauce poivre | Steak, fries, pepper sauce | 850-1250 | 45-75g | 60-105g | 45-75g | 5-10g | low | sauce, fries oil, steak size | add sauce, portion up/down |
| ML-029 | Restaurant | Pad thai poulet | Noodle stir fry with chicken | 750-1150 | 30-55g | 90-145g | 25-55g | 5-12g | low | oil, peanuts, noodle quantity | add oil, portion up/down |
| ML-030 | Restaurant | Risotto champignons parmesan | Creamy mushroom risotto | 650-1000 | 18-35g | 75-120g | 25-55g | 4-9g | low | butter, parmesan, portion depth | add cheese, portion up/down |
| ML-031 | Salad | Salade chevre chaud | Salad, goat cheese toast, nuts | 600-950 | 22-40g | 35-75g | 38-70g | 6-13g | low | dressing, cheese weight, nuts | add sauce, portion up/down |
| ML-032 | Salad | Bowl falafel houmous quinoa | Vegetarian bowl | 700-1050 | 22-40g | 85-135g | 30-60g | 14-26g | low | hummus/oil, falafel count | add oil, portion up/down |
| ML-033 | Salad | Taboule poulet avocat | Couscous salad with chicken and avocado | 560-850 | 28-48g | 55-95g | 22-48g | 8-16g | medium | avocado size, dressing | add sauce, portion up/down |
| ML-034 | Salad | Nicoise salade | Tuna, egg, potatoes, vegetables | 520-820 | 32-52g | 35-70g | 24-50g | 7-14g | medium | olive oil dressing, potato amount | add sauce, portion up/down |
| ML-035 | Salad | Burrata tomates pesto | Burrata, tomatoes, pesto, bread | 650-980 | 22-38g | 35-75g | 45-75g | 4-10g | low | burrata size, pesto oil, bread | add oil, portion up/down |
| ML-036 | Dessert | Tarte citron meringuee slice | One dessert slice | 360-560 | 4-8g | 50-80g | 15-30g | 1-4g | medium | slice size, sugar/fat density | portion up/down |
| ML-037 | Dessert | Mousse au chocolat ramequin | One ramekin | 280-480 | 5-10g | 25-50g | 18-34g | 2-6g | medium | ramekin size, cream content | portion up/down |
| ML-038 | Dessert | Crepe Nutella banane | One folded crepe with spread and banana | 480-760 | 8-16g | 70-110g | 18-38g | 4-9g | low | spread amount, crepe size | add spread, portion up/down |
| ML-039 | Dessert | Glace 2 boules chantilly | Two scoops with whipped cream | 300-560 | 5-10g | 35-70g | 14-32g | 0-4g | low | scoop size, whipped cream | portion up/down |
| ML-040 | Dessert | Fondant chocolat | One chocolate lava cake | 420-700 | 6-12g | 45-75g | 24-48g | 2-6g | medium | cake size, butter content | portion up/down |
| ML-041 | Packaged | Sandwich triangle poulet crudites | Packaged triangle sandwich visible | 350-520 | 16-28g | 35-60g | 12-28g | 3-7g | medium | label unavailable, sauce | add sauce, portion up/down |
| ML-042 | Packaged | Salade composee supermarche | Packaged salad bowl with pasta/chicken | 420-720 | 20-38g | 45-85g | 14-36g | 5-12g | medium | dressing packet, label hidden | add sauce, portion up/down |
| ML-043 | Packaged | Lasagnes portion micro-ondes | Ready meal lasagna tray | 450-750 | 20-38g | 45-85g | 18-40g | 4-9g | medium | tray weight, recipe variation | portion up/down |
| ML-044 | Packaged | Skyr nature + banane | Skyr cup and banana | 190-320 | 15-28g | 25-50g | 0-6g | 2-5g | high | banana size, skyr portion | portion up/down |
| ML-045 | Packaged | Barre proteinee chocolat | One protein bar | 180-280 | 15-25g | 15-30g | 5-12g | 4-10g | medium | product label not visible | use label/barcode later |
| ML-046 | Hard Case | Assiette buffet mixte | Plate with several small unknown items | 700-1200 | 25-55g | 70-140g | 30-75g | 6-18g | low | item identification, sauces, overlap | split dish, portion up/down |
| ML-047 | Hard Case | Plat en sauce curry coco poulet riz | Curry over rice in bowl | 750-1150 | 30-55g | 80-130g | 30-65g | 5-12g | low | coconut milk, rice hidden | add sauce, portion up/down |
| ML-048 | Hard Case | Raclette assiette | Potatoes, melted cheese, charcuterie | 900-1400 | 35-65g | 50-90g | 60-100g | 5-10g | low | cheese amount, charcuterie fat | portion up/down |
| ML-049 | Hard Case | Fromage, pain, vin aperitif dinatoire | Snack plate with cheese, bread, charcuterie | 650-1150 | 25-55g | 45-100g | 35-85g | 3-10g | low | partial meal, item count, alcohol excluded | split dish, portion up/down |
| ML-050 | Hard Case | Bowl invisible base riz sous toppings | Bowl with toppings hiding rice base | 650-1050 | 25-50g | 80-140g | 20-55g | 8-18g | low | hidden rice quantity, sauce | ask base amount, portion up/down |

## Required Aggregate Reporting

After the first live AI benchmark run, report:

- average score;
- median calorie error;
- percent of cases inside calorie range;
- percent of cases inside protein range;
- low-confidence recall on low-confidence cases;
- top 10 failure modes by frequency;
- correction suggestion precision.

## Release Gate

Do not make a public accuracy claim until:

- at least 50 benchmark cases have been run;
- average score is at least 80;
- no hard-case category averages below 65;
- the product copy says "estimate" and never implies medical precision.
