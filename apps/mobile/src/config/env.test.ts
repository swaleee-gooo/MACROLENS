import { describe, expect, it } from 'vitest';
import { resolveAppEnv } from './env';

describe('resolveAppEnv', () => {
  it('defaults to mock mode when no Supabase values are present', () => {
    expect(resolveAppEnv({})).toEqual({
      analysisMode: 'mock',
      entitlementMode: 'local_dev',
      revenueCatAppleApiKey: '',
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
      revenueCatAppleApiKey: '',
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
      }),
    ).toMatchObject({
      entitlementMode: 'store',
      revenueCatAppleApiKey: 'appl_test_key',
    });
  });
});
