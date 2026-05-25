export type EntitlementMode = 'local_dev' | 'store';

export type CommercialEntitlementState = {
  isPremium: boolean;
  source: 'none' | 'local_dev' | 'store';
  productId: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

export type PurchasePlan = 'monthly' | 'annual';

export type EntitlementProvider = {
  kind: 'local_dev' | 'revenue_cat';
  getEntitlement(): Promise<CommercialEntitlementState>;
  purchase(plan: PurchasePlan): Promise<CommercialEntitlementState>;
  restore(): Promise<CommercialEntitlementState>;
};
