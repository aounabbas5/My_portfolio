import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { THEME } from '../../theme';

const { damp, clamp } = THREE.MathUtils;

/** Matte, slightly sheened "clay" surface. */
function Clay({ color }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.78}
      metalness={0}
      sheen={0.35}
      sheenRoughness={0.55}
      sheenColor={THEME.softChampagne}
      clearcoat={0.12}
      clearcoatRoughness={0.6}
    />
  );
}

/** Brushed champagne accent (soft metal, still matte). */
function Gold() {
  return <meshPhysicalMaterial color={THEME.champagneGold} roughness={0.42} metalness={0.55} envMapIntensity={1} />;
}

/**
 * Friendly clay robot. The head, eyes and pupils are driven separately:
 * pupils react fastest, the head follows more slowly, so the gaze feels natural.
 * With no pointer (touch, or before the first move) it wanders on its own.
 */
export default function Robot({ input }) {
  const root = useRef();
  const head = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const pupilL = useRef();
  const pupilR = useRef();
  const antenna = useRef();
  const armL = useRef();
  const armR = useRef();
  const shadow = useRef();
  const state = useRef({
    gaze: { x: 0, y: 0 },
    eye: { x: 0, y: 0 },
    blink: { active: false, start: 0, next: 2.2, double: false },
    tmp: new THREE.Vector3(),
  });

  useFrame((fx, dt) => {
    const s = state.current;
    const t = fx.clock.elapsedTime;
    const { camera, size } = fx;
    const g = root.current;
    const desktop = size.width >= 900;

    // ---- placement in the hero (right on desktop, above the text on mobile)
    const unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / size.height;
    const scale = desktop ? 0.85 : 0.44;
    const baseY = (desktop ? -0.1 : 1.95) + input.current.scrollY * unitsPerPx;
    g.position.x = damp(g.position.x, desktop ? 2.55 : 0, 3, dt);
    g.position.y = baseY + Math.sin(t * 1.15) * 0.1 * scale; // gentle float
    g.scale.setScalar(damp(g.scale.x, scale, 3, dt));
    g.rotation.z = Math.sin(t * 0.8) * 0.02;
    g.visible = input.current.scrollY < size.height * 1.5;

    // ---- gaze target: cursor relative to the robot, in screen space
    head.current.getWorldPosition(s.tmp);
    s.tmp.project(camera);
    const { x, y, moved, lastMove, coarse } = input.current;
    const live = moved && (!coarse || performance.now() - lastMove < 2500);
    const tx = live ? clamp((x - s.tmp.x) * 1.1, -1, 1) : Math.sin(t * 0.5) * 0.55;
    const ty = live ? clamp((y - s.tmp.y) * 1.1, -1, 1) : Math.sin(t * 0.37 + 1) * 0.28;

    s.gaze.x = damp(s.gaze.x, tx, 3.2, dt); // head: slower
    s.gaze.y = damp(s.gaze.y, ty, 3.2, dt);
    s.eye.x = damp(s.eye.x, tx, 8, dt); // eyes: quicker
    s.eye.y = damp(s.eye.y, ty, 8, dt);

    // ---- head: limited, smooth rotation + idle sway
    head.current.rotation.y = damp(head.current.rotation.y, s.gaze.x * 0.36 + Math.sin(t * 0.6) * 0.04, 6, dt);
    head.current.rotation.x = damp(head.current.rotation.x, -s.gaze.y * 0.2 + Math.sin(t * 0.9) * 0.02, 6, dt);
    head.current.rotation.z = Math.sin(t * 0.7) * 0.03 - s.gaze.x * 0.03;

    // ---- pupils slide inside the eyes
    const px = s.eye.x * 0.075;
    const py = s.eye.y * 0.065;
    pupilL.current.position.set(px, py, 0.085);
    pupilR.current.position.set(px, py, 0.085);

    // ---- blinking (sometimes twice)
    const b = s.blink;
    let open = 1;
    if (!b.active && t > b.next) {
      b.active = true;
      b.start = t;
    }
    if (b.active) {
      const p = (t - b.start) / 0.17;
      if (p >= 1) {
        b.active = false;
        b.next = b.double ? t + 0.12 : t + 2.4 + Math.random() * 3.4;
        b.double = !b.double && Math.random() < 0.18;
      } else {
        open = 1 - Math.sin(p * Math.PI) * 0.92;
      }
    }
    eyeL.current.scale.y = open;
    eyeR.current.scale.y = open;

    // ---- idle: antenna wobble, arms sway, shadow breathes
    antenna.current.rotation.z = Math.sin(t * 1.6) * 0.12 - s.gaze.x * 0.08;
    armL.current.rotation.z = 0.14 + Math.sin(t * 1.15 + 1) * 0.06;
    armR.current.rotation.z = -0.14 - Math.sin(t * 1.15) * 0.06;
    shadow.current.scale.setScalar(1 - Math.sin(t * 1.15) * 0.05);
  });

  return (
    <group ref={root}>
      {/* soft contact shadow + floor ring */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.15, 0]}>
        <circleGeometry args={[1.15, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.14, 0]}>
        <torusGeometry args={[1.45, 0.012, 8, 80]} />
        <meshBasicMaterial color={THEME.champagneGold} transparent opacity={0.4} />
      </mesh>

      {/* body */}
      <RoundedBox args={[1.6, 1.35, 1.2]} radius={0.52} smoothness={6} position={[0, -0.95, 0]}>
        <Clay color={THEME.emeraldClay} />
      </RoundedBox>
      {/* chest panel with status lights */}
      <RoundedBox args={[0.92, 0.5, 0.14]} radius={0.12} smoothness={4} position={[0, -0.9, 0.58]}>
        <Clay color={THEME.deepForest} />
      </RoundedBox>
      {[-0.2, 0, 0.2].map((x, i) => (
        <mesh key={x} position={[x, -0.9, 0.67]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial
            color={THEME.champagneGold}
            emissive={THEME.champagneGold}
            emissiveIntensity={i === 1 ? 1.1 : 0.45}
            roughness={0.5}
          />
        </mesh>
      ))}
      {/* neck */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.3, 24]} />
        <Clay color={THEME.deepForest} />
      </mesh>

      {/* arms */}
      <group ref={armL} position={[-1.0, -0.62, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <capsuleGeometry args={[0.17, 0.42, 8, 16]} />
          <Clay color={THEME.emeraldClay} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <sphereGeometry args={[0.2, 24, 24]} />
          <Gold />
        </mesh>
      </group>
      <group ref={armR} position={[1.0, -0.62, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <capsuleGeometry args={[0.17, 0.42, 8, 16]} />
          <Clay color={THEME.emeraldClay} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <sphereGeometry args={[0.2, 24, 24]} />
          <Gold />
        </mesh>
      </group>

      {/* head (pivot at the neck) */}
      <group ref={head} position={[0, 0.02, 0]}>
        <RoundedBox args={[2.25, 1.8, 1.75]} radius={0.55} smoothness={6} position={[0, 0.6, 0]}>
          <Clay color={THEME.emeraldClayLight} />
        </RoundedBox>

        {/* dark glass face screen */}
        <RoundedBox args={[1.6, 1.0, 0.24]} radius={0.34} smoothness={5} position={[0, 0.6, 0.72]}>
          <meshPhysicalMaterial color="#0A2B22" emissive="#06201a" emissiveIntensity={0.5} roughness={0.3} metalness={0.1} clearcoat={0.8} />
        </RoundedBox>

        {/* eyes: sclera + pupil + highlight */}
        {[
          { ref: eyeL, pupil: pupilL, x: -0.4 },
          { ref: eyeR, pupil: pupilR, x: 0.4 },
        ].map((e) => (
          <group key={e.x} ref={e.ref} position={[e.x, 0.66, 0.92]}>
            <mesh scale={[1, 1.1, 0.5]}>
              <sphereGeometry args={[0.19, 32, 32]} />
              <meshStandardMaterial
                color={THEME.softChampagne}
                emissive={THEME.softChampagne}
                emissiveIntensity={0.35}
                roughness={0.6}
              />
            </mesh>
            <group ref={e.pupil} position={[0, 0, 0.085]}>
              <mesh scale={[1, 1, 0.55]}>
                <sphereGeometry args={[0.098, 24, 24]} />
                <meshStandardMaterial color={THEME.midnightInk} roughness={0.35} />
              </mesh>
              <mesh position={[0.035, 0.04, 0.045]}>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          </group>
        ))}

        {/* small friendly smile */}
        <mesh position={[0, 0.3, 0.9]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.15, 0.02, 10, 28, Math.PI]} />
          <Gold />
        </mesh>

        {/* ear pods */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 1.18, 0.6, 0]}>
            <mesh scale={[0.5, 1, 1]}>
              <sphereGeometry args={[0.3, 28, 28]} />
              <Gold />
            </mesh>
            <mesh position={[side * 0.08, 0, 0]} scale={[0.4, 0.75, 0.75]}>
              <sphereGeometry args={[0.2, 24, 24]} />
              <Clay color={THEME.deepForest} />
            </mesh>
          </group>
        ))}

        {/* antenna */}
        <group ref={antenna} position={[0, 1.46, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.4, 12]} />
            <Clay color={THEME.darkSage} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshPhysicalMaterial
              color={THEME.champagneGold}
              emissive={THEME.champagneGold}
              emissiveIntensity={0.35}
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
