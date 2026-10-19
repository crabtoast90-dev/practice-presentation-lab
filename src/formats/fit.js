// SHARED: where the hero art sits in SHOWCASE, so every format frames it the same way:
// as tall as fits under the bar, allowed to run a little past the screen's sides on a phone.
export const SHOWCASE_OVERFLOW = 1.15; // art may be up to 115% of the screen width

export function showcaseBox(aspect) {
  const W = innerWidth;
  const H = innerHeight;
  const top = document.getElementById('bar').getBoundingClientRect().height + 6;
  const h = Math.min(H - top, (W * SHOWCASE_OVERFLOW) / aspect);
  const w = h * aspect;
  return { x: (W - w) / 2, y: top + (H - top - h) / 2, w, h, W, H };
}

// Place a DOM box (video, still) on the showcase rect; clear it in CARD size.
export function placeShowcase(el, size, aspect) {
  if (size !== 'showcase') return el.removeAttribute('style');
  const b = showcaseBox(aspect);
  Object.assign(el.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, right: 'auto', bottom: 'auto' });
}
