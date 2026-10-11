import React from 'react';
import { Briefcase, Users } from 'lucide-react';
import { experienceData, leadershipData, sectionNumber } from '../data/config';
import { useInView } from '../hooks/useInView';
import SectionHeader from './SectionHeader';

export default function Experience() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  if (!experienceData.length && !leadershipData.length) return null;

  return (
    <section id="experience" ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader index={sectionNumber('experience')} label="Experience" title="Experience" isInView={isInView} />

        <div className="space-y-6">
          {experienceData.map((item, i) => (
            <div
              key={`${item.role}-${i}`}
              className={`panel rounded-2xl p-7 transition-all duration-700 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="clay-sm w-12 h-12 flex items-center justify-center text-gold shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-champagne">{item.role}</h3>
                  <p className="text-sm text-muted">
                    {item.org}
                    {item.period ? ` · ${item.period}` : ''}
                  </p>
                  {item.details && item.details.length > 0 && (
                    <ul className="mt-4 space-y-1.5 text-sm text-muted list-disc list-inside">
                      {item.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}

          {leadershipData.length > 0 && (
            <div
              className={`panel rounded-2xl p-7 transition-all duration-700 delay-100 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-gold" />
                <h3 className="text-lg font-semibold text-champagne">Volunteering &amp; Leadership</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {leadershipData.map((l) => (
                  <li key={l.title} className="flex justify-between gap-4">
                    <span>{l.title}</span>
                    {l.period && <span className="text-muted/75 shrink-0">{l.period}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
