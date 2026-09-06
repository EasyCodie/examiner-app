# 5. Authentic IB Formula Booklet and Socratic Context Anchoring

## Context
International Baccalaureate (IB) STEM examinations (such as Mathematics: Analysis and Approaches HL/SL) permit candidates to reference the official IB Formula Booklet. In previous versions:
1. `QuestionItem` declared an optional `formulaBookletRef?: string`, but candidate workspaces provided no internal reference viewer.
2. Students were compelled to navigate away to external PDF tabs, breaking [Authentic Exam Conditions](docs/adr/0002-authentic-exam-condition-vs-pedagogical-scaffolding.md) and creating distraction during timed mock sessions.
3. Socratic Learn Mode Tier 2 ("Formula & Concept") could only quote raw textual strings in chat without visually anchoring the candidate to the official booklet structure.

## Decision
We introduce a first-class **Formula Booklet** subsystem designed with the following architectural boundaries:

1. **Structured KaTeX Dataset over Raw PDFs**:
   - Rather than embedding a 36-page static PDF via iframe or PDF.js (which introduces significant memory overhead, poor mobile responsiveness, and unreliable programmatic scrolling), the Formula Booklet is compiled as a strongly-typed, tree-structured JSON/TypeScript module with native KaTeX mathematical notation.
   - Each formula item carries a stable anchor ID matching official syllabus section codes (e.g., `#section-5-5`).

2. **Authentic Exam Conditions vs Socratic Scaffolding**:
   - **Timed Mock Exam Mode (`/mock/[paperId]`)**: The Formula Booklet is available strictly as an unassisted reference via a persistent trigger in the exam header/canvas toolbar. It opens in search and browse mode with no pre-selected sections, contextual hints, or automated highlights.
   - **Socratic Learn Mode (`/learn/[paperId]`)**: Tier 2 of the pedagogical ladder renders an interactive citation chip (`[View in Formula Booklet: Section X.X]`). When clicked, the drawer opens and auto-scrolls to the exact anchor with an Amber pulsating highlight, explicitly training candidates to locate formulas during actual exams.

3. **Viewport Ergonomics**:
   - On wide desktop displays ($\ge 1280\text{px}$), opening the booklet transitions the workspace into a dockable split-screen pane, ensuring the student can inspect mathematical identities while continuing uninterrupted stylus or handwriting input on the drawing canvas.
   - On tablet and mobile viewports, the booklet renders as a slide-over overlay.

4. **Subject Code Association & Catalog Coverage**:
   - Formula Booklet availability is strictly gated by subject classification (e.g. `MATH_AA_HL`, `MATH_AA_SL`, `MATH_AI_HL`, `MATH_AI_SL`).
   - The structured repository packages the complete official IBO 2021 specifications for both:
     1. **Mathematics: Analysis and Approaches (HL & SL)** (Topics 1–5, Prior Learning, SL & AHL formulas)
     2. **Mathematics: Applications and Interpretation (HL & SL)** (Topics 1–5, Prior Learning, SL & AHL formulas)
   - Papers in subjects without official booklets (e.g. Economics HL) omit the trigger entirely to preserve authentic exam fidelity.
