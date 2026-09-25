# 09: Harden the marking and tutor routes

**What to build:** Requests to the marking and tutor routes can't be used to run up cost or hang a function.

**Blocked by:** 06, 07

**Status:** done

- [x] Thinking budget is clamped on the server to 0–8192. The dynamic -1 is not allowed.
- [x] Caps apply to:
  - student text and tutor message lengths;
  - the number of subpart images;
  - the size of earlier-evaluation history;
  - the conversation window.
- [x] Images are accepted only as `data:image/(png|jpeg);base64,…`. URLs are rejected, which closes the arbitrary-URL fetch through OCR.
- [x] Each AI route sets `maxDuration`. A timeout actually aborts the Gemini request rather than only racing it. Verify how `@google/genai` takes an abort signal through context7 before coding.
- [x] Error responses are generic with a `code`; details are logged only on the server.
- [x] Checked with curl:
  - a budget of 99999 is clamped;
  - an `http://` image is rejected;
  - an oversized text is rejected.
- [x] Browser automation: normal marking and tutoring still work.
- [x] `tsc`, `lint` and `build` pass.

## Comments

- `src/lib/requestLimits.ts` holds the limits and checks. It is tested in `scratch/test-request-limits.ts`.
  - The thinking budget is clamped to 0–8192; non-numbers fall back to the route default.
  - Text is capped at 20,000 characters and a tutor message at 2,000.
  - Up to 12 working boxes, 60 earlier evaluations and 100 conversation messages are accepted.
  - Images must be PNG or JPEG `data:` URLs.
  - `normalizeFileInput` in the GLM-OCR client also refuses any `scheme://` input.
- `maxDuration` is set per route:
  - grade 300 s, with marking stopping itself at 270 s;
  - socratic 120 s, with the tutor stopping at 110 s;
  - test-key 30 s, with an 8 s timeout on each model.
- Each Gemini attempt passes `abortSignal: AbortSignal.timeout(min(per-attempt, time left))`.
- A key Gemini rejects stops the model loop at once. The route returns 401 `INVALID_KEY`, and the results and learn pages show the "needs a valid Gemini API key" prompt instead of "not marked" or "unavailable".
- Errors are generic, each with a code:
  - `BAD_REQUEST`, `INVALID_KEY`, `MARKING_FAILED`, `TUTOR_UNAVAILABLE`, `TUTOR_FAILED`;
  - test-key: `NO_KEY`, `INVALID_KEY`, `GEMINI_UNAVAILABLE`, `ZAI_FAILED`.
  - The test-key route no longer returns raw error messages.
- The Settings grading slider now tops out at 8192 to match the server clamp. It went to 16384.
- Checked with curl:
  - no key → 401;
  - an `http://` canvas image or snapshot → 400;
  - 20,001 characters of text → 400;
  - bad JSON → 400;
  - a rejected key → 401 `INVALID_KEY` in 0.1–0.3 s on grade, socratic and test-key;
  - an empty test key → 400.
  - With the real key, `thinkingBudget: 99999` marked a question and returned 200. The dev log showed the per-attempt abort working: the first model hung and was aborted at 150 s, the second returned 503, and the third marked it.
- Browser:
  - t06: a stubbed 502 on question 2(a) gives "not marked", and retry re-marks from 2(a) only.
  - t09: a rejected key at hand-in shows the key prompt, keeps the session and records no grade.
  - t07: tiers 1–3 stay locked, tier 4 unlocks, and a rejected key shows the key prompt.
- Code review: the total size of the earlier-evaluation history is capped too (400,000 characters of JSON), and the entry cap was raised to 200 so a long ingested paper can't get stuck on a count limit. A requested thinking budget of 0 is now honoured instead of becoming 8192. A 413 from the host names the oversized working instead of reporting a generic failure.
