import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { addRipple } from '../hooks/ripple';
import { lastPointer } from '../lib/journey';
import { GithubIcon } from './icons';

export default function ProjectModal({ project, onClose }) {
  const closeBtn = useRef(null);

  useEffect(() => {
    if (!project) return undefined;
    const opener = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // Keep keyboard focus inside the dialog.
      if (e.key === 'Tab') {
        const nodes = document.querySelectorAll('#project-dialog a[href], #project-dialog button');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [project, onClose]);

  if (!project) return null;
  const hasLinks = project.liveUrl || project.sourceUrl;

  return (
    <div
      className="portal-open fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/80 backdrop-blur-md"
      style={{ '--ox': `${lastPointer.x}%`, '--oy': `${lastPointer.y}%` }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        id="project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-dialog-title"
        className="panel w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ animation: 'modalIn 0.35s cubic-bezier(0.2, 1, 0.3, 1)' }}
      >
        <div className="relative h-48 border-b border-glow/20 bg-gradient-to-br from-glow/20 to-gold/5 flex items-center justify-center overflow-hidden">
          {project.image ? (
            <img src={project.image} alt={`${project.title} screenshot`} className="w-full h-full object-cover" />
          ) : (
            <span className="hud-label">{project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.app</span>
          )}
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            onPointerDown={addRipple}
            aria-label="Close project details"
            className="clay-sm clay-press absolute top-3 right-3 w-11 h-11 text-champagne flex items-center justify-center overflow-hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 id="project-dialog-title" className="font-display text-2xl sm:text-3xl font-bold text-champagne">
              {project.title}
            </h3>
            {project.date && <span className="hud-label !text-[11px]">{project.date}</span>}
          </div>
          <p className="text-muted leading-relaxed">{project.description}</p>

          {project.technologies?.length > 0 && (
            <div className="mt-6">
              <div className="hud-label !text-[10px] mb-2">Built with</div>
              <ul className="flex flex-wrap gap-2">
                {project.technologies.map((t) => (
                  <li key={t} className="clay-chip text-sm px-3 py-1.5">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" onPointerDown={addRipple} className="btn-primary">
                <span>Live demo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {project.sourceUrl && (
              <a href={project.sourceUrl} target="_blank" rel="noreferrer" onPointerDown={addRipple} className="btn-secondary">
                <GithubIcon className="w-4 h-4" />
                <span>Source code</span>
              </a>
            )}
            {!hasLinks && (
              <p className="text-sm text-muted/75">
                A live demo and source link have not been published for this project yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
