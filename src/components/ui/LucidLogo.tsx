// 3D Animated Color Sphere Logo for LUCID
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface LucidLogoProps {
  size?: number;
  className?: string;
}

export function LucidLogo({ size = 40, className = '' }: LucidLogoProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = size;
    const height = size;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Main color sphere with enhanced shader
    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowIntensity: { value: 1.2 },
        hueShiftSpeed: { value: 0.05 },
        saturationBoost: { value: 1.1 },
        valueBoost: { value: 0.85 },
        shimmerSpeed: { value: 3.0 },
        shimmerIntensity: { value: 0.15 },
        fresnelPower: { value: 2.5 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float glowIntensity;
        uniform float hueShiftSpeed;
        uniform float saturationBoost;
        uniform float valueBoost;
        uniform float shimmerSpeed;
        uniform float shimmerIntensity;
        uniform float fresnelPower;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec3 pos = normalize(vPosition);
          
          float hue = atan(pos.z, pos.x) / (2.0 * 3.14159) + 0.5 + time * hueShiftSpeed;
          float saturation = length(vec2(pos.x, pos.z)) * saturationBoost;
          float value = pos.y * 0.5 + valueBoost;

          vec3 baseColor = hsv2rgb(vec3(hue, saturation, value));
          
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), fresnelPower);
          
          vec3 glowColor = hsv2rgb(vec3(hue + 0.1, saturation * 0.8, 1.0));
          vec3 finalColor = baseColor + glowColor * fresnel * glowIntensity * 2.0;
          
          float shimmer = sin(time * shimmerSpeed + pos.x * 10.0) * shimmerIntensity + (1.0 - shimmerIntensity);
          finalColor *= shimmer;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Outer glow mesh
    const glowGeometry = new THREE.SphereGeometry(1.3, 64, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.2 },
        pulseSpeed: { value: 1.5 },
        hueShiftSpeed: { value: 0.05 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform float pulseSpeed;
        uniform float hueShiftSpeed;
        varying vec3 vNormal;
        varying vec3 vPosition;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec3 pos = normalize(vPosition);
          float hue = atan(pos.z, pos.x) / (2.0 * 3.14159) + 0.5 + time * hueShiftSpeed;
          
          vec3 dynamicGlow = hsv2rgb(vec3(hue, 0.7, 1.0));
          
          float glowStrength = pow(0.8 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          float pulse = sin(time * pulseSpeed) * 0.2 + 0.8;
          
          vec3 finalGlow = dynamicGlow * glowStrength * intensity * pulse;
          
          gl_FragColor = vec4(finalGlow, glowStrength * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(2, 2, 3);
    const fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.4);
    fillLight.position.set(-2, 0, -1);
    
    scene.add(ambientLight);
    scene.add(keyLight);
    scene.add(fillLight);

    camera.position.set(0, 0.1, 2.8);
    camera.lookAt(0, 0, 0);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      timeRef.current += 0.016;
      
      material.uniforms.time.value = timeRef.current;
      glowMaterial.uniforms.time.value = timeRef.current;
      
      sphere.rotation.y += 0.008;
      sphere.rotation.x = Math.sin(timeRef.current * 0.5) * 0.15;
      
      glowMesh.rotation.y += 0.006;
      glowMesh.rotation.x = -Math.sin(timeRef.current * 0.5) * 0.2;
      
      // Enhanced glow on hover
      const targetIntensity = isHovered ? 2.0 : 1.2;
      glowMaterial.uniforms.intensity.value += (targetIntensity - glowMaterial.uniforms.intensity.value) * 0.1;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
    };
  }, [size, isHovered]);

  return (
    <div 
      ref={mountRef} 
      className={`cursor-pointer transition-transform duration-300 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        filter: isHovered 
          ? 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.8)) drop-shadow(0 0 24px rgba(96, 165, 250, 0.4))'
          : 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.4)) drop-shadow(0 0 12px rgba(96, 165, 250, 0.2))',
        transition: 'filter 0.3s ease-in-out, transform 0.3s ease-in-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="LUCID - Intelligent AI System"
    />
  );
}
