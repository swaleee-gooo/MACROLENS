import { evaluateRepeatability, type MacroSnapshot, type RepeatabilityReport, type RepeatabilityThresholds } from './repeatabilityMetrics';

type FunctionInvokeResult = {
  data: unknown;
  error: unknown;
};

type FunctionsClient = {
  invoke(name: string, options: { body: { imageUrl: string } }): Promise<FunctionInvokeResult>;
};

type AnalyzeMealPayload = {
  meal?: {
    mealName?: unknown;
    caloriesEstimate?: unknown;
    proteinG?: unknown;
    carbsG?: unknown;
    fatG?: unknown;
    fiberG?: unknown;
    confidence?: unknown;
    source?: unknown;
  };
};

export type RepeatabilityRun = {
  index: number;
  mealName: string;
  confidence: string;
  source: string;
  macros: MacroSnapshot;
};

export type RepeatabilityBenchmarkOptions = {
  imageUrl: string;
  runCount?: number;
  functionName?: string;
  delayMs?: number;
  thresholds?: RepeatabilityThresholds;
};

export type RepeatabilityBenchmarkResult = {
  imageUrl: string;
  runs: RepeatabilityRun[];
  report: RepeatabilityReport;
};

function numberField(value: unknown, fieldName: keyof MacroSnapshot): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`repeatability_missing_${fieldName}`);
  }

  return value;
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function parseRun(index: number, payload: unknown): RepeatabilityRun {
  const meal = (payload as AnalyzeMealPayload | null)?.meal;
  if (!meal) {
    throw new Error(`repeatability_missing_meal_${index}`);
  }

  return {
    index,
    mealName: stringField(meal.mealName, 'Repas analyse'),
    confidence: stringField(meal.confidence, 'unknown'),
    source: stringField(meal.source, 'unknown'),
    macros: {
      caloriesEstimate: numberField(meal.caloriesEstimate, 'caloriesEstimate'),
      proteinG: numberField(meal.proteinG, 'proteinG'),
      carbsG: numberField(meal.carbsG, 'carbsG'),
      fatG: numberField(meal.fatG, 'fatG'),
      fiberG: numberField(meal.fiberG, 'fiberG'),
    },
  };
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function runRepeatabilityBenchmark(
  functions: FunctionsClient,
  {
    imageUrl,
    runCount = 5,
    functionName = 'analyze-meal',
    delayMs = 0,
    thresholds,
  }: RepeatabilityBenchmarkOptions,
): Promise<RepeatabilityBenchmarkResult> {
  const runs: RepeatabilityRun[] = [];

  for (let index = 1; index <= runCount; index += 1) {
    if (index > 1 && delayMs > 0) {
      await wait(delayMs);
    }

    const result = await functions.invoke(functionName, {
      body: { imageUrl },
    });

    if (result.error) {
      throw new Error(`repeatability_invoke_failed_${index}`);
    }

    runs.push(parseRun(index, result.data));
  }

  return {
    imageUrl,
    runs,
    report: evaluateRepeatability(
      runs.map((run) => run.macros),
      thresholds,
    ),
  };
}
