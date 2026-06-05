export type ModelCostRate = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  usdPerPhoto?: number;
};

export type ScanCostInput = {
  id: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  photoCount: number;
  createdAt: string;
};

export type ScanCostEntry = ScanCostInput & {
  estimatedCostUsd: number;
};

export type CostLedger = {
  recordScan(input: ScanCostInput): ScanCostEntry;
  listEntries(): ScanCostEntry[];
  summarize(): {
    scanCount: number;
    totalCostUsd: number;
    averageCostUsd: number;
    standardScanTargetMet: boolean;
  };
};

function roundUsd(value: number): number {
  return Number(value.toFixed(6));
}

export function createCostLedger({ modelRates, standardScanTargetUsd = 0.01 }: { modelRates: Record<string, ModelCostRate>; standardScanTargetUsd?: number }): CostLedger {
  const entries: ScanCostEntry[] = [];

  function estimateCost(input: ScanCostInput): number {
    const rate = modelRates[input.modelId] ?? { inputUsdPerMillionTokens: 0, outputUsdPerMillionTokens: 0, usdPerPhoto: 0 };
    const tokenCost = ((input.inputTokens ?? 0) * rate.inputUsdPerMillionTokens + (input.outputTokens ?? 0) * rate.outputUsdPerMillionTokens) / 1_000_000;
    const photoCost = input.photoCount * (rate.usdPerPhoto ?? 0);
    return roundUsd(tokenCost + photoCost);
  }

  return {
    recordScan(input) {
      const entry = {
        ...input,
        estimatedCostUsd: estimateCost(input),
      };
      entries.push(entry);
      return entry;
    },
    listEntries() {
      return [...entries];
    },
    summarize() {
      const totalCostUsd = roundUsd(entries.reduce((sum, entry) => sum + entry.estimatedCostUsd, 0));
      const averageCostUsd = entries.length > 0 ? roundUsd(totalCostUsd / entries.length) : 0;
      return {
        scanCount: entries.length,
        totalCostUsd,
        averageCostUsd,
        standardScanTargetMet: averageCostUsd <= standardScanTargetUsd,
      };
    },
  };
}
