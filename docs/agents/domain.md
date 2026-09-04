# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`**: Authoritative domain glossary (`Exam Manifest`, `Exam Session`, `Question Submission`, `Question Evaluation`, `Error Carried Forward (ECF)`, `Mark Code`, `Grade Boundary`, `Syllabus Weakness Matrix`).
- **`PRODUCT.md`**: Core product commitments, dual-document ingestion, ECF marking rules, and Socratic clue scaffolding.
- **`DESIGN.md`**: Design system tokens, Obsidian floor (`#0c0d0e`), 1px hairline borders, JetBrains Mono typography, and timeline pills.
- **`docs/adr/`**: Read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates or extends them lazily when terms or decisions actually get resolved.

## File structure

IB Examiner operates as a single-context repository:

```
/
├── CONTEXT.md          ← Domain glossary and canonical terms
├── PRODUCT.md          ← Product rules, ECF protocol, and evaluation guarantees
├── DESIGN.md           ← Obsidian Scholar design system tokens and aesthetics
├── docs/adr/           ← Architectural decision records
│   ├── 0001-dual-document-manifest-schema.md
│   └── 0002-indexeddb-local-first.md
└── src/
    ├── app/            ← Next.js App Router routes (mock, learn, results)
    ├── components/     ← React 19 UI (canvas, socratic, telemetry)
    ├── lib/            ← Gemini client, schemas, sample manifests
    └── types/          ← Exam manifest & grading type definitions
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name, a type, or a component), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids:
- Use `Exam Manifest`, not `Exam paper` or `test config`.
- Use `Exam Session`, not `Test attempt` or `user session`.
- Use `Question Submission`, not `Answer` or `response data`.
- Use `Question Evaluation`, not `Question grading` or `score item`.
- Use `Error Carried Forward (ECF)`, not `Follow-through` or `partial credit`.
- Use `Mark Code`, not `Rubric point` or `score tag`.
- Use `Grade Boundary`, not `Cutoffs` or `grade curve`.
- Use `Syllabus Weakness Matrix`, not `Topic breakdown` or `skill map`.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (dual-document manifest schema), but worth reopening because…_
