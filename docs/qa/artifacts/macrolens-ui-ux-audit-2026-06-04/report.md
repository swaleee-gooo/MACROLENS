# Audit UI/UX MacroLens - 2026-06-04

## Résumé exécutif

MacroLens a une base UI solide : identité claire, navigation mobile compréhensible, parcours d'ajout manuel fonctionnel, écrans Data/Legal rassurants, et un bon principe produit autour des estimations en plages plutôt qu'une fausse précision.

Les risques principaux sont moins visuels que structurels :

- L'onboarding demande beaucoup de données puis bloque sur création de compte, sans option claire "continuer plus tard".
- Le rendu web/tablette s'étire fortement en largeur alors que l'app déclare le support tablette.
- Plusieurs placeholders ressemblent à des valeurs déjà saisies alors que les CTA restent désactivés.
- Le langage de confiance est incohérent selon les écrans : "Review needed", "LOW", "High-confidence plan".
- Les semantics web/accessibilité sont faibles : beaucoup de noeuds `generic`, boutons icon-only sans nom visible dans les snapshots, et avertissement navigateur sur le champ password hors formulaire.

Santé globale observée : bonne direction produit, UI cohérente, mais plusieurs frictions P1 avant une expérience prête à être jugée premium.

## Périmètre et méthode

Produit audité : MacroLens Mobile, app Expo React Native dans `apps/mobile`.

Commande utilisée :

```powershell
npm run web -- --port 8082 --clear
```

Environnement observé :

- Expo web local sur `http://localhost:8082`.
- Viewport mobile principal : `393 x 852`.
- Viewport desktop de contrôle : `1040 x 708`.
- `localhost` contenait un état app déjà onboardé.
- `127.0.0.1` a été utilisé comme origine fraîche pour auditer l'onboarding sans effacer l'état `localhost`.
- Paywall non capturé en runtime : `EXPO_PUBLIC_PAYWALL_ENABLED` n'était pas actif dans l'exécution observée. Le paywall a donc été évalué par inspection du code seulement.

Outils :

- Product Design audit workflow.
- Codex in-app Browser pour DOM initial. Limite : `Page.captureScreenshot` expirait malgré un DOM rendu.
- Fallback Playwright MCP pour les captures et snapshots.
- Inspection code des écrans React Native.

Limites :

- Audit visuel web, pas audit natif iOS/Android.
- Pas de test VoiceOver/TalkBack.
- Pas de création de compte réel, pas d'achat, pas de suppression/export déclenchés.
- Pas de validation WCAG complète.

## Artefacts capturés

23 captures PNG et leurs snapshots sont sauvegardés dans ce dossier.

Captures clés :

- `01-initial-mobile.png` - Home état existant.
- `02-scan-hub-mobile.png` - Scan hub.
- `03-manual-empty-mobile.png` - Ajout manuel vide.
- `05-result-manual-mobile.png` - Résultat manuel.
- `06-save-confirmation-mobile.png` - Confirmation sauvegarde.
- `08-progress-mobile.png` - Progress.
- `09-history-mobile.png` - History.
- `10-profile-mobile.png` - Profile.
- `11-settings-mobile.png` et `11-settings-mobile-full.png` - Settings.
- `12-auth-mobile.png` - Auth depuis Settings.
- `13-data-privacy-mobile.png` - Data.
- `14-legal-support-mobile.png` - Legal.
- `15-onboarding-welcome-mobile.png` - Onboarding welcome.
- `16-onboarding-goal-mobile.png` - Onboarding goal.
- `17-onboarding-body-mobile.png` - Onboarding body.
- `18-onboarding-target-pace-mobile.png` - Target pace.
- `19-onboarding-plan-mobile.png` - Personalized plan.
- `20-onboarding-auth-mobile.png` - Onboarding account gate.
- `22-scanner-meal-mobile.png` - Camera permission scanner.
- `23-home-desktop.png` - Desktop responsive check.

## Parcours audité, étape par étape

1. Home initial - Santé : bonne.
   L'objectif du jour, le ring calories, les macros et le CTA scan sont visibles. La navigation basse est claire. Risques : scrollbar web visible, contenu sous le pli masqué par tabs, carrousel calendrier avec contenu hors viewport.

2. Scan hub - Santé : bonne.
   Les 4 modes principaux sont faciles à comprendre. Le choix par défaut "Meal Photo" est clair. Risques : "Gallery" peut déclencher une dépendance OS/web; pas de microcopy sur quand choisir barcode vs nutrition label.

3. Ajout manuel vide - Santé : moyen.
   Les champs sont simples, mais les placeholders numériques `927`, `38.6`, `90`, `35`, `8` ressemblent à des valeurs présentes alors que le bouton "Save meal" est désactivé.

4. Ajout manuel rempli - Santé : bonne.
   Le bouton devient actif, l'écran reste lisible. Risques : pas d'indication "calories + nom obligatoires", pas d'aide sur unités ou incohérences macro/calorie.

5. Résultat manuel - Santé : moyen.
   L'estimation en plage et les corrections sont alignées avec le principe produit. Risques : un repas saisi manuellement est marqué "Review needed", ce qui peut sonner comme une erreur utilisateur; les corrections globales sous le pli ne sont pas très découvrables.

6. Confirmation sauvegarde - Santé : bonne.
   Retour clair, calories et protéines résumées. Risques : grand espace vide entre contenu et actions; `+1 streak day` est motivant mais peut paraître gamifié tôt.

7. Home après sauvegarde - Santé : bonne.
   Mise à jour immédiate des calories, macros, streak et repas. Risques : "Quick access" et "Quick meals" sont sous le pli; "Long press for details" ne marche pas comme instruction universelle web/accessibilité.

8. Progress - Santé : moyen.
   Les métriques clés sont utiles. Risques : le graphe avec peu de données semble abrupt, les tabs de période sont petits, et le tooltip noir monopolise le bas de la carte.

9. History - Santé : bonne.
   Timeline simple, segment Timeline/Calendar clair. Risque : badge `LOW` est ambigu et peut être lu comme qualité faible du repas plutôt que faible confiance.

10. Profile - Santé : moyen.
    Bonne synthèse de profil. Risques : action Settings en icône seule, pluralisation `1 days`, beaucoup de cartes avant les actions secondaires.

11. Settings - Santé : bonne.
    Le mode d'analyse et l'avertissement données photo sont bien exposés. Risques : `1 syncable meals`, texte de Data promet "delete your account" même quand l'écran réel n'affiche que clear local data.

12. Auth depuis Settings - Santé : moyen.
    Hiérarchie claire, options Apple/Google/Email. Risques : cliquer "Sign in" ouvre "Create your account"; le bouton désactivé n'explique pas les critères; password hors formulaire côté web.

13. Data - Santé : bonne.
    Bonne prudence : export explicite, clear local data quand non connecté. Risque : mismatch avec la ligne Settings.

14. Legal/Support - Santé : bonne.
    Liens et avertissement nutrition sont visibles. Risque : liens externes non testés.

15. Onboarding welcome - Santé : bonne visuellement.
    Positionnement clair. Risques : flèche retour visible sur premier écran alors qu'elle ne sert pas; scrollbar web très visible.

16. Onboarding goal - Santé : bonne.
    Choix scannables, sélection visible. Risque : progression "Step 1 of 13" après deux écrans déjà vus peut donner une impression d'entonnoir long.

17. Onboarding body - Santé : moyen.
    Clair et compact. Risques : données sensibles demandées vite; placeholder `28` ressemble à une valeur; pas de détails sur pourquoi le sexe biologique est requis ni sur alternatives.

18. Target pace - Santé : moyen.
    Préremplissage utile. Risque : poids cible calculé automatiquement sans explication de provenance.

19. Personalized plan - Santé : bonne.
    Valeur forte, cible calories/macros mémorisable. Risque : "High-confidence plan" est affirmé sans détail sur limites, hypothèses, ou marge d'erreur.

20. Onboarding account gate - Santé : faible à moyen.
    Écran propre, mais il arrive après beaucoup de données. Pas d'option visible "Skip", "Continue locally", ou "Save later". Cela bloque les étapes notifications/health/camera et l'accès produit sans compte.

21. Scanner permission - Santé : moyen.
    Demande permission claire. Risque : pas d'alternative immédiate "Gallery", "Manual add", ou "Search" sur cet écran; l'utilisateur doit revenir.

22. Desktop/tablet web - Santé : faible.
    La UI s'étire sur toute la largeur, les cartes deviennent trop larges, le bottom nav occupe des colonnes énormes. Cela contredit le support tablette annoncé.

## Points forts

- Identité visuelle cohérente : noir, vert, typographie lourde, cartes simples.
- Navigation principale claire : Home, Progress, Scan, History, Profile.
- Le scan hub pose bien les quatre modes de saisie.
- Le parcours manuel fonctionne bout en bout et donne un résultat exploitable.
- Le produit assume l'incertitude nutritionnelle avec des plages kcal/macros.
- Data et Legal exposent des messages de confidentialité et de non-dispositif médical.
- Les cibles sont mises à jour immédiatement après sauvegarde, ce qui ferme bien la boucle utilisateur.

## Findings priorisés

### P1 - Onboarding bloque sur création de compte après collecte de données

Preuves :

- `20-onboarding-auth-mobile.png`.
- `OnboardingScreen.tsx` exige `authEmail` ou email + password pour continuer l'étape auth.
- `App.tsx` passe toujours `onEmailSignUp` à l'onboarding.

Impact :

- L'utilisateur donne objectif, friction, âge, sexe, taille, poids, cible, activité, régime, puis découvre qu'il doit créer un compte.
- Perte de confiance possible : la demande de compte arrive après valeur générée, mais avant essai produit.
- En mode remote/store, l'utilisateur ne peut pas compléter localement sans compte.

Recommandation :

- Ajouter `Continue without account` ou `Save locally for now`.
- Déplacer la création de compte avant la collecte sensible, ou l'assumer explicitement dès le début.
- Expliquer pourquoi le compte est nécessaire si le blocage reste volontaire.

### P1 - Responsive web/tablette non maîtrisé

Preuves :

- `23-home-desktop.png`.
- `app.config.js` déclare `supportsTablet: true`.

Impact :

- En viewport large, les cartes et métriques s'étirent, la bottom nav devient disproportionnée.
- L'expérience ne ressemble plus à une app mobile ni à un dashboard desktop.

Recommandation :

- Appliquer un `maxWidth` de shell mobile pour Expo web, centré, ou créer un layout tablette dédié.
- Si tablette iOS est réellement supportée, tester iPad portrait/paysage.
- Ne pas laisser les cartes internes prendre toute la largeur sans contrainte.

### P1 - Placeholders confondus avec valeurs saisies

Preuves :

- `03-manual-empty-mobile.png`.
- `17-onboarding-body-mobile.png`.
- Champs avec placeholders d'exemples dans `ManualMealScreen.tsx` et `OnboardingScreen.tsx`.

Impact :

- Le bouton est désactivé alors que l'écran semble déjà rempli.
- Cela augmente l'effort cognitif et donne une impression de bug.

Recommandation :

- Remplacer les placeholders numériques par exemples explicitement préfixés : `Ex: 720`, `Ex: 42`.
- Ou préremplir réellement les champs et rendre le CTA actif si c'est l'intention.
- Ajouter un court message sous le bouton désactivé : `Meal name and calories are required`.

### P1 - Langage de confiance incohérent

Preuves :

- Résultat : `Review needed`.
- History : `LOW`.
- Onboarding plan : `High-confidence plan`.
- `PremiumTimelineScreen.tsx` retourne `LOW`; `dashboardViewModel.ts` retourne `Review needed`.

Impact :

- L'utilisateur ne comprend pas si "LOW" qualifie le repas, la donnée, l'analyse, ou sa performance.
- Le repas manuel apparaît comme incertain alors qu'il a été saisi par l'utilisateur.
- "High-confidence plan" peut être surprometteur pour un calcul nutritionnel.

Recommandation :

- Uniformiser en trois libellés explicites : `High confidence`, `Medium confidence`, `Needs review`.
- Dans History, afficher `Needs review` ou `Low confidence`, pas `LOW`.
- Pour manuel, remplacer `Review needed` par `Manual entry` ou `User-entered`.
- Remplacer `High-confidence plan` par `Personalized starting plan` avec une note de limites.

### P1 - Accessibilité web et semantics faibles

Preuves :

- Snapshots majoritairement `generic`, peu de roles bouton explicites.
- Console : `Password field is not contained in a form`.
- Settings icon et plusieurs icônes n'ont pas de nom accessible visible dans les snapshots.

Impact :

- Navigation clavier/screen reader probablement fragile sur web.
- Les contrôles icon-only peuvent être muets.
- Les formulaires ne bénéficient pas des comportements natifs de submit/autocomplete.

Recommandation :

- Ajouter `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` aux `Pressable` critiques.
- Donner un label accessible aux icônes settings/back/edit si l'icône seule est cliquable.
- Encapsuler les formulaires web ou ajouter des attributs équivalents via React Native Web.
- Tester au clavier : Tab, Enter, Space, focus visible.

### P2 - Erreurs de pluralisation visibles

Preuves :

- `10-profile-mobile.png` : `1 days`.
- `11-settings-mobile.png` : `1 syncable meals`.
- `13-data-privacy-mobile.png` : `1 exportable meals`.

Impact :

- Baisse de qualité perçue, surtout sur Profile/Settings.

Recommandation :

- Centraliser les helpers de pluralisation : `meal/meals`, `day/days`, `syncable meal(s)`, `exportable meal(s)`.

### P2 - Scanner permission sans alternative immédiate

Preuve :

- `22-scanner-meal-mobile.png`.

Impact :

- Si l'utilisateur refuse ou hésite à donner la caméra, il doit revenir pour utiliser Gallery, Search ou Manual.

Recommandation :

- Ajouter actions secondaires : `Choose from gallery`, `Add manually`, `Search food`.
- Ajouter une phrase rassurante : `You can still log meals without camera access`.

### P2 - Settings Data promet plus que l'écran non connecté

Preuves :

- Settings : `Export, sign out, or delete your account`.
- Data non connecté : `Export my data`, `Clear local data`.

Impact :

- L'utilisateur cherche suppression de compte alors qu'il n'est pas connecté.

Recommandation :

- Adapter le sous-texte Settings selon `isAuthenticated`.
- Non connecté : `Export or clear local data from this device`.
- Connecté : `Export, sign out, or delete your account`.

### P2 - Instructions incompatibles avec web/accessibilité

Preuve :

- `PremiumHomeScreen.tsx` affiche `Long press for details`.

Impact :

- Long press n'est pas naturel sur desktop web, clavier, lecteurs d'écran.

Recommandation :

- Remplacer par un menu visible ou un bouton `Details`.
- Si long press reste sur mobile natif, cacher ou adapter la microcopy selon plateforme.

### P2 - Paywall non vérifiable dans cette exécution

Preuves code :

- `env.ts` active paywall seulement si `EXPO_PUBLIC_PAYWALL_ENABLED === 'true'`.
- `App.tsx` affiche le paywall après onboarding si paywall actif et non-premium.
- `PaywallScreen.tsx` affiche Annual, Monthly, Restore purchases, Start free trial.

Impact :

- Le parcours commercial n'a pas pu être audité par capture runtime.
- Risque de copy prix/devise, trial, restore, erreurs RevenueCat non couverts visuellement.

Recommandation :

- Ajouter un mode QA local pour forcer `screen.name = 'paywall'` ou seed entitlement/onboarding sans compte réel.
- Capturer paywall, restore error, purchase error, premium unlocked, subscription settings.

### P3 - Rythme et densité visuelle

Observations :

- Le style est cohérent mais très lourd typographiquement.
- Plusieurs écrans combinent gros titres + cartes + CTA sticky, ce qui marche en mobile mais fatigue sur parcours long.
- Save confirmation a un grand vide vertical.

Recommandation :

- Garder la force de marque sur les écrans clés, réduire légèrement certains titres dans Settings/Profile/Progress.
- Remonter les actions secondaires importantes dans les écrans longs.
- Utiliser plus d'états compacts après onboarding.

## Accessibilité - risques visibles

Ce qui est positif :

- La plupart des zones tap semblent >= 44px.
- Contrastes noir/blanc et vert/noir généralement forts.
- Les écrans critiques ont des titres visibles.
- Les données sensibles ont plusieurs messages de confidentialité.

Risques :

- Structure sémantique web pauvre dans les snapshots.
- Boutons icon-only probablement sans nom accessible fiable.
- Password hors formulaire côté web.
- Focus visible peu différencié des bordures normales.
- Les chips de période et certains badges sont petits.
- `LOW` en rouge est ambigu et peut être anxiogène.
- Pas d'audit lecteur d'écran ni navigation clavier effectué.

## Recommandations de correction

### À faire en premier

1. Ajouter une sortie locale à l'onboarding auth gate.
2. Corriger pluralisations `1 day`, `1 syncable meal`, `1 exportable meal`.
3. Modifier les placeholders pour ne plus ressembler à des valeurs.
4. Uniformiser les libellés de confiance.
5. Ajouter labels/accessibilityRole aux contrôles icon-only et principaux Pressable.

### Ensuite

1. Ajouter un shell responsive web/tablette avec largeur max ou layout dédié.
2. Ajouter alternatives scanner sur l'écran permission.
3. Adapter Settings Data selon l'état connecté.
4. Remplacer `Long press for details` par une action visible.
5. Rendre les critères de validation auth et ajout manuel explicites.

### QA à planifier

1. Audit natif iOS sur simulateur ou device.
2. Audit Android.
3. Audit clavier web.
4. Audit VoiceOver/TalkBack.
5. Audit paywall en config active.
6. Test erreurs : Supabase auth failure, RevenueCat unavailable, camera denied, product not found, low light, label OCR unavailable.

## Conclusion

MacroLens est déjà cohérent et crédible sur la proposition "photo -> macros -> correction -> suivi". La faiblesse majeure est le contrôle de l'expérience aux moments de friction : compte obligatoire, permission caméra, confiance des résultats, responsive web/tablette, et states de formulaire. En corrigeant ces points, l'app gagnera surtout en confiance perçue et en robustesse, plus qu'en esthétique pure.
