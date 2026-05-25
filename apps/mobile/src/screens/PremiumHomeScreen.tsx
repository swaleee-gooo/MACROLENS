import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Flame, Star } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { MealCard } from '../components/MealCard';
import { PremiumCard } from '../components/PremiumCard';
import { RingProgress } from '../components/RingProgress';
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
};

function SmallStatCard({ label, value, icon }: { label: string; value: string; icon: 'flame' | 'star' }) {
  const Icon = icon === 'flame' ? Flame : Star;

  return (
    <PremiumCard style={{ flex: 1, minHeight: 104 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <Icon color={icon === 'flame' ? colors.amber : colors.black} size={26} strokeWidth={2.4} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
          <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900', marginTop: spacing.xs }}>{value}</Text>
        </View>
      </View>
    </PremiumCard>
  );
}

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
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>Serie {calendar.streakDays} jours</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>Cette semaine</Text>
      </View>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.xl }}>
        {calendar.days.map((day) => {
          const selected = day.isoDate === selectedIsoDate;
          const active = selected || day.hasMeal || day.isToday;
          const borderColor = selected ? colors.black : day.isToday ? colors.black : day.hasMeal ? colors.green : colors.line;
          const backgroundColor = selected ? colors.black : day.hasMeal ? colors.greenSoft : colors.surface;
          const textColor = selected ? 'white' : day.isFuture ? colors.muted : colors.black;

          return (
            <Pressable key={day.isoDate} onPress={() => onSelectDay(day.isoDate)} style={{ alignItems: 'center', gap: spacing.xs, width: 44 }}>
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

export function PremiumHomeScreen({ meals, targets, profile, onOpenSettings, onOpenMeal }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedIsoDate, setSelectedIsoDate] = useState(today);
  const vm = buildPremiumDashboardViewModel(meals, today, targets, profile);
  const dayReview = buildDayReviewViewModel(meals, selectedIsoDate, today, targets);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader onSettings={onOpenSettings} />
      <StreakCalendarStrip calendar={vm.streakCalendar} selectedIsoDate={selectedIsoDate} onSelectDay={setSelectedIsoDate} />
      <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Apercu Quotidien</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>{dayReview.subtitle}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <SmallStatCard label="Serie actuelle" value={`${vm.streakDays} jours`} icon="flame" />
        <SmallStatCard label="Prochain badge" value={`${vm.nextBadge.daysRemaining} jours -> ${vm.nextBadge.label}`} icon="star" />
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
          <Text style={{ alignSelf: 'flex-start', color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories totales</Text>
          <RingProgress size={250} strokeWidth={16} progress={dayReview.calories.progress} label={`${dayReview.calories.consumed}`} detail={`/ ${dayReview.calories.target || '--'} kcal`} />
          <View style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>- {dayReview.calories.remaining} restantes</Text>
          </View>
        </PremiumCard>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <MacroProgress label="Proteines" consumed={dayReview.protein.consumed} target={dayReview.protein.target} color={colors.green} />
        <MacroProgress label="Glucides" consumed={dayReview.carbs.consumed} target={dayReview.carbs.target} color={colors.blue} />
        <MacroProgress label="Lipides" consumed={dayReview.fat.consumed} target={dayReview.fat.target} color={colors.amber} />
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Repas du jour</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>{dayReview.mealCount} repas</Text>
        </View>
        {dayReview.meals.length === 0 ? (
          <PremiumCard style={{ gap: spacing.xs }}>
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Aucun repas enregistre</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19 }}>Selectionne un autre jour ou scanne ton prochain repas avec le bouton central.</Text>
          </PremiumCard>
        ) : (
          dayReview.meals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
        )}
      </View>
    </ScrollView>
  );
}
