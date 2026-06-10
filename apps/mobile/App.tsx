import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, SafeAreaView, Share, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { useShareIntent } from 'expo-share-intent';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { createAnalyticsClient, createConsoleAnalyticsSink } from './src/analytics/analyticsClient';
import { isNonFoodPhotoError } from './src/analysis/analysisErrors';
import type { AnalysisResult } from './src/analysis/analysisSchema';
import { createAnalysisService } from './src/analysis/analysisServiceFactory';
import { createRemoteAnalysisService } from './src/analysis/remoteAnalysisService';
import { createRecipeImportService } from './src/recipeImport/recipeImportServiceFactory';
import { anchorRecipeToStatedCalories, buildMealFromImportedRecipe } from './src/recipeImport/recipeNutrition';
import { parseSharedRecipeUrl } from './src/recipeImport/shareIntent';
import { detectRecipePlatform } from './src/recipeImport/recipeUrl';
import { isUnsupportedRecipeUrlError, RECIPE_EXTRACTION_FAILED_MESSAGE } from './src/recipeImport/recipeImportErrors';
import type { ImportedRecipe } from './src/recipeImport/recipeSchema';
import { appEnv } from './src/config/env';
import { captureException } from './src/observability/sentry';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { BottomTabs, type AppTab } from './src/components/BottomTabs';
import { getMealCorrectionType, type MealCorrection } from './src/domain/corrections';
import { applyMealCorrectionWithLedger } from './src/domain/correctionPersistence';
import { createManualMacroMeal } from './src/domain/manualMeal';
import { cloneMealForRelog } from './src/domain/recurringMeals';
import { calculateMealStreak } from './src/domain/streaks';
import type { MacroTargets, Meal, UserProfile } from './src/domain/types';
import { buildWeeklyReport, buildWeeklyReportFromMeals } from './src/domain/weeklyReport';
import { createEntitlementProvider } from './src/entitlements/entitlementProviderFactory';
import type { CommercialEntitlementState, PurchasePlan } from './src/entitlements/entitlementTypes';
import { createPackagedFoodLookupService, type SupabaseLookupClient } from './src/packagedFood/packagedFoodLookupService';
import { normalizeProductLookupOutcome } from './src/packagedFood/productLookupOutcome';
import { createNutritionLabelOcrService } from './src/packagedFood/labelOcrService';
import { createPackagedFoodMeal } from './src/packagedFood/packagedFoodMeal';
import type { PackagedFoodItem } from './src/packagedFood/packagedFoodSchema';
import { createMealProofMetadata } from './src/metaboproof/mealProof';
import { createEntitlementRepository, type EntitlementState } from './src/storage/entitlementRepository';
import { createAuthSessionRepository } from './src/storage/authSessionRepository';
import { createSyncedMealRepository, createSyncedMetaboProofRepository, createSyncedProfileRepository } from './src/storage/cloudSyncRepository';
import { createMealRepository } from './src/storage/mealRepository';
import { createRecipeRepository } from './src/storage/recipeRepository';
import type { ShoppingListSource } from './src/domain/shoppingList';
import { createMetaboProofRepository } from './src/storage/metaboProofRepository';
import { createOnboardingRepository, type OnboardingState } from './src/storage/onboardingRepository';
import { createProductRepository } from './src/storage/productRepository';
import { createProfileRepository } from './src/storage/profileRepository';
import { parseSupabaseAuthCallback } from './src/auth/deepLinkSession';
import { createMacroLensSupabaseClient, type MacroLensSession } from './src/supabase/client';
import { colors, radius, spacing, typography } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { BenchmarkDevScreen } from './src/screens/BenchmarkDevScreen';
import { CalibrationScreen } from './src/screens/CalibrationScreen';
import { DataPrivacyScreen } from './src/screens/DataPrivacyScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { HealthSettingsScreen } from './src/screens/HealthSettingsScreen';
import { LegalSupportScreen } from './src/screens/LegalSupportScreen';
import { ManualMealScreen } from './src/screens/ManualMealScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { PackagedProductScreen } from './src/screens/PackagedProductScreen';
import { PortionAdjustScreen } from './src/screens/PortionAdjustScreen';
import { PremiumHomeScreen } from './src/screens/PremiumHomeScreen';
import { PremiumTimelineScreen } from './src/screens/PremiumTimelineScreen';
import { PremiumUnlockedScreen } from './src/screens/PremiumUnlockedScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SaveConfirmationScreen } from './src/screens/SaveConfirmationScreen';
import { FoodSearchScreen } from './src/screens/FoodSearchScreen';
import { SavedMealsScreen } from './src/screens/SavedMealsScreen';
import { ScanErrorScreen } from './src/screens/ScanErrorScreen';
import { ScanHubScreen } from './src/screens/ScanHubScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { VerifiedRecipeScreen, type VerifiedRecipeInput } from './src/screens/VerifiedRecipeScreen';
import { RecipeImportScreen } from './src/screens/RecipeImportScreen';
import { RecipeReviewScreen } from './src/screens/RecipeReviewScreen';
import { SavedRecipesScreen } from './src/screens/SavedRecipesScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { ReminderSettingsScreen } from './src/screens/ReminderSettingsScreen';
import { SuccessProfileScreen } from './src/screens/SuccessProfileScreen';
import { SubscriptionSettingsScreen } from './src/screens/SubscriptionSettingsScreen';
import { TargetsScreen } from './src/screens/TargetsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WeighInScreen } from './src/screens/WeighInScreen';
import { WeeklyReportScreen } from './src/screens/WeeklyReportScreen';
import type { ScannerMode } from './src/scanner/scannerModes';
import { createAppMealFromMetaboProofAnalysis } from './src/metaboproof/appMealAdapter';
import { calibrateVisualItems } from './src/metaboproof/calibrationEngine';
import { analyzeMealEvidence } from './src/metaboproof/proofEngine';
import type { MealItem as MetaboProofMealItem, NutritionSource as MetaboProofNutritionSource } from './src/metaboproof/types';

type ScreenState =
  | { name: 'loading' }
  | { name: 'onboarding' }
  | { name: 'paywall' }
  | { name: 'premiumUnlocked' }
  | { name: 'app'; tab: AppTab }
  | { name: 'analyzing'; imageUri: string }
  | { name: 'result'; meal: Meal; isSaved: boolean }
  | { name: 'portionAdjust'; meal: Meal; itemId: string }
  | { name: 'saveConfirmation'; meal: Meal; streakDays: number }
  | { name: 'auth'; mode?: 'login' | 'signup' | 'reset' }
  | { name: 'editProfile' }
  | { name: 'settings' }
  | { name: 'subscriptionSettings' }
  | { name: 'reminderSettings' }
  | { name: 'healthSettings' }
  | { name: 'legalSupport' }
  | { name: 'dataPrivacy' }
  | { name: 'targets' }
  | { name: 'manualMeal' }
  | { name: 'foodSearch' }
  | { name: 'savedMeals' }
  | { name: 'weighIn' }
  | { name: 'scanHub' }
  | { name: 'verifiedRecipe' }
  | { name: 'recipeImport'; initialUrl?: string; importing: boolean; errorMessage?: string; result?: ImportedRecipe | null }
  | { name: 'recipeReview'; recipe: ImportedRecipe; origin?: 'import' | 'library' }
  | { name: 'savedRecipes' }
  | { name: 'shoppingList'; title: string; sourceItems: ShoppingListSource[]; recipe: ImportedRecipe; back: 'review-import' | 'review-library' | 'library' }
  | { name: 'calibration' }
  | { name: 'benchmarkDev' }
  | { name: 'scanError'; variant: 'non_food' | 'low_light' | 'label' }
  | { name: 'scanner'; initialMode: ScannerMode; productLookupError?: boolean; productLookupIssue?: 'not_found' | 'needs_label' }
  | { name: 'packagedProduct'; item: PackagedFoodItem; initialServingGrams: number; imageUri: string }
  | { name: 'weeklyReport' };

const queryClient = new QueryClient();
const analytics = createAnalyticsClient(createConsoleAnalyticsSink());
const localUserId = 'local-user';
const appContainerStyle = Platform.OS === 'web' ? { alignSelf: 'center' as const, flex: 1, maxWidth: 430, width: '100%' as const } : { flex: 1 };
const calibratedChickenSource: MetaboProofNutritionSource = {
  provider: 'USDA_FDC',
  externalId: '171077',
  name: 'Chicken breast cooked',
  kcalPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
};
const calibratedRiceSource: MetaboProofNutritionSource = {
  provider: 'USDA_FDC',
  externalId: '169756',
  name: 'White rice cooked',
  kcalPer100g: 130,
  proteinPer100g: 2.7,
  carbsPer100g: 28,
  fatPer100g: 0.3,
};

function storedEntitlementFromCommercial(state: CommercialEntitlementState): EntitlementState {
  return {
    isPremium: state.isPremium,
    source: state.source,
    productId: state.productId,
    expiresAt: state.expiresAt,
    updatedAt: state.updatedAt,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

function recipeImportErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'userMessage' in error) {
    const message = (error as { userMessage?: unknown }).userMessage;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return RECIPE_EXTRACTION_FAILED_MESSAGE;
}

type RevenueCatLikeError = {
  code?: unknown;
  message?: unknown;
  readableErrorCode?: unknown;
  underlyingErrorMessage?: unknown;
  userCancelled?: unknown;
  userInfo?: {
    readableErrorCode?: unknown;
  };
};

function revenueCatErrorDetails(error: unknown): { code: string | null; details: string } {
  const candidate = error && typeof error === 'object' ? (error as RevenueCatLikeError) : {};
  const details = [
    typeof candidate.code === 'string' ? `code=${candidate.code}` : null,
    typeof candidate.userInfo?.readableErrorCode === 'string' ? `readable=${candidate.userInfo.readableErrorCode}` : null,
    typeof candidate.readableErrorCode === 'string' ? `readable=${candidate.readableErrorCode}` : null,
    typeof candidate.message === 'string' ? `message=${candidate.message}` : null,
    typeof candidate.underlyingErrorMessage === 'string' ? `underlying=${candidate.underlyingErrorMessage}` : null,
  ].filter(Boolean);

  return {
    code: typeof candidate.code === 'string' ? candidate.code : null,
    details: details.length > 0 ? details.join('\n') : 'No RevenueCat error details were returned.',
  };
}

function purchaseFailureAlert(error: unknown): [string, string] {
  const message = errorMessage(error);
  const diagnostic = revenueCatErrorDetails(error);

  if (message === 'revenuecat_offering_missing') {
    return ['Subscription setup issue', 'RevenueCat has no current offering. Set a default offering and attach the monthly and annual packages.'];
  }

  if (message.startsWith('revenuecat_package_missing_')) {
    const plan = message.replace('revenuecat_package_missing_', '');
    return ['Subscription setup issue', `RevenueCat could not find the ${plan} package in the current offering.`];
  }

  if (diagnostic.code === '1') {
    return ['Purchase canceled', 'The App Store purchase was canceled before completion.'];
  }

  if (diagnostic.code === '5') {
    return ['Product unavailable', `Apple says this product is not available for purchase.\n\n${diagnostic.details}`];
  }

  if (diagnostic.code === '17') {
    return ['Apple purchase key issue', `RevenueCat could not validate the App Store in-app purchase key.\n\n${diagnostic.details}`];
  }

  if (diagnostic.code === '23') {
    return ['RevenueCat configuration issue', diagnostic.details];
  }

  return ['Subscription unavailable', diagnostic.details];
}

function restoreFailureAlert(error: unknown): [string, string] {
  return ['Restore unavailable', revenueCatErrorDetails(error).details];
}

function mealWithScanTrustMetadata(analysis: AnalysisResult): Meal {
  return {
    ...analysis.meal,
    uncertaintyReasons: analysis.uncertaintyReasons,
    correctionSuggestions: analysis.correctionSuggestions,
    scanReview: analysis.scanReview,
    proof: analysis.meal.proof ?? createMealProofMetadata(analysis.meal),
  };
}

function MacroLensApp() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'loading' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementState>({
    isPremium: false,
    source: 'none',
    productId: null,
    expiresAt: null,
    updatedAt: null,
  });
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({ isComplete: false });
  const [authSession, setAuthSession] = useState<MacroLensSession>(null);
  const localMealRepository = useMemo(() => createMealRepository(AsyncStorage), []);
  const recipeRepository = useMemo(() => createRecipeRepository(AsyncStorage), []);
  const localMetaboProofRepository = useMemo(() => createMetaboProofRepository(AsyncStorage), []);
  const localProfileRepository = useMemo(() => createProfileRepository(AsyncStorage), []);
  const entitlementRepository = useMemo(() => createEntitlementRepository(AsyncStorage), []);
  const authSessionRepository = useMemo(() => createAuthSessionRepository(AsyncStorage), []);
  const onboardingRepository = useMemo(() => createOnboardingRepository(AsyncStorage), []);
  const productRepository = useMemo(() => createProductRepository(AsyncStorage), []);
  const supabaseClient = useMemo(() => {
    if (appEnv.analysisMode !== 'remote' || !appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
      return null;
    }

    return createMacroLensSupabaseClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey);
  }, []);
  const repository = useMemo(
    () =>
      supabaseClient
        ? createSyncedMealRepository(localMealRepository, supabaseClient as Parameters<typeof createSyncedMealRepository>[1])
        : localMealRepository,
    [localMealRepository, supabaseClient],
  );
  const profileRepository = useMemo(
    () =>
      supabaseClient
        ? createSyncedProfileRepository(localProfileRepository, supabaseClient as Parameters<typeof createSyncedProfileRepository>[1])
        : localProfileRepository,
    [localProfileRepository, supabaseClient],
  );
  const metaboProofRepository = useMemo(
    () =>
      supabaseClient
        ? createSyncedMetaboProofRepository(localMetaboProofRepository, supabaseClient as Parameters<typeof createSyncedMetaboProofRepository>[1])
        : localMetaboProofRepository,
    [localMetaboProofRepository, supabaseClient],
  );
  const analysisService = useMemo(() => {
    if (!supabaseClient || !appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
      return createAnalysisService(appEnv);
    }

    return createAnalysisService(appEnv, {
      remote: createRemoteAnalysisService(
        {
          supabaseUrl: appEnv.supabaseUrl,
          supabaseAnonKey: appEnv.supabaseAnonKey,
        },
        supabaseClient as NonNullable<Parameters<typeof createRemoteAnalysisService>[1]>,
      ),
    });
  }, [supabaseClient]);
  const recipeImportService = useMemo(() => createRecipeImportService(appEnv), []);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({ resetOnBackground: true, disabled: Platform.OS === 'web' });
  const nutritionLabelOcrService = useMemo(() => {
    if (!supabaseClient || !appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
      return null;
    }

    return createNutritionLabelOcrService(
      {
        supabaseUrl: appEnv.supabaseUrl,
        supabaseAnonKey: appEnv.supabaseAnonKey,
      },
      supabaseClient as NonNullable<Parameters<typeof createNutritionLabelOcrService>[1]>,
    );
  }, [supabaseClient]);
  const packagedFoodLookupService = useMemo(
    () =>
      createPackagedFoodLookupService({
        supabaseClient: supabaseClient as SupabaseLookupClient | null,
      }),
    [supabaseClient],
  );
  const entitlementProvider = useMemo(
    () =>
      createEntitlementProvider({
        entitlementMode: appEnv.paywallEnabled ? appEnv.entitlementMode : 'local_dev',
        revenueCatAppleApiKey: appEnv.revenueCatAppleApiKey,
        revenueCatMonthlyProductId: appEnv.revenueCatMonthlyProductId,
        revenueCatAnnualProductId: appEnv.revenueCatAnnualProductId,
        isExpoGo: Constants.appOwnership === 'expo',
      }),
    [],
  );
  const targets: MacroTargets | null = profile?.targets ?? null;
  const activeUserId = authSession?.user?.id ?? localUserId;
  const authEmail = authSession?.user?.email ?? null;
  const authRedirectUri = 'macrolens://auth-callback';

  useEffect(() => {
    analytics.track('app_opened');
    async function boot() {
      const storedSession = await authSessionRepository.getSession();
      if (storedSession && supabaseClient) {
        supabaseClient.auth.setSession(storedSession);
        setAuthSession(storedSession);
      }

      const [loadedMeals, loadedProfile, loadedEntitlement, loadedOnboarding] = await Promise.all([
        repository.listMeals(),
        profileRepository.getProfile(),
        entitlementRepository.getEntitlement(),
        onboardingRepository.getState(),
      ]);

        setMeals(loadedMeals);
        setProfile(loadedProfile);
        setEntitlement(loadedEntitlement);
        setOnboardingState(loadedOnboarding);

        if (!loadedOnboarding.isComplete || !loadedProfile) {
          analytics.track('onboarding_started');
          setScreen({ name: 'onboarding' });
          return;
        }

        if (appEnv.paywallEnabled && !loadedEntitlement.isPremium) {
          analytics.track('paywall_viewed');
          setScreen({ name: 'paywall' });
          return;
        }

        setScreen({ name: 'app', tab: 'home' });
    }

    boot().catch((error) => {
        captureException(error);
        setScreen({ name: 'onboarding' });
      });
  }, [authSessionRepository, entitlementRepository, onboardingRepository, profileRepository, repository, supabaseClient]);

  useEffect(() => {
    if (!supabaseClient) {
      return undefined;
    }

    async function handleUrl(url: string | null) {
      if (!url || !supabaseClient) {
        return;
      }

      const parsedSession = parseSupabaseAuthCallback(url);
      if (parsedSession) {
        await persistAuthSession(parsedSession);
      }
    }

    Linking.getInitialURL().then(handleUrl).catch(() => undefined);
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url).catch(() => undefined);
    });

    return () => subscription.remove();
  }, [supabaseClient]);

  useEffect(() => {
    function handleSharedUrl(url: string | null) {
      const shared = parseSharedRecipeUrl(url);
      if (shared) {
        importRecipeFromUrl(shared.url, 'share');
      }
    }

    Linking.getInitialURL().then(handleSharedUrl).catch(() => undefined);
    const subscription = Linking.addEventListener('url', (event) => handleSharedUrl(event.url));

    return () => subscription.remove();
    // importRecipeFromUrl is hoisted and stable for the lifetime of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasShareIntent) {
      return;
    }

    const payload = shareIntent?.webUrl ?? shareIntent?.text ?? null;
    const parsed = parseSharedRecipeUrl(payload);
    if (parsed) {
      importRecipeFromUrl(parsed.url, 'share');
    }

    resetShareIntent();
    // importRecipeFromUrl is hoisted and stable for the lifetime of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent]);

  async function persistAuthSession(nextSession: MacroLensSession) {
    if (!nextSession || !supabaseClient) {
      return null;
    }

    supabaseClient.auth.setSession(nextSession);
    let hydratedSession = nextSession;

    if (!hydratedSession.user?.id) {
      const userResult = await supabaseClient.auth.getUser();
      if (userResult.error || !userResult.data.user) {
        throw new Error('Session created, but the Supabase user was not found.');
      }
      hydratedSession = { ...hydratedSession, user: userResult.data.user };
      supabaseClient.auth.setSession(hydratedSession);
    }

    await authSessionRepository.saveSession(hydratedSession);
    setAuthSession(hydratedSession);

    const [syncedMeals, syncedProfile] = await Promise.all([repository.listMeals(), profileRepository.getProfile()]);
    setMeals(syncedMeals);
    if (syncedProfile) {
      setProfile(syncedProfile);
    }

    return hydratedSession;
  }

  async function signUpWithEmail(email: string, password: string) {
    if (!supabaseClient) {
      throw new Error('Enable Supabase remote mode to create an account.');
    }

    const result = await supabaseClient.auth.signUpWithPassword({ email, password });
    if (result.error) {
      throw new Error('Account creation failed. Check the email, password, or Supabase configuration.');
    }

    if (!result.data.session) {
      throw new Error('Account created. Check your email, then sign in.');
    }

    await persistAuthSession(result.data.session);
  }

  async function signInWithEmail(email: string, password: string) {
    if (!supabaseClient) {
      throw new Error('Enable Supabase remote mode to sign in.');
    }

    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.session) {
      throw new Error('Unable to sign in. Check your credentials.');
    }

    await persistAuthSession(result.data.session);
    setScreen({ name: 'app', tab: 'profile' });
  }

  async function resetPassword(email: string) {
    if (!supabaseClient) {
      throw new Error('Enable Supabase remote mode to reset the password.');
    }

    const result = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUri });
    if (result.error) {
      throw new Error('Unable to send the reset email.');
    }
  }

  async function startOAuthSignIn(provider: 'apple' | 'google') {
    if (!supabaseClient) {
      throw new Error('Enable Supabase remote mode to sign in.');
    }

    await Linking.openURL(supabaseClient.auth.getOAuthUrl(provider, authRedirectUri));
  }

  async function analyzeImageUri(imageUri: string) {
    analytics.track('scan_started', { source: 'photo' });
    setScreen({ name: 'analyzing', imageUri });

    try {
      const analysis = await analysisService.analyzeMealPhoto({ imageUri, userId: activeUserId });
      const analyzedMeal = mealWithScanTrustMetadata(analysis);
      analytics.track('scan_completed', {
        source: 'photo',
        confidence: analyzedMeal.confidence,
        caloriesEstimate: analyzedMeal.caloriesEstimate,
        corrected: false,
      });
      setScreen({ name: 'result', meal: analyzedMeal, isSaved: false });
    } catch (error) {
      if (isNonFoodPhotoError(error)) {
        analytics.track('non_food_detected', { source: 'photo' });
        setScreen({ name: 'scanError', variant: 'non_food' });
        return;
      }

      analytics.track('scan_failed', { source: 'photo', reason: 'analysis_error' });
      setScreen({ name: 'scanError', variant: 'low_light' });
    }
  }

  function captureMeal() {
    analytics.track('scan_started', { source: 'camera' });
    setScreen({ name: 'scanner', initialMode: 'meal' });
  }

  function openScanner(initialMode: ScannerMode) {
    analytics.track('scan_started', { source: initialMode });
    setScreen({ name: 'scanner', initialMode });
  }

  async function pickMealPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    await analyzeImageUri(result.assets[0].uri);
  }

  async function completeOnboarding(nextProfile: UserProfile) {
    const completedAt = new Date().toISOString();
    await profileRepository.saveProfile(nextProfile);
    await onboardingRepository.saveState({ isComplete: true, completedAt });
    setProfile(nextProfile);
    setOnboardingState({ isComplete: true, completedAt });
    if (appEnv.paywallEnabled) {
      analytics.track('paywall_viewed');
      setScreen({ name: 'paywall' });
      return;
    }

    setScreen({ name: 'app', tab: 'home' });
  }

  async function applyPurchasedEntitlement(plan: PurchasePlan) {
    const nextEntitlement = storedEntitlementFromCommercial(await entitlementProvider.purchase(plan));
    await entitlementRepository.saveEntitlement(nextEntitlement);
    setEntitlement(nextEntitlement);
    if (nextEntitlement.isPremium) {
      setScreen({ name: 'premiumUnlocked' });
    }

    return nextEntitlement;
  }

  async function purchasePlan(plan: PurchasePlan) {
    try {
      analytics.track('paywall_cta_tapped', { plan });
      const nextEntitlement = await applyPurchasedEntitlement(plan);
      analytics.track('purchase_completed', { plan, source: nextEntitlement.source });
    } catch (error) {
      analytics.track('purchase_failed', { plan });
      Alert.alert(...purchaseFailureAlert(error));
    }
  }

  async function unlockForDevelopment() {
    try {
      const nextEntitlement = await applyPurchasedEntitlement('annual');
      analytics.track('purchase_completed', { plan: 'annual', source: nextEntitlement.source });
    } catch {
      Alert.alert('Subscription unavailable', 'Try again in a moment.');
    }
  }

  async function restorePurchases() {
    try {
      analytics.track('restore_purchases_tapped');
      const nextEntitlement = storedEntitlementFromCommercial(await entitlementProvider.restore());
      await entitlementRepository.saveEntitlement(nextEntitlement);
      setEntitlement(nextEntitlement);
      if (nextEntitlement.isPremium) {
        setScreen({ name: 'premiumUnlocked' });
        return;
      }

      Alert.alert('No purchase found', 'No active subscription was found for this App Store account.');
    } catch (error) {
      Alert.alert(...restoreFailureAlert(error));
    }
  }

  async function saveMeal(meal: Meal) {
    await repository.saveMeal(meal);
    analytics.track('meal_saved', { source: meal.source, caloriesEstimate: meal.caloriesEstimate });
    const nextMeals = await repository.listMeals();
    setMeals(nextMeals);
    setScreen({ name: 'saveConfirmation', meal, streakDays: calculateMealStreak(nextMeals, new Date().toISOString().slice(0, 10)) });
  }

  async function relogMeal(templateMeal: Meal) {
    const reloggedMeal = cloneMealForRelog(templateMeal);
    await saveMeal(reloggedMeal);
  }

  async function saveProfile(nextProfile: UserProfile) {
    await profileRepository.saveProfile(nextProfile);
    setProfile(nextProfile);
    setScreen({ name: 'app', tab: 'profile' });
  }

  async function clearMeals() {
    await repository.clearMeals();
    setMeals([]);
    setScreen({ name: 'app', tab: 'home' });
  }

  async function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: authSession?.user ?? null,
      profile,
      meals,
      entitlement,
      onboarding: onboardingState,
    };

    await Share.share({
      title: 'MacroLens data export',
      message: JSON.stringify(payload, null, 2),
    });
  }

  async function clearLocalAccountData() {
    await Promise.all([
      localMealRepository.clearMeals(),
      localMetaboProofRepository.clearAll(),
      localProfileRepository.clearProfile(),
      onboardingRepository.clearState(),
      entitlementRepository.clearEntitlement(),
      authSessionRepository.clearSession(),
    ]);
    setMeals([]);
    setProfile(null);
    setEntitlement({ isPremium: false, source: 'none', productId: null, expiresAt: null, updatedAt: null });
    setOnboardingState({ isComplete: false });
    setAuthSession(null);
  }

  async function logout() {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      supabaseClient.auth.setSession(null);
    }

    await clearLocalAccountData();
    setScreen({ name: 'onboarding' });
  }

  async function deleteAccount() {
    try {
      if (authSession?.user?.id) {
        await repository.clearMeals();
        await metaboProofRepository.clearAll();
        await profileRepository.clearProfile();
        if (supabaseClient) {
          await supabaseClient.functions.invoke('delete-account', { method: 'POST' });
          await supabaseClient.auth.signOut();
          supabaseClient.auth.setSession(null);
        }
      }

      await clearLocalAccountData();
      setScreen({ name: 'onboarding' });
    } catch {
      Alert.alert('Deletion incomplete', 'Local data was kept to avoid silent data loss. Try again in a moment.');
    }
  }

  function saveManualMeal(input: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }) {
    const meal = createManualMacroMeal({ userId: activeUserId, ...input });
    setScreen({ name: 'result', meal, isSaved: false });
  }

  async function handleBarcodeDetected(barcode: string) {
    analytics.track('barcode_scan_completed', { source: 'barcode' });
    setScreen({ name: 'analyzing', imageUri: `barcode://${barcode}` });

    try {
      const cachedItem = await productRepository.getProduct(barcode);
      const item = cachedItem ?? (await packagedFoodLookupService.lookupProduct(barcode));
      const outcome = normalizeProductLookupOutcome(item);

      if (outcome.status === 'needs_label') {
        analytics.track('scan_failed', { source: 'barcode', reason: 'product_needs_label' });
        setScreen({ name: 'scanner', initialMode: 'label', productLookupError: true, productLookupIssue: 'needs_label' });
        return;
      }

      await productRepository.saveProduct(outcome.item);
      setScreen({ name: 'packagedProduct', item: outcome.item, initialServingGrams: 30, imageUri: `product://${outcome.item.barcode}` });
    } catch (error) {
      const issue = error instanceof Error && error.message === 'product_nutrition_missing' ? 'needs_label' : 'not_found';
      analytics.track('scan_failed', { source: 'barcode', reason: issue === 'needs_label' ? 'product_needs_label' : 'product_not_found' });
      setScreen({ name: 'scanner', initialMode: issue === 'needs_label' ? 'label' : 'barcode', productLookupError: true, productLookupIssue: issue });
    }
  }

  async function handleLabelPhoto(imageUri: string) {
    analytics.track('label_scan_completed', { source: 'label_photo' });

    if (!nutritionLabelOcrService) {
      Alert.alert('OCR unavailable', 'Switch the app to remote mode to read nutrition labels automatically.');
      setScreen({ name: 'manualMeal' });
      return;
    }

    setScreen({ name: 'analyzing', imageUri });

    try {
      const result = await nutritionLabelOcrService.scanLabelPhoto(imageUri);
      analytics.track('scan_completed', {
        source: 'label_ocr',
        confidence: result.confidence,
        caloriesEstimate: result.item.caloriesPer100g,
        corrected: false,
      });
      setScreen({ name: 'packagedProduct', item: result.item, initialServingGrams: result.servingGrams, imageUri });
    } catch {
      analytics.track('scan_failed', { source: 'label_ocr', reason: 'label_ocr_error' });
      setScreen({ name: 'scanError', variant: 'label' });
    }
  }

  async function savePackagedProduct(item: PackagedFoodItem, servingGrams: number, imageUri: string) {
    await productRepository.saveProduct(item);
    const meal = createPackagedFoodMeal({ userId: activeUserId, item, servingGrams, imageUri });
    await saveMeal(meal);
  }

  function saveVerifiedRecipe(input: VerifiedRecipeInput) {
    const mealId = `recipe-${Date.now()}`;
    const items: MetaboProofMealItem[] = input.ingredients.map((ingredient, index) => ({
      id: `${mealId}-ingredient-${index + 1}`,
      label: ingredient.name,
      grams: ingredient.grams,
      confidence: 1,
      evidenceLevel: 'VERIFIED_RECIPE_WEIGHT',
      source: {
        provider: 'USER_CUSTOM',
        externalId: `recipe:${ingredient.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: ingredient.name,
        kcalPer100g: ingredient.kcalPer100g,
        proteinPer100g: ingredient.proteinPer100g,
        carbsPer100g: ingredient.carbsPer100g,
        fatPer100g: ingredient.fatPer100g,
      },
    }));
    const analysis = analyzeMealEvidence({ id: mealId, items });
    const meal = createAppMealFromMetaboProofAnalysis({
      userId: activeUserId,
      mealName: input.name,
      imageUri: 'recipe://verified',
      analysis,
    });
    setScreen({ name: 'result', meal, isSaved: false });
  }

  function openRecipeImport(initialUrl?: string) {
    setScreen({ name: 'recipeImport', initialUrl, importing: false });
  }

  async function importRecipeFromUrl(url: string, source: 'share' | 'paste') {
    const platform = detectRecipePlatform(url);
    analytics.track('recipe_import_started', { source, platform });
    setScreen({ name: 'recipeImport', initialUrl: url, importing: true });

    try {
      const extracted = await recipeImportService.extractRecipeFromUrl({ url, userId: activeUserId });
      // Trust creator-stated calories over the per-ingredient sum when the post gives a number.
      const recipe = anchorRecipeToStatedCalories(extracted);
      analytics.track('recipe_import_completed', { platform: recipe.sourcePlatform, ingredientCount: recipe.ingredients.length });
      // Hand the result to the loading screen so it can play the macro reveal before review.
      setScreen({ name: 'recipeImport', initialUrl: url, importing: true, result: recipe });
    } catch (error) {
      analytics.track('recipe_import_failed', {
        platform,
        reason: isUnsupportedRecipeUrlError(error) ? 'unsupported_url' : 'extraction_failed',
      });
      setScreen({ name: 'recipeImport', initialUrl: url, importing: false, errorMessage: recipeImportErrorMessage(error) });
    }
  }

  function saveImportedRecipe(recipe: ImportedRecipe) {
    // Persist to the "My recipes" library so it can be re-opened + turned into a shopping list.
    void recipeRepository.saveRecipe(recipe, new Date().toISOString());
    const meal = buildMealFromImportedRecipe({
      recipe,
      userId: activeUserId,
      mealId: `recipe-${Date.now()}`,
      capturedAt: new Date().toISOString(),
    });
    setScreen({ name: 'result', meal, isSaved: false });
  }

  function openShoppingList(recipe: ImportedRecipe, back: 'review-import' | 'review-library' | 'library') {
    setScreen({
      name: 'shoppingList',
      title: recipe.title,
      sourceItems: recipe.ingredients.map((ingredient) => ({ name: ingredient.name, grams: ingredient.grams })),
      recipe,
      back,
    });
  }

  function createCalibratedMeal(portionFactor: number) {
    const mealId = `calibrated-${Date.now()}`;
    const baseItems: MetaboProofMealItem[] = [
      {
        id: `${mealId}-chicken`,
        label: 'Grilled chicken',
        estimatedGrams: 140,
        confidence: 0.74,
        source: calibratedChickenSource,
        evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
      },
      {
        id: `${mealId}-rice`,
        label: 'White rice',
        estimatedGrams: 170,
        confidence: 0.7,
        source: calibratedRiceSource,
        evidenceLevel: 'ESTIMATED_VISUAL_ONLY',
      },
    ];
    const analysis = analyzeMealEvidence({ id: mealId, items: calibrateVisualItems(baseItems, portionFactor) });
    const meal = createAppMealFromMetaboProofAnalysis({
      userId: activeUserId,
      mealName: 'Calibrated chicken rice',
      imageUri: 'calibration://portion-factor',
      analysis,
    });
    setScreen({ name: 'result', meal, isSaved: false });
  }

  function openWeeklyReport() {
    analytics.track('weekly_report_viewed');
    setScreen({ name: 'weeklyReport' });
  }

  async function applyCorrectionAndTrack(meal: Meal, correction: MealCorrection) {
    const correctedMeal = await applyMealCorrectionWithLedger({
      meal,
      correction,
      repository: metaboProofRepository,
    });
    analytics.track('correction_applied', {
      correctionType: getMealCorrectionType(correction),
      caloriesEstimate: correctedMeal.caloriesEstimate,
    });
    setScreen({ name: 'result', meal: correctedMeal, isSaved: false });
  }

  function renderAppShell(tab: AppTab) {
    const content =
      tab === 'timeline' ? (
        <PremiumTimelineScreen meals={meals} onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })} />
      ) : tab === 'today' ? (
        <TodayScreen
          meals={meals}
          targets={targets}
          profile={profile}
          onBack={() => setScreen({ name: 'app', tab: 'home' })}
          onAddWeighIn={() => setScreen({ name: 'weighIn' })}
          onOpenWeeklyReport={openWeeklyReport}
          onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
        />
      ) : tab === 'profile' ? (
        <SuccessProfileScreen
          meals={meals}
          profile={profile}
          onEditProfile={() => setScreen({ name: 'editProfile' })}
          onOpenSettings={() => setScreen({ name: 'settings' })}
          onOpenSavedRecipes={() => setScreen({ name: 'savedRecipes' })}
        />
      ) : (
        <PremiumHomeScreen
          meals={meals}
          targets={targets}
          profile={profile}
          onOpenSettings={() => setScreen({ name: 'settings' })}
          onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
          onRelogMeal={relogMeal}
          onStartScan={captureMeal}
          onOpenSavedMeals={() => setScreen({ name: 'savedMeals' })}
        />
      );

    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ flex: 1 }}>{content}</View>
        <BottomTabs activeTab={tab} onChangeTab={(nextTab) => setScreen({ name: 'app', tab: nextTab })} onScanPress={captureMeal} />
      </View>
    );
  }

  if (screen.name === 'loading') {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.ink, fontSize: typography.heading, fontWeight: '900' }}>MACROLENS</Text>
        <Text style={{ color: colors.muted, fontSize: typography.small, fontWeight: '800', lineHeight: 19, marginTop: spacing.md, textAlign: 'center' }}>See your food. Know your macros. Reach your goals.</Text>
        <View style={{ borderColor: colors.green, borderRadius: radius.pill, borderWidth: 2, height: 18, marginTop: spacing.xxxl, width: 18 }} />
      </View>
    );
  }

  if (screen.name === 'onboarding') {
    return (
      <OnboardingScreen
        userId={activeUserId}
        authEmail={authEmail}
        onEmailSignUp={signUpWithEmail}
        onOAuthSignIn={startOAuthSignIn}
        onComplete={completeOnboarding}
        onStepCompleted={(step) => analytics.track('onboarding_step_completed', { step })}
        onOnboardingCompleted={({ goal, friction }) => analytics.track('onboarding_completed', { goal, friction })}
      />
    );
  }

  if (screen.name === 'paywall') {
    if (!appEnv.paywallEnabled) {
      return renderAppShell('home');
    }

    return (
      <PaywallScreen
        onPurchase={purchasePlan}
        onUnlockForDevelopment={unlockForDevelopment}
        onRestore={restorePurchases}
        showDevelopmentUnlock={appEnv.entitlementMode === 'local_dev'}
      />
    );
  }

  if (screen.name === 'premiumUnlocked') {
    return <PremiumUnlockedScreen onStartScan={() => setScreen({ name: 'scanner', initialMode: 'meal' })} />;
  }

  if (screen.name === 'app') {
    return renderAppShell(screen.tab);
  }

  if (screen.name === 'analyzing') {
    return <AnalyzingScreen imageUri={screen.imageUri} />;
  }

  if (screen.name === 'result') {
    return (
      <ResultScreen
        meal={screen.meal}
        onApplyCorrection={(correction) => applyCorrectionAndTrack(screen.meal, correction)}
        onAdjustItem={(itemId) => setScreen({ name: 'portionAdjust', meal: screen.meal, itemId })}
        onBack={() => setScreen({ name: 'app', tab: 'home' })}
        onSave={() => saveMeal(screen.meal)}
      />
    );
  }

  if (screen.name === 'portionAdjust') {
    return (
      <PortionAdjustScreen
        meal={screen.meal}
        itemId={screen.itemId}
        onBack={() => setScreen({ name: 'result', meal: screen.meal, isSaved: false })}
        onApply={(meal) => setScreen({ name: 'result', meal, isSaved: false })}
      />
    );
  }

  if (screen.name === 'saveConfirmation') {
    return (
      <SaveConfirmationScreen
        meal={screen.meal}
        streakDays={screen.streakDays}
        onHome={() => setScreen({ name: 'app', tab: 'home' })}
        onTimeline={() => setScreen({ name: 'app', tab: 'timeline' })}
      />
    );
  }

  if (screen.name === 'auth') {
    return (
      <AuthScreen
        defaultMode={screen.mode}
        onBack={() => setScreen({ name: 'settings' })}
        onEmailLogin={signInWithEmail}
        onEmailSignup={async (email, password) => {
          await signUpWithEmail(email, password);
          setScreen({ name: 'app', tab: 'profile' });
        }}
        onResetPassword={resetPassword}
        onOAuth={startOAuthSignIn}
      />
    );
  }

  if (screen.name === 'editProfile') {
    return <EditProfileScreen profile={profile} userId={activeUserId} onBack={() => setScreen({ name: 'app', tab: 'profile' })} onSave={saveProfile} />;
  }

  if (screen.name === 'settings') {
    return (
      <SettingsScreen
        analysisMode={appEnv.analysisMode}
        authEmail={authEmail}
        isAuthenticated={Boolean(authSession?.user?.id)}
        mealCount={meals.length}
        onBack={() => setScreen({ name: 'app', tab: 'profile' })}
        onOpenAuth={() => setScreen({ name: 'auth', mode: authSession ? 'login' : 'signup' })}
        onOpenProfile={() => setScreen({ name: 'editProfile' })}
        onOpenTargets={() => setScreen({ name: 'targets' })}
        onOpenSubscription={() => setScreen({ name: 'subscriptionSettings' })}
        showSubscription={appEnv.paywallEnabled}
        onOpenReminders={() => setScreen({ name: 'reminderSettings' })}
        onOpenHealth={() => setScreen({ name: 'healthSettings' })}
        onOpenCalibration={() => setScreen({ name: 'calibration' })}
        onOpenData={() => setScreen({ name: 'dataPrivacy' })}
        onOpenLegal={() => setScreen({ name: 'legalSupport' })}
      />
    );
  }

  if (screen.name === 'subscriptionSettings') {
    if (!appEnv.paywallEnabled) {
      return renderAppShell('profile');
    }

    return <SubscriptionSettingsScreen entitlement={entitlement} onBack={() => setScreen({ name: 'settings' })} onPurchase={purchasePlan} onRestore={restorePurchases} />;
  }

  if (screen.name === 'reminderSettings') {
    return <ReminderSettingsScreen onBack={() => setScreen({ name: 'settings' })} />;
  }

  if (screen.name === 'healthSettings') {
    return <HealthSettingsScreen onBack={() => setScreen({ name: 'settings' })} />;
  }

  if (screen.name === 'legalSupport') {
    return <LegalSupportScreen onBack={() => setScreen({ name: 'settings' })} />;
  }

  if (screen.name === 'dataPrivacy') {
    return (
      <DataPrivacyScreen
        isAuthenticated={Boolean(authSession?.user?.id)}
        mealCount={meals.length}
        onBack={() => setScreen({ name: 'settings' })}
        onDeleteAccount={deleteAccount}
        onExportData={exportData}
        onLogout={logout}
      />
    );
  }

  if (screen.name === 'targets') {
    return (
      <TargetsScreen
        profile={profile}
        onBack={() => setScreen({ name: 'app', tab: 'profile' })}
        onCreateProfile={() => setScreen({ name: 'editProfile' })}
        onSave={saveProfile}
      />
    );
  }

  if (screen.name === 'scanHub') {
    return (
      <ScanHubScreen
        onBack={() => setScreen({ name: 'app', tab: 'home' })}
        onOpenScanner={openScanner}
        onOpenLibrary={pickMealPhoto}
        onOpenFoodSearch={() => setScreen({ name: 'foodSearch' })}
        onOpenManualMeal={() => setScreen({ name: 'manualMeal' })}
        onOpenVerifiedRecipe={() => setScreen({ name: 'verifiedRecipe' })}
        onOpenRecipeImport={() => openRecipeImport()}
        onOpenCalibration={() => setScreen({ name: 'calibration' })}
        onOpenBenchmark={() => setScreen({ name: 'benchmarkDev' })}
      />
    );
  }

  if (screen.name === 'verifiedRecipe') {
    return <VerifiedRecipeScreen onBack={() => setScreen({ name: 'scanner', initialMode: 'meal' })} onSaveRecipe={saveVerifiedRecipe} />;
  }

  if (screen.name === 'recipeImport') {
    return (
      <RecipeImportScreen
        initialUrl={screen.initialUrl}
        importing={screen.importing}
        errorMessage={screen.errorMessage ?? null}
        result={screen.result ?? null}
        onBack={() => setScreen({ name: 'scanner', initialMode: 'meal' })}
        onSubmit={(url) => importRecipeFromUrl(url, 'paste')}
        onRevealComplete={(recipe) => setScreen({ name: 'recipeReview', recipe })}
      />
    );
  }

  if (screen.name === 'recipeReview') {
    const reviewOrigin = screen.origin ?? 'import';
    return (
      <RecipeReviewScreen
        recipe={screen.recipe}
        onBack={() => (reviewOrigin === 'library' ? setScreen({ name: 'savedRecipes' }) : openRecipeImport(screen.recipe.sourceUrl))}
        onSave={saveImportedRecipe}
        onShoppingList={(recipe) => openShoppingList(recipe, reviewOrigin === 'library' ? 'review-library' : 'review-import')}
      />
    );
  }

  if (screen.name === 'savedRecipes') {
    return (
      <SavedRecipesScreen
        repository={recipeRepository}
        onBack={() => setScreen({ name: 'app', tab: 'profile' })}
        onOpen={(recipe) => setScreen({ name: 'recipeReview', recipe, origin: 'library' })}
        onShoppingList={(recipe) => openShoppingList(recipe, 'library')}
      />
    );
  }

  if (screen.name === 'shoppingList') {
    return (
      <ShoppingListScreen
        title={screen.title}
        sourceItems={screen.sourceItems}
        onBack={() =>
          screen.back === 'library'
            ? setScreen({ name: 'savedRecipes' })
            : setScreen({ name: 'recipeReview', recipe: screen.recipe, origin: screen.back === 'review-library' ? 'library' : 'import' })
        }
      />
    );
  }

  if (screen.name === 'calibration') {
    return <CalibrationScreen onBack={() => setScreen({ name: 'settings' })} onCreateCalibratedMeal={createCalibratedMeal} />;
  }

  if (screen.name === 'benchmarkDev') {
    return <BenchmarkDevScreen onBack={() => setScreen({ name: 'scanHub' })} />;
  }

  if (screen.name === 'scanError') {
    return (
      <ScanErrorScreen
        variant={screen.variant}
        onRetake={() => setScreen({ name: 'scanner', initialMode: screen.variant === 'label' ? 'label' : 'meal' })}
        onManual={() => setScreen({ name: 'manualMeal' })}
        onHome={() => setScreen({ name: 'app', tab: 'home' })}
      />
    );
  }

  if (screen.name === 'foodSearch') {
    return (
      <FoodSearchScreen
        onBack={() => setScreen({ name: 'scanner', initialMode: 'meal' })}
        onManualEntry={() => setScreen({ name: 'manualMeal' })}
        onSelectFood={saveManualMeal}
      />
    );
  }

  if (screen.name === 'savedMeals') {
    return (
      <SavedMealsScreen
        meals={meals}
        onBack={() => setScreen({ name: 'app', tab: 'profile' })}
        onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
        onRelogMeal={relogMeal}
      />
    );
  }

  if (screen.name === 'weighIn') {
    return <WeighInScreen profile={profile} userId={activeUserId} onBack={() => setScreen({ name: 'app', tab: 'today' })} onSave={saveProfile} />;
  }

  if (screen.name === 'manualMeal') {
    return <ManualMealScreen onBack={() => setScreen({ name: 'scanner', initialMode: 'meal' })} onSave={saveManualMeal} />;
  }

  if (screen.name === 'scanner') {
    return (
      <ScannerScreen
        initialMode={screen.initialMode}
        productLookupError={screen.productLookupError}
        productLookupIssue={screen.productLookupIssue}
        onBack={() => setScreen({ name: 'app', tab: 'home' })}
        onMealPhoto={analyzeImageUri}
        onLabelPhoto={handleLabelPhoto}
        onBarcodeDetected={handleBarcodeDetected}
        onManualBarcode={handleBarcodeDetected}
        onManualMeal={() => setScreen({ name: 'manualMeal' })}
        onOpenLibrary={pickMealPhoto}
        onOpenFoodSearch={() => setScreen({ name: 'foodSearch' })}
        onOpenVerifiedRecipe={() => setScreen({ name: 'verifiedRecipe' })}
        onOpenRecipeImport={() => openRecipeImport()}
      />
    );
  }

  if (screen.name === 'packagedProduct') {
    return (
      <PackagedProductScreen
        item={screen.item}
        initialServingGrams={screen.initialServingGrams}
        onBack={() => setScreen({ name: 'scanner', initialMode: 'barcode' })}
        onAddProduct={(servingGrams) => savePackagedProduct(screen.item, servingGrams, screen.imageUri)}
      />
    );
  }

  if (screen.name === 'weeklyReport') {
    const todayIsoDate = new Date().toISOString().slice(0, 10);
    const report = targets
      ? buildWeeklyReportFromMeals({ meals, targets, todayIsoDate })
      : buildWeeklyReport({ daysLogged: 0, averageCalories: 0, averageProteinG: 0, targetCalories: 0, targetProteinG: 0 });

    return <WeeklyReportScreen report={report} onBack={() => setScreen({ name: 'app', tab: 'today' })} />;
  }

  return renderAppShell('home');
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <StatusBar style="dark" />
        <View style={appContainerStyle}>
          <LanguageProvider>
            <AppErrorBoundary
              onError={(error) => {
                captureException(error);
                analytics.track('screen_error');
              }}
            >
              <MacroLensApp />
            </AppErrorBoundary>
          </LanguageProvider>
        </View>
      </SafeAreaView>
    </QueryClientProvider>
  );
}
