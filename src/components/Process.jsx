import React from 'react';
import { processData } from '../data/config';
import { useInView } from '../hooks/useInView';

export default function Process() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section id="process" ref={ref} className="py-24 px-6 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-20 transition-all duration-700 ease-out ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-sm uppercase tracking-widest text-[#6366f1] mb-4 font-semibold">
            Process
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f5] mb-4">
            My Working Process
          </h2>
          <p className="text-[#8a8a9a] text-base md:text-lg leading-relaxed">
            A structured approach to deliver quality results from discovery to launch.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting gradient line on desktop */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-7 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6366f1]/20 via-[#8b5cf6]/40 to-[#6366f1]/20"
          />

          <div className="flex flex-col md:flex-row items-stretch md:items-start justify-between gap-8 md:gap-6 relative z-10">
            {processData.map((item, index) => (
              <div
                key={item.step}
                style={{
                  transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
                  transitionDelay: `${index * 150}ms`,
                }}
                className={`flex-1 flex flex-col items-start ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Step Number */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl md:text-4xl font-extrabold gradient-text font-mono tracking-tight">
                    {item.step}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]" />
                </div>

                <h3 className="text-xl font-bold text-[#f0f0f5] mb-2">
                  {item.title}
                </h3>
                <p className="text-[#8a8a9a] text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
