# Real Image Analysis Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed mock-only analysis path with a Supabase-backed image analysis pipeline that can call OpenAI Vision from an Edge Function, while keeping the local mock fallback available.

**Architecture:** The mobile app gets a typed analysis service selector: local mock when Supabase env vars are missing, remote Supabase when configured. Supabase owns image storage, secret OpenAI access, schema validation, and persistence; the mobile app never receives a service role key or OpenAI API key.

**Tech Stack:** Expo React Native, TypeScript, Zod, Supabase Auth/Storage/Edge Functions/Postgres, OpenAI Responses API with image input and Structured Outputs, existing MacroLens benchmark.

---

## Docs Consulted

- Supabase Edge Function environment variables and secrets: `https://supabase.com/docs/guides/functions/secrets`
- Supabase Edge Functions overview: `https://supabase.com/docs/guides/functions`
- Supabase Storage from Edge Functions: `https://supabase.com/docs/guides/functions/storage-caching`
- OpenAI Responses API: `https://platform.openai.com/docs/api-reference/responses`
- OpenAI Images and Vision guide: `https://platform.openai.com/docs/guides/images?api-mode=responses`
- OpenAI Structured Outputs guide: `https://platform.openai.com/docs/guides/structured-outputs?lang=javascript`

## File Structure

- `apps/mobile/.env.example`: public mobile Supabase configuration names.
- `apps/mobile/src/config/env.ts`: reads and validates public Expo env vars.
- `apps/mobile/src/supabase/client.ts`: creates the browser-safe Supabase client.
- `apps/mobile/src/supabase/session.ts`: ensures a Supabase anonymous auth session before remote uploads.
- `apps/mobile/src/analysis/remoteAnalysisService.ts`: uploads images, creates a short-lived signed URL, and invokes the Edge Function.
- `apps/mobile/src/analysis/analysisServiceFactory.ts`: selects remote or mock analysis.
- `apps/mobile/App.tsx`: uses the factory instead of directly constructing the mock service.
- `supabase/functions/analyze-meal/index.ts`: real OpenAI structured analysis with mock fallback.
- `supabase/functions/analyze-meal/mealSchema.ts`: shared Edge Function response schema.
- `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`: OpenAI request and response parsing.
- `supabase/functions/analyze-meal/nutritionEstimator.ts`: deterministic macro fallback calculations.
- `supabase/migrations/*`: storage bucket and policy migration if the project does not already have one.
- `docs/benchmarks/macrolens-nutrition-benchmark-results-v1.md`: first results file after live AI is available.

## Task 1: Mobile Environment And Service Selection

**Files:**
- Create: `apps/mobile/.env.example`
- Create: `apps/mobile/src/config/env.ts`
- Create: `apps/mobile/src/config/env.test.ts`
- Create: `apps/mobile/src/analysis/analysisServiceFactory.ts`
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Add mobile env example**

Create `apps/mobile/.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ANALYSIS_MODE=mock
```

Rules:

- `EXPO_PUBLIC_ANALYSIS_MODE=mock` keeps local development working without Supabase.
- `EXPO_PUBLIC_ANALYSIS_MODE=remote` enables Supabase Edge Function analysis.
- Only publishable Supabase values can be exposed with `EXPO_PUBLIC_`.

- [ ] **Step 2: Write env tests**

Create `apps/mobile/src/config/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveAppEnv } from './env';

describe('resolveAppEnv', () => {
  it('defaults to mock mode when no Supabase values are present', () => {
    expect(resolveAppEnv({})).toEqual({
      analysisMode: 'mock',
      supabaseUrl: null,
      supabaseAnonKey: null,
    });
  });

  it('allows remote mode when Supabase values are present', () => {
    expect(
      resolveAppEnv({
        EXPO_PUBLIC_ANALYSIS_MODE: 'remote',
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_123',
      }),
    ).toEqual({
      analysisMode: 'remote',
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'sb_publishable_123',
    });
  });

  it('falls back to mock mode when remote mode is missing credentials', () => {
    expect(resolveAppEnv({ EXPO_PUBLIC_ANALYSIS_MODE: 'remote' }).analysisMode).toBe('mock');
  });
});
```

- [ ] **Step 3: Implement env resolver**

Create `apps/mobile/src/config/env.ts`:

```ts
export type AnalysisMode = 'mock' | 'remote';

export type AppEnv = {
  analysisMode: AnalysisMode;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

type EnvInput = Record<string, string | undefined>;

export function resolveAppEnv(input: EnvInput): AppEnv {
  const requestedMode = input.EXPO_PUBLIC_ANALYSIS_MODE === 'remote' ? 'remote' : 'mock';
  const supabaseUrl = input.EXPO_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabaseAnonKey = input.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  const canUseRemote = requestedMode === 'remote' && supabaseUrl !== null && supabaseAnonKey !== null;

  return {
    analysisMode: canUseRemote ? 'remote' : 'mock',
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const appEnv = resolveAppEnv({
  EXPO_PUBLIC_ANALYSIS_MODE: process.env.EXPO_PUBLIC_ANALYSIS_MODE,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
```

- [ ] **Step 4: Add analysis service factory**

Create `apps/mobile/src/analysis/analysisServiceFactory.ts`:

```ts
import type { AnalysisService } from './analysisSchema';
import { createMockAnalysisService } from './mockAnalysisService';
import { createRemoteAnalysisService } from './remoteAnalysisService';
import type { AppEnv } from '../config/env';

export function createAnalysisService(env: AppEnv): AnalysisService {
  if (env.analysisMode === 'remote' && env.supabaseUrl && env.supabaseAnonKey) {
    return createRemoteAnalysisService({
      supabaseUrl: env.supabaseUrl,
      supabaseAnonKey: env.supabaseAnonKey,
    });
  }

  return createMockAnalysisService();
}
```

- [ ] **Step 5: Wire the factory in App**

Modify `apps/mobile/App.tsx`:

```ts
import { createAnalysisService } from './src/analysis/analysisServiceFactory';
import { appEnv } from './src/config/env';
```

Replace:

```ts
const analysisService = useMemo(() => createMockAnalysisService(), []);
```

With:

```ts
const analysisService = useMemo(() => createAnalysisService(appEnv), []);
```

Remove the now-unused `createMockAnalysisService` import.

- [ ] **Step 6: Run verification**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile
git commit -m "feat: add analysis service selection"
```

## Task 2: Remote Mobile Analysis Service

**Files:**
- Create: `apps/mobile/src/supabase/client.ts`
- Create: `apps/mobile/src/supabase/session.ts`
- Create: `apps/mobile/src/analysis/remoteAnalysisService.ts`
- Create: `apps/mobile/src/analysis/remoteAnalysisService.test.ts`

- [ ] **Step 1: Create Supabase client helper**

Create `apps/mobile/src/supabase/client.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export function createMacroLensSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
  });
}
```

- [ ] **Step 2: Create anonymous session helper**

Create `apps/mobile/src/supabase/session.ts`:

```ts
type SessionLike = { user: { id: string } } | null;

type SupabaseAuthLike = {
  getSession(): Promise<{ data: { session: SessionLike }; error: unknown }>;
  signInAnonymously(): Promise<{ data: { session: SessionLike; user: { id: string } | null }; error: unknown }>;
};

export async function ensureAnonymousUserId(auth: SupabaseAuthLike): Promise<string> {
  const existingSession = await auth.getSession();
  if (existingSession.error) {
    throw new Error('auth_session_lookup_failed');
  }

  if (existingSession.data.session?.user.id) {
    return existingSession.data.session.user.id;
  }

  const anonymousSession = await auth.signInAnonymously();
  if (anonymousSession.error) {
    throw new Error('anonymous_auth_failed');
  }

  const userId = anonymousSession.data.session?.user.id ?? anonymousSession.data.user?.id;
  if (!userId) {
    throw new Error('anonymous_user_missing');
  }

  return userId;
}
```

Remote mode requires Supabase Anonymous Sign-Ins to be enabled for the project. Keep `persistSession: false` for this iteration to avoid introducing a React Native session-storage dependency; account continuity and cloud timeline persistence are handled in the following auth iteration.

- [ ] **Step 3: Write remote service tests**

Create `apps/mobile/src/analysis/remoteAnalysisService.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createRemoteAnalysisService } from './remoteAnalysisService';

describe('createRemoteAnalysisService', () => {
  it('uploads the image and invokes analyze-meal', async () => {
    const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const signInAnonymously = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'auth-user' } }, user: { id: 'auth-user' } },
      error: null,
    });
    const upload = vi.fn().mockResolvedValue({ data: { path: 'auth-user/test.jpg' }, error: null });
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://cdn.example/test.jpg?token=signed' },
      error: null,
    });
    const invoke = vi.fn().mockResolvedValue({
      data: {
        meal: {
          id: 'meal-1',
          userId: 'auth-user',
          imageUri: 'https://cdn.example/test.jpg?token=signed',
          capturedAt: '2026-05-23T12:00:00.000Z',
          mealName: 'Test meal',
          caloriesEstimate: 100,
          caloriesLow: 85,
          caloriesHigh: 115,
          proteinG: 10,
          carbsG: 10,
          fatG: 3,
          fiberG: 2,
          confidence: 'medium',
          notes: '',
          source: 'estimated',
          items: [
            {
              id: 'item-1',
              mealId: 'meal-1',
              name: 'Test item',
              canonicalFoodName: 'test item',
              estimatedQuantity: 100,
              unit: 'g',
              calories: 100,
              proteinG: 10,
              carbsG: 10,
              fatG: 3,
              fiberG: 2,
              confidence: 'medium',
              dataSource: 'estimated',
              sourceFoodId: null,
            },
          ],
        },
        uncertaintyReasons: [],
        correctionSuggestions: [],
      },
      error: null,
    });

    const service = createRemoteAnalysisService(
      { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'sb_publishable_123' },
      {
        auth: { getSession, signInAnonymously },
        storage: { from: () => ({ upload, createSignedUrl }) },
        functions: { invoke },
      },
    );

    const result = await service.analyzeMealPhoto({ imageUri: 'file://meal.jpg', userId: 'local-user' });

    expect(upload).toHaveBeenCalledOnce();
    expect(createSignedUrl).toHaveBeenCalledWith('auth-user/test.jpg', 600);
    expect(invoke).toHaveBeenCalledWith('analyze-meal', {
      body: { imageUrl: 'https://cdn.example/test.jpg?token=signed', userId: 'auth-user' },
    });
    expect(result.meal.mealName).toBe('Test meal');
    expect(result.meal.imageUri).toBe('file://meal.jpg');
  });
});
```

- [ ] **Step 4: Implement remote analysis service**

Create `apps/mobile/src/analysis/remoteAnalysisService.ts`:

```ts
import { analysisResultSchema, type AnalysisService } from './analysisSchema';
import { createMacroLensSupabaseClient } from '../supabase/client';
import { ensureAnonymousUserId } from '../supabase/session';

type RemoteConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type SupabaseLike = {
  auth: {
    getSession(): Promise<{ data: { session: { user: { id: string } } | null }; error: unknown }>;
    signInAnonymously(): Promise<{ data: { session: { user: { id: string } } | null; user: { id: string } | null }; error: unknown }>;
  };
  storage: {
    from(bucket: string): {
      upload(path: string, body: Blob | ArrayBuffer, options: { contentType: string; upsert: boolean }): Promise<{ data: { path: string } | null; error: unknown }>;
      createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
  functions: {
    invoke(name: string, options: { body: unknown }): Promise<{ data: unknown; error: unknown }>;
  };
};

async function imageUriToBlob(imageUri: string): Promise<Blob> {
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error('image_fetch_failed');
  }
  return response.blob();
}

export function createRemoteAnalysisService(config: RemoteConfig, client?: SupabaseLike): AnalysisService {
  const supabase = client ?? createMacroLensSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);

  return {
    async analyzeMealPhoto({ imageUri }) {
      const authUserId = await ensureAnonymousUserId(supabase.auth);
      const imageBlob = await imageUriToBlob(imageUri);
      const objectPath = `${authUserId}/${Date.now()}.jpg`;
      const bucket = supabase.storage.from('meal-photos');
      const uploadResult = await bucket.upload(objectPath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (uploadResult.error || !uploadResult.data) {
        throw new Error('image_upload_failed');
      }

      const signedUrlResult = await bucket.createSignedUrl(uploadResult.data.path, 10 * 60);
      if (signedUrlResult.error || !signedUrlResult.data) {
        throw new Error('image_signed_url_failed');
      }

      const functionResult = await supabase.functions.invoke('analyze-meal', {
        body: { imageUrl: signedUrlResult.data.signedUrl, userId: authUserId },
      });

      if (functionResult.error) {
        throw new Error('analysis_function_failed');
      }

      const analysis = analysisResultSchema.parse(functionResult.data);
      return {
        ...analysis,
        meal: {
          ...analysis.meal,
          imageUri,
        },
      };
    },
  };
}
```

- [ ] **Step 5: Run verification**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add apps/mobile
git commit -m "feat: add remote meal analysis service"
```

## Task 3: Storage Bucket And Policies

**Files:**
- Create via Supabase CLI: `supabase/migrations/<generated>_create_meal_photo_storage.sql`

- [ ] **Step 1: Create migration file with CLI**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
npx supabase migration new create_meal_photo_storage
```

Expected: Supabase CLI prints the migration path.

- [ ] **Step 2: Fill the migration**

Use the generated migration file and insert:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload their own meal photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users read their own meal photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

The object path is `${auth.uid()}/${timestamp}.jpg` inside the private `meal-photos` bucket; do not prefix the path with `meal-photos/` because the bucket name is already part of the storage URL. The mobile app creates a 10-minute signed URL and sends that temporary URL to the Edge Function for OpenAI image access.

- [ ] **Step 3: Verify locally when Supabase local stack is available**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
npx supabase db reset
```

Expected: migrations apply without SQL errors.

- [ ] **Step 4: Commit**

Run:

```powershell
git add supabase/migrations
git commit -m "feat: add meal photo storage bucket"
```

## Task 4: OpenAI Edge Function Analysis

**Files:**
- Create: `supabase/functions/analyze-meal/mealSchema.ts`
- Create: `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`
- Create: `supabase/functions/analyze-meal/nutritionEstimator.ts`
- Modify: `supabase/functions/analyze-meal/index.ts`

- [ ] **Step 1: Create Edge Function schema**

Create `supabase/functions/analyze-meal/mealSchema.ts`:

```ts
export const mealAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['mealName', 'items', 'confidence', 'uncertaintyReasons'],
  properties: {
    mealName: { type: 'string' },
    confidence: { enum: ['high', 'medium', 'low'] },
    uncertaintyReasons: {
      type: 'array',
      items: { type: 'string' },
    },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'canonicalFoodName', 'estimatedQuantity', 'unit', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'confidence'],
        properties: {
          name: { type: 'string' },
          canonicalFoodName: { type: 'string' },
          estimatedQuantity: { type: 'number' },
          unit: { type: 'string' },
          calories: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
          fiberG: { type: 'number' },
          confidence: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
} as const;
```

- [ ] **Step 2: Create OpenAI analyzer**

Create `supabase/functions/analyze-meal/openaiMealAnalyzer.ts`:

```ts
import { mealAnalysisJsonSchema } from './mealSchema.ts';

export type RawMealAnalysis = {
  mealName: string;
  confidence: 'high' | 'medium' | 'low';
  uncertaintyReasons: string[];
  items: Array<{
    name: string;
    canonicalFoodName: string;
    estimatedQuantity: number;
    unit: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
};

export async function analyzeMealWithOpenAI(imageUrl: string, openAiKey: string): Promise<RawMealAnalysis> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${openAiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Analyze this food photo for a consumer macro tracker. Estimate visible foods, portions, calories, protein, carbs, fat, fiber, confidence, and uncertainty reasons. Be honest about hidden oil, sauces, and portion ambiguity.',
            },
            {
              type: 'input_image',
              image_url: imageUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'macrolens_meal_analysis',
          schema: mealAnalysisJsonSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_request_failed_${response.status}`);
  }

  const data = await response.json();
  const outputText = data.output_text;
  if (typeof outputText !== 'string') {
    throw new Error('openai_missing_output_text');
  }

  return JSON.parse(outputText) as RawMealAnalysis;
}
```

- [ ] **Step 3: Create nutrition estimator**

Create `supabase/functions/analyze-meal/nutritionEstimator.ts`:

```ts
import type { RawMealAnalysis } from './openaiMealAnalyzer.ts';

function roundWhole(value: number): number {
  return Math.round(value);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

export function toMacroLensResponse(raw: RawMealAnalysis, imageUrl: string, userId: string) {
  const mealId = crypto.randomUUID();
  const items = raw.items.map((item, index) => ({
    id: `${mealId}-item-${index + 1}`,
    mealId,
    name: item.name,
    canonicalFoodName: item.canonicalFoodName,
    estimatedQuantity: roundMacro(item.estimatedQuantity),
    unit: item.unit,
    calories: roundWhole(item.calories),
    proteinG: roundMacro(item.proteinG),
    carbsG: roundMacro(item.carbsG),
    fatG: roundMacro(item.fatG),
    fiberG: roundMacro(item.fiberG),
    confidence: item.confidence,
    dataSource: 'estimated',
    sourceFoodId: null,
  }));

  const calories = roundWhole(items.reduce((sum, item) => sum + item.calories, 0));
  const proteinG = roundMacro(items.reduce((sum, item) => sum + item.proteinG, 0));
  const carbsG = roundMacro(items.reduce((sum, item) => sum + item.carbsG, 0));
  const fatG = roundMacro(items.reduce((sum, item) => sum + item.fatG, 0));
  const fiberG = roundMacro(items.reduce((sum, item) => sum + item.fiberG, 0));

  return {
    meal: {
      id: mealId,
      userId,
      imageUri: imageUrl,
      capturedAt: new Date().toISOString(),
      mealName: raw.mealName,
      caloriesEstimate: calories,
      caloriesLow: roundWhole(calories * 0.85),
      caloriesHigh: roundWhole(calories * 1.15),
      proteinG,
      carbsG,
      fatG,
      fiberG,
      confidence: raw.confidence,
      notes: 'Estimated by AI vision. Nutrition data source integration comes next.',
      source: 'estimated',
      items,
    },
    uncertaintyReasons: raw.uncertaintyReasons,
    correctionSuggestions: [
      { id: 'portion-up', label: 'Portion +15%', correctionType: 'portion_up', targetItemId: null },
      { id: 'portion-down', label: 'Portion -15%', correctionType: 'portion_down', targetItemId: null },
      { id: 'add-oil', label: 'Huile ajoutee', correctionType: 'add_oil', targetItemId: null },
      { id: 'add-sauce', label: 'Sauce ajoutee', correctionType: 'add_sauce', targetItemId: null },
    ],
  };
}
```

- [ ] **Step 4: Wire Edge Function**

Modify `supabase/functions/analyze-meal/index.ts` so the `OPENAI_API_KEY` branch calls:

```ts
import { analyzeMealWithOpenAI } from './openaiMealAnalyzer.ts';
import { toMacroLensResponse } from './nutritionEstimator.ts';
```

Replace the current `501` response with:

```ts
try {
  const rawAnalysis = await analyzeMealWithOpenAI(payload.imageUrl, openAiKey);
  return jsonResponse(toMacroLensResponse(rawAnalysis, payload.imageUrl, payload.userId));
} catch (error) {
  return jsonResponse(
    {
      error: 'analysis_failed',
      message: error instanceof Error ? error.message : 'unknown_error',
    },
    502,
  );
}
```

- [ ] **Step 5: Serve function locally with secrets**

Run only after a Supabase project and OpenAI API key are available:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
npx supabase functions serve analyze-meal --env-file supabase/functions/.env.local
```

Expected: the function serves locally and returns JSON for a test image URL.

- [ ] **Step 6: Commit**

Run:

```powershell
git add supabase/functions/analyze-meal
git commit -m "feat: add OpenAI meal analysis edge pipeline"
```

## Task 5: First Benchmark Results

**Files:**
- Create: `docs/benchmarks/macrolens-nutrition-benchmark-results-v1.md`

- [ ] **Step 1: Create result file**

Create `docs/benchmarks/macrolens-nutrition-benchmark-results-v1.md`:

```md
# MacroLens Nutrition Benchmark Results V1

Date: 2026-05-23
Model: gpt-4.1-mini
Pipeline: Supabase Edge Function analyze-meal, estimated source only

## Summary

- Calories within acceptable range:
- Protein within acceptable range:
- Correct confidence tier:
- Useful correction suggestions:
- Major failures:

## Case Results

| ID | Meal | Calories Result | Protein Result | Confidence Result | Pass/Fail | Notes |
| --- | --- | ---: | ---: | --- | --- | --- |
```

- [ ] **Step 2: Run at least 5 smoke benchmark cases**

Use real or representative photos for:

- ML-001 Croissant beurre + cafe noir
- ML-011 Poulet grille, riz blanc, haricots verts
- ML-021 Burger boeuf frites
- ML-025 Poke saumon riz avocat
- ML-047 Curry coco poulet riz

Expected: each case has a result row.

- [ ] **Step 3: Commit benchmark result file**

Run:

```powershell
git add docs/benchmarks/macrolens-nutrition-benchmark-results-v1.md
git commit -m "test: add first live nutrition benchmark results"
```

## Task 6: Final Verification

**Files:**
- Modify: `docs/superpowers/status/2026-05-23-macrolens-project-control.md`

- [ ] **Step 1: Update project control**

Add:

- remote analysis mode status;
- Supabase project status;
- OpenAI secret status;
- benchmark result summary;
- known model failure modes.

- [ ] **Step 2: Run final checks**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile\apps\mobile
npm test
npx tsc --noEmit
npx expo install --check
```

Expected: all pass.

- [ ] **Step 3: Commit project control**

Run:

```powershell
cd C:\Users\idris\OneDrive\Documents\AppMobile
git add docs/superpowers/status/2026-05-23-macrolens-project-control.md
git commit -m "docs: update real analysis pipeline status"
```

## Self-Review

Spec coverage:

- Photo analysis moves from mock to remote via Tasks 1, 2, and 4.
- API keys stay server-side via Task 4 and Supabase Edge Function secrets.
- Supabase Storage is addressed by Tasks 2 and 3.
- Benchmark gate is addressed by Task 5.
- Open Food Facts and USDA are intentionally deferred to the following iteration, as specified in project control.

Placeholder scan:

- This plan contains no open placeholder tokens.

Type consistency:

- Mobile still uses `AnalysisService`, `AnalysisResult`, and existing Zod validation.
- Edge Function maps raw model output back to the existing MacroLens response shape.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-23-real-image-analysis-pipeline.md`. Recommended execution is Inline Execution until Supabase/OpenAI credentials are needed, then pause for secure credential setup.
