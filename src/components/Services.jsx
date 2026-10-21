import React from 'react';
import { Building2, User, Rocket, RefreshCw, LayoutDashboard, ArrowRight } from 'lucide-react';
import { servicesData } from '../data/config';
import { addRipple } from '../hooks/ripple';
import { Reveal } from '../motion';
import SectionHeader from './SectionHeader';
import Tilt from './Tilt';

const iconMap = { Building2, User, Rocket, RefreshCw, LayoutDashboard };

export default function Services() {
  return (
    <section id="services" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader title={servicesData.headline} />

        <div className="flex flex-wrap justify-center gap-6">
          {servicesData.services.map((service, index) => {
            const Icon = iconMap[service.icon] || Building2;
            return (
              <Reveal
                key={service.title}
                y={28}
                delay={(index % 3) * 0.09}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                <Tilt max={9} className="panel panel-hover rounded-2xl p-7 h-full">
                  <div
                    className="clay-sm w-14 h-14 flex items-center justify-center text-gold mb-6"
                    style={{ transform: 'translateZ(40px)' }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-champagne mb-2">{service.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{service.description}</p>
                </Tilt>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="text-center mt-14">
          <a href="#contact" onPointerDown={addRipple} className="btn-primary">
            <span>Start a project</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
