import { useEffect, useRef, useState } from 'react';
import './App.css';

const EMAIL = 'surachetpan@hotmail.com';
const MATRIX_PREFERENCE_KEY = 'surachet-matrix-animation';
const MATRIX_CHARACTERS = '01{}[]<>/\\$#*+アイウエオカキクケコ';

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

function getInitialMatrixPreference() {
  try {
    const savedPreference = window.localStorage.getItem(MATRIX_PREFERENCE_KEY);
    if (savedPreference !== null) return savedPreference === 'true';
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function MatrixBackground({ enabled }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const fontSize = 16;
    const frameInterval = 50;
    let animationFrame;
    let lastFrameTime = 0;
    let drops = [];

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const columnCount = Math.ceil(width / fontSize);
      drops = Array.from({ length: columnCount }, () =>
        Math.floor(Math.random() * -(height / fontSize))
      );
    };

    const drawFrame = (timestamp) => {
      animationFrame = window.requestAnimationFrame(drawFrame);
      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      context.fillStyle = 'rgba(10, 10, 13, 0.12)';
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      context.fillStyle = '#c6ff00';
      context.font = `600 ${fontSize}px monospace`;

      drops.forEach((drop, index) => {
        const character =
          MATRIX_CHARACTERS[Math.floor(Math.random() * MATRIX_CHARACTERS.length)];
        context.fillText(character, index * fontSize, drop * fontSize);

        if (drop * fontSize > window.innerHeight && Math.random() > 0.975) {
          drops[index] = 0;
        } else {
          drops[index] += 1;
        }
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className={`matrix-background${enabled ? ' is-enabled' : ''}`}
      aria-hidden="true"
    />
  );
}

function App() {
  const [copyState, setCopyState] = useState('idle');
  const [matrixEnabled, setMatrixEnabled] = useState(getInitialMatrixPreference);
  const copyResetTimer = useRef(null);
  const isMounted = useRef(true);

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

  const toggleMatrixBackground = () => {
    setMatrixEnabled((currentValue) => {
      const nextValue = !currentValue;

      try {
        window.localStorage.setItem(MATRIX_PREFERENCE_KEY, String(nextValue));
      } catch {
        // The toggle still works for the current page when storage is unavailable.
      }

      return nextValue;
    });
  };

  return (
    <div className="site-shell">
      <MatrixBackground enabled={matrixEnabled} />
      <button
        className="matrix-toggle"
        type="button"
        onClick={toggleMatrixBackground}
        aria-pressed={matrixEnabled}
        aria-label={`${matrixEnabled ? 'Disable' : 'Enable'} Matrix background animation`}
      >
        <span className="matrix-toggle-icon" aria-hidden="true">01</span>
        <span>{matrixEnabled ? 'Disable animation' : 'Enable animation'}</span>
      </button>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Surachet Panto — home">
          SP<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
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
            <div className="avatar-frame">
              <img
                src={`${process.env.PUBLIC_URL}/surachet-avatar.jpg`}
                alt="3D streetwear avatar of Surachet Panto"
                width="1280"
                height="1280"
              />
            </div>
            <div className="floating-label floating-label-code">
              <span>&lt;/&gt;</span>
              Enterprise builder
            </div>
            <div className="floating-label floating-label-location">
              <span>●</span>
              Nonthaburi, TH
            </div>
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
