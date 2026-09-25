import { QuestionItem, QuestionSubmission, QuestionEvaluation, SubpartScoreItem } from '@/types/exam';
import { getGeminiClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/lib/gemini';
import { SENIOR_EXAMINER_PROMPT } from '@/lib/prompts';
import { QUESTION_EVALUATION_SCHEMA } from '@/lib/schemas';
import { transcribeStudentHandwriting, getZaiApiKey } from '@/lib/ocr/glmOcr';
import { MissingKeyError } from '@/lib/aiKey';

/**
 * Evaluates a single exam question with multimodal artifacts, Error Carried Forward (ECF) context
 * and parallel GLM-OCR handwriting transcription. Throws when no model can mark it: marks are never invented.
 */
export async function evaluateSingleQuestion(
  question: QuestionItem,
  submission: QuestionSubmission | undefined,
  previousEvaluations: QuestionEvaluation[],
  clientKey?: string,
  thinkingBudget = 8192,
  zaiKey?: string
): Promise<QuestionEvaluation> {
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
    return unattempted;
  }

  const ai = getGeminiClient(clientKey);
  if (!ai) throw new MissingKeyError();

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
${question.markCodes.map((m) => `- [${m.code}] (${m.type}): ${m.marks} mark(s) - ${m.description}`).join('\n')}

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
        return evaluationResult;
      }
    } catch (err) {
      console.warn(`Grading model ${m} unavailable for Question ${question.number}:`, err);
    }
  }

  throw new Error(`No grading model could mark Question ${question.number}.`);
}
