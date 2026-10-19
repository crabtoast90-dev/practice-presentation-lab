# Results

Scores come from the SCORE panel (look 1-5, "would I pay for this as a skin?"), copied into LOG.md and summarised here. Effort per format: Brian's minutes, agent sessions, dollars.

## Test rules
- Adopt a format at a SHOWCASE look of 4+ on both laptop and phone.
- A format that costs twice the effort must beat the cheaper one by a full point.
- Kill rules: B no higher than A → drop puppets. C with a visible seam or over $5 per keeper → video for rare reveals only. D at 3 or lower → 3D for map chibis only.

## Scores and effort

format | hero | card laptop | card phone | showcase laptop | showcase phone | pay? | Brian min | agent sessions | dollars | verdict
--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---
A shader card | sorceress | 4 | 4 | 4 | 4 | yes | setup only | part of session 0 | ~$0.01 (mask) | adopt: showcase 4 (device split to confirm)
A shader card | knight | 3 | 3 | 3 | 3 | yes | setup only | part of session 0 | ~$0.01 (mask) | not adopted (3 < 4)
B shader puppet | sorceress | - | - | - | - | - | - | - | - | not built
C Kling reveal | sorceress | 4 | 4 | 4 | 4 | yes | setup only | part of session 0 | $1.68 (3 clips, 1 kept) | viable but not ideal: ties A at far higher cost (fails the 1-point rule) and needs several tries per keeper
C Kling reveal | knight | 3 | 3 | 3 | 3 | no | setup only | part of session 0 | $1.68 (3 clips, 1 kept) | not adopted
D toon 3D | sorceress | - | - | - | - | - | 10-15 (rough VRoid build) | part of session 0 | $0 | waiting for scores
M AI 3D (Meshy) | sorceress | - | - | - | - | - | 0 (no hand modelling) | part of session 0 | 44 Meshy credits (~$0.88) | rejected by eye, no number given: "looks like a smeared 3d painting", uncanny
E Unity lilToon | sorceress | - | - | - | - | - | - | - | - | optional

Scores 2026-10-19, from Brian in chat ("4 on everything" for the sorceress, "3 on everything" for the knight); Brian confirmed the same scores on laptop and phone.
Brian on C: "The C animations don't look great here. The Sorceress was definitely better and is borderline for me, but if it's going to cost me $1 a character I'd probably skip it based on this, but if we could refine it to get higher quality without ballooning cost I might do it." Later: "I'm pretty weary of the inconsistency of needing multiple attempts to get a good looking AI generated video for the animation. This (C) is cheap enough that it could be fine (I'd be willing to pay $100 for one of these for each of 100 characters for instance), but we can log it as a viable but non-ideal option for now."

Brian on M (Meshy): "The mesh test looks pretty bad. There are some aspects where I can see promise, but overall it looks like a smeared 3d painting and looks kind of horrifying/uncanny valley, very far from looking pleasant."
Brian on D's build: a rough VRoid sorceress took him 10-15 minutes; it's generic (no gold accents, clothes not like the sorceress). "I'm definitely out of my depth trying to manually create character models like that, would prefer avoiding that workflow unless it looks way better than I'm expecting."

## Measured
- C seam: first and last frames differ from the still by about 2 on a 0-255 scale (tools/seam.py) for every attempt, too small to see. No visible seam.
- C cost per keeper: $1.68 (sorceress and knight each), under the $5 kill line. The rejected first call cost nothing.
- Phone pass (cloud, software graphics): load under 1 s locally. FPS has to be read on a real phone with `?debug`, because the cloud has no graphics chip.
