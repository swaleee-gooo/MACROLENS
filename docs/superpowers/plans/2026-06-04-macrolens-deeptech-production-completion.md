# MacroLens Deeptech Production Completion Plan

## Goal

Make the current MacroLens stack as production-real as this environment allows: deploy the Supabase backend changes, verify the live analysis pipeline, add a deployable real vision-signals service boundary for GPU models, make the Nutrition5k benchmark path operational off the mobile app path, and identify any remaining hard blockers that require credentials, hardware, provider setup, or physical devices.

## Constraints

- Do not revert unrelated dirty worktree changes.
- Do not claim ARKit/ARCore, SAM2, GroundingDINO, Depth Anything, or Nutrition5k full benchmark are real unless there is an actual deployed/runtime-backed implementation.
- Prefer existing project patterns and keep edits scoped.
- Use Supabase project `wyrfncoiubvdnrvdpads` only after confirming it is the live MacroLens project.
- Do not store the full Nutrition5k dataset in git or on the user's PC as the durable source.
- Validate with existing test/typecheck/build commands where available.

## Execution Plan

### 1. Confirm Production State

- Inspect Supabase projects, deployed functions, and migrations.
- Confirm which Supabase project is live for MacroLens.
- Inspect EAS production env enough to verify the app points at the same Supabase project.

Done when the live project and drift between repo and production backend are known.

### 2. Deploy Supabase Backend

- Apply pending migrations required by the latest app code:
  - correction-type extension migration if missing.
  - MetaboProof feedback tables migration if missing.
- Deploy the updated `analyze-meal` Edge Function from `supabase/functions/analyze-meal`.
- Verify the deployed function shape by fetching the deployed function metadata and running a non-destructive smoke path when credentials allow it.

Done when the live Supabase project has the schema and function version needed by the TestFlight app.

### 3. Add Real Vision-Signals Service Package

- Add a separate service under `services/vision-signals` with:
  - HTTP API compatible with `VISION_SIGNALS_URL`.
  - `/health` and `/signals` endpoints.
  - pluggable adapters for segmentation, grounding, and depth providers.
  - GPU-model configuration through environment variables.
  - Docker packaging and a short deployment guide.
- Make the service fail explicitly when required real model configuration is absent, unless a test-only fallback is enabled.

Done when the repo contains a runnable/deployable service boundary that can host SAM2/GroundingDINO/Depth Anything on a GPU provider without changing the app contract.

### 4. Wire Supabase to External Vision Service

- Verify the Edge Function calls the external vision client only when `VISION_SIGNALS_URL` is configured.
- Document and, if tool support is available, set required Supabase function secrets for the production project.
- Confirm the backend refuses to present GPU signals as real when no service is configured.

Done when production behavior is honest and ready to switch to the real GPU service by setting secrets.

### 5. Nutrition5k Off-Device Benchmark Path

- Inspect the existing Nutrition5k ingestion and reporting scripts.
- Add an off-device manifest/prediction workflow if missing, with storage-target configuration rather than local-only assumptions.
- Create documentation for hosting Nutrition5k artifacts in object storage or Supabase metadata tables without committing raw data.
- Run the available benchmark tests and any live curated benchmark that existing credentials allow.

Done when the benchmark path is executable and durable, and any missing external dataset/provider action is explicit.

### 6. Native ARKit/ARCore Reality Check

- Inspect the Expo/native project structure.
- Determine whether a native module can be added in this repo without generating unsupported native projects on Windows.
- Add only safe contract-level code or documentation if physical-device/native build constraints prevent a real implementation here.

Done when the app cannot misrepresent Expo Camera as AR depth, and the exact native-module work needed for real device depth is recorded.

### 7. Verification and Release

- Run focused tests for changed code.
- Run full mobile tests/typecheck if mobile/backend shared code changed.
- Submit a new TestFlight build only if app code changed and the build can be created from this environment.

Done when verified changes are either live in backend/service code or accurately blocked by unavailable external infrastructure.

## Known Hard Boundaries

- A real SAM2/GroundingDINO/Depth Anything runtime requires a GPU host and provider credentials. This environment has network access, but no known GPU hosting connector or credentials.
- Real ARKit/ARCore depth requires native iOS/Android modules and physical device validation. Windows cannot run Xcode or validate iPhone ARKit depth locally.
- Nutrition5k full ingestion requires legal access to the dataset source and object storage capacity. Supabase is suitable for manifests/results; raw imagery may require external object storage depending on plan limits.
