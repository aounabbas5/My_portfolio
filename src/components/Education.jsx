import React from 'react';
import { GraduationCap } from 'lucide-react';
import { educationData } from '../data/config';
import { Reveal } from '../motion';
import SectionHeader from './SectionHeader';

export default function Education() {

  if (!educationData.length) return null;

  return (
    <section id="education" className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <SectionHeader title="Education" />

        <div className="space-y-6">
          {educationData.map((item, i) => (
            <Reveal key={`${item.degree}-${i}`} y={28} className="panel rounded-2xl p-7 flex items-start gap-4">
              <div className="clay-sm w-12 h-12 flex items-center justify-center text-gold shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-champagne">{item.degree}</h3>
                <p className="text-sm text-muted">{item.school}</p>
                {item.period && <p className="text-sm text-gold mt-1">{item.period}</p>}
                {item.note && <p className="text-sm text-muted mt-2">{item.note}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
