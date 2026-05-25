import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Barcode, Camera, Flame, ImagePlus, PenLine, Star } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { GoalProgressChart } from '../components/GoalProgressChart';
import { PremiumCard } from '../components/PremiumCard';
import { RingProgress } from '../components/RingProgress';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import type { HomeStreakCalendar } from '../domain/homeStreak';
import { buildPremiumDashboardViewModel } from '../ui/premiumDashboardViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  profile: UserProfile | null;
  onCapture: () => void;
  onPickPhoto: () => void;
  onBarcodeScan: () => void;
  onManualMeal: () => void;
  onOpenSettings: () => void;
};

type GoalRange = '90d' | '6m' | '1y' | 'all';

const goalRanges: { value: GoalRange; label: string }[] = [
  { value: '90d', label: '90 j' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

function daysBetween(startIsoDate: string, endIsoDate: string): number {
  const start = new Date(`${startIsoDate}T12:00:00.000Z`).getTime();
  const end = new Date(`${endIsoDate}T12:00:00.000Z`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function goalRangeDays(range: GoalRange, meals: Meal[], todayIsoDate: string): number {
  if (range === '6m') {
    return 183;
  }

  if (range === '1y') {
    return 365;
  }

  if (range === 'all') {
    const oldestMeal = meals.length > 0 ? meals[meals.length - 1] : undefined;
    return oldestMeal ? Math.max(90, daysBetween(oldestMeal.capturedAt.slice(0, 10), todayIsoDate)) : 90;
  }

  return 90;
}

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

function StreakCalendarStrip({ calendar }: { calendar: HomeStreakCalendar }) {
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
          const active = day.hasMeal || day.isToday;
          const borderColor = day.isToday ? colors.black : day.hasMeal ? colors.green : colors.line;
          const backgroundColor = day.isToday ? colors.black : day.hasMeal ? colors.greenSoft : colors.surface;
          const textColor = day.isToday ? 'white' : day.isFuture ? colors.muted : colors.black;

          return (
            <View key={day.isoDate} style={{ alignItems: 'center', gap: spacing.xs, width: 44 }}>
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
              <Text style={{ color: day.isToday ? colors.black : colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>{day.dayOfMonth}</Text>
            </View>
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

export function PremiumHomeScreen({ meals, targets, profile, onCapture, onPickPhoto, onBarcodeScan, onManualMeal, onOpenSettings }: Props) {
  const [goalRange, setGoalRange] = useState<GoalRange>('90d');
  const today = new Date().toISOString().slice(0, 10);
  const vm = buildPremiumDashboardViewModel(meals, today, targets, profile, goalRangeDays(goalRange, meals, today));

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader onSettings={onOpenSettings} />
      <StreakCalendarStrip calendar={vm.streakCalendar} />
      <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Apercu Quotidien</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>Aujourd'hui</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <SmallStatCard label="Serie actuelle" value={`${vm.streakDays} jours`} icon="flame" />
        <SmallStatCard label="Prochain badge" value={`${vm.nextBadge.daysRemaining} jours -> ${vm.nextBadge.label}`} icon="star" />
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
          <Text style={{ alignSelf: 'flex-start', color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories totales</Text>
          <RingProgress size={250} strokeWidth={16} progress={vm.calories.progress} label={`${vm.calories.consumed}`} detail={`/ ${vm.calories.target || '--'} kcal`} />
          <View style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>- {vm.calories.remaining} restantes</Text>
          </View>
        </PremiumCard>
      </View>

      {vm.goalProgress ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <PremiumCard style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {goalRanges.map((range) => (
                <Pressable
                  key={range.value}
                  onPress={() => setGoalRange(range.value)}
                  style={{
                    alignItems: 'center',
                    backgroundColor: goalRange === range.value ? colors.black : colors.surfaceMuted,
                    borderRadius: radius.pill,
                    flex: 1,
                    minHeight: 34,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: goalRange === range.value ? 'white' : colors.black, fontSize: typography.tiny, fontWeight: '900' }}>{range.label}</Text>
                </Pressable>
              ))}
            </View>
            <GoalProgressChart progress={vm.goalProgress} />
          </PremiumCard>
        </View>
      ) : null}

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <MacroProgress label="Proteines" consumed={vm.protein.consumed} target={vm.protein.target} color={colors.green} />
        <MacroProgress label="Glucides" consumed={vm.carbs.consumed} target={vm.carbs.target} color={colors.blue} />
        <MacroProgress label="Lipides" consumed={vm.fat.consumed} target={vm.fat.target} color={colors.amber} />
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Pressable onPress={onCapture} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.md, justifyContent: 'center', minHeight: 64 }}>
          <Camera color="white" size={24} strokeWidth={2.6} />
          <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>Scanner un repas</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable onPress={onBarcodeScan} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
            <Barcode color={colors.green} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Produit</Text>
          </Pressable>
          <Pressable onPress={onPickPhoto} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
            <ImagePlus color={colors.blue} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Galerie</Text>
          </Pressable>
          <Pressable onPress={onManualMeal} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
            <PenLine color={colors.amber} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Manuel</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
