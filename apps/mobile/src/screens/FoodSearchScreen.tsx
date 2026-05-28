import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Plus, Search, ShieldCheck } from 'lucide-react-native';
import { searchFoodEntries, type FoodSearchEntry } from '../domain/foodSearch';
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

const popular = ['Chicken breast', 'Egg', 'Oats', 'Apple', 'Brown rice', 'Almonds'];

function FoodResultRow({ entry, onAdd }: { entry: FoodSearchEntry; onAdd: (entry: FoodSearchEntry) => void }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
          <Text style={{ color: colors.black, flex: 1, fontSize: typography.body, fontWeight: '900' }}>{entry.name}</Text>
          {entry.verified ? <ShieldCheck color={colors.green} size={15} strokeWidth={2.6} /> : null}
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>
          {entry.calories} kcal - P {entry.proteinG}g - C {entry.carbsG}g - F {entry.fatG}g
        </Text>
        <Text style={{ color: colors.green, fontSize: typography.tiny, fontWeight: '900' }}>{entry.servingLabel}</Text>
      </View>
      <Pressable onPress={() => onAdd(entry)} style={{ alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 }}>
        <Plus color={colors.black} size={19} strokeWidth={2.8} />
      </Pressable>
    </View>
  );
}

export function FoodSearchScreen({ onBack, onManualEntry, onSelectFood }: Props) {
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
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
        <ArrowLeft color={colors.black} size={24} strokeWidth={2.6} />
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Back</Text>
      </Pressable>

      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>MACROLENS</Text>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.md }}>Add meal manually</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', textAlign: 'center' }}>Search a food or enter macros yourself.</Text>
      </View>

      <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
        <Search color={colors.muted} size={18} strokeWidth={2.4} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search foods..." placeholderTextColor={colors.muted} style={{ color: colors.black, flex: 1, fontSize: typography.body, minHeight: 48 }} />
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>Popular</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {popular.map((item) => (
            <Pressable key={item} onPress={() => setQuery(item)} style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>{query.trim().length === 0 ? 'Recent foods' : 'Search results'}</Text>
        {results.length === 0 ? (
          <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.xl }}>
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>No result found</Text>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', textAlign: 'center' }}>Try another query or enter the macros manually.</Text>
          </View>
        ) : (
          results.map((entry) => <FoodResultRow key={entry.id} entry={entry} onAdd={addFood} />)
        )}
      </View>

      <Pressable onPress={onManualEntry} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 58, justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Enter macros manually</Text>
      </Pressable>
    </ScrollView>
  );
}
