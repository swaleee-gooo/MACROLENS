import { Pressable, ScrollView, Text, View } from 'react-native';
import { Dumbbell, Flame, LockKeyhole, Pencil, Settings, Target, UserRound } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { PremiumCard } from '../components/PremiumCard';
import { calculateMealStreak } from '../domain/streaks';
import type { Meal, UserProfile } from '../domain/types';
import { buildBadgesViewModel } from '../ui/badgesViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  profile: UserProfile | null;
  onEditProfile: () => void;
  onOpenSavedMeals: () => void;
  onOpenSettings: () => void;
};

function goalLabel(goal: UserProfile['goal'] | undefined): string {
  if (goal === 'lose_fat') {
    return 'Perdre du poids';
  }
  if (goal === 'build_muscle') {
    return 'Prendre du muscle';
  }
  if (goal === 'understand_eating') {
    return "Comprendre l'alimentation";
  }
  return 'Maintien';
}

function activityLabel(activityLevel: UserProfile['activityLevel'] | undefined): string {
  if (activityLevel === 'high') {
    return 'Intense';
  }
  if (activityLevel === 'low') {
    return 'Sedentaire';
  }
  return 'Modere';
}

function BadgeCard({ title, detail, locked = false }: { title: string; detail: string; locked?: boolean }) {
  return (
    <PremiumCard style={{ alignItems: 'center', flex: 1, gap: spacing.md, minHeight: 154 }}>
      <View style={{ alignItems: 'center', backgroundColor: locked ? colors.surfaceMuted : colors.black, borderRadius: radius.pill, height: 64, justifyContent: 'center', width: 64 }}>
        {locked ? <LockKeyhole color={colors.muted} size={24} strokeWidth={2.4} /> : <Text style={{ color: colors.greenSoft, fontSize: typography.subheading, fontWeight: '900' }}>ML</Text>}
      </View>
      <Text style={{ color: locked ? colors.muted : colors.black, fontSize: typography.small, fontWeight: '900', textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', textAlign: 'center' }}>{detail}</Text>
    </PremiumCard>
  );
}

function ProfileMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Target }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
      <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 }}>
        <Icon color={colors.green} size={19} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900', marginTop: spacing.xs }}>{value}</Text>
      </View>
    </View>
  );
}

export function SuccessProfileScreen({ meals, profile, onEditProfile, onOpenSavedMeals, onOpenSettings }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const streakDays = calculateMealStreak(meals, today);
  const scanCount = meals.filter((meal) => !meal.imageUri.startsWith('manual://')).length;
  const badges = buildBadgesViewModel({ streakDays, proteinTargetDays: streakDays, scanCount });

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader streak={streakDays || undefined} />
      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>Profil</Text>
            <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 23 }}>Tes reglages et tes metrics MacroLens.</Text>
          </View>
          <Pressable onPress={onOpenSettings} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 }}>
            <Settings color={colors.black} size={19} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ gap: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
            <View style={{ alignItems: 'center', backgroundColor: colors.green, borderRadius: radius.pill, height: 58, justifyContent: 'center', width: 58 }}>
              <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>ML</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>MacroLens Member</Text>
              <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', marginTop: spacing.xs }}>Depuis mai 2026</Text>
            </View>
            <Pressable onPress={onEditProfile} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md }}>
              <Pencil color="white" size={15} strokeWidth={2.4} />
              <Text style={{ color: 'white', fontSize: typography.small, fontWeight: '900' }}>Edit</Text>
            </Pressable>
          </View>

          <View style={{ gap: spacing.sm }}>
            <ProfileMetric icon={Target} label="Objectif" value={goalLabel(profile?.goal)} />
            <ProfileMetric icon={UserRound} label="Poids actuel" value={profile ? `${profile.weightKg} kg` : '-- kg'} />
            <ProfileMetric icon={Target} label="Poids cible" value={profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : 'Non defini'} />
            <ProfileMetric icon={Dumbbell} label="Activite" value={activityLabel(profile?.activityLevel)} />
          </View>
        </PremiumCard>
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Streak actuel</Text>
            <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>{streakDays} <Text style={{ fontSize: typography.body }}>jours</Text></Text>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderColor: colors.green, borderRadius: radius.pill, borderWidth: 5, height: 86, justifyContent: 'center', width: 86 }}>
            <Flame color={colors.green} size={34} strokeWidth={2.5} />
          </View>
        </PremiumCard>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Resume</Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <PremiumCard style={{ flex: 1, gap: spacing.xs }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Repas</Text>
            <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>{meals.length}</Text>
          </PremiumCard>
          <PremiumCard style={{ flex: 1, gap: spacing.xs }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Scans</Text>
            <Text style={{ color: colors.green, fontSize: typography.heading, fontWeight: '900' }}>{scanCount}</Text>
          </PremiumCard>
        </View>
        <Pressable onPress={onOpenSavedMeals} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, minHeight: 52, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Saved meals</Text>
        </Pressable>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Badges</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {badges.unlocked.slice(0, 2).map((badge) => (
            <View key={badge.id} style={{ flexBasis: '47%' }}>
              <BadgeCard title={badge.title} detail={badge.detail} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.muted, fontSize: typography.subheading, fontWeight: '900' }}>A debloquer</Text>
        {badges.locked.slice(0, 2).map((badge) => (
          <BadgeCard key={badge.id} title={badge.title} detail={badge.detail} locked />
        ))}
      </View>
    </ScrollView>
  );
}
