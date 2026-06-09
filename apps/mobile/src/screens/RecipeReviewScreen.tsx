import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Bookmark, Minus, Plus, Trash2, Users } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, MacroBar, Num, PrimaryButton, ProofChip } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';
import { recipePlatformLabel } from '../recipeImport/recipeUrl';
import { applyStatedMacros, computeRecipeTotals, perServingTotals } from '../recipeImport/recipeNutrition';
import type { ImportedRecipe, ImportedRecipeIngredient } from '../recipeImport/recipeSchema';
import { ShareCardButton } from '../share/ShareCardButton';
import { cardDataFromImportedRecipe } from '../share/shareCardContent';

type Props = {
  recipe: ImportedRecipe;
  onBack: () => void;
  onSave: (recipe: ImportedRecipe) => void;
};

type IngredientDraft = ImportedRecipeIngredient & { id: string; gramsText: string };

const STR = {
  en: {
    brand: 'MacroLens',
    review: 'Review recipe',
    estimated: 'Estimated',
    nameLabel: 'Dish name',
    servingsLabel: 'Servings',
    perServing: 'Per serving',
    wholeRecipe: 'Whole recipe',
    ingredients: 'Ingredients',
    grams: 'g',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    steps: 'Steps',
    save: 'Save recipe',
    shareMyCard: 'Share my card',
    sharingCard: 'Preparing card...',
    note: 'Estimated from the post. Adjust grams and servings to match what you actually ate.',
    kcalPer100: 'kcal/100g',
  },
  fr: {
    brand: 'MacroLens',
    review: 'Vérifier la recette',
    estimated: 'Estimé',
    nameLabel: 'Nom du plat',
    servingsLabel: 'Portions',
    perServing: 'Par portion',
    wholeRecipe: 'Recette entière',
    ingredients: 'Ingrédients',
    grams: 'g',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    steps: 'Étapes',
    save: 'Enregistrer la recette',
    shareMyCard: 'Partager ma carte',
    sharingCard: 'Preparation...',
    note: 'Estimé depuis la publication. Ajuste les grammes et les portions selon ce que tu as réellement mangé.',
    kcalPer100: 'kcal/100g',
  },
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function hasHttpImage(imageUrl: string | null): imageUrl is string {
  return typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl);
}

export function RecipeReviewScreen({ recipe, onBack, onSave }: Props) {
  const { lang } = useLang();
  const t = STR[lang];

  const [title, setTitle] = useState(recipe.title);
  const [servings, setServings] = useState(recipe.servings > 0 ? recipe.servings : 1);
  const [drafts, setDrafts] = useState<IngredientDraft[]>(() =>
    recipe.ingredients.map((ingredient, index) => ({
      ...ingredient,
      id: `ingredient-${index + 1}`,
      gramsText: String(Math.round(ingredient.grams)),
    })),
  );

  function updateGrams(id: string, gramsText: string) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, gramsText } : draft)));
  }

  function updateName(id: string, name: string) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, name } : draft)));
  }

  function removeIngredient(id: string) {
    setDrafts((current) => (current.length === 1 ? current : current.filter((draft) => draft.id !== id)));
  }

  const validIngredients = useMemo<ImportedRecipeIngredient[]>(
    () =>
      drafts
        .map((draft) => ({
          name: draft.name.trim(),
          grams: parseNumber(draft.gramsText),
          kcalPer100g: draft.kcalPer100g,
          proteinPer100g: draft.proteinPer100g,
          carbsPer100g: draft.carbsPer100g,
          fatPer100g: draft.fatPer100g,
        }))
        .filter((ingredient) => ingredient.name.length > 0 && ingredient.grams > 0),
    [drafts],
  );

  const recipeTotals = useMemo(() => computeRecipeTotals(validIngredients), [validIngredients]);
  // Creator-stated macros/calories win exactly over the computed per-serving values.
  const serving = useMemo(() => applyStatedMacros(perServingTotals(recipeTotals, servings), recipe), [recipeTotals, servings, recipe]);

  const proteinKcal = serving.proteinG * 4;
  const carbsKcal = serving.carbsG * 4;
  const fatKcal = serving.fatG * 9;
  const macroKcal = proteinKcal + carbsKcal + fatKcal || 1;
  const macroSegments = [
    { pct: (proteinKcal / macroKcal) * 100, color: colors.protein },
    { pct: (carbsKcal / macroKcal) * 100, color: colors.carbs },
    { pct: (fatKcal / macroKcal) * 100, color: colors.fat },
  ];

  const canSave = title.trim().length > 0 && validIngredients.length > 0;
  const editedRecipe: ImportedRecipe = {
    ...recipe,
    title: title.trim() || recipe.title,
    servings,
    ingredients: validIngredients,
  };
  const shareCardData = cardDataFromImportedRecipe(editedRecipe);

  function save() {
    if (!canSave) {
      return;
    }

    onSave(editedRecipe);
  }

  const showImage = hasHttpImage(recipe.imageUrl);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={{ backgroundColor: colors.night, height: 200, justifyContent: 'flex-end' }}>
        {showImage ? (
          <Image source={{ uri: recipe.imageUrl as string }} resizeMode="cover" style={{ height: 200, position: 'absolute', width: '100%' }} />
        ) : (
          <View style={{ alignItems: 'center', height: 200, justifyContent: 'center', position: 'absolute', width: '100%' }}>
            <Text style={{ color: 'rgba(255,255,255,0.18)', fontFamily: fonts.display, fontSize: 64, fontWeight: '700' }}>{t.brand}</Text>
          </View>
        )}
        <View style={{ backgroundColor: 'rgba(8,8,8,0.32)', padding: spacing.lg, paddingTop: spacing.xxl }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: colors.scannerGlass,
                borderRadius: radius.pill,
                height: 40,
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
                width: 40,
              })}
            >
              <ArrowLeft color={colors.ink} size={19} strokeWidth={2.2} />
            </Pressable>
            <View style={{ alignItems: 'center', backgroundColor: colors.scannerGlass, borderRadius: 7, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 5 }}>
              <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {recipePlatformLabel(recipe.sourcePlatform)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.xl, padding: spacing.xl }}>
        {/* Title + proof */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Eyebrow>{t.review}</Eyebrow>
            <ProofChip level="estimated" label={t.estimated} />
          </View>
          <Card style={{ gap: spacing.xs, padding: spacing.md }}>
            <Eyebrow>{t.nameLabel}</Eyebrow>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t.nameLabel}
              placeholderTextColor={colors.muted2}
              style={{ color: colors.ink, fontSize: typography.subheading, fontWeight: '700', minHeight: 32 }}
            />
          </Card>
          {recipe.summary ? <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 20 }}>{recipe.summary}</Text> : null}
        </View>

        {/* Servings stepper */}
        <Card style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <Users color={colors.ink2} size={18} strokeWidth={2} />
            <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.servingsLabel}</Text>
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
            <Stepper icon={Minus} onPress={() => setServings((current) => Math.max(1, current - 1))} disabled={servings <= 1} />
            <Num style={{ fontSize: typography.subheading, fontWeight: '600', minWidth: 24, textAlign: 'center' }}>{servings}</Num>
            <Stepper icon={Plus} onPress={() => setServings((current) => Math.min(20, current + 1))} disabled={servings >= 20} />
          </View>
        </Card>

        {/* Per-serving macro card */}
        <View style={{ backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Eyebrow color={colors.accentInk}>{t.perServing}</Eyebrow>
            <Num style={{ color: colors.accentInk, fontSize: typography.tiny }}>
              {t.wholeRecipe}: {recipeTotals.kcal} kcal
            </Num>
          </View>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm }}>
            <Num style={{ color: colors.accentInk, fontSize: typography.title, fontWeight: '600' }}>{serving.kcal}</Num>
            <Num style={{ color: colors.accentInk, fontSize: typography.small }}>kcal · {serving.grams} g</Num>
          </View>
          <MacroBar segments={macroSegments} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <MacroStat label={t.protein} grams={serving.proteinG} color={colors.protein} />
            <MacroStat label={t.carbs} grams={serving.carbsG} color={colors.carbs} />
            <MacroStat label={t.fat} grams={serving.fatG} color={colors.fat} />
          </View>
        </View>

        {/* Ingredients */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Eyebrow>{t.ingredients}</Eyebrow>
            <Num style={{ color: colors.muted, fontSize: typography.tiny }}>{validIngredients.length}</Num>
          </View>
          {drafts.map((draft) => (
            <Card key={draft.id} style={{ gap: spacing.sm, padding: spacing.md }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                <TextInput
                  value={draft.name}
                  onChangeText={(value) => updateName(draft.id, value)}
                  placeholder={t.ingredients}
                  placeholderTextColor={colors.muted2}
                  style={{ color: colors.ink, flex: 1, fontSize: typography.body, fontWeight: '600', minHeight: 36 }}
                />
                <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: radius.sm, flexDirection: 'row', paddingHorizontal: spacing.sm }}>
                  <TextInput
                    value={draft.gramsText}
                    onChangeText={(value) => updateGrams(draft.id, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.muted2}
                    style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: typography.body, fontWeight: '600', minHeight: 36, minWidth: 44, textAlign: 'right' }}
                  />
                  <Text style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: typography.small, marginLeft: 2 }}>{t.grams}</Text>
                </View>
                <Pressable
                  onPress={() => removeIngredient(draft.id)}
                  disabled={drafts.length === 1}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: colors.paper2,
                    borderRadius: radius.sm,
                    height: 36,
                    justifyContent: 'center',
                    opacity: drafts.length === 1 ? 0.35 : pressed ? 0.7 : 1,
                    width: 36,
                  })}
                >
                  <Trash2 color={colors.muted} size={15} strokeWidth={2} />
                </Pressable>
              </View>
              <Num style={{ color: colors.muted2, fontSize: typography.tiny }}>
                {Math.round(draft.kcalPer100g)} {t.kcalPer100}
              </Num>
            </Card>
          ))}
        </View>

        {/* Steps */}
        {recipe.steps.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Eyebrow>{t.steps}</Eyebrow>
            <Card style={{ gap: spacing.md, padding: spacing.lg }}>
              {recipe.steps.map((step, index) => (
                <View key={`${index}-${step.slice(0, 8)}`} style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md }}>
                  <Num style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600', minWidth: 18 }}>{index + 1}</Num>
                  <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, lineHeight: 20 }}>{step}</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {/* Save */}
        <PrimaryButton
          label={t.save}
          onPress={save}
          disabled={!canSave}
          variant="dark"
          icon={<Bookmark color="#FFFFFF" size={17} strokeWidth={2} />}
        />
        <ShareCardButton data={shareCardData} label={t.shareMyCard} sharingLabel={t.sharingCard} disabled={!canSave} />
        <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16, textAlign: 'center' }}>{t.note}</Text>
      </View>
    </ScrollView>
  );
}

function Stepper({ icon: Icon, onPress, disabled }: { icon: typeof Plus; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: colors.paper2,
        borderColor: colors.line,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 36,
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        width: 36,
      })}
    >
      <Icon color={colors.ink} size={16} strokeWidth={2.2} />
    </Pressable>
  );
}

function MacroStat({ label, grams, color }: { label: string; grams: number; color: string }) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
        <View style={{ backgroundColor: color, borderRadius: 2, height: 8, width: 8 }} />
        <Eyebrow color={colors.accentInk}>{label}</Eyebrow>
      </View>
      <Num style={{ color: colors.accentInk, fontSize: 14, fontWeight: '600' }}>{grams}g</Num>
    </View>
  );
}
