export type AnalysisMode = 'mock' | 'remote';
export type EntitlementMode = 'local_dev' | 'store';
export type VisionModelProvider = 'mock' | 'gemini' | 'openai';

export type AppEnv = {
  analysisMode: AnalysisMode;
  entitlementMode: EntitlementMode;
  paywallEnabled: boolean;
  revenueCatAppleApiKey: string;
  revenueCatMonthlyProductId: string;
  revenueCatAnnualProductId: string;
  facebookAppId: string;
  usdaFdcApiKey: string;
  geminiApiKey: string;
  openAiApiKey: string;
  visionModelProvider: VisionModelProvider;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

type EnvInput = Record<string, string | undefined>;

export function resolveAppEnv(input: EnvInput): AppEnv {
  const requestedMode = input.EXPO_PUBLIC_ANALYSIS_MODE === 'remote' ? 'remote' : 'mock';
  const entitlementMode = input.EXPO_PUBLIC_ENTITLEMENT_MODE === 'store' ? 'store' : 'local_dev';
  const paywallEnabled = input.EXPO_PUBLIC_PAYWALL_ENABLED === 'true';
  const revenueCatAppleApiKey = input.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY?.trim() ?? '';
  const revenueCatMonthlyProductId = input.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID?.trim() || 'prod03d96b4e28';
  const revenueCatAnnualProductId = input.EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID?.trim() || 'prod0ef75e0b34';
  const facebookAppId = input.EXPO_PUBLIC_FACEBOOK_APP_ID?.trim() ?? '';
  const usdaFdcApiKey = input.EXPO_PUBLIC_USDA_FDC_API_KEY?.trim() ?? '';
  const geminiApiKey = input.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? '';
  const openAiApiKey = input.EXPO_PUBLIC_OPENAI_API_KEY?.trim() ?? '';
  const requestedVisionProvider = input.EXPO_PUBLIC_VISION_MODEL_PROVIDER?.trim();
  const visionModelProvider: VisionModelProvider = requestedVisionProvider === 'gemini' || requestedVisionProvider === 'openai' ? requestedVisionProvider : 'mock';
  const supabaseUrl = input.EXPO_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabaseAnonKey = input.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  const canUseRemote = requestedMode === 'remote' && supabaseUrl !== null && supabaseAnonKey !== null;

  return {
    analysisMode: canUseRemote ? 'remote' : 'mock',
    entitlementMode,
    paywallEnabled,
    revenueCatAppleApiKey,
    revenueCatMonthlyProductId,
    revenueCatAnnualProductId,
    facebookAppId,
    usdaFdcApiKey,
    geminiApiKey,
    openAiApiKey,
    visionModelProvider,
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const appEnv = resolveAppEnv({
  EXPO_PUBLIC_ANALYSIS_MODE: process.env.EXPO_PUBLIC_ANALYSIS_MODE,
  EXPO_PUBLIC_ENTITLEMENT_MODE: process.env.EXPO_PUBLIC_ENTITLEMENT_MODE,
  EXPO_PUBLIC_PAYWALL_ENABLED: process.env.EXPO_PUBLIC_PAYWALL_ENABLED,
  EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
  EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID: process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID,
  EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID: process.env.EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID,
  EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
  EXPO_PUBLIC_USDA_FDC_API_KEY: process.env.EXPO_PUBLIC_USDA_FDC_API_KEY,
  EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  EXPO_PUBLIC_VISION_MODEL_PROVIDER: process.env.EXPO_PUBLIC_VISION_MODEL_PROVIDER,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
