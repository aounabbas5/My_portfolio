import React, { useState } from 'react';
import { Mail, Send, MessageSquare } from 'lucide-react';
import { contactData } from '../data/config';
import { useInView } from '../hooks/useInView';

const Linkedin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const Github = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export default function Contact() {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio Contact from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nProject Details:\n${formData.message}`
    );
    window.location.href = `mailto:${contactData.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="py-24 bg-[#0a0a0f] text-[#f0f0f5] relative overflow-hidden">
      <div
        ref={ref}
        className={`max-w-6xl mx-auto px-6 transition-all duration-1000 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-[#f0f0f5]">
            {contactData.headline.split("?")[0]}?{' '}
            <span className="gradient-text">
              {contactData.headline.split("?")[1]?.trim() || "Let's Make It Happen."}
            </span>
          </h2>
          <p className="text-[#8a8a9a] text-lg leading-relaxed">
            {contactData.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Contact Info */}
          <div className="space-y-8 bg-[#111118] p-8 md:p-10 rounded-2xl border border-[#1e1e2e]">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-[#f0f0f5]">Connect Directly</h3>
              <p className="text-[#8a8a9a] text-sm leading-relaxed">
                Reach out via email or social networks for project inquiries.
              </p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <a
                href={`mailto:${contactData.email}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#6366f1] transition-colors group"
              >
                <div className="p-2.5 rounded-lg bg-[#1e1e2e] text-[#8a8a9a] group-hover:bg-[#6366f1]/15 group-hover:text-[#6366f1] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#8a8a9a] uppercase font-semibold tracking-wider">Email</div>
                  <div className="text-sm md:text-base font-medium text-[#f0f0f5] group-hover:text-[#6366f1] transition-colors">
                    {contactData.email}
                  </div>
                </div>
              </a>

              {/* LinkedIn */}
              {contactData.linkedin && (
                <a
                  href={contactData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#6366f1] transition-colors group"
                >
                  <div className="p-2.5 rounded-lg bg-[#1e1e2e] text-[#8a8a9a] group-hover:bg-[#6366f1]/15 group-hover:text-[#6366f1] transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#8a8a9a] uppercase font-semibold tracking-wider">LinkedIn</div>
                    <div className="text-sm md:text-base font-medium text-[#f0f0f5] group-hover:text-[#6366f1] transition-colors">
                      Connect on LinkedIn
                    </div>
                  </div>
                </a>
              )}

              {/* GitHub */}
              {contactData.github && (
                <a
                  href={contactData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#6366f1] transition-colors group"
                >
                  <div className="p-2.5 rounded-lg bg-[#1e1e2e] text-[#8a8a9a] group-hover:bg-[#6366f1]/15 group-hover:text-[#6366f1] transition-colors">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#8a8a9a] uppercase font-semibold tracking-wider">GitHub</div>
                    <div className="text-sm md:text-base font-medium text-[#f0f0f5] group-hover:text-[#6366f1] transition-colors">
                      Explore GitHub
                    </div>
                  </div>
                </a>
              )}

              {/* WhatsApp */}
              {contactData.whatsapp && (
                <a
                  href={contactData.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#6366f1] transition-colors group"
                >
                  <div className="p-2.5 rounded-lg bg-[#1e1e2e] text-[#8a8a9a] group-hover:bg-[#6366f1]/15 group-hover:text-[#6366f1] transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#8a8a9a] uppercase font-semibold tracking-wider">WhatsApp</div>
                    <div className="text-sm md:text-base font-medium text-[#f0f0f5] group-hover:text-[#6366f1] transition-colors">
                      Chat on WhatsApp
                    </div>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-[#111118] p-8 md:p-10 rounded-2xl border border-[#1e1e2e]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#f0f0f5] mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-4 py-3 text-[#f0f0f5] placeholder-[#4a4a5a] focus:outline-none focus:border-[#6366f1] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#f0f0f5] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-4 py-3 text-[#f0f0f5] placeholder-[#4a4a5a] focus:outline-none focus:border-[#6366f1] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#f0f0f5] mb-2">
                  Project Details
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project..."
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-4 py-3 text-[#f0f0f5] placeholder-[#4a4a5a] focus:outline-none focus:border-[#6366f1] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#6366f1]/20 cursor-pointer"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>

              <p className="text-xs text-[#8a8a9a] text-center pt-2">
                This form will open your email client. For direct contact, email me at{' '}
                <a href={`mailto:${contactData.email}`} className="text-[#6366f1] underline hover:text-[#8b5cf6]">
                  {contactData.email}
                </a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
