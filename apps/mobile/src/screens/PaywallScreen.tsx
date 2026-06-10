import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, LockKeyhole } from 'lucide-react-native';
import { MacroPlanAsset } from '../components/BrandAssets';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { privacyUrl, termsUrl } from '../config/legalLinks';
import type { PlanPricing } from '../entitlements/entitlementTypes';
import { ctaLabelForSelection, paywallLegalText, paywallPlanCardContent } from '../ui/paywallViewModel';
import { colors, spacing, typography } from '../ui/theme';

type Props = {
  pricing: PlanPricing[] | null;
  onPurchase: (plan: PaywallPlan) => void;
  onRetryPricing: () => void;
  onUnlockForDevelopment: () => void;
  onRestore: () => void;
  showDevelopmentUnlock: boolean;
};

const benefits = ['Unlimited meal scans', 'Advanced macros and calories', 'Portion corrections', 'History, progress, and device sync'];

export function PaywallScreen({ pricing, onPurchase, onRetryPricing, onUnlockForDevelopment, onRestore, showDevelopmentUnlock }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');
  const annualCard = paywallPlanCardContent(pricing, 'annual');
  const monthlyCard = paywallPlanCardContent(pricing, 'monthly');

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, height: '100%', overflow: 'hidden' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: 128 }}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
          <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>MACROLENS</Text>
          <View style={{ alignItems: 'center' }}>
            <MacroPlanAsset height={164} width={274} />
          </View>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>Unlock MacroLens Pro</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '700', lineHeight: 24, textAlign: 'center' }}>
            The best experience for scanning, correcting, and tracking your macros every day.
          </Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <PaywallPlanCard
            plan="annual"
            selected={selectedPlan === 'annual'}
            title="Annual"
            price={annualCard.price}
            priceIsPlaceholder={annualCard.priceIsPlaceholder}
            detail={annualCard.detail}
            badge={annualCard.badge ?? undefined}
            onSelect={setSelectedPlan}
          />
          <PaywallPlanCard
            plan="monthly"
            selected={selectedPlan === 'monthly'}
            title="Monthly"
            price={monthlyCard.price}
            priceIsPlaceholder={monthlyCard.priceIsPlaceholder}
            detail={monthlyCard.detail}
            badge={monthlyCard.badge ?? undefined}
            onSelect={setSelectedPlan}
          />
        </View>
        {pricing === null ? (
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>Prices are loading…</Text>
            <Pressable onPress={onRetryPricing} hitSlop={8}>
              <Text style={{ color: colors.ink, fontSize: typography.tiny, fontWeight: '900', textDecorationLine: 'underline' }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{ gap: spacing.sm }}>
          {benefits.map((benefit) => (
            <View key={benefit} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <Check color={colors.green} size={18} strokeWidth={2.5} />
              <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{benefit}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 17, textAlign: 'center' }}>
          {paywallLegalText(pricing, selectedPlan)}
        </Text>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'center' }}>
          <Pressable onPress={() => Linking.openURL(termsUrl)} hitSlop={8}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', textDecorationLine: 'underline' }}>Terms of Use</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(privacyUrl)} hitSlop={8}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', textDecorationLine: 'underline' }}>Privacy Policy</Text>
          </Pressable>
        </View>
        <Pressable onPress={onRestore} style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900' }}>Restore purchases</Text>
        </Pressable>
        {showDevelopmentUnlock ? (
          <Pressable onPress={onUnlockForDevelopment} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}>
            <LockKeyhole color={colors.muted} size={14} strokeWidth={2.4} />
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>Continue in test mode</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <StickyFooterButton label={ctaLabelForSelection(pricing, selectedPlan)} onPress={() => onPurchase(selectedPlan)} />
    </View>
  );
}
