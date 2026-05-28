import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, CreditCard, RefreshCw } from 'lucide-react-native';
import type { EntitlementState } from '../storage/entitlementRepository';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  entitlement: EntitlementState;
  onBack: () => void;
  onRestore: () => Promise<void>;
};

export function SubscriptionSettingsScreen({ entitlement, onBack, onRestore }: Props) {
  const status = entitlement.isPremium ? 'Actif' : 'Non actif';

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Abonnement</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>MacroLens Pro, restauration et facturation App Store.</Text>
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
          Produit: {entitlement.productId ?? 'aucun'}{entitlement.expiresAt ? `\nExpire: ${entitlement.expiresAt}` : ''}
        </Text>
      </View>

      <Pressable onPress={onRestore} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 56 }}>
        <RefreshCw color="white" size={18} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Restaurer les achats</Text>
      </Pressable>

      <Pressable onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 54 }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Gerer sur l App Store</Text>
      </Pressable>
    </ScrollView>
  );
}
