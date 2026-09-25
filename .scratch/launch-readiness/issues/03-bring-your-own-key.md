# 03: Every user brings their own Gemini key

**What to build:** The server never spends the owner's API quota. An AI request without a user key is refused with a clear, machine-readable "no key" answer. Every screen that calls AI turns that answer into the "add your key" prompt, instead of guessing from the error text. An empty key can never be saved as valid.

Context: this was decided for sharing with 20–30 classmates on Vercel Hobby. The server env keys (`GEMINI_API_KEY`, `ZAI_API_KEY`) stop being used at runtime.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The Gemini client and the GLM-OCR key resolution use only the key the client supplies. There is no env fallback.
- [ ] The tutor, grading, session evaluation and ingest routes return HTTP 401 with `code: 'NO_KEY'` when no Gemini key header is sent.
- [ ] The key test refuses an empty key (400) and no longer echoes model output.
- [ ] Results, ingest and guided practice show the key prompt on `code === 'NO_KEY'`. The "error text mentions GEMINI" heuristic is removed.
- [ ] Settings never saves an empty key.
- [ ] Checked with the dev server running and `.env.local` keys removed:
  - a curl POST to each AI route with no key returns 401 `NO_KEY`;
  - in the browser, handing in with no key shows the key prompt, not marks.
- [ ] `tsc`, `lint` and `build` pass, with zero console errors on the flows touched.
