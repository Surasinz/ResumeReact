import { useEffect, useRef, useState } from 'react';
import './App.css';
import MatrixRainBackground from './MatrixRainBackground';
import PixelLiquidBackground from './PixelLiquidBackground';
import WebShimeji from './shimeji/WebShimeji';
import ViewSidebar from './ViewSidebar';

const EMAIL = 'surachetpan@hotmail.com';
const BACKGROUND_EFFECTS_PREFERENCE_KEY = 'surachet-background-effects-animation';
const PIXEL_LIQUID_PREFERENCE_KEY = 'surachet-pixel-liquid-animation';
const LEGACY_MATRIX_PREFERENCE_KEY = 'surachet-matrix-animation';

const experiences = [
  {
    period: '03/2025 — Present',
    role: 'Software Engineer',
    company: 'Gosoft (Thailand) Co., Ltd.',
    description:
      'Develop enterprise applications using Java, Oracle APEX, JavaScript, React, SQL, and PL/SQL. Optimize SQL queries and PL/SQL programs to improve application performance.',
    current: true,
  },
  {
    period: '07/2024 — 02/2025',
    role: 'Trainee Software Engineer',
    company: 'Gosoft (Thailand) Co., Ltd.',
    description:
      'Built enterprise web applications, developed Java back-end services and TypeScript front-end features, and created automated tests using Cypress.',
  },
  {
    period: '09/2023 — 12/2023',
    role: 'Part Time Software Engineer',
    company: 'Enterprise Computing Services (Thailand) Co., Ltd.',
    description:
      'Assisted in software and database design, and developed and maintained MySQL databases.',
  },
];

const programmingLanguages = [
  'Java',
  'JavaScript',
  'TypeScript',
  'SQL',
  'PL/SQL',
  'Python',
];

const tools = [
  'Oracle APEX',
  'React.js',
  'Spring Boot',
  'REST APIs',
  'Oracle Database',
  'MySQL',
  'Git',
  'Postman',
  'Cypress',
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function SectionHeading({ number, eyebrow, title }) {
  return (
    <div className="section-heading" data-reveal>
      <p>
        <span>{number}</span>
        {eyebrow}
      </p>
      <h2>{title}</h2>
    </div>
  );
}

function SkillMarquee({ label, items, reverse = false }) {
  const [paused, setPaused] = useState(false);

  const renderItems = (duplicate = false) => (
    <div className="marquee-group" aria-hidden={duplicate || undefined}>
      {items.map((skill, index) => (
        <span className="skill-pill" key={`${duplicate ? 'duplicate-' : ''}${skill}`}>
          <small>{String(index + 1).padStart(2, '0')}</small>
          {skill}
        </span>
      ))}
    </div>
  );

  return (
    <div className="skill-marquee" data-reveal>
      <div className="marquee-header">
        <p className="card-kicker">{label}</p>
        <button
          className="marquee-toggle"
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-pressed={paused}
          aria-label={`${paused ? 'Resume' : 'Pause'} ${label} animation`}
        >
          <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
      <div className="marquee-viewport">
        <div
          className={`marquee-track${reverse ? ' marquee-track-reverse' : ''}${
            paused ? ' is-paused' : ''
          }`}
        >
          {renderItems()}
          {renderItems(true)}
        </div>
      </div>
    </div>
  );
}

function ProjectVisual() {
  const visualRef = useRef(null);

  const handleMouseMove = (event) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const visual = visualRef.current;
    if (!visual) return;

    const bounds = visual.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const pointerX = (event.clientX - bounds.left) / bounds.width;
    const pointerY = (event.clientY - bounds.top) / bounds.height;

    visual.style.setProperty('--tilt-x', `${(0.5 - pointerY) * 10}deg`);
    visual.style.setProperty('--tilt-y', `${(pointerX - 0.5) * 10}deg`);
    visual.style.setProperty('--glare-x', `${pointerX * 100}%`);
    visual.style.setProperty('--glare-y', `${pointerY * 100}%`);
  };

  const resetTilt = () => {
    const visual = visualRef.current;
    if (!visual) return;

    visual.style.setProperty('--tilt-x', '0deg');
    visual.style.setProperty('--tilt-y', '0deg');
    visual.style.setProperty('--glare-x', '50%');
    visual.style.setProperty('--glare-y', '50%');
  };

  return (
    <div
      className="project-visual-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      data-testid="project-tilt"
      aria-hidden="true"
    >
      <div className="project-visual" ref={visualRef}>
        <div className="scan-grid" />
        <div className="helmet">
          <span className="helmet-shell" />
          <span className="helmet-visor" />
        </div>
        <span className="detection-corner corner-one" />
        <span className="detection-corner corner-two" />
        <div className="detection-label">Helmet · 98.6%</div>
      </div>
    </div>
  );
}

function AvatarSpotlight() {
  const frameRef = useRef(null);

  const handleMouseMove = (event) => {
    const frame = frameRef.current;
    if (!frame) return;

    const bounds = frame.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);

    frame.style.setProperty('--spotlight-x', `${x * 100}%`);
    frame.style.setProperty('--spotlight-y', `${y * 100}%`);
    frame.classList.add('is-spotlight-active');
  };

  const hideSpotlight = () => {
    frameRef.current?.classList.remove('is-spotlight-active');
  };

  return (
    <div
      className="avatar-frame"
      ref={frameRef}
      data-testid="avatar-spotlight"
      onMouseEnter={handleMouseMove}
      onMouseMove={handleMouseMove}
      onMouseLeave={hideSpotlight}
    >
      <img
        className="avatar-image avatar-image-default"
        src={`${process.env.PUBLIC_URL}/surachet-avatar.webp`}
        alt="3D streetwear avatar of Surachet Panto"
        width="928"
        height="960"
        fetchPriority="high"
        decoding="async"
        draggable="false"
      />
      <img
        className="avatar-image avatar-image-reveal"
        src={`${process.env.PUBLIC_URL}/avatar-formal.webp`}
        alt=""
        aria-hidden="true"
        width="928"
        height="960"
        fetchPriority="low"
        decoding="async"
        draggable="false"
      />
      <div className="floating-label floating-label-code">
        <span>&lt;/&gt;</span>
        Enterprise builder
      </div>
      <div className="floating-label floating-label-location">
        <span>●</span>
        Nonthaburi, TH
      </div>
    </div>
  );
}

function getInitialBackgroundEffectsPreference() {
  try {
    const savedPreference =
      window.localStorage.getItem(BACKGROUND_EFFECTS_PREFERENCE_KEY) ??
      window.localStorage.getItem(PIXEL_LIQUID_PREFERENCE_KEY) ??
      window.localStorage.getItem(LEGACY_MATRIX_PREFERENCE_KEY);
    if (savedPreference !== null) return savedPreference === 'true';
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function moveNavIndicator(nav, link) {
  if (!nav || !link) return;

  const navRect = nav.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  nav.style.setProperty('--indicator-x', `${linkRect.left - navRect.left}px`);
  nav.style.setProperty('--indicator-width', `${linkRect.width}px`);
}

function getNavIndicatorTarget(
  nav,
  activeSection,
  hoveredLink,
  focusedLink,
  interactionType
) {
  const preferredLink =
    interactionType === 'hover'
      ? hoveredLink
      : interactionType === 'focus'
        ? focusedLink
        : null;

  return (
    preferredLink ??
    hoveredLink ??
    focusedLink ??
    nav?.querySelector(`[data-section="${activeSection}"]`)
  );
}

function App() {
  const [copyState, setCopyState] = useState('idle');
  const [backgroundEffectsEnabled, setBackgroundEffectsEnabled] = useState(
    getInitialBackgroundEffectsPreference
  );
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const copyResetTimer = useRef(null);
  const isMounted = useRef(true);
  const navRef = useRef(null);
  const navHoverRef = useRef(null);
  const navFocusRef = useRef(null);
  const navInteractionTypeRef = useRef(null);

  useEffect(() => {
    const mascot = new WebShimeji({
      spriteUrl: `${process.env.PUBLIC_URL}/builder-bot-sprite.webp`,
    });

    mascot.mount();
    return () => mascot.destroy();
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sectionIds = ['about', 'experience', 'projects'];
    let navigationFrame = null;

    const updateActiveSection = () => {
      if (window.scrollY <= 1) {
        setActiveSection('about');
        return;
      }

      const activationLine = window.innerHeight * 0.38;
      let currentSection = 'about';

      sectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section?.getBoundingClientRect().top <= activationLine) {
          currentSection = sectionId;
        }
      });

      setActiveSection(currentSection);
    };

    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 0);

      if (navigationFrame === null) {
        navigationFrame = window.requestAnimationFrame(() => {
          navigationFrame = null;
          updateActiveSection();
        });
      }
    };

    setIsNavScrolled(window.scrollY > 0);
    updateActiveSection();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (navigationFrame !== null) {
        window.cancelAnimationFrame(navigationFrame);
      }
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    const moveToCurrentTarget = () => {
      moveNavIndicator(
        nav,
        getNavIndicatorTarget(
          nav,
          activeSection,
          navHoverRef.current,
          navFocusRef.current,
          navInteractionTypeRef.current
        )
      );
    };

    moveToCurrentTarget();
    window.addEventListener('resize', moveToCurrentTarget, { passive: true });

    return () => window.removeEventListener('resize', moveToCurrentTarget);
  }, [activeSection]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.clearTimeout(copyResetTimer.current);
    };
  }, []);

  const copyEmail = async () => {
    let nextState;

    try {
      await navigator.clipboard.writeText(EMAIL);
      nextState = 'copied';
    } catch {
      nextState = 'error';
    }

    if (!isMounted.current) return;

    setCopyState(nextState);
    window.clearTimeout(copyResetTimer.current);
    copyResetTimer.current = window.setTimeout(() => setCopyState('idle'), 2000);
  };

  const toggleBackgroundEffects = () => {
    setBackgroundEffectsEnabled((currentValue) => {
      const nextValue = !currentValue;

      try {
        window.localStorage.setItem(
          BACKGROUND_EFFECTS_PREFERENCE_KEY,
          String(nextValue)
        );
      } catch {
        // The toggle still works for the current page when storage is unavailable.
      }

      return nextValue;
    });
  };

  return (
    <div
      className="site-shell"
      style={{
        '--cursor-default': `url("${process.env.PUBLIC_URL}/cursor.png") 3 3, auto`,
        '--cursor-hand': `url("${process.env.PUBLIC_URL}/hand.png") 4 4, pointer`,
      }}
    >
      <MatrixRainBackground enabled={backgroundEffectsEnabled} />
      <PixelLiquidBackground enabled={backgroundEffectsEnabled} />
      <ViewSidebar />
      <button
        className="matrix-toggle"
        type="button"
        role="switch"
        onClick={toggleBackgroundEffects}
        aria-checked={backgroundEffectsEnabled}
        aria-label="Background animations"
      >
        <span className="matrix-switch-track" aria-hidden="true">
          <span className="matrix-switch-thumb" />
        </span>
        <span className="matrix-toggle-label" aria-hidden="true">
          <span>Background FX</span>
          <span>{backgroundEffectsEnabled ? 'On' : 'Off'}</span>
        </span>
      </button>

      <header className={`topbar${isNavScrolled ? ' is-scrolled' : ''}`}>
        <a className="brand" href="#top" aria-label="Surachet Panto — home">
          SP<span>.</span>
        </a>
        <nav
          ref={navRef}
          aria-label="Main navigation"
          onMouseLeave={() => {
            navHoverRef.current = null;
            if (navInteractionTypeRef.current === 'hover') {
              navInteractionTypeRef.current = navFocusRef.current
                ? 'focus'
                : null;
            }
            moveNavIndicator(
              navRef.current,
              getNavIndicatorTarget(
                navRef.current,
                activeSection,
                navHoverRef.current,
                navFocusRef.current,
                navInteractionTypeRef.current
              )
            );
          }}
          onBlur={(event) => {
            if (event.currentTarget.contains(event.relatedTarget)) return;

            navFocusRef.current = null;
            if (navInteractionTypeRef.current === 'focus') {
              navInteractionTypeRef.current = navHoverRef.current
                ? 'hover'
                : null;
            }
            moveNavIndicator(
              navRef.current,
              getNavIndicatorTarget(
                navRef.current,
                activeSection,
                navHoverRef.current,
                navFocusRef.current,
                navInteractionTypeRef.current
              )
            );
          }}
        >
          {['about', 'experience', 'projects'].map((sectionId) => (
            <a
              className={`nav-link${
                activeSection === sectionId ? ' is-active' : ''
              }`}
              data-section={sectionId}
              href={`#${sectionId}`}
              key={sectionId}
              aria-current={
                activeSection === sectionId ? 'location' : undefined
              }
              onMouseEnter={(event) => {
                navHoverRef.current = event.currentTarget;
                navInteractionTypeRef.current = 'hover';
                moveNavIndicator(navRef.current, event.currentTarget);
              }}
              onFocus={(event) => {
                navFocusRef.current = event.currentTarget;
                navInteractionTypeRef.current = 'focus';
                moveNavIndicator(navRef.current, event.currentTarget);
              }}
            >
              {sectionId}
            </a>
          ))}
          <span className="nav-indicator" aria-hidden="true" />
        </nav>
        <a className="topbar-cta" href="mailto:surachetpan@hotmail.com">
          Let&apos;s talk <ArrowIcon />
        </a>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="availability" data-reveal>
              <span className="status-dot" />
              Available for opportunities
            </div>
            <h1 data-reveal>
              Hi, I&apos;m
              <span>Surachet</span>
              <span className="outline-text">Panto.</span>
            </h1>
            <p className="hero-subtitle" data-reveal>
              Software Engineer specializing in enterprise applications
            </p>
            <div className="hero-actions" data-reveal>
              <a className="button button-primary" href="#projects">
                View Projects <ArrowIcon />
              </a>
              <a className="button button-secondary" href="#contact">
                Contact Me
              </a>
            </div>
            <div className="social-links" data-reveal>
              <span>Find me online</span>
              <a
                href="https://linkedin.com/in/surachet-panto"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn profile"
              >
                <span className="social-icon" aria-hidden="true">in</span>
                LinkedIn
              </a>
              <a
                href="https://github.com/Surasinz"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub profile"
              >
                <span className="social-icon social-icon-github" aria-hidden="true">git</span>
                GitHub
              </a>
            </div>
          </div>

          <div className="hero-visual" data-reveal>
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <AvatarSpotlight />
            <p className="visual-caption">Software Engineer · 2026</p>
          </div>

          <a className="scroll-cue" href="#about" aria-label="Scroll to about section">
            <span>Scroll to explore</span>
            <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="about section" id="about">
          <SectionHeading number="01" eyebrow="About me" title="Engineering with purpose." />
          <div className="about-grid">
            <p className="about-lead" data-reveal>
              I build <em>reliable systems</em> that keep businesses moving.
            </p>
            <div className="about-copy" data-reveal>
              <p>
                Software Engineer with experience developing enterprise applications using
                Java, Oracle APEX, JavaScript, React, SQL, and PL/SQL.
              </p>
              <p>
                Passionate about building reliable software, improving system performance,
                and collaborating with cross-functional teams.
              </p>
            </div>
          </div>
          <div className="stats" data-reveal>
            <div><strong>3</strong><span>Professional roles</span></div>
            <div><strong>15+</strong><span>Technologies &amp; tools</span></div>
            <div><strong>3.62</strong><span>University GPA</span></div>
          </div>
        </section>

        <section className="experience section" id="experience">
          <SectionHeading number="02" eyebrow="Experience" title="Where I've made an impact." />
          <div className="timeline">
            {experiences.map((item, index) => (
              <article
                className="timeline-item"
                data-reveal
                style={{ '--reveal-delay': `${index * 80}ms` }}
                key={`${item.role}-${item.period}`}
              >
                <div className="timeline-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="timeline-meta">
                  <p>{item.period}</p>
                  {item.current && <span>Current</span>}
                </div>
                <div className="timeline-content">
                  <h3>{item.role}</h3>
                  <h4>{item.company}</h4>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="education section" id="education">
          <SectionHeading number="03" eyebrow="Education" title="A foundation built to solve." />
          <article className="education-card" data-reveal>
            <div className="education-monogram">PIM</div>
            <div>
              <p className="card-kicker">Bachelor of Engineering</p>
              <h3>Computer Engineering &amp; Artificial Intelligence</h3>
              <p>Panyapiwat Institute of Management</p>
            </div>
            <div className="education-achievement">
              <span>GPA</span>
              <strong>3.62</strong>
              <p>Second-Class Honors</p>
            </div>
          </article>
        </section>

        <section className="skills section" id="skills">
          <SectionHeading number="04" eyebrow="Technical skills" title="Tools I use to ship." />
          <div className="skills-marquee">
            <SkillMarquee label="Programming languages" items={programmingLanguages} />
            <SkillMarquee label="Technologies & tools" items={tools} reverse />
          </div>
        </section>

        <section className="projects section" id="projects">
          <SectionHeading number="05" eyebrow="Featured project" title="Built beyond the brief." />
          <article className="project-card" data-reveal>
            <ProjectVisual />
            <div className="project-copy">
              <p className="card-kicker">AI · Computer vision</p>
              <h3>Motorcycle Helmet Compliance Detection System</h3>
              <p>
                Developed an AI-powered detection system to identify motorcycle riders not
                wearing helmets, connecting real-time computer vision with a production-ready
                back end.
              </p>
              <div className="project-stack">
                {['Python', 'YOLOv8', 'OpenCV', 'Spring Boot', 'PostgreSQL'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </article>
          <nav className="portfolio-portals" aria-label="Explore portfolio views" data-reveal>
            <a href="/impact">
              <span>01 // Data view</span>
              <strong>Impact Dashboard</strong>
              <small>Measured engineering outcomes</small>
              <ArrowIcon />
            </a>
            <a href="/interview-me">
              <span>02 // Interactive view</span>
              <strong>Interview Terminal</strong>
              <small>Ask about systems, automation, and delivery</small>
              <ArrowIcon />
            </a>
          </nav>
        </section>

        <section className="contact section" id="contact">
          <p className="contact-kicker" data-reveal>Have a project or opportunity?</p>
          <h2 data-reveal>Let&apos;s build something <span>reliable.</span></h2>
          <button
            className="contact-email"
            type="button"
            onClick={copyEmail}
            data-copy-state={copyState}
            data-reveal
            aria-label={`Copy ${EMAIL} to clipboard`}
          >
            <span className="copy-status" role="status" aria-live="polite">
              {copyState === 'copied'
                ? 'Copied! ✅'
                : copyState === 'error'
                  ? 'Copy failed — try again'
                  : EMAIL}
            </span>
            <ArrowIcon />
          </button>
          <div className="contact-details" data-reveal>
            <a href="tel:+66882822749">
              <span>Phone</span>
              (+66) 88 282 2749
            </a>
            <div>
              <span>Location</span>
              Nonthaburi, Thailand
            </div>
            <div className="footer-socials">
              <a href="https://linkedin.com/in/surachet-panto" target="_blank" rel="noreferrer">
                LinkedIn <ArrowIcon />
              </a>
              <a href="https://github.com/Surasinz" target="_blank" rel="noreferrer">
                GitHub <ArrowIcon />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top">SP<span>.</span></a>
        <p>Designed &amp; built by Surachet Panto</p>
        <p>© 2026</p>
      </footer>
    </div>
  );
}

export default App;
