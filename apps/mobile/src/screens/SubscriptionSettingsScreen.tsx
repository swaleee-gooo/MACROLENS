import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, CreditCard, RefreshCw } from 'lucide-react-native';
import type { PurchasePlan } from '../entitlements/entitlementTypes';
import type { EntitlementState } from '../storage/entitlementRepository';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  entitlement: EntitlementState;
  onBack: () => void;
  onPurchase: (plan: PurchasePlan) => Promise<void> | void;
  onRestore: () => Promise<void>;
};

export function SubscriptionSettingsScreen({ entitlement, onBack, onPurchase, onRestore }: Props) {
  const status = entitlement.isPremium ? 'Active' : 'Inactive';
  const restoreIsPrimary = entitlement.isPremium;

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Back</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Subscription</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>MacroLens Pro, restore, and App Store billing.</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
          <CreditCard color={entitlement.isPremium ? colors.green : colors.black} size={22} strokeWidth={2.4} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>MacroLens Pro</Text>
            <Text style={{ color: entitlement.isPremium ? colors.green : colors.muted, fontSize: typography.small, fontWeight: '900', marginTop: spacing.xs }}>{status}</Text>
          </View>
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>
          Product: {entitlement.productId ?? 'none'}{entitlement.expiresAt ? `\nExpires: ${entitlement.expiresAt}` : ''}
        </Text>
      </View>

      {!entitlement.isPremium ? (
        <View style={{ gap: spacing.sm }}>
          <Pressable onPress={() => onPurchase('annual')} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, justifyContent: 'center', minHeight: 62, paddingHorizontal: spacing.lg }}>
            <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Start annual plan</Text>
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: typography.tiny, fontWeight: '800', marginTop: 2 }}>EUR 49.99 / year</Text>
          </Pressable>
          <Pressable onPress={() => onPurchase('monthly')} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 58, paddingHorizontal: spacing.lg }}>
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Monthly plan</Text>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', marginTop: 2 }}>EUR 9.99 / month</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={onRestore}
        style={{
          alignItems: 'center',
          backgroundColor: restoreIsPrimary ? colors.black : colors.surface,
          borderColor: restoreIsPrimary ? colors.black : colors.line,
          borderRadius: radius.pill,
          borderWidth: 1,
          flexDirection: 'row',
          gap: spacing.sm,
          justifyContent: 'center',
          minHeight: 56,
        }}
      >
        <RefreshCw color={restoreIsPrimary ? 'white' : colors.black} size={18} strokeWidth={2.5} />
        <Text style={{ color: restoreIsPrimary ? 'white' : colors.black, fontSize: typography.body, fontWeight: '900' }}>Restore purchases</Text>
      </Pressable>

      <Pressable onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 54 }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Manage in the App Store</Text>
      </Pressable>
    </ScrollView>
  );
}
