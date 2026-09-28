# 4. Deep-Module Codebase Architecture

## Context
As the IB Examiner application progressed from initial proof-of-concept to a fully functional multi-mode platform (Dual Ingestion, Timed Mock Canvas, Senior Examiner Assessment, and Socratic Tutoring), several core domain procedures became trapped inside thin HTTP route handlers and React component state trees:
1. **Dual Ingestion**: 310 lines of PDF parsing, GLM-OCR dual dispatch, binary omission optimization, and Gemini fallback racing lived inside `src/app/api/ingest/route.ts`.
2. **Socratic Tutoring**: 178 lines of conversation history windowing, 4-tier pedagogical guardrails, and simulation fallbacks lived inside `src/app/api/socratic/route.ts`.
3. **Session Compilation**: 70 lines of canvas stroke rasterization, subpart box image extraction, and initial `ExamSession` generation lived inside `src/app/mock/[paperId]/page.tsx`.
4. **Storage**: 15 shallow 1-line wrapper functions around `idb-keyval` existed in `src/lib/storage.ts` without domain groupings.

This created high coupling to HTTP/Next.js frameworks and reduced testability: core business logic could not be exercised in pure Node.js environments or background jobs without mocking complex HTTP payloads or React DOM lifecycles.

## Decision

We restructure the application into **Deep Modules** adhering to the [codebase-design](file:///c:/Users/ivang/OneDrive/Desktop/examiner-app/.agents/skills/codebase-design/SKILL.md) framework:

1. **Manifest Ingestion Compiler (`src/lib/ingestion/compiler.ts`)**:
   - Presents a high-leverage in-process interface: `compileExamManifest(paperPdf, markschemePdf, options?)`.
   - Encapsulates all dual-document GLM-OCR parsing, markscheme binary omission, prompt formulation, multi-model fallback under one overall deadline with aborted requests, SVG diagram normalization, and schema validation.
   - `src/app/api/ingest/route.ts` becomes a thin 25-line transport adapter extracting files from `FormData` and delegating to the compiler.

2. **Socratic Tutoring Engine (`src/lib/socratic/tutor.ts`)**:
   - Presents a stateless turn-based interface: `consultSocraticTutor(input: SocraticConsultationInput)`.
   - Encapsulates conversation history truncation (`slice(-6)`), image snapshot optimization, and strict pedagogical tier guardrails: the server sets the active tier, and the markscheme enters the prompt only at Tier 4, so Tiers 1–3 cannot leak it. When no model gives a usable reply it throws `TutorUnavailableError` and the student is told to try again; there is no simulated tutor (amended September 2026).
   - `src/app/api/socratic/route.ts` becomes a thin transport adapter.

3. **Session Submission Compiler (`src/lib/session/submissionCompiler.ts`)**:
   - Presents a pure client-side interface: `compileMockSession(input: SubmissionCompilerInput)`.
   - Isolates all canvas stroke PNG rendering, per-box subpart mapping, and `ExamSession` construction from the React UI lifecycle.
   - `src/app/mock/[paperId]/page.tsx` delegates directly to this compiler on exam finish.

4. **Faceted Domain Repository (`src/lib/storage/examRepository.ts`)**:
   - Consolidates 15 loose key-value functions into structured domain facets: `examRepo.manifests`, `examRepo.sessions`, `examRepo.strokes`, and `examRepo.config`.
   - `src/lib/storage.ts` maintains backward-compatible facade exports delegating to `examRepo`, preserving existing client-side IndexedDB session integrity.
