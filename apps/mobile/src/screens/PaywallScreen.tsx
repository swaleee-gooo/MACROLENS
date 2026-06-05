import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check, LockKeyhole } from 'lucide-react-native';
import { MacroPlanAsset } from '../components/BrandAssets';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { colors, spacing, typography } from '../ui/theme';

type Props = {
  onPurchase: (plan: PaywallPlan) => void;
  onUnlockForDevelopment: () => void;
  onRestore: () => void;
  showDevelopmentUnlock: boolean;
};

const benefits = ['Unlimited meal scans', 'Advanced macros and calories', 'Portion corrections', 'History, progress, and device sync'];

export function PaywallScreen({ onPurchase, onUnlockForDevelopment, onRestore, showDevelopmentUnlock }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');

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
          <PaywallPlanCard plan="annual" selected={selectedPlan === 'annual'} title="Annual" price="EUR 49.99 / year" detail="EUR 4.17 / month. Best value." badge="7 days free" onSelect={setSelectedPlan} />
          <PaywallPlanCard plan="monthly" selected={selectedPlan === 'monthly'} title="Monthly" price="EUR 9.99 / month" detail="Flexible, cancel anytime." onSelect={setSelectedPlan} />
        </View>
        <View style={{ gap: spacing.sm }}>
          {benefits.map((benefit) => (
            <View key={benefit} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <Check color={colors.green} size={18} strokeWidth={2.5} />
              <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{benefit}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 17, textAlign: 'center' }}>
          Free trial if available. Subscription renews automatically. Cancel anytime from App Store settings. Nutrition estimates do not replace medical advice.
        </Text>
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
      <StickyFooterButton label="Start free trial" onPress={() => onPurchase(selectedPlan)} />
    </View>
  );
}
