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
