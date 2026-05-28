import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Download, LogOut, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  isAuthenticated: boolean;
  mealCount: number;
  onBack: () => void;
  onExportData: () => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
};

function ActionButton({ label, detail, danger = false, icon: Icon, onPress }: { label: string; detail: string; danger?: boolean; icon: typeof Download; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: danger ? '#F2B8B5' : colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <Icon color={danger ? colors.red : colors.black} size={20} strokeWidth={2.4} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: danger ? colors.red : colors.black, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>{detail}</Text>
      </View>
    </Pressable>
  );
}

export function DataPrivacyScreen({ isAuthenticated, mealCount, onBack, onExportData, onLogout, onDeleteAccount }: Props) {
  function confirmDeleteAccount() {
    Alert.alert('Supprimer le compte', 'Cette action supprime les donnees MacroLens liees au compte et efface les donnees de cet appareil.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onDeleteAccount },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Donnees</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>{mealCount} repas exportables. Les suppressions serveur utilisent les politiques RLS du compte connecte.</Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <ActionButton detail="Partager un export JSON complet: profil, repas, abonnement et date d export." icon={Download} label="Exporter mes donnees" onPress={onExportData} />
        {isAuthenticated ? <ActionButton detail="Retirer la session de cet appareil." icon={LogOut} label="Se deconnecter" onPress={onLogout} /> : null}
        <ActionButton danger detail={isAuthenticated ? 'Supprimer les donnees serveur et locales.' : 'Effacer les donnees locales de cet appareil.'} icon={Trash2} label={isAuthenticated ? 'Supprimer mon compte' : 'Effacer mes donnees locales'} onPress={confirmDeleteAccount} />
      </View>
    </ScrollView>
  );
}
