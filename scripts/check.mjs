// npm run check: build, open the lab headless on laptop and phone, show every hero x tab x size
// on the test clock, save screenshots, and fail on console errors, failed requests, a frozen
// format, a card out of frame, broken controls (tabs, hero switch, size toggle, score panel,
// tilt), or a phone pass slower than the targets. Add steps here for every format you build.
//   npm run check                    build and check this checkout
//   npm run check -- --url=<live>    check a deployed site instead
import { build, preview } from 'vite';
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEROES, SIZES } from '../src/lab/data.js';

const RUNS = 'check-output';
const KEEP = 5;
const OUT = join(RUNS, new Date().toISOString().replace(/[:.]/g, '-')); // one folder per run
const URL_ARG = process.argv.find((a) => a.startsWith('--url='))?.slice(6);
const TARGET = { fps: 30, loadMs: 5000, stallFps: 0.5 }; // phone pass

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium';
  return undefined; // playwright's own download, if installed
}

const failures = [];
const notes = [];
const log = [];
const summaries = [];
mkdirSync(OUT, { recursive: true });
for (const old of readdirSync(RUNS).filter((f) => /^\d{4}-/.test(f)).sort().slice(0, -KEEP)) rmSync(join(RUNS, old), { recursive: true, force: true });

let server;
let base = URL_ARG;
if (!base) {
  await build({ logLevel: 'warn' });
  server = await preview({ preview: { port: 4327, strictPort: false }, logLevel: 'warn' });
  base = server.resolvedUrls.local[0];
}
const browser = await chromium.launch({
  executablePath: chromePath(),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});

const shot = (page, name, step) => page.screenshot({ path: join(OUT, `${name}-${step}.png`) });
const state = (page) => page.evaluate(() => window.__game.state());
const advance = (page, ms) => page.evaluate((t) => window.__game.advance(t), ms);
const settle = (page) => page.waitForFunction(() => { const v = window.__game.state().view; return v && (v.ready ?? true); }, null, { timeout: 30000 });

async function run(name, contextOptions, script, query = '?test') {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.on('console', (msg) => {
    const line = `[${name}] console.${msg.type()}: ${msg.text()}`;
    log.push(line);
    if (msg.type() === 'error') failures.push(line);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failures.push(`[${name}] HTTP ${res.status()} ${res.url()}`);
  });
  page.on('pageerror', (err) => failures.push(`[${name}] page error: ${err.message}`));
  const url = new URL(base);
  url.search = query;
  await page.goto(url.href.replace('test=', 'test'));
  await page.waitForFunction(() => window.__game?.state().loaded, null, { timeout: 60000 });
  await script(page, name);
  await context.close();
}

// The card must sit inside the screen: CARD size = the whole slot (and its nameplate) on
// screen; SHOWCASE = the art's top and bottom on screen (A reports them in -1..1).
function checkFraming(label, s) {
  const [vw, vh] = s.viewport;
  if (s.size === 'card') {
    const { x, y, w, h } = s.slot;
    if (x < 0 || y < 0 || x + w > vw || y + h + 18 > vh) failures.push(`[${label}] card out of frame (slot ${w}x${h} at ${x},${y}, screen ${vw}x${vh})`);
    if (Math.abs(w - 300) > 2) failures.push(`[${label}] card is ${w}px wide, expected about 300`);
  } else if (s.framing && (s.framing.top > 1.001 || s.framing.bottom < -1.001 || s.framing.top - s.framing.bottom < 1.2)) {
    failures.push(`[${label}] showcase art out of frame or too small (top ${s.framing.top}, bottom ${s.framing.bottom})`);
  }
}

// The test clock must move the format (a frozen format fails).
async function checkAlive(page, label) {
  const a = (await state(page)).view;
  await advance(page, 400);
  await settle(page);
  const b = (await state(page)).view;
  if (!a || a.time === b.time) failures.push(`[${label}] frozen: the format's clock did not move (${a?.time} -> ${b?.time})`);
}

// Every hero x tab x size: screenshot, framing, alive.
async function walk(page, name) {
  for (const [hero, h] of Object.entries(HEROES)) {
    for (const tab of h.formats) {
      for (const size of SIZES) {
        const label = `${name} ${hero} ${tab} ${size}`;
        await page.evaluate((c) => window.__game.show(c), { hero, tab, size });
        await settle(page);
        await advance(page, tab === 'C' ? 2600 : 900); // C: mid-reveal
        await settle(page);
        const s = await state(page);
        if (s.hero !== hero || s.tab !== tab || s.size !== size) failures.push(`[${label}] showing ${s.hero} ${s.tab} ${s.size}`);
        checkFraming(label, s);
        await shot(page, name, `${hero}-${tab}-${size}`);
        await checkAlive(page, label);
        if (tab === 'C') {
          await advance(page, 4000); // past the clip's end: the still card held
          await settle(page);
          await shot(page, name, `${hero}-${tab}-${size}-end`);
        }
        summaries.push(`[${label}] ${await page.evaluate(() => window.__game.stateText().split('\n')[1].trim())}`);
      }
    }
  }
}

// The controls a person uses: tabs, hero switch, size toggle, score panel, tilt.
async function controls(page, name, input, touch) {
  await settle(page);
  await input('#tabs [data-tab="C"]');
  await settle(page);
  let s = await state(page);
  if (s.tab !== 'C') failures.push(`[${name}] tapping tab C did not switch (tab ${s.tab})`);
  await input('#sizes [data-size="showcase"]');
  await settle(page);
  s = await state(page);
  if (s.size !== 'showcase') failures.push(`[${name}] size toggle did not switch to showcase`);
  await input('#heroes [data-hero="knight"]');
  await settle(page);
  s = await state(page);
  if (s.hero !== 'knight') failures.push(`[${name}] hero switch did not pick the knight`);
  for (const t of ['B', 'D']) if (await page.isEnabled(`#tabs [data-tab="${t}"]`)) failures.push(`[${name}] knight: tab ${t} should be disabled`);
  await advance(page, 300);
  await shot(page, name, 'controls-knight-C-showcase');
  await input('#heroes [data-hero="sorceress"]');
  await input('#tabs [data-tab="A"]');
  await input('#sizes [data-size="card"]');
  await settle(page);

  // Tilt: hover (laptop) or touch-drag (phone) toward the card's right edge.
  const r = (await state(page)).slot;
  const at = [r.x + r.w * 0.95, r.y + r.h * 0.5];
  if (touch) {
    await page.evaluate(([x, y]) => {
      const el = document.getElementById('slot');
      const ev = (type, buttons) => el.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'touch', buttons, bubbles: true }));
      ev('pointerdown', 1);
      ev('pointermove', 1);
    }, at);
  } else await page.mouse.move(...at);
  await advance(page, 600);
  s = await state(page);
  if (!(s.view.tilt[0] > 0.5)) failures.push(`[${name}] ${touch ? 'drag' : 'hover'} did not tilt the card (tilt ${s.view.tilt})`);
  else summaries.push(`[${name}] ${touch ? 'touch drag' : 'hover'} tilts the card (tilt ${s.view.tilt})`);
  await shot(page, name, 'controls-A-tilted');

  // Score panel: enter look 4 + pay yes for A card; it must show in the text and survive a reload.
  await input('#score-open');
  await input('#score-grid [data-format="A"] [data-size="card"] button:nth-of-type(4)');
  await page.locator('#score-grid [data-format="A"] [data-size="card"] button', { hasText: 'Yes' }).click();
  const device = (await state(page)).score.device;
  const want = `${device} sorceress A card: look 4, pay yes`;
  let text = await page.evaluate(() => window.__game.scoresText());
  if (!text.includes(want)) failures.push(`[${name}] score text missing "${want}": ${text}`);
  await shot(page, name, 'score-panel');
  await page.reload();
  await page.waitForFunction(() => window.__game?.state().loaded, null, { timeout: 60000 });
  text = await page.evaluate(() => window.__game.scoresText());
  if (!text.includes(want)) failures.push(`[${name}] score not saved across a reload: ${text}`);
  else summaries.push(`[${name}] score panel saves and copies: ${text}`);
}

// Phone speed: real clock, load time from navigation, frames per second per format.
async function speed(page, name) {
  const s = await state(page);
  const load = s.loadMs;
  (load < TARGET.loadMs ? summaries : failures).push(`[${name}] load ${load} ms (target under ${TARGET.loadMs})`);
  for (const [tab, size] of [['A', 'card'], ['A', 'showcase'], ['C', 'card'], ['C', 'showcase'], ['D', 'card'], ['D', 'showcase'], ['M', 'card'], ['M', 'showcase']]) {
    await page.evaluate((c) => window.__game.show(c), { tab, size });
    await settle(page);
    const f = await page.evaluate(() => window.__game.measureFps(3000));
    const line = `[${name}] ${tab} ${size}: ${f.fps} fps, worst frame ${f.worstMs} ms (target ${TARGET.fps}+)`;
    // The cloud has no GPU (software rendering), so a low number here is a note to confirm on
    // the real phone with ?debug; only a near-stall fails.
    if (f.fps >= TARGET.fps) summaries.push(line);
    else if (f.fps >= TARGET.stallFps) notes.push(`${line}: software GPU in the cloud, confirm on the phone with ?debug`);
    else failures.push(`${line}: stalled`);
  }
}

// ?take=N shows another Kling attempt.
async function otherTake(page, name) {
  await settle(page);
  const src = (await state(page)).view.src;
  if (src !== 'sorceress-4.webm') failures.push(`[${name}] ?take=4 played ${src}, expected sorceress-4.webm`);
  else summaries.push(`[${name}] ?take=4 plays ${src}`);
}

// ?debug shows the FPS overlay.
async function debugOverlay(page, name) {
  await advance(page, 600);
  if (!(await page.isVisible('#fps'))) failures.push(`[${name}] ?debug did not show the FPS overlay`);
  else summaries.push(`[${name}] ?debug overlay visible`);
}

const DEVICES = {
  laptop: [{ viewport: { width: 1280, height: 720 } }, (page) => (sel) => page.click(sel), false],
  phone: [{ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, (page) => (sel) => page.tap(sel), true],
};
for (const [name, [opts, input, touch]] of Object.entries(DEVICES)) {
  await run(name, opts, (page) => walk(page, name));
  await run(`${name}-controls`, opts, (page) => controls(page, `${name}-controls`, input(page), touch));
}
await run('phone-speed', DEVICES.phone[0], (page) => speed(page, 'phone-speed'), '');
await run('laptop-take', DEVICES.laptop[0], (page) => otherTake(page, 'laptop-take'), '?test&tab=C&take=4');
await run('laptop-debug', DEVICES.laptop[0], (page) => debugOverlay(page, 'laptop-debug'), '?test&debug');

await browser.close();
await server?.close();

const report = [
  `# Check ${failures.length ? 'FAILED' : 'passed'} — ${new Date().toISOString()}`,
  `target: ${base}`,
  '',
  ...summaries,
  '',
  '## notes',
  ...(notes.length ? notes : ['none']),
  '',
  '## failures',
  ...(failures.length ? failures : ['none']),
  '',
  '## console',
  ...(log.length ? log : ['(empty)']),
].join('\n');
writeFileSync(join(OUT, 'summary.txt'), report + '\n');
console.log(report);
console.log(`\nScreenshots and summary in ${OUT}/`);
process.exit(failures.length ? 1 : 0);
