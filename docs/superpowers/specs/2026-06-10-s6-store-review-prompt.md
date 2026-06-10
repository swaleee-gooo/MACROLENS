# S6 — Prompt de notation automatique (SKStoreReviewController)

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Haute · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

La note App Store détermine l'ASO ; sous 4,5★ la conversion des pages produit s'effondre. Aujourd'hui le seul chemin de notation est un lien « Rate the app » enfoui à 3 taps dans Settings → Legal Support : seuls les utilisateurs mécontents motivés le trouveront. Il faut demander la note au moment de satisfaction maximale, via le popup natif iOS (qui ne quitte pas l'app), en respectant la limite Apple de 3 affichages/an.

## Current State (vérifié le 2026-06-10)

- [LegalSupportScreen.tsx:214](../../../apps/mobile/src/screens/LegalSupportScreen.tsx) : lien manuel `?action=write-review` — à conserver tel quel.
- `expo-store-review` absent de package.json.
- Moments de satisfaction déjà instrumentés : `SaveConfirmationScreen` (repas sauvé + streak), `streaks.ts` (compteur de jours).

## Proposed Change

1. **SDK** : `npx expo install expo-store-review`.
2. **Logique pure dans `src/domain/reviewPrompt.ts`** (testable sans mock natif) :

```typescript
export type ReviewPromptState = {
  lastPromptedAt: string | null;   // ISO
  promptCount365d: number;
  hasPromptedForMilestone: Record<string, boolean>; // 'third_meal' | 'streak_7'
};

export function shouldPromptForReview(state: ReviewPromptState, context: {
  totalMealsSaved: number;
  currentStreakDays: number;
  now: Date;
  lastActionWasError: boolean;
}): { prompt: boolean; milestone: string | null };
```

Règles : milestone `third_meal` (3e repas sauvegardé) ou `streak_7` (streak atteint 7 jours) ; jamais si un prompt a eu lieu dans les 30 derniers jours ; jamais plus de 3 sur 365 jours glissants ; jamais juste après une erreur (scan échoué, achat échoué) ; chaque milestone ne déclenche qu'une fois à vie.
3. **Persistance** : `src/storage/reviewPromptRepository.ts` (AsyncStorage, clé `macrolens.reviewPrompt`). Initialisation paresseuse : à la PREMIÈRE lecture du state (pas de migration au boot), si le state n'existe pas encore et que `totalMealsSaved > 3` à ce moment-là, le milestone `third_meal` est immédiatement marqué consommé sans prompt — c'est ce qui empêche le déclenchement rétroactif chez les utilisateurs existants. Sources des données de contexte : `totalMealsSaved` = `meals.length` déjà en mémoire dans App.tsx ; `currentStreakDays` = `streaks.ts` (existant) ; `lastActionWasError` = flag posé par les chemins d'erreur scan/achat existants dans App.tsx.
4. **Déclenchement** : dans le flux de `SaveConfirmationScreen` (après l'affichage de la confirmation, délai 1,5 s pour ne pas interrompre l'animation) — `if shouldPrompt → StoreReview.requestReview()`. `requestReview()` est best-effort : iOS décide d'afficher ou non ; on enregistre la tentative quoi qu'il arrive.
5. **Analytics** : nouvel event `review_prompt_requested { milestone }` (payload privacy-safe).
6. Le lien manuel de LegalSupportScreen reste inchangé (chemin volontaire toujours disponible).

## Acceptance Criteria

1. Sauvegarde du 3e repas (install vierge, dev) → le popup natif iOS apparaît après la confirmation (vérifiable en dev build ; en TestFlight Apple le supprime silencieusement, c'est documenté et attendu).
2. 4e, 5e… repas → aucun nouveau prompt (milestone one-shot vérifié par test unitaire).
3. Streak atteignant 7 jours moins de 30 jours après le premier prompt → pas de prompt ; plus de 30 jours après → prompt (tests unitaires avec horloge fixe).
4. `promptCount365d` atteint 3 → plus jamais de prompt dans l'année glissante (test unitaire).
5. Un scan en échec immédiatement avant la sauvegarde suivante → pas de prompt sur cette sauvegarde (test unitaire `lastActionWasError`).
6. `npx tsc --noEmit` + `npm test` verts ; `reviewPrompt.test.ts` couvre les 5 règles ; aucun changement de comportement pour un utilisateur qui a déjà > 3 repas (le milestone `third_meal` ne re-déclenche pas rétroactivement : si `totalMealsSaved > 3` à la première évaluation, marquer le milestone comme consommé sans prompt).
7. Event `review_prompt_requested` visible dans le sink analytics.

## Testing Plan

| Couche | Quoi | Count |
|---|---|---|
| Unit | `shouldPromptForReview` : 5 règles + cas rétroactif + bornes 30 j/365 j | +8 |
| Unit | repository : défauts, persistance | +2 |
| Manuel | 3 repas en dev build iOS → popup ; vérif non-répétition | checklist |

## Rollback Plan

Revert du commit (fonctionnalité additive, aucun état partagé). Le state AsyncStorage orphelin est inerte.

## Effort Estimate

Domain + tests ~30 min · repository ~10 min · intégration SaveConfirmation + analytics ~20 min. Total ~1 h.

## Files Reference

| Fichier | Changement |
|---|---|
| `apps/mobile/package.json` | + `expo-store-review` |
| `apps/mobile/src/domain/reviewPrompt.ts` (+ test) | NOUVEAU — logique pure |
| `apps/mobile/src/storage/reviewPromptRepository.ts` (+ test) | NOUVEAU |
| `apps/mobile/App.tsx` ou `SaveConfirmationScreen.tsx` | déclenchement post-save |
| `apps/mobile/src/analytics/analyticsEvents.ts` | + `review_prompt_requested` |

## Out of Scope

Écran custom « Tu aimes MacroLens ? » pré-prompt (pattern de filtrage interdit par les guidelines si trompeur — on reste sur le prompt natif direct), prompt après achat (à évaluer en phase 2 avec les données PostHog), in-app survey.
