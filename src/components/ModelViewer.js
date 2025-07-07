import { Canvas } from '@react-three/fiber';
import { Model as GithubModel } from '../Github';
import { Center, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import './style/ModelViewer.css';

function StaticModel({ onDoubleClick }) {
  return (
    <Center scale={2}>
      <group onDoubleClick={onDoubleClick}>
        <GithubModel />
      </group>
    </Center>
  );
}

function ModelViewer({ githubUrl = "https://github.com/Surasinz" }) {
  const controlsRef = useRef();

  const handleDoubleClick = (event) => {
    event.stopPropagation();
    
    window.open(githubUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="model-viewer-container" style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} />
        <StaticModel onDoubleClick={handleDoubleClick} />
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

export default ModelViewer;