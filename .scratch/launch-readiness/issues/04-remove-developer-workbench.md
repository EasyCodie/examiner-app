# 04: Remove the Graph Studio and developer workbench from the app

**What to build:** Students opening Settings see only what matters to them: Marking depth and API key. The server-side Python graph renderer is gone. It evaluated request strings in a bypassable sandbox, and Vercel has no Python runtime.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The graph render API route, the Node spawner for the Python renderer and the Python script are deleted. The client fetch helper for that route is deleted if nothing else uses it. Client-side graph rendering used by the bundled papers keeps working.
- [x] The Graph Studio, System Prompts and Response Schemas tabs are removed from Settings.
- [x] The model picker (the server never reads it) and the hard-coded model badge are removed. Stored config without those fields still loads.
- [x] `/api/render-graph` returns 404.
- [x] Every bundled paper's diagrams still render.
- [x] Settings opens and closes cleanly with zero console errors.
- [x] `tsc`, `lint` and `build` pass.

## Comments

- There was no model picker in the UI. The vestige was the never-read `modelName`, reasoning-effort and `temperature` fields in the stored config. They were removed from the type and defaults. The config loader spreads stored values over the defaults, so old stored configs with those fields still load.
- Nothing else used the graph-spec module, so it was deleted. The bundled May 2021 Q1 diagram now imports its static SVG directly.
- The static Q12 SVG had `height="auto"`, which logged a console error on every page showing it. The attribute was removed; `viewBox` plus `width="100%"` sizes it.
- Verified in the browser: Settings shows only Marking Depth and API Settings, and it opens and closes. `/api/render-graph` returns 404. The May 2021 Q1 diagram renders. Zero console errors.
