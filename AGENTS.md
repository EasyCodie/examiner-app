<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:behavioral-guidelines -->

# Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Library Documentation & API Verification (Context7)

**Always fetch current documentation. Do not guess library APIs.**

- Whenever working with external libraries, frameworks (e.g., Next.js, React, Tailwind, Prisma, Supabase), API references, or code generation involving third-party dependencies, you MUST use the `context7-mcp` skill.
- Call `resolve-library-id` to find the exact library and `query-docs` to retrieve up-to-date documentation and examples before writing or modifying library code, rather than relying on training data.

---

<!-- END:behavioral-guidelines -->

## Repository Role & Identity

**IB Examiner** is an authoritative exam simulation, dual-document markscheme ingestion, method-level marking, and Error Carried Forward (ECF) grading platform for IB Diploma students.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `@google/genai` (Gemini 2.5 Flash / Pro with thinkingBudget control), IndexedDB client-side persistence (`idb-keyval`), KaTeX math typesetting.

### Sources of Truth (Context Pointers)

- **Domain Glossary**: Read [`CONTEXT.md`](CONTEXT.md) before naming types, functions, tests, or issues. Strictly use defined terms (`Exam Manifest`, `Exam Session`, `Question Submission`, `Question Evaluation`, `Error Carried Forward (ECF)`, `Mark Code`, `Grade Boundary`, `Syllabus Weakness Matrix`).
- **Product Rules**: Read [`PRODUCT.md`](PRODUCT.md) when touching evaluation logic, Socratic tutoring tiers, or session workflows. Maintain markscheme ground truth and ECF protection without premature solution leaks.
- **Design System & Aesthetics**: Read [`DESIGN.md`](DESIGN.md) when editing or creating UI components. Follow the "Cursor-Dark-Examiner" / "Obsidian Scholar" system: obsidian canvas (`#0c0d0e`), 1px hairline borders (`rgba(255, 255, 255, 0.08)`), Cursor Orange (`#f54e00`) for primary highlights, JetBrains Mono for math, rubrics, and metadata, and 5-stage pastel timeline pills.
- **Architecture Decisions**: Read [`docs/adr/`](docs/adr/) before proposing architectural changes or adding major dependencies.
- **Local Issue Tracker**: Read [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) for specs and tickets under `.scratch/<feature-slug>/`.
- **Triage Labels**: Read [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md) for canonical issue states.
- **Domain Docs Guide**: Read [`docs/agents/domain.md`](docs/agents/domain.md) for how skills explore and extend domain docs.

### Verification Loop

Execute these commands to verify changes:
- `npx tsc --noEmit`: Typecheck after TypeScript or interface modifications.
- `npm run lint`: Lint check before completing edits.
- `npm run build`: Production build validation for routing or Next.js App Router changes.
- Standalone API / logic tests: Execute via node scripts in `scratch/`.

### Agent Skills Routing

The skill suite in `.agents/skills/` orchestrates engineering workflows:
- **Router**: `/ask-matt` maps any situation to the appropriate skill or flow.
- **Spec & Planning**: `/grill-with-docs` (interview leaving ADR/glossary trail), `/to-spec` (synthesize discussion into spec), `/to-tickets` (break spec into tracer-bullet tickets), `/wayfinder` (chart multi-session initiatives).
- **Implementation & Seams**: `/implement` (build tickets with TDD and review), `/tdd` (red-green-refactor loop at public seams), `/codebase-design` (deep module design vocabulary).
- **UI & Aesthetics**: `/impeccable` (audit and polish UI to Obsidian Scholar standards).
- **Review & Quality**: `/code-review` (two-axis Standards and Spec diff review), `/diagnosing-bugs` (build tight red feedback loop for regressions), `/triage` (state machine for incoming tickets).