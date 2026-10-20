import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { finishIntro, introWillPlay } from '../lib/journey';
import SceneBoundary from './SceneBoundary';

const PortalScene = lazy(() => import('./three/PortalScene'));

const PHASES = [
  'Initializing the void',
  'Energy source detected',
  'Gravity well forming',
  'Opening the event horizon',
  'Crossing over',
];

// If the scene never gets going (slow network, GPU stall), don't hold the site hostage:
// fast-forward first, then give up entirely.
const FASTFORWARD_MS = 11000;
const FAILSAFE_MS = 16000;

/**
 * Cinematic opening: a full-screen WebGL black-hole portal sequence that dissolves into the
 * homepage. Plays on every load and refresh. While it runs the page is scroll-locked, but the
 * overlay releases pointer events the moment it starts to dissolve, and it can be
 * skipped with the button, Escape, Enter or Space.
 */
export default function PortalIntro() {
  const [mounted, setMounted] = useState(introWillPlay);
  const [phase, setPhase] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const skipRef = useRef(null);
  const hud = useRef(null);
  const root = useRef(null);
  const bar = useRef(null);
  const stage = useRef(null);

  useEffect(() => {
    if (hud.current === null) hud.current = {};
    hud.current.root = root.current;
    hud.current.bar = bar.current;
    hud.current.stage = stage.current;
  });

  const close = useCallback(() => {
    finishIntro();
    setMounted(false);
  }, []);

  const reveal = useCallback(() => {
    finishIntro();
    setDissolving(true);
  }, []);

  const skip = useCallback(() => skipRef.current?.(), []);

  useEffect(() => {
    if (!mounted) return undefined;
    const rush = setTimeout(skip, FASTFORWARD_MS);
    const failsafe = setTimeout(close, FAILSAFE_MS);
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(rush);
      clearTimeout(failsafe);
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, close, skip]);

  if (!mounted) return null;

  return (
    <div
      ref={root}
      role="presentation"
      className="portal-intro"
      style={{ pointerEvents: dissolving ? 'none' : 'auto' }}
    >
      <SceneBoundary fallback={<Bail onBail={close} />}>
        <Suspense fallback={null}>
          <PortalScene
            onPhase={setPhase}
            onReveal={reveal}
            onDone={close}
            hud={hud}
            skipRef={skipRef}
          />
        </Suspense>
      </SceneBoundary>

      <div className="portal-vignette" aria-hidden="true" />

      <div ref={stage} className="portal-hud" aria-hidden={dissolving}>
        <p className="hud-label portal-phase" key={phase}>
          {PHASES[phase]}
        </p>
        <div className="portal-bar">
          <div ref={bar} />
        </div>
        <button type="button" className="portal-skip" onClick={skip} disabled={dissolving}>
          Skip intro
        </button>
      </div>
      <span className="sr-only">Opening the portfolio. Press Escape to skip the intro.</span>
    </div>
  );
}

/** Renders nothing; closes the intro if the 3D scene failed to start. */
function Bail({ onBail }) {
  useEffect(() => {
    onBail();
  }, [onBail]);
  return null;
}
