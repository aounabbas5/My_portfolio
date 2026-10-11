import React, { useState, useCallback } from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';
import { projectsData, contactData } from '../data/config';
import { useInView } from '../hooks/useInView';
import { addRipple } from '../hooks/ripple';
import SectionHeader from './SectionHeader';
import Tilt from './Tilt';
import ProjectModal from './ProjectModal';
import { GithubIcon } from './icons';

function Preview({ project }) {
  if (project.isPlaceholder) return <Clock className="w-9 h-9 text-sage" />;
  if (project.image) {
    return (
      <img
        src={project.image}
        alt=""
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <div
      className="w-[78%] rounded-lg border border-glow/35 bg-ink/80 shadow-xl shadow-black/50 overflow-hidden transition-transform duration-500 group-hover:-translate-y-1"
      style={{ transform: 'translateZ(30px)' }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-glow/20 bg-glow/10">
        <span className="w-2 h-2 rounded-full bg-glow/60" />
        <span className="w-2 h-2 rounded-full bg-gold/60" />
        <span className="w-2 h-2 rounded-full bg-white/25" />
        <span className="ml-2 flex-1 truncate rounded bg-black/40 px-2 py-0.5 text-[10px] text-muted/75 font-mono">
          {project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.app
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div className="h-2 w-2/5 rounded bg-glow" />
        <div className="h-1.5 w-full rounded bg-white/10" />
        <div className="h-1.5 w-4/5 rounded bg-white/10" />
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="h-7 rounded bg-glow/25" />
          <div className="h-7 rounded bg-gold/20" />
          <div className="h-7 rounded bg-glow/25" />
        </div>
      </div>
    </div>
  );
}

function Card({ project, index, isInView, onOpen }) {
  const placeholder = Boolean(project.isPlaceholder);

  const body = (
    <>
      <div
        className="clay-inset relative h-44 m-3 mb-0 rounded-[1.25rem] flex items-center justify-center overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Preview project={project} />
        <span className="absolute top-3.5 left-4 hud-label !text-[10px]">
          {String(index + 1).padStart(2, '0')}
        </span>
        {placeholder && (
          <span className="absolute top-3 right-4 hud-label !text-[10px] !text-muted/75 border border-sage rounded px-2 py-0.5">
            Coming soon
          </span>
        )}
        {project.current && (
          <span className="absolute top-3 right-4 hud-label !text-[10px] !text-gold border border-gold/40 rounded px-2 py-0.5">
            Current
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6 text-left">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className={`font-display text-xl font-semibold ${placeholder ? 'text-muted/75' : 'text-champagne'}`}>
            {project.title}
          </h3>
          {project.date && <span className="hud-label !text-[10px] mt-1.5">{project.date}</span>}
        </div>
        <p className="text-sm text-muted leading-relaxed">{project.description}</p>

        {project.technologies?.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-5">
            {project.technologies.map((tag) => (
              <li key={tag} className="clay-chip text-xs px-2.5 py-1">
                {tag}
              </li>
            ))}
          </ul>
        )}

        {!placeholder && (
          <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gold group-hover:gap-3 transition-all">
            View details <ArrowUpRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </>
  );

  const delay = { transitionDelay: `${index * 100}ms` };
  const reveal = isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8';

  if (placeholder) {
    return (
      <div
        style={delay}
        className={`flex flex-col rounded-2xl overflow-hidden border border-dashed border-glow/25 bg-white/[0.015] transition-all duration-700 ${reveal}`}
      >
        {body}
      </div>
    );
  }

  return (
    <div style={delay} className={`transition-all duration-700 ${reveal}`}>
      <Tilt
        as="button"
        type="button"
        max={7}
        onClick={() => onOpen(project)}
        onPointerDown={addRipple}
        aria-haspopup="dialog"
        aria-label={`Open details for ${project.title}`}
        className="group clay-card flex flex-col w-full h-full overflow-hidden cursor-pointer text-left"
      >
        {body}
      </Tilt>
    </div>
  );
}

export default function Projects() {
  const [ref, isInView] = useInView({ threshold: 0.08 });
  const [selected, setSelected] = useState(null);
  const close = useCallback(() => setSelected(null), []);
  const githubIsReal = contactData.github && !contactData.github.includes('your-username');

  return (
    <section id="projects" ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title="Featured Projects"
          subtitle="Select a project to see the details."
          isInView={isInView}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {projectsData.map((project, index) => (
            <Card key={project.id} project={project} index={index} isInView={isInView} onOpen={setSelected} />
          ))}
        </div>

        {githubIsReal && (
          <div className="text-center mt-14">
            <a href={contactData.github} target="_blank" rel="noreferrer" onPointerDown={addRipple} className="btn-secondary">
              <GithubIcon className="w-4 h-4" />
              <span>More projects on GitHub</span>
            </a>
          </div>
        )}
      </div>

      <ProjectModal project={selected} onClose={close} />
    </section>
  );
}
