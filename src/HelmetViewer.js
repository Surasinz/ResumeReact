import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';

const HELMET_MODEL_URL = `${process.env.PUBLIC_URL}/racing-helmet.glb`;
const HELMET_SCALE = 2.4;

function SpinningHelmet() {
  const { scene } = useGLTF(HELMET_MODEL_URL);
  const spinRef = useRef(null);
  const reducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  useFrame((_, delta) => {
    if (!reducedMotion && spinRef.current) {
      spinRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={spinRef}>
      <Center>
        <primitive object={scene} scale={HELMET_SCALE} />
      </Center>
    </group>
  );
}

export default function HelmetViewer() {
  useEffect(() => {
    // react-three-fiber sizes its canvas from a ResizeObserver on the
    // container. That first measurement can be missed if the container
    // hasn't settled into its final layout yet, leaving the canvas stuck at
    // its 300x150 default. A follow-up resize nudge forces a fresh read.
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Canvas
      className="helmet-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 2.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <hemisphereLight args={['#ffffff', '#1a1a2e', 0.55]} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} />
      <directionalLight position={[-3, -1, -2]} intensity={0.35} />
      <Suspense fallback={null}>
        <SpinningHelmet />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(HELMET_MODEL_URL);
