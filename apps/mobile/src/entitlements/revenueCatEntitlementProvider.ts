import type { CommercialEntitlementState, EntitlementProvider, PlanPricing, PurchasePlan } from './entitlementTypes';

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
type RevenueCatProductIds = Partial<Record<PurchasePlan, string>>;

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
const defaultProductIds: Record<PurchasePlan, string> = {
  monthly: 'prod03d96b4e28',
  annual: 'prod0ef75e0b34',
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

function packagePlanCandidate(packageToInspect: RevenueCatPackage): { identifier?: string; packageType?: string; productIdentifier?: string } {
  if (!packageToInspect || typeof packageToInspect !== 'object') {
    return {};
  }

  const candidate = packageToInspect as {
    identifier?: unknown;
    packageType?: unknown;
    product?: { identifier?: unknown };
  };

  return {
    identifier: typeof candidate.identifier === 'string' ? candidate.identifier : undefined,
    packageType: typeof candidate.packageType === 'string' ? candidate.packageType.toLowerCase() : undefined,
    productIdentifier: typeof candidate.product?.identifier === 'string' ? candidate.product.identifier : undefined,
  };
}

export function selectPackageForPlan(packages: RevenueCatPackage[], plan: PurchasePlan, productIds: RevenueCatProductIds = {}): RevenueCatPackage | null {
  const targetProductId = productIds[plan] ?? defaultProductIds[plan];
  const targetPackageType = plan === 'annual' ? 'annual' : 'monthly';

  return (
    packages.find((packageToInspect) => packagePlanCandidate(packageToInspect).productIdentifier === targetProductId) ??
    packages.find((packageToInspect) => packagePlanCandidate(packageToInspect).packageType === targetPackageType) ??
    packages.find((packageToInspect) => packagePlanCandidate(packageToInspect).identifier?.toLowerCase().includes(targetPackageType)) ??
    null
  );
}

type RevenueCatIntroPrice = {
  price?: unknown;
  periodNumberOfUnits?: unknown;
  periodUnit?: unknown;
};

type RevenueCatPricedProduct = {
  priceString?: unknown;
  price?: unknown;
  currencyCode?: unknown;
  introPrice?: RevenueCatIntroPrice | null;
};

function packageProduct(packageToInspect: RevenueCatPackage): RevenueCatPricedProduct {
  if (!packageToInspect || typeof packageToInspect !== 'object') {
    return {};
  }

  const candidate = packageToInspect as { product?: RevenueCatPricedProduct | null };
  return candidate.product && typeof candidate.product === 'object' ? candidate.product : {};
}

function trialLabelFromIntroPrice(introPrice: RevenueCatIntroPrice | null | undefined): string | null {
  // A trial is only a trial when the introductory price is exactly zero. Paid
  // introductory offers (pay-up-front / pay-as-you-go) must never show a
  // "free" badge (App Store guideline 3.1.2).
  if (!introPrice || typeof introPrice !== 'object' || introPrice.price !== 0) {
    return null;
  }

  const units = typeof introPrice.periodNumberOfUnits === 'number' ? introPrice.periodNumberOfUnits : null;
  const unit = typeof introPrice.periodUnit === 'string' ? introPrice.periodUnit.toLowerCase() : null;
  if (!units || units <= 0 || !unit) {
    return null;
  }

  return `${units} ${unit}${units === 1 ? '' : 's'} free`;
}

function perMonthPriceStringForPlan(plan: PurchasePlan, product: RevenueCatPricedProduct): string | null {
  if (plan !== 'annual' || typeof product.price !== 'number' || typeof product.currencyCode !== 'string' || !product.currencyCode) {
    return null;
  }

  try {
    return new Intl.NumberFormat(undefined, { currency: product.currencyCode, style: 'currency' }).format(product.price / 12);
  } catch {
    return null;
  }
}

function planPricingFromPackage(plan: PurchasePlan, packageForPlan: RevenueCatPackage): PlanPricing {
  const product = packageProduct(packageForPlan);
  if (typeof product.priceString !== 'string' || !product.priceString) {
    throw new Error(`revenuecat_price_missing_${plan}`);
  }

  const trialLabel = trialLabelFromIntroPrice(product.introPrice);
  return {
    plan,
    priceString: product.priceString,
    perMonthPriceString: perMonthPriceStringForPlan(plan, product),
    hasFreeTrial: trialLabel !== null,
    trialLabel,
  };
}

export function pricingFromOffering(offering: { availablePackages: RevenueCatPackage[] } | null, productIds: RevenueCatProductIds = {}): PlanPricing[] {
  if (!offering) {
    throw new Error('revenuecat_offering_missing');
  }

  return (['annual', 'monthly'] as const).map((plan) => {
    const packageForPlan = selectPackageForPlan(offering.availablePackages, plan, productIds);
    if (!packageForPlan) {
      throw new Error(`revenuecat_package_missing_${plan}`);
    }

    return planPricingFromPackage(plan, packageForPlan);
  });
}

async function configuredPurchases(appleApiKey: string): Promise<RevenueCatModule> {
  const Purchases = await loadPurchases();
  if (configuredApiKey !== appleApiKey) {
    Purchases.configure({ apiKey: appleApiKey });
    configuredApiKey = appleApiKey;
  }
  return Purchases;
}

export function createRevenueCatEntitlementProvider(appleApiKey: string, productIds: RevenueCatProductIds = {}): EntitlementProvider {
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
      const selectedPackage = selectPackageForPlan(current.availablePackages, plan, productIds);
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
    async getPricing() {
      const Purchases = await configuredPurchases(appleApiKey);
      const offerings = await Purchases.getOfferings();
      return pricingFromOffering(offerings.current, productIds);
    },
  };
}
