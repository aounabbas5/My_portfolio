/**
 * The site's audio: one controller, synthesised live with the Web Audio API.
 *
 * There are no audio files. Everything is generated, so there is nothing to download, nothing that
 * can 404 and nothing with a licence to worry about. If audio is unavailable or blocked the site is
 * unaffected: every call below quietly does nothing.
 *
 * Mix structure
 *
 *   music ─► musicBus ─┐
 *                      ├─► master ─► tone shaping ─► compressor ─► speakers
 *   sfx   ─► fxBus ────┘      ▲
 *   shared hall reverb + ping-pong echo (each bus feeds them at its own volume)
 *
 * Volumes (0-1, saved in the browser): master, music, effects. Music is deliberately the quietest
 * layer and sits under every interface sound. Tweak the defaults in DEFAULT_VOLUMES, or at runtime
 * (dev console): `aounSound.setMusicVolume(0.15)`.
 *
 * Sound palette (playSound names): intro-accent, headline-accent, page-transition, page-arrive,
 * section-reveal, button-click, hover-accent (off by default), success, modal-open. The ambient
 * score is the "ambient-loop": a generative loop of slow pads, a sub and sparse bells that never
 * repeats exactly, so there is no loop point to notice.
 *
 * Sound is always on; there is no switch. Browsers only allow audio after a user gesture, so it
 * starts on the visitor's first tap, click or key press (initSound) and then plays for the rest of
 * the visit. Until then the page is silent, and if audio is blocked or unsupported it stays that way.
 */
const VOL_KEY = 'aoun:sound:vol';

export const SOUND_CONFIG = {
  hover: false, // hover-accent: a quiet note on hover. Off by default; the interface stays calm.
};

const DEFAULT_VOLUMES = { master: 1, music: 0.1, effects: 0.22 };
// Normalises the synthesised levels so the percentages above mean what they say.
const TRIM = { music: 0.36, fx: 0.6 };
const CHORD_SECONDS = 10;

// Shared with PortalScene so the soundtrack can line up with the visual timeline.
export const introClock = { t: 0, playing: false, sounded: false, skipped: false };
const INTRO = { birth: 0.9, title: 2.0, fly: 3.5, reveal: 5.0, end: 6.0 };

let ctx = null;
let master = null;
let buses = null; // { music: {dry, verb, echo}, fx: {dry, verb, echo} }
let noiseBuf = null;
let intro = null; // { bus, sources }
let ambient = null; // { fade, duck, voices, timer, next }
let chordIdx = 0;
const lastPlayed = new Map();
const playedOnce = new Set();

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode */
  }
};

const enabled = true;
const volume = { ...DEFAULT_VOLUMES };
try {
  Object.assign(volume, JSON.parse(read(VOL_KEY) || '{}'));
} catch {
  /* keep defaults */
}
const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
const running = () => ctx && ctx.state === 'running';

/* ---------- engine ---------- */

/** Build the shared mix: buses, hall reverb, ping-pong echo, tone shaping and a limiter. */
function ensure() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }

  // output stage: master -> tone shaping -> compressor -> speakers
  master = ctx.createGain();
  master.gain.value = 0;
  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 120;
  low.gain.value = 2;
  const warm = ctx.createBiquadFilter(); // tame fizz
  warm.type = 'highshelf';
  warm.frequency.value = 6500;
  warm.gain.value = -3;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 18;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.01;
  comp.release.value = 0.3;
  master.connect(low);
  low.connect(warm);
  warm.connect(comp);
  comp.connect(ctx.destination);

  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;

  // hall reverb from a generated impulse response: decaying noise that darkens as it fades
  const irLen = Math.floor(ctx.sampleRate * 3.4);
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < irLen; i++) {
      const k = i / irLen;
      lp += (Math.random() * 2 - 1 - lp) * (1 - (0.12 + 0.86 * k));
      d[i] = lp * (1 - k) ** 2.6 * 1.9;
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = ir;
  const reverbIn = ctx.createGain();
  const reverbHP = ctx.createBiquadFilter(); // keep rumble out of the tail
  reverbHP.type = 'highpass';
  reverbHP.frequency.value = 180;
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.85;
  reverbIn.connect(reverbHP);
  reverbHP.connect(conv);
  conv.connect(reverbOut);
  reverbOut.connect(master);

  // ping-pong echo: left and right delays feed each other, getting darker each pass
  const echoIn = ctx.createGain();
  const dL = ctx.createDelay(2);
  const dR = ctx.createDelay(2);
  dL.delayTime.value = 0.42;
  dR.delayTime.value = 0.63;
  const lpL = ctx.createBiquadFilter();
  const lpR = ctx.createBiquadFilter();
  lpL.type = lpR.type = 'lowpass';
  lpL.frequency.value = lpR.frequency.value = 2800;
  const fbL = ctx.createGain();
  const fbR = ctx.createGain();
  fbL.gain.value = fbR.gain.value = 0.42;
  const panL = ctx.createStereoPanner();
  const panR = ctx.createStereoPanner();
  panL.pan.value = -0.7;
  panR.pan.value = 0.7;
  const echoOut = ctx.createGain();
  echoOut.gain.value = 0.55;
  echoIn.connect(dL);
  dL.connect(lpL);
  lpL.connect(fbL);
  fbL.connect(dR);
  dR.connect(lpR);
  lpR.connect(fbR);
  fbR.connect(dL);
  dL.connect(panL);
  dR.connect(panR);
  panL.connect(echoOut);
  panR.connect(echoOut);
  echoOut.connect(master);
  echoOut.connect(reverbIn);

  // two buses (music, effects). Each also scales its own share of the reverb and echo, so a
  // quiet bus is quiet everywhere, tails included.
  const bus = () => {
    const dry = ctx.createGain();
    const verb = ctx.createGain();
    const echo = ctx.createGain();
    dry.connect(master);
    verb.connect(reverbIn);
    echo.connect(echoIn);
    return { dry, verb, echo };
  };
  buses = { music: bus(), fx: bus() };
  applyVolumes(true);

  // pause the audio clock while the tab is hidden, pick it back up on return
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });
  return ctx;
}

function applyVolumes(immediate = false) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const set = (param, v) => (immediate ? (param.value = v) : param.setTargetAtTime(v, t, 0.06));
  set(master.gain, enabled ? volume.master : 0);
  const m = volume.music * TRIM.music;
  const f = volume.effects * TRIM.fx;
  Object.values(buses.music).forEach((n) => set(n.gain, m));
  Object.values(buses.fx).forEach((n) => set(n.gain, f));
}

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

function tap(from, to, amount) {
  if (amount === 1) {
    from.connect(to);
    return;
  }
  const g = ctx.createGain();
  g.gain.value = amount;
  from.connect(g);
  g.connect(to);
}

/** Send a node to a bus, with optional amounts into the reverb and echo. */
function route(node, { dry = 1, verb = 0, echo = 0, pan = 0, bus = 'fx' } = {}) {
  let out = node;
  if (pan) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    out = p;
  }
  const b = buses[bus];
  if (dry) tap(out, b.dry, dry);
  if (verb) tap(out, b.verb, verb);
  if (echo) tap(out, b.echo, echo);
}

/** A bell-like note: a fundamental with inharmonic partials that die away faster than it does. */
function bell(freq, t0, { vol = 0.1, decay = 1.2, verb = 0.7, echo = 0, pan = 0, dest } = {}) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
  g.gain.setTargetAtTime(0, t0 + 0.01, decay / 3);
  const srcs = [osc('sine', freq, g, { start: t0, stop: t0 + decay * 3 + 0.2 })];
  [
    [2.76, 0.28, 8],
    [5.4, 0.12, 14],
  ].forEach(([ratio, amp, div]) => {
    const pg = ctx.createGain();
    pg.gain.setValueAtTime(0, t0);
    pg.gain.linearRampToValueAtTime(amp, t0 + 0.004);
    pg.gain.setTargetAtTime(0, t0 + 0.006, decay / div);
    pg.connect(g);
    srcs.push(osc('sine', freq * ratio, pg, { start: t0, stop: t0 + decay * 1.5 }));
  });
  if (dest) g.connect(dest);
  else route(g, { verb, echo, pan });
  return srcs;
}

/** Filtered noise that sweeps between two frequencies: the "air" in the transitions. */
function air(t0, { from, to, dur, peak, pan0 = -0.4, pan1 = 0.4, verb = 0.5, q = 1.2 }) {
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  env(g.gain, [
    [t0, 0],
    [t0 + dur * 0.45, peak],
    [t0 + dur, 0],
  ]);
  const p = ctx.createStereoPanner();
  p.pan.setValueAtTime(pan0, t0);
  p.pan.linearRampToValueAtTime(pan1, t0 + dur);
  f.connect(g);
  g.connect(p);
  route(p, { verb });
  return noise(f, { start: t0, stop: t0 + dur + 0.05 });
}

/* ---------- the sound palette ---------- */

// Each entry: cooldown (ms, protects against double triggers) and play(t, { dest }), which
// schedules the sound at audio time t and returns its sources so the intro can cut them on skip.
const SFX = {
  // brand reveal: a soft four-note shimmer
  'intro-accent': {
    cooldown: 3000,
    play: (t, o) =>
      [880, 1318.5, 1568, 1975.5].flatMap((f, i) =>
        bell(f, t + i * 0.14, { vol: 0.2 * (o?.boost ?? 1), decay: 2.2, verb: 1, echo: 0.4, pan: (i - 1.5) * 0.3, dest: o?.dest })
      ),
  },
  // the headline has finished arriving: one quiet, settled tone
  'headline-accent': {
    cooldown: 3000,
    play: (t) => [
      ...bell(659.25, t, { vol: 0.24, decay: 1.9, verb: 0.9, echo: 0.2 }),
      ...bell(987.77, t + 0.09, { vol: 0.16, decay: 1.9, verb: 0.9, echo: 0.2 }),
    ],
  },
  // leaving a section: a short, soft rising breath
  'page-transition': {
    cooldown: 900,
    play: (t) => [air(t, { from: 300, to: 1900, dur: 0.42, peak: 0.9, verb: 0.5 })],
  },
  // arriving: a gentle tonal accent as the new section appears, with a falling breath
  'page-arrive': {
    cooldown: 900,
    play: (t) => [
      ...bell(523.25, t, { vol: 0.2, decay: 1.5, verb: 0.9, echo: 0.15 }),
      ...bell(783.99, t + 0.07, { vol: 0.14, decay: 1.5, verb: 0.9 }),
      air(t, { from: 2600, to: 700, dur: 0.5, peak: 0.07, pan0: 0.3, pan1: -0.3, verb: 0.7 }),
    ],
  },
  // a major section with its own cinematic reveal (used once)
  'section-reveal': {
    cooldown: 5000,
    play: (t) =>
      [880, 1318.5, 1760].flatMap((f, i) => bell(f, t + i * 0.13, { vol: 0.16, decay: 1.8, verb: 1, echo: 0.25 })),
  },
  // a soft tap: a quick falling tone and a breath of noise (~70 ms)
  'button-click': {
    cooldown: 80,
    play: (t) => {
      const g = ctx.createGain();
      env(g.gain, [
        [t, 0],
        [t + 0.003, 0.5],
        [t + 0.07, 0],
      ]);
      route(g, { verb: 0.2 });
      const o = osc('sine', 1250, g, { start: t, stop: t + 0.09 });
      o.frequency.exponentialRampToValueAtTime(760, t + 0.06);
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 3200;
      const ng = ctx.createGain();
      env(ng.gain, [
        [t, 0.1],
        [t + 0.02, 0],
      ]);
      nf.connect(ng);
      route(ng, { verb: 0 });
      return [o, noise(nf, { start: t, stop: t + 0.03 })];
    },
  },
  // optional, disabled by default (SOUND_CONFIG.hover)
  'hover-accent': {
    cooldown: 120,
    play: (t) => {
      const notes = [1318.5, 1568, 1760, 2093];
      return bell(notes[Math.floor(Math.random() * notes.length)], t, { vol: 0.07, decay: 0.28, verb: 0.6 });
    },
  },
  // an action went through: two rising notes
  success: {
    cooldown: 600,
    play: (t) => [
      ...bell(987.77, t, { vol: 0.26, decay: 0.9, verb: 0.7, echo: 0.15 }),
      ...bell(1318.5, t + 0.11, { vol: 0.24, decay: 1.1, verb: 0.8, echo: 0.2 }),
    ],
  },
  // a panel opens: a short lift of air and a soft tone
  'modal-open': {
    cooldown: 400,
    play: (t) => [
      air(t, { from: 500, to: 2200, dur: 0.3, peak: 0.12, verb: 0.5 }),
      ...bell(659.25, t + 0.06, { vol: 0.2, decay: 0.7, verb: 0.8 }),
    ],
  },
};

/** Play one sound from the palette. Quiet no-op while sound is off, blocked or throttled. */
export function playSound(name, { key } = {}) {
  const def = SFX[name];
  if (!def || !enabled || !running()) return;
  if (name === 'hover-accent' && !SOUND_CONFIG.hover) return;
  if (key) {
    if (playedOnce.has(key)) return;
    playedOnce.add(key);
  }
  const now = performance.now();
  if (now - (lastPlayed.get(name) ?? -1e9) < def.cooldown) return;
  lastPlayed.set(name, now);
  try {
    def.play(ctx.currentTime + 0.01, {});
  } catch {
    /* audio must never break the page */
  }
}

/* ---------- ambient score (the ambient-loop) ---------- */

// Am9 - Fmaj9 - Cmaj9 - G6/9: warm, open, and it loops without ever feeling like it ends.
const CHORDS = [
  { bass: 33, pad: [57, 60, 64, 67, 71] },
  { bass: 29, pad: [53, 57, 60, 64, 67] },
  { bass: 36, pad: [60, 64, 67, 71, 74] },
  { bass: 31, pad: [55, 59, 62, 64, 69] },
];

function scheduleChord(t0) {
  const a = ambient;
  const ch = CHORDS[chordIdx % CHORDS.length];
  chordIdx++;
  const dur = CHORD_SECONDS;
  const end = t0 + dur + 4;
  const reg = (src) => {
    a.voices.add(src);
    src.onended = () => a.voices.delete(src);
    return src;
  };

  // pad: each chord tone is a triangle + a slightly detuned saw, swelling in over 3.5s
  ch.pad.forEach((n, i) => {
    const f = midi(n);
    const g = ctx.createGain();
    const peak = 0.034;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 3.5);
    g.gain.linearRampToValueAtTime(peak * 0.8, t0 + dur);
    g.gain.linearRampToValueAtTime(0, end);
    const p = ctx.createStereoPanner();
    p.pan.value = ((i / (ch.pad.length - 1)) * 2 - 1) * 0.6;
    g.connect(p);
    p.connect(a.padFilter);
    reg(osc('triangle', f, g, { start: t0, stop: end }));
    reg(osc('sawtooth', f, g, { start: t0, stop: end, detune: i % 2 ? 7 : -7 }));
  });

  // sub: the chord's root, felt more than heard
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0, t0);
  bg.gain.linearRampToValueAtTime(0.2, t0 + 2.2);
  bg.gain.linearRampToValueAtTime(0.16, t0 + dur);
  bg.gain.linearRampToValueAtTime(0, end - 1);
  bg.connect(a.fade);
  reg(osc('sine', midi(ch.bass), bg, { start: t0, stop: end }));
  reg(osc('triangle', midi(ch.bass + 12), bg, { start: t0, stop: end, detune: 4 }));

  // bells: a sparse, never-quite-regular melody drawn from the chord tones
  const tones = ch.pad.map((n) => n + 12);
  let t = t0 + 1.4 + Math.random() * 1.4;
  let prev = -1;
  while (t < t0 + dur - 1) {
    let k;
    do k = Math.floor(Math.random() * tones.length);
    while (k === prev && tones.length > 1);
    prev = k;
    const oct = Math.random() < 0.25 ? 12 : 0;
    bell(midi(tones[k] + oct), t, {
      vol: 0.05 + Math.random() * 0.02,
      decay: 2.6,
      dest: a.bellBus,
    }).forEach(reg);
    t += 2 + Math.random() * 3;
  }
}

/** Fade the ambient score in (a no-op if it is already playing, sound is off or the intro is running). */
export function fadeMusicIn({ early = false } = {}) {
  if (!enabled || !running() || (introClock.playing && !early) || ambient) return;
  const t = ctx.currentTime;
  const fade = ctx.createGain(); // fade in/out
  fade.gain.value = 0;
  const duck = ctx.createGain(); // dips under transitions
  duck.gain.value = 1;
  fade.connect(duck);
  route(duck, { bus: 'music', verb: 0.5 });

  // the pads share one low-pass whose cutoff drifts slowly, so the texture keeps breathing
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 1100;
  padFilter.Q.value = 0.7;
  padFilter.connect(fade);
  const drift = ctx.createOscillator();
  drift.frequency.value = 0.045;
  const driftDepth = ctx.createGain();
  driftDepth.gain.value = 480;
  drift.connect(driftDepth);
  driftDepth.connect(padFilter.frequency);
  drift.start(t);

  // bells get their own bus so they can drift across the stereo field and feed the echo
  const bellBus = ctx.createGain();
  const bellPan = ctx.createStereoPanner();
  const pl = ctx.createOscillator();
  pl.frequency.value = 0.07;
  const plDepth = ctx.createGain();
  plDepth.gain.value = 0.5;
  pl.connect(plDepth);
  plDepth.connect(bellPan.pan);
  pl.start(t);
  bellBus.connect(bellPan);
  bellPan.connect(fade);
  tap(bellPan, buses.music.echo, 0.6);

  ambient = { fade, duck, bellBus, drift, pl, voices: new Set(), timer: 0, next: t + 0.15, padFilter };
  fade.gain.setTargetAtTime(1, t, 1.8);

  const tick = () => {
    if (!ambient || !running()) return;
    while (ambient.next < ctx.currentTime + 2) {
      scheduleChord(ambient.next);
      ambient.next += CHORD_SECONDS - 1.5; // chords overlap so there is never a gap
    }
  };
  tick();
  ambient.timer = setInterval(tick, 500);
}

export function fadeMusicOut(fade = 0.8) {
  if (!ambient || !ctx) return;
  const a = ambient;
  ambient = null;
  clearInterval(a.timer);
  a.fade.gain.cancelScheduledValues(ctx.currentTime);
  a.fade.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
  setTimeout(() => {
    a.voices.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    [a.drift, a.pl].forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    a.duck.disconnect();
  }, fade * 1000 + 150);
}

/** Pull the music down briefly so a sound effect sits on top of it. */
export function duckMusic(depth = 0.55, seconds = 0.9) {
  if (!ambient) return;
  const t = ctx.currentTime;
  ambient.duck.gain.cancelScheduledValues(t);
  ambient.duck.gain.setTargetAtTime(depth, t, 0.12);
  ambient.duck.gain.setTargetAtTime(1, t + seconds, 0.7);
}

/* ---------- intro soundtrack ---------- */

// Scheduled against the intro's own clock, so it lines up with what is on screen:
//   0.0  a faint tone opens          2.0  the welcome wording: shimmer
//   0.9  the hole opens: soft sub    5.0  the crossing: airy swell and a chord
function startIntro() {
  if (!running() || !introClock.playing || intro) return;
  const from = introClock.t;
  const now = ctx.currentTime + 0.05;
  // map a timeline moment to audio time (moments already past are skipped)
  const at = (te) => now + Math.max(0, te - from);
  const live = (te) => te >= from - 0.05;
  const sources = [];
  const bus = ctx.createGain();
  bus.gain.value = 0.28; // the whole opening sits well under a normal effect; its accents are lifted back (boost)
  route(bus, { verb: 0.4 });
  const track = (n) => (sources.push(n), n);
  const end = at(INTRO.end + 0.6);
  introClock.sounded = true;

  // stage 1: a low atmospheric tone that opens up with the black hole
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.Q.value = 4;
  env(droneFilter.frequency, [
    [now, 90],
    [at(INTRO.birth), 150],
    [at(INTRO.birth + 2), 420],
    [at(INTRO.fly), 600],
    [at(INTRO.fly + 1.8), 1500],
    [at(INTRO.end), 300],
  ]);
  env(droneGain.gain, [
    [now, 0],
    [at(1.2), 0.17],
    [at(INTRO.fly), 0.23],
    [at(INTRO.fly + 1.6), 0.3],
    [at(INTRO.end), 0],
  ]);
  droneFilter.connect(droneGain);
  droneGain.connect(bus);
  track(osc('sawtooth', 55, droneFilter, { start: now, stop: end, detune: -6 }));
  track(osc('sawtooth', 55, droneFilter, { start: now, stop: end, detune: 8 }));
  track(osc('sine', 55, droneGain, { start: now, stop: end }));

  // an open Am9 pad that fades in with the disk (slow tremolo for movement)
  const padGain = ctx.createGain();
  env(padGain.gain, [
    [now, 0],
    [at(INTRO.birth + 0.6), 0],
    [at(INTRO.birth + 2.4), 0.05],
    [at(INTRO.fly + 0.6), 0.08],
    [at(INTRO.end), 0],
  ]);
  const trem = ctx.createGain();
  trem.gain.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.35;
  lfo.start(now);
  lfo.stop(end);
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.3;
  lfo.connect(lfoDepth);
  lfoDepth.connect(trem.gain);
  padGain.connect(trem);
  trem.connect(bus);
  [220, 329.63, 440, 659.25, 987.77].forEach((f, i) =>
    track(osc('sine', f, padGain, { start: now, stop: end, detune: (i - 2) * 4 }))
  );
  track(lfo);

  // the hole opens: a soft sub swell, not an impact
  if (live(INTRO.birth)) {
    const t0 = at(INTRO.birth + 0.05);
    const bg = ctx.createGain();
    env(bg.gain, [
      [t0, 0],
      [t0 + 0.5, 0.42],
      [t0 + 2.2, 0],
    ]);
    bg.connect(bus);
    const b = osc('sine', 62, bg, { start: t0, stop: t0 + 2.3 });
    b.frequency.exponentialRampToValueAtTime(38, t0 + 2);
    track(b);
  }

  // stage 2: the brand reveal: a delicate shimmer as the welcome wording appears
  if (live(INTRO.title)) SFX['intro-accent'].play(at(INTRO.title), { dest: bus, boost: 3.2 }).forEach(track);

  // the dive: a quiet breath of wind, rising in pitch
  if (live(INTRO.fly)) {
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.Q.value = 1.1;
    wf.frequency.setValueAtTime(200, at(INTRO.fly - 0.1));
    wf.frequency.exponentialRampToValueAtTime(3200, at(INTRO.fly + 1.9));
    const wg = ctx.createGain();
    env(wg.gain, [
      [at(INTRO.fly - 0.1), 0],
      [at(INTRO.fly + 1.5), 0.2],
      [at(INTRO.reveal + 0.2), 0],
    ]);
    wf.connect(wg);
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(-0.5, at(INTRO.fly - 0.1));
    pan.pan.linearRampToValueAtTime(0.5, at(INTRO.fly + 1.8));
    wg.connect(pan);
    pan.connect(bus);
    track(noise(wf, { start: at(INTRO.fly - 0.1), stop: at(INTRO.reveal + 0.3) }));
  }

  // stage 3: the visual reveal: an airy chord as the homepage fades up
  if (live(INTRO.reveal)) {
    [57, 64, 71, 76].forEach((n, i) => {
      const t0 = at(INTRO.reveal + 0.1) + i * 0.1;
      bell(midi(n + 12), t0, { vol: 0.3, decay: 3, pan: (i - 1.5) * 0.3, dest: bus }).forEach(track);
    });
  }

  // stage 5: the score starts swelling just before the crossing, so the opening flows into it with no gap
  const lead = (INTRO.reveal - 1 - from) * 1000;
  const timer = setTimeout(() => intro && fadeMusicIn({ early: true }), Math.max(0, lead));

  intro = { bus, sources, timer };
}

function stopIntro(fade = 0.25) {
  if (!intro || !ctx) return;
  const { bus, sources, timer } = intro;
  intro = null;
  clearTimeout(timer);
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

/** Called by the intro: start/stop the soundtrack in step with the visuals. */
export function introStarted() {
  introClock.playing = true;
  introClock.skipped = false;
  startIntro();
}

export function introEnded(skipped) {
  introClock.playing = false;
  if (skipped) {
    introClock.skipped = true;
    stopIntro(0.35);
  } else if (intro) {
    // let the closing chord ring out; the rest has already faded by its own envelopes
    const keep = intro;
    intro = null;
    clearTimeout(keep.timer);
    setTimeout(() => keep.sources.forEach((s) => { try { s.stop(); } catch { /* done */ } }), 4500);
  }
  fadeMusicIn(); // the score under the whole site begins as the homepage arrives
}

/* ---------- public controller ---------- */

/**
 * Start the audio on the first gesture. Each gesture tries to resume the (lazily created) context;
 * once it is running the intro soundtrack (from wherever the intro has got to) and the ambient
 * score begin, and the listeners go away. Never retries without a fresh gesture.
 */
let armed = false;
export function initSound() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const events = ['pointerdown', 'keydown', 'touchend'];
  const off = () => events.forEach((e) => window.removeEventListener(e, wake, true));
  function wake() {
    if (!ensure()) {
      off();
      return;
    }
    ctx
      .resume()
      .then(() => {
        if (!running()) return; // still blocked: wait for the next gesture
        off();
        applyVolumes();
        startIntro();
        fadeMusicIn();
      })
      .catch(() => {});
  }
  events.forEach((e) => window.addEventListener(e, wake, true));
}

const setVol = (key, v) => {
  volume[key] = clamp01(v);
  write(VOL_KEY, JSON.stringify(volume));
  applyVolumes();
};
export const setMasterVolume = (v) => setVol('master', v);
export const setMusicVolume = (v) => setVol('music', v);
export const setEffectsVolume = (v) => setVol('effects', v);
export const getVolumes = () => ({ ...volume });

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.aounSound = { setMasterVolume, setMusicVolume, setEffectsVolume, getVolumes, playSound, SOUND_CONFIG };
}
