import React from 'react';
import { Download, Presentation, FlaskConical } from 'lucide-react';
import { aboutData, skillsData, contactData, educationData } from '../data/config';
import { useInView } from '../hooks/useInView';
import { addRipple } from '../hooks/ripple';
import SectionHeader from './SectionHeader';
import Tilt from './Tilt';

const roleIcons = [Presentation, FlaskConical];

const learning = [
  ...skillsData.categories.flatMap((c) => c.skills).filter((s) => s.level === 'learning').map((s) => s.name),
  ...aboutData.learning,
];

export default function About() {
  const [ref, isInView] = useInView({ threshold: 0.12 });
  const edu = educationData[0];

  return (
    <section id="about" ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader title="About Me" isInView={isInView} />

        <div
          className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 transition-all duration-700 delay-100 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Tilt max={4} className="panel rounded-2xl p-7 md:p-10 lg:col-span-3 flex flex-col">
            <h3 className="font-display text-2xl font-semibold text-champagne mb-5">{aboutData.heading}</h3>
            <div className="space-y-4 text-muted text-base md:text-lg leading-relaxed">
              {aboutData.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="mt-auto pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {edu && (
                <div className="clay-sm p-4">
                  <div className="hud-label !text-[10px]">Studying</div>
                  <div className="mt-1 text-sm font-semibold text-champagne">{edu.degree}</div>
                  <div className="text-sm text-muted">{edu.school}</div>
                </div>
              )}
              <div className="clay-sm p-4">
                <div className="hud-label !text-[10px]">Focus</div>
                <div className="mt-1 text-sm font-semibold text-champagne">{aboutData.focus}</div>
                <div className="text-sm text-muted">Open to freelance work</div>
              </div>
            </div>

            {contactData.resume && (
              <a href={contactData.resume} download onPointerDown={addRipple} className="btn-primary mt-6 self-start">
                <Download className="w-4 h-4" />
                <span>Download Resume</span>
              </a>
            )}
          </Tilt>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <Tilt max={6} className="panel rounded-2xl p-7 flex-1">
              <h3 className="font-display text-xl font-semibold text-champagne mb-4">Experience</h3>
              <ul className="flex flex-col gap-3">
                {aboutData.experience.map((role, i) => {
                  const Icon = roleIcons[i % roleIcons.length];
                  return (
                    <li key={role} className="flex items-center gap-3">
                      <span className="clay-sm w-10 h-10 flex items-center justify-center text-gold shrink-0">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-champagne font-medium">{role}</span>
                    </li>
                  );
                })}
              </ul>
            </Tilt>

            {learning.length > 0 && (
              <Tilt max={6} className="panel rounded-2xl p-7 flex-1">
                <h3 className="font-display text-xl font-semibold text-champagne mb-4">Currently Learning</h3>
                <ul className="flex flex-wrap gap-2">
                  {learning.map((name) => (
                    <li
                      key={name}
                      className="clay-chip clay-chip-gold text-sm px-3.5 py-1.5"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </Tilt>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
