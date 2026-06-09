import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { ArrowLeft, Check, Share2, ShoppingCart } from 'lucide-react-native';
import { buildShoppingList, formatShoppingListText, type ShoppingListSource } from '../domain/shoppingList';
import { useLang } from '../i18n/LanguageContext';
import { Card, Eyebrow, Num, PrimaryButton } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  title: string;
  sourceItems: ShoppingListSource[];
  onBack: () => void;
};

const STR = {
  en: {
    brand: 'MacroLens',
    title: 'Shopping list',
    items: (n: number) => `${n} items`,
    remaining: (n: number) => `${n} left`,
    share: 'Share the list',
    empty: 'No ingredients to buy.',
  },
  fr: {
    brand: 'MacroLens',
    title: 'Liste de courses',
    items: (n: number) => `${n} articles`,
    remaining: (n: number) => `${n} restants`,
    share: 'Partager la liste',
    empty: 'Aucun ingrédient à acheter.',
  },
};

export function ShoppingListScreen({ title, sourceItems, onBack }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const items = useMemo(() => buildShoppingList(sourceItems), [sourceItems]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const remaining = items.filter((item) => !checked[item.id]).length;

  function toggle(id: string) {
    setChecked((current) => ({ ...current, [id]: !current[id] }));
  }

  async function share() {
    const remainingItems = items.filter((item) => !checked[item.id]);
    const text = formatShoppingListText(remainingItems.length > 0 ? remainingItems : items, title);
    await Share.share({ message: text });
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.lg, padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
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
            <Text numberOfLines={1} style={{ color: colors.ink, fontSize: typography.subheading, fontWeight: '800', letterSpacing: -0.2 }}>{title || t.title}</Text>
          </View>
        </View>

        {/* Count */}
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Eyebrow>{t.items(items.length)}</Eyebrow>
          <Num style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600' }}>{t.remaining(remaining)}</Num>
        </View>

        {/* List */}
        {items.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: spacing.md, padding: spacing.xxxl }}>
            <ShoppingCart color={colors.muted} size={44} strokeWidth={1.5} />
            <Text style={{ color: colors.muted, fontSize: typography.small }}>{t.empty}</Text>
          </Card>
        ) : (
          <Card style={{ overflow: 'hidden' }}>
            {items.map((item, index) => {
              const isChecked = Boolean(checked[item.id]);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggle(item.id)}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    borderBottomColor: colors.line,
                    borderBottomWidth: index === items.length - 1 ? 0 : 1,
                    flexDirection: 'row',
                    gap: spacing.md,
                    opacity: pressed ? 0.7 : 1,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 14,
                  })}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      backgroundColor: isChecked ? colors.accent : 'transparent',
                      borderColor: isChecked ? colors.accent : colors.line2,
                      borderRadius: radius.pill,
                      borderWidth: 1.5,
                      height: 24,
                      justifyContent: 'center',
                      width: 24,
                    }}
                  >
                    {isChecked ? <Check color="#FFFFFF" size={14} strokeWidth={2.6} /> : null}
                  </View>
                  <Text
                    style={{
                      color: isChecked ? colors.muted2 : colors.ink,
                      flex: 1,
                      fontSize: typography.body,
                      fontWeight: '600',
                      textDecorationLine: isChecked ? 'line-through' : 'none',
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.grams > 0 ? (
                    <Num style={{ color: isChecked ? colors.muted2 : colors.muted, fontSize: typography.small }}>{item.grams} g</Num>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {items.length > 0 ? (
        <View style={{ paddingBottom: 26, paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <PrimaryButton label={t.share} onPress={share} variant="dark" icon={<Share2 color="#FFFFFF" size={17} strokeWidth={2} />} />
        </View>
      ) : null}
    </View>
  );
}
