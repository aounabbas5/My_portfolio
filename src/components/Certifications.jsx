import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { certificationsData, sectionNumber } from '../data/config';
import { useInView } from '../hooks/useInView';
import SectionHeader from './SectionHeader';

export default function Certifications() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  if (!certificationsData.length) return null;

  return (
    <section id="certifications" ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader index={sectionNumber('certifications')} label="Certifications" title="Certifications" isInView={isInView} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificationsData.map((cert, i) => {
            const Wrapper = cert.url ? 'a' : 'div';
            const linkProps = cert.url ? { href: cert.url, target: '_blank', rel: 'noreferrer' } : {};
            return (
              <Wrapper
                key={`${cert.title}-${i}`}
                {...linkProps}
                style={{ transitionDelay: `${i * 80}ms` }}
                className={`panel panel-hover rounded-2xl p-6 flex items-start gap-4 transition-all duration-500 ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <div className="clay-sm w-12 h-12 flex items-center justify-center text-gold shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-champagne">{cert.title}</h3>
                  <p className="text-sm text-muted">
                    {cert.issuer}
                    {cert.date ? ` | ${cert.date}` : ''}
                  </p>
                </div>
                {cert.url && <ExternalLink className="w-4 h-4 text-muted/75 shrink-0 mt-1" />}
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
