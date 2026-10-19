# Presentation Lab

When the user asks for ideas, options, or a plan, give them that and stop.

## What this is
A practice lab that answers one question: which in-game format sells an adult anime character as attractive and alive, for the least effort? One page, two heroes (sorceress gets every format, knight gets A and C), tabs per format (A shader card, B shader puppet, C Kling reveal, D toon 3D, E optional Unity), a CARD / SHOWCASE size toggle and a SCORE panel. No game, no sim.
- Content: the character is clearly adult, suggestive but covered, no nudity. Discard any generated output that is off-model, looks younger or shows more than the source.
- Out of scope goes in `IDEAS.md`.

The user (Brian) is a game designer, not a programmer: report in plain language, no code. He makes taste calls; you make every technical call. Log his calls in `DECISIONS.md`, and yours marked *(my call)*.

## How it's built
- Vite + three.js (pinned), plain JS. `src/main.js` switches hero / tab / size; each format is one file in `src/formats/`. Every number lives in `src/lab/data.js` (`?tune=foil.strength:0.5` tries one).
- SHARED files (name them in PLAN items): tab bar + hero switch `src/ui/tab-bar.js`, size toggle `src/ui/size-toggle.js`, score panel `src/ui/score-panel.js`, showcase framing `src/formats/fit.js`, plus `src/main.js`, `index.html`, `src/style.css`, `scripts/check.mjs`.
- Hero sources in `hero/`; web copies in `public/heroes/`, reveal clips in `public/reveal/`. Tools in `tools/` (Kling call, seam test, encoders).
- Hooks: `?test` (clock moves only on `window.__game.advance(ms)`), `?hero=knight`, `?tab=C`, `?size=showcase`, `?take=N` (another Kling attempt), `?debug` (FPS), `window.__game.state() / show({hero,tab,size})`.

## Money (hard rules)
Budget $20: $10 fal (`FAL_KEY`), $10 RunPod (`RUNPOD_API_KEY`), injected by the cloud proxy. Log every paid call in `COSTS.md` (date, service, what, cost, running total). Ask before any single call over $2, and again at $16 total. Shut down every RunPod pod as soon as its job ends and confirm it is off. Never create accounts, enter payment details or buy anything. fal's checker flags words like "nudity" even in a negative prompt: keep prompts neutral.

## Self-check
`npm run check` builds and shows every hero x tab x size on laptop and phone, saving screenshots and `summary.txt` to `check-output/`. It fails on console errors, failed requests, a frozen format, a card out of frame, broken controls or score saving, and a phone load over 5 s. Phone FPS (target 30) is reported; the cloud has no GPU, so low FPS is a note to confirm on the phone with `?debug`. `npm run check -- --url=https://crabtoast90-dev.github.io/practice-presentation-lab/` checks the live site. Open the screenshots and describe them in one line before calling anything done.

## Deploy and merge rule
Every push to `main` deploys to https://crabtoast90-dev.github.io/practice-presentation-lab/. Work on your own branch. The check must pass and you must open its screenshots. Rebase on main, recheck if main moved, merge one branch at a time.

## Files to keep up to date
`PLAN.md` (tick items), `DECISIONS.md`, `COSTS.md`, `RESULTS.md` (scores + effort per format: Brian's minutes, agent sessions, dollars), `CREDITS.md` (every tool and model, same day), `IDEAS.md`.

## End of every session
Ask for fresh fun and look scores (1-5) for the session and "Anything annoy you this session?" (his words go in the notes). Write the `LOG.md` row (time columns `-`), commit, and as the very last step run `npm run log-time -- --row="<session name>" --session=<session id>`, then commit and merge `timelog/` and `LOG.md`.
