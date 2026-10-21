/**
 * Motion language for the whole site: one set of durations, easings and variants,
 * so every section moves with the same rhythm.
 */
export const DUR = {
  fast: 0.28, // hovers, small UI
  base: 0.65, // standard reveals
  hero: 0.85, // headline and hero elements
};

// A long, soft deceleration for things arriving; a symmetric curve for things moving between states.
export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
};

export const STAGGER = 0.09;

// Reveal once, a little before the element is fully on screen.
export const VIEWPORT = { once: true, amount: 0.2, margin: '0px 0px -6% 0px' };

export const rise = (y = 22, duration = DUR.base, delay = 0) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration, ease: EASE.out, delay } },
});

export const container = (stagger = STAGGER, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE.out } },
};
