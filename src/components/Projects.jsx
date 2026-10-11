import React, { useState, useRef } from 'react';
import { projectsData } from '../data/config';
import { useInView } from '../hooks/useInView';
import { ArrowUpRight, ExternalLink, Code2, Sparkles } from 'lucide-react';

const Github = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

function ProjectCard({ project, index, isInView }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isPlaceholder = Boolean(project.isPlaceholder);
  const projectNumber = String(index + 1).padStart(2, '0');

  const handleMouseMove = (e) => {
    if (isPlaceholder || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 4;
    const rotateY = ((x - centerX) / centerX) * 4;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: !isPlaceholder
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(${isHovered ? -4 : 0}px)`
          : undefined,
        transition: isHovered
          ? 'opacity 0.7s ease, transform 0.1s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
          : 'opacity 0.7s ease, transform 0.5s ease-out, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      className={`group relative rounded-xl flex flex-col overflow-hidden ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${
        isPlaceholder
          ? 'bg-[#111118]/60 border-2 border-dashed border-[#1e1e2e] opacity-80'
          : 'bg-[#111118] border border-[#1e1e2e] hover:border-[#6366f1]/60 hover:shadow-[0_10px_35px_-5px_rgba(99,102,241,0.2)]'
      }`}
    >
      {/* Preview Area */}
      <div className="relative h-64 w-full overflow-hidden border-b border-[#1e1e2e] bg-[#0c0c14]">
        {project.image && !isPlaceholder ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#121224] via-[#16132b] to-[#1e1438] overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#6366f1]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#8b5cf6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 border border-[#6366f1]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <Code2 className="w-7 h-7 text-[#a78bfa]" />
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[#f0f0f5] px-4">
                {project.title}
              </h4>
              <p className="text-xs text-[#8a8a9a] mt-1 font-mono uppercase tracking-wider">
                Web Application
              </p>
            </div>
          </div>
        )}

        {/* Project Number */}
        <div className="absolute top-4 left-4 z-20">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0a0a0f]/80 backdrop-blur-md text-[#6366f1] border border-[#1e1e2e]">
            {projectNumber}
          </span>
        </div>

        {/* Arrow Icon */}
        <div className="absolute top-4 right-4 z-20">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-[#0a0a0f]/80 backdrop-blur-md border border-[#1e1e2e] flex items-center justify-center text-[#8a8a9a] hover:text-white hover:border-[#6366f1] hover:bg-[#6366f1]/20 transition-all duration-300"
              aria-label={`Open ${project.title}`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#0a0a0f]/60 backdrop-blur-md border border-[#1e1e2e] flex items-center justify-center text-[#8a8a9a]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Coming Soon Overlay */}
        {isPlaceholder && (
          <div className="absolute inset-0 bg-[#0a0a0f]/85 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center text-center p-6">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-widest text-[#a78bfa] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              Coming Soon
            </span>
            <p className="text-xs text-[#8a8a9a] mt-3 max-w-xs">
              A new project is in the works. Stay tuned for updates!
            </p>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 md:p-8 flex-1">
        <h3 className="text-2xl font-bold text-[#f0f0f5] group-hover:text-[#a78bfa] transition-colors mb-3">
          {project.title}
        </h3>
        <p className="text-[#8a8a9a] text-sm md:text-base leading-relaxed mb-6">
          {project.description}
        </p>

        {/* Tech Tags */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.technologies.map((tag, tagIdx) => (
              <span
                key={`${tag}-${tagIdx}`}
                className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#1e1e2e]/60 text-[#a78bfa] border border-[#1e1e2e]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(project.liveUrl || project.sourceUrl) && !isPlaceholder && (
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 flex flex-wrap items-center gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:brightness-110 active:scale-95 shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all"
            >
              <span>View Project</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1e1e2e]/80 hover:bg-[#1e1e2e] text-[#f0f0f5] border border-[#1e1e2e] hover:border-[#6366f1]/50 active:scale-95 transition-all"
            >
              <Github className="w-4 h-4 text-[#8a8a9a]" />
              <span>Source Code</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section id="projects" className="py-24 px-6 bg-[#0a0a0f] text-[#f0f0f5] relative overflow-hidden">
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#6366f1]/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[#8b5cf6]/5 blur-[130px] rounded-full pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div
          className={`mb-16 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-sm uppercase tracking-widest text-[#6366f1] mb-4 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
            <span>Curated Portfolio</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#f0f0f5] tracking-tight">
            Featured Projects
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full mt-4" />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {projectsData.map((project, index) => (
            <ProjectCard
              key={project.id || project.title || index}
              project={project}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
