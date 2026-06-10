# S3 — Crash reporting Sentry + Error Boundary

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Critique · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

Aucun crash reporting : un crash en production est invisible. Aucun Error Boundary React : une exception dans n'importe quel composant écran blanc-ise toute l'app. Et [App.tsx:391-393](../../../apps/mobile/App.tsx) avale silencieusement les erreurs de boot (`boot().catch(() => { setScreen({ name: 'onboarding' }) })`) — un bug de démarrage renvoie l'utilisateur en onboarding sans trace. Avant d'allumer le paywall (S1), il faut voir ce qui casse.

## Current State (vérifié le 2026-06-10)

- `package.json` : aucun SDK Sentry/Crashlytics.
- Aucun `componentDidCatch`/ErrorBoundary dans `src/` (vérifié par grep).
- Erreurs avalées : `boot().catch(() => …)` App.tsx:391, multiples `.catch(() => undefined)` sur Linking (App.tsx:412, 414, 428).
- Expo SDK 54, EAS Build + EAS Updates en place (le plugin Sentry s'intègre proprement à cette chaîne, y compris l'upload des sourcemaps).

## Proposed Change

1. **SDK** : `npx expo install @sentry/react-native` + plugin `@sentry/react-native/expo` dans [app.config.js](../../../apps/mobile/app.config.js) (org/project/authToken via env EAS, PAS dans le repo).
2. **Init dans un nouveau `src/observability/sentry.ts`** :
   - `dsn` depuis `EXPO_PUBLIC_SENTRY_DSN` (ajouté à `env.ts` + `.env.example`, vide par défaut → **Sentry entièrement inactif si la variable est absente** : comportement dev inchangé, c'est la garantie non-régression).
   - `environment` = variant (development/preview/production depuis app.config.js), `tracesSampleRate: 0.2`, `sendDefaultPii: false`, `beforeSend` qui supprime toute URL d'image (`imageUri`, `imageUrl`) des breadcrumbs/contexts — même politique de privacy que `assertPrivacySafePayload`.
3. **Wrapping** : `Sentry.wrap(App)` dans [index.ts](../../../apps/mobile/index.ts) (no-op si non initialisé).
4. **Error Boundary** : `src/components/AppErrorBoundary.tsx` — class component, `componentDidCatch` → `Sentry.captureException` + event analytics `screen_error` ; fallback minimal dans le design system (fond `colors.background`, « Something went wrong », bouton « Restart » qui reset le state du boundary). Englobe l'arbre dans App.tsx au-dessus du switch d'écrans.
5. **Boot errors** : `boot().catch((error) => { Sentry.captureException(error); setScreen({ name: 'onboarding' }); })` — le comportement utilisateur ne change pas, mais l'erreur devient visible.
6. **Setup compte (Idriss, ~15 min, guidé)** : créer org Sentry (free tier 5k errors/mois), projet React Native, récupérer DSN + auth token ; mettre `EXPO_PUBLIC_SENTRY_DSN` (production + preview) et `SENTRY_AUTH_TOKEN` (secret de build pour les sourcemaps) dans les environnements EAS.

## Acceptance Criteria

1. Build preview avec DSN : un bouton de test temporaire (ou `Sentry.captureException(new Error('sentry-smoke'))` via le dev unlock) fait apparaître l'erreur dans le dashboard Sentry en < 2 min, avec stack trace symbolicée (sourcemaps uploadées par le plugin EAS).
2. Une exception levée volontairement dans un écran (test manuel en dev) affiche le fallback de l'Error Boundary au lieu d'un écran blanc ; « Restart » ramène à Home sans tuer le process ; l'événement apparaît dans Sentry.
3. Sans `EXPO_PUBLIC_SENTRY_DSN` (dev local, tests) : aucun appel réseau Sentry, `npm test` et `npm run web` strictement inchangés.
4. Aucune donnée personnelle ni URL de photo dans les events Sentry (vérif manuelle d'un event : pas d'email, pas d'imageUri).
5. `npx tsc --noEmit` + `npm test` verts ; test unitaire du `beforeSend` (filtrage imageUri) et de l'ErrorBoundary (rend le fallback sur throw).
6. Taille du bundle : pas de blocage — vérifier que le build EAS passe et que le démarrage ne régresse pas visiblement (Sentry init est lazy/async).

## Testing Plan

| Couche | Quoi | Count |
|---|---|---|
| Unit | `beforeSend` filtre les clés privées ; ErrorBoundary rend fallback et appelle capture | +3 |
| Manuel | Smoke crash en preview, vérif dashboard, vérif sourcemaps | checklist |

## Rollback Plan

Retirer `EXPO_PUBLIC_SENTRY_DSN` de l'env EAS → SDK inerte (no-op), sans rebuild via OTA update. Revert complet = revert du commit.

## Effort Estimate

SDK + config plugin ~30 min · init + privacy ~20 min · ErrorBoundary + boot catch ~30 min · tests + QA ~20 min. Total ~1,5 h + 15 min de setup compte.

## Files Reference

| Fichier | Changement |
|---|---|
| `apps/mobile/package.json` | + `@sentry/react-native` |
| `apps/mobile/app.config.js` | + plugin Sentry (org/project via env) |
| `apps/mobile/src/observability/sentry.ts` (+ test) | NOUVEAU — init, privacy beforeSend |
| `apps/mobile/src/components/AppErrorBoundary.tsx` (+ test) | NOUVEAU |
| `apps/mobile/index.ts` | `Sentry.wrap(App)` |
| `apps/mobile/App.tsx:391` | boot catch reporte à Sentry |
| `apps/mobile/src/config/env.ts`, `.env.example` | + `EXPO_PUBLIC_SENTRY_DSN` |

## Out of Scope

Performance monitoring avancé (transactions custom), alerting Slack/email (config dashboard post-lancement), Sentry sur les Edge Functions (S5 garde ses logs Supabase).
