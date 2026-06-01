import { describe, expect, it } from 'vitest';
import { selectPackageForPlan } from './revenueCatEntitlementProvider';

describe('selectPackageForPlan', () => {
  it('selects packages by configured product identifier first', () => {
    const monthlyPackage = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'macrolens_pro_monthly' } };
    const annualPackage = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'macrolens_pro_annual' } };

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
