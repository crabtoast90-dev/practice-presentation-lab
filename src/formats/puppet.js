// Format B: a shader puppet built from See-through's layers (public/puppet/, made by
// tools/prep-puppet.py). Four planes in one shader: backdrop, back hair, body, front hair,
// each shifted a different amount by the tilt (parallax). On top: breathing, hair sway,
// a lower-cape flutter, blinks (each eye squashes shut to its lash line) and mouth shapes.
// The same tilt, foil, rim light, halo and frame as format A, so B vs A scores the puppet alone.
import * as THREE from 'three';
import { showcaseBox } from './fit.js';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D bgMap, hairB, body, hairF, masks, fx;
  uniform vec2 tilt;
  uniform float time, aspect, framed;
  uniform float breath, breathPhase, hairSway, hairPhase, cape, blink, mouth;
  uniform vec4 eyeL, eyeR;          // centre xy, half size xy (uv, y down)
  uniform vec3 skinL, skinR;
  uniform vec4 mouthBox;
  uniform vec2 hairSpan;            // hair top, hair bottom (y down)
  uniform vec4 parallax;            // backdrop, back hair, body, front hair
  uniform float foil, foilChar, sweep, bands, rim, rimWidth, glow, glowPulse;
  uniform vec3 rimColor, glowColor;
  varying vec2 vUv;

  vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }

  // Art space: x right, y down, 0..1.
  vec4 tex(sampler2D t, vec2 a) { return texture2D(t, vec2(a.x, 1.0 - a.y)); }

  // Breathing: everything above the waist rises a little, the chest widens a touch.
  vec2 breathe(vec2 a) {
    float up = 1.0 - smoothstep(0.16, 0.44, a.y);
    float chest = smoothstep(0.12, 0.2, a.y) * (1.0 - smoothstep(0.24, 0.36, a.y));
    return a + vec2(-(a.x - 0.5) * breath * 0.6 * chest, breath * up);
  }

  // Blink: inside an eye box, squash the eye vertically toward a line a little below its centre.
  vec4 eyeSample(vec2 a, vec4 e, vec3 skin, vec4 col) {
    vec2 d = (a - e.xy) / e.zw;
    if (abs(d.x) > 1.0 || abs(d.y) > 1.6 || blink < 0.001) return col;
    float open = 1.0 - blink * 0.92;
    float line = e.y + e.w * 0.35 * blink;
    float y = line + (a.y - line) / open;
    float m = tex(masks, a).r;
    vec4 squashed = tex(body, vec2(a.x, y));
    float inside = step(abs(a.y - line), e.w * open * 1.1);
    vec4 shut = mix(vec4(skin, 1.0), squashed, inside);
    return mix(col, shut, m);
  }

  void main() {
    vec2 a = vec2(vUv.x, 1.0 - vUv.y);
    vec2 t = vec2(tilt.x, -tilt.y);
    vec2 ab = breathe(a);

    // Backdrop and back hair (behind), body, front hair (in front); each its own parallax.
    vec3 col = tex(bgMap, a - t * parallax.x).rgb;

    float hs = smoothstep(hairSpan.x + 0.06, hairSpan.y, a.y);
    vec2 hb = ab - t * parallax.y + vec2(hairSway * hs * sin(hairPhase - a.y * 5.0), 0.0);
    vec4 cb = tex(hairB, hb);
    col = mix(col, cb.rgb, cb.a);

    vec2 pb = ab - t * parallax.z;
    float cw = tex(masks, pb).b;                       // lower cape: a slow ripple
    pb.x += cape * cw * sin(hairPhase * 0.8 - pb.y * 7.0);
    vec4 cbody = tex(body, pb);
    cbody = eyeSample(pb, eyeL, skinL, cbody);
    cbody = eyeSample(pb, eyeR, skinR, cbody);
    // Mouth shapes: stretch the mouth taller and wider from its centre.
    vec2 md = (pb - mouthBox.xy) / mouthBox.zw;
    if (abs(md.x) < 1.6 && abs(md.y) < 2.6 && mouth > 0.001) {
      vec2 q = mouthBox.xy + (pb - mouthBox.xy) / vec2(1.0 + mouth * 0.15, 1.0 + mouth * 1.4);
      vec4 mm = tex(body, q);
      mm.rgb = mix(mm.rgb, mm.rgb * vec3(0.55, 0.35, 0.35), smoothstep(0.6, 0.0, length(md / vec2(1.2, 1.6))) * mouth * 0.8);
      cbody = mix(cbody, mm, tex(masks, mouthBox.xy + (pb - mouthBox.xy) * 0.6).g);
    }
    col = mix(col, cbody.rgb, cbody.a);

    float fs = smoothstep(hairSpan.x + 0.1, hairSpan.x + 0.35, a.y);
    vec2 hf = ab - t * parallax.w + vec2(hairSway * 0.7 * fs * sin(hairPhase + 0.9 - a.y * 6.0), 0.0);
    vec4 cf = tex(hairF, hf);
    col = mix(col, cf.rgb, cf.a);

    // Same finish as format A: foil (mostly on the backdrop), rim light, halo.
    vec4 f = tex(fx, pb);
    float m = max(f.r, max(cb.a, cf.a));
    float band = (vUv.x * 0.8 + vUv.y * 1.1) * bands + tilt.x * 0.9 - tilt.y * 0.7 + time * 0.02;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * (0.55 + hue(fract(band)) * 0.9), mix(foil, foilChar, m) * (0.35 + 0.65 * lum));
    float s = vUv.x + vUv.y * 0.55 - 0.78 + tilt.x * 0.9 - tilt.y * 0.5;
    col += exp(-s * s * 60.0) * sweep * (1.0 - 0.6 * m);
    vec2 L = normalize(vec2(0.55 - tilt.x, -(0.75 + tilt.y)));
    float outside = 1.0 - tex(fx, pb + L * vec2(rimWidth, rimWidth * aspect)).r;
    col += rimColor * f.r * outside * rim;
    col += glowColor * f.g * glow * (0.75 + 0.25 * sin(time * 6.2832 / glowPulse));

    vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
    float r = 0.035;
    float d = length(max(abs(p) - vec2(0.5 * aspect, 0.5) + r, 0.0)) - r;
    float alpha = 1.0;
    if (framed > 0.5) {
      alpha = 1.0 - smoothstep(-0.002, 0.0015, d);
      float edge = -d;
      vec3 gold = mix(vec3(0.62, 0.42, 0.14), vec3(1.0, 0.86, 0.5), 0.5 + 0.5 * sin((vUv.y - vUv.x) * 9.0 + tilt.x * 4.0 - tilt.y * 3.0));
      col = mix(col, gold, step(edge, 0.018));
      col = mix(col, vec3(0.18, 0.1, 0.03), step(0.018, edge) * step(edge, 0.022));
    } else {
      alpha = smoothstep(0.0, 0.09, min(vUv.x, 1.0 - vUv.x)) * smoothstep(0.0, 0.06, 1.0 - vUv.y) * smoothstep(0.0, 0.05, vUv.y);
    }
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const loader = new THREE.TextureLoader();
const load = (url, srgb) => loader.loadAsync(url).then((t) => {
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
});
let assets = null; // loaded once, reused between visits
function loadAssets(hero) {
  if (!assets) {
    const dir = hero.puppet.dir;
    assets = Promise.all([
      load(`${dir}/bg.webp`, true), load(`${dir}/hair-back.webp`, true), load(`${dir}/body.webp`, true),
      load(`${dir}/hair-front.webp`, true), load(`${dir}/masks.png`, false), load(hero.fx, false),
      fetch(`${dir}/rig.json`).then((r) => r.json()),
    ]);
  }
  return assets;
}

export async function createPuppet({ host, hero, size, lab }) {
  const cfg = lab.puppet;
  const [bgMap, hairB, body, hairF, masks, fx, rig] = await loadAssets(hero);
  const renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, alpha: true }); // no MSAA on sharp phone screens
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const aspect = lab.imageAspect;
  const [eL, eR] = rig.eyes;
  const uniforms = {
    bgMap: { value: bgMap }, hairB: { value: hairB }, body: { value: body }, hairF: { value: hairF }, masks: { value: masks }, fx: { value: fx },
    tilt: { value: new THREE.Vector2() }, time: { value: 0 }, aspect: { value: aspect }, framed: { value: size === 'card' ? 1 : 0 },
    breath: { value: 0 }, hairSway: { value: 0 }, hairPhase: { value: 0 }, cape: { value: cfg.cape }, blink: { value: 0 }, mouth: { value: 0 },
    eyeL: { value: new THREE.Vector4(...eL.c, ...eL.h) }, eyeR: { value: new THREE.Vector4(...eR.c, ...eR.h) },
    skinL: { value: new THREE.Color(...eL.skin) }, skinR: { value: new THREE.Color(...eR.skin) },
    mouthBox: { value: new THREE.Vector4(...rig.mouth.c, ...rig.mouth.h) },
    hairSpan: { value: new THREE.Vector2(rig.hair.top, rig.hair.bottom) },
    parallax: { value: new THREE.Vector4(...cfg.parallax) },
    foil: { value: lab.foil.strength }, foilChar: { value: lab.foil.onCharacter }, sweep: { value: lab.foil.sweep }, bands: { value: lab.foil.bands },
    rim: { value: lab.rim.strength }, rimWidth: { value: lab.rim.width }, rimColor: { value: new THREE.Color(...lab.rim.color) },
    glow: { value: lab.glow.strength }, glowPulse: { value: lab.glow.pulseSeconds }, glowColor: { value: new THREE.Color(...hero.glow) },
  };
  for (const c of ['skinL', 'skinR']) uniforms[c].value.convertSRGBToLinear();
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1), material);
  scene.add(card);

  // Tilt: hover on laptop, drag on touch, else a slow idle sway (same as format A).
  const target = new THREE.Vector2();
  const current = new THREE.Vector2();
  let pointer = null;
  const onMove = (e) => {
    if (e.pointerType === 'touch' && !e.buttons && e.type !== 'pointerdown') return;
    const rect = host.getBoundingClientRect();
    pointer = [((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)].map((v) => Math.max(-1, Math.min(1, v)));
  };
  const onLeave = () => { pointer = null; };
  const onUp = (e) => { if (e.pointerType === 'touch') onLeave(); };
  const slot = host.parentElement;
  slot.addEventListener('pointermove', onMove);
  slot.addEventListener('pointerdown', onMove);
  slot.addEventListener('pointerleave', onLeave);
  slot.addEventListener('pointerup', onUp);
  slot.addEventListener('pointercancel', onLeave);

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const rect = renderer.domElement.getBoundingClientRect();
    camera.aspect = rect.width / rect.height || w / h;
    let viewH = 1.2;
    if (size === 'showcase') {
      const b = showcaseBox(aspect);
      viewH = b.H / b.h;
      card.userData.baseY = -((b.y + b.h / 2 - b.H / 2) / b.H) * viewH;
    }
    camera.position.set(0, 0, viewH / 2 / Math.tan((camera.fov * Math.PI) / 360));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  // Blinks every few seconds (sometimes a double); a few mouth shapes now and then (a soft "hm").
  let time = 0;
  let nextBlink = 1.5;
  let blinkStart = -1;
  let doubleBlink = false;
  let talkStart = cfg.talkEvery * 0.6;
  let forced = {}; // pose() test hook
  const rand = (t) => (Math.sin(t * 91.17) * 43758.5453) % 1;
  const maxTilt = (lab.tilt.maxDeg * Math.PI) / 180;
  return {
    id: 'B',
    resize,
    update(dt) {
      time += dt;
      const idle = lab.tilt.idleDeg / lab.tilt.maxDeg;
      const w = (time * Math.PI * 2) / lab.tilt.idleSeconds;
      if (pointer) target.set(pointer[0], pointer[1]);
      else target.set(Math.sin(w) * idle, Math.sin(w * 0.7 + 1) * idle * 0.6);
      current.lerp(target, 1 - Math.exp(-lab.tilt.spring * dt));
      card.rotation.y = current.x * maxTilt;
      card.rotation.x = -current.y * maxTilt;
      card.position.y = (card.userData.baseY ?? 0) + Math.sin((time * Math.PI * 2) / lab.bob.seconds) * lab.bob.amount;
      uniforms.tilt.value.copy(current);
      uniforms.time.value = time;
      const breathe = Math.sin((time * Math.PI * 2) / cfg.breathSeconds);
      uniforms.breath.value = breathe * cfg.breath;
      uniforms.hairPhase.value = (time * Math.PI * 2) / cfg.swaySeconds;
      uniforms.hairSway.value = cfg.hairSway * (0.8 + 0.2 * breathe) + current.x * cfg.hairSway * 0.8;
      if (time > nextBlink && blinkStart < 0) { blinkStart = time; doubleBlink = Math.abs(rand(time)) < 0.25; }
      if (blinkStart >= 0) {
        const k = (time - blinkStart) / cfg.blinkSeconds;
        uniforms.blink.value = k < 1 ? Math.sin(k * Math.PI) : 0;
        if (k >= 1) {
          blinkStart = -1;
          nextBlink = time + (doubleBlink ? 0.12 : cfg.blinkEvery * (0.6 + 0.8 * Math.abs(rand(time + 1))));
          doubleBlink = false;
        }
      }
      const tk = time - talkStart; // 1.2 s of soft mouth shapes, then quiet
      uniforms.mouth.value = tk > 0 && tk < 1.2 ? Math.max(0, Math.sin(tk * 15)) * Math.sin((tk / 1.2) * Math.PI) * cfg.mouth : 0;
      if (tk > 1.2) talkStart = time + cfg.talkEvery;
      if (forced.blink !== undefined) uniforms.blink.value = forced.blink;
      if (forced.mouth !== undefined) uniforms.mouth.value = forced.mouth;
    },
    render() { renderer.render(scene, camera); },
    framing() {
      card.updateMatrixWorld();
      const top = new THREE.Vector3(0, 0.5, 0).applyMatrix4(card.matrixWorld).project(camera);
      const bottom = new THREE.Vector3(0, -0.5, 0).applyMatrix4(card.matrixWorld).project(camera);
      return { top: +top.y.toFixed(3), bottom: +bottom.y.toFixed(3) };
    },
    state: () => ({ time: +time.toFixed(3), tilt: [+current.x.toFixed(3), +current.y.toFixed(3)], blink: +uniforms.blink.value.toFixed(2), mouth: +uniforms.mouth.value.toFixed(2), breath: +uniforms.breath.value.toFixed(4) }),
    // Test hook: force a blink / mouth value for screenshots.
    pose(p = {}) { forced = { blink: 0, mouth: 0, ...p }; },
    dispose() {
      slot.removeEventListener('pointermove', onMove);
      slot.removeEventListener('pointerdown', onMove);
      slot.removeEventListener('pointerleave', onLeave);
      slot.removeEventListener('pointerup', onUp);
      slot.removeEventListener('pointercancel', onLeave);
      card.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
