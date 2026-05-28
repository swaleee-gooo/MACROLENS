import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, SafeAreaView, Share, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { createAnalyticsClient, createConsoleAnalyticsSink } from './src/analytics/analyticsClient';
import { isNonFoodPhotoError } from './src/analysis/analysisErrors';
import type { AnalysisResult } from './src/analysis/analysisSchema';
import { createAnalysisService } from './src/analysis/analysisServiceFactory';
import { createRemoteAnalysisService } from './src/analysis/remoteAnalysisService';
import { appEnv } from './src/config/env';
import { BottomTabs, type AppTab } from './src/components/BottomTabs';
import { applyMealCorrection, getMealCorrectionType, type MealCorrection } from './src/domain/corrections';
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
import { createEntitlementRepository, type EntitlementState } from './src/storage/entitlementRepository';
import { createAuthSessionRepository } from './src/storage/authSessionRepository';
import { createSyncedMealRepository, createSyncedProfileRepository } from './src/storage/cloudSyncRepository';
import { createMealRepository } from './src/storage/mealRepository';
import { createOnboardingRepository, type OnboardingState } from './src/storage/onboardingRepository';
import { createProductRepository } from './src/storage/productRepository';
import { createProfileRepository } from './src/storage/profileRepository';
import { parseSupabaseAuthCallback } from './src/auth/deepLinkSession';
import { createMacroLensSupabaseClient, type MacroLensSession } from './src/supabase/client';
import { colors, radius, spacing, typography } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
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
import { ReminderSettingsScreen } from './src/screens/ReminderSettingsScreen';
import { SuccessProfileScreen } from './src/screens/SuccessProfileScreen';
import { SubscriptionSettingsScreen } from './src/screens/SubscriptionSettingsScreen';
import { TargetsScreen } from './src/screens/TargetsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WeighInScreen } from './src/screens/WeighInScreen';
import { WeeklyReportScreen } from './src/screens/WeeklyReportScreen';
import type { ScannerMode } from './src/scanner/scannerModes';

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
  | { name: 'scanError'; variant: 'non_food' | 'low_light' | 'label' }
  | { name: 'scanner'; initialMode: ScannerMode; productLookupError?: boolean; productLookupIssue?: 'not_found' | 'needs_label' }
  | { name: 'packagedProduct'; item: PackagedFoodItem; initialServingGrams: number; imageUri: string }
  | { name: 'weeklyReport' };

const queryClient = new QueryClient();
const analytics = createAnalyticsClient(createConsoleAnalyticsSink());
const localUserId = 'local-user';

function storedEntitlementFromCommercial(state: CommercialEntitlementState): EntitlementState {
  return {
    isPremium: state.isPremium,
    source: state.source,
    productId: state.productId,
    expiresAt: state.expiresAt,
    updatedAt: state.updatedAt,
  };
}

function mealWithScanTrustMetadata(analysis: AnalysisResult): Meal {
  return {
    ...analysis.meal,
    uncertaintyReasons: analysis.uncertaintyReasons,
    correctionSuggestions: analysis.correctionSuggestions,
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
        entitlementMode: appEnv.entitlementMode,
        revenueCatAppleApiKey: appEnv.revenueCatAppleApiKey,
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

        if (!loadedEntitlement.isPremium) {
          analytics.track('paywall_viewed');
          setScreen({ name: 'paywall' });
          return;
        }

        setScreen({ name: 'app', tab: 'home' });
    }

    boot().catch(() => {
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

  async function persistAuthSession(nextSession: MacroLensSession) {
    if (!nextSession || !supabaseClient) {
      return null;
    }

    supabaseClient.auth.setSession(nextSession);
    let hydratedSession = nextSession;

    if (!hydratedSession.user?.id) {
      const userResult = await supabaseClient.auth.getUser();
      if (userResult.error || !userResult.data.user) {
        throw new Error('Session creee, mais utilisateur Supabase introuvable.');
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
      throw new Error('Active Supabase remote pour creer un compte.');
    }

    const result = await supabaseClient.auth.signUpWithPassword({ email, password });
    if (result.error) {
      throw new Error('Creation impossible. Verifie email, mot de passe ou configuration Supabase.');
    }

    if (!result.data.session) {
      throw new Error('Compte cree. Verifie ton email, puis connecte-toi.');
    }

    await persistAuthSession(result.data.session);
  }

  async function signInWithEmail(email: string, password: string) {
    if (!supabaseClient) {
      throw new Error('Active Supabase remote pour te connecter.');
    }

    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.session) {
      throw new Error('Connexion impossible. Verifie tes identifiants.');
    }

    await persistAuthSession(result.data.session);
    setScreen({ name: 'app', tab: 'profile' });
  }

  async function resetPassword(email: string) {
    if (!supabaseClient) {
      throw new Error('Active Supabase remote pour reinitialiser le mot de passe.');
    }

    const result = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUri });
    if (result.error) {
      throw new Error('Email de reinitialisation impossible a envoyer.');
    }
  }

  async function startOAuthSignIn(provider: 'apple' | 'google') {
    if (!supabaseClient) {
      throw new Error('Active Supabase remote pour te connecter.');
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
    analytics.track('scan_started', { source: 'hub' });
    setScreen({ name: 'scanHub' });
  }

  function openScanner(initialMode: ScannerMode) {
    analytics.track('scan_started', { source: initialMode });
    setScreen({ name: 'scanner', initialMode });
  }

  async function pickMealPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.75,
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
    analytics.track('paywall_viewed');
    setScreen({ name: 'paywall' });
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
    } catch {
      analytics.track('purchase_failed', { plan });
      Alert.alert('Abonnement indisponible', 'Reessaie dans quelques instants.');
    }
  }

  async function unlockForDevelopment() {
    try {
      const nextEntitlement = await applyPurchasedEntitlement('annual');
      analytics.track('purchase_completed', { plan: 'annual', source: nextEntitlement.source });
    } catch {
      Alert.alert('Abonnement indisponible', 'Reessaie dans quelques instants.');
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

      Alert.alert('Aucun achat trouve', 'Aucun abonnement actif n a ete trouve pour ce compte App Store.');
    } catch {
      Alert.alert('Restauration impossible', 'La restauration sera testee dans une development build avec RevenueCat.');
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
      Alert.alert('Suppression incomplete', 'Les donnees locales ont ete conservees pour eviter une perte silencieuse. Reessaie dans quelques instants.');
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
      Alert.alert('OCR indisponible', "Passe l'app en mode remote pour lire automatiquement les etiquettes nutritionnelles.");
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

  function openWeeklyReport() {
    analytics.track('weekly_report_viewed');
    setScreen({ name: 'weeklyReport' });
  }

  function applyCorrectionAndTrack(meal: Meal, correction: MealCorrection) {
    const correctedMeal = applyMealCorrection(meal, correction);
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
          onOpenSavedMeals={() => setScreen({ name: 'savedMeals' })}
          onOpenSettings={() => setScreen({ name: 'settings' })}
        />
      ) : (
        <PremiumHomeScreen
          meals={meals}
          targets={targets}
          profile={profile}
          onOpenSettings={() => setScreen({ name: 'settings' })}
          onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
          onRelogMeal={relogMeal}
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
    return <PremiumUnlockedScreen onStartScan={() => setScreen({ name: 'scanHub' })} />;
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
        onOpenReminders={() => setScreen({ name: 'reminderSettings' })}
        onOpenHealth={() => setScreen({ name: 'healthSettings' })}
        onOpenData={() => setScreen({ name: 'dataPrivacy' })}
        onOpenLegal={() => setScreen({ name: 'legalSupport' })}
      />
    );
  }

  if (screen.name === 'subscriptionSettings') {
    return <SubscriptionSettingsScreen entitlement={entitlement} onBack={() => setScreen({ name: 'settings' })} onRestore={restorePurchases} />;
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
      />
    );
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
        onBack={() => setScreen({ name: 'scanHub' })}
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
    return <ManualMealScreen onBack={() => setScreen({ name: 'app', tab: 'home' })} onSave={saveManualMeal} />;
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
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <StatusBar style="dark" />
        <MacroLensApp />
      </SafeAreaView>
    </QueryClientProvider>
  );
}
