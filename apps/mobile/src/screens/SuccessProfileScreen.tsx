import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Award, Flame, LockKeyhole, ScanLine, Settings, Target } from 'lucide-react-native';
import { calculateMealStreak } from '../domain/streaks';
import { useLang } from '../i18n/LanguageContext';
import type { Meal, UserProfile } from '../domain/types';
import { buildBadgesViewModel } from '../ui/badgesViewModel';
import { Card, Eyebrow, Num, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  profile: UserProfile | null;
  onEditProfile: () => void;
  onOpenSettings: () => void;
};

const STR = {
  en: {
    profile: 'Profile',
    member: 'MacroLens Member',
    memberSince: 'Member since 2026',
    pro: 'Pro',
    days: 'days',
    verified: 'verified',
    scans: 'scans',
    badges: 'Badges',
  },
  fr: {
    profile: 'Profil',
    member: 'Membre MacroLens',
    memberSince: 'Membre depuis 2026',
    pro: 'Pro',
    days: 'jours',
    verified: 'vérifiés',
    scans: 'scans',
    badges: 'Badges',
  },
};

const BADGE_ICONS = [Award, ScanLine, Flame, Target];

function isVerified(meal: Meal): boolean {
  return meal.imageUri.startsWith('product://') || meal.imageUri.startsWith('barcode://') || meal.confidence === 'high';
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <Card style={{ alignItems: 'center', flex: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.lg }}>
      {icon}
      <Num style={{ fontSize: 19, fontWeight: '600', marginTop: 6 }}>{value}</Num>
      <Eyebrow style={{ marginTop: 2 }}>{label}</Eyebrow>
    </Card>
  );
}

function BadgeTile({ icon: Icon, title, locked }: { icon: typeof Award; title: string; locked: boolean }) {
  return (
    <Card style={{ alignItems: 'center', flex: 1, gap: 8, opacity: locked ? 0.5 : 1, paddingHorizontal: 6, paddingVertical: spacing.md }}>
      <View style={{ alignItems: 'center', backgroundColor: locked ? colors.paper2 : colors.accentWash, borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 }}>
        {locked ? <LockKeyhole color={colors.muted} size={18} strokeWidth={2} /> : <Icon color={colors.accentInk} size={18} strokeWidth={2} />}
      </View>
      <Text numberOfLines={2} style={{ color: locked ? colors.muted : colors.ink, fontSize: 10, fontWeight: '600', lineHeight: 13, textAlign: 'center' }}>{title}</Text>
    </Card>
  );
}

export function SuccessProfileScreen({ meals, profile, onEditProfile, onOpenSettings }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const today = new Date().toISOString().slice(0, 10);
  const streakDays = calculateMealStreak(meals, today);
  const scanCount = meals.filter((meal) => !meal.imageUri.startsWith('manual://')).length;
  const verifiedCount = meals.filter(isVerified).length;
  const badges = buildBadgesViewModel({ streakDays, proteinTargetDays: streakDays, scanCount });
  const allBadges = [
    ...badges.unlocked.map((badge) => ({ ...badge, locked: false })),
    ...badges.locked.map((badge) => ({ ...badge, locked: true })),
  ].slice(0, 4);

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.md, padding: spacing.xl, paddingBottom: 116 }} showsVerticalScrollIndicator={false}>
      {/* Title + settings */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.title, letterSpacing: -0.6 }}>{t.profile}</Text>
        <Pressable onPress={onOpenSettings} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 }}>
          <Settings color={colors.ink2} size={19} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Member card */}
      <Pressable onPress={onEditProfile} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card style={{ alignItems: 'center', flexDirection: 'row', gap: 14, padding: 18 }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: 16, height: 54, justifyContent: 'center', width: 54 }}>
            <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 20, fontWeight: '600' }}>ML</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{t.member}</Text>
            <Num style={{ color: colors.muted, fontSize: typography.tiny, marginTop: 3 }}>{t.memberSince}</Num>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: colors.accentWash, borderColor: colors.accentLine, borderRadius: 7, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Seal size={12} color={colors.accentInk} />
            <Text style={{ color: colors.accentInk, fontFamily: fonts.mono, fontSize: 10, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>{t.pro}</Text>
          </View>
        </Card>
      </Pressable>

      {/* 3 stat cards */}
      <View style={{ flexDirection: 'row', gap: 11 }}>
        <Stat icon={<Flame color={colors.warn} size={20} strokeWidth={2} />} value={streakDays} label={t.days} />
        <Stat icon={<Seal size={20} color={colors.accent} />} value={verifiedCount} label={t.verified} />
        <Stat icon={<ScanLine color={colors.ink2} size={20} strokeWidth={2} />} value={scanCount} label={t.scans} />
      </View>

      {/* Badges */}
      <Eyebrow style={{ marginTop: spacing.lg }}>{t.badges}</Eyebrow>
      <View style={{ flexDirection: 'row', gap: 11 }}>
        {allBadges.map((badge, index) => (
          <BadgeTile key={badge.id} icon={BADGE_ICONS[index % BADGE_ICONS.length]} title={badge.title} locked={badge.locked} />
        ))}
      </View>
    </ScrollView>
  );
}
