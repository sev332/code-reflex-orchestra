// Starfield Night Sky with Nebula Clouds Background
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

export interface BackgroundSettings {
  // Stars
  starCount: number;
  starSpeed: number;
  starSize: number;
  starBrightness: number;
  starTwinkle: boolean;
  
  // Nebula
  nebulaOpacity: number;
  nebulaSpeed: number;
  nebulaScale: number;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Effects
  glowIntensity: number;
  shootingStars: boolean;
  neuralNetwork: boolean;
}

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  starCount: 2000,
  starSpeed: 0.1,
  starSize: 1.5,
  starBrightness: 1.0,
  starTwinkle: true,
  nebulaOpacity: 0.4,
  nebulaSpeed: 0.02,
  nebulaScale: 2.0,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4',
  glowIntensity: 0.5,
  shootingStars: true,
  neuralNetwork: true,
};

interface StarfieldNebulaBackgroundProps {
  isProcessing?: boolean;
  settings?: BackgroundSettings;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  twinkleOffset: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
}

interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  pulsePhase: number;
}

const NEBULA_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = `
  uniform float time;
  uniform float opacity;
  uniform float processingBoost;
  uniform float scale;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  varying vec2 vUv;
  
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
  
  float fbm(vec2 p, float time) {
    float value = 0.0;
    float amplitude = 0.5;
    vec2 drift = vec2(time * 0.1, time * 0.07);
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p + drift);
      p *= 2.0;
      amplitude *= 0.5;
      drift *= 0.8;
    }
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    float speed = 0.02 + processingBoost * 0.03;
    
    float n1 = fbm(uv * scale, time * speed);
    float n2 = fbm(uv * scale * 1.5 + 0.5, time * speed * 0.8);
    float n3 = fbm(uv * scale * 2.0 + 1.0, time * speed * 0.6);
    
    float nebula = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
    
    vec3 nebulaColor = mix(color1 * 0.3, color2, smoothstep(0.3, 0.6, nebula));
    nebulaColor = mix(nebulaColor, color3, smoothstep(0.5, 0.8, n2 * 0.5 + 0.5) * 0.4);
    
    // Processing glow
    float pulse = sin(time * 3.0) * 0.15 * processingBoost + 1.0;
    nebulaColor *= pulse;
    
    // Center glow
    float dist = length(uv - 0.5) * 2.0;
    float glow = 1.0 - smoothstep(0.0, 1.2, dist);
    nebulaColor += color3 * glow * 0.1 * (1.0 + processingBoost);
    
    // Vignette
    float vignette = 1.0 - smoothstep(0.4, 1.4, dist);
    float alpha = nebula * opacity * vignette * 0.6;
    
    gl_FragColor = vec4(nebulaColor, alpha);
  }
`;

export function StarfieldNebulaBackground({ 
  isProcessing = false, 
  settings = DEFAULT_BACKGROUND_SETTINGS 
}: StarfieldNebulaBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const neuralNodesRef = useRef<NeuralNode[]>([]);
  const animationRef = useRef<number>(0);
  const processingRef = useRef(isProcessing);
  const settingsRef = useRef(settings);

  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Canvas starfield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize stars
    const initStars = () => {
      starsRef.current = [];
      const s = settingsRef.current;
      for (let i = 0; i < s.starCount; i++) {
        const colors = [s.primaryColor, s.secondaryColor, s.accentColor, '#ffffff', '#e0e7ff'];
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1000,
          size: Math.random() * s.starSize + 0.5,
          brightness: Math.random() * 0.5 + 0.5,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    // Initialize neural network nodes
    const initNeuralNodes = () => {
      neuralNodesRef.current = [];
      const nodeCount = 30;
      for (let i = 0; i < nodeCount; i++) {
        const connections: number[] = [];
        for (let j = 0; j < 3; j++) {
          const target = Math.floor(Math.random() * nodeCount);
          if (target !== i) connections.push(target);
        }
        neuralNodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          connections,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initStars();
    initNeuralNodes();

    let time = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.016;
      
      const s = settingsRef.current;
      const isProc = processingRef.current;
      
      // Clear with deep space gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      gradient.addColorStop(0, 'hsl(240, 30%, 6%)');
      gradient.addColorStop(0.5, 'hsl(260, 40%, 4%)');
      gradient.addColorStop(1, 'hsl(240, 50%, 2%)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      starsRef.current.forEach((star, i) => {
        star.z -= s.starSpeed * (isProc ? 2 : 1);
        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * canvas.width;
          star.y = Math.random() * canvas.height;
        }

        const scale = 1000 / star.z;
        const x = (star.x - canvas.width / 2) * scale + canvas.width / 2;
        const y = (star.y - canvas.height / 2) * scale + canvas.height / 2;
        const size = star.size * scale * 0.5;
        
        let brightness = star.brightness * s.starBrightness * (1 - star.z / 1000);
        if (s.starTwinkle) {
          brightness *= 0.7 + 0.3 * Math.sin(time * 3 + star.twinkleOffset);
        }

        ctx.beginPath();
        ctx.arc(x, y, Math.max(size, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = brightness;
        ctx.fill();

        // Star glow for close stars
        if (star.z < 300 && s.glowIntensity > 0) {
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
          glowGradient.addColorStop(0, star.color);
          glowGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGradient;
          ctx.globalAlpha = brightness * s.glowIntensity * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Shooting stars
      if (s.shootingStars) {
        if (Math.random() < 0.005) {
          shootingStarsRef.current.push({
            x: Math.random() * canvas.width,
            y: 0,
            vx: (Math.random() - 0.3) * 15,
            vy: Math.random() * 8 + 5,
            length: Math.random() * 80 + 40,
            life: 0,
            maxLife: 60,
          });
        }

        shootingStarsRef.current = shootingStarsRef.current.filter(ss => {
          ss.x += ss.vx;
          ss.y += ss.vy;
          ss.life++;
          
          if (ss.life < ss.maxLife) {
            const alpha = 1 - ss.life / ss.maxLife;
            const gradient = ctx.createLinearGradient(
              ss.x, ss.y,
              ss.x - ss.vx * ss.length / 10, ss.y - ss.vy * ss.length / 10
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - ss.vx * ss.length / 10, ss.y - ss.vy * ss.length / 10);
            ctx.stroke();
            return true;
          }
          return false;
        });
      }

      // Neural network when processing
      if (s.neuralNetwork && isProc) {
        neuralNodesRef.current.forEach((node, i) => {
          node.x += node.vx;
          node.y += node.vy;
          node.pulsePhase += 0.05;
          
          // Bounce off edges
          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
          
          // Draw connections
          node.connections.forEach(targetIdx => {
            const target = neuralNodesRef.current[targetIdx];
            if (!target) return;
            
            const dist = Math.hypot(target.x - node.x, target.y - node.y);
            if (dist < 300) {
              const alpha = (1 - dist / 300) * 0.3;
              const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;
              
              ctx.beginPath();
              ctx.strokeStyle = s.accentColor;
              ctx.globalAlpha = alpha * pulse;
              ctx.lineWidth = 1;
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
            }
          });

          // Draw node
          const pulse = Math.sin(node.pulsePhase) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = s.accentColor;
          ctx.globalAlpha = pulse * 0.8;
          ctx.fill();
        });
      }

      ctx.globalAlpha = 1;
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [settings.starCount]);

  // Three.js nebula overlay
  useEffect(() => {
    const container = threeContainerRef.current;
    if (!container) return;

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

    const hexToVec3 = (hex: string) => {
      const color = new THREE.Color(hex);
      return new THREE.Vector3(color.r, color.g, color.b);
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: settings.nebulaOpacity },
        processingBoost: { value: 0 },
        scale: { value: settings.nebulaScale },
        color1: { value: hexToVec3(settings.primaryColor) },
        color2: { value: hexToVec3(settings.secondaryColor) },
        color3: { value: hexToVec3(settings.accentColor) },
      },
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let startTime = Date.now();
    let rafId: number;
    
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      
      const elapsed = (Date.now() - startTime) / 1000;
      material.uniforms.time.value = elapsed;
      material.uniforms.opacity.value = settingsRef.current.nebulaOpacity;
      material.uniforms.scale.value = settingsRef.current.nebulaScale;
      
      const s = settingsRef.current;
      material.uniforms.color1.value = hexToVec3(s.primaryColor);
      material.uniforms.color2.value = hexToVec3(s.secondaryColor);
      material.uniforms.color3.value = hexToVec3(s.accentColor);
      
      const targetBoost = processingRef.current ? 1.0 : 0.0;
      const currentBoost = material.uniforms.processingBoost.value;
      material.uniforms.processingBoost.value += (targetBoost - currentBoost) * 0.05;
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div 
        ref={threeContainerRef}
        className="fixed inset-0 pointer-events-none z-[1]"
      />
    </>
  );
}
