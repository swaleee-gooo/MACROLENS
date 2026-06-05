import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { ManualMealAsset, ProductLabelAsset } from '../components/BrandAssets';
import { useLang } from '../i18n/LanguageContext';
import type { Meal } from '../domain/types';
import { buildTimelineSections } from '../ui/timelineSectionsViewModel';
import { Card, Eyebrow, Num, ProofChip } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onOpenMeal: (meal: Meal) => void;
};

type HistoryMode = 'timeline' | 'calendar';

const STR = {
  en: {
    mealLog: 'Meal log',
    history: 'History',
    historySubtitle: 'Your consistency and reliability over time.',
    timeline: 'Timeline',
    calendar: 'Calendar',
    noMealsLogged: 'No meals logged',
    noMealsBody: 'Your meals will appear here after the first scan.',
    meals: 'meals',
    noMealsDay: 'No meals on this day.',
    calories: 'Calories',
    protein: 'Protein',
    mealsLabel: 'Meals',
    manual: 'Manual',
    barcode: 'Barcode',
    verified: 'Verified',
    estimated: 'Estimated',
    protein_unit: 'g protein',
    thisWeek: 'This week',
    verified_pct: (pct: number) => `${pct}% verified`,
    avgKcal: 'avg kcal/d',
    avgProt: 'avg prot',
    daysLogged: 'days logged',
    weekLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    monthLabels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  fr: {
    mealLog: 'Journal',
    history: 'Suivi',
    historySubtitle: 'Ta régularité et ta fiabilité dans le temps.',
    timeline: 'Chronologie',
    calendar: 'Calendrier',
    noMealsLogged: 'Aucun repas enregistré',
    noMealsBody: 'Vos repas apparaîtront ici après le premier scan.',
    meals: 'repas',
    noMealsDay: 'Aucun repas ce jour-là.',
    calories: 'Calories',
    protein: 'Protéines',
    mealsLabel: 'Repas',
    manual: 'Manuel',
    barcode: 'Code-barres',
    verified: 'Vérifié',
    estimated: 'Estimé',
    protein_unit: 'g protéines',
    thisWeek: 'Cette semaine',
    verified_pct: (pct: number) => `${pct}% vérifié`,
    avgKcal: 'kcal moy/j',
    avgProt: 'prot moy',
    daysLogged: 'jours loggés',
    weekLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    monthLabels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  },
};

type WeekBar = { dayLabel: string; heightPct: number; isVerified: boolean; hasData: boolean };

function buildWeekBars(meals: Meal[], todayIsoDate: string, weekLabels: string[]): WeekBar[] {
  const todayDate = new Date(`${todayIsoDate}T12:00:00.000Z`);
  const todayDow = todayDate.getUTCDay(); // 0=Sun
  // build array Mon-Sun aligned with weekLabels
  const bars: WeekBar[] = weekLabels.map((dayLabel, i) => {
    // i=0 → Mon(1), i=6 → Sun(0)
    const targetDow = i === 6 ? 0 : i + 1;
    const diff = ((targetDow - todayDow + 7) % 7) - 7;
    const barDate = new Date(todayDate);
    barDate.setUTCDate(todayDate.getUTCDate() + (diff === 0 ? 0 : diff));
    const isoDate = barDate.toISOString().slice(0, 10);
    const dayMeals = meals.filter((m) => m.capturedAt.slice(0, 10) === isoDate);
    if (dayMeals.length === 0) return { dayLabel, heightPct: 0, isVerified: false, hasData: false };
    const totalKcal = dayMeals.reduce((s, m) => s + m.caloriesEstimate, 0);
    const verifiedCount = dayMeals.filter((m) => m.confidence === 'high' || m.imageUri.startsWith('product://') || m.imageUri.startsWith('barcode://')).length;
    const isVerified = verifiedCount >= dayMeals.length / 2;
    return { dayLabel, heightPct: Math.min(1, totalKcal / 2500), isVerified, hasData: true };
  });
  return bars;
}

function WeeklySummaryCard({ meals, todayIsoDate }: { meals: Meal[]; todayIsoDate: string }) {
  const { lang } = useLang();
  const t = STR[lang];
  const bars = useMemo(() => buildWeekBars(meals, todayIsoDate, t.weekLabels), [meals, todayIsoDate, t.weekLabels]);
  const weekMeals = useMemo(() => {
    const dates = new Set(bars.map((_, i) => {
      const todayDate = new Date(`${todayIsoDate}T12:00:00.000Z`);
      const todayDow = todayDate.getUTCDay();
      const targetDow = i === 6 ? 0 : i + 1;
      const diff = ((targetDow - todayDow + 7) % 7) - 7;
      const barDate = new Date(todayDate);
      barDate.setUTCDate(todayDate.getUTCDate() + (diff === 0 ? 0 : diff));
      return barDate.toISOString().slice(0, 10);
    }));
    return meals.filter((m) => dates.has(m.capturedAt.slice(0, 10)));
  }, [meals, todayIsoDate, bars]);
  const daysWithData = bars.filter((b) => b.hasData).length;
  const totalKcal = weekMeals.reduce((s, m) => s + m.caloriesEstimate, 0);
  const totalProt = weekMeals.reduce((s, m) => s + m.proteinG, 0);
  const divisor = Math.max(1, daysWithData);
  const avgKcal = Math.round(totalKcal / divisor);
  const avgProt = Math.round(totalProt / divisor);
  const verifiedCount = weekMeals.filter((m) => m.confidence === 'high' || m.imageUri.startsWith('product://') || m.imageUri.startsWith('barcode://')).length;
  const verifiedPct = weekMeals.length > 0 ? Math.round((verifiedCount / weekMeals.length) * 100) : 0;
  const maxPct = Math.max(...bars.map((b) => b.heightPct), 0.01);

  return (
    <Card style={{ padding: spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
        <Eyebrow>{t.thisWeek}</Eyebrow>
        <ProofChip level="verified" label={t.verified_pct(verifiedPct)} />
      </View>
      <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 0, height: 72, justifyContent: 'space-between' }}>
        {bars.map((bar, i) => {
          const fillColor = bar.hasData ? (bar.isVerified ? colors.accent : colors.warn) : colors.paper3;
          const rawH = bar.hasData ? (bar.heightPct / maxPct) * 56 : 4;
          const barH = Math.max(4, Math.round(rawH));
          return (
            <View key={i} style={{ alignItems: 'center', flex: 1, gap: 8, justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: fillColor, borderRadius: 6, height: barH, width: 11 }} />
              <Eyebrow style={{ fontSize: 9 }}>{bar.dayLabel}</Eyebrow>
            </View>
          );
        })}
      </View>
      <View style={{ borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md }}>
        <View>
          <Num style={{ fontSize: typography.subheading, fontWeight: '600' }}>{avgKcal}</Num>
          <Eyebrow style={{ marginTop: 2 }}>{t.avgKcal}</Eyebrow>
        </View>
        <View>
          <Num style={{ fontSize: typography.subheading, fontWeight: '600' }}>{avgProt}g</Num>
          <Eyebrow style={{ marginTop: 2 }}>{t.avgProt}</Eyebrow>
        </View>
        <View>
          <Num style={{ fontSize: typography.subheading, fontWeight: '600' }}>{daysWithData}</Num>
          <Eyebrow style={{ marginTop: 2 }}>{t.daysLogged}</Eyebrow>
        </View>
      </View>
    </Card>
  );
}

function TimelineMealCard({ meal, onOpenMeal }: { meal: Meal; onOpenMeal: (meal: Meal) => void }) {
  const { lang } = useLang();
  const t = STR[lang];
  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const verified = isProduct || meal.confidence === 'high';

  return (
    <Pressable onPress={() => onOpenMeal(meal)}>
      <Card style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
        {isManual || isProduct ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.md, height: 66, justifyContent: 'center', width: 66 }}>
            {isProduct ? <ProductLabelAsset height={64} width={66} /> : <ManualMealAsset height={64} width={66} />}
          </View>
        ) : (
          <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.paper2, borderRadius: radius.md, height: 66, width: 66 }} />
        )}
        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
          <Text numberOfLines={2} style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600', lineHeight: 20 }}>
            {meal.mealName}
          </Text>
          <Num numberOfLines={1} style={{ color: colors.muted, fontSize: typography.small }}>
            {meal.caloriesEstimate} kcal · {meal.proteinG} {t.protein_unit}
          </Num>
          <ProofChip
            level={verified ? 'verified' : 'estimated'}
            label={isManual ? t.manual : isProduct ? t.barcode : verified ? t.verified : t.estimated}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      </Card>
    </Pressable>
  );
}

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

function CalendarHistory({ meals, todayIsoDate, onOpenMeal }: { meals: Meal[]; todayIsoDate: string; onOpenMeal: (meal: Meal) => void }) {
  const { lang } = useLang();
  const t = STR[lang];
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
      <Card style={{ gap: spacing.md, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.ink, fontSize: typography.subheading, fontWeight: '700', letterSpacing: -0.3 }}>
            {t.monthLabels[selectedDate.getUTCMonth()]} {selectedDate.getUTCFullYear()}
          </Text>
          <CalendarDays color={colors.muted} size={20} strokeWidth={2} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {t.weekLabels.map((label, i) => (
            <Eyebrow key={`wl-${i}`} style={{ flex: 1, textAlign: 'center' }}>{label}</Eyebrow>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm }}>
          {monthDays.map((day) => {
            const selected = day.isoDate === selectedIsoDate;
            const hasMeal = mealsByDate.has(day.isoDate);
            return (
              <Pressable key={day.isoDate} onPress={() => setSelectedIsoDate(day.isoDate)} style={{ alignItems: 'center', flexBasis: `${100 / 7}%`, gap: spacing.xs }}>
                <View style={{ alignItems: 'center', backgroundColor: selected ? colors.ink : 'transparent', borderRadius: radius.sm, height: 34, justifyContent: 'center', width: 34 }}>
                  <Num style={{ color: selected ? '#FFFFFF' : day.inMonth ? colors.ink : colors.muted, fontSize: typography.small, fontWeight: '600' }}>{day.day}</Num>
                </View>
                <View style={{ backgroundColor: hasMeal ? colors.accent : 'transparent', borderRadius: radius.pill, height: 4, width: 4 }} />
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <HistoryStat label={t.calories} value={`${dayCalories}`} />
        <HistoryStat label={t.protein} value={`${dayProtein}g`} />
        <HistoryStat label={t.mealsLabel} value={`${dayMeals.length}`} />
      </View>

      {dayMeals.length === 0 ? (
        <Card style={{ padding: spacing.lg }}>
          <Text style={{ color: colors.muted, fontSize: typography.small }}>{t.noMealsDay}</Text>
        </Card>
      ) : (
        dayMeals.map((meal) => <TimelineMealCard key={meal.id} meal={meal} onOpenMeal={onOpenMeal} />)
      )}
    </View>
  );
}

function HistoryStat({ label, value, accent = colors.ink }: { label: string; value: string; accent?: string }) {
  return (
    <Card style={{ flex: 1, gap: spacing.xs, padding: spacing.md }}>
      <Eyebrow>{label}</Eyebrow>
      <Num numberOfLines={1} style={{ color: accent, fontSize: typography.subheading, fontWeight: '600' }}>{value}</Num>
    </Card>
  );
}

export function PremiumTimelineScreen({ meals, onOpenMeal }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const today = new Date().toISOString().slice(0, 10);
  const sections = buildTimelineSections(meals, today);
  const [mode, setMode] = useState<HistoryMode>('timeline');

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, paddingBottom: 112 }} showsVerticalScrollIndicator={false}>
      <BrandHeader />
      <View style={{ gap: 4, paddingHorizontal: spacing.xl }}>
        <Eyebrow>{t.mealLog}</Eyebrow>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 }}>{t.history}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, lineHeight: 22 }}>{t.historySubtitle}</Text>
      </View>
      <View style={{ gap: spacing.lg, paddingHorizontal: spacing.xl }}>
        <View style={{ backgroundColor: colors.paper3, borderRadius: radius.md, flexDirection: 'row', padding: spacing.xs }}>
          {(['timeline', 'calendar'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={{
                alignItems: 'center',
                backgroundColor: mode === item ? colors.ink : 'transparent',
                borderRadius: radius.sm,
                flex: 1,
                minHeight: 38,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: mode === item ? '#FFFFFF' : colors.ink, fontSize: typography.small, fontWeight: '600' }}>
                {item === 'timeline' ? t.timeline : t.calendar}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'calendar' ? <CalendarHistory meals={meals} todayIsoDate={today} onOpenMeal={onOpenMeal} /> : null}

        {mode === 'timeline' ? (
          <>
            <WeeklySummaryCard meals={meals} todayIsoDate={today} />
            {sections.length === 0 ? (
              <Card style={{ gap: 4, padding: spacing.lg }}>
                <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.noMealsLogged}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19 }}>{t.noMealsBody}</Text>
              </Card>
            ) : (
              sections.map((section) => (
                <View key={section.title} style={{ gap: spacing.md }}>
                  <View style={{ alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.sm }}>
                    <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.3 }}>{section.title}</Text>
                    <Num style={{ color: colors.muted, fontSize: typography.small }}>{section.meals.length} {t.meals}</Num>
                  </View>
                  {section.meals.map((meal) => (
                    <TimelineMealCard key={meal.id} meal={meal} onOpenMeal={onOpenMeal} />
                  ))}
                </View>
              ))
            )}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
