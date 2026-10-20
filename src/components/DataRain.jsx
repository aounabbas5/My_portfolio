import React, { useEffect, useRef } from 'react';

const CHARS = '01{}</>=;[]()#$%&λ';
const SIZE = 16;
const EDGE = 0.16; // fraction of the width used on each side

/**
 * Faint columns of code falling down the left and right edges, like a distant data centre.
 * Drawn at ~20fps, paused when the tab is hidden, and masked so it never sits behind the content.
 */
export default function DataRain() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let cols = [];
    let w = 0;
    let h = 0;
    let last = 0;

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${SIZE}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
      const per = Math.max(2, Math.floor((w * EDGE) / (SIZE * 1.3)));
      cols = [];
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < per; i++) {
          const x = side ? w - (i + 0.5) * SIZE * 1.3 : (i + 0.5) * SIZE * 1.3;
          cols.push({
            x,
            y: Math.random() * h,
            v: 30 + Math.random() * 70,
            len: 6 + Math.floor(Math.random() * 10),
            seed: Math.random(),
          });
        }
      }
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 48) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const c of cols) {
        c.y += c.v * dt;
        if (c.y - c.len * SIZE > h) {
          c.y = 0;
          c.v = 30 + Math.random() * 70;
        }
        for (let k = 0; k < c.len; k++) {
          const y = c.y - k * SIZE;
          if (y < -SIZE || y > h) continue;
          const head = k === 0;
          // each cell keeps its glyph; only the leading one flickers
          const ch = CHARS[(Math.floor(y / SIZE) * 7 + Math.floor(c.seed * 97) + (head ? Math.floor(now / 140) : 0)) % CHARS.length];
          ctx.fillStyle = head ? 'rgba(231,211,161,0.55)' : `rgba(26,135,92,${0.28 * (1 - k / c.len)})`;
          ctx.fillText(ch, c.x, y);
        }
      }
    };

    setup();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', setup);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setup);
    };
  }, []);

  return <canvas ref={ref} className="data-rain" aria-hidden="true" />;
}
