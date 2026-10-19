# Credits

Every tool, model and asset, with source and license.

- Hero art (`hero/`, `public/heroes/`): made by Brian with the **Hassaku** anime model for Stable Diffusion (CivitAI).
- **Kling 3.0 Pro** (Kuaishou) image-to-video through **fal** (fal.ai): the "card is born" reveals in `public/reveal/`.
- **BiRefNet v2** (background removal, MIT) through fal: the character masks in `public/heroes/*-fx.png`.
- **Meshy** (meshy.ai) image to 3D, auto-rigging and idle animations: the sorceress model in `public/meshy/sorceress.glb` (format M).
- **See-through** (Lin et al., SIGGRAPH 2026; https://github.com/mitmul/see-through, Apache-2.0) split the sorceress into layers for format B (`hero/layers/`), run on a **RunPod** A40. Its models: LayerDiff 3D (SDXL-based) and a Marigold depth model fine-tuned for anime.
- **psd-tools** (MIT) and **OpenCV** (Apache-2.0) to turn the layers into the puppet's textures.
- **VRoid Studio** (pixiv): Brian's sorceress model `hero/hero.vrm` (format D). **three-vrm** 3.5.5 (pixiv, MIT) for loading it with MToon toon shading and spring bones.
- **Unity** with **lilToon** (lilxyzw, MIT) for optional format E.
- three.js (MIT): https://threejs.org · Vite (MIT): https://vite.dev · Playwright (Apache-2.0) for the check · FFmpeg (LGPL/GPL) for encoding · Pillow for image prep.
- Starter, check and log-time scripts: the game kit in crabtoast90-dev/practice-rpg.
- Lobby, card table, frames and interface: built in code.
