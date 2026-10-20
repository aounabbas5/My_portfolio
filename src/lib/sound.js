import { useSyncExternalStore } from 'react';

/**
 * The site's sound design, synthesised live with the Web Audio API (no audio files to download).
 *
 *  - Intro: a deep space drone that swells with the black hole, an ignition riser, a sub-bass boom
 *    when the hole opens, a whoosh on the dive and a soft bell as the homepage appears. Typing
 *    ticks follow the welcome text.
 *  - Site: a whoosh on section travel and very quiet UI ticks on links and buttons.
 *
 * Browsers only allow audio after a user gesture, so sound is opt-in through the toggle (the choice is
 * remembered). If it was on last visit, the first tap or key press brings it back.
 */
const KEY = 'aoun:sound';
const MASTER = 0.55;

// Shared with PortalScene so the soundtrack can line up with the visual timeline.
export const introClock = { t: 0, playing: false };
const INTRO = { birth: 0.9, fly: 3.5, reveal: 5.0, end: 6.0 };

let ctx = null;
let master = null;
let noiseBuf = null;
let intro = null; // { bus, sources }
let lastHover = 0;
const subs = new Set();

function readPref() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
let enabled = typeof window !== 'undefined' && readPref();
const notify = () => subs.forEach((fn) => fn());

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

const running = () => ctx && ctx.state === 'running';

/* ---------- small builders ---------- */

function osc(type, freq, dest, { start = 0, stop, detune = 0 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  o.connect(dest);
  o.start(start);
  if (stop) o.stop(stop);
  return o;
}

function noise(dest, { start = 0, stop } = {}) {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf;
  n.loop = true;
  n.connect(dest);
  n.start(start);
  if (stop) n.stop(stop);
  return n;
}

/** Envelope on a gain node from [time, value] points (linear ramps). */
function env(param, points) {
  param.cancelScheduledValues(0);
  param.setValueAtTime(points[0][1], points[0][0]);
  for (let i = 1; i < points.length; i++) param.linearRampToValueAtTime(points[i][1], points[i][0]);
}

/* ---------- intro soundtrack ---------- */

function startIntro() {
  if (!running() || !introClock.playing || intro) return;
  const from = introClock.t;
  const now = ctx.currentTime + 0.05;
  // map a timeline moment to audio time (moments already past are skipped)
  const at = (te) => now + Math.max(0, te - from);
  const live = (te) => te >= from - 0.05;
  const sources = [];
  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(master);
  const track = (n) => (sources.push(n), n);
  const end = at(INTRO.end + 0.6);

  // drone: two detuned saws + a sub sine through a filter that opens as the hole does
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.Q.value = 6;
  env(droneFilter.frequency, [
    [now, 90],
    [at(INTRO.birth), 160],
    [at(INTRO.birth + 2), 520],
    [at(INTRO.fly), 700],
    [at(INTRO.fly + 1.8), 2200],
    [at(INTRO.end), 300],
  ]);
  env(droneGain.gain, [
    [now, 0],
    [at(0.9), 0.32],
    [at(INTRO.fly), 0.42],
    [at(INTRO.fly + 1.6), 0.62],
    [at(INTRO.end), 0],
  ]);
  droneFilter.connect(droneGain);
  droneGain.connect(bus);
  track(osc('sawtooth', 55, droneFilter, { start: now, stop: end }));
  track(osc('sawtooth', 55, droneFilter, { start: now, stop: end, detune: 9 }));
  track(osc('sine', 27.5, droneGain, { start: now, stop: end }));

  // pad: a soft open fifth that fades in with the disk (slow tremolo for movement)
  const padGain = ctx.createGain();
  env(padGain.gain, [
    [now, 0],
    [at(INTRO.birth + 0.6), 0],
    [at(INTRO.birth + 2.4), 0.07],
    [at(INTRO.fly + 0.6), 0.1],
    [at(INTRO.end), 0],
  ]);
  const trem = ctx.createGain();
  trem.gain.value = 0.7;
  const lfo = osc('sine', 0.35, ctx.createGain(), { start: now, stop: end });
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.3;
  lfo.disconnect();
  lfo.connect(lfoDepth);
  lfoDepth.connect(trem.gain);
  padGain.connect(trem);
  trem.connect(bus);
  [220, 330, 440, 659.25].forEach((f, i) => track(osc('sine', f, padGain, { start: now, stop: end, detune: i * 4 })));
  track(lfo);

  // ignition: a thin rising tone as the point of energy builds, cut by the collapse
  if (live(0.2)) {
    const g = ctx.createGain();
    env(g.gain, [
      [at(0.2), 0],
      [at(0.8), 0.05],
      [at(INTRO.birth), 0.07],
      [at(INTRO.birth + 0.05), 0],
    ]);
    g.connect(bus);
    const o = osc('sine', 500, g, { start: at(0.2), stop: at(INTRO.birth + 0.1) });
    o.frequency.setValueAtTime(500, at(0.2));
    o.frequency.exponentialRampToValueAtTime(2100, at(INTRO.birth));
    track(o);
  }

  // the collapse: a sub-bass boom with a burst of filtered noise
  if (live(INTRO.birth)) {
    const t0 = at(INTRO.birth + 0.05);
    const bg = ctx.createGain();
    env(bg.gain, [
      [t0, 0],
      [t0 + 0.02, 0.85],
      [t0 + 1.8, 0],
    ]);
    bg.connect(bus);
    const b = osc('sine', 95, bg, { start: t0, stop: t0 + 2 });
    b.frequency.setValueAtTime(95, t0);
    b.frequency.exponentialRampToValueAtTime(26, t0 + 1.4);
    track(b);
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.setValueAtTime(2400, t0);
    nf.frequency.exponentialRampToValueAtTime(120, t0 + 1.2);
    const ng = ctx.createGain();
    env(ng.gain, [
      [t0, 0.5],
      [t0 + 1.2, 0],
    ]);
    nf.connect(ng);
    ng.connect(bus);
    track(noise(nf, { start: t0, stop: t0 + 1.3 }));
  }

  // the dive: wind rushes in, rising in pitch and level
  if (live(INTRO.fly)) {
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.Q.value = 1.1;
    wf.frequency.setValueAtTime(180, at(INTRO.fly - 0.1));
    wf.frequency.exponentialRampToValueAtTime(3600, at(INTRO.fly + 1.9));
    const wg = ctx.createGain();
    env(wg.gain, [
      [at(INTRO.fly - 0.1), 0],
      [at(INTRO.fly + 1.5), 0.55],
      [at(INTRO.reveal + 0.2), 0],
    ]);
    wf.connect(wg);
    wg.connect(bus);
    track(noise(wf, { start: at(INTRO.fly - 0.1), stop: at(INTRO.reveal + 0.3) }));
  }

  // arrival: a soft two-note bell as the homepage fades up
  if (live(INTRO.reveal)) {
    [
      [659.25, 0],
      [987.77, 0.14],
    ].forEach(([f, delay]) => {
      const t0 = at(INTRO.reveal + 0.15) + delay;
      const g = ctx.createGain();
      env(g.gain, [
        [t0, 0],
        [t0 + 0.01, 0.16],
        [t0 + 1.9, 0],
      ]);
      g.connect(master); // outside the bus so the fade-out doesn't cut it
      track(osc('sine', f, g, { start: t0, stop: t0 + 2 }));
      track(osc('sine', f * 2.01, g, { start: t0, stop: t0 + 2 }));
    });
  }

  // typing ticks for the welcome wording
  const ticks = [
    [0.8, 1.9, 26],
    [2.0, 3.1, 27],
    [3.0, 3.7, 31],
  ];
  ticks.forEach(([a, b, n]) => {
    for (let i = 0; i < n; i++) {
      const te = a + ((b - a) * i) / n;
      if (!live(te)) continue;
      const t0 = at(te);
      const g = ctx.createGain();
      env(g.gain, [
        [t0, 0],
        [t0 + 0.004, 0.035],
        [t0 + 0.04, 0],
      ]);
      g.connect(bus);
      track(osc('square', 1500 + (i % 4) * 120, g, { start: t0, stop: t0 + 0.06 }));
    }
  });

  intro = { bus, sources };
}

function stopIntro(fade = 0.25) {
  if (!intro || !ctx) return;
  const { bus, sources } = intro;
  intro = null;
  const t = ctx.currentTime;
  bus.gain.cancelScheduledValues(t);
  bus.gain.setTargetAtTime(0, t, fade / 3);
  setTimeout(() => {
    sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    bus.disconnect();
  }, fade * 1000 + 100);
}

/* ---------- public API ---------- */

export const isSoundEnabled = () => enabled;

export function setSoundEnabled(on) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* private mode */
  }
  if (on) {
    if (!ensure()) return;
    ctx.resume().then(() => {
      master.gain.setTargetAtTime(MASTER, ctx.currentTime, 0.05);
      startIntro();
      uiTone(660, 0.12, 0.05);
    });
  } else if (ctx) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    stopIntro(0.15);
  }
  notify();
}

/** The first tap/key after load brings sound back if it was left on last time. */
export function armSound() {
  if (!enabled || typeof window === 'undefined') return;
  const wake = () => {
    window.removeEventListener('pointerdown', wake, true);
    window.removeEventListener('keydown', wake, true);
    if (enabled) setSoundEnabled(true);
  };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => enabled,
    () => false
  );
}

/** Called by the intro: start/stop the soundtrack in step with the visuals. */
export function introStarted() {
  introClock.playing = true;
  startIntro();
}
export function introEnded(skipped) {
  introClock.playing = false;
  if (skipped) stopIntro(0.35);
  else if (intro) {
    // let the closing bell ring out; the rest has already faded by its own envelopes
    const keep = intro;
    intro = null;
    setTimeout(() => keep.sources.forEach((s) => { try { s.stop(); } catch { /* done */ } }), 2500);
  }
}

function uiTone(freq, dur, vol) {
  if (!enabled || !running()) return;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  env(g.gain, [
    [t, 0],
    [t + 0.006, vol],
    [t + dur, 0],
  ]);
  g.connect(master);
  osc('sine', freq, g, { start: t, stop: t + dur + 0.02 });
}

export function uiClick() {
  uiTone(540, 0.09, 0.05);
}

export function uiHover() {
  const now = performance.now();
  if (now - lastHover < 90) return;
  lastHover = now;
  uiTone(1250, 0.05, 0.016);
}

/** A short rising whoosh for section-to-section travel (matches the ~0.95s warp). */
export function warpWhoosh() {
  if (!enabled || !running()) return;
  const t = ctx.currentTime;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.4;
  f.frequency.setValueAtTime(260, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + 0.48);
  f.frequency.exponentialRampToValueAtTime(500, t + 0.95);
  const g = ctx.createGain();
  env(g.gain, [
    [t, 0],
    [t + 0.42, 0.3],
    [t + 0.95, 0],
  ]);
  f.connect(g);
  g.connect(master);
  noise(f, { start: t, stop: t + 1 });
  // a low thump as the screen is fully covered
  const tg = ctx.createGain();
  env(tg.gain, [
    [t + 0.44, 0],
    [t + 0.46, 0.25],
    [t + 0.9, 0],
  ]);
  tg.connect(master);
  const o = osc('sine', 80, tg, { start: t + 0.44, stop: t + 0.95 });
  o.frequency.exponentialRampToValueAtTime(40, t + 0.9);
}
