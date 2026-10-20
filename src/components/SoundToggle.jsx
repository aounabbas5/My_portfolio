import React, { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { armSound, setSoundEnabled, uiClick, uiHover, useSoundEnabled } from '../lib/sound';

const INTERACTIVE = 'a, button, [role="button"]';

/**
 * Sound on/off. Sits above the intro so sound can be enabled while the portal plays, and also
 * wires the quiet UI ticks (hover / click) that only make a noise while sound is on.
 */
export default function SoundToggle() {
  const on = useSoundEnabled();

  useEffect(() => {
    armSound();
    const down = (e) => e.target.closest?.(INTERACTIVE) && uiClick();
    const over = (e) => e.pointerType === 'mouse' && e.target.closest?.(INTERACTIVE) && uiHover();
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerover', over, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerover', over, true);
    };
  }, []);

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      onClick={() => setSoundEnabled(!on)}
      className={`sound-toggle clay-sm clay-press ${on ? 'is-on' : ''}`}
    >
      {on ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      <span className="hud-label !text-[10px] hidden sm:inline">{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}
