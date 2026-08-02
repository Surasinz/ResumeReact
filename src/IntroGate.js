import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import './IntroGate.css';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { useTheme } from './ThemeSystem';

export const INTRO_SESSION_KEY = 'surachet-intro-seen';

/*
  idle      camera drifts around the room, menu waits for the visitor
  zooming   menu clears, camera settles onto the panel
  loading   the panel boots
  brighten  the room blows out to white and hands over to the portfolio
*/
export const PHASES = ['idle', 'zooming', 'loading', 'brighten'];
export const ZOOM_SECONDS = 1.7;
export const LOAD_SECONDS = 1.5;
export const BRIGHT_SECONDS = 0.75;

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

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const mix = (a, b, t) => a + (b - a) * t;

function CameraRig({ phase, endZ, still }) {
  const { camera } = useThree();
  const lookRef = useRef([0, -0.35, -1.2]);
  const departureRef = useRef(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (phase === 'idle') {
      departureRef.current = null;

      if (still) {
        camera.position.set(1.4, 0.5, 7.4);
        lookRef.current = [0, -0.35, -1.2];
        camera.lookAt(...lookRef.current);
        return;
      }

      // A long, slow wander with three different periods, so the loop never
      // lands back on the same pose and never reads as a repeat.
      camera.position.set(
        Math.sin(time * 0.13) * 2.4,
        0.55 + Math.sin(time * 0.1) * 0.42,
        7.5 + Math.sin(time * 0.07) * 0.55
      );
      lookRef.current = [Math.sin(time * 0.11) * 1.35, -0.35, -1.2];
      camera.lookAt(...lookRef.current);
      return;
    }

    /*
      Once the visitor commits, ease from wherever the drift happened to be
      rather than from a fixed pose -- otherwise the camera snaps before it
      starts moving. The pose is captured on the first frame after the phase
      changes.
    */
    if (!departureRef.current) {
      departureRef.current = {
        position: camera.position.toArray(),
        look: [...lookRef.current],
        time,
      };
    }

    const departure = departureRef.current;
    const eased = easeInOutCubic(
      clamp01((time - departure.time) / ZOOM_SECONDS)
    );

    camera.position.set(
      mix(departure.position[0], 0, eased),
      mix(departure.position[1], 0, eased),
      mix(departure.position[2], endZ, eased)
    );
    camera.lookAt(
      mix(departure.look[0], 0, eased),
      mix(departure.look[1], 0, eased),
      mix(departure.look[2], 0, eased)
    );
  });

  return null;
}

function Room({ accent, wall, floor }) {
  const hexes = [
    [-4.3, 1.5, 0.85],
    [-3.5, 0.75, 0.6],
    [-4.6, 0.05, 0.5],
    [4.3, 1.6, 0.9],
    [3.6, 0.85, 0.55],
    [4.7, 0.1, 0.65],
  ];

  const bulbs = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [mix(-5, 5, t), 2.55 - Math.sin(t * Math.PI) * 0.45, -1.6];
  });

  return (
    <group>
      {/*
        Deep enough that every pose the idle drift reaches is still inside
        the box; stray outside and the frame opens on empty clear colour.
      */}
      <mesh position={[0, -3.6, 2]}>
        <boxGeometry args={[15, 0.2, 24]} />
        <meshStandardMaterial color={floor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.5, 2]}>
        <boxGeometry args={[15, 0.2, 24]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -2.5]}>
        <boxGeometry args={[15, 7, 0.2]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh position={[-6.4, 0, 2]}>
        <boxGeometry args={[0.2, 7, 24]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh position={[6.4, 0, 2]}>
        <boxGeometry args={[0.2, 7, 24]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.85, -2.36]}>
        <planeGeometry args={[3.6, 1.7]} />
        <meshStandardMaterial
          color="#0b0b16"
          emissive={accent}
          emissiveIntensity={0.18}
        />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`slat-${i}`} position={[0, 1.15 + i * 0.2, -2.3]}>
          <boxGeometry args={[3.6, 0.11, 0.05]} />
          <meshStandardMaterial color={wall} roughness={0.7} />
        </mesh>
      ))}

      {hexes.map(([x, y, intensity], i) => (
        <mesh
          key={`hex-${i}`}
          position={[x, y, -2.34]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.42, 0.42, 0.06, 6]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={intensity}
            toneMapped={false}
          />
        </mesh>
      ))}

      {bulbs.map(([x, y, z], i) => (
        <mesh key={`bulb-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial
            color="#ffb45c"
            emissive="#ffa33d"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Desk({ accent, desk, body }) {
  return (
    <group>
      <mesh position={[0, -1.78, 0.15]}>
        <boxGeometry args={[9, 0.16, 2.8]} />
        <meshStandardMaterial color={desk} roughness={0.65} />
      </mesh>
      {[-4.1, 4.1].map((x) => (
        <mesh key={`leg-${x}`} position={[x, -2.75, 0.15]}>
          <boxGeometry args={[0.14, 1.8, 2.6]} />
          <meshStandardMaterial color={body} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -1.9, 1.5]}>
        <boxGeometry args={[8.2, 0.05, 0.05]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      <group position={[2.75, -0.98, -0.35]}>
        <mesh>
          <boxGeometry args={[0.78, 1.44, 1.3]} />
          <meshStandardMaterial color="#15151d" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[-0.4, 0, 0.1]}>
          <boxGeometry args={[0.02, 1.1, 0.06]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group position={[-2.75, -1.3, -0.1]}>
        <mesh>
          <boxGeometry args={[0.86, 0.94, 0.8]} />
          <meshStandardMaterial color="#cdc7bb" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.12, 0.41]}>
          <planeGeometry args={[0.58, 0.44]} />
          <meshStandardMaterial
            color="#0a0a0f"
            emissive="#ffd479"
            emissiveIntensity={0.75}
            toneMapped={false}
          />
        </mesh>
      </group>

      <mesh position={[0, -1.66, 1.05]} rotation={[-0.06, 0, 0]}>
        <boxGeometry args={[1.8, 0.06, 0.52]} />
        <meshStandardMaterial color="#14141c" roughness={0.6} />
      </mesh>
      <mesh position={[1.32, -1.65, 1.05]}>
        <boxGeometry args={[0.22, 0.06, 0.34]} />
        <meshStandardMaterial color="#14141c" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Monitor({ accent, body, phase }) {
  const panelRef = useRef(null);

  useFrame((_, delta) => {
    const panel = panelRef.current;
    if (!panel) return;

    // The panel wakes as the visitor arrives, then blows out with the room.
    const target =
      phase === 'brighten' ? 4.2 : phase === 'loading' ? 1.35 : 0.5;
    panel.material.emissiveIntensity +=
      (target - panel.material.emissiveIntensity) * Math.min(delta * 4, 1);
  });

  return (
    <group>
      <mesh position={[0, -1.65, -0.05]}>
        <boxGeometry args={[1.7, 0.09, 0.55]} />
        <meshStandardMaterial color={body} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, -1.35, -0.05]}>
        <boxGeometry args={[0.26, 0.55, 0.2]} />
        <meshStandardMaterial color={body} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[3.5, 2.2, 0.16]} />
        <meshStandardMaterial color={body} roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[3.24, 1.94]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={[0, 0, 0.06]} ref={panelRef}>
        <planeGeometry args={[3.16, 1.86]} />
        <meshStandardMaterial
          color="#05070b"
          emissive={accent}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Scene({ accent, palette, phase, still, endZ }) {
  const keyRef = useRef(null);
  const ambientRef = useRef(null);

  useFrame((_, delta) => {
    // The room lifts with the panel, so the hand-off into the portfolio is a
    // brightening rather than a cut.
    const lift = phase === 'brighten' ? 3.4 : 1;
    const ease = Math.min(delta * 4, 1);
    if (keyRef.current) {
      keyRef.current.intensity +=
        (palette.key * lift - keyRef.current.intensity) * ease;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity +=
        (palette.ambient * lift - ambientRef.current.intensity) * ease;
    }
  });

  return (
    <>
      <CameraRig phase={phase} endZ={endZ} still={still} />
      <ambientLight ref={ambientRef} intensity={palette.ambient} />
      <directionalLight ref={keyRef} position={[2, 4, 6]} intensity={palette.key} />
      <directionalLight position={[-5, 1, 2]} intensity={0.3} />
      <pointLight position={[0, 0.2, 1.6]} intensity={palette.screen} color={accent} distance={9} />
      <pointLight position={[0, 2.3, -1.4]} intensity={0.8} color="#ffa33d" distance={9} />

      <Room accent={accent} wall={palette.wall} floor={palette.floor} />
      <Desk accent={accent} desk={palette.desk} body={palette.body} />
      <Monitor accent={accent} body={palette.body} phase={phase} />
    </>
  );
}

export default function IntroGate({ onEnter }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState('idle');
  const [fit, setFit] = useState(1);
  const stillRef = useRef(prefersReducedMotion());
  const stageRef = useRef(null);
  const enteredRef = useRef(false);

  const enterNow = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    onEnter();
  }, [onEnter]);

  const begin = useCallback(() => {
    // Reduced motion gets the destination, not the journey.
    if (stillRef.current) {
      enterNow();
      return;
    }
    setPhase((current) => (current === 'idle' ? 'zooming' : current));
  }, [enterNow]);

  useEffect(() => {
    /*
      r3f measures its canvas from the container via ResizeObserver. The gate
      mounts on the very first render, before the fixed-position stage has
      been laid out, and that first measurement can be missed -- leaving the
      canvas at its 300x150 default while the stage fills the viewport.
    */
    const nudge = window.setTimeout(
      () => window.dispatchEvent(new Event('resize')),
      120
    );
    return () => window.clearTimeout(nudge);
  }, []);

  useEffect(() => {
    /*
      The sequence advances on timers rather than from the render loop. If
      WebGL is unavailable or the loop stalls, the camera never arrives --
      and driving the hand-off from that would strand the visitor here.
    */
    const next = {
      zooming: ['loading', ZOOM_SECONDS],
      loading: ['brighten', LOAD_SECONDS],
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

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const { clientWidth, clientHeight } = stage;
    if (!clientWidth || !clientHeight) return;

    /*
      A fixed settle distance crops the machine on a narrow window, so it
      pulls back until the panel fits. --intro-fit tracks how much smaller
      the panel lands, so the boot readout scales with it.
    */
    const aspect = clientWidth / clientHeight;
    setFit(6 / Math.max(6, 5.9 / Math.max(aspect, 0.3)));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const isDark = theme === 'dark';
  const accent = isDark ? '#ff35a2' : '#39ff14';
  const palette = isDark
    ? {
        wall: '#241a33',
        floor: '#1a1526',
        desk: '#3a2a20',
        body: '#15151d',
        ambient: 0.32,
        key: 0.55,
        screen: 2.6,
      }
    : {
        wall: '#e6e3ee',
        floor: '#d8d5e0',
        desk: '#b98f68',
        body: '#d9dee1',
        ambient: 0.75,
        key: 1.0,
        screen: 1.4,
      };

  return (
    <div
      className="intro-gate"
      data-phase={phase}
      style={{ '--intro-fit': fit }}
    >
      <div className="intro-stage" ref={stageRef} aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [1.4, 0.5, 7.4], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene
            accent={accent}
            palette={palette}
            phase={phase}
            still={stillRef.current}
            endZ={6 / Math.max(fit, 0.001)}
          />
        </Canvas>
      </div>

      {/*
        Ordinary DOM over the canvas rather than anything inside it, so the
        title and the way in stay real text: crisp at any zoom and reachable
        by keyboard and screen readers without a WebGL detour.
      */}
      <div className="intro-menu">
        <p className="intro-menu-title">
          SURACHET<span>.</span>
        </p>
        <p className="intro-menu-sub">SOFTWARE ENGINEER // PORTFOLIO</p>
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

      {/*
        Centred because the camera settles dead on-axis with the panel on the
        world origin, so the screen always lands on the centre of the canvas.
      */}
      <div className="intro-boot" aria-hidden="true">
        <p>
          <LocalizedText i18nKey="intro_loading" />
        </p>
        <span className="intro-boot-bar">
          <i />
        </span>
      </div>

      <div className="intro-flash" aria-hidden="true" />

      <button
        type="button"
        className="intro-skip"
        onClick={enterNow}
        lang={language}
      >
        <LocalizedText i18nKey="intro_skip" />
      </button>
    </div>
  );
}
