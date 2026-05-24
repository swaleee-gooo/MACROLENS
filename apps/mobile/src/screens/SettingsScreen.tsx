import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, ShieldCheck, Target, Trash2, User } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  analysisMode: 'mock' | 'remote';
  mealCount: number;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenTargets: () => void;
  onClearMeals: () => void;
};

function RowButton({
  label,
  detail,
  icon,
  onPress,
  danger = false,
}: {
  label: string;
  detail: string;
  icon: 'profile' | 'targets' | 'delete';
  onPress: () => void;
  danger?: boolean;
}) {
  const Icon = icon === 'profile' ? User : icon === 'targets' ? Target : Trash2;

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: danger ? '#F2B8B5' : colors.line,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <Icon color={danger ? colors.red : colors.ink} size={20} strokeWidth={2.4} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: danger ? colors.red : colors.ink, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>{detail}</Text>
      </View>
    </Pressable>
  );
}

export function SettingsScreen({ analysisMode, mealCount, onBack, onOpenProfile, onOpenTargets, onClearMeals }: Props) {
  function confirmClearMeals() {
    Alert.alert('Supprimer l historique', `${mealCount} repas locaux seront supprimes.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onClearMeals },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Parametres</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>{mealCount} repas dans l historique local</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <ShieldCheck color={analysisMode === 'remote' ? colors.green : colors.amber} size={20} strokeWidth={2.4} />
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>
            Analyse {analysisMode === 'remote' ? 'IA active' : 'demo'}
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
          En mode IA, les photos sont envoyees a l analyse distante pour produire les macros. Ne photographie pas de donnees sensibles.
        </Text>
      </View>

      <View style={{ backgroundColor: '#FFF7E8', borderColor: '#F1C27D', borderRadius: radius.sm, borderWidth: 1, padding: spacing.md }}>
        <Text style={{ color: colors.amber, fontSize: typography.small, fontWeight: '900', lineHeight: 18 }}>
          Les estimations nutritionnelles ne remplacent pas un avis medical ou dietetique.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <RowButton label="Profil" detail="Mettre a jour objectif, taille, poids et activite." icon="profile" onPress={onOpenProfile} />
        <RowButton label="Objectifs macros" detail="Voir les calories, proteines, glucides, lipides et fibres cibles." icon="targets" onPress={onOpenTargets} />
        <RowButton label="Supprimer l historique" detail="Effacer uniquement les repas stockes sur cet appareil." icon="delete" onPress={confirmClearMeals} danger />
      </View>
    </ScrollView>
  );
}
