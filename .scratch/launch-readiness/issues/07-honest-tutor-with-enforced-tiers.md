# 07: Honest Socratic tutor with tiers enforced on the server

**What to build:**
- When the model is unavailable, the tutor says so and lets the student try again. It never gives canned replies.
- Scaffold tiers are enforced by the server, not trusted from the model or the client. Tiers 1–3 never unlock or leak the markscheme.
- Tier 4 gives the real markscheme walkthrough: the markscheme excerpt is included in the prompt only at tier 4, so the walkthrough is grounded instead of invented.

Context: the tier rules are in PRODUCT.md, and ADR 0002 covers exam conditions versus scaffolding.

**Blocked by:** 03

**Status:** done

- [x] The simulated tutor fallback and the test-only re-export from the route are removed.
- [x] Malformed model JSON gives a friendly "tutor unavailable" response, not a 500 crash.
- [x] The response's active tier always equals the requested tier. The markscheme unlocks only at tier 4.
- [x] Browser automation in guided practice, with a real key:
  - tiers 1–3 show no markscheme content;
  - tier 4 shows the walkthrough;
  - an invalid key shows the unavailable state.
- [x] Zero console errors.
- [x] `tsc`, `lint` and `build` pass.


## Comments

- `tutor.ts` exposes two pure seams, covered by `scratch/verify-lockdown.ts` section 6:
  - `buildTutorPrompt` puts the markscheme excerpt, mark codes and ECF rule in the prompt only at Tier 4.
  - `shapeTutorReply` parses the JSON reply, sets `tierActive` to the requested tier, and sets `unlockedMarkscheme` to `tier === 4`. Bad JSON or a reply with no text throws `TutorUnavailableError`.
- `/api/socratic` answers `TutorUnavailableError` with 502 `TUTOR_UNAVAILABLE` and a plain message. With no key, the module throws `MissingKeyError`. The simulator and the route's test re-export are gone.
- Found during browser testing and fixed here: at Tier 3 the tutor claimed "You wrote du = 4x dx" on a blank canvas. The prompt always said working was attached, and the page always sent the blank canvas. The page now sends the snapshot only when the question has strokes. The prompt tells the model there is no working when no text or image is sent.
- Failure copy is now one sentence from the server, for example "The tutor is unavailable right now. Try again in a moment." It used to be wrapped in "The tutor couldn't reply (…)". The client no longer `console.error`s tutor failures, because the sidebar shows them.
- ADR 0004's tutor entry is updated.
- Browser checks with the real key on the specimen:
  - Tiers 1–3 replied with the matching tier and `unlockedMarkscheme: false`. No markscheme phrases appeared ("13/3", mark code descriptions), and there was no `isSimulated` field.
  - No snapshot was sent before drawing. After drawing, the Tier 3 request carried the image.
  - Tier 4 unlocked and walked through M1/A1 with the markscheme's limits.
  - An invalid key gave 502 `TUTOR_UNAVAILABLE` and the unavailable alert. Try again recovered.
  - The happy path had zero console errors. The failure path showed only the expected 502 resource log.
- Gemini took up to 2 minutes to reply on one retry. Ticket 09's timeouts cover this.
