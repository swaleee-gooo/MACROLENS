import { Image, Pressable, Text, View } from 'react-native';
import { Barcode, PencilLine } from 'lucide-react-native';
import type { Meal } from '../domain/types';
import { useLang } from '../i18n/LanguageContext';
import { Num, ProofChip } from '../ui/primitives';
import { colors, radius, spacing } from '../ui/theme';

type Props = {
  meal: Meal;
  onPress: (meal: Meal) => void;
};

const STR = {
  en: { manual: 'Manual', barcode: 'Barcode', verified: 'Verified', estimated: 'Estimated', protein: 'g protein' },
  fr: { manual: 'Manuel', barcode: 'Code-barres', verified: 'Vérifié', estimated: 'Estimé', protein: 'g protéines' },
};

export function MealCard({ meal, onPress }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isManual = meal.imageUri.startsWith('manual://');
  const isProduct = meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://');
  const verified = isProduct || meal.confidence === 'high';

  return (
    <Pressable
      onPress={() => onPress(meal)}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      {isManual || isProduct ? (
        <View style={{ alignItems: 'center', backgroundColor: colors.paper2, borderRadius: 12, height: 44, justifyContent: 'center', width: 44 }}>
          {isProduct ? <Barcode color={colors.ink2} size={22} strokeWidth={1.7} /> : <PencilLine color={colors.ink2} size={22} strokeWidth={1.7} />}
        </View>
      ) : (
        <Image source={{ uri: meal.imageUri }} style={{ backgroundColor: colors.paper2, borderRadius: 12, height: 44, width: 44 }} />
      )}
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text numberOfLines={1} style={{ color: colors.ink, flex: 1, fontSize: 14, fontWeight: '600', paddingRight: spacing.sm }}>
            {meal.mealName}
          </Text>
          <Num style={{ fontSize: 14, fontWeight: '600' }}>{meal.caloriesEstimate}</Num>
        </View>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <ProofChip level={verified ? 'verified' : 'estimated'} label={isManual ? t.manual : isProduct ? t.barcode : verified ? t.verified : t.estimated} />
          <Num style={{ color: colors.muted, fontSize: 11 }}>
            {meal.proteinG} {t.protein}
          </Num>
        </View>
      </View>
    </Pressable>
  );
}
