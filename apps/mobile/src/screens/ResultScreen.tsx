import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Droplets, Save, Scale, Trash2 } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import type { MealCorrection } from '../domain/corrections';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { MetricPill } from '../components/MetricPill';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meal: Meal;
  onApplyCorrection: (correction: MealCorrection) => void;
  onSave: () => void;
  onBack: () => void;
};

const correctionButtons: { label: string; correction: MealCorrection; icon: 'scale' | 'droplets' }[] = [
  { label: 'Portion +15%', correction: { type: 'portion_up', targetItemId: null }, icon: 'scale' },
  { label: 'Portion -15%', correction: { type: 'portion_down', targetItemId: null }, icon: 'scale' },
  { label: 'Huile ajoutee', correction: { type: 'add_oil', targetItemId: null }, icon: 'droplets' },
  { label: 'Sauce ajoutee', correction: { type: 'add_sauce', targetItemId: null }, icon: 'droplets' },
];

export function ResultScreen({ meal, onApplyCorrection, onSave, onBack }: Props) {
  const isManual = meal.imageUri.startsWith('manual://');
  const isMockAnalysis = meal.source === 'mock';

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl }}>
      <Pressable onPress={onBack} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
        <ArrowLeft color={colors.blue} size={18} strokeWidth={2.5} />
        <Text style={{ color: colors.blue, fontSize: typography.body, fontWeight: '800' }}>Retour</Text>
      </Pressable>
      {isManual ? (
        <View
          style={{
            alignItems: 'center',
            aspectRatio: 1,
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: radius.lg,
            borderWidth: 1,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Scale color={colors.green} size={72} strokeWidth={1.8} />
        </View>
      ) : (
        <Image source={{ uri: meal.imageUri }} style={{ aspectRatio: 1, borderRadius: radius.lg, width: '100%' }} />
      )}
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: typography.title, fontWeight: '900' }}>{meal.mealName}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body }}>
          {meal.caloriesEstimate} kcal - probablement {meal.caloriesLow}-{meal.caloriesHigh}
        </Text>
        <ConfidenceBadge confidence={meal.confidence} />
      </View>
      {isMockAnalysis ? (
        <View
          style={{
            backgroundColor: '#FFF7E8',
            borderColor: '#F1C27D',
            borderRadius: radius.sm,
            borderWidth: 1,
            gap: spacing.xs,
            padding: spacing.md,
          }}
        >
          <Text style={{ color: colors.amber, fontSize: typography.small, fontWeight: '900' }}>Mode demo</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>
            Analyse IA non branchee: ce resultat est un exemple fixe pour tester le flux photo, corrections et Timeline.
          </Text>
          {meal.notes.startsWith('Remote analysis failed:') ? (
            <Text style={{ color: colors.red, fontSize: typography.small, lineHeight: 18 }}>{meal.notes}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <MetricPill label="Proteines" value={`${meal.proteinG} g`} accent={colors.protein} />
        <MetricPill label="Glucides" value={`${meal.carbsG} g`} accent={colors.carbs} />
        <MetricPill label="Lipides" value={`${meal.fatG} g`} accent={colors.fat} />
        <MetricPill label="Fibres" value={`${meal.fiberG} g`} accent={colors.fiber} />
      </View>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Corrections rapides</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {correctionButtons.map((button) => {
            const Icon = button.icon === 'scale' ? Scale : Droplets;

            return (
              <Pressable
                key={button.label}
                onPress={() => onApplyCorrection(button.correction)}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                }}
              >
                <Icon color={colors.ink} size={16} strokeWidth={2.4} />
                <Text style={{ color: colors.ink, fontWeight: '800' }}>{button.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>Aliments detectes</Text>
        {meal.items.map((item) => (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, padding: spacing.md }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '800' }}>{item.name}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.small }}>
                  {item.estimatedQuantity} {item.unit} - {item.calories} kcal - {item.proteinG} g proteines
                </Text>
              </View>
              {meal.items.length > 1 ? (
                <Pressable onPress={() => onApplyCorrection({ type: 'remove_item', targetItemId: item.id })}>
                  <Trash2 color={colors.red} size={18} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onSave}
        style={{ alignItems: 'center', backgroundColor: colors.green, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.lg }}
      >
        <Save color="white" size={20} strokeWidth={2.5} />
        <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Enregistrer le repas</Text>
      </Pressable>
    </ScrollView>
  );
}
