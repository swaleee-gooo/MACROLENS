# MacroLens Project Control

Date: 2026-05-23
Branch: `codex/macrolens-mvp`
Status: MVP implemented, not merged

## Source Of Truth

Use these files in this order when making decisions:

1. Product design: `docs/superpowers/specs/2026-05-23-macrolens-design.md`
2. MVP implementation plan: `docs/superpowers/plans/2026-05-23-macrolens-mvp.md`
3. Real image pipeline plan: `docs/superpowers/plans/2026-05-23-real-image-analysis-pipeline.md`
4. Current implementation: `apps/mobile`
5. Backend contract: `supabase`

If a new idea conflicts with the spec, update the spec first. If a new technical step conflicts with the plan, write a new iteration plan before coding.

## Current State

The MVP is implemented as an Expo React Native app with:

- onboarding;
- home dashboard;
- camera and gallery entry points;
- quick-add fallback;
- mocked AI meal analysis;
- macro totals and calorie ranges;
- confidence labels;
- one-tap corrections;
- local meal persistence;
- timeline;
- Supabase schema and Edge Function contract.

Real-device QA status:

- Photo input reaches the result screen.
- The current mock analysis always returns `Poulet, riz et legumes`, which is expected before live AI integration.
- Mock results now display a `Mode demo` banner so users understand that the result is fixed test data.
- Saved photo meals appear in the Timeline after tapping save.
- Real-device QA confirms corrections and persistence.
- Browser QA confirms `Portion +15%` correction behavior and `Mode demo` visibility.
- Remaining watch item: distinguish camera and gallery as separate entry points in a later QA pass. This is not blocking the next integration plan.
- The next technical direction is now the real image analysis pipeline plan, with mock mode kept as the safe default until Supabase and OpenAI secrets are configured.
- Mobile now has a `mock`/`remote` analysis service selector. `mock` remains the default unless `EXPO_PUBLIC_ANALYSIS_MODE=remote` and Supabase public config are present.
- Remote mobile analysis now creates an anonymous Supabase session, uploads the image to private Storage, creates a short-lived signed URL, and invokes `analyze-meal`. If the remote path fails, the app falls back to mock analysis so the photo flow remains usable.
- Supabase migrations are applied on project `wyrfncoiubvdnrvdpads`: MacroLens tables exist and `meal-photos` is a private bucket.
- The Edge Function `analyze-meal` is deployed on project `wyrfncoiubvdnrvdpads` with JWT verification enabled.
- The Edge Function now has an OpenAI Responses API branch behind `OPENAI_API_KEY`; without the secret it still returns the existing mock server response.
- Local Expo config exists at `apps/mobile/.env.local` with public Supabase config and `EXPO_PUBLIC_ANALYSIS_MODE=remote`; this file is git-ignored.
- Live pipeline smoke test passed after enabling Anonymous Sign-Ins and adding the rotated OpenAI secret in Supabase: anonymous auth, private upload, signed URL, Edge Function/OpenAI analysis, and cleanup all returned OK.
- Smoke test result: `Spaghetti alla Carbonara (2 servings)`, source `estimated`, 770 kcal, medium confidence, 4 items.
- Mobile dependencies are aligned to Expo SDK 54 so the current Expo Go app can open the project.

Verified commands:

- `npm test`
- `npx tsc --noEmit`
- `npx expo install --check`
- `npm run web -- --port 8081`
- `npx expo start --lan --clear`

Manual smoke test completed:

- onboarding to home;
- quick-add;
- correction +15 percent;
- save meal;
- dashboard summary update;
- timeline display.

## Known Concerns

- `npm audit` reports 10 moderate vulnerabilities inherited through Expo dependencies. The proposed fix downgrades Expo to an incompatible major version, so do not apply `npm audit fix --force`.
- Expo Web logs a React Native DevTools fallback warning because the machine lacked disk space while unpacking DevTools. The app still served with HTTP 200.
- The AI analysis is mocked. Do not claim production nutrition accuracy yet.
- Supabase is code-wired for remote analysis; migrations and Edge Function deployment have been applied to the live project.
- Remote analysis mode must use Supabase anonymous auth for the first live test and must not expose `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to Expo.
- A key pasted into chat earlier should remain treated as exposed and revoked; the live project uses the new rotated secret added in Supabase.
- Deno is not installed locally, so the Edge Function has not been type-checked or served with Deno on this machine.
- Expo SDK 56 was incompatible with the installed Expo Go client, so the project was downgraded and verified on SDK 54.

## Leadership Rules

1. Keep the branch as-is until mobile device QA notes are committed.
2. Do not merge to `master` until verification commands pass after QA notes are committed.
3. Do not wire live OpenAI until there is a nutrition benchmark.
4. Do not build growth/paywall features until the core scan result feels trustworthy.
5. Every iteration must end with tests, typecheck, Expo dependency check, and one manual smoke test.
6. Prefer narrow iteration plans over broad rewrites.

## Next Iteration: Mobile QA And Nutrition Benchmark

Goal: prove the MVP works on real devices and create the benchmark needed before real AI integration.

Iteration files:

- Plan: `docs/superpowers/plans/2026-05-23-mobile-qa-nutrition-benchmark.md`
- Mobile QA checklist: `docs/qa/mobile-qa-checklist.md`
- Nutrition benchmark: `docs/benchmarks/macrolens-nutrition-benchmark-v1.md`

### Track A: Mobile QA And Polish

Owner role: Mobile QA and polish agent.

Prompt:

```text
Test MacroLens on a real mobile device through Expo Go. Verify onboarding, camera, gallery, quick-add, correction chips, save flow, daily summary, and timeline. Report blocking bugs, UX friction, layout problems, and the smallest fixes required before merging the MVP branch.
```

Done when:

- real device test notes exist;
- blocking camera/gallery issues are fixed;
- no text overlaps on a normal phone viewport;
- quick-add remains available if camera permission fails;
- verification commands still pass.

### Track B: Nutrition Accuracy Benchmark

Owner role: AI Nutrition Accuracy agent.

Prompt:

```text
Create a benchmark for MacroLens with 50 French and European meal cases. Include meal name, photo requirement or placeholder description, expected calories, protein, carbs, fat, fiber when practical, acceptable error range, confidence expectation, and likely failure modes such as hidden oil, sauce, portion ambiguity, bakery items, and mixed dishes.
```

Done when:

- benchmark file exists in `docs/benchmarks`;
- each case has expected macro ranges;
- cases include common French foods and difficult mixed meals;
- scoring rules define accuracy, confidence calibration, and correction usefulness.

Current status:

- Benchmark v1 has been created with 50 cases.
- It must be used as the gate before live OpenAI nutrition claims.

## Later Iterations

### Iteration 2: Supabase And Real Image Pipeline

Start only after Track A passes.

Scope:

- Supabase auth;
- image upload to Supabase Storage;
- meal persistence in Postgres;
- app repository that can switch between local and Supabase storage.

Plan:

- `docs/superpowers/plans/2026-05-23-real-image-analysis-pipeline.md`

Current execution note:

- Mobile env selection and anonymous Supabase upload/invoke wiring are implemented.
- Keep `EXPO_PUBLIC_ANALYSIS_MODE=mock` as the default.
- Keep `remote` enabled locally while testing the live Supabase pipeline.
- Next execution step: test from Expo Go with a real meal photo and record the first benchmark row before relying on nutrition accuracy claims.

### Iteration 3: OpenAI Vision Structured Analysis

Start only after Track B exists.

Scope:

- Edge Function calls OpenAI vision model;
- response validated against strict schema;
- unsafe or invalid model output becomes a recoverable error;
- no API key in mobile code.

### Iteration 4: Nutrition Data Sources

Start after Iteration 3 has a working model response.

Scope:

- Open Food Facts lookup for packaged and European products;
- USDA FoodData Central lookup for generic foods;
- source ids stored per item;
- deterministic macro calculation remains backend-owned.

### Iteration 5: Growth And Monetization

Start only after the core flow is trusted.

Scope:

- App Store positioning;
- paywall timing;
- shareable daily macro card;
- onboarding copy;
- acquisition hooks.

## Merge Gate For Current MVP

Merge `codex/macrolens-mvp` into `master` only when:

- Expo Go test passes on a real phone;
- `npm test` passes;
- `npx tsc --noEmit` passes;
- `npx expo install --check` passes;
- known audit and disk-space concerns are documented;
- no new uncommitted files remain.

## Commands

Run the app:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npx expo start
```

Run verification:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```
