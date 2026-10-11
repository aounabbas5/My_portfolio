import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Environment, Lightformer } from '@react-three/drei';
import { THEME } from '../../theme';
import { CURSOR, cursorState } from './cursorConfig';

const { damp, clamp, lerp } = THREE.MathUtils;

// ---- materials, all from the site palette: Soft Champagne pearl shell,
// Deep Forest mechanical joints, Emerald grip pads, Champagne Gold accents
const SHELL = THEME.softChampagne;
const DARK = THEME.deepForest;

function Shell({ tint = SHELL }) {
  return (
    <meshPhysicalMaterial
      color={tint}
      roughness={0.3}
      metalness={0.2}
      clearcoat={1}
      clearcoatRoughness={0.14}
      envMapIntensity={1.25}
    />
  );
}
function Joint() {
  return <meshPhysicalMaterial color={DARK} roughness={0.4} metalness={0.8} envMapIntensity={1.1} />;
}
function Pad() {
  return <meshStandardMaterial color={THEME.emeraldClay} roughness={0.72} metalness={0.05} />;
}
function Champagne() {
  return <meshPhysicalMaterial color={THEME.champagneGold} roughness={0.34} metalness={0.78} envMapIntensity={1.2} />;
}

// Joint curl (radians). Positive curls toward the viewer, i.e. into the palm,
// like a real hand closing. `spread` fans the fingers apart (1) or together (0).
const POSES = {
  // resting: open, relaxed hand
  idle: {
    index: [0.08, 0.1, 0.06],
    middle: [0.05, 0.1, 0.05],
    ring: [0.08, 0.12, 0.08],
    pinky: [0.12, 0.15, 0.1],
    thumb: [0.1, 0.1, 0.05],
    spread: 1,
    glow: 0.7,
    scale: 1,
    squash: 1,
  },
  // over something clickable: fingers gather slightly, ready to grab
  hover: {
    index: [0.28, 0.25, 0.18],
    middle: [0.3, 0.28, 0.2],
    ring: [0.32, 0.3, 0.2],
    pinky: [0.36, 0.32, 0.22],
    thumb: [0.3, 0.28, 0.18],
    spread: 0.55,
    glow: 1.8,
    scale: 1.04,
    squash: 1,
  },
  // mouse down: fingers and thumb close and compress, like gripping an object
  press: {
    index: [1.15, 1.3, 0.85],
    middle: [1.25, 1.38, 0.9],
    ring: [1.3, 1.42, 0.92],
    pinky: [1.3, 1.42, 0.92],
    thumb: [0.85, 0.95, 0.7],
    spread: 0,
    glow: 2.6,
    scale: 0.86,
    squash: 0.9,
  },
};

// Fan angles (rotation about Z) for each finger when fully spread.
const FAN = { index: 0.1, middle: 0.03, ring: -0.05, pinky: -0.14 };
const THUMB_OPEN = 0.95;
const THUMB_CLOSED = 0.4;

// Joint registry, filled by callback refs (kept outside React state on purpose).
const rig = { index: [], middle: [], ring: [], pinky: [], thumb: [], base: {}, sensor: null, pivot: null, palm: null };
const setSensor = (m) => {
  rig.sensor = m;
};

/** One finger phalanx: white shell, dark grip pad on the palm side, hinge barrel with champagne pins. */
function Seg({ len, w, d, tip, sensor }) {
  return (
    <>
      <RoundedBox args={[w, len * 0.92, d]} radius={Math.min(w, d) * 0.4} smoothness={4} position={[0, len * 0.5, 0]}>
        <Shell />
      </RoundedBox>
      {!tip && (
        <RoundedBox args={[w * 0.58, len * 0.5, d * 0.16]} radius={0.025} smoothness={2} position={[0, len * 0.5, d * 0.46]}>
          <Pad />
        </RoundedBox>
      )}
      {!tip && (
        <RoundedBox args={[w * 0.5, len * 0.5, d * 0.14]} radius={0.02} smoothness={2} position={[0, len * 0.5, -d * 0.47]}>
          <Joint />
        </RoundedBox>
      )}
      {/* hinge */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[w * 0.4, w * 0.4, w * 1.02, 18]} />
        <Joint />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * w * 0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[w * 0.15, w * 0.15, 0.04, 14]} />
          <Champagne />
        </mesh>
      ))}
      {tip && (
        <>
          <RoundedBox args={[w * 0.9, len * 0.4, d * 0.9]} radius={w * 0.32} smoothness={4} position={[0, len * 0.84, 0]}>
            <Champagne />
          </RoundedBox>
          {sensor && (
            <mesh position={[0, len * 0.66, -d * 0.5]}>
              <sphereGeometry args={[w * 0.17, 16, 16]} />
              <meshStandardMaterial ref={setSensor} color={THEME.softChampagne} emissive={THEME.champagneGold} emissiveIntensity={1} />
            </mesh>
          )}
        </>
      )}
    </>
  );
}

function Finger({ name, x, y, lens, w, d, sensor }) {
  const bind = (i) => (n) => {
    rig[name][i] = n;
  };
  return (
    <group
      position={[x, y, 0]}
      ref={(n) => {
        rig.base[name] = n;
      }}
    >
      <group ref={bind(0)}>
        <Seg len={lens[0]} w={w} d={d} />
        <group ref={bind(1)} position={[0, lens[0], 0]}>
          <Seg len={lens[1]} w={w * 0.92} d={d * 0.92} />
          <group ref={bind(2)} position={[0, lens[1], 0]}>
            <Seg len={lens[2]} w={w * 0.84} d={d * 0.84} tip sensor={sensor} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Hand() {
  const invalidate = useThree((st) => st.invalidate);
  const swayAmt = useRef(0);

  useEffect(() => {
    cursorState.wake = invalidate;
    invalidate();
    return () => {
      cursorState.wake = null;
    };
  }, [invalidate]);

  useFrame((fx, dt) => {
    const s = cursorState;
    const t = fx.clock.elapsedTime;
    const p = rig.pivot;
    if (!p) return;
    let busy = false;
    const to = (obj, key, target, lambda = 14) => {
      const v = damp(obj[key], target, lambda, dt);
      if (Math.abs(v - target) > 0.0008) busy = true;
      obj[key] = v;
    };

    const pose = s.down ? POSES.press : s.hover ? POSES.hover : POSES.idle;
    const active = performance.now() - s.lastMove < 2500;
    swayAmt.current = damp(swayAmt.current, active ? 1 : 0, 3, dt);
    if (swayAmt.current > 0.01) busy = true;
    const sway = swayAmt.current;
    // closing is quick and decisive; opening is a touch slower
    const lam = s.down ? 18 : 12;

    ['index', 'middle', 'ring', 'pinky', 'thumb'].forEach((name, fi) => {
      rig[name].forEach((node, ji) => {
        if (!node) return;
        const wiggle = s.down ? 0 : Math.sin(t * 1.5 + fi * 0.8 + ji * 0.5) * 0.04 * sway;
        to(node.rotation, 'x', pose[name][ji] + wiggle, lam);
      });
    });

    // fan the fingers apart / together; swing the thumb in to oppose them
    ['index', 'middle', 'ring', 'pinky'].forEach((name) => {
      if (rig.base[name]) to(rig.base[name].rotation, 'z', FAN[name] * pose.spread, lam);
    });
    if (rig.base.thumb) to(rig.base.thumb.rotation, 'z', lerp(THUMB_CLOSED, THUMB_OPEN, pose.spread), lam);

    if (rig.sensor) to(rig.sensor, 'emissiveIntensity', pose.glow, 10);

    // lean (gently) into the movement direction
    s.vx = damp(s.vx, 0, 6, dt);
    s.vy = damp(s.vy, 0, 6, dt);
    if (Math.abs(s.vx) + Math.abs(s.vy) > 0.05) busy = true;
    to(p.rotation, 'z', 0.5 + clamp(s.vx * 0.01, -0.3, 0.3));
    to(p.rotation, 'y', -0.3 - clamp(s.vx * 0.012, -0.3, 0.3));
    to(p.rotation, 'x', 0.18 + clamp(s.vy * 0.01, -0.25, 0.25));
    to(p.scale, 'x', pose.scale, 16);
    p.scale.y = p.scale.z = p.scale.x;
    // the palm itself squeezes (a little flatter and narrower) when gripping
    if (rig.palm) {
      to(rig.palm.scale, 'x', pose.squash, 16);
      to(rig.palm.scale, 'y', 1 - (1 - pose.squash) * 0.6, 16);
      to(rig.palm.scale, 'z', pose.squash, 16);
    }

    if (!s.ready) {
      s.ready = true;
      s.onReady?.();
    }
    if (busy) invalidate();
  });

  // The open hand is positioned so the index fingertip is the origin (the hotspot).
  return (
    <group rotation={[0, Math.PI, 0]}>
    <group
      ref={(n) => {
        rig.pivot = n;
      }}
      rotation={[0.18, -0.3, 0.5]}
    >
      <group position={[0.65, -2.22, 0]}>
        {/* palm: pearl shell, emerald grip pad with a champagne ring */}
        <group
          ref={(n) => {
            rig.palm = n;
          }}
        >
        <RoundedBox args={[1.62, 1.3, 0.78]} radius={0.36} smoothness={5}>
          <Shell />
        </RoundedBox>
        <RoundedBox args={[1.12, 0.74, 0.12]} radius={0.12} smoothness={4} position={[0.02, -0.08, 0.42]}>
          <Pad />
        </RoundedBox>
        <mesh position={[0.02, -0.08, 0.485]}>
          <torusGeometry args={[0.2, 0.028, 12, 36]} />
          <Champagne />
        </mesh>
        <RoundedBox args={[1.2, 0.8, 0.12]} radius={0.14} smoothness={4} position={[0.02, -0.06, -0.42]}>
          <Joint />
        </RoundedBox>
        <RoundedBox args={[0.82, 0.05, 0.05]} radius={0.02} smoothness={2} position={[0.02, 0.2, -0.49]}>
          <Champagne />
        </RoundedBox>
        {[-0.26, 0.02, 0.3].map((x, i) => (
          <mesh key={x} position={[x, -0.1, -0.5]}>
            <sphereGeometry args={[0.06, 14, 14]} />
            <meshStandardMaterial color={THEME.emeraldGlow} emissive={THEME.emeraldGlow} emissiveIntensity={i === 1 ? 1.6 : 0.7} />
          </mesh>
        ))}
        <RoundedBox args={[0.7, 0.05, 0.05]} radius={0.02} smoothness={2} position={[0.02, -0.34, -0.49]}>
          <Champagne />
        </RoundedBox>
        </group>
        {/* knuckle plates */}
        {[-0.5, -0.17, 0.16, 0.47].map((x) => (
          <RoundedBox key={x} args={[0.3, 0.16, 0.5]} radius={0.06} smoothness={3} position={[x, 0.6, 0]}>
            <Joint />
          </RoundedBox>
        ))}
        {/* short wrist collar (hand only, no arm) */}
        <mesh position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.52, 0.56, 0.16, 32]} />
          <Joint />
        </mesh>
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
          <Champagne />
        </mesh>

        {/* fingers (index leads; hotspot sensor on its tip) */}
        <Finger name="index" x={-0.5} y={0.62} lens={[0.62, 0.5, 0.42]} w={0.32} d={0.34} sensor />
        <Finger name="middle" x={-0.17} y={0.64} lens={[0.68, 0.54, 0.44]} w={0.31} d={0.33} />
        <Finger name="ring" x={0.16} y={0.62} lens={[0.62, 0.5, 0.4]} w={0.3} d={0.32} />
        <Finger name="pinky" x={0.47} y={0.58} lens={[0.5, 0.4, 0.34]} w={0.27} d={0.29} />
        <Finger name="thumb" x={-0.86} y={-0.2} lens={[0.46, 0.4, 0.34]} w={0.33} d={0.34} />
      </group>
    </group>
    </group>
  );
}

export default function HandCursor3D() {
  const { size, k, tipX, tipY } = CURSOR;
  const half = size / 2;
  return (
    <Canvas
      orthographic
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ zoom: k, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: true }}
      style={{ width: size, height: size, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight color={THEME.softChampagne} intensity={2.5} position={[-3, 4, 6]} />
      <directionalLight color={THEME.champagneGold} intensity={0.8} position={[3, -2, 4]} />
      <directionalLight color={THEME.emeraldGlow} intensity={0.9} position={[4, 1, -3]} />
      <Environment resolution={32} frames={1}>
        <Lightformer form="rect" intensity={3} color={THEME.softChampagne} position={[0, 5, 2]} scale={[9, 2, 1]} />
        <Lightformer form="rect" intensity={1.8} color={THEME.softChampagne} position={[-5, 0, 3]} scale={[2, 6, 1]} />
        <Lightformer form="ring" intensity={2.5} color={THEME.champagneGold} position={[3, -2, 3]} scale={3} />
        <Lightformer form="rect" intensity={1.6} color={THEME.emeraldGlow} position={[4, 1, -2]} scale={[2, 5, 1]} />
      </Environment>
      {/* R3F aims the camera at the origin, so shift the scene to put the fingertip at (tipX, tipY) */}
      <group position={[-(half - tipX) / k, (half - tipY) / k, 0]}>
        <Hand />
      </group>
    </Canvas>
  );
}
