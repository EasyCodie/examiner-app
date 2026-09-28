---
version: 1
slug: "src-app-mock-paperid-page-tsx"
primary_target: "src/app/mock/[paperId]/page.tsx"
related_targets: ["src/app/results/[sessionId]/page.tsx","src/app/learn/[paperId]/page.tsx","src/app/page.tsx","src/app/ingest/page.tsx"]
---

# Exam room surface brief

**Scope:** `/mock/[paperId]`, the timed Exam Session (STEM ink canvas and humanities essay). It is the lead surface of the redesign; results, learn, home and ingest inherit its world.
**Mode:** Operate.
**Audience and job:** an IB DP student, 16–18, sitting a full timed paper at a desk at night: laptop, or tablet with stylus. Job: work every question under Authentic Exam Conditions and hand in a script without losing a stroke.
**Constraints:** ADR-0002 (no scaffolding in the mock). Paper-light exam surface inside a dark shell (user decision). Visible, hideable clock with a reading-time phase, 5- and 1-minute warnings, and auto-submit at 0:00 (user decision). Neutral "IB-style" wording, no "Official", "Verified" or IBO claims (user decision).
**Memorable moment:** the page head stepping from READING TIME to WRITING as a single rule draws across it.

## Direction contract

THESIS: The script is a numbered examiner's document: sections, ruled tables and a margin column for marks, with hierarchy from scale and rules alone. It refuses the category default of a question card floating on a dashboard, with a timer pill and a sidebar of boxes.

OWN-WORLD: A graphite shell (#15181C / #1C2127) holds bright white stock (#FFFFFF) printed in report black (#111418). Hairline rules replace boxes. Numbers are tabular. Public Sans is the documentation sans for UI, labels and numerals; Source Serif 4 sets question text and prose. Roles: student ink is ballpoint blue-black (#1A2238); examiner/AI ink is ultramarine (#2743D6), reserved for the examiner only; awarded is #0E7A4F, lost is #C8321E, ECF is ochre #8A5A00. The primary action in the shell is a paper slip (white fill, ink text); on paper it is solid report black. No glow, no pills, no nested cards.

STORY: The student sees the paper, its rules and the time before they start. They write under a clock they can hide, know at every moment that their work is saved, and hand in a script they can check for blank questions first.

FIRST VIEWPORT: (1440 wide) A 48px graphite page head: Criterion mark and paper title on the left; the phase label (READING TIME / WRITING / FINAL FIVE MINUTES / PENS DOWN, each with its own rule pattern) in the centre; on the right the clock at 20px tabular, a Hide toggle, "Saved hh:mm" and a quiet Submit. Under it, a 40px contents strip: questions 1–n in one unbroken row, each with its [marks], an attempted mark, and a single now-marker rule under the current question. The body is a centred 816px white script sheet with question numbers in 28px Source Serif, the prompt at 18px, and a right margin column holding "[Maximum mark: n]" and part marks. The tool rail docks at the left outside the sheet, never over it. Before starting, the same frame shows the rubric sheet (duration, reading time, instructions) with "Begin reading time" as the one primary action.

FORM: Subject reports and grade-boundary tables. Candidate 6 of 7 on my resonance-ordered list; seed key 2b36ae53. Raised by: cyclorama (named, patterned phases, never colour alone), transit (focus the current question, never shrink the paper), step row (one unbroken question row with a single now-marker, scales not wraps), type specimen (scale-only hierarchy), rain garden (the Mark Code key held level like a legend, in results and learn).

Signature interaction and motion grammar: rules draw and numbers tick; nothing floats, fades in from below or glows. The phase change draws one rule across the page head. Reduced motion swaps it for an instant state change.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
