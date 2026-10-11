// ============================================
// PORTFOLIO CONFIGURATION
// ============================================
// Update this file to change your personal info,
// projects, services, and contact details.
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
  label: "COMPUTER SCIENCE STUDENT · WEB DEVELOPER",
  greeting: "Hi, I'm Aoun Abbas.",
  headline: "I Build Digital Experiences That Stand Out.",
  description:
    "I'm a CS student at FAST University passionate about building modern, responsive websites for people, businesses, and ideas.",
  cta: {
    primary: { text: "Explore My Work", href: "#projects" },
    secondary: { text: "Let's Work Together", href: "#contact" },
  },
  availability: "Open to Freelance Projects",
};

export const aboutData = {
  description:
    "I'm Aoun Abbas, a Computer Science student at FAST University exploring the world of web development. I enjoy turning ideas into clean, functional, and engaging websites. Through academic and personal projects, I'm continuously developing my skills and learning how to create digital experiences that solve real problems.",
  highlights: [
    {
      title: "Computer Science Student",
      description: "Studying CS at FAST University",
      icon: "GraduationCap",
    },
    {
      title: "Web Development",
      description: "Building modern web experiences",
      icon: "Code2",
    },
    {
      title: "Always Learning",
      description: "Continuously growing my skills",
      icon: "TrendingUp",
    },
  ],
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
    description:
      "A web development project focused on organizing college-related information and management workflows.",
    image: null, // Add path like "/projects/college-mgmt.png" when available
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: null, // Add URL when available
    sourceUrl: null, // Add GitHub URL when available
    featured: true,
  },
  {
    id: 2,
    title: "DLD Project Website",
    description:
      "An academic website developed as part of my Digital Logic Design project.",
    image: null, // Add path like "/projects/dld-project.png" when available
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: null, // Add URL when available
    sourceUrl: null, // Add GitHub URL when available
    featured: true,
  },
  {
    id: 3,
    title: "Coming Soon",
    description:
      "A new project is in the works. Stay tuned for updates!",
    image: null,
    technologies: [],
    liveUrl: null,
    sourceUrl: null,
    featured: false,
    isPlaceholder: true,
  },
];

export const servicesData = {
  headline: "Let's Build Something Great Together.",
  description:
    "I help turn ideas into clean, modern websites designed to look great, work smoothly, and deliver value.",
  services: [
    {
      title: "Business Websites",
      description:
        "Modern, responsive websites for small businesses and local brands.",
      icon: "Building2",
    },
    {
      title: "Personal Portfolio Websites",
      description:
        "Professional websites for students, developers, freelancers, and job seekers.",
      icon: "User",
    },
    {
      title: "Landing Pages",
      description:
        "Focused landing pages for products, services, and new ideas.",
      icon: "Rocket",
    },
    {
      title: "Website Redesign",
      description:
        "Refreshing existing websites with better layouts, improved responsiveness, and cleaner user experiences.",
      icon: "RefreshCw",
    },
  ],
};

export const processData = [
  {
    step: "01",
    title: "Discover",
    description: "Understand the client's goals and requirements.",
  },
  {
    step: "02",
    title: "Plan",
    description: "Define the structure, layout, and visual direction.",
  },
  {
    step: "03",
    title: "Build",
    description: "Develop a responsive website with attention to detail.",
  },
  {
    step: "04",
    title: "Deliver",
    description:
      "Test the website, make agreed revisions, and prepare it for launch.",
  },
];

export const contactData = {
  headline: "Have an Idea? Let's Make It Happen.",
  description:
    "Whether you need a personal portfolio, a business website, or help bringing a web project to life, I'd love to hear about it.",
  email: "your.email@example.com", // UPDATE: Your email address
  linkedin: "https://linkedin.com/in/your-profile", // UPDATE: Your LinkedIn URL
  github: "https://github.com/your-username", // UPDATE: Your GitHub URL
  whatsapp: null, // UPDATE: Add your WhatsApp link like "https://wa.me/923001234567" or leave null
};

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export const footerData = {
  tagline: "Learning, building, and creating for the web.",
};
