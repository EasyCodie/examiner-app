# 09: Harden the marking and tutor routes

**What to build:** Requests to the marking and tutor routes can't be used to run up cost or hang a function.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] Thinking budget is clamped on the server to 0–8192. The dynamic -1 is not allowed.
- [ ] Caps apply to:
  - student text and tutor message lengths;
  - the number of subpart images;
  - the size of earlier-evaluation history;
  - the conversation window.
- [ ] Images are accepted only as `data:image/(png|jpeg);base64,…`. URLs are rejected, which closes the arbitrary-URL fetch through OCR.
- [ ] Each AI route sets `maxDuration`. A timeout actually aborts the Gemini request rather than only racing it. Verify how `@google/genai` takes an abort signal through context7 before coding.
- [ ] Error responses are generic with a `code`; details are logged only on the server.
- [ ] Checked with curl:
  - a budget of 99999 is clamped;
  - an `http://` image is rejected;
  - an oversized text is rejected.
- [ ] Browser automation: normal marking and tutoring still work.
- [ ] `tsc`, `lint` and `build` pass.
