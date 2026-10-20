import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { THEME } from '../../theme';

const GLYPHS = ['</>', '{ }', '01', 'AI', 'λ', 'git', '#!', '&&'];

/** A small glass-look "tag" with a code glyph, drawn once to a canvas (no font download). */
function makeTexture(text) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(8, 40, 31, 0.9)';
  g.strokeStyle = 'rgba(231, 211, 161, 0.85)';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(8, 24, 112, 80, 20);
  g.fill();
  g.stroke();
  g.fillStyle = THEME.champagneGold;
  g.font = '700 44px "JetBrains Mono", ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Code glyphs orbiting the robot on a tilted ring: front ones are bright, the ones passing
 * behind fade, so the ring reads as real depth around the character.
 */
export default function TechGlyphs({ radius = 2.35 }) {
  const group = useRef();
  const items = useMemo(
    () =>
      GLYPHS.map((text, i) => ({
        tex: makeTexture(text),
        a: (i / GLYPHS.length) * Math.PI * 2,
        bob: i * 1.3,
        speed: 0.22 + (i % 3) * 0.03,
      })),
    []
  );

  useFrame((fx) => {
    const t = fx.clock.elapsedTime;
    group.current.children.forEach((sprite, i) => {
      const it = items[i];
      const a = it.a + t * it.speed;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius * 0.7;
      sprite.position.set(x, -0.45 + Math.sin(t * 0.9 + it.bob) * 0.16 - z * 0.14, z);
      const depth = (z / (radius * 0.7) + 1) / 2; // 0 behind … 1 in front
      sprite.material.opacity = 0.25 + depth * 0.75;
      sprite.scale.setScalar(0.45 + depth * 0.25);
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <sprite key={i}>
          <spriteMaterial map={it.tex} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}
