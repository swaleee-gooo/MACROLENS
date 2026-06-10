import { describe, expect, it } from 'vitest';
import type { PlanPricing } from '../entitlements/entitlementTypes';
import {
  ctaLabelForSelection,
  paywallLegalText,
  paywallPlanCardContent,
  paywallPricingLine,
  planSelectionAfterOtherOptionsToggle,
  trialTimeline,
  unlockedEyebrow,
} from './paywallViewModel';

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

describe('trialTimeline', () => {
  it('shows the timeline only when the annual plan has a store-confirmed free trial', () => {
    expect(trialTimeline(storePricing)).toEqual({ trialDays: 7, reminderDay: 5 });
    expect(trialTimeline(pricingWithoutTrial)).toBeNull();
    expect(trialTimeline(null)).toBeNull();
  });

  it('derives the day labels from the trial length in the store label', () => {
    const fourteenDayTrial: PlanPricing[] = [{ ...storePricing[0], trialLabel: '14 days free' }, storePricing[1]];

    expect(trialTimeline(fourteenDayTrial)).toEqual({ trialDays: 14, reminderDay: 12 });
  });

  it('falls back to the 7-day copy when the label carries no number', () => {
    const unlabeledTrial: PlanPricing[] = [{ ...storePricing[0], trialLabel: null }, storePricing[1]];

    expect(trialTimeline(unlabeledTrial)).toEqual({ trialDays: 7, reminderDay: 5 });
  });
});

describe('paywallPricingLine', () => {
  it('keeps the real billed annual price in the primary line, trial first', () => {
    const line = paywallPricingLine(storePricing, 'annual');

    expect(line.primary).toBe('7 days free, then $49.99/year');
    expect(line.secondary).toBe("that's $4.17/month · cancel anytime");
    expect(line.isPlaceholder).toBe(false);
  });

  it('drops the trial prefix when the annual plan has none', () => {
    const line = paywallPricingLine(pricingWithoutTrial, 'annual');

    expect(line.primary).toBe('$49.99/year');
    expect(line.secondary).toBe("that's $4.17/month · cancel anytime");
  });

  it('switches to the monthly billed price when monthly is selected', () => {
    const line = paywallPricingLine(storePricing, 'monthly');

    expect(line.primary).toBe('$9.99/month');
    expect(line.secondary).toBe('cancel anytime');
  });

  it('masks the price when pricing is unavailable', () => {
    const line = paywallPricingLine(null, 'annual');

    expect(line.primary).toBe('Price shown at checkout');
    expect(line.secondary).toBeNull();
    expect(line.isPlaceholder).toBe(true);
  });
});

describe('planSelectionAfterOtherOptionsToggle', () => {
  it('keeps the current selection while the other options stay visible', () => {
    expect(planSelectionAfterOtherOptionsToggle(true, 'monthly')).toBe('monthly');
    expect(planSelectionAfterOtherOptionsToggle(true, 'annual')).toBe('annual');
  });

  it('reverts to the hero annual plan when the other options collapse', () => {
    expect(planSelectionAfterOtherOptionsToggle(false, 'monthly')).toBe('annual');
    expect(planSelectionAfterOtherOptionsToggle(false, 'annual')).toBe('annual');
  });
});

describe('unlockedEyebrow', () => {
  it('claims an active trial only when the purchased plan had a store-confirmed one', () => {
    expect(unlockedEyebrow(storePricing, 'annual')).toEqual({ variant: 'trial', trialDays: 7 });
    expect(unlockedEyebrow(storePricing, 'monthly')).toEqual({ variant: 'pro' });
    expect(unlockedEyebrow(pricingWithoutTrial, 'annual')).toEqual({ variant: 'pro' });
  });

  it('shows plain Pro for restores and unknown pricing', () => {
    expect(unlockedEyebrow(storePricing, null)).toEqual({ variant: 'pro' });
    expect(unlockedEyebrow(null, 'annual')).toEqual({ variant: 'pro' });
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
