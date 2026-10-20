import React, { useEffect, useRef } from 'react';
import { getCapabilities } from '../hooks/useCapabilities';
import { THEME } from '../theme';
import { TRAVEL_EVENT, WORLDS } from '../lib/journey';
import { warpWhoosh } from '../lib/sound';

/**
 * Section-to-section travel. A 2D canvas draws a short, destination-specific effect
 * over the page (tunnel streaks, a neural constellation, shattered geometry or
 * expanding gateway rings). The scroll jumps while the screen is fully covered, so the
 * visitor never sees the page rush past. The overlay never takes pointer events.
 *
 * Reduced motion: no effect, just the browser's normal anchor behaviour.
 */

const DURATION = 950;
const hex = (h, a) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const GOLD = THEME.champagneGold;
const EMERALD = '#3fd9a0';
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeIn = (x) => x * x * x;
const easeOut = (x) => 1 - (1 - x) ** 3;

function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed random pools, built once, so every frame is cheap and effects don't flicker. */
function makePools() {
  const r = rng(99);
  return {
    streaks: Array.from({ length: 150 }, () => ({ a: r() * Math.PI * 2, off: r(), sp: 0.7 + r() * 0.8, gold: r() > 0.78 })),
    nodes: Array.from({ length: 56 }, () => ({ x: r(), y: r(), s: 0.6 + r() * 1.4, ph: r() * 6.28, dx: r() - 0.5, dy: r() - 0.5 })),
    shards: Array.from({ length: 34 }, () => ({
      a: r() * Math.PI * 2,
      d: 0.5 + r() * 0.7,
      size: 14 + r() * 46,
      rot: (r() - 0.5) * 5,
      sides: r() > 0.5 ? 3 : 4,
      gold: r() > 0.6,
      fill: r() > 0.7,
    })),
  };
}

/* Every effect gets: ctx, w, h, p (0..1 total), c (cover 0..1, peaks mid-way) */

function fxTunnel(ctx, w, h, p, c, pools) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy) * 1.05;
  ctx.lineCap = 'round';
  for (const s of pools.streaks) {
    const head = ((p * 1.5 * s.sp + s.off) % 1) ** 2.4 * maxR;
    const len = (14 + 190 * c) * (0.4 + s.sp * 0.6);
    const tail = Math.max(0, head - len);
    const cos = Math.cos(s.a);
    const sin = Math.sin(s.a);
    ctx.strokeStyle = s.gold ? hex(GOLD, 0.85 * c) : hex(EMERALD, 0.75 * c);
    ctx.lineWidth = 1 + (head / maxR) * 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + cos * tail, cy + sin * tail);
    ctx.lineTo(cx + cos * head, cy + sin * head);
    ctx.stroke();
  }
  // ring pulse + inner glow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6);
  g.addColorStop(0, hex('#f3e9d2', 0.5 * c * c));
  g.addColorStop(0.25, hex(EMERALD, 0.22 * c));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = hex(GOLD, 0.6 * (1 - p));
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, p * maxR * 1.1, 0, Math.PI * 2);
  ctx.stroke();
}

function fxNeural(ctx, w, h, p, c, pools) {
  const t = p * 6;
  const reach = Math.min(w, h) * 0.34;
  const pts = pools.nodes.map((n) => {
    // nodes drift outward on the way out, as the network dissolves
    const out = p > 0.5 ? easeIn((p - 0.5) * 2) * 90 : 0;
    return {
      x: n.x * w + n.dx * out * 2 + Math.sin(t + n.ph) * 6,
      y: n.y * h + n.dy * out * 2 + Math.cos(t * 0.8 + n.ph) * 6,
      s: n.s,
      ph: n.ph,
    };
  });
  ctx.lineWidth = 1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < reach) {
        const a = (1 - d / reach) * c * 0.85;
        ctx.strokeStyle = (i + j) % 5 === 0 ? hex(GOLD, a) : hex(EMERALD, a);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  for (const n of pts) {
    const tw = 0.6 + 0.4 * Math.sin(t * 2 + n.ph);
    ctx.fillStyle = hex(GOLD, c * tw);
    ctx.beginPath();
    ctx.arc(n.x, n.y, 1.6 + n.s * 1.8 * c, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fxShards(ctx, w, h, p, c, pools) {
  const cx = w / 2;
  const cy = h / 2;
  const far = Math.hypot(cx, cy) * 1.15;
  ctx.lineWidth = 1.5;
  for (const s of pools.shards) {
    // in: converge from beyond the edges; out: burst back outward
    const k = p < 0.5 ? 1 - easeOut(p * 2) : easeIn((p - 0.5) * 2);
    const dist = (p < 0.5 ? k : k * 1.35) * far * s.d;
    const x = cx + Math.cos(s.a + p * s.rot) * dist;
    const y = cy + Math.sin(s.a + p * s.rot) * dist;
    const size = s.size * (0.5 + c * 0.9);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p * s.rot * 3 + s.a);
    ctx.beginPath();
    for (let i = 0; i < s.sides; i++) {
      const ang = (i / s.sides) * Math.PI * 2;
      const px = Math.cos(ang) * size;
      const py = Math.sin(ang) * size;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = s.gold ? hex(GOLD, 0.9 * c) : hex(EMERALD, 0.85 * c);
    ctx.stroke();
    if (s.fill) {
      ctx.fillStyle = s.gold ? hex(GOLD, 0.12 * c) : hex(EMERALD, 0.14 * c);
      ctx.fill();
    }
    ctx.restore();
  }
}

function fxRipple(ctx, w, h, p, c) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);
  for (let i = 0; i < 6; i++) {
    const k = clamp01(p * 1.5 - i * 0.07);
    if (k <= 0 || k >= 1) continue;
    ctx.strokeStyle = i % 2 ? hex(EMERALD, 0.7 * (1 - k)) : hex(GOLD, 0.85 * (1 - k));
    ctx.lineWidth = 3.5 - i * 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, easeOut(k) * maxR, 0, Math.PI * 2);
    ctx.stroke();
  }
  // a small gateway that spins up at the centre
  const gr = Math.min(w, h) * 0.12 * (0.4 + c * 0.8);
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(p * (i % 2 ? -4 : 4) + i);
    ctx.strokeStyle = i === 1 ? hex(EMERALD, 0.9 * c) : hex(GOLD, 0.9 * c);
    ctx.lineWidth = 2;
    ctx.setLineDash([gr * 0.5, gr * 0.28]);
    ctx.beginPath();
    ctx.arc(0, 0, gr * (1 + i * 0.28), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.setLineDash([]);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr * 1.6);
  g.addColorStop(0, hex('#f3e9d2', 0.55 * c));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - gr * 2, cy - gr * 2, gr * 4, gr * 4);
}

const FX = { tunnel: fxTunnel, neural: fxNeural, shards: fxShards, ripple: fxRipple };

export default function WarpTransition() {
  const canvasRef = useRef(null);
  const labelRef = useRef(null);
  const nameRef = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { reduced, mobile } = getCapabilities();
    const pools = makePools();
    let raf = 0;
    let size = { w: 0, h: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      size = { w: window.innerWidth, h: window.innerHeight };
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const land = (hash) => {
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (window.location.hash !== hash) window.history.pushState(null, '', hash);
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    };

    const travel = (hash) => {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      // Reduced motion, or already mid-flight: just go.
      if (reduced || busy.current) {
        if (reduced) el.scrollIntoView({ behavior: 'auto', block: 'start' });
        else land(hash);
        if (reduced && window.location.hash !== hash) window.history.pushState(null, '', hash);
        return;
      }

      const world = WORLDS[id] ?? WORLDS.home;
      const fx = FX[world.fx];
      busy.current = true;
      warpWhoosh();
      resize();
      canvas.style.display = 'block';
      nameRef.current.textContent = world.name;
      const dur = mobile ? DURATION * 0.85 : DURATION;
      const start = performance.now();
      let landed = false;

      const frame = (now) => {
        const p = clamp01((now - start) / dur);
        // covers the screen fully around the midpoint, so the jump is never seen
        const c = Math.sin(Math.PI * p) ** 0.7;
        const { w, h } = size;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(7,13,10,${Math.min(1, c * 1.15) * 0.97})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        fx(ctx, w, h, p, c, pools);
        ctx.globalCompositeOperation = 'source-over';

        const lc = clamp01((c - 0.55) / 0.35);
        labelRef.current.style.opacity = String(lc);
        labelRef.current.style.transform = `translateY(${(1 - lc) * 10}px) scale(${0.96 + lc * 0.04})`;

        if (!landed && p >= 0.5) {
          landed = true;
          land(hash);
        }
        if (p < 1) {
          raf = requestAnimationFrame(frame);
        } else {
          canvas.style.display = 'none';
          labelRef.current.style.opacity = '0';
          busy.current = false;
        }
      };
      raf = requestAnimationFrame(frame);
    };

    const onTravel = (e) => travel(e.detail.hash);

    // Any in-page link (hero buttons, footer…) travels too, unless modified or the skip link.
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href^="#"]');
      if (!a || a.classList.contains('sr-only-skip') || a.target === '_blank') return;
      const hash = a.getAttribute('href');
      if (hash.length < 2 || !document.getElementById(hash.slice(1))) return;
      e.preventDefault();
      travel(hash);
    };

    window.addEventListener(TRAVEL_EVENT, onTravel);
    document.addEventListener('click', onClick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      busy.current = false;
      window.removeEventListener(TRAVEL_EVENT, onTravel);
      document.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="warp" aria-hidden="true">
      <canvas ref={canvasRef} className="warp-canvas" style={{ display: 'none' }} />
      <div ref={labelRef} className="warp-label" style={{ opacity: 0 }}>
        <span className="hud-label">Entering</span>
        <span ref={nameRef} className="warp-name" />
      </div>
    </div>
  );
}
