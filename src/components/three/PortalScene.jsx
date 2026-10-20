import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { getCapabilities } from '../../hooks/useCapabilities';
import { THEME } from '../../theme';

/**
 * Cinematic portal opening. One master timeline `t` (seconds) drives everything:
 *
 *   0.0 - 1.2  dark void, dust drifts in
 *   1.0 - 2.6  energy core ignites, rings of light converge on it
 *   2.2 - 3.8  geometric shards bind to the core, the portal forms and opens
 *   3.6 - 5.5  the camera dives through a digital tunnel
 *   5.0 - 6.0  the tunnel dissolves into the homepage
 */
const TIMELINE = { core: 1.0, rings: 1.4, portal: 2.3, fly: 3.6, reveal: 5.0, end: 6.0 };

const { clamp, damp } = THREE.MathUtils;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const smooth = (x) => x * x * (3 - 2 * x);
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeIn = (x) => x * x * x;

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
  soft: new THREE.Color(THEME.softChampagne),
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
    mat.uniforms.uAlpha.value = smooth(seg(t, 0.1, 1.4)) * (1 - 0.4 * seg(t, TIMELINE.fly, TIMELINE.reveal));
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/** Light streaks that only exist while the camera dives through the portal. */
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
    const k = seg(tl.current.t, TIMELINE.fly - 0.2, TIMELINE.reveal);
    mat.uniforms.uLen.value = easeIn(k) * 9;
    mat.uniforms.uAlpha.value = smooth(seg(tl.current.t, TIMELINE.fly - 0.2, TIMELINE.fly + 0.6)) * (1 - seg(tl.current.t, TIMELINE.reveal, TIMELINE.end));
  });

  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}

/** Soft glow behind the energy source plus angular light shafts (fake volumetrics). */
function Glow({ tl }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uCore: { value: 0 }, uShafts: { value: 0 }, cA: { value: C.bright }, cB: { value: C.gold } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */ `
          ${NOISE}
          uniform float uTime; uniform float uCore; uniform float uShafts; uniform vec3 cA; uniform vec3 cB;
          varying vec2 vUv;
          void main(){
            vec2 p = vUv * 2. - 1.;
            float r = length(p);
            float a = atan(p.y, p.x);
            float core = exp(-r * 7.) * 1.4 + exp(-r * 2.2) * .35;
            float shafts = pow(vnoise(vec2(a * 5. + uTime * .25, uTime * .15)), 2.2) * 1.5
                         * exp(-r * 2.6) * smoothstep(.04, .35, r);
            vec3 col = mix(cA, cB, exp(-r * 6.)) * (core * uCore + shafts * uShafts);
            gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0., 1.) * smoothstep(1., .55, r));
          }`,
      }),
    []
  );

  useFrame(() => {
    const t = tl.current.t;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uCore.value = smooth(seg(t, TIMELINE.core, TIMELINE.core + 1.2)) * (1 - 0.35 * seg(t, TIMELINE.portal, TIMELINE.fly));
    mat.uniforms.uShafts.value = smooth(seg(t, TIMELINE.portal - 0.3, TIMELINE.portal + 1.2)) * (1 - seg(t, TIMELINE.fly + 0.4, TIMELINE.reveal));
  });

  return (
    <mesh position={[0, 0, -0.15]} renderOrder={1} material={mat}>
      <planeGeometry args={[15, 15]} />
    </mesh>
  );
}

/**
 * The portal is a black hole seen face-on: a lightless event horizon ringed by a swirling
 * accretion disk (hot champagne inside, emerald outside, brighter on the side moving toward
 * us) and a razor-thin photon ring. On the dive the horizon swells until it swallows the screen.
 */
function PortalDisc({ tl, radius }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uOpen: { value: 0 },
          uDark: { value: 0 },
          deep: { value: new THREE.Color(THEME.deepForest) },
          cA: { value: C.emerald },
          cB: { value: C.bright },
          cC: { value: C.gold },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */ `
          ${NOISE}
          uniform float uTime; uniform float uOpen; uniform float uDark;
          uniform vec3 deep; uniform vec3 cA; uniform vec3 cB; uniform vec3 cC;
          varying vec2 vUv;
          void main(){
            vec2 p = vUv * 2. - 1.;
            float r = length(p);
            float a = atan(p.y, p.x);
            // the hole opens from the centre outward
            float iris = smoothstep(uOpen, uOpen - .08, r);
            if (iris < .001) discard;

            // the event horizon swells during the dive until it swallows everything
            float rh = .27 + uDark * 1.4;
            float d = max(r - rh, 0.) / (1. - rh);

            // gas spiralling inward, faster near the hole (differential rotation)
            float ang = a - 2.4 * log(r + .05) - uTime * 1.5 / (r + .22);
            float gas = vnoise(vec2(ang * 2.2, r * 9.)) * .6 + vnoise(vec2(ang * 5. + 3., r * 17.)) * .4;
            float bands = .55 + .45 * sin(ang * 3. + r * 30.);
            float dens = pow(1. - clamp(d * .95, 0., 1.), 1.5) * smoothstep(0., .03, d);
            float doppler = .5 + .5 * cos(a - .7);

            vec3 hot = mix(cC, vec3(1., .97, .88), pow(1. - d, 5.));
            vec3 cool = mix(cA, cB, smoothstep(.1, .5, d));
            vec3 col = mix(cool, hot, pow(1. - clamp(d * 1.5, 0., 1.), 1.6)) * dens * (.5 + 2.4 * gas * bands) * (.5 + 1.3 * doppler);

            // photon ring hugging the horizon, plus its soft halo
            float edge = r - rh;
            col += vec3(1., .96, .85) * exp(-pow(edge / .011, 2.)) * 1.9;
            col += cC * exp(-max(edge, 0.) / .055) * .38 * step(0., edge);

            // faint lensed arc: light bent over the top and under the bottom of the hole
            float lens = exp(-pow((abs(p.y) - (rh * 1.5 + .05)) / .018, 2.)) * smoothstep(.55, 0., abs(p.x)) * .55;
            col += cB * lens * (1. - uDark);

            // inside the horizon: nothing escapes
            col *= smoothstep(rh - .006, rh + .006, r);

            float alpha = iris * smoothstep(1., .72, r);
            // the hole itself is fully opaque black
            alpha = mix(alpha, iris, step(r, rh + .004));
            gl_FragColor = vec4(col, alpha);
          }`,
      }),
    []
  );

  useFrame(() => {
    const t = tl.current.t;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uOpen.value = easeOut(seg(t, TIMELINE.portal, TIMELINE.portal + 1.35)) * 1.02;
    mat.uniforms.uDark.value = smooth(seg(t, TIMELINE.fly + 0.5, TIMELINE.reveal));
  });

  return (
    <mesh renderOrder={2} material={mat}>
      <circleGeometry args={[radius, 96]} />
    </mesh>
  );
}

const ringMat = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false });

/**
 * Everything that gathers at the centre: core, converging rings, orbiting shards linked
 * to the core by "neural" filaments, and finally the portal rim itself.
 */
function Source({ tl, mobile }) {
  const R = 2.3;
  const core = useRef();
  const coreWire = useRef();
  const rings = useRef([]);
  const rim = useRef();
  const halo = useRef();
  const shardRefs = useRef([]);
  const links = useRef();

  const shardCount = mobile ? 10 : 16;
  const shards = useMemo(() => {
    const r = rng(33);
    return Array.from({ length: shardCount }, (_, i) => ({
      a: (i / shardCount) * Math.PI * 2 + r() * 0.5,
      far: 5.5 + r() * 3.5,
      lift: (r() - 0.5) * 3,
      speed: 0.35 + r() * 0.5,
      size: 0.1 + r() * 0.13,
      kind: i % 3,
      spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(2),
    }));
  }, [shardCount]);

  const shardGeo = useMemo(
    () => [
      new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1)),
      new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(1.15)),
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.95, 0)),
    ],
    []
  );
  const shardMat = useMemo(() => [ringMat(C.gold, 0.95), ringMat(C.bright, 0.95)], []);
  const linkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(shardCount * 6), 3));
    return g;
  }, [shardCount]);
  const linkMat = useMemo(() => ringMat(C.bright, 0), []);

  const ringDefs = useMemo(
    () => [
      { tilt: [1.1, 0.2, 0], spin: [0.5, 0.9, 0.2], color: C.gold, from: 3.0, r: 1.05 },
      { tilt: [0.3, 1.2, 0.4], spin: [0.7, -0.6, 0.5], color: C.bright, from: 3.7, r: 1.35 },
      { tilt: [-0.9, 0.5, 1.2], spin: [-0.4, 0.8, 0.9], color: C.soft, from: 4.5, r: 1.7 },
    ],
    []
  );
  const ringMats = useMemo(() => ringDefs.map((d) => ringMat(d.color, 0)), [ringDefs]);
  const rimMat = useMemo(() => ringMat(C.soft, 0), []);
  const haloMat = useMemo(() => ringMat(C.emerald, 0), []);
  const coreMat = useMemo(() => ringMat(C.soft, 1), []);
  const coreWireMat = useMemo(() => ringMat(C.gold, 0), []);

  useFrame((_, dt) => {
    const t = tl.current.t;
    const coreIn = easeOut(seg(t, TIMELINE.core, TIMELINE.core + 1.1));
    const coreOut = 1 - smooth(seg(t, TIMELINE.portal + 0.2, TIMELINE.portal + 1.1));

    // energy core
    const pulse = 1 + Math.sin(t * 7) * 0.06;
    core.current.scale.setScalar(0.2 * coreIn * pulse * (1 + 0.8 * seg(t, TIMELINE.portal - 0.4, TIMELINE.portal + 0.2) * (1 - seg(t, TIMELINE.portal + 0.2, TIMELINE.portal + 1.2))));
    core.current.visible = coreIn > 0.001 && coreOut > 0.001;
    coreWire.current.visible = core.current.visible;
    coreWire.current.scale.setScalar(0.62 * coreIn);
    coreWire.current.rotation.x += dt * 0.9;
    coreWire.current.rotation.y += dt * 1.3;
    coreWireMat.opacity = 0.9 * coreIn * coreOut;
    coreMat.opacity = coreOut;

    // rings converge
    const conv = seg(t, TIMELINE.rings, TIMELINE.portal + 0.2);
    rings.current.forEach((m, i) => {
      const d = ringDefs[i];
      const k = easeOut(conv);
      const s = THREE.MathUtils.lerp(d.from, d.r, k) * (1 + 1.4 * easeIn(seg(t, TIMELINE.portal + 0.2, TIMELINE.portal + 1.1)));
      m.scale.setScalar(s);
      m.rotation.x = d.tilt[0] + t * d.spin[0] * (1.4 - 0.7 * k);
      m.rotation.y = d.tilt[1] + t * d.spin[1] * (1.4 - 0.7 * k);
      m.rotation.z = d.tilt[2] + t * d.spin[2] * 0.5;
      ringMats[i].opacity = smooth(seg(t, TIMELINE.rings - 0.2, TIMELINE.rings + 0.5)) * (1 - seg(t, TIMELINE.portal + 0.6, TIMELINE.portal + 1.3));
    });

    // shards fall into orbit around the portal rim, linked back to the core
    const gather = easeOut(seg(t, TIMELINE.rings + 0.2, TIMELINE.portal + 0.8));
    const open = easeOut(seg(t, TIMELINE.portal, TIMELINE.portal + 1.35));
    const fade = 1 - seg(t, TIMELINE.fly - 0.2, TIMELINE.fly + 0.7);
    const arr = linkGeo.attributes.position.array;
    shardRefs.current.forEach((m, i) => {
      const s = shards[i];
      const orbitR = THREE.MathUtils.lerp(s.far, R * 1.22 + (i % 3) * 0.28, gather);
      const ang = s.a + t * s.speed * (0.4 + gather);
      const x = Math.cos(ang) * orbitR;
      const y = Math.sin(ang) * orbitR * 0.9 + s.lift * (1 - gather);
      const z = Math.sin(ang * 2 + i) * 0.55 * gather - (1 - gather) * 1.6;
      m.position.set(x, y, z);
      m.rotation.x += dt * s.spin.x;
      m.rotation.y += dt * s.spin.y;
      m.scale.setScalar(s.size * 2.6 * smooth(seg(t, TIMELINE.core + 0.3 + (i % 5) * 0.12, TIMELINE.core + 0.9 + (i % 5) * 0.12)) * (1 + open * 0.4));
      m.visible = fade > 0.001;
      arr.set([0, 0, 0, x, y, z], i * 6);
    });
    linkGeo.attributes.position.needsUpdate = true;
    linkMat.opacity = 0.5 * smooth(seg(t, TIMELINE.rings + 0.4, TIMELINE.rings + 1.2)) * fade * (1 - 0.6 * open);
    shardMat.forEach((m) => (m.opacity = 0.95 * fade));

    // the portal rim and its halo form last
    const form = smooth(seg(t, TIMELINE.portal - 0.5, TIMELINE.portal + 0.9));
    const grow = 0.55 + 0.45 * easeOut(seg(t, TIMELINE.portal - 0.4, TIMELINE.portal + 1.35));
    rim.current.scale.setScalar(grow);
    halo.current.scale.setScalar(grow * (1 + 0.04 * Math.sin(t * 3)));
    rim.current.rotation.z = t * 0.15;
    haloMat.opacity = form * 0.14;
    links.current.visible = fade > 0.001;
  });

  return (
    <group>
      <mesh ref={core} material={coreMat} renderOrder={3}>
        <icosahedronGeometry args={[1, 2]} />
      </mesh>
      <lineSegments ref={coreWire} material={coreWireMat} renderOrder={3}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1, 1)]} />
      </lineSegments>

      {ringDefs.map((d, i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} material={ringMats[i]} renderOrder={3}>
          <torusGeometry args={[1, 0.007, 8, 160]} />
        </mesh>
      ))}

      {shards.map((s, i) => (
        <lineSegments
          key={i}
          ref={(el) => (shardRefs.current[i] = el)}
          geometry={shardGeo[s.kind]}
          material={shardMat[i % 2]}
          renderOrder={3}
        />
      ))}
      <lineSegments ref={links} geometry={linkGeo} material={linkMat} frustumCulled={false} renderOrder={3} />

      <group>
        <mesh ref={halo} material={haloMat} renderOrder={3} visible={false}>
          <torusGeometry args={[R, 0.22, 16, 140]} />
        </mesh>
        <mesh ref={rim} material={rimMat} renderOrder={3} visible={false}>
          <torusGeometry args={[R, 0.045, 12, 200]} />
        </mesh>
        <GroupScale tl={tl} radius={R} />
      </group>
    </group>
  );
}

/** The disc scales with the rim so it never leaks outside it. */
function GroupScale({ tl, radius }) {
  const g = useRef();
  useFrame(() => {
    const t = tl.current.t;
    g.current.scale.setScalar(0.55 + 0.45 * easeOut(seg(t, TIMELINE.portal - 0.4, TIMELINE.portal + 1.35)));
  });
  return (
    <group ref={g}>
      <PortalDisc tl={tl} radius={radius * 0.985} />
    </group>
  );
}

/** Runs the master clock, dollies the camera and reports progress to the DOM. */
function Rig({ tl, onPhase, onReveal, onDone, hud }) {
  const { camera, pointer, size } = useThree();
  const fired = useRef({ reveal: false, done: false, phase: -1 });

  useFrame((_, dt) => {
    const s = tl.current;
    if (!s.frozen) {
      // wall-clock pacing: a slow GPU drops frames, it doesn't stretch the intro
      s.t += Math.min(dt, 0.25) * (s.skip ? 4 : 1);
      if (s.skip && s.t < TIMELINE.fly + 0.15) s.t = Math.min(TIMELINE.fly + 0.15, s.t + dt * 4);
    }
    const t = s.t;

    // camera: gentle drift → slow push toward the source → dive through the portal
    const drift = 1 - seg(t, TIMELINE.portal, TIMELINE.fly);
    const dive = seg(t, TIMELINE.fly, TIMELINE.end - 0.45) ** 2;
    const push = easeOut(seg(t, 0.2, TIMELINE.fly));
    // narrow (portrait) screens pull back so the whole portal still fits
    const fit = Math.max(1, 0.95 / (size.width / size.height));
    const z = (9.5 - push * 2.4) * fit * (1 - dive) - 1.2 * dive;
    camera.position.x = damp(camera.position.x, pointer.x * 0.45 * drift, 3, dt);
    camera.position.y = damp(camera.position.y, pointer.y * 0.3 * drift, 3, dt);
    camera.position.z = z;
    camera.lookAt(0, 0, 0);
    const fov = 50 + dive * 40;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    if (hud.current) {
      hud.current.bar.style.transform = `scaleX(${clamp(t / TIMELINE.end, 0, 1)})`;
      hud.current.root.style.opacity = String(1 - smooth(seg(t, TIMELINE.reveal, TIMELINE.end)));
      hud.current.stage.style.opacity = String(1 - seg(t, TIMELINE.fly - 0.2, TIMELINE.fly + 0.5));
    }

    const phase = t < TIMELINE.core ? 0 : t < TIMELINE.rings + 0.5 ? 1 : t < TIMELINE.portal ? 2 : t < TIMELINE.fly ? 3 : 4;
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
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
    >
      <Rig tl={tl} onPhase={onPhase} onReveal={onReveal} onDone={onDone} hud={hud} />
      <Dust tl={tl} count={mobile ? 450 : 1100} mobile={mobile} />
      <Streaks tl={tl} count={mobile ? 120 : 280} />
      <Glow tl={tl} />
      <Source tl={tl} mobile={mobile} />
    </Canvas>
  );
}
