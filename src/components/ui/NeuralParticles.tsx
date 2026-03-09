// Neural Network Particle Animation
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface NeuralParticlesProps {
  isProcessing?: boolean;
  particleCount?: number;
  connectionDistance?: number;
}

export function NeuralParticles({ 
  isProcessing = false, 
  particleCount = 80,
  connectionDistance = 120
}: NeuralParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const processingRef = useRef(isProcessing);
  const particlesRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    colors: Float32Array;
  } | null>(null);

  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'low-power'
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera.position.z = 400;

    // Create particles
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * window.innerWidth;
      positions[i * 3 + 1] = (Math.random() - 0.5) * window.innerHeight;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      // Cyan/purple gradient colors
      const hue = Math.random() * 0.2 + 0.5; // 0.5-0.7 (cyan to blue)
      colors[i * 3] = 0.2 + Math.random() * 0.3;     // R
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.3; // G
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
    }

    particlesRef.current = { positions, velocities, colors };

    // Particle geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Line geometry for connections
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Animation
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const data = particlesRef.current;
      if (!data) return;

      const speedMultiplier = processingRef.current ? 2.5 : 1.0;
      const connectionOpacity = processingRef.current ? 0.3 : 0.1;

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        data.positions[i * 3] += data.velocities[i * 3] * speedMultiplier;
        data.positions[i * 3 + 1] += data.velocities[i * 3 + 1] * speedMultiplier;
        data.positions[i * 3 + 2] += data.velocities[i * 3 + 2] * speedMultiplier;

        // Wrap around edges
        if (data.positions[i * 3] > window.innerWidth / 2) data.positions[i * 3] = -window.innerWidth / 2;
        if (data.positions[i * 3] < -window.innerWidth / 2) data.positions[i * 3] = window.innerWidth / 2;
        if (data.positions[i * 3 + 1] > window.innerHeight / 2) data.positions[i * 3 + 1] = -window.innerHeight / 2;
        if (data.positions[i * 3 + 1] < -window.innerHeight / 2) data.positions[i * 3 + 1] = window.innerHeight / 2;
        if (data.positions[i * 3 + 2] > 100) data.positions[i * 3 + 2] = -100;
        if (data.positions[i * 3 + 2] < -100) data.positions[i * 3 + 2] = 100;
      }

      geometry.attributes.position.needsUpdate = true;

      // Update connections
      const connectionPositions: number[] = [];
      const dist = connectionDistance * (processingRef.current ? 1.3 : 1.0);

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = data.positions[i * 3] - data.positions[j * 3];
          const dy = data.positions[i * 3 + 1] - data.positions[j * 3 + 1];
          const dz = data.positions[i * 3 + 2] - data.positions[j * 3 + 2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < dist) {
            connectionPositions.push(
              data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2],
              data.positions[j * 3], data.positions[j * 3 + 1], data.positions[j * 3 + 2]
            );
          }
        }
      }

      lineGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(connectionPositions, 3)
      );
      lineMaterial.opacity = connectionOpacity;

      // Pulse particle size when processing
      if (processingRef.current) {
        material.size = 3 + Math.sin(Date.now() * 0.005) * 1.5;
        material.opacity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
      } else {
        material.size = 3;
        material.opacity = 0.6;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [particleCount, connectionDistance]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
