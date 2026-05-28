import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { ArrowLeft, ExternalLink, FileText, LifeBuoy, ShieldCheck } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../ui/theme';

const privacyUrl = 'https://github.com/swaleee-gooo/MACROLENS/blob/codex/macrolens-mvp/docs/legal/privacy-policy.md';
const termsUrl = 'https://github.com/swaleee-gooo/MACROLENS/blob/codex/macrolens-mvp/docs/legal/terms-of-use.md';
const supportUrl = 'mailto:idriss.carta@gmail.com?subject=MacroLens%20Support';

type Props = {
  onBack: () => void;
};

function LinkRow({ label, detail, icon: Icon, url }: { label: string; detail: string; icon: typeof FileText; url: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <Icon color={colors.black} size={20} strokeWidth={2.4} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>{detail}</Text>
      </View>
      <ExternalLink color={colors.muted} size={18} strokeWidth={2.3} />
    </Pressable>
  );
}

export function LegalSupportScreen({ onBack }: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.5} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.hero, fontWeight: '900' }}>Legal</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Documents App Store, contact support et disclaimer nutritionnel.</Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <LinkRow detail="Comment MacroLens collecte, protege et supprime tes donnees." icon={ShieldCheck} label="Privacy Policy" url={privacyUrl} />
        <LinkRow detail="Conditions d utilisation, abonnement et limites du service." icon={FileText} label="Terms of Use" url={termsUrl} />
        <LinkRow detail="Envoyer une demande support ou une question de compte." icon={LifeBuoy} label="Support contact" url={supportUrl} />
      </View>

      <View style={{ backgroundColor: '#FFF7E8', borderColor: '#F1C27D', borderRadius: radius.md, borderWidth: 1, padding: spacing.md }}>
        <Text style={{ color: colors.amber, fontSize: typography.small, fontWeight: '900', lineHeight: 18 }}>
          MacroLens n est pas un dispositif medical. Les calories, macros, portions et rapports sont des estimations pour le suivi personnel et ne remplacent pas un avis medical ou dietetique.
        </Text>
      </View>

      <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>Version {version}</Text>
    </ScrollView>
  );
}
