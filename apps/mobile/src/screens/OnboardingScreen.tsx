import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, Briefcase, Calculator, Clock3, Dumbbell, EyeOff, Flame, Scale, TrendingDown, TrendingUp, Utensils } from 'lucide-react-native';
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

type OnboardingStep = 'goal' | 'friction' | 'measures' | 'activity' | 'proof';

type GoalOption = {
  value: UserGoal;
  label: string;
  icon: typeof TrendingDown;
};

const goalOptions: GoalOption[] = [
  { value: 'lose_fat', label: 'Perdre du poids', icon: TrendingDown },
  { value: 'build_muscle', label: 'Prendre du muscle', icon: Dumbbell },
  { value: 'maintain', label: 'Maintenir', icon: Scale },
  { value: 'understand_eating', label: 'Mieux comprendre mon alimentation', icon: TrendingUp },
];

const activityOptions: { value: OnboardingProfileDraft['activityLevel']; title: string; detail: string; icon: typeof Briefcase }[] = [
  { value: 'low', title: 'Sedentaire', detail: 'Bureau, peu de sport', icon: Briefcase },
  { value: 'moderate', title: 'Modere', detail: '3-5 fois/semaine', icon: Dumbbell },
  { value: 'high', title: 'Intense', detail: 'Quotidien, travail physique', icon: Flame },
];

const frictionOptions: { value: TrackingFriction; title: string; detail: string; icon: typeof Briefcase }[] = [
  { value: 'restaurant_meals', title: 'Repas au restaurant', detail: 'Portions, sauces et huiles difficiles', icon: Utensils },
  { value: 'hidden_calories', title: 'Calories cachees', detail: 'Sauces, toppings, huile de cuisson', icon: EyeOff },
  { value: 'weighing_food', title: 'Peser mes aliments', detail: 'Trop lent pour tenir tous les jours', icon: Calculator },
  { value: 'forgetting_meals', title: 'J oublie de logger', detail: 'La journee part trop vite', icon: Clock3 },
];

const stepNames: Record<number, OnboardingStep> = {
  1: 'goal',
  2: 'friction',
  3: 'measures',
  4: 'activity',
  5: 'proof',
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyDraft(goal: UserGoal): OnboardingProfileDraft {
  return {
    goal,
    age: 0,
    sex: 'male',
    heightCm: 0,
    weightKg: 0,
    activityLevel: 'moderate',
  };
}

function ProgressHeader({ step, onBack }: { step: number; onBack: () => void }) {
  const progress = Math.round((step / 5) * 100);

  return (
    <View style={{ gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={{ alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }}>
          <ArrowLeft color={colors.black} size={30} strokeWidth={2.6} />
        </Pressable>
        <Text style={{ color: colors.black, fontSize: typography.heading, fontWeight: '900' }}>MACROLENS</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Etape {step} sur 5</Text>
          <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900' }}>{progress}%</Text>
        </View>
        <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 8, overflow: 'hidden' }}>
          <View style={{ backgroundColor: colors.black, height: 8, width: `${progress}%` }} />
        </View>
      </View>
    </View>
  );
}

function GoalCard({ option, selected, onPress }: { option: GoalOption; selected: boolean; onPress: () => void }) {
  const Icon = option.icon;

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.black : colors.line,
        borderRadius: radius.md,
        borderWidth: selected ? 2 : 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 84,
        padding: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 }}>
        <Icon color={colors.black} size={28} strokeWidth={2.5} />
      </View>
      <Text style={{ color: colors.black, flex: 1, fontSize: typography.subheading, fontWeight: '900', lineHeight: 24 }}>{option.label}</Text>
      <View style={{ borderColor: selected ? colors.black : colors.line, borderRadius: radius.pill, borderWidth: 2, height: 24, width: 24 }} />
    </Pressable>
  );
}

function ActivityCard({
  title,
  detail,
  selected,
  Icon,
  onPress,
}: {
  title: string;
  detail: string;
  selected: boolean;
  Icon: typeof Briefcase;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.black : colors.line,
        borderRadius: radius.md,
        borderWidth: selected ? 2 : 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 84,
        padding: spacing.md,
      }}
    >
      <View style={{ alignItems: 'center', backgroundColor: selected ? colors.black : colors.surfaceMuted, borderRadius: radius.sm, height: 52, justifyContent: 'center', width: 52 }}>
        <Icon color={selected ? 'white' : colors.black} size={26} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.black, fontSize: typography.subheading, fontWeight: '900', lineHeight: 23 }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18, marginTop: spacing.xs }}>{detail}</Text>
      </View>
    </Pressable>
  );
}

function FormInput({ label, unit, value, onChangeText, placeholder }: { label: string; unit: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.lg }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={{ color: colors.black, flex: 1, fontSize: typography.heading, fontWeight: '900', minHeight: 64, minWidth: 0 }}
        />
        <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '900' }}>{unit}</Text>
      </View>
    </View>
  );
}

export function OnboardingScreen({ userId, onComplete, onStepCompleted, onOnboardingCompleted }: Props) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OnboardingProfileDraft>(emptyDraft('lose_fat'));
  const [friction, setFriction] = useState<TrackingFriction>('restaurant_meals');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const hydratedDraft = useMemo(
    () => ({
      ...draft,
      age: parseNumber(age),
      heightCm: parseNumber(height),
      weightKg: parseNumber(weight),
    }),
    [age, draft, height, weight],
  );
  const canContinue = step === 1 || step === 2 || step === 4 || ((step === 3 || step === 5) && isOnboardingDraftValid(hydratedDraft));
  const preview = isOnboardingDraftValid(hydratedDraft) ? buildUserProfileFromOnboarding(hydratedDraft, userId) : null;
  const personalizedPromise = preview
    ? buildPersonalizedPromise({
        goal: hydratedDraft.goal,
        friction,
        proteinTargetG: preview.targets.proteinTargetG,
      })
    : null;

  function goBack() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function continueFlow() {
    if (!canContinue) {
      return;
    }

    const currentStep = stepNames[step];
    onStepCompleted?.(currentStep);

    if (step < 5) {
      setStep(step + 1);
      return;
    }

    onOnboardingCompleted?.({ goal: hydratedDraft.goal, friction });
    onComplete(buildUserProfileFromOnboarding(hydratedDraft, userId));
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, height: '100%', overflow: 'hidden' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xxl, paddingBottom: 128 }}>
        <ProgressHeader step={step} onBack={goBack} />
        {step === 1 ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>Quel est votre objectif ?</Text>
              <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', textAlign: 'center' }}>Aidez-nous a personnaliser votre experience.</Text>
            </View>
            <View style={{ gap: spacing.lg }}>
              {goalOptions.map((option) => (
                <GoalCard key={option.value} option={option} selected={draft.goal === option.value} onPress={() => setDraft({ ...draft, goal: option.value })} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900', textAlign: 'center' }}>Qu'est-ce qui te bloque le plus ?</Text>
              <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24, textAlign: 'center' }}>
                On adapte le scan et les corrections a ton vrai quotidien.
              </Text>
            </View>
            <View style={{ gap: spacing.lg }}>
              {frictionOptions.map((option) => (
                <ActivityCard key={option.value} title={option.title} detail={option.detail} Icon={option.icon} selected={friction === option.value} onPress={() => setFriction(option.value)} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <View style={{ gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Precision requise</Text>
              <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Ces donnees permettent a l'IA d'etablir votre metabolisme de base avec plus de precision.</Text>
            </View>
            <FormInput label="Age" unit="ans" value={age} onChangeText={setAge} placeholder="Ex: 32" />
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: colors.black, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Sexe biologique</Text>
              <View style={{ borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' }}>
                {(['male', 'female'] as const).map((sex) => {
                  const selected = draft.sex === sex;
                  return (
                    <Pressable key={sex} onPress={() => setDraft({ ...draft, sex })} style={{ alignItems: 'center', backgroundColor: selected ? colors.black : colors.surface, flex: 1, padding: spacing.lg }}>
                      <Text style={{ color: selected ? 'white' : colors.muted, fontSize: typography.body, fontWeight: '900' }}>{sex === 'male' ? 'Homme' : 'Femme'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <FormInput label="Taille" unit="cm" value={height} onChangeText={setHeight} placeholder="Ex: 175" />
            <FormInput label="Poids actuel" unit="kg" value={weight} onChangeText={setWeight} placeholder="Ex: 70.5" />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <View style={{ gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Quel est votre niveau d'activite ?</Text>
              <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>Cela nous aide a calculer vos besoins energetiques quotidiens avec precision.</Text>
            </View>
            <View style={{ gap: spacing.lg }}>
              {activityOptions.map((option) => (
                <ActivityCard key={option.value} title={option.title} detail={option.detail} Icon={option.icon} selected={draft.activityLevel === option.value} onPress={() => setDraft({ ...draft, activityLevel: option.value })} />
              ))}
            </View>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <View style={{ gap: spacing.md }}>
              <Text style={{ color: colors.black, fontSize: typography.title, fontWeight: '900' }}>Ton plan MacroLens</Text>
              <Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '800', lineHeight: 24 }}>{personalizedPromise}</Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.xl }}>
              <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '900', textTransform: 'uppercase' }}>Objectifs quotidiens</Text>
              <Text style={{ color: colors.black, fontSize: typography.hero, fontWeight: '900' }}>{preview?.targets.calorieTarget ?? '--'} kcal</Text>
              <Text style={{ color: colors.green, fontSize: typography.heading, fontWeight: '900' }}>{preview?.targets.proteinTargetG ?? '--'} g proteines</Text>
              <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, gap: spacing.sm, padding: spacing.md }}>
                <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '900' }}>Analyse IA + corrections rapides + coach quotidien</Text>
                <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 18 }}>La promesse est simple: scanner vite, corriger ce que l'IA ne peut pas deviner, puis savoir quoi faire au prochain repas.</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>Les estimations nutritionnelles ne remplacent pas un avis medical.</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
      <StickyFooterButton label={step === 5 ? 'Voir mon plan' : 'Continuer'} onPress={continueFlow} disabled={!canContinue} icon={<ArrowRight color="white" size={26} strokeWidth={2.8} />} />
    </View>
  );
}
