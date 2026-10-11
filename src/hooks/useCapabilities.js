/**
 * Decides whether heavy 3D effects should run. Computed once.
 * 3D is skipped when WebGL is missing, the user prefers reduced motion,
 * the device reports very limited CPU/memory, or data-saver is on.
 */
let cached;

function detect() {
  if (typeof window === 'undefined') {
    return { webgl: false, reduced: true, lowEnd: true, mobile: false, enable3D: false };
  }

  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    webgl = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const nav = navigator;
  const lowEnd =
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) ||
    (nav.deviceMemory && nav.deviceMemory <= 2) ||
    Boolean(nav.connection && nav.connection.saveData);

  return { webgl, reduced, lowEnd, mobile, enable3D: webgl && !reduced && !lowEnd };
}

export function getCapabilities() {
  if (!cached) cached = detect();
  return cached;
}
