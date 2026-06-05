import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { ChevronLeft, Dumbbell, Download, Flame, Heart, Scale, Share2 } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    title: 'Apple Health',
    connected: 'Apple Health',
    connectedStatus: 'Connected',
    sync: 'Sync',
    readWeight: 'Read weight',
    readEnergy: 'Read active energy',
    writeCalories: 'Write calories',
    writeWeight: 'Write weight',
    workouts: 'Workouts',
    importSessions: 'Import sessions',
    openSettings: 'Open iOS Settings',
  },
  fr: {
    title: 'Santé',
    connected: 'Apple Santé',
    connectedStatus: 'Connecté',
    sync: 'Synchronisation',
    readWeight: 'Lire le poids',
    readEnergy: "Lire l'énergie active",
    writeCalories: 'Écrire les calories',
    writeWeight: 'Écrire le poids',
    workouts: 'Entraînements',
    importSessions: 'Importer les séances',
    openSettings: 'Ouvrir Réglages iOS',
  },
};

type Props = {
  onBack: () => void;
};

function SyncRow({
  label,
  icon: Icon,
  value,
  onValueChange,
  isLast = false,
}: {
  label: string;
  icon: typeof Heart;
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

type SyncState = {
  readWeight: boolean;
  readEnergy: boolean;
  writeCalories: boolean;
  writeWeight: boolean;
  importSessions: boolean;
};

export function HealthSettingsScreen({ onBack }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [sync, setSync] = useState<SyncState>({
    readWeight: true,
    readEnergy: true,
    writeCalories: true,
    writeWeight: false,
    importSessions: true,
  });

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

      {/* Connection status card */}
      <Card style={{ alignItems: 'center', flexDirection: 'row', gap: 13, padding: 16 }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.dangerWash, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 }}>
          <Heart color={colors.danger} fill={colors.danger} size={22} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{t.connected}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, marginTop: 2 }}>{t.connectedStatus}</Text>
        </View>
        <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 5 }}>
          <Text style={{ color: colors.accentInk, fontSize: 10, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>✓ {lang === 'fr' ? 'Actif' : 'Active'}</Text>
        </View>
      </Card>

      {/* Sync group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.sync}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <SyncRow icon={Download} label={t.readWeight} value={sync.readWeight} onValueChange={(v) => setSync({ ...sync, readWeight: v })} />
          <SyncRow icon={Flame} label={t.readEnergy} value={sync.readEnergy} onValueChange={(v) => setSync({ ...sync, readEnergy: v })} />
          <SyncRow icon={Share2} label={t.writeCalories} value={sync.writeCalories} onValueChange={(v) => setSync({ ...sync, writeCalories: v })} />
          <SyncRow icon={Scale} label={t.writeWeight} value={sync.writeWeight} onValueChange={(v) => setSync({ ...sync, writeWeight: v })} isLast />
        </Card>
      </View>

      {/* Workouts group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.workouts}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <SyncRow icon={Dumbbell} label={t.importSessions} value={sync.importSessions} onValueChange={(v) => setSync({ ...sync, importSessions: v })} isLast />
        </Card>
      </View>
    </ScrollView>
  );
}
