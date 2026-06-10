import { describe, expect, it } from 'vitest';
import { entitlementId, pricingFromOffering, selectPackageForPlan } from './revenueCatEntitlementProvider';

describe('entitlementId', () => {
  it('matches the RevenueCat dashboard lookup_key exactly — case- and space-sensitive', () => {
    // The dashboard entitlement is named "MACROLENS Pro" (entl5208524e5c).
    // A mismatch here means paying users never unlock premium. Do NOT
    // "normalize" this string without renaming the entitlement in RevenueCat.
    expect(entitlementId).toBe('MACROLENS Pro');
  });
});

describe('selectPackageForPlan', () => {
  it('selects packages by configured product identifier first', () => {
    const monthlyPackage = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'prod03d96b4e28' } };
    const annualPackage = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'prod0ef75e0b34' } };

    expect(selectPackageForPlan([annualPackage, monthlyPackage], 'monthly')).toBe(monthlyPackage);
    expect(selectPackageForPlan([monthlyPackage, annualPackage], 'annual')).toBe(annualPackage);
  });

  it('falls back to RevenueCat package type when product ids differ', () => {
    const monthlyPackage = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'store_month' } };
    const annualPackage = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'store_year' } };

    expect(selectPackageForPlan([annualPackage, monthlyPackage], 'monthly')).toBe(monthlyPackage);
    expect(selectPackageForPlan([monthlyPackage, annualPackage], 'annual')).toBe(annualPackage);
  });

  it('returns null when no package matches the requested plan', () => {
    expect(selectPackageForPlan([{ identifier: '$rc_lifetime', packageType: 'LIFETIME' }], 'annual')).toBeNull();
  });
});

function annualPackage(productOverrides: Record<string, unknown> = {}) {
  return {
    identifier: '$rc_annual',
    packageType: 'ANNUAL',
    product: {
      identifier: 'prod0ef75e0b34',
      priceString: '$49.99',
      price: 49.99,
      currencyCode: 'USD',
      introPrice: null,
      ...productOverrides,
    },
  };
}

function monthlyPackage(productOverrides: Record<string, unknown> = {}) {
  return {
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'prod03d96b4e28',
      priceString: '$9.99',
      price: 9.99,
      currencyCode: 'USD',
      introPrice: null,
      ...productOverrides,
    },
  };
}

function formattedPerMonth(price: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, { currency: currencyCode, style: 'currency' }).format(price / 12);
}

describe('pricingFromOffering', () => {
  it('maps store packages to localized plan pricing with a per-month equivalent on annual only', () => {
    const pricing = pricingFromOffering({ availablePackages: [monthlyPackage(), annualPackage()] });

    expect(pricing).toEqual([
      {
        plan: 'annual',
        priceString: '$49.99',
        perMonthPriceString: formattedPerMonth(49.99, 'USD'),
        hasFreeTrial: false,
        trialLabel: null,
      },
      {
        plan: 'monthly',
        priceString: '$9.99',
        perMonthPriceString: null,
        hasFreeTrial: false,
        trialLabel: null,
      },
    ]);
  });

  it('derives a generic trial label from a zero-price introductory offer', () => {
    const withDays = pricingFromOffering({
      availablePackages: [monthlyPackage(), annualPackage({ introPrice: { price: 0, periodNumberOfUnits: 7, periodUnit: 'DAY' } })],
    });
    expect(withDays[0].hasFreeTrial).toBe(true);
    expect(withDays[0].trialLabel).toBe('7 days free');

    const withSingleWeek = pricingFromOffering({
      availablePackages: [monthlyPackage(), annualPackage({ introPrice: { price: 0, periodNumberOfUnits: 1, periodUnit: 'WEEK' } })],
    });
    expect(withSingleWeek[0].trialLabel).toBe('1 week free');
  });

  it('never advertises a free trial for a paid introductory offer', () => {
    const pricing = pricingFromOffering({
      availablePackages: [monthlyPackage(), annualPackage({ introPrice: { price: 19.99, periodNumberOfUnits: 1, periodUnit: 'YEAR' } })],
    });

    expect(pricing[0].hasFreeTrial).toBe(false);
    expect(pricing[0].trialLabel).toBeNull();
  });

  it('reports no trial when the introductory offer is absent', () => {
    const pricing = pricingFromOffering({ availablePackages: [monthlyPackage(), annualPackage({ introPrice: undefined })] });

    expect(pricing[0].hasFreeTrial).toBe(false);
    expect(pricing[0].trialLabel).toBeNull();
  });

  it('formats the per-month equivalent in the store currency', () => {
    const pricing = pricingFromOffering({
      availablePackages: [
        monthlyPackage({ priceString: '9,99 €', price: 9.99, currencyCode: 'EUR' }),
        annualPackage({ priceString: '49,99 €', price: 49.99, currencyCode: 'EUR' }),
      ],
    });

    expect(pricing[0].priceString).toBe('49,99 €');
    expect(pricing[0].perMonthPriceString).toBe(formattedPerMonth(49.99, 'EUR'));
  });

  it('throws when the current offering is missing', () => {
    expect(() => pricingFromOffering(null)).toThrow('revenuecat_offering_missing');
  });

  it('throws when a plan package is missing from the offering', () => {
    expect(() => pricingFromOffering({ availablePackages: [annualPackage()] })).toThrow('revenuecat_package_missing_monthly');
  });

  it('throws when the store returns no localized price string', () => {
    expect(() => pricingFromOffering({ availablePackages: [monthlyPackage(), annualPackage({ priceString: undefined })] })).toThrow(
      'revenuecat_price_missing_annual',
    );
  });
});
