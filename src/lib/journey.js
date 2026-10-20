import { useSyncExternalStore } from 'react';
import { getCapabilities } from '../hooks/useCapabilities';

/**
 * Shared state for the "journey" through the site: whether the portal intro
 * has opened, where the last click landed (so overlays can open from it) and
 * the travel event the warp transition listens for.
 *
 * The intro plays on every load and refresh, but only when 3D is allowed.
 * Otherwise the site is "open" from the very first frame.
 */
export const introWillPlay = typeof window !== 'undefined' && getCapabilities().enable3D;

let introDone = !introWillPlay;
const subs = new Set();

if (introWillPlay) document.documentElement.classList.add('intro-active');

/** Called as the portal dissolves: unlocks scrolling and starts the hero reveal. */
export function finishIntro() {
  if (introDone) return;
  introDone = true;
  document.documentElement.classList.remove('intro-active');
  subs.forEach((fn) => fn());
}

export function useIntroDone() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => introDone,
    () => true
  );
}

/** Where the pointer last went down, as viewport percentages (for circular reveals). */
export const lastPointer = { x: 50, y: 50 };

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPointer.x = (e.clientX / window.innerWidth) * 100;
      lastPointer.y = (e.clientY / window.innerHeight) * 100;
    },
    { passive: true, capture: true }
  );
}

export const TRAVEL_EVENT = 'journey:travel';

/** Ask the warp transition to carry the visitor to a section (e.g. "#projects"). */
export function travelTo(hash) {
  window.dispatchEvent(new CustomEvent(TRAVEL_EVENT, { detail: { hash } }));
}

/** Each section is its own "world": a name for the transition and an effect style. */
export const WORLDS = {
  home: { name: 'The AI Universe', fx: 'tunnel' },
  skills: { name: 'The Neural Realm', fx: 'neural' },
  projects: { name: 'The Innovation Dimension', fx: 'shards' },
  services: { name: 'The Workshop', fx: 'tunnel' },
  experience: { name: 'The Timeline', fx: 'shards' },
  education: { name: 'The Archive', fx: 'neural' },
  certifications: { name: 'The Vault', fx: 'shards' },
  about: { name: 'The Digital Mind', fx: 'neural' },
  contact: { name: 'The Connection Portal', fx: 'ripple' },
};
