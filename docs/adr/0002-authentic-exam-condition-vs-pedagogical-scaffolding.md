# 2. Authentic Exam Conditions vs Pedagogical Scaffolding

## Context
During initial development of the Humanities workspace for Economics HL, pedagogical aids—such as syllabus subtopic tags, command term definitions, markscheme criteria peek drawers, pre-written essay paragraph starters (`+ Definition`, `+ Diagram Analysis`), and pre-labeled axis templates (`Price (P)` vs `Quantity (Q)`)—were embedded directly inside the `SplitScreenEditor`.

In high-stakes examination simulations (Timed Mock Mode), presenting these hints creates artificial bias: candidates are not challenged to recall economic theories, structure their arguments, or label diagrammatic axes themselves. In official IB diploma marking (e.g. Economics Criterion B), marks are explicitly contingent upon candidate-determined, accurate axis and curve labeling.

## Decision
We establish a strict architectural boundary between **Authentic Exam Conditions** and **Pedagogical Scaffolding**:

1. **Timed Mock Exam Mode (`/mock/[paperId]`)**:
   - **Stimulus Sanitization**: The candidate-facing prompt displays solely the question identifier, the official stimulus text, and the total mark allocation. All syllabus subtopics, command term definitions, target timing recommendations, and markscheme criteria peek drawers are strictly excluded.
   - **Unassisted Composition**: The essay textarea operates as a pure, distraction-free word processor with live word count and autosaving. Pre-written scaffold buttons are eliminated.
   - **Autonomous Diagramming**: The economic diagram canvas provides geometric axis systems (Standard L-Axes, 4-Quadrant, Blank) without pre-populated text labels. A text/label placement tool allows students to define, position, and label their own variables ($P$, $Q$, $PL$, $Y$, $D_1$, $S_1$), ensuring diagrams reflect student competency as required by IB markschemes.

2. **Socratic Learn Mode (`/learn/[paperId]`)**:
   - Pedagogical scaffolding (Command Term Anchors, syllabus subtopic mapping, formula/model clues, and step-by-step drafting prompts) is concentrated exclusively in Socratic Learn Mode, where guided instruction and AI dialogue are intended.
