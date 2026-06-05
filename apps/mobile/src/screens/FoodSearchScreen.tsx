import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Plus, Search, ShieldCheck } from 'lucide-react-native';
import { searchFoodEntries, type FoodSearchEntry } from '../domain/foodSearch';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, PrimaryButton, Seal } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type ManualMealInput = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type Props = {
  onBack: () => void;
  onManualEntry: () => void;
  onSelectFood: (input: ManualMealInput) => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Search food',
    searchPlaceholder: 'Search foods...',
    popularLabel: 'Popular',
    recentFoods: 'Recent foods',
    searchResults: 'Search results',
    noResultFound: 'No result found',
    noResultDetail: 'Try another query or enter the macros manually.',
    enterMacrosManually: 'Enter macros manually',
    popular: ['Chicken breast', 'Egg', 'Oats', 'Apple', 'Brown rice', 'Almonds'],
  },
  fr: {
    brand: 'MacroLens',
    title: 'Rechercher un aliment',
    searchPlaceholder: 'Rechercher des aliments...',
    popularLabel: 'Populaires',
    recentFoods: 'Aliments récents',
    searchResults: 'Résultats de recherche',
    noResultFound: 'Aucun résultat trouvé',
    noResultDetail: 'Essayez une autre recherche ou saisissez les macros manuellement.',
    enterMacrosManually: 'Saisir les macros manuellement',
    popular: ['Blanc de poulet', 'Œuf', 'Flocons d\'avoine', 'Pomme', 'Riz complet', 'Amandes'],
  },
};

function FoodResultRow({ entry, onAdd }: { entry: FoodSearchEntry; onAdd: (entry: FoodSearchEntry) => void }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
          <Text style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '700' }}>{entry.name}</Text>
          {entry.verified ? <Seal size={14} color={colors.accent} /> : null}
        </View>
        <Num style={{ color: colors.muted, fontSize: typography.small }}>
          {entry.calories} kcal · P {entry.proteinG}g · C {entry.carbsG}g · F {entry.fatG}g
        </Num>
        <Text style={{ color: colors.accent, fontSize: typography.tiny, fontWeight: '600' }}>{entry.servingLabel}</Text>
      </View>
      <Pressable
        onPress={() => onAdd(entry)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: colors.paper2,
          borderRadius: radius.md,
          height: 38,
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
          width: 38,
        })}
      >
        <Plus color={colors.ink2} size={18} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

export function FoodSearchScreen({ onBack, onManualEntry, onSelectFood }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const [query, setQuery] = useState('');
  const results = useMemo(() => searchFoodEntries(query, 12), [query]);

  function addFood(entry: FoodSearchEntry) {
    onSelectFood({
      name: entry.name,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      fiberG: entry.fiberG,
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.pill,
            borderWidth: 1,
            height: 40,
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            width: 40,
          })}
        >
          <ArrowLeft color={colors.ink} size={19} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Eyebrow>{t.brand}</Eyebrow>
          <Text style={{ color: colors.ink, fontSize: typography.subheading, fontWeight: '800', letterSpacing: -0.2 }}>{t.title}</Text>
        </View>
      </View>

      {/* Search input */}
      <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
        <Search color={colors.muted} size={17} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.muted2}
          style={{ color: colors.ink, flex: 1, fontSize: typography.body, minHeight: 48 }}
        />
      </View>

      {/* Popular chips */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{t.popularLabel}</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {t.popular.map((item) => (
            <Pressable
              key={item}
              onPress={() => setQuery(item)}
              style={({ pressed }) => ({
                backgroundColor: query === item ? colors.ink : colors.surface,
                borderColor: query === item ? colors.ink : colors.line,
                borderRadius: radius.pill,
                borderWidth: 1,
                opacity: pressed ? 0.8 : 1,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              })}
            >
              <Text style={{ color: query === item ? '#FFFFFF' : colors.ink, fontSize: typography.small, fontWeight: '600' }}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Results */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{query.trim().length === 0 ? t.recentFoods : t.searchResults}</Eyebrow>
        {results.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.xl }}>
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '700' }}>{t.noResultFound}</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, textAlign: 'center' }}>{t.noResultDetail}</Text>
          </Card>
        ) : (
          results.map((entry) => <FoodResultRow key={entry.id} entry={entry} onAdd={addFood} />)
        )}
      </View>

      <PrimaryButton label={t.enterMacrosManually} onPress={onManualEntry} variant="ghost" />
    </ScrollView>
  );
}
