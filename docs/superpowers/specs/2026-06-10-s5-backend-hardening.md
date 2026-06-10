# S5 — Durcissement backend : rate limiting, timeouts, JWT

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Critique · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

`analyze-meal` coûte ~0,003 $/appel (OpenAI gpt-4.1-mini) et n'a **aucune limite par utilisateur** : un script avec des comptes (mêmes anonymes) peut générer une facture illimitée. Aucun timeout sur les fetchs OpenAI/Gemini/vision-signals : un provider qui pend bloque la requête indéfiniment. À corriger AVANT d'exposer l'app au trafic US.

## Current State (vérifié le 2026-06-10)

- [handler.ts:91-94](../../../supabase/functions/analyze-meal/handler.ts) : `getUserIdFromAuthorizationHeader` → 401 si absent. Point d'insertion net pour le quota juste après.
- [auth.ts](../../../supabase/functions/analyze-meal/auth.ts) : décode le payload JWT sans vérifier la signature NI l'expiration. Mitigation existante : [config.toml](../../../supabase/config.toml) ne désactive pas `verify_jwt` → la gateway Supabase vérifie la signature par défaut. Manque : épinglage explicite + validation `exp` en défense en profondeur.
- Fetchs sans timeout : `openaiMealAnalyzer.ts`, `geminiMealAnalyzer.ts`, `visionSignalsClient.ts` (analyze-meal), idem `extract-recipe` et `scan-nutrition-label`.
- `lookup-packaged-food` : aucune authentification (proxy Open Food Facts — coût faible mais abusable).
- Handlers testés avec deps injectées (vitest) → les nouveaux comportements sont testables unitairement.

## Proposed Change

### 1. Rate limiting par utilisateur (Postgres, pas de nouvelle infra)

Migration additive `supabase/migrations/<ts>_create_scan_usage.sql` :

```sql
create table public.scan_usage (
  user_id uuid not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (user_id, window_start)
);
alter table public.scan_usage enable row level security;
-- Aucune policy: accès service-role uniquement (les Edge Functions écrivent, le client jamais).

create or replace function public.increment_scan_usage(p_user_id uuid, p_window timestamptz)
returns integer language sql security definer as $$
  insert into public.scan_usage (user_id, window_start, request_count)
  values (p_user_id, p_window, 1)
  on conflict (user_id, window_start) do update set request_count = scan_usage.request_count + 1
  returning request_count;
$$;
```

Module partagé `supabase/functions/_shared/rateLimit.ts` : la fenêtre est calculée en TS, en UTC — `windowStart = new Date(); windowStart.setUTCMinutes(0, 0, 0)` — et passée en paramètre à la RPC (pas de `date_trunc` SQL). `retryAfterSeconds` = secondes restantes jusqu'à la prochaine heure UTC pleine. Limites par fonction via env avec défauts :

| Fonction | Limite/heure (défaut) | Variable env |
|---|---|---|
| analyze-meal | 20 | `RATE_LIMIT_ANALYZE_PER_HOUR` |
| extract-recipe | 10 | `RATE_LIMIT_RECIPE_PER_HOUR` |
| scan-nutrition-label | 20 | `RATE_LIMIT_LABEL_PER_HOUR` |

Dépassement → `429 { error: 'rate_limited', retryAfterSeconds }`. **Fail-open** : si l'appel Postgres échoue (timeout, erreur), la requête passe (on ne casse jamais un vrai utilisateur pour protéger des centimes) + `console.error` loggé. Insertion dans le handler juste après la résolution du `userId` (handler.ts:94).

### 2. Timeouts + retry sur les appels IA

- `AbortSignal.timeout(30_000)` sur les fetchs OpenAI et Gemini ; `AbortSignal.timeout(10_000)` sur vision-signals (signal optionnel, dégradation déjà gérée).
- Timeout OpenAI → le modelRouter bascule sur Gemini (chemin de fallback existant) ; timeout des deux → `502 analysis_failed` actuel (le client a déjà son UX d'erreur, rien à changer côté app).
- Un (1) retry sur erreur réseau transitoire (pas sur 4xx) avant fallback.

### 3. JWT — défense en profondeur

- [config.toml](../../../supabase/config.toml) : déclarer TOUTES les fonctions avec `verify_jwt = true` explicite (analyze-meal, extract-recipe, scan-nutrition-label, lookup-packaged-food, delete-account) — épingle le défaut, survit à un changement de défaut Supabase.
- `auth.ts` (partagé) : valider `exp > now` en plus de `sub` ; 401 si expiré.
- `lookup-packaged-food` : exiger le même header Authorization (la gateway vérifie déjà la signature si verify_jwt=true ; le handler récupère le userId comme les autres).

### 4. Côté client (minimal)

[remoteAnalysisService.ts](../../../apps/mobile/src/analysis/remoteAnalysisService.ts) : mapper la réponse 429 sur un message utilisateur propre (« You've hit the hourly scan limit. Try again in a few minutes. ») au lieu du fallback d'erreur générique. Aucun autre changement client.

## Acceptance Criteria

1. 21 appels `analyze-meal` du même user dans l'heure (test scripté contre l'environnement local `supabase functions serve`) → les 20 premiers passent, le 21e reçoit 429 avec `retryAfterSeconds` ; l'app affiche le message dédié.
2. Deux users différents ne partagent pas leur quota (test unitaire sur la clé de fenêtre).
3. Postgres indisponible (dep `incrementUsage` qui throw en test) → la requête d'analyse passe quand même (fail-open vérifié par test unitaire).
4. Un mock OpenAI qui ne répond jamais → la requête bascule sur Gemini en ~30 s max ; les deux qui pendent → 502 en ~60 s max, jamais de requête infinie (tests avec fake timers).
5. JWT expiré (payload `exp` passé) → 401 sur les 5 fonctions.
6. `lookup-packaged-food` sans Authorization → 401 ; l'app, qui envoie déjà le header via le client Supabase, continue de fonctionner (vérif manuelle barcode scan).
7. Migration appliquée sur un shadow db sans erreur ; `scan_usage` a RLS activé et zéro policy (inaccessible au client) ; aucune table existante modifiée.
8. Tests vitest des handlers existants toujours verts (les nouvelles deps ont des défauts no-op dans les tests existants).

## Testing Plan

| Couche | Quoi | Count |
|---|---|---|
| Unit (functions) | rateLimit : fenêtre, dépassement, fail-open, multi-user | +6 |
| Unit (functions) | timeouts/retry/fallback du modelRouter ; exp JWT | +5 |
| Unit (app) | mapping 429 → message dédié | +2 |
| Intégration locale | script 21 appels via `supabase functions serve` | checklist |

## Rollback Plan

Limites configurables par env sans redéploiement (mettre `RATE_LIMIT_*` très haut = désactivation de fait). Revert complet : redéployer les fonctions précédentes (`supabase functions deploy`), la table `scan_usage` peut rester (inerte, additive).

## Effort Estimate

Migration + rateLimit partagé ~1 h · intégration 3 handlers ~45 min · timeouts/retry ~45 min · JWT/config.toml ~15 min · client 429 ~15 min · tests ~30 min. Total ~3 h.

## Files Reference

| Fichier | Changement |
|---|---|
| `supabase/migrations/<ts>_create_scan_usage.sql` | NOUVEAU — table + fonction RPC |
| `supabase/functions/_shared/rateLimit.ts` (+ test) | NOUVEAU |
| `supabase/functions/analyze-meal/handler.ts:94` | + quota check ; deps injectables |
| `supabase/functions/extract-recipe/handler.ts`, `scan-nutrition-label/handler.ts` | idem |
| `auth.ts` dupliqué dans chaque dossier de fonction (analyze-meal, extract-recipe, scan-nutrition-label, lookup-packaged-food, delete-account — 5 fichiers, ou factorisation dans `_shared/auth.ts` importé par les 5) | + validation `exp` |
| `supabase/functions/*MealAnalyzer.ts`, `visionSignalsClient.ts` | + AbortSignal.timeout + retry |
| `supabase/config.toml` | verify_jwt = true explicite, 5 fonctions |
| `apps/mobile/src/analysis/remoteAnalysisService.ts` | mapping 429 |

## Out of Scope

Quota journalier différencié free/premium (pas de free tier au lancement — hard paywall), alerting de dépense (config dashboard Supabase/OpenAI, post-lancement), rate limiting de `delete-account` (déjà service-role), worker auth vision-signals (service interne, ticket séparé).
