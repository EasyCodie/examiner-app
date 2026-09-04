---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

## Sources of truth

- **Domain glossary**: Check `CONTEXT.md` to ensure types, functions, and variables follow official IB Examiner vocabulary (`Exam Manifest`, `Exam Session`, `Question Submission`, `Question Evaluation`, `Error Carried Forward (ECF)`, `Mark Code`).
- **Product rules**: Consult `PRODUCT.md` when touching evaluation, markscheme schemas, or Socratic tutoring flows.
- **Design tokens**: Consult `DESIGN.md` when creating or modifying UI. Adhere to the Obsidian Scholar system (`#0c0d0e` obsidian canvas, hairline borders, Cursor Orange `#f54e00`, JetBrains Mono for code/math/rubrics).

## Process

1. **Agree on seams**: Use `/tdd` where possible at pre-agreed seams (e.g. schemas, evaluation logic, stroke compositing).
2. **Implement in vertical slices**: Keep changes minimal, surgical, and directly traced to the ticket.
3. **Verify constantly**:
   - Run typechecking: `npx tsc --noEmit` after interface or type edits.
   - Run linting: `npm run lint` before finishing.
   - Run build check: `npm run build` for routing, layout, or App Router changes.
   - Run isolated logic/API scripts in `scratch/` when validating Gemini calls or schema parsing.
4. **Review**: Once complete, run `/code-review` to audit changes across Standards and Spec axes.
5. **Commit**: Commit clean, working code to the current branch.
