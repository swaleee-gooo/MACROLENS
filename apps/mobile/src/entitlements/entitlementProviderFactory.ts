import { createLocalEntitlementProvider } from './localEntitlementProvider';
import { createRevenueCatEntitlementProvider } from './revenueCatEntitlementProvider';
import type { EntitlementMode, EntitlementProvider } from './entitlementTypes';

type Config = {
  entitlementMode: EntitlementMode;
  revenueCatAppleApiKey: string;
  isExpoGo: boolean;
};

export function createEntitlementProvider(config: Config): EntitlementProvider {
  if (config.entitlementMode === 'local_dev') {
    return createLocalEntitlementProvider();
  }

  if (config.isExpoGo) {
    throw new Error('store_entitlements_require_development_build');
  }

  if (!config.revenueCatAppleApiKey) {
    throw new Error('revenuecat_apple_api_key_missing');
  }

  return createRevenueCatEntitlementProvider(config.revenueCatAppleApiKey);
}
