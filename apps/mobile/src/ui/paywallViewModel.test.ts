import { describe, expect, it } from 'vitest';
import type { PlanPricing } from '../entitlements/entitlementTypes';
import { ctaLabelForSelection, paywallLegalText, paywallPlanCardContent } from './paywallViewModel';

const storePricing: PlanPricing[] = [
  { plan: 'annual', priceString: '$49.99', perMonthPriceString: '$4.17', hasFreeTrial: true, trialLabel: '7 days free' },
  { plan: 'monthly', priceString: '$9.99', perMonthPriceString: null, hasFreeTrial: false, trialLabel: null },
];

const pricingWithoutTrial: PlanPricing[] = storePricing.map((entry) => ({ ...entry, hasFreeTrial: false, trialLabel: null }));

describe('paywallPlanCardContent', () => {
  it('keeps the full billed price dominant and the per-month equivalent in the detail line', () => {
    const annual = paywallPlanCardContent(storePricing, 'annual');

    expect(annual.price).toBe('$49.99 / year');
    expect(annual.detail).toBe('$4.17 / month. Best value.');
    expect(annual.priceIsPlaceholder).toBe(false);
  });

  it('shows the trial badge only on a plan with a store-confirmed free trial', () => {
    expect(paywallPlanCardContent(storePricing, 'annual').badge).toBe('7 days free');
    expect(paywallPlanCardContent(storePricing, 'monthly').badge).toBeNull();
    expect(paywallPlanCardContent(pricingWithoutTrial, 'annual').badge).toBeNull();
  });

  it('renders the monthly plan without a per-month equivalent', () => {
    const monthly = paywallPlanCardContent(storePricing, 'monthly');

    expect(monthly.price).toBe('$9.99 / month');
    expect(monthly.detail).toBe('Flexible, cancel anytime.');
  });

  it('masks prices when pricing is unavailable', () => {
    const annual = paywallPlanCardContent(null, 'annual');
    const monthly = paywallPlanCardContent(null, 'monthly');

    expect(annual.price).toBe('Price shown at checkout');
    expect(annual.priceIsPlaceholder).toBe(true);
    expect(annual.badge).toBeNull();
    expect(monthly.price).toBe('Price shown at checkout');
    expect(monthly.badge).toBeNull();
  });
});

describe('ctaLabelForSelection', () => {
  it('promises a free trial only when the selected plan has one', () => {
    expect(ctaLabelForSelection(storePricing, 'annual')).toBe('Start free trial');
    expect(ctaLabelForSelection(storePricing, 'monthly')).toBe('Subscribe');
    expect(ctaLabelForSelection(pricingWithoutTrial, 'annual')).toBe('Subscribe');
    expect(ctaLabelForSelection(null, 'annual')).toBe('Subscribe');
  });
});

describe('paywallLegalText', () => {
  it('mentions the free trial only when the selected plan has one', () => {
    expect(paywallLegalText(storePricing, 'annual')).toContain('free trial');
    expect(paywallLegalText(storePricing, 'monthly')).not.toContain('free trial');
    expect(paywallLegalText(null, 'annual')).not.toContain('free trial');
  });

  it('always keeps renewal, cancellation, and nutrition disclaimers', () => {
    for (const legalText of [paywallLegalText(storePricing, 'annual'), paywallLegalText(storePricing, 'monthly'), paywallLegalText(null, 'annual')]) {
      expect(legalText).toContain('renews automatically');
      expect(legalText).toContain('Cancel anytime from App Store settings.');
      expect(legalText).toContain('Nutrition estimates do not replace medical advice.');
    }
  });
});
