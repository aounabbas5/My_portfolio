import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { heroData, siteConfig } from '../data/config';
import { useInView } from '../hooks/useInView';
import { useTypewriter } from '../hooks/useTypewriter';
import { getCapabilities } from '../hooks/useCapabilities';
import { addRipple } from '../hooks/ripple';
import RobotFallback from './RobotFallback';

const reveal = (isInView, delay = '') =>
  `transition-all duration-700 ease-out ${delay} ${
    isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
  }`;

export default function Hero() {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const typed = useTypewriter(heroData.roles);
  const { enable3D } = getCapabilities();

  return (
    <section
      id="home"
      ref={ref}
      aria-label="Introduction"
      className="relative min-h-screen flex items-center px-6 pt-28 pb-24"
    >
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Mobile: room for the 3D core (or CSS emblem when 3D is off) */}
          <div className="lg:hidden mb-4 flex justify-center" aria-hidden="true">
            {enable3D ? (
              <div className="h-56" />
            ) : (
              <RobotFallback className="h-56 w-auto" />
            )}
          </div>

          <p className={`hud-label mb-4 ${reveal(isInView)}`}>
            {heroData.greeting}
          </p>

          <h1 className={`text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.05] text-gradient ${reveal(isInView, 'delay-100')}`}>
            {siteConfig.name}
          </h1>

          <p className={`mt-6 text-xl sm:text-2xl text-champagne min-h-[2rem] ${reveal(isInView, 'delay-200')}`}>
            {heroData.prefix}{' '}
            <span className="font-semibold text-gold">{typed}</span>
            <span className="typing-cursor" aria-hidden="true" />
          </p>

          <div
            className={`flex flex-col sm:flex-row items-stretch gap-4 mt-10 w-full max-w-xs sm:max-w-none sm:w-auto ${reveal(isInView, 'delay-300')}`}
          >
            <a href={heroData.cta.primary.href} onPointerDown={addRipple} className="btn-primary">
              <span>{heroData.cta.primary.text}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href={heroData.cta.secondary.href} onPointerDown={addRipple} className="btn-secondary">
              <span>{heroData.cta.secondary.text}</span>
            </a>
          </div>
        </div>

        {/* Desktop: the 3D core is drawn by the background canvas on this side. */}
        <div className="hidden lg:flex justify-center items-center min-h-[22rem]" aria-hidden="true">
          {!enable3D && (
            <RobotFallback className="h-80 w-auto" />
          )}
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to About"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 min-h-11 flex flex-col items-center justify-center gap-1 hud-label !text-[10px] !text-muted/75 hover:!text-gold transition-colors"
      >
        Scroll
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </a>
    </section>
  );
}
