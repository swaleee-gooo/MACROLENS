# EPIC — Bloquants lancement US MacroLens

**Date :** 2026-06-10 · **Source :** [audit complet](../../audits/macrolens-audit-2026-06-10.md) · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)
**Contrainte non négociable :** zéro régression sur l'app existante. Chaque chantier est isolé, flaggé ou à défaut inchangé, vérifié par `npx tsc --noEmit` + `npm test` verts, et révertible indépendamment.

## Context

MacroLens est prêt à être soumis sur l'App Store US, mais l'audit du 2026-06-10 a identifié 6 bloquants : la monétisation est éteinte, les prix sont en EUR codés en dur, les unités sont métriques, l'app n'a ni crash reporting ni analytics réels, l'endpoint IA n'est pas protégé, et il n'y a pas de prompt de notation. Décisions actées avec Idriss le 2026-06-10 : hard paywall + trial 7 jours (le flux existe déjà dans le code), PostHog comme backend analytics, plan hebdomadaire différé en phase 2, configuration App Store Connect/RevenueCat documentée dans S1 et exécutée manuellement par Idriss.

## Child Issues

| # | Titre | Priorité | Effort (CC) | Dépendances |
|---|-------|----------|-------------|-------------|
| S3 | [Sentry + Error Boundary](2026-06-10-s3-sentry-error-boundary.md) | Critique | ~1,5 h + 15 min setup compte | Aucune |
| S4 | [Sink analytics PostHog](2026-06-10-s4-posthog-analytics.md) | Critique | ~1,5 h + 15 min setup compte | Aucune |
| S5 | [Durcissement backend (rate limiting + timeouts)](2026-06-10-s5-backend-hardening.md) | Critique | ~3 h | Aucune |
| S1 | [Activation paywall + prix localisés + trial](2026-06-10-s1-paywall-activation.md) | Critique | ~4 h code + ~1 h ASC (Idriss) | S3, S4 recommandés avant ; config ASC par Idriss |
| S2 | [Unités impériales (lbs / ft-in)](2026-06-10-s2-imperial-units.md) | Haute | ~3 h | Aucune |
| S6 | [Prompt de notation automatique](2026-06-10-s6-store-review-prompt.md) | Haute | ~1 h | Aucune |

### Phase 2 (post-lancement — ne bloque pas la soumission)

| # | Titre | Priorité | Effort (CC) | Dépendances |
|---|-------|----------|-------------|-------------|
| S7 | [Data flywheel recettes : cross-validation USDA + scores créateurs](2026-06-10-s7-recipe-data-flywheel.md) | Haute | ~4,5 h | S5 (pattern _shared), lancement effectué |

## Dependency Graph

```
S3 Sentry ──────┐
S4 PostHog ─────┼──> S1 Paywall ON ──> Soumission App Store
S5 Backend ─────┘         ▲
                          │ (config ASC/RevenueCat par Idriss, en parallèle)
S2 Unités impériales ─────┤
S6 Rating prompt ─────────┘
```

## Sequencing Rationale

1. **S3/S4/S5 d'abord** : ce sont des chantiers à zéro changement visible pour l'utilisateur (risque de casse minimal) et ils donnent la visibilité (crashs, funnel) AVANT d'allumer le paywall. Activer la monétisation en aveugle = impossible de diagnostiquer un problème de conversion ou un crash au paiement.
2. **S1 ensuite** : c'est l'interrupteur revenu. Il a une dépendance externe (config App Store Connect par Idriss) qui peut avancer en parallèle pendant S3-S5.
3. **S2 et S6** sont indépendants et peuvent s'intercaler n'importe quand avant la soumission.
4. Tout doit être mergé avant la soumission App Store ; rien dans cet epic n'est post-lancement.

## Definition of Done (epic)

1. Build TestFlight production avec paywall actif : un nouvel utilisateur traverse onboarding → paywall avec prix en **USD localisés** (`$XX.XX`), badge trial affiché **uniquement** si l'offre d'essai existe côté store, achat sandbox réussi, restore réussi.
2. Profil/onboarding saisissables en lbs et ft/in ; les données stockées restent en métrique (aucune migration) ; aller-retour de conversion sans dérive (test automatisé).
3. Un crash JS volontaire en build preview apparaît dans Sentry en < 2 min ; l'Error Boundary affiche un écran de récupération au lieu d'un écran blanc.
4. Les events analytics arrivent dans PostHog : les 28 existants + 2 nouveaux (`paywall_pricing_failed` ajouté par S1, `review_prompt_requested` ajouté par S6) = 30 au total (vérifié sur le funnel `app_opened → onboarding_started → onboarding_completed → paywall_viewed → purchase_completed` en sandbox).
5. Le 21e scan d'un même utilisateur dans la même heure reçoit HTTP 429 avec un message propre côté app ; un appel OpenAI qui pend est coupé à 30 s et bascule sur le fallback.
6. Le prompt de notation natif s'affiche après le 3e repas sauvegardé (vérifié en sandbox), jamais deux fois en 30 jours.
7. `npx tsc --noEmit` et `npm test` verts sur chaque PR ; aucune modification de schéma de données locale (AsyncStorage) ni distante (Postgres) sauf la table de quota S5 (additive).
8. Rollback documenté et testé pour S1 : flip de variable d'environnement EAS + `eas update --environment production` éteint le paywall sans nouvelle soumission.

## What's Working Well (Do Not Touch)

- Le flux de gating paywall dans [App.tsx:382-388 et 587-594](../../../apps/mobile/App.tsx) : il est correct, on ne fait que l'alimenter en config et en prix.
- `selectPackageForPlan` et son fallback à 3 niveaux ([revenueCatEntitlementProvider.ts:71-81](../../../apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts)) — testé, ne pas réécrire.
- Le modèle de données métrique (`heightCm`, `weightKg`) présent dans 20 fichiers — il reste canonique, S2 n'ajoute qu'une couche d'affichage.
- L'interface `AnalyticsSink` et `assertPrivacySafePayload` ([analyticsClient.ts](../../../apps/mobile/src/analytics/analyticsClient.ts)) — S4 s'y branche sans la modifier.
- Le garde-fou non-food et le routeur de modèles dans `analyze-meal` — S5 ajoute autour, pas dedans.

## Out of Scope (epic)

- Plan hebdomadaire (~3,99 $/sem) — phase 2, après infra A/B.
- Notifications push (`expo-notifications`) — phase 2.
- Synchronisation Apple Health réelle — phase 2.
- Refactor d'App.tsx / OnboardingScreen (god-files) — chantier dédié post-lancement.
- A/B testing de paywall (Superwall/RevenueCat Paywalls) — phase 2 ; PostHog feature flags arrivent gratuitement avec S4 mais leur usage n'est pas spécifié ici.
- Programme de parrainage / tracking d'attribution des share cards.

Note : S7 (data flywheel recettes) est rattaché à cet epic comme enfant de phase 2 — spécifié dès maintenant, exécuté après la soumission. La Definition of Done de l'epic ne l'inclut pas.
