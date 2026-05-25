import { afterEach, describe, expect, it, vi } from 'vitest';
import { NonFoodPhotoError } from './analysisErrors';
import { createAnalysisService } from './analysisServiceFactory';
import type { AnalysisResult, AnalysisService } from './analysisSchema';

function createResult(mealName: string, source: 'estimated' | 'mock'): AnalysisResult {
  return {
    meal: {
      id: `${source}-meal`,
      userId: 'user-1',
      imageUri: 'file://meal.jpg',
      capturedAt: '2026-05-23T12:00:00.000Z',
      mealName,
      caloriesEstimate: 100,
      caloriesLow: 85,
      caloriesHigh: 115,
      proteinG: 10,
      carbsG: 10,
      fatG: 3,
      fiberG: 2,
      confidence: 'medium',
      notes: '',
      source,
      items: [
        {
          id: `${source}-item`,
          mealId: `${source}-meal`,
          name: mealName,
          canonicalFoodName: mealName.toLowerCase(),
          estimatedQuantity: 100,
          unit: 'g',
          calories: 100,
          proteinG: 10,
          carbsG: 10,
          fatG: 3,
          fiberG: 2,
          confidence: 'medium',
          dataSource: source,
          sourceFoodId: null,
        },
      ],
    },
    uncertaintyReasons: [],
    correctionSuggestions: [],
  };
}

function createService(result: AnalysisResult | Error): AnalysisService {
  return {
    analyzeMealPhoto: vi.fn().mockImplementation(async () => {
      if (result instanceof Error) {
        throw result;
      }

      return result;
    }),
  };
}

describe('createAnalysisService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses remote analysis when remote mode succeeds', async () => {
    const service = createAnalysisService(
      {
        analysisMode: 'remote',
        entitlementMode: 'local_dev',
        revenueCatAppleApiKey: '',
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'sb_publishable_123',
      },
      {
        remote: createService(createResult('Remote meal', 'estimated')),
        mock: createService(createResult('Mock meal', 'mock')),
      },
    );

    const result = await service.analyzeMealPhoto({ imageUri: 'file://meal.jpg', userId: 'user-1' });

    expect(result.meal.mealName).toBe('Remote meal');
    expect(result.meal.source).toBe('estimated');
  });

  it('falls back to mock analysis when remote mode fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = createAnalysisService(
      {
        analysisMode: 'remote',
        entitlementMode: 'local_dev',
        revenueCatAppleApiKey: '',
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'sb_publishable_123',
      },
      {
        remote: createService(new Error('anonymous_auth_failed')),
        mock: createService(createResult('Mock meal', 'mock')),
      },
    );

    const result = await service.analyzeMealPhoto({ imageUri: 'file://meal.jpg', userId: 'user-1' });

    expect(result.meal.mealName).toBe('Mock meal');
    expect(result.meal.source).toBe('mock');
    expect(result.meal.notes).toBe('Remote analysis failed: anonymous_auth_failed');
    expect(warn).toHaveBeenCalledWith('MacroLens remote analysis failed: anonymous_auth_failed');
  });

  it('does not fall back to mock analysis for typed non-food photos', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mock = createService(createResult('Mock meal', 'mock'));
    const service = createAnalysisService(
      {
        analysisMode: 'remote',
        entitlementMode: 'local_dev',
        revenueCatAppleApiKey: '',
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'sb_publishable_123',
      },
      {
        remote: createService(new NonFoodPhotoError()),
        mock,
      },
    );

    await expect(service.analyzeMealPhoto({ imageUri: 'file://desk.jpg', userId: 'user-1' })).rejects.toBeInstanceOf(
      NonFoodPhotoError,
    );
    expect(mock.analyzeMealPhoto).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
