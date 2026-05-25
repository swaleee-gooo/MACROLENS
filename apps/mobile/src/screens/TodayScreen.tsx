import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { ArrowLeft, CalendarDays, TrendingUp } from 'lucide-react-native';
import type { MacroTargets, Meal, UserProfile } from '../domain/types';
import { buildGoalProgress } from '../domain/goalProgress';
import { buildProgressMetrics } from '../domain/progressMetrics';
import { GoalProgressChart } from '../components/GoalProgressChart';
import { MealCard } from '../components/MealCard';
import { MetricPill } from '../components/MetricPill';
import { PremiumCard } from '../components/PremiumCard';
import { goalRangeDays, goalRanges, type GoalRange } from '../ui/goalProgressRanges';
import { buildProgressOverview } from '../ui/progressOverviewViewModel';
import { buildTodayViewModel } from '../ui/todayViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  profile: UserProfile | null;
  onBack: () => void;
  onOpenWeeklyReport: () => void;
  onOpenMeal: (meal: Meal) => void;
};

function ProgressBar({ value, color }: { value: number | null; color: string }) {
  const width = `${Math.min(value ?? 0, 100)}%` as DimensionValue;

  return (
    <View style={{ backgroundColor: colors.line, borderRadius: radius.sm, height: 8, overflow: 'hidden' }}>
      <View style={{ backgroundColor: color, borderRadius: radius.sm, height: 8, width }} />
    </View>
  );
}

export function TodayScreen({ meals, targets, profile, onBack, onOpenWeeklyReport, onOpenMeal }: Props) {
  const [goalRange, setGoalRange] = useState<GoalRange>('90d');
  const today = new Date().toISOString().slice(0, 10);
  const viewModel = buildTodayViewModel(meals, today, targets);
  const summary = viewModel.summary;
  const goalProgress = profile ? buildGoalProgress(meals, profile, today, goalRangeDays(goalRange, meals, today)) : null;
  const progressMetrics = profile ? buildProgressMetrics(meals, profile, today) : null;
  const progressOverview = buildProgressOverview(summary);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Progres</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>Metriques, objectifs et repas logges.</Text>
      </View>

      <View style={{ backgroundColor: colors.black, borderRadius: radius.md, gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <TrendingUp color={colors.greenSoft} size={22} strokeWidth={2.5} />
          <Text style={{ color: 'white', fontSize: typography.heading, fontWeight: '900' }}>{progressOverview.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {progressOverview.metrics.map((metric) => (
            <View key={metric.label} style={{ backgroundColor: '#171717', borderRadius: radius.sm, flex: 1, gap: spacing.xs, padding: spacing.md }}>
              <Text style={{ color: '#B8F6CE', fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{metric.label}</Text>
              <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>{metric.value}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onOpenWeeklyReport}
          style={{ alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.greenSoft, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 36, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        >
          <CalendarDays color={colors.green} size={16} strokeWidth={2.6} />
          <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>Rapport hebdo</Text>
        </Pressable>
      </View>

      {goalProgress ? (
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
          <GoalProgressChart progress={goalProgress} />
        </PremiumCard>
      ) : null}

      {progressMetrics ? (
        <View style={{ gap: spacing.md }}>
          <Text style={{ color: colors.ink, fontSize: typography.subheading, fontWeight: '900' }}>Tendances 7 jours</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <MetricPill label="Kcal moy." value={`${progressMetrics.averageCalories7d}`} />
            <MetricPill label="Prot moy." value={`${progressMetrics.averageProtein7d} g`} accent={colors.protein} />
            <MetricPill label="Jours logges" value={`${progressMetrics.loggedDays7d}/7`} accent={colors.blue} />
            <MetricPill label="Objectif kcal" value={`${progressMetrics.calorieAdherencePercent}%`} />
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <MetricPill label="Calories" value={`${summary.calories}${targets ? ` / ${targets.calorieTarget}` : ''}`} />
        <MetricPill label="Proteines" value={`${summary.proteinG} g${targets ? ` / ${targets.proteinTargetG} g` : ''}`} accent={colors.protein} />
        <MetricPill label="Glucides" value={`${summary.carbsG} g`} accent={colors.carbs} />
        <MetricPill label="Lipides" value={`${summary.fatG} g`} accent={colors.fat} />
      </View>

      {targets ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>Calories</Text>
              <Text style={{ color: colors.muted, fontSize: typography.small }}>{viewModel.calorieProgress}%</Text>
            </View>
            <ProgressBar value={viewModel.calorieProgress} color={colors.ink} />
          </View>
          <View style={{ gap: spacing.xs }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>Proteines</Text>
              <Text style={{ color: colors.muted, fontSize: typography.small }}>{viewModel.proteinProgress}%</Text>
            </View>
            <ProgressBar value={viewModel.proteinProgress} color={colors.protein} />
          </View>
        </View>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Repas du jour</Text>
        {viewModel.meals.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: typography.body }}>Aucun repas aujourd'hui.</Text>
        ) : (
          viewModel.meals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={onOpenMeal} />)
        )}
      </View>
    </ScrollView>
  );
}
