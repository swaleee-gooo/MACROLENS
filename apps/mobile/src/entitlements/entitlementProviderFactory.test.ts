import { describe, expect, it } from 'vitest';
import { createEntitlementProvider } from './entitlementProviderFactory';

describe('createEntitlementProvider', () => {
  it('uses local development provider in Expo Go mode', () => {
    const provider = createEntitlementProvider({
      entitlementMode: 'local_dev',
      revenueCatAppleApiKey: '',
      isExpoGo: true,
    });

    expect(provider.kind).toBe('local_dev');
  });

  it('uses RevenueCat when store mode has an iOS api key', () => {
    const provider = createEntitlementProvider({
      entitlementMode: 'store',
      revenueCatAppleApiKey: 'appl_test_key',
      isExpoGo: false,
    });

    expect(provider.kind).toBe('revenue_cat');
  });

  it('throws when store mode is requested inside Expo Go', () => {
    expect(() =>
      createEntitlementProvider({
        entitlementMode: 'store',
        revenueCatAppleApiKey: 'appl_test_key',
        isExpoGo: true,
      }),
    ).toThrow('store_entitlements_require_development_build');
  });
});
