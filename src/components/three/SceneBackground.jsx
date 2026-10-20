import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { getCapabilities } from '../../hooks/useCapabilities';
import { THEME } from '../../theme';
import Robot from './Robot';
import Chips from './Chips';

// Deterministic PRNG so the scene is stable between renders.
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

const damp = THREE.MathUtils.damp;

/** Drifting star/particle field with scroll parallax. */
function Particles({ count, input }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const r = rng(7);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * 34;
      arr[i * 3 + 1] = (r() - 0.5) * 46 - 12;
      arr[i * 3 + 2] = -r() * 18 - 1;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.012;
    ref.current.position.y = damp(ref.current.position.y, input.current.scrollY * 0.0032, 4, dt);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={THEME.champagneGold} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** Scattered metallic polyhedra at different depths — parallax as you scroll. */
function FloatingShapes({ count, input }) {
  const group = useRef();
  const items = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: count }, (_, i) => ({
      pos: [(r() - 0.5) * 20, -3 - r() * 24, -5 - r() * 8],
      scale: 0.35 + r() * 0.75,
      spin: 0.05 + r() * 0.2,
      kind: i % 3,
    }));
  }, [count]);

  useFrame((_, dt) => {
    group.current.position.y = damp(group.current.position.y, input.current.scrollY * 0.0042, 4, dt);
    group.current.children.forEach((child, i) => {
      const boost = 1 + Math.abs(input.current.vel) * 0.06;
      child.rotation.x += dt * items[i].spin * boost;
      child.rotation.y += dt * items[i].spin * 1.3 * boost;
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos} scale={it.scale}>
          {it.kind === 0 && <octahedronGeometry args={[1, 0]} />}
          {it.kind === 1 && <icosahedronGeometry args={[1, 0]} />}
          {it.kind === 2 && <torusGeometry args={[1, 0.28, 12, 36]} />}
          {it.kind === 2 ? (
            <meshPhysicalMaterial
              color={THEME.champagneGold}
              metalness={0.9}
              roughness={0.3}
              clearcoat={0.6}
              envMapIntensity={1.8}
            />
          ) : (
            <meshPhysicalMaterial
              color={THEME.emeraldGlass}
              emissive={THEME.emeraldInk}
              emissiveIntensity={0.6}
              metalness={0.3}
              roughness={0.14}
              clearcoat={1}
              envMapIntensity={1.7}
              transparent
              opacity={0.55}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

/** Gentle camera sway from pointer position. */
function CameraRig({ input }) {
  useFrame((state, dt) => {
    state.camera.position.x = damp(state.camera.position.x, input.current.x * 0.35, 2.5, dt);
    state.camera.position.y = damp(state.camera.position.y, input.current.y * 0.25, 2.5, dt);
    state.camera.lookAt(0, 0, 0);

    // Scrolling fast banks the camera and stretches the lens a touch; it settles when you stop.
    input.current.vel = damp(input.current.vel, 0, 4, dt);
    const v = input.current.vel;
    state.camera.rotation.z = damp(state.camera.rotation.z, -v * 0.0016, 5, dt);
    const fov = 45 + Math.min(Math.abs(v), 90) * 0.12;
    if (Math.abs(state.camera.fov - fov) > 0.02) {
      state.camera.fov = fov;
      state.camera.updateProjectionMatrix();
    }
  });
  return null;
}

export default function SceneBackground({ paused = false }) {
  const { mobile } = getCapabilities();
  // Starts at full quality and steps down by itself if the frame rate can't keep up.
  const [lean, setLean] = useState(false);
  const input = useRef({ x: 0, y: 0, scrollY: 0, vel: 0, moved: false, lastMove: 0, coarse: getCapabilities().mobile });

  useEffect(() => {
    const onMove = (e) => {
      input.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      input.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      input.current.moved = true;
      input.current.lastMove = performance.now();
      input.current.coarse = e.pointerType === 'touch' || e.pointerType === 'pen';
    };
    const onScroll = () => {
      // smoothed scroll speed (px/event) — drives the camera roll and the shapes' spin
      const dy = window.scrollY - input.current.scrollY;
      input.current.vel = THREE.MathUtils.clamp(input.current.vel * 0.6 + dy * 0.4, -120, 120);
      input.current.scrollY = window.scrollY;
    };
    onScroll();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <Canvas
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
      frameloop={paused ? 'never' : 'always'}
      dpr={lean ? 1 : [1, mobile ? 1.25 : 1.75]}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor onDecline={() => setLean(true)} flipflops={2} />
      <ambientLight intensity={0.6} />
      <directionalLight color={THEME.softChampagne} intensity={1.8} position={[4, 5, 6]} />
      <pointLight color={THEME.emeraldGlow} intensity={28} distance={22} position={[-6, -2, 4]} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.8} color={THEME.emeraldGlow} position={[-5, 3, -2]} scale={[9, 3, 1]} />
        <Lightformer form="ring" intensity={3.5} color={THEME.champagneGold} position={[4, -2, 3]} scale={4} />
        <Lightformer form="rect" intensity={2.2} color={THEME.softChampagne} position={[0, 6, 2]} scale={[10, 1, 1]} />
      </Environment>

      <CameraRig input={input} />
      <Particles count={mobile ? 260 : 650} input={input} />
      <FloatingShapes count={mobile ? 6 : 11} input={input} />
      {!lean && <Chips count={mobile ? 2 : 4} input={input} />}
      <Robot input={input} />
    </Canvas>
  );
}
