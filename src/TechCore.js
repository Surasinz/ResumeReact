import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTheme } from './ThemeSystem';

const DETAIL = 1;
const RADIUS = 1.25;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function Core({ accent, shell, pointerRef }) {
  const groupRef = useRef(null);
  const wireRef = useRef(null);
  const solidRef = useRef(null);
  const reducedMotion = useMemo(prefersReducedMotion, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Ease toward the pointer rather than snapping to it, so the core feels
    // weighted instead of twitchy. Runs even under reduced motion because it
    // is a direct response to input, not idle animation.
    const pointer = pointerRef.current;
    const targetY = pointer.x * 0.45;
    const targetX = -pointer.y * 0.32;
    group.rotation.y += (targetY - group.rotation.y) * Math.min(delta * 3, 1);
    group.rotation.x += (targetX - group.rotation.x) * Math.min(delta * 3, 1);

    if (reducedMotion) return;

    // Counter-rotation between the shells is what sells the depth: two
    // wireframes drifting the same way just look like one object.
    if (wireRef.current) {
      wireRef.current.rotation.y += delta * 0.28;
      wireRef.current.rotation.z += delta * 0.06;
    }
    if (solidRef.current) {
      solidRef.current.rotation.y -= delta * 0.16;
      solidRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={solidRef} scale={0.62}>
        <icosahedronGeometry args={[RADIUS, 0]} />
        <meshStandardMaterial
          color={shell}
          flatShading
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      <group ref={wireRef}>
        <mesh>
          <icosahedronGeometry args={[RADIUS, DETAIL]} />
          <meshBasicMaterial
            color={accent}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
        {/* Vertices picked out as nodes, so the lattice reads as structure. */}
        <points>
          <icosahedronGeometry args={[RADIUS, DETAIL]} />
          <pointsMaterial color={accent} size={0.055} sizeAttenuation />
        </points>
      </group>
    </group>
  );
}

export default function TechCore() {
  const { theme } = useTheme();
  const wrapRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    /*
      Tracked on window rather than through r3f's own pointer state: the
      wrapper is pointer-events:none so this decorative band can never
      swallow a click, which also means the canvas itself never receives
      pointermove and r3f's state.pointer would stay pinned at the origin.
      Reading from window also lets the core respond as the pointer
      approaches, instead of only once it is directly over it.
    */
    const clamp = (value) => Math.max(-1.6, Math.min(1.6, value));

    const handlePointerMove = (event) => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const bounds = wrap.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      pointerRef.current.x = clamp(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      );
      pointerRef.current.y = clamp(
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1
      );
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () =>
      window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const isDark = theme === 'dark';
  // The light accent is a neon tuned to glow on near-black; as line work on
  // a pale section it blows out, so the deeper text accent is used instead.
  const accent = isDark ? '#ff35a2' : '#147000';
  const shell = isDark ? '#16161f' : '#e7ecee';

  return (
    <div className="tech-core" ref={wrapRef} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={isDark ? 0.5 : 0.85} />
        <directionalLight position={[3, 4, 5]} intensity={isDark ? 1.1 : 1.3} />
        <directionalLight position={[-4, -2, -3]} intensity={0.35} />
        <Core accent={accent} shell={shell} pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
}
