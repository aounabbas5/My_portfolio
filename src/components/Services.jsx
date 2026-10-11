import React from 'react';
import { Building2, User, Rocket, RefreshCw } from 'lucide-react';
import { servicesData } from '../data/config';
import { useInView } from '../hooks/useInView';

const iconMap = {
  Building2,
  User,
  Rocket,
  RefreshCw,
};

export default function Services() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section id="services" ref={ref} className="py-24 px-6 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ease-out ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-sm uppercase tracking-widest text-[#6366f1] mb-4 font-semibold">
            Services
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f5] mb-4">
            {servicesData.headline}
          </h2>
          <p className="text-[#8a8a9a] text-base md:text-lg leading-relaxed">
            {servicesData.description}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {servicesData.services.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Building2;

            return (
              <div
                key={service.title}
                style={{
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, border-color 0.3s ease-out, box-shadow 0.3s ease-out',
                  transitionDelay: `${index * 100}ms`,
                }}
                className={`group relative bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 flex flex-col hover:border-[#6366f1]/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#6366f1]/10 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-[#1a1a24] flex items-center justify-center mb-6 text-[#8a8a9a] group-hover:text-[#6366f1] transition-colors duration-300">
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-semibold text-[#f0f0f5] mb-3 group-hover:text-white transition-colors duration-200">
                  {service.title}
                </h3>
                <p className="text-[#8a8a9a] text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div
          className={`text-center transition-all duration-700 delay-500 ease-out ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <a
            href="#contact"
            className="btn-primary inline-flex"
          >
            <span>Discuss Your Project</span>
          </a>
        </div>
      </div>
    </section>
  );
}
