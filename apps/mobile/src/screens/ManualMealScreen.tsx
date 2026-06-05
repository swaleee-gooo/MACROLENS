import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Info, Save } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, PrimaryButton } from '../ui/primitives';
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
  onSave: (input: ManualMealInput) => void;
};

const STR = {
  en: {
    screenTitle: 'Manual entry',
    heroTitle: 'Add meal manually',
    heroSubtitle: 'Enter the nutrition info for this meal.',
    mealNameLabel: 'Meal name',
    mealNamePlaceholder: 'Example: salmon poke bowl',
    macrosLabel: 'Macros',
    nutritionLabel: 'Nutrition',
    caloriesLabel: 'Calories',
    caloriesPlaceholder: 'e.g. 927',
    proteinLabel: 'Protein',
    proteinPlaceholder: 'e.g. 38.6',
    carbsLabel: 'Carbs',
    carbsPlaceholder: 'e.g. 90',
    fatLabel: 'Fat',
    fatPlaceholder: 'e.g. 35',
    fiberLabel: 'Fiber',
    fiberPlaceholder: 'e.g. 8',
    saveMeal: 'Save',
    requiredHint: 'Meal name and calories are required.',
    estimatedNotice: 'Manual entry = Estimated level. Scan a barcode to switch to Verified.',
  },
  fr: {
    screenTitle: 'Saisie manuelle',
    heroTitle: 'Ajouter un repas manuellement',
    heroSubtitle: 'Entrez les informations nutritionnelles de ce repas.',
    mealNameLabel: 'Nom du repas',
    mealNamePlaceholder: 'Exemple : bowl de saumon',
    macrosLabel: 'Macros',
    nutritionLabel: 'Nutrition',
    caloriesLabel: 'Calories',
    caloriesPlaceholder: 'ex. 927',
    proteinLabel: 'Protéines',
    proteinPlaceholder: 'ex. 38,6',
    carbsLabel: 'Glucides',
    carbsPlaceholder: 'ex. 90',
    fatLabel: 'Lipides',
    fatPlaceholder: 'ex. 35',
    fiberLabel: 'Fibres',
    fiberPlaceholder: 'ex. 8',
    saveMeal: 'Enregistrer',
    requiredHint: 'Le nom du repas et les calories sont obligatoires.',
    estimatedNotice: 'Saisie manuelle = niveau Estimé. Scanne le code-barres pour passer en Vérifié.',
  },
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function MacroInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.md }}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600', minHeight: 28 }}
      />
    </View>
  );
}

export function ManualMealScreen({ onBack, onSave }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [fiberG, setFiberG] = useState('');
  const canSave = name.trim().length > 0 && parseNumber(calories) > 0;

  function save() {
    if (!canSave) {
      return;
    }

    onSave({
      name: name.trim(),
      calories: parseNumber(calories),
      proteinG: parseNumber(proteinG),
      carbsG: parseNumber(carbsG),
      fatG: parseNumber(fatG),
      fiberG: parseNumber(fiberG),
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      {/* Push header — matches prototype */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.lg }}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            alignItems: 'center',
            height: 30,
            justifyContent: 'center',
            marginLeft: -6,
            opacity: pressed ? 0.7 : 1,
            width: 30,
          })}
        >
          <ArrowLeft color={colors.ink2} size={20} strokeWidth={2} />
        </Pressable>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.screenTitle}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Meal name field */}
      <Eyebrow style={{ marginBottom: spacing.sm }}>{t.mealNameLabel}</Eyebrow>
      <View style={{ borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.lg, padding: spacing.md }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t.mealNamePlaceholder}
          placeholderTextColor={colors.muted2}
          style={{ color: colors.ink, fontSize: 14, fontWeight: '600', minHeight: 24 }}
        />
      </View>

      {/* Macros label */}
      <Eyebrow style={{ marginBottom: spacing.sm }}>{t.macrosLabel}</Eyebrow>

      {/* 2-column grid: Calories + Protein, Carbs + Fat — matches prototype */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <MacroInput label={t.caloriesLabel} value={calories} onChangeText={setCalories} placeholder={t.caloriesPlaceholder} />
        <MacroInput label={t.proteinLabel} value={proteinG} onChangeText={setProteinG} placeholder={t.proteinPlaceholder} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <MacroInput label={t.carbsLabel} value={carbsG} onChangeText={setCarbsG} placeholder={t.carbsPlaceholder} />
        <MacroInput label={t.fatLabel} value={fatG} onChangeText={setFatG} placeholder={t.fatPlaceholder} />
      </View>

      {/* Fiber below */}
      <View style={{ marginBottom: spacing.lg }}>
        <MacroInput label={t.fiberLabel} value={fiberG} onChangeText={setFiberG} placeholder={t.fiberPlaceholder} />
      </View>

      {/* Estimated info banner — matches prototype */}
      <View style={{ alignItems: 'center', backgroundColor: colors.warnWash, borderColor: colors.warnLine, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.md }}>
        <Info color={colors.warnInk} size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
        <Text style={{ color: colors.warnInk, flex: 1, fontSize: typography.small, lineHeight: 19 }}>{t.estimatedNotice}</Text>
      </View>

      {/* Save button */}
      <PrimaryButton
        label={t.saveMeal}
        onPress={save}
        disabled={!canSave}
        variant="dark"
        icon={<Save color="#FFFFFF" size={17} strokeWidth={2} />}
      />
      {!canSave ? (
        <Text style={{ color: colors.muted, fontSize: typography.small, marginTop: spacing.sm, textAlign: 'center' }}>{t.requiredHint}</Text>
      ) : null}
    </ScrollView>
  );
}
