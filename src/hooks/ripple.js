/** Adds a short click ripple inside the pressed button (visual feedback). */
export function addRipple(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const dot = document.createElement('span');
  dot.className = 'ripple';
  dot.style.width = dot.style.height = `${size}px`;
  dot.style.left = `${e.clientX - rect.left - size / 2}px`;
  dot.style.top = `${e.clientY - rect.top - size / 2}px`;
  el.appendChild(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
}
