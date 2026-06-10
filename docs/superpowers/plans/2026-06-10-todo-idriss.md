# TODO Idriss — actions manuelles restantes (lancement US)

**État au moment de la rédaction :** les 6 specs (S1-S6) sont **codées, testées (482 tests verts) et poussées** sur `codex/share-cards-native`. Tout ce qui suit est ce que seul toi peux faire. Ordre recommandé = ordre du document. Temps total : ~1 h 30 + temps de build.

## 1. App Store Connect (~15 min restantes)

- [x] **Prix USD** : annuel 49,99 $ ✓, mensuel 9,99 $ ✓ (vérifié via RevenueCat le 2026-06-10).
- [x] **Essai gratuit 7 jours sur l'annuel** : détecté actif (ONE_WEEK) ✓.
- [ ] **🔴 Capture de review sur le produit ANNUEL** (la cause du « Metadata Missing ») : ASC → abonnement annuel → App Review Information → uploader **`docs/appstore/review-screenshot-paywall-1170x2532.png`** (générée par Claude depuis le vrai paywall de l'app, 1170×2532 ≥ minimum Apple 640×920). La même image peut servir au mensuel si ASC la redemande.
- [ ] **🟠 Disponibilité territoriale du MENSUEL** : actuellement US + Canada seulement (l'annuel est partout). Recommandé : étendre le mensuel à tous les territoires (section Availability) — sinon, hors US/CA, `getPricing()` ne trouvera pas le package mensuel et le paywall passera en mode dégradé « Price shown at checkout ».
- [ ] **🟠 Display name localisé du Subscription Group** (cause probable du « Metadata Missing » restant du mensuel) : ASC → groupe d'abonnements → Localization → ajouter le nom anglais (US), p. ex. « MacroLens Pro ».
- [ ] **Compte sandbox** : Users and Access → Sandbox → créer un Sandbox Apple ID (pour la QA achat).
- [ ] Après ces 3 corrections : redemander à l'assistant RevenueCat « re-vérifie » → les 2 produits doivent passer en `ok`.

## 2. RevenueCat (~15 min) — vérifié le 2026-06-10, mis à jour

- [x] Products : `prod03d96b4e28` (mensuel) et `prod0ef75e0b34` (annuel) rattachés à l'entitlement **`MACROLENS Pro`** ✓ (vérifié via l'assistant RevenueCat).
- [x] Offering `default` marqué Current avec `$rc_annual` + `$rc_monthly` ✓.
- [x] ~~Bug entitlement~~ : le code matchait `macrolens_pro` mais l'entitlement réel est `MACROLENS Pro` → **corrigé dans le code** (commit du 2026-06-10) + test de régression qui épingle la chaîne exacte.
- [x] **In-App Purchase Key (StoreKit 2)** : déjà configurée dans RevenueCat ✓ (confirmé le 2026-06-10 — la validation des achats en production fonctionnera).
- [x] **Clé publique vérifiée** : la clé `appl_JMatWPzGViDyFOqfAoliNlaktRO` présente dans l'env EAS production ET `.env.local` est bien la Public API Key de l'app App Store `appfc489ed8b3` (bundle `com.idrisscarta.macrolens`) ✓. L'app `app5027aabb45` est en réalité le **Test Store RevenueCat** (sandbox), pas du legacy — rien à nettoyer.
- [ ] (Recommandé, ~10 min) **App Store Connect API Key** dans RevenueCat (différente de la In-App Purchase Key, déjà en place) : permet à RevenueCat de lire l'état/prix des produits côté store. ASC → Users and Access → Integrations → App Store Connect API → générer, puis uploader dans RevenueCat → Apps → MACROLENS (App Store). Une fois fait, redemander à l'assistant RevenueCat de vérifier prix + intro offer 7 j + territoires — ça valide l'étape 1 d'un coup.

## 3. Comptes observabilité (~20 min)

- [ ] **Sentry** : créer org + projet React Native sur sentry.io (free tier) → récupérer le **DSN** et un **auth token**.
- [ ] **PostHog** : créer un compte sur us.posthog.com → projet « MacroLens » → copier la **Project API Key**.
- [ ] Dashboard PostHog (optionnel, 5 min) : Insight → Funnel : `app_opened → onboarding_started → onboarding_completed → paywall_viewed → paywall_cta_tapped → purchase_completed`.

## 4. Variables d'environnement EAS (~5 min restantes)

État vérifié le 2026-06-10 (eas-cli authentifié sur la machine) :

- [x] **Preview configuré par Claude** : `EXPO_PUBLIC_PAYWALL_ENABLED=true`, `EXPO_PUBLIC_ENTITLEMENT_MODE=store`, `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` ✓ — le build preview est prêt pour la QA sandbox dès que tu le lances.
- [x] Production : `EXPO_PUBLIC_ENTITLEMENT_MODE=store` déjà en place ✓ (+ clé RevenueCat, Supabase, `SENTRY_ALLOW_FAILURE=true`).

Reste à ajouter (quand les comptes seront créés, étape 3) :

| Variable | Environnement | Valeur |
|---|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | preview + production | (DSN Sentry) |
| `SENTRY_AUTH_TOKEN` | preview + production (secret) | (token Sentry, sourcemaps) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | preview + production | (slug org / projet) |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | preview + production | (clé PostHog) |
| `EXPO_PUBLIC_PAYWALL_ENABLED` | **production, APRÈS la QA sandbox (étape 7)** | `true` |

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
