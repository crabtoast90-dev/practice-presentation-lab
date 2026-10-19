# Results

Scores come from the SCORE panel (look 1-5, "would I pay for this as a skin?"), copied into LOG.md and summarised here. Effort per format: Brian's minutes, agent sessions, dollars.

## Test rules
- Adopt a format at a SHOWCASE look of 4+ on both laptop and phone.
- A format that costs twice the effort must beat the cheaper one by a full point.
- Kill rules: B no higher than A → drop puppets. C with a visible seam or over $5 per keeper → video for rare reveals only. D at 3 or lower → 3D for map chibis only.

## Scores and effort

format | hero | card laptop | card phone | showcase laptop | showcase phone | pay? | Brian min | agent sessions | dollars | verdict
--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---
A shader card | sorceress | - | - | - | - | - | setup only | part of session 0 | ~$0.01 (mask) | waiting for scores
A shader card | knight | - | - | - | - | - | setup only | part of session 0 | ~$0.01 (mask) | waiting for scores
B shader puppet | sorceress | - | - | - | - | - | - | - | - | not built
C Kling reveal | sorceress | - | - | - | - | - | setup only | part of session 0 | $1.68 (3 clips, 1 kept) | waiting for scores
C Kling reveal | knight | - | - | - | - | - | setup only | part of session 0 | $1.68 (3 clips, 1 kept) | waiting for scores
D toon 3D | sorceress | - | - | - | - | - | - | - | - | not built
E Unity lilToon | sorceress | - | - | - | - | - | - | - | - | optional

## Measured
- C seam: first and last frames differ from the still by about 2 on a 0-255 scale (tools/seam.py) for every attempt, too small to see. No visible seam.
- C cost per keeper: $1.68 (sorceress and knight each), under the $5 kill line. The rejected first call cost nothing.
- Phone pass (cloud, software graphics): load under 1 s locally. FPS has to be read on a real phone with `?debug`, because the cloud has no graphics chip.
