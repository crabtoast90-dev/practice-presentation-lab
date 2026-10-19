// SHARED: the CARD / SHOWCASE size toggle. Sets body.size-card or body.size-showcase;
// the layout itself lives in src/style.css (#hand, #slot).
import { SIZES } from '../lab/data.js';

const LABEL = { card: 'Card', showcase: 'Showcase' };

export function createSizeToggle({ $, onSize }) {
  const el = $('sizes');
  for (const s of SIZES) {
    const b = document.createElement('button');
    b.dataset.size = s;
    b.textContent = LABEL[s];
    b.addEventListener('click', () => onSize(s));
    el.append(b);
  }
  return {
    show(size) {
      document.body.classList.remove(...SIZES.map((s) => `size-${s}`));
      document.body.classList.add(`size-${size}`);
      for (const b of el.children) b.setAttribute('aria-pressed', String(b.dataset.size === size));
    },
  };
}
