import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
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
/*
  Wide enough to frame the panel from inside the room. At 40 degrees the
  camera had to stand 2.35 units back to fill the frame, but the room only
  extends 2.31 in front of the monitor -- so every pose, idle and settled,
  sat outside the walls looking in.
*/
const FOV = 55;
// How much of the frame the monitor fills once the camera settles.
const SCREEN_FILL = 0.62;
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

      // Expressed as fractions of the settle distance, so the wander stays
      // in proportion to whatever room is loaded rather than to numbers
      // tuned against one particular set.
      /*
        Aimed low and slightly off-centre. The panel sits high in the room,
        so levelling the camera on it puts the ceiling gap in shot; these
        were picked by sweeping poses and measuring how much of the frame
        fell outside the geometry.
      */
      if (still) {
        camera.position.set(0, -endZ * 0.06, endZ * 1.14);
        lookRef.current = [-endZ * 0.18, -endZ * 0.18, -endZ * 0.2];
        camera.lookAt(...lookRef.current);
        return;
      }

      // A long, slow wander with three different periods, so the loop never
      // lands back on the same pose and never reads as a repeat.
      camera.position.set(
        Math.sin(time * 0.13) * endZ * 0.2,
        -endZ * 0.06 + Math.sin(time * 0.1) * endZ * 0.04,
        endZ * 1.14 + Math.sin(time * 0.07) * endZ * 0.06
      );
      lookRef.current = [
        -endZ * 0.18 + Math.sin(time * 0.11) * endZ * 0.12,
        -endZ * 0.18,
        -endZ * 0.2,
      ];
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

const ROOM_URL = `${process.env.PUBLIC_URL}/hacker-room.glb`;

/*
  The imported room, re-anchored on its own monitor.

  Everything downstream assumes the screen sits on the world origin: the
  camera settles dead on-axis and the DOM boot readout is positioned against
  the centre of the canvas. A model authored around some other origin would
  break that, so rather than hand-place it, the room is measured on load and
  shifted by whatever puts its monitor at 0,0,0.

  The measurement is taken from the rendered scene rather than the file's own
  accessor bounds -- those describe the raw meshes, before the node
  transforms the loader applies, and reading them was what put the helmet
  model out by a factor of roughly 1700.
*/
function HackerRoom({ onMeasured }) {
  const { scene } = useGLTF(ROOM_URL);
  const shiftRef = useRef(null);
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    const shift = shiftRef.current;
    if (!shift) return;

    /*
      Matched on material rather than object name. The loader strips the
      colons out of the authored names -- tv:pCube1 arrives as
      tvpCube1_tvlambert2_0 -- so a name pattern written against the file
      silently matches nothing.

      Several props share the screen material, so the biggest face wins: the
      main panel, not one of the little monitors dotted around the room.
      Anchoring on all of them together straddles half the room.
    */
    let panel = null;
    let panelArea = 0;
    const room = new Box3();

    scene.traverse((child) => {
      if (!child.isMesh) return;
      const box = new Box3().setFromObject(child);
      room.union(box);
      if (!/tv/i.test(child.material?.name ?? '')) return;

      const size = box.getSize(new Vector3());
      const area = Math.max(
        size.x * size.y,
        size.y * size.z,
        size.x * size.z
      );
      if (area > panelArea) {
        panelArea = area;
        panel = box;
      }
    });

    const anchor = panel ?? room;
    const centre = anchor.getCenter(new Vector3());
    const size = anchor.getSize(new Vector3());
    shift.position.set(-centre.x, -centre.y, -centre.z);

    /*
      A panel's thinnest axis is its normal. Which way along that axis it
      faces is settled by where the rest of the room is -- a screen points
      into the room it is in, never at the wall behind it.
    */
    const facesX = size.x < size.z;
    const roomCentre = room.getCenter(new Vector3());
    let rotation = 0;
    if (facesX) {
      rotation = roomCentre.x >= centre.x ? -Math.PI / 2 : Math.PI / 2;
    } else {
      rotation = roomCentre.z >= centre.z ? 0 : Math.PI;
    }
    setTurn(rotation);

    onMeasured({
      foundPanel: Boolean(panel),
      // Reported in the orientation the camera will see, so the framing
      // maths downstream does not have to know which way the room was
      // turned.
      screenSize: [facesX ? size.z : size.x, size.y],
    });
  }, [scene, onMeasured]);

  return (
    <group rotation={[0, turn, 0]}>
      <group ref={shiftRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function Scene({ accent, palette, phase, still, endZ, onMeasured }) {
  const keyRef = useRef(null);
  const ambientRef = useRef(null);
  const glowRef = useRef(null);

  useFrame((_, delta) => {
    const ease = Math.min(delta * 4, 1);

    // The room lifts with the panel, so the hand-off into the portfolio is a
    // brightening rather than a cut.
    const lift = phase === 'brighten' ? 3.4 : 1;
    if (keyRef.current) {
      keyRef.current.intensity +=
        (palette.key * lift - keyRef.current.intensity) * ease;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity +=
        (palette.ambient * lift - ambientRef.current.intensity) * ease;
    }

    /*
      The panel waking up is done with a light sitting just in front of it
      rather than by driving the model's own material. The room is somebody
      else's asset, so keying the effect to a material name in it would break
      the moment that asset is swapped.

      It stays low while the visitor is looking around: the room's textures
      carry the colour, and a strong tinted lamp on top of them washes the
      whole set to one hue.
    */
    if (glowRef.current) {
      const target =
        phase === 'brighten' ? 9 : phase === 'loading' ? 4 : palette.screen;
      glowRef.current.intensity +=
        (target - glowRef.current.intensity) * ease;
    }
  });

  return (
    <>
      <CameraRig phase={phase} endZ={endZ} still={still} />
      {/*
        The room is not a sealed box -- it has an open side and gaps at the
        ceiling -- so some poses see straight past the geometry. With a
        transparent canvas those gaps showed the page behind, reading as
        black holes punched in the set. An opaque background plus fog turns
        them into depth instead.
      */}
      <color attach="background" args={[palette.backdrop]} />
      <fog attach="fog" args={[palette.backdrop, endZ * 1.1, endZ * 3.4]} />
      {/*
        Neutral white. The room carries its own colour in its textures, so a
        tinted key light only pushes the whole set toward one hue.
      */}
      <ambientLight ref={ambientRef} intensity={palette.ambient} />
      <directionalLight ref={keyRef} position={[1.5, 2.5, 3]} intensity={palette.key} />
      <directionalLight position={[-2.5, 1, 1.5]} intensity={0.35} />
      {/* Reach kept short so the accent stays a glow off the panel. */}
      <pointLight
        ref={glowRef}
        position={[0, 0, 0.6]}
        intensity={palette.screen}
        color={accent}
        distance={3.5}
      />

      <Suspense fallback={null}>
        <HackerRoom onMeasured={onMeasured} />
      </Suspense>
    </>
  );
}

export default function IntroGate({ onEnter }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState('idle');
  const [fit, setFit] = useState(1);
  const [endZ, setEndZ] = useState(6);
  const stillRef = useRef(prefersReducedMotion());
  const stageRef = useRef(null);
  const enteredRef = useRef(false);
  const screenRef = useRef(null);

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

    const screen = screenRef.current;
    if (!screen) return;

    /*
      The settle distance is derived from the monitor the model actually has,
      not a hand-tuned number, so swapping the room in cannot silently leave
      the camera framed on the wrong thing or buried in a wall.
    */
    const aspect = clientWidth / clientHeight;
    const tan = Math.tan((FOV / 2) * (Math.PI / 180));
    const z = Math.max(
      screen.height / (2 * tan * SCREEN_FILL),
      screen.width / (2 * tan * aspect * SCREEN_FILL)
    );
    setEndZ(z);

    // How wide the panel actually lands, so the boot readout can be sized
    // against the real thing rather than a guess.
    const panelPx = (screen.width / (2 * z * tan * aspect)) * clientWidth;
    setFit(Math.min(Math.max(panelPx / 520, 0.34), 1.4));
  }, []);

  const handleMeasured = useCallback(
    ({ screenSize: [width, height] }) => {
      screenRef.current = { width, height };
      measure();
    },
    [measure]
  );

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const isDark = theme === 'dark';
  const accent = isDark ? '#ff35a2' : '#39ff14';
  // The room brings its own materials, so only the lighting is themed.
  const palette = isDark
    ? { ambient: 0.9, key: 1.1, screen: 0.5, backdrop: '#140f1d' }
    : { ambient: 1.5, key: 1.5, screen: 0.35, backdrop: '#dedbe6' };

  return (
    <div
      className="intro-gate"
      data-phase={phase}
      style={{ '--intro-fit': fit }}
    >
      <div className="intro-stage" ref={stageRef} aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, endZ], fov: FOV }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene
            accent={accent}
            palette={palette}
            phase={phase}
            still={stillRef.current}
            endZ={endZ}
            onMeasured={handleMeasured}
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
