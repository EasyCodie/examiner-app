# 11: Subject Report design fixes

**What to build:** Every surface a classmate touches follows DESIGN.md: the two inks, the focus rule, the tokens, and the IB-style (not "official") claims.

**Blocked by:** 04, 10

**Status:** ready-for-agent

- [ ] Bold text inherits its ink, so bold examiner comments stay ultramarine. Rendered markdown tables use tokens only: no slate palette, no shadow.
- [ ] Settings drawer:
  - standard focus outline, so ultramarine is no longer used as the focus colour;
  - every label is tied to its input;
  - sliders have accessible names;
  - tabs expose their selected state;
  - radii follow the spec;
  - no mono or uppercase styling on prose.
- [ ] The bundled specimen is listed first. The May 2021 past paper has a distinct title, so home never shows two identical rows.
- [ ] The dead legacy dual-upload dropzone component is deleted.
- [ ] The diagram sketchpad offers only the two inks.
- [ ] The missing DESIGN.md colours become tokens: ink-hover, slip-hover, lost-deep, ruling, selection.
- [ ] The paragraph-inside-div hydration warning in the examiner review is fixed.
- [ ] PDF fields have accessible names.
- [ ] Paragraph starters no longer insert raw markdown.
- [ ] `color-scheme` is declared.
- [ ] Mode labels ("Timed exam" / "Guided practice") are the same across header, home and ingest. "Formula clue" is hidden on Economics.
- [ ] PRODUCT.md drops the stale "official markscheme", "sub-second" and "telemetry drawer" claims.
- [ ] Browser automation at desktop width across home, the timed exam, results, guided practice and ingest, with zero console errors.
- [ ] `tsc`, `lint` and `build` pass.
