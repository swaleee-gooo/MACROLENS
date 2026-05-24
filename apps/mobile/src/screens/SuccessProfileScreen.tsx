import { Pressable, ScrollView, Text, View } from 'react-native';
import { LockKeyhole, Pencil, Settings } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { PremiumCard } from '../components/PremiumCard';
import { calculateMealStreak } from '../domain/streaks';
import type { Meal } from '../domain/types';
import { buildBadgesViewModel } from '../ui/badgesViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  onEditProfile: () => void;
  onOpenSettings: () => void;
};

function BadgeCard({ title, detail, locked = false }: { title: string; detail: string; locked?: boolean }) {
  return (
    <PremiumCard style={{ alignItems: 'center', flex: 1, gap: spacing.md, minHeight: 170 }}>
      <View style={{ alignItems: 'center', backgroundColor: locked ? colors.surfaceMuted : colors.black, borderRadius: radius.pill, height: 74, justifyContent: 'center', width: 74 }}>
        {locked ? <LockKeyhole color={colors.muted} size={28} strokeWidth={2.4} /> : <Text style={{ color: colors.greenSoft, fontSize: typography.heading, fontWeight: '900' }}>ML</Text>}
      </View>
      <Text style={{ color: locked ? colors.muted : colors.black, fontSize: typography.body, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', textAlign: 'center' }}>{detail}</Text>
    </PremiumCard>
  );
}

export function SuccessProfileScreen({ meals, onEditProfile, onOpenSettings }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const streakDays = calculateMealStreak(meals, today);
  const badges = buildBadgesViewModel({ streakDays, proteinTargetDays: streakDays, scanCount: meals.filter((meal) => !meal.imageUri.startsWith('manual://')).length });

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader streak={streakDays || undefined} />
      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>Mes Succes</Text>
            <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 23 }}>Collection de tes accomplissements nutritionnels.</Text>
          </View>
          <Pressable onPress={onEditProfile} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Pencil color={colors.black} size={16} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>Modifier</Text>
          </Pressable>
        </View>
        <Pressable onPress={onOpenSettings} style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs }}>
          <Settings color={colors.muted} size={16} strokeWidth={2.4} />
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>Parametres</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Streak actuel</Text>
            <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>{streakDays} <Text style={{ fontSize: typography.body }}>jours consecutifs</Text></Text>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderColor: colors.green, borderRadius: radius.pill, borderWidth: 5, height: 86, justifyContent: 'center', width: 86 }}>
            <Text style={{ color: colors.green, fontSize: typography.heading, fontWeight: '900' }}>ML</Text>
          </View>
        </PremiumCard>
      </View>
      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Badges debloques</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {badges.unlocked.slice(0, 4).map((badge) => (
            <View key={badge.id} style={{ flexBasis: '47%' }}>
              <BadgeCard title={badge.title} detail={badge.detail} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.muted, fontSize: typography.heading, fontWeight: '900' }}>A Decouvrir</Text>
        {badges.locked.map((badge) => (
          <BadgeCard key={badge.id} title={badge.title} detail={badge.detail} locked />
        ))}
      </View>
    </ScrollView>
  );
}
