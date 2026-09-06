---
target: src/app/learn/[paperId]/page.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\ivang\\OneDrive\\Desktop\\examiner-app\\src\\app\\learn\\[paperId]\\page.tsx"
target_fingerprint: "sha256:31a5753b01db1cbbf27a00cc6110527cac4155aa6ccf23af65b50b26650fd532"
target_path: "C:\\Users\\ivang\\OneDrive\\Desktop\\examiner-app\\src\\app\\learn\\[paperId]\\page.tsx"
timestamp: 2026-09-06T14-16-07Z
slug: src-app-learn-paperid-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Silent canvas snapshot upload; tool state hidden when scrolling down working sheet. |
| 2 | Match System / Real World | 3 | Authentic IB paper layout and marks, but generic paint palette dots and uncalibrated slider. |
| 3 | User Control and Freedom | 2 | Instant canvas clear without confirmation or undo; sticky header overlap traps question tabs. |
| 4 | Consistency and Standards | 2 | Formula Booklet trigger triplicated across header, toolbar, and sidebar; conflicting sticky offsets. |
| 5 | Error Prevention | 1 | Destructive "Delete" button positioned immediately adjacent to "Redo" with zero confirmation. |
| 6 | Recognition Rather Than Recall | 2 | 4-tier pedagogical scaffolding obscured behind flat horizontal quick-reply chips. |
| 7 | Flexibility and Efficiency | 2 | Keyboard shortcuts displayed in tooltips (P, H, E) have no active listeners in code; toolbar scrolls away. |
| 8 | Aesthetic and Minimalist Design | 2 | Disjointed floating headers, clipped toolbars, and visual clutter around the question canvas. |
| 9 | Error Recovery | 2 | Single-stroke undo works, but full page clear cannot be undone; Socratic API errors lack in-app recovery. |
| 10 | Help and Documentation | 3 | Contextual formula booklet deep-linking is solid, but guidance on Socratic tiers and tools is absent. |
| **Total** | | **21/40** | **Acceptable (Significant improvements required before users are happy)** |

---

## Design Specificity Verdict

**LLM Assessment**:
The Guided Practice workspace shows strong domain ambition in its central artifact (the authentic ivory-white IB examination paper booklet with 28px ruled answer grids, KaTeX math typesetting, and question mark brackets). However, the surrounding chrome lapses into generic, disjointed software tropes: an unanchored horizontal paint toolbar resembling a toy drawing app, a floating landing-page header pill colliding with a second sticky question tabs bar, and an AI chat sidebar disconnected from the student canvas.

**Deterministic Scan**:
The Impeccable CLI static detector (`detect.mjs`) returned 0 findings across the target files. This is a false negative: the static scanner checks source text for code smells (such as purple gradients or AI font families), but cannot detect runtime CSS collisions, bounding box geometry, sticky offset conflicts, or JavaScript DOM scroll triggers.

**Browser Evidence (Chrome DevTools Protocol)**:
1. **Sticky Header Overlap**: The floating header (`sticky top-4`, height 56px, `z-40`) and the Question Tabs bar (`sticky top-12`, `z-20`) collide with a **24px vertical overlap**, rendering tabs 3 through 7 partially obscured.
2. **Toolbar Clipping**: The drawing toolbar has a fixed intrinsic width of **710.33px**, which exceeds its 7-column layout container (`max 648px - 700px`). The "Formula Booklet" trigger at the right is severely clipped by **58.62px**, truncating the button text to "Book".
3. **Window Scroll Hijacking**: SocraticSidebar triggers `messagesEndRef.current.scrollIntoView()`, violently scrolling the entire browser window down by **852px** on initial mount and hiding the question header and drawing tools.
4. **Toolbar Detachment**: Because the toolbar is static at `top: 166px` while the canvas working area begins at `top: 1145px`, the toolbar scrolls completely out of the viewport when students write their working.
5. **Control Triplication**: The Formula Booklet is rendered in the global header, the drawing toolbar, and the chat sidebar.

---

## Overall Impression

The core examination simulation is authentic, but the viewport architecture is fragmented. Students attempting high-stakes IB calculus revision are greeted with an auto-scrolling page, an obscured question selector, a drawing toolbar that gets clipped and then scrolls away, and a high-risk destructive button that can wipe their work. Unifying the navigation, anchoring a compact drawing dock to the canvas, and removing redundant controls will elevate this surface to world-class craft.

---

## What is Working

1. **Authentic IB Examination Paper Fidelity**: The physical booklet presentation in `DrawingCanvas.tsx` (masthead, candidate answer boxes, page indicators, and 28px ruled lines) creates genuine exam realism.
2. **Contextual Formula Booklet Citations**: Inline formula references in tutor responses with deep-link triggers into the drawer modal provide actionable revision assistance.
3. **Multimodal Working Capture**: Generating composite image snapshots from student canvas strokes allows Gemini vision to evaluate mathematical working without forcing typed LaTeX.

---

## Priority Issues (P0 to P3)

### [P0] Floating Header & Sticky Question Tabs Collision
- **What**: The global floating header pill (`top-4`, height 56px, `z-40`) physically overlaps the sticky Question Tabs bar (`top-12`, `z-20`) by 24px during scroll.
- **Why it matters**: Question numbers 3 through 7 are covered by the header pill; clicking tabs triggers misclicks or strikes the header background.
- **Fix**: Integrate the question navigation directly into the header bar for Guided Practice mode, or adjust the question bar offset to `top-20` (80px) with proper z-indexing so they never collide.
- **Suggested Command**: `$impeccable layout`

### [P1] Disappearing & Clipped Canvas Toolbar
- **What**: The drawing toolbar has an uncontained 710px width that clips the Booklet button by 58px on standard viewports, and scrolls off screen the moment a student works inside the answer box.
- **Why it matters**: Students cannot switch between pen, highlighter, and eraser while writing their derivation without scrolling hundreds of pixels back up.
- **Fix**: Anchor the toolbar as a persistent, compact floating dock (`sticky bottom-6 z-30`) over the canvas. Streamline tools to Pen, Highlighter, Eraser, 3 archival colors, and Undo/Redo, removing the duplicate Booklet trigger.
- **Suggested Command**: `$impeccable adapt`

### [P1] High-Risk Destructive "Delete" Action Without Safeguards
- **What**: A prominent red "Delete" button sits directly adjacent to "Redo" with zero confirmation dialog and no undo support.
- **Why it matters**: An accidental click or touch misfire instantly deletes 10 minutes of handwritten math working with zero recovery path.
- **Fix**: Move the clear action out of the primary drawing dock into the canvas header, require a two-step confirmation, and push canvas clear states to the undo history.
- **Suggested Command**: `$impeccable harden`

### [P2] Socratic Window Auto-Scroll Bug & Silent Working Ingestion
- **What**: `messagesEndRef.current.scrollIntoView()` violently scrolls the window down 852px upon page mount. Students also receive no visual indication that their canvas strokes are attached to AI tutor queries.
- **Why it matters**: Auto-scrolling disorients the user on load; lack of attachment status makes students uncertain whether the AI can see their diagrams.
- **Fix**: Confine chat scrolling to the internal messages container (`messagesContainerRef.current.scrollTop = ...`), and display a subtle "Canvas working attached" pill above the input.
- **Suggested Command**: `$impeccable clarify`

---

## Persona Red Flags

- **Alex (Power User)**: Displayed keyboard shortcuts (P, H, E) are missing active event listeners in code. The disappearing toolbar forces frequent context-switching between stylus and mouse.
- **Jordan (First-Timer)**: Overwhelmed by duplicate formula buttons and competing floating headers. Accidentally clicks "Delete" instead of "Redo" and loses all working.
- **Sam (Accessibility-Dependent)**: Color palette swatches lack accessible text labels; keyboard focus ring order is interrupted by conflicting z-index stacks.

---

## Minor Observations

- The 28px ruled lines grid lacks an authentic vertical margin line for subpart numbering ((a), (b)(i)).
- Mathematical equations in the question box are centered rather than following official IB left-aligned indented layout.
- The Socratic "Thinking..." state does not show token expenditure or pedagogical tier context.

---

## Questions to Consider

1. What if the Question Tabs were unified into the global header during Guided Practice, freeing up vertical space?
2. What if the drawing toolbar was anchored to the bottom of the canvas viewport so it is always accessible while drawing?
3. What if the destructive "Delete" action was removed from the primary toolbar and placed as a secondary control on the canvas?
