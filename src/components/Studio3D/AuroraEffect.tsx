// Aurora Borealis effect for night mode in 3D Studio
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AURORA_VERTEX = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAGMENT = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  // Simplex-ish noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m * m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    
    // Vertical curtain shape — stronger at top
    float curtain = smoothstep(0.1, 0.7, uv.y);
    
    // Flowing noise layers
    float t = time * 0.15;
    float n1 = snoise(vec2(uv.x * 3.0 + t, uv.y * 1.5 + t * 0.3)) * 0.5 + 0.5;
    float n2 = snoise(vec2(uv.x * 5.0 - t * 0.7, uv.y * 2.0 + t * 0.5)) * 0.5 + 0.5;
    float n3 = snoise(vec2(uv.x * 8.0 + t * 0.4, uv.y * 3.0 - t * 0.2)) * 0.5 + 0.5;
    
    // Combine noise into curtain bands
    float band = pow(n1, 1.5) * 0.6 + pow(n2, 2.0) * 0.3 + pow(n3, 3.0) * 0.1;
    band *= curtain;
    
    // Horizontal variation — create distinct curtain folds
    float fold = sin(uv.x * 6.2831 * 2.0 + n1 * 3.0 + t) * 0.5 + 0.5;
    band *= mix(0.3, 1.0, fold);
    
    // Aurora colors: green → cyan → purple → pink
    vec3 green = vec3(0.1, 0.9, 0.4);
    vec3 cyan = vec3(0.1, 0.8, 0.9);
    vec3 purple = vec3(0.5, 0.2, 0.9);
    vec3 pink = vec3(0.9, 0.2, 0.6);
    
    float colorMix = n2;
    vec3 color = mix(green, cyan, smoothstep(0.2, 0.5, colorMix));
    color = mix(color, purple, smoothstep(0.5, 0.75, colorMix));
    color = mix(color, pink, smoothstep(0.75, 1.0, colorMix));
    
    // Bright edge glow
    color += vec3(0.2, 0.5, 0.3) * pow(band, 3.0) * 2.0;
    
    float alpha = band * intensity * 0.6;
    alpha *= smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x); // fade edges
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface AuroraEffectProps {
  intensity?: number;
}

export function AuroraEffect({ intensity = 1.0 }: AuroraEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: intensity },
      },
      vertexShader: AURORA_VERTEX,
      fragmentShader: AURORA_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.time.value = clock.getElapsedTime();
    material.uniforms.intensity.value = intensity;
  });

  return (
    <group>
      {/* Main aurora curtain */}
      <mesh ref={meshRef} position={[0, 25, -40]} rotation={[0.2, 0, 0]} material={material}>
        <planeGeometry args={[120, 30, 64, 32]} />
      </mesh>
      {/* Second curtain layer, offset */}
      <mesh position={[-20, 22, -50]} rotation={[0.15, 0.3, 0.05]} material={material}>
        <planeGeometry args={[80, 25, 48, 24]} />
      </mesh>
    </group>
  );
}
