'use client';

import { get, set, keys, del } from 'idb-keyval';
import { ExamManifest, ExamSession, PageStrokes, AiStudioConfig } from '@/types/exam';
import { ALL_BUNDLED_PAPERS } from '../samplePapers';

export const MANIFESTS_PREFIX = 'manifest:';
export const PDF_BLOB_PREFIX = 'pdf:';
export const STROKES_PREFIX = 'strokes:';
export const SESSIONS_PREFIX = 'session:';
export const CONFIG_KEY = 'examiner:aistudio:config';

export const DEFAULT_AI_CONFIG: AiStudioConfig = {
  modelName: 'gemini-3.6-flash',
  gradingReasoningEffort: 'high',
  socraticReasoningEffort: 'low',
  thinkingBudgetGrading: 8192,
  thinkingBudgetSocratic: 2048,
  temperature: 0.2,
  ocrProvider: 'glm-ocr',
  zaiApiKey: '',
};

export interface ExamManifestFacet {
  getAll(): Promise<ExamManifest[]>;
  getById(id: string): Promise<ExamManifest | null>;
  save(manifest: ExamManifest): Promise<void>;
  savePdfBlob(id: string, type: 'paper' | 'markscheme', blob: Blob): Promise<void>;
  getPdfBlob(id: string, type: 'paper' | 'markscheme'): Promise<Blob | null>;
}

export interface ExamSessionFacet {
  getAll(): Promise<ExamSession[]>;
  getById(id: string): Promise<ExamSession | null>;
  save(session: ExamSession): Promise<void>;
  delete(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface ExamStrokesFacet {
  get(sessionId: string, pageNumber: number): Promise<PageStrokes | null>;
  save(sessionId: string, pageNumber: number, strokes: PageStrokes): Promise<void>;
}

export interface ExamConfigFacet {
  get(): Promise<AiStudioConfig>;
  save(config: Partial<AiStudioConfig>): Promise<AiStudioConfig>;
}

export interface ExamRepository {
  manifests: ExamManifestFacet;
  sessions: ExamSessionFacet;
  strokes: ExamStrokesFacet;
  config: ExamConfigFacet;
}

/**
 * Deep Module: Faceted Exam Domain Repository.
 * Encapsulates IndexedDB prefix conventions, bundled paper merges, SSR safety guards,
 * and cascading stroke cleanup.
 */
export const examRepo: ExamRepository = {
  manifests: {
    async getAll(): Promise<ExamManifest[]> {
      if (typeof window === 'undefined') return ALL_BUNDLED_PAPERS;
      try {
        const allKeys = await keys();
        const manifestKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(MANIFESTS_PREFIX));
        const userManifests: ExamManifest[] = [];
        for (const key of manifestKeys) {
          const item = await get<ExamManifest>(key);
          if (item) userManifests.push(item);
        }
        return [...ALL_BUNDLED_PAPERS, ...userManifests];
      } catch (err) {
        console.error('Error loading manifests from IDB', err);
        return ALL_BUNDLED_PAPERS;
      }
    },

    async getById(id: string): Promise<ExamManifest | null> {
      const bundled = ALL_BUNDLED_PAPERS.find((p) => p.id === id);
      if (bundled) return bundled;
      if (typeof window === 'undefined') return null;
      return (await get<ExamManifest>(`${MANIFESTS_PREFIX}${id}`)) || null;
    },

    async save(manifest: ExamManifest): Promise<void> {
      await set(`${MANIFESTS_PREFIX}${manifest.id}`, manifest);
    },

    async savePdfBlob(id: string, type: 'paper' | 'markscheme', blob: Blob): Promise<void> {
      await set(`${PDF_BLOB_PREFIX}${id}:${type}`, blob);
    },

    async getPdfBlob(id: string, type: 'paper' | 'markscheme'): Promise<Blob | null> {
      return (await get<Blob>(`${PDF_BLOB_PREFIX}${id}:${type}`)) || null;
    },
  },

  sessions: {
    async getAll(): Promise<ExamSession[]> {
      if (typeof window === 'undefined') return [];
      try {
        const allKeys = await keys();
        const sessionKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(SESSIONS_PREFIX));
        const sessions: ExamSession[] = [];
        for (const key of sessionKeys) {
          const item = await get<ExamSession>(key);
          if (item) sessions.push(item);
        }
        return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      } catch (err) {
        console.error('Error loading sessions from IDB', err);
        return [];
      }
    },

    async getById(id: string): Promise<ExamSession | null> {
      return (await get<ExamSession>(`${SESSIONS_PREFIX}${id}`)) || null;
    },

    async save(session: ExamSession): Promise<void> {
      await set(`${SESSIONS_PREFIX}${session.id}`, session);
    },

    async delete(id: string): Promise<void> {
      if (typeof window === 'undefined') return;
      try {
        await del(`${SESSIONS_PREFIX}${id}`);
        const allKeys = await keys();
        const strokeKeys = allKeys.filter(
          (k) => typeof k === 'string' && k.startsWith(`${STROKES_PREFIX}${id}:`)
        );
        for (const sk of strokeKeys) {
          await del(sk);
        }
      } catch (err) {
        console.error('Error deleting exam session from IDB', err);
      }
    },

    async clearAll(): Promise<void> {
      if (typeof window === 'undefined') return;
      try {
        const allKeys = await keys();
        const sessionAndStrokeKeys = allKeys.filter(
          (k) =>
            typeof k === 'string' &&
            (k.startsWith(SESSIONS_PREFIX) || k.startsWith(STROKES_PREFIX))
        );
        for (const k of sessionAndStrokeKeys) {
          await del(k);
        }
      } catch (err) {
        console.error('Error clearing all exam sessions from IDB', err);
      }
    },
  },

  strokes: {
    async get(sessionId: string, pageNumber: number): Promise<PageStrokes | null> {
      return (await get<PageStrokes>(`${STROKES_PREFIX}${sessionId}:p${pageNumber}`)) || null;
    },

    async save(sessionId: string, pageNumber: number, strokes: PageStrokes): Promise<void> {
      await set(`${STROKES_PREFIX}${sessionId}:p${pageNumber}`, strokes);
    },
  },

  config: {
    async get(): Promise<AiStudioConfig> {
      if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
      try {
        const stored = await get<AiStudioConfig>(CONFIG_KEY);
        return stored ? { ...DEFAULT_AI_CONFIG, ...stored } : DEFAULT_AI_CONFIG;
      } catch {
        return DEFAULT_AI_CONFIG;
      }
    },

    async save(config: Partial<AiStudioConfig>): Promise<AiStudioConfig> {
      const current = await examRepo.config.get();
      const updated = { ...current, ...config };
      await set(CONFIG_KEY, updated);
      return updated;
    },
  },
};
