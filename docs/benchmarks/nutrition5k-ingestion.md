# Nutrition5k Ingestion

Nutrition5k is a local/offline benchmark input. Do not commit raw Nutrition5k imagery or extracted video frames to this repo.

The official dataset is public and large: the Google Research repository lists a Google Cloud Storage bucket and a `nutrition5k_dataset.tar.gz` download of 181.4 GB. Keep raw imagery in object storage, not git.

## Dataset Layout

Set `NUTRITION5K_ROOT` to the extracted `nutrition5k_dataset` folder. The ingestion script expects:

```text
nutrition5k_dataset/
  metadata/
    dish_metadata_cafe1.csv
    dish_metadata_cafe2.csv
  dish_ids/
    splits/
      rgb_train_ids.txt
      rgb_test_ids.txt
  imagery/
    realsense_overhead/
      dish_.../
        rgb.png
        depth_raw.png
    side_angles/
      dish_.../
```

The script writes a JSONL manifest with local paths. It does not copy images.

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
$env:NUTRITION5K_ROOT="D:\datasets\nutrition5k_dataset"
node scripts/ingest-nutrition5k.mjs --output=../../docs/benchmarks/nutrition5k/manifest.jsonl
```

## Off-PC / Object Storage Manifest

If the dataset has been mirrored to object storage with the same folder layout, add public or signed base URLs to the manifest:

```powershell
node scripts/ingest-nutrition5k.mjs `
  --root=D:\datasets\nutrition5k_dataset `
  --public-base-url=https://storage.example/macrolens/nutrition5k_dataset `
  --output=../../docs/benchmarks/nutrition5k/manifest.remote.jsonl
```

Each row will include:

- `imagePaths`: local paths used only while generating the manifest.
- `remoteSourcePaths`: original official `gs://nutrition5k_dataset/nutrition5k_dataset/...` paths.
- `imageUrls`: remote HTTPS URLs to use for live prediction.

For a true off-PC mirror, run the transfer from cloud infrastructure, not this workstation. Example with Google Cloud Storage:

```bash
gcloud storage rsync -r \
  gs://nutrition5k_dataset/nutrition5k_dataset \
  gs://YOUR_MACROLENS_BUCKET/nutrition5k_dataset
```

Supabase Storage can hold artifacts if the project plan has enough capacity, but 181.4 GB of raw imagery is usually better suited to GCS, S3, or R2. Supabase should store manifests, benchmark runs, and reports unless storage capacity and signed URL behavior are deliberately configured.

## Live Predictions From Remote URLs

Once `imageUrls.overheadRgb` exists in the manifest, create live predictions through the deployed Supabase function:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
node scripts/predict-nutrition5k-live.mjs `
  --manifest=../../docs/benchmarks/nutrition5k/manifest.remote.jsonl `
  --output=../../docs/benchmarks/nutrition5k/predictions-live.jsonl `
  --limit=50
```

Then score the predictions:

```powershell
node scripts/run-nutrition5k-benchmark.mjs `
  --manifest=../../docs/benchmarks/nutrition5k/manifest.remote.jsonl `
  --predictions=../../docs/benchmarks/nutrition5k/predictions-live.jsonl `
  --output=../../docs/benchmarks/nutrition5k/report-live.json `
  --limit=50
```

## Offline Report

After a local runner has produced prediction JSONL rows keyed by `id`, run:

```powershell
node scripts/run-nutrition5k-benchmark.mjs --manifest=../../docs/benchmarks/nutrition5k/manifest.jsonl --predictions=./nutrition5k-predictions.jsonl --limit=50
```

Prediction rows should look like:

```json
{"id":"dish_0000000001","provider":"openai","evidenceLevel":"ESTIMATED_VISUAL_ONLY","prediction":{"kcal":520,"massGrams":430,"kcalRange":{"min":450,"max":650}}}
```

## Warnings

Nutrition5k is useful because it has side views, RGB-D overhead imagery, ingredient mass, dish mass, calories, macros, official splits, and eval scripts. It is also biased toward a small set of California cafeteria foods, so benchmark findings should not be marketed as universal calorie accuracy.

Keep the existing `scripts/run-nutrition-benchmark.mjs` as the release gate for the curated MacroLens benchmark. Nutrition5k is a research/offline benchmark until image access, contamination policy, and provider costs are controlled for the run.
