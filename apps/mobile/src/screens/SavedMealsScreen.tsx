import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Clock3, Plus, RotateCcw, Utensils } from 'lucide-react-native';
import { buildRecentMealSuggestions, buildRecurringMealSuggestions, type RecurringMealSuggestion } from '../domain/recurringMeals';
import { useLang } from '../i18n/LanguageContext';
import type { Meal } from '../domain/types';
import { Card, Eyebrow, Num } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onBack: () => void;
  onRelogMeal: (meal: Meal) => void;
  onOpenMeal: (meal: Meal) => void;
};

type SavedMealsTab = 'repeat' | 'recent';

const STR = {
  en: {
    back: 'Back',
    savedMeals: 'Saved meals',
    savedMealsSubtitle: 'Your usual meals, ready to log again.',
    repeat: 'Repeat',
    recent: 'Recent',
    yourHabits: 'Your habits',
    noRepeatTitle: 'No repeated meals yet',
    noRepeatBody: 'Meals you log often will appear here.',
    noRecentTitle: 'No recent meals yet',
    noRecentBody: 'Your last unique meals will appear here.',
    protein: 'g protein',
    timesLogged: (count: number) => `${count}x logged`,
    lastLogged: (label: string) => `last: ${label}`,
  },
  fr: {
    back: 'Retour',
    savedMeals: 'Repas enregistrés',
    savedMealsSubtitle: 'Vos repas habituels, prêts à être enregistrés à nouveau.',
    repeat: 'Répéter',
    recent: 'Récents',
    yourHabits: 'Tes habitudes',
    noRepeatTitle: 'Aucun repas répété pour l\'instant',
    noRepeatBody: 'Les repas que vous enregistrez souvent apparaîtront ici.',
    noRecentTitle: 'Aucun repas récent pour l\'instant',
    noRecentBody: 'Vos derniers repas uniques apparaîtront ici.',
    protein: 'g protéines',
    timesLogged: (count: number) => `${count}x enregistré`,
    lastLogged: (label: string) => `dernier : ${label}`,
  },
};

function SavedMealRow({
  suggestion,
  metaLabel,
  onRelogMeal,
  onOpenMeal,
}: {
  suggestion: RecurringMealSuggestion;
  metaLabel: string;
  onRelogMeal: (meal: Meal) => void;
  onOpenMeal: (meal: Meal) => void;
}) {
  const { lang } = useLang();
  const t = STR[lang];
  const meal = suggestion.templateMeal;
  const isImage = !meal.imageUri.startsWith('manual://') && !meal.imageUri.startsWith('product://') && !meal.imageUri.startsWith('barcode://');

  return (
    <Pressable onPress={() => onOpenMeal(meal)}>
      <Card style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
        {isImage ? (
          <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.paper2, borderRadius: radius.md, height: 62, width: 62 }} />
        ) : (
          <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.md, height: 62, justifyContent: 'center', width: 62 }}>
            <Utensils color={colors.muted} size={24} strokeWidth={2} />
          </View>
        )}
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{meal.mealName}</Text>
          <Num style={{ color: colors.muted, fontSize: typography.small }}>
            {meal.caloriesEstimate} kcal · {meal.proteinG}{t.protein}
          </Num>
          <Eyebrow color={colors.accentInk}>{metaLabel}</Eyebrow>
        </View>
        <Pressable
          onPress={() => onRelogMeal(meal)}
          style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.pill, height: 34, justifyContent: 'center', width: 34 }}
        >
          <Plus color="#FFFFFF" size={18} strokeWidth={2.2} />
        </Pressable>
      </Card>
    </Pressable>
  );
}

export function SavedMealsScreen({ meals, onBack, onRelogMeal, onOpenMeal }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [activeTab, setActiveTab] = useState<SavedMealsTab>('repeat');
  const repeatSuggestions = buildRecurringMealSuggestions(meals, 20);
  const recentSuggestions = buildRecentMealSuggestions(meals, 20);
  const suggestions = activeTab === 'repeat' ? repeatSuggestions : recentSuggestions;
  const emptyTitle = activeTab === 'repeat' ? t.noRepeatTitle : t.noRecentTitle;
  const emptyBody = activeTab === 'repeat' ? t.noRepeatBody : t.noRecentBody;
  const EmptyIcon = activeTab === 'repeat' ? RotateCcw : Clock3;

  const tabs = [
    { id: 'repeat' as const, label: t.repeat },
    { id: 'recent' as const, label: t.recent },
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      {/* Push-style nav header */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Pressable
          onPress={onBack}
          style={{ alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: -6, width: 30 }}
        >
          <ArrowLeft color={colors.ink2} size={20} strokeWidth={2.2} />
        </Pressable>
        <Text style={{ color: colors.ink, fontFamily: undefined, fontSize: typography.body, fontWeight: '600', letterSpacing: -0.1 }}>{t.savedMeals}</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={{ backgroundColor: colors.paper3, borderRadius: radius.md, flexDirection: 'row', padding: spacing.xs }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              alignItems: 'center',
              backgroundColor: activeTab === tab.id ? colors.surface : 'transparent',
              borderColor: activeTab === tab.id ? colors.line2 : 'transparent',
              borderRadius: radius.sm,
              borderWidth: 1,
              flex: 1,
              minHeight: 36,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: activeTab === tab.id ? colors.ink : colors.muted, fontSize: typography.small, fontWeight: '600' }}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <Eyebrow style={{ marginBottom: -spacing.xs }}>{t.yourHabits}</Eyebrow>

      {suggestions.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: spacing.md, padding: spacing.xxxl }}>
          <EmptyIcon color={colors.muted} size={48} strokeWidth={1.5} />
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600', textAlign: 'center' }}>{emptyTitle}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' }}>{emptyBody}</Text>
        </Card>
      ) : (
        suggestions.map((suggestion) => (
          <SavedMealRow
            key={suggestion.id}
            suggestion={suggestion}
            metaLabel={activeTab === 'repeat' ? t.timesLogged(suggestion.count) : t.lastLogged(suggestion.lastLoggedLabel)}
            onRelogMeal={onRelogMeal}
            onOpenMeal={onOpenMeal}
          />
        ))
      )}
    </ScrollView>
  );
}
