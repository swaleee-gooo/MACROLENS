import type { PlanPricing, PurchasePlan } from '../entitlements/entitlementTypes';

export function planPricingFor(pricing: PlanPricing[] | null, plan: PurchasePlan): PlanPricing | null {
  return pricing?.find((entry) => entry.plan === plan) ?? null;
}

/** Parses "7 days free" → 7. Null when the label has no number. */
export function trialLengthDaysFromLabel(trialLabel: string | null): number | null {
  const match = trialLabel?.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Day count usable in "Start my 7-day free trial" copy — only when the store
 * label is actually expressed in days ("7 days free"). A "1 week free" label
 * returns null so the copy never claims a 1-day trial.
 */
export function trialDayCountFromLabel(trialLabel: string | null): number | null {
  const match = trialLabel?.match(/(\d+)\s*day/i);
  return match ? Number(match[1]) : null;
}

export type TrialTimeline = {
  trialDays: number;
  /** Day the "we remind you" step happens (2 days before the trial ends). */
  reminderDay: number;
};

/**
 * The trial timeline ("Now / Day 5 / Day 7") exists only when the store
 * confirmed a free trial on the annual plan — same gate as the trial toggle.
 */
export function trialTimeline(pricing: PlanPricing[] | null): TrialTimeline | null {
  const annual = planPricingFor(pricing, 'annual');
  if (!annual?.hasFreeTrial) {
    return null;
  }

  const trialDays = trialLengthDaysFromLabel(annual.trialLabel) ?? 7;
  return { trialDays, reminderDay: Math.max(2, trialDays - 2) };
}

/** The timeline renders inside the yearly card only while that card is selected. */
export function trialTimelineForSelection(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): TrialTimeline | null {
  return selectedPlan === 'annual' ? trialTimeline(pricing) : null;
}

/**
 * Yearly savings vs paying monthly for 12 months, from numeric store prices.
 * Null when either price is unknown (degraded mode) or the math yields no saving.
 */
export function savingsPercent(pricing: PlanPricing[] | null): number | null {
  const annual = planPricingFor(pricing, 'annual');
  const monthly = planPricingFor(pricing, 'monthly');
  if (!annual || !monthly || annual.price <= 0 || monthly.price <= 0) {
    return null;
  }

  const percent = Math.round((1 - annual.price / (monthly.price * 12)) * 100);
  return percent > 0 ? percent : null;
}

/** The "Free trial enabled" row exists only when the store confirmed a trial on annual. */
export function trialToggleVisible(pricing: PlanPricing[] | null): boolean {
  return planPricingFor(pricing, 'annual')?.hasFreeTrial === true;
}

/** Toggle ON → annual (the trial plan), OFF → monthly. */
export function planForTrialToggle(enabled: boolean): PurchasePlan {
  return enabled ? 'annual' : 'monthly';
}

/** Toggle reflects the selection: ON only when annual is selected and carries a trial. */
export function trialToggleValue(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): boolean {
  return selectedPlan === 'annual' && trialToggleVisible(pricing);
}

export type PaywallCta = {
  /** True only when the store confirmed a free trial on the selected plan. */
  hasTrial: boolean;
  /** Trial length in days when the store label is day-based, null otherwise. */
  trialDays: number | null;
};

export function paywallCta(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): PaywallCta {
  const planPricing = planPricingFor(pricing, selectedPlan);
  if (!planPricing?.hasFreeTrial) {
    return { hasTrial: false, trialDays: null };
  }

  return { hasTrial: true, trialDays: trialDayCountFromLabel(planPricing.trialLabel) };
}

/**
 * The billed-price line under the CTA — the real charge must be unmissable
 * (Apple 3.1.2c). Structured so the screen can localize the copy.
 */
export type PaywallBilledLine =
  | { kind: 'placeholder' }
  | { kind: 'trial_annual'; trialDays: number | null; priceString: string }
  | { kind: 'annual'; priceString: string }
  | { kind: 'monthly'; priceString: string };

export function paywallBilledLine(pricing: PlanPricing[] | null, selectedPlan: PurchasePlan): PaywallBilledLine {
  const planPricing = planPricingFor(pricing, selectedPlan);
  if (!planPricing) {
    // Offerings unavailable (offline, store down): never show a made-up price.
    return { kind: 'placeholder' };
  }

  if (selectedPlan === 'monthly') {
    return { kind: 'monthly', priceString: planPricing.priceString };
  }

  return planPricing.hasFreeTrial
    ? { kind: 'trial_annual', trialDays: trialDayCountFromLabel(planPricing.trialLabel), priceString: planPricing.priceString }
    : { kind: 'annual', priceString: planPricing.priceString };
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
