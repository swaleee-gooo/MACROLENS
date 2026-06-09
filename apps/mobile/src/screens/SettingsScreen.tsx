import { Pressable, ScrollView, Text, View } from 'react-native';
import { Bell, ChevronLeft, ChevronRight, CreditCard, Download, FileText, Heart, Scale, Target, User } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    settings: 'Settings',
    language: 'Language',
    account: 'Account',
    profile: 'Edit profile',
    macroTargets: 'Macro targets',
    subscription: 'Subscription',
    preferences: 'Preferences',
    reminders: 'Meal reminders',
    appleHealth: 'Apple Health',
    calibration: 'Calibration',
    data: 'Data',
    exportDeletion: 'Data & privacy',
    help: 'Help',
    legalSupport: 'Legal & support',
    syncableMeals: (count: number) => `${count} syncable ${count === 1 ? 'meal' : 'meals'}`,
  },
  fr: {
    settings: 'Réglages',
    language: 'Langue',
    account: 'Compte',
    profile: 'Modifier le profil',
    macroTargets: 'Cibles & macros',
    subscription: 'Abonnement',
    preferences: 'Préférences',
    reminders: 'Rappels',
    appleHealth: 'Santé',
    calibration: 'Calibration',
    data: 'Données',
    exportDeletion: 'Données & confidentialité',
    help: 'Aide',
    legalSupport: 'Légal & support',
    syncableMeals: (count: number) => `${count} ${count === 1 ? 'repas' : 'repas'} synchronisable${count === 1 ? '' : 's'}`,
  },
};

type Props = {
  analysisMode: 'mock' | 'remote';
  authEmail: string | null;
  isAuthenticated: boolean;
  mealCount: number;
  showSubscription: boolean;
  userName?: string;
  onBack: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenTargets: () => void;
  onOpenSubscription: () => void;
  onOpenReminders: () => void;
  onOpenHealth: () => void;
  onOpenCalibration: () => void;
  onOpenData: () => void;
  onOpenLegal: () => void;
};

type RowIcon = 'profile' | 'targets' | 'subscription' | 'reminders' | 'export' | 'legal' | 'health' | 'calibration';

function iconForKey(icon: RowIcon) {
  if (icon === 'profile') return User;
  if (icon === 'targets') return Target;
  if (icon === 'subscription') return CreditCard;
  if (icon === 'reminders') return Bell;
  if (icon === 'export') return Download;
  if (icon === 'legal') return FileText;
  if (icon === 'calibration') return Scale;
  return Heart;
}

function SettingsRow({
  label,
  value,
  icon,
  onPress,
  danger = false,
  isLast = false,
}: {
  label: string;
  value?: string;
  icon: RowIcon;
  onPress: () => void;
  danger?: boolean;
  isLast?: boolean;
}) {
  const Icon = iconForKey(icon);
  const iconBg = danger ? colors.dangerWash : colors.paper2;
  const iconColor = danger ? colors.danger : colors.ink2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          borderBottomColor: colors.line,
          borderBottomWidth: isLast ? 0 : 1,
          flexDirection: 'row',
          gap: spacing.md,
          opacity: pressed ? 0.7 : 1,
          paddingHorizontal: spacing.md,
          paddingVertical: 13,
        },
      ]}
    >
      <View style={{ alignItems: 'center', backgroundColor: iconBg, borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
        <Icon color={iconColor} size={17} strokeWidth={2} />
      </View>
      <Text style={{ color: danger ? colors.danger : colors.ink, flex: 1, fontSize: typography.body, fontWeight: '500' }}>{label}</Text>
      {value ? <Num style={{ color: colors.muted, fontSize: typography.small }}>{value}</Num> : null}
      <ChevronRight color={colors.muted2} size={16} strokeWidth={2} />
    </Pressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Eyebrow style={{ paddingHorizontal: 2 }}>{title}</Eyebrow>
      <Card style={{ overflow: 'hidden' }}>{children}</Card>
    </View>
  );
}

export function SettingsScreen({
  analysisMode: _analysisMode,
  authEmail,
  isAuthenticated,
  mealCount,
  showSubscription,
  userName,
  onBack,
  onOpenAuth: _onOpenAuth,
  onOpenProfile,
  onOpenTargets,
  onOpenSubscription,
  onOpenReminders,
  onOpenHealth,
  onOpenCalibration,
  onOpenData,
  onOpenLegal,
}: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  // Initials for the profile avatar
  const displayName = userName ?? (isAuthenticated && authEmail ? authEmail.split('@')[0] : '—');
  const initials = displayName
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>

      {/* Push header: back chevron + centered title */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingTop: 4 }}>
        <Pressable onPress={onBack} style={({ pressed }) => ({ alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: -6, opacity: pressed ? 0.7 : 1, width: 30 })}>
          <ChevronLeft color={colors.ink2} size={22} strokeWidth={2} />
        </Pressable>
        <Text style={{ color: colors.ink, fontFamily: undefined, fontSize: 16, fontWeight: '600', letterSpacing: -0.1 }}>{t.settings}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Profile header card */}
      <Pressable onPress={onOpenProfile} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card style={{ alignItems: 'center', flexDirection: 'row', gap: 13, padding: 15 }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: 13, height: 46, justifyContent: 'center', width: 46 }}>
            <Text style={{ color: colors.surface, fontSize: 17, fontWeight: '600' }}>{initials || '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{displayName}</Text>
            {authEmail ? <Num style={{ color: colors.muted, fontSize: typography.small, marginTop: 2 }}>{authEmail}</Num> : null}
          </View>
          <ChevronRight color={colors.muted2} size={16} strokeWidth={2} />
        </Card>
      </Pressable>

      {/* Account section */}
      <SectionCard title={t.account}>
        <SettingsRow label={t.profile} icon="profile" onPress={onOpenProfile} />
        {showSubscription ? (
          <>
            <SettingsRow label={t.macroTargets} icon="targets" onPress={onOpenTargets} />
            <SettingsRow label={t.subscription} value="Pro" icon="subscription" onPress={onOpenSubscription} isLast />
          </>
        ) : (
          <SettingsRow label={t.macroTargets} icon="targets" onPress={onOpenTargets} isLast />
        )}
      </SectionCard>

      {/* Preferences section */}
      <SectionCard title={t.preferences}>
        <SettingsRow label={t.reminders} icon="reminders" onPress={onOpenReminders} />
        <SettingsRow label={t.appleHealth} icon="health" onPress={onOpenHealth} />
        <SettingsRow label={t.calibration} icon="calibration" onPress={onOpenCalibration} isLast />
      </SectionCard>

      {/* Data section */}
      <SectionCard title={t.data}>
        <SettingsRow label={t.exportDeletion} icon="export" onPress={onOpenData} isLast />
      </SectionCard>

      {/* Help section */}
      <SectionCard title={t.help}>
        <SettingsRow label={t.legalSupport} icon="legal" onPress={onOpenLegal} isLast />
      </SectionCard>

      {/* Version footer */}
      <Eyebrow style={{ color: colors.muted2, paddingTop: spacing.sm, textAlign: 'center' }}>MacroLens · {t.syncableMeals(mealCount)}</Eyebrow>
    </ScrollView>
  );
}
