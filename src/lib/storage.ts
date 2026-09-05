'use client';

import { get, set, keys, del } from 'idb-keyval';
import { ExamManifest, ExamSession, PageStrokes, AiStudioConfig } from '@/types/exam';
import { ALL_BUNDLED_PAPERS } from './samplePapers';

const MANIFESTS_PREFIX = 'manifest:';
const PDF_BLOB_PREFIX = 'pdf:';
const STROKES_PREFIX = 'strokes:';
const SESSIONS_PREFIX = 'session:';
const CONFIG_KEY = 'examiner:aistudio:config';

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

// Config
export async function getAiConfig(): Promise<AiStudioConfig> {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  try {
    const stored = await get<AiStudioConfig>(CONFIG_KEY);
    return stored ? { ...DEFAULT_AI_CONFIG, ...stored } : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export async function saveAiConfig(config: Partial<AiStudioConfig>): Promise<AiStudioConfig> {
  const current = await getAiConfig();
  const updated = { ...current, ...config };
  await set(CONFIG_KEY, updated);
  return updated;
}

// Manifests
export async function getAllManifests(): Promise<ExamManifest[]> {
  if (typeof window === 'undefined') return ALL_BUNDLED_PAPERS;
  try {
    const allKeys = await keys();
    const manifestKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(MANIFESTS_PREFIX));
    const userManifests: ExamManifest[] = [];
    for (const key of manifestKeys) {
      const item = await get<ExamManifest>(key);
      if (item) userManifests.push(item);
    }
    // Combine bundled + user uploaded
    return [...ALL_BUNDLED_PAPERS, ...userManifests];
  } catch (err) {
    console.error('Error loading manifests from IDB', err);
    return ALL_BUNDLED_PAPERS;
  }
}

export async function getManifestById(id: string): Promise<ExamManifest | null> {
  const bundled = ALL_BUNDLED_PAPERS.find((p) => p.id === id);
  if (bundled) return bundled;
  if (typeof window === 'undefined') return null;
  return (await get<ExamManifest>(`${MANIFESTS_PREFIX}${id}`)) || null;
}

export async function saveManifest(manifest: ExamManifest): Promise<void> {
  await set(`${MANIFESTS_PREFIX}${manifest.id}`, manifest);
}

// PDF Blobs
export async function savePdfBlob(id: string, type: 'paper' | 'markscheme', blob: Blob): Promise<void> {
  await set(`${PDF_BLOB_PREFIX}${id}:${type}`, blob);
}

export async function getPdfBlob(id: string, type: 'paper' | 'markscheme'): Promise<Blob | null> {
  return (await get<Blob>(`${PDF_BLOB_PREFIX}${id}:${type}`)) || null;
}

// Canvas Strokes
export async function savePageStrokes(sessionId: string, pageNumber: number, strokes: PageStrokes): Promise<void> {
  await set(`${STROKES_PREFIX}${sessionId}:p${pageNumber}`, strokes);
}

export async function getPageStrokes(sessionId: string, pageNumber: number): Promise<PageStrokes | null> {
  return (await get<PageStrokes>(`${STROKES_PREFIX}${sessionId}:p${pageNumber}`)) || null;
}

// Exam Sessions
export async function saveExamSession(session: ExamSession): Promise<void> {
  await set(`${SESSIONS_PREFIX}${session.id}`, session);
}

export async function getExamSession(id: string): Promise<ExamSession | null> {
  return (await get<ExamSession>(`${SESSIONS_PREFIX}${id}`)) || null;
}

export async function getAllExamSessions(): Promise<ExamSession[]> {
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
}

export async function deleteExamSession(id: string): Promise<void> {
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
}

export async function clearAllExamSessions(): Promise<void> {
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
}
