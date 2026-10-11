import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { heroData } from '../data/config';
import { useInView } from '../hooks/useInView';

const Hero = () => {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const { clientX, clientY, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((clientY - rect.top) / rect.height - 0.5) * -20;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => setMousePos({ x: 0, y: 0 });

  return (
    <section
      id="hero"
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center py-24 px-6 overflow-hidden bg-[#0a0a0f] text-[#f0f0f5]"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#6366f1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 translate-y-1/4 w-[30rem] h-[30rem] bg-[#8b5cf6]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6">
          {/* Availability Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md transition-all duration-700 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-300 tracking-wide">
              {heroData.availability}
            </span>
          </div>

          {/* Label Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 backdrop-blur-sm transition-all duration-700 delay-100 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6366f1]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">
              {heroData.label}
            </span>
          </div>

          {/* Headings */}
          <div
            className={`space-y-3 transition-all duration-700 delay-200 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#f0f0f5]">
              {heroData.greeting}
            </h1>
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight gradient-text">
              {heroData.headline}
            </h2>
          </div>

          {/* Description */}
          <p
            className={`text-lg text-[#8a8a9a] leading-relaxed max-w-xl transition-all duration-700 delay-300 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {heroData.description}
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap items-center gap-4 pt-2 transition-all duration-700 delay-[400ms] ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <a href={heroData.cta.primary.href} className="btn-primary">
              <span>{heroData.cta.primary.text}</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
            </a>
            <a href={heroData.cta.secondary.href} className="btn-secondary">
              <span>{heroData.cta.secondary.text}</span>
            </a>
          </div>
        </div>

        {/* Right 3D Visual */}
        <div
          className={`lg:col-span-5 hidden md:flex items-center justify-center relative min-h-[360px] md:min-h-[440px] transition-all duration-1000 delay-300 ease-out ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="hero-3d-container">
            {/* Glow Orb */}
            <div className="hero-glow" />

            {/* Mouse parallax wrapper */}
            <div
              className="hero-3d-scene"
              style={{
                transform: prefersReducedMotion
                  ? 'none'
                  : `rotateY(${mousePos.x * 0.5}deg) rotateX(${mousePos.y * 0.5}deg)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              {/* Glass Panels */}
              <div className="hero-3d-panel hero-3d-panel-1">
                <div className="absolute inset-3 border border-[#6366f1]/10 rounded-xl" />
                <div className="absolute top-4 left-4 w-8 h-1 bg-gradient-to-r from-[#6366f1]/40 to-transparent rounded-full" />
                <div className="absolute top-7 left-4 w-12 h-1 bg-gradient-to-r from-[#8b5cf6]/30 to-transparent rounded-full" />
                <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-[#6366f1]/40" />
              </div>
              <div className="hero-3d-panel hero-3d-panel-2">
                <div className="absolute inset-3 border border-[#8b5cf6]/10 rounded-xl" />
                <div className="absolute top-4 right-4 w-6 h-6 border border-[#8b5cf6]/20 rounded-lg" />
              </div>
              <div className="hero-3d-panel hero-3d-panel-3">
                <div className="absolute inset-2 border border-[#6366f1]/8 rounded-lg" />
              </div>
            </div>

            {/* Floating dots */}
            <div className="hero-dot" style={{ top: '20%', left: '15%', animationDelay: '0s' }} />
            <div className="hero-dot" style={{ top: '70%', right: '20%', animationDelay: '1.5s' }} />
            <div className="hero-dot" style={{ top: '40%', right: '10%', animationDelay: '3s' }} />
            <div className="hero-dot" style={{ bottom: '15%', left: '25%', animationDelay: '2s' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
