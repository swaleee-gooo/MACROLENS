# MacroLens — Checklist de lancement V1

> **Légende priorité** — 🔴 Bloquant (pas de lancement sans) · 🟡 Important · 🟢 Fast-follow (juste après)
> **Tags** — `[ASC]` App Store Connect · `[RC]` RevenueCat · `[BACK]` Supabase/edge · `[QA]` test device · `[OTA]` shippable sans build · `[BUILD]` nécessite un build natif

**Definition of Done V1** : un user installe → onboarding → 1er scan réussi → comprend la valeur → paywall → achat possible → partage une carte qui ramène vers l'App Store. Le tout sans crash, conforme Apple, monétisé.

---

## 0. État des lieux
- [ ] Build 41 (runtime 1.0.0, OTA active) installé en TestFlight et testé
- [ ] `version: 1.0.0` cohérent partout, build number auto-incrémenté
- [ ] Toutes les OTA récentes bien appliquées sur le device de test

## 1. 💳 Monétisation (🔴 — le cœur du MRR)
- [ ] 🔴 `[ASC]` Accord **Paid Applications** signé + infos bancaires/fiscales complètes (sinon les achats ne marchent pas)
- [ ] 🔴 `[ASC]` Créer les 2 abonnements (mensuel + annuel) avec les IDs câblés (`prod03d96b4e28`, `prod0ef75e0b34`) ou réaligner
- [ ] 🔴 `[ASC]` Prix par territoire, période d'essai gratuit, nom/description localisés
- [ ] 🔴 `[RC]` Relier les produits à l'entitlement "premium" + créer l'offering par défaut
- [ ] 🔴 `[RC]` Clé API publique iOS en prod (`EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`)
- [ ] 🔴 Activer en prod : `EXPO_PUBLIC_PAYWALL_ENABLED=true`, `EXPO_PUBLIC_ENTITLEMENT_MODE=store`
- [ ] 🔴 `[QA]` Acheter en **sandbox** (compte test Apple) : mensuel + annuel
- [ ] 🔴 `[QA]` **Restaurer les achats** (Restore) — obligatoire Apple
- [ ] 🔴 `[QA]` Gating : premium bloqué sans abo, débloqué après achat
- [ ] 🟡 `[QA]` Annulation / expiration → retour propre au gratuit
- [ ] 🟡 Paywall : prix, durée, "essai puis X€", liens CGU + confidentialité, "gérer l'abonnement" (Guideline 3.1.2)
- [ ] 🟡 Stratégie de placement du paywall (après onboarding ? après N scans ? hard/soft ?)
- [ ] 🟡 Pricing décidé (mensuel/annuel + trial) — cohérent marché US

## 2. ⚖️ Conformité & Légal (🔴 — sinon rejet)
- [ ] 🔴 **Suppression de compte in-app** qui efface vraiment les données serveur (Guideline 5.1.1(v)) — vérifier le back
- [ ] 🔴 `[ASC]` URL **Politique de confidentialité** publique (et accessible dans l'app)
- [ ] 🔴 `[ASC]` **CGU / EULA** (standard Apple ou custom) + lien sur le paywall
- [ ] 🔴 `[ASC]` **App Privacy "nutrition labels"** : déclarer données collectées (photos, usage, achats, identifiants) + usages
- [ ] 🔴 **Disclaimer santé** "wellness only / pas un dispositif médical" visible (onboarding + résultats) — aucune claim médicale/diagnostic
- [ ] 🟡 Export des données utilisateur (RGPD) au moins sur demande
- [ ] 🟡 Tracking pub/IDFA ? Si oui → prompt **ATT** + `NSUserTrackingUsageDescription`. Sinon déclarer "no tracking"
- [ ] 🟡 Sources de données créditées (OpenFoodFacts, USDA…) + licences respectées
- [ ] 🟢 Audit "wellness" : zéro "diagnostic / guérir / médical" nulle part

## 3. 🏪 App Store Connect — Fiche & Assets (🔴)
- [ ] 🔴 Icône 1024×1024 (sans transparence, sans coins arrondis)
- [ ] 🔴 Captures 6.7" (≥ 3–5, avec sur-titres marketing)
- [ ] 🟡 Captures 6.5" / iPad si supporté
- [ ] 🔴 Nom (30 car.) + sous-titre (30 car.)
- [ ] 🔴 Description + texte promo + **mots-clés** (100 car., ASO)
- [ ] 🔴 Catégorie (Health & Fitness) + secondaire
- [ ] 🔴 Classification d'âge (questionnaire)
- [ ] 🔴 URL support + URL marketing
- [ ] 🟡 **App Preview (vidéo)** — fort impact conversion
- [ ] 🟡 Fiche localisée FR + EN
- [ ] 🟡 "What's New" 1.0
- [ ] 🟡 Note de review + **compte démo** + comment tester le paywall (sandbox)

## 4. 🔧 Technique / Build (🔴)
- [ ] 🔴 Tous les `NS…UsageDescription` présents (caméra OK ; photo library si picker ; tracking si ATT)
- [ ] 🔴 Variables d'env PROD au build (Supabase URL/anon, RevenueCat, flags paywall, facebookAppId)
- [ ] 🔴 `[QA]` Zéro crash sur les parcours principaux (crash-free)
- [ ] 🔴 Gestion offline / erreurs réseau propre (scan, import, paywall) — pas d'écran blanc
- [ ] 🟡 États loading & erreur partout (timeouts edge functions)
- [ ] 🟡 Refus de permission caméra → message clair + chemin de secours
- [ ] 🟡 Perf : démarrage à froid, timeline longue, images
- [ ] 🟢 Écrans dev/benchmark désactivés en prod (BenchmarkDevScreen…)

## 5. 🛠️ Backend / Infra (🔴/🟡)
- [ ] 🔴 `[BACK]` Edge functions déployées en prod (analyze-meal, scan-nutrition-label, lookup-packaged-food, extract-recipe)
- [ ] 🔴 `[BACK]` `OPENAI_API_KEY` + **budget/quota OpenAI** suffisant + alertes de coût
- [ ] 🔴 `[BACK]` Auth Supabase OK + **RLS** sur toutes les tables (isolation par user)
- [ ] 🟡 `[BACK]` Rate limiting / anti-abus sur les edge functions (coût IA)
- [ ] 🟡 `[BACK]` Sauvegardes DB + restauration testée
- [ ] 🟡 `[BACK]` Monitoring edge functions (logs, erreurs, latence)
- [ ] 🟢 `[BACK]` Cache extraction recette (perf) — fast-follow

## 6. 📊 Observabilité & Analytics (🟡 — quasi indispensable)
- [ ] 🟡 `[BUILD]` Crash reporting (Sentry)
- [ ] 🟡 `[BUILD]` Analytics produit (PostHog/Amplitude) — funnel install → onboarding → 1er scan → paywall → achat
- [ ] 🟡 Événements clés instrumentés (scan, import, partage carte, paywall vu, achat, restore)
- [ ] 🟢 Dashboard activation / rétention D1-D7 / conversion

## 7. 🚀 Onboarding & 1er run (🟡)
- [ ] 🟡 `[QA]` Onboarding complet fluide (profil, objectif, calcul des cibles)
- [ ] 🟡 Priming des permissions (expliquer avant de demander la caméra)
- [ ] 🟡 "Aha moment" rapide (1er scan réussi) **avant** le paywall
- [ ] 🟢 Empty states (aucun repas / aucune recette sauvegardée)

## 8. 🔥 Croissance / Viralité (🔴/🟡 — ton plan MRR)
- [ ] 🔴 `[QA]` Cartes partage : tester réellement Story IG / TikTok / Snap (shareSingle) sur device
- [ ] 🔴 `[QA]` Le QR / lien de la carte ouvre bien la fiche App Store MacroLens
- [ ] ✅ Loader d'import recette (scan → BIM → reveal) — fait
- [ ] 🟢 `[OTA/BUILD]` Referral (code/lien) — pour la phase micro-influenceurs
- [ ] 🟢 Deep links / universal links (ouvrir une recette partagée dans l'app)
- [ ] 🟢 Préparer le contenu (8 TikTok / 4 IG / 4 YT short)

## 9. 🌍 Localisation (🟡)
- [ ] 🟡 EN + FR cohérents sur tous les écrans (rien qui traîne dans la mauvaise langue)
- [ ] ✅ Cartes partage + loader en anglais — fait

## 10. 📦 Pré-soumission & lancement (🔴)
- [ ] 🔴 Beta TestFlight externe (5–15 testeurs), retours intégrés
- [ ] 🔴 Soumettre à la review App Store (TestFlight → App Store)
- [ ] 🟡 **Phased release** activé (déploiement progressif)
- [ ] 🟡 Plan anti-rejet prêt (motifs fréquents : IAP 3.1.1, suppression compte 5.1.1, privacy 5.1, claims santé 1.4.1)
- [ ] 🟡 Surveiller crash-free + reviews à J+1
- [ ] 🟢 Page support (email / FAQ) en ligne

---

## ⭐ Top 10 bloquants si tu ne devais regarder qu'une liste
1. Produits d'abo créés (ASC) + accord Paid Apps signé
2. RevenueCat relié + clé API + flags paywall ON
3. Achat sandbox + Restore testés sur device
4. Suppression de compte qui wipe le serveur
5. Privacy policy + CGU en ligne + App Privacy labels
6. Disclaimer santé "wellness only"
7. Fiche App Store complète (icône, screenshots, description, mots-clés)
8. Edge functions prod OK + budget OpenAI
9. Partage carte + QR → App Store testés en vrai
10. Build prod final + soumission review (avec compte démo)
