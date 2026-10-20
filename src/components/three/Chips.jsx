import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { THEME } from '../../theme';

const { damp } = THREE.MathUtils;

/** One microchip: dark package, glowing die with circuit traces, gold pins on all four sides. */
function Chip() {
  const pins = useRef();
  const die = useRef();

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < 8; k++) {
        const o = -0.72 + k * 0.206;
        const horizontal = side < 2;
        const sign = side % 2 ? 1 : -1;
        m.makeRotationY(horizontal ? 0 : Math.PI / 2);
        m.setPosition(horizontal ? o : sign * 0.9, 0, horizontal ? sign * 0.9 : o);
        pins.current.setMatrixAt(i++, m);
      }
    }
    pins.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((fx) => {
    die.current.emissiveIntensity = 0.8 + Math.sin(fx.clock.elapsedTime * 2) * 0.35;
  });

  return (
    <group>
      <RoundedBox args={[1.6, 0.16, 1.6]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color="#0c1a15" roughness={0.45} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.62, 0.03, 0.62]} />
        <meshStandardMaterial
          ref={die}
          color={THEME.champagneGold}
          emissive={THEME.champagneGold}
          emissiveIntensity={1}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* circuit traces running from the die to the edge */}
      {[-0.22, 0, 0.22].map((o) =>
        [0, 1].map((axis) => (
          <mesh
            key={`${o}-${axis}`}
            position={axis ? [o, 0.085, 0.55] : [0.55, 0.085, o]}
            scale={axis ? [0.025, 0.012, 0.5] : [0.5, 0.012, 0.025]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={THEME.emeraldGlow} toneMapped={false} />
          </mesh>
        ))
      )}
      <instancedMesh ref={pins} args={[undefined, undefined, 32]}>
        <boxGeometry args={[0.07, 0.05, 0.22]} />
        <meshStandardMaterial color={THEME.champagneGold} roughness={0.35} metalness={0.85} />
      </instancedMesh>
    </group>
  );
}

const PLACEMENTS = [
  { pos: [-5.6, -6.5, -4.5], rot: [0.9, 0.5, 0.2], s: 0.9, sp: 0.18 },
  { pos: [5.4, -14, -5.5], rot: [0.7, -0.6, 0.1], s: 1.1, sp: 0.15 },
  { pos: [-4.8, -22, -5], rot: [1, 0.3, -0.2], s: 1, sp: 0.2 },
  { pos: [5.8, -28, -6], rot: [0.8, 0.9, 0.3], s: 0.85, sp: 0.17 },
];

/** Microchips drifting down the page, parallaxing with scroll and turning as you move. */
export default function Chips({ count, input }) {
  const group = useRef();
  const list = PLACEMENTS.slice(0, count);

  useFrame((fx, dt) => {
    const t = fx.clock.elapsedTime;
    group.current.position.y = damp(group.current.position.y, input.current.scrollY * 0.0042, 4, dt);
    group.current.children.forEach((c, i) => {
      const p = list[i];
      c.rotation.set(p.rot[0] + Math.sin(t * 0.3 + i) * 0.12, p.rot[1] + t * p.sp + input.current.x * 0.3, p.rot[2]);
      c.position.y = p.pos[1] + Math.sin(t * 0.7 + i * 2) * 0.18;
    });
  });

  return (
    <group ref={group}>
      {list.map((p, i) => (
        <group key={i} position={p.pos} scale={p.s}>
          <Chip />
        </group>
      ))}
    </group>
  );
}
