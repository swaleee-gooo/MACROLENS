import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import type { ReactNode } from 'react';
import { FileText, Scale } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import type { HomeStreakCalendar, HomeStreakDay } from '../domain/homeStreak';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import { buildDayReviewViewModel } from '../ui/dayReviewViewModel';
import { buildPremiumDashboardViewModel } from '../ui/premiumDashboardViewModel';
import { Card, Eyebrow, Num } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  profile: UserProfile | null;
  onBack: () => void;
  onAddWeighIn: () => void;
  onOpenWeeklyReport: () => void;
  onOpenMeal: (meal: Meal) => void;
};

const STR = {
  en: {
    progress: 'Progress',
    today: 'Today',
    consumed: 'Consumed',
    remaining: 'Remaining',
    goal: 'Goal',
    macroTargets: 'Macros — targets',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    weighIn: 'Weigh-in',
    report: 'Report',
    goalKcal: (n: number) => `Goal ${n} kcal`,
  },
  fr: {
    progress: 'Progrès',
    today: 'Aujourd’hui',
    consumed: 'Consommé',
    remaining: 'Restant',
    goal: 'Objectif',
    macroTargets: 'Macros — cibles',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    weighIn: 'Pesée',
    report: 'Rapport',
    goalKcal: (n: number) => `Objectif ${n} kcal`,
  },
};

function clampProgress(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function defaultTarget(value: number, fallback: number): number {
  return value > 0 ? value : fallback;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function ProgressFill({ progress, color, height = 8 }: { progress: number; color: string; height?: number }) {
  return (
    <View style={{ backgroundColor: colors.paper3, borderRadius: radius.pill, height, overflow: 'hidden' }}>
      <View style={{ backgroundColor: color, borderRadius: radius.pill, height, width: `${Math.min(progress, 100)}%` as DimensionValue }} />
    </View>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Num style={{ color: accent ? colors.accentInk : colors.ink, fontSize: 22, fontWeight: '600' }}>{value}</Num>
      <Eyebrow style={{ marginTop: 3 }}>{label}</Eyebrow>
    </View>
  );
}

function MacroTargetRow({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        <Num style={{ color: colors.muted, fontSize: 12 }}>
          {formatNumber(consumed)} / {target} g
        </Num>
      </View>
      <ProgressFill progress={clampProgress(consumed, target)} color={color} />
    </View>
  );
}

function DayChip({ day, selected, onSelectDay }: { day: HomeStreakDay; selected: boolean; onSelectDay: (isoDate: string) => void }) {
  return (
    <Pressable
      onPress={() => onSelectDay(day.isoDate)}
      style={{
        alignItems: 'center',
        backgroundColor: selected ? colors.ink : colors.surface,
        borderColor: selected ? colors.ink : colors.line,
        borderRadius: radius.md,
        borderWidth: 1,
        gap: 4,
        height: 58,
        justifyContent: 'center',
        marginRight: spacing.sm,
        width: 50,
      }}
    >
      <Eyebrow color={selected ? 'rgba(255,255,255,0.7)' : colors.muted} style={{ fontSize: 9 }}>
        {day.weekdayLabel}
      </Eyebrow>
      <Num style={{ color: selected ? '#FFFFFF' : colors.ink, fontSize: 15, fontWeight: '600' }}>{day.dayOfMonth}</Num>
      <View style={{ backgroundColor: day.hasMeal ? (selected ? '#FFFFFF' : colors.accent) : 'transparent', borderRadius: radius.pill, height: 4, width: 4 }} />
    </Pressable>
  );
}

function DaySelector({ calendar, selectedIsoDate, onSelectDay }: { calendar: HomeStreakCalendar; selectedIsoDate: string; onSelectDay: (isoDate: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
      {calendar.days.map((day) => (
        <DayChip key={day.isoDate} day={day} selected={day.isoDate === selectedIsoDate} onSelectDay={onSelectDay} />
      ))}
    </ScrollView>
  );
}

function ActionButton({ icon, label, onPress, variant }: { icon: ReactNode; label: string; onPress: () => void; variant: 'dark' | 'ghost' }) {
  const dark = variant === 'dark';
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: dark ? colors.ink : colors.paper2,
        borderColor: dark ? 'transparent' : colors.line2,
        borderRadius: radius.md,
        borderWidth: dark ? 0 : 1,
        flex: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        paddingVertical: 15,
      }}
    >
      {icon}
      <Text style={{ color: dark ? '#FFFFFF' : colors.ink, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function TodayScreen({ meals, targets, profile, onAddWeighIn, onOpenWeeklyReport }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const today = new Date().toISOString().slice(0, 10);
  const [selectedIsoDate, setSelectedIsoDate] = useState(today);
  const vm = buildPremiumDashboardViewModel(meals, today, targets, profile);
  const dayReview = buildDayReviewViewModel(meals, selectedIsoDate, today, targets);
  const calorieTarget = defaultTarget(dayReview.calories.target, 2260);
  const proteinTarget = defaultTarget(dayReview.protein.target, 145);
  const carbsTarget = defaultTarget(dayReview.carbs.target, 263);
  const fatTarget = defaultTarget(dayReview.fat.target, 70);
  const consumed = dayReview.calories.consumed;
  const remaining = Math.max(0, calorieTarget - consumed);
  const calorieProgress = clampProgress(consumed, calorieTarget);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.md, padding: spacing.xl, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 5 }}>
        <Eyebrow>{t.progress}</Eyebrow>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.title, letterSpacing: -0.6 }}>{dayReview.isToday ? t.today : dayReview.subtitle}</Text>
      </View>

      <DaySelector calendar={vm.streakCalendar} selectedIsoDate={selectedIsoDate} onSelectDay={setSelectedIsoDate} />

      {/* Calorie summary */}
      <Card style={{ gap: spacing.lg, padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Stat value={consumed} label={t.consumed} />
          <Stat value={remaining} label={t.remaining} accent />
          <Stat value={calorieTarget} label={t.goal} />
        </View>
        <ProgressFill progress={calorieProgress} color={colors.ink} height={10} />
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Num style={{ color: colors.muted, fontSize: 11 }}>0</Num>
          <Num style={{ color: colors.muted, fontSize: 11 }}>{t.goalKcal(calorieTarget)}</Num>
        </View>
      </Card>

      {/* Macro targets */}
      <Card style={{ gap: spacing.lg, padding: spacing.lg }}>
        <Eyebrow>{t.macroTargets}</Eyebrow>
        <MacroTargetRow label={t.protein} consumed={dayReview.protein.consumed} target={proteinTarget} color={colors.protein} />
        <MacroTargetRow label={t.carbs} consumed={dayReview.carbs.consumed} target={carbsTarget} color={colors.carbs} />
        <MacroTargetRow label={t.fat} consumed={dayReview.fat.consumed} target={fatTarget} color={colors.fat} />
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <ActionButton variant="dark" icon={<Scale color="#FFFFFF" size={17} strokeWidth={2} />} label={t.weighIn} onPress={onAddWeighIn} />
        <ActionButton variant="ghost" icon={<FileText color={colors.ink} size={17} strokeWidth={2} />} label={t.report} onPress={onOpenWeeklyReport} />
      </View>
    </ScrollView>
  );
}
