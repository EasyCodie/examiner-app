---
version: 1.0.0
name: Cursor-Dark-Examiner
description: Dark-mode Cursor developer-tools design system for the IB Examiner application. A quietly-confident, distraction-free environment featuring a deep warm obsidian canvas (#0c0d0e), dark editor panes (#141517), surface cards (#1a1b1e), hairline-only depth (1px white/8%), and a single high-voltage brand accent of Cursor Orange (#f54e00). Incorporates signature pastel timeline pills (thinking, read, index, codes, done) for AI agent pipelines, display weight at 400 with negative tracking for an editorial feel, and JetBrains Mono across all code, manifest, and examination metadata surfaces.

colors:
  primary: "#f54e00"
  primary-active: "#d04200"
  canvas: "#0c0d0e"
  canvas-soft: "#141517"
  surface-card: "#1a1b1e"
  surface-strong: "#222428"
  surface-hover: "#26282d"
  hairline: "rgba(255, 255, 255, 0.08)"
  hairline-strong: "rgba(255, 255, 255, 0.16)"
  text-strong: "#f3f3f2"
  text-body: "#9b9a95"
  text-muted: "#686763"
  on-primary: "#ffffff"
  timeline-thinking: "#dfa88f"
  timeline-read: "#9fbbe0"
  timeline-grep: "#9fc9a2"
  timeline-codes: "#c0a8dd"
  timeline-done: "#c08532"
  semantic-error: "#cf2d56"
  semantic-success: "#1f8a65"

typography:
  display-lg:
    fontFamily: "'Sora', sans-serif"
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.03em
  display-md:
    fontFamily: "'Sora', sans-serif"
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: -0.02em
  title-md:
    fontFamily: "'Sora', sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
  body-md:
    fontFamily: "'Sora', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "'Sora', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
  badge:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.2

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  pill: 9999px

spacing:
  base: 16px
  section: 64px
---

## Brand & Aesthetic Principles

1. **Quiet Developer Confidence**: Deep warm obsidian floor (`#0c0d0e`) with surface panes (`#141517` / `#1a1b1e`). No colorful background gradients, no messy shadows.
2. **Cursor Orange Scarcity**: `#f54e00` is reserved strictly for primary actions, active highlights, and status pulses.
3. **Display Weight at 400**: Headings sit at regular weight with subtle negative letter spacing (-0.02em to -0.03em), evoking an editorial publication rather than tech marketing hype.
4. **Hairline-Only Depth**: Exactly 1px border (`rgba(255, 255, 255, 0.08)`). No drop shadows.
5. **AI Timeline Signature**: The 5-stage pastel pill sequence (Peach Thinking, Blue Reading, Mint Indexing, Lavender Codes, Gold Done) illuminates the ground-truth ingestion pipeline.
6. **JetBrains Mono Everywhere Necessary**: Manifest keys, mark codes (M1, A1, R1), command terms, timers, and mathematical formulas.
