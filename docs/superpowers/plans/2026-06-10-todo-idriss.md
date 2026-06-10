# TODO Idriss — actions manuelles restantes (lancement US)

**État au moment de la rédaction :** les 6 specs (S1-S6) sont **codées, testées (482 tests verts) et poussées** sur `codex/share-cards-native`. Tout ce qui suit est ce que seul toi peux faire. Ordre recommandé = ordre du document. Temps total : ~1 h 30 + temps de build.

## 1. App Store Connect (~30 min)

- [ ] **Prix USD** : Mon apps → MacroLens → Abonnements → vérifier le groupe d'abonnements ; fixer le prix de l'annuel à **49,99 $US/an** et du mensuel à **9,99 $US/mois** (Apple localise les autres devises).
- [ ] **Essai gratuit** : sur l'abonnement **ANNUEL uniquement** → Offres promotionnelles/d'introduction → créer une *Introductory Offer* type **Free trial, 7 jours**, toutes les régions. NE PAS en mettre sur le mensuel. (Le badge du paywall est dynamique : il n'apparaît que si cette offre existe réellement.)
- [ ] **Compte sandbox** : Users and Access → Sandbox → créer un Sandbox Apple ID (pour la QA achat).

## 2. RevenueCat (~15 min) — vérifié le 2026-06-10, mis à jour

- [x] Products : `prod03d96b4e28` (mensuel) et `prod0ef75e0b34` (annuel) rattachés à l'entitlement **`MACROLENS Pro`** ✓ (vérifié via l'assistant RevenueCat).
- [x] Offering `default` marqué Current avec `$rc_annual` + `$rc_monthly` ✓.
- [x] ~~Bug entitlement~~ : le code matchait `macrolens_pro` mais l'entitlement réel est `MACROLENS Pro` → **corrigé dans le code** (commit du 2026-06-10) + test de régression qui épingle la chaîne exacte.
- [ ] **Credentials App Store Connect dans RevenueCat** : Apps → ton app iOS → uploader la **In-App Purchase Key** (clé API ASC, .p8) — sans elle, RevenueCat ne peut pas valider les achats StoreKit 2 en production ni vérifier que les produits sont live. (~10 min : ASC → Users and Access → Integrations → In-App Purchase → générer la clé, puis l'uploader dans RevenueCat.)
- [ ] **Vérifier la clé publique** : le projet RevenueCat contient 2 apps (`appfc489ed8b3` avec les bons produits + une app legacy `app5027aabb45` avec des produits `monthly`/`yearly`). Confirme que la clé `appl_…` configurée dans EAS/`.env.local` est bien la **Public API Key de `appfc489ed8b3`** — sinon l'app interrogera la mauvaise config.
- [ ] (Optionnel) Nettoyer l'app legacy `app5027aabb45` et ses produits pour éviter toute confusion future.

## 3. Comptes observabilité (~20 min)

- [ ] **Sentry** : créer org + projet React Native sur sentry.io (free tier) → récupérer le **DSN** et un **auth token**.
- [ ] **PostHog** : créer un compte sur us.posthog.com → projet « MacroLens » → copier la **Project API Key**.
- [ ] Dashboard PostHog (optionnel, 5 min) : Insight → Funnel : `app_opened → onboarding_started → onboarding_completed → paywall_viewed → paywall_cta_tapped → purchase_completed`.

## 4. Variables d'environnement EAS (~10 min)

Sur expo.dev → projet macrolens → Environment variables (ou `eas env:create`) :

| Variable | Environnement | Valeur |
|---|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | preview + production | (DSN Sentry) |
| `SENTRY_AUTH_TOKEN` | preview + production (secret) | (token Sentry, pour les sourcemaps) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | preview + production | (slug org / projet) |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | preview + production | (clé PostHog) |
| `EXPO_PUBLIC_PAYWALL_ENABLED` | **preview d'abord** | `true` |
| `EXPO_PUBLIC_ENTITLEMENT_MODE` | **preview d'abord** | `store` |

⚠️ Ne mets les deux variables paywall en **production** qu'APRÈS la QA sandbox (étape 7). Ne touche pas à `development`.

## 5. Déploiement backend (~10 min) — code prêt, je n'ai pas déployé en ton absence

```powershell
supabase db push                 # applique la migration scan_usage
supabase functions deploy analyze-meal extract-recipe scan-nutrition-label lookup-packaged-food delete-account
```

Vérif rapide après déploiement : un scan depuis l'app fonctionne toujours (le rate limiting est fail-open : même si la table manquait, rien ne casse).

## 6. Builds (~10 min de commandes + attente EAS)

```powershell
cd apps/mobile
npm run eas:build:ios:dev        # build dev avec les 3 nouveaux modules natifs (Sentry, PostHog, StoreReview)
npx eas-cli build --platform ios --profile preview   # build preview pour la QA sandbox
```

## 7. QA sandbox sur device (build preview, ~20 min)

- [ ] Onboarding complet **en lbs/ft-in** → le plan personnalisé s'affiche.
- [ ] Paywall : prix en **$ venant du store** (pas « EUR »), badge « 7 days free » sur l'annuel.
- [ ] Achat annuel avec le compte sandbox → la feuille Apple affiche « 7 days free puis $49.99/yr » → écran Premium unlocked.
- [ ] « Restore purchases » fonctionne.
- [ ] Mode avion sur le paywall → « Price shown at checkout », pas de crash, Retry OK.
- [ ] 3 repas sauvegardés → popup de notation natif apparaît (en build dev ; TestFlight le supprime silencieusement, c'est normal).
- [ ] Crash test Sentry : provoquer une erreur (ou via le dev unlock) → l'event apparaît sur sentry.io en < 2 min.
- [ ] PostHog Live Events : les events du parcours apparaissent.
- [ ] **Drill de rollback** (5 min, chronomètre-le) : passe `EXPO_PUBLIC_PAYWALL_ENABLED=false` en preview → `npm run eas:update:preview` → le paywall disparaît. Remets `true` ensuite. C'est ton bouton d'urgence post-lancement.

## 8. Production

- [ ] Variables paywall en environnement production (étape 4) → `npm run eas:build:ios:testflight` (auto-submit configuré).
- [ ] Re-parcours TestFlight rapide, puis soumission App Store.
- [ ] Première semaine : Sentry (crashs) + PostHog (funnel) chaque jour.

## Notes

- Aucun de ces réglages n'est dans le code : sans les variables, l'app se comporte exactement comme avant (paywall off, Sentry/PostHog inertes) — c'était le contrat « ne rien casser ».
- S7 (flywheel recettes) est spécifié mais pas implémenté — chantier post-lancement, demande-moi quand tu veux.
- Le secret `USDA_FDC_API_KEY` (S7) n'est nécessaire que pour S7, pas pour le lancement.
