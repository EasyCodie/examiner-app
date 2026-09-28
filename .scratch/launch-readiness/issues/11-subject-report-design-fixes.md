# 11: Subject Report design fixes

**What to build:** Every surface a classmate touches follows DESIGN.md: the two inks, the focus rule, the tokens, and the IB-style (not "official") claims.

**Blocked by:** 04, 10

**Status:** done

- [x] Bold text inherits its ink, so bold examiner comments stay ultramarine. Rendered markdown tables use tokens only: no slate palette, no shadow.
- [x] Settings drawer:
  - standard focus outline, so ultramarine is no longer used as the focus colour;
  - every label is tied to its input;
  - sliders have accessible names;
  - tabs expose their selected state;
  - radii follow the spec;
  - no mono or uppercase styling on prose.
- [x] The bundled specimen is listed first. The May 2021 past paper has a distinct title, so home never shows two identical rows.
- [x] The dead legacy dual-upload dropzone component is deleted.
- [x] The diagram sketchpad offers only the two inks.
- [x] The missing DESIGN.md colours become tokens: ink-hover, slip-hover, lost-deep, ruling, selection.
- [x] The paragraph-inside-div hydration warning in the examiner review is fixed.
- [x] PDF fields have accessible names.
- [x] Paragraph starters no longer insert raw markdown.
- [x] `color-scheme` is declared.
- [x] Mode labels ("Timed exam" / "Guided practice") are the same across header, home and ingest. "Formula clue" is hidden on Economics.
- [x] PRODUCT.md drops the stale "official markscheme", "sub-second" and "telemetry drawer" claims.
- [x] Browser automation at desktop width across home, the timed exam, results, guided practice and ingest, with zero console errors.
- [x] `tsc`, `lint` and `build` pass.

## Comments

- "Formula clue" is renamed rather than hidden on Economics: the ladder needs tier 2, so subjects without a formula booklet get "Concept clue: The concept or theory that applies", and the tutor's quote box uses the same label.
- `color-scheme: dark` is declared on the shell. The paper surface needs no override, because its only native controls are visually hidden file inputs.
- PRODUCT.md now says the manifest pairs a paper with *its* markscheme, the tutor has no "sub-second" claim, tier 4 is a "Markscheme Walkthrough", and the telemetry drawer is replaced by the Settings drawer.
- Verified with a desktop-width (1440) browser run across home, the Settings drawer, a timed exam through to results (canned grade responses), guided practice (Economics and Maths) and ingest: 29 checks, zero console errors. `tsc`, `lint` and `build` pass.
