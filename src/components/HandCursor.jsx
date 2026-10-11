import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { getCapabilities } from '../hooks/useCapabilities';
import { CURSOR, cursorState } from './three/cursorConfig';
import SceneBoundary from './SceneBoundary';

const HandCursor3D = lazy(() => import('./three/HandCursor3D'));

const CLICKABLE = 'a,button,[role="button"],summary,select,label[for],.cursor-pointer';
const TEXT = 'input,textarea,[contenteditable="true"]';

/**
 * The site's only custom cursor: a small realistic robotic hand drawn by a
 * transparent WebGL canvas that follows the mouse (the index fingertip is the
 * hotspot). It only activates for real mice on capable devices, and the native
 * cursor stays until its first frame renders, so there is never a moment or a
 * failure with no cursor. The overlay has pointer-events: none.
 */
export default function HandCursor() {
  const [enabled] = useState(
    () => getCapabilities().enable3D && window.matchMedia('(pointer: fine) and (hover: hover)').matches
  );
  const wrap = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const s = cursorState;
    const el = wrap.current;
    const root = document.documentElement;
    let seen = false;

    s.onReady = () => root.classList.add('has-3d-cursor');
    const show = (v) => {
      el.style.opacity = v ? '1' : '0';
    };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      el.style.transform = `translate3d(${e.clientX - CURSOR.tipX}px, ${e.clientY - CURSOR.tipY}px, 0)`;
      s.vx += (e.movementX - s.vx) * 0.4;
      s.vy += (e.movementY - s.vy) * 0.4;
      s.lastMove = performance.now();
      const t = e.target instanceof Element ? e.target : null;
      s.hover = Boolean(t && t.closest(CLICKABLE)) || root.dataset.cursor === 'pointer';
      seen = true;
      show(!(t && t.closest(TEXT))); // native text cursor over form fields
      s.wake?.();
    };
    const onDown = (e) => {
      if (e.pointerType === 'mouse') {
        s.down = true;
        s.wake?.();
      }
    };
    const onUp = () => {
      s.down = false;
      s.wake?.();
    };
    const onLeave = () => show(false);
    const onEnter = () => seen && show(true);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('mouseenter', onEnter);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('mouseenter', onEnter);
      root.classList.remove('has-3d-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: CURSOR.size,
        height: CURSOR.size,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.15s ease',
        willChange: 'transform',
        filter: 'drop-shadow(3px 6px 5px rgba(0, 0, 0, 0.45))',
      }}
    >
      <SceneBoundary>
        <Suspense fallback={null}>
          <HandCursor3D />
        </Suspense>
      </SceneBoundary>
    </div>
  );
}
