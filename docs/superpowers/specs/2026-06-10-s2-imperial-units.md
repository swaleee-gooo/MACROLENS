# S2 — Unités impériales (lbs / ft-in) en affichage et saisie

**Epic :** [Bloquants lancement US](2026-06-10-us-launch-epic.md) · **Priorité :** Haute · **Statut :** VALIDÉ 2026-06-10 (gate codex 7/10)

## Context

Toute l'app saisit et affiche taille en cm, poids en kg. Un utilisateur américain pense en lbs et ft/in : lui demander son poids en kg au 5e écran d'onboarding est un motif d'abandon immédiat. Principe directeur : **le stockage reste 100 % métrique** (`heightCm`, `weightKg` traversent 20 fichiers : domain, storage, cloud sync, share cards, charts) ; on ajoute UNIQUEMENT une couche de conversion aux frontières UI. C'est ce qui garantit zéro migration de données et zéro régression.

## Current State (vérifié le 2026-06-10)

- Modèle canonique métrique : `heightCm`/`weightKg` dans `domain/types.ts`, `onboardingProfile.ts`, `macroTargets.ts`, `goalProgress.ts`, `cloudSyncRepository.ts`, `shareCardContent.ts`, etc. (20 fichiers).
- Écrans avec saisie/affichage cm-kg : [OnboardingScreen.tsx](../../../apps/mobile/src/screens/OnboardingScreen.tsx) (taille, poids, poids cible, rythme kg/sem), [EditProfileScreen.tsx](../../../apps/mobile/src/screens/EditProfileScreen.tsx), [ProfileScreen.tsx](../../../apps/mobile/src/screens/ProfileScreen.tsx), [WeighInScreen.tsx](../../../apps/mobile/src/screens/WeighInScreen.tsx) (saisie + chart 30 j).
- Affichages secondaires du poids : ShareCard progress, SuccessProfileScreen, TargetsScreen.
- Aucune notion d'unité préférée nulle part dans le code.

## Proposed Change

### 1. Module domaine pur `src/domain/units.ts` (zéro dépendance UI)

```typescript
export type UnitSystem = 'imperial' | 'metric';

export function kgToLbs(kg: number): number;          // * 2.2046226218, arrondi 0.1
export function lbsToKg(lbs: number): number;          // / 2.2046226218, PAS d'arrondi (stockage)
export function cmToFtIn(cm: number): { ft: number; in: number }; // in arrondi entier, gère le report 12in→+1ft
export function ftInToCm(ft: number, inches: number): number;     // PAS d'arrondi (stockage)
export function formatWeight(kg: number, system: UnitSystem): string;  // "165.3 lbs" | "75 kg"
export function formatHeight(cm: number, system: UnitSystem): string;  // "5'9\"" | "175 cm"
export function formatWeeklyPace(kgPerWeek: number, system: UnitSystem): string; // "1 lb/week" | "0.5 kg/week"
```

Règle anti-dérive : la conversion vers le métrique au moment de la SAISIE stocke la valeur pleine précision ; l'arrondi n'existe qu'à l'affichage. Un test vérifie que saisir 165 lbs, rouvrir l'écran, re-sauvegarder sans toucher au champ ne change pas `weightKg` (round-trip stable).

Contrat des convertisseurs : fonctions pures qui supposent une entrée valide (nombre fini ≥ 0) — elles ne throwent pas, ne clampent pas. La validation des entrées (rejet de négatif, vide, non numérique) reste à la couche UI, exactement comme les champs cm/kg actuels la font. Les tests documentent ce contrat (entrée invalide → comportement UI, pas units.ts).

### 2. Préférence d'unité

- `src/storage/unitPreferenceRepository.ts` : clé AsyncStorage `macrolens.unitSystem`, valeurs `'imperial' | 'metric'`.
- **Défaut : `imperial`** (app verrouillée en anglais US, marché cible US). Les profils existants ne changent pas de données — seul l'affichage bascule, et le toggle permet de revenir en métrique en 2 taps.
- Toggle dans SettingsScreen, section profil : « Units — Imperial (lbs, ft) / Metric (kg, cm) ».

### 3. Écrans (saisie)

- **OnboardingScreen** : étape taille/poids → en imperial, taille = deux champs `ft` + `in`, poids = champ `lbs` ; étape poids cible et rythme → lbs et lb/week (paliers 0.5 / 1 / 1.5 / 2 lb ↔ 0.25/0.5/0.75/1 kg existants). Le state interne du wizard et `onboardingProfile.ts` continuent de manipuler du métrique : la conversion se fait dans le composant de champ.
- **EditProfileScreen / ProfileScreen / WeighInScreen** : mêmes champs convertis ; le chart de WeighIn relabellise son axe via `formatWeight`.
- **Affichages passifs** (ShareCard, SuccessProfile, Today/weekly report si le poids y figure) : remplacer les `${weightKg} kg` par `formatWeight(weightKg, system)`.

### 4. Ce qui ne change PAS

Grammes des portions et macros (standard universel de la catégorie, y compris aux US), calories, tout le pipeline d'analyse, le schéma AsyncStorage/Postgres, `macroTargets.ts` (calculs en métrique).

## Acceptance Criteria

1. Nouvel utilisateur (install vierge) : l'onboarding propose ft/in et lbs par défaut ; le profil sauvegardé contient des `heightCm`/`weightKg` métriques corrects (vérifiable via l'export de données).
2. Saisie 5 ft 9 in → stockage 175.26 cm → réaffichage « 5'9" » (pas 5'8.9"). Saisie 165 lbs → ré-ouverture → re-save sans édition → `weightKg` identique au centième (test automatisé round-trip).
3. Toggle Settings vers Metric : tous les écrans (Profile, WeighIn, Onboarding si relancé, ShareCard) affichent cm/kg sans redémarrage de l'app.
4. Utilisateur existant avec profil métrique : après mise à jour, ses valeurs sont affichées converties en lbs/ft-in SANS modification des données stockées (vérif : dump AsyncStorage avant/après identique).
5. WeighInScreen : saisie 164.5 lbs acceptée (décimales), chart 30 j labellisé en lbs, la valeur synchronisée cloud reste en kg.
6. Le rythme hebdomadaire affiché sur l'écran cible et dans le plan personnalisé est en lb/week en imperial, et le calcul calorique (`macroTargets.ts`) produit le même résultat qu'avant pour un même profil (test de non-régression avec profil fixture).
7. `npx tsc --noEmit` + `npm test` verts ; `units.test.ts` couvre bornes (0, valeurs énormes, 11.6 in → report de pied, négatif rejeté).
8. Zéro occurrence de conversion inline hors `units.ts` (vérif : `grep -rn "2.2046\|0.4536\|2.54" apps/mobile/src` ne matche que `units.ts` et ses tests).

## Testing Plan

| Couche | Quoi | Count |
|---|---|---|
| Unit | `units.ts` : conversions, formats, report d'inches, round-trip stabilité | +12 |
| Unit | `unitPreferenceRepository` : défaut imperial, persistance | +2 |
| Unit | `onboardingProfile` : profil construit depuis saisie imperial = profil métrique attendu | +3 |
| Manuel | Parcours onboarding complet en imperial, toggle metric, weigh-in, share card | checklist |

## Rollback Plan

Revert du commit (la couche est additive). Cas extrême sans revert : forcer `metric` comme défaut dans `unitPreferenceRepository` (1 ligne) et publier en OTA.

## Effort Estimate

`units.ts` + tests ~45 min · préférence + toggle Settings ~30 min · Onboarding ~45 min · EditProfile/Profile/WeighIn ~45 min · affichages passifs + QA ~30 min. Total ~3 h.

## Files Reference

| Fichier | Changement |
|---|---|
| `apps/mobile/src/domain/units.ts` (+ test) | NOUVEAU — conversions et formats |
| `apps/mobile/src/storage/unitPreferenceRepository.ts` (+ test) | NOUVEAU — préférence persistée |
| `apps/mobile/src/screens/OnboardingScreen.tsx` | champs taille/poids/cible/rythme convertis |
| `apps/mobile/src/screens/EditProfileScreen.tsx`, `ProfileScreen.tsx`, `WeighInScreen.tsx` | saisie/affichage convertis |
| `apps/mobile/src/screens/SettingsScreen.tsx` | toggle Units |
| `apps/mobile/src/share/ShareCard.tsx`, `shareCardContent.ts` | formatWeight |

## Out of Scope

Portions en oz, température, distances. Migration de données (aucune). Localisation i18n complète (app reste en anglais).
