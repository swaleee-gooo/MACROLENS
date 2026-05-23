import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRemoteAnalysisService } from './remoteAnalysisService';

describe('createRemoteAnalysisService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads the image and invokes analyze-meal as the anonymous Supabase user', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image'], { type: 'image/jpeg' }),
    } as Response);

    const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const signInAnonymously = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'auth-user' } }, user: { id: 'auth-user' } },
      error: null,
    });
    const upload = vi.fn().mockResolvedValue({ data: { path: 'auth-user/12345.jpg' }, error: null });
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

    expect(upload).toHaveBeenCalledWith('auth-user/12345.jpg', expect.any(Blob), {
      contentType: 'image/jpeg',
      upsert: false,
    });
    expect(createSignedUrl).toHaveBeenCalledWith('auth-user/12345.jpg', 600);
    expect(invoke).toHaveBeenCalledWith('analyze-meal', {
      body: { imageUrl: 'https://cdn.example/test.jpg?token=signed', userId: 'auth-user' },
    });
    expect(result.meal.mealName).toBe('Test meal');
    expect(result.meal.imageUri).toBe('file://meal.jpg');
  });
});
