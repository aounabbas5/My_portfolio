import React from 'react';
import { motion } from 'motion/react';
import { HeadingReveal, Reveal, Rule } from '../motion';
import { VIEWPORT, container } from '../motion/tokens';

/** Section title: the heading rises out of a mask, the divider draws in, the subtitle follows. */
export default function SectionHeader({ title, subtitle }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={container(0.12)}
      className="mb-12 md:mb-16 text-center"
    >
      <HeadingReveal className="text-3xl md:text-5xl font-bold text-gradient">{title}</HeadingReveal>
      <div className="mx-auto mt-5 flex items-center justify-center gap-2" aria-hidden="true">
        <Rule className="h-px w-10 origin-right bg-gradient-to-r from-transparent to-glow" />
        <Reveal inherit y={0} className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <Rule className="h-px w-10 origin-left bg-gradient-to-l from-transparent to-glow" />
      </div>
      {subtitle && (
        <Reveal inherit as="p" y={14} className="mt-5 text-muted max-w-xl mx-auto">
          {subtitle}
        </Reveal>
      )}
    </motion.div>
  );
}
