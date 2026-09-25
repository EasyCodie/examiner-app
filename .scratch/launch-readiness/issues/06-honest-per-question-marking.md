# 06: Honest marking, one question at a time

**What to build:** After hand-in, the results page marks the script one question per request, in order, carrying earlier evaluations forward so ECF is preserved.
- Each question's evaluation is saved as soon as it arrives, so a reload keeps it.
- If a question can't be marked, it shows "Not marked — retry". Retry re-marks only that question. Marks are never invented.
- The paper grade and syllabus breakdown appear only once every attempted question is marked.

This fits Vercel Hobby's 4.5 MB body and duration limits and removes the silent simulated grades.

Context: this amends ADR 0001 (streaming session evaluation with failover to the simulator). The simulator is removed, not relabelled. It uses the client-safe aggregation from ticket 02, and the `NO_KEY` contract from ticket 03.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] The single-question grading endpoint is the only grading path. The whole-session streaming endpoint, the stream generator and the simulated grading engine are deleted.
- [ ] Failed questions come back as an explicit failure, never a simulated evaluation.
- [ ] Partial progress survives a reload, and marking resumes from the first unmarked question.
- [ ] The session start time is the real start of the attempt, not the hand-in time.
- [ ] ADR 0001 is amended, and references in ADR 0004 are updated.
- [ ] Browser automation with a real key: sit the specimen, then check that marks appear question by question, the grade appears, and a reload keeps everything.
- [ ] With the key made invalid partway through, "Not marked — retry" shows, no grade is shown, and retry with a valid key marks only the failed question.
- [ ] Zero console errors.
- [ ] `tsc`, `lint` and `build` pass.
