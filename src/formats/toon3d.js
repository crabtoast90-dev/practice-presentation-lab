// Format D: the VRoid model (hero.vrm) drawn with three-vrm's MToon toon shading.
// A hand-made idle (breathing, weight shift, arms down from the T-pose, small head
// motion), the model's own spring bones for hair and cloth, and blinks. Drag to turn her.
// CARD size frames her like the art; SHOWCASE stands her in the lobby.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { showcaseBox } from './fit.js';

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));
let cached = null; // one VRM, reused between visits
function loadVrm(url) {
  if (!cached) {
    cached = loader.loadAsync(url).then((gltf) => {
      const vrm = gltf.userData.vrm;
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);
      VRMUtils.rotateVRM0(vrm); // VRM 0.x faces -Z; turn it to face the camera
      vrm.scene.traverse((o) => { o.frustumCulled = false; });
      return vrm;
    });
  }
  return cached;
}

const VRM_URL = new URL('../../hero/hero.vrm', import.meta.url).href; // Brian's VRoid export, bundled by Vite

export async function createToon3d({ host, size, lab }) {
  const cfg = lab.toon;
  const vrm = await loadVrm(VRM_URL);
  const frame = document.createElement('div');
  frame.className = 'framed meshy';
  host.append(frame);

  const renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, alpha: true }); // no MSAA on sharp phone screens
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  frame.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov, 1, 0.05, 50);
  scene.add(new THREE.AmbientLight(0xffffff, cfg.ambient));
  const key = new THREE.DirectionalLight(0xffffff, cfg.key);
  key.position.set(0.8, 1.6, 2.2);
  scene.add(key);

  const turn = new THREE.Group();
  turn.add(vrm.scene);
  scene.add(turn);
  vrm.humanoid.resetNormalizedPose();
  vrm.update(0);
  const box = new THREE.Box3().setFromObject(vrm.scene);
  const height = box.max.y - box.min.y;
  vrm.scene.position.y = -box.min.y;

  const bone = (name) => vrm.humanoid.getNormalizedBoneNode(name);
  const B = Object.fromEntries(['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand'].map((n) => [n, bone(n)]));
  const blinkAt = (t) => t + cfg.blinkEvery * (0.6 + 0.8 * ((Math.sin(t * 12.9898) * 43758.5453) % 1 + 1) % 1);

  // Drag turns her; she eases back to facing you.
  let yaw = 0;
  let drag = null;
  const onDown = (e) => { drag = e.clientX; };
  const onMove = (e) => {
    if (drag === null) return;
    yaw = Math.max(-1.4, Math.min(1.4, yaw + ((e.clientX - drag) / 200) * Math.PI * 0.5));
    drag = e.clientX;
  };
  const onUp = () => { drag = null; };
  const slot = host.parentElement;
  slot.addEventListener('pointerdown', onDown);
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);

  let time = 0;
  let nextBlink = blinkAt(1);
  function pose(t) {
    const breathe = Math.sin((t * Math.PI * 2) / cfg.breathSeconds);
    const shift = Math.sin((t * Math.PI * 2) / cfg.shiftSeconds);
    if (B.hips) { B.hips.rotation.z = shift * 0.03; B.hips.position.x = shift * 0.012; }
    if (B.spine) B.spine.rotation.z = -shift * 0.03;
    if (B.chest) B.chest.rotation.x = -breathe * cfg.breath;
    if (B.upperChest) B.upperChest.rotation.x = -breathe * cfg.breath * 0.6;
    if (B.neck) B.neck.rotation.y = Math.sin(t * 0.43) * 0.06;
    if (B.head) { B.head.rotation.x = 0.04 + Math.sin(t * 0.31) * 0.03; B.head.rotation.z = -shift * 0.04; }
    const arm = cfg.armDown + breathe * 0.015;
    // VRM's normalized rig: a T-pose with the character's left arm along +X, so down is -Z for the left side.
    if (B.leftUpperArm) B.leftUpperArm.rotation.set(0.05, 0, -arm);
    if (B.rightUpperArm) B.rightUpperArm.rotation.set(0.05, 0, arm);
    if (B.leftLowerArm) B.leftLowerArm.rotation.set(0, 0.25, -0.08);
    if (B.rightLowerArm) B.rightLowerArm.rotation.set(0, -0.25, 0.08);
    // Blink: close and open over cfg.blinkSeconds.
    const k = (t - (nextBlink - cfg.blinkSeconds)) / cfg.blinkSeconds;
    const blink = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
    vrm.expressionManager?.setValue('blink', blink);
    if (t > nextBlink) nextBlink = blinkAt(t);
  }

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
    const dist = (height * cfg.margin) / 2 / Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(0, height * 0.52, dist);
    camera.lookAt(0, height * 0.5, 0);
    camera.updateProjectionMatrix();
  }

  return {
    id: 'D',
    resize,
    update(dt) {
      time += dt;
      if (drag === null) yaw *= Math.exp(-2.5 * dt);
      turn.rotation.y = yaw + Math.sin(time * 0.35) * cfg.swayRad;
      pose(time);
      vrm.update(dt); // expressions, look-at and spring bones (hair, skirt)
    },
    render() { renderer.render(scene, camera); },
    framing() {
      const top = new THREE.Vector3(0, height, 0).project(camera);
      const bottom = new THREE.Vector3(0, 0, 0).project(camera);
      return { top: +top.y.toFixed(3), bottom: +bottom.y.toFixed(3) };
    },
    state: () => ({ time: +time.toFixed(3), springs: vrm.springBoneManager?.joints?.size ?? 0, blink: +(vrm.expressionManager?.getValue('blink') ?? 0).toFixed(2), yaw: +yaw.toFixed(3) }),
    dispose() {
      slot.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      turn.remove(vrm.scene);
      renderer.dispose();
      renderer.forceContextLoss();
      frame.remove();
    },
  };
}
