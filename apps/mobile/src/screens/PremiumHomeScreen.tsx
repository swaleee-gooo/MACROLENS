import { Pressable, ScrollView, Text, View } from 'react-native';
import { Barcode, Camera, Flame, ImagePlus, PenLine, Star, Target } from 'lucide-react-native';
import { BrandHeader } from '../components/BrandHeader';
import { PremiumCard } from '../components/PremiumCard';
import { RingProgress } from '../components/RingProgress';
import type { MacroTargets, Meal } from '../domain/types';
import { buildPremiumDashboardViewModel } from '../ui/premiumDashboardViewModel';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  meals: Meal[];
  targets: MacroTargets | null;
  onCapture: () => void;
  onPickPhoto: () => void;
  onBarcodeScan: () => void;
  onManualMeal: () => void;
  onOpenSettings: () => void;
};

function SmallStatCard({ label, value, icon }: { label: string; value: string; icon: 'flame' | 'star' }) {
  const Icon = icon === 'flame' ? Flame : Star;

  return (
    <PremiumCard style={{ flex: 1, minHeight: 104 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <Icon color={icon === 'flame' ? colors.amber : colors.black} size={26} strokeWidth={2.4} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
          <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900', marginTop: spacing.xs }}>{value}</Text>
        </View>
      </View>
    </PremiumCard>
  );
}

function MacroProgress({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const progress = target > 0 ? Math.round((consumed / target) * 100) : 0;

  return (
    <PremiumCard style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>
          {consumed}g <Text style={{ color: colors.muted, fontSize: typography.body }}>/ {target}g</Text>
        </Text>
      </View>
      <RingProgress size={68} strokeWidth={8} progress={progress} color={color} label="" detail="" />
    </PremiumCard>
  );
}

export function PremiumHomeScreen({ meals, targets, onCapture, onPickPhoto, onBarcodeScan, onManualMeal, onOpenSettings }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const vm = buildPremiumDashboardViewModel(meals, today, targets);
  const dayLabels = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

  return (
    <ScrollView style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xxl }}>
      <BrandHeader streak={vm.streakDays || undefined} onSettings={onOpenSettings} />
      <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xl }}>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>Apercu Quotidien</Text>
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800' }}>Aujourd'hui</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <SmallStatCard label="Serie actuelle" value={`${vm.streakDays} jours`} icon="flame" />
        <SmallStatCard label="Prochain badge" value={`${vm.nextBadge.daysRemaining} jours -> ${vm.nextBadge.label}`} icon="star" />
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
          <Text style={{ alignSelf: 'flex-start', color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories totales</Text>
          <RingProgress size={250} strokeWidth={16} progress={vm.calories.progress} label={`${vm.calories.consumed}`} detail={`/ ${vm.calories.target || '--'} kcal`} />
          <View style={{ backgroundColor: colors.surfaceMuted, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>- {vm.calories.remaining} restantes</Text>
          </View>
        </PremiumCard>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <MacroProgress label="Proteines" consumed={vm.protein.consumed} target={vm.protein.target} color={colors.green} />
        <MacroProgress label="Glucides" consumed={vm.carbs.consumed} target={vm.carbs.target} color={colors.blue} />
        <MacroProgress label="Lipides" consumed={vm.fat.consumed} target={vm.fat.target} color={colors.amber} />
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <PremiumCard style={{ gap: spacing.xl, minHeight: 220 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Progression hebdomadaire</Text>
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>Moyenne: {vm.calories.target || vm.calories.consumed} kcal</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
              {dayLabels.map((label) => (
                <View key={label} style={{ alignItems: 'center', backgroundColor: label === 'SAM' ? colors.surface : colors.surfaceMuted, borderColor: label === 'SAM' ? colors.black : colors.surfaceMuted, borderWidth: 1, flex: 1, paddingVertical: spacing.xs }}>
                  <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900' }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </PremiumCard>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
        <Pressable onPress={onCapture} style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.md, justifyContent: 'center', minHeight: 64 }}>
          <Camera color="white" size={24} strokeWidth={2.6} />
          <Text style={{ color: 'white', fontSize: typography.subheading, fontWeight: '900' }}>Scanner un repas</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable onPress={onBarcodeScan} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
            <Barcode color={colors.green} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Produit</Text>
          </Pressable>
          <Pressable onPress={onPickPhoto} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
            <ImagePlus color={colors.blue} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Galerie</Text>
          </Pressable>
          <Pressable onPress={onManualMeal} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 }}>
            <PenLine color={colors.amber} size={18} strokeWidth={2.4} />
            <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Manuel</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
