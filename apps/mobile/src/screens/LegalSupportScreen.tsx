import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { ChevronLeft, ExternalLink, FileText, Info, LifeBuoy, Mail, ShieldCheck, Sliders, Star } from 'lucide-react-native';
import { privacyUrl, termsUrl } from '../config/legalLinks';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, Seal } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    title: 'Legal & support',
    support: 'Support',
    contactSupport: 'Contact support',
    helpCenter: 'Help centre',
    rateApp: 'Rate the app',
    legal: 'Legal',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    noticesLicenses: 'Notices & licences',
    version: (v: string) => `MacroLens · v${v}`,
  },
  fr: {
    title: 'Légal & support',
    support: 'Support',
    contactSupport: 'Contacter le support',
    helpCenter: "Centre d'aide",
    rateApp: "Noter l'app",
    legal: 'Légal',
    termsOfUse: "Conditions d'utilisation",
    privacyPolicy: 'Politique de confidentialité',
    noticesLicenses: 'Mentions & licences',
    version: (v: string) => `MacroLens · v${v}`,
  },
};

const supportUrl = 'mailto:idriss.carta@gmail.com?subject=MacroLens%20Support';

type Props = {
  onBack: () => void;
};

function LinkRow({
  label,
  icon: Icon,
  url,
  isLast = false,
}: {
  label: string;
  icon: typeof FileText;
  url: string;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => ({
        alignItems: 'center' as const,
        borderBottomColor: colors.line,
        borderBottomWidth: isLast ? 0 : 1,
        flexDirection: 'row' as const,
        gap: spacing.md,
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: spacing.md,
        paddingVertical: 13,
      })}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
        <Icon color={colors.ink2} size={17} strokeWidth={2} />
      </View>
      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '500' }}>{label}</Text>
      <ExternalLink color={colors.muted2} size={15} strokeWidth={2} />
    </Pressable>
  );
}

export function LegalSupportScreen({ onBack }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const version = Constants.expoConfig?.version ?? '2.0.0';

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>

      {/* Push header: back chevron + centered title */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
        <Pressable onPress={onBack} style={({ pressed }) => ({ alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: -6, opacity: pressed ? 0.7 : 1, width: 30 })}>
          <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
        </Pressable>
        <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600', letterSpacing: -0.1 }}>{t.title}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Support group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.support}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <LinkRow icon={Mail} label={t.contactSupport} url={supportUrl} />
          <LinkRow icon={LifeBuoy} label={t.helpCenter} url={supportUrl} />
          <LinkRow icon={Star} label={t.rateApp} url="https://apps.apple.com/app/id6774111134?action=write-review" isLast />
        </Card>
      </View>

      {/* Legal group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.legal}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <LinkRow icon={FileText} label={t.termsOfUse} url={termsUrl} />
          <LinkRow icon={ShieldCheck} label={t.privacyPolicy} url={privacyUrl} />
          <LinkRow icon={Info} label={t.noticesLicenses} url={privacyUrl} isLast />
        </Card>
      </View>

      {/* Version footer */}
      <View style={{ alignItems: 'center', marginTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Seal size={34} color={colors.muted2} />
        <Eyebrow style={{ color: colors.muted2, marginTop: 10 }}>{t.version(version)}</Eyebrow>
      </View>
    </ScrollView>
  );
}
