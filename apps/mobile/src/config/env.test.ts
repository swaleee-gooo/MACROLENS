import { describe, expect, it } from 'vitest';
import { resolveAppEnv } from './env';

describe('resolveAppEnv', () => {
  it('defaults to mock mode when no Supabase values are present', () => {
    expect(resolveAppEnv({})).toEqual({
      analysisMode: 'mock',
      entitlementMode: 'local_dev',
      paywallEnabled: false,
      revenueCatAppleApiKey: '',
      revenueCatMonthlyProductId: 'prod03d96b4e28',
      revenueCatAnnualProductId: 'prod0ef75e0b34',
      usdaFdcApiKey: '',
      geminiApiKey: '',
      openAiApiKey: '',
      visionModelProvider: 'mock',
      supabaseUrl: null,
      supabaseAnonKey: null,
    });
  });

  it('allows remote mode when Supabase values are present', () => {
    expect(
      resolveAppEnv({
        EXPO_PUBLIC_ANALYSIS_MODE: 'remote',
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_123',
      }),
    ).toEqual({
      analysisMode: 'remote',
      entitlementMode: 'local_dev',
      paywallEnabled: false,
      revenueCatAppleApiKey: '',
      revenueCatMonthlyProductId: 'prod03d96b4e28',
      revenueCatAnnualProductId: 'prod0ef75e0b34',
      usdaFdcApiKey: '',
      geminiApiKey: '',
      openAiApiKey: '',
      visionModelProvider: 'mock',
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'sb_publishable_123',
    });
  });

  it('falls back to mock mode when remote mode is missing credentials', () => {
    expect(resolveAppEnv({ EXPO_PUBLIC_ANALYSIS_MODE: 'remote' }).analysisMode).toBe('mock');
  });

  it('enables store entitlement mode when configured', () => {
    expect(
      resolveAppEnv({
        EXPO_PUBLIC_ENTITLEMENT_MODE: 'store',
        EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY: 'appl_test_key',
        EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID: 'custom_monthly',
        EXPO_PUBLIC_REVENUECAT_ANNUAL_PRODUCT_ID: 'custom_annual',
      }),
    ).toMatchObject({
      entitlementMode: 'store',
      revenueCatAppleApiKey: 'appl_test_key',
      revenueCatMonthlyProductId: 'custom_monthly',
      revenueCatAnnualProductId: 'custom_annual',
    });
  });

  it('keeps the paywall hidden unless explicitly enabled', () => {
    expect(resolveAppEnv({ EXPO_PUBLIC_PAYWALL_ENABLED: 'true' }).paywallEnabled).toBe(true);
    expect(resolveAppEnv({ EXPO_PUBLIC_PAYWALL_ENABLED: 'false' }).paywallEnabled).toBe(false);
  });

  it('parses MetaboProof resolver and model router keys', () => {
    expect(
      resolveAppEnv({
        EXPO_PUBLIC_USDA_FDC_API_KEY: 'fdc_key',
        EXPO_PUBLIC_GEMINI_API_KEY: 'gemini_key',
        EXPO_PUBLIC_OPENAI_API_KEY: 'openai_key',
        EXPO_PUBLIC_VISION_MODEL_PROVIDER: 'gemini',
      }),
    ).toMatchObject({
      usdaFdcApiKey: 'fdc_key',
      geminiApiKey: 'gemini_key',
      openAiApiKey: 'openai_key',
      visionModelProvider: 'gemini',
    });
  });
});
