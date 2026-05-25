import type { CommercialEntitlementState, EntitlementProvider, PurchasePlan } from './entitlementTypes';

type RevenueCatEntitlement = {
  productIdentifier?: string;
  expirationDate?: string | null;
};

type RevenueCatCustomerInfo = {
  entitlements: {
    active: Record<string, RevenueCatEntitlement | undefined>;
  };
};

type RevenueCatPackage = unknown;

type RevenueCatModule = {
  configure(config: { apiKey: string }): void;
  getCustomerInfo(): Promise<RevenueCatCustomerInfo>;
  getOfferings(): Promise<{
    current: {
      availablePackages: RevenueCatPackage[];
    } | null;
  }>;
  purchasePackage(packageToPurchase: RevenueCatPackage): Promise<{ customerInfo: RevenueCatCustomerInfo }>;
  restorePurchases(): Promise<RevenueCatCustomerInfo>;
};

const entitlementId = 'macrolens_pro';
const packageByPlan: Record<PurchasePlan, number> = {
  monthly: 0,
  annual: 1,
};

let configuredApiKey: string | null = null;

async function loadPurchases(): Promise<RevenueCatModule> {
  const module = await import('react-native-purchases');
  return module.default as unknown as RevenueCatModule;
}

function stateFromCustomerInfo(customerInfo: RevenueCatCustomerInfo): CommercialEntitlementState {
  const entitlement = customerInfo.entitlements.active[entitlementId];
  return {
    isPremium: Boolean(entitlement),
    source: entitlement ? 'store' : 'none',
    productId: entitlement?.productIdentifier ?? null,
    expiresAt: entitlement?.expirationDate ?? null,
    updatedAt: new Date().toISOString(),
  };
}

async function configuredPurchases(appleApiKey: string): Promise<RevenueCatModule> {
  const Purchases = await loadPurchases();
  if (configuredApiKey !== appleApiKey) {
    Purchases.configure({ apiKey: appleApiKey });
    configuredApiKey = appleApiKey;
  }
  return Purchases;
}

export function createRevenueCatEntitlementProvider(appleApiKey: string): EntitlementProvider {
  return {
    kind: 'revenue_cat',
    async getEntitlement() {
      const Purchases = await configuredPurchases(appleApiKey);
      return stateFromCustomerInfo(await Purchases.getCustomerInfo());
    },
    async purchase(plan) {
      const Purchases = await configuredPurchases(appleApiKey);
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        throw new Error('revenuecat_offering_missing');
      }
      const selectedPackage = current.availablePackages[packageByPlan[plan]];
      if (!selectedPackage) {
        throw new Error(`revenuecat_package_missing_${plan}`);
      }
      const result = await Purchases.purchasePackage(selectedPackage);
      return stateFromCustomerInfo(result.customerInfo);
    },
    async restore() {
      const Purchases = await configuredPurchases(appleApiKey);
      return stateFromCustomerInfo(await Purchases.restorePurchases());
    },
  };
}
