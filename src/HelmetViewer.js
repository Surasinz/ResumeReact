import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, useGLTF } from '@react-three/drei';

const HELMET_MODEL_URL = `${process.env.PUBLIC_URL}/racing-helmet.glb`;
const HELMET_SCALE = 1.6;

function HelmetModel() {
  const { scene } = useGLTF(HELMET_MODEL_URL);
  return (
    <Center>
      <primitive object={scene} scale={HELMET_SCALE} />
    </Center>
  );
}

export default function HelmetViewer() {
  const reducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  useEffect(() => {
    // react-three-fiber sizes its canvas from a ResizeObserver on the
    // container. That first measurement can be missed if the container
    // hasn't settled into its final layout yet, leaving the canvas stuck at
    // its 300x150 default. A follow-up resize nudge forces a fresh read.
    // (The container is taken out of CSS Grid flow via `position: absolute`
    // below -- see https://github.com/pmndrs/react-three-fiber/issues/2861
    // for why leaving it as a normal grid item, alongside sibling elements,
    // made the canvas's measured size and the grid's auto-sized track feed
    // back into each other and grow without bound every frame.)
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Canvas
      className="helmet-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 2.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <hemisphereLight args={['#ffffff', '#1a1a2e', 0.55]} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} />
      <directionalLight position={[-3, -1, -2]} intensity={0.35} />
      <Suspense fallback={null}>
        <HelmetModel />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate
        autoRotate={!reducedMotion}
        autoRotateSpeed={2}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI - 0.3}
      />
    </Canvas>
  );
}

useGLTF.preload(HELMET_MODEL_URL);
