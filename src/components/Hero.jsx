import React, { useRef } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { heroData, siteConfig } from '../data/config';
import { useTypewriter } from '../hooks/useTypewriter';
import { getCapabilities } from '../hooks/useCapabilities';
import { addRipple } from '../hooks/ripple';
import { useIntroDone } from '../lib/journey';
import { introClock, playSound } from '../lib/sound';
import { HeadingReveal, Reveal, Stagger } from '../motion';
import RobotFallback from './RobotFallback';
import TerminalCard from './TerminalCard';

export default function Hero() {
  // Hold the reveal until the portal has opened, so the hero assembles as it dissolves.
  const introDone = useIntroDone();
  const accented = useRef(false);
  // The headline has finished arriving. Only after an intro that was actually heard, so a skipped or
  // reduced-motion visit stays quiet.
  const onHeadlineDone = (variant) => {
    if (variant !== 'show' || accented.current || !introClock.sounded || introClock.skipped) return;
    accented.current = true;
    playSound('headline-accent');
  };
  const typed = useTypewriter(heroData.roles);
  const { enable3D } = getCapabilities();

  return (
    <section
      id="home"
      aria-label="Introduction"
      className="relative min-h-svh flex items-center px-6 pt-28 pb-24 sl:pt-20 sl:pb-8"
    >
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 sl:grid-cols-2 gap-10 sl:gap-6 items-center">
        <Stagger
          animate={introDone ? 'show' : 'hidden'}
          stagger={0.12}
          delay={0.1}
          className="flex flex-col items-center lg:items-start sl:items-start text-center lg:text-left sl:text-left"
        >
          {/* Mobile: room for the 3D core (or CSS emblem when 3D is off) */}
          <div className="lg:hidden sl:hidden mb-4 flex justify-center" aria-hidden="true">
            {enable3D ? (
              <div className="h-56" />
            ) : (
              <RobotFallback className="h-56 w-auto" />
            )}
          </div>

          <Reveal inherit as="p" y={14} className="hud-label mb-4 sl:mb-2">
            {heroData.greeting}
          </Reveal>

          <HeadingReveal
            as="h1"
            onAnimationComplete={onHeadlineDone}
            className="text-5xl sm:text-6xl xl:text-7xl sl:text-4xl font-bold leading-[1.05] text-gradient"
          >
            {siteConfig.name}
          </HeadingReveal>

          <Reveal
            inherit
            as="p"
            y={18}
            className="mt-6 sl:mt-3 text-xl sm:text-2xl sl:text-lg text-champagne min-h-[2rem]"
          >
            {heroData.prefix}{' '}
            <span className="font-semibold text-gold">{typed}</span>
            <span className="typing-cursor" aria-hidden="true" />
          </Reveal>

          <Reveal
            inherit
            y={22}
            className="flex flex-col sm:flex-row items-stretch gap-4 mt-10 sl:mt-5 w-full max-w-xs sm:max-w-none sm:w-auto"
          >
            <a href={heroData.cta.primary.href} onPointerDown={addRipple} className="btn-primary">
              <span>{heroData.cta.primary.text}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href={heroData.cta.secondary.href} onPointerDown={addRipple} className="btn-secondary">
              <span>{heroData.cta.secondary.text}</span>
            </a>
          </Reveal>
        </Stagger>

        {/* Desktop: the 3D core is drawn by the background canvas on this side. */}
        <div className="hidden lg:flex sl:flex justify-center items-center min-h-[22rem] sl:min-h-0" aria-hidden="true">
          {!enable3D && (
            <RobotFallback className="h-80 w-auto" />
          )}
        </div>
        {/* a little terminal under the robot, only where there is room for it */}
        <TerminalCard className="hero-terminal hidden lg:block" />
      </div>

      <a
        href="#skills"
        aria-label="Scroll down"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 min-h-11 flex sl:hidden flex-col items-center justify-center gap-1 hud-label !text-[10px] !text-muted/75 hover:!text-gold transition-colors"
      >
        Scroll
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </a>
    </section>
  );
}
