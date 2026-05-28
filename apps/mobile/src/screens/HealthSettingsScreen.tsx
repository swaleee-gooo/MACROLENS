import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Footprints, Heart, Scale, ShieldCheck } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  onBack: () => void;
};

function MetricRow({ label, detail, icon: Icon }: { label: string; detail: string; icon: typeof Heart }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
      <Icon color={colors.green} size={20} strokeWidth={2.4} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>{detail}</Text>
      </View>
    </View>
  );
}

export function HealthSettingsScreen({ onBack }: Props) {
  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Apple Health</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Suivi prevu pour enrichir le progress avec pas, activite et poids.</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
          <Heart color="#FF5B6E" fill="#FF5B6E" size={24} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Non connecte</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', marginTop: spacing.xs }}>Connexion HealthKit native requise pour lire ces donnees.</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <MetricRow detail="Afficher depense active et tendance quotidienne." icon={Footprints} label="Pas et activite" />
        <MetricRow detail="Suivre les weigh-ins et la trajectoire de poids." icon={Scale} label="Poids" />
        <MetricRow detail="Controle utilisateur, lecture minimale, aucune revente." icon={ShieldCheck} label="Confidentialite" />
      </View>

      <Pressable onPress={() => Linking.openSettings()} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, justifyContent: 'center', minHeight: 56 }}>
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Ouvrir les reglages iOS</Text>
      </Pressable>
    </ScrollView>
  );
}
