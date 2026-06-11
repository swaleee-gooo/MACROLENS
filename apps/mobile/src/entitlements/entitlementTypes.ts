export type EntitlementMode = 'local_dev' | 'store';

export type CommercialEntitlementState = {
  isPremium: boolean;
  source: 'none' | 'local_dev' | 'store';
  productId: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

export type PurchasePlan = 'monthly' | 'annual';

export type PlanPricing = {
  plan: PurchasePlan;
  priceString: string; // "$49.99" — localized by the store
  price: number; // numeric store price (49.99) — 0 when the store omits it
  perMonthPriceString: string | null; // computed for annual, null otherwise
  hasFreeTrial: boolean; // introPrice present AND price === 0
  trialLabel: string | null; // "7 days free" derived from introPrice.periodNumberOfUnits
};

export type EntitlementProvider = {
  kind: 'local_dev' | 'revenue_cat';
  getEntitlement(): Promise<CommercialEntitlementState>;
  purchase(plan: PurchasePlan): Promise<CommercialEntitlementState>;
  restore(): Promise<CommercialEntitlementState>;
  getPricing(): Promise<PlanPricing[]>;
};

// Shown instantly while store pricing loads, and kept if the store is
// unreachable. Must mirror the App Store Connect US configuration exactly
// (annual $49.99 with 7-day free trial, monthly $9.99) — the purchase sheet
// always displays the real charge, so a mismatch here would only ever be
// cosmetic, but keep them in sync when ASC prices change.
export const defaultUsdPlanPricing: PlanPricing[] = [
  { plan: 'annual', priceString: '$49.99', price: 49.99, perMonthPriceString: '$4.17', hasFreeTrial: true, trialLabel: '7 days free' },
  { plan: 'monthly', priceString: '$9.99', price: 9.99, perMonthPriceString: null, hasFreeTrial: false, trialLabel: null },
];
