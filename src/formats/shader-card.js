// Format A: the static hero art on one plane, sold by shaders: hover/drag tilt, holo foil
// (mostly on the background), a rim light on the character's edge from the tilt side,
// a soft pulsing halo, and a slight idle bob. CARD size draws a gold frame; SHOWCASE
// fades the art's edges into the lobby.
import * as THREE from 'three';
import { showcaseBox } from './fit.js';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map, fx;
  uniform vec2 tilt;            // -1..1 each axis
  uniform float time, aspect, framed;
  uniform float foil, foilChar, sweep, bands;
  uniform float rim, rimWidth;  uniform vec3 rimColor;
  uniform float glow, glowPulse; uniform vec3 glowColor;
  varying vec2 vUv;

  vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 uv = vUv;
    vec3 col = texture2D(map, uv).rgb;
    vec4 f = texture2D(fx, uv);
    float m = f.r;      // 1 on the character
    float halo = f.g;   // soft ring just outside the character

    // Holo foil: rainbow bands that slide with the tilt, plus glints, strongest on the background.
    float band = (uv.x * 0.8 + uv.y * 1.1) * bands + tilt.x * 0.9 - tilt.y * 0.7 + time * 0.02;
    vec3 rainbow = hue(fract(band));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    float amt = mix(foil, foilChar, m) * (0.35 + 0.65 * lum);
    col = mix(col, col * (0.55 + rainbow * 0.9), amt);
    vec2 g = uv * vec2(46.0, 46.0 / aspect);
    vec2 cell = floor(g);
    vec2 q = fract(g) - 0.5 - (vec2(hash(cell + 7.0), hash(cell + 9.0)) - 0.5) * 0.5;
    float star = max(0.0, 1.0 - length(q) * 9.0) + max(0.0, 1.0 - abs(q.x) * 40.0) * max(0.0, 1.0 - abs(q.y) * 5.0) * 0.5
               + max(0.0, 1.0 - abs(q.y) * 40.0) * max(0.0, 1.0 - abs(q.x) * 5.0) * 0.5;
    float twinkle = step(0.93, hash(cell)) * pow(max(0.0, sin(time * 1.7 + hash(cell + 3.0) * 40.0 + tilt.x * 5.0 - tilt.y * 4.0)), 6.0);
    col += star * twinkle * (1.0 - m) * 0.9;
    // A bright sweep line that crosses the card as it tilts.
    float s = uv.x + uv.y * 0.55 - 0.78 + tilt.x * 0.9 - tilt.y * 0.5;
    col += exp(-s * s * 60.0) * sweep * (1.0 - 0.6 * m);

    // Rim light: character pixels whose neighbour toward the light is background.
    vec2 L = normalize(vec2(0.55 - tilt.x, 0.75 + tilt.y));
    float outside = 1.0 - texture2D(fx, uv + L * vec2(rimWidth, rimWidth * aspect)).r;
    col += rimColor * m * outside * rim;

    // Soft halo, gently pulsing.
    col += glowColor * halo * glow * (0.75 + 0.25 * sin(time * 6.2832 / glowPulse));

    // CARD: rounded gold frame. SHOWCASE: fade the edges into the lobby.
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
    vec2 half_ = vec2(0.5 * aspect, 0.5);
    float r = 0.035;
    float d = length(max(abs(p) - half_ + r, 0.0)) - r;     // <0 inside the rounded card
    float alpha = 1.0;
    if (framed > 0.5) {
      alpha = 1.0 - smoothstep(-0.002, 0.0015, d);
      float edge = -d;
      vec3 gold = mix(vec3(0.62, 0.42, 0.14), vec3(1.0, 0.86, 0.5), 0.5 + 0.5 * sin((uv.y - uv.x) * 9.0 + tilt.x * 4.0 - tilt.y * 3.0));
      col = mix(col, gold, step(edge, 0.018));
      col = mix(col, vec3(0.18, 0.1, 0.03), step(0.018, edge) * step(edge, 0.022));
    } else {
      float fx_ = smoothstep(0.0, 0.09, min(uv.x, 1.0 - uv.x));
      float fy = smoothstep(0.0, 0.06, 1.0 - uv.y) * smoothstep(0.0, 0.05, uv.y);
      alpha = fx_ * fy;
    }
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const loader = new THREE.TextureLoader();
const textureCache = new Map();
function texture(url, srgb) {
  if (!textureCache.has(url)) {
    textureCache.set(url, loader.loadAsync(url).then((t) => {
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 4;
      return t;
    }));
  }
  return textureCache.get(url);
}

export function preloadShaderCard(hero) {
  return Promise.all([texture(hero.image, true), texture(hero.fx, false)]);
}

let renderer = null; // one WebGL context, moved between slots
function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, alpha: true }); // no MSAA on sharp phone screens
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
  }
  return renderer;
}
export const shaderRenderer = () => renderer;

export async function createShaderCard({ host, hero, size, lab }) {
  const [map, fx] = await preloadShaderCard(hero);
  const r = getRenderer();
  host.append(r.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const aspect = lab.imageAspect;
  const uniforms = {
    map: { value: map }, fx: { value: fx }, tilt: { value: new THREE.Vector2() }, time: { value: 0 },
    aspect: { value: aspect }, framed: { value: size === 'card' ? 1 : 0 },
    foil: { value: lab.foil.strength }, foilChar: { value: lab.foil.onCharacter }, sweep: { value: lab.foil.sweep }, bands: { value: lab.foil.bands },
    rim: { value: lab.rim.strength }, rimWidth: { value: lab.rim.width }, rimColor: { value: new THREE.Color(...lab.rim.color) },
    glow: { value: lab.glow.strength }, glowPulse: { value: lab.glow.pulseSeconds }, glowColor: { value: new THREE.Color(...hero.glow) },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1, 1, 1), material);
  scene.add(card);

  // Tilt target: pointer position over the card (hover on laptop, drag on touch), else idle sway.
  const target = new THREE.Vector2();
  const current = new THREE.Vector2();
  let pointer = null; // last pointer position -1..1 while hovering or dragging
  let time = 0;
  const onMove = (e) => {
    if (e.pointerType === 'touch' && !e.buttons && e.type !== 'pointerdown') return;
    const rect = host.getBoundingClientRect();
    pointer = [((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)];
    pointer = pointer.map((v) => Math.max(-1, Math.min(1, v)));
  };
  const onLeave = () => { pointer = null; };
  const slot = host.parentElement;
  slot.addEventListener('pointermove', onMove);
  slot.addEventListener('pointerdown', onMove);
  slot.addEventListener('pointerleave', onLeave);
  const onUp = (e) => { if (e.pointerType === 'touch') onLeave(); };
  slot.addEventListener('pointerup', onUp);
  slot.addEventListener('pointercancel', onLeave);

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false);
    const canvasRect = r.domElement.getBoundingClientRect();
    camera.aspect = canvasRect.width / canvasRect.height || w / h;
    // Fit the card: CARD = the slot (the canvas is 20% larger so tilted corners aren't cut);
    // SHOWCASE = as big as fits under the bar.
    const fov = (camera.fov * Math.PI) / 180;
    let viewH;
    if (size === 'card') viewH = 1.2;
    else {
      const b = showcaseBox(aspect);
      viewH = b.H / b.h;
      card.userData.baseY = -((b.y + b.h / 2 - b.H / 2) / b.H) * viewH; // world units, up is +
    }
    camera.position.set(0, 0, viewH / 2 / Math.tan(fov / 2));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  const maxTilt = (lab.tilt.maxDeg * Math.PI) / 180;
  return {
    id: 'A',
    resize,
    update(dt) {
      time += dt;
      const idle = (lab.tilt.idleDeg / lab.tilt.maxDeg);
      const w = (time * Math.PI * 2) / lab.tilt.idleSeconds;
      if (pointer) target.set(pointer[0], pointer[1]);
      else target.set(Math.sin(w) * idle, Math.sin(w * 0.7 + 1) * idle * 0.6);
      current.lerp(target, 1 - Math.exp(-lab.tilt.spring * dt));
      card.rotation.y = current.x * maxTilt;
      card.rotation.x = -current.y * maxTilt;
      card.position.y = (card.userData.baseY ?? 0) + Math.sin((time * Math.PI * 2) / lab.bob.seconds) * lab.bob.amount;
      uniforms.tilt.value.copy(current);
      uniforms.time.value = time;
    },
    render() { r.render(scene, camera); },
    // Where the card's top and bottom land on screen (-1..1), for the check's framing test.
    framing() {
      card.updateMatrixWorld();
      const top = new THREE.Vector3(0, 0.5, 0).applyMatrix4(card.matrixWorld).project(camera);
      const bottom = new THREE.Vector3(0, -0.5, 0).applyMatrix4(card.matrixWorld).project(camera);
      return { top: +top.y.toFixed(3), bottom: +bottom.y.toFixed(3) };
    },
    state: () => ({ time: +time.toFixed(3), tilt: [+current.x.toFixed(3), +current.y.toFixed(3)], pointer: !!pointer }),
    dispose() {
      slot.removeEventListener('pointermove', onMove);
      slot.removeEventListener('pointerdown', onMove);
      slot.removeEventListener('pointerleave', onLeave);
      slot.removeEventListener('pointercancel', onLeave);
      slot.removeEventListener('pointerup', onUp);
      card.geometry.dispose();
      material.dispose();
      r.domElement.remove();
    },
  };
}
