import type { CommercialEntitlementState, EntitlementProvider, PlanPricing, PurchasePlan } from './entitlementTypes';

// Mock pricing for local development only — production pricing always comes
// from the store via the RevenueCat provider.
const localDevPricing: PlanPricing[] = [
  { plan: 'annual', priceString: '$49.99', price: 49.99, perMonthPriceString: '$4.17', hasFreeTrial: true, trialLabel: '7 days free' },
  { plan: 'monthly', priceString: '$9.99', price: 9.99, perMonthPriceString: null, hasFreeTrial: false, trialLabel: null },
];

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
    async getPricing() {
      return localDevPricing.map((pricing) => ({ ...pricing }));
    },
  };
}
