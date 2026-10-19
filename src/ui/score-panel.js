// SHARED: the SCORE panel. For each format and size: look 1-5 and "would I pay for this
// as a skin?" yes/no, per device (laptop / phone) and hero. Saved in this browser
// (localStorage); "Copy for LOG.md" gives plain text to paste into LOG.md.
import { FORMATS, HEROES, SIZES } from '../lab/data.js';

const KEY = 'presentation-lab-scores-v1';
const DEVICES = ['laptop', 'phone'];

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}
function save(scores) {
  try {
    localStorage.setItem(KEY, JSON.stringify(scores));
  } catch {
    // private window or blocked storage: scores live until the page closes
  }
}

export function createScorePanel({ $, getHero }) {
  let scores = load(); // { 'phone|sorceress|A|card': { look: 4, pay: 'yes' } }
  let device = matchMedia('(pointer: coarse)').matches || innerWidth < 700 ? 'phone' : 'laptop';
  const panel = $('score');
  const grid = $('score-grid');
  const text = $('score-text');

  const key = (hero, f, size) => `${device}|${hero}|${f}|${size}`;
  const set = (k, field, value) => {
    scores[k] = { ...scores[k], [field]: scores[k]?.[field] === value ? undefined : value }; // tap again to clear
    save(scores);
    render();
  };

  function button(label, pressed, onClick) {
    const b = document.createElement('button');
    b.textContent = label;
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', onClick);
    return b;
  }

  function render() {
    const hero = getHero();
    $('score-device').replaceChildren(...DEVICES.map((d) => button(d === 'laptop' ? 'Laptop' : 'Phone', d === device, () => { device = d; render(); })));
    grid.replaceChildren();
    const head = document.createElement('div');
    head.className = 'score-help';
    head.textContent = `${HEROES[hero].name} on ${device}`;
    grid.append(head);
    for (const f of FORMATS) {
      if (!HEROES[hero].formats.includes(f.id)) continue;
      const row = document.createElement('div');
      row.className = `score-row${f.status === 'coming' ? ' coming' : ''}`;
      row.dataset.format = f.id;
      const name = document.createElement('div');
      name.className = 'fmt';
      name.textContent = `${f.id} ${f.name}`;
      row.append(name);
      for (const size of SIZES) {
        const k = key(hero, f.id, size);
        const v = scores[k] ?? {};
        const cell = document.createElement('div');
        cell.className = 'score-cell';
        cell.dataset.size = size;
        const lbl = document.createElement('span');
        lbl.className = 'lbl';
        lbl.textContent = size === 'card' ? 'Card' : 'Showcase';
        cell.append(lbl);
        for (let n = 1; n <= 5; n++) cell.append(button(String(n), v.look === n, () => set(k, 'look', n)));
        const pay = document.createElement('span');
        pay.className = 'pay';
        pay.textContent = 'pay?';
        cell.append(pay, button('Yes', v.pay === 'yes', () => set(k, 'pay', 'yes')), button('No', v.pay === 'no', () => set(k, 'pay', 'no')));
        if (f.status === 'coming') for (const b of cell.querySelectorAll('button')) b.disabled = true;
        row.append(cell);
      }
      grid.append(row);
    }
    text.value = asText();
  }

  // One line per scored format and size, all devices and heroes, ready for LOG.md notes.
  function asText() {
    const lines = [];
    for (const d of DEVICES)
      for (const h of Object.keys(HEROES))
        for (const f of FORMATS)
          for (const s of SIZES) {
            const v = scores[`${d}|${h}|${f.id}|${s}`];
            if (v?.look || v?.pay) lines.push(`${d} ${h} ${f.id} ${s}: look ${v.look ?? '-'}, pay ${v.pay ?? '-'}`);
          }
    return lines.length ? `Scores (${new Date().toISOString().slice(0, 10)}): ${lines.join('; ')}` : '(no scores yet)';
  }

  $('score-open').addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) render(); });
  $('score-close').addEventListener('click', () => { panel.hidden = true; });
  $('score-copy').addEventListener('click', async () => {
    text.value = asText();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text.value);
      ok = true;
    } catch {
      text.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
    }
    $('score-copied').textContent = ok ? 'Copied.' : 'Select the text below and copy it.';
  });

  return {
    render,
    asText,
    state: () => ({ open: !panel.hidden, device, count: Object.values(scores).filter((v) => v.look || v.pay).length }),
  };
}
