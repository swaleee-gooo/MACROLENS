import { describe, expect, it } from 'vitest';
import { createNutritionLabelOcrService } from './labelOcrService';

describe('createNutritionLabelOcrService', () => {
  it('uploads a label photo and maps the OCR function response', async () => {
    const uploads: Array<{ path: string; body: ArrayBuffer }> = [];
    const invokes: Array<{ name: string; body: unknown }> = [];
    const service = createNutritionLabelOcrService(
      { supabaseUrl: 'https://supabase.test', supabaseAnonKey: 'anon' },
      {
        auth: {
          getSession: async () => ({ data: { session: { user: { id: 'user-1' } } }, error: null }),
          signInAnonymously: async () => ({ data: { session: null, user: null }, error: null }),
        },
        storage: {
          from: () => ({
            upload: async (path, body) => {
              uploads.push({ path, body });
              return { data: { path }, error: null };
            },
            createSignedUrl: async () => ({ data: { signedUrl: 'https://cdn.test/label.jpg' }, error: null }),
          }),
        },
        functions: {
          invoke: async (name, options) => {
            invokes.push({ name, body: options.body });
            return {
              data: {
                item: {
                  barcode: 'label-123',
                  name: 'Yaourt grec',
                  caloriesPer100g: 92,
                  proteinPer100g: 9.8,
                  carbsPer100g: 3.5,
                  fatPer100g: 4.1,
                  fiberPer100g: 0,
                  source: 'nutrition_label_ocr',
                },
                servingGrams: 125,
                confidence: 'high',
                missingFields: [],
              },
              error: null,
            };
          },
        },
      },
      async () => new Response(new Uint8Array([1, 2, 3])),
    );

    const result = await service.scanLabelPhoto('file://label.jpg');

    expect(uploads[0].path).toContain('user-1/labels/');
    expect(invokes).toEqual([{ name: 'scan-nutrition-label', body: { imageUrl: 'https://cdn.test/label.jpg' } }]);
    expect(result.item.name).toBe('Yaourt grec');
    expect(result.servingGrams).toBe(125);
  });
});
