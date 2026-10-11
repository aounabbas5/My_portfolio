import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { getCapabilities } from '../../hooks/useCapabilities';
import { THEME } from '../../theme';

const RADIUS = 2.3;

function fibonacciSphere(n, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    return new THREE.Vector3(Math.cos(t) * r * radius, y * radius, Math.sin(t) * r * radius);
  });
}

/**
 * Rotating sphere of skill nodes. Labels are plain DOM elements that this
 * component repositions every frame (projected from 3D), so text stays crisp
 * and no extra React roots are created.
 */
function Orbit({ skills, labels, hovered }) {
  const group = useRef();
  const nodeRefs = useRef([]);
  const points = useMemo(() => fibonacciSphere(skills.length, RADIUS), [skills.length]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const g = group.current;
    g.rotation.y += dt * 0.22;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.5, 3, dt);

    const { width, height } = state.size;
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const isHover = hovered.current === i;
      mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, isHover ? 1.7 : 1, 8, dt));
      mesh.material.emissiveIntensity = THREE.MathUtils.damp(mesh.material.emissiveIntensity, isHover ? 1.6 : 0.5, 8, dt);

      mesh.getWorldPosition(tmp);
      const depth = THREE.MathUtils.clamp((tmp.z / RADIUS + 1) / 2, 0, 1);
      tmp.project(state.camera);
      const el = labels.current[i];
      if (el) {
        const half = el.offsetWidth / 2 + 6;
        const x = THREE.MathUtils.clamp((tmp.x * 0.5 + 0.5) * width, half, width - half);
        const y = (-tmp.y * 0.5 + 0.5) * height + 26;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        el.style.opacity = isHover ? 1 : 0.15 + depth * 0.85;
        el.style.zIndex = isHover ? 5 : Math.round(depth * 4);
      }
    });
  });

  return (
    <group ref={group}>
      {/* structural wire shell */}
      <mesh>
        <icosahedronGeometry args={[RADIUS, 2]} />
        <meshBasicMaterial color={THEME.champagneGold} wireframe transparent opacity={0.13} />
      </mesh>
      {/* champagne-metal core */}
      <mesh>
        <sphereGeometry args={[0.7, 48, 48]} />
        <meshPhysicalMaterial
          color={THEME.champagneGold}
          emissive={THEME.emeraldInk}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.25}
          clearcoat={1}
          envMapIntensity={1.8}
        />
      </mesh>
      {skills.map((skill, i) => {
        const learning = skill.level === 'learning';
        return (
          <mesh
            key={skill.name}
            ref={(m) => {
              nodeRefs.current[i] = m;
            }}
            position={points[i]}
            onPointerOver={(e) => {
              e.stopPropagation();
              hovered.current = i;
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              if (hovered.current === i) hovered.current = -1;
              document.body.style.cursor = '';
            }}
          >
            <icosahedronGeometry args={[0.21, 1]} />
            {/* confident = emerald glass, learning = champagne metal */}
            <meshPhysicalMaterial
              color={learning ? THEME.champagneGold : THEME.emeraldGlass}
              emissive={learning ? THEME.champagneGold : THEME.emeraldGlow}
              emissiveIntensity={0.5}
              metalness={learning ? 0.85 : 0.35}
              roughness={learning ? 0.3 : 0.15}
              clearcoat={1}
              envMapIntensity={1.6}
            />
          </mesh>
        );
      })}
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
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: !mobile, alpha: true }}
        style={{ touchAction: 'pan-y' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight color={THEME.softChampagne} intensity={1.6} position={[3, 4, 5]} />
        <pointLight color={THEME.emeraldGlow} intensity={22} distance={14} position={[-3, -2, 4]} />
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
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium"
            style={{
              fontFamily: 'var(--font-mono)',
              color: THEME.softChampagne,
              background: 'rgba(16,23,20,0.82)',
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
