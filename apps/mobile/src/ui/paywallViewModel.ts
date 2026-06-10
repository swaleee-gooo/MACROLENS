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

/** Parses "7 days free" → 7. Null when the label has no number. */
export function trialLengthDaysFromLabel(trialLabel: string | null): number | null {
  const match = trialLabel?.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export type TrialTimeline = {
  trialDays: number;
  /** Day the "we remind you" step happens (2 days before the trial ends). */
  reminderDay: number;
};

/**
 * The hero trial timeline ("Today / Day 5 / Day 7") is shown only when the
 * store confirmed a free trial on the annual plan — same gate as the badge.
 */
export function trialTimeline(pricing: PlanPricing[] | null): TrialTimeline | null {
  const annual = planPricingFor(pricing, 'annual');
  if (!annual?.hasFreeTrial) {
    return null;
  }

  const trialDays = trialLengthDaysFromLabel(annual.trialLabel) ?? 7;
  return { trialDays, reminderDay: Math.max(2, trialDays - 2) };
}

export type PaywallPricingLine = {
  /** The most prominent price text — always carries the real billed price (Apple 3.1.2c). */
  primary: string;
  secondary: string | null;
  isPlaceholder: boolean;
};

export function paywallPricingLine(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): PaywallPricingLine {
  const planPricing = planPricingFor(pricing, selectedPlan);
  if (!planPricing) {
    // Offerings unavailable (offline, store down): never show a made-up price.
    return { primary: 'Price shown at checkout', secondary: null, isPlaceholder: true };
  }

  const period = selectedPlan === 'annual' ? 'year' : 'month';
  const billedPrice = `${planPricing.priceString}/${period}`;
  const primary = planPricing.hasFreeTrial && planPricing.trialLabel ? `${planPricing.trialLabel}, then ${billedPrice}` : billedPrice;
  const secondary =
    selectedPlan === 'annual' && planPricing.perMonthPriceString
      ? `that's ${planPricing.perMonthPriceString}/month · cancel anytime`
      : 'cancel anytime';

  return { primary, secondary, isPlaceholder: false };
}

/** Collapsing the "Other options" row returns the selection to the hero annual plan. */
export function planSelectionAfterOtherOptionsToggle(otherOptionsVisible: boolean, currentSelection: PurchasePlan): PurchasePlan {
  return otherOptionsVisible ? currentSelection : 'annual';
}

export type UnlockedEyebrow = { variant: 'trial'; trialDays: number } | { variant: 'pro' };

/**
 * Eyebrow on the unlocked screen: "7-day trial · active" only when the
 * purchased plan had a store-confirmed free trial, otherwise "Pro · active"
 * (restores included — pass a null plan).
 */
export function unlockedEyebrow(pricing: PlanPricing[] | null, purchasedPlan: PurchasePlan | null): UnlockedEyebrow {
  const planPricing = purchasedPlan ? planPricingFor(pricing, purchasedPlan) : null;
  if (!planPricing?.hasFreeTrial) {
    return { variant: 'pro' };
  }

  return { variant: 'trial', trialDays: trialLengthDaysFromLabel(planPricing.trialLabel) ?? 7 };
}

export function paywallLegalText(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): string {
  const hasFreeTrial = planPricingFor(pricing, selectedPlan)?.hasFreeTrial ?? false;
  const renewal = hasFreeTrial ? 'Starts with a free trial, then the subscription renews automatically.' : 'Subscription renews automatically.';
  return `${renewal} Cancel anytime from App Store settings. Nutrition estimates do not replace medical advice.`;
}
