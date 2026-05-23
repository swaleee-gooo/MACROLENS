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
      } catch {
        return fallback.analyzeMealPhoto(input);
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
