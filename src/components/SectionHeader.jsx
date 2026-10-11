import React from 'react';

export default function SectionHeader({ title, subtitle, isInView = true }) {
  return (
    <div
      className={`mb-12 md:mb-16 text-center transition-all duration-700 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <h2 className="text-3xl md:text-5xl font-bold text-gradient">{title}</h2>
      <div className="mx-auto mt-5 flex items-center justify-center gap-2" aria-hidden="true">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-glow" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-glow" />
      </div>
      {subtitle && <p className="mt-5 text-muted max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}
