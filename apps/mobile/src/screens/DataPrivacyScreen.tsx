import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { AlertTriangle, ChevronLeft, ChevronRight, Download, LogOut, RefreshCw, Settings2, Bell, Trash2 } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    title: 'Data & privacy',
    myData: 'Your data',
    exportLabel: 'Export my data',
    clearCache: 'Clear cache',
    privacy: 'Privacy',
    analytics: 'Analytics sharing',
    communications: 'Product communications',
    dangerZone: 'Danger zone',
    signOut: 'Sign out',
    deleteAccount: 'Delete my account',
    clearLocal: 'Clear local data',
    infoNote: 'Account deletion is permanent and clears your entire history within 30 days.',
    alertTitle: 'Delete account',
    alertBody: 'This deletes MacroLens data linked to the account and clears data from this device.',
    alertCancel: 'Cancel',
    alertDelete: 'Delete',
    exportableLabel: (count: number) => `${count} exportable ${count === 1 ? 'meal' : 'meals'}`,
  },
  fr: {
    title: 'Données & confidentialité',
    myData: 'Tes données',
    exportLabel: 'Exporter mes données',
    clearCache: 'Vider le cache',
    privacy: 'Confidentialité',
    analytics: 'Partage analytique',
    communications: 'Communications produit',
    dangerZone: 'Zone sensible',
    signOut: 'Se déconnecter',
    deleteAccount: 'Supprimer mon compte',
    clearLocal: 'Effacer les données locales',
    infoNote: 'La suppression du compte est définitive et efface tout ton historique sous 30 jours.',
    alertTitle: 'Supprimer le compte',
    alertBody: 'Cela supprime les données MacroLens liées au compte et efface les données de cet appareil.',
    alertCancel: 'Annuler',
    alertDelete: 'Supprimer',
    exportableLabel: (count: number) => `${count} repas exportable${count === 1 ? '' : 's'}`,
  },
};

type Props = {
  isAuthenticated: boolean;
  mealCount: number;
  onBack: () => void;
  onExportData: () => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
};

function ActionRow({
  label,
  danger = false,
  icon: Icon,
  onPress,
  isLast = false,
}: {
  label: string;
  danger?: boolean;
  icon: typeof Download;
  onPress: () => void;
  isLast?: boolean;
}) {
  const iconBg = danger ? colors.dangerWash : colors.paper2;
  const iconColor = danger ? colors.danger : colors.ink2;

  return (
    <Pressable
      onPress={onPress}
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
      <View style={{ alignItems: 'center', backgroundColor: iconBg, borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
        <Icon color={iconColor} size={17} strokeWidth={2} />
      </View>
      <Text style={{ color: danger ? colors.danger : colors.ink, flex: 1, fontSize: typography.body, fontWeight: '500' }}>{label}</Text>
      <ChevronRight color={danger ? colors.dangerInk : colors.muted2} size={16} strokeWidth={2} />
    </Pressable>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  value,
  onValueChange,
  isLast = false,
}: {
  label: string;
  icon: typeof Bell;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: colors.line,
        borderBottomWidth: isLast ? 0 : 1,
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 13,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.sm, height: 32, justifyContent: 'center', width: 32 }}>
        <Icon color={colors.ink2} size={16} strokeWidth={2} />
      </View>
      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '500' }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line2, true: colors.accent }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

export function DataPrivacyScreen({ isAuthenticated, mealCount, onBack, onExportData, onLogout, onDeleteAccount }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [analytics, setAnalytics] = useState(false);
  const [communications, setCommunications] = useState(true);

  function confirmDeleteAccount() {
    Alert.alert(t.alertTitle, t.alertBody, [
      { text: t.alertCancel, style: 'cancel' },
      { text: t.alertDelete, style: 'destructive', onPress: onDeleteAccount },
    ]);
  }

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

      {/* My data group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.myData}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <ActionRow icon={Download} label={t.exportLabel} onPress={onExportData} />
          <ActionRow icon={RefreshCw} label={t.clearCache} onPress={() => undefined} isLast />
        </Card>
      </View>

      {/* Privacy group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.privacy}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <ToggleRow icon={Settings2} label={t.analytics} value={analytics} onValueChange={setAnalytics} />
          <ToggleRow icon={Bell} label={t.communications} value={communications} onValueChange={setCommunications} isLast />
        </Card>
      </View>

      {/* Danger zone */}
      <Eyebrow style={{ paddingHorizontal: 4 }}>{t.dangerZone}</Eyebrow>
      <Card style={{ overflow: 'hidden' }}>
        {isAuthenticated ? (
          <ActionRow icon={LogOut} label={t.signOut} onPress={onLogout} />
        ) : null}
        <ActionRow
          danger
          icon={Trash2}
          label={isAuthenticated ? t.deleteAccount : t.clearLocal}
          onPress={confirmDeleteAccount}
          isLast
        />
      </Card>

      {/* Info note card */}
      <Card style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10, padding: 14 }}>
        <AlertTriangle color={colors.danger} size={16} strokeWidth={2} style={{ marginTop: 1 }} />
        <Text style={{ color: colors.muted, flex: 1, fontSize: typography.small, lineHeight: 19 }}>{t.infoNote}</Text>
      </Card>
    </ScrollView>
  );
}
