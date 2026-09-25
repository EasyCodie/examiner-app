# 05: Pages that never hang or silently lose work

**What to build:**
- If browser storage (IndexedDB) fails, a student gets a clear error state instead of an endless "Opening…" screen.
- Unknown URLs and runtime crashes show Subject Report styled pages instead of the Next.js defaults.
- Guided practice warns before a student leaves with unsaved working, chat or a draft.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Home, the timed exam, results and guided practice all handle a rejected storage read with a visible error and a way back home.
- [x] A custom not-found page and error boundary follow the Subject Report system (DESIGN.md). Check the Next 16 file conventions in `node_modules/next/dist/docs/` first.
- [x] Guided practice warns on reload/close and on header mode switches, only when there is unsaved work.
- [x] Browser automation checks each case:
  - an unknown route shows the custom 404;
  - a forced storage failure shows the error state;
  - the leave warning fires with work and doesn't fire without it.
- [x] Zero unexpected console errors.
- [x] `tsc`, `lint` and `build` pass.

## Comments

- Home still lists the bundled papers when storage fails, because the repository falls back to them. It shows a "Your saved work couldn't be opened" section with a Reload button in place of the saved sessions. Mock, results and learn replace the endless "Opening…" state with a full-page notice that links back to the papers.
- The leave warning triggers on any unsaved work: strokes, typed answers or diagrams, a sent student message, or an unsent draft in the tutor box. The sidebar reports the draft through `onDraftChange`. A window-level capture listener intercepts links that leave the page, such as the logo and the mode switch, before Next's `Link` handles them. It then asks through a `ReportDialog`. Switching questions stays on the same path and is never intercepted.
- `error.tsx` uses the Next 16.3 `retry` prop.
- Browser checks passed:
  - `/no-such-page` shows the custom 404 with HTTP status 404.
  - With `IDBFactory.open` forced to throw, home, mock, results and learn all show the notice.
  - With no work, the logo navigates straight home.
  - With a draft, the logo and "Timed exam" open the dialog. Stay keeps the draft, and Leave navigates.
  - `beforeunload` is prevented only while there is work.
  - Zero console errors.
