# 08: Harden paper upload (ingest)

**What to build:** A student uploading a question paper and markscheme gets fast, clear feedback.
- A pair that is too large for Vercel's 4.5 MB request cap, or isn't PDFs, is refused in the browser with a plain message, and checked again on the server.
- Ingestion finishes or fails cleanly within the function's time limit instead of hanging.
- Model or OCR failures show a friendly message; raw upstream errors and setup hints never reach the student.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Client-side check of the combined size and PDF type before upload. The server re-checks MIME type and size.
- [ ] The model fallback loop has an overall deadline within the route's `maxDuration`. The OCR request has a timeout. Check the Hobby limits and Next 16 route segment config docs first.
- [ ] Truncated or malformed model output, and a question missing its number, fail with a friendly error.
- [ ] Error responses are generic and carry a `code`; details are logged only on the server. The pipeline log file writer and its console logging are removed.
- [ ] Browser automation: a small PDF pair ingests; an oversize pair and a non-PDF are refused with clear copy.
- [ ] Zero console errors.
- [ ] `tsc`, `lint` and `build` pass.
