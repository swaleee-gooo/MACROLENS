# S4 — Sink analytics PostHog (funnel mesurable)

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Critique · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

28 events couvrant tout le funnel (app_opened → onboarding → paywall → purchase) existent déjà et partent… dans `console.log`. Impossible de mesurer la conversion du paywall qu'on allume en S1. Décision actée : PostHog (free tier 1M events/mois, SDK Expo officiel, feature flags et session replay inclus pour plus tard). L'architecture existante (`AnalyticsSink`) rend l'intégration purement additive.

## Current State (vérifié le 2026-06-10)

- [analyticsClient.ts](../../../apps/mobile/src/analytics/analyticsClient.ts) : interface `AnalyticsSink { track(event) }`, garde-fou `assertPrivacySafePayload` (rejette `imageUri`, `rawNote`, etc.), sinks existants : console et mémoire (tests).
- App.tsx:~13 : `createConsoleAnalyticsSink()` instancié au boot.
- [analyticsEvents.ts](../../../apps/mobile/src/analytics/analyticsEvents.ts) : 28 events typés. Manque `trial_started` (noté, hors scope ici) et `paywall_pricing_failed` (ajouté par S1).
- Aucun identifiant utilisateur envoyé nulle part.

## Proposed Change

1. **SDK** : `npx expo install posthog-react-native` (+ deps expo-file-system/expo-application si requises par le SDK).
2. **`src/analytics/posthogAnalyticsSink.ts`** :

```typescript
export function createPostHogAnalyticsSink(apiKey: string, host = 'https://us.i.posthog.com'): AnalyticsSink {
  const client = new PostHog(apiKey, { host, flushAt: 10, flushInterval: 30 });
  return { track(event) { client.capture(event.name, event.payload); } };
}
```

3. **Sink composite** : `createFanoutAnalyticsSink(...sinks)` — en dev : console seul (comportement inchangé) ; en build avec `EXPO_PUBLIC_POSTHOG_API_KEY` présent : console + PostHog. Clé absente → PostHog jamais instancié. **Import dynamique obligatoire** : `await import('posthog-react-native')` à l'intérieur de la factory, uniquement quand la clé est présente — même pattern que `loadPurchases()` dans [revenueCatEntitlementProvider.ts:37-40](../../../apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts). Aucun import top-level du SDK (sinon il s'exécute en test/CI et viole le critère 3).
4. **Identité** : `client.identify(activeUserId)` avec l'UUID Supabase/local uniquement — jamais d'email (politique privacy existante). Reset à la déconnexion.
5. **env** : `EXPO_PUBLIC_POSTHOG_API_KEY` dans `env.ts` + `.env.example` (vide) + environnement EAS production/preview.
6. **Setup compte (Idriss, ~15 min, guidé)** : créer compte PostHog Cloud US, projet « MacroLens », copier la Project API Key, la mettre dans EAS env. Créer le dashboard funnel de base (insight Funnel : app_opened → onboarding_started → onboarding_completed → paywall_viewed → paywall_cta_tapped → purchase_completed).

## Acceptance Criteria

1. Build preview avec clé : traverser onboarding + paywall sandbox → les events apparaissent dans PostHog Live Events en < 60 s, avec le funnel reconstructible.
2. Les events sont attachés à un `distinct_id` = UUID utilisateur ; aucune propriété ne contient email, imageUri, ou texte libre (vérif sur 10 events réels — `assertPrivacySafePayload` reste le garde-fou côté client).
3. Sans clé (dev local, CI, tests) : aucun import PostHog exécuté, `npm test` inchangé, aucun appel réseau.
4. Mode avion : les events sont mis en queue par le SDK et flushés au retour réseau (vérif manuelle) ; pas de crash.
5. `npx tsc --noEmit` + `npm test` verts ; tests unitaires du fanout sink (dispatch aux deux sinks) et du choix de sink selon env.
6. Les 28 noms d'events existants sont transmis SANS renommage (le funnel historique des tests mémoire reste valide).

## Testing Plan

| Couche | Quoi | Count |
|---|---|---|
| Unit | fanout sink, factory selon env (clé présente/absente), identify/reset | +4 |
| Manuel | Funnel complet en preview, vérif Live Events + dashboard | checklist |

## Rollback Plan

Retirer `EXPO_PUBLIC_POSTHOG_API_KEY` de l'env EAS + OTA update → sink console seul. Revert du commit pour suppression complète.

## Effort Estimate

SDK + sink + fanout ~45 min · identify/reset ~15 min · tests ~20 min · setup compte + dashboard ~15 min. Total ~1,5 h.

## Files Reference

| Fichier | Changement |
|---|---|
| `apps/mobile/package.json` | + `posthog-react-native` |
| `apps/mobile/src/analytics/posthogAnalyticsSink.ts` (+ test) | NOUVEAU |
| `apps/mobile/src/analytics/analyticsClient.ts` | + `createFanoutAnalyticsSink` (additif) |
| `apps/mobile/App.tsx` | factory de sink selon env |
| `apps/mobile/src/config/env.ts`, `.env.example` | + `EXPO_PUBLIC_POSTHOG_API_KEY` |

## Out of Scope

Feature flags PostHog (dispo gratuitement, usage spécifié en phase 2), session replay, event `trial_started` (dépend des webhooks RevenueCat, phase 2), dashboards avancés/cohortes.
