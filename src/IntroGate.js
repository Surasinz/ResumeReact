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

// The camera flies in while the machine builds, then holds dead still. It has
// to end perfectly on-axis: the screen sits on the world origin, so a settled
// camera at [0, 0, z] looking at the origin puts the panel on the exact centre
// of the canvas, which is what the DOM entry control is positioned against.
const FLY_SECONDS = 3.6;
const CAMERA_START = [5.2, 2.4, 9.4];
const LOOK_START = [-0.6, -1.0, -1.0];
// Whichever of the two finishes last, so retiming either one cannot reveal
// the control over a machine that is still building or still being flown to.
export const READY_SECONDS = Math.max(FLY_SECONDS, ASSEMBLY_SECONDS) + 0.45;

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
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const mix = (a, b, t) => a + (b - a) * t;

function CameraRig({ still, endZ }) {
  const { camera } = useThree();

  useFrame((state) => {
    const progress = still
      ? 1
      : clamp01(state.clock.getElapsedTime() / FLY_SECONDS);
    const eased = easeInOutCubic(progress);

    camera.position.set(
      mix(CAMERA_START[0], 0, eased),
      mix(CAMERA_START[1], 0, eased),
      mix(CAMERA_START[2], endZ, eased)
    );
    camera.lookAt(
      mix(LOOK_START[0], 0, eased),
      mix(LOOK_START[1], 0, eased),
      mix(LOOK_START[2], 0, eased)
    );
  });

  return null;
}

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

function Room({ accent, wall, floor }) {
  // Hex light panels, the neon cue the whole look hangs on.
  const hexes = [
    [-4.3, 1.5, 0.85],
    [-3.5, 0.75, 0.6],
    [-4.6, 0.05, 0.5],
    [4.3, 1.6, 0.9],
    [3.6, 0.85, 0.55],
    [4.7, 0.1, 0.65],
  ];

  // Bulbs strung across the ceiling, drooping between two points.
  const bulbs = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [mix(-5, 5, t), 2.55 - Math.sin(t * Math.PI) * 0.45, -1.6];
  });

  return (
    <group>
      {/*
        Deep enough that the camera's start pose is still inside the box.
        Begin it beyond the far edge and the frame opens on empty clear
        colour instead of a room.
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

      {/* Window above the desk, with slatted blinds catching the glow. */}
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
      {/* Under-desk strip, the light that grounds the whole setup. */}
      <mesh position={[0, -1.9, 1.5]}>
        <boxGeometry args={[8.2, 0.05, 0.05]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Tower to the right, glowing down one edge. */}
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

      {/* Retro machine to the left, screen still on. */}
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

function Monitor({ accent, body, still }) {
  return (
    <group>
      <Part name="base" position={[0, -1.65, -0.05]} still={still}>
        <mesh>
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

      <Part name="neck" position={[0, -1.35, -0.05]} still={still}>
        <mesh>
          <boxGeometry args={[0.26, 0.55, 0.2]} />
          <meshStandardMaterial
            color={body}
            transparent
            opacity={0}
            roughness={0.5}
            metalness={0.25}
          />
        </mesh>
      </Part>

      <Part name="bezel" position={[0, 0, -0.04]} still={still}>
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

      <Part name="screen" position={[0, 0, 0.06]} still={still}>
        <mesh position={[0, 0, -0.008]}>
          <planeGeometry args={[3.24, 1.94]} />
          <meshBasicMaterial color={accent} transparent opacity={0} />
        </mesh>
        <mesh>
          <planeGeometry args={[3.16, 1.86]} />
          <meshStandardMaterial
            color="#05070b"
            emissive={accent}
            emissiveIntensity={0.5}
            transparent
            opacity={0}
            toneMapped={false}
          />
        </mesh>
      </Part>
    </group>
  );
}

function Scene({ accent, palette, still, endZ }) {
  return (
    <>
      <CameraRig still={still} endZ={endZ} />
      <ambientLight intensity={palette.ambient} />
      <directionalLight position={[2, 4, 6]} intensity={palette.key} />
      <directionalLight position={[-5, 1, 2]} intensity={0.3} />
      {/* Bounce off the panel, so the desk is lit by the machine itself. */}
      <pointLight position={[0, 0.2, 1.6]} intensity={palette.screen} color={accent} distance={9} />
      <pointLight position={[0, 2.3, -1.4]} intensity={0.8} color="#ffa33d" distance={9} />

      <Room accent={accent} wall={palette.wall} floor={palette.floor} />
      <Desk accent={accent} desk={palette.desk} body={palette.body} />
      <Monitor accent={accent} body={palette.body} still={still} />
    </>
  );
}

export default function IntroGate({ onEnter }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [fit, setFit] = useState(1);
  const stillRef = useRef(prefersReducedMotion());
  const stageRef = useRef(null);

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
      stalls, the fly-in never finishes -- and gating the only way forward on
      that would strand the visitor on a blank page.
    */
    if (stillRef.current) {
      setReady(true);
      return undefined;
    }

    const timer = window.setTimeout(() => setReady(true), READY_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, []);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const { clientWidth, clientHeight } = stage;
    if (!clientWidth || !clientHeight) return;

    /*
      A fixed camera distance crops the machine on a narrow window, so the
      settle point pulls back until the panel fits. --intro-fit tracks how
      much smaller the panel ends up on screen, so the entry control can
      shrink with it rather than bursting out of the frame.
    */
    const aspect = clientWidth / clientHeight;
    const z = Math.max(6, 5.9 / Math.max(aspect, 0.3));
    setFit(6 / z);
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
      data-ready={ready ? 'true' : 'false'}
      style={{ '--intro-fit': fit }}
    >
      <div className="intro-stage" ref={stageRef} aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: CAMERA_START, fov: 40 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene
            accent={accent}
            palette={palette}
            still={stillRef.current}
            endZ={6 / Math.max(fit, 0.001)}
          />
        </Canvas>
      </div>

      {/*
        Sits over the panel in normal DOM rather than inside the canvas, so it
        stays real text: selectable, crisp at any zoom, and reachable by
        keyboard and screen readers without a WebGL detour.
      */}
      <div className="intro-screen-ui">
        <p className="intro-screen-title" aria-hidden="true">
          SURACHET PANTO
        </p>
        <p className="intro-screen-sub" aria-hidden="true">
          SOFTWARE ENGINEER
        </p>
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
