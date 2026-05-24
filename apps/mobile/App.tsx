import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { isNonFoodPhotoError } from './src/analysis/analysisErrors';
import { createAnalysisService } from './src/analysis/analysisServiceFactory';
import { appEnv } from './src/config/env';
import { applyMealCorrection } from './src/domain/corrections';
import { createManualMacroMeal } from './src/domain/manualMeal';
import type { MacroTargets, Meal, UserGoal, UserProfile } from './src/domain/types';
import { createMealRepository } from './src/storage/mealRepository';
import { createProfileRepository } from './src/storage/profileRepository';
import { colors } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ManualMealScreen } from './src/screens/ManualMealScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TargetsScreen } from './src/screens/TargetsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';

type ScreenState =
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'analyzing'; imageUri: string }
  | { name: 'result'; meal: Meal; isSaved: boolean }
  | { name: 'timeline' }
  | { name: 'profile' }
  | { name: 'targets' }
  | { name: 'today' }
  | { name: 'settings' }
  | { name: 'manualMeal' };

const queryClient = new QueryClient();
const localUserId = 'local-user';

function MacroLensApp() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'onboarding' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const repository = useMemo(() => createMealRepository(AsyncStorage), []);
  const profileRepository = useMemo(() => createProfileRepository(AsyncStorage), []);
  const analysisService = useMemo(() => createAnalysisService(appEnv), []);
  const targets: MacroTargets | null = profile?.targets ?? null;

  useEffect(() => {
    repository
      .listMeals()
      .then(setMeals)
      .catch(() => setMeals([]));
  }, [repository]);

  useEffect(() => {
    profileRepository
      .getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [profileRepository]);

  async function analyzeImageUri(imageUri: string) {
    setScreen({ name: 'analyzing', imageUri });

    try {
      const analysis = await analysisService.analyzeMealPhoto({ imageUri, userId: localUserId });
      setScreen({ name: 'result', meal: analysis.meal, isSaved: false });
    } catch (error) {
      if (isNonFoodPhotoError(error)) {
        Alert.alert('Photo non reconnue', error.userMessage);
        setScreen({ name: 'home' });
        return;
      }

      Alert.alert('Analyse impossible', 'Reessaie avec une photo plus claire ou ajoute le repas manuellement.');
      setScreen({ name: 'home' });
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

  function quickAddMeal() {
    setScreen({ name: 'manualMeal' });
  }

  function completeOnboarding(_goal: UserGoal) {
    setScreen({ name: 'home' });
  }

  async function saveMeal(meal: Meal) {
    await repository.saveMeal(meal);
    const nextMeals = await repository.listMeals();
    setMeals(nextMeals);
    setScreen({ name: 'home' });
  }

  async function saveProfile(nextProfile: UserProfile) {
    await profileRepository.saveProfile(nextProfile);
    setProfile(nextProfile);
    setScreen({ name: 'home' });
  }

  async function clearMeals() {
    await repository.clearMeals();
    setMeals([]);
    setScreen({ name: 'home' });
  }

  function saveManualMeal(input: { name: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }) {
    const meal = createManualMacroMeal({ userId: localUserId, ...input });
    setScreen({ name: 'result', meal, isSaved: false });
  }

  if (screen.name === 'onboarding') {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  if (screen.name === 'analyzing') {
    return <AnalyzingScreen imageUri={screen.imageUri} />;
  }

  if (screen.name === 'result') {
    return (
      <ResultScreen
        meal={screen.meal}
        onApplyCorrection={(correction) =>
          setScreen({
            name: 'result',
            meal: applyMealCorrection(screen.meal, correction),
            isSaved: false,
          })
        }
        onBack={() => setScreen({ name: 'home' })}
        onSave={() => saveMeal(screen.meal)}
      />
    );
  }

  if (screen.name === 'timeline') {
    return (
      <TimelineScreen
        meals={meals}
        onBack={() => setScreen({ name: 'home' })}
        onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
      />
    );
  }

  if (screen.name === 'profile') {
    return <ProfileScreen profile={profile} userId={localUserId} onBack={() => setScreen({ name: 'home' })} onSave={saveProfile} />;
  }

  if (screen.name === 'targets') {
    return (
      <TargetsScreen
        profile={profile}
        onBack={() => setScreen({ name: 'home' })}
        onCreateProfile={() => setScreen({ name: 'profile' })}
        onSave={saveProfile}
      />
    );
  }

  if (screen.name === 'today') {
    return (
      <TodayScreen
        meals={meals}
        targets={targets}
        onBack={() => setScreen({ name: 'home' })}
        onCapture={captureMeal}
        onPickPhoto={pickMealPhoto}
        onManualMeal={() => setScreen({ name: 'manualMeal' })}
        onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
      />
    );
  }

  if (screen.name === 'settings') {
    return (
      <SettingsScreen
        analysisMode={appEnv.analysisMode}
        mealCount={meals.length}
        onBack={() => setScreen({ name: 'home' })}
        onOpenProfile={() => setScreen({ name: 'profile' })}
        onOpenTargets={() => setScreen({ name: 'targets' })}
        onClearMeals={clearMeals}
      />
    );
  }

  if (screen.name === 'manualMeal') {
    return <ManualMealScreen onBack={() => setScreen({ name: 'home' })} onSave={saveManualMeal} />;
  }

  return (
    <HomeScreen
      meals={meals}
      targets={targets}
      onCapture={captureMeal}
      onPickPhoto={pickMealPhoto}
      onQuickAdd={quickAddMeal}
      onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
      onOpenTimeline={() => setScreen({ name: 'timeline' })}
      onOpenToday={() => setScreen({ name: 'today' })}
      onOpenProfile={() => {
        if (profile) {
          setScreen({ name: 'targets' });
          return;
        }

        setScreen({ name: 'profile' });
      }}
      onOpenSettings={() => setScreen({ name: 'settings' })}
    />
  );
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
