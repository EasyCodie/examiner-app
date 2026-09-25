# 02: Move the paper-level aggregation into a client-safe module (prefactor)

**What to build:** No behaviour change. The code that turns a list of question evaluations into the paper result moves into a module the browser can import without pulling in the Gemini SDK: predicted IB grade from grade boundaries, syllabus breakdown, totals and percentage, and the finalised exam session. This lets ticket 06 mark question by question from the results page.

Context: today this logic sits inside the server-only assessment evaluator, at the end of the streaming generator. See ADR 0004 (deep modules) for how modules are shaped.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] One pure function takes a manifest, the submissions, the evaluations and the session metadata, and returns a finalised exam session with grading results. It is identical to what the stream produces today.
- [x] The evaluator's stream uses this function, so there is one source of truth.
- [x] The new module imports nothing from `@google/genai` or any server-only code.
- [x] A targeted Node test script in `scratch/` checks grade boundaries (including edge percentages), the syllabus breakdown and totals on a sample paper.
- [x] `tsc`, `lint` and `build` pass. Sitting and handing in the specimen still produces the same results page.

## Comments

- The interface is `gradePaper(manifest, evaluations, thinkingBudget)` in `src/lib/assessment/aggregate.ts`, and it returns the session's grading results. Session metadata stays with the caller, because ticket 06 merges it into the saved session. The stream's session object is built exactly as before.
- The results page already imported `synthesizeSyllabusBreakdown` from the server evaluator, which pulled that module into the client bundle. It now imports from `aggregate.ts`.
- `scratch/verify-lockdown.ts` was already broken under plain `node` before this ticket, because of extensionless imports. I only updated its imports.
