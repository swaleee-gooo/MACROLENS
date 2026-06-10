import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Camera as CameraIcon, Check, ChevronRight, Dumbbell, EyeOff, Flame, Heart, Mail, Ruler, Scale, Sparkles, Target, TrendingDown, TrendingUp, Utensils } from 'lucide-react-native';
import { useCameraPermissions } from 'expo-camera';
import { useLang } from '../i18n/LanguageContext';
import { StickyFooterButton } from '../components/StickyFooterButton';
import { MacroPlanAsset, MealScanAsset, ScannerPermissionAsset } from '../components/BrandAssets';
import { buildPersonalizedPromise, type TrackingFriction } from '../domain/onboardingConversion';
import { buildUserProfileFromOnboarding, isOnboardingDraftValid, type OnboardingProfileDraft } from '../domain/onboardingProfile';
import { formatWeeklyPace, ftInToCm, kgToLbs, lbsToKg, type UnitSystem } from '../domain/units';
import type { UserGoal, UserProfile } from '../domain/types';
import { Card, Eyebrow, Num, PrimaryButton, Seal } from '../ui/primitives';
import { colors, fonts, radius, spacing, typography } from '../ui/theme';

const STR = {
  en: {
    // Welcome step
    welcomeEyebrow: 'Nutrition intelligence',
    welcomeTitle: 'Track macros\nfrom a photo',
    welcomeSubtitle: 'AI analysis, quick corrections,\nclear tracking. Simple. Fast. Honest.',
    // Value step
    valueEyebrow: 'How it works',
    valueTitle: 'From photo to macros',
    valueSubtitle: '1. Take a photo\n2. Get your macros\n3. Improve and reach your goals',
    valueProtein: 'Protein',
    valueCarbs: 'Carbs',
    valueFat: 'Fat',
    valueTrack: 'Track',
    valueAdjust: 'Adjust',
    valueProgress: 'Progress',
    // Goal step
    goalEyebrow: 'Step 1 — Goal',
    goalTitle: 'What is your goal?',
    goalSubtitle: 'This personalizes your plan.',
    goalLoseFatLabel: 'Lose weight',
    goalLoseFatDetail: 'Reach a target weight',
    goalBuildMuscleLabel: 'Build muscle',
    goalBuildMuscleDetail: 'More protein, controlled surplus',
    goalMaintainLabel: 'Maintain',
    goalMaintainDetail: 'Keep your habits under control',
    goalUnderstandLabel: 'Understand eating',
    goalUnderstandDetail: 'See your nutrition clearly',
    // Friction step
    frictionEyebrow: 'Step 2 — Context',
    frictionTitle: 'What makes tracking\ndifficult?',
    frictionSubtitle: 'Select the main blocker.',
    frictionRestaurant: 'Restaurant meals',
    frictionHiddenCalories: 'Hidden calories',
    frictionWeighingFood: 'Weighing food',
    frictionForgetting: 'Forgetting to log',
    // Body step
    bodyEyebrow: 'Step 3 — Profile',
    bodyTitle: 'Tell us about you',
    bodySubtitle: 'This data stays private.',
    bodyAge: 'Age',
    bodyAgePlaceholder: 'Ex: 28',
    bodyAgeUnit: 'years',
    bodySex: 'Biological sex',
    bodySexFemale: 'Female',
    bodySexMale: 'Male',
    // Height / Weight step
    heightWeightEyebrow: 'Step 4 — Measurements',
    heightWeightTitle: 'Your height and weight',
    heightWeightSubtitle: 'We adjust calories and macros\nwith conservative estimates.',
    heightLabel: 'Height',
    heightPlaceholder: 'Ex: 175',
    heightFtPlaceholder: 'Ex: 5',
    heightInPlaceholder: 'Ex: 9',
    weightLabel: 'Current weight',
    weightPlaceholder: 'Ex: 70.0',
    weightPlaceholderLbs: 'Ex: 154.0',
    // Target / Pace step
    targetPaceEyebrow: 'Step 5 — Target',
    targetPaceTitle: 'Your target and pace',
    targetPaceSubtitle: 'A realistic pace makes tracking more sustainable.',
    targetWeightLabel: 'Target weight',
    targetWeightPlaceholder: 'Ex: 62.0',
    targetWeightPlaceholderLbs: 'Ex: 137.0',
    weeklyPace: 'Weekly pace',
    safeRange: 'Safe range',
    safeRangeDetailMetric: '0.25 to 1 kg per week depending on your goal.',
    safeRangeDetailImperial: '0.5 to 2 lb per week depending on your goal.',
    // Activity step
    activityEyebrow: 'Step 6 — Activity',
    activityTitle: 'What is your\nactivity level?',
    activitySubtitle: 'This refines your calorie needs.',
    activitySedentaryTitle: 'Sedentary',
    activitySedentaryDetail: 'Little or no sport',
    activityModerateTitle: 'Moderate',
    activityModerateDetail: '3-5 days / week',
    activityIntenseTitle: 'Intense',
    activityIntenseDetail: '6-7 days / week',
    // Diet step
    dietEyebrow: 'Step 7 — Diet',
    dietTitle: 'Diet and restrictions',
    dietSubtitle: 'This helps MacroLens better\nunderstand your meals.',
    dietPreference: 'Preference',
    dietAllergies: 'Allergies / restrictions',
    dietOmnivore: 'Omnivore',
    dietVegetarian: 'Vegetarian',
    dietVegan: 'Vegan',
    dietPescatarian: 'Pescatarian',
    restrictionGluten: 'Gluten-free',
    restrictionLactose: 'Lactose-free',
    restrictionNuts: 'Nuts',
    restrictionSoy: 'Soy',
    restrictionHalal: 'Halal',
    restrictionOther: 'Other',
    // Plan loading step
    planLoadingEyebrow: 'Calculating',
    planLoadingTitle: 'Building your plan',
    planLoadingSubtitle: 'Calorie targets, macros, and first benchmarks are coming.',
    // Plan reveal step
    planEyebrow: 'Your plan',
    planTitle: 'Your personalized plan',
    planDefaultSubtitle: 'Your plan is ready.',
    planCaloriesPerDay: 'Calories / day',
    planStartingTarget: 'Starting target',
    planProtein: (g: number | string) => `${g}g Protein`,
    planCarbs: (g: number | string) => `${g}g Carbs`,
    planFat: (g: number | string) => `${g}g Fat`,
    metaboProofNote: 'Personalized starting plan — adjust it after your first logs.',
    // Auth step
    authEyebrow: 'Account',
    authTitle: 'Create your account',
    authSubtitle: 'Save your progress and find it on all your devices.',
    authApple: 'Continue with Apple',
    authGoogle: 'Continue with Google',
    authEmail: 'Continue with Email',
    authPassword: 'Password',
    authConnected: (email: string) => `Connected account: ${email}`,
    authPrivacy: 'Your data stays private. MacroLens does not resell your information.',
    authApprove: 'Approve the sign-in, then return to MacroLens.',
    authAppleUnavailable: 'Apple sign-in is unavailable.',
    authGoogleUnavailable: 'Google sign-in is unavailable.',
    authUnavailable: 'Sign-in unavailable: configure Supabase to enable accounts.',
    authCreateFailed: 'Unable to create account.',
    // Notifications step
    notificationsEyebrow: 'Reminders',
    notificationsTitle: 'Stay on track',
    notificationsSubtitle: 'Gentle reminders so you do not forget a meal.',
    notificationsLunch: 'Time to log your lunch',
    notificationsLunchDetail: "Let's keep your streak going.",
    notificationsDinner: 'Dinner reminder',
    notificationsDinnerDetail: 'Choose exact times later.',
    notificationsSettings: 'You can change this later in settings.',
    // Health step
    healthEyebrow: 'Integrations',
    healthTitle: 'Health sync',
    healthSubtitle: 'Later, you can connect steps, weight, and activity.',
    healthSteps: 'Steps',
    healthWeight: 'Weight',
    healthActivity: 'Activity',
    healthApple: 'Compatible Apple Health',
    // Camera step
    cameraEyebrow: 'Permissions',
    cameraTitle: 'Camera access',
    cameraSubtitle: 'For meal scans, barcodes, and nutrition labels in the app.',
    cameraInstant: 'Instant meal scans',
    cameraBarcodes: 'Barcodes and labels',
    cameraPrivate: 'Private and secure photos',
    cameraAlreadyAllowed: 'Camera already allowed',
    // Primary button labels
    btnGetStarted: 'Get started',
    btnSeePlan: 'See my plan',
    btnContinue: 'Continue',
    btnCreating: 'Creating...',
    btnCreateAccount: 'Create my account',
    btnEnableReminders: 'Enable reminders',
    btnConnectLater: 'Connect later',
    btnAllowCamera: 'Allow camera',
    btnNext: 'Next',
    btnSaveLocally: 'Save locally for now',
  },
  fr: {
    // Welcome step
    welcomeEyebrow: 'Intelligence nutritionnelle',
    welcomeTitle: 'Suivez vos macros\ndepuis une photo',
    welcomeSubtitle: "Analyse IA, corrections rapides,\nsuivi clair. Simple. Rapide. Honnête.",
    // Value step
    valueEyebrow: 'Comment ça fonctionne',
    valueTitle: 'De la photo aux macros',
    valueSubtitle: '1. Prenez une photo\n2. Obtenez vos macros\n3. Progressez et atteignez vos objectifs',
    valueProtein: 'Protéines',
    valueCarbs: 'Glucides',
    valueFat: 'Lipides',
    valueTrack: 'Suivre',
    valueAdjust: 'Ajuster',
    valueProgress: 'Progrès',
    // Goal step
    goalEyebrow: 'Étape 1 — Objectif',
    goalTitle: 'Quel est votre objectif ?',
    goalSubtitle: 'Cela personnalise votre plan.',
    goalLoseFatLabel: 'Perdre du poids',
    goalLoseFatDetail: 'Atteindre un poids cible',
    goalBuildMuscleLabel: 'Prendre du muscle',
    goalBuildMuscleDetail: 'Plus de protéines, surplus contrôlé',
    goalMaintainLabel: 'Maintenir',
    goalMaintainDetail: 'Garder vos habitudes sous contrôle',
    goalUnderstandLabel: 'Comprendre son alimentation',
    goalUnderstandDetail: 'Voir sa nutrition clairement',
    // Friction step
    frictionEyebrow: 'Étape 2 — Contexte',
    frictionTitle: "Qu'est-ce qui rend le suivi\ndifficile ?",
    frictionSubtitle: 'Sélectionnez le principal obstacle.',
    frictionRestaurant: 'Repas au restaurant',
    frictionHiddenCalories: 'Calories cachées',
    frictionWeighingFood: 'Peser les aliments',
    frictionForgetting: 'Oublier de noter',
    // Body step
    bodyEyebrow: 'Étape 3 — Profil',
    bodyTitle: 'Parlez-nous de vous',
    bodySubtitle: 'Ces données restent privées.',
    bodyAge: 'Âge',
    bodyAgePlaceholder: 'Ex : 28',
    bodyAgeUnit: 'ans',
    bodySex: 'Sexe biologique',
    bodySexFemale: 'Femme',
    bodySexMale: 'Homme',
    // Height / Weight step
    heightWeightEyebrow: 'Étape 4 — Mesures',
    heightWeightTitle: 'Votre taille et votre poids',
    heightWeightSubtitle: 'Nous ajustons calories et macros\navec des estimations prudentes.',
    heightLabel: 'Taille',
    heightPlaceholder: 'Ex : 175',
    heightFtPlaceholder: 'Ex : 5',
    heightInPlaceholder: 'Ex : 9',
    weightLabel: 'Poids actuel',
    weightPlaceholder: 'Ex : 70,0',
    weightPlaceholderLbs: 'Ex : 154,0',
    // Target / Pace step
    targetPaceEyebrow: 'Étape 5 — Cible',
    targetPaceTitle: 'Votre cible et votre rythme',
    targetPaceSubtitle: 'Un rythme réaliste rend le suivi plus durable.',
    targetWeightLabel: 'Poids cible',
    targetWeightPlaceholder: 'Ex : 62,0',
    targetWeightPlaceholderLbs: 'Ex : 137,0',
    weeklyPace: 'Rythme hebdomadaire',
    safeRange: 'Plage recommandée',
    safeRangeDetailMetric: '0,25 à 1 kg par semaine selon votre objectif.',
    safeRangeDetailImperial: '0,5 à 2 lb par semaine selon votre objectif.',
    // Activity step
    activityEyebrow: 'Étape 6 — Activité',
    activityTitle: "Quel est votre\nniveau d'activité ?",
    activitySubtitle: 'Cela affine vos besoins caloriques.',
    activitySedentaryTitle: 'Sédentaire',
    activitySedentaryDetail: 'Peu ou pas de sport',
    activityModerateTitle: 'Modéré',
    activityModerateDetail: '3-5 jours / semaine',
    activityIntenseTitle: 'Intensif',
    activityIntenseDetail: '6-7 jours / semaine',
    // Diet step
    dietEyebrow: 'Étape 7 — Alimentation',
    dietTitle: 'Alimentation et restrictions',
    dietSubtitle: 'Cela aide MacroLens à mieux\ncomprendre vos repas.',
    dietPreference: 'Préférence',
    dietAllergies: 'Allergies / restrictions',
    dietOmnivore: 'Omnivore',
    dietVegetarian: 'Végétarien',
    dietVegan: 'Végétalien',
    dietPescatarian: 'Pescatarien',
    restrictionGluten: 'Sans gluten',
    restrictionLactose: 'Sans lactose',
    restrictionNuts: 'Noix',
    restrictionSoy: 'Soja',
    restrictionHalal: 'Halal',
    restrictionOther: 'Autre',
    // Plan loading step
    planLoadingEyebrow: 'Calcul en cours',
    planLoadingTitle: 'Construction de votre plan',
    planLoadingSubtitle: 'Objectifs caloriques, macros et premières références arrivent.',
    // Plan reveal step
    planEyebrow: 'Votre plan',
    planTitle: 'Votre plan personnalisé',
    planDefaultSubtitle: 'Votre plan est prêt.',
    planCaloriesPerDay: 'Calories / jour',
    planStartingTarget: 'Objectif de départ',
    planProtein: (g: number | string) => `${g}g Protéines`,
    planCarbs: (g: number | string) => `${g}g Glucides`,
    planFat: (g: number | string) => `${g}g Lipides`,
    metaboProofNote: 'Plan de départ personnalisé — ajustez-le après vos premiers repas enregistrés.',
    // Auth step
    authEyebrow: 'Compte',
    authTitle: 'Créez votre compte',
    authSubtitle: 'Sauvegardez votre progression et retrouvez-la sur tous vos appareils.',
    authApple: 'Continuer avec Apple',
    authGoogle: 'Continuer avec Google',
    authEmail: 'Continuer avec e-mail',
    authPassword: 'Mot de passe',
    authConnected: (email: string) => `Compte connecté : ${email}`,
    authPrivacy: 'Vos données restent privées. MacroLens ne revend pas vos informations.',
    authApprove: 'Approuvez la connexion, puis revenez sur MacroLens.',
    authAppleUnavailable: 'La connexion Apple est indisponible.',
    authGoogleUnavailable: 'La connexion Google est indisponible.',
    authUnavailable: 'Connexion indisponible : configurez Supabase pour activer les comptes.',
    authCreateFailed: 'Impossible de créer le compte.',
    // Notifications step
    notificationsEyebrow: 'Rappels',
    notificationsTitle: 'Restez sur la bonne voie',
    notificationsSubtitle: 'Des rappels doux pour ne pas oublier un repas.',
    notificationsLunch: 'Il est temps de noter votre déjeuner',
    notificationsLunchDetail: 'Gardons votre série active.',
    notificationsDinner: 'Rappel pour le dîner',
    notificationsDinnerDetail: 'Choisissez les horaires exacts plus tard.',
    notificationsSettings: 'Vous pouvez modifier cela plus tard dans les réglages.',
    // Health step
    healthEyebrow: 'Intégrations',
    healthTitle: 'Synchronisation santé',
    healthSubtitle: 'Plus tard, vous pourrez connecter pas, poids et activité.',
    healthSteps: 'Pas',
    healthWeight: 'Poids',
    healthActivity: 'Activité',
    healthApple: 'Compatible Apple Santé',
    // Camera step
    cameraEyebrow: 'Autorisations',
    cameraTitle: 'Accès à la caméra',
    cameraSubtitle: 'Pour les scans de repas, codes-barres et étiquettes nutritionnelles.',
    cameraInstant: 'Scans de repas instantanés',
    cameraBarcodes: 'Codes-barres et étiquettes',
    cameraPrivate: 'Photos privées et sécurisées',
    cameraAlreadyAllowed: 'Caméra déjà autorisée',
    // Primary button labels
    btnGetStarted: 'Commencer',
    btnSeePlan: 'Voir mon plan',
    btnContinue: 'Continuer',
    btnCreating: 'Création...',
    btnCreateAccount: 'Créer mon compte',
    btnEnableReminders: 'Activer les rappels',
    btnConnectLater: 'Connecter plus tard',
    btnAllowCamera: 'Autoriser la caméra',
    btnNext: 'Suivant',
    btnSaveLocally: 'Sauvegarder localement',
  },
};

type Props = {
  userId: string;
  /** Display unit system; the wizard state and saved profile stay metric. */
  unitSystem: UnitSystem;
  authEmail?: string | null;
  onEmailSignUp?: (email: string, password: string) => Promise<void>;
  onOAuthSignIn?: (provider: 'apple' | 'google') => Promise<void>;
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

// Option arrays are built at render time using translated strings (see OnboardingScreen body).
// The icon-only meta is kept here for reference by the builder functions below.
const goalOptionsMeta: { value: UserGoal; icon: typeof TrendingDown }[] = [
  { value: 'lose_fat', icon: TrendingDown },
  { value: 'build_muscle', icon: Dumbbell },
  { value: 'maintain', icon: Scale },
  { value: 'understand_eating', icon: TrendingUp },
];

const frictionOptionsMeta: { value: TrackingFriction; icon: typeof Utensils }[] = [
  { value: 'restaurant_meals', icon: Utensils },
  { value: 'hidden_calories', icon: EyeOff },
  { value: 'weighing_food', icon: Scale },
  { value: 'forgetting_meals', icon: Target },
];

const activityOptionsMeta: { value: OnboardingProfileDraft['activityLevel']; icon: typeof Dumbbell }[] = [
  { value: 'low', icon: Ruler },
  { value: 'moderate', icon: Dumbbell },
  { value: 'high', icon: Flame },
];

const dietOptionIds = ['omnivore', 'vegetarian', 'vegan', 'pescatarian'] as const;
const restrictionOptionIds = ['gluten', 'lactose', 'nuts', 'soy', 'halal', 'other'] as const;

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

// ─── Clinical Trust sub-components ───────────────────────────────────────────

/** Top navigation bar + progress track. */
function Header({ stepIndex, onBack }: { stepIndex: number; onBack: () => void }) {
  const progress = progressForStep(stepIndex);
  const showProgress = stepIndex > 1;
  const canGoBack = stepIndex > 0;
  // Human-visible step number skips the two non-counted splash screens (welcome, value)
  const visibleStep = Math.max(1, stepIndex - 1);
  // Total countable steps = steps.length - 2 splash steps
  const totalVisible = steps.length - 2;

  return (
    <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
      {/* Nav row */}
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        {canGoBack ? (
          <Pressable
            accessibilityLabel="Back"
            onPress={onBack}
            style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line2, borderRadius: radius.md, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 }}
          >
            <ArrowLeft color={colors.ink2} size={18} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
          MacroLens
        </Text>

        {/* Step counter (Num style) — only when progress is visible */}
        {showProgress ? (
          <Num style={{ color: colors.muted, fontSize: 11 }}>
            {String(visibleStep).padStart(2, '0')} / {String(totalVisible).padStart(2, '0')}
          </Num>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Thin progress track */}
      {showProgress ? (
        <View style={{ backgroundColor: colors.paper3, borderRadius: radius.pill, height: 3, overflow: 'hidden' }}>
          <View style={{ backgroundColor: colors.ink, borderRadius: radius.pill, height: 3, width: `${progress}%` }} />
        </View>
      ) : null}
    </View>
  );
}

/** Big heading block with mono eyebrow above. */
function SectionTitle({
  eyebrow,
  title,
  subtitle,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <View style={{ alignItems: centered ? 'center' : 'flex-start', gap: spacing.sm }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.title,
          fontWeight: '800',
          letterSpacing: -0.6,
          lineHeight: 36,
          textAlign: centered ? 'center' : 'left',
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.body,
            lineHeight: 24,
            marginTop: 2,
            textAlign: centered ? 'center' : 'left',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Single-select option row with left accent strip on selection. */
function OptionRow({
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
        borderColor: selected ? colors.ink : colors.line2,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 68,
        overflow: 'hidden',
        padding: spacing.md,
      }}
    >
      {/* Left accent strip */}
      <View
        style={{
          backgroundColor: selected ? colors.ink : 'transparent',
          bottom: 0,
          left: 0,
          position: 'absolute',
          top: 0,
          width: 3,
        }}
      />

      {/* Icon tile */}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: selected ? colors.paper3 : colors.paper2,
          borderRadius: radius.sm,
          height: 44,
          justifyContent: 'center',
          marginLeft: 6, // offset past accent strip
          width: 44,
        }}
      >
        <Icon color={selected ? colors.ink : colors.ink2} size={22} strokeWidth={2} />
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '700' }}>{title}</Text>
        {detail ? <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>{detail}</Text> : null}
      </View>

      {/* Trailing check */}
      {selected ? (
        <Check color={colors.ink} size={18} strokeWidth={2.5} />
      ) : (
        <View style={{ borderColor: colors.line2, borderRadius: radius.pill, borderWidth: 1.5, height: 20, width: 20 }} />
      )}
    </Pressable>
  );
}

/** 2-up tile option (goal grid). */
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
        alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderColor: selected ? colors.ink : colors.line2,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexBasis: '47%',
        gap: spacing.sm,
        minHeight: 120,
        overflow: 'hidden',
        padding: spacing.md,
      }}
    >
      {/* Top accent strip on selected */}
      <View
        style={{
          backgroundColor: selected ? colors.ink : 'transparent',
          height: 3,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />

      <View
        style={{
          alignItems: 'center',
          backgroundColor: selected ? colors.paper3 : colors.paper2,
          borderRadius: radius.sm,
          height: 44,
          justifyContent: 'center',
          width: 44,
        }}
      >
        <Icon color={selected ? colors.ink : colors.ink2} size={22} strokeWidth={2} />
      </View>

      <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '700' }}>{label}</Text>
      {detail ? <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 16 }}>{detail}</Text> : null}

      {selected ? (
        <View style={{ position: 'absolute', right: spacing.md, top: spacing.md }}>
          <Check color={colors.ink} size={14} strokeWidth={2.5} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** Labeled numeric text field. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  unit?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line2,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: 'row',
          paddingHorizontal: spacing.lg,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.muted2}
          style={{ color: colors.ink, flex: 1, fontSize: typography.heading, fontWeight: '700', minHeight: 60, minWidth: 0 }}
        />
        {unit ? (
          <Num style={{ color: colors.muted, fontSize: typography.body }}>{unit}</Num>
        ) : null}
      </View>
    </View>
  );
}

/** Binary segmented control (sex selector). */
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
    <View
      style={{
        backgroundColor: colors.paper2,
        borderRadius: radius.md,
        flexDirection: 'row',
        gap: 4,
        padding: 4,
      }}
    >
      {values.map((value) => {
        const isSelected = selected === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={{
              alignItems: 'center',
              backgroundColor: isSelected ? colors.surface : 'transparent',
              borderColor: isSelected ? colors.line2 : 'transparent',
              borderRadius: radius.sm,
              borderWidth: 1,
              flex: 1,
              justifyContent: 'center',
              minHeight: 44,
            }}
          >
            <Text
              style={{
                color: isSelected ? colors.ink : colors.muted,
                fontSize: typography.small,
                fontWeight: isSelected ? '700' : '500',
              }}
            >
              {labels[value]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pill-shaped selection chip. */
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: selected ? colors.ink : colors.surface,
        borderColor: selected ? colors.ink : colors.line2,
        borderRadius: radius.pill,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 36,
        paddingHorizontal: spacing.md,
      }}
    >
      <Text
        style={{
          color: selected ? '#FFFFFF' : colors.ink2,
          fontSize: typography.small,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Check row used in notification / health / value steps. */
function ToggleRow({ label, detail, checked }: { label: string; detail?: string; checked: boolean }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: checked ? colors.accentWash : colors.paper2,
          borderColor: checked ? colors.accentLine : colors.line2,
          borderRadius: radius.pill,
          borderWidth: 1,
          height: 28,
          justifyContent: 'center',
          width: 28,
        }}
      >
        {checked ? <Check color={colors.accent} size={15} strokeWidth={2.5} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '600' }}>{label}</Text>
        {detail ? <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18, marginTop: 2 }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/** Macro chip used in the plan reveal step. */
function MacroChip({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.paper2,
        borderColor: colors.line2,
        borderRadius: radius.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
      }}
    >
      <Num style={{ color: colors.ink2, fontSize: typography.small, fontWeight: '600' }}>{label}</Num>
    </View>
  );
}

function FoodMockup({ compact = false }: { compact?: boolean }) {
  return (
    <View style={{ alignItems: 'center', alignSelf: 'center', marginTop: compact ? 0 : spacing.lg, width: '100%' }}>
      <MealScanAsset height={compact ? 118 : 206} width={compact ? 162 : 280} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function OnboardingScreen({ userId, unitSystem, authEmail, onEmailSignUp, onOAuthSignIn, onComplete, onStepCompleted, onOnboardingCompleted }: Props) {
  const { lang } = useLang();
  const t = STR[lang];
  const isImperial = unitSystem === 'imperial';
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingProfileDraft>(emptyDraft('lose_fat'));
  const [friction, setFriction] = useState<TrackingFriction>('restaurant_meals');
  const [age, setAge] = useState('');
  // Field text lives in the DISPLAY unit (cm/kg in metric, ft+in/lbs in
  // imperial); the hydrated draft below converts back to metric so the wizard
  // state and onboardingProfile.ts only ever see canonical metric values.
  const [height, setHeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [diet, setDiet] = useState('omnivore');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [loadingProgress] = useState(() => new Animated.Value(0));
  const step = steps[stepIndex];
  const hydratedDraft = useMemo(
    () => ({
      ...draft,
      age: parseNumber(age),
      // Imperial entries convert to metric without rounding (storage direction).
      heightCm: isImperial ? ftInToCm(parseNumber(heightFt), parseNumber(heightIn)) : parseNumber(height),
      weightKg: isImperial ? lbsToKg(parseNumber(weight)) : parseNumber(weight),
      targetWeightKg: targetWeight.length > 0 ? (isImperial ? lbsToKg(parseNumber(targetWeight)) : parseNumber(targetWeight)) : null,
    }),
    [age, draft, height, heightFt, heightIn, isImperial, targetWeight, weight],
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

    // The suggestion is computed in metric, then rendered in the display unit.
    const currentWeightKg = isImperial ? lbsToKg(parseNumber(weight)) : parseNumber(weight);
    const suggestionKg = suggestedTargetWeight(currentWeightKg, draft.goal);
    if (suggestionKg > 0) {
      setTargetWeight(formatNumber(isImperial ? kgToLbs(suggestionKg) : suggestionKg));
    }
  }, [draft.goal, isImperial, step, targetWeight.length, weight]);

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
              ? Boolean(authEmail) || (email.includes('@') && password.length >= 8)
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
    if (!canContinue || step === 'planLoading' || authLoading) {
      return;
    }

    onStepCompleted?.(step);

    if (step === 'auth') {
      if (authEmail) {
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
        return;
      }

      if (!onEmailSignUp) {
        setAuthStatus(t.authUnavailable);
        return;
      }

      setAuthLoading(true);
      setAuthStatus(null);
      try {
        await onEmailSignUp(email, password);
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      } catch (error) {
        setAuthStatus(error instanceof Error ? error.message : t.authCreateFailed);
      } finally {
        setAuthLoading(false);
      }
      return;
    }

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

  function continueLocally() {
    if (step !== 'auth' || authLoading) {
      return;
    }

    onStepCompleted?.(step);
    setAuthStatus(null);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  const loadingWidth = loadingProgress.interpolate({ inputRange: [0, 1], outputRange: ['18%', '92%'] });
  const primaryLabel =
    step === 'welcome'
      ? t.btnGetStarted
      : step === 'value'
        ? t.btnSeePlan
        : step === 'plan'
        ? t.btnContinue
        : step === 'auth'
          ? authLoading
            ? t.btnCreating
            : authEmail
              ? t.btnContinue
              : t.btnCreateAccount
            : step === 'notifications'
              ? t.btnEnableReminders
              : step === 'health'
                ? t.btnConnectLater
                : step === 'camera'
                  ? t.btnAllowCamera
                  : t.btnNext;

  return (
    <View style={{ backgroundColor: colors.background, flex: 1, height: '100%', overflow: 'hidden' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.xxl, paddingBottom: 126 }}>
        <Header stepIndex={stepIndex} onBack={goBack} />

        {/* ── Welcome ──────────────────────────────────────────────── */}
        {step === 'welcome' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl, paddingTop: spacing.xxl }}>
            <SectionTitle
              eyebrow={t.welcomeEyebrow}
              centered
              title={t.welcomeTitle}
              subtitle={t.welcomeSubtitle}
            />
            <FoodMockup />
            {/* Dot indicators */}
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: index === 0 ? colors.ink : colors.line2,
                    borderRadius: radius.pill,
                    height: 5,
                    width: index === 0 ? 20 : 5,
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Value prop ───────────────────────────────────────────── */}
        {step === 'value' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle
              eyebrow={t.valueEyebrow}
              centered
              title={t.valueTitle}
              subtitle={t.valueSubtitle}
            />
            <Card style={{ padding: spacing.lg }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <FoodMockup compact />
                </View>
                <View style={{ flex: 1, gap: spacing.md }}>
                  <Num style={{ fontSize: typography.heading, fontWeight: '700' }}>
                    {preview?.targets.calorieTarget ?? 540} kcal
                  </Num>
                  <ToggleRow checked label={t.valueProtein} detail={`${preview?.targets.proteinTargetG ?? 40}g`} />
                  <ToggleRow checked label={t.valueCarbs} detail="55g" />
                  <ToggleRow checked label={t.valueFat} detail="16g" />
                </View>
              </View>
            </Card>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {([t.valueTrack, t.valueAdjust, t.valueProgress] as const).map((label) => (
                <Card key={label} style={{ alignItems: 'center', flex: 1, gap: spacing.xs, padding: spacing.md }}>
                  <Check color={colors.accent} size={16} strokeWidth={2.5} />
                  <Text style={{ color: colors.ink, fontSize: typography.small, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Goal ─────────────────────────────────────────────────── */}
        {step === 'goal' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.goalEyebrow} title={t.goalTitle} subtitle={t.goalSubtitle} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' }}>
              {goalOptionsMeta.map((meta) => {
                const labels: Record<UserGoal, { label: string; detail: string }> = {
                  lose_fat: { label: t.goalLoseFatLabel, detail: t.goalLoseFatDetail },
                  build_muscle: { label: t.goalBuildMuscleLabel, detail: t.goalBuildMuscleDetail },
                  maintain: { label: t.goalMaintainLabel, detail: t.goalMaintainDetail },
                  understand_eating: { label: t.goalUnderstandLabel, detail: t.goalUnderstandDetail },
                };
                const { label, detail } = labels[meta.value];
                return (
                  <TileOption
                    key={meta.value}
                    detail={detail}
                    icon={meta.icon}
                    label={label}
                    selected={draft.goal === meta.value}
                    onPress={() => {
                      setTargetWeight('');
                      setDraft({ ...draft, goal: meta.value });
                    }}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Friction ─────────────────────────────────────────────── */}
        {step === 'friction' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.frictionEyebrow} title={t.frictionTitle} subtitle={t.frictionSubtitle} />
            <View style={{ gap: spacing.md }}>
              {frictionOptionsMeta.map((meta) => {
                const titles: Record<TrackingFriction, string> = {
                  restaurant_meals: t.frictionRestaurant,
                  hidden_calories: t.frictionHiddenCalories,
                  weighing_food: t.frictionWeighingFood,
                  forgetting_meals: t.frictionForgetting,
                };
                return (
                  <OptionRow
                    key={meta.value}
                    icon={meta.icon}
                    selected={friction === meta.value}
                    title={titles[meta.value]}
                    onPress={() => setFriction(meta.value)}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Body ─────────────────────────────────────────────────── */}
        {step === 'body' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.bodyEyebrow} title={t.bodyTitle} subtitle={t.bodySubtitle} />
            <Field label={t.bodyAge} placeholder={t.bodyAgePlaceholder} unit={t.bodyAgeUnit} value={age} onChangeText={setAge} />
            <View style={{ gap: spacing.sm }}>
              <Eyebrow>{t.bodySex}</Eyebrow>
              <SegmentedControl
                labels={{ female: t.bodySexFemale, male: t.bodySexMale }}
                selected={draft.sex}
                values={['female', 'male']}
                onSelect={(sex) => setDraft({ ...draft, sex })}
              />
            </View>
          </View>
        ) : null}

        {/* ── Height / Weight ───────────────────────────────────────── */}
        {step === 'heightWeight' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.heightWeightEyebrow} title={t.heightWeightTitle} subtitle={t.heightWeightSubtitle} />
            {isImperial ? (
              <View style={{ gap: spacing.sm }}>
                <Eyebrow>{t.heightLabel}</Eyebrow>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Field placeholder={t.heightFtPlaceholder} unit="ft" value={heightFt} onChangeText={setHeightFt} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field placeholder={t.heightInPlaceholder} unit="in" value={heightIn} onChangeText={setHeightIn} />
                  </View>
                </View>
              </View>
            ) : (
              <Field label={t.heightLabel} placeholder={t.heightPlaceholder} unit="cm" value={height} onChangeText={setHeight} />
            )}
            <Field
              label={t.weightLabel}
              placeholder={isImperial ? t.weightPlaceholderLbs : t.weightPlaceholder}
              unit={isImperial ? 'lbs' : 'kg'}
              value={weight}
              onChangeText={setWeight}
            />
          </View>
        ) : null}

        {/* ── Target / Pace ─────────────────────────────────────────── */}
        {step === 'targetPace' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.targetPaceEyebrow} title={t.targetPaceTitle} subtitle={t.targetPaceSubtitle} />
            <Field
              label={t.targetWeightLabel}
              placeholder={isImperial ? t.targetWeightPlaceholderLbs : t.targetWeightPlaceholder}
              unit={isImperial ? 'lbs' : 'kg'}
              value={targetWeight}
              onChangeText={setTargetWeight}
            />
            <View style={{ gap: spacing.sm }}>
              <Eyebrow>{t.weeklyPace}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {paceOptions.map((pace) => {
                  const selected = draft.weeklyPaceKg === pace;
                  return (
                    <Pressable
                      key={pace}
                      onPress={() => setDraft({ ...draft, weeklyPaceKg: pace })}
                      style={{
                        backgroundColor: selected ? colors.ink : colors.surface,
                        borderColor: selected ? colors.ink : colors.line2,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      }}
                    >
                      <Num style={{ color: selected ? '#FFFFFF' : colors.ink2, fontSize: typography.small }}>
                        {formatWeeklyPace(pace, unitSystem)}
                      </Num>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Card style={{ gap: spacing.sm, padding: spacing.lg }}>
              <ToggleRow checked label={t.safeRange} detail={isImperial ? t.safeRangeDetailImperial : t.safeRangeDetailMetric} />
            </Card>
          </View>
        ) : null}

        {/* ── Activity ─────────────────────────────────────────────── */}
        {step === 'activity' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.activityEyebrow} title={t.activityTitle} subtitle={t.activitySubtitle} />
            <View style={{ gap: spacing.md }}>
              {activityOptionsMeta.map((meta) => {
                const info: Record<OnboardingProfileDraft['activityLevel'], { title: string; detail: string }> = {
                  low: { title: t.activitySedentaryTitle, detail: t.activitySedentaryDetail },
                  moderate: { title: t.activityModerateTitle, detail: t.activityModerateDetail },
                  high: { title: t.activityIntenseTitle, detail: t.activityIntenseDetail },
                };
                const { title, detail } = info[meta.value];
                return (
                  <OptionRow
                    key={meta.value}
                    detail={detail}
                    icon={meta.icon}
                    selected={draft.activityLevel === meta.value}
                    title={title}
                    onPress={() => setDraft({ ...draft, activityLevel: meta.value })}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Diet ─────────────────────────────────────────────────── */}
        {step === 'diet' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.dietEyebrow} title={t.dietTitle} subtitle={t.dietSubtitle} />
            <View style={{ gap: spacing.md }}>
              <Eyebrow>{t.dietPreference}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {dietOptionIds.map((id) => {
                  const dietLabels: Record<typeof dietOptionIds[number], string> = {
                    omnivore: t.dietOmnivore,
                    vegetarian: t.dietVegetarian,
                    vegan: t.dietVegan,
                    pescatarian: t.dietPescatarian,
                  };
                  return <Chip key={id} label={dietLabels[id]} selected={diet === id} onPress={() => setDiet(id)} />;
                })}
              </View>
            </View>
            <View style={{ gap: spacing.md }}>
              <Eyebrow>{t.dietAllergies}</Eyebrow>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {restrictionOptionIds.map((id) => {
                  const restrictionLabels: Record<typeof restrictionOptionIds[number], string> = {
                    gluten: t.restrictionGluten,
                    lactose: t.restrictionLactose,
                    nuts: t.restrictionNuts,
                    soy: t.restrictionSoy,
                    halal: t.restrictionHalal,
                    other: t.restrictionOther,
                  };
                  return <Chip key={id} label={restrictionLabels[id]} selected={restrictions.includes(id)} onPress={() => toggleRestriction(id)} />;
                })}
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Plan loading ──────────────────────────────────────────── */}
        {step === 'planLoading' ? (
          <View style={{ alignItems: 'center', gap: spacing.xl, padding: spacing.xl, paddingTop: 96 }}>
            {/* Seal ring */}
            <View
              style={{
                alignItems: 'center',
                borderColor: colors.accentWash,
                borderRadius: radius.pill,
                borderWidth: 16,
                height: 160,
                justifyContent: 'center',
                width: 160,
              }}
            >
              <Seal size={48} color={colors.accent} />
              <Num style={{ fontSize: typography.heading, fontWeight: '700', marginTop: spacing.sm }}>72%</Num>
            </View>
            <SectionTitle centered eyebrow={t.planLoadingEyebrow} title={t.planLoadingTitle} subtitle={t.planLoadingSubtitle} />
            <View style={{ backgroundColor: colors.paper3, borderRadius: radius.pill, height: 4, overflow: 'hidden', width: '100%' }}>
              <Animated.View style={{ backgroundColor: colors.ink, borderRadius: radius.pill, height: 4, width: loadingWidth }} />
            </View>
          </View>
        ) : null}

        {/* ── Plan reveal ───────────────────────────────────────────── */}
        {step === 'plan' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.planEyebrow} title={t.planTitle} subtitle={personalizedPromise ?? t.planDefaultSubtitle} />
            <View style={{ alignItems: 'center' }}>
              <MacroPlanAsset height={164} width={274} />
            </View>

            {/* Big calorie card */}
            <Card style={{ gap: spacing.lg, padding: spacing.lg }}>
              <View>
                <Eyebrow>{t.planCaloriesPerDay}</Eyebrow>
                <Num style={{ fontSize: typography.hero, fontWeight: '700', letterSpacing: -1.2, marginTop: 6 }}>
                  {preview?.targets.calorieTarget ?? '--'}
                  <Text style={{ color: colors.muted, fontSize: typography.heading, fontWeight: '400' }}> kcal</Text>
                </Num>
                <Text style={{ color: colors.muted, fontSize: typography.small, marginTop: 4 }}>{t.planStartingTarget}</Text>
              </View>

              {/* Macro chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <MacroChip label={t.planProtein(preview?.targets.proteinTargetG ?? '--')} />
                <MacroChip label={t.planCarbs(preview?.targets.carbsTargetG ?? '--')} />
                <MacroChip label={t.planFat(preview?.targets.fatTargetG ?? '--')} />
              </View>

              <View style={{ backgroundColor: colors.line, height: 1 }} />

              {/* MetaboProof note */}
              <View
                style={{
                  backgroundColor: colors.accentWash,
                  borderColor: colors.accentLine,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: spacing.md,
                  padding: spacing.md,
                }}
              >
                <Seal size={18} color={colors.accentInk} />
                <View style={{ flex: 1 }}>
                  <Eyebrow color={colors.accentInk}>MetaboProof</Eyebrow>
                  <Text style={{ color: colors.accentInk, fontSize: typography.small, lineHeight: 18, marginTop: 3 }}>
                    {t.metaboProofNote}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {/* ── Auth ─────────────────────────────────────────────────── */}
        {step === 'auth' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.authEyebrow} title={t.authTitle} subtitle={t.authSubtitle} />
            <View style={{ gap: spacing.md }}>
              <OptionRow
                icon={Sparkles}
                selected={false}
                title={t.authApple}
                onPress={async () => {
                  setAuthStatus(null);
                  try {
                    await onOAuthSignIn?.('apple');
                    setAuthStatus(t.authApprove);
                  } catch (error) {
                    setAuthStatus(error instanceof Error ? error.message : t.authAppleUnavailable);
                  }
                }}
              />
              <OptionRow
                icon={Target}
                selected={false}
                title={t.authGoogle}
                onPress={async () => {
                  setAuthStatus(null);
                  try {
                    await onOAuthSignIn?.('google');
                    setAuthStatus(t.authApprove);
                  } catch (error) {
                    setAuthStatus(error instanceof Error ? error.message : t.authGoogleUnavailable);
                  }
                }}
              />
              <Card style={{ padding: spacing.lg }}>
                <View style={{ gap: spacing.md }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <Mail color={colors.ink2} size={17} strokeWidth={2} />
                    <Text style={{ color: colors.ink, fontSize: typography.body, fontWeight: '700' }}>{t.authEmail}</Text>
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={colors.muted2}
                    style={{
                      borderColor: colors.line2,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      color: colors.ink,
                      minHeight: 46,
                      paddingHorizontal: spacing.md,
                    }}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder={t.authPassword}
                    placeholderTextColor={colors.muted2}
                    style={{
                      borderColor: colors.line2,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      color: colors.ink,
                      minHeight: 46,
                      paddingHorizontal: spacing.md,
                    }}
                  />
                </View>
              </Card>

              {authEmail ? (
                <View
                  style={{
                    backgroundColor: colors.accentWash,
                    borderColor: colors.accentLine,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    padding: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.accentInk, fontSize: typography.small, fontWeight: '600', lineHeight: 18 }}>
                    {t.authConnected(authEmail)}
                  </Text>
                </View>
              ) : null}

              {authStatus ? (
                <View
                  style={{
                    backgroundColor: colors.paper2,
                    borderColor: colors.line2,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    padding: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.muted, fontSize: typography.small, lineHeight: 18 }}>{authStatus}</Text>
                </View>
              ) : null}

              <Text style={{ color: colors.muted, fontSize: typography.tiny, lineHeight: 18, textAlign: 'center' }}>
                {t.authPrivacy}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Notifications ─────────────────────────────────────────── */}
        {step === 'notifications' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.notificationsEyebrow} title={t.notificationsTitle} subtitle={t.notificationsSubtitle} />
            <Card style={{ gap: spacing.md, padding: spacing.lg }}>
              <ToggleRow checked label={t.notificationsLunch} detail={t.notificationsLunchDetail} />
              <ToggleRow checked label={t.notificationsDinner} detail={t.notificationsDinnerDetail} />
            </Card>
            <Text style={{ color: colors.muted, fontSize: typography.tiny, textAlign: 'center' }}>
              {t.notificationsSettings}
            </Text>
          </View>
        ) : null}

        {/* ── Health ───────────────────────────────────────────────── */}
        {step === 'health' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.healthEyebrow} title={t.healthTitle} subtitle={t.healthSubtitle} />
            <Card style={{ gap: spacing.md, padding: spacing.lg }}>
              <ToggleRow checked label={t.healthSteps} />
              <ToggleRow checked label={t.healthWeight} />
              <ToggleRow checked label={t.healthActivity} />
            </Card>
            {/* Apple Health pill */}
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.ink,
                borderRadius: radius.pill,
                flexDirection: 'row',
                gap: spacing.sm,
                justifyContent: 'center',
                minHeight: 52,
              }}
            >
              <Heart color="#FF5B6E" fill="#FF5B6E" size={17} />
              <Text style={{ color: '#FFFFFF', fontSize: typography.body, fontWeight: '700' }}>{t.healthApple}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Camera ───────────────────────────────────────────────── */}
        {step === 'camera' ? (
          <View style={{ gap: spacing.xl, padding: spacing.xl }}>
            <SectionTitle eyebrow={t.cameraEyebrow} title={t.cameraTitle} subtitle={t.cameraSubtitle} />
            <View style={{ alignItems: 'center' }}>
              <ScannerPermissionAsset height={178} width={244} />
            </View>
            <Card style={{ gap: spacing.md, padding: spacing.lg }}>
              <ToggleRow checked label={t.cameraInstant} />
              <ToggleRow checked label={t.cameraBarcodes} />
              <ToggleRow checked label={t.cameraPrivate} />
              {cameraPermission?.granted ? <ToggleRow checked label={t.cameraAlreadyAllowed} /> : null}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      {step !== 'planLoading' ? (
        <StickyFooterButton
          label={primaryLabel}
          onPress={continueFlow}
          disabled={!canContinue}
          icon={step === 'camera' ? <CameraIcon color="white" size={22} strokeWidth={2.6} /> : <ChevronRight color="white" size={24} strokeWidth={2.8} />}
          secondaryLabel={step === 'auth' && !authEmail ? t.btnSaveLocally : undefined}
          onSecondaryPress={step === 'auth' && !authEmail ? continueLocally : undefined}
        />
      ) : null}
    </View>
  );
}
