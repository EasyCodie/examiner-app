# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
High school students preparing for official International Baccalaureate (IB) Diploma Programme examinations (e.g. Mathematics AA HL/SL, Economics HL/SL). They operate under high academic stakes during intense revision periods, requiring authentic exam simulation, rigorous method-level feedback, and targeted syllabus weakness remediation.

## Product Purpose
Deliver an examiner-grade revision and assessment environment that eliminates model hallucinations through dual-document ingestion (pairing official exam papers with official markschemes into immutable JSON manifests). It provides students with authentic timed mock exam conditions, granular method/accuracy marking with Error Carried Forward (ECF) protection, and sub-second Socratic tutoring without premature rubric leaks.

## Positioning
Unlike generic AI study chatbots or broad flashcard tools, Criterion anchors evaluations to verified, official IB markschemes and command terms. Its core differentiator is the Error Carried Forward (ECF) grading protocol—modeled after official Senior Examiner conventions—which awards downstream method marks even when an early algebraic calculation slip occurred, preventing double penalization.

## Operating Context
- **Timed Mock Exam Mode**: Strict countdown timer matching official IB exam durations, autosaving to IndexedDB.
  - *STEM Subjects*: High-resolution drawing canvas overlaid on rendered exam booklets, supporting stylus/touch input, ballpoint/highlighter strokes, and composite page flattening for vision-based grading.
  - *Humanities Subjects*: Split-screen prompt viewer and structured essay composer with word count, scaffolded insertion templates, and an inline economic/scientific diagram sketchpad.
- **Senior Examiner Evaluation**: High reasoning effort assessment pass (`thinkingBudget: 8192`) providing granular mark breakdowns (`M1`, `A1`, `R1`, `AG`), simulated margin annotations, and IB 1–7 grade boundary predictions.
- **Socratic Learn Mode**: Collaborative AI dialogue with dedicated reasoning budget (`thinkingBudget: 2048`) structured across a 4-tier pedagogical scaffold (Tier 1: Command Term Anchor, Tier 2: Formula Booklet/Model Clue, Tier 3: Diagnostic Clue, Tier 4: Unlock Official Markscheme).
- **Google AI Studio Telemetry Drawer**: Slide-out workbench allowing students and power users to inspect system prompts, tune reasoning budgets, and view structured JSON schemas.

## Capabilities and Constraints
- Dual-document PDF upload pipeline with structured schema enforcement (`responseSchema`).
- Bundled authentic specimen papers for out-of-the-box zero-token testing:
  - *IB Mathematics: Analysis and Approaches HL (Paper 1)*
  - *IB Economics HL (Paper 1)*
- Error Carried Forward (ECF) protocol strictly enforced across multi-part calculus and algebra questions.
- KaTeX typesetting for inline and display mathematical formulas.
- Local-first architecture: manifests, stroke vectors, and exam sessions stored in client-side IndexedDB (`idb-keyval`).

## Brand Commitments
- Rigorous, authoritative academic tone: "Oxford Scholar meets modern aerospace precision."
- Strict adherence to official IB Diploma terminology (Command Terms: *Find, Show that, Calculate, Determine, Justify, Evaluate, Explain*).
- Visual authority guided by the "Obsidian Scholar" design system: deep obsidian backgrounds, hairline white borders, Metallic Amber for human actions/grades, and Royal Cobalt for AI intelligence.

## Evidence on Hand
- Bundled full specimen paper manifests in `src/lib/samplePapers.ts` (Mathematics AA HL Paper 1 and Economics HL Paper 1).
- Structured JSON schemas in `src/lib/schemas.ts` (`MANIFEST_RESPONSE_SCHEMA`, `GRADING_RESPONSE_SCHEMA`, `SOCRATIC_RESPONSE_SCHEMA`).
- End-to-end verified ECF and endpoint test scripts in `scratch/`.

## Product Principles
1. **Authoritative Ground Truth First**: Every evaluation must derive strictly from the compiled manifest and official markscheme; never allow ungrounded model hallucinations.
2. **Fairness Through Error Carried Forward**: A student should never be penalized twice for an upstream calculation error if subsequent reasoning and methodology are correct.
3. **Scaffold Before Answering**: In learning mode, never expose final answers or markscheme solutions prematurely; guide students step-by-step through command terms and formula clues.
4. **Subject-Appropriate Interaction**: Match the input medium to the subject discipline (ink canvas for quantitative math/sciences, split-screen essay and diagram editor for humanities).

## Accessibility & Inclusion
- High-contrast text readability adhering to WCAG 2.1 AA standards across dark backgrounds.
- High-resolution stylus/pointer events with smooth bezier interpolation for students using drawing tablets or touch screens.
- KaTeX mathematical typography accessible for screen readers and legible across viewport sizes.
