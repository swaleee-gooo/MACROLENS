import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { createAnalyticsClient, createConsoleAnalyticsSink } from './src/analytics/analyticsClient';
import { isNonFoodPhotoError } from './src/analysis/analysisErrors';
import { createAnalysisService } from './src/analysis/analysisServiceFactory';
import { appEnv } from './src/config/env';
import { BottomTabs, type AppTab } from './src/components/BottomTabs';
import { applyMealCorrection } from './src/domain/corrections';
import { createManualMacroMeal } from './src/domain/manualMeal';
import { calculateMealStreak } from './src/domain/streaks';
import type { MacroTargets, Meal, UserProfile } from './src/domain/types';
import { createEntitlementRepository, type EntitlementState } from './src/storage/entitlementRepository';
import { createMealRepository } from './src/storage/mealRepository';
import { createOnboardingRepository, type OnboardingState } from './src/storage/onboardingRepository';
import { createProfileRepository } from './src/storage/profileRepository';
import { colors } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { ManualMealScreen } from './src/screens/ManualMealScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { PortionAdjustScreen } from './src/screens/PortionAdjustScreen';
import { PremiumHomeScreen } from './src/screens/PremiumHomeScreen';
import { PremiumTimelineScreen } from './src/screens/PremiumTimelineScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SaveConfirmationScreen } from './src/screens/SaveConfirmationScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SuccessProfileScreen } from './src/screens/SuccessProfileScreen';
import { TargetsScreen } from './src/screens/TargetsScreen';

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
  | { name: 'manualMeal' };

const queryClient = new QueryClient();
const analytics = createAnalyticsClient(createConsoleAnalyticsSink());
const localUserId = 'local-user';

function MacroLensApp() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'loading' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementState>({ isPremium: false, source: 'none', updatedAt: null });
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({ isComplete: false });
  const repository = useMemo(() => createMealRepository(AsyncStorage), []);
  const profileRepository = useMemo(() => createProfileRepository(AsyncStorage), []);
  const entitlementRepository = useMemo(() => createEntitlementRepository(AsyncStorage), []);
  const onboardingRepository = useMemo(() => createOnboardingRepository(AsyncStorage), []);
  const analysisService = useMemo(() => createAnalysisService(appEnv), []);
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
          setScreen({ name: 'onboarding' });
          return;
        }

        if (!loadedEntitlement.isPremium) {
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
      analytics.track('scan_completed', {
        source: 'photo',
        confidence: analysis.meal.confidence,
        caloriesEstimate: analysis.meal.caloriesEstimate,
        corrected: false,
      });
      setScreen({ name: 'result', meal: analysis.meal, isSaved: false });
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
    setScreen({ name: 'paywall' });
  }

  async function unlockForDevelopment() {
    const nextEntitlement: EntitlementState = {
      isPremium: true,
      source: 'local_dev',
      updatedAt: new Date().toISOString(),
    };
    await entitlementRepository.saveEntitlement(nextEntitlement);
    setEntitlement(nextEntitlement);
    setScreen({ name: 'app', tab: 'home' });
  }

  function restorePurchases() {
    Alert.alert('Restore en developpement', 'La restauration sera activee avec RevenueCat dans une development build.');
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

  function renderAppShell(tab: AppTab) {
    const content =
      tab === 'timeline' ? (
        <PremiumTimelineScreen meals={meals} onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })} />
      ) : tab === 'profile' ? (
        <SuccessProfileScreen meals={meals} onEditProfile={() => setScreen({ name: 'editProfile' })} onOpenSettings={() => setScreen({ name: 'settings' })} />
      ) : (
        <PremiumHomeScreen
          meals={meals}
          targets={targets}
          onCapture={captureMeal}
          onPickPhoto={pickMealPhoto}
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
    return <OnboardingScreen userId={localUserId} onComplete={completeOnboarding} />;
  }

  if (screen.name === 'paywall') {
    return <PaywallScreen onUnlockForDevelopment={unlockForDevelopment} onRestore={restorePurchases} />;
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
        onApplyCorrection={(correction) => setScreen({ name: 'result', meal: applyMealCorrection(screen.meal, correction), isSaved: false })}
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
