import type { CorrectionRecord } from '../metaboproof/correctionLoop';
import type { StorageAdapter } from './mealRepository';

const ANALYSIS_EVENTS_KEY = 'macrolens.metaboproof.analysis_events.v1';
const CORRECTIONS_KEY = 'macrolens.metaboproof.corrections.v1';
const CALIBRATIONS_KEY = 'macrolens.metaboproof.calibrations.v1';
const PERSONAL_GRAPH_KEY = 'macrolens.metaboproof.personal_graph.v1';

export type MetaboProofAnalysisEvent = {
  id: string;
  userId: string;
  mealId: string;
  modelId: string;
  provider: string;
  imageCount: number;
  scenePayload: unknown;
  tokenUsage?: unknown;
  latencyMs: number;
  costEstimateUsd: number;
  createdAt: string;
};

export type PortionCalibrationRecord = {
  id: string;
  userId: string;
  foodLabel: string;
  containerKey: string;
  estimatedGrams: number;
  verifiedGrams: number;
  residualGrams: number;
  source: string;
  createdAt: string;
};

export type PersonalFoodGraphStat = {
  userId: string;
  graphKey: string;
  graphType: string;
  statsPayload: Record<string, unknown>;
  updatedAt: string;
};

export type MetaboProofRepository = {
  saveAnalysisEvent(record: MetaboProofAnalysisEvent): Promise<void>;
  listAnalysisEvents(userId: string): Promise<MetaboProofAnalysisEvent[]>;
  saveCorrection(record: CorrectionRecord): Promise<void>;
  listCorrections(userId: string): Promise<CorrectionRecord[]>;
  replaceCorrections(userId: string, records: CorrectionRecord[]): Promise<void>;
  saveCalibration(record: PortionCalibrationRecord): Promise<void>;
  listCalibrations(userId: string): Promise<PortionCalibrationRecord[]>;
  upsertPersonalGraphStat(record: PersonalFoodGraphStat): Promise<void>;
  listPersonalGraphStats(userId: string): Promise<PersonalFoodGraphStat[]>;
  clearAll(): Promise<void>;
};

async function readCollection<T>(storage: StorageAdapter, key: string): Promise<T[]> {
  const raw = await storage.getItem(key);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

async function writeCollection<T>(storage: StorageAdapter, key: string, records: T[]): Promise<void> {
  await storage.setItem(key, JSON.stringify(records));
}

function sortByCreatedAt<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortByUpdatedAt<T extends { updatedAt: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsertById<T extends { id: string }>(records: T[], record: T): T[] {
  return [record, ...records.filter((existing) => existing.id !== record.id)];
}

function personalGraphKey(record: PersonalFoodGraphStat): string {
  return `${record.userId}:${record.graphType}:${record.graphKey}`;
}

async function removeKey(storage: StorageAdapter, key: string): Promise<void> {
  if (storage.removeItem) {
    await storage.removeItem(key);
    return;
  }

  await storage.setItem(key, JSON.stringify([]));
}

export function createMetaboProofRepository(storage: StorageAdapter): MetaboProofRepository {
  return {
    async saveAnalysisEvent(record) {
      const records = await readCollection<MetaboProofAnalysisEvent>(storage, ANALYSIS_EVENTS_KEY);
      await writeCollection(storage, ANALYSIS_EVENTS_KEY, upsertById(records, record));
    },

    async listAnalysisEvents(userId) {
      const records = await readCollection<MetaboProofAnalysisEvent>(storage, ANALYSIS_EVENTS_KEY);
      return sortByCreatedAt(records.filter((record) => record.userId === userId));
    },

    async saveCorrection(record) {
      const records = await readCollection<CorrectionRecord>(storage, CORRECTIONS_KEY);
      await writeCollection(storage, CORRECTIONS_KEY, upsertById(records, record));
    },

    async listCorrections(userId) {
      const records = await readCollection<CorrectionRecord>(storage, CORRECTIONS_KEY);
      return sortByCreatedAt(records.filter((record) => record.userId === userId));
    },

    async replaceCorrections(userId, records) {
      const existing = await readCollection<CorrectionRecord>(storage, CORRECTIONS_KEY);
      await writeCollection(storage, CORRECTIONS_KEY, [...records, ...existing.filter((record) => record.userId !== userId)]);
    },

    async saveCalibration(record) {
      const records = await readCollection<PortionCalibrationRecord>(storage, CALIBRATIONS_KEY);
      await writeCollection(storage, CALIBRATIONS_KEY, upsertById(records, record));
    },

    async listCalibrations(userId) {
      const records = await readCollection<PortionCalibrationRecord>(storage, CALIBRATIONS_KEY);
      return sortByCreatedAt(records.filter((record) => record.userId === userId));
    },

    async upsertPersonalGraphStat(record) {
      const records = await readCollection<PersonalFoodGraphStat>(storage, PERSONAL_GRAPH_KEY);
      const nextKey = personalGraphKey(record);
      await writeCollection(storage, PERSONAL_GRAPH_KEY, [record, ...records.filter((existing) => personalGraphKey(existing) !== nextKey)]);
    },

    async listPersonalGraphStats(userId) {
      const records = await readCollection<PersonalFoodGraphStat>(storage, PERSONAL_GRAPH_KEY);
      return sortByUpdatedAt(records.filter((record) => record.userId === userId));
    },

    async clearAll() {
      await Promise.all([
        removeKey(storage, ANALYSIS_EVENTS_KEY),
        removeKey(storage, CORRECTIONS_KEY),
        removeKey(storage, CALIBRATIONS_KEY),
        removeKey(storage, PERSONAL_GRAPH_KEY),
      ]);
    },
  };
}

export function createAsyncStorageMetaboProofRepository(storage: StorageAdapter): MetaboProofRepository {
  return createMetaboProofRepository(storage);
}
