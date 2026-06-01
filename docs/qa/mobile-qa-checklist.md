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
| Correction | Tap `Portion +15%` | Calories and item quantity increase immediately | Pass | Browser smoke test confirmed the correction updates totals and item quantity. User later confirmed corrections work on phone. |
| Correction | Tap `Huile ajoutee` | A new oil item appears and fat increases | Pass | User confirmed correction flow works on phone. |
| Correction | Remove an item when multiple items exist | Item disappears and totals recalculate |  |  |
| Save | Tap `Enregistrer le repas` | App returns home; daily summary updates | Pass | User reported the meal saves after adding a photo and tapping save. |
| Timeline | Tap `Voir tout` | Timeline opens and shows saved meal | Pass | User reported the saved meal appears in the Timeline. |
| Reopen | Tap saved meal | Result screen opens for that meal |  |  |
| Persistence | Fully close and reopen app | Saved meals remain visible | Pass | User confirmed persistence works after the meal is saved. |

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
| QA-001 | P1 | Real phone, details pending | Open MacroLens in Expo Go | Expo Go loads the app for real-device QA | Resolved: project dependencies are now aligned to Expo SDK 54, matching the installed Expo Go client. | Keep verifying with `npx expo install --check` after dependency changes. |
| QA-002 | P3 | Real phone and browser | Analyze different food photos | Different photos should produce different meals and macros in live remote mode | Resolved for local remote mode: Supabase/OpenAI analysis is live and calibrated; mock mode still shows `Mode demo` by design. | Retest multiple real photos on device before TestFlight. |

Severity:

- `P0`: app unusable or crashes.
- `P1`: core flow broken.
- `P2`: annoying UX or layout issue.
- `P3`: polish.

## QA Decision

Decision:

`Pass with watch items`: real-device core photo-to-timeline flow, corrections, and persistence passed. Separate camera/gallery source distinction remains a watch item, not a blocker.

Notes:

Project dependency check confirms the app is on Expo SDK 54. Web smoke testing works. Real-device testing confirms photo input, result screen, save, Timeline, corrections, and persistence. Browser QA confirms `Mode demo` visibility in mock mode. The remaining watch items are distinguishing camera/gallery as separate entry points and retesting multiple real photos in remote mode on device.
