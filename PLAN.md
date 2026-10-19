# Plan

Each item can be pasted alone into a fresh session. Every session reads `CLAUDE.md` first, follows the money rules and the merge rule, adds steps to `npm run check` for what it builds, logs paid calls in `COSTS.md`, and writes effort (Brian's minutes, agent sessions, dollars) next to the format's scores in `RESULTS.md`.

**Lanes:** items in different lanes touch different files and can run at the same time; inside a lane, in order.
**SHARED files** (name them when an item touches them; the second branch to merge rebases and reruns the check):
- tab bar + hero switch: `src/ui/tab-bar.js` (and `FORMATS` in `src/lab/data.js`)
- size toggle: `src/ui/size-toggle.js` (layout in `src/style.css`: `#hand`, `#slot`)
- score panel: `src/ui/score-panel.js`
- showcase framing: `src/formats/fit.js`
- `src/main.js` (one `else if` per format), `index.html`, `src/style.css`, `scripts/check.mjs`, `src/lab/data.js` (each lane edits its own block)

## Lane A: shader card (setup session)
- [x] **A0. Setup.** Starter from the game kit, sim dropped, lab shell (tab bar, hero switch, size toggle, score panel), Pages deploy, check on laptop and phone with screenshots for every tab at both sizes, phone load time and FPS, PLAN / COSTS / DECISIONS / CREDITS / RESULTS.
- [x] **A1. Shader card.** `src/formats/shader-card.js`, masks `public/heroes/*-fx.png` (BiRefNet). Hover/drag tilt, holo foil, rim light, halo, idle bob, both heroes, both sizes. *Done when:* the check shows A for both heroes at both sizes on laptop and phone and the tilt test passes.

## Lane C: Kling reveal (setup session)
- [x] **C1. Card-is-born reveal.** `tools/kling.sh` (Kling 3.0 Pro on fal, hero as start and end frame, 5 s), `tools/seam.py`, `tools/encode-reveal.sh`, `src/formats/reveal.js`, clips in `public/reveal/`. 3-4 attempts per hero, best kept as WebM, the rest behind `?take=N`. *Done when:* both heroes play the reveal at both sizes, seam under 3/255, cost per keeper in COSTS.md and RESULTS.md.

## Lane B: shader puppet (sorceress only)
- [ ] **B1. Split into layers with See-through on RunPod.** Read https://github.com/mitmul/see-through first and say what GPU and how long it needs. Start one RunPod pod through the REST API (`rest.runpod.io`, key injected), run See-through on `hero/herosorceress.png`, download the layers to `hero/layers/`, then terminate the pod and confirm with the API that it is gone. Estimate the cost first: ask Brian if one run could pass $2. Files: `hero/layers/`, `COSTS.md`, `CREDITS.md`. *Done when:* the layers are in the repo, a contact sheet of them is shown to Brian, the pod reads terminated, and COSTS.md has the row.
- [ ] **B2. Clean the layers.** Fill the holes behind hair and arms (in-painting on fal if needed, logged), make a closed-eye layer and 2-3 mouth shapes that stay on-model (discard anything younger or more revealing). Files: `hero/layers/`, `public/puppet/`. *Done when:* Brian sees each cleaned layer and the eye and mouth swaps side by side.
- [ ] **B3. Puppet tab.** `src/formats/puppet.js`: layers on parallax planes that follow the same tilt as A, breathing, hair sway, blinking, mouth swaps; both sizes. SHARED: `src/lab/data.js` (B to `live`, puppet numbers), `src/main.js`, `scripts/check.mjs`. *Done when:* the check shows B at both sizes on laptop and phone, not frozen, and Brian scores it. Kill rule: if B scores no higher than A, drop puppets.

## Lane D: toon 3D (sorceress only)
- [ ] **D1. VRM from Brian.** Brian makes the sorceress in VRoid and adds `hero/hero.vrm` (upload to the repo on GitHub, or attach it to the session). *Done when:* the file is on main.
- [ ] **D2. Toon 3D tab.** After D1. `src/formats/toon3d.js` with `@pixiv/three-vrm` (pinned), MToon shading, an idle animation, spring-bone hair, a blink; framed like the art at both sizes. SHARED: `src/lab/data.js`, `src/main.js`, `scripts/check.mjs`, `package.json`. *Done when:* the check shows D at both sizes on laptop and phone, not frozen, phone load under 5 s, and Brian scores it. Kill rule: 3 or lower means 3D is for map chibis only.

## Lane E: Unity lilToon (optional, S4)
- [ ] **E1. Unity capture.** After D1. The same VRM in Unity with lilToon through the official Claude Code Unity plugin; showcase screenshots and a short clip into `public/unity/`, shown in a new E tab (stills + video, like C). SHARED: `FORMATS` in `src/lab/data.js`, `src/main.js`, `scripts/check.mjs`. *Done when:* tab E shows the captures at both sizes and Brian scores it.

## Wrap-up
- [ ] **R1. Verdict.** After Brian's scores. Fill `RESULTS.md` (scores, effort, which rules fired), live-site check, README and CREDITS complete. *Done when:* RESULTS.md names the adopted format(s) and the live check passes.
