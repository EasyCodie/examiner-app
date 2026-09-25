# 04: Remove the Graph Studio and developer workbench from the app

**What to build:** Students opening Settings see only what matters to them: Marking depth and API key. The server-side Python graph renderer is gone. It evaluated request strings in a bypassable sandbox, and Vercel has no Python runtime.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The graph render API route, the Node spawner for the Python renderer and the Python script are deleted. The client fetch helper for that route is deleted if nothing else uses it. Client-side graph rendering used by the bundled papers keeps working.
- [ ] The Graph Studio, System Prompts and Response Schemas tabs are removed from Settings.
- [ ] The model picker (the server never reads it) and the hard-coded model badge are removed. Stored config without those fields still loads.
- [ ] `/api/render-graph` returns 404.
- [ ] Every bundled paper's diagrams still render.
- [ ] Settings opens and closes cleanly with zero console errors.
- [ ] `tsc`, `lint` and `build` pass.
