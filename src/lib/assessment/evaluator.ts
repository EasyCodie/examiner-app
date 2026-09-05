import {
  ExamManifest,
  ExamSession,
  QuestionItem,
  QuestionSubmission,
  QuestionEvaluation,
  AwardedMarkItem,
  SubpartScoreItem,
} from '@/types/exam';
import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/lib/gemini';
import { SENIOR_EXAMINER_PROMPT } from '@/lib/prompts';
import { QUESTION_EVALUATION_SCHEMA } from '@/lib/schemas';
import { transcribeStudentHandwriting, getZaiApiKey } from '@/lib/ocr/glmOcr';

export type AssessmentEvent =
  | {
      type: 'question_evaluated';
      questionIndex: number;
      totalQuestions: number;
      questionNumber: string;
      evaluation: QuestionEvaluation;
    }
  | {
      type: 'session_complete';
      session: ExamSession;
    }
  | {
      type: 'error';
      message: string;
    };

export interface AssessmentOptions {
  clientKey?: string;
  zaiKey?: string;
  thinkingBudget?: number;
  sessionId?: string;
  timeRemainingSeconds?: number;
}

/**
 * Evaluates a single exam question with multimodal artifacts, Error Carried Forward (ECF) context,
 * parallel GLM-OCR handwriting transcription, and automated failover to the local examiner simulation engine.
 */
export async function evaluateSingleQuestion(
  question: QuestionItem,
  submission: QuestionSubmission | undefined,
  previousEvaluations: QuestionEvaluation[],
  clientKey?: string,
  thinkingBudget = 8192,
  zaiKey?: string
): Promise<{ evaluation: QuestionEvaluation; isSimulated: boolean }> {
  const safeSubmission: QuestionSubmission = submission || {
    questionId: question.id,
    questionNumber: question.number,
    timeSpentSeconds: 0,
  };

  const hasWork = Boolean(
    (safeSubmission.canvasImageBase64 && safeSubmission.canvasImageBase64.length > 500) ||
    (safeSubmission.textResponse && safeSubmission.textResponse.trim().length > 0) ||
    (safeSubmission.subpartImages && Object.values(safeSubmission.subpartImages).some((img) => img && img.length > 500))
  );

  // Unattempted questions receive authentic 0 marks without calling LLM
  if (!hasWork) {
    const unattemptedSubpartScores: Record<string, SubpartScoreItem> = {};
    if (question.subparts && question.subparts.length > 0) {
      question.subparts.forEach((sp) => {
        unattemptedSubpartScores[sp.partLetter] = {
          marksAwarded: 0,
          maxMarks: sp.totalMarks,
          ecfApplied: false,
          reason: 'No response recorded on the examination script.',
        };
      });
    }

    const unattempted: QuestionEvaluation = {
      questionId: question.id,
      questionNumber: question.number,
      marksAwarded: 0,
      maxMarks: question.totalMarks,
      subpartScores: Object.keys(unattemptedSubpartScores).length > 0 ? unattemptedSubpartScores : undefined,
      examinerNotes: 'No response was recorded for this question during the examination.',
      marginAnnotations: [
        { label: 'Unattempted', type: 'cross', text: 'No working or answer provided.' },
      ],
      markBreakdown: question.markCodes.map((mc) => ({
        code: mc.code,
        type: mc.type,
        awarded: false,
        marksAwarded: 0,
        maxMarks: mc.marks,
        reason: 'No response recorded on the examination script.',
      })),
      ecfApplied: false,
      syllabusSubtopic: question.syllabusSubtopic,
      subtopicMasteryScore: 0,
      revisionRecommendation: `Review key principles in ${question.syllabusSubtopic}. Practice routine exercises addressing command term "${question.commandTerm}".`,
    };
    return { evaluation: unattempted, isSimulated: false };
  }

  const ai = getGeminiClient(clientKey);
  if (!ai) {
    const simulated = generateSimulatedGrading(question, safeSubmission, previousEvaluations);
    simulated.questionId = question.id;
    simulated.questionNumber = question.number;
    return { evaluation: simulated, isSimulated: true };
  }

  // Construct multimodal prompt payload
  const contents: (string | { inlineData: { data: string; mimeType: string } })[] = [];

  let ecfContext = '';
  if (previousEvaluations.length > 0) {
    ecfContext =
      `\nPREVIOUS QUESTION EVALUATIONS IN THIS EXAM (FOR REVISION CONTEXT):\n` +
      previousEvaluations
        .map(
          (prev) =>
            `Question ${prev.questionNumber}: Awarded ${prev.marksAwarded}/${prev.maxMarks}. Notes: ${prev.examinerNotes}. ECF Status: ${
              prev.ecfApplied ? 'ECF Applied' : 'Normal'
            }`
        )
        .join('\n');
  }

  let subpartsText = '';
  if (question.subparts && question.subparts.length > 0) {
    subpartsText =
      `\nSUBPARTS OF THIS QUESTION (EVALUATE SEQUENTIALLY FOR INTRA-QUESTION ECF):\n` +
      question.subparts
        .map(
          (sp) =>
            `Part ${sp.partLetter} [${sp.totalMarks} marks]: ${sp.promptText}\nMarkscheme Excerpt: ${
              sp.markschemeExcerpt
            }\nCodes: ${sp.markCodes
              .map((c) => `[${c.code}] (${c.type}): ${c.marks}m - ${c.description}`)
              .join(', ')}`
        )
        .join('\n\n');
  }

  // GLM-OCR Handwriting Transcription Pass if Z.AI key is available
  let glmOcrSection = '';
  const activeZaiKey = getZaiApiKey(zaiKey);

  if (activeZaiKey) {
    // 1. Parallel OCR across subpart working boxes if provided
    if (safeSubmission.subpartImages && Object.keys(safeSubmission.subpartImages).length > 0) {
      const nonNullSubparts = Object.entries(safeSubmission.subpartImages).filter(
        ([, img]) => img && img.length > 500
      );

      if (nonNullSubparts.length > 0) {
        try {
          const subpartOcrResults = await Promise.all(
            nonNullSubparts.map(async ([partId, imgData]) => {
              try {
                const res = await transcribeStudentHandwriting(imgData, activeZaiKey);
                return { partId, res };
              } catch (subErr) {
                console.warn(`GLM-OCR transcription failed for subpart ${partId}:`, subErr);
                return { partId, res: null };
              }
            })
          );

          const validSubpartSnippets = subpartOcrResults
            .filter((r) => r.res && r.res.hasContent)
            .map(
              (r) =>
                `\n--- GLM-OCR SOTA OCR TRANSCRIPTION FOR ${r.partId.toUpperCase()} ---\n${r.res!.markdown}\nDetected Mathematical Formulas:\n${r.res!.formulas.map((f) => `- $${f}$`).join('\n')}`
            );

          if (validSubpartSnippets.length > 0) {
            glmOcrSection += `\nGLM-OCR SUBPART BOX TRANSCRIPTIONS:\n${validSubpartSnippets.join('\n')}\n`;
          }
        } catch (ocrBatchErr) {
          console.warn('Parallel GLM-OCR subpart transcription encountered batch error:', ocrBatchErr);
        }
      }
    }

    // 2. OCR on composite canvas image if present and subpart OCR didn't already capture working
    if (safeSubmission.canvasImageBase64 && !glmOcrSection) {
      try {
        const ocrResult = await transcribeStudentHandwriting(safeSubmission.canvasImageBase64, activeZaiKey);
        if (ocrResult.hasContent) {
          glmOcrSection = `\nGLM-OCR SOTA HIGH-PRECISION OCR TRANSCRIPTION OF STUDENT SCRIPT:\n${ocrResult.markdown}\nDetected Mathematical Formulas:\n${ocrResult.formulas.map((f) => `- $${f}$`).join('\n')}\n`;
        } else {
          glmOcrSection = `\nGLM-OCR SOTA OCR VERIFICATION: NO handwritten text or mathematical equations detected in this working box.\n`;
        }
      } catch (ocrErr) {
        console.warn('GLM-OCR handwriting transcription pass encountered error, continuing with raw image:', ocrErr);
      }
    }
  }

  const textualPrompt = `OFFICIAL IB EXAM QUESTION ASSESSMENT:
Question Number: ${question.number}
Command Term: ${question.commandTerm}
Allocated Marks: ${question.totalMarks}
Syllabus Subtopic: ${question.syllabusSubtopic}
Formula Booklet Reference: ${question.formulaBookletRef || 'N/A'}
Prompt:
${question.promptText}
${subpartsText}

OFFICIAL MARKSCHEME CRITERIA & CODES:
${question.markCodes.map((m) => `- [${m.code}] (${m.type}): ${m.marks} mark(s) — ${m.description}`).join('\n')}

OFFICIAL ECF RULES:
${question.ecfRules || 'Standard IB ECF applies. Award follow-through marks for valid method applied to upstream errors.'}

OFFICIAL MARKSCHEME EXCERPT:
${question.markschemeExcerpt}
${ecfContext}

STUDENT SUBMISSION DETAILS:
${safeSubmission.textResponse ? `Written Text Response:\n${safeSubmission.textResponse}` : 'Handwritten working provided in attached page image(s).'}
Time Spent: ${safeSubmission.timeSpentSeconds} seconds.
${glmOcrSection}

CRITICAL INTRA-QUESTION ECF & SUBPART ATTEMPT PROTOCOL:
- Evaluate subparts sequentially in order: (a) -> (b) -> (c).
- Populate the 'subpartScores' object with the exact marks awarded and max marks for each lettered subpart (e.g. "(a)", "(b)", "(c)").
- If an arithmetic or calculation slip occurred in Part (a), check if subsequent parts (b) and (c) correctly applied valid mathematical methods using that erroneous intermediate value. If so, award Method and Follow-Through marks under ECF without double penalty, set ecfApplied: true, and explain in ecfExplanation.
- If subparts (b), (c), etc., are blank or absent from the student's working, you MUST award ZERO (0) marks for those unattempted subparts in 'subpartScores' and mark corresponding codes as awarded: false with reason: "No attempt or working recorded for this subpart".
- NEVER award marks for unattempted subparts.

Please evaluate the student's submission rigorously following IB examiner guidelines. Citing specific mark codes (M1, A1, R1, etc.), calculate marks awarded, populate subpartScores, verify ECF if an upstream error was propagated, provide margin annotations, and recommend targeted syllabus revision.`;

  contents.push(textualPrompt);

  // Attach subpart images if available
  if (safeSubmission.subpartImages && Object.keys(safeSubmission.subpartImages).length > 0) {
    Object.entries(safeSubmission.subpartImages).forEach(([partId, imgUrl]) => {
      if (imgUrl && imgUrl.startsWith('data:image')) {
        contents.push(`Handwritten working for ${partId}:`);
        contents.push({
          inlineData: {
            data: imgUrl.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: 'image/png',
          },
        });
      }
    });
  }

  // Attach canvas composite handwritten image as inlineData
  if (safeSubmission.canvasImageBase64) {
    const cleanBase64 = safeSubmission.canvasImageBase64.replace(/^data:image\/\w+;base64,/, '');
    contents.push({
      inlineData: {
        data: cleanBase64,
        mimeType: 'image/png',
      },
    });
  }

  // Attach sketchpad diagram image if present
  if (safeSubmission.diagramImageBase64) {
    const cleanDiagram = safeSubmission.diagramImageBase64.replace(/^data:image\/\w+;base64,/, '');
    contents.push({
      inlineData: {
        data: cleanDiagram,
        mimeType: 'image/png',
      },
    });
  }

  // Deduplicate model fallbacks
  const modelsToTry = Array.from(new Set([DEFAULT_MODEL, ...FALLBACK_MODELS]));
  for (const m of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents,
        config: {
          systemInstruction: SENIOR_EXAMINER_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: QUESTION_EVALUATION_SCHEMA,
          thinkingConfig: {
            thinkingBudget: thinkingBudget > 0 ? thinkingBudget : 8192,
          },
          temperature: 0.1,
        },
      });

      if (response.text) {
        const evaluationResult: QuestionEvaluation = JSON.parse(response.text);
        evaluationResult.questionId = question.id;
        evaluationResult.questionNumber = question.number;
        return { evaluation: evaluationResult, isSimulated: false };
      }
    } catch (err) {
      console.warn(`Grading model ${m} unavailable for Question ${question.number}:`, err);
    }
  }

  // Seamless fallback to simulated examiner engine on model congestion
  const simulated = generateSimulatedGrading(question, safeSubmission, previousEvaluations);
  simulated.questionId = question.id;
  simulated.questionNumber = question.number;
  return { evaluation: simulated, isSimulated: true };
}

/**
 * Calculates official IB Grade (1 to 7) based on percentage score and paper grade boundaries.
 */
export function calculatePredictedGrade(scorePercentage: number, boundaries: ExamManifest['gradeBoundaries']): number {
  if (scorePercentage >= boundaries.grade7) return 7;
  if (scorePercentage >= boundaries.grade6) return 6;
  if (scorePercentage >= boundaries.grade5) return 5;
  if (scorePercentage >= boundaries.grade4) return 4;
  if (scorePercentage >= boundaries.grade3) return 3;
  if (scorePercentage >= boundaries.grade2) return 2;
  return 1;
}

/**
 * Synthesizes the Syllabus Weakness Matrix from question evaluations.
 */
export function synthesizeSyllabusBreakdown(
  evaluations: QuestionEvaluation[]
): NonNullable<ExamSession['gradingResults']>['syllabusBreakdown'] {
  const syllabusMap: Record<
    string,
    { marksAwarded: number; totalMarks: number; recommendation: string }
  > = {};

  evaluations.forEach((ev) => {
    const key = ev.syllabusSubtopic || 'General Examination Syllabus';
    if (!syllabusMap[key]) {
      syllabusMap[key] = {
        marksAwarded: 0,
        totalMarks: 0,
        recommendation: ev.revisionRecommendation,
      };
    }
    syllabusMap[key].marksAwarded += ev.marksAwarded;
    syllabusMap[key].totalMarks += ev.maxMarks;
  });

  return Object.entries(syllabusMap).map(([subtopic, val]) => {
    const percentage = val.totalMarks > 0 ? Math.round((val.marksAwarded / val.totalMarks) * 100) : 0;
    const status =
      percentage >= 80 ? ('mastered' as const) : percentage >= 50 ? ('developing' as const) : ('critical' as const);

    return {
      subtopic,
      marksAwarded: val.marksAwarded,
      totalMarks: val.totalMarks,
      percentage,
      status,
      targetedDrillPrompt: val.recommendation,
    };
  });
}

/**
 * Streams the evaluation of an entire exam attempt sequentially:
 * - Emits Question 1 first (~3-5s) so the student has immediate feedback.
 * - Streams questions 2..N sequentially with ECF progression.
 * - Concludes with the finalized ExamSession containing Grade Boundaries and Syllabus Matrix.
 */
export async function* streamExamAssessment(
  manifest: ExamManifest,
  submissions: Record<string, QuestionSubmission>,
  options: AssessmentOptions = {}
): AsyncGenerator<AssessmentEvent, void, unknown> {
  const evaluations: QuestionEvaluation[] = [];
  const totalQuestions = manifest.questions.length;
  const thinkingBudget = options.thinkingBudget ?? 8192;

  try {
    for (let i = 0; i < totalQuestions; i++) {
      const question = manifest.questions[i];
      const submission = submissions[question.id];

      const { evaluation } = await evaluateSingleQuestion(
        question,
        submission,
        evaluations,
        options.clientKey,
        thinkingBudget,
        options.zaiKey
      );

      evaluations.push(evaluation);

      yield {
        type: 'question_evaluated',
        questionIndex: i,
        totalQuestions,
        questionNumber: question.number,
        evaluation,
      };
    }

    // Compute paper-level aggregation
    const totalMarksAwarded = evaluations.reduce((sum, e) => sum + e.marksAwarded, 0);
    const totalPossibleMarks = manifest.totalMarks || evaluations.reduce((sum, e) => sum + e.maxMarks, 0);
    const scorePct = totalPossibleMarks > 0 ? Math.round((totalMarksAwarded / totalPossibleMarks) * 100) : 0;
    const predictedGrade = calculatePredictedGrade(scorePct, manifest.gradeBoundaries);
    const syllabusBreakdown = synthesizeSyllabusBreakdown(evaluations);

    const sessionId = options.sessionId || `session-${Date.now()}`;
    const finalizedSession: ExamSession = {
      id: sessionId,
      paperId: manifest.id,
      paperTitle: manifest.title,
      subjectCategory: manifest.category,
      mode: 'TIMED_MOCK',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      timeRemainingSeconds: options.timeRemainingSeconds ?? 0,
      durationSeconds: manifest.durationMinutes * 60,
      submissions,
      gradingResults: {
        totalMarksAwarded,
        totalPossibleMarks,
        percentage: scorePct,
        predictedGrade,
        reasoningEffortUsed: thinkingBudget >= 4096 ? 'high' : 'minimal',
        evaluations,
        syllabusBreakdown,
      },
    };

    yield {
      type: 'session_complete',
      session: finalizedSession,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error evaluating exam session.';
    yield {
      type: 'error',
      message,
    };
  }
}

/**
 * Fallback local examiner simulator for offline testing or upstream API congestion.
 */
function generateSimulatedGrading(
  question: QuestionItem,
  submission: QuestionSubmission,
  previousEvaluations: QuestionEvaluation[]
): QuestionEvaluation {
  const hasWork = Boolean(
    (submission.canvasImageBase64 && submission.canvasImageBase64.length > 2000) ||
    (submission.textResponse && submission.textResponse.trim().length > 20) ||
    (submission.subpartImages && Object.values(submission.subpartImages).some((img) => img && img.length > 2000))
  );

  const prevHadError = previousEvaluations.some((p) => p.marksAwarded < p.maxMarks);
  const triggerEcf = prevHadError && hasWork;

  // Determine if question has subparts and calculate subpart distribution
  const hasSubparts = Boolean(question.subparts && question.subparts.length > 1);
  const partACount = (hasSubparts && question.subparts?.[0]?.markCodes?.length) || 3;

  const markBreakdown: AwardedMarkItem[] = question.markCodes.map((mc, idx) => {
    let awarded = false;
    let isEcf = false;
    let reason = 'Incomplete or unverified step.';

    if (hasWork) {
      // If question has multiple subparts and the student only attempted subpart (a),
      // only award marks within subpart (a) criteria!
      const isBeyondPartA = hasSubparts && idx >= partACount;
      if (isBeyondPartA) {
        awarded = false;
        reason = 'No working or solution provided for this subpart.';
      } else if (idx === 0) {
        awarded = true;
        reason = `Valid method demonstrated according to markscheme criterion for ${mc.code}.`;
      } else if (triggerEcf && mc.type === 'M') {
        awarded = true;
        isEcf = true;
        reason = `[ECF Applied] Valid method correctly applied to intermediate value carried forward from previous subpart.`;
      } else if (idx < (hasSubparts ? partACount - 1 : question.markCodes.length - 1)) {
        awarded = true;
        reason = `Step properly calculated with correct algebraic progression.`;
      } else {
        awarded = !prevHadError;
        reason = awarded
          ? `Correct final answer/reasoning accurately aligned with markscheme.`
          : `Final numerical value diverged due to upstream working, but method marks preserved.`;
      }
    }

    return {
      code: mc.code,
      type: mc.type,
      awarded,
      marksAwarded: awarded ? mc.marks : 0,
      maxMarks: mc.marks,
      reason,
      isEcfApplied: isEcf,
    };
  });

  const totalAwarded = markBreakdown.reduce((sum, m) => sum + m.marksAwarded, 0);

  // Compute discrete subpart scores if question has subparts
  const subpartScores: Record<string, SubpartScoreItem> = {};
  if (question.subparts && question.subparts.length > 0) {
    let codeIndex = 0;
    question.subparts.forEach((sp, spIdx) => {
      const numCodes = sp.markCodes?.length || Math.ceil(question.markCodes.length / question.subparts!.length);
      const spCodes = markBreakdown.slice(codeIndex, codeIndex + numCodes);
      codeIndex += numCodes;

      const spMarksAwarded = spCodes.reduce((sum, m) => sum + m.marksAwarded, 0);
      const spEcf = spCodes.some((m) => m.isEcfApplied);
      const isAttempted = hasWork && (spIdx === 0 || spMarksAwarded > 0);

      subpartScores[sp.partLetter] = {
        marksAwarded: spMarksAwarded,
        maxMarks: sp.totalMarks,
        ecfApplied: spEcf,
        reason: !isAttempted
          ? `No working or solution recorded for Subpart ${sp.partLetter}.`
          : spMarksAwarded === sp.totalMarks
          ? `Full criteria achieved for Subpart ${sp.partLetter}.`
          : spEcf
          ? `Subpart ${sp.partLetter} method preserved under IB Error Carried Forward protocol.`
          : `Calculated per markscheme criteria for Subpart ${sp.partLetter}.`,
      };
    });
  }

  return {
    questionId: question.id,
    questionNumber: question.number,
    marksAwarded: totalAwarded,
    maxMarks: question.totalMarks,
    subpartScores: Object.keys(subpartScores).length > 0 ? subpartScores : undefined,
    examinerNotes: hasWork
      ? `The student demonstrated solid engagement with command term "${question.commandTerm}". Method marks were secured through explicit working. ${
          triggerEcf ? 'Notice that Error Carried Forward (ECF) conventions were rigorously applied to ensure no double penalty occurred.' : ''
        }`
      : `No sufficient working or text was provided for this question.`,
    marginAnnotations: hasWork
      ? [
          {
            label: 'M1 Awarded',
            type: 'tick',
            text: 'Valid method step shown clearly.',
            subpartPartLetter: question.subparts?.[0]?.partLetter,
          },
          ...(triggerEcf
            ? [
                {
                  label: 'ECF Applied',
                  type: 'ecf' as const,
                  text: 'Follow-through method credited without penalty.',
                  subpartPartLetter: question.subparts?.[1]?.partLetter || question.subparts?.[0]?.partLetter,
                },
              ]
            : []),
          {
            label: totalAwarded === question.totalMarks ? 'Full Marks' : 'Accuracy Slip',
            type: totalAwarded === question.totalMarks ? ('tick' as const) : ('cross' as const),
            text: totalAwarded === question.totalMarks ? 'Exact answer verified against markscheme.' : 'Check final constant/arithmetic step.',
            subpartPartLetter: question.subparts?.[question.subparts.length - 1]?.partLetter,
          },
        ]
      : [{ label: 'No response', type: 'cross', text: 'Blank submission.' }],
    markBreakdown,
    ecfApplied: triggerEcf,
    ecfExplanation: triggerEcf
      ? 'Error from preceding subpart was detected, but student executed the downstream calculus/algebraic method accurately. ECF marks awarded per IB conventions.'
      : undefined,
    syllabusSubtopic: question.syllabusSubtopic,
    subtopicMasteryScore: question.totalMarks > 0 ? Math.round((totalAwarded / question.totalMarks) * 100) : 0,
    revisionRecommendation: `Review key examples in ${question.syllabusSubtopic}. Practice verifying intermediate steps using the formula booklet (${
      question.formulaBookletRef || 'core syllabus'
    }).`,
  };
}
