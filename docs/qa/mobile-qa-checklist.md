# MacroLens Mobile QA Checklist

Date: 2026-05-23
Tester: Idris
Device:
OS:
Expo Go version: client 1017756, SDK 54 initially reported; real-device flow later reached the app successfully
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
| Camera | Allow permission and take a food photo | Analyzing screen opens, then result screen opens | Pass | User reported that putting a photo into the flow opens the app pages correctly. Exact camera/gallery source still needs to be distinguished. |
| Gallery | Tap `Galerie` and choose a food image | Analyzing screen opens, then result screen opens | Watch | Photo input works, but exact source was not specified in the first real-device report. |
| Quick add | Tap `Quick add` | Manual meal result screen opens |  |  |
| Result | Inspect result screen | Meal name, calories, range, macros, confidence, items display | Pass | Result screen displays the current mock meal and now shows a `Mode demo` banner when analysis source is `mock`. |
| Correction | Tap `Portion +15%` | Calories and item quantity increase immediately | Pass on web | Browser smoke test confirmed the correction updates totals and item quantity. Needs confirmation on real phone. |
| Correction | Tap `Huile ajoutee` | A new oil item appears and fat increases |  |  |
| Correction | Remove an item when multiple items exist | Item disappears and totals recalculate |  |  |
| Save | Tap `Enregistrer le repas` | App returns home; daily summary updates | Pass | User reported the meal saves after adding a photo and tapping save. |
| Timeline | Tap `Voir tout` | Timeline opens and shows saved meal | Pass | User reported the saved meal appears in the Timeline. |
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
| QA-002 | P3 | Real phone and browser | Analyze different food photos | Different photos should eventually produce different meals and macros in live AI mode | Every photo currently returns `Poulet, riz et legumes` with the same macros | Fixed for MVP clarity by adding a visible `Mode demo` banner on mock analysis results. Live AI remains a later iteration. |

Severity:

- `P0`: app unusable or crashes.
- `P1`: core flow broken.
- `P2`: annoying UX or layout issue.
- `P3`: polish.

## QA Decision

Decision:

`Hold`: real-device core photo-to-timeline flow partially passed, but full QA remains incomplete.

Notes:

Project dependency check confirms the app is on Expo SDK 56. Web smoke testing works. Real-device testing now confirms photo input, result screen, save, and Timeline. Browser QA confirms `Mode demo` visibility and `Portion +15%` correction behavior. Merge remains blocked until the remaining checklist items are checked, especially persistence after app restart and separate camera/gallery behavior on phone.
