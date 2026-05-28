import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays, Flame, Package, Utensils } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { PremiumCard } from '../components/PremiumCard';
import type { Meal } from '../domain/types';
import { buildTimelineSections } from '../ui/timelineSectionsViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onOpenMeal: (meal: Meal) => void;
};

type HistoryMode = 'timeline' | 'calendar';

function confidenceLabel(confidence: Meal['confidence']): { label: string; background: string; color: string } {
  if (confidence === 'high') {
    return { label: 'ELEVEE', background: colors.greenSoft, color: colors.green };
  }
  if (confidence === 'medium') {
    return { label: 'MOYENNE', background: colors.amberSoft, color: colors.black };
  }
  return { label: 'FAIBLE', background: colors.redSoft, color: colors.red };
}

function TimelineMealCard({ meal, onOpenMeal }: { meal: Meal; onOpenMeal: (meal: Meal) => void }) {
  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const badge = confidenceLabel(meal.confidence);

  return (
    <Pressable onPress={() => onOpenMeal(meal)}>
      <PremiumCard style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        {isManual || isProduct ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 74, justifyContent: 'center', width: 74 }}>
            {isProduct ? <Package color={colors.green} size={28} strokeWidth={2.4} /> : <Utensils color={colors.muted} size={28} strokeWidth={2.4} />}
          </View>
        ) : (
          <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 74, width: 74 }} />
        )}
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{meal.mealName}</Text>
          <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>
            <Flame color={colors.black} size={16} strokeWidth={2.4} /> {meal.caloriesEstimate} kcal  <Text style={{ color: colors.green }}>{meal.proteinG}g Prot</Text>
          </Text>
        </View>
        <View style={{ backgroundColor: badge.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
          <Text style={{ color: badge.color, fontSize: typography.tiny, fontWeight: '900' }}>{badge.label}</Text>
        </View>
      </PremiumCard>
    </Pressable>
  );
}

const monthLabels = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const weekLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function isoDateAtNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

function buildMonthDays(anchorIsoDate: string) {
  const anchor = isoDateAtNoon(anchorIsoDate);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1, 12));
  const startOffset = first.getUTCDay() === 0 ? -6 : 1 - first.getUTCDay();
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() + startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      isoDate: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month,
    };
  });
}

function CalendarHistory({
  meals,
  todayIsoDate,
  onOpenMeal,
}: {
  meals: Meal[];
  todayIsoDate: string;
  onOpenMeal: (meal: Meal) => void;
}) {
  const [selectedIsoDate, setSelectedIsoDate] = useState(todayIsoDate);
  const monthDays = useMemo(() => buildMonthDays(selectedIsoDate), [selectedIsoDate]);
  const selectedDate = isoDateAtNoon(selectedIsoDate);
  const mealsByDate = useMemo(() => {
    const grouped = new Map<string, Meal[]>();
    meals.forEach((meal) => {
      const isoDate = meal.capturedAt.slice(0, 10);
      grouped.set(isoDate, [...(grouped.get(isoDate) ?? []), meal]);
    });
    return grouped;
  }, [meals]);
  const dayMeals = mealsByDate.get(selectedIsoDate) ?? [];
  const dayCalories = dayMeals.reduce((total, meal) => total + meal.caloriesEstimate, 0);
  const dayProtein = dayMeals.reduce((total, meal) => total + meal.proteinG, 0);

  return (
    <View style={{ gap: spacing.lg }}>
      <PremiumCard style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{monthLabels[selectedDate.getUTCMonth()]} {selectedDate.getUTCFullYear()}</Text>
          <CalendarDays color={colors.muted} size={20} strokeWidth={2.4} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {weekLabels.map((label) => (
            <Text key={label} style={{ color: colors.muted, flex: 1, fontSize: typography.tiny, fontWeight: '900', textAlign: 'center' }}>{label}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm }}>
          {monthDays.map((day) => {
            const selected = day.isoDate === selectedIsoDate;
            const hasMeal = mealsByDate.has(day.isoDate);
            return (
              <Pressable key={day.isoDate} onPress={() => setSelectedIsoDate(day.isoDate)} style={{ alignItems: 'center', flexBasis: `${100 / 7}%`, gap: spacing.xs }}>
                <View style={{ alignItems: 'center', backgroundColor: selected ? colors.green : 'transparent', borderRadius: radius.pill, height: 34, justifyContent: 'center', width: 34 }}>
                  <Text style={{ color: selected ? 'white' : day.inMonth ? colors.black : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{day.day}</Text>
                </View>
                <View style={{ backgroundColor: hasMeal ? colors.green : 'transparent', borderRadius: radius.pill, height: 5, width: 5 }} />
              </Pressable>
            );
          })}
        </View>
      </PremiumCard>

      <PremiumCard style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories</Text>
            <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>{dayCalories}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Proteines</Text>
            <Text style={{ color: colors.green, fontSize: typography.heading, fontWeight: '900' }}>{dayProtein}g</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Repas</Text>
            <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>{dayMeals.length}</Text>
          </View>
        </View>
      </PremiumCard>
      {dayMeals.length === 0 ? (
        <PremiumCard>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>Aucun repas ce jour-la.</Text>
        </PremiumCard>
      ) : (
        dayMeals.map((meal) => <TimelineMealCard key={meal.id} meal={meal} onOpenMeal={onOpenMeal} />)
      )}
    </View>
  );
}

export function PremiumTimelineScreen({ meals, onOpenMeal }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const sections = buildTimelineSections(meals, today);
  const [mode, setMode] = useState<HistoryMode>('timeline');

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader />
      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>History</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>Revois chaque jour, chaque repas et chaque macro.</Text>
      </View>
      <View style={{ gap: spacing.xl, paddingHorizontal: spacing.xl }}>
        <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, flexDirection: 'row', padding: spacing.xs }}>
          {(['timeline', 'calendar'] as const).map((item) => (
            <Pressable key={item} onPress={() => setMode(item)} style={{ alignItems: 'center', backgroundColor: mode === item ? colors.black : 'transparent', borderRadius: radius.pill, flex: 1, minHeight: 38, justifyContent: 'center' }}>
              <Text style={{ color: mode === item ? 'white' : colors.black, fontSize: typography.small, fontWeight: '900' }}>{item === 'timeline' ? 'Timeline' : 'Calendar'}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'calendar' ? <CalendarHistory meals={meals} todayIsoDate={today} onOpenMeal={onOpenMeal} /> : null}

        {mode === 'timeline' ? (
          sections.length === 0 ? (
            <PremiumCard style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Aucun repas enregistre</Text>
              <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>Tes repas apparaitront ici apres le premier scan.</Text>
            </PremiumCard>
          ) : (
            sections.map((section) => (
              <View key={section.title} style={{ gap: spacing.md }}>
                <Text style={{ borderBottomColor: colors.line, borderBottomWidth: 1, color: colors.black, fontSize: typography.title, fontWeight: '900', paddingBottom: spacing.sm }}>{section.title}</Text>
                {section.meals.map((meal) => (
                  <TimelineMealCard key={meal.id} meal={meal} onOpenMeal={onOpenMeal} />
                ))}
              </View>
            ))
          )
        ) : null}
      </View>
    </ScrollView>
  );
}
