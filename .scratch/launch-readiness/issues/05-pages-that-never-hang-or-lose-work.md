# 05: Pages that never hang or silently lose work

**What to build:**
- If browser storage (IndexedDB) fails, a student gets a clear error state instead of an endless "Opening…" screen.
- Unknown URLs and runtime crashes show Subject Report styled pages instead of the Next.js defaults.
- Guided practice warns before a student leaves with unsaved working, chat or a draft.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Home, the timed exam, results and guided practice all handle a rejected storage read with a visible error and a way back home.
- [ ] A custom not-found page and error boundary follow the Subject Report system (DESIGN.md). Check the Next 16 file conventions in `node_modules/next/dist/docs/` first.
- [ ] Guided practice warns on reload/close and on header mode switches, only when there is unsaved work.
- [ ] Browser automation checks each case:
  - an unknown route shows the custom 404;
  - a forced storage failure shows the error state;
  - the leave warning fires with work and doesn't fire without it.
- [ ] Zero unexpected console errors.
- [ ] `tsc`, `lint` and `build` pass.
