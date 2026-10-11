import React from 'react';
import { GraduationCap, Code2, TrendingUp } from 'lucide-react';
import { aboutData } from '../data/config';
import { useInView } from '../hooks/useInView';

const iconMap = {
  GraduationCap,
  Code2,
  TrendingUp,
};

const About = () => {
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section
      id="about"
      ref={ref}
      className="relative py-24 px-6 bg-[#0a0a0f] text-[#f0f0f5] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Section Heading */}
        <div
          className={`mb-12 transition-all duration-700 ease-out ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="h-0.5 w-8 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full" />
            <span className="text-sm font-semibold tracking-widest text-[#6366f1] uppercase">
              Get To Know Me
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#f0f0f5]">
            About Me
          </h2>
        </div>

        {/* Description */}
        <p
          className={`text-lg text-[#8a8a9a] leading-relaxed max-w-3xl mb-16 transition-all duration-700 delay-100 ease-out ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {aboutData.description}
        </p>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {aboutData.highlights.map((card, index) => {
            const IconComponent = iconMap[card.icon] || Code2;
            const delays = ['delay-200', 'delay-300', 'delay-[400ms]'];

            return (
              <div
                key={card.title}
                className={`group relative rounded-2xl p-6 sm:p-8 border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-2 hover:border-[#6366f1]/50 hover:bg-white/[0.05] hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.25)] ${
                  isInView
                    ? `opacity-100 translate-y-0 ${delays[index]}`
                    : 'opacity-0 translate-y-4'
                }`}
              >
                {/* Top Glow Line on Hover */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#6366f1]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#6366f1]/15 to-[#8b5cf6]/15 border border-[#6366f1]/25 text-[#6366f1] group-hover:text-[#8b5cf6] group-hover:scale-110 transition-all duration-300 mb-6">
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-semibold text-[#f0f0f5] mb-3 group-hover:text-white transition-colors duration-200">
                  {card.title}
                </h3>
                <p className="text-sm md:text-base text-[#8a8a9a] leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
