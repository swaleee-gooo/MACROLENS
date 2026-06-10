# Prompt Codex — opérations de lancement MacroLens (builds, Supabase, EAS)

Copier-coller tel quel dans Codex. Rédigé le 2026-06-10.

---

Tu opères sur le repo MacroLens (app Expo React Native iOS, monorepo : `apps/mobile` + `supabase/`). Branche de travail : `codex/share-cards-native` (NE PAS changer de branche, NE PAS rebaser).

## CONTEXTE — à lire avant d'agir

- Tout le code est TERMINÉ et testé : 509 tests vitest verts, `npx tsc --noEmit` propre (vérifie-le toi-même d'abord, c'est ta baseline). Ton rôle est UNIQUEMENT opérationnel : configuration Supabase, builds EAS, vérifications. **Tu ne modifies AUCUN fichier de code applicatif.** Si un build échoue, tu diagnostiques et tu rapportes — tu ne « corriges » pas le code sans explication détaillée du problème.
- Les 5 Edge Functions Supabase sont DÉJÀ déployées (ne pas redéployer sauf indication). Le projet Supabase est `wyrfncoiubvdnrvdpads` (lié au repo via `supabase link`).
- Les CLI `eas-cli` et `supabase` sont déjà authentifiés sur cette machine.
- Interdictions absolues : ne jamais toucher à la chaîne d'entitlement `'MACROLENS Pro'` dans le code ; ne jamais mettre `EXPO_PUBLIC_PAYWALL_ENABLED=true` dans l'environnement EAS **production** (seulement preview) — l'activation prod se fait après la QA humaine ; ne pas committer de secrets.

## TÂCHE 1 — Migration Postgres `scan_usage` (bloquée côté CLI, passe par l'API)

`supabase db push` est cassé par un décalage d'historique de migrations (les migrations distantes ont d'autres versions que les fichiers locaux) — NE PAS tenter de « réparer » l'historique. À la place :

1. Lis `supabase/migrations/20260610090000_create_scan_usage.sql`.
2. Applique ce SQL sur la base de production par l'un de ces moyens (dans l'ordre de préférence) :
   a. Management API : `POST https://api.supabase.com/v1/projects/wyrfncoiubvdnrvdpads/database/query` avec `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` et body `{"query": "<contenu du fichier>"}`. Le token : `supabase` CLI est connecté, ou demande-le à Idriss (compte → Access Tokens).
   b. À défaut : affiche le SQL et demande à Idriss de le coller dans le SQL editor du dashboard.
3. Vérifie : `POST .../database/query` avec `select count(*) from public.scan_usage;` doit retourner 0 (pas une erreur « relation does not exist »).
4. Effet attendu : les quotas de scan (20/h par user) s'activent automatiquement — les fonctions déployées appellent déjà la RPC `increment_scan_usage` en fail-open.

## TÂCHE 2 — Configuration Auth Supabase (Management API ou dashboard)

Via `PATCH https://api.supabase.com/v1/projects/wyrfncoiubvdnrvdpads/config/auth` (même token) — ou guide Idriss dans le dashboard si pas de token :

1. **Désactiver l'email de confirmation** : `{"mailer_autoconfirm": true}` (équivalent dashboard : Authentication → Sign In / Providers → Email → décocher « Confirm email »).
2. **Apple** : `{"external_apple_enabled": true, "external_apple_client_id": "<bundle IDs séparés par des virgules>"}`. Les bundle IDs exacts sont dans `apps/mobile/app.config.js` (lis-le : il y a un bundle de prod `com.idrisscarta.macrolens` + des variantes dev/preview — mets les trois). Pas de secret nécessaire (flux natif id_token).
3. **Redirect URL** : ajouter `macrolens://auth-callback` à la liste autorisée : `{"uri_allow_list": "macrolens://auth-callback"}` (préserve les valeurs existantes s'il y en a — lis la config actuelle avec un GET avant de PATCHer).
4. **Google** : nécessite d'abord une étape MANUELLE d'Idriss (aucune API ne crée des clients OAuth Google) : Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → type **Web application** → Authorized redirect URI : `https://wyrfncoiubvdnrvdpads.supabase.co/auth/v1/callback`. Quand il te donne le Client ID + Secret : `{"external_google_enabled": true, "external_google_client_id": "...", "external_google_secret": "..."}`.
5. Vérifie avec un GET sur `/config/auth` que les 4 réglages sont bien posés et rapporte-les.

## TÂCHE 3 — Builds EAS iOS

Contexte env : l'environnement EAS **preview** est déjà entièrement configuré (paywall ON, entitlement store, clé RevenueCat). **production** a tout SAUF `EXPO_PUBLIC_PAYWALL_ENABLED` (volontaire). Les nouveaux modules natifs (expo-apple-authentication, expo-web-browser, expo-crypto, @sentry/react-native, posthog-react-native, expo-store-review) imposent de VRAIS builds — l'OTA ne suffit pas.

```powershell
cd apps/mobile
npx eas-cli build --platform ios --profile development   # build dev client
npx eas-cli build --platform ios --profile preview        # build QA sandbox
```

- Lance les deux, suis les logs. Le plugin Sentry est conditionné aux env `SENTRY_ORG`/`SENTRY_PROJECT` (absentes → il ne se charge pas, c'est normal et voulu, observabilité reportée).
- Si un build échoue sur un module natif : rapporte le log d'erreur complet, ne patch rien sans accord.
- Quand le build preview est prêt, donne le lien d'installation à Idriss pour la QA sandbox.

## TÂCHE 4 — Après la QA sandbox humaine (NE PAS faire avant le feu vert explicite d'Idriss)

1. `npx eas-cli env:create production --name EXPO_PUBLIC_PAYWALL_ENABLED --value true --visibility plaintext --scope project`
2. `npm run eas:build:ios:testflight` (build production avec auto-submit vers App Store Connect).
3. Rappelle à Idriss le drill de rollback : repasser la variable à `false` + `npm run eas:update:production` éteint le paywall par OTA sans nouvelle soumission.

## RAPPORT ATTENDU

À la fin (ou en cas de blocage) : tableau tâche par tâche avec statut, sorties des commandes de vérification, et la liste exacte de ce qui attend une action humaine (Google OAuth client, QA sandbox).
