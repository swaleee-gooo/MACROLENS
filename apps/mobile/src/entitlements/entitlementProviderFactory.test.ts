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

  it('returns mock pricing with a trial on annual only in local development mode', async () => {
    const provider = createEntitlementProvider({
      entitlementMode: 'local_dev',
      revenueCatAppleApiKey: '',
      isExpoGo: true,
    });

    expect(await provider.getPricing()).toEqual([
      { plan: 'annual', priceString: '$49.99', price: 49.99, perMonthPriceString: '$4.17', hasFreeTrial: true, trialLabel: '7 days free' },
      { plan: 'monthly', priceString: '$9.99', price: 9.99, perMonthPriceString: null, hasFreeTrial: false, trialLabel: null },
    ]);
  });
});
