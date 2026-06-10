# Plan d'implémentation — Lancement US (epic 2026-06-10)

**Specs sources :** [epic](../specs/2026-06-10-us-launch-epic.md) + S1-S7, validées le 2026-06-10 (gate codex 7/10).
**Règle d'or :** chaque vague se termine par `npx tsc --noEmit` + `npm test` verts et un smoke `npm run web` avant de passer à la suivante. Aucune vague ne commence si la précédente a cassé quelque chose.

## Contrainte structurante : les modules natifs

`@sentry/react-native` (S3), `posthog-react-native` (S4) et `expo-store-review` (S6) sont des modules **natifs** : ils exigent un nouveau build EAS — pas diffusables en OTA. Conséquence : on groupe les trois ajouts dans la **vague 1** pour ne payer qu'UN cycle de build dev/preview. S1 (react-native-purchases déjà installé), S2 (pur JS) et S5 (backend) n'exigent aucun build natif supplémentaire.

## Vague 0 — Pré-vol (~20 min, AUJOURD'HUI)

1. `git push -u origin codex/share-cards-native` — 39 commits locaux non sauvegardés, c'est le risque n°1 du projet à cette minute.
2. Décision de branche : terminer/merger `codex/share-cards-native` vers `main` (ou la déclarer branche d'intégration du lancement). Ensuite : **une branche par spec** (`s3-sentry`, `s4-posthog`, etc.), petites PR, merge rapide.
3. Vérifier la baseline : `cd apps/mobile && npx tsc --noEmit && npm test` — on part d'un état vert connu.

## Piste parallèle Idriss (manuel, peut commencer immédiatement)

| Tâche | Spec | Durée |
|---|---|---|
| ASC : prix USD sur les 2 abonnements (49,99 $/an, 9,99 $/mois) | S1-A1 | 15 min |
| ASC : Introductory Offer « 7 days free » sur l'ANNUEL uniquement | S1-A2 | 15 min |
| RevenueCat : produits rattachés à `macrolens_pro`, offering `default` avec `$rc_annual` + `$rc_monthly` | S1-A3/A4 | 15 min |
| ASC : créer un Sandbox Apple ID | S1-A5 | 5 min |
| Sentry : org + projet RN → récupérer DSN + auth token → EAS env (preview + production) | S3-6 | 15 min |
| PostHog : compte Cloud US + projet → Project API Key → EAS env | S4-6 | 15 min |

## Vague 1 — Observabilité + natif groupé : S3, S4, S6 (~4 h)

Ordre interne : S3 (Sentry + Error Boundary) → S4 (sink PostHog, import dynamique obligatoire) → S6 (review prompt, logique pure d'abord).
Livraison : une branche par spec mais un seul build EAS development à la fin de la vague pour valider les 3 modules natifs ensemble.
Vérification : critères d'acceptation de chaque spec + smoke crash Sentry en preview + funnel PostHog en Live Events.

## Vague 2 — Bouclier backend : S5 (~3 h)

Migration `scan_usage` testée sur db locale (`supabase db reset`) → `_shared/rateLimit.ts` + intégration des 3 handlers → timeouts/retry analyzers → `verify_jwt = true` épinglé dans config.toml → mapping 429 client.
Vérification : script des 21 appels contre `supabase functions serve`, tests vitest fonctions, déploiement (`supabase functions deploy`) en fin de vague.
Note : déployable indépendamment de l'app — aucun couplage de version (le client actuel sait déjà afficher une erreur d'analyse).

## Vague 3 — L'interrupteur revenu : S1 (~4 h + QA)

Pré-requis : piste Idriss terminée (ASC + RevenueCat + sandbox ID).
`getPricing()` + types → PaywallScreen dynamique (badge/CTA conditionnels, fallback « Price shown at checkout ») → build **preview** avec `EXPO_PUBLIC_PAYWALL_ENABLED=true` + `EXPO_PUBLIC_ENTITLEMENT_MODE=store`.
QA sandbox obligatoire avant tout build production : achat annuel (feuille Apple : « 7 days free puis $49.99/yr »), achat mensuel, restore, annulation de feuille, mode avion.
**Drill de rollback** (à faire une fois, chronométré) : flip du flag en env EAS + `npm run eas:update:production` → vérifier que le paywall disparaît. C'est l'assurance-vie du lancement.

## Vague 4 — Marché US : S2 (~3 h)

`units.ts` + tests round-trip d'abord (TDD — c'est le module où une erreur d'arrondi serait invisible) → préférence + toggle Settings → Onboarding → EditProfile/Profile/WeighIn → affichages passifs.
Vérification : critère 4 de S2 (dump AsyncStorage avant/après identique pour un utilisateur existant) + parcours onboarding complet en imperial sur le web et sur device.

## Checklist pré-soumission (après vague 4)

1. Build production EAS avec les 2 flags paywall + DSN Sentry + clé PostHog.
2. TestFlight : parcours complet sur device réel — onboarding (imperial) → paywall (prix USD) → achat sandbox → scan réel → save → review prompt au 3e repas.
3. Vérifier dans Sentry : zéro crash sur la session TestFlight. Dans PostHog : funnel complet visible.
4. Re-tester le rollback drill une dernière fois.
5. Soumettre. Surveiller Sentry + PostHog quotidiennement la première semaine.

## Post-lancement

- **S7** (flywheel recettes, ~4,5 h) : dès que le lancement est stable — la table et le resolver USDA n'ont aucun couplage avec le client publié.
- Suite phase 2 (hors epic) : notifications push, Apple Health réel, plan hebdo + A/B paywall, refactor App.tsx.

## Budget total

~14 h de travail d'implémentation + ~1,5 h de tâches manuelles Idriss + 2 cycles de build EAS (1 dev/preview en vague 1, 1 production en pré-soumission). Réaliste sur 3-5 jours calendaires en comptant la QA sandbox et les temps de build.

## Risques résiduels et parades

| Risque | Parade |
|---|---|
| L'offre trial ASC met du temps à se propager dans RevenueCat | QA sandbox en vague 3 avant build prod ; badge dynamique = jamais de fausse promesse même si l'offre manque |
| Un module natif de la vague 1 casse le build EAS | Vague 1 groupée tôt = on le découvre J1, pas la veille de la soumission |
| Apple rejette le paywall (3.1.2c) | Prix annuel dominant typographiquement (spécifié S1-B4) + mention légale conditionnelle ; le précédent Cal AI montre exactement où est la ligne |
| Régression invisible sur les unités | Stockage métrique intouché + test round-trip + dump AsyncStorage avant/après |
