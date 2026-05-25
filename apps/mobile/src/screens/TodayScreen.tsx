import { Pressable, ScrollView, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { ArrowLeft, Barcode, CalendarDays, Camera, ImagePlus, PenLine, Sparkles } from 'lucide-react-native';
import type { MacroTargets, Meal } from '../domain/types';
import { buildTodayCoach } from '../domain/todayCoach';
import { MealCard } from '../components/MealCard';
import { MetricPill } from '../components/MetricPill';
import { buildTodayViewModel } from '../ui/todayViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  onBack: () => void;
  onCapture: () => void;
  onPickPhoto: () => void;
  onBarcodeScan: () => void;
  onManualMeal: () => void;
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

function ActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'camera' | 'image' | 'barcode' | 'manual';
  onPress: () => void;
}) {
  const Icon = icon === 'camera' ? Camera : icon === 'image' ? ImagePlus : icon === 'barcode' ? Barcode : PenLine;

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.sm,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: spacing.xs,
        justifyContent: 'center',
        minWidth: 100,
        padding: spacing.md,
      }}
    >
      <Icon color={colors.ink} size={16} strokeWidth={2.4} />
      <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export function TodayScreen({ meals, targets, onBack, onCapture, onPickPhoto, onBarcodeScan, onManualMeal, onOpenWeeklyReport, onOpenMeal }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const viewModel = buildTodayViewModel(meals, today, targets);
  const summary = viewModel.summary;
  const coach = targets
    ? buildTodayCoach({
        consumed: {
          calories: summary.calories,
          proteinG: summary.proteinG,
          carbsG: summary.carbsG,
          fatG: summary.fatG,
          fiberG: summary.fiberG,
        },
        targets: {
          calories: targets.calorieTarget,
          proteinG: targets.proteinTargetG,
          carbsG: targets.carbsTargetG,
          fatG: targets.fatTargetG,
          fiberG: targets.fiberTargetG,
        },
      })
    : null;

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>Aujourd'hui</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>{viewModel.meals.length} repas enregistres</Text>
      </View>

      {coach ? (
        <View style={{ backgroundColor: colors.black, borderRadius: radius.md, gap: spacing.md, padding: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <Sparkles color={colors.greenSoft} size={22} strokeWidth={2.5} />
            <Text style={{ color: 'white', fontSize: typography.heading, fontWeight: '900' }}>{coach.headline}</Text>
          </View>
          <Text style={{ color: '#EFEFEF', fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>{coach.action}</Text>
          <Pressable onPress={onOpenWeeklyReport} style={{ alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.greenSoft, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <CalendarDays color={colors.green} size={16} strokeWidth={2.6} />
            <Text style={{ color: colors.green, fontSize: typography.small, fontWeight: '900' }}>Rapport hebdo</Text>
          </Pressable>
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <ActionButton label="Scan" icon="camera" onPress={onCapture} />
        <ActionButton label="Produit" icon="barcode" onPress={onBarcodeScan} />
        <ActionButton label="Galerie" icon="image" onPress={onPickPhoto} />
        <ActionButton label="Manuel" icon="manual" onPress={onManualMeal} />
      </View>

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
