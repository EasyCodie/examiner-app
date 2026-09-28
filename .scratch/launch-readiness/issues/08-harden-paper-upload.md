# 08: Harden paper upload (ingest)

**What to build:** A student uploading a question paper and markscheme gets fast, clear feedback.
- A pair that is too large for Vercel's 4.5 MB request cap, or isn't PDFs, is refused in the browser with a plain message, and checked again on the server.
- Ingestion finishes or fails cleanly within the function's time limit instead of hanging.
- Model or OCR failures show a friendly message; raw upstream errors and setup hints never reach the student.

**Blocked by:** 03

**Status:** done

- [x] Client-side check of the combined size and PDF type before upload. The server re-checks MIME type and size.
- [x] The model fallback loop has an overall deadline within the route's `maxDuration`. The OCR request has a timeout. Check the Hobby limits and Next 16 route segment config docs first.
- [x] Truncated or malformed model output, and a question missing its number, fail with a friendly error.
- [x] Error responses are generic and carry a `code`; details are logged only on the server. The pipeline log file writer and its console logging are removed.
- [x] Browser automation: a small PDF pair ingests; an oversize pair and a non-PDF are refused with clear copy.
- [x] Zero console errors.
- [x] `tsc`, `lint` and `build` pass.


## Comments

- `src/lib/ingestion/uploadLimits.ts` is client-safe:
  - `MAX_UPLOAD_BYTES` is 4 MB, under Vercel's 4.5 MB body cap with room for the multipart envelope.
  - `checkUploadPair` produces the student-facing message.
  - `isPdfBytes` checks the `%PDF-` signature.
  - The ingest page disables "Build the paper" and shows the size message as soon as an oversize pair is picked.
- `/api/ingest` checks, in order:
  - `content-length` before reading the body (413 `TOO_LARGE`);
  - both files are present (`MISSING_FILES`);
  - the combined size;
  - the PDF signature (`NOT_PDF`).
- `/api/ingest` maps `IngestionError` codes to friendly copy:
  - `INVALID_KEY` → 401;
  - `MODELS_UNAVAILABLE` → 502;
  - `UNREADABLE_OUTPUT` → 422;
  - anything else → 500 `INGEST_FAILED`.
- All detail goes to the server log only.
- `maxDuration` is 300, which Vercel's docs (via context7) give as the Hobby default and maximum with Fluid compute. The pipeline has a 270 s deadline. Each model attempt gets `abortSignal: AbortSignal.timeout(min(120 s, time left))`, which the `@google/genai` docs confirm, so a slow model is cancelled, not just raced. `generateWithTimeout` had no other users and is removed.
- The GLM-OCR fetch has `AbortSignal.timeout(60 s)`.
- `parseManifestOutput` is a pure seam, tested in `scratch/test-ingest-output.ts`. It throws `UNREADABLE_OUTPUT` for truncated or malformed JSON, no questions, or a question without a number.
- The pipeline log writer, its `fs` use and its console logging are gone. `onProgress` is kept.
- Added (security): `sanitizeSvg` now strips `script`, `foreignObject`, `iframe`, `object`, `embed`, `style`, animation elements, `<a>`, `on*` handlers and non-fragment `href`s. Ingested SVG is rendered with `dangerouslySetInnerHTML`, and a crafted PDF could otherwise steer the model into writing an `onload` handler. That handler would run where the student's key is stored.
- An invalid key now fails fast (`isInvalidKeyError` in `gemini.ts`, 0.5 s) instead of trying all four models. The page treats `INVALID_KEY` like `NO_KEY` and offers "Add an API key".
- Checked with curl: no key → 401 `NO_KEY`; 4.3 MB → 413; a non-PDF with a `.pdf` name → 400 `NOT_PDF`; one file → 400; a bad key → 401 `INVALID_KEY`.
- Browser checks with the real key: a `.txt` is refused, an oversize pair gets the size message with Build disabled, and a generated 2-question PDF pair ingested in 5 s (2 questions, 9 marks, pages 1–2) and was saved. Zero console errors.
- The "`GEMINI_API_KEY` / `.env.local`" copy in the Settings key tab is left for ticket 10, which rewrites that tab.
