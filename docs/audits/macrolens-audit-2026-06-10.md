# Audit complet MacroLens — 2026-06-10

Objectif : devenir le n°1 du marché US des trackers caloriques IA.
Méthode : 5 audits parallèles (produit, code/architecture, monétisation/growth, backend/sécurité, marché US) + vérifications manuelles.

---

## Verdict global

Le produit est **plus complet et mieux construit que la moyenne des clones de Cal AI** : pipeline scan→correction→suivi solide, moteur de confiance (MetaboProof) unique, import de recettes TikTok/IG, design différencié. Mais l'app n'est **pas prête à gagner le marché US** : la monétisation est éteinte, les prix sont en euros, les unités sont métriques, et tu es totalement aveugle en production (zéro crash reporting, zéro analytics backend).

Le marché valide ton positionnement : la plainte n°1 des utilisateurs retenus (24 % après 6 mois) est la **fausse précision** des estimations — exactement ce que tes fourchettes de confiance attaquent. Cal AI (racheté par MyFitnessPal en mars 2026, ~30 M$ de revenus 2025) a été **retiré de l'App Store en avril 2026** pour pricing trompeur. « Le scanner de calories qui ne te ment pas » est un angle qu'aucun gros acteur ne peut copier sans admettre que sa précision est fausse.

---

## 1. BLOQUANTS pour le lancement US (à faire avant toute chose)

### 1.1 Le paywall est désactivé — revenu : 0 €
- `EXPO_PUBLIC_PAYWALL_ENABLED` absent de la config de prod (défaut `false` dans `.env.example`).
- `App.tsx` (~l. 382-386, 983-985) bypasse le paywall ; tout le monde a tout gratuitement.
- L'intégration RevenueCat est complète et saine (`revenueCatEntitlementProvider.ts`, produits `prod03d96b4e28` / `prod0ef75e0b34`, entitlement `macrolens_pro`). Il manque juste l'activation.

### 1.2 Prix affichés en EUR, codés en dur
- `PaywallScreen.tsx` affiche « EUR 49.99/year » / « EUR 9.99/month » en dur.
- Pour le marché US il faut afficher le prix localisé App Store via RevenueCat (`product.priceString`), jamais une devise codée en dur.
- Le badge « 7 days free » est affiché mais **aucune logique de trial n'est branchée** — configurer l'offre d'essai dans App Store Connect + RevenueCat.
- ⚠️ Apple police activement la règle 3.1.2(c) depuis l'affaire Cal AI : le **prix réellement facturé** (annuel) doit être l'élément le plus visible, pas l'équivalent mensuel.

### 1.3 Unités impériales absentes
- Taille en cm, poids en kg, portions en grammes, partout (onboarding, profil, weigh-in, portions).
- Un Américain pense en lbs / ft-in / oz. C'est un motif de désinstallation immédiate à l'onboarding. Ajouter un toggle d'unités avec défaut impérial pour la locale US.

### 1.4 Tu es aveugle en production
- **Aucun crash reporting** (pas de Sentry/Crashlytics) et **aucun Error Boundary** React : un crash composant = app entière plantée, et tu ne le sauras jamais.
- **Analytics console-only** : les 28 events (funnel onboarding→paywall→purchase) existent (`analyticsEvents.ts`) mais ne partent nulle part. Brancher un sink réel (PostHog/Amplitude) — le playbook Cal AI, c'est 123 A/B tests de paywall en 10 mois ; sans mesure, aucune optimisation possible.

### 1.5 Endpoint de scan IA non protégé
- `analyze-meal` (OpenAI gpt-4.1-mini ~0,003 $/scan, fallback Gemini) : **aucun rate limiting par utilisateur**. Un script + comptes anonymes = facture illimitée.
- JWT décodé mais **signature non vérifiée** dans les Edge Functions (`auth.ts`) — atténué par le gateway Supabase, mais à corriger (vérification de signature + `exp`).
- Aucun timeout sur les appels OpenAI/Gemini/vision-signals (la requête peut pendre indéfiniment).
- Quota recommandé : ~20 scans/jour en free, davantage en Pro, alerte si dépense > seuil quotidien.

### 1.6 Hygiène repo
- La branche `codex/share-cards-native` a **39 commits d'avance sur `origin/main`** et n'est pas poussée. Risque réel de perte de travail.

> Faux positif écarté : deux agents ont signalé `.env.local` comme « exposé dans git ». Vérifié : le fichier n'est **ni tracké ni dans l'historique** (`.env*.local` est gitignoré), et les clés concernées (Supabase publishable, RevenueCat `appl_`) sont publiques par design. Pas de rotation d'urgence. Bonne pratique quand même : EAS Secrets.

---

## 2. Haute priorité (semaines 1-4 post-lancement)

### Rétention — le levier n°1
1. **Notifications push réelles** : `expo-notifications` n'est même pas installé ; `ReminderSettingsScreen` est une UI sans effet. Rappels repas, streak en danger (21h), rapport hebdo. ~70 % des utilisateurs churment en 2 semaines quand l'app ne les rappelle pas.
2. **Apple Health réel** : `HealthSettingsScreen` est UI-only. La synchro poids/énergie est un table-stake US (et un signal de sérieux).
3. **Prompt de notation automatique** (`expo-store-review` / SKStoreReviewController) après un moment de satisfaction (3e repas sauvé, streak 7 jours). Aujourd'hui le lien « Rate the app » est enfoui à 3 taps dans Settings — une note < 4,5★ tue l'ASO.

### Conversion
4. **Infra d'expérimentation paywall** (RevenueCat Paywalls ou Superwall) : Cal AI a triplé son revenu par la vélocité d'expérimentation (5 tests/mois), pas par un paywall parfait. Benchmarks à viser : install→trial 14,5 %, trial→paid 42 %.
5. **Plan hebdomadaire** (~2,99-4,99 $/sem) : c'est le plan au LTV le plus élevé de la catégorie ; tu n'as que mensuel/annuel.
6. Paywall v2 : preuve sociale, comparaison Free/Pro, garantie — actuellement 4 bullets et c'est tout.

### Fiabilité
7. Error Boundary + retry/backoff sur les appels IA + détection offline (NetInfo) avec UI dégradée.
8. CI GitHub Actions (tsc + vitest en gate) — EAS est bien configuré mais rien n'empêche un commit cassé de partir en build.
9. Refactor `App.tsx` (1 320 lignes, machine à états de navigation entière) et `OnboardingScreen.tsx` (1 532 lignes) — risque de régression à chaque feature.
10. P1 de l'audit UI/UX du 4 juin toujours ouverts : gate de compte en fin d'onboarding sans option « continuer sans compte », langage de confiance incohérent (« LOW » / « Review needed » / « High-confidence plan »), accessibilité quasi absente (3 labels dans toute l'app).

---

## 3. Le playbook croissance (mois 2-3)

Le modèle gagnant 2025-2026 (validé par Cal AI, ~50 M$ run-rate à l'acquisition) :

1. **Quiz onboarding → plan personnalisé → hard paywall avec trial.** Tu as déjà le quiz et le plan ; il manque le priming premium pendant l'onboarding (l'utilisateur découvre le prix à froid) et 89 % des trials démarrent à la première session — tout se joue au jour 0.
2. **Distribution = micro-influenceurs TikTok/IG en volume** (retainers, ~4 posts/mois chacun), puis paid ads optimisées « start trial », puis affiliation. La distribution est la moat, pas les features. Ton hook UGC : « l'app qui te dit la vérité sur tes calories » + démos de plats pièges (sauces, plats mixtes) où les concurrents se plantent.
3. **Tracking de référence** : les share cards (branche actuelle) pointent vers l'App Store sans attribution. Ajouter un paramètre de campagne / deep link pour mesurer la viralité, puis un vrai programme de parrainage.
4. **ASO long-tail** : « calorie counter ai » est saturé (~70 concurrents). Viser « macro tracker photo », « honest food scanner », et le nouveau label réglementaire Santé & Fitness d'Apple (printemps 2026) comme signal de crédibilité.
5. Anti-positionnement : prix transparent **avant** la fin du quiz, annulation facile, pas de spam de discount — l'exact inverse des dark patterns qui ont fait retirer Cal AI, et un argument marketing en soi.

### Features pour tenir le rang (backlog stratégique)
- Logging par texte (« describe my meal ») puis voix — table-stakes 2026.
- Widgets iOS + Apple Watch.
- Objectifs adaptatifs (l'angle MacroFactor) — ton moteur MetaboProof est une base idéale.
- Micronutriments de base (sodium, sucre), hydratation, exercice.
- Base alimentaire vivante (USDA API) — la DB embarquée est statique et OpenFoodFacts est orienté EU ; pour les US il faut les chaînes de restaurants.

---

## 4. Forces à préserver

- **Fourchettes de confiance honnêtes** : c'est LA white space du marché. Ne jamais céder à la fausse précision pour « faire pro ».
- Boucle de correction en un tap (ate half, added oil…) — meilleure que la plupart des concurrents.
- Import de recettes depuis TikTok/IG/YouTube + liste de courses : différenciant, à marketer.
- Calibration personnelle (MetaboProof) : argument « précision qui s'améliore avec toi ».
- Qualité du code domaine : TypeScript strict, 81 fichiers de tests sur la logique métier, architecture par couches propre.

## 5. Scores

| Dimension | Score | Commentaire |
|---|---|---|
| Cœur produit (scan→log) | 9/10 | Rapide, honnête, corrigeable |
| Qualité code domaine | 8/10 | Tests solides, TS strict ; App.tsx monolithe |
| Monétisation | 3/10 | Tout est codé… et éteint ; EUR hardcodé |
| Rétention | 3/10 | Push inexistant, Health UI-only, streaks ok |
| Observabilité | 1/10 | Ni crash reporting ni analytics réels |
| Sécurité backend | 5/10 | RLS partout ✓ ; rate limiting et JWT à corriger |
| Readiness US | 3/10 | Pas de lbs/ft, prix EUR, DB alimentaire EU-centric |
| Conformité Apple | 7/10 | Suppression de compte ✓ ; vigilance 3.1.2(c), parité Sign in with Apple |

## 6. Ordre d'exécution recommandé

**Avant soumission/lancement** : pousser la branche → activer paywall + prix localisés + trial réel → unités impériales → Sentry + Error Boundary → sink analytics → rate limiting + timeouts backend → prompt de notation.

**Semaines 1-4** : push notifications → Apple Health réel → expérimentation paywall + plan hebdo → CI → P1 UX du 4 juin.

**Mois 2-3** : machine UGC TikTok → referral tracking → text/voice logging → widgets → objectifs adaptatifs.
