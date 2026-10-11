import React from 'react';
import { GraduationCap } from 'lucide-react';
import { educationData } from '../data/config';
import { useInView } from '../hooks/useInView';
import SectionHeader from './SectionHeader';

export default function Education() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  if (!educationData.length) return null;

  return (
    <section id="education" ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeader title="Education" isInView={isInView} />

        <div className="space-y-6">
          {educationData.map((item, i) => (
            <div
              key={`${item.degree}-${i}`}
              style={{ transitionDelay: `${i * 100}ms` }}
              className={`panel rounded-2xl p-7 flex items-start gap-4 transition-all duration-700 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="clay-sm w-12 h-12 flex items-center justify-center text-gold shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-champagne">{item.degree}</h3>
                <p className="text-sm text-muted">{item.school}</p>
                {item.period && <p className="text-sm text-gold mt-1">{item.period}</p>}
                {item.note && <p className="text-sm text-muted mt-2">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
