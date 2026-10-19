// Stub for a format that hasn't shipped yet (B, D): the still hero card and a note.
import { placeShowcase } from './fit.js';

export function createComing({ host, hero, size, aspect, format, $ }) {
  const frame = document.createElement('div');
  frame.className = 'framed';
  const img = document.createElement('img');
  img.src = hero.image;
  img.alt = hero.name;
  frame.append(img);
  host.append(frame);
  const note = $('coming');
  note.textContent = format.note;
  note.hidden = false;
  let time = 0;
  return {
    id: format.id,
    resize() { placeShowcase(frame, size, aspect); },
    update(dt) { time += dt; },
    render() {},
    state: () => ({ time: +time.toFixed(3), coming: true }),
    dispose() {
      frame.remove();
      note.hidden = true;
    },
  };
}
