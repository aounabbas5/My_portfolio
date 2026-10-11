import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Code, Terminal } from 'lucide-react';
import { skillsData, sectionNumber } from '../data/config';
import { useInView } from '../hooks/useInView';
import { getCapabilities } from '../hooks/useCapabilities';
import SectionHeader from './SectionHeader';
import SceneBoundary from './SceneBoundary';
import Tilt from './Tilt';

const SkillsOrbit = lazy(() => import('./three/SkillsOrbit'));

const allSkills = skillsData.categories.flatMap((c) => c.skills);
const icons = { Frontend: Code, Tools: Terminal };

function useOnScreen(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

export default function Skills() {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const stage = useRef(null);
  const onScreen = useOnScreen(stage);
  const { enable3D } = getCapabilities();

  return (
    <section id="skills" ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          index={sectionNumber('skills')}
          label="Skills"
          title="Skills & Technologies"
          subtitle={enable3D ? 'Hover a node to inspect it. Dashed outlines are things I am learning.' : undefined}
          isInView={isInView}
        />

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch transition-all duration-700 delay-100 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* 3D orbit (decorative; the full list is always shown beside it) */}
          {enable3D && (
            <div ref={stage} className="panel rounded-2xl h-[22rem] md:h-[28rem] overflow-hidden" aria-hidden="true">
              <SceneBoundary>
                <Suspense fallback={null}>
                  {(onScreen || isInView) && <SkillsOrbit skills={allSkills} active={onScreen} />}
                </Suspense>
              </SceneBoundary>
            </div>
          )}

          <div className={`flex flex-col gap-6 ${enable3D ? '' : 'lg:col-span-2'}`}>
            {skillsData.categories.map((cat) => {
              const Icon = icons[cat.name] || Code;
              return (
                <Tilt key={cat.name} max={5} className="panel rounded-2xl p-7 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="clay-sm w-11 h-11 flex items-center justify-center text-gold">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-champagne">{cat.name}</h3>
                  </div>
                  <ul className="flex flex-wrap gap-2.5">
                    {cat.skills.map((skill) => {
                      const isLearning = skill.level === 'learning';
                      return (
                        <li
                          key={skill.name}
                          className={`clay-chip text-sm px-4 py-2 ${isLearning ? 'clay-chip-gold' : ''}`}
                        >
                          {skill.name}
                          {isLearning && <span className="sr-only"> (learning)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </Tilt>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
