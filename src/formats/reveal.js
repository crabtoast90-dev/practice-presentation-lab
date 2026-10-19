// Format C: the Kling 3.0 "card is born" clip. It starts and ends on the hero still, so it
// plays, holds the still card for a moment, and plays again. Tap the card to replay now.
// In ?test the clock drives the clip (seeks) so screenshots are repeatable.
import { placeShowcase } from './fit.js';

function videoSrc(hero, take) {
  const v = document.createElement('video');
  const t = hero.reveal.takes.includes(take) ? take : hero.reveal.keep; // ?take=N: another Kling attempt
  return `${hero.reveal.file}-${t}.${v.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4'}`; // older iPhones: MP4
}

export function createReveal({ host, hero, size, lab, test, take }) {
  const aspect = lab.imageAspect;
  const frame = document.createElement('div');
  frame.className = 'framed';
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';
  video.poster = hero.image;
  video.src = videoSrc(hero, take);
  frame.append(video);
  host.append(frame);

  let time = 0; // test clock
  let plays = 0;
  let holdTimer = null;
  const ready = new Promise((resolve) => {
    if (video.readyState >= 2) resolve();
    else video.addEventListener('loadeddata', () => resolve(), { once: true });
    video.addEventListener('error', () => { console.error(`reveal video failed to load: ${video.src}`); resolve(); }, { once: true });
  });

  function play() {
    clearTimeout(holdTimer);
    video.currentTime = 0;
    plays++;
    video.play().catch(() => {}); // autoplay can be refused before the first tap; the poster still shows
  }
  const onEnded = () => { holdTimer = setTimeout(play, lab.reveal.holdSeconds * 1000); };
  const onTap = () => { if (!test) play(); };
  video.addEventListener('ended', onEnded);
  frame.addEventListener('click', onTap);
  if (!test) ready.then(play);
  else video.pause();

  return {
    id: 'C',
    ready,
    resize() { placeShowcase(frame, size, aspect); },
    update(dt) {
      if (!test) return;
      time += dt;
      const clip = video.duration || 5;
      const t = time % (clip + lab.reveal.holdSeconds);
      const want = Math.min(t, clip - 0.01);
      if (Math.abs(video.currentTime - want) > 0.001) video.currentTime = want;
    },
    render() {},
    state: () => ({ time: +video.currentTime.toFixed(3), duration: +(video.duration || 0).toFixed(2), ready: video.readyState >= 2 && !video.seeking, plays, src: video.currentSrc.split('/').pop() }),
    dispose() {
      clearTimeout(holdTimer);
      video.removeEventListener('ended', onEnded);
      video.pause();
      video.removeAttribute('src');
      video.load();
      frame.remove();
    },
  };
}
