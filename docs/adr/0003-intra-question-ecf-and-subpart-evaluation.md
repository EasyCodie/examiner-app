# 3. Intra-Question Error Carried Forward (ECF) and Subpart Evaluation

## Context
In official International Baccalaureate (IB) examinations, multi-part questions (especially in Section B of Mathematics AA/AI HL/SL, worth 14 to 18 marks each) evaluate students across sequential subparts $(a) \to (b) \to (c) \to (d)$. The core differentiator of Senior Examiner marking is **Error Carried Forward (ECF)**: if a candidate commits an arithmetic or algebraic slip in finding an initial value or derivative in part $(a)$, downstream method marks in parts $(b)$ and $(c)$ must be credited without penalty if the correct mathematical method is executed using that erroneous intermediate value.

Previously:
1. ECF context was only passed between top-level questions ($Q_1 \to Q_2 \to \dots \to Q_{12}$), which are mathematically independent in IB papers. Intra-question subpart ECF was left unguided.
2. The schema only returned a flat list of mark codes and an aggregate question score (e.g. 11/16), leaving subquestion cards in the UI unable to display discrete marks awarded per subpart.
3. Subpart handwriting in `subpartImages` was excluded from the GLM-OCR transcription pass.
4. Interfaces used `QuestionGrading` and `GRADING_RESPONSE_SCHEMA`, violating the repo's domain glossary (`CONTEXT.md`).

## Decision

We establish the following architectural standards for the Senior Examiner evaluation pipeline:

1. **Intra-Question ECF & Sequential Chain-of-Thought**:
   - Questions are evaluated in a single high-reasoning prompt pass (`thinkingBudget: 8192` on `gemini-3.5-flash`), with explicit examiner instructions directing Gemini to inspect subpart $(a)$ derivations before evaluating $(b)$ and $(c)$.
   - When an upstream error is detected in an initial subpart, the model must verify if subsequent steps applied valid methods to that erroneous value, award downstream method marks under ECF, and document the propagation in `ecfExplanation`.

2. **Structured Subpart Scores in `QUESTION_EVALUATION_SCHEMA`**:
   - The schema mandates `subpartScores: Record<string, { marksAwarded: number, maxMarks: number, ecfApplied?: boolean }>`, guaranteeing discrete mark attributions for $(a)$, $(b)$, $(c)$ that map directly to subquestion review cards.

3. **Parallel GLM-OCR Ingestion for Subpart Workings**:
   - If `QuestionSubmission` contains `subpartImages`, the engine transcribes non-empty subpart boxes in parallel via `Promise.all` through GLM-OCR, injecting labeled mathematical LaTeX transcriptions (`SUBPART (a) OCR TRANSCRIPTION: ...`) into the prompt.

4. **Domain Glossary Standardization**:
   - `QuestionGrading` is renamed to `QuestionEvaluation`, and schemas/prompts are renamed to `QUESTION_EVALUATION_SCHEMA` and `SENIOR_EXAMINER_PROMPT`. A backward-compatible type alias (`export type QuestionGrading = QuestionEvaluation;`) is preserved for serialized IndexedDB sessions.

5. **Subpart-Anchored Margin Annotations**:
   - Annotations carry an optional `subpartPartLetter` and render beside their respective subpart in `ExaminerReview.tsx`. The speculative, unused `coordinate` field is deprecated.
