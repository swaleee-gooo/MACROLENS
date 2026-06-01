export type AnalysisMode = 'mock' | 'remote';
export type EntitlementMode = 'local_dev' | 'store';

export type AppEnv = {
  analysisMode: AnalysisMode;
  entitlementMode: EntitlementMode;
  revenueCatAppleApiKey: string;
  revenueCatMonthlyProductId: string;
  revenueCatAnnualProductId: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

type EnvInput = Record<string, string | undefined>;

export function resolveAppEnv(input: EnvInput): AppEnv {
  const requestedMode = input.EXPO_PUBLIC_ANALYSIS_MODE === 'remote' ? 'remote' : 'mock';
  const entitlementMode = input.EXPO_PUBLIC_ENTITLEMENT_MODE === 'store' ? 'store' : 'local_dev';
  const revenueCatAppleApiKey = input.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY?.trim() ?? '';
  const revenueCatMonthlyProductId = input.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?.trim() || 'macrolens_pro_monthly';
  const revenueCatAnnualProductId = input.EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID?.trim() || 'macrolens_pro_annual';
  const supabaseUrl = input.EXPO_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabaseAnonKey = input.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  const canUseRemote = requestedMode === 'remote' && supabaseUrl !== null && supabaseAnonKey !== null;

  return {
    analysisMode: canUseRemote ? 'remote' : 'mock',
    entitlementMode,
    revenueCatAppleApiKey,
    revenueCatMonthlyProductId,
    revenueCatAnnualProductId,
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const appEnv = resolveAppEnv({
  EXPO_PUBLIC_ANALYSIS_MODE: process.env.EXPO_PUBLIC_ANALYSIS_MODE,
  EXPO_PUBLIC_ENTITLEMENT_MODE: process.env.EXPO_PUBLIC_ENTITLEMENT_MODE,
  EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
  EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID: process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID,
  EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID: process.env.EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
