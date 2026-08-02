import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import './IntroGate.css';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { useTheme } from './ThemeSystem';

export const INTRO_SESSION_KEY = 'surachet-intro-seen';

// Assembly timings in seconds, shared by the 3D parts and by the timer that
// reveals the entry control.
const PART_DURATION = 0.85;
const PARTS = {
  base: { delay: 0, offset: [0, -2.4, 0] },
  neck: { delay: 0.3, offset: [0, -1.8, 0] },
  bezel: { delay: 0.62, offset: [0, 2.6, 0] },
  screen: { delay: 1.0, offset: [0, 0, -1.4] },
};
const ASSEMBLY_SECONDS =
  Math.max(...Object.values(PARTS).map((part) => part.delay)) + PART_DURATION;

export function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === 'true';
  } catch {
    // Treat blocked storage as "not seen"; the visitor can still continue.
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
  } catch {
    // The gate still dismisses for this page view without storage.
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

function Part({ name, position, children, still }) {
  const ref = useRef(null);
  const { delay, offset } = PARTS[name];

  useFrame((state) => {
    const group = ref.current;
    if (!group) return;

    const elapsed = still ? Number.POSITIVE_INFINITY : state.clock.getElapsedTime();
    const progress = clamp01((elapsed - delay) / PART_DURATION);
    const eased = easeOutCubic(progress);

    group.position.set(
      position[0] + offset[0] * (1 - eased),
      position[1] + offset[1] * (1 - eased),
      position[2] + offset[2] * (1 - eased)
    );
    group.scale.setScalar(0.72 + 0.28 * eased);

    group.traverse((child) => {
      if (child.material) child.material.opacity = eased;
    });
  });

  return <group ref={ref}>{children}</group>;
}

function Monitor({ accent, body, still, onFit }) {
  const rigRef = useRef(null);
  const { viewport } = useThree();

  /*
    The assembled machine spans roughly 3.5 wide and 2.8 tall in world units.
    A fixed camera would crop it on a narrow or short window, so scale it to
    whatever fits, never above 1:1. viewport only changes on resize, so this
    is not per-frame work.
  */
  const fit = Math.min(viewport.width / 4.1, viewport.height / 3.4, 1);

  useEffect(() => {
    onFit(fit);
  }, [fit, onFit]);

  useFrame((state) => {
    const rig = rigRef.current;
    if (!rig || still) return;

    // A slow drift once assembled, so the finished machine still feels alive
    // without the entry control ever sliding away from the screen.
    const elapsed = state.clock.getElapsedTime();
    const settled = clamp01((elapsed - ASSEMBLY_SECONDS) / 1.2);
    rig.rotation.y = Math.sin(elapsed * 0.35) * 0.07 * settled;
    rig.rotation.x = Math.sin(elapsed * 0.28) * 0.035 * settled;
  });

  return (
    <group ref={rigRef} scale={fit}>
      <Part name="base" position={[0, -1.62, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[1.7, 0.09, 0.55]} />
          <meshStandardMaterial
            color={body}
            transparent
            opacity={0}
            roughness={0.5}
            metalness={0.25}
          />
        </mesh>
      </Part>

      <Part name="neck" position={[0, -1.28, -0.05]}>
        <mesh>
          <boxGeometry args={[0.26, 0.62, 0.2]} />
          <meshStandardMaterial
            color={body}
            transparent
            opacity={0}
            roughness={0.5}
            metalness={0.25}
          />
        </mesh>
      </Part>

      <Part name="bezel" position={[0, 0, -0.04]}>
        <mesh>
          <boxGeometry args={[3.5, 2.2, 0.16]} />
          <meshStandardMaterial
            color={body}
            transparent
            opacity={0}
            roughness={0.45}
            metalness={0.3}
          />
        </mesh>
      </Part>

      <Part name="screen" position={[0, 0, 0.06]}>
        {/* Accent plate sitting a hair proud of the bezel, so the lit panel
            reads as glass with a rim rather than a flat painted rectangle. */}
        <mesh position={[0, 0, -0.008]}>
          <planeGeometry args={[3.24, 1.94]} />
          <meshBasicMaterial color={accent} transparent opacity={0} />
        </mesh>
        <mesh>
          <planeGeometry args={[3.16, 1.86]} />
          <meshStandardMaterial
            color="#05070b"
            emissive={accent}
            emissiveIntensity={0.42}
            transparent
            opacity={0}
          />
        </mesh>
      </Part>
    </group>
  );
}

export default function IntroGate({ onEnter }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [fit, setFit] = useState(1);
  const stillRef = useRef(prefersReducedMotion());
  const handleFit = useCallback((value) => setFit(value), []);

  useEffect(() => {
    /*
      r3f measures its canvas from the container via ResizeObserver. The gate
      mounts on the very first render, before the fixed-position stage has
      been laid out, and that first measurement can be missed -- leaving the
      canvas at its 300x150 default while the stage fills the viewport. A
      resize nudge forces a fresh read.
    */
    const nudge = window.setTimeout(
      () => window.dispatchEvent(new Event('resize')),
      120
    );
    return () => window.clearTimeout(nudge);
  }, []);

  useEffect(() => {
    /*
      The entry control is revealed on a timer, deliberately not from the
      render loop. If WebGL is unavailable, the context is lost, or the loop
      stalls, the assembly never finishes -- and gating the only way forward
      on that would strand the visitor on a blank page.
    */
    if (stillRef.current) {
      setReady(true);
      return undefined;
    }

    const timer = window.setTimeout(
      () => setReady(true),
      (ASSEMBLY_SECONDS + 0.35) * 1000
    );
    return () => window.clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark';
  const accent = isDark ? '#ff35a2' : '#39ff14';
  const body = isDark ? '#15151d' : '#d9dee1';

  return (
    <div
      className="intro-gate"
      data-ready={ready ? 'true' : 'false'}
      style={{ '--intro-fit': Math.max(fit, 0.55) }}
    >
      <div className="intro-stage" aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={isDark ? 0.45 : 0.8} />
          <directionalLight position={[3, 4, 6]} intensity={1.2} />
          <directionalLight position={[-4, -1, 2]} intensity={0.4} />
          <Monitor
            accent={accent}
            body={body}
            still={stillRef.current}
            onFit={handleFit}
          />
        </Canvas>
      </div>

      <p className="intro-eyebrow" aria-hidden="true">
        SURACHET PANTO // SYSTEM READY
      </p>

      {/*
        Sits over the panel in normal DOM rather than inside the canvas, so it
        stays real text: selectable, crisp at any zoom, and reachable by
        keyboard and screen readers without a WebGL detour.
      */}
      <div className="intro-screen-ui">
        <button
          type="button"
          className="intro-next"
          onClick={onEnter}
          lang={language}
          aria-label={t('intro_enter')}
        >
          <LocalizedText i18nKey="intro_next" />
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <button
        type="button"
        className="intro-skip"
        onClick={onEnter}
        lang={language}
      >
        <LocalizedText i18nKey="intro_skip" />
      </button>
    </div>
  );
}
