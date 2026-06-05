import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, PrimaryButton, ProofChip } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

export type VerifiedRecipeIngredientInput = {
  name: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type VerifiedRecipeInput = {
  name: string;
  ingredients: VerifiedRecipeIngredientInput[];
};

type IngredientDraft = {
  id: string;
  name: string;
  grams: string;
  kcalPer100g: string;
  proteinPer100g: string;
  carbsPer100g: string;
  fatPer100g: string;
};

type Props = {
  onBack: () => void;
  onSaveRecipe: (input: VerifiedRecipeInput) => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Weighed recipe',
    description: 'Enter ingredient grams and nutrition per 100g. Recipe results can be verified because the consumed quantities are measured.',
    recipeNameLabel: 'Recipe name',
    recipeNamePlaceholder: 'Recipe name',
    ingredientsWeighed: 'Weighed ingredients',
    ingredientLabel: (n: number) => `Ingredient ${n}`,
    fieldFood: 'Food',
    fieldGrams: 'Grams',
    fieldKcal: 'Kcal/100g',
    fieldProtein: 'Protein',
    fieldCarbs: 'Carbs',
    fieldFat: 'Fat',
    fieldFoodPlaceholder: 'Ingredient',
    addIngredient: 'Add a weighed ingredient',
    totalRecipe: 'Recipe total',
    proofNote: 'Wellness only. MetaboProof verifies nutrition math from measured inputs; it does not diagnose health conditions.',
    createRecipe: 'Save recipe',
    initialIngredientName: 'Chicken breast',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
  },
  fr: {
    brand: 'MacroLens',
    title: 'Recette pesée',
    description: 'Entrez les grammes des ingrédients et la nutrition pour 100g. Les résultats de recette peuvent être vérifiés car les quantités consommées sont mesurées.',
    recipeNameLabel: 'Nom de la recette',
    recipeNamePlaceholder: 'Nom de la recette',
    ingredientsWeighed: 'Ingrédients pesés',
    ingredientLabel: (n: number) => `Ingrédient ${n}`,
    fieldFood: 'Aliment',
    fieldGrams: 'Grammes',
    fieldKcal: 'Kcal/100g',
    fieldProtein: 'Protéines',
    fieldCarbs: 'Glucides',
    fieldFat: 'Lipides',
    fieldFoodPlaceholder: 'Ingrédient',
    addIngredient: 'Ajouter un ingrédient pesé',
    totalRecipe: 'Total recette',
    proofNote: 'Usage bien-être uniquement. MetaboProof vérifie les calculs nutritionnels à partir de saisies mesurées ; il ne diagnostique pas de conditions médicales.',
    createRecipe: 'Enregistrer la recette',
    initialIngredientName: 'Blanc de poulet',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
  },
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function draftIngredient(id: string): IngredientDraft {
  return {
    id,
    name: '',
    grams: '',
    kcalPer100g: '',
    proteinPer100g: '',
    carbsPer100g: '',
    fatPer100g: '',
  };
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.xs, minWidth: 118 }}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={label === 'Food' || label === 'Aliment' ? 'default' : 'numeric'}
        placeholder={placeholder}
        placeholderTextColor={colors.muted2}
        style={{ borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: typography.small, fontWeight: '600', minHeight: 44, paddingHorizontal: spacing.md }}
      />
    </View>
  );
}

export function VerifiedRecipeScreen({ onBack, onSaveRecipe }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    {
      id: 'ingredient-1',
      name: t.initialIngredientName,
      grams: '150',
      kcalPer100g: '165',
      proteinPer100g: '31',
      carbsPer100g: '0',
      fatPer100g: '3.6',
    },
  ]);

  function updateIngredient(id: string, patch: Partial<IngredientDraft>) {
    setIngredients((current) => current.map((ingredient) => (ingredient.id === id ? { ...ingredient, ...patch } : ingredient)));
  }

  function removeIngredient(id: string) {
    setIngredients((current) => (current.length === 1 ? current : current.filter((ingredient) => ingredient.id !== id)));
  }

  function validIngredients(): VerifiedRecipeIngredientInput[] {
    return ingredients
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        grams: parseNumber(ingredient.grams),
        kcalPer100g: parseNumber(ingredient.kcalPer100g),
        proteinPer100g: parseNumber(ingredient.proteinPer100g),
        carbsPer100g: parseNumber(ingredient.carbsPer100g),
        fatPer100g: parseNumber(ingredient.fatPer100g),
      }))
      .filter((ingredient) => ingredient.name.length > 0 && ingredient.grams > 0);
  }

  const canSave = recipeName.trim().length > 0 && validIngredients().length > 0;

  // Compute recipe totals for the summary card
  const totalKcal = ingredients.reduce((sum, ing) => {
    const g = parseNumber(ing.grams);
    const kcal = parseNumber(ing.kcalPer100g);
    return sum + (g * kcal) / 100;
  }, 0);
  const totalProtein = ingredients.reduce((sum, ing) => {
    const g = parseNumber(ing.grams);
    const p = parseNumber(ing.proteinPer100g);
    return sum + (g * p) / 100;
  }, 0);
  const totalCarbs = ingredients.reduce((sum, ing) => {
    const g = parseNumber(ing.grams);
    const c = parseNumber(ing.carbsPer100g);
    return sum + (g * c) / 100;
  }, 0);
  const totalFat = ingredients.reduce((sum, ing) => {
    const g = parseNumber(ing.grams);
    const f = parseNumber(ing.fatPer100g);
    return sum + (g * f) / 100;
  }, 0);
  const totalGrams = ingredients.reduce((sum, ing) => sum + parseNumber(ing.grams), 0);

  function saveRecipe() {
    if (!canSave) {
      return;
    }

    onSaveRecipe({ name: recipeName.trim(), ingredients: validIngredients() });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
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

      {/* Description */}
      <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 20 }}>
        {t.description}
      </Text>

      {/* Recipe name field */}
      <Card style={{ gap: spacing.xs, padding: spacing.md }}>
        <Eyebrow>{t.recipeNameLabel}</Eyebrow>
        <TextInput
          value={recipeName}
          onChangeText={setRecipeName}
          placeholder={t.recipeNamePlaceholder}
          placeholderTextColor={colors.muted2}
          style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600', minHeight: 30 }}
        />
      </Card>

      {/* Ingredients header with count chip — matches prototype */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Eyebrow>{t.ingredientsWeighed}</Eyebrow>
        <ProofChip level="verified" label={`${validIngredients().length}`} />
      </View>

      {/* Ingredients list */}
      <View style={{ gap: spacing.md }}>
        {ingredients.map((ingredient, index) => (
          <Card key={ingredient.id} style={{ gap: spacing.md, padding: spacing.md }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Eyebrow>{t.ingredientLabel(index + 1)}</Eyebrow>
              <Pressable
                onPress={() => removeIngredient(ingredient.id)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: colors.paper2,
                  borderRadius: radius.md,
                  height: 34,
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                  width: 34,
                })}
              >
                <Trash2 color={colors.muted} size={15} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Field label={t.fieldFood} value={ingredient.name} onChangeText={(value) => updateIngredient(ingredient.id, { name: value })} placeholder={t.fieldFoodPlaceholder} />
              <Field label={t.fieldGrams} value={ingredient.grams} onChangeText={(value) => updateIngredient(ingredient.id, { grams: value })} placeholder="150" />
              <Field label={t.fieldKcal} value={ingredient.kcalPer100g} onChangeText={(value) => updateIngredient(ingredient.id, { kcalPer100g: value })} placeholder="165" />
              <Field label={t.fieldProtein} value={ingredient.proteinPer100g} onChangeText={(value) => updateIngredient(ingredient.id, { proteinPer100g: value })} placeholder="31" />
              <Field label={t.fieldCarbs} value={ingredient.carbsPer100g} onChangeText={(value) => updateIngredient(ingredient.id, { carbsPer100g: value })} placeholder="0" />
              <Field label={t.fieldFat} value={ingredient.fatPer100g} onChangeText={(value) => updateIngredient(ingredient.id, { fatPer100g: value })} placeholder="3.6" />
            </View>
          </Card>
        ))}
      </View>

      {/* Add ingredient */}
      <Pressable
        onPress={() => setIngredients((current) => [...current, draftIngredient(`ingredient-${Date.now()}`)])}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: radius.lg,
          borderWidth: 1,
          flexDirection: 'row' as const,
          gap: spacing.sm,
          justifyContent: 'center',
          minHeight: 50,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Plus color={colors.ink2} size={17} strokeWidth={2} />
        <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '600' }}>{t.addIngredient}</Text>
      </Pressable>

      {/* Recipe total summary card — matches prototype (accent-wash) */}
      {totalKcal > 0 ? (
        <View style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Eyebrow color={colors.accentInk}>{t.totalRecipe}</Eyebrow>
            <ProofChip level="verified" label="Vérifié · pesée" />
          </View>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm, marginBottom: 10 }}>
            <Num style={{ color: colors.accentInk, fontSize: 28, fontWeight: '600' }}>{Math.round(totalKcal)}</Num>
            <Num style={{ color: colors.accentInk, fontSize: typography.small }}>{'kcal · '}{Math.round(totalGrams)} g</Num>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Eyebrow color={colors.accentInk}>{t.protein}</Eyebrow>
              <Num style={{ color: colors.accentInk, fontSize: 14, fontWeight: '600', marginTop: 3 }}>{Math.round(totalProtein)}g</Num>
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow color={colors.accentInk}>{t.carbs}</Eyebrow>
              <Num style={{ color: colors.accentInk, fontSize: 14, fontWeight: '600', marginTop: 3 }}>{Math.round(totalCarbs)}g</Num>
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow color={colors.accentInk}>{t.fat}</Eyebrow>
              <Num style={{ color: colors.accentInk, fontSize: 14, fontWeight: '600', marginTop: 3 }}>{Math.round(totalFat)}g</Num>
            </View>
          </View>
        </View>
      ) : null}

      {/* Save */}
      <PrimaryButton
        label={t.createRecipe}
        onPress={saveRecipe}
        disabled={!canSave}
        variant="dark"
        icon={<Save color="#FFFFFF" size={17} strokeWidth={2} />}
      />
    </ScrollView>
  );
}
