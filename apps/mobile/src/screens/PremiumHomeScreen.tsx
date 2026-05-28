import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { CalendarDays, Flame, Plus, RotateCcw } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { MealCard } from '../components/MealCard';
import { PremiumCard } from '../components/PremiumCard';
import { RingProgress } from '../components/RingProgress';
import { buildMealShortcuts, type MealShortcut } from '../domain/mealShortcuts';
import { buildRecurringMealSuggestions, type RecurringMealSuggestion } from '../domain/recurringMeals';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import type { HomeStreakCalendar } from '../domain/homeStreak';
import { buildDayReviewViewModel } from '../ui/dayReviewViewModel';
import { buildPremiumDashboardViewModel } from '../ui/premiumDashboardViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  profile: UserProfile | null;
  onOpenSettings: () => void;
  onOpenMeal: (meal: Meal) => void;
  onRelogMeal: (meal: Meal) => void;
};

function StreakCalendarStrip({
  calendar,
  selectedIsoDate,
  onSelectDay,
}: {
  calendar: HomeStreakCalendar;
  selectedIsoDate: string;
  onSelectDay: (isoDate: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const todayIndex = calendar.days.findIndex((day) => day.isToday);
    const targetX = Math.max(0, (todayIndex - 3) * 52);
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
    }, 0);

    return () => clearTimeout(timeout);
  }, [calendar.days]);

  return (
    <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xl }}>
        {calendar.days.map((day) => {
          const selected = day.isoDate === selectedIsoDate;
          const active = selected || day.hasMeal || day.isToday;
          const borderColor = selected ? colors.black : day.isToday ? colors.black : day.hasMeal ? colors.green : colors.line;
          const backgroundColor = selected ? colors.black : day.hasMeal ? colors.greenSoft : colors.surface;
          const textColor = selected ? 'white' : day.isFuture ? colors.muted : colors.black;

          return (
            <Pressable key={day.isoDate} onPress={() => onSelectDay(day.isoDate)} style={{ alignItems: 'center', gap: spacing.xs, width: 42 }}>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor,
                  borderColor,
                  borderRadius: radius.pill,
                  borderWidth: active ? 2 : 1,
                  height: 34,
                  justifyContent: 'center',
                  width: 34,
                }}
              >
                <Text style={{ color: textColor, fontSize: typography.small, fontWeight: '900' }}>{day.weekdayLabel}</Text>
              </View>
              <Text style={{ color: selected || day.isToday ? colors.black : colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>{day.dayOfMonth}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MacroProgress({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const progress = target > 0 ? Math.round((consumed / target) * 100) : 0;

  return (
    <PremiumCard style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>
          {consumed}g <Text style={{ color: colors.muted, fontSize: typography.body }}>/ {target}g</Text>
        </Text>
      </View>
      <RingProgress size={68} strokeWidth={8} progress={progress} color={color} label="" detail="" />
    </PremiumCard>
  );
}

function CompactMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, gap: spacing.xs }}>
      <View style={{ backgroundColor: color, borderRadius: radius.pill, height: 7, width: 7 }} />
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>{label}</Text>
      <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

function QuickRelogCard({ suggestion, onRelogMeal }: { suggestion: RecurringMealSuggestion; onRelogMeal: (meal: Meal) => void }) {
  return (
    <PremiumCard style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{suggestion.mealName}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>
            {suggestion.calories} kcal - {suggestion.proteinG} g proteines
          </Text>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>
            {suggestion.count}x logge - dernier: {suggestion.lastLoggedLabel}
          </Text>
        </View>
        <Pressable
          onPress={() => onRelogMeal(suggestion.templateMeal)}
          style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 42, paddingHorizontal: spacing.md }}
        >
          <Plus color="white" size={16} strokeWidth={2.8} />
          <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>Relogger</Text>
        </Pressable>
      </View>
    </PremiumCard>
  );
}

function MealShortcutChip({
  shortcut,
  onOpenMeal,
  onRelogMeal,
}: {
  shortcut: MealShortcut;
  onOpenMeal: (meal: Meal) => void;
  onRelogMeal: (meal: Meal) => void;
}) {
  return (
    <Pressable
      onPress={() => onRelogMeal(shortcut.latestMeal)}
      onLongPress={() => onOpenMeal(shortcut.latestMeal)}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.pill,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        minHeight: 44,
        paddingHorizontal: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, height: 24, justifyContent: 'center', width: 24 }}>
        <RotateCcw color="white" size={13} strokeWidth={3} />
      </View>
      <View style={{ maxWidth: 144 }}>
        <Text numberOfLines={1} style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>
          {shortcut.label}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>
          {shortcut.count}x - {shortcut.latestMeal.caloriesEstimate} kcal
        </Text>
      </View>
    </Pressable>
  );
}

export function PremiumHomeScreen({ meals, targets, profile, onOpenSettings, onOpenMeal, onRelogMeal }: Props) {
  const { width } = useWindowDimensions();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedIsoDate, setSelectedIsoDate] = useState(today);
  const vm = buildPremiumDashboardViewModel(meals, today, targets, profile);
  const dayReview = buildDayReviewViewModel(meals, selectedIsoDate, today, targets);
  const mealShortcuts = buildMealShortcuts(meals, 5);
  const quickRelogMeals = buildRecurringMealSuggestions(meals, 3);
  const calorieRingSize = Math.min(width - spacing.xl * 4, 228);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
      <BrandHeader onSettings={onOpenSettings} />
      <StreakCalendarStrip calendar={vm.streakCalendar} selectedIsoDate={selectedIsoDate} onSelectDay={setSelectedIsoDate} />

      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>{dayReview.isToday ? "Aujourd'hui" : dayReview.subtitle}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{dayReview.mealCount} repas logges</Text>
        </View>
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Flame color={colors.green} size={16} strokeWidth={2.6} />
          <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>{vm.streakDays}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
          <View style={{ alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories totales</Text>
            <CalendarDays color={colors.muted} size={18} strokeWidth={2.5} />
          </View>
          <RingProgress size={calorieRingSize} strokeWidth={16} progress={dayReview.calories.progress} label={`${dayReview.calories.consumed}`} detail={`/ ${dayReview.calories.target || '--'} kcal`} />
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm }}>
            <CompactMetric label="Protein" value={`${dayReview.protein.consumed}/${dayReview.protein.target}g`} color={colors.protein} />
            <CompactMetric label="Carbs" value={`${dayReview.carbs.consumed}/${dayReview.carbs.target}g`} color={colors.carbs} />
            <CompactMetric label="Fat" value={`${dayReview.fat.consumed}/${dayReview.fat.target}g`} color={colors.fat} />
          </View>
          <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>{dayReview.calories.remaining} kcal restantes</Text>
        </PremiumCard>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <MacroProgress label="Proteines" consumed={dayReview.protein.consumed} target={dayReview.protein.target} color={colors.green} />
        <MacroProgress label="Glucides" consumed={dayReview.carbs.consumed} target={dayReview.carbs.target} color={colors.blue} />
        <MacroProgress label="Lipides" consumed={dayReview.fat.consumed} target={dayReview.fat.target} color={colors.amber} />
      </View>

      {quickRelogMeals.length > 0 ? (
        <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
          {mealShortcuts.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Acces rapide</Text>
                <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Appui long: detail</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.xl }}>
                {mealShortcuts.map((shortcut) => (
                  <MealShortcutChip key={`${shortcut.latestMeal.id}-${shortcut.label}`} shortcut={shortcut} onOpenMeal={onOpenMeal} onRelogMeal={onRelogMeal} />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <RotateCcw color={colors.black} size={21} strokeWidth={2.5} />
              <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Repas rapides</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>1 tap</Text>
          </View>
          {quickRelogMeals.map((suggestion) => (
            <QuickRelogCard key={suggestion.id} suggestion={suggestion} onRelogMeal={onRelogMeal} />
          ))}
        </View>
      ) : null}

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Recently logged</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>{dayReview.mealCount} repas</Text>
        </View>
        {dayReview.meals.length === 0 ? (
          <PremiumCard style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 }}>
              <Plus color={colors.green} size={26} strokeWidth={2.8} />
            </View>
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Scanne ton premier repas</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19, textAlign: 'center' }}>Utilise le bouton central pour ajouter un repas, un produit ou une etiquette.</Text>
          </PremiumCard>
        ) : (
          dayReview.meals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
        )}
      </View>
    </ScrollView>
  );
}
