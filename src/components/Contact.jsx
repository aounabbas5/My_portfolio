import React, { useState } from 'react';
import { Mail, Send, MapPin, MessageSquare } from 'lucide-react';
import { contactData } from '../data/config';
import { useInView } from '../hooks/useInView';
import SectionHeader from './SectionHeader';
import { GithubIcon as Github, LinkedinIcon as Linkedin } from './icons';
import { addRipple } from '../hooks/ripple';

const inputClass =
  'clay-inset w-full min-h-12 rounded-2xl px-4 py-3 text-champagne placeholder-muted/70 focus:outline-none';

function Tile({ icon: Icon, label, value, href }) {
  const Wrapper = href ? 'a' : 'div';
  const props = href
    ? { href, ...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
    : {};
  return (
    <Wrapper
      {...props}
      className={`group flex flex-1 items-center gap-4 clay-sm clay-press min-h-14 p-4 ${
        href ? 'cursor-pointer' : ''
      }`}
    >
      <div className="clay-inset w-11 h-11 rounded-xl flex items-center justify-center text-gold shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted/75">{label}</div>
        <div className="text-sm font-medium text-champagne [overflow-wrap:anywhere]">{value}</div>
      </div>
    </Wrapper>
  );
}

const stripUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export default function Contact() {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(form.subject || `Portfolio contact from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:${contactData.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" ref={ref} className="relative py-20 md:py-28 px-6">
      {/* the connection portal: slow counter-rotating rings behind the headline */}
      <div className="gateway" aria-hidden="true" data-on={isInView}>
        <span />
        <span />
        <span />
      </div>
      <div className="relative max-w-6xl mx-auto">
        <SectionHeader
          title={contactData.headline}
          subtitle={contactData.description}
          isInView={isInView}
        />

        <div
          className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Info tiles */}
          <div className="panel rounded-2xl p-6 md:p-7 lg:col-span-2 flex flex-col gap-4">
            <Tile icon={Mail} label="Email" value={contactData.email} href={`mailto:${contactData.email}`} />
            {contactData.linkedin && (
              <Tile icon={Linkedin} label="LinkedIn" value={stripUrl(contactData.linkedin)} href={contactData.linkedin} />
            )}
            {contactData.github && (
              <Tile icon={Github} label="GitHub" value={stripUrl(contactData.github)} href={contactData.github} />
            )}
            {contactData.whatsapp && (
              <Tile icon={MessageSquare} label="WhatsApp" value="Send a message" href={contactData.whatsapp} />
            )}
            {contactData.location && <Tile icon={MapPin} label="Location" value={contactData.location} />}
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="panel rounded-2xl p-6 md:p-8 lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="sr-only">Your name</label>
                <input id="name" name="name" required value={form.name} onChange={onChange} placeholder="Your Name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Your email</label>
                <input id="email" name="email" type="email" required value={form.email} onChange={onChange} placeholder="Your Email" className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="sr-only">Subject</label>
              <input id="subject" name="subject" value={form.subject} onChange={onChange} placeholder="Subject" className={inputClass} />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">Your message</label>
              <textarea id="message" name="message" rows={5} required value={form.message} onChange={onChange} placeholder="Your Message" className={`${inputClass} resize-none`} />
            </div>
            <button type="submit" onPointerDown={addRipple} className="btn-primary w-full">
              <span>Send Message</span>
              <Send className="w-4 h-4" />
            </button>
            <p className="text-xs text-muted/75 text-center">
              This opens your email app with the message ready to send.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
