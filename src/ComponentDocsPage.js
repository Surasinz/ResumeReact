import { useEffect, useRef, useState } from 'react';
import './ComponentDocsPage.css';
import HelmetViewer from './HelmetViewer';
import PixelLiquidBackground from './PixelLiquidBackground';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { useTheme } from './ThemeSystem';

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

function resetPrismToolbars(root) {
  root.querySelectorAll('.code-toolbar').forEach((wrapper) => {
    const pre = Array.from(wrapper.children).find(
      (child) => child.tagName === 'PRE'
    );
    if (pre) wrapper.replaceWith(pre);
  });
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

const liquidGlsl = `precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform vec4 bgColor;
varying vec2 uv;

void main() {
  vec2 vel = texture2D(velocity, uv).xy;
  float t = smoothstep(0.0, 1.0, clamp(length(vel) * 2.2, 0.0, 1.0));

  // Sample the ramp, then fade toward the page colour as the fluid calms.
  // bgColor is what makes this survive a light theme.
  vec3 fluidColor = texture2D(palette, vec2(t, 0.5)).rgb;
  gl_FragColor = vec4(mix(bgColor.rgb, fluidColor, t), t);
}`;

const liquidJs = `// The ramp and the colour it settles into both follow the theme. On a light
// page calm fluid has to dissolve into white -- fading it to black instead
// is what paints grey smoke over the copy.
const PALETTE = isDark
  ? ['#000000', '#190713', '#521034', '#a91f68', '#ff35a2']
  : ['#ffffff', '#f4fbf2', '#dcf1d6', '#bfe3b6', '#8fc98a'];

const uniforms = {
  velocity: { value: simulation.fbos.vel0.texture },
  palette: { value: makePaletteTexture(PALETTE) },
  bgColor: {
    value: isDark
      ? new THREE.Vector4(0, 0, 0, 0)
      : new THREE.Vector4(1, 1, 1, 0),
  },
};

// Advect the velocity field, solve pressure, then draw the colour pass.
function frame() {
  simulation.update();
  renderer.setRenderTarget(null);
  renderer.render(outputScene, outputCamera);
  animationFrame = requestAnimationFrame(frame);
}`;

const liquidCss = `.pixel-liquid-background {
  position: fixed;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
}

.pixel-liquid-background.is-enabled {
  opacity: 1;
}

/* On paper the layer sits back as a wash rather than a glow. */
body[data-theme='light'] .pixel-liquid-background.is-enabled {
  opacity: 0.32;
}`;

const cursorCss = `@media (pointer: fine) {
  .language-content {
    cursor: var(--cursor-default);
  }

  .language-content a,
  .language-content button,
  .language-content [role='button'],
  .language-content input,
  .language-content textarea,
  .language-content summary {
    cursor: var(--cursor-hand);
  }
}`;

const cursorJs = `// Scoped to the wrapper every route renders inside, so the cursor survives
// navigation instead of living on a single page's shell.
function SiteCursorScope({ children }) {
  const { theme } = useTheme();
  const suffix = theme === 'dark' ? '-dark' : '';

  return (
    <div
      className="language-content"
      style={{
        // The trailing numbers are the hotspot: which pixel of the artwork
        // is the actual click point.
        '--cursor-default': \`url("/cursor\${suffix}.png") 3 3, auto\`,
        '--cursor-hand': \`url("/hand\${suffix}.png") 4 4, pointer\`,
      }}
    >
      {children}
    </div>
  );
}`;

const shimejiCss = `.web-shimeji {
  position: fixed;
  z-index: 55;
  top: 0;
  left: 0;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.42));
  cursor: grab;
  user-select: none;
  contain: layout paint style;
  will-change: transform, background-position;
}

.web-shimeji.is-dragging {
  cursor: grabbing;
}`;

const shimejiJs = `// One 7x5 atlas: columns are frames, rows are states.
const ANIMATIONS = {
  idle:    { row: 0, fps: 6 },
  walk:    { row: 1, fps: 10 },
  dragged: { row: 2, fps: 8 },
  falling: { row: 3, fps: 10 },
  working: { row: 4, fps: 7 },
};

const FRAME = 256;
const COLUMNS = 7;

function drawFrame(element, state, frameIndex) {
  const { row } = ANIMATIONS[state];
  const scale = element.offsetWidth / FRAME;

  // background-size scales the whole atlas; background-position picks the
  // one cell that should be visible.
  element.style.backgroundSize = \`\${FRAME * COLUMNS * scale}px auto\`;
  element.style.backgroundPosition =
    \`\${-frameIndex * FRAME * scale}px \${-row * FRAME * scale}px\`;
}`;

const helmetJsx = `// Scale is derived from the bounding box THREE reports once GLTFLoader has
// decoded the file. The raw glTF accessor range reads very differently, so
// trusting it put the model off by roughly 1700x.
const HELMET_SCALE = 1.6;

function HelmetModel() {
  const { scene } = useGLTF('/racing-helmet.glb');
  return (
    <Center>
      <primitive object={scene} scale={HELMET_SCALE} />
    </Center>
  );
}

export default function HelmetViewer() {
  return (
    <Canvas
      className="helmet-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 2.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <hemisphereLight args={['#ffffff', '#1a1a2e', 0.55]} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} />
      <Suspense fallback={null}>
        <HelmetModel />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate />
    </Canvas>
  );
}`;

const helmetCss = `/*
  Absolute on purpose. As a normal child of a CSS Grid parent that also has
  sibling elements, the canvas's measured size and the grid's auto-sized
  track feed back into each other and the model grows every frame, with no
  interaction needed to trigger it.
  See github.com/pmndrs/react-three-fiber/issues/2861
*/
.helmet-canvas {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
}`;

const COMPONENTS = [
  {
    id: 'spotlight-avatar',
    index: '01',
    title: 'Mouse Spotlight Reveal',
    titleKey: 'docs_spotlight_title',
    shortTitle: 'Spotlight Avatar',
    shortTitleKey: 'docs_spotlight_short',
    status: 'INTERACTIVE',
    description:
      'Two perfectly aligned avatar layers use a soft radial mask to reveal the alternate image exactly beneath the pointer.',
    descriptionKey: 'docs_spotlight_desc',
    prompt:
      'Create a two-layer profile image. Track the pointer inside the frame and use a feathered radial CSS mask to reveal the image underneath. Fade the reveal out when the pointer leaves.',
    promptKey: 'docs_spotlight_prompt',
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
    titleKey: 'docs_terminal_title',
    shortTitle: 'Terminal Form',
    shortTitleKey: 'docs_terminal_short',
    status: 'FORM UI',
    description:
      'A focused terminal-style form pattern with clear labels, neon focus states, and a high-contrast transmission action.',
    descriptionKey: 'docs_terminal_desc',
    prompt:
      'Design an accessible cyberpunk feedback form with monospace labels, transparent inputs, neon focus borders, and a prominent transmit button.',
    promptKey: 'docs_terminal_prompt',
    code: [
      { label: 'HTML', language: 'html', value: terminalHtml },
      { label: 'CSS', language: 'css', value: terminalCss },
    ],
  },
  {
    id: 'liquid-background',
    index: '03',
    title: 'Pixel Liquid Background',
    titleKey: 'docs_liquid_title',
    shortTitle: 'Liquid Background',
    shortTitleKey: 'docs_liquid_short',
    status: 'WEBGL',
    description:
      'A GPU fluid simulation drives the smoke behind the site. Velocity is advected, pressure solved for incompressibility, then sampled through a colour ramp that resolves into the page.',
    descriptionKey: 'docs_liquid_desc',
    prompt:
      'Build a WebGL background that simulates flowing liquid smoke reacting to the pointer. Advect a velocity field, solve for incompressibility with a Jacobi pressure pass, and map the result through a colour ramp that fades into the page background so it holds up on both light and dark themes.',
    promptKey: 'docs_liquid_prompt',
    code: [
      { label: 'Colour pass', language: 'glsl', value: liquidGlsl },
      { label: 'JavaScript', language: 'javascript', value: liquidJs },
      { label: 'CSS', language: 'css', value: liquidCss },
    ],
  },
  {
    id: 'custom-cursor',
    index: '04',
    title: 'Themed Custom Cursor',
    titleKey: 'docs_cursor_title',
    shortTitle: 'Custom Cursor',
    shortTitleKey: 'docs_cursor_short',
    status: 'POINTER',
    description:
      'Pointer artwork swapped through CSS custom properties, so one variable change re-skins every cursor on the page when the theme flips.',
    descriptionKey: 'docs_cursor_desc',
    prompt:
      'Replace the default pointer with custom PNG artwork using CSS cursor url() plus a hotspot offset. Drive the image path from a CSS variable so switching theme swaps the whole set at once, scope it to a wrapper shared by every route, and only apply it where the device actually has a fine pointer.',
    promptKey: 'docs_cursor_prompt',
    code: [
      { label: 'CSS', language: 'css', value: cursorCss },
      { label: 'React', language: 'javascript', value: cursorJs },
    ],
  },
  {
    id: 'web-shimeji',
    index: '05',
    title: 'Web Shimeji Mascot',
    titleKey: 'docs_shimeji_title',
    shortTitle: 'Shimeji Mascot',
    shortTitleKey: 'docs_shimeji_short',
    status: 'SPRITE',
    description:
      'A draggable desktop-pet mascot animated from a single sprite atlas: columns step the frames, rows select the state, and gravity returns it to the ground when released.',
    descriptionKey: 'docs_shimeji_desc',
    prompt:
      'Build a draggable browser mascot from one sprite sheet. Animate it by stepping background-position across columns, use a different row per state for idle, walk, drag, fall and work, and let it fall back to the ground when the pointer lets go.',
    promptKey: 'docs_shimeji_prompt',
    code: [
      { label: 'JavaScript', language: 'javascript', value: shimejiJs },
      { label: 'CSS', language: 'css', value: shimejiCss },
    ],
  },
  {
    id: 'helmet-model',
    index: '06',
    title: 'Helmet 3D Viewer',
    titleKey: 'docs_helmet_title',
    shortTitle: 'Helmet 3D',
    shortTitleKey: 'docs_helmet_short',
    status: '3D MODEL',
    description:
      'A glTF model in react-three-fiber, auto-centred and scaled from its measured bounding box, with orbit controls limited to rotation so the framing can never be lost.',
    descriptionKey: 'docs_helmet_desc',
    prompt:
      'Load a .glb model into a react-three-fiber canvas. Centre it automatically, derive its scale from the bounding box the renderer reports rather than the raw file values, light it with a hemisphere plus two directional lights, and allow drag-to-rotate while disabling zoom and pan.',
    promptKey: 'docs_helmet_prompt',
    code: [
      { label: 'React', language: 'javascript', value: helmetJsx },
      { label: 'CSS', language: 'css', value: helmetCss },
    ],
  },
];

function SpotlightPreview() {
  const { language, t } = useLanguage();
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
      aria-label={t('docs_move_cursor')}
      lang={language}
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
      <LocalizedText i18nKey="docs_move_cursor" aria-hidden="true" />
    </button>
  );
}

function TerminalFormPreview() {
  const { language, t } = useLanguage();

  return (
    <form
      className="docs-terminal-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        <LocalizedText i18nKey="docs_callsign" />
        <input
          type="text"
          lang={language}
          placeholder={t('docs_name_placeholder')}
        />
      </label>
      <label>
        <LocalizedText i18nKey="docs_message" />
        <textarea
          rows="3"
          lang={language}
          placeholder={t('docs_message_placeholder')}
        />
      </label>
      <button type="submit">[ <LocalizedText i18nKey="transmit" /> ]</button>
      <LocalizedText as="small" i18nKey="docs_preview_mode" />
    </form>
  );
}

function LiquidBackgroundPreview() {
  // The real background layer, contained by .docs-live-frame instead of
  // running fixed across the viewport.
  return (
    <div className="docs-live-frame" data-testid="docs-liquid">
      <PixelLiquidBackground enabled />
      <LocalizedText
        as="small"
        className="docs-frame-hint"
        i18nKey="docs_move_cursor"
      />
    </div>
  );
}

function CustomCursorPreview() {
  const { theme } = useTheme();
  const suffix = theme === 'dark' ? '-dark' : '';

  return (
    <div
      className="docs-cursor-pad"
      data-testid="docs-cursor"
      style={{
        '--docs-cursor-default': `url("${process.env.PUBLIC_URL}/cursor${suffix}.png") 3 3, auto`,
        '--docs-cursor-hand': `url("${process.env.PUBLIC_URL}/hand${suffix}.png") 4 4, pointer`,
      }}
    >
      <LocalizedText as="p" i18nKey="docs_cursor_hint" />
      <button type="button" onClick={(event) => event.preventDefault()}>
        [ <LocalizedText i18nKey="docs_cursor_hover" /> ]
      </button>
    </div>
  );
}

function ShimejiPreview() {
  // Steps the real atlas through its "working" row (row 4 of 5) the same way
  // the mounted mascot does, without letting it roam the docs page.
  return (
    <div className="docs-sprite-stage" data-testid="docs-shimeji">
      <span
        className="docs-sprite"
        style={{
          backgroundImage: `url("${process.env.PUBLIC_URL}/builder-bot-sprite.webp")`,
        }}
        aria-hidden="true"
      />
      <LocalizedText as="small" i18nKey="docs_shimeji_row" />
    </div>
  );
}

function HelmetModelPreview() {
  return (
    <div className="docs-live-frame" data-testid="docs-helmet">
      <HelmetViewer />
      <LocalizedText
        as="small"
        className="docs-frame-hint"
        i18nKey="docs_helmet_hint"
      />
    </div>
  );
}

const PREVIEWS = {
  'spotlight-avatar': SpotlightPreview,
  'terminal-form': TerminalFormPreview,
  'liquid-background': LiquidBackgroundPreview,
  'custom-cursor': CustomCursorPreview,
  'web-shimeji': ShimejiPreview,
  'helmet-model': HelmetModelPreview,
};

function ComponentPreview({ componentId }) {
  const Preview = PREVIEWS[componentId];
  return Preview ? <Preview /> : null;
}

export default function ComponentDocsPage() {
  const { language, t } = useLanguage();
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
          resetPrismToolbars(contentRef.current);
          Prism.highlightAllUnder(contentRef.current);
        }
      })
      .catch(() => {
        // Code remains readable if the CDN is unavailable.
      });

    return () => {
      active = false;
    };
  }, [language, selectedId, t]);

  return (
    <div className="component-docs-page">
      <header className="docs-mobile-header">
        <a
          href="/"
          className="docs-brand"
          aria-label={t('docs_back')}
          lang={language}
        >
          SP<span>.</span>
        </a>
        <span>COMPONENT SYSTEM</span>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="component-navigation"
          aria-label={t('docs_toggle_nav')}
          lang={language}
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
        <a
          href="/"
          className="docs-brand"
          aria-label={t('docs_back')}
          lang={language}
        >
          SP<span>.</span>
        </a>
        <div className="docs-sidebar-heading">
          <span>DS_01</span>
          <LocalizedText as="p" i18nKey="docs_title" />
        </div>
        <nav aria-label="Component documentation">
          <LocalizedText as="p" i18nKey="docs_index" />
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
              <LocalizedText i18nKey={component.shortTitleKey} />
            </a>
          ))}
        </nav>
        <div className="docs-sidebar-footer">
          <span>STATUS</span>
          <LocalizedText as="b" i18nKey="docs_documented" />
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="docs-menu-scrim"
          aria-label={t('docs_close_nav')}
          lang={language}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="docs-content" ref={contentRef}>
        <section className="docs-hero">
          <span>ENTERPRISE_BUILDER // UI_LIBRARY</span>
          <p>Design System / v1.0</p>
          <LocalizedText as="h1" i18nKey="docs_hero_title" />
          <div>
            <LocalizedText as="p" i18nKey="docs_hero_desc" />
            <span>
              {String(COMPONENTS.length).padStart(2, '0')}{' '}
              <LocalizedText i18nKey="docs_components" />
            </span>
          </div>
        </section>

        <article className="docs-component" id={selected.id}>
          <header className="docs-component-header">
            <div>
              <span>{`${selected.index} // ${selected.status}`}</span>
              <LocalizedText as="h2" i18nKey={selected.titleKey} />
              <LocalizedText as="p" i18nKey={selected.descriptionKey} />
            </div>
            <LocalizedText as="b" i18nKey="docs_ready" />
          </header>

          <section className="docs-block" aria-labelledby="preview-title">
            <header>
              <span>01</span>
              <LocalizedText as="h3" id="preview-title" i18nKey="docs_live_preview" />
              <LocalizedText as="small" i18nKey="docs_sandbox" />
            </header>
            <div className="preview-box">
              <ComponentPreview componentId={selected.id} />
            </div>
          </section>

          <section className="docs-block" aria-labelledby="prompt-title">
            <header>
              <span>02</span>
              <LocalizedText as="h3" id="prompt-title" i18nKey="docs_ai_prompt" />
              <LocalizedText as="small" i18nKey="docs_generation_input" />
            </header>
            <blockquote className="docs-prompt">
              <span aria-hidden="true">builder@prompt:~$</span>
              <LocalizedText as="p" i18nKey={selected.promptKey} />
              <i aria-hidden="true" />
            </blockquote>
          </section>

          <section className="docs-block" aria-labelledby="code-title">
            <header>
              <span>03</span>
              <LocalizedText as="h3" id="code-title" i18nKey="docs_code_snippets" />
              <LocalizedText as="small" i18nKey="docs_copy_enabled" />
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
                    data-prismjs-copy={t('copy')}
                    data-prismjs-copy-success={t('copied')}
                    data-prismjs-copy-error={t('copy_failed')}
                    lang="en"
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
          <a href="/"><LocalizedText i18nKey="return_portfolio" /> ↗</a>
        </footer>
      </main>
    </div>
  );
}

export { COMPONENTS, PRISM_SCRIPTS, PRISM_STYLES };
