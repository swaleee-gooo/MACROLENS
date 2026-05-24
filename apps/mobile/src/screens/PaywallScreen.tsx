import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, LockKeyhole, Sparkles } from 'lucide-react-native';
import { PaywallPlanCard, type PaywallPlan } from '../components/PaywallPlanCard';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onUnlockForDevelopment: () => void;
  onRestore: () => void;
};

const benefits = ['Analyse photo IA', 'Objectifs calories et proteines', 'Corrections de portions', 'Timeline et progression'];

export function PaywallScreen({ onUnlockForDevelopment, onRestore }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlan>('annual');

  function subscribe() {
    Alert.alert('Achats en developpement', 'Les achats reels seront actives dans une development build avec RevenueCat.');
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, height: 84, justifyContent: 'center', width: 84 }}>
            <Sparkles color="white" size={36} strokeWidth={2.5} />
          </View>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>Atteins tes macros avec l'IA</Text>
          <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '700', lineHeight: 24, textAlign: 'center' }}>
            Scanne tes repas, ajuste les portions et suis tes objectifs chaque jour.
          </Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <PaywallPlanCard plan="annual" selected={selectedPlan === 'annual'} title="Annuel" price="39,99 EUR / an" detail="Meilleure valeur pour progresser toute l'annee." badge="Economise 58%" onSelect={setSelectedPlan} />
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
          Abonnement renouvele automatiquement. Annulable a tout moment depuis les reglages App Store. Les estimations nutritionnelles ne remplacent pas un avis medical.
        </Text>
        <Pressable onPress={onRestore} style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '900' }}>Restaurer mes achats</Text>
        </Pressable>
        <Pressable onPress={onUnlockForDevelopment} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}>
          <LockKeyhole color={colors.muted} size={14} strokeWidth={2.4} />
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800' }}>Continuer en mode test Expo Go</Text>
        </Pressable>
      </ScrollView>
      <StickyFooterButton label="Continuer" onPress={subscribe} />
    </View>
  );
}
