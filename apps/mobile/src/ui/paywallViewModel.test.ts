import { describe, expect, it } from 'vitest';
import type { PlanPricing } from '../entitlements/entitlementTypes';
import {
  paywallBilledLine,
  paywallCta,
  paywallLegalText,
  planForTrialToggle,
  savingsPercent,
  trialDayCountFromLabel,
  trialTimeline,
  trialTimelineForSelection,
  trialToggleValue,
  trialToggleVisible,
  unlockedEyebrow,
} from './paywallViewModel';

const storePricing: PlanPricing[] = [
  { plan: 'annual', priceString: '$49.99', price: 49.99, perMonthPriceString: '$4.17', hasFreeTrial: true, trialLabel: '7 days free' },
  { plan: 'monthly', priceString: '$9.99', price: 9.99, perMonthPriceString: null, hasFreeTrial: false, trialLabel: null },
];

const pricingWithoutTrial: PlanPricing[] = storePricing.map((entry) => ({ ...entry, hasFreeTrial: false, trialLabel: null }));

describe('savingsPercent', () => {
  it('computes the yearly saving vs 12 months of monthly billing', () => {
    // 1 - 49.99 / (9.99 * 12) = 0.583 → 58%
    expect(savingsPercent(storePricing)).toBe(58);
  });

  it('returns null when pricing is unavailable or a numeric price is unknown', () => {
    expect(savingsPercent(null)).toBeNull();
    expect(savingsPercent([{ ...storePricing[0], price: 0 }, storePricing[1]])).toBeNull();
    expect(savingsPercent([storePricing[0], { ...storePricing[1], price: 0 }])).toBeNull();
  });

  it('returns null when the annual plan saves nothing', () => {
    expect(savingsPercent([{ ...storePricing[0], price: 119.88 }, storePricing[1]])).toBeNull();
    expect(savingsPercent([{ ...storePricing[0], price: 150 }, storePricing[1]])).toBeNull();
  });
});

describe('trial toggle', () => {
  it('shows the toggle only when the store confirmed a free trial on annual', () => {
    expect(trialToggleVisible(storePricing)).toBe(true);
    expect(trialToggleVisible(pricingWithoutTrial)).toBe(false);
    expect(trialToggleVisible(null)).toBe(false);
  });

  it('maps the toggle to the matching plan: ON → annual, OFF → monthly', () => {
    expect(planForTrialToggle(true)).toBe('annual');
    expect(planForTrialToggle(false)).toBe('monthly');
  });

  it('derives the toggle value from the selected plan', () => {
    expect(trialToggleValue(storePricing, 'annual')).toBe(true);
    expect(trialToggleValue(storePricing, 'monthly')).toBe(false);
    expect(trialToggleValue(pricingWithoutTrial, 'annual')).toBe(false);
    expect(trialToggleValue(null, 'annual')).toBe(false);
  });
});

describe('trialDayCountFromLabel', () => {
  it('returns the day count only for day-based store labels', () => {
    expect(trialDayCountFromLabel('7 days free')).toBe(7);
    expect(trialDayCountFromLabel('1 day free')).toBe(1);
    expect(trialDayCountFromLabel('1 week free')).toBeNull();
    expect(trialDayCountFromLabel(null)).toBeNull();
  });
});

describe('trialTimeline', () => {
  it('exists only when the annual plan has a store-confirmed free trial', () => {
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

describe('trialTimelineForSelection', () => {
  it('renders inside the yearly card only while annual is selected', () => {
    expect(trialTimelineForSelection(storePricing, 'annual')).toEqual({ trialDays: 7, reminderDay: 5 });
    expect(trialTimelineForSelection(storePricing, 'monthly')).toBeNull();
    expect(trialTimelineForSelection(pricingWithoutTrial, 'annual')).toBeNull();
    expect(trialTimelineForSelection(null, 'annual')).toBeNull();
  });
});

describe('paywallCta', () => {
  it('promises a free trial only when the selected plan has one', () => {
    expect(paywallCta(storePricing, 'annual')).toEqual({ hasTrial: true, trialDays: 7 });
    expect(paywallCta(storePricing, 'monthly')).toEqual({ hasTrial: false, trialDays: null });
    expect(paywallCta(pricingWithoutTrial, 'annual')).toEqual({ hasTrial: false, trialDays: null });
    expect(paywallCta(null, 'annual')).toEqual({ hasTrial: false, trialDays: null });
  });

  it('omits the day count when the store label is not day-based', () => {
    const weekTrial: PlanPricing[] = [{ ...storePricing[0], trialLabel: '1 week free' }, storePricing[1]];

    expect(paywallCta(weekTrial, 'annual')).toEqual({ hasTrial: true, trialDays: null });
  });
});

describe('paywallBilledLine', () => {
  it('keeps the real billed annual price with the trial first', () => {
    expect(paywallBilledLine(storePricing, 'annual')).toEqual({ kind: 'trial_annual', trialDays: 7, priceString: '$49.99' });
  });

  it('drops the trial when the annual plan has none', () => {
    expect(paywallBilledLine(pricingWithoutTrial, 'annual')).toEqual({ kind: 'annual', priceString: '$49.99' });
  });

  it('switches to the monthly billed price when monthly is selected', () => {
    expect(paywallBilledLine(storePricing, 'monthly')).toEqual({ kind: 'monthly', priceString: '$9.99' });
  });

  it('masks the price when pricing is unavailable', () => {
    expect(paywallBilledLine(null, 'annual')).toEqual({ kind: 'placeholder' });
    expect(paywallBilledLine(null, 'monthly')).toEqual({ kind: 'placeholder' });
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
