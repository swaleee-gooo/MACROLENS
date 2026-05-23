import { isNonFoodPhotoError } from './analysisErrors';
import type { AnalysisService } from './analysisSchema';
import { createMockAnalysisService } from './mockAnalysisService';
import { createRemoteAnalysisService } from './remoteAnalysisService';
import type { AppEnv } from '../config/env';

type AnalysisServiceOverrides = {
  mock?: AnalysisService;
  remote?: AnalysisService;
};

function createFallbackAnalysisService(primary: AnalysisService, fallback: AnalysisService): AnalysisService {
  return {
    async analyzeMealPhoto(input) {
      try {
        return await primary.analyzeMealPhoto(input);
      } catch (error) {
        if (isNonFoodPhotoError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : 'unknown_remote_error';
        console.warn(`MacroLens remote analysis failed: ${message}`);
        const fallbackResult = await fallback.analyzeMealPhoto(input);

        return {
          ...fallbackResult,
          meal: {
            ...fallbackResult.meal,
            notes: `Remote analysis failed: ${message}`,
          },
        };
      }
    },
  };
}

export function createAnalysisService(env: AppEnv, overrides: AnalysisServiceOverrides = {}): AnalysisService {
  const mockService = overrides.mock ?? createMockAnalysisService();

  if (env.analysisMode === 'remote' && env.supabaseUrl && env.supabaseAnonKey) {
    const remoteService =
      overrides.remote ??
      createRemoteAnalysisService({
        supabaseUrl: env.supabaseUrl,
        supabaseAnonKey: env.supabaseAnonKey,
      });

    return createFallbackAnalysisService(remoteService, mockService);
  }

  return mockService;
}
