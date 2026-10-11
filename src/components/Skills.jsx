import React, { useMemo } from 'react';
import { skillsData } from '../data/config';
import { useInView } from '../hooks/useInView';
import { Sparkles, Code, Terminal } from 'lucide-react';

export default function Skills() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const categories = useMemo(() => {
    if (!skillsData || !skillsData.categories) return [];
    return skillsData.categories.map((cat) => ({
      category: cat.name,
      skills: (cat.skills || []).map((skill) => {
        if (typeof skill === 'string') return { name: skill, isLearning: false };
        const level = (skill.level || '').toLowerCase();
        return {
          name: skill.name || String(skill),
          isLearning: level === 'learning',
        };
      }),
    }));
  }, []);

  const getCategoryIcon = (categoryName) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('front') || lower.includes('web')) {
      return <Code className="w-5 h-5 text-[#6366f1]" />;
    }
    if (lower.includes('tool') || lower.includes('devops')) {
      return <Terminal className="w-5 h-5 text-[#8b5cf6]" />;
    }
    return <Code className="w-5 h-5 text-[#6366f1]" />;
  };

  return (
    <section id="skills" className="py-24 px-6 bg-[#0a0a0f] text-[#f0f0f5] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#6366f1]/5 to-[#8b5cf6]/5 blur-[120px] rounded-full pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div
          className={`mb-16 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-sm uppercase tracking-widest text-[#6366f1] mb-4 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#f0f0f5] tracking-tight">
            Skills &amp; Technologies
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full mt-4" />
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {categories.map((group, groupIndex) => (
            <div
              key={group.category}
              className={`${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transition: `opacity 0.7s ease, transform 0.7s ease`,
                transitionDelay: `${groupIndex * 150 + 100}ms`,
              }}
            >
              {/* Category Subheading */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#111118] border border-[#1e1e2e]">
                  {getCategoryIcon(group.category)}
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-[#f0f0f5] tracking-wide">
                  {group.category}
                </h3>
                <span className="text-xs text-[#8a8a9a] font-mono ml-2">
                  ({group.skills.length})
                </span>
              </div>

              {/* Skill Badges */}
              <div className="flex flex-wrap gap-3">
                {group.skills.map((skill, skillIndex) => (
                  <div
                    key={`${skill.name}-${skillIndex}`}
                    className={`group relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 cursor-default select-none ${
                      skill.isLearning
                        ? 'bg-[#111118]/60 border border-dashed border-[#8b5cf6]/40 text-[#f0f0f5]/90 hover:border-[#8b5cf6] hover:bg-[#111118] hover:shadow-[0_0_20px_rgba(139,92,246,0.18)] hover:-translate-y-0.5'
                        : 'bg-[#111118] border border-[#1e1e2e] text-[#f0f0f5] hover:border-[#6366f1]/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 hover:scale-[1.02]'
                    }`}
                  >
                    <span className="relative z-10 group-hover:text-white transition-colors">
                      {skill.name}
                    </span>
                    {skill.isLearning && (
                      <span className="relative z-10 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-[#8b5cf6]/15 text-[#a78bfa] border border-[#8b5cf6]/30">
                        Learning
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
