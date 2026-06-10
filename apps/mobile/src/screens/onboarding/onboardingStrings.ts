/**
 * Copy for the 12-step onboarding funnel (W3). Standard `{ en, fr }` STR
 * pattern — the app is locked to English, French is kept for parity with the
 * rest of the codebase.
 *
 * Copy guards apply: never promise exactness (see noAccuracyClaimCopyGuard),
 * speak in proof / trust / range vocabulary instead.
 */
import type { ActivityOptionKey, DietOptionKey, ObstacleOptionKey, PaceOptionKey, SourceOptionKey } from './onboardingFunnel';
import type { UserGoal } from '../../domain/types';

export const ONBOARDING_STR = {
  en: {
    back: 'Back',
    continue: 'Continue',
    // Welcome
    welcomeEyebrow: 'Proof · Trust · Progress',
    welcomeTitle: 'See your meal.\nKnow your macros.',
    welcomeSubtitle: 'Nutrition tracking that tells you how much to trust every estimate.',
    welcomeStart: 'Get started',
    welcomeHaveAccount: 'I already have an account',
    // 01 — Source
    sourceKicker: 'Welcome',
    sourceTitle: 'Where did you hear\nabout us?',
    sourceOptions: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      friend: 'A friend or family member',
      app_store: 'App Store',
      youtube: 'YouTube',
      other: 'Other',
    } satisfies Record<SourceOptionKey, string>,
    // 02 — Goal
    goalKicker: 'Goal',
    goalTitle: 'What is your goal?',
    goalSubtitle: 'This sets your calorie targets and your margin.',
    goalOptions: {
      lose_fat: { label: 'Lose fat', detail: 'A controlled deficit, no crash dieting' },
      build_muscle: { label: 'Build muscle', detail: 'A light surplus, protein first' },
      maintain: { label: 'Maintain my weight', detail: 'Balance and consistency' },
      understand_eating: { label: 'Understand what I eat', detail: 'No pressure, just clarity' },
    } satisfies Record<UserGoal, { label: string; detail: string }>,
    // 03 — Sex
    sexKicker: 'Profile',
    sexTitle: 'You are…?',
    sexSubtitle: 'Used to estimate your resting metabolism.',
    sexFemale: 'Female',
    sexMale: 'Male',
    // 04 — Body
    bodyKicker: 'Profile',
    bodyTitle: 'Your measurements',
    bodySubtitle: 'Age, height, and weight for a reliable calorie baseline.',
    bodyAge: 'Age',
    bodyAgePlaceholder: 'Ex: 28',
    bodyAgeUnit: 'years',
    bodyHeight: 'Height',
    bodyHeightPlaceholder: 'Ex: 175',
    bodyHeightFtPlaceholder: 'Ex: 5',
    bodyHeightInPlaceholder: 'Ex: 9',
    bodyWeight: 'Current weight',
    bodyWeightPlaceholder: 'Ex: 70.0',
    bodyWeightPlaceholderLbs: 'Ex: 154.0',
    // 05 — Target weight
    targetKicker: 'Goal',
    targetTitle: 'Your target weight?',
    targetDecrease: 'Decrease target weight',
    targetIncrease: 'Increase target weight',
    targetRealistic: (delta: string) => `A realistic objective: ${delta}. We will suggest a sustainable pace next.`,
    targetMaintain: 'Keeping your current weight — the plan will focus on consistency.',
    // 06 — Speed
    speedKicker: 'Pace',
    speedTitle: 'How fast?',
    speedSubtitle: 'A steady pace is easier to sustain.',
    speedRecommended: 'Recommended',
    speedOptions: {
      relaxed: { label: 'Relaxed', detail: 'Maximum comfort' },
      steady: { label: 'Steady', detail: 'The best balance' },
      fast: { label: 'Fast', detail: 'More demanding day to day' },
    } satisfies Record<PaceOptionKey, { label: string; detail: string }>,
    // 07 — Activity
    activityKicker: 'Activity',
    activityTitle: 'Your activity level?',
    activitySubtitle: 'Workouts, cardio, or lifting per week.',
    activityOptions: {
      sedentary: { label: 'Sedentary', detail: 'Little or no exercise', perWeek: '0/wk' },
      light: { label: 'Light', detail: 'Regular gentle activity', perWeek: '1-3/wk' },
      moderate: { label: 'Moderate', detail: 'Consistent training', perWeek: '4-6/wk' },
      intense: { label: 'Intense', detail: 'Daily training', perWeek: '7+/wk' },
    } satisfies Record<ActivityOptionKey, { label: string; detail: string; perWeek: string }>,
    // 08 — Diet
    dietKicker: 'Food',
    dietTitle: 'Any eating\npreference?',
    dietSubtitle: 'Optional — for suggestions that fit your plate.',
    dietOptions: {
      classic: 'Classic',
      low_carb: 'Low carb',
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      mediterranean: 'Mediterranean',
      gluten_free: 'Gluten-free',
    } satisfies Record<DietOptionKey, string>,
    // 09 — Obstacles
    obstaclesKicker: 'Obstacles',
    obstaclesTitle: 'What got in your\nway before?',
    obstaclesSubtitle: 'Choose as many as you like.',
    obstacleOptions: {
      lack_of_time: 'Lack of time',
      snacking: 'Snacking',
      restaurant_meals: 'Restaurant meals',
      motivation: 'Lack of motivation',
      tedious_tracking: 'Tracking felt tedious',
      weekends: 'Weekends',
    } satisfies Record<ObstacleOptionKey, string>,
    // 10 — Compare
    compareKicker: 'Why MacroLens',
    compareTitle: 'Reach your goal\n2× faster',
    compareWithout: 'Without\nMacroLens',
    compareWith: 'With\nMacroLens',
    compareDisclaimer: 'Illustrative · based on consistent tracking',
    // 11 — Value proof
    valueProofKicker: 'Built on proof',
    valueProofTitle: 'Tracking you\ncan trust',
    valueProofNext: 'Create my plan',
    // Generating
    generatingEyebrow: 'MetaboProof',
    generatingTitle: 'Creating your plan…',
    generatingSubtitle: 'Personalizing your targets and your margin',
    generatingChecklist: ['Analyzing your profile', 'Calculating your metabolism', 'Optimizing your macros', 'Calibrating MetaboProof'],
    // 12 — Plan
    planKicker: 'Your plan',
    planTitle: 'Your plan is ready',
    planSubtitle: 'Built from your goal, your body, and your activity.',
    planCaloriesPerDay: 'Calories / day',
    planStartingTarget: 'Starting target — tune it after your first logs',
    planProtein: 'Protein',
    planCarbs: 'Carbs',
    planFat: 'Fat',
    planMetaboProof: 'With MetaboProof, every meal shows its trust level and its range.',
    // Perms
    permsEyebrow: 'Almost done',
    permsTitle: 'Turn on your reminders',
    permsSubtitle: 'So you never break your streak. Change anytime in Settings.',
    permsReminders: 'Meal reminders',
    permsCamera: 'Camera access',
    permsHealth: 'Health sync',
  },
  fr: {
    back: 'Retour',
    continue: 'Continuer',
    // Welcome
    welcomeEyebrow: 'Preuve · Confiance · Progrès',
    welcomeTitle: 'Vois ton repas.\nConnais tes macros.',
    welcomeSubtitle: 'Le suivi nutritionnel qui te dit à quel point chaque estimation est fiable.',
    welcomeStart: 'Commencer',
    welcomeHaveAccount: "J'ai déjà un compte",
    // 01 — Source
    sourceKicker: 'Bienvenue',
    sourceTitle: 'Où as-tu entendu\nparler de nous ?',
    sourceOptions: {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      friend: 'Un ami ou un proche',
      app_store: 'App Store',
      youtube: 'YouTube',
      other: 'Autre',
    } satisfies Record<SourceOptionKey, string>,
    // 02 — Goal
    goalKicker: 'Objectif',
    goalTitle: 'Quel est ton\nobjectif ?',
    goalSubtitle: 'On en déduit tes cibles caloriques et ta marge.',
    goalOptions: {
      lose_fat: { label: 'Perdre de la graisse', detail: 'Déficit maîtrisé, sans frustration' },
      build_muscle: { label: 'Prendre du muscle', detail: 'Surplus léger, protéines hautes' },
      maintain: { label: 'Maintenir mon poids', detail: 'Équilibre et régularité' },
      understand_eating: { label: 'Comprendre ce que je mange', detail: 'Zéro pression, juste de la clarté' },
    } satisfies Record<UserGoal, { label: string; detail: string }>,
    // 03 — Sex
    sexKicker: 'Profil',
    sexTitle: 'Tu es… ?',
    sexSubtitle: 'Sert au calcul de ton métabolisme de base.',
    sexFemale: 'Femme',
    sexMale: 'Homme',
    // 04 — Body
    bodyKicker: 'Profil',
    bodyTitle: 'Tes mensurations',
    bodySubtitle: 'Âge, taille et poids pour un besoin calorique fiable.',
    bodyAge: 'Âge',
    bodyAgePlaceholder: 'Ex : 28',
    bodyAgeUnit: 'ans',
    bodyHeight: 'Taille',
    bodyHeightPlaceholder: 'Ex : 175',
    bodyHeightFtPlaceholder: 'Ex : 5',
    bodyHeightInPlaceholder: 'Ex : 9',
    bodyWeight: 'Poids actuel',
    bodyWeightPlaceholder: 'Ex : 70,0',
    bodyWeightPlaceholderLbs: 'Ex : 154,0',
    // 05 — Target weight
    targetKicker: 'Objectif',
    targetTitle: 'Ton poids cible ?',
    targetDecrease: 'Diminuer le poids cible',
    targetIncrease: 'Augmenter le poids cible',
    targetRealistic: (delta: string) => `Objectif réaliste : ${delta}. On te proposera un rythme tenable à l'étape suivante.`,
    targetMaintain: 'On garde ton poids actuel — le plan misera sur la régularité.',
    // 06 — Speed
    speedKicker: 'Rythme',
    speedTitle: 'À quelle vitesse ?',
    speedSubtitle: 'Un rythme régulier tient sur la durée.',
    speedRecommended: 'Recommandé',
    speedOptions: {
      relaxed: { label: 'Tranquille', detail: 'Confort maximal' },
      steady: { label: 'Régulier', detail: 'Le meilleur équilibre' },
      fast: { label: 'Rapide', detail: 'Plus exigeant au quotidien' },
    } satisfies Record<PaceOptionKey, { label: string; detail: string }>,
    // 07 — Activity
    activityKicker: 'Dépense',
    activityTitle: "Ton niveau\nd'activité ?",
    activitySubtitle: 'Séances de sport, cardio ou musculation par semaine.',
    activityOptions: {
      sedentary: { label: 'Sédentaire', detail: "Peu ou pas d'exercice", perWeek: '0/sem' },
      light: { label: 'Léger', detail: 'Activité douce régulière', perWeek: '1-3/sem' },
      moderate: { label: 'Modéré', detail: 'Entraînement soutenu', perWeek: '4-6/sem' },
      intense: { label: 'Intense', detail: 'Sport quotidien', perWeek: '7+/sem' },
    } satisfies Record<ActivityOptionKey, { label: string; detail: string; perWeek: string }>,
    // 08 — Diet
    dietKicker: 'Alimentation',
    dietTitle: 'Une préférence\nalimentaire ?',
    dietSubtitle: 'Optionnel — pour des suggestions adaptées.',
    dietOptions: {
      classic: 'Classique',
      low_carb: 'Faible en glucides',
      vegetarian: 'Végétarien',
      vegan: 'Végan',
      mediterranean: 'Méditerranéen',
      gluten_free: 'Sans gluten',
    } satisfies Record<DietOptionKey, string>,
    // 09 — Obstacles
    obstaclesKicker: 'Obstacles',
    obstaclesTitle: "Qu'est-ce qui t'a\nbloqué avant ?",
    obstaclesSubtitle: 'Plusieurs choix possibles.',
    obstacleOptions: {
      lack_of_time: 'Manque de temps',
      snacking: 'Grignotage',
      restaurant_meals: 'Repas au restaurant',
      motivation: 'Manque de motivation',
      tedious_tracking: 'Suivi trop fastidieux',
      weekends: 'Les week-ends',
    } satisfies Record<ObstacleOptionKey, string>,
    // 10 — Compare
    compareKicker: 'Pourquoi MacroLens',
    compareTitle: 'Atteins ton objectif\n2× plus vite',
    compareWithout: 'Sans\nMacroLens',
    compareWith: 'Avec\nMacroLens',
    compareDisclaimer: 'Illustration · basée sur un suivi régulier',
    // 11 — Value proof
    valueProofKicker: 'Conçu sur la preuve',
    valueProofTitle: 'Un suivi digne\nde confiance',
    valueProofNext: 'Créer mon plan',
    // Generating
    generatingEyebrow: 'MetaboProof',
    generatingTitle: 'Création de ton plan…',
    generatingSubtitle: 'On personnalise tes cibles et ta marge',
    generatingChecklist: ['Analyse de ton profil', 'Calcul de ton métabolisme', 'Optimisation des macros', 'Calibrage MetaboProof'],
    // 12 — Plan
    planKicker: 'Ton plan',
    planTitle: 'Ton plan est prêt',
    planSubtitle: 'Dérivé de ton objectif, ton corps et ton activité.',
    planCaloriesPerDay: 'Calories / jour',
    planStartingTarget: 'Cible de départ — ajuste-la après tes premiers repas',
    planProtein: 'Protéines',
    planCarbs: 'Glucides',
    planFat: 'Lipides',
    planMetaboProof: 'Avec MetaboProof, chaque repas affiche son niveau de preuve et sa marge.',
    // Perms
    permsEyebrow: 'Presque fini',
    permsTitle: 'Active tes rappels',
    permsSubtitle: 'Pour ne jamais casser ta série. Modifiable dans les réglages.',
    permsReminders: 'Rappels de repas',
    permsCamera: 'Accès caméra',
    permsHealth: 'Synchro Santé',
  },
};
