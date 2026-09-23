---
name: Criterion
description: IB exam simulation and method-level marking, set as an examiner's subject report on a graphite desk.
colors:
  shell: "#15181c"
  shell-raised: "#1c2127"
  shell-line: "#2e343c"
  shell-ink: "#e9ecef"
  shell-muted: "#a4adb8"
  paper: "#ffffff"
  paper-tint: "#f4f6f8"
  paper-rule: "#d9dde2"
  paper-rule-strong: "#9aa3ae"
  ruling: "#e6e9ed"
  ink: "#111418"
  ink-muted: "#4b5563"
  ink-hover: "#2a3038"
  slip-hover: "#dfe3e8"
  student: "#1a2238"
  examiner: "#2743d6"
  examiner-on-shell: "#9db0ff"
  awarded: "#0e7a4f"
  awarded-on-shell: "#5cc99a"
  lost: "#c8321e"
  lost-deep: "#a8281a"
  lost-on-shell: "#ff8a73"
  ecf: "#8a5a00"
  ecf-on-shell: "#e8b45a"
  selection: "#cdd5e0"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "60px"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontFeature: "\"lnum\""
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1.08
    fontFeature: "\"lnum\""
  section:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    fontFeature: "\"lnum\""
  question-number:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "\"lnum\", \"tnum\""
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  prompt:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  script:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "28px"
  body:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
  control:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
  clock:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "\"tnum\", \"lnum\""
  mark-code:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "\"tnum\", \"lnum\""
  caption:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.9em"
    fontWeight: 400
rounded:
  none: "0px"
  report: "2px"
spacing:
  gutter-sm: "12px"
  gutter: "20px"
  row: "44px"
  row-compact: "36px"
  page-head: "48px"
  app-header: "56px"
  ruling: "28px"
  sheet-pad: "40px"
  sheet-pad-wide: "56px"
  tool-rail: "152px"
  notice-sheet: "560px"
  script-sheet: "816px"
  report-sheet: "1080px"
  container: "1440px"
components:
  button-slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.report}"
    padding: "0 18px"
    height: "{spacing.row}"
  button-slip-hover:
    backgroundColor: "{colors.slip-hover}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.report}"
    padding: "0 18px"
    height: "{spacing.row}"
  button-ink-hover:
    backgroundColor: "{colors.ink-hover}"
  button-quiet-shell:
    backgroundColor: "transparent"
    textColor: "{colors.shell-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.report}"
    padding: "0 18px"
    height: "{spacing.row}"
  button-quiet-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.report}"
    padding: "0 18px"
    height: "{spacing.row}"
  button-quiet-paper-hover:
    backgroundColor: "{colors.paper-tint}"
  button-destructive:
    backgroundColor: "{colors.lost}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.report}"
    padding: "0 18px"
    height: "{spacing.row}"
  button-destructive-hover:
    backgroundColor: "{colors.lost-deep}"
  button-compact:
    padding: "0 12px"
    height: "{spacing.row-compact}"
  script-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.report}"
    padding: "{spacing.sheet-pad}"
    width: "{spacing.script-sheet}"
  report-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.report}"
    padding: "28px"
    width: "480px"
  page-head:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    height: "{spacing.page-head}"
  contents-item:
    textColor: "{colors.shell-muted}"
    height: "{spacing.row}"
  contents-item-current:
    textColor: "{colors.shell-ink}"
  tool-rail:
    backgroundColor: "{colors.shell-raised}"
    textColor: "{colors.shell-muted}"
    width: "{spacing.tool-rail}"
  tool-rail-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  mark-code:
    textColor: "{colors.examiner}"
    typography: "{typography.mark-code}"
---

# Design System: Criterion

## Overview

**Creative North Star: "The Subject Report"**

Criterion is set as the documents an IB examiner actually produces: the candidate's script, the markscheme's margin codes, the subject report and its grade-boundary table. A graphite shell is the desk at night; on it lies bright white script stock printed in report black. Hierarchy comes from scale and hairline rules alone: numbered questions, ruled tables, a right-hand margin column for marks. Nothing floats on a dashboard.

The system runs on two surfaces and a handful of inks. Paper carries the work (questions, working, the marked report). The shell carries the apparatus around it (page head, contents strip, tool rail, home and navigation). Colour is spent on meaning: blue-black for the candidate's ink, ultramarine for the examiner, and green, red and ochre for awarded, lost and carried-forward marks. Every state also has a glyph or a word, because the colour is never the only signal.

Density is that of a printed paper: generous sheet margins, a 28px ruling for answers, tabular numerals wherever marks, times or grades appear. Motion is limited to a rule drawing across and examiner ink writing in from the left. Criterion is desktop web only; layouts are specified at 1440 wide and do not target phones.

**Key Characteristics:**
- Graphite shell (desk) holding white script stock (paper); two surfaces, never a stack of cards.
- Hierarchy from Source Serif 4 scale and hairline or 2px rules; boxes are rare.
- Examiner ultramarine is reserved for the examiner and the AI marker.
- Every mark outcome and phase is a glyph plus a word, with colour as a third signal.
- Square 2px report corners; one lifted material (the sheet).
- Rules draw; ink writes in; nothing glows, floats or fades up.

## Colors

A near-monochrome report printed in black on white, lying on graphite, with four reserved marking inks.

### Primary
- **Report Black** (ink): all printed text on paper, 2px heading rules, the selected row of a marks table, and the solid primary action on paper.
- **Script Stock White** (paper): the script sheet, the report sheet, dialogs, and the primary action in the shell (the paper slip).

### Secondary
- **Examiner Ultramarine** (examiner): mark codes (M1, A1, R1), italic examiner comments, the margin rule of the marked column (at 40% opacity), and the sample marking on home. It means "the examiner wrote this" and nothing else.
- **Examiner Ultramarine, lifted** (examiner-on-shell): the same role where it sits on graphite, such as the full Mark Code key on home.

### Tertiary
- **Awarded Green** (awarded / awarded-on-shell): a mark given, a topic secure. Always with a tick glyph and a word ("Awarded", "Secure").
- **Lost Red** (lost / lost-on-shell): a mark not shown, a topic that needs work, the last minute on the clock, save errors, destructive actions. Always with a cross glyph and a word.
- **ECF Ochre** (ecf / ecf-on-shell): error carried forward, and the final-five-minutes phase. Always with an arrow glyph or the words "ECF" / "Error carried forward".

### Neutral
- **Graphite Desk** (shell): the page background everywhere outside paper.
- **Raised Graphite** (shell-raised): the docked tool rail and inline code on the shell; the only step up from the desk.
- **Graphite Hairline** (shell-line): dividers, quiet-button borders, the resting rule under the page head.
- **Shell Ink** (shell-ink) and **Shell Muted** (shell-muted): text on graphite, primary and secondary.
- **Paper Tint** (paper-tint): hover on paper rows, the grade-boundary cell under the predicted grade, inline code on paper.
- **Paper Rule** (paper-rule) and **Strong Paper Rule** (paper-rule-strong): table row rules; borders of ruled working areas and quiet-paper buttons.
- **Ruling Grey** (ruling): the 28px lines of a ruled working area only.
- **Muted Ink** (ink-muted): captions, secondary text, pending states on paper.
- **Blue-Black Ballpoint** (student): the candidate's own words and strokes: essay text, typed working, the default pen.
- **Highlighter Grey** (selection): text selection on both surfaces.

### Named Rules
**The Examiner's Pen Rule.** Ultramarine is reserved for the examiner and the AI marker. It is never a link colour, a focus ring, a selected state or a brand accent. If the examiner did not write it, it is not blue.

**The Two Inks Rule.** Candidates write in blue-black, black or pencil grey (the only pen palette). Red, green, ochre and ultramarine belong to marking and are never offered as pen colours.

**The Surface Variant Rule.** Every role colour that can appear on graphite has an -on-shell variant; use the plain token on paper and the -on-shell token on the shell, never the other way round.

## Typography

**Display / Document Font:** Source Serif 4 (with Georgia, serif), optical-size axis enabled, italic loaded.
**UI Font:** Public Sans (with -apple-system, Segoe UI, sans-serif).
**Code Font:** JetBrains Mono (with ui-monospace), code views only.

**Character:** Source Serif 4 is the printed paper: question numbers, prompts, report headings, examiner comments in italic. Public Sans is the documentation sans of the apparatus: controls, labels, the clock and every numeral that must line up.

### Hierarchy
- **Display** (600, 60px, 1.02, -0.01em): the home headline only.
- **Headline** (600, 44px results title; 40px on the cover and ingest sheets; 1.08 to 1.1): the title of a sheet.
- **Section** (600, 32px on the shell; the predicted-grade heading at 36px): section heads on home and in the report.
- **Question Number** (600, 28px, leading 1; 24px in compact pages): "1." at the head of each question, beside the right-aligned "[Maximum mark: n]" at 15px serif semibold.
- **Title** (600, 24px): dialog titles, "Question by question", review heads.
- **Prompt** (400, 18px, 1.65, max 62 to 68ch): question text on the script; 16px in compact pages and the review.
- **Script** (400, 17px on a 28px line): the candidate's typed answer, set on the ruling in student ink.
- **Body** (400, 16px, 1.625, max 62 to 70ch): explanatory prose in Public Sans.
- **Control** (600, 15px): button labels; 14px in compact buttons, toolbar items and the contents strip.
- **Clock** (600, 20px, tabular): the exam clock in the page head.
- **Mark Code** (700, 15px, tabular): M1 / A1 / R1 codes in the margin column, in examiner ink.
- **Caption** (400, 13px): table captions, save status, word counts, part detail.
- **Label** (600, 12px, 0.06em, uppercase): the exam phase name in the page head. It is the only uppercase tracked text in the system.

### Named Rules
**The Lining Figures Rule.** Every mark, time, grade and percentage uses tabular lining numerals; serif figures are forced to lining so they never bounce as old-style.

**The 12px Floor Rule.** No text is set below 12px.

**The Mono Is Code Rule.** JetBrains Mono appears only for code and machine identifiers (inline code, a paper reference). Prose, labels and headings are never monospace.

## Layout

The exam room is a three-column grid at 1440: a flexible left column that docks the tool rail against the sheet, the 816px script sheet, and a flexible right column (`1fr 816px 1fr`, 32px gap). The rail sits outside the sheet and never over it; below 1280 it docks as a horizontal bar at the bottom of the window, with space reserved under the sheet so it never covers a question.

The shell is framed by a 56px app header (Criterion mark, paper title, main navigation, a Timed exam / Guided practice segmented control) or, during a session, by the 48px exam page head with a 4px rule band beneath it and a 44px contents strip. Both are sticky. The outer container is 1440px with 12px gutters, widening to 20px.

Sheets come in three widths: 816px for a script or submission sheet, 1080px for the examiner's report, and 560px for single notices (missing paper, errors). Sheet padding runs from 24px on narrow windows to 40px (script) and 48 to 56px (report, ingest). Inside a sheet, a running head (paper title or "Examiner's report" on the left, page or date on the right) sits above a 1px ink rule. Humanities papers use a 5:7 split: the question sheet (sticky) beside the answer sheet.

Vertical rhythm on paper is set by the 28px ruling and by rules between sections; section spacing on the report is 48px.

## Elevation & Depth

Depth is almost entirely tonal: graphite desk, raised graphite for the tool rail, white paper. Exactly two things cast shadows, and both are paper: the script sheet resting on the desk, and a dialog lifted above a dimmed desk.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgba(0,0,0,0.35), 0 12px 32px -16px rgba(0,0,0,0.6)`): every script, report, notice and sample sheet.
- **Dialog** (`box-shadow: 0 24px 64px -24px rgba(0,0,0,0.7)`; backdrop `rgba(10,12,15,0.72)`): the native report dialog only.

### Named Rules
**The Paper Only Rule.** Only paper casts a shadow. Controls, rows, rails and the shell are flat; no hover lift, no glow.

## Shapes

The form language is square and printed. Buttons, sheets and dialogs take a 2px report corner, just enough to read as cut stock; everything else (table rows, the tool rail, segmented controls, working areas, scrollbar thumbs) is fully square. Structure comes from rules: 2px ink rules open a table or a key, 1px ink rules close it, and paper-rule hairlines separate rows. The margin column is set off by a single vertical ultramarine hairline. Status glyphs are drawn inline as 8 to 12px square-and-stroke SVG marks (filled square, open square, half-filled square, tick, cross, arrow, padlock), matching the rules rather than an icon set.

## Components

### Buttons
Square report controls: firm, quiet, never glossy.
- **Shape:** 2px corners, 44px minimum height, 18px side padding, 8px gap for a leading 16px icon.
- **Slip (primary in the shell):** a white paper slip with report-black text; hover steps to the slip-hover grey. Used for "Sit a timed paper", and for "Hand in" once the final five minutes begin.
- **Ink (primary on paper):** solid report black with white text; hover lifts to ink-hover.
- **Quiet shell / quiet paper:** transparent with a graphite hairline on the shell (hover brightens the border to shell-muted); white with a strong paper-rule border on paper (hover fills paper-tint).
- **Destructive:** lost red with white text, deepening on hover; only for confirmed destructive actions (clear working, start again).
- **Compact:** 36px tall, 12px padding, 14px label, for the page head and inline confirmations.
- **Focus:** a 2px outline at 2px offset, paper-white on the shell and report black on paper. Disabled drops to 45% opacity.
- **Transition:** background, border and colour over 160ms on the expo-out curve.

### Segmented Control and Navigation
- **App header:** Criterion mark and 15px semibold wordmark; paper title in shell-muted after a hairline divider; nav links at 14px medium, shell-muted resting, shell-ink on hover and when current.
- **Mode control:** square segments inside one graphite hairline border, divided by hairlines; the active segment is a white paper slip with ink text.

### Script Sheet
The signature surface: white stock with the sheet shadow and 2px corners. A running head over a 1px ink rule; each question opens with its 28px serif number on the left and "[Maximum mark: n]" in the right margin; subparts list their letter, prompt and "[n]" on a three-column baseline grid.

### Ruled Working Area
A bordered answer box (strong paper-rule, square) ruled every 28px in ruling grey. Typed answers sit on the ruling in 17px serif student ink; the drawing canvas uses it for handwritten working, with a compact quiet-paper Clear control that confirms inline before a destructive clear.

### Exam Page Head
48px graphite band. Left: mark and paper title. Centre: the phase glyph and phase label. Right: the clock (20px tabular; ochre in the final five minutes, lost red in the last minute), a Hide / Show text toggle, "Saved hh:mm", the formula booklet and Hand in. Beneath it, a full-width rule band carries one pattern per phase, redrawn at every phase change:
- Before you begin: 2px dotted, shell-muted.
- Reading time: 2px dashed, shell-ink.
- Writing: 2px solid, shell-ink.
- Final five minutes: 4px double, ecf-on-shell.
- Pens down: 2px long dashes (24px on, 12px off), lost-on-shell.
Each phase also has its own glyph (dashed square, open square, filled square, half-filled square, crossed square).

### Contents Strip
The paper's contents as one unbroken, horizontally scrolling row of 44px question items: an 8px square (filled when there is working, open when not), the question label in 14px semibold, and "[marks]" at 12px. The current question turns shell-ink and gets a single 2px now-marker rule that draws in beneath it; it scrolls into view as the current question changes.

### Tool Rail
A 152px raised-graphite column with a hairline border, docked beside the sheet. Items are 44px rows with an icon and a 14px label; the active tool becomes a white slip with ink text. Groups (tools, pen colours, size, undo/redo, shortcuts) are separated by hairlines. Pen colours are shown as square swatches with their names.

### Report Dialog
A native modal dialog on white stock, 480px wide, 2px corners, with the dialog shadow and a dimmed graphite backdrop. A 24px serif title, then content and actions at 20px spacing. The browser handles the focus trap and Esc, which can be turned off when dismissal would be unsafe (pens down).

### Mark Code Badge and Key
- **Badge:** the code in 15px bold tabular examiner ink, followed by the outcome as a glyph and word in 13px semibold: tick "Awarded" (awarded green), cross "Not shown" (lost red), arrow "ECF" (ochre).
- **Key, full:** a definition list held level like a map legend: 2px shell-ink top rule, hairline rows, the code at 17px bold in examiner-on-shell beside its meaning at 16px.
- **Key, compact:** a single line of code and short meaning pairs at 13px, set beside any marking.

### Grade Boundary Table
The report's verdict: "Predicted grade n" as a serif heading, then a seven-column table of grades 7 to 1 opened by a 2px ink rule. The predicted grade's cell inverts to report black with white serif figures at 34px (others at 20px), and its boundary percentage sits on paper-tint. A serif sentence states the score and the marks to the next grade.

### Examiner Review
A 260px sticky marks table (question, glyph, "n / max"; the selected row inverts to report black) beside the selected question. The candidate's working sits in a two-column band between a 2px and a 1px ink rule; the right-hand 17rem margin column, set off by an ultramarine hairline, lists mark codes with italic serif examiner notes in ultramarine. Error carried forward gets its own ochre-ruled band with a plain explanation.

### Scaffold Ladder
The tutor's help steps as a ruled ordered list under a 2px ink rule: 48px rows with a serif step numeral, a 14px semibold title and 13px detail, and a trailing glyph (open square, tick when used, padlock when locked). The current step inverts to report black. The markscheme rung stays locked, labelled "Unlocks after step 3", until the three earlier steps are used.

### Inputs / File Fields
A file field is a real input inside a square 132px drop zone: dashed strong paper-rule at rest, paper-tint on hover or drag, a solid ink border once a file is chosen. Focus shows a 2px ink outline. Text areas are ruled working areas.

### Motion
- **Rule draw** (520ms, expo-out, from the left): phase rules in the page head and the contents now-marker.
- **Ink in** (420ms, expo-out, left-to-right clip): examiner marks writing into the margin, staggered line by line.
- **State transitions** (160ms): colour and border only.
- **Reduced motion:** all animation and transitions collapse to an instant state change.

## Do's and Don'ts

### Do:
- **Do** put the work on white script stock (with the sheet shadow) and the apparatus on the graphite shell.
- **Do** make the primary action a paper slip in the shell and solid report black on paper.
- **Do** build hierarchy with Source Serif 4 scale and rules: 2px ink to open a table or section, 1px ink to close it, paper-rule hairlines between rows.
- **Do** set every mark, time, grade and percentage in tabular lining numerals.
- **Do** pair every status colour with a glyph and a word (tick Awarded, cross Not shown, arrow ECF, the per-phase rule pattern and glyph).
- **Do** use the -on-shell variant of any role colour placed on graphite.
- **Do** give primary actions, nav items, tool rows and question items a 44px minimum target.
- **Do** focus in report black on paper and in paper-white on the shell (2px outline, 2px offset).
- **Do** keep the tool rail outside the sheet and dock it below the sheet on narrower windows; never cover a question.
- **Do** honour reduced motion with instant state changes.

### Don't:
- **Don't** use examiner ultramarine for anything the examiner or AI marker did not write: not links, focus, selection, brand accents or pen colours.
- **Don't** use pills or fully rounded shapes; corners are 2px or square.
- **Don't** add glow, coloured shadows, hover lifts or shadows on anything but paper.
- **Don't** nest boxed cards inside a sheet; inside paper, structure comes from rules and ruled working areas.
- **Don't** set prose, labels or headings in monospace.
- **Don't** set text below 12px.
- **Don't** use uppercase tracked labels as kickers or eyebrows above headings; the phase label is the only uppercase tracked text.
- **Don't** signal state by colour alone.
- **Don't** animate by floating, fading up from below or pulsing; rules draw and ink writes in.
