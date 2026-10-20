import React, { useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { aboutData, contactData, heroData, siteConfig } from '../data/config';
import { travelTo } from '../lib/journey';

const monogram = siteConfig.name
  .split(' ')
  .map((w) => w[0])
  .join('')
  .slice(0, 2);

/**
 * The monogram in the navbar. Tap it to open a small profile card (name, role,
 * email and a line about you); tap outside, press Escape or pick a link to close it.
 */
export default function ProfileBadge() {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (hash) => {
    setOpen(false);
    travelTo(hash);
  };

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-label={`${siteConfig.name} — profile`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="profile-card"
        onClick={() => setOpen((v) => !v)}
        className={`clay-sm clay-press w-11 h-11 flex items-center justify-center font-display text-sm font-bold text-gold ${
          open ? 'border-gold/60' : ''
        }`}
      >
        {monogram}
      </button>

      {open && (
        <div
          id="profile-card"
          role="dialog"
          aria-label={`About ${siteConfig.name}`}
          className="profile-card panel rounded-2xl p-5 absolute left-0 top-full mt-3 w-[min(20rem,calc(100vw-3rem))]"
        >
          <div className="flex items-center gap-3">
            <span className="clay-sm w-12 h-12 shrink-0 flex items-center justify-center font-display font-bold text-gold">
              {monogram}
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-champagne leading-tight">{siteConfig.name}</p>
              <p className="text-sm text-gold">{heroData.roles[0]}</p>
            </div>
          </div>

          {contactData.email && (
            <a
              href={`mailto:${contactData.email}`}
              className="mt-4 flex items-center gap-2 min-h-11 text-sm text-champagne hover:text-gold transition-colors [overflow-wrap:anywhere]"
            >
              <Mail className="w-4 h-4 shrink-0 text-gold" />
              {contactData.email}
            </a>
          )}

          {aboutData.paragraphs[0] && (
            <p className="mt-2 text-sm text-muted leading-relaxed">{aboutData.paragraphs[0]}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => go('#about')} className="btn-secondary !min-h-11 !py-2 !px-4 text-sm flex-1">
              About me
            </button>
            <button type="button" onClick={() => go('#contact')} className="btn-primary !min-h-11 !py-2 !px-4 text-sm flex-1">
              Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
