import type { PlanPricing, PurchasePlan } from '../entitlements/entitlementTypes';

export type PaywallPlanCardContent = {
  price: string;
  detail: string;
  badge: string | null;
  priceIsPlaceholder: boolean;
};

export function planPricingFor(pricing: PlanPricing[] | null, plan: PurchasePlan): PlanPricing | null {
  return pricing?.find((entry) => entry.plan === plan) ?? null;
}

export function paywallPlanCardContent(pricing: PlanPricing[] | null, plan: PurchasePlan): PaywallPlanCardContent {
  const planPricing = planPricingFor(pricing, plan);
  const staticDetail = plan === 'annual' ? 'Best value.' : 'Flexible, cancel anytime.';

  if (!planPricing) {
    // Offerings unavailable (offline, store down): never show a made-up price.
    return { price: 'Price shown at checkout', detail: staticDetail, badge: null, priceIsPlaceholder: true };
  }

  if (plan === 'annual') {
    return {
      price: `${planPricing.priceString} / year`,
      detail: planPricing.perMonthPriceString ? `${planPricing.perMonthPriceString} / month. Best value.` : staticDetail,
      badge: planPricing.hasFreeTrial ? planPricing.trialLabel : null,
      priceIsPlaceholder: false,
    };
  }

  return {
    price: `${planPricing.priceString} / month`,
    detail: staticDetail,
    badge: planPricing.hasFreeTrial ? planPricing.trialLabel : null,
    priceIsPlaceholder: false,
  };
}

export function ctaLabelForSelection(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): string {
  // Only promise a free trial when the store confirmed one on the selected plan.
  return planPricingFor(pricing, selectedPlan)?.hasFreeTrial ? 'Start free trial' : 'Subscribe';
}

export function paywallLegalText(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): string {
  const hasFreeTrial = planPricingFor(pricing, selectedPlan)?.hasFreeTrial ?? false;
  const renewal = hasFreeTrial ? 'Starts with a free trial, then the subscription renews automatically.' : 'Subscription renews automatically.';
  return `${renewal} Cancel anytime from App Store settings. Nutrition estimates do not replace medical advice.`;
}
