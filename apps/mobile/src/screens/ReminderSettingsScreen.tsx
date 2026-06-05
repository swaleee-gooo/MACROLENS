import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, ChevronLeft, Clock, Coffee, Dumbbell, Droplets, FileText, Flame, Moon, UtensilsCrossed } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    title: 'Reminders',
    meals: 'Meals',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    habits: 'Habits',
    weighIn: 'Weigh-in reminder',
    weighInTime: 'Mon 08:00',
    streakAlert: 'Streak alert',
    streakAlertTime: '21:00',
    weeklyReport: 'Weekly report',
    weeklyReportTime: 'Sun',
    infoNote: 'Reminders only appear if you have not already logged the relevant meal.',
  },
  fr: {
    title: 'Rappels',
    meals: 'Repas',
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collation',
    habits: 'Habitudes',
    weighIn: 'Rappel de pesée',
    weighInTime: 'Lun 08:00',
    streakAlert: 'Alerte streak',
    streakAlertTime: '21:00',
    weeklyReport: 'Rapport hebdo',
    weeklyReportTime: 'Dim',
    infoNote: "Les rappels n'apparaissent que si tu n'as pas déjà loggé le repas concerné.",
  },
};

type Props = {
  onBack: () => void;
};

type ReminderState = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snack: boolean;
  weighIn: boolean;
  streakAlert: boolean;
  weeklyReport: boolean;
};

const key = 'macrolens.reminders.v1';
const defaults: ReminderState = { breakfast: true, lunch: true, dinner: true, snack: false, weighIn: true, streakAlert: true, weeklyReport: true };

function ReminderRow({
  label,
  detail,
  value,
  onValueChange,
  icon: Icon,
  isLast = false,
}: {
  label: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: typeof Bell;
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
      <View style={{ alignItems: 'center', backgroundColor: value ? colors.accentWash : colors.paper2, borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
        <Icon color={value ? colors.accentInk : colors.muted} size={16} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small }}>{detail}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        value={value}
        trackColor={{ false: colors.line2, true: colors.accent }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

export function ReminderSettingsScreen({ onBack }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [state, setState] = useState<ReminderState>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) {
          setState({ ...defaults, ...(JSON.parse(raw) as Partial<ReminderState>) });
        }
      })
      .catch(() => undefined);
  }, []);

  async function update(next: ReminderState) {
    setState(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
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

      {/* Meals group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.meals}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <ReminderRow icon={Clock} detail="08:00" label={t.breakfast} value={state.breakfast} onValueChange={(value) => update({ ...state, breakfast: value })} />
          <ReminderRow icon={Clock} detail="12:30" label={t.lunch} value={state.lunch} onValueChange={(value) => update({ ...state, lunch: value })} />
          <ReminderRow icon={Clock} detail="19:30" label={t.dinner} value={state.dinner} onValueChange={(value) => update({ ...state, dinner: value })} />
          <ReminderRow icon={Clock} detail="16:00" label={t.snack} value={state.snack} onValueChange={(value) => update({ ...state, snack: value })} isLast />
        </Card>
      </View>

      {/* Habits group */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.habits}</Eyebrow>
        <Card style={{ overflow: 'hidden' }}>
          <ReminderRow icon={Dumbbell} detail={t.weighInTime} label={t.weighIn} value={state.weighIn} onValueChange={(value) => update({ ...state, weighIn: value })} />
          <ReminderRow icon={Flame} detail={t.streakAlertTime} label={t.streakAlert} value={state.streakAlert} onValueChange={(value) => update({ ...state, streakAlert: value })} />
          <ReminderRow icon={FileText} detail={t.weeklyReportTime} label={t.weeklyReport} value={state.weeklyReport} onValueChange={(value) => update({ ...state, weeklyReport: value })} isLast />
        </Card>
      </View>

      {/* Info note card */}
      <Card style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10, padding: 14 }}>
        <Bell color={colors.muted} size={16} strokeWidth={2} style={{ marginTop: 1 }} />
        <Text style={{ color: colors.muted, flex: 1, fontSize: typography.small, lineHeight: 19 }}>{t.infoNote}</Text>
      </Card>
    </ScrollView>
  );
}
