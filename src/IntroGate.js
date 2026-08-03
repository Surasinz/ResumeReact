import { useCallback, useEffect, useRef, useState } from 'react';
import roomBackground from './assets/intro-room-bg.webp';
import roomForeground from './assets/intro-room-fg.webp';
import monitorFrame from './assets/intro-monitor-frame.webp';
import './IntroGate.css';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { useTheme } from './ThemeSystem';

export const INTRO_SESSION_KEY = 'surachet-intro-seen';
export const PHASES = ['idle', 'loading', 'zooming', 'brighten'];
export const LOAD_SECONDS = 0.7;
export const ZOOM_SECONDS = 0.85;
export const BRIGHT_SECONDS = 0.3;

export const getLoadingProgress = (elapsedMs) =>
  72 + Math.min(Math.max(elapsedMs, 0) / (LOAD_SECONDS * 1000), 1) * 28;

const HACK_GLYPHS = '01<>[]{}/*+$#_';
const HACK_LOGS = [
  'TRACE ROUTE // NONTHABURI_TH',
  'SCANNING ENTERPRISE MODULES',
  'DATABASE TUNNEL // SECURE',
  'IDENTITY // SURACHET_PANTO',
];

export function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
  } catch {
    // The gate still dismisses for this page view when storage is blocked.
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function drawHackerScreen(context, width, height, time, phaseElapsed, accent, phase) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#020509';
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(
    width * 0.5,
    height * 0.42,
    0,
    width * 0.5,
    height * 0.42,
    width * 0.7
  );
  glow.addColorStop(0, `${accent}28`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const glyphSize = Math.max(9, Math.round(width / 74));
  const columns = Math.ceil(width / (glyphSize * 1.45));
  const rows = Math.ceil(height / (glyphSize * 1.6));
  const step = Math.floor(time / 80);
  context.font = `${glyphSize}px "SFMono-Regular", Consolas, monospace`;
  context.textAlign = 'center';

  for (let column = 0; column < columns; column += 1) {
    const head = (step + column * 7) % (rows + 8);
    for (let tail = 0; tail < 7; tail += 1) {
      const row = head - tail;
      if (row < 0 || row >= rows) continue;
      const glyphIndex = (column * 13 + row * 5 + step) % HACK_GLYPHS.length;
      context.globalAlpha = Math.max(0.04, 0.34 - tail * 0.047);
      context.fillStyle = tail === 0 ? '#ffffff' : accent;
      context.fillText(
        HACK_GLYPHS[glyphIndex],
        column * glyphSize * 1.45 + glyphSize,
        row * glyphSize * 1.6 + glyphSize
      );
    }
  }
  context.globalAlpha = 1;

  const panelX = width * 0.075;
  const panelY = height * 0.13;
  const panelWidth = width * 0.6;
  const panelHeight = height * 0.66;
  context.fillStyle = 'rgba(1, 6, 10, 0.82)';
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  context.strokeStyle = `${accent}8f`;
  context.lineWidth = 1;
  context.strokeRect(panelX, panelY, panelWidth, panelHeight);

  const textSize = Math.max(10, Math.round(width / 66));
  context.textAlign = 'left';
  context.font = `700 ${textSize}px "SFMono-Regular", Consolas, monospace`;
  context.fillStyle = accent;
  context.fillText('SURACHET_SECURE_SHELL v2.5D', panelX + 18, panelY + 28);

  context.font = `${Math.max(9, textSize * 0.76)}px "SFMono-Regular", Consolas, monospace`;
  HACK_LOGS.forEach((log, index) => {
    const active = (step + index) % 5 !== 0;
    context.globalAlpha = active ? 0.9 : 0.42;
    context.fillStyle = index === 3 ? '#ffffff' : accent;
    context.fillText(`> ${log}`, panelX + 18, panelY + 62 + index * (textSize * 1.55));
  });
  context.globalAlpha = 1;

  const idleProgress = 38 + ((time / 90) % 33);
  const loadingProgress = getLoadingProgress(phaseElapsed);
  const progress = phase === 'idle' ? idleProgress : phase === 'loading' ? loadingProgress : 100;
  const barX = panelX + 18;
  const barY = panelY + panelHeight - 46;
  const barWidth = panelWidth - 36;
  context.fillStyle = `${accent}24`;
  context.fillRect(barX, barY, barWidth, 7);
  context.fillStyle = accent;
  context.fillRect(barX, barY, barWidth * (progress / 100), 7);
  context.font = `700 ${Math.max(9, textSize * 0.72)}px "SFMono-Regular", Consolas, monospace`;
  context.fillText(
    progress >= 100 ? 'ACCESS GRANTED // ENTERPRISE BUILDER ONLINE' : `DECRYPTING PORTFOLIO // ${Math.floor(progress)}%`,
    barX,
    barY + 29
  );

  context.globalAlpha = 0.08;
  context.fillStyle = '#ffffff';
  for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 1);
  context.globalAlpha = 1;
}

function HackerScreen({ phase, accent, reducedMotion }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    let animationFrame = null;
    let previousFrame = 0;
    let width = 800;
    let height = 450;
    const phaseStartedAt = window.performance?.now?.() ?? 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(320, Math.round(bounds.width || 800));
      height = Math.max(180, Math.round(bounds.height || 450));
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const render = (time = 0) => {
      if (time - previousFrame >= 32 || previousFrame === 0) {
        drawHackerScreen(
          context,
          width,
          height,
          time,
          time - phaseStartedAt,
          accent,
          phase
        );
        previousFrame = time;
      }
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    render(phaseStartedAt);
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(resize)
      : null;
    observer?.observe(canvas);
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [accent, phase, reducedMotion]);

  return <canvas ref={canvasRef} className="intro-hacker-canvas" data-testid="hacker-screen" aria-hidden="true" />;
}

export default function IntroGate({ onEnter }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState('idle');
  const gateRef = useRef(null);
  const pointerFrameRef = useRef(null);
  const enteredRef = useRef(false);
  const reducedMotionRef = useRef(prefersReducedMotion());

  const accent = theme === 'dark' ? '#ff35a2' : '#39ff14';
  const accentRgb = theme === 'dark' ? '255, 53, 162' : '57, 255, 20';

  const enterNow = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    onEnter();
  }, [onEnter]);

  const begin = useCallback(() => {
    if (reducedMotionRef.current) {
      enterNow();
      return;
    }
    setPhase((current) => (current === 'idle' ? 'loading' : current));
  }, [enterNow]);

  useEffect(() => {
    const next = {
      loading: ['zooming', LOAD_SECONDS],
      zooming: ['brighten', ZOOM_SECONDS],
      brighten: [null, BRIGHT_SECONDS],
    }[phase];
    if (!next) return undefined;

    const [target, seconds] = next;
    const timer = window.setTimeout(
      () => (target ? setPhase(target) : enterNow()),
      seconds * 1000
    );
    return () => window.clearTimeout(timer);
  }, [phase, enterNow]);

  useEffect(() => () => {
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
    }
  }, []);

  const updateParallax = useCallback((event) => {
    if (reducedMotionRef.current || phase !== 'idle') return;
    const gate = gateRef.current;
    if (!gate || pointerFrameRef.current !== null) return;
    const bounds = gate.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    pointerFrameRef.current = window.requestAnimationFrame(() => {
      gate.style.setProperty('--intro-x', x.toFixed(3));
      gate.style.setProperty('--intro-y', y.toFixed(3));
      pointerFrameRef.current = null;
    });
  }, [phase]);

  const resetParallax = useCallback(() => {
    const gate = gateRef.current;
    gate?.style.setProperty('--intro-x', '0');
    gate?.style.setProperty('--intro-y', '0');
  }, []);

  return (
    <div
      ref={gateRef}
      className="intro-gate"
      data-phase={phase}
      style={{ '--intro-accent': accent, '--intro-accent-rgb': accentRgb }}
      onPointerMove={updateParallax}
      onPointerLeave={resetParallax}
    >
      <div className="intro-scene" aria-hidden="true">
        <img className="intro-layer intro-layer-bg" src={roomBackground} alt="" draggable="false" />
        <div className="intro-monitor-screen">
          <HackerScreen phase={phase} accent={accent} reducedMotion={reducedMotionRef.current} />
        </div>
        <img className="intro-layer intro-layer-frame" src={monitorFrame} alt="" draggable="false" />
        <div className="intro-monitor-glow" />
        <img className="intro-layer intro-layer-fg" src={roomForeground} alt="" draggable="false" />
        <div className="intro-scanlines" />
      </div>

      <div className="intro-menu">
        <p className="intro-menu-kicker">SECURE PORTFOLIO NODE // 01</p>
        <p className="intro-menu-title">
          SURACHET<span>.</span>
        </p>
        <p className="intro-menu-sub">SOFTWARE ENGINEER // ENTERPRISE BUILDER</p>
        <button
          type="button"
          className="intro-next"
          onClick={begin}
          lang={language}
          aria-label={t('intro_enter')}
        >
          <LocalizedText i18nKey="intro_next" />
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="intro-flash" aria-hidden="true" />
      <button type="button" className="intro-skip" onClick={enterNow} lang={language}>
        <LocalizedText i18nKey="intro_skip" />
      </button>
    </div>
  );
}
