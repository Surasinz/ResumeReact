import { useEffect, useRef, useState } from 'react';
import './App.css';
import MatrixRainBackground from './MatrixRainBackground';
import PixelLiquidBackground from './PixelLiquidBackground';
import HelmetViewer from './HelmetViewer';
import TechCore from './TechCore';
import WebShimeji from './shimeji/WebShimeji';
import ViewSidebar from './ViewSidebar';
import { useTheme } from './ThemeSystem';
import { LocalizedText, useLanguage } from './LanguageSystem';

const EMAIL = 'surachetpan@hotmail.com';
const BACKGROUND_EFFECTS_PREFERENCE_KEY = 'surachet-background-effects-animation';
const PIXEL_LIQUID_PREFERENCE_KEY = 'surachet-pixel-liquid-animation';
const LEGACY_MATRIX_PREFERENCE_KEY = 'surachet-matrix-animation';

const experiences = [
  {
    period: '03/2025 — Present',
    roleKey: 'exp_software_role',
    company: 'Gosoft (Thailand) Co., Ltd.',
    descriptionKey: 'exp_software_desc',
    current: true,
  },
  {
    period: '07/2024 — 02/2025',
    roleKey: 'exp_trainee_role',
    company: 'Gosoft (Thailand) Co., Ltd.',
    descriptionKey: 'exp_trainee_desc',
  },
  {
    period: '09/2023 — 12/2023',
    roleKey: 'exp_part_time_role',
    company: 'Enterprise Computing Services (Thailand) Co., Ltd.',
    descriptionKey: 'exp_part_time_desc',
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

function useMagneticHover(strength = 0.25, maxOffset = 10) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined;

    const clamp = (value) => Math.max(-maxOffset, Math.min(maxOffset, value));

    const handleMouseMove = (event) => {
      const bounds = el.getBoundingClientRect();
      const x = event.clientX - (bounds.left + bounds.width / 2);
      const y = event.clientY - (bounds.top + bounds.height / 2);
      el.style.setProperty('--magnet-x', `${clamp(x * strength)}px`);
      el.style.setProperty('--magnet-y', `${clamp(y * strength)}px`);
    };

    const handleMouseLeave = () => {
      el.style.setProperty('--magnet-x', '0px');
      el.style.setProperty('--magnet-y', '0px');
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, maxOffset]);

  return ref;
}

function SectionHeading({ number, eyebrowKey, titleKey }) {
  return (
    <div className="section-heading" data-reveal>
      <p>
        <span className="section-heading-number">{number}</span>
        <LocalizedText i18nKey={eyebrowKey} />
      </p>
      <LocalizedText as="h2" i18nKey={titleKey} />
    </div>
  );
}

function SkillMarquee({ labelKey, items, reverse = false }) {
  const [paused, setPaused] = useState(false);
  const { language, t } = useLanguage();
  const label = t(labelKey);

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
        <LocalizedText as="p" className="card-kicker" i18nKey={labelKey} />
        <button
          className="marquee-toggle"
          type="button"
          lang={language}
          onClick={() => setPaused((current) => !current)}
          aria-pressed={paused}
          aria-label={`${t(paused ? 'resume' : 'pause')} ${label} ${t('animation')}`}
        >
          <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
          {t(paused ? 'play' : 'pause')}
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
        <HelmetViewer />
        <span className="detection-corner corner-one" />
        <span className="detection-corner corner-two" />
        <div className="detection-label">Helmet · 98.6%</div>
      </div>
    </div>
  );
}

function useCountUp(target, { decimals = 0, duration = 1200 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      setValue(target);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);

          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) requestAnimationFrame(tick);
            else setValue(target);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value.toFixed(decimals)];
}

function StatCounter({ target, decimals = 0, suffix = '' }) {
  const [ref, value] = useCountUp(target, { decimals });

  return (
    <strong ref={ref}>
      {value}
      {suffix}
    </strong>
  );
}

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#01';

function useScrambleText(text, { duration = 700, delay = 0 } = {}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text);
      return undefined;
    }

    let start = null;
    let frame = null;

    const step = (now) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const revealCount = Math.floor(progress * text.length);

      setDisplay(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ' || index < revealCount) return char;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join('')
      );

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setDisplay(text);
      }
    };

    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [text, duration, delay]);

  return display;
}

function ScrambleText({ text, delay, ...props }) {
  const display = useScrambleText(text, { delay });

  return (
    <span {...props} aria-label={text}>
      {display}
    </span>
  );
}

function ScrambleLocalizedText({ i18nKey, delay, ...props }) {
  const { language, t } = useLanguage();
  const text = t(i18nKey);
  const display = useScrambleText(text, { delay });

  return (
    <span {...props} lang={language} aria-label={text}>
      {display}
    </span>
  );
}

function AvatarSpotlight() {
  const frameRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        src={`${process.env.PUBLIC_URL}/${isDark ? 'surachet-avatar.webp' : 'surachet-avatar-light.webp'}`}
        alt="3D streetwear avatar of Surachet Panto"
        width="928"
        height="960"
        fetchPriority="high"
        decoding="async"
        draggable="false"
      />
      <img
        className="avatar-image avatar-image-reveal"
        src={`${process.env.PUBLIC_URL}/${isDark ? 'avatar-formal.webp' : 'avatar-formal-light.webp'}`}
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
  const { theme } = useTheme();
  const { language, t } = useLanguage();
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
  const primaryButtonRef = useMagneticHover();
  const secondaryButtonRef = useMagneticHover();
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

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const root = document.documentElement;
    let frame = null;

    const updateParallax = () => {
      frame = null;
      const scrollY = window.scrollY;
      root.style.setProperty('--parallax-bg', `${Math.min(scrollY * 0.05, 40)}px`);
      root.style.setProperty('--parallax-orbit', `${Math.min(scrollY * 0.12, 90)}px`);
    };

    const handleScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
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
        '--cursor-default': `url("${process.env.PUBLIC_URL}/${theme === 'dark' ? 'cursor-dark.png' : 'cursor.png'}") 3 3, auto`,
        '--cursor-hand': `url("${process.env.PUBLIC_URL}/${theme === 'dark' ? 'hand-dark.png' : 'hand.png'}") 4 4, pointer`,
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
        aria-label={t('background_animations')}
        lang={language}
      >
        <span className="matrix-switch-track" aria-hidden="true">
          <span className="matrix-switch-thumb" />
        </span>
        <span className="matrix-toggle-label" aria-hidden="true">
          <LocalizedText i18nKey="background_fx" />
          <LocalizedText i18nKey={backgroundEffectsEnabled ? 'on' : 'off'} />
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
              <LocalizedText i18nKey={`nav_${sectionId}`} />
            </a>
          ))}
          <span className="nav-indicator" aria-hidden="true" />
        </nav>
        <a className="topbar-cta" href="mailto:surachetpan@hotmail.com">
          <LocalizedText i18nKey="top_lets_talk" /> <ArrowIcon />
        </a>
      </header>

      <main id="portfolio-main" tabIndex="-1">
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="availability" data-reveal>
              <span className="status-dot" />
              <LocalizedText i18nKey="availability" />
            </div>
            <h1 data-reveal>
              <ScrambleLocalizedText
                className="hero-greeting"
                i18nKey="hero_greeting"
                delay={0}
              />
              <ScrambleText className="hero-name" text="Surachet" delay={140} />
              <ScrambleText className="outline-text" text="Panto." delay={280} />
            </h1>
            <LocalizedText
              as="p"
              className="hero-subtitle"
              data-reveal
              i18nKey="hero_subtitle"
            />
            <div className="hero-actions" data-reveal>
              <a className="button button-primary" href="#projects" ref={primaryButtonRef}>
                <LocalizedText i18nKey="view_projects" />{' '}
                <ArrowIcon />
              </a>
              <a className="button button-secondary" href="#contact" ref={secondaryButtonRef}>
                <LocalizedText i18nKey="contact_btn" />
              </a>
            </div>
            <div className="social-links" data-reveal>
              <LocalizedText i18nKey="find_online" />
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
            <LocalizedText i18nKey="scroll_explore" />
            <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="about section" id="about">
          <SectionHeading
            number="01"
            eyebrowKey="nav_about"
            titleKey="about_title"
          />
          <div className="about-grid">
            <LocalizedText
              as="p"
              className="about-lead"
              data-reveal
              i18nKey="about_lead"
            />
            <div className="about-copy" data-reveal>
              <LocalizedText as="p" i18nKey="about_p1" />
              <LocalizedText as="p" i18nKey="about_p2" />
            </div>
          </div>
          <div className="stats" data-reveal>
            <div><StatCounter target={3} /><LocalizedText i18nKey="stat_roles" /></div>
            <div><StatCounter target={15} suffix="+" /><LocalizedText i18nKey="stat_tools" /></div>
            <div><StatCounter target={3.62} decimals={2} /><LocalizedText i18nKey="stat_gpa" /></div>
          </div>
        </section>

        <section className="experience section" id="experience">
          <SectionHeading
            number="02"
            eyebrowKey="nav_experience"
            titleKey="experience_title"
          />
          <div className="timeline">
            {experiences.map((item, index) => (
              <article
                className="timeline-item"
                data-reveal
                style={{ '--reveal-delay': `${index * 80}ms` }}
                key={`${item.roleKey}-${item.period}`}
              >
                <div className="timeline-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="timeline-meta">
                  <p>{item.period}</p>
                  {item.current && <LocalizedText i18nKey="current" />}
                </div>
                <div className="timeline-content">
                  <LocalizedText as="h3" i18nKey={item.roleKey} />
                  <h4>{item.company}</h4>
                  <LocalizedText as="p" i18nKey={item.descriptionKey} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="education section" id="education">
          <SectionHeading
            number="03"
            eyebrowKey="education"
            titleKey="education_title"
          />
          <article className="education-card" data-reveal>
            <div className="education-monogram">PIM</div>
            <div>
              <LocalizedText as="p" className="card-kicker" i18nKey="degree" />
              <LocalizedText as="h3" i18nKey="major" />
              <p>Panyapiwat Institute of Management</p>
            </div>
            <div className="education-achievement">
              <span>GPA</span>
              <strong>3.62</strong>
              <LocalizedText as="p" i18nKey="honors" />
            </div>
          </article>
        </section>

        <section className="skills section" id="skills">
          <SectionHeading number="04" eyebrowKey="technical_skills" titleKey="skills_title" />
          <TechCore />
          <div className="skills-marquee">
            <SkillMarquee labelKey="programming_languages" items={programmingLanguages} />
            <SkillMarquee labelKey="technologies_tools" items={tools} reverse />
          </div>
        </section>

        <section className="projects section" id="projects">
          <SectionHeading number="05" eyebrowKey="featured_project" titleKey="project_title" />
          <article className="project-card" data-reveal>
            <ProjectVisual />
            <div className="project-copy">
              <LocalizedText as="p" className="card-kicker" i18nKey="project_category" />
              <LocalizedText as="h3" i18nKey="project_name" />
              <LocalizedText as="p" i18nKey="project_desc" />
              <div className="project-stack" lang="en">
                {['Python', 'YOLOv8', 'OpenCV', 'Spring Boot', 'PostgreSQL'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </article>
          <nav
            className="portfolio-portals"
            aria-label={t('explore_portfolio_views')}
            lang={language}
            data-reveal
          >
            <a href="/impact">
              <LocalizedText i18nKey="data_view" />
              <LocalizedText as="strong" i18nKey="impact_title" />
              <LocalizedText as="small" i18nKey="measured_outcomes" />
              <ArrowIcon />
            </a>
            <a href="/interview-me">
              <LocalizedText i18nKey="interactive_view" />
              <LocalizedText as="strong" i18nKey="interview_title" />
              <LocalizedText as="small" i18nKey="ask_delivery" />
              <ArrowIcon />
            </a>
          </nav>
        </section>

        <section className="contact section" id="contact">
          <LocalizedText as="p" className="contact-kicker" data-reveal i18nKey="contact_kicker" />
          <LocalizedText as="h2" data-reveal i18nKey="contact_title" />
          <button
            className="contact-email"
            type="button"
            onClick={copyEmail}
            data-copy-state={copyState}
            data-reveal
            aria-label={`${t('copy_email')} ${EMAIL} ${t('to_clipboard')}`}
            lang={language}
          >
            <span
              className="copy-status"
              role="status"
              aria-live="polite"
              lang={copyState === 'idle' ? 'en' : language}
            >
              {copyState === 'copied'
                ? t('copied')
                : copyState === 'error'
                  ? t('copy_failed')
                  : EMAIL}
            </span>
            <ArrowIcon />
          </button>
          <div className="contact-details" data-reveal>
            <a href="tel:+66882822749">
              <LocalizedText i18nKey="phone" />
              (+66) 88 282 2749
            </a>
            <div>
              <LocalizedText i18nKey="location" />
              <LocalizedText i18nKey="location_value" />
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
        <LocalizedText as="p" i18nKey="designed_by" />
        <p>© 2026</p>
      </footer>
    </div>
  );
}

export default App;
