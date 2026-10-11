import React from 'react';
import { navLinks, siteConfig, contactData } from '../data/config';
import { GithubIcon, LinkedinIcon } from './icons';

const year = new Date().getFullYear();
const isReal = (url) => url && !url.includes('your-');

export default function Footer() {
  return (
    <footer className="border-t border-glow/20 bg-ink/70 backdrop-blur-md py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted/75">
        <p>
          &copy; {year} {siteConfig.name}. All rights reserved.
        </p>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-1">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="min-h-11 inline-flex items-center px-3 hover:text-champagne transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isReal(contactData.github) && (
            <a
              href={contactData.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="clay-sm clay-press w-11 h-11 flex items-center justify-center text-muted hover:text-champagne"
            >
              <GithubIcon className="w-5 h-5" />
            </a>
          )}
          {isReal(contactData.linkedin) && (
            <a
              href={contactData.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="clay-sm clay-press w-11 h-11 flex items-center justify-center text-muted hover:text-champagne"
            >
              <LinkedinIcon className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
