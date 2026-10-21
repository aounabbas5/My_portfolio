import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { certificationsData } from '../data/config';
import { Reveal } from '../motion';
import SectionHeader from './SectionHeader';

export default function Certifications() {

  if (!certificationsData.length) return null;

  return (
    <section id="certifications" className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title="Certifications" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificationsData.map((cert, i) => {
            const linkProps = cert.url ? { href: cert.url, target: '_blank', rel: 'noreferrer' } : {};
            return (
              <Reveal
                key={`${cert.title}-${i}`}
                as={cert.url ? 'a' : 'div'}
                y={24}
                delay={(i % 2) * 0.08}
                {...linkProps}
                className="panel panel-hover rounded-2xl p-6 flex items-start gap-4"
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
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
