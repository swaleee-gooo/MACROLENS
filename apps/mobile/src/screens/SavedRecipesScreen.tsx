import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, ChefHat, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useLang } from '../i18n/LanguageContext';
import { recipeServingMacros } from '../recipeImport/recipeNutrition';
import { recipePlatformLabel } from '../recipeImport/recipeUrl';
import type { ImportedRecipe } from '../recipeImport/recipeSchema';
import type { RecipeRepository, SavedRecipe } from '../storage/recipeRepository';
import { Card, Eyebrow, Num } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

type Props = {
  repository: RecipeRepository;
  onBack: () => void;
  onOpen: (recipe: ImportedRecipe) => void;
  onShoppingList: (recipe: ImportedRecipe) => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'My recipes',
    count: (n: number) => `${n} ${n === 1 ? 'recipe' : 'recipes'}`,
    emptyTitle: 'No saved recipes yet',
    emptyBody: 'Import a recipe from TikTok, Instagram or YouTube and it will show up here.',
    ingredients: (n: number) => `${n} ${n === 1 ? 'ingredient' : 'ingredients'}`,
    perServing: 'per serving',
  },
  fr: {
    brand: 'MacroLens',
    title: 'Mes recettes',
    count: (n: number) => `${n} ${n === 1 ? 'recette' : 'recettes'}`,
    emptyTitle: 'Aucune recette enregistrée',
    emptyBody: 'Importe une recette depuis TikTok, Instagram ou YouTube et elle apparaîtra ici.',
    ingredients: (n: number) => `${n} ${n === 1 ? 'ingrédient' : 'ingrédients'}`,
    perServing: 'par portion',
  },
};

function hasHttpImage(value: string | null): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export function SavedRecipesScreen({ repository, onBack, onOpen, onShoppingList }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);

  const reload = useCallback(() => {
    repository
      .listRecipes()
      .then(setRecipes)
      .catch(() => undefined);
  }, [repository]);

  useEffect(() => {
    reload();
  }, [reload]);

  function remove(id: string) {
    repository
      .deleteRecipe(id)
      .then(reload)
      .catch(() => undefined);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
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
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.subheading, fontWeight: '700', letterSpacing: -0.3 }}>{t.title}</Text>
        </View>
        {recipes.length > 0 ? <Num style={{ color: colors.muted, fontSize: typography.small }}>{t.count(recipes.length)}</Num> : null}
      </View>

      {recipes.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: spacing.md, padding: spacing.xxxl }}>
          <ChefHat color={colors.muted} size={44} strokeWidth={1.5} />
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.emptyTitle}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' }}>{t.emptyBody}</Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {recipes.map((entry) => {
            const serving = recipeServingMacros(entry.recipe);
            return (
              <Card key={entry.id} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.sm }}>
                <Pressable onPress={() => onOpen(entry.recipe)} style={({ pressed }) => ({ alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.md, opacity: pressed ? 0.7 : 1 })}>
                  {hasHttpImage(entry.recipe.imageUrl) ? (
                    <Image source={{ uri: entry.recipe.imageUrl }} style={{ backgroundColor: colors.paper2, borderRadius: radius.md, height: 56, width: 56 }} />
                  ) : (
                    <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderRadius: radius.md, height: 56, justifyContent: 'center', width: 56 }}>
                      <ChefHat color={colors.accentInk} size={22} strokeWidth={1.8} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: colors.ink, fontSize: typography.body, fontWeight: '700' }}>{entry.recipe.title}</Text>
                    <Num numberOfLines={1} style={{ color: colors.muted, fontSize: typography.small }}>
                      {serving.kcal} kcal {t.perServing} · {t.ingredients(entry.recipe.ingredients.length)}
                    </Num>
                    <Eyebrow color={colors.accentInk}>{recipePlatformLabel(entry.recipe.sourcePlatform)}</Eyebrow>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => onShoppingList(entry.recipe)}
                  style={({ pressed }) => ({ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: radius.sm, borderWidth: 1, height: 34, justifyContent: 'center', opacity: pressed ? 0.6 : 1, width: 34 })}
                >
                  <ShoppingCart color={colors.accentInk} size={15} strokeWidth={2} />
                </Pressable>
                <Pressable
                  onPress={() => remove(entry.id)}
                  style={({ pressed }) => ({ alignItems: 'center', borderColor: colors.line2, borderRadius: radius.sm, borderWidth: 1, height: 34, justifyContent: 'center', opacity: pressed ? 0.6 : 1, width: 34 })}
                >
                  <Trash2 color={colors.muted} size={15} strokeWidth={2} />
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
