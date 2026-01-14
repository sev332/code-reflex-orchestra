// Real-time WebGL Neural Network Visualization
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralNode {
  id: string;
  position: [number, number, number];
  activation: number;
  type: 'input' | 'hidden' | 'output' | 'memory';
}

interface NeuralConnection {
  from: string;
  to: string;
  weight: number;
  active: boolean;
}

export interface NeuralVisualizationProps {
  isActive: boolean;
  currentThought?: string;
  explorationProgress?: number;
  reasoningStyle?: 'analytical' | 'creative' | 'systematic' | 'intuitive';
  loopDetected?: boolean;
}

// Individual neural node component
const NeuralNodeMesh: React.FC<{
  node: NeuralNode;
  isExploring: boolean;
  loopDetected: boolean;
}> = ({ node, isExploring, loopDetected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Pulsing effect based on activation
    const pulse = Math.sin(state.clock.elapsedTime * 3 + node.activation * 10) * 0.1;
    meshRef.current.scale.setScalar(0.15 + node.activation * 0.1 + pulse);

    // Glow intensity
    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMaterial.opacity = node.activation * 0.3 + (isExploring ? 0.2 : 0);
    }
  });

  const getColor = () => {
    if (loopDetected) return '#ff4444';
    switch (node.type) {
      case 'input': return '#4fc3f7';
      case 'hidden': return '#ab47bc';
      case 'output': return '#66bb6a';
      case 'memory': return '#ffa726';
      default: return '#ffffff';
    }
  };

  return (
    <group position={node.position}>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[0.3, 16, 16]}>
        <meshBasicMaterial 
          color={getColor()} 
          transparent 
          opacity={0.2} 
          depthWrite={false}
        />
      </Sphere>
      
      {/* Main node */}
      <Sphere ref={meshRef} args={[0.15, 32, 32]}>
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={node.activation * 0.5}
          metalness={0.3}
          roughness={0.7}
        />
      </Sphere>
    </group>
  );
};

// Neural connection (synapse)
const NeuralSynapse: React.FC<{
  from: [number, number, number];
  to: [number, number, number];
  weight: number;
  active: boolean;
  isExploring: boolean;
}> = ({ from, to, weight, active, isExploring }) => {
  return (
    <Line
      points={[from, to]}
      color={active && isExploring ? '#00ff88' : '#8888ff'}
      lineWidth={weight * 2}
      transparent
      opacity={active && isExploring ? 0.7 : weight * 0.3}
    />
  );
};

// Particle system for activity
const ActivityParticles: React.FC<{ 
  isExploring: boolean;
  reasoningStyle?: string;
}> = ({ isExploring, reasoningStyle }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    if (!particlesRef.current || !isExploring) return;

    const posAttr = particlesRef.current.geometry.attributes.position;
    if (!posAttr) return;
    const posArray = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Different movement patterns based on reasoning style
      switch (reasoningStyle) {
        case 'analytical':
          posArray[i3 + 1] += Math.sin(time + i) * 0.01;
          break;
        case 'creative':
          posArray[i3] += Math.cos(time * 2 + i) * 0.02;
          posArray[i3 + 2] += Math.sin(time * 2 + i) * 0.02;
          break;
        case 'systematic':
          posArray[i3 + 1] += 0.01;
          if (posArray[i3 + 1] > 5) posArray[i3 + 1] = -5;
          break;
        case 'intuitive':
          const angle = time + i * 0.1;
          posArray[i3] += Math.cos(angle) * 0.015;
          posArray[i3 + 1] += Math.sin(angle) * 0.015;
          break;
        default:
          posArray[i3 + 1] += Math.sin(time + i) * 0.005;
      }
    }

    posAttr.needsUpdate = true;
  });

  const getParticleColor = () => {
    switch (reasoningStyle) {
      case 'analytical': return '#4fc3f7';
      case 'creative': return '#f06292';
      case 'systematic': return '#66bb6a';
      case 'intuitive': return '#ffa726';
      default: return '#ab47bc';
    }
  };

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color={getParticleColor()}
        transparent
        opacity={isExploring ? 0.6 : 0.2}
        sizeAttenuation
      />
    </points>
  );
};

// Main neural network visualization
const NeuralNetwork: React.FC<NeuralVisualizationProps> = ({
  isActive,
  currentThought,
  explorationProgress,
  reasoningStyle,
  loopDetected = false
}) => {
  // Generate neural network structure
  const { nodes, connections } = useMemo(() => {
    const nodes: NeuralNode[] = [];
    const connections: NeuralConnection[] = [];

    // Input layer (5 nodes)
    for (let i = 0; i < 5; i++) {
      nodes.push({
        id: `input-${i}`,
        position: [-4, (i - 2) * 1.5, 0],
        activation: Math.random() * 0.5 + 0.2,
        type: 'input'
      });
    }

    // Hidden layer 1 (7 nodes)
    for (let i = 0; i < 7; i++) {
      nodes.push({
        id: `hidden1-${i}`,
        position: [-1.5, (i - 3) * 1.2, (Math.random() - 0.5) * 2],
        activation: Math.random() * 0.7 + 0.1,
        type: 'hidden'
      });
    }

    // Hidden layer 2 (7 nodes)
    for (let i = 0; i < 7; i++) {
      nodes.push({
        id: `hidden2-${i}`,
        position: [1.5, (i - 3) * 1.2, (Math.random() - 0.5) * 2],
        activation: Math.random() * 0.7 + 0.1,
        type: 'hidden'
      });
    }

    // Output layer (4 nodes)
    for (let i = 0; i < 4; i++) {
      nodes.push({
        id: `output-${i}`,
        position: [4, (i - 1.5) * 1.5, 0],
        activation: Math.random() * 0.4 + 0.3,
        type: 'output'
      });
    }

    // Memory nodes (orbiting)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      nodes.push({
        id: `memory-${i}`,
        position: [Math.cos(angle) * 5, 0, Math.sin(angle) * 5],
        activation: Math.random() * 0.6 + 0.2,
        type: 'memory'
      });
    }

    // Create connections
    // Input to hidden1
    nodes.filter(n => n.type === 'input').forEach(input => {
      nodes.filter(n => n.id.startsWith('hidden1')).forEach(hidden => {
        if (Math.random() > 0.3) {
          connections.push({
            from: input.id,
            to: hidden.id,
            weight: Math.random(),
            active: Math.random() > 0.5
          });
        }
      });
    });

    // Hidden1 to hidden2
    nodes.filter(n => n.id.startsWith('hidden1')).forEach(h1 => {
      nodes.filter(n => n.id.startsWith('hidden2')).forEach(h2 => {
        if (Math.random() > 0.4) {
          connections.push({
            from: h1.id,
            to: h2.id,
            weight: Math.random(),
            active: Math.random() > 0.5
          });
        }
      });
    });

    // Hidden2 to output
    nodes.filter(n => n.id.startsWith('hidden2')).forEach(hidden => {
      nodes.filter(n => n.type === 'output').forEach(output => {
        if (Math.random() > 0.3) {
          connections.push({
            from: hidden.id,
            to: output.id,
            weight: Math.random(),
            active: Math.random() > 0.5
          });
        }
      });
    });

    return { nodes, connections };
  }, []);

  // Update activations based on exploration progress
  const animatedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      activation: node.activation * (0.5 + (explorationProgress || 0) / 200)
    }));
  }, [nodes, explorationProgress]);

  return (
    <group rotation={[0, 0, 0]}>
      {/* Neural nodes */}
      {animatedNodes.map(node => (
        <NeuralNodeMesh
          key={node.id}
          node={node}
          isExploring={isActive}
          loopDetected={loopDetected}
        />
      ))}

      {/* Connections */}
      {connections.map((conn, i) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return null;

        return (
          <NeuralSynapse
            key={i}
            from={fromNode.position}
            to={toNode.position}
            weight={conn.weight}
            active={conn.active}
            isExploring={isActive}
          />
        );
      })}

      {/* Activity particles */}
      <ActivityParticles 
        isExploring={isActive} 
        reasoningStyle={reasoningStyle}
      />

      {/* Ambient light */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8080ff" />
    </group>
  );
};

export const NeuralVisualization: React.FC<NeuralVisualizationProps> = (props) => {
  return (
    <div className="w-full h-full bg-black/20 rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0a1a']} />
        <fog attach="fog" args={['#0a0a1a', 10, 30]} />
        
        <NeuralNetwork {...props} />
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
          autoRotate={props.isActive}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay info */}
      {props.currentThought && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <p className="text-xs text-cyan-400 font-mono truncate">
            {props.currentThought}
          </p>
        </div>
      )}
      
      {props.loopDetected && (
        <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm rounded-lg px-3 py-1">
          <p className="text-xs text-white font-bold">⚠️ Loop Detected</p>
        </div>
      )}
    </div>
  );
};

export default NeuralVisualization;
