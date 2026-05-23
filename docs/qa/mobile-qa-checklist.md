# MacroLens Mobile QA Checklist

Date: 2026-05-23
Tester: Idris
Device:
OS:
Expo Go version: client 1017756, SDK 54
Branch: `codex/macrolens-mvp`

## Setup

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start
```

Scan the QR code with Expo Go.

## Result Key

- `Pass`: works as expected.
- `Fail`: reproducible bug.
- `Blocked`: cannot test because of setup, device, or dependency issue.
- `Watch`: usable, but should be improved soon.

## Core Flow

| Area | Step | Expected Result | Result | Notes |
| --- | --- | --- | --- | --- |
| Launch | Open app in Expo Go | Onboarding screen displays `MacroLens` and four goals |  |  |
| Onboarding | Tap `Perdre du gras` | Home screen opens |  |  |
| Home | Review macro summary | Calories, proteines, glucides, lipides show zero on clean install |  |  |
| Camera | Tap `Scanner un repas` | Camera permission prompt or camera opens |  |  |
| Camera | Deny permission if prompted | App does not crash; user can use gallery or quick-add |  |  |
| Camera | Allow permission and take a food photo | Analyzing screen opens, then result screen opens |  |  |
| Gallery | Tap `Galerie` and choose a food image | Analyzing screen opens, then result screen opens |  |  |
| Quick add | Tap `Quick add` | Manual meal result screen opens |  |  |
| Result | Inspect result screen | Meal name, calories, range, macros, confidence, items display |  |  |
| Correction | Tap `Portion +15%` | Calories and item quantity increase immediately |  |  |
| Correction | Tap `Huile ajoutee` | A new oil item appears and fat increases |  |  |
| Correction | Remove an item when multiple items exist | Item disappears and totals recalculate |  |  |
| Save | Tap `Enregistrer le repas` | App returns home; daily summary updates |  |  |
| Timeline | Tap `Voir tout` | Timeline opens and shows saved meal |  |  |
| Reopen | Tap saved meal | Result screen opens for that meal |  |  |
| Persistence | Fully close and reopen app | Saved meals remain visible |  |  |

## Layout Checks

| View | Check | Expected Result | Result | Notes |
| --- | --- | --- | --- | --- |
| Onboarding | Small phone width | No text overlap; goal cards remain tappable |  |  |
| Home | Summary pills | Text fits inside metric cards |  |  |
| Home | Action buttons | Camera, gallery, quick-add are visible without confusion |  |  |
| Result | Macro pills | All macro cards wrap cleanly |  |  |
| Result | Correction chips | Buttons are tappable and do not overlap |  |  |
| Result | Food item rows | Long food names wrap or truncate acceptably |  |  |
| Timeline | Saved meal list | Cards remain readable and tappable |  |  |

## Error And Recovery Checks

| Scenario | Expected Result | Result | Notes |
| --- | --- | --- | --- |
| Camera permission denied | User can still use gallery or quick-add |  |  |
| Gallery canceled | App stays on home without error |  |  |
| Camera canceled | App stays on home without error |  |  |
| App reload during empty state | Onboarding/home does not crash |  |  |
| App reload after saved meal | Meal repository loads without crash |  |  |

## Issue Log

| ID | Severity | Device | Steps | Expected | Actual | Fix Needed |
| --- | --- | --- | --- | --- | --- | --- |
| QA-001 | P1 | Real phone, details pending | Open MacroLens in Expo Go | Expo Go loads the app for real-device QA | Expo Go client reports SDK 54 while the project uses Expo SDK 56, so real-device QA cannot proceed in that client | Update/reinstall Expo Go to an SDK 56-compatible version, or explicitly choose a project downgrade/dev-client path |

Severity:

- `P0`: app unusable or crashes.
- `P1`: core flow broken.
- `P2`: annoying UX or layout issue.
- `P3`: polish.

## QA Decision

Decision:

`Hold`: real-device QA is blocked by Expo Go SDK mismatch.

Notes:

Project dependency check confirms the app is on Expo SDK 56. Web smoke testing works, but merge remains blocked until Expo Go can run the SDK 56 app or the project strategy changes.
