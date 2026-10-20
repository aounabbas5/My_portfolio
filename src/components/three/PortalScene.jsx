import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { getCapabilities } from '../../hooks/useCapabilities';
import { THEME } from '../../theme';
import { introClock } from '../../lib/sound';

/**
 * Cinematic black-hole opening. One master timeline `t` (seconds) drives everything, and every
 * value is eased from it, so there are no hard cuts:
 *
 *   0.0 - 1.0  dark void; dust drifts in; a single point of energy ignites
 *   0.9 - 2.8  the energy collapses: a shockwave, then a black hole opens and the stars bend around it
 *   1.6 - 3.2  the accretion disk spins up (hot champagne inside, emerald outside)
 *   0.8 - 3.8  a boot command and "Welcome to Aoun's Portfolio" type themselves above it
 *   3.5 - 5.4  the dive: we fall toward the horizon, the disk stretches past us, light streaks inward
 *   5.0 - 6.0  total darkness fades up into the homepage
 */
const TIMELINE = { birth: 0.9, fly: 3.5, reveal: 5.0, end: 6.0 };

// The welcome wording, typed in a terminal voice.
const CMD = '$ ./welcome --user visitor';
const GREETING = "Welcome to Aoun's Portfolio";
const SUB = '// computer science · web · ai';

const { clamp, damp } = THREE.MathUtils;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const smooth = (x) => x * x * (3 - 2 * x);
const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const easeIn = (x) => x * x * x;

/** Types `text` into `el` as k goes 0 → 1 (touches the DOM only when the character count changes). */
function typeInto(el, text, k) {
  if (!el) return;
  const n = k <= 0 ? 0 : Math.min(text.length, Math.ceil(k * text.length));
  if (el.dataset.n !== String(n)) {
    el.dataset.n = String(n);
    el.textContent = text.slice(0, n);
  }
}

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const C = {
  emerald: new THREE.Color(THEME.emeraldGlow),
  bright: new THREE.Color('#3fd9a0'),
  gold: new THREE.Color(THEME.champagneGold),
};

/* ---------- shaders ---------- */

const NOISE = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
               mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
  }
`;

/**
 * The black hole itself, drawn analytically on a full-screen quad:
 *  - a procedural starfield whose sampling coordinates are bent toward the hole (gravitational lensing)
 *  - a thin accretion disk seen at a slant, brighter on the side moving toward us, with the far side of
 *    the disk lensed into a glowing ring over the top and under the bottom of the horizon
 *  - a photon ring right at the horizon, and a pure-black event horizon
 * `uZoom` is the dive: the whole picture scales up until the horizon swallows the screen.
 */
function BlackHole({ tl }) {
  const { size } = useThree();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uBirth: { value: 0 },
          uDisk: { value: 0 },
          uZoom: { value: 1 },
          uWave: { value: 0 },
          uSrc: { value: 0 },
          uFlash: { value: 0 },
          uMouse: { value: new THREE.Vector2() },
          cEm: { value: C.emerald },
          cGold: { value: C.gold },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
        fragmentShader: /* glsl */ `
          ${NOISE}
          uniform float uTime, uAspect, uBirth, uDisk, uZoom, uWave, uSrc, uFlash;
          uniform vec2 uMouse;
          uniform vec3 cEm, cGold;
          varying vec2 vUv;

          float stars(vec2 q){
            float acc = 0.;
            for (int i = 0; i < 3; i++){
              float sc = 20. * pow(2.1, float(i));
              vec2 g = q * sc + float(i) * 17.3;
              vec2 id = floor(g), f = fract(g) - .5;
              float h = hash(id);
              vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - .5) * .6;
              float d = length(f - o);
              float b = step(.93, h) * smoothstep(.1, 0., d) * (.35 + .65 * hash(id + 9.))
                      * (.65 + .35 * sin(uTime * (1. + h * 3.) + h * 40.));
              acc += b * (i == 0 ? 1.3 : .75);
            }
            return acc;
          }

          void main(){
            vec2 p = (vUv * 2. - 1.) * vec2(uAspect, 1.);
            p *= max(1., 1. / uAspect);          // keep the hole inside narrow portrait screens
            p -= uMouse * .035;                  // the whole scene leans a touch toward the pointer
            p /= uZoom;                          // the dive
            float r = length(p);
            float rs = .2 * smoothstep(0., 1., uBirth);   // event-horizon radius
            float lr = r / max(rs, .0001);
            float inside = rs > .001 ? smoothstep(rs, rs * .985, r) : 0.;

            // --- lensed starfield: sample positions are pulled toward the hole
            vec2 q = p * (1. + rs * rs * 1.9 / (r * r + .012));
            vec3 col = stars(q) * mix(vec3(.75, .95, .9), vec3(1., .93, .75), hash(floor(q * 40.))) * (1. - inside);

            // --- accretion disk (inclined), differential rotation, Doppler-brightened on the left
            float sini = .3;
            vec2 dp = vec2(p.x, p.y / sini);
            float dr = length(dp) / max(rs, .0001);
            float ang = atan(dp.y, dp.x) + uTime * 2.4 / (dr + .6);
            // noise is sampled around a circle (cos/sin), so there is no seam where atan() wraps
            vec2 cs = vec2(cos(ang), sin(ang));
            float flow = vnoise(cs * 2.6 + vec2(dr * 2.2, dr * 1.1)) * .65 + vnoise(cs * 6. + vec2(dr * 5.5 + 5., dr * 3.)) * .35;
            float band = smoothstep(1.75, 2.0, dr) * (1. - smoothstep(3.0, 5.3, dr));
            float heat = clamp((5.3 - dr) / 3.5, 0., 1.);
            float dop = .3 + 1.1 * smoothstep(1., -1., dp.x / max(length(dp), .0001));
            vec3 diskCol = mix(cEm, mix(cGold, vec3(1., .96, .85), pow(heat, 3.)), pow(heat, 1.1));
            float diskI = band * pow(1.9 / max(dr, 1.), 1.5) * (.3 + 1.5 * flow) * dop * uDisk * 2.4;
            // the far half of the disk hides behind the hole; the near half crosses in front of it
            float hidden = inside * step(0., p.y);
            col += diskCol * diskI * (1. - hidden);

            // --- the far side of the disk, bent over the top and under the bottom of the horizon
            float arc = exp(-pow((lr - 1.4) / .17, 2.)) * (.35 + .9 * abs(p.y) / max(r, .0001))
                      * (.6 + .5 * smoothstep(1., -1., p.x / max(r, .0001))) * uDisk * 1.5;
            col += mix(cGold, vec3(1., .95, .85), .5) * arc * (1. - inside);

            // --- photon ring and soft halo
            col += vec3(1., .96, .85) * exp(-pow((lr - 1.03) / .04, 2.)) * 1.7 * smoothstep(0., 1., uBirth);
            col += cEm * exp(-max(lr - 1., 0.) * .9) * .12 * uDisk * (1. - inside);

            // --- the birth: a point of energy, a flash and an outgoing shockwave
            col += vec3(1., .95, .8) * exp(-r * r * 500.) * uSrc * 1.8;
            col += cEm * exp(-r * r * 40.) * uSrc * .5;
            float rw = uWave * 1.7;
            col += mix(cGold, vec3(1.), .4) * exp(-pow((r - rw) / (.03 + .06 * uWave), 2.)) * (1. - uWave) * 1.6;
            col += vec3(1., .95, .82) * exp(-r * r * 7.) * uFlash;

            // gentle filmic roll-off so the brightest parts bloom instead of clipping
            col = 1. - exp(-col * 1.25);
            vec3 bg = mix(vec3(.006, .012, .01), vec3(.02, .05, .04), exp(-r * 1.2)) * (1. - inside);
            gl_FragColor = vec4(col + bg, 1.);
          }`,
      }),
    []
  );

  useFrame((fx) => {
    const t = tl.current.t;
    const u = mat.uniforms;
    u.uTime.value = t;
    u.uAspect.value = size.width / size.height;
    u.uMouse.value.lerp(fx.pointer, 0.06);
    u.uBirth.value = smoother(seg(t, TIMELINE.birth, TIMELINE.birth + 1.9));
    u.uDisk.value = smooth(seg(t, TIMELINE.birth + 0.7, TIMELINE.birth + 2.3));
    u.uWave.value = seg(t, TIMELINE.birth - 0.1, TIMELINE.birth + 1.5);
    u.uFlash.value = Math.exp(-(((t - (TIMELINE.birth + 0.1)) / 0.22) ** 2)) * 0.75;
    u.uSrc.value = smooth(seg(t, 0.15, 0.9)) * (1 - smooth(seg(t, TIMELINE.birth, TIMELINE.birth + 0.7)));
    u.uZoom.value = Math.exp(smoother(seg(t, TIMELINE.fly, TIMELINE.fly + 1.9)) * 3.1);
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

const dustMaterial = (mobile) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uPx: { value: mobile ? 1.4 : 2 },
      cA: { value: C.emerald },
      cB: { value: C.gold },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime; uniform float uPx;
      varying float vSeed;
      void main(){
        vSeed = aSeed;
        vec3 p = position;
        p.y += sin(uTime * (0.2 + aSeed * 0.5) + aSeed * 40.) * 0.25;
        p.x += cos(uTime * (0.15 + aSeed * 0.4) + aSeed * 20.) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uPx * (0.5 + aSeed * 1.3) * 18. / -mv.z, 1., 14.);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uAlpha; uniform vec3 cA; uniform vec3 cB; uniform float uTime;
      varying float vSeed;
      void main(){
        float d = length(gl_PointCoord - .5);
        float a = smoothstep(.5, 0., d);
        float tw = .65 + .35 * sin(uTime * (1. + vSeed * 3.) + vSeed * 60.);
        gl_FragColor = vec4(mix(cA, cB, step(.72, vSeed)) * 1.6, a * a * uAlpha * tw);
      }`,
  });

/** Drifting dust in a deep volume. */
function Dust({ tl, count, mobile }) {
  const mat = useMemo(() => dustMaterial(mobile), [mobile]);
  const geo = useMemo(() => {
    const r = rng(5);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * 30;
      pos[i * 3 + 1] = (r() - 0.5) * 18;
      pos[i * 3 + 2] = -30 + r() * 42;
      seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  useFrame(() => {
    const t = tl.current.t;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uAlpha.value = smooth(seg(t, 0.1, 1.4)) * (1 - 0.5 * seg(t, TIMELINE.fly, TIMELINE.reveal));
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/** Light streaks that only exist while the camera dives toward the horizon. */
function Streaks({ tl, count }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uLen: { value: 0 }, uAlpha: { value: 0 }, cA: { value: C.bright }, cB: { value: C.gold } },
        vertexShader: /* glsl */ `
          attribute float aEnd; attribute float aSeed;
          uniform float uLen;
          varying float vFade; varying float vSeed;
          void main(){
            vec3 p = position;
            p.z += aEnd * uLen * (0.4 + aSeed);
            vFade = 1. - aEnd;
            vSeed = aSeed;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uAlpha; uniform vec3 cA; uniform vec3 cB;
          varying float vFade; varying float vSeed;
          void main(){
            gl_FragColor = vec4(mix(cA, cB, step(.7, vSeed)), vFade * uAlpha);
          }`,
      }),
    []
  );

  const geo = useMemo(() => {
    const r = rng(11);
    const pos = new Float32Array(count * 6);
    const end = new Float32Array(count * 2);
    const seed = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const rad = 0.9 + Math.pow(r(), 0.7) * 7;
      const z = -14 + r() * 22;
      for (let k = 0; k < 2; k++) {
        pos.set([Math.cos(a) * rad, Math.sin(a) * rad, z], (i * 2 + k) * 3);
        end[i * 2 + k] = k;
        seed[i * 2 + k] = (i % 13) / 13;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  useFrame(() => {
    const t = tl.current.t;
    mat.uniforms.uLen.value = easeIn(seg(t, TIMELINE.fly - 0.2, TIMELINE.reveal)) * 9;
    mat.uniforms.uAlpha.value =
      smooth(seg(t, TIMELINE.fly - 0.2, TIMELINE.fly + 0.8)) * 0.8 * (1 - seg(t, TIMELINE.reveal, TIMELINE.end));
  });

  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}

/** Runs the master clock, dollies the camera (for dust and streaks) and reports progress to the DOM. */
function Rig({ tl, onPhase, onReveal, onDone, hud }) {
  const { camera, pointer } = useThree();
  const fired = useRef({ reveal: false, done: false, phase: -1 });

  useFrame((_, dt) => {
    const s = tl.current;
    // The first frames include shader compilation; don't let that hitch eat the opening.
    s.frames = (s.frames ?? 0) + 1;
    if (!s.frozen && s.frames > 3) {
      // wall-clock pacing: a slow GPU drops frames, it doesn't stretch the intro
      s.t += Math.min(dt, 0.1) * (s.skip ? 4 : 1);
      if (s.skip && s.t < TIMELINE.fly + 0.15) s.t = Math.min(TIMELINE.fly + 0.15, s.t + dt * 4);
    }
    const t = s.t;
    introClock.t = t;

    // camera: a slow push in, then the dive
    const drift = 1 - seg(t, TIMELINE.birth, TIMELINE.fly);
    const dive = seg(t, TIMELINE.fly, TIMELINE.end - 0.45) ** 2;
    const push = smooth(seg(t, 0.2, TIMELINE.fly));
    camera.position.x = damp(camera.position.x, pointer.x * 0.35 * drift, 3, dt);
    camera.position.y = damp(camera.position.y, pointer.y * 0.25 * drift, 3, dt);
    camera.position.z = (9.5 - push * 2.4) * (1 - dive) - 1.2 * dive;
    camera.lookAt(0, 0, 0);
    const fov = 50 + dive * 36;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const h = hud.current;
    if (h) {
      h.bar.style.transform = `scaleX(${clamp(t / TIMELINE.end, 0, 1)})`;
      h.root.style.opacity = String(1 - smooth(seg(t, TIMELINE.reveal, TIMELINE.end)));
      h.stage.style.opacity = String(1 - seg(t, TIMELINE.fly - 0.2, TIMELINE.fly + 0.5));

      // welcome wording: boot command → greeting → tagline, gone before the dive
      typeInto(h.cmd, CMD, seg(t, 0.8, 1.9));
      typeInto(h.title, GREETING, seg(t, 2.0, 3.1));
      typeInto(h.sub, SUB, seg(t, 3.0, 3.7));
      h.words.style.opacity = String(1 - smooth(seg(t, TIMELINE.fly - 0.15, TIMELINE.fly + 0.45)));
      h.words.style.transform = `translateY(${-seg(t, TIMELINE.fly, TIMELINE.fly + 0.8) * 14}px)`;
    }

    const phase = t < 0.6 ? 0 : t < TIMELINE.birth + 0.5 ? 1 : t < TIMELINE.birth + 1.9 ? 2 : t < TIMELINE.fly ? 3 : 4;
    if (phase !== fired.current.phase) {
      fired.current.phase = phase;
      onPhase(phase);
    }
    if (!fired.current.reveal && t >= TIMELINE.reveal) {
      fired.current.reveal = true;
      onReveal();
    }
    if (!fired.current.done && t >= TIMELINE.end) {
      fired.current.done = true;
      onDone();
    }
  }, -1);

  return null;
}

export default function PortalScene({ onPhase, onReveal, onDone, hud, skipRef }) {
  const { mobile } = getCapabilities();
  // Dev-only: ?portalT=3.2 freezes the timeline at that moment for art-direction checks.
  const frozen = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('portalT')) : 0;
  const tl = useRef({ t: frozen || 0, skip: false, frozen: Boolean(frozen) });

  useEffect(() => {
    skipRef.current = () => {
      tl.current.skip = true;
    };
    return () => {
      skipRef.current = null;
    };
  }, [skipRef]);

  return (
    <Canvas
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, mobile ? 1.25 : 1.6]}
      camera={{ position: [0, 0, 9.5], fov: 50, near: 0.1, far: 80 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
    >
      <Rig tl={tl} onPhase={onPhase} onReveal={onReveal} onDone={onDone} hud={hud} />
      <BlackHole tl={tl} />
      <Dust tl={tl} count={mobile ? 380 : 900} mobile={mobile} />
      <Streaks tl={tl} count={mobile ? 110 : 260} />
    </Canvas>
  );
}
