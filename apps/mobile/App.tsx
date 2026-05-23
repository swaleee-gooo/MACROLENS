import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { createAnalysisService } from './src/analysis/analysisServiceFactory';
import { appEnv } from './src/config/env';
import { applyMealCorrection } from './src/domain/corrections';
import { recalculateMeal } from './src/domain/nutrition';
import type { FoodItem, Meal, UserGoal } from './src/domain/types';
import { createMealRepository } from './src/storage/mealRepository';
import { colors } from './src/ui/theme';
import { AnalyzingScreen } from './src/screens/AnalyzingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';

type ScreenState =
  | { name: 'onboarding' }
  | { name: 'home' }
  | { name: 'analyzing'; imageUri: string }
  | { name: 'result'; meal: Meal; isSaved: boolean }
  | { name: 'timeline' };

const queryClient = new QueryClient();
const localUserId = 'local-user';

function createManualMeal(userId: string): Meal {
  const mealId = `manual-${Date.now()}`;
  const items: FoodItem[] = [
    {
      id: `${mealId}-protein-bowl`,
      mealId,
      name: 'Repas rapide',
      canonicalFoodName: 'balanced mixed meal',
      estimatedQuantity: 1,
      unit: 'portion',
      calories: 520,
      proteinG: 32,
      carbsG: 55,
      fatG: 18,
      fiberG: 8,
      confidence: 'low',
      dataSource: 'estimated',
      sourceFoodId: null,
    },
  ];

  return recalculateMeal({
    id: mealId,
    userId,
    imageUri: 'manual://quick-add',
    capturedAt: new Date().toISOString(),
    mealName: 'Repas manuel',
    caloriesEstimate: 0,
    caloriesLow: 0,
    caloriesHigh: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    confidence: 'low',
    notes: 'Quick add modifiable depuis les corrections.',
    source: 'estimated',
    items,
  });
}

function MacroLensApp() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'onboarding' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const repository = useMemo(() => createMealRepository(AsyncStorage), []);
  const analysisService = useMemo(() => createAnalysisService(appEnv), []);

  useEffect(() => {
    repository
      .listMeals()
      .then(setMeals)
      .catch(() => setMeals([]));
  }, [repository]);

  async function analyzeImageUri(imageUri: string) {
    setScreen({ name: 'analyzing', imageUri });

    try {
      const analysis = await analysisService.analyzeMealPhoto({ imageUri, userId: localUserId });
      setScreen({ name: 'result', meal: analysis.meal, isSaved: false });
    } catch {
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
    setScreen({ name: 'result', meal: createManualMeal(localUserId), isSaved: false });
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

  return (
    <HomeScreen
      meals={meals}
      onCapture={captureMeal}
      onPickPhoto={pickMealPhoto}
      onQuickAdd={quickAddMeal}
      onOpenMeal={(meal) => setScreen({ name: 'result', meal, isSaved: true })}
      onOpenTimeline={() => setScreen({ name: 'timeline' })}
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
