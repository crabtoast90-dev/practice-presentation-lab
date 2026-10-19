// SHARED: the tab bar (one tab per format) and the hero switch.
// A format the current hero doesn't have is shown but disabled (the knight has A and C only).
import { FORMATS, HEROES } from '../lab/data.js';

export function createTabBar({ $, onTab, onHero }) {
  const tabs = $('tabs');
  const heroes = $('heroes');
  for (const f of FORMATS) {
    const b = document.createElement('button');
    b.role = 'tab';
    b.dataset.tab = f.id;
    b.textContent = f.short;
    b.title = f.name + (f.status === 'coming' ? ' (coming)' : '');
    if (f.status === 'coming') b.classList.add('coming');
    b.addEventListener('click', () => onTab(f.id));
    tabs.append(b);
  }
  for (const [id, h] of Object.entries(HEROES)) {
    const b = document.createElement('button');
    b.dataset.hero = id;
    b.textContent = h.name;
    b.addEventListener('click', () => onHero(id));
    heroes.append(b);
  }
  return {
    show(hero, tab) {
      for (const b of tabs.children) {
        b.setAttribute('aria-selected', String(b.dataset.tab === tab));
        b.disabled = !HEROES[hero].formats.includes(b.dataset.tab);
      }
      for (const b of heroes.children) b.setAttribute('aria-pressed', String(b.dataset.hero === hero));
    },
  };
}
