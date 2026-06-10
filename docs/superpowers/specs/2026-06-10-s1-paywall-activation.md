# S1 — Activation paywall + prix localisés RevenueCat + trial réel

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Critique · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

Le paywall est entièrement codé (écran, achat, restore, gating) mais désactivé en production : revenu actuel 0 €. Les prix sont des chaînes codées en dur en EUR, illégales de fait pour un lancement US (l'utilisateur doit voir le prix App Store de SA région), et le badge « 7 days free » est affiché sans qu'aucune offre d'essai ne soit vérifiée côté store — exactement le motif (3.1.2c) qui a fait retirer Cal AI de l'App Store en avril 2026.

## Current State (vérifié le 2026-06-10)

- [env.ts:26](../../../apps/mobile/src/config/env.ts) : `paywallEnabled = input.EXPO_PUBLIC_PAYWALL_ENABLED === 'true'` — défaut `false`.
- [App.tsx:342](../../../apps/mobile/App.tsx) : `entitlementMode: appEnv.paywallEnabled ? appEnv.entitlementMode : 'local_dev'` — **paywall off force le provider local_dev**. L'activation prod exige donc DEUX variables : `EXPO_PUBLIC_PAYWALL_ENABLED=true` ET `EXPO_PUBLIC_ENTITLEMENT_MODE=store`.
- [App.tsx:382-388](../../../apps/mobile/App.tsx) (boot) et [587-594](../../../apps/mobile/App.tsx) (post-onboarding) : gating correct, events `paywall_viewed` déjà trackés.
- [PaywallScreen.tsx:35-36](../../../apps/mobile/src/screens/PaywallScreen.tsx) : `price="EUR 49.99 / year"`, `detail="EUR 4.17 / month. Best value."`, `badge="7 days free"` — tout statique.
- [revenueCatEntitlementProvider.ts](../../../apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts) : expose `getEntitlement/purchase/restore` mais **aucune méthode de lecture des offerings/prix**.
- [eas.json](../../../apps/mobile/eas.json) : aucun bloc `env` — les variables viennent des environnements EAS (`--environment production` déjà utilisé par les scripts npm).
- Produits : `prod03d96b4e28` (mensuel), `prod0ef75e0b34` (annuel), entitlement `MACROLENS Pro` (lookup_key exact, sensible à la casse et à l'espace — corrigé le 2026-06-10, le code disait `macrolens_pro`).

## Proposed Change

### Partie A — Configuration ASC / RevenueCat (exécutée par Idriss, checklist exacte)

1. **App Store Connect → Abonnements** : vérifier que les deux abonnements existent dans un même groupe, statut « Prêt à soumettre » minimum, **prix USD défini** (proposé : 49,99 $/an et 9,99 $/mois — Apple localise les autres devises automatiquement).
2. **Offre d'essai** : sur l'abonnement ANNUEL, créer une *Introductory Offer* type « Free trial », durée 7 jours, toutes les régions. NE PAS en créer sur le mensuel (le badge ne s'affichera que sur l'annuel, conforme au code).
3. **RevenueCat → Products** : vérifier que les deux produits sont importés et rattachés à l'entitlement `MACROLENS Pro` (fait, vérifié le 2026-06-10).
4. **RevenueCat → Offerings** : un offering `default` (current) avec deux packages : `$rc_annual` → produit annuel, `$rc_monthly` → produit mensuel.
5. **Compte sandbox** : créer un Sandbox Apple ID dans ASC → Users and Access → Sandbox, pour la QA de la partie B.

### Partie B — Code : prix localisés et trial dynamique

1. **Étendre `EntitlementProvider`** ([entitlementTypes.ts](../../../apps/mobile/src/entitlements/entitlementTypes.ts)) avec :

```typescript
export type PlanPricing = {
  plan: PurchasePlan;
  priceString: string;            // "$49.99" — localisé par le store
  perMonthPriceString: string | null; // calculé pour l'annuel, null sinon
  hasFreeTrial: boolean;          // introPrice présent ET price === 0
  trialLabel: string | null;      // "7 days free" dérivé de introPrice.periodNumberOfUnits
};

export type EntitlementProvider = {
  // ... méthodes existantes inchangées ...
  getPricing(): Promise<PlanPricing[]>; // NOUVELLE
};
```

2. **Implémentation RevenueCat** : `getPricing()` lit `getOfferings().current.availablePackages`, réutilise `selectPackageForPlan` (ne pas dupliquer la logique), extrait `product.priceString`, `product.introPrice`. `perMonthPriceString` calculé depuis `product.price / 12` formaté avec `product.currencyCode` via `Intl.NumberFormat`.
3. **Implémentation local_dev** : retourne un pricing mock (`$49.99` / `$9.99`, trial true sur annuel) — comportement dev inchangé visuellement.
4. **PaywallScreen** : reçoit `pricing: PlanPricing[] | null` en prop. Affichage :
   - `pricing` chargé → prix localisés ; le **prix réellement facturé** (`$49.99 / year`) reste l'élément typographique dominant (conformité 3.1.2c), l'équivalent mensuel en `detail` secondaire.
   - Badge trial et CTA : `hasFreeTrial === true` → badge `trialLabel` + CTA « Start free trial » ; sinon **pas de badge** et CTA « Subscribe ». Plus aucune promesse de trial codée en dur.
   - `pricing === null` (offerings indisponibles : offline, store down) → cartes avec prix masqués (« Price shown at checkout »), CTA actif, bandeau discret « Prices are loading… » + retry. Le CTA appelle `purchase(plan)` comme aujourd'hui : si les offerings sont toujours indisponibles, `selectPackageForPlan` échoue et l'erreur `revenuecat_package_missing_<plan>` est déjà mappée par `purchaseFailureAlert` (App.tsx:614) — aucun nouveau chemin d'erreur à créer.
   - Règles `trialLabel` : dérivé de `introPrice` UNIQUEMENT si `introPrice.price === 0` (vrai essai gratuit) ; libellé `"{periodNumberOfUnits} {periodUnit} free"` générique (« 7 days free », « 1 week free » — pas de valeur codée en dur, fonctionne si l'offre ASC change de durée). `introPrice` payant (pay-up-front/pay-as-you-go) → `hasFreeTrial = false`, pas de badge.
5. **App.tsx** : charge `getPricing()` quand l'écran paywall est monté (pas au boot — ne pas ralentir le démarrage), passe la prop. Échec silencieux → `pricing = null` + event `paywall_pricing_failed` (nouvel event analytics).
6. **Légal** : la mention statique « Free trial if available… » ([PaywallScreen.tsx:47](../../../apps/mobile/src/screens/PaywallScreen.tsx)) devient conditionnelle au `hasFreeTrial`, et on ajoute les liens Terms/Privacy déjà présents dans LegalSupportScreen (exigence Apple sur l'écran d'achat).

### Partie C — Activation production

1. EAS environment `production` (dashboard ou `eas env:create`) : `EXPO_PUBLIC_PAYWALL_ENABLED=true`, `EXPO_PUBLIC_ENTITLEMENT_MODE=store`. **Ne pas toucher** aux environnements `development`/`preview` (paywall reste off en dev — non-régression).
2. Build preview avec les deux flags pour la QA sandbox AVANT le build production.

## Acceptance Criteria

1. Build preview flags ON, compte sandbox : onboarding → paywall affiche `$49.99 / year` et `$9.99 / month` (USD, venant du store, pas du code).
2. Badge « 7 days free » visible sur l'annuel UNIQUEMENT si l'introductory offer existe dans ASC ; supprimer l'offre côté ASC fait disparaître le badge sans changement de code.
3. Achat sandbox annuel → feuille Apple montre « 7 days free puis 49,99 $US/an » → `purchase_completed` tracké → écran PremiumUnlocked.
4. « Restore purchases » sur un compte sandbox abonné → premium restauré sans achat.
5. Mode avion sur l'écran paywall → cartes en mode dégradé « Price shown at checkout », pas de crash, retry fonctionne.
6. Build local SANS les flags (`npm run web`, tests) : comportement strictement identique à aujourd'hui — paywall off, provider local_dev, zéro changement visuel.
7. `npx tsc --noEmit` + `npm test` verts ; nouveaux tests unitaires de `getPricing` (mapping introPrice → trialLabel, fallback null) passants.
8. Aucun prix ni devise codé en dur ne subsiste dans `src/` (vérif : `grep -r "EUR\|49.99\|9.99" apps/mobile/src` ne matche que les mocks local_dev et les tests).

## Testing Plan

| Couche | Quoi | Compte |
|---|---|---|
| Unit | `getPricing` : mapping offerings→PlanPricing, introPrice absent/présent, offering null | +5 |
| Unit | PaywallScreen : rendu avec pricing / sans pricing / sans trial (snapshot logique, pas visuel) | +3 |
| Manuel sandbox | Achat annuel, achat mensuel, restore, annulation de la feuille Apple, mode avion | checklist |

## Rollback Plan

Flip `EXPO_PUBLIC_PAYWALL_ENABLED=false` dans l'environnement EAS production + `npm run eas:update:production` → le paywall disparaît par OTA sans nouvelle soumission Apple (le gating App.tsx:382 redevient inactif). Les abonnés existants gardent leur entitlement (géré par RevenueCat, indépendant du flag).

## Effort Estimate

Partie A (Idriss, manuel) ~1 h · Partie B ~3 h (types 30 min, provider 45 min, PaywallScreen 1 h, App.tsx + tests 45 min) · Partie C + QA sandbox ~1 h.

## Files Reference

| Fichier | Changement |
|---|---|
| `apps/mobile/src/entitlements/entitlementTypes.ts` | + `PlanPricing`, + `getPricing` à l'interface |
| `apps/mobile/src/entitlements/revenueCatEntitlementProvider.ts` | + implémentation `getPricing` |
| `apps/mobile/src/entitlements/entitlementProviderFactory.ts` | + `getPricing` mock pour local_dev |
| `apps/mobile/src/screens/PaywallScreen.tsx:35-36,47,59` | prix dynamiques, badge/CTA conditionnels, fallback |
| `apps/mobile/src/components/PaywallPlanCard.tsx` | prop badge optionnelle, état prix masqué |
| `apps/mobile/App.tsx` | chargement pricing à l'affichage paywall |
| `apps/mobile/src/analytics/analyticsEvents.ts` | + `paywall_pricing_failed` |
| EAS env `production` | + 2 variables (hors repo) |

## Out of Scope

- Plan hebdomadaire (phase 2). — Refonte visuelle du paywall (preuve sociale, comparatif) : phase 2. — A/B testing. — Parité Sign in with Apple (chantier auth séparé si OAuth Google est activé).
