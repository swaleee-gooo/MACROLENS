import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { Flame, Plus, Settings } from 'lucide-react-native';
import { MealCard } from '../components/MealCard';
import { useLang, type Lang } from '../i18n/LanguageContext';
import type { HomeStreakCalendar, HomeStreakDay } from '../domain/homeStreak';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import { buildDayReviewViewModel } from '../ui/dayReviewViewModel';
import { buildPremiumDashboardViewModel } from '../ui/premiumDashboardViewModel';
import { Card, Eyebrow, Num, Ring, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  profile: UserProfile | null;
  onOpenSettings: () => void;
  onOpenMeal: (meal: Meal) => void;
  onRelogMeal: (meal: Meal) => void;
  onStartScan: () => void;
  onOpenSavedMeals: () => void;
};

const STR = {
  en: {
    today: 'Today',
    caloriesLeft: 'Calories left',
    remaining: 'remaining',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    confidence: 'Confidence today',
    mealsToday: 'Meals — today',
    scanMeal: 'Scan a meal',
    verified: 'verified',
    estimated: 'estimated',
    recent: 'Recent',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  fr: {
    today: 'Aujourd’hui',
    caloriesLeft: 'Calories restantes',
    remaining: 'restantes',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    confidence: 'Confiance du jour',
    mealsToday: 'Repas — aujourd’hui',
    scanMeal: 'Scanner un repas',
    verified: 'vérifiés',
    estimated: 'estimés',
    recent: 'Récents',
    weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    months: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
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

function isVerifiedMeal(meal: Meal): boolean {
  return meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://') || meal.confidence === 'high';
}

function ProgressFill({ progress, color, height = 7 }: { progress: number; color: string; height?: number }) {
  return (
    <View style={{ backgroundColor: colors.paper3, borderRadius: radius.pill, height, overflow: 'hidden' }}>
      <View style={{ backgroundColor: color, borderRadius: radius.pill, height, width: `${Math.min(progress, 100)}%` as DimensionValue }} />
    </View>
  );
}

function MacroMini({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  return (
    <View style={{ gap: 5 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '600' }}>{label}</Text>
        <Num style={{ color: colors.muted, fontSize: 11 }}>
          {formatNumber(consumed)} / {target}
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

function dateLabel(lang: Lang): string {
  const t = STR[lang];
  const now = new Date();
  return `${t.weekdays[now.getDay()]} ${String(now.getDate()).padStart(2, '0')} ${t.months[now.getMonth()]}`;
}

export function PremiumHomeScreen({ meals, targets, profile, onOpenSettings, onOpenMeal, onStartScan, onOpenSavedMeals }: Props) {
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
  const caloriesRemaining = Math.max(0, calorieTarget - dayReview.calories.consumed);
  const calorieProgress = clampProgress(dayReview.calories.consumed, calorieTarget) / 100;

  const verifiedCount = dayReview.meals.filter(isVerifiedMeal).length;
  const estimatedCount = dayReview.meals.length - verifiedCount;
  const confidencePct = dayReview.meals.length > 0 ? Math.round((verifiedCount / dayReview.meals.length) * 100) : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.md, padding: spacing.xl, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 5 }}>
          <Eyebrow>{dateLabel(lang)}</Eyebrow>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.title, letterSpacing: -0.6 }}>{dayReview.isToday ? t.today : dayReview.subtitle}</Text>
        </View>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ alignItems: 'center', borderColor: colors.line2, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
            <Flame color={colors.warn} size={15} strokeWidth={2} />
            <Num style={{ fontSize: 13, fontWeight: '600' }}>{vm.streakDays}</Num>
          </View>
          <Pressable accessibilityLabel="Settings" onPress={onOpenSettings} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }}>
            <Settings color={colors.ink2} size={19} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <DaySelector calendar={vm.streakCalendar} selectedIsoDate={selectedIsoDate} onSelectDay={setSelectedIsoDate} />

      {/* Calorie ring + macros */}
      <Card style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.lg, padding: spacing.lg }}>
        <Ring progress={calorieProgress} size={116} stroke={9} color={colors.ink}>
          <Num style={{ fontSize: 27, fontWeight: '500', letterSpacing: -0.6 }}>{caloriesRemaining}</Num>
          <Eyebrow style={{ marginTop: 1 }}>{t.remaining}</Eyebrow>
        </Ring>
        <View style={{ flex: 1, gap: 13 }}>
          <MacroMini label={t.protein} consumed={dayReview.protein.consumed} target={proteinTarget} color={colors.protein} />
          <MacroMini label={t.carbs} consumed={dayReview.carbs.consumed} target={carbsTarget} color={colors.carbs} />
          <MacroMini label={t.fat} consumed={dayReview.fat.consumed} target={fatTarget} color={colors.fat} />
        </View>
      </Card>

      {/* Confidence of the day */}
      {dayReview.meals.length > 0 ? (
        <Card style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: radius.md, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 }}>
            <Seal size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>
              {t.confidence} · <Num style={{ fontSize: 14, fontWeight: '600' }}>{confidencePct}%</Num>
            </Text>
            <Num style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
              {verifiedCount} {t.verified} · {estimatedCount} {t.estimated}
            </Num>
          </View>
        </Card>
      ) : null}

      {/* Meals */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
        <Eyebrow>{t.mealsToday}</Eyebrow>
        <Pressable onPress={onOpenSavedMeals} hitSlop={8}>
          <Eyebrow color={colors.accentInk}>{t.recent}</Eyebrow>
        </Pressable>
      </View>
      {dayReview.meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />
      ))}

      <Pressable
        onPress={onStartScan}
        style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.lg, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.lg }}
      >
        <Plus color={colors.accent} size={18} strokeWidth={2.2} />
        <Text style={{ color: colors.ink2, fontSize: 14, fontWeight: '600' }}>{t.scanMeal}</Text>
      </Pressable>
    </ScrollView>
  );
}
