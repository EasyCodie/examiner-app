# 1. Streaming Session Evaluation with Early Handover

## Context
Evaluating a full IB examination paper (5–10 multi-part STEM/Humanities questions) requires multimodal vision analysis and deep reasoning (`thinkingBudget: 8192`), taking 20–60 seconds in total. The previous architecture leaked question sequencing, Error Carried Forward (ECF) state tracking, grade boundary classification, and syllabus matrix synthesis into a client-side React component (`MockExamPage`).

## Decision
We collapsed the entire assessment pipeline into a deep server-side `Assessment` module (`src/lib/assessment/evaluator.ts`) accessed via a streaming HTTP seam (`POST /api/evaluate-session`).

1. **Question-Level Evaluation**: Questions are evaluated sequentially on the server to preserve Error Carried Forward (ECF) dependencies and respect multimodal API rate limits.
2. **Early Reflection Handover**: On submission, the client transitions immediately to `/results/[sessionId]`. Question 1 is evaluated first and displayed the moment it arrives (~4 seconds), giving the student instant feedback while questions 2..N stream in below.
3. **Pure Module Seam**: The module has zero dependencies on browser storage (`idb-keyval`). It yields the fully synthesized `ExamSession` across the seam, and the client caller persists it to IndexedDB, maintaining the local-first architecture while remaining 100% testable in automated Node environments.
4. **Per-Question Failover**: If upstream Gemini services experience congestion or rate limits on any question, the module falls back to the high-fidelity local examiner simulator for that question, ensuring the student's submission is never aborted mid-stream.

## Amendment (September 2026): one question per request, honest failure

Superseded in part for the shared deployment on Vercel Hobby, where each student uses their own Gemini key.

- **No session stream.** `POST /api/evaluate-session` and `streamExamAssessment` are removed. A whole paper in one request could exceed the platform's 4.5 MB request body and function duration limits. The results page now marks the script through `markScript` (`src/lib/assessment/markScript.ts`), which sends one `POST /api/grade` per question in paper order. Each request carries the Question Evaluations of the questions before it, so ECF is preserved.
- **Early handover kept, with saved progress.** Each Question Evaluation is shown and saved to the session (`questionEvaluations`) as it arrives. A reload resumes marking from the first unmarked question and never re-marks the earlier ones.
- **No simulator.** Point 4 is reversed. The local examiner simulator is deleted. When a question can't be marked, marking stops at that question and the student sees it as not marked, with a retry. No marks are ever invented. Stopping, rather than skipping ahead, keeps every later question's ECF context complete.
- **Aggregation on the client.** The paper grade and the Syllabus Weakness Matrix are computed by `gradePaper` (`src/lib/assessment/aggregate.ts`) once every question is marked, and not before.
