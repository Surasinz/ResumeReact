import { useEffect } from 'react';
import './App.css';

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

function App() {
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

  return (
    <div className="site-shell">
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
              <article className="timeline-item" data-reveal key={`${item.role}-${item.period}`}>
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
          <div className="skill-groups">
            <div className="skill-group" data-reveal>
              <p className="card-kicker">Programming languages</p>
              <div className="badge-grid">
                {programmingLanguages.map((skill, index) => (
                  <span key={skill}><small>{String(index + 1).padStart(2, '0')}</small>{skill}</span>
                ))}
              </div>
            </div>
            <div className="skill-group skill-group-alt" data-reveal>
              <p className="card-kicker">Technologies &amp; tools</p>
              <div className="badge-grid">
                {tools.map((skill, index) => (
                  <span key={skill}><small>{String(index + 1).padStart(2, '0')}</small>{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="projects section" id="projects">
          <SectionHeading number="05" eyebrow="Featured project" title="Built beyond the brief." />
          <article className="project-card" data-reveal>
            <div className="project-visual" aria-hidden="true">
              <div className="scan-grid" />
              <div className="helmet">
                <span className="helmet-shell" />
                <span className="helmet-visor" />
              </div>
              <span className="detection-corner corner-one" />
              <span className="detection-corner corner-two" />
              <div className="detection-label">Helmet · 98.6%</div>
            </div>
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
          <a className="contact-email" href="mailto:surachetpan@hotmail.com" data-reveal>
            surachetpan@hotmail.com <ArrowIcon />
          </a>
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
