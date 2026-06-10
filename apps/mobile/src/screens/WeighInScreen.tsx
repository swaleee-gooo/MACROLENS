import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Check, Minus, Plus, TrendingDown } from 'lucide-react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { calculateMacroTargets } from '../domain/macroTargets';
import { formatWeight, kgToLbs, lbsToKg, type UnitSystem } from '../domain/units';
import { useLang } from '../i18n/LanguageContext';
import type { MacroTargets, UserProfile } from '../domain/types';
import { Card, Eyebrow, Num, PrimaryButton } from '../ui/primitives';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  profile: UserProfile | null;
  userId: string;
  /** Display unit system; the saved/synced weigh-in stays in kg. */
  unitSystem: UnitSystem;
  onBack: () => void;
  onSave: (profile: UserProfile) => void;
};

const emptyTargets: MacroTargets = {
  calorieTarget: 0,
  proteinTargetG: 0,
  carbsTargetG: 0,
  fatTargetG: 0,
  fiberTargetG: 0,
  calorieOverride: null,
  proteinOverrideG: null,
};

const STR = {
  en: {
    back: 'Back',
    addWeighIn: 'Add weigh-in',
    addWeighInSubtitle: 'Keep your goal progress up to date.',
    weightOfDay: 'Weight today',
    targetWeight: (kg: string) => `Current target: ${kg}`,
    targetNotSet: 'Current target: not set',
    trend30: '30-day trend',
    save: 'Save',
  },
  fr: {
    back: 'Retour',
    addWeighIn: 'Ajouter une pesée',
    addWeighInSubtitle: 'Gardez votre progression à jour.',
    weightOfDay: 'Poids du jour',
    targetWeight: (kg: string) => `Cible actuelle : ${kg}`,
    targetNotSet: 'Cible actuelle : non définie',
    trend30: 'Tendance · 30 jours',
    save: 'Enregistrer',
  },
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function TrendChart({ startKg, endKg, unitSystem }: { startKg: number; endKg: number; unitSystem: UnitSystem }) {
  // Illustrative 8-point downward trend from startKg to endKg
  const points: [number, number][] = [
    [6, 12],
    [46, 22],
    [86, 18],
    [126, 32],
    [166, 40],
    [206, 52],
    [246, 60],
    [274, 68],
  ];
  const polyPts = points.map(([x, y]) => `${x},${y}`).join(' ');
  const minKg = Math.min(startKg, endKg);
  const maxKg = Math.max(startKg, endKg) + 0.5;

  return (
    <View>
      <Svg viewBox="0 0 280 90" width="100%" height={90}>
        <Polyline
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyPts}
        />
        {points.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={2.6} fill={colors.paper} stroke={colors.accent} strokeWidth={2} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Num style={{ color: colors.muted, fontSize: typography.tiny }}>{formatWeight(maxKg, unitSystem)}</Num>
        <Num style={{ color: colors.muted, fontSize: typography.tiny }}>{formatWeight(minKg, unitSystem)}</Num>
      </View>
    </View>
  );
}

export function WeighInScreen({ profile, userId, unitSystem, onBack, onSave }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isImperial = unitSystem === 'imperial';
  const initialWeightKg = profile?.weightKg ?? 70;
  // The stepper works in tenths of the DISPLAY unit so each tap moves 0.1 lbs
  // (or 0.1 kg) and decimal entries like 164.5 lbs are representable. The
  // saved/synced value is converted back to kg without rounding.
  // Stepper bounds mirror the 35–250 kg save range: 77.2 lbs ≈ 35.0 kg, 551.1 lbs ≈ 249.97 kg.
  const minDisplayTenths = isImperial ? 772 : 350;
  const maxDisplayTenths = isImperial ? 5511 : 2500;
  const [displayTenths, setDisplayTenths] = useState(() =>
    Math.min(maxDisplayTenths, Math.max(minDisplayTenths, Math.round((isImperial ? kgToLbs(initialWeightKg) : initialWeightKg) * 10))),
  );
  const displayWeight = displayTenths / 10;
  const weightKg = isImperial ? lbsToKg(displayWeight) : displayWeight;
  const canSave = weightKg >= 35 && weightKg <= 250;

  const nextProfile = useMemo(() => {
    if (!canSave) {
      return null;
    }

    const baseProfile: UserProfile = {
      id: userId,
      goal: profile?.goal ?? 'maintain',
      ageRange: profile?.ageRange ?? '25-34',
      sex: profile?.sex ?? 'prefer_not_to_say',
      heightCm: profile?.heightCm ?? 175,
      weightKg,
      activityLevel: profile?.activityLevel ?? 'moderate',
      targetWeightKg: profile?.targetWeightKg ?? null,
      targets: profile?.targets ?? emptyTargets,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...baseProfile,
      targets: calculateMacroTargets(baseProfile),
    };
  }, [canSave, profile, userId, weightKg]);

  function save() {
    if (nextProfile) {
      onSave(nextProfile);
    }
  }

  const todayLabel = new Date().toISOString().slice(0, 10);
  const targetKg = profile?.targetWeightKg ?? null;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={onBack}
          style={{ alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm }}
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.2} />
          <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{t.back}</Text>
        </Pressable>

        {/* Weight stepper card */}
        <Card style={{ gap: spacing.sm, padding: spacing.xl, alignItems: 'center' }}>
          <Eyebrow>{t.weightOfDay}</Eyebrow>
          <View
            style={{
              alignItems: 'center',
              borderColor: colors.line2,
              borderRadius: radius.md,
              borderWidth: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: spacing.md,
              padding: 6,
              width: '100%',
            }}
          >
            <Pressable
              onPress={() => setDisplayTenths((w) => Math.max(minDisplayTenths, w - 1))}
              style={{
                alignItems: 'center',
                backgroundColor: colors.paper2,
                borderRadius: radius.sm,
                height: 38,
                justifyContent: 'center',
                width: 38,
              }}
            >
              <Minus color={colors.ink} size={18} strokeWidth={2} />
            </Pressable>
            <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 4 }}>
              <Num style={{ fontSize: 34, fontWeight: '600' }}>{displayWeight.toFixed(1)}</Num>
              <Text style={{ color: colors.muted, fontSize: typography.small }}>{isImperial ? 'lbs' : 'kg'}</Text>
            </View>
            <Pressable
              onPress={() => setDisplayTenths((w) => Math.min(maxDisplayTenths, w + 1))}
              style={{
                alignItems: 'center',
                backgroundColor: colors.paper2,
                borderRadius: radius.sm,
                height: 38,
                justifyContent: 'center',
                width: 38,
              }}
            >
              <Plus color={colors.ink} size={18} strokeWidth={2} />
            </Pressable>
          </View>
          <Num style={{ color: colors.muted, fontSize: typography.tiny }}>{todayLabel}</Num>
        </Card>

        {/* 30-day trend card */}
        <Card style={{ padding: spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Eyebrow>{t.trend30}</Eyebrow>
            {targetKg !== null && (
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
                <TrendingDown color={colors.accentInk} size={15} strokeWidth={2} />
                <Num style={{ color: colors.accentInk, fontSize: typography.tiny, fontWeight: '600' }}>
                  {formatWeight(weightKg - targetKg, unitSystem)}
                </Num>
              </View>
            )}
          </View>
          <TrendChart startKg={weightKg} endKg={targetKg ?? weightKg - 1.2} unitSystem={unitSystem} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Num style={{ color: colors.muted, fontSize: typography.tiny }}>{formatWeight(weightKg, unitSystem)}</Num>
            <Num style={{ color: colors.muted, fontSize: typography.tiny }}>
              {targetKg !== null ? t.targetWeight(formatWeight(targetKg, unitSystem)) : t.targetNotSet}
            </Num>
          </View>
        </Card>
      </ScrollView>

      <View style={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        <PrimaryButton
          label={t.save}
          onPress={save}
          variant="dark"
          disabled={!canSave}
          icon={<Check color="#FFFFFF" size={18} strokeWidth={2.4} />}
        />
      </View>
    </View>
  );
}
