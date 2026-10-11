/** Canvas size (CSS px), px per world unit, and where the fingertip sits in the canvas. */
export const CURSOR = { size: 168, k: 15, tipX: 92, tipY: 58 };

/** Pointer-driven state shared by the DOM tracker and the 3D hand (mutated outside React renders). */
export const cursorState = {
  vx: 0,
  vy: 0,
  hover: false,
  down: false,
  lastMove: 0,
  ready: false,
  wake: null,
  onReady: null,
};
