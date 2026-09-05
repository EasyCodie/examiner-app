import {
  ExamManifest,
  ExamSession,
  QuestionSubmission,
  CanvasStroke,
} from '@/types/exam';
import { renderStrokesToPng } from '@/lib/canvasUtils';

export interface SubmissionCompilerInput {
  manifest: ExamManifest;
  pageStrokes: Record<number, CanvasStroke[]>;
  pageBoxStrokes: Record<number, Record<string, CanvasStroke[]>>;
  activeBoxImages?: Record<string, string>;
  livePageImage?: string;
  activePageNumber: number;
  distinctQuestionPages: number[];
  timeRemainingSeconds: number;
  humanitiesSubmissions?: Record<string, QuestionSubmission>;
  existingSubmissions?: Record<string, QuestionSubmission>;
  sessionId?: string;
}

/**
 * Deep Module: Compiles handwritten strokes, live canvas snapshots, and per-box subpart working
 * into authoritative QuestionSubmission items and initializes the ExamSession entity.
 */
export function compileMockSession(input: SubmissionCompilerInput): {
  session: ExamSession;
  submissions: Record<string, QuestionSubmission>;
} {
  const {
    manifest,
    pageStrokes,
    pageBoxStrokes,
    activeBoxImages = {},
    livePageImage,
    activePageNumber,
    distinctQuestionPages,
    timeRemainingSeconds,
    humanitiesSubmissions,
    existingSubmissions = {},
    sessionId = `session-${Date.now()}`,
  } = input;

  // 1. If humanities paper, use the structured humanities essay submissions
  if (manifest.category === 'HUMANITIES' && humanitiesSubmissions) {
    const finalSubmissions: Record<string, QuestionSubmission> = {};
    const elapsedTotalSeconds = Math.max(0, manifest.durationMinutes * 60 - timeRemainingSeconds);
    const timePerQuestion = Math.round(elapsedTotalSeconds / Math.max(1, manifest.questions.length));

    for (const q of manifest.questions) {
      const sub = humanitiesSubmissions[q.id];
      finalSubmissions[q.id] = {
        questionId: q.id,
        questionNumber: q.number,
        textResponse: sub?.textResponse || '',
        diagramImageBase64: sub?.diagramImageBase64 || undefined,
        timeSpentSeconds: sub?.timeSpentSeconds || timePerQuestion,
      };
    }

    const finalSession: ExamSession = {
      id: sessionId,
      paperId: manifest.id,
      paperTitle: manifest.title,
      subjectCategory: manifest.category,
      mode: 'TIMED_MOCK',
      startedAt: new Date().toISOString(),
      timeRemainingSeconds,
      durationSeconds: manifest.durationMinutes * 60,
      submissions: finalSubmissions,
    };
    return { session: finalSession, submissions: finalSubmissions };
  }

  // 2. For STEM papers, rasterize page scans and extract subpart box workings
  const pageImages: Record<number, string> = {};
  if (livePageImage) {
    pageImages[activePageNumber] = livePageImage;
  }

  for (const pageNum of distinctQuestionPages) {
    if (!pageImages[pageNum]) {
      const strokes = pageStrokes[pageNum] || [];
      if (strokes.length > 0) {
        pageImages[pageNum] = renderStrokesToPng(strokes);
      }
    }
  }

  const updatedSubmissions: Record<string, QuestionSubmission> = { ...existingSubmissions };
  const timePerQuestion = Math.round(
    (manifest.durationMinutes * 60 - timeRemainingSeconds) / Math.max(1, manifest.questions.length)
  );

  for (const q of manifest.questions) {
    const pageImg = pageImages[q.pageNumber];
    const existingSub = updatedSubmissions[q.id];

    const singleBoxImg = activeBoxImages[q.id] || (
      pageBoxStrokes[q.pageNumber]?.[q.id]?.length
        ? renderStrokesToPng(pageBoxStrokes[q.pageNumber][q.id])
        : undefined
    );
    const canvasImg = singleBoxImg || pageImg || existingSub?.canvasImageBase64 || undefined;

    // Subpart images mapping for multi-part questions
    const subImages: Record<string, string> = {};
    if (q.subparts && q.subparts.length > 0) {
      q.subparts.forEach((sub, sIdx) => {
        const boxId = sub.id || `${q.id}_${sIdx}`;
        if (activeBoxImages[boxId]) {
          subImages[boxId] = activeBoxImages[boxId];
        } else if (pageBoxStrokes[q.pageNumber]?.[boxId]?.length) {
          subImages[boxId] = renderStrokesToPng(pageBoxStrokes[q.pageNumber][boxId]);
        }
      });
    }

    updatedSubmissions[q.id] = {
      questionId: q.id,
      questionNumber: q.number,
      canvasImageBase64: canvasImg,
      subpartImages: Object.keys(subImages).length > 0 ? subImages : undefined,
      boxStrokes: pageBoxStrokes[q.pageNumber],
      timeSpentSeconds: existingSub?.timeSpentSeconds || timePerQuestion,
    };
  }

  const initialSession: ExamSession = {
    id: sessionId,
    paperId: manifest.id,
    paperTitle: manifest.title,
    subjectCategory: manifest.category,
    mode: 'TIMED_MOCK',
    startedAt: new Date().toISOString(),
    timeRemainingSeconds,
    durationSeconds: manifest.durationMinutes * 60,
    submissions: updatedSubmissions,
  };

  return { session: initialSession, submissions: updatedSubmissions };
}
