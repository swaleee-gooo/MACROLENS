import type { CommercialEntitlementState, EntitlementProvider, PurchasePlan } from './entitlementTypes';

function activeLocalEntitlement(): CommercialEntitlementState {
  return {
    isPremium: true,
    source: 'local_dev',
    productId: 'local_dev_unlock',
    expiresAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function createLocalEntitlementProvider(): EntitlementProvider {
  return {
    kind: 'local_dev',
    async getEntitlement() {
      return {
        isPremium: false,
        source: 'none',
        productId: null,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
      };
    },
    async purchase(_plan: PurchasePlan) {
      return activeLocalEntitlement();
    },
    async restore() {
      return activeLocalEntitlement();
    },
  };
}
