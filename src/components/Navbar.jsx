import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { navLinks, siteConfig } from '../data/config';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Active link detection
      const sections = navLinks
        .map((link) => {
          const id = link.href.replace('#', '');
          const el = document.getElementById(id);
          if (!el) return null;
          return { id, top: el.offsetTop - 120, bottom: el.offsetTop + el.offsetHeight - 120 };
        })
        .filter(Boolean);

      const currentScroll = window.scrollY;
      const current = sections.find(
        (sec) => currentScroll >= sec.top && currentScroll < sec.bottom
      );
      if (current) {
        setActiveSection(current.id);
      } else if (window.scrollY < 100) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0f]/85 backdrop-blur-md border-b border-[#1e1e2e]/80 py-3.5 shadow-md shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo / Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-[#f0f0f5] hover:text-[#6366f1] transition-colors"
        >
          {siteConfig.name}
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const id = link.href.replace('#', '');
            const isActive = activeSection === id;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium transition-colors hover:text-[#f0f0f5] ${
                  isActive ? 'text-[#6366f1]' : 'text-[#8a8a9a]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="px-5 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-[#6366f1]/20"
          >
            Let's Talk
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden text-[#f0f0f5] p-2 rounded-lg hover:bg-[#111118] transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[61px] bg-[#0a0a0f]/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center space-y-6 md:hidden px-6">
          {navLinks.map((link) => {
            const id = link.href.replace('#', '');
            const isActive = activeSection === id;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-2xl font-semibold transition-colors ${
                  isActive ? 'text-[#6366f1]' : 'text-[#8a8a9a] hover:text-[#f0f0f5]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <div className="pt-4 w-full max-w-xs">
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="block text-center w-full py-3 text-base font-medium rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-90 transition-all shadow-md shadow-[#6366f1]/30"
            >
              Let's Talk
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
