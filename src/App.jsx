import React from 'react';
import Background from './components/Background';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Services from './components/Services';
import Experience from './components/Experience';
import Education from './components/Education';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Footer from './components/Footer';
import HandCursor from './components/HandCursor';
import PortalIntro from './components/PortalIntro';
import WarpTransition from './components/WarpTransition';

function App() {
  return (
    <>
      <a href="#skills" className="sr-only-skip">
        Skip to content
      </a>
      <Background />
      <HandCursor />
      <PortalIntro />
      <WarpTransition />
      <Navbar />
      <main>
        <Hero />
        <Skills />
        <Projects />
        <Services />
        <Experience />
        <Education />
        <Certifications />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
