import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Bell, CreditCard, Download, FileText, Heart, ShieldCheck, Target, Trash2, User } from 'lucide-react-native';
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
  icon: 'profile' | 'targets' | 'delete' | 'subscription' | 'reminders' | 'export' | 'legal' | 'health';
  onPress: () => void;
  danger?: boolean;
}) {
  const Icon =
    icon === 'profile'
      ? User
      : icon === 'targets'
        ? Target
        : icon === 'subscription'
          ? CreditCard
          : icon === 'reminders'
            ? Bell
            : icon === 'export'
              ? Download
              : icon === 'legal'
                ? FileText
                : icon === 'health'
                  ? Heart
                  : Trash2;

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

  function unavailable(label: string) {
    Alert.alert(label, 'Cette section sera connectee dans la prochaine build native.');
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Settings</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>{mealCount} repas dans l historique local</Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg }}>
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

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Compte</Text>
        <RowButton label="Profil" detail="Mettre a jour objectif, taille, poids et activite." icon="profile" onPress={onOpenProfile} />
        <RowButton label="Objectifs macros" detail="Calories, proteines, glucides, lipides et fibres cibles." icon="targets" onPress={onOpenTargets} />
        <RowButton label="Abonnement" detail="Gerer MacroLens Pro, restaurer les achats et consulter la facturation." icon="subscription" onPress={() => unavailable('Abonnement')} />
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Tracking</Text>
        <RowButton label="Rappels repas" detail="Petit-dejeuner, dejeuner, diner et eau." icon="reminders" onPress={() => unavailable('Rappels')} />
        <RowButton label="Apple Health" detail="Pas, poids et activite pour enrichir le progress." icon="health" onPress={() => unavailable('Apple Health')} />
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Donnees</Text>
        <RowButton label="Exporter mes donnees" detail="Telecharger repas, poids, progres et reglages." icon="export" onPress={() => unavailable('Export')} />
        <RowButton label="Legal et support" detail="Privacy Policy, Terms of Use et contact." icon="legal" onPress={() => unavailable('Legal et support')} />
        <RowButton label="Supprimer l historique" detail="Effacer uniquement les repas stockes sur cet appareil." icon="delete" onPress={confirmClearMeals} danger />
      </View>

      <View style={{ backgroundColor: '#FFF7E8', borderColor: '#F1C27D', borderRadius: radius.md, borderWidth: 1, padding: spacing.md }}>
        <Text style={{ color: colors.amber, fontSize: typography.small, fontWeight: '900', lineHeight: 18 }}>MacroLens n'est pas un dispositif medical. Les estimations nutritionnelles ne remplacent pas un avis medical ou dietetique.</Text>
      </View>
    </ScrollView>
  );
}
