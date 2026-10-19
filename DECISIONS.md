# Decisions

One dated line per decision. Lines marked *(my call)* are technical or naming calls Claude made; Brian can overturn any of them.

- 2026-10-19: The lab answers one question: which in-game format sells an adult anime character as attractive and alive for the least effort. Brian makes taste calls; Claude makes technical calls.
- 2026-10-19: Two heroes: the sorceress gets every format, the knight A and C only. Formats A shader card, B shader puppet (See-through on RunPod), C Kling 3.0 reveal through fal, D toon 3D (VRoid VRM, three-vrm MToon), E optional Unity lilToon.
- 2026-10-19: Scores per format and size: look 1-5 plus "would I pay for this as a skin?", saved in the browser and copied into LOG.md. Adoption, effort and kill rules as in RESULTS.md.
- 2026-10-19: Content: clearly adult, suggestive but covered, no nudity; discard off-model, younger-looking or more revealing outputs.
- 2026-10-19: Budget $20 ($10 fal, $10 RunPod), every paid call in COSTS.md, ask before any call over $2 and at $16 total.
- 2026-10-19: Stack and workflow from the game kit's starter; the sim, BALANCE.md and the sim parts of the check dropped (no game).
- 2026-10-19: Hero sources kept as Brian named them (`heroknight.png`, `herosorceress.png`), moved into `hero/`. *(my call)*
- 2026-10-19: Hero names on screen: "Sorceress, Emerald Veil" and "Knight, Dawn Oath" (placeholder titles). *(my call)*
- 2026-10-19: Format A uses a character mask from BiRefNet (fal, about a cent) so the holo foil sits mostly on the background and the rim light and halo trace the character. The knight's white cape blends into the pale wall, so its glow traces the body more than the cape. *(my call)*
- 2026-10-19: A's idle: the card always sways slowly and bobs when untouched; hover tilts it on laptop, a drag tilts it on the phone. *(my call)*
- 2026-10-19: CARD size is a 300 px card in a fanned hand of card backs; SHOWCASE is the art under the bar in a dark lobby with a name and mock Story / Skins / Summon buttons, art up to 115% of the phone's width so it fills the screen. *(my call)*
- 2026-10-19: C plays the reveal, holds the still card 2.5 s, then plays again; tapping the card replays it. Kling 3.0 **Pro**, 5 s, audio off ($0.56 a clip). *(my call)*
- 2026-10-19: C keeper is attempt 3 for both heroes (light burst, magic swirl, hair streaming, wink, settles back to the still). The other attempts stay in the build: `?tab=C&take=N` (sorceress 2, 3, 4; knight 1, 3, 4). *(my call: Brian picks)*
- 2026-10-19: Reveal clips ship as WebM (VP9, 720 px, ~0.5 MB) plus an MP4 copy that older iPhones play instead. *(my call)*
- 2026-10-19: fal's content checker rejected the first request because the negative prompt said "nudity, revealing clothes, younger"; prompts now keep to neutral words (blur, extra limbs, off-model face...). The art was not changed to get past the checker. *(my call)*
- 2026-10-19: The check reports phone FPS but fails only below 5 fps, because the cloud renders without a graphics chip (A showcase reads ~8 fps there). Real phone FPS is read with `?debug`. Load time (target under 5 s) does fail the check. *(my call)*
- 2026-10-19: Score panel keeps scores per device (laptop/phone, auto-picked, switchable) and hero; tapping a chosen score again clears it. *(my call)*
