import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Camera as CameraIcon, Check, ChevronRight, Dumbbell, EyeOff, Flame, Heart, Image as ImageIcon, Mail, Ruler, Scale, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, Utensils } from 'lucide-react-native';
import { useCameraPermissions } from 'expo-camera';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { buildPersonalizedPromise, type TrackingFriction } from '../domain/onboardingConversion';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid, type OnboardingProfileDraft } from '../domain/onboardingProfile';
import type { UserGoal, UserProfile } from '../domain/types';
import { colors, radius, spacing, typography } from '../ui/theme';

type Props = {
  userId: string;
  onComplete: (profile: UserProfile) => void;
  onStepCompleted?: (step: OnboardingStep) => void;
  onOnboardingCompleted?: (payload: { goal: UserGoal; friction: TrackingFriction }) => void;
};

type OnboardingStep =
  | 'welcome'
  | 'value'
  | 'goal'
  | 'friction'
  | 'body'
  | 'heightWeight'
  | 'targetPace'
  | 'activity'
  | 'diet'
  | 'planLoading'
  | 'plan'
  | 'auth'
  | 'notifications'
  | 'health'
  | 'camera';

type GoalOption = {
  value: UserGoal;
  label: string;
  detail: string;
  icon: typeof TrendingDown;
};

type ActivityOption = {
  value: OnboardingProfileDraft['activityLevel'];
  title: string;
  detail: string;
  icon: typeof Dumbbell;
};

type ChipOption = {
  id: string;
  label: string;
};

const steps: OnboardingStep[] = [
  'welcome',
  'value',
  'goal',
  'friction',
  'body',
  'heightWeight',
  'targetPace',
  'activity',
  'diet',
  'planLoading',
  'plan',
  'auth',
  'notifications',
  'health',
  'camera',
];

const goalOptions: GoalOption[] = [
  { value: 'lose_fat', label: 'Perdre du poids', detail: 'Atteindre un poids cible', icon: TrendingDown },
  { value: 'build_muscle', label: 'Prendre du muscle', detail: 'Plus de proteines, surplus controle', icon: Dumbbell },
  { value: 'maintain', label: 'Maintenir', detail: 'Garder tes habitudes sous controle', icon: Scale },
  { value: 'understand_eating', label: 'Comprendre', detail: 'Lire clairement ton alimentation', icon: TrendingUp },
];

const frictionOptions: { value: TrackingFriction; title: string; icon: typeof Utensils }[] = [
  { value: 'restaurant_meals', title: 'Repas restaurant', icon: Utensils },
  { value: 'hidden_calories', title: 'Calories cachees', icon: EyeOff },
  { value: 'weighing_food', title: 'Peser la nourriture', icon: Scale },
  { value: 'forgetting_meals', title: 'Oublier de logger', icon: Target },
];

const activityOptions: ActivityOption[] = [
  { value: 'low', title: 'Sedentaire', detail: 'Peu ou pas de sport', icon: Ruler },
  { value: 'moderate', title: 'Modere', detail: '3-5 jours / semaine', icon: Dumbbell },
  { value: 'high', title: 'Intense', detail: '6-7 jours / semaine', icon: Flame },
];

const dietOptions: ChipOption[] = [
  { id: 'omnivore', label: 'Omnivore' },
  { id: 'vegetarian', label: 'Vegetarien' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescetarien' },
];

const restrictionOptions: ChipOption[] = [
  { id: 'gluten', label: 'Sans gluten' },
  { id: 'lactose', label: 'Sans lactose' },
  { id: 'nuts', label: 'Noix' },
  { id: 'soy', label: 'Soja' },
  { id: 'halal', label: 'Halal' },
  { id: 'other', label: 'Autre' },
];

const paceOptions = [0.25, 0.5, 0.75, 1];

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

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

function suggestedTargetWeight(weightKg: number, goal: UserGoal): number {
  if (weightKg <= 0) {
    return 0;
  }

  if (goal === 'lose_fat') {
    return Math.max(35, Math.round((weightKg * 0.9) * 10) / 10);
  }

  if (goal === 'build_muscle') {
    return Math.min(250, Math.round((weightKg * 1.05) * 10) / 10);
  }

  return weightKg;
}

function progressForStep(stepIndex: number): number {
  return Math.round(((stepIndex + 1) / steps.length) * 100);
}

function Header({ stepIndex, onBack }: { stepIndex: number; onBack: () => void }) {
  const progress = progressForStep(stepIndex);
  const showProgress = stepIndex > 1;

  return (
    <View style={{ gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }}>
          <Text style={{ color: colors.black, fontSize: 30, fontWeight: '500' }}>‹</Text>
        </Pressable>
        <Text style={{ color: colors.black, fontSize: 14, fontWeight: '900', letterSpacing: 0 }}>MACROLENS</Text>
        <View style={{ width: 44 }} />
      </View>
      {showProgress ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Etape {Math.max(1, stepIndex - 1)} sur 13</Text>
            <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>{progress}%</Text>
          </View>
          <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 8, overflow: 'hidden' }}>
            <View style={{ backgroundColor: colors.black, height: 8, width: `${progress}%` }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SectionTitle({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <View style={{ alignItems: centered ? 'center' : 'flex-start', gap: spacing.sm }}>
      <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', lineHeight: 40, textAlign: centered ? 'center' : 'left' }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24, textAlign: centered ? 'center' : 'left' }}>{subtitle}</Text> : null}
    </View>
  );
}

function PrimaryCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg }}>
      {children}
    </View>
  );
}

function OptionCard({
  title,
  detail,
  selected,
  icon: Icon,
  onPress,
}: {
  title: string;
  detail?: string;
  selected: boolean;
  icon: typeof TrendingDown;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.green : colors.line,
        borderRadius: radius.lg,
        borderWidth: selected ? 2 : 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 76,
        padding: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: selected ? colors.greenSoft : colors.surfaceMuted, borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 }}>
        <Icon color={selected ? colors.green : colors.black} size={24} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{title}</Text>
        {detail ? <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800' }}>{detail}</Text> : null}
      </View>
      <View style={{ alignItems: 'center', borderColor: selected ? colors.green : colors.line, borderRadius: radius.pill, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 }}>
        {selected ? <View style={{ backgroundColor: colors.green, borderRadius: radius.pill, height: 12, width: 12 }} /> : null}
      </View>
    </Pressable>
  );
}

function TileOption({
  label,
  detail,
  selected,
  icon: Icon,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  icon: typeof TrendingDown;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.green : colors.line,
        borderRadius: radius.lg,
        borderWidth: selected ? 2 : 1,
        flexBasis: '47%',
        gap: spacing.sm,
        minHeight: 128,
        padding: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: selected ? colors.greenSoft : colors.surfaceMuted, borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 }}>
        <Icon color={selected ? colors.green : colors.black} size={24} strokeWidth={2.5} />
      </View>
      <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textAlign: 'center' }}>{label}</Text>
      {detail ? <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', textAlign: 'center' }}>{detail}</Text> : null}
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  unit?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.lg }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={{ color: colors.black, flex: 1, fontSize: typography.heading, fontWeight: '900', minHeight: 64, minWidth: 0 }}
        />
        {unit ? <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '900' }}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function SegmentedControl<T extends string>({
  values,
  selected,
  onSelect,
  labels,
}: {
  values: T[];
  selected: T;
  onSelect: (value: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' }}>
      {values.map((value) => {
        const isSelected = selected === value;
        return (
          <Pressable key={value} onPress={() => onSelect(value)} style={{ alignItems: 'center', backgroundColor: isSelected ? colors.green : colors.surface, flex: 1, minHeight: 48, justifyContent: 'center' }}>
            <Text style={{ color: isSelected ? 'white' : colors.muted, fontSize: typography.small, fontWeight: '900' }}>{labels[value]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: selected ? colors.greenSoft : colors.surface,
        borderColor: selected ? colors.green : colors.line,
        borderRadius: radius.pill,
        borderWidth: 1,
        minHeight: 38,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: selected ? colors.green : colors.black, fontSize: typography.small, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ label, detail, checked }: { label: string; detail?: string; checked: boolean }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
      <View style={{ alignItems: 'center', backgroundColor: checked ? colors.greenSoft : colors.surfaceMuted, borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 }}>
        {checked ? <Check color={colors.green} size={17} strokeWidth={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>{label}</Text>
        {detail ? <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', marginTop: spacing.xs }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function FoodMockup() {
  return (
    <View style={{ alignSelf: 'center', marginTop: spacing.lg, width: '92%' }}>
      <View style={{ backgroundColor: '#151515', borderRadius: 26, overflow: 'hidden', padding: spacing.md }}>
        <View style={{ aspectRatio: 1.08, backgroundColor: '#F2EFE8', borderRadius: 22, overflow: 'hidden', padding: spacing.md }}>
          <View style={{ backgroundColor: '#E7B56E', borderRadius: radius.pill, height: 98, left: '36%', position: 'absolute', top: '24%', width: 98 }} />
          <View style={{ backgroundColor: '#F7F1D8', borderRadius: radius.pill, height: 110, left: '8%', position: 'absolute', top: '12%', width: 110 }} />
          <View style={{ backgroundColor: colors.greenSoft, borderRadius: radius.pill, height: 116, position: 'absolute', right: '10%', top: '36%', width: 116 }} />
          <View style={{ backgroundColor: '#382215', borderRadius: radius.pill, bottom: '10%', height: 74, left: '26%', position: 'absolute', width: 138 }} />
        </View>
      </View>
      <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, bottom: -10, padding: spacing.md, position: 'absolute', right: -4, width: 124 }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900' }}>510 kcal</Text>
        <Text style={{ color: colors.green, fontSize: typography.tiny, fontWeight: '900', marginTop: spacing.xs }}>38g protein</Text>
        <Text style={{ color: colors.blue, fontSize: typography.tiny, fontWeight: '900' }}>46g carbs</Text>
        <Text style={{ color: colors.amber, fontSize: typography.tiny, fontWeight: '900' }}>16g fat</Text>
      </View>
    </View>
  );
}

export function OnboardingScreen({ userId, onComplete, onStepCompleted, onOnboardingCompleted }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingProfileDraft>(emptyDraft('lose_fat'));
  const [friction, setFriction] = useState<TrackingFriction>('restaurant_meals');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [diet, setDiet] = useState('omnivore');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [loadingProgress] = useState(() => new Animated.Value(0));
  const step = steps[stepIndex];
  const hydratedDraft = useMemo(
    () => ({
      ...draft,
      age: parseNumber(age),
      heightCm: parseNumber(height),
      weightKg: parseNumber(weight),
      targetWeightKg: targetWeight.length > 0 ? parseNumber(targetWeight) : null,
    }),
    [age, draft, height, targetWeight, weight],
  );
  const preview = isOnboardingDraftValid(hydratedDraft) ? buildUserProfileFromOnboarding(hydratedDraft, userId) : null;
  const personalizedPromise = preview
    ? buildPersonalizedPromise({
        goal: hydratedDraft.goal,
        friction,
        proteinTargetG: preview.targets.proteinTargetG,
      })
    : null;

  useEffect(() => {
    if (step !== 'planLoading') {
      loadingProgress.setValue(0);
      return;
    }

    Animated.timing(loadingProgress, {
      duration: 1350,
      toValue: 1,
      useNativeDriver: false,
    }).start();
    const timeout = setTimeout(() => setStepIndex((current) => Math.min(current + 1, steps.length - 1)), 1450);

    return () => clearTimeout(timeout);
  }, [loadingProgress, step]);

  useEffect(() => {
    if (step !== 'targetPace' || targetWeight.length > 0) {
      return;
    }

    const suggestion = suggestedTargetWeight(parseNumber(weight), draft.goal);
    if (suggestion > 0) {
      setTargetWeight(formatNumber(suggestion));
    }
  }, [draft.goal, step, targetWeight.length, weight]);

  const canContinue =
    step === 'body'
      ? hydratedDraft.age >= 18 && hydratedDraft.age <= 85
      : step === 'heightWeight'
        ? hydratedDraft.heightCm >= 120 && hydratedDraft.heightCm <= 230 && hydratedDraft.weightKg >= 35 && hydratedDraft.weightKg <= 250
        : step === 'targetPace'
          ? hydratedDraft.targetWeightKg !== null && hydratedDraft.targetWeightKg >= 35 && hydratedDraft.targetWeightKg <= 250
          : step === 'plan'
            ? preview !== null
            : step === 'auth'
              ? email.length === 0 || (email.includes('@') && password.length >= 6)
              : true;

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }

  function toggleRestriction(id: string) {
    setRestrictions((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function continueFlow() {
    if (!canContinue || step === 'planLoading') {
      return;
    }

    onStepCompleted?.(step);

    if (step === 'camera') {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      onOnboardingCompleted?.({ goal: hydratedDraft.goal, friction });
      onComplete(buildUserProfileFromOnboarding(hydratedDraft, userId));
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  const loadingWidth = loadingProgress.interpolate({ inputRange: [0, 1], outputRange: ['18%', '92%'] });
  const primaryLabel =
    step === 'welcome'
      ? 'Commencer'
      : step === 'value'
        ? 'Voir mon plan'
        : step === 'plan'
          ? 'Continuer'
          : step === 'auth'
            ? 'Creer mon compte'
            : step === 'notifications'
              ? 'Activer les rappels'
              : step === 'health'
                ? 'Connecter plus tard'
                : step === 'camera'
                  ? 'Autoriser la camera'
                  : 'Suivant';

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, height: '100%', overflow: 'hidden' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xxl, paddingBottom: 126 }}>
        <Header stepIndex={stepIndex} onBack={goBack} />

        {step === 'welcome' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl, paddingTop: spacing.xxl }}>
            <SectionTitle centered title="Track macros from a photo" subtitle="Analyse IA, corrections rapides, suivi clair. Simple. Fast. Accurate." />
            <FoodMockup />
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
              {[0, 1, 2, 3].map((index) => (
                <View key={index} style={{ backgroundColor: index === 0 ? colors.black : colors.line, borderRadius: radius.pill, height: 6, width: index === 0 ? 22 : 6 }} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 'value' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="From photo to macros" subtitle="1. Take a photo  2. Get your macros  3. Improve and reach your goals" />
            <PrimaryCard>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <FoodMockup />
                </View>
                <View style={{ flex: 1, gap: spacing.md }}>
                  <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>{preview?.targets.calorieTarget ?? 540} kcal</Text>
                  <ToggleRow checked label="Protein" detail={`${preview?.targets.proteinTargetG ?? 40}g`} />
                  <ToggleRow checked label="Carbs" detail="55g" />
                  <ToggleRow checked label="Fat" detail="16g" />
                </View>
              </View>
            </PrimaryCard>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <PrimaryCard>
                <ToggleRow checked label="Track" />
              </PrimaryCard>
              <PrimaryCard>
                <ToggleRow checked label="Adjust" />
              </PrimaryCard>
              <PrimaryCard>
                <ToggleRow checked label="Progress" />
              </PrimaryCard>
            </View>
          </View>
        ) : null}

        {step === 'goal' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Quel est ton objectif ?" subtitle="Cela personnalise ton plan." />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' }}>
              {goalOptions.map((option) => (
                <TileOption
                  key={option.value}
                  detail={option.detail}
                  icon={option.icon}
                  label={option.label}
                  selected={draft.goal === option.value}
                  onPress={() => {
                    setTargetWeight('');
                    setDraft({ ...draft, goal: option.value });
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 'friction' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Qu'est-ce qui rend le tracking difficile ?" subtitle="Selectionne le blocage principal." />
            <View style={{ gap: spacing.md }}>
              {frictionOptions.map((option) => (
                <OptionCard key={option.value} icon={option.icon} selected={friction === option.value} title={option.title} onPress={() => setFriction(option.value)} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 'body' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Parle-nous de toi" subtitle="Ces donnees restent privees." />
            <Field label="Age" placeholder="28" unit="ans" value={age} onChangeText={setAge} />
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Sexe biologique</Text>
              <SegmentedControl
                labels={{ female: 'Femme', male: 'Homme' }}
                selected={draft.sex}
                values={['female', 'male']}
                onSelect={(sex) => setDraft({ ...draft, sex })}
              />
            </View>
          </View>
        ) : null}

        {step === 'heightWeight' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Ta taille et ton poids" subtitle="On ajuste les calories et les macros avec precision." />
            <Field label="Taille" placeholder="175" unit="cm" value={height} onChangeText={setHeight} />
            <Field label="Poids actuel" placeholder="70.0" unit="kg" value={weight} onChangeText={setWeight} />
          </View>
        ) : null}

        {step === 'targetPace' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Ton objectif et ton rythme" subtitle="Un rythme realiste rend le suivi plus durable." />
            <Field label="Poids cible" placeholder="62.0" unit="kg" value={targetWeight} onChangeText={setTargetWeight} />
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Allure hebdomadaire</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {paceOptions.map((pace) => {
                  const selected = draft.weeklyPaceKg === pace;
                  return (
                    <Pressable
                      key={pace}
                      onPress={() => setDraft({ ...draft, weeklyPaceKg: pace })}
                      style={{ backgroundColor: selected ? colors.green : colors.surface, borderColor: selected ? colors.green : colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
                    >
                      <Text style={{ color: selected ? 'white' : colors.black, fontSize: typography.small, fontWeight: '900' }}>{pace} kg / sem.</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <PrimaryCard>
              <ToggleRow checked label="Fourchette sure" detail="0,25 a 1 kg par semaine selon ton objectif." />
            </PrimaryCard>
          </View>
        ) : null}

        {step === 'activity' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Quel est ton niveau d'activite ?" subtitle="Cela affine ton besoin calorique." />
            <View style={{ gap: spacing.md }}>
              {activityOptions.map((option) => (
                <OptionCard key={option.value} detail={option.detail} icon={option.icon} selected={draft.activityLevel === option.value} title={option.title} onPress={() => setDraft({ ...draft, activityLevel: option.value })} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 'diet' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Regime et restrictions" subtitle="Cela aide a mieux comprendre tes repas." />
            <View style={{ gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Preference</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {dietOptions.map((option) => <Chip key={option.id} label={option.label} selected={diet === option.id} onPress={() => setDiet(option.id)} />)}
              </View>
            </View>
            <View style={{ gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Allergies / restrictions</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {restrictionOptions.map((option) => <Chip key={option.id} label={option.label} selected={restrictions.includes(option.id)} onPress={() => toggleRestriction(option.id)} />)}
              </View>
            </View>
          </View>
        ) : null}

        {step === 'planLoading' ? (
          <View style={{ alignItems: 'center', gap: spacing.xl, padding: spacing.xl, paddingTop: 96 }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', borderColor: colors.greenSoft, borderRadius: radius.pill, borderWidth: 14, height: 164, justifyContent: 'center', width: 164 }}>
                <Sparkles color={colors.green} size={42} strokeWidth={2.4} />
                <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900', marginTop: spacing.sm }}>72%</Text>
              </View>
            </View>
            <SectionTitle centered title="Construction de ton plan" subtitle="Objectifs calories, macros et premiers reperes arrivent." />
            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 10, overflow: 'hidden', width: '100%' }}>
              <Animated.View style={{ backgroundColor: colors.green, borderRadius: radius.pill, height: 10, width: loadingWidth }} />
            </View>
          </View>
        ) : null}

        {step === 'plan' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Ton plan personnalise" subtitle={personalizedPromise ?? 'Ton plan est pret.'} />
            <PrimaryCard>
              <View style={{ gap: spacing.lg }}>
                <View>
                  <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase' }}>Calories quotidiennes</Text>
                  <Text style={{ color: colors.green, fontSize: typography.hero, fontWeight: '900' }}>{preview?.targets.calorieTarget ?? '--'} kcal</Text>
                  <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900' }}>Cible de depart</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Chip label={`${preview?.targets.proteinTargetG ?? '--'}g Protein`} selected onPress={() => undefined} />
                  <Chip label={`${preview?.targets.carbsTargetG ?? '--'}g Carbs`} selected onPress={() => undefined} />
                  <Chip label={`${preview?.targets.fatTargetG ?? '--'}g Fat`} selected onPress={() => undefined} />
                </View>
                <ToggleRow checked label="Plan haute confiance" detail="Base sur tes reponses, ton poids et ton objectif." />
              </View>
            </PrimaryCard>
          </View>
        ) : null}

        {step === 'auth' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Cree ton compte" subtitle="Sauvegarde tes progres et retrouve-les sur tous tes appareils." />
            <View style={{ gap: spacing.md }}>
              <OptionCard icon={Sparkles} selected={false} title="Continuer avec Apple" onPress={continueFlow} />
              <OptionCard icon={Target} selected={false} title="Continuer avec Google" onPress={continueFlow} />
              <PrimaryCard>
                <View style={{ gap: spacing.md }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <Mail color={colors.black} size={18} strokeWidth={2.4} />
                    <Text style={{ color: colors.black, fontSize: typography.body, fontWeight: '900' }}>Continuer avec Email</Text>
                  </View>
                  <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} style={{ borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.black, minHeight: 46, paddingHorizontal: spacing.md }} />
                  <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mot de passe" placeholderTextColor={colors.muted} style={{ borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, color: colors.black, minHeight: 46, paddingHorizontal: spacing.md }} />
                </View>
              </PrimaryCard>
              <Text style={{ color: colors.muted, fontSize: typography.tiny, fontWeight: '800', lineHeight: 18, textAlign: 'center' }}>Tes donnees restent privees. MacroLens ne revend pas tes informations.</Text>
            </View>
          </View>
        ) : null}

        {step === 'notifications' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Reste sur la bonne trajectoire" subtitle="Des rappels discrets pour ne pas oublier un repas." />
            <PrimaryCard>
              <View style={{ gap: spacing.md }}>
                <ToggleRow checked label="Time to log your lunch" detail="Let's keep your streak going." />
                <ToggleRow checked label="Rappel diner" detail="Choisis plus tard les heures exactes." />
              </View>
            </PrimaryCard>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, textAlign: 'center' }}>Tu pourras changer cela dans les reglages.</Text>
          </View>
        ) : null}

        {step === 'health' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="Synchronisation sante" subtitle="Plus tard, tu pourras connecter pas, poids et activite." />
            <PrimaryCard>
              <View style={{ gap: spacing.md }}>
                <ToggleRow checked label="Pas" />
                <ToggleRow checked label="Poids" />
                <ToggleRow checked label="Activite" />
              </View>
            </PrimaryCard>
            <View style={{ alignItems: 'center', backgroundColor: colors.black, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 52 }}>
              <Heart color="#FF5B6E" fill="#FF5B6E" size={18} />
              <Text style={{ color: 'white', fontSize: typography.body, fontWeight: '900' }}>Compatible Apple Health</Text>
            </View>
          </View>
        ) : null}

        {step === 'camera' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle centered title="On a besoin de la camera" subtitle="Pour scanner repas, codes-barres et etiquettes dans l'app." />
            <View style={{ alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.lg, height: 132, justifyContent: 'center' }}>
              <CameraIcon color={colors.green} size={64} strokeWidth={2.2} />
            </View>
            <View style={{ gap: spacing.sm }}>
              <ToggleRow checked label="Scan repas instantane" />
              <ToggleRow checked label="Codes-barres et etiquettes" />
              <ToggleRow checked label="Photos privees et securisees" />
            </View>
            {cameraPermission?.granted ? <ToggleRow checked label="Camera deja autorisee" /> : null}
          </View>
        ) : null}
      </ScrollView>

      {step !== 'planLoading' ? (
        <StickyFooterButton
          label={primaryLabel}
          onPress={continueFlow}
          disabled={!canContinue}
          icon={step === 'camera' ? <CameraIcon color="white" size={22} strokeWidth={2.6} /> : <ChevronRight color="white" size={24} strokeWidth={2.8} />}
        />
      ) : null}
    </View>
  );
}
