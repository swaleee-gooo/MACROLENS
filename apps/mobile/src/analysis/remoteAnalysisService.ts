import { NonFoodPhotoError } from './analysisErrors';
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
    signInAnonymously(): Promise<{
      data: { session: { user: { id: string } } | null; user: { id: string } | null };
      error: unknown;
    }>;
  };
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: ArrayBuffer,
        options: { contentType: string; upsert: boolean },
      ): Promise<{ data: { path: string } | null; error: unknown }>;
      createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
  functions: {
    invoke(name: string, options: { body: unknown }): Promise<{ data: unknown; error: unknown }>;
  };
};

type EdgeErrorPayload = {
  error?: unknown;
  message?: unknown;
};

function getNonFoodMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as EdgeErrorPayload;
  if (candidate.error !== 'non_food_photo') {
    return null;
  }

  return typeof candidate.message === 'string' ? candidate.message : null;
}

async function getFunctionErrorPayload(error: unknown): Promise<unknown> {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (typeof context?.json !== 'function') {
    return null;
  }

  try {
    return await context.json();
  } catch {
    return null;
  }
}

async function imageUriToArrayBuffer(imageUri: string): Promise<ArrayBuffer> {
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error('image_fetch_failed');
  }

  return response.arrayBuffer();
}

export function createRemoteAnalysisService(config: RemoteConfig, client?: SupabaseLike): AnalysisService {
  const supabase = client ?? (createMacroLensSupabaseClient(config.supabaseUrl, config.supabaseAnonKey) as unknown as SupabaseLike);

  return {
    async analyzeMealPhoto({ imageUri }) {
      const authUserId = await ensureAnonymousUserId(supabase.auth);
      const imageBuffer = await imageUriToArrayBuffer(imageUri);
      const objectPath = `${authUserId}/${Date.now()}.jpg`;
      const bucket = supabase.storage.from('meal-photos');
      const uploadResult = await bucket.upload(objectPath, imageBuffer, {
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
        body: { imageUrl: signedUrlResult.data.signedUrl },
      });

      const nonFoodMessage = getNonFoodMessage(functionResult.data);
      if (nonFoodMessage) {
        throw new NonFoodPhotoError(nonFoodMessage);
      }

      if (functionResult.error) {
        const errorPayload = await getFunctionErrorPayload(functionResult.error);
        const wrappedNonFoodMessage = getNonFoodMessage(errorPayload);
        if (wrappedNonFoodMessage) {
          throw new NonFoodPhotoError(wrappedNonFoodMessage);
        }

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
