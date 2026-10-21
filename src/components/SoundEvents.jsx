import { useEffect } from 'react';
import { initSound, playSound, SOUND_CONFIG } from '../lib/sound';

// Interface sounds are deliberately few. In-page links get the transition sound instead of a click,
// so a click is only for things that act in place: cards, downloads, external links, the menu, submit.
const CLICKABLE = 'button, a[href], [role="button"]';
const quiet = (el) => el.closest('a[href^="#"]');

/**
 * Starts the site's audio on the visitor's first gesture and wires the few interface sounds that
 * depend on pointer events. Renders nothing: there is no sound control, sound is always on.
 */
export default function SoundEvents() {
  useEffect(() => {
    initSound();
    const down = (e) => {
      const el = e.target.closest?.(CLICKABLE);
      if (el && !quiet(el)) playSound('button-click');
    };
    const over = (e) => {
      if (SOUND_CONFIG.hover && e.pointerType === 'mouse' && e.target.closest?.(CLICKABLE)) playSound('hover-accent');
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerover', over, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerover', over, true);
    };
  }, []);

  return null;
}
