import { useEffect, useRef, useState } from 'react';
import './ComponentDocsPage.css';

const PRISM_VERSION = '1.29.0';
const PRISM_STYLES = [
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/themes/prism-okaidia.min.css`,
    integrity: 'sha384-qTzu9jz8wpyzFe5KLoZfw0CS5iY+kCoZlBd5ByJ3f0NUT9dgCIU19M1IQKj594Ei',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/plugins/line-numbers/prism-line-numbers.min.css`,
    integrity: 'sha384-nUkTNLI8COlMCRJ0FHIdX76If83145OTCLUx4gQyfnO0gGeO/sD9czGEUBxtkcUv',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/plugins/toolbar/prism-toolbar.min.css`,
    integrity: 'sha384-EUzJ34/1CCeefTGUKLgvA5Z/vYIwi+Jyu8aAaCfFDxfwZ3Xs3OfkkIeegsLRM11e',
  },
];
const PRISM_SCRIPTS = [
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/components/prism-core.min.js`,
    integrity: 'sha384-MXybTpajaBV0AkcBaCPT4KIvo0FzoCiWXgcihYsw4FUkEz0Pv3JGV6tk2G8vJtDc',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/components/prism-markup.min.js`,
    integrity: 'sha384-HkMr0bZB9kBW4iVtXn6nd35kO/L/dQtkkUBkL9swzTEDMdIe5ExJChVDSnC79aNA',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/components/prism-css.min.js`,
    integrity: 'sha384-0mV13Neu0xhJFylI+HV43C+XiR13bGSeL7D0/7e6hK7sJgvyvK6HVjeQwmvXTstY',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/components/prism-clike.min.js`,
    integrity: 'sha384-7LHwxHIDSHTBleLmgDWZbC/IMJsfYfFVOihKhvsrxYW4j47YQcRwZja4ToFE3bA8',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/components/prism-javascript.min.js`,
    integrity: 'sha384-D44bgYYKvaiDh4cOGlj1dbSDpSctn2FSUj118HZGmZEShZcO2v//Q5vvhNy206pp',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/plugins/line-numbers/prism-line-numbers.min.js`,
    integrity: 'sha384-6QJu8apxMmB9TiPVWzYKF5pRgKcz7snO0/QU+MrWmgBLECQjoa6erxX2VQ5t41Jd',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/plugins/toolbar/prism-toolbar.min.js`,
    integrity: 'sha384-jC1G68eGEXJpPwMDNqyIUQsQlcUCdCU+a7GGuoV4TUZvM1gLYTMJUDvqBnxtZLWA',
  },
  {
    source: `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js`,
    integrity: 'sha384-ZdEfx8sYX8i4IVXU1tUbqwOp4PBUCCmnpagpiHchnstXkEczkzPfUd9fvBrntM+F',
  },
];

let prismLoader;

function loadScript({ source, integrity }) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${source}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing ?? document.createElement('script');
    const handleLoad = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error(`Unable to load Prism asset: ${source}`));
      },
      { once: true }
    );

    if (!existing) {
      script.src = source;
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
      script.defer = true;
      script.dataset.prismDocs = 'true';
      document.body.appendChild(script);
    }
  });
}

function loadPrism() {
  if (
    window.Prism?.highlightAllUnder &&
    window.Prism?.languages?.javascript &&
    window.Prism?.plugins?.toolbar &&
    window.Prism?.plugins?.lineNumbers &&
    window.Prism?.plugins?.copyToClipboard
  ) {
    return Promise.resolve(window.Prism);
  }
  if (prismLoader) return prismLoader;

  PRISM_STYLES.forEach(({ source, integrity }) => {
    if (document.querySelector(`link[href="${source}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = source;
    link.integrity = integrity;
    link.crossOrigin = 'anonymous';
    link.dataset.prismDocs = 'true';
    document.head.appendChild(link);
  });

  window.Prism = window.Prism || {};
  window.Prism.manual = true;
  prismLoader = PRISM_SCRIPTS.reduce(
    (chain, asset) => chain.then(() => loadScript(asset)),
    Promise.resolve()
  )
    .then(() => {
      window.Prism.plugins.copyToClipboard = true;
      return window.Prism;
    })
    .catch((error) => {
      prismLoader = null;
      throw error;
    });

  return prismLoader;
}

const spotlightHtml = `<button
  class="spotlight-avatar"
  type="button"
  aria-label="Toggle alternate avatar reveal"
  aria-pressed="false"
>
  <img class="avatar-base" src="/surachet-avatar.webp" alt="Surachet avatar">
  <img class="avatar-reveal" src="/avatar-formal.webp" alt="">
</button>`;

const spotlightCss = `.spotlight-avatar {
  --x: 50%;
  --y: 50%;
  position: relative;
  display: block;
  width: min(100%, 430px);
  aspect-ratio: 928 / 960;
  overflow: hidden;
  border: 0;
  padding: 0;
  background: #eef1f3;
  cursor: crosshair;
}

.spotlight-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-reveal {
  opacity: 0;
  transition: opacity 220ms ease;
  mask-image: radial-gradient(
    circle 150px at var(--x) var(--y),
    #000 45%,
    transparent 100%
  );
}

.spotlight-avatar.is-active .avatar-reveal,
.spotlight-avatar.is-pinned .avatar-reveal,
.spotlight-avatar:focus-visible .avatar-reveal {
  opacity: 1;
}`;

const spotlightJs = `const spotlight = document.querySelector('.spotlight-avatar');

function moveSpotlight(event) {
  const bounds = spotlight.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
  const y = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);

  spotlight.style.setProperty('--x', \`\${x}px\`);
  spotlight.style.setProperty('--y', \`\${y}px\`);
  spotlight.classList.add('is-active');
}

spotlight.addEventListener('pointerenter', moveSpotlight);
spotlight.addEventListener('pointermove', moveSpotlight);
spotlight.addEventListener('pointerleave', () => {
  if (spotlight.getAttribute('aria-pressed') !== 'true') {
    spotlight.classList.remove('is-active');
  }
});
spotlight.addEventListener('focus', () => {
  spotlight.classList.add('is-active');
});
spotlight.addEventListener('blur', () => {
  if (spotlight.getAttribute('aria-pressed') !== 'true') {
    spotlight.classList.remove('is-active');
  }
});
spotlight.addEventListener('click', () => {
  const pinned = spotlight.getAttribute('aria-pressed') !== 'true';
  spotlight.setAttribute('aria-pressed', String(pinned));
  spotlight.classList.toggle('is-pinned', pinned);
});`;

const terminalHtml = `<form class="terminal-form">
  <label>
    <span>CALLSIGN</span>
    <input name="name" placeholder="Enter your name">
  </label>
  <label>
    <span>MESSAGE</span>
    <textarea name="message" placeholder="Write a transmission"></textarea>
  </label>
  <button type="submit">[ TRANSMIT DATA ]</button>
</form>`;

const terminalCss = `.terminal-form {
  border: 1px solid rgba(0, 243, 255, 0.3);
  padding: 2rem;
  background: #0a0a0f;
}

.terminal-form input,
.terminal-form textarea {
  width: 100%;
  border: 0;
  border-bottom: 1px solid #00f3ff;
  background: transparent;
  color: #f4f1ea;
}

.terminal-form button:hover {
  background: #39ff14;
  color: #0a0a0f;
}`;

const COMPONENTS = [
  {
    id: 'spotlight-avatar',
    index: '01',
    title: 'Mouse Spotlight Reveal',
    shortTitle: 'Spotlight Avatar',
    status: 'INTERACTIVE',
    description:
      'Two perfectly aligned avatar layers use a soft radial mask to reveal the alternate image exactly beneath the pointer.',
    prompt:
      'Create a two-layer profile image. Track the pointer inside the frame and use a feathered radial CSS mask to reveal the image underneath. Fade the reveal out when the pointer leaves.',
    code: [
      { label: 'HTML', language: 'html', value: spotlightHtml },
      { label: 'CSS', language: 'css', value: spotlightCss },
      { label: 'JavaScript', language: 'javascript', value: spotlightJs },
    ],
  },
  {
    id: 'terminal-form',
    index: '02',
    title: 'Terminal Feedback Form',
    shortTitle: 'Terminal Form',
    status: 'FORM UI',
    description:
      'A focused terminal-style form pattern with clear labels, neon focus states, and a high-contrast transmission action.',
    prompt:
      'Design an accessible cyberpunk feedback form with monospace labels, transparent inputs, neon focus borders, and a prominent transmit button.',
    code: [
      { label: 'HTML', language: 'html', value: terminalHtml },
      { label: 'CSS', language: 'css', value: terminalCss },
    ],
  },
];

function SpotlightPreview() {
  const frameRef = useRef(null);
  const [pinned, setPinned] = useState(false);

  const updateSpotlight = (event) => {
    const frame = frameRef.current;
    if (!frame) return;

    const bounds = frame.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const y = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
    frame.style.setProperty('--docs-spotlight-x', `${x}px`);
    frame.style.setProperty('--docs-spotlight-y', `${y}px`);
    frame.classList.add('is-active');
  };

  return (
    <button
      type="button"
      className={`docs-spotlight${pinned ? ' is-pinned' : ''}`}
      ref={frameRef}
      aria-label="Toggle alternate avatar reveal"
      aria-pressed={pinned}
      onPointerEnter={updateSpotlight}
      onPointerMove={updateSpotlight}
      onPointerLeave={() => {
        if (!pinned) frameRef.current?.classList.remove('is-active');
      }}
      onFocus={() => frameRef.current?.classList.add('is-active')}
      onBlur={() => {
        if (!pinned) frameRef.current?.classList.remove('is-active');
      }}
      onClick={() => setPinned((current) => !current)}
      data-testid="docs-spotlight"
    >
      <img
        src={`${process.env.PUBLIC_URL}/surachet-avatar.webp`}
        alt="Streetwear avatar"
        width="928"
        height="960"
        draggable="false"
      />
      <img
        className="docs-spotlight-reveal"
        src={`${process.env.PUBLIC_URL}/avatar-formal.webp`}
        alt=""
        aria-hidden="true"
        width="928"
        height="960"
        draggable="false"
      />
      <span aria-hidden="true">MOVE CURSOR // REVEAL LAYER</span>
    </button>
  );
}

function TerminalFormPreview() {
  return (
    <form
      className="docs-terminal-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        <span>CALLSIGN</span>
        <input type="text" placeholder="Enter your name" />
      </label>
      <label>
        <span>MESSAGE</span>
        <textarea rows="3" placeholder="Write a transmission" />
      </label>
      <button type="submit">[ TRANSMIT DATA ]</button>
      <small>PREVIEW MODE // NO PAYLOAD TRANSMITTED</small>
    </form>
  );
}

function ComponentPreview({ componentId }) {
  return componentId === 'spotlight-avatar' ? (
    <SpotlightPreview />
  ) : (
    <TerminalFormPreview />
  );
}

export default function ComponentDocsPage() {
  const initialId = window.location.hash.slice(1);
  const [selectedId, setSelectedId] = useState(
    COMPONENTS.some((component) => component.id === initialId)
      ? initialId
      : COMPONENTS[0].id
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.matchMedia?.('(max-width: 820px)').matches ?? false
  );
  const selected = COMPONENTS.find((component) => component.id === selectedId);
  const contentRef = useRef(null);
  const menuToggleRef = useRef(null);
  const sidebarRef = useRef(null);
  const menuWasOpenRef = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Component Documentation — Surachet Panto';

    const handleHashChange = () => {
      const nextId = window.location.hash.slice(1);
      if (COMPONENTS.some((component) => component.id === nextId)) {
        setSelectedId(nextId);
        setMenuOpen(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      document.title = previousTitle;
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(max-width: 820px)');
    if (!mediaQuery) return undefined;

    const handleViewportChange = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) setMenuOpen(false);
    };
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', handleViewportChange);
    return () =>
      mediaQuery.removeEventListener?.('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      menuWasOpenRef.current = false;
      return undefined;
    }

    if (menuOpen) {
      sidebarRef.current?.querySelector('nav a')?.focus();
    } else if (menuWasOpenRef.current) {
      menuToggleRef.current?.focus();
    }
    menuWasOpenRef.current = menuOpen;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, menuOpen]);

  useEffect(() => {
    let active = true;
    loadPrism()
      .then((Prism) => {
        if (active && contentRef.current) {
          Prism.highlightAllUnder(contentRef.current);
        }
      })
      .catch(() => {
        // Code remains readable if the CDN is unavailable.
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="component-docs-page">
      <header className="docs-mobile-header">
        <a href="/" className="docs-brand" aria-label="Back to portfolio">
          SP<span>.</span>
        </a>
        <span>COMPONENT SYSTEM</span>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="component-navigation"
          aria-label="Toggle component navigation"
          ref={menuToggleRef}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <i />
          <i />
          <i />
        </button>
      </header>

      <aside
        className={`docs-sidebar${menuOpen ? ' is-open' : ''}`}
        id="component-navigation"
        ref={sidebarRef}
        aria-hidden={isMobile && !menuOpen ? 'true' : undefined}
        inert={isMobile && !menuOpen ? true : undefined}
      >
        <a href="/" className="docs-brand" aria-label="Back to portfolio">
          SP<span>.</span>
        </a>
        <div className="docs-sidebar-heading">
          <span>DS_01</span>
          <p>Component Documentation</p>
        </div>
        <nav aria-label="Component documentation">
          <p>COMPONENT_INDEX</p>
          {COMPONENTS.map((component) => (
            <a
              href={`#${component.id}`}
              className={selectedId === component.id ? 'is-current' : ''}
              aria-current={selectedId === component.id ? 'page' : undefined}
              key={component.id}
              onClick={() => {
                setSelectedId(component.id);
                setMenuOpen(false);
              }}
            >
              <span aria-hidden="true">{component.index}</span>
              {component.shortTitle}
            </a>
          ))}
        </nav>
        <div className="docs-sidebar-footer">
          <span>STATUS</span>
          <b>DOCUMENTED</b>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="docs-menu-scrim"
          aria-label="Close component navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="docs-content" ref={contentRef}>
        <section className="docs-hero">
          <span>ENTERPRISE_BUILDER // UI_LIBRARY</span>
          <p>Design System / v1.0</p>
          <h1>Component<br />Documentation</h1>
          <div>
            <p>
              Interactive patterns, implementation prompts, and production-ready
              code from the Surachet portfolio interface.
            </p>
            <span>{String(COMPONENTS.length).padStart(2, '0')} COMPONENTS</span>
          </div>
        </section>

        <article className="docs-component" id={selected.id}>
          <header className="docs-component-header">
            <div>
              <span>{`${selected.index} // ${selected.status}`}</span>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
            </div>
            <b>READY</b>
          </header>

          <section className="docs-block" aria-labelledby="preview-title">
            <header>
              <span>01</span>
              <h3 id="preview-title">Live Preview</h3>
              <small>INTERACTIVE SANDBOX</small>
            </header>
            <div className="preview-box">
              <ComponentPreview componentId={selected.id} />
            </div>
          </section>

          <section className="docs-block" aria-labelledby="prompt-title">
            <header>
              <span>02</span>
              <h3 id="prompt-title">AI Prompt</h3>
              <small>GENERATION INPUT</small>
            </header>
            <blockquote className="docs-prompt">
              <span aria-hidden="true">builder@prompt:~$</span>
              <p>{selected.prompt}</p>
              <i aria-hidden="true" />
            </blockquote>
          </section>

          <section className="docs-block" aria-labelledby="code-title">
            <header>
              <span>03</span>
              <h3 id="code-title">Code Snippets</h3>
              <small>PRISM.JS // COPY ENABLED</small>
            </header>
            <div className="docs-code-grid">
              {selected.code.map((snippet) => (
                <div className="docs-code-card" key={snippet.label}>
                  <div>
                    <span>{snippet.label}</span>
                    <small>{snippet.language.toUpperCase()}</small>
                  </div>
                  <pre
                    className="line-numbers"
                    data-label={snippet.label}
                    data-prismjs-copy="Copy"
                    data-prismjs-copy-success="Copied!"
                    data-prismjs-copy-error="Press Ctrl+C"
                  >
                    <code className={`line-numbers language-${snippet.language}`}>
                      {snippet.value}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          </section>
        </article>

        <footer className="docs-page-footer">
          <span>SURACHET_UI // 2026</span>
          <a href="/">Return to portfolio ↗</a>
        </footer>
      </main>
    </div>
  );
}

export { COMPONENTS, PRISM_SCRIPTS, PRISM_STYLES };
