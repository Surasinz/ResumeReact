import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Box3,
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  SRGBColorSpace,
  Vector3,
} from 'three';
import roomModel from './assets/hacker-room.glb';
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
export const getLandscapeBlend = (aspect) => {
  const progress = clamp01((aspect - 0.62) / 0.48);
  return progress * progress * (3 - 2 * progress);
};
export const getScreenCameraDistance = (screenWidth, screenHeight, aspect) => {
  const tan = Math.tan((FOV / 2) * (Math.PI / 180));
  const verticalZ = screenHeight / (2 * tan * SCREEN_FILL);
  const horizontalZ = screenWidth / (2 * tan * aspect * SCREEN_FILL);
  return Math.max(verticalZ, mix(verticalZ, horizontalZ, getLandscapeBlend(aspect)));
};
const HACK_GLYPHS = '01<>[]{}/*+$#_';
const HACK_LOGS = [
  'TRACE ROUTE // NONTHABURI_TH',
  'SCANNING ENTERPRISE MODULES',
  'DATABASE TUNNEL // SECURE',
  'IDENTITY // SURACHET_PANTO',
];

function drawHackerMonitor(context, width, height, time, phaseTime, accent, phase) {
  context.fillStyle = '#020509';
  context.fillRect(0, 0, width, height);

  const step = Math.floor(time / 85);
  const glyphSize = 14;
  const columns = Math.ceil(width / 24);
  const rows = Math.ceil(height / 25);
  context.font = `${glyphSize}px Consolas, monospace`;
  context.textAlign = 'center';

  for (let column = 0; column < columns; column += 1) {
    const head = (step + column * 7) % (rows + 7);
    for (let tail = 0; tail < 6; tail += 1) {
      const row = head - tail;
      if (row < 0 || row >= rows) continue;
      const glyphIndex = (column * 13 + row * 5 + step) % HACK_GLYPHS.length;
      context.globalAlpha = Math.max(0.04, 0.3 - tail * 0.045);
      context.fillStyle = tail === 0 ? '#ffffff' : accent;
      context.fillText(HACK_GLYPHS[glyphIndex], column * 24 + 12, row * 25 + 18);
    }
  }
  context.globalAlpha = 1;

  const panelX = 72;
  const panelY = 62;
  const panelWidth = 650;
  const panelHeight = 370;
  context.fillStyle = 'rgba(1, 6, 10, 0.86)';
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  context.strokeStyle = `${accent}a6`;
  context.lineWidth = 2;
  context.strokeRect(panelX, panelY, panelWidth, panelHeight);

  context.textAlign = 'left';
  context.fillStyle = accent;
  context.font = '700 22px Consolas, monospace';
  context.fillText('SURACHET_SECURE_SHELL // LIVE', panelX + 24, panelY + 42);
  context.font = '17px Consolas, monospace';
  HACK_LOGS.forEach((log, index) => {
    context.globalAlpha = (step + index) % 5 === 0 ? 0.48 : 0.92;
    context.fillStyle = index === 3 ? '#ffffff' : accent;
    context.fillText(`> ${log}`, panelX + 24, panelY + 92 + index * 37);
  });
  context.globalAlpha = 1;

  const idleProgress = 38 + ((time / 95) % 32);
  const loadingProgress = 72 + Math.min(phaseTime / (LOAD_SECONDS * 1000), 1) * 28;
  const progress = phase === 'idle' || phase === 'zooming'
    ? idleProgress
    : phase === 'loading'
      ? loadingProgress
      : 100;
  const barX = panelX + 24;
  const barY = panelY + panelHeight - 70;
  const barWidth = panelWidth - 48;
  context.fillStyle = `${accent}2b`;
  context.fillRect(barX, barY, barWidth, 10);
  context.fillStyle = accent;
  context.fillRect(barX, barY, barWidth * (progress / 100), 10);
  context.font = '700 16px Consolas, monospace';
  context.fillText(
    progress >= 100
      ? 'ACCESS GRANTED // PORTFOLIO ONLINE'
      : `DECRYPTING PORTFOLIO // ${Math.floor(progress)}%`,
    barX,
    barY + 36
  );

  context.globalAlpha = 0.09;
  context.fillStyle = '#ffffff';
  for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 1);
  context.globalAlpha = 1;
}

function CameraRig({ phase, endZ, still }) {
  const { camera } = useThree();
  const lookRef = useRef([0, -0.35, -1.2]);
  const departureRef = useRef(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (phase === 'idle') {
      departureRef.current = null;
      const aspect = state.size.width / state.size.height;
      const landscapeBlend = getLandscapeBlend(aspect);
      const idleDepth = endZ * mix(2.7, 1.14, landscapeBlend);

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
        camera.position.set(0, -idleDepth * 0.05, idleDepth);
        const portraitLook = [0, -idleDepth * 0.08, -idleDepth * 0.1];
        const landscapeLook = [-endZ * 0.18, -endZ * 0.18, -endZ * 0.2];
        lookRef.current = portraitLook.map((value, index) =>
          mix(value, landscapeLook[index], landscapeBlend)
        );
        camera.lookAt(...lookRef.current);
        return;
      }

      // A long, slow wander with three different periods, so the loop never
      // lands back on the same pose and never reads as a repeat.
      camera.position.set(
        Math.sin(time * 0.13) * idleDepth * mix(0.08, 0.175, landscapeBlend),
        -idleDepth * 0.05 + Math.sin(time * 0.1) * idleDepth * 0.035,
        idleDepth + Math.sin(time * 0.07) * idleDepth * 0.05
      );
      const portraitLook = [
        Math.sin(time * 0.11) * idleDepth * 0.04,
        -idleDepth * 0.08,
        -idleDepth * 0.1,
      ];
      const landscapeLook = [
        -endZ * 0.18 + Math.sin(time * 0.11) * endZ * 0.12,
        -endZ * 0.18,
        -endZ * 0.2,
      ];
      lookRef.current = portraitLook.map((value, index) =>
        mix(value, landscapeLook[index], landscapeBlend)
      );
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

/*
  Imported rather than read from /public so the bundler gives it a
  content-hashed filename. Served from public it was a fixed URL, and the file
  behind that URL has already changed twice -- once to convert its materials --
  which is exactly the case where a client can keep serving the previous copy
  and show a stale model with none of the fixes.
*/
const ROOM_URL = roomModel;

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
function HackerRoom({ onMeasured, accent, phase, still }) {
  const { scene } = useGLTF(ROOM_URL);
  const shiftRef = useRef(null);
  const monitorRef = useRef(null);
  const phaseStartedRef = useRef(0);
  const lastFrameRef = useRef(-Infinity);
  const [turn, setTurn] = useState(0);
  const [monitorSurface, setMonitorSurface] = useState(null);

  useEffect(() => {
    phaseStartedRef.current = 0;
  }, [phase]);

  useFrame((state) => {
    const monitor = monitorRef.current;
    if (!monitor || (still && lastFrameRef.current > -Infinity)) return;
    const time = state.clock.getElapsedTime() * 1000;
    if (time - lastFrameRef.current < 33) return;
    if (!phaseStartedRef.current) phaseStartedRef.current = time;
    drawHackerMonitor(
      monitor.context,
      monitor.canvas.width,
      monitor.canvas.height,
      time,
      time - phaseStartedRef.current,
      accent,
      phase
    );
    monitor.texture.needsUpdate = true;
    lastFrameRef.current = time;
  });

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

    let disposeMonitor = null;
    if (panel && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (context) {
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;

        const screenWidth = facesX ? size.z : size.x;
        const screenDepth = facesX ? size.x : size.z;
        monitorRef.current = { canvas, context, texture };
        setMonitorSurface({
          texture,
          width: screenWidth * 0.94,
          height: size.y * 0.9,
          z: screenDepth / 2 + 0.006,
        });

        disposeMonitor = () => {
          monitorRef.current = null;
          texture.dispose();
        };
      }
    }

    onMeasured({
      foundPanel: Boolean(panel),
      // Reported in the orientation the camera will see, so the framing
      // maths downstream does not have to know which way the room was
      // turned.
      screenSize: [facesX ? size.z : size.x, size.y],
    });

    return disposeMonitor ?? undefined;
  }, [scene, onMeasured]);

  return (
    <>
      <group rotation={[0, turn, 0]}>
        <group ref={shiftRef}>
          <primitive object={scene} />
        </group>
      </group>
      {monitorSurface && (
        <mesh position={[0, 0, monitorSurface.z]} renderOrder={3}>
          <planeGeometry args={[monitorSurface.width, monitorSurface.height]} />
          <meshBasicMaterial
            map={monitorSurface.texture}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  );
}

/*
  Opt-in readout for diagnosing what a specific machine actually loaded. The
  room renders correctly everywhere it has been measured, so when a device
  shows it untextured the useful question is what that device's renderer
  ended up with -- which is not something logs or screenshots answer. Off
  unless ?diag is in the URL.
*/
function RendererReport({ onReport }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const id = window.setTimeout(() => {
      let meshes = 0;
      let textured = 0;
      let decoded = 0;
      let firstMaterial = null;

      scene.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        meshes += 1;
        const map = child.material.map;
        if (map) {
          textured += 1;
          if (map.image?.width) decoded += 1;
        }
        if (!firstMaterial) {
          firstMaterial = {
            name: child.material.name,
            colour: `#${child.material.color?.getHexString?.() ?? '??'}`,
            map: map ? `${map.image?.width}x${map.image?.height}` : 'NONE',
            colorSpace: map?.colorSpace ?? 'n/a',
          };
        }
      });

      const context = gl.getContext?.();
      const debugInfo = context?.getExtension?.('WEBGL_debug_renderer_info');

      onReport({
        meshes,
        textured,
        decoded,
        firstMaterial,
        maxTextureSize: context?.getParameter?.(context.MAX_TEXTURE_SIZE),
        gpu: debugInfo
          ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : 'hidden',
        webgl2: typeof WebGL2RenderingContext !== 'undefined'
          && context instanceof WebGL2RenderingContext,
      });
    }, 6000);

    return () => window.clearTimeout(id);
  }, [gl, scene, onReport]);

  return null;
}

function Scene({ accent, palette, phase, still, endZ, onMeasured, onReport }) {
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
        black holes punched in the set. An opaque background fills them
        instead.

        No fog. Fog only tints geometry, so it did nothing for the gaps it
        was added for, and its near plane landed at 1.82 while the monitor
        sits 1.88 away -- so the subject and the whole room behind it were
        being blended toward the backdrop. On the light theme that backdrop
        is nearly white, which washed the set out completely.
      */}
      <color attach="background" args={[palette.backdrop]} />
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
        <HackerRoom
          onMeasured={onMeasured}
          accent={accent}
          phase={phase}
          still={still}
        />
      </Suspense>
      {onReport && <RendererReport onReport={onReport} />}
    </>
  );
}

export default function IntroGate({ onEnter }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState('idle');
  const [endZ, setEndZ] = useState(6);
  const [report, setReport] = useState(null);
  const wantsReport = window.location.search.includes('diag');
  const stillRef = useRef(prefersReducedMotion());
  const stageRef = useRef(null);
  const skipRef = useRef(null);
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

  useEffect(() => {
    if (phase === 'zooming') {
      skipRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

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
    setEndZ(getScreenCameraDistance(screen.width, screen.height, aspect));
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
  /*
    Lit brightly enough for the room's own textures to read. The first pass
    was dim enough that the colour was technically present but the set still
    looked washed out, which is indistinguishable from having no colour.
  */
  const palette = isDark
    ? { ambient: 1.6, key: 1.9, screen: 0.5, backdrop: '#140f1d' }
    : { ambient: 2.0, key: 2.0, screen: 0.35, backdrop: '#dedbe6' };

  return (
    <div className="intro-gate" data-phase={phase}>
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
            onReport={wantsReport ? setReport : undefined}
          />
        </Canvas>
      </div>

      {/*
        Ordinary DOM over the canvas rather than anything inside it, so the
        title and the way in stay real text: crisp at any zoom and reachable
        by keyboard and screen readers without a WebGL detour.
      */}
      <div className="intro-menu" aria-hidden={phase !== 'idle'}>
        <p className="intro-menu-title">
          SURACHET<span>.</span>
        </p>
        <p className="intro-menu-sub">SOFTWARE ENGINEER // PORTFOLIO</p>
        <button
          type="button"
          className="intro-next"
          onClick={begin}
          disabled={phase !== 'idle'}
          tabIndex={phase === 'idle' ? 0 : -1}
          lang={language}
          aria-label={t('intro_enter')}
        >
          <LocalizedText i18nKey="intro_next" />
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="intro-flash" aria-hidden="true" />

      <p className="intro-status" role="status" aria-live="polite" lang={language}>
        {phase === 'zooming'
          ? t('intro_zooming')
          : phase === 'loading'
            ? t('intro_loading')
            : phase === 'brighten'
              ? t('intro_opening')
              : ''}
      </p>

      {wantsReport && (
        <pre className="intro-diag">
          {report
            ? [
                `meshes        ${report.meshes}`,
                `with texture  ${report.textured}`,
                `decoded       ${report.decoded}`,
                `first mat     ${report.firstMaterial?.name}`,
                `  colour      ${report.firstMaterial?.colour}`,
                `  map         ${report.firstMaterial?.map}`,
                `  colorSpace  ${report.firstMaterial?.colorSpace}`,
                `maxTexture    ${report.maxTextureSize}`,
                `webgl2        ${report.webgl2}`,
                `gpu           ${report.gpu}`,
              ].join('\n')
            : 'reading renderer...'}
        </pre>
      )}

      <button
        ref={skipRef}
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
