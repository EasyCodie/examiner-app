# 07: Honest Socratic tutor with tiers enforced on the server

**What to build:**
- When the model is unavailable, the tutor says so and lets the student try again. It never gives canned replies.
- Scaffold tiers are enforced by the server, not trusted from the model or the client. Tiers 1–3 never unlock or leak the markscheme.
- Tier 4 gives the real markscheme walkthrough: the markscheme excerpt is included in the prompt only at tier 4, so the walkthrough is grounded instead of invented.

Context: the tier rules are in PRODUCT.md, and ADR 0002 covers exam conditions versus scaffolding.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The simulated tutor fallback and the test-only re-export from the route are removed.
- [ ] Malformed model JSON gives a friendly "tutor unavailable" response, not a 500 crash.
- [ ] The response's active tier always equals the requested tier. The markscheme unlocks only at tier 4.
- [ ] Browser automation in guided practice, with a real key:
  - tiers 1–3 show no markscheme content;
  - tier 4 shows the walkthrough;
  - an invalid key shows the unavailable state.
- [ ] Zero console errors.
- [ ] `tsc`, `lint` and `build` pass.
