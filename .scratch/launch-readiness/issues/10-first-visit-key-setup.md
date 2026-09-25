# 10: First-visit key setup

**What to build:** A classmate arriving for the first time understands they need a free Gemini key and can add one in under a minute.
- Home shows an "Add your free Gemini key" callout with three plain steps and a link to Google AI Studio. The callout disappears once a key is saved.
- Settings opens straight on the key tab when no key is saved. The copy is written for students, and Z.AI is clearly optional.
- Sitting a paper still works without a key. Marking waits for the key and then resumes the saved session.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] The callout follows the Subject Report system and shows only when no key is saved.
- [ ] The key-tab copy has no developer jargon (no env files, model version strings or "SOTA").
- [ ] A key test that fails because Gemini is busy, not because of an auth error, still saves the key, with a warning.
- [ ] Browser automation from a fresh profile:
  - the callout shows;
  - Settings opens on the key tab;
  - with no key, hand-in keeps the session and shows the key prompt;
  - after a real key is added, marking resumes and the callout is gone.
- [ ] Zero console errors.
- [ ] `tsc`, `lint` and `build` pass.
