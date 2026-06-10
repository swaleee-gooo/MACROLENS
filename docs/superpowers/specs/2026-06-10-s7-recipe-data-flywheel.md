# S7 — Data flywheel recettes : cross-validation USDA + scores créateurs

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Haute (PHASE 2 — post-lancement, ne bloque pas la soumission) · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

Chaque import de recette TikTok/Instagram fournit une paire étiquetée : ingrédients + quantités déclarées + macros annoncées par le créateur. Les macros annoncées sont des **labels bruités** (les créateurs fitness sous-comptent l'huile, oublient les sauces). Le bruit se filtre par cross-validation : on recalcule les macros depuis les ingrédients via une base vérifiée (USDA FoodData Central) et on compare au chiffre annoncé. Concordance → corpus vérifié ; divergence → score de fiabilité par créateur. Le corpus vérifié devient un actif propriétaire : priors de quantités par type de plat (alimente la précision du scan photo), scores créateurs (donnée unique au monde), et plus tard des features produit (« recettes vérifiées qui rentrent dans mes macros restantes »). Décision actée le 2026-06-10 : c'est le flywheel complémentaire au flywheel corrections (S5/audit) — recettes → priors de plats ; corrections → priors de portions.

## Current State (vérifié le 2026-06-10)

- [recipeSchema.ts:37-45](../../../apps/mobile/src/recipeImport/recipeSchema.ts) : les macros annoncées par le créateur sont **déjà extraites** (`statedCaloriesPerServing`, `statedProteinPerServing`, `statedCarbsPerServing`, `statedFatPerServing`, nullables).
- [openaiRecipeExtractor.ts:14-28](../../../supabase/functions/extract-recipe/openaiRecipeExtractor.ts) : `ExtractedRecipe` porte `sourceUrl`, `sourcePlatform`, `sourceAuthor` — l'identité créateur est déjà capturée.
- [recipeNutrition.ts](../../../apps/mobile/src/recipeImport/recipeNutrition.ts) : le calcul de macros depuis les ingrédients existe côté client (résolution sur la base embarquée, pas USDA).
- `extract-recipe` ([handler.ts](../../../supabase/functions/extract-recipe/handler.ts)) : extraction LLM (gpt-4.1-mini), aucune persistance serveur — les recettes ne vivent que dans l'AsyncStorage du client ([recipeRepository.ts](../../../apps/mobile/src/storage/recipeRepository.ts)).
- `env.ts` : champ `usdaFdcApiKey` existe côté client mais inutilisé ; pour S7 la clé USDA vit côté serveur (secret de fonction), pas dans le client.
- Migrations existantes : aucune table recette côté Postgres.

## Proposed Change

### 1. Persistance serveur des imports (migration additive)

```sql
create table public.recipe_import_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url_hash text not null,              -- sha256 de l'URL canonique (dédup sans stocker l'URL en clair)
  source_platform text not null,
  source_author text,                  -- handle public du créateur
  servings integer not null,
  ingredients jsonb not null,          -- [{name, quantityG}]
  stated_macros jsonb,                 -- {calories, proteinG, carbsG, fatG} per serving, null si non annoncé
  computed_macros jsonb,               -- idem, calculé via USDA
  validation_status text not null,     -- 'verified' | 'uncertain' | 'mismatch' | 'unvalidated'
  calorie_delta_pct numeric            -- |computed - stated| / stated, null si unvalidated
);
alter table public.recipe_import_events enable row level security;
-- Zéro policy : service-role uniquement. Aucun user_id stocké : le corpus est anonyme par construction.

create view public.creator_scores as
  select source_author,
         count(*) as imports,
         avg(case when validation_status = 'verified' then 1.0 else 0.0 end) as verified_rate,
         avg(calorie_delta_pct) as avg_calorie_delta_pct
  from public.recipe_import_events
  where source_author is not null and validation_status <> 'unvalidated'
  group by source_author;
```

### 2. Résolution USDA serveur

- `supabase/functions/_shared/usdaResolver.ts` : `resolveIngredientMacros(name, quantityG)` → recherche FDC (endpoint `/v1/foods/search`, dataType `Foundation,SR Legacy`), prend le meilleur match, calcule les macros au prorata des grammes. Cache en mémoire par invocation. Secret `USDA_FDC_API_KEY` côté fonction.
- Échec de résolution d'un ingrédient (pas de match, API down) → la recette est marquée `unvalidated`, **jamais d'erreur remontée à l'utilisateur**.

### 3. Cross-validation dans `extract-recipe`

Après l'extraction réussie, en **best-effort non bloquant** (la réponse au client part d'abord, la validation s'exécute ensuite via `EdgeRuntime.waitUntil`) :

1. `computed = somme(resolveIngredientMacros(ingredient))` ÷ servings.
2. Si `stated_macros.calories` présent : `delta = |computed - stated| / stated` → `verified` (≤ 10 %), `uncertain` (10-25 %), `mismatch` (> 25 %). Sinon `unvalidated`.
3. Insert dans `recipe_import_events` (service-role).
4. La réponse client gagne un champ optionnel `validation: { status, computedCaloriesPerServing } | null` quand la validation a pu se faire de manière synchrone rapide (< 2 s), sinon null — le client n'attend jamais.

### 4. Surface client minimale

- [recipeSchema.ts](../../../apps/mobile/src/recipeImport/recipeSchema.ts) : champ optionnel `validation` (nullable, défaut null → **clients/serveurs désynchronisés restent compatibles**).
- [RecipeReviewScreen](../../../apps/mobile/src/screens/RecipeReviewScreen.tsx) : badge « Checked against USDA ✓ » si `verified`, « Creator macros look off — we computed ours » si `mismatch` (cadrage positif : on affiche NOTRE chiffre avec confiance, pas un doute). Aucun badge sinon. Rien d'autre ne change dans le flux d'import.

### 5. Exploitation des priors (lecture seule, hors scope d'implémentation ici)

Une requête documentée (pas de code) montre comment extraire les priors : quantité médiane par `canonicalFoodName` dans les recettes `verified`, par type de plat. La consommation par le pipeline de scan (metaboproof) est un chantier ultérieur dédié.

## Acceptance Criteria

1. Import d'une recette fixture avec macros annoncées justes (delta < 10 %) → ligne `recipe_import_events` avec `validation_status = 'verified'`, `computed_macros` cohérents (test d'intégration locale avec mock USDA).
2. Recette fixture avec macros annoncées fausses (delta > 25 %) → `mismatch`, et le badge client affiche le chiffre calculé.
3. Recette sans macros annoncées → `unvalidated`, aucun badge, flux identique à aujourd'hui.
4. USDA API down (mock qui throw) → l'import aboutit normalement pour l'utilisateur, l'événement est `unvalidated` (fail-open vérifié par test).
5. `creator_scores` agrège correctement (test SQL/fixture : 3 imports d'un même handle → verified_rate exact).
6. Aucune donnée personnelle dans `recipe_import_events` : pas de user_id, URL hashée (vérif revue de migration). RLS activé, zéro policy.
7. Client v(n-1) (sans le champ `validation`) continue de fonctionner contre le serveur v(n) — et inversement (champ optionnel des deux côtés, test de parsing schema).
8. `npx tsc --noEmit` + `npm test` verts ; latence p50 de la réponse `extract-recipe` inchangée (la validation est post-réponse).

## Testing Plan

| Couche | Quoi | Count |
|---|---|---|
| Unit (functions) | usdaResolver : match, prorata grammes, échec → null | +4 |
| Unit (functions) | cross-validation : seuils 10/25 %, stated absent, fail-open | +5 |
| Unit (app) | parsing schema avec/sans `validation` ; logique badge | +3 |
| Intégration | import fixture bout-en-bout via `supabase functions serve` + mock USDA | checklist |

## Rollback Plan

La validation est best-effort et post-réponse : la désactiver = retirer le secret `USDA_FDC_API_KEY` (tout devient `unvalidated`, zéro impact utilisateur). Revert complet : redéployer la fonction précédente ; la table reste, inerte et additive.

## Effort Estimate

Migration + vue ~30 min · usdaResolver + tests ~1,5 h · intégration extract-recipe + waitUntil ~1 h · schéma client + badge ~45 min · tests intégration ~45 min. Total ~4,5 h.

## Files Reference

| Fichier | Changement |
|---|---|
| `supabase/migrations/<ts>_create_recipe_import_events.sql` | NOUVEAU — table + vue creator_scores |
| `supabase/functions/_shared/usdaResolver.ts` (+ test) | NOUVEAU |
| `supabase/functions/extract-recipe/handler.ts` | + validation post-réponse (waitUntil), champ `validation` |
| `apps/mobile/src/recipeImport/recipeSchema.ts` | + champ optionnel `validation` |
| `apps/mobile/src/screens/RecipeReviewScreen.tsx` | badge conditionnel |
| Secret fonction `USDA_FDC_API_KEY` | hors repo (dashboard Supabase) |

## Out of Scope

Consommation des priors par le pipeline de scan (chantier metaboproof dédié), fine-tuning de modèle, feature « recettes qui rentrent dans mes macros » (phase 3), republication de contenu créateur (jamais : stats dérivées uniquement), scores créateurs exposés publiquement (décision produit ultérieure).
