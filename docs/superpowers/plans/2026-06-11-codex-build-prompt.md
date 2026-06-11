# Prompt Codex — builds iOS avec toutes les modifications (2026-06-11)

Copier-coller tel quel dans Codex.

---

Tu opères sur le repo MacroLens, branche `codex/share-cards-native`. Mission : produire les builds iOS EAS contenant tout le travail récent, en débloquant les credentials qui ont fait échouer ta tentative précédente.

## ÉTAPE 0 — Synchronisation (obligatoire)

```powershell
git checkout codex/share-cards-native
git pull
```

Le HEAD attendu est `80fab08` ou plus récent. Vérifie ta baseline avant tout :

```powershell
cd apps/mobile
npx tsc --noEmit          # doit sortir 0
npm test                  # doit afficher 509+ tests verts
```

Si la baseline n'est pas verte, STOP et rapporte — ne corrige rien.

## CONTEXTE — ce que contiennent ces builds

Nouveaux modules NATIFS depuis le dernier build (c'est pour ça qu'un build est indispensable, l'OTA ne suffit pas) : `@sentry/react-native`, `posthog-react-native`, `expo-store-review`, `expo-apple-authentication`, `expo-web-browser`, `expo-crypto`, plus les polices expo-font. Côté config externe, TOUT est prêt : Supabase (providers Apple+Google activés, confirmation email désactivée, quotas actifs), RevenueCat (produits READY_TO_SUBMIT), environnement EAS preview (paywall ON, entitlement store, clé RevenueCat).

Notes attendues pendant le build — NE PAS « corriger » :
- Le plugin Sentry ne se charge pas (variables `SENTRY_ORG`/`SENTRY_PROJECT` absentes) : **voulu**, observabilité reportée.
- Sans `EXPO_PUBLIC_SENTRY_DSN`/`EXPO_PUBLIC_POSTHOG_API_KEY`, ces SDK sont inertes par design.

## ÉTAPE 1 — Vérifier l'environnement preview (lecture seule)

```powershell
npx eas-cli env:list preview
```

Attendu : `EXPO_PUBLIC_PAYWALL_ENABLED=true`, `EXPO_PUBLIC_ENTITLEMENT_MODE=store`, `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_…`. Si absent, STOP et rapporte.

## ÉTAPE 2 — Build PREVIEW (prioritaire : c'est lui qui débloque la QA sandbox)

Ton échec précédent : provisioning profiles manquants pour `com.idrisscarta.macrolens.preview` (et `.dev` + share extension). Leur génération demande une session INTERACTIVE avec le compte Apple d'Idriss — lance la commande SANS `--non-interactive` et fais répondre Idriss aux invites (il est présent) :

```powershell
npx eas-cli build --platform ios --profile preview
```

Invites attendues : connexion Apple Developer (compte idriss.carta@gmail.com, 2FA possible) → « Generate a new Apple Provisioning Profile? » → **Yes**, la question revient pour CHAQUE target (app + share extension) → Yes à chaque fois. EAS mémorise tout : les builds suivants seront non-interactifs.

- Si le build échoue APRÈS la phase credentials (en compilation) : récupère le log complet (`npx eas-cli build:view <id>` ou le lien expo.dev), rapporte l'erreur exacte. Tu peux diagnostiquer, mais AUCUN patch de code sans explication détaillée et accord.
- Quand le build réussit : donne à Idriss le lien d'installation (page expo.dev du build, QR code).

## ÉTAPE 3 — Build DEVELOPMENT (ensuite, même procédure)

```powershell
npx eas-cli build --platform ios --profile development
```

Mêmes invites pour le bundle `.dev` + sa share extension.

## ÉTAPE 4 — Remettre la checklist QA à Idriss et T'ARRÊTER

La QA sandbox est humaine. Transmets-lui cette checklist (build preview sur device) :

1. Onboarding complet : 12 étapes, saisie en lbs/ft-in, plan personnalisé affiché.
2. Paywall : timeline 7 jours, prix en **$ venant du store** (pas de « EUR », pas de prix codé en dur), « Other options » montre le mensuel à $9.99.
3. Achat sandbox annuel (Sandbox Apple ID) : la feuille Apple affiche « 7 days free puis $49.99 » → écran « Welcome to Pro » (c'est LE test du fix d'entitlement `MACROLENS Pro`).
4. Après Pro : écran de création de compte → « Continue with Apple » fonctionne (feuille native) ; « Continue with Google » ouvre le navigateur et revient connecté ; « Skip for now » va à l'accueil.
5. Inscription email : AUCUN email de confirmation reçu, session immédiate.
6. Restore purchases OK. Mode avion sur le paywall → « Price shown at checkout », pas de crash.
7. Scan d'un vrai repas → résultat → save → au 3e repas sauvé, le popup de notation iOS apparaît.
8. 21 scans dans l'heure → message « hourly scan limit » propre (teste si le temps le permet).

## INTERDITS

- `EXPO_PUBLIC_PAYWALL_ENABLED` en **production** : NON — seulement après le feu vert QA explicite d'Idriss (c'est la tâche suivante, pas la tienne aujourd'hui).
- Aucune modification de code applicatif, aucun commit sur la branche sans accord.
- Ne pas toucher aux environnements EAS development/production.

## RAPPORT ATTENDU

Statut par étape, IDs/links des builds, sortie des invites credentials, et ce qui attend Idriss.
