# 1. Streaming Session Evaluation with Early Handover

## Context
Evaluating a full IB examination paper (5–10 multi-part STEM/Humanities questions) requires multimodal vision analysis and deep reasoning (`thinkingBudget: 8192`), taking 20–60 seconds in total. The previous architecture leaked question sequencing, Error Carried Forward (ECF) state tracking, grade boundary classification, and syllabus matrix synthesis into a client-side React component (`MockExamPage`).

## Decision
We collapsed the entire assessment pipeline into a deep server-side `Assessment` module (`src/lib/assessment/evaluator.ts`) accessed via a streaming HTTP seam (`POST /api/evaluate-session`).

1. **Question-Level Evaluation**: Questions are evaluated sequentially on the server to preserve Error Carried Forward (ECF) dependencies and respect multimodal API rate limits.
2. **Early Reflection Handover**: On submission, the client transitions immediately to `/results/[sessionId]`. Question 1 is evaluated first and displayed the moment it arrives (~4 seconds), giving the student instant feedback while questions 2..N stream in below.
3. **Pure Module Seam**: The module has zero dependencies on browser storage (`idb-keyval`). It yields the fully synthesized `ExamSession` across the seam, and the client caller persists it to IndexedDB, maintaining the local-first architecture while remaining 100% testable in automated Node environments.
4. **Per-Question Failover**: If upstream Gemini services experience congestion or rate limits on any question, the module falls back to the high-fidelity local examiner simulator for that question, ensuring the student's submission is never aborted mid-stream.
