import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, Text, View } from 'react-native';
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
import { calculateMealStreak } from './src/domain/streaks';
import type { MacroTargets, Meal, UserProfile } from './src/domain/types';
import { buildWeeklyReport, buildWeeklyReportFromMeals } from './src/domain/weeklyReport';
import { createEntitlementProvider } from './src/entitlements/entitlementProviderFactory';
import type { CommercialEntitlementState, PurchasePlan } from './src/entitlements/entitlementTypes';
import { createPackagedFoodLookupService, type SupabaseLookupClient } from './src/packagedFood/packagedFoodLookupService';
import { createNutritionLabelOcrService } from './src/packagedFood/labelOcrService';
import { createPackagedFoodMeal } from './src/packagedFood/packagedFoodMeal';
import type { PackagedFoodItem } from './src/packagedFood/packagedFoodSchema';
import { createEntitlementRepository, type EntitlementState } from './src/storage/entitlementRepository';
import { createMealRepository } from './src/storage/mealRepository';
import { createOnboardingRepository, type OnboardingState } from './src/storage/onboardingRepository';
import { createProfileRepository } from './src/storage/profileRepository';
import { createMacroLensSupabaseClient } from './src/supabase/client';
import { colors } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { BarcodeScanScreen } from './src/screens/BarcodeScanScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { LabelScanScreen } from './src/screens/LabelScanScreen';
import { ManualMealScreen } from './src/screens/ManualMealScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { PackagedProductScreen } from './src/screens/PackagedProductScreen';
import { PortionAdjustScreen } from './src/screens/PortionAdjustScreen';
import { PremiumHomeScreen } from './src/screens/PremiumHomeScreen';
import { PremiumTimelineScreen } from './src/screens/PremiumTimelineScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SaveConfirmationScreen } from './src/screens/SaveConfirmationScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SuccessProfileScreen } from './src/screens/SuccessProfileScreen';
import { TargetsScreen } from './src/screens/TargetsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WeeklyReportScreen } from './src/screens/WeeklyReportScreen';

type ScreenState =
  | { name: 'loading' }
  | { name: 'onboarding' }
  | { name: 'paywall' }
  | { name: 'app'; tab: AppTab }
  | { name: 'analyzing'; imageUri: string }
  | { name: 'result'; meal: Meal; isSaved: boolean }
  | { name: 'portionAdjust'; meal: Meal; itemId: string }
  | { name: 'saveConfirmation'; meal: Meal; streakDays: number }
  | { name: 'editProfile' }
  | { name: 'settings' }
  | { name: 'targets' }
  | { name: 'manualMeal' }
  | { name: 'barcodeScan' }
  | { name: 'labelScan' }
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
  const repository = useMemo(() => createMealRepository(AsyncStorage), []);
  const profileRepository = useMemo(() => createProfileRepository(AsyncStorage), []);
  const entitlementRepository = useMemo(() => createEntitlementRepository(AsyncStorage), []);
  const onboardingRepository = useMemo(() => createOnboardingRepository(AsyncStorage), []);
  const supabaseClient = useMemo(() => {
    if (appEnv.analysisMode !== 'remote' || !appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
      return null;
    }

    return createMacroLensSupabaseClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey);
  }, []);
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

  useEffect(() => {
    analytics.track('app_opened');
    Promise.all([repository.listMeals(), profileRepository.getProfile(), entitlementRepository.getEntitlement(), onboardingRepository.getState()])
      .then(([loadedMeals, loadedProfile, loadedEntitlement, loadedOnboarding]) => {
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
      })
      .catch(() => {
        setScreen({ name: 'onboarding' });
      });
  }, [entitlementRepository, onboardingRepository, profileRepository, repository]);

  async function analyzeImageUri(imageUri: string) {
    analytics.track('scan_started', { source: 'photo' });
    setScreen({ name: 'analyzing', imageUri });

    try {
      const analysis = await analysisService.analyzeMealPhoto({ imageUri, userId: localUserId });
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
        Alert.alert('Photo non reconnue', error.userMessage);
        setScreen({ name: 'app', tab: 'home' });
        return;
      }

      analytics.track('scan_failed', { source: 'photo', reason: 'analysis_error' });
      Alert.alert('Analyse impossible', 'Reessaie avec une photo plus claire ou ajoute le repas manuellement.');
      setScreen({ name: 'app', tab: 'home' });
    }
  }

  async function captureMeal() {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera indisponible', 'Autorise la camera ou choisis une photo depuis ta galerie.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
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
      setScreen({ name: 'app', tab: 'home' });
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
        setScreen({ name: 'app', tab: 'home' });
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

  function saveManualMeal(input: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }) {
    const meal = createManualMacroMeal({ userId: localUserId, ...input });
    setScreen({ name: 'result', meal, isSaved: false });
  }

  function openBarcodeScan() {
    analytics.track('barcode_scan_started');
    setScreen({ name: 'barcodeScan' });
  }

  function openLabelScan() {
    setScreen({ name: 'labelScan' });
  }

  async function handleBarcodeDetected(barcode: string) {
    analytics.track('barcode_scan_completed', { source: 'barcode' });
    setScreen({ name: 'analyzing', imageUri: `barcode://${barcode}` });

    try {
      const item = await packagedFoodLookupService.lookupProduct(barcode);
      setScreen({ name: 'packagedProduct', item, initialServingGrams: 30, imageUri: `product://${item.barcode}` });
    } catch {
      Alert.alert('Produit introuvable', "Je n'ai pas trouve ce produit. Essaie de saisir le code, scanne l'etiquette ou ajoute le produit manuellement.");
      setScreen({ name: 'barcodeScan' });
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
      Alert.alert('Etiquette illisible', 'Cadre le tableau nutritionnel de face, avec les valeurs par 100 g visibles, ou ajoute le produit manuellement.');
      setScreen({ name: 'manualMeal' });
    }
  }

  async function savePackagedProduct(item: PackagedFoodItem, servingGrams: number, imageUri: string) {
    const meal = createPackagedFoodMeal({ userId: localUserId, item, servingGrams, imageUri });
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
          onBack={() => setScreen({ name: 'app', tab: 'home' })}
          onCapture={captureMeal}
          onPickPhoto={pickMealPhoto}
          onBarcodeScan={openBarcodeScan}
          onManualMeal={() => setScreen({ name: 'manualMeal' })}
          onOpenWeeklyReport={openWeeklyReport}
          onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
        />
      ) : tab === 'profile' ? (
        <SuccessProfileScreen meals={meals} onEditProfile={() => setScreen({ name: 'editProfile' })} onOpenSettings={() => setScreen({ name: 'settings' })} />
      ) : (
        <PremiumHomeScreen
          meals={meals}
          targets={targets}
          profile={profile}
          onCapture={captureMeal}
          onPickPhoto={pickMealPhoto}
          onBarcodeScan={openBarcodeScan}
          onManualMeal={() => setScreen({ name: 'manualMeal' })}
          onOpenSettings={() => setScreen({ name: 'settings' })}
        />
      );

    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ flex: 1 }}>{content}</View>
        <BottomTabs activeTab={tab} onChangeTab={(nextTab) => setScreen({ name: 'app', tab: nextTab })} />
      </View>
    );
  }

  if (screen.name === 'loading') {
    return (
      <View style={{ alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: colors.ink, fontSize: 28, fontWeight: '900' }}>MACROLENS</Text>
      </View>
    );
  }

  if (screen.name === 'onboarding') {
    return (
      <OnboardingScreen
        userId={localUserId}
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

  if (screen.name === 'editProfile') {
    return <EditProfileScreen profile={profile} userId={localUserId} onBack={() => setScreen({ name: 'app', tab: 'profile' })} onSave={saveProfile} />;
  }

  if (screen.name === 'settings') {
    return (
      <SettingsScreen
        analysisMode={appEnv.analysisMode}
        mealCount={meals.length}
        onBack={() => setScreen({ name: 'app', tab: 'profile' })}
        onOpenProfile={() => setScreen({ name: 'editProfile' })}
        onOpenTargets={() => setScreen({ name: 'targets' })}
        onClearMeals={clearMeals}
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

  if (screen.name === 'manualMeal') {
    return <ManualMealScreen onBack={() => setScreen({ name: 'app', tab: 'home' })} onSave={saveManualMeal} />;
  }

  if (screen.name === 'barcodeScan') {
    return (
      <BarcodeScanScreen
        onBack={() => setScreen({ name: 'app', tab: 'home' })}
        onBarcodeDetected={handleBarcodeDetected}
        onOpenLabelScan={openLabelScan}
        onManualBarcode={handleBarcodeDetected}
        onManualFallback={() => setScreen({ name: 'manualMeal' })}
      />
    );
  }

  if (screen.name === 'labelScan') {
    return <LabelScanScreen onBack={() => setScreen({ name: 'barcodeScan' })} onLabelPhoto={handleLabelPhoto} />;
  }

  if (screen.name === 'packagedProduct') {
    return (
      <PackagedProductScreen
        item={screen.item}
        initialServingGrams={screen.initialServingGrams}
        onBack={() => setScreen({ name: 'barcodeScan' })}
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
