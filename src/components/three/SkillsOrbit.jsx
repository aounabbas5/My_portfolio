import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { getCapabilities } from '../../hooks/useCapabilities';
import { THEME } from '../../theme';

const { damp, clamp } = THREE.MathUtils;

// Orbit of the skill medallions around the planet (an ellipse seen at a tilt).
const ORBIT_A = 3.3;
const ORBIT_B = 2.15;
const MEDAL_R = 0.48;
const TRAIL_N = 18; // points per comet trail
const TRAIL_STEP = 0.03; // radians between trail points

// ---------------------------------------------------------------- icons
const GOLD = THEME.champagneGold;
const MINT = '#5FD9A6';
const INK = THEME.deepForest;

const shield = (fill, glyph) =>
  `<path d='M10 6H54L50.5 52L32 58L13.5 52Z' fill='${fill}'/>
   <text x='32' y='43' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='700' font-size='30' fill='${INK}'>${glyph}</text>`;

const ICONS = {
  html: shield(GOLD, '5'),
  css: shield(GOLD, '3'),
  javascript: `<rect x='9' y='9' width='46' height='46' rx='6' fill='${GOLD}'/>
    <text x='32' y='45' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='24' fill='${INK}'>JS</text>`,
  react: `<g fill='none' stroke='${MINT}' stroke-width='3'>
      <ellipse cx='32' cy='32' rx='26' ry='10'/>
      <ellipse cx='32' cy='32' rx='26' ry='10' transform='rotate(60 32 32)'/>
      <ellipse cx='32' cy='32' rx='26' ry='10' transform='rotate(120 32 32)'/></g>
    <circle cx='32' cy='32' r='4.5' fill='${MINT}'/>`,
  'tailwind css': `<g fill='${MINT}'>
      <path d='M32 17c-8 0-12 4-14 12 3-4 6.500-5.500 10.500-4.500 2.300.6 3.900 2.200 5.700 4 3 3 6.400 6.500 13.800 6.500 8 0 12-4 14-12-3 4-6.500 5.500-10.500 4.500-2.300-.6-3.900-2.200-5.700-4C42.800 20.500 39.400 17 32 17z'/>
      <path d='M18 33c-8 0-12 4-14 12 3-4 6.500-5.500 10.500-4.500 2.300.6 3.900 2.200 5.700 4 3 3 6.400 6.500 13.800 6.500 8 0 12-4 14-12-3 4-6.500 5.500-10.500 4.500-2.300-.6-3.900-2.200-5.700-4C28.800 36.500 25.400 33 18 33z' transform='translate(7 -2)'/></g>`,
  git: `<path d='M32 5L59 32L32 59L5 32Z' fill='${GOLD}'/>
    <g stroke='${INK}' stroke-width='4' stroke-linecap='round' fill='none'>
      <path d='M25 21V43M25 31L40 38'/></g>
    <g fill='${INK}'><circle cx='25' cy='21' r='4.500'/><circle cx='25' cy='43' r='4.500'/><circle cx='40' cy='38' r='4.500'/></g>`,
  github: `<g transform='translate(4 4) scale(2.2)' fill='${GOLD}'><path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z'/></g>`,
  'claude code': `<g fill='${GOLD}'>
      <rect x='29.5' y='6' width='5' height='52' rx='2.5'/>
      <rect x='29.5' y='6' width='5' height='52' rx='2.5' transform='rotate(45 32 32)'/>
      <rect x='29.5' y='6' width='5' height='52' rx='2.5' transform='rotate(90 32 32)'/>
      <rect x='29.5' y='6' width='5' height='52' rx='2.5' transform='rotate(135 32 32)'/></g>
    <circle cx='32' cy='32' r='6' fill='${INK}'/><circle cx='32' cy='32' r='3' fill='${MINT}'/>`,
  antigravity: `<g fill='none' stroke='${MINT}' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M32 8L50 50H14Z'/><path d='M32 52V20M24 28L32 20L40 28' stroke='${GOLD}'/></g>
    <circle cx='32' cy='57' r='2.4' fill='${GOLD}'/>`,
  vercel: `<path d='M32 9L58 54H6Z' fill='${GOLD}'/>`,
  mongodb: `<path d='M32 4C26 14 18 22 18 36C18 47 24 54 32 58C40 54 46 47 46 36C46 22 38 14 32 4Z' fill='${MINT}'/>
    <path d='M32 14V58' stroke='${INK}' stroke-width='3' stroke-linecap='round'/>`,
  'vs code': `<path d='M44 7L57 13V51L44 57L20 36L10 44L5 40L16 32L5 24L10 20L20 28Z' fill='${GOLD}'/>
    <path d='M44 20V44L28 32Z' fill='${INK}'/>`,
};

const textureCache = new Map();
function iconTexture(name) {
  const key = name.toLowerCase();
  if (textureCache.has(key)) return textureCache.get(key);
  const body =
    ICONS[key] ??
    `<circle cx='32' cy='32' r='24' fill='none' stroke='${GOLD}' stroke-width='4'/>
     <text x='32' y='41' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='700' font-size='26' fill='${GOLD}'>${name.slice(0, 1).toUpperCase()}</text>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 64 64'>${body}</svg>`;
  const tex = new THREE.TextureLoader().load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureCache.set(key, tex);
  return tex;
}

// Soft round glow sprite (halos, sheen, light particles).
let glowTex;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

// Circuit-style pattern wrapped around the planet: traces with 45° bends that
// end in small nodes, plus fine latitude lines. Drawn in white and tinted by
// the material, and repeated at the seam so it wraps without a visible join.
let patternTex;
function planetPattern() {
  if (patternTex) return patternTex;
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const r = rng(5);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = '#fff';
  g.fillStyle = '#fff';
  g.shadowColor = '#fff';

  // fine dashed latitude lines
  g.shadowBlur = 0;
  g.lineWidth = 1.2;
  g.globalAlpha = 0.35;
  [112, 184, 256, 328, 400].forEach((y, i) => {
    g.setLineDash(i % 2 ? [3, 13] : [26, 12]);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  });
  g.setLineDash([]);

  // circuit traces
  const traces = Array.from({ length: 30 }, () => {
    let x = r() * W;
    let y = 90 + r() * (H - 180);
    const pts = [[x, y]];
    const dir = r() < 0.5 ? -1 : 1;
    const bends = 1 + Math.floor(r() * 3);
    for (let b = 0; b < bends; b++) {
      x += dir * (36 + r() * 110);
      pts.push([x, y]);
      const d = 16 + r() * 30;
      const up = r() < 0.5 ? -1 : 1;
      if (y + up * d > 70 && y + up * d < H - 70) {
        x += dir * d;
        y += up * d;
        pts.push([x, y]);
      }
    }
    x += dir * (20 + r() * 60);
    pts.push([x, y]);
    return { pts, ring: r() < 0.45 };
  });
  for (const off of [-W, 0, W]) {
    for (const t of traces) {
      g.globalAlpha = 0.9;
      g.shadowBlur = 7;
      g.lineWidth = 2.2;
      g.beginPath();
      t.pts.forEach(([x, y], i) => (i ? g.lineTo(x + off, y) : g.moveTo(x + off, y)));
      g.stroke();
      const [sx, sy] = t.pts[0];
      const [ex, ey] = t.pts[t.pts.length - 1];
      g.beginPath();
      g.arc(sx + off, sy, 3.4, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(ex + off, ey, 4.6, 0, Math.PI * 2);
      g.fill();
      if (t.ring) {
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(ex + off, ey, 9.5, 0, Math.PI * 2);
        g.stroke();
      }
    }
  }
  patternTex = new THREE.CanvasTexture(c);
  patternTex.colorSpace = THREE.SRGBColorSpace;
  patternTex.wrapS = THREE.RepeatWrapping;
  patternTex.anisotropy = 8;
  return patternTex;
}

// Deterministic PRNG so the particle field is identical between renders.
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

// ---------------------------------------------------------------- scene
/**
 * Emerald glass planet with champagne rings; the skills revolve around it as
 * medallions. Name tags are DOM elements this component repositions each frame
 * (projected from 3D) so each stays locked under its medallion; text stays
 * crisp and no extra React roots are created.
 */
function Orbit({ skills, labels, hovered }) {
  const { mobile } = getCapabilities();
  const world = useRef(); // fit-to-panel scale + floating
  const tilt = useRef(); // tilted orbit system, leaning gently toward the pointer
  const planet = useRef();
  const core = useRef();
  const coreGlow = useRef();
  const coreWire = useRef();
  const rimShell = useRef();
  const patternA = useRef();
  const patternB = useRef();
  const ringGroupA = useRef();
  const ringGroupB = useRef();
  const beads = useRef([]);
  const nodes = useRef([]);
  const halos = useRef([]);
  const rims = useRef([]);
  const particles = useRef();
  const keyLight = useRef();
  const coreLight = useRef();
  const phase = useRef(0);
  const speed = useRef(1);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmp2 = useMemo(() => new THREE.Vector3(), []);
  const textures = useMemo(() => skills.map((s) => iconTexture(s.name)), [skills]);
  const glow = useMemo(() => glowTexture(), []);
  const pattern = useMemo(() => planetPattern(), []);

  // comet trails behind every medallion (fade to nothing)
  const trails = useMemo(() => {
    const c = new THREE.Color(THEME.champagneGold);
    return skills.map(() => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
      const col = new Float32Array(TRAIL_N * 3);
      for (let k = 0; k < TRAIL_N; k++) {
        const f = (1 - k / (TRAIL_N - 1)) ** 2; // additive blending: darker = more transparent
        col[k * 3] = c.r * f;
        col[k * 3 + 1] = c.g * f;
        col[k * 3 + 2] = c.b * f;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Line(geo, mat);
    });
  }, [skills]);

  // tiny floating light particles (ambient dust)
  const dust = useMemo(() => {
    const count = mobile ? 34 : 64;
    const r = rng(11);
    const base = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const rad = 2.4 + r() * 3.2;
      const th = r() * Math.PI * 2;
      base[i * 3] = Math.cos(th) * rad;
      base[i * 3 + 1] = (r() - 0.5) * 5.2;
      base[i * 3 + 2] = Math.sin(th) * rad * 0.7;
      seed[i] = r() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
    return { geo, base, seed, count };
  }, [mobile]);

  useFrame((state, dt) => {
    const { camera, size, pointer } = state;
    const t = state.clock.elapsedTime;

    // fit the whole orbit into the panel (narrow phones shrink it)
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.length();
    const visW = visH * (size.width / size.height);
    const fit = clamp(visW / 9.2, 0.5, 1.15);
    world.current.scale.setScalar(damp(world.current.scale.x, fit, 6, dt));
    world.current.position.y = Math.sin(t * 0.8) * 0.07; // gentle floating

    // smooth 3D tilt that follows the cursor, plus a slow breathing sway
    tilt.current.rotation.x = damp(tilt.current.rotation.x, -0.85 + pointer.y * 0.17 + Math.sin(t * 0.5) * 0.03, 3, dt);
    tilt.current.rotation.y = damp(tilt.current.rotation.y, pointer.x * 0.24 + Math.sin(t * 0.35) * 0.05, 3, dt);

    // planet: a gentle wobble instead of a constant spin
    planet.current.rotation.y = Math.sin(t * 0.32) * 0.4;
    planet.current.rotation.x = Math.sin(t * 0.26 + 1) * 0.1;
    core.current.rotation.y = -Math.sin(t * 0.3) * 0.55;
    core.current.rotation.x = Math.cos(t * 0.24) * 0.2;
    patternA.current.rotation.y += dt * 0.1;
    patternB.current.rotation.y -= dt * 0.06;
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.1);
    coreGlow.current.scale.setScalar(1 + breathe * 0.1);
    coreGlow.current.material.opacity = 0.28 + breathe * 0.2;
    coreWire.current.opacity = 0.05 + breathe * 0.05;
    rimShell.current.material.opacity = 0.16 + breathe * 0.08;
    patternA.current.material.opacity = 0.78 + breathe * 0.2;
    coreLight.current.intensity = 4 + breathe * 3;

    // rings sway in 3D; beads travel along them
    ringGroupA.current.rotation.x = 1.15 + Math.sin(t * 0.4) * 0.09;
    ringGroupA.current.rotation.y = 0.2 + Math.cos(t * 0.33) * 0.1;
    ringGroupB.current.rotation.x = 0.55 + Math.cos(t * 0.36) * 0.09;
    ringGroupB.current.rotation.z = 0.3 + Math.sin(t * 0.3) * 0.08;
    beads.current.forEach((b, i) => {
      if (!b) return;
      const ang = t * (i % 2 ? -0.7 : 0.9) + i * 2.1;
      const R = i < 3 ? 1.45 : 1.8;
      b.position.set(Math.cos(ang) * R, Math.sin(ang) * R, 0);
    });

    // ambient dust drifts and parallaxes with the cursor
    const pos = particles.current.geometry.attributes.position;
    for (let i = 0; i < dust.count; i++) {
      const s = dust.seed[i];
      pos.array[i * 3] = dust.base[i * 3] + Math.sin(t * 0.3 + s) * 0.18;
      pos.array[i * 3 + 1] = dust.base[i * 3 + 1] + Math.sin(t * 0.45 + s * 1.7) * 0.22;
      pos.array[i * 3 + 2] = dust.base[i * 3 + 2] + Math.cos(t * 0.28 + s) * 0.15;
    }
    pos.needsUpdate = true;
    particles.current.position.x = damp(particles.current.position.x, -pointer.x * 0.25, 2.5, dt);
    particles.current.position.y = damp(particles.current.position.y, -pointer.y * 0.18, 2.5, dt);

    // a soft key light chases the cursor, moving reflections across the glass and metal
    keyLight.current.position.x = damp(keyLight.current.position.x, pointer.x * 5, 3, dt);
    keyLight.current.position.y = damp(keyLight.current.position.y, 2 + pointer.y * 3, 3, dt);

    // skills revolve around the planet; they slow right down while one is hovered
    speed.current = damp(speed.current, hovered.current >= 0 ? 0.12 : 1, 4, dt);
    phase.current += dt * 0.17 * speed.current;

    const n = skills.length;
    nodes.current.forEach((node, i) => {
      if (!node) return;
      const skill = skills[i];
      const a = phase.current + (i / n) * Math.PI * 2;
      node.position.set(Math.cos(a) * ORBIT_A, 0, Math.sin(a) * ORBIT_B);
      node.lookAt(camera.position); // medallions always face the viewer
      const isHover = hovered.current === i;
      node.scale.setScalar(damp(node.scale.x, isHover ? 1.24 : 1, 8, dt));
      const depth = clamp((Math.sin(a) + 1) / 2, 0, 1); // 1 = nearest the viewer

      // hover polish: warm rim + halo bloom
      const rim = rims.current[i];
      if (rim) rim.emissiveIntensity = damp(rim.emissiveIntensity, isHover ? 1 : 0.1 + depth * 0.1, 8, dt);
      const halo = halos.current[i];
      if (halo) halo.opacity = damp(halo.opacity, isHover ? 0.75 : 0.12 + depth * 0.18, 6, dt);

      // comet trail along the orbit, fading with distance from the viewer
      const line = trails[i];
      const tp = line.geometry.attributes.position;
      for (let k = 0; k < TRAIL_N; k++) {
        const ang = a - k * TRAIL_STEP;
        tp.array[k * 3] = Math.cos(ang) * ORBIT_A;
        tp.array[k * 3 + 1] = 0;
        tp.array[k * 3 + 2] = Math.sin(ang) * ORBIT_B;
      }
      tp.needsUpdate = true;
      line.material.opacity = 0.25 + depth * 0.65;

      // name tag: locked directly under its medallion, so it only moves with it
      node.getWorldPosition(tmp);
      tmp2.copy(tmp);
      tmp2.y += MEDAL_R * node.scale.x * world.current.scale.x;
      tmp.project(camera);
      tmp2.project(camera);
      const radiusPx = Math.abs(tmp2.y - tmp.y) * 0.5 * size.height;
      const el = labels.current[i];
      if (el) {
        const x = (tmp.x * 0.5 + 0.5) * size.width;
        const y = (-tmp.y * 0.5 + 0.5) * size.height + radiusPx + 16;
        const learning = skill.level === 'learning';
        const narrow = size.width < 420;
        el.style.fontSize = narrow ? '9.5px' : '12px';
        el.style.padding = narrow ? '1px 7px' : '';
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        // on narrow panels, only the front half of the orbit shows names (the back ones are dim anyway)
        el.style.opacity = isHover ? 1 : narrow && depth < 0.62 ? 0 : 0.22 + depth * 0.78;
        el.style.zIndex = isHover ? 5 : Math.round(depth * 4);
        el.style.borderColor = isHover || learning ? THEME.champagneGold : THEME.darkSage;
        el.style.boxShadow = isHover ? '0 0 14px rgba(231,211,161,0.45)' : 'none';
      }
    });
  });

  const hover = (i) => ({
    onPointerOver: (e) => {
      e.stopPropagation();
      hovered.current = i;
      document.body.style.cursor = 'pointer';
      document.documentElement.dataset.cursor = 'pointer';
    },
    onPointerOut: () => {
      if (hovered.current === i) hovered.current = -1;
      document.body.style.cursor = '';
      delete document.documentElement.dataset.cursor;
    },
  });

  return (
    <group ref={world}>
      {/* ambient lighting: a breathing light inside the core and a cursor-following key light */}
      <pointLight ref={coreLight} color={THEME.emeraldGlow} intensity={5} distance={9} position={[0, 0, 0]} />
      <pointLight ref={keyLight} color={THEME.softChampagne} intensity={14} distance={16} position={[0, 2, 5]} />

      {/* floating light particles */}
      <points ref={particles} geometry={dust.geo}>
        <pointsMaterial
          map={glow}
          color={THEME.champagneGold}
          size={0.2}
          sizeAttenuation
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <group ref={tilt}>
        {/* planet: emerald glass shell with a breathing core */}
        <group ref={planet}>
          <mesh>
            <sphereGeometry args={[1.1, 64, 64]} />
            <meshPhysicalMaterial
              color={THEME.emeraldGlass}
              emissive={THEME.emeraldInk}
              emissiveIntensity={0.6}
              roughness={0.08}
              metalness={0.15}
              clearcoat={1}
              clearcoatRoughness={0.04}
              transparent
              opacity={0.7}
              depthWrite={false}
              envMapIntensity={2.4}
            />
          </mesh>
          <mesh ref={core}>
            <icosahedronGeometry args={[0.82, 2]} />
            <meshStandardMaterial
              ref={(m) => {
                coreWire.current = m;
              }}
              color={THEME.emeraldGlow}
              emissive={THEME.emeraldGlow}
              emissiveIntensity={1.1}
              roughness={0.5}
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh ref={coreGlow}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color={THEME.emeraldGlow} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* patterns: gold circuit lines on the surface, a mint layer deeper inside */}
          <mesh ref={patternB} rotation={[0.3, 0, 0.2]}>
            <sphereGeometry args={[0.93, 48, 48]} />
            <meshBasicMaterial map={pattern} color={MINT} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={patternA}>
            <sphereGeometry args={[1.106, 64, 64]} />
            <meshBasicMaterial map={pattern} color={THEME.champagneGold} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
        {/* soft rim light around the glass */}
        <mesh ref={rimShell}>
          <sphereGeometry args={[1.26, 48, 48]} />
          <meshBasicMaterial color={THEME.emeraldGlow} transparent opacity={0.18} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* champagne rings + travelling beads */}
        <group ref={ringGroupA} rotation={[1.15, 0.2, 0]}>
          <mesh>
            <torusGeometry args={[1.45, 0.026, 14, 120]} />
            <meshPhysicalMaterial color={THEME.champagneGold} metalness={0.92} roughness={0.2} clearcoat={0.6} envMapIntensity={1.8} />
          </mesh>
        </group>
        <group ref={ringGroupB} rotation={[0.55, -0.5, 0.3]}>
          <mesh>
            <torusGeometry args={[1.8, 0.02, 14, 120]} />
            <meshPhysicalMaterial color={THEME.champagneGold} metalness={0.92} roughness={0.24} clearcoat={0.6} envMapIntensity={1.6} />
          </mesh>
        </group>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={i < 3 ? [1.15, 0.2, 0] : [0.55, -0.5, 0.3]}>
            <mesh
              ref={(m) => {
                beads.current[i] = m;
              }}
            >
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshPhysicalMaterial color={THEME.champagneGold} metalness={0.9} roughness={0.2} emissive={THEME.champagneGold} emissiveIntensity={0.5} />
            </mesh>
          </group>
        ))}

        {/* thin orbit guide for the skills + comet trails */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[ORBIT_A, ORBIT_B, 1]}>
          <ringGeometry args={[0.996, 1, 160]} />
          <meshBasicMaterial color={THEME.champagneGold} transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
        {trails.map((line, i) => (
          <primitive key={i} object={line} />
        ))}

        {/* skill medallions */}
        {skills.map((skill, i) => (
          <group
            key={skill.name}
            ref={(g) => {
              nodes.current[i] = g;
            }}
          >
            {/* soft halo glow behind the medallion */}
            <mesh position={[0, 0, -0.12]}>
              <planeGeometry args={[2.1, 2.1]} />
              <meshBasicMaterial
                ref={(m) => {
                  halos.current[i] = m;
                }}
                map={glow}
                color={skill.level === 'learning' ? THEME.champagneGold : THEME.emeraldGlow}
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} {...hover(i)}>
              <cylinderGeometry args={[MEDAL_R, MEDAL_R, 0.18, 48]} />
              <meshPhysicalMaterial
                color={THEME.emeraldGlass}
                emissive={THEME.emeraldInk}
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.3}
                clearcoat={1}
                clearcoatRoughness={0.08}
                envMapIntensity={1.8}
              />
            </mesh>
            {/* champagne rim (warms up on hover) with a fine inner bevel */}
            <mesh>
              <torusGeometry args={[MEDAL_R, 0.052, 16, 64]} />
              <meshPhysicalMaterial
                ref={(m) => {
                  rims.current[i] = m;
                }}
                color={THEME.champagneGold}
                emissive={THEME.champagneGold}
                emissiveIntensity={0.12}
                metalness={0.9}
                roughness={0.24}
                clearcoat={0.5}
                envMapIntensity={1.6}
              />
            </mesh>
            <mesh position={[0, 0, 0.09]}>
              <torusGeometry args={[MEDAL_R - 0.065, 0.012, 8, 64]} />
              <meshStandardMaterial color={THEME.champagneGold} metalness={0.8} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.095]}>
              <circleGeometry args={[MEDAL_R - 0.07, 48]} />
              <meshStandardMaterial color={THEME.deepForest} roughness={0.55} />
            </mesh>
            <mesh position={[0, 0, 0.1]}>
              <planeGeometry args={[0.64, 0.64]} />
              <meshBasicMaterial map={textures[i]} transparent toneMapped={false} />
            </mesh>
            {/* glass cover with a soft highlight */}
            <mesh position={[0, 0, 0.115]}>
              <circleGeometry args={[MEDAL_R - 0.07, 48]} />
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.07} roughness={0.05} metalness={0} clearcoat={1} depthWrite={false} />
            </mesh>
            <mesh position={[-0.13, 0.19, 0.125]} rotation={[0, 0, 0.7]} scale={[0.46, 0.17, 1]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={glow} color={THEME.softChampagne} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* platform rings under the scene (kept level) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]}>
        <torusGeometry args={[1.9, 0.014, 8, 100]} />
        <meshBasicMaterial color={THEME.champagneGold} transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]}>
        <circleGeometry args={[1.8, 64]} />
        <meshBasicMaterial color={THEME.emeraldGlow} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function SkillsOrbit({ skills, active }) {
  const { mobile } = getCapabilities();
  const labels = useRef([]);
  const hovered = useRef(-1);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, mobile ? 1.25 : 1.75]}
        camera={{ position: [0, 1.4, 9.2], fov: 38 }}
        gl={{ antialias: !mobile, alpha: true }}
        style={{ touchAction: 'pan-y' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight color={THEME.softChampagne} intensity={1.5} position={[3, 4, 5]} />
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={3} color={THEME.emeraldGlow} position={[-4, 3, 2]} scale={[7, 3, 1]} />
          <Lightformer form="ring" intensity={3.5} color={THEME.champagneGold} position={[3, -2, 3]} scale={3} />
          <Lightformer form="rect" intensity={2} color={THEME.softChampagne} position={[0, 5, 2]} scale={[8, 1, 1]} />
        </Environment>
        <Orbit skills={skills} labels={labels} hovered={hovered} />
      </Canvas>

      <div className="absolute inset-0 pointer-events-none">
        {skills.map((skill, i) => (
          <span
            key={skill.name}
            ref={(el) => {
              labels.current[i] = el;
            }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-full border px-3 py-0.5 text-[12px] font-medium transition-[box-shadow] duration-300"
            style={{
              color: THEME.softChampagne,
              background: 'rgba(10,36,29,0.9)',
              borderColor: skill.level === 'learning' ? THEME.champagneGold : THEME.darkSage,
              borderStyle: skill.level === 'learning' ? 'dashed' : 'solid',
              opacity: 0,
            }}
          >
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}
