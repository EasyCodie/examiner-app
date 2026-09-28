# 10: First-visit key setup

**What to build:** A classmate arriving for the first time understands they need a free Gemini key and can add one in under a minute.
- Home shows an "Add your free Gemini key" callout with three plain steps and a link to Google AI Studio. The callout disappears once a key is saved.
- Settings opens straight on the key tab when no key is saved. The copy is written for students, and Z.AI is clearly optional.
- Sitting a paper still works without a key. Marking waits for the key and then resumes the saved session.

**Blocked by:** 03, 04

**Status:** done

- [x] The callout follows the Subject Report system and shows only when no key is saved.
- [x] The key-tab copy has no developer jargon (no env files, model version strings or "SOTA").
- [x] A key test that fails because Gemini is busy, not because of an auth error, still saves the key, with a warning.
- [x] Browser automation from a fresh profile:
  - the callout shows;
  - Settings opens on the key tab;
  - with no key, hand-in keeps the session and shows the key prompt;
  - after a real key is added, marking resumes and the callout is gone.
- [x] Zero console errors.
- [x] `tsc`, `lint` and `build` pass.

## Comments

- The home page reads the saved config. If there's no key, it shows "Add your free Gemini key": three ruled steps, a Google AI Studio link and "Add your key", which opens Settings on the key tab. While the config is still loading the state is unknown, so the callout never flashes for someone who already has a key.
- The Settings drawer switches itself to the key tab whenever no key is saved. With a key it opens on Marking Depth, as before.
- Key-tab copy is rewritten for students:
  - it explains what the key is for, with three steps to get one;
  - it says where the key lives: it stays in this browser and passes through to Google with each request;
  - "Z.AI key (optional)" says plainly that you don't need it.
  - The `GEMINI_API_KEY`, `.env.local`, `ZAI_API_KEY`, "SOTA" and model-version text is gone.
  - Labels are tied to their inputs, and each result is a glyph plus a word: "Saved", "Saved, not confirmed", "Not saved".
- Keys are trimmed. Test and save stays disabled for an empty or whitespace-only key.
- If the test reports `GEMINI_UNAVAILABLE`, the key is saved with a warning. `INVALID_KEY` and other failures do not save it.
- `AppShell` gains `onAiKeySaved(listener)`. The drawer calls the listeners after saving a Gemini key.
  - The home page hides the callout.
  - A results page stopped at the key prompt resumes marking from the first unmarked question, without the student pressing retry.
  - It is a subscription rather than a counter, because `react-hooks/set-state-in-effect` forbids starting marking from an effect.
- Browser test (t10, fresh Chrome profile, 1440 wide), all 24 checks passed:
  - The callout shows, and Settings in the header opens on the key tab.
  - Save is disabled for an empty or whitespace-only key.
  - A rejected key gives "Not saved" and nothing is stored.
  - Sitting and handing in without a key sends no grade request, shows the key prompt and keeps the session.
  - Adding the real key (padded with spaces) while the test was stubbed as "Gemini busy" stored the key trimmed, with "Saved, not confirmed". Marking then resumed by itself and question 1 came back 200.
  - Afterwards the callout is gone, and Settings opens on Marking Depth.
  - The only console entries were the expected 401 and 502 from the key test.
- `tsc`, lint and build pass.
