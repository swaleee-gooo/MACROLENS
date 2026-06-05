# MacroLens Vision Signals Service

This service is the production boundary for GPU-backed visual signals used by
`supabase/functions/analyze-meal/visionSignalsClient.ts`.

It intentionally does not pretend to run SAM2, GroundingDINO, or Depth Anything
unless real GPU model workers are configured. In strict mode, `/signals` returns
503 when no real worker endpoint is available.

## API

### `GET /health`

Returns configured providers and readiness failures.

### `POST /signals`

Request:

```json
{
  "imageUrl": "https://signed-image-url.example/photo.jpg"
}
```

Response shape:

```json
{
  "objectBoxes": [
    { "label": "salmon", "confidence": 0.91, "box": [0.1, 0.2, 0.4, 0.5] }
  ],
  "masks": [
    { "label": "rice", "confidence": 0.88, "areaFraction": 0.34 }
  ],
  "depthStats": {
    "provider": "depth-anything",
    "available": true,
    "confidence": 0.74,
    "relativeDepthP50": 0.42
  },
  "warnings": []
}
```

## Configuration

Required for real production mode:

```bash
VISION_SIGNALS_ALLOW_TEST_FALLBACK=false
SAM2_ENDPOINT_URL=https://sam2-worker.example/predict
GROUNDINGDINO_ENDPOINT_URL=https://grounding-worker.example/predict
DEPTH_ANYTHING_ENDPOINT_URL=https://depth-worker.example/predict
WORKER_AUTH_TOKEN=replace-with-worker-shared-token
```

Each worker receives `{"imageUrl": "..."}` and may return any subset of:
`objectBoxes`, `masks`, `depthStats`, and `warnings`.

## Local Development

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
VISION_SIGNALS_ALLOW_TEST_FALLBACK=true uvicorn app.main:app --host 0.0.0.0 --port 8080
```

The fallback mode is for contract tests only. Do not use it for production.

## Docker

```bash
docker build -t macrolens-vision-signals services/vision-signals
docker run --gpus all -p 8080:8080 \
  -e VISION_SIGNALS_ALLOW_TEST_FALLBACK=false \
  -e SAM2_ENDPOINT_URL=https://sam2-worker.example/predict \
  -e GROUNDINGDINO_ENDPOINT_URL=https://grounding-worker.example/predict \
  -e DEPTH_ANYTHING_ENDPOINT_URL=https://depth-worker.example/predict \
  -e WORKER_AUTH_TOKEN=replace-with-worker-shared-token \
  macrolens-vision-signals
```

## Supabase Wiring

After this service is deployed on a GPU host, configure the Edge Function:

```bash
npx supabase secrets set \
  VISION_SIGNALS_PROVIDER=external \
  VISION_SIGNALS_URL=https://vision-service.example/signals \
  --project-ref wyrfncoiubvdnrvdpads
```

The Supabase CLI command requires `SUPABASE_ACCESS_TOKEN` or `supabase login`.

