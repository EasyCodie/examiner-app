# 06: Honest marking, one question at a time

**What to build:** After hand-in, the results page marks the script one question per request, in order, carrying earlier evaluations forward so ECF is preserved.
- Each question's evaluation is saved as soon as it arrives, so a reload keeps it.
- If a question can't be marked, it shows "Not marked — retry". Retry re-marks only that question. Marks are never invented.
- The paper grade and syllabus breakdown appear only once every attempted question is marked.

This fits Vercel Hobby's 4.5 MB body and duration limits and removes the silent simulated grades.

Context: this amends ADR 0001 (streaming session evaluation with failover to the simulator). The simulator is removed, not relabelled. It uses the client-safe aggregation from ticket 02, and the `NO_KEY` contract from ticket 03.

**Blocked by:** 02, 03

**Status:** done

- [x] The single-question grading endpoint is the only grading path. The whole-session streaming endpoint, the stream generator and the simulated grading engine are deleted.
- [x] Failed questions come back as an explicit failure, never a simulated evaluation.
- [x] Partial progress survives a reload, and marking resumes from the first unmarked question.
- [x] The session start time is the real start of the attempt, not the hand-in time.
- [x] ADR 0001 is amended, and references in ADR 0004 are updated.
- [x] Browser automation with a real key: sit the specimen, then check that marks appear question by question, the grade appears, and a reload keeps everything.
- [x] With the key made invalid partway through, "Not marked — retry" shows, no grade is shown, and retry with a valid key marks only the failed question.
- [x] Zero console errors.
- [x] `tsc`, `lint` and `build` pass.


## Comments

- `markScript` (client-safe, `src/lib/assessment/markScript.ts`) marks the script in paper order, one `/api/grade` request per question. Each request carries the Question Evaluations so far, so ECF is kept. Questions that already have an evaluation are skipped, so a reload or a retry resumes at the first unmarked question.
- Evaluations are saved to `ExamSession.questionEvaluations` as they arrive. `gradingResults`, and with it the predicted grade and syllabus matrix, is set only once every question is marked.
- On a failure, marking stops at that question: questions after it wait, so ECF never sees a gap. `/api/grade` returns 502 `MARKING_FAILED` with a generic message and logs the detail on the server. With no key, the results page asks for one and keeps the script.
- Unattempted questions still get an honest zero from the evaluator, without a model call.
- ADR 0004 only mentions the tutor's simulator fallback, which ticket 07 removes and updates there. ADR 0001 has an amendment.
- Browser checks with the real key:
  - A seeded, half-written specimen (pages 1–2) was resumed and handed in.
  - The key was forced invalid on the 2nd request. The report then showed "Question 2(a) was not marked", "1 of 8 questions marked so far", and no grade.
  - Retry sent 2(a)–6 only, with no re-request of Q1, and the grade appeared.
  - A reload made no new requests and showed no alert.
  - `startedAt` matched the seeded start.
  - The only console entry was the expected 502 resource log from the forced failure.
- Code review: `scratch/test-q12.ts` was deleted with the simulator because it only exercised simulated grading of Q12, and per-question marking is covered by `scratch/test-mark-script.mjs`. The session also records `submittedAt`, so the report's "Handed in" date stays true now that `startedAt` is the real start.
