import React, { useRef } from 'react';

/**
 * Pointer-driven 3D tilt with a moving light glare.
 * Writes CSS variables directly (no React re-renders), so it stays smooth.
 * Disabled for touch/coarse pointers; the card remains fully usable.
 */
export default function Tilt({ as: Tag = 'div', max = 8, className = '', children, ...rest }) {
  const ref = useRef(null);

  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`);
    el.style.setProperty('--rx', `${-(py - 0.5) * 2 * max}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
    el.classList.add('is-active');
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.classList.remove('is-active');
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`tilt ${className}`}
      {...rest}
    >
      {children}
      <span className="tilt-glare" aria-hidden="true" />
    </Tag>
  );
}
