// ============================================
// PORTFOLIO CONFIGURATION
// ============================================
// Edit this file to change your info, projects,
// experience, education, certifications and contacts.
// Sections with an empty list are hidden automatically.
// ============================================

export const siteConfig = {
  name: "Aoun Abbas",
  title: "Aoun Abbas — Web Developer & CS Student",
  description:
    "Personal portfolio of Aoun Abbas, a Computer Science student at FAST University passionate about building modern, responsive websites.",
  url: "https://aounabbas.dev", // Update with your actual domain
  ogImage: "/og-image.png", // Place your OG image in /public
};

export const heroData = {
  greeting: "Hello, I'm",
  prefix: "I am a",
  roles: ["Computer Science Student", "Web Developer", "Problem Solver"],
  cta: {
    primary: { text: "View Projects", href: "#projects" },
    secondary: { text: "Contact Me", href: "#contact" },
  },
};

export const aboutData = {
  heading: "Who am I?",
  paragraphs: [
    "I'm Aoun Abbas, a Computer Science student at FAST University learning web development by building real projects.",
    "I enjoy turning ideas into clean, functional websites, and I'm always picking up new tools to improve my skills.",
  ],
  interests: ["Web Development", "Problem Solving", "Continuous Learning"],
};

export const skillsData = {
  categories: [
    {
      name: "Frontend",
      skills: [
        { name: "HTML", level: "confident" },
        { name: "CSS", level: "confident" },
        { name: "JavaScript", level: "confident" },
        { name: "React", level: "learning" },
        { name: "Tailwind CSS", level: "learning" },
      ],
    },
    {
      name: "Tools",
      skills: [
        { name: "Git", level: "confident" },
        { name: "GitHub", level: "confident" },
        { name: "VS Code", level: "confident" },
      ],
    },
  ],
};

export const projectsData = [
  {
    id: 1,
    title: "College Management System",
    description: "A web app for organizing college information and workflows.",
    image: null, // Add path like "/projects/college-mgmt.png" when available
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: null, // Add URL when available
    sourceUrl: null, // Add GitHub URL when available
    date: null, // e.g. "Sep 2025"
    current: false,
  },
  {
    id: 2,
    title: "DLD Project Website",
    description: "An academic website built for a Digital Logic Design course project.",
    image: null,
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: null,
    sourceUrl: null,
    date: null,
    current: false,
  },
  {
    id: 3,
    title: "Next Project",
    description: "Something new is in progress.",
    image: null,
    technologies: [],
    liveUrl: null,
    sourceUrl: null,
    isPlaceholder: true,
  },
];

export const servicesData = {
  headline: "What I Can Build For You",
  services: [
    { title: "Business Websites", description: "Responsive sites for small businesses.", icon: "Building2" },
    { title: "Portfolios", description: "Personal sites for students and freelancers.", icon: "User" },
    { title: "Landing Pages", description: "Focused pages for products and ideas.", icon: "Rocket" },
    { title: "Redesigns", description: "Cleaner layouts for existing sites.", icon: "RefreshCw" },
  ],
};

// Add entries like: { role: "Teaching Assistant", org: "FAST University", period: "Spring 2026", details: ["Course name"] }
export const experienceData = [];

// Add entries like: { title: "Organizer – TEDx", period: "2025" }
export const leadershipData = [];

export const educationData = [
  {
    degree: "BS in Computer Science",
    school: "FAST University",
    period: null, // e.g. "August 2022 - June 2026"
    note: null, // e.g. "Dean's List – Spring 2024"
  },
];

// Add entries like: { title: "Python for Everybody", issuer: "Coursera", date: "March 2025", url: "https://..." }
export const certificationsData = [];

export const contactData = {
  headline: "Contact Me",
  description: "Have a project in mind? Send me a message.",
  email: "your.email@example.com", // UPDATE: Your email address
  linkedin: "https://linkedin.com/in/your-profile", // UPDATE: Your LinkedIn URL
  github: "https://github.com/your-username", // UPDATE: Your GitHub URL
  resume: null, // UPDATE: put your CV in /public and set e.g. "/Aoun-Abbas-CV.pdf"
  location: null, // e.g. "Lahore, Pakistan"
  whatsapp: null, // UPDATE: e.g. "https://wa.me/923001234567"
};

// Sections that have data. Used by the navbar and footer.
export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Services", href: "#services" },
  experienceData.length || leadershipData.length
    ? { label: "Experience", href: "#experience" }
    : null,
  educationData.length ? { label: "Education", href: "#education" } : null,
  certificationsData.length
    ? { label: "Certifications", href: "#certifications" }
    : null,
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
].filter(Boolean);

export const footerData = {
  tagline: "Web Developer & CS Student",
};

// "01", "02"... follows the sections that are actually shown.
export const sectionNumber = (id) =>
  String(navLinks.findIndex((l) => l.href === `#${id}`)).padStart(2, '0');
