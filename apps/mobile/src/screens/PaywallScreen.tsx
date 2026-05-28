import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check, LockKeyhole, Sparkles } from 'lucide-react-native';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onPurchase: (plan: PaywallPlan) => void;
  onUnlockForDevelopment: () => void;
  onRestore: () => void;
  showDevelopmentUnlock: boolean;
};

const benefits = ['Scans repas illimites', 'Macros et calories avancees', 'Corrections de portions', 'Historique, progress et sync appareils'];

export function PaywallScreen({ onPurchase, onUnlockForDevelopment, onRestore, showDevelopmentUnlock }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, height: '100%', overflow: 'hidden' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: 128 }}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
          <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>MACROLENS</Text>
          <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderColor: colors.green, borderRadius: radius.pill, borderWidth: 2, height: 96, justifyContent: 'center', width: 96 }}>
            <Sparkles color={colors.green} size={42} strokeWidth={2.5} />
          </View>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>Unlock MacroLens Pro</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '700', lineHeight: 24, textAlign: 'center' }}>
            La meilleure experience pour scanner, corriger et suivre tes macros tous les jours.
          </Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <PaywallPlanCard plan="annual" selected={selectedPlan === 'annual'} title="Annuel" price="39,99 EUR / an" detail="3,33 EUR / mois. Meilleure valeur." badge="7 jours gratuits" onSelect={setSelectedPlan} />
          <PaywallPlanCard plan="monthly" selected={selectedPlan === 'monthly'} title="Mensuel" price="7,99 EUR / mois" detail="Flexible, annulable a tout moment." onSelect={setSelectedPlan} />
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
          Essai gratuit si disponible. Abonnement renouvele automatiquement. Annulable a tout moment depuis les reglages App Store. Les estimations nutritionnelles ne remplacent pas un avis medical.
        </Text>
        <Pressable onPress={onRestore} style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900' }}>Restaurer mes achats</Text>
        </Pressable>
        {showDevelopmentUnlock ? (
          <Pressable onPress={onUnlockForDevelopment} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}>
            <LockKeyhole color={colors.muted} size={14} strokeWidth={2.4} />
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>Continuer en mode test</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <StickyFooterButton label="Demarrer l'essai gratuit" onPress={() => onPurchase(selectedPlan)} />
    </View>
  );
}
