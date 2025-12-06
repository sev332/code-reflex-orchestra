// Animated Nebula Background with Neural Network Visualization
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface NebulaBackgroundProps {
  isProcessing?: boolean;
  intensity?: number;
}

const NEBULA_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = `
  uniform float time;
  uniform vec2 resolution;
  uniform float opacity;
  uniform float processingBoost;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
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
  
  // FBM (Fractal Brownian Motion) for complex cloud shapes
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Slow drift for ethereal effect - faster when processing
    float driftSpeed = 0.02 + processingBoost * 0.03;
    float drift = time * driftSpeed;
    
    // Multiple layers of nebula clouds
    float n1 = fbm(uv * 2.0 + vec2(drift, drift * 0.7));
    float n2 = fbm(uv * 3.5 + vec2(-drift * 0.8, drift * 0.5));
    float n3 = fbm(uv * 5.0 + vec2(drift * 0.3, -drift * 0.4));
    
    // Combine noise layers
    float nebula = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
    
    // Color palette - deep space purples, blues, and cyans (LUCID theme)
    vec3 color1 = vec3(0.05, 0.02, 0.15);    // Deep purple-black
    vec3 color2 = vec3(0.25, 0.1, 0.45);     // Violet
    vec3 color3 = vec3(0.1, 0.25, 0.55);     // Deep blue
    vec3 color4 = vec3(0.4, 0.15, 0.6);      // Magenta
    vec3 color5 = vec3(0.0, 0.6, 0.7);       // Cyan (neural highlight)
    
    // Create color gradient based on noise
    vec3 nebulaColor = mix(color1, color2, smoothstep(0.3, 0.5, nebula));
    nebulaColor = mix(nebulaColor, color3, smoothstep(0.5, 0.7, n2 * 0.5 + 0.5));
    nebulaColor = mix(nebulaColor, color4, smoothstep(0.6, 0.8, n3 * 0.5 + 0.5) * 0.5);
    
    // Add neural highlight when processing
    nebulaColor = mix(nebulaColor, color5, smoothstep(0.4, 0.6, n1 * 0.5 + 0.5) * 0.3 * (1.0 + processingBoost * 0.5));
    
    // Add subtle glow in center
    float distFromCenter = length(uv - 0.5) * 2.0;
    float centerGlow = 1.0 - smoothstep(0.0, 1.5, distFromCenter);
    nebulaColor += vec3(0.05, 0.08, 0.15) * centerGlow * 0.5;
    
    // Pulsing effect when processing
    float pulse = sin(time * 2.0) * 0.1 * processingBoost + 1.0;
    nebulaColor *= pulse;
    
    // Vignette effect
    float vignette = 1.0 - smoothstep(0.5, 1.5, distFromCenter);
    
    // Final alpha based on nebula density
    float alpha = nebula * 0.25 * opacity * vignette;
    
    gl_FragColor = vec4(nebulaColor, alpha);
  }
`;

export function NebulaBackground({ isProcessing = false, intensity = 0.6 }: NebulaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationRef = useRef<number>(0);
  const processingRef = useRef(isProcessing);

  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'low-power'
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Nebula plane
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        opacity: { value: intensity },
        processingBoost: { value: 0 },
      },
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    materialRef.current = material;

    // Animation
    let startTime = Date.now();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const elapsed = (Date.now() - startTime) / 1000;
      material.uniforms.time.value = elapsed;
      
      // Smooth transition for processing boost
      const targetBoost = processingRef.current ? 1.0 : 0.0;
      const currentBoost = material.uniforms.processingBoost.value;
      material.uniforms.processingBoost.value += (targetBoost - currentBoost) * 0.05;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
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
      renderer.dispose();
    };
  }, [intensity]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'radial-gradient(ellipse at center, hsl(240 20% 8%) 0%, hsl(240 25% 4%) 100%)'
      }}
    />
  );
}
