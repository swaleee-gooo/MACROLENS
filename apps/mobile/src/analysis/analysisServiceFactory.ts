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
