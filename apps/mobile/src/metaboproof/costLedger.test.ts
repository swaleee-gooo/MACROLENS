import { describe, expect, it } from 'vitest';
import { createCostLedger } from './costLedger';

describe('MetaboProof cost ledger', () => {
  it('logs every AI scan and estimates scan cost from token usage', () => {
    const ledger = createCostLedger({
      modelRates: {
        'gemini-2.5-flash-lite': { inputUsdPerMillionTokens: 0.1, outputUsdPerMillionTokens: 0.4 },
      },
    });

    const entry = ledger.recordScan({
      id: 'scan-1',
      modelId: 'gemini-2.5-flash-lite',
      inputTokens: 1000,
      outputTokens: 500,
      photoCount: 1,
      createdAt: '2026-06-04T10:00:00.000Z',
    });

    expect(entry.estimatedCostUsd).toBe(0.0003);
    expect(ledger.listEntries()).toHaveLength(1);
    expect(ledger.summarize().standardScanTargetMet).toBe(true);
  });
});
