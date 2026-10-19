// Every number and name the lab uses. Ask for changes by name ("foil.strength to 0.5");
// ?tune=foil.strength:0.5 tries one without editing this file.

export const HEROES = {
  sorceress: {
    name: 'Sorceress',
    title: 'Emerald Veil',
    image: 'heroes/sorceress.jpg',
    fx: 'heroes/sorceress-fx.png', // R = character mask, G = soft glow around it
    reveal: { file: 'reveal/sorceress', takes: [2, 3, 4], keep: 3 }, // <file>-<take>.webm (+ .mp4 for older iPhones); ?take=N shows another
    formats: ['A', 'B', 'C', 'D'],
    glow: [0.35, 0.95, 0.82], // halo color around the character
  },
  knight: {
    name: 'Knight',
    title: 'Dawn Oath',
    image: 'heroes/knight.jpg',
    fx: 'heroes/knight-fx.png',
    reveal: { file: 'reveal/knight', takes: [1, 3, 4], keep: 3 },
    formats: ['A', 'C'],
    glow: [1.0, 0.84, 0.5],
  },
};

// Tab bar order. status 'coming' = a stub tab until its lane ships (see PLAN.md).
export const FORMATS = [
  { id: 'A', name: 'Shader card', short: 'A Card', status: 'live' },
  { id: 'B', name: 'Shader puppet', short: 'B Puppet', status: 'coming', note: 'Coming: layered puppet with breathing, hair sway and blinks (lane B).' },
  { id: 'C', name: 'Kling reveal', short: 'C Reveal', status: 'live' },
  { id: 'D', name: 'Toon 3D', short: 'D 3D', status: 'coming', note: 'Coming: VRoid model in three-vrm MToon, needs hero.vrm (lane D).' },
];

export const SIZES = ['card', 'showcase'];

export const LAB = {
  imageAspect: 1200 / 1754, // width / height of the hero art
  card: { width: 300 }, // CARD size: px wide in the mock hand
  tilt: { maxDeg: 12, spring: 9, idleDeg: 2.5, idleSeconds: 6 }, // hover/drag tilt; slow idle sway
  bob: { amount: 0.012, seconds: 3.4 }, // idle bob, fraction of card height
  foil: { strength: 0.24, onCharacter: 0.05, sweep: 0.16, bands: 1.4 }, // holo foil (mostly on the background)
  rim: { strength: 0.7, width: 0.006, color: [1.0, 0.86, 0.55] }, // character edge lit from the tilt side
  glow: { strength: 0.28, pulseSeconds: 3.9 }, // soft halo around the character (color per hero)
  reveal: { holdSeconds: 2.5 }, // C: after the clip ends, hold the still card this long, then play again
};
