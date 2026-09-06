<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:behavioral-guidelines -->

# Behavioral Guidelines & Boundaries

Bias toward caution over speed. Keep diffs surgical, uphold hard boundaries, and loop until verified.

## Hard Boundaries & Restrictions

- **Scope & Diffs**: Touch only code directly involved in the task. Never add unrequested features, speculative abstractions, or configurability. Never reformat, "clean up", or alter adjacent code, comments, or pre-existing dead code. Clean up only orphaned imports or types introduced by your diff.
- **Dependencies & Architecture**: Never install npm packages or alter architecture without user consent and ADR review ([`docs/adr/`](docs/adr/)). Never modify or delete generated blocks (`<!-- BEGIN:nextjs-agent-rules -->`).
- **Domain & Marking Integrity**: Never leak markscheme answers in early Socratic tiers (Tiers 1–3 per [`PRODUCT.md`](PRODUCT.md)). Never penalize downstream steps for prior arithmetic errors (strictly preserve ECF). Never invent terms outside [`CONTEXT.md`](CONTEXT.md).
- **Third-Party APIs**: Never guess library APIs for Next.js 16, React 19, Tailwind v4, or `@google/genai`. Verify current docs using `context7-mcp` (`resolve-library-id`, `query-docs`) before modifying code.
- **Ambiguity & Assumptions**: Never make silent assumptions on ambiguous requirements. Halt and clarify tradeoffs before implementing.
- **Completion Gate**: Never declare completion without passing `tsc`, `lint`, and extensive browser automation verification.

## Execution Discipline

1. **Think Before Coding**: State assumptions explicitly. Surface tradeoffs and simpler alternatives before writing code.
2. **Simplicity First**: Write the minimum code that completely solves the problem. If 50 lines suffice, never write 200.
3. **Goal-Driven Loops**: Define binary observable success criteria upfront. Loop independently until all verification gates pass.
4. **Extensive Browser Automation**: Mandatory for all UI, routing, or interactive flows. Launch the dev server (`npm run dev`), automate interactions across relevant paths, verify rendered DOM states, and assert zero console errors before concluding.

<!-- END:behavioral-guidelines -->

## Repository Role & Identity

**IB Examiner** is an authoritative exam simulation, dual-document markscheme ingestion, method-level marking, and Error Carried Forward (ECF) grading platform for IB Diploma students.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `@google/genai` (Gemini 2.5 Flash / Pro with thinkingBudget control), IndexedDB (`idb-keyval`), KaTeX.

### Sources of Truth (Context Pointers)

- **Domain Glossary**: Read [`CONTEXT.md`](CONTEXT.md) for canonical terminology before naming types, functions, or tests.
- **Product Rules**: Read [`PRODUCT.md`](PRODUCT.md) when touching evaluation logic, Socratic tutoring tiers, or session workflows.
- **Design System**: Read [`DESIGN.md`](DESIGN.md) when editing or creating UI components ("Obsidian Scholar" theme).
- **Architecture (ADRs)**: Read [`docs/adr/`](docs/adr/) before proposing architectural changes or adding major dependencies.
- **Local Issue Tracker**: Read [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) and [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md) for specs and tickets under `.scratch/<feature-slug>/`.
- **Domain Docs Guide**: Read [`docs/agents/domain.md`](docs/agents/domain.md) when exploring or extending domain docs.

### Verification Loop

Execute verification gates until all pass:
- `npx tsc --noEmit`: Typecheck TypeScript and interfaces.
- `npm run lint`: Lint check before completing edits.
- `npm run build`: Production build validation for routing or App Router changes.
- **Browser Automation**: Extensively test applied changes in the browser. Launch the local dev server (`npm run dev`), automate interactions across modified flows, verify DOM states and UI behavior, and assert zero console errors.
- **Logic Tests**: Execute targeted Node test scripts in `scratch/`.

### Agent Skills Routing

The skill suite in `.agents/skills/` orchestrates engineering workflows:
- **Router**: `/ask-matt` (route any engineering situation to the right skill).
- **Spec & Planning**: `/grill-with-docs` (interview & ADR trail), `/to-spec` (discussion to spec), `/to-tickets` (spec to tracer-bullet tickets), `/wayfinder` (multi-session roadmap).
- **Implementation & Seams**: `/implement` (ticket execution with TDD), `/tdd` (red-green-refactor loop), `/codebase-design` (deep module interface design).
- **UI & Aesthetics**: `/impeccable` (audit and polish UI to Obsidian Scholar standards).
- **Review & Quality**: `/code-review` (standards and spec diff review), `/diagnosing-bugs` (tight red feedback loop for regressions), `/triage` (ticket state machine).