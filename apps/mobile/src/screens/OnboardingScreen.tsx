import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Armchair, Bell, Camera as CameraIcon, Check, ChevronRight, Dumbbell, Flame, Heart, Scale, Search, TrendingDown, TrendingUp, User } from 'lucide-react-native';
import { useCameraPermissions } from 'expo-camera';
import { useLang } from '../i18n/LanguageContext';
import { StickyFooterButton } from '../components/StickyFooterButton';
import type { AnalyticsPayload } from '../analytics/analyticsEvents';
import type { TrackingFriction } from '../domain/onboardingConversion';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid, type OnboardingProfileDraft } from '../domain/onboardingProfile';
import { formatWeeklyPace, ftInToCm, lbsToKg, type UnitSystem } from '../domain/units';
import type { UserGoal, UserProfile } from '../domain/types';
import { Card, Eyebrow, Num, PrimaryButton, Ring, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';
import { FunnelField, FunnelHeader, FunnelOption, FunnelStepper, FunnelTitle, FunnelToggleRow } from './onboarding/FunnelUi';
import {
  ACTIVITY_OPTIONS,
  clampTargetDisplayWeight,
  DIET_OPTION_KEYS,
  displayWeightFromKg,
  formatFieldNumber,
  formatSignedWeightDelta,
  frictionFromObstacles,
  FUNNEL_STEPS,
  kgFromDisplayWeight,
  OBSTACLE_OPTION_KEYS,
  PACE_OPTIONS,
  parseLocaleNumber,
  SOURCE_OPTION_KEYS,
  stepCounter,
  suggestedTargetWeightKg,
  targetStepperConfig,
  type ActivityOptionKey,
  type DietOptionKey,
  type ObstacleOptionKey,
  type OnboardingStepId,
  type SourceOptionKey,
} from './onboarding/onboardingFunnel';
import { ONBOARDING_STR } from './onboarding/onboardingStrings';

/**
 * VALUE-PROOF CARDS (step 11) — honest value statements, NOT user reviews.
 * MacroLens does not ship fabricated testimonials. When real, verifiable user
 * quotes exist, swap them in here (and only then reintroduce names/avatars/
 * stars in the value_proof layout below).
 */
const TESTIMONIALS = {
  en: [
    { title: 'Ranges, not false certainty', body: 'Every estimate shows how much to trust it.' },
    { title: 'Calibration that learns', body: 'Portion estimates improve as MacroLens learns your plates over time.' },
    { title: 'One-tap corrections', body: 'Quick fixes keep your log honest.' },
  ],
  fr: [
    { title: 'Des marges, pas de fausses certitudes', body: "Chaque estimation t'indique à quel point lui faire confiance." },
    { title: 'Une calibration qui apprend', body: 'Les portions estimées progressent à mesure que MacroLens apprend tes assiettes.' },
    { title: 'Corrections en un geste', body: 'Des ajustements rapides gardent ton journal honnête.' },
  ],
};

type Props = {
  userId: string;
  /** Display unit system; the wizard state and saved profile stay metric (S2). */
  unitSystem: UnitSystem;
  onComplete: (profile: UserProfile) => void;
  /** Welcome screen "I already have an account" — App.tsx routes to AuthScreen. */
  onSignInRequest?: () => void;
  onStepCompleted?: (step: OnboardingStepId, payload?: AnalyticsPayload) => void;
  onOnboardingCompleted?: (payload: { goal: UserGoal; friction: TrackingFriction }) => void;
};

const goalIcons: Record<UserGoal, typeof TrendingDown> = {
  lose_fat: TrendingDown,
  build_muscle: Dumbbell,
  maintain: Scale,
  understand_eating: Search,
};

const activityIcons: Record<ActivityOptionKey, typeof TrendingDown> = {
  sedentary: Armchair,
  light: TrendingUp,
  moderate: Dumbbell,
  intense: Flame,
};

const valueProofIcons = [Seal, TrendingUp, Check] as const;

function emptyDraft(goal: UserGoal): OnboardingProfileDraft {
  return {
    goal,
    age: 0,
    sex: 'female',
    heightCm: 0,
    weightKg: 0,
    targetWeightKg: null,
    weeklyPaceKg: 0.5,
    activityLevel: 'moderate',
  };
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function OnboardingScreen({ userId, unitSystem, onComplete, onSignInRequest, onStepCompleted, onOnboardingCompleted }: Props) {
  const { lang } = useLang();
  const t = ONBOARDING_STR[lang];
  const isImperial = unitSystem === 'imperial';
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingProfileDraft>(emptyDraft('lose_fat'));
  const [source, setSource] = useState<SourceOptionKey | null>(null);
  const [diet, setDiet] = useState<DietOptionKey | null>(null);
  const [obstacles, setObstacles] = useState<ObstacleOptionKey[]>([]);
  const [activityKey, setActivityKey] = useState<ActivityOptionKey>('moderate');
  const [age, setAge] = useState('');
  // Field text lives in the DISPLAY unit (cm/kg in metric, ft+in/lbs in
  // imperial); the hydrated draft below converts back to metric so the wizard
  // state and onboardingProfile.ts only ever see canonical metric values.
  const [height, setHeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  // Target-weight stepper value, also in the display unit (whole lbs / half kg).
  const [targetDisplay, setTargetDisplay] = useState<number | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  // 0..checklist.length — how many generating-checklist items are done.
  const [generatingPhase, setGeneratingPhase] = useState(0);
  const step = FUNNEL_STEPS[stepIndex];
  const checklist = t.generatingChecklist;

  const hydratedDraft = useMemo(
    () => ({
      ...draft,
      age: parseLocaleNumber(age),
      // Imperial entries convert to metric without rounding (storage direction).
      heightCm: isImperial ? ftInToCm(parseLocaleNumber(heightFt), parseLocaleNumber(heightIn)) : parseLocaleNumber(height),
      weightKg: isImperial ? lbsToKg(parseLocaleNumber(weight)) : parseLocaleNumber(weight),
      targetWeightKg: targetDisplay !== null ? kgFromDisplayWeight(targetDisplay, unitSystem) : null,
    }),
    [age, draft, height, heightFt, heightIn, isImperial, targetDisplay, unitSystem, weight],
  );
  const preview = isOnboardingDraftValid(hydratedDraft) ? buildUserProfileFromOnboarding(hydratedDraft, userId) : null;
  const cameraGranted = cameraPermission?.granted === true;

  // Seed the target stepper from the current weight + goal when the step opens.
  useEffect(() => {
    if (step !== 'target_weight' || targetDisplay !== null) {
      return;
    }

    const currentWeightKg = isImperial ? lbsToKg(parseLocaleNumber(weight)) : parseLocaleNumber(weight);
    const suggestionKg = suggestedTargetWeightKg(currentWeightKg, draft.goal);
    if (suggestionKg > 0) {
      setTargetDisplay(clampTargetDisplayWeight(displayWeightFromKg(suggestionKg, unitSystem), unitSystem));
    }
  }, [draft.goal, isImperial, step, targetDisplay, unitSystem, weight]);

  // Generating checklist: tick one item at a time, then auto-advance to the plan.
  useEffect(() => {
    if (step !== 'generating') {
      return;
    }

    setGeneratingPhase(0);
    const interval = setInterval(() => {
      setGeneratingPhase((current) => Math.min(current + 1, checklist.length));
    }, 650);

    return () => clearInterval(interval);
  }, [checklist.length, step]);

  useEffect(() => {
    if (step !== 'generating' || generatingPhase < checklist.length) {
      return;
    }

    const timeout = setTimeout(() => setStepIndex((current) => Math.min(current + 1, FUNNEL_STEPS.length - 1)), 700);
    return () => clearTimeout(timeout);
  }, [checklist.length, generatingPhase, step]);

  const canContinue =
    step === 'source'
      ? source !== null
      : step === 'body'
        ? hydratedDraft.age >= 18 && hydratedDraft.age <= 85 && hydratedDraft.heightCm >= 120 && hydratedDraft.heightCm <= 230 && hydratedDraft.weightKg >= 35 && hydratedDraft.weightKg <= 250
        : step === 'target_weight'
          ? hydratedDraft.targetWeightKg !== null && hydratedDraft.targetWeightKg >= 35 && hydratedDraft.targetWeightKg <= 250
          : step === 'plan'
            ? preview !== null
            : true;

  function advance() {
    setStepIndex((current) => Math.min(current + 1, FUNNEL_STEPS.length - 1));
  }

  function goBack() {
    if (step === 'plan') {
      // Back from the plan skips the generating animation.
      setStepIndex(FUNNEL_STEPS.indexOf('value_proof'));
      return;
    }

    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }

  function toggleObstacle(key: ObstacleOptionKey) {
    setObstacles((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  async function handleCameraToggle(next: boolean) {
    // Granted camera access cannot be revoked from inside the app, so only the
    // ON direction triggers the system prompt (existing permission logic).
    if (next && !cameraGranted) {
      await requestCameraPermission();
    }
  }

  function continueFlow() {
    if (!canContinue) {
      return;
    }

    // Answers without a domain field travel as privacy-safe option keys on the
    // step event, then are dropped (no new domain storage).
    const payload: AnalyticsPayload | undefined =
      step === 'source'
        ? { choice: source ?? 'none' }
        : step === 'diet'
          ? { choice: diet ?? 'skipped' }
          : step === 'obstacles'
            ? { choices: obstacles.length > 0 ? obstacles.join(',') : 'none' }
            : step === 'perms'
              ? { reminders: remindersEnabled, camera: cameraGranted, health: healthSyncEnabled }
              : undefined;
    onStepCompleted?.(step, payload);

    if (step === 'perms') {
      onOnboardingCompleted?.({ goal: hydratedDraft.goal, friction: frictionFromObstacles(obstacles) });
      onComplete(buildUserProfileFromOnboarding(hydratedDraft, userId));
      return;
    }

    advance();
  }

  // ── Welcome (unnumbered hero) ─────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1, padding: spacing.xl }}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <Seal size={64} color={colors.accent} />
          <View style={{ marginTop: spacing.xl }}>
            <Eyebrow style={{ textAlign: 'center' }}>{t.welcomeEyebrow}</Eyebrow>
          </View>
          <Text
            style={{
              color: colors.ink,
              fontFamily: fonts.display,
              fontSize: 30,
              fontWeight: '600',
              letterSpacing: -0.8,
              lineHeight: 33,
              marginTop: spacing.md,
              textAlign: 'center',
            }}
          >
            {t.welcomeTitle}
          </Text>
          <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 19, marginTop: spacing.md, maxWidth: 260, textAlign: 'center' }}>
            {t.welcomeSubtitle}
          </Text>
        </View>
        <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
          <PrimaryButton label={t.welcomeStart} onPress={continueFlow} />
          {onSignInRequest ? <PrimaryButton label={t.welcomeHaveAccount} variant="ghost" onPress={onSignInRequest} /> : null}
        </View>
      </View>
    );
  }

  // ── Generating (unnumbered, auto-advances) ────────────────────────────────
  if (step === 'generating') {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
        <Ring progress={generatingPhase / checklist.length} size={140} stroke={7} color={colors.accent}>
          <Seal size={40} color={colors.ink2} />
        </Ring>
        <View style={{ marginTop: spacing.xl }}>
          <Eyebrow style={{ textAlign: 'center' }}>{t.generatingEyebrow}</Eyebrow>
        </View>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: typography.heading, fontWeight: '600', letterSpacing: -0.4, marginTop: spacing.sm, textAlign: 'center' }}>
          {t.generatingTitle}
        </Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, marginBottom: spacing.xl, marginTop: spacing.sm, textAlign: 'center' }}>
          {t.generatingSubtitle}
        </Text>
        <View style={{ gap: 15, paddingHorizontal: 6, width: '100%' }}>
          {checklist.map((item, index) => {
            const status = index < generatingPhase ? 'done' : index === generatingPhase ? 'active' : 'idle';
            return (
              <View key={item} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, opacity: status === 'idle' ? 0.38 : 1 }}>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: status === 'done' ? colors.accent : status === 'active' ? colors.ink : colors.paper3,
                    borderRadius: radius.pill,
                    height: 22,
                    justifyContent: 'center',
                    width: 22,
                  }}
                >
                  {status === 'done' ? <Check color="#FFFFFF" size={12} strokeWidth={2.6} /> : null}
                  {status === 'active' ? <ActivityIndicator color="#FFFFFF" size={12} /> : null}
                </View>
                <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '500' }}>{item}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // ── Numbered funnel steps + perms (shared chrome) ─────────────────────────
  const currentWeightKg = hydratedDraft.weightKg;
  const targetDeltaDisplay = targetDisplay !== null && currentWeightKg > 0 ? targetDisplay - displayWeightFromKg(currentWeightKg, unitSystem) : null;
  const stepper = targetStepperConfig(unitSystem);
  const weightUnit = isImperial ? 'lbs' : 'kg';

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <FunnelHeader counter={stepCounter(step)} onBack={goBack} backLabel={t.back} centerEyebrow={step === 'perms' ? t.permsEyebrow : undefined} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xl, padding: spacing.xl, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* ── 01 · Source ─────────────────────────────────────────── */}
        {step === 'source' ? (
          <>
            <FunnelTitle kicker={t.sourceKicker} title={t.sourceTitle} />
            <View style={{ gap: 10 }}>
              {SOURCE_OPTION_KEYS.map((key) => (
                <FunnelOption key={key} label={t.sourceOptions[key]} selected={source === key} onPress={() => setSource(key)} />
              ))}
            </View>
          </>
        ) : null}

        {/* ── 02 · Goal ───────────────────────────────────────────── */}
        {step === 'goal' ? (
          <>
            <FunnelTitle kicker={t.goalKicker} title={t.goalTitle} subtitle={t.goalSubtitle} />
            <View style={{ gap: 11 }}>
              {(Object.keys(t.goalOptions) as UserGoal[]).map((goal) => (
                <FunnelOption
                  key={goal}
                  icon={goalIcons[goal]}
                  label={t.goalOptions[goal].label}
                  detail={t.goalOptions[goal].detail}
                  selected={draft.goal === goal}
                  onPress={() => {
                    setTargetDisplay(null);
                    setDraft({ ...draft, goal });
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* ── 03 · Sex ────────────────────────────────────────────── */}
        {step === 'sex' ? (
          <>
            <FunnelTitle kicker={t.sexKicker} title={t.sexTitle} subtitle={t.sexSubtitle} />
            <View style={{ gap: 11 }}>
              <FunnelOption icon={User} label={t.sexFemale} selected={draft.sex === 'female'} onPress={() => setDraft({ ...draft, sex: 'female' })} />
              <FunnelOption icon={User} label={t.sexMale} selected={draft.sex === 'male'} onPress={() => setDraft({ ...draft, sex: 'male' })} />
            </View>
          </>
        ) : null}

        {/* ── 04 · Body (age + height + current weight, display units) ── */}
        {step === 'body' ? (
          <>
            <FunnelTitle kicker={t.bodyKicker} title={t.bodyTitle} subtitle={t.bodySubtitle} />
            <FunnelField label={t.bodyAge} placeholder={t.bodyAgePlaceholder} unit={t.bodyAgeUnit} value={age} onChangeText={setAge} />
            {isImperial ? (
              <View style={{ gap: spacing.sm }}>
                <Eyebrow>{t.bodyHeight}</Eyebrow>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <FunnelField placeholder={t.bodyHeightFtPlaceholder} unit="ft" value={heightFt} onChangeText={setHeightFt} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FunnelField placeholder={t.bodyHeightInPlaceholder} unit="in" value={heightIn} onChangeText={setHeightIn} />
                  </View>
                </View>
              </View>
            ) : (
              <FunnelField label={t.bodyHeight} placeholder={t.bodyHeightPlaceholder} unit="cm" value={height} onChangeText={setHeight} />
            )}
            <FunnelField
              label={t.bodyWeight}
              placeholder={isImperial ? t.bodyWeightPlaceholderLbs : t.bodyWeightPlaceholder}
              unit={weightUnit}
              value={weight}
              onChangeText={setWeight}
            />
          </>
        ) : null}

        {/* ── 05 · Target weight (stepper + realistic-objective card) ── */}
        {step === 'target_weight' ? (
          <>
            <FunnelTitle kicker={t.targetKicker} title={t.targetTitle} />
            <FunnelStepper
              valueLabel={formatFieldNumber(targetDisplay ?? 0)}
              unit={weightUnit}
              decreaseLabel={t.targetDecrease}
              increaseLabel={t.targetIncrease}
              onDecrease={() => setTargetDisplay((current) => clampTargetDisplayWeight((current ?? stepper.min) - stepper.step, unitSystem))}
              onIncrease={() => setTargetDisplay((current) => clampTargetDisplayWeight((current ?? stepper.min) + stepper.step, unitSystem))}
            />
            {targetDeltaDisplay !== null ? (
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.accentWash,
                  borderColor: colors.accentLine,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 11,
                  padding: spacing.lg,
                }}
              >
                {targetDeltaDisplay <= 0 ? (
                  <TrendingDown color={colors.accentInk} size={18} strokeWidth={2} />
                ) : (
                  <TrendingUp color={colors.accentInk} size={18} strokeWidth={2} />
                )}
                <Text style={{ color: colors.accentInk, flex: 1, fontSize: typography.tiny, lineHeight: 16 }}>
                  {Math.abs(targetDeltaDisplay) < stepper.step ? t.targetMaintain : t.targetRealistic(formatSignedWeightDelta(targetDeltaDisplay, unitSystem))}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}

        {/* ── 06 · Speed (3 paces, Recommended chip on the middle) ── */}
        {step === 'speed' ? (
          <>
            <FunnelTitle kicker={t.speedKicker} title={t.speedTitle} subtitle={t.speedSubtitle} />
            <View style={{ gap: 11 }}>
              {PACE_OPTIONS.map((option) => (
                <FunnelOption
                  key={option.key}
                  label={t.speedOptions[option.key].label}
                  detail={t.speedOptions[option.key].detail}
                  badge={option.recommended ? t.speedRecommended : undefined}
                  meta={formatWeeklyPace(option.weeklyPaceKg, unitSystem)}
                  selected={draft.weeklyPaceKg === option.weeklyPaceKg}
                  onPress={() => setDraft({ ...draft, weeklyPaceKg: option.weeklyPaceKg })}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* ── 07 · Activity (4 levels → existing low/moderate/high) ── */}
        {step === 'activity' ? (
          <>
            <FunnelTitle kicker={t.activityKicker} title={t.activityTitle} subtitle={t.activitySubtitle} />
            <View style={{ gap: 11 }}>
              {ACTIVITY_OPTIONS.map((option) => (
                <FunnelOption
                  key={option.key}
                  icon={activityIcons[option.key]}
                  label={t.activityOptions[option.key].label}
                  detail={t.activityOptions[option.key].detail}
                  meta={t.activityOptions[option.key].perWeek}
                  selected={activityKey === option.key}
                  onPress={() => {
                    setActivityKey(option.key);
                    setDraft({ ...draft, activityLevel: option.level });
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* ── 08 · Diet (optional single-select, analytics key only) ── */}
        {step === 'diet' ? (
          <>
            <FunnelTitle kicker={t.dietKicker} title={t.dietTitle} subtitle={t.dietSubtitle} />
            <View style={{ gap: 10 }}>
              {DIET_OPTION_KEYS.map((key) => (
                <FunnelOption key={key} label={t.dietOptions[key]} selected={diet === key} onPress={() => setDiet((current) => (current === key ? null : key))} />
              ))}
            </View>
          </>
        ) : null}

        {/* ── 09 · Obstacles (multi-select, analytics keys only) ──── */}
        {step === 'obstacles' ? (
          <>
            <FunnelTitle kicker={t.obstaclesKicker} title={t.obstaclesTitle} subtitle={t.obstaclesSubtitle} />
            <View style={{ gap: 10 }}>
              {OBSTACLE_OPTION_KEYS.map((key) => (
                <FunnelOption key={key} multi label={t.obstacleOptions[key]} selected={obstacles.includes(key)} onPress={() => toggleObstacle(key)} />
              ))}
            </View>
          </>
        ) : null}

        {/* ── 10 · Compare (presentation-only 1× vs 2× bars) ──────── */}
        {step === 'compare' ? (
          <>
            <FunnelTitle kicker={t.compareKicker} title={t.compareTitle} />
            <Card style={{ paddingHorizontal: spacing.lg, paddingVertical: 22 }}>
              <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: spacing.lg, height: 184, justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', flex: 1, gap: 11 }}>
                  <View style={{ alignItems: 'center', backgroundColor: colors.paper3, borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 56, justifyContent: 'center', width: '100%' }}>
                    <Num style={{ color: colors.muted, fontSize: 18, fontWeight: '600' }}>1×</Num>
                  </View>
                  <Eyebrow style={{ lineHeight: 14, textAlign: 'center' }}>{t.compareWithout}</Eyebrow>
                </View>
                <View style={{ alignItems: 'center', flex: 1, gap: 11 }}>
                  <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 152, paddingTop: 14, width: '100%' }}>
                    <Num style={{ color: colors.paper, fontSize: 26, fontWeight: '600' }}>2×</Num>
                  </View>
                  <Eyebrow color={colors.ink} style={{ lineHeight: 14, textAlign: 'center' }}>
                    {t.compareWith}
                  </Eyebrow>
                </View>
              </View>
            </Card>
            <Eyebrow color={colors.muted2} style={{ textAlign: 'center' }}>
              {t.compareDisclaimer}
            </Eyebrow>
          </>
        ) : null}

        {/* ── 11 · Value proof (honest statements, see TESTIMONIALS) ── */}
        {step === 'value_proof' ? (
          <>
            <FunnelTitle kicker={t.valueProofKicker} title={t.valueProofTitle} />
            <View style={{ gap: 10 }}>
              {TESTIMONIALS[lang].map((entry, index) => {
                const Icon = valueProofIcons[index % valueProofIcons.length];
                return (
                  <Card key={entry.title} style={{ gap: spacing.sm, padding: 15 }}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
                      <View style={{ alignItems: 'center', backgroundColor: colors.ink, borderRadius: 10, height: 32, justifyContent: 'center', width: 32 }}>
                        {Icon === Seal ? <Seal size={16} color={colors.paper} /> : <Icon color={colors.paper} size={16} strokeWidth={2.2} />}
                      </View>
                      <Text style={{ color: colors.ink, flex: 1, fontSize: typography.small, fontWeight: '600' }}>{entry.title}</Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16 }}>{entry.body}</Text>
                  </Card>
                );
              })}
            </View>
          </>
        ) : null}

        {/* ── 12 · Plan reveal (real targets from the domain) ─────── */}
        {step === 'plan' ? (
          <>
            <FunnelTitle kicker={t.planKicker} title={t.planTitle} subtitle={t.planSubtitle} />
            <Card style={{ gap: spacing.md, padding: 22 }}>
              <Eyebrow>{t.planCaloriesPerDay}</Eyebrow>
              <Num style={{ fontSize: 50, fontWeight: '500', letterSpacing: -1, lineHeight: 54 }}>{preview?.targets.calorieTarget ?? '--'}</Num>
              <View
                style={{
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  backgroundColor: colors.accentWash,
                  borderColor: colors.accentLine,
                  borderRadius: 7,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 6,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                }}
              >
                <Seal size={12} color={colors.accentInk} />
                <Text style={{ color: colors.accentInk, flexShrink: 1, fontFamily: fonts.mono, fontSize: 10, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {t.planStartingTarget}
                </Text>
              </View>
            </Card>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(
                [
                  { label: t.planProtein, value: preview?.targets.proteinTargetG, dot: colors.protein },
                  { label: t.planCarbs, value: preview?.targets.carbsTargetG, dot: colors.carbs },
                  { label: t.planFat, value: preview?.targets.fatTargetG, dot: colors.fat },
                ] as const
              ).map((macro) => (
                <Card key={macro.label} style={{ flex: 1, gap: 7, padding: 14 }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                    <View style={{ backgroundColor: macro.dot, borderRadius: 2, height: 7, width: 7 }} />
                    <Eyebrow>{macro.label}</Eyebrow>
                  </View>
                  <Num style={{ fontSize: 19, fontWeight: '600' }}>
                    {macro.value ?? '--'}
                    <Text style={{ color: colors.muted, fontSize: typography.small }}>g</Text>
                  </Num>
                </Card>
              ))}
            </View>
            <View
              style={{
                alignItems: 'flex-start',
                backgroundColor: colors.accentWash,
                borderColor: colors.accentLine,
                borderRadius: radius.md,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                padding: 15,
              }}
            >
              <Seal size={20} color={colors.accent} />
              <Text style={{ color: colors.accentInk, flex: 1, fontSize: 12.5, lineHeight: 19 }}>{t.planMetaboProof}</Text>
            </View>
          </>
        ) : null}

        {/* ── Perms (reminders preference + camera permission + health preference) ── */}
        {step === 'perms' ? (
          <>
            <FunnelTitle title={t.permsTitle} subtitle={t.permsSubtitle} />
            <Card style={{ overflow: 'hidden' }}>
              <FunnelToggleRow icon={<Bell color={colors.ink2} size={16} strokeWidth={2} />} label={t.permsReminders} value={remindersEnabled} onValueChange={setRemindersEnabled} />
              <FunnelToggleRow
                icon={<CameraIcon color={colors.ink2} size={16} strokeWidth={2} />}
                label={t.permsCamera}
                value={cameraGranted}
                onValueChange={(next) => void handleCameraToggle(next)}
              />
              <FunnelToggleRow icon={<Heart color={colors.ink2} size={16} strokeWidth={2} />} label={t.permsHealth} value={healthSyncEnabled} onValueChange={setHealthSyncEnabled} isLast />
            </Card>
          </>
        ) : null}
      </ScrollView>

      <StickyFooterButton
        label={step === 'value_proof' ? t.valueProofNext : t.continue}
        onPress={continueFlow}
        disabled={!canContinue}
        icon={<ChevronRight color="white" size={22} strokeWidth={2.6} />}
      />
    </View>
  );
}
