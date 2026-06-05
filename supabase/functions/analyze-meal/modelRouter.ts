import { analyzeMealWithGemini } from './geminiMealAnalyzer.ts';
import { analyzeMealWithOpenAI, type ConfidenceTier, type RawMealAnalysis } from './openaiMealAnalyzer.ts';
import { fetchVisionSignals, type VisionSignals } from './visionSignalsClient.ts';

export type MealAnalysisProvider = 'openai' | 'gemini' | 'mock';

export type ProviderAttempt = {
  provider: MealAnalysisProvider;
  ok: boolean;
  confidence?: ConfidenceTier;
  latencyMs: number;
  costEstimateUsd: number;
  error?: string;
};

export type RoutedMealAnalysis = {
  raw: RawMealAnalysis;
  provider: MealAnalysisProvider;
  providerAttempts: ProviderAttempt[];
  visionSignals: { status: 'disabled' } | { status: 'ok'; signals: VisionSignals } | { status: 'failed'; warning: string };
};

type RouterEnv = {
  get(name: string): string | undefined;
};

type ProviderAdapter = (imageUrl: string, apiKey: string) => Promise<RawMealAnalysis>;

type RouterDeps = {
  adapters?: Partial<Record<MealAnalysisProvider, ProviderAdapter>>;
  fetchVisionSignals?: (imageUrl: string, serviceUrl: string) => Promise<VisionSignals>;
};

const confidenceScore: Record<ConfidenceTier, number> = {
  high: 0.9,
  medium: 0.7,
  low: 0.4,
};

function configuredProvider(env: RouterEnv): MealAnalysisProvider {
  const value = env.get('MEAL_ANALYSIS_PROVIDER');
  return value === 'gemini' || value === 'mock' || value === 'openai' ? value : 'openai';
}

function configuredFallback(env: RouterEnv): MealAnalysisProvider | 'none' {
  const value = env.get('MEAL_ANALYSIS_FALLBACK_PROVIDER');
  return value === 'gemini' || value === 'mock' || value === 'openai' || value === 'none' ? value : 'none';
}

function escalationThreshold(env: RouterEnv): number {
  const parsed = Number(env.get('MEAL_ANALYSIS_ESCALATION_THRESHOLD') ?? '0.65');
  return Number.isFinite(parsed) ? parsed : 0.65;
}

function apiKeyFor(provider: MealAnalysisProvider, env: RouterEnv): string {
  if (provider === 'mock') {
    return 'mock';
  }

  const key = provider === 'gemini' ? env.get('GEMINI_API_KEY') : env.get('OPENAI_API_KEY');
  if (!key) {
    throw new Error(`missing_${provider}_api_key`);
  }

  return key;
}

function costEstimate(provider: MealAnalysisProvider): number {
  if (provider === 'openai') {
    return 0.003;
  }

  if (provider === 'gemini') {
    return 0.0015;
  }

  return 0;
}

function validateRawMealAnalysis(raw: RawMealAnalysis): void {
  if (raw.isFoodPhoto && raw.items.length === 0) {
    throw new Error('invalid_food_items');
  }
}

function mockRawMealAnalysis(): RawMealAnalysis {
  return {
    isFoodPhoto: true,
    nonFoodReason: '',
    scanRoute: 'meal',
    visualQuality: 'usable',
    mealName: 'Poulet, riz et legumes',
    mealCategory: 'mixed_plate',
    portionSize: 'standard',
    portionAmbiguity: 'medium',
    confidence: 'medium',
    needsUserQuestion: false,
    followUpQuestion: '',
    candidateMeals: [],
    uncertaintyReasons: ['mock_provider_used'],
    hiddenCalorieRisks: ['hidden_oil_or_sauce_possible'],
    items: [
      {
        name: 'Poulet grille',
        canonicalFoodName: 'chicken breast cooked',
        estimatedQuantity: 140,
        quantityLow: 110,
        quantityHigh: 180,
        quantityP10: 110,
        quantityP50: 140,
        quantityP90: 180,
        unit: 'g',
        calories: 231,
        calorieP10: 180,
        calorieP50: 231,
        calorieP90: 300,
        proteinG: 43.4,
        carbsG: 0,
        fatG: 5,
        fiberG: 0,
        confidence: 'medium',
        portionConfidence: 'medium',
        role: 'protein',
        visualEvidence: ['mock meal item'],
        hiddenCalorieRisks: [],
      },
    ],
  };
}

async function maybeFetchVisionSignals(
  imageUrl: string,
  env: RouterEnv,
  fetcher: (imageUrl: string, serviceUrl: string) => Promise<VisionSignals>,
): Promise<RoutedMealAnalysis['visionSignals']> {
  if (env.get('VISION_SIGNALS_PROVIDER') !== 'external') {
    return { status: 'disabled' };
  }

  const serviceUrl = env.get('VISION_SIGNALS_URL');
  if (!serviceUrl) {
    return { status: 'failed', warning: 'vision_signals_url_missing' };
  }

  try {
    return { status: 'ok', signals: await fetcher(imageUrl, serviceUrl) };
  } catch (error) {
    return { status: 'failed', warning: error instanceof Error ? error.message : 'vision_signals_failed' };
  }
}

export async function analyzeMealWithModelRouter(imageUrl: string, env: RouterEnv, deps: RouterDeps = {}): Promise<RoutedMealAnalysis> {
  const adapters: Record<MealAnalysisProvider, ProviderAdapter> = {
    openai: deps.adapters?.openai ?? analyzeMealWithOpenAI,
    gemini: deps.adapters?.gemini ?? analyzeMealWithGemini,
    mock: deps.adapters?.mock ?? (async () => mockRawMealAnalysis()),
  };
  const attempts: ProviderAttempt[] = [];
  const primaryProvider = configuredProvider(env);
  const fallbackProvider = configuredFallback(env);
  const threshold = escalationThreshold(env);
  const visionSignals = await maybeFetchVisionSignals(imageUrl, env, deps.fetchVisionSignals ?? fetchVisionSignals);

  async function tryProvider(provider: MealAnalysisProvider): Promise<RawMealAnalysis | null> {
    const startedAt = Date.now();

    try {
      const raw = await adapters[provider](imageUrl, apiKeyFor(provider, env));
      validateRawMealAnalysis(raw);
      attempts.push({
        provider,
        ok: true,
        confidence: raw.confidence,
        latencyMs: Date.now() - startedAt,
        costEstimateUsd: costEstimate(provider),
      });
      return raw;
    } catch (error) {
      attempts.push({
        provider,
        ok: false,
        latencyMs: Date.now() - startedAt,
        costEstimateUsd: 0,
        error: error instanceof Error ? error.message : 'provider_failed',
      });
      return null;
    }
  }

  const primaryRaw = await tryProvider(primaryProvider);
  let selectedProvider = primaryProvider;
  let selectedRaw = primaryRaw;

  if (
    fallbackProvider !== 'none' &&
    fallbackProvider !== primaryProvider &&
    (!primaryRaw || confidenceScore[primaryRaw.confidence] < threshold)
  ) {
    const fallbackRaw = await tryProvider(fallbackProvider);
    if (fallbackRaw) {
      selectedProvider = fallbackProvider;
      selectedRaw = fallbackRaw;
    }
  }

  if (!selectedRaw) {
    throw new Error(attempts.at(-1)?.error ?? 'analysis_provider_failed');
  }

  if (visionSignals.status === 'failed') {
    selectedRaw = {
      ...selectedRaw,
      uncertaintyReasons: Array.from(new Set([...selectedRaw.uncertaintyReasons, 'vision_signals_unavailable'])),
    };
  }

  return {
    raw: selectedRaw,
    provider: selectedProvider,
    providerAttempts: attempts,
    visionSignals,
  };
}
