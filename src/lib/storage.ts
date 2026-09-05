'use client';

import { ExamManifest, ExamSession, PageStrokes, AiStudioConfig } from '@/types/exam';
import {
  examRepo,
  DEFAULT_AI_CONFIG,
  ExamRepository,
  ExamManifestFacet,
  ExamSessionFacet,
  ExamStrokesFacet,
  ExamConfigFacet,
} from './storage/examRepository';

export {
  examRepo,
  DEFAULT_AI_CONFIG,
  type ExamRepository,
  type ExamManifestFacet,
  type ExamSessionFacet,
  type ExamStrokesFacet,
  type ExamConfigFacet,
};

// Facade Delegates (Preserving 100% Backward Compatibility)

// Config
export const getAiConfig = (): Promise<AiStudioConfig> => examRepo.config.get();
export const saveAiConfig = (config: Partial<AiStudioConfig>): Promise<AiStudioConfig> => examRepo.config.save(config);

// Manifests
export const getAllManifests = (): Promise<ExamManifest[]> => examRepo.manifests.getAll();
export const getManifestById = (id: string): Promise<ExamManifest | null> => examRepo.manifests.getById(id);
export const saveManifest = (manifest: ExamManifest): Promise<void> => examRepo.manifests.save(manifest);

// PDF Blobs
export const savePdfBlob = (id: string, type: 'paper' | 'markscheme', blob: Blob): Promise<void> =>
  examRepo.manifests.savePdfBlob(id, type, blob);
export const getPdfBlob = (id: string, type: 'paper' | 'markscheme'): Promise<Blob | null> =>
  examRepo.manifests.getPdfBlob(id, type);

// Canvas Strokes
export const savePageStrokes = (sessionId: string, pageNumber: number, strokes: PageStrokes): Promise<void> =>
  examRepo.strokes.save(sessionId, pageNumber, strokes);
export const getPageStrokes = (sessionId: string, pageNumber: number): Promise<PageStrokes | null> =>
  examRepo.strokes.get(sessionId, pageNumber);

// Exam Sessions
export const saveExamSession = (session: ExamSession): Promise<void> => examRepo.sessions.save(session);
export const getExamSession = (id: string): Promise<ExamSession | null> => examRepo.sessions.getById(id);
export const getAllExamSessions = (): Promise<ExamSession[]> => examRepo.sessions.getAll();
export const deleteExamSession = (id: string): Promise<void> => examRepo.sessions.delete(id);
export const clearAllExamSessions = (): Promise<void> => examRepo.sessions.clearAll();
