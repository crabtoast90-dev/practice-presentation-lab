# Presentation Lab

**Open: https://crabtoast90-dev.github.io/practice-presentation-lab/** (`?debug` shows FPS, `?hero=knight`, `?tab=C`, `?size=showcase`, `?take=4` shows another Kling attempt)

Which in-game format sells an adult anime character as attractive and alive, for the least effort? Two heroes, one tab per format (A shader card, B shader puppet, C Kling reveal, D toon 3D), each at CARD and SHOWCASE size, and a SCORE panel.

How it was built and why: `PLAN.md` (lanes), `DECISIONS.md` (every call), `RESULTS.md` (scores and effort per format), `COSTS.md` (every paid call), `LOG.md` (sessions, time and scores), `CREDITS.md`.

## For developers
- Run locally: `npm install`, then `npm run dev`.
- Self-check: `npm run check` (builds, shows every hero x tab x size headless on laptop and phone, screenshots to `check-output/`). `npm run check -- --url=https://crabtoast90-dev.github.io/practice-presentation-lab/` checks the live site.
- Numbers: `src/lab/data.js`. Formats: `src/formats/`. Shared UI: `src/ui/`.
- Session time: `npm run log-time` (see `CLAUDE.md`).
