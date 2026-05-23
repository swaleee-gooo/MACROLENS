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
