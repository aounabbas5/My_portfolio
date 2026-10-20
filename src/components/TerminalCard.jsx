import React from 'react';
import { useTypewriter } from '../hooks/useTypewriter';

const COMMANDS = ['npm run dev', 'git push origin main', 'python train.py --epochs 10', 'docker compose up -d'];

/** A tiny terminal that types real-looking commands in a loop. Decorative only. */
export default function TerminalCard({ className = '' }) {
  const cmd = useTypewriter(COMMANDS, { typeMs: 70, deleteMs: 30, pauseMs: 1800 });

  return (
    <div className={`terminal-card panel rounded-xl ${className}`} aria-hidden="true">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-glow/20">
        <span className="h-2 w-2 rounded-full bg-gold/70" />
        <span className="h-2 w-2 rounded-full bg-glow/70" />
        <span className="h-2 w-2 rounded-full bg-muted/50" />
        <span className="ml-2 font-mono text-[10px] text-muted/80">~/portfolio</span>
      </div>
      <div className="px-3 py-3 font-mono text-xs leading-relaxed">
        <p className="text-champagne">
          <span className="text-glow">❯</span> {cmd}
          <span className="typing-cursor !w-[6px] !h-[0.9em]" />
        </p>
        <p className="mt-1 text-muted/80">
          <span className="text-gold">●</span> compiled · ready in 312 ms
        </p>
      </div>
    </div>
  );
}
