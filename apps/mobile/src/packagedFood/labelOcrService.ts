import { z } from 'zod';
import { createMacroLensSupabaseClient } from '../supabase/client';
import { ensureAnonymousUserId } from '../supabase/session';
import { packagedFoodItemSchema } from './packagedFoodSchema';

type LabelOcrConfig = {
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

type ImageFetcher = (imageUri: string) => Promise<Response>;

const labelOcrResultSchema = z.object({
  item: packagedFoodItemSchema.extend({
    source: z.literal('nutrition_label_ocr'),
  }),
  servingGrams: z.number().positive().nullable().default(null),
  confidence: z.enum(['high', 'medium', 'low']),
  missingFields: z.array(z.string()).default([]),
});

export type LabelOcrResult = Omit<z.infer<typeof labelOcrResultSchema>, 'servingGrams'> & {
  servingGrams: number;
};

async function imageUriToArrayBuffer(imageUri: string, fetchImage: ImageFetcher): Promise<ArrayBuffer> {
  const response = await fetchImage(imageUri);
  if (!response.ok) {
    throw new Error('label_image_fetch_failed');
  }

  return response.arrayBuffer();
}

export function createNutritionLabelOcrService(
  config: LabelOcrConfig,
  client?: SupabaseLike,
  fetchImage: ImageFetcher = fetch,
) {
  const supabase = client ?? (createMacroLensSupabaseClient(config.supabaseUrl, config.supabaseAnonKey) as unknown as SupabaseLike);

  return {
    async scanLabelPhoto(imageUri: string): Promise<LabelOcrResult> {
      const authUserId = await ensureAnonymousUserId(supabase.auth);
      const imageBuffer = await imageUriToArrayBuffer(imageUri, fetchImage);
      const objectPath = `${authUserId}/labels/${Date.now()}.jpg`;
      const bucket = supabase.storage.from('meal-photos');
      const uploadResult = await bucket.upload(objectPath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (uploadResult.error || !uploadResult.data) {
        throw new Error('label_image_upload_failed');
      }

      const signedUrlResult = await bucket.createSignedUrl(uploadResult.data.path, 10 * 60);
      if (signedUrlResult.error || !signedUrlResult.data) {
        throw new Error('label_image_signed_url_failed');
      }

      const functionResult = await supabase.functions.invoke('scan-nutrition-label', {
        body: { imageUrl: signedUrlResult.data.signedUrl },
      });

      if (functionResult.error) {
        throw new Error('label_ocr_function_failed');
      }

      const result = labelOcrResultSchema.parse(functionResult.data);

      return {
        ...result,
        servingGrams: result.servingGrams ?? 100,
      };
    },
  };
}
