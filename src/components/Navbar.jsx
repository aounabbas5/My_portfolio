import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { navLinks, contactData } from '../data/config';
import { travelTo } from '../lib/journey';
import ProfileBadge from './ProfileBadge';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(navLinks[0].href.slice(1));
  const lastY = useRef(0);
  const bar = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > 140 && y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 4 || y <= 140) setHidden(false);
      lastY.current = y;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      updateActive();
      // re-check once scrolling settles so the highlight is right after jumps/anchor links
      clearTimeout(settle);
      settle = setTimeout(updateActive, 140);
    };

    // The highlighted link is the last section whose top has passed the header.
    const updateActive = () => {
      let current = navLinks[0].href.slice(1);
      for (const link of navLinks) {
        const el = document.getElementById(link.href.slice(1));
        if (el && el.getBoundingClientRect().top <= 160) current = link.href.slice(1);
      }
      setActive(current);
    };

    let settle;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateActive);
    onScroll();
    return () => {
      clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateActive);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Close the menu if the screen grows past the mobile breakpoint (rotate/resize),
  // otherwise it would stay open invisibly and keep the page scroll-locked.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => e.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const go = (e, href) => {
    e.preventDefault();
    setOpen(false);
    travelTo(href);
  };

  return (
    <>
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        hidden && !open ? '-translate-y-full' : 'translate-y-0'
      } ${
        open
          ? 'bg-ink border-b border-glow/20 py-2.5'
          : scrolled
            ? 'bg-ink/70 backdrop-blur-xl border-b border-glow/20 py-2.5'
            : 'py-5'
      }`}
    >
      <div
        className="max-w-6xl mx-auto px-6 flex items-center justify-between"
        style={{ paddingLeft: 'max(1.5rem, env(safe-area-inset-left))', paddingRight: 'max(1.5rem, env(safe-area-inset-right))' }}
      >
        <ProfileBadge />

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = active === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => go(e, link.href)}
                aria-current={isActive ? 'true' : undefined}
                className={`relative min-h-11 inline-flex items-center px-4 text-sm font-medium transition-colors ${
                  isActive ? 'text-champagne' : 'text-muted hover:text-champagne'
                }`}
              >
                {link.label}
                <span
                  className={`absolute left-4 right-4 bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-glow to-gold transition-transform duration-300 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </a>
            );
          })}
          {contactData.resume && (
            <a href={contactData.resume} download className="btn-secondary !min-h-11 !py-2 ml-3 text-sm">
              Resume
            </a>
          )}
        </nav>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="clay-sm clay-press md:hidden w-11 h-11 flex items-center justify-center text-champagne"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* scroll progress */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-glow/10" aria-hidden="true">
        <div
          ref={bar}
          className="h-full origin-left bg-gradient-to-r from-glow to-gold"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

    </header>

    {/*
      The mobile menu lives OUTSIDE the header on purpose. The header has a
      transform and a backdrop blur, and a `position: fixed` child of such an
      element is sized to the header instead of the screen, which made the menu
      collapse to zero height and the links spill over the page content.
    */}
    {open && (
      <nav
        id="mobile-menu"
        aria-label="Mobile"
        className="md:hidden fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-ink pt-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 90% 45% at 50% 0%, var(--emerald-glow), transparent 70%)',
        }}
      >
        <div
          className="min-h-full flex flex-col justify-center px-6 pb-10"
          style={{ paddingLeft: 'max(1.5rem, env(safe-area-inset-left))', paddingRight: 'max(1.5rem, env(safe-area-inset-right))' }}
        >
          <div className="mx-auto w-full max-w-sm flex flex-col gap-2 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => go(e, link.href)}
                aria-current={active === link.href.slice(1) ? 'true' : undefined}
                className={`min-h-14 flex items-center justify-center rounded-2xl text-xl font-display font-medium border transition-colors ${
                  active === link.href.slice(1)
                    ? 'border-gold/60 text-champagne bg-glow/15'
                    : 'border-transparent text-muted active:bg-white/5'
                }`}
              >
                {link.label}
              </a>
            ))}
            {contactData.resume && (
              <a href={contactData.resume} download className="btn-secondary mt-4">
                Resume
              </a>
            )}
          </div>
        </div>
      </nav>
    )}
    </>
  );
}
