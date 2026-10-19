import { HEROES, FORMATS, SIZES, LAB as LAB_DATA } from './lab/data.js';
import { createClock, STEP } from './clock.js';
import { createDebugOverlay } from './debug.js';
import { applyTune } from './tune.js';
import { createTabBar } from './ui/tab-bar.js';
import { createSizeToggle } from './ui/size-toggle.js';
import { createScorePanel } from './ui/score-panel.js';
import { createShaderCard, preloadShaderCard, shaderRenderer } from './formats/shader-card.js';
import { createReveal } from './formats/reveal.js';
import { createComing } from './formats/coming.js';
import { createMeshy3d } from './formats/meshy3d.js';

// The lab: one hero, one format (tab), one size at a time. Each format draws into #slot-art;
// this file only switches between them and keeps the test hooks.
const params = new URLSearchParams(location.search);
const TEST = params.has('test'); // ?test: the clock only moves when the check calls advance()
const LAB = applyTune(LAB_DATA, params.get('tune')); // ?tune=foil.strength:0.5 tries numbers by name
const $ = (id) => document.getElementById(id);

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
let hero = pick(params.get('hero'), Object.keys(HEROES), 'sorceress'); // ?hero=knight
let tab = pick(params.get('tab'), FORMATS.map((f) => f.id), 'A'); // ?tab=C
let size = pick(params.get('size'), SIZES, 'card'); // ?size=showcase
if (!HEROES[hero].formats.includes(tab)) tab = 'A';

const host = $('slot-art');
const tabBar = createTabBar({ $, onTab: (t) => show({ tab: t }), onHero: (h) => show({ hero: h }) });
const sizeToggle = createSizeToggle({ $, onSize: (s) => show({ size: s }) });
const scorePanel = createScorePanel({ $, getHero: () => hero });

let view = null;
let loaded = false;
let loadMs = null; // navigation start -> first format on screen
let token = 0;

async function show(change = {}) {
  hero = change.hero ?? hero;
  tab = change.tab ?? tab;
  size = change.size ?? size;
  if (!HEROES[hero].formats.includes(tab)) tab = 'A';
  const mine = ++token;
  tabBar.show(hero, tab);
  sizeToggle.show(size);
  scorePanel.render();
  const h = HEROES[hero];
  $('hero-name').textContent = h.name;
  $('hero-title').textContent = h.title;
  $('lobby-name').textContent = h.name;
  $('lobby-title').textContent = h.title;
  document.documentElement.style.setProperty('--bar-h', `${$('bar').getBoundingClientRect().height}px`);
  view?.dispose();
  view = null;
  const format = FORMATS.find((f) => f.id === tab);
  let next;
  if (tab === 'A') next = await createShaderCard({ host, hero: h, size, lab: LAB });
  else if (tab === 'C') {
    next = createReveal({ host, hero: h, size, lab: LAB, test: TEST, take: Number(params.get('take')) });
    await next.ready;
  } else if (tab === 'M') next = await createMeshy3d({ host, hero: h, size, lab: LAB, clip: params.get('clip') });
  else next = createComing({ host, hero: h, size, aspect: LAB.imageAspect, format, $ });
  if (mine !== token) return next.dispose(); // a newer switch won
  view = next;
  view.resize();
  view.update(0);
  view.render();
  if (!loaded) {
    loaded = true;
    loadMs = Math.round(performance.now());
    $('loading').hidden = true;
  }
}

function resize() {
  document.documentElement.style.setProperty('--bar-h', `${$('bar').getBoundingClientRect().height}px`);
  view?.resize();
}
addEventListener('resize', resize);

preloadShaderCard(HEROES.sorceress).catch(() => {});
show().catch((e) => console.error(`lab failed to start: ${e.message}`));

const clock = createClock({ manual: TEST });
const debug = params.has('debug') ? createDebugOverlay($('fps'), shaderRenderer) : null; // ?debug: FPS

function render() {
  view?.render();
  debug?.frame();
}
function step(dt) {
  clock.tick(dt);
  view?.update(dt);
}

function slotRect() {
  const r = $('slot').getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}

function stateText() {
  const s = window.__game.state();
  return [
    `hero ${s.hero}, tab ${s.tab}, size ${s.size}; ${s.loaded ? `loaded in ${s.loadMs} ms` : 'loading'}; test clock ${TEST ? `on (${clock.time.toFixed(2)} s)` : 'off'}${params.get('tune') ? `; tune ${params.get('tune')}` : ''}`,
    `  slot ${s.slot.w}x${s.slot.h} at ${s.slot.x},${s.slot.y}; view ${JSON.stringify(s.view)}`,
  ].join('\n');
}

window.__game = {
  state: () => ({ loaded, loadMs, hero, tab, size, slot: slotRect(), view: view?.state() ?? null, framing: view?.framing?.() ?? null, score: scorePanel.state(), viewport: [innerWidth, innerHeight] }),
  stateText,
  show,
  scoresText: () => scorePanel.asText(),
  // Test clock: advance simulated time in fixed steps, then draw one frame.
  advance(ms) {
    for (let t = 0; t < ms / 1000 - 1e-9; t += STEP) step(STEP);
    render();
  },
  // Real frames per second over ms (only meaningful without ?test).
  measureFps(ms = 3000) {
    return new Promise((resolve) => {
      let frames = 0;
      let worst = 0;
      const start = performance.now();
      let prev = start;
      const tick = (t) => {
        frames++;
        worst = Math.max(worst, t - prev);
        prev = t;
        if (t - start < ms) requestAnimationFrame(tick);
        else resolve({ fps: +((frames * 1000) / (t - start)).toFixed(1), worstMs: Math.round(worst) });
      };
      requestAnimationFrame(tick);
    });
  },
  renderer: () => shaderRenderer(),
};

if (TEST) render();
else {
  let last = performance.now();
  const loop = (t) => {
    step(Math.min(0.1, (t - last) / 1000));
    last = t;
    render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
