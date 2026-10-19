// Format M: an AI image-to-3D model of the hero (Meshy: mesh, texture, auto-rig and idle
// clips from the art, no modelling by hand). Shown standing in a soft-lit space with a
// slow idle; drag to turn her. CARD size frames it like the art; SHOWCASE stands it in the lobby.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { showcaseBox } from './fit.js';

const loader = new GLTFLoader();
const cache = new Map();
const loadModel = (url) => {
  if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
  return cache.get(url);
};

export async function createMeshy3d({ host, hero, size, lab, clip: clipName }) {
  const cfg = lab.meshy;
  const gltf = await loadModel(hero.meshy.file);
  const frame = document.createElement('div');
  frame.className = 'framed meshy';
  host.append(frame);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = cfg.exposure;
  renderer.setClearColor(0x000000, 0);
  frame.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov, 1, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a3150, cfg.ambient));
  const key = new THREE.DirectionalLight(0xffffff, cfg.key);
  key.position.set(1.2, 2.4, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(...hero.glow), cfg.rim);
  rim.position.set(-1.8, 1.6, -2.0);
  scene.add(rim);

  const model = gltf.scene; // shared between visits; clips restart each time
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const height = box.max.y - box.min.y;
  model.position.y -= box.min.y; // feet on the floor
  const turn = new THREE.Group();
  scene.remove(model);
  turn.add(model);
  scene.add(turn);

  const mixer = new THREE.AnimationMixer(model);
  const clips = gltf.animations;
  const want = (clipName || cfg.clip).toLowerCase(); // ?clip=breathe or ?clip=sway picks another idle
  const clip = clips.find((c) => c.name.toLowerCase().includes(want)) ?? clips[0];
  if (clip) mixer.clipAction(clip).play();

  // Drag (mouse or finger) turns her; she eases back to facing you.
  let yaw = 0;
  let drag = null;
  const onDown = (e) => { drag = e.clientX; };
  const onMove = (e) => {
    if (drag === null) return;
    yaw += ((e.clientX - drag) / 200) * Math.PI * 0.5;
    yaw = Math.max(-1.2, Math.min(1.2, yaw));
    drag = e.clientX;
  };
  const onUp = () => { drag = null; };
  const slot = host.parentElement;
  slot.addEventListener('pointerdown', onDown);
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);

  let time = 0;
  function resize() {
    if (size === 'showcase') {
      const b = showcaseBox(lab.imageAspect);
      Object.assign(frame.style, { left: '0px', top: `${b.y}px`, width: `${b.W}px`, height: `${b.h}px`, right: 'auto', bottom: 'auto' });
    } else frame.removeAttribute('style');
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the whole body with a little headroom.
    const fit = height * cfg.margin;
    const dist = fit / 2 / Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(0, height * 0.52, dist);
    camera.lookAt(0, height * 0.5, 0);
    camera.updateProjectionMatrix();
  }

  return {
    id: 'M',
    resize,
    update(dt) {
      time += dt;
      mixer.update(dt);
      if (drag === null) yaw *= Math.exp(-2.5 * dt);
      turn.rotation.y = yaw + Math.sin(time * 0.35) * cfg.swayRad;
    },
    render() { renderer.render(scene, camera); },
    framing() {
      const top = new THREE.Vector3(0, height, 0).project(camera);
      const bottom = new THREE.Vector3(0, 0, 0).project(camera);
      return { top: +top.y.toFixed(3), bottom: +bottom.y.toFixed(3) };
    },
    state: () => ({ time: +time.toFixed(3), clip: clip?.name ?? null, clips: clips.length, yaw: +yaw.toFixed(3) }),
    dispose() {
      slot.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      mixer.stopAllAction();
      turn.remove(model);
      renderer.dispose();
      renderer.forceContextLoss();
      frame.remove();
    },
  };
}
