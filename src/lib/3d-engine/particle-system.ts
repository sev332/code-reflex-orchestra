// ─── GPU Particle System Engine ────────────────────
// Phase 4: Niagara-class particle emitter system

import * as THREE from 'three';

export type EmitterShape = 'point' | 'sphere' | 'cone' | 'box' | 'ring' | 'mesh-surface';

export interface ColorStop {
  time: number; // 0-1 normalized lifetime
  color: [number, number, number]; // RGB 0-1
}

export interface ParticleEmitterConfig {
  id: string;
  name: string;
  enabled: boolean;
  // Emission
  emitterShape: EmitterShape;
  maxParticles: number;
  emissionRate: number; // particles per second
  burst: number; // instant burst count (0 = continuous)
  // Lifetime
  lifetime: [number, number]; // min, max seconds
  // Initial velocity
  speed: [number, number]; // min, max
  direction: [number, number, number]; // normalized direction
  spread: number; // cone angle in radians (0 = focused, PI = hemisphere)
  // Size
  startSize: [number, number]; // min, max
  endSize: [number, number];
  // Color
  colorOverLife: ColorStop[];
  // Physics
  gravity: [number, number, number];
  drag: number; // 0-1
  turbulence: number;
  // Rotation
  startRotation: [number, number]; // min, max radians
  rotationSpeed: [number, number];
  // Emitter shape params
  shapeRadius: number;
  shapeAngle: number; // for cone
  shapeSize: [number, number, number]; // for box
  // Rendering
  blendMode: 'additive' | 'normal' | 'multiply';
  opacity: number;
  // World
  position: [number, number, number];
  worldSpace: boolean;
}

export interface ParticlePreset {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  config: Partial<ParticleEmitterConfig>;
}

// ─── Default Emitter ───────────────────────────────

export const defaultEmitterConfig: ParticleEmitterConfig = {
  id: '',
  name: 'Emitter',
  enabled: true,
  emitterShape: 'point',
  maxParticles: 500,
  emissionRate: 50,
  burst: 0,
  lifetime: [1, 3],
  speed: [1, 3],
  direction: [0, 1, 0],
  spread: 0.5,
  startSize: [0.05, 0.1],
  endSize: [0, 0.02],
  colorOverLife: [
    { time: 0, color: [1, 1, 1] },
    { time: 1, color: [1, 1, 1] },
  ],
  gravity: [0, -2, 0],
  drag: 0.02,
  turbulence: 0,
  startRotation: [0, Math.PI * 2],
  rotationSpeed: [-1, 1],
  shapeRadius: 0.5,
  shapeAngle: Math.PI / 6,
  shapeSize: [1, 1, 1],
  blendMode: 'additive',
  opacity: 1,
  position: [0, 0, 0],
  worldSpace: true,
};

// ─── Particle Presets Library ──────────────────────

export const particlePresets: ParticlePreset[] = [
  {
    id: 'fire', name: 'Fire', category: 'Nature', thumbnail: '🔥',
    config: {
      emissionRate: 80, maxParticles: 400, lifetime: [0.5, 1.5],
      speed: [1, 3], direction: [0, 1, 0], spread: 0.3,
      startSize: [0.15, 0.25], endSize: [0, 0.05],
      colorOverLife: [
        { time: 0, color: [1, 0.9, 0.3] },
        { time: 0.3, color: [1, 0.5, 0.1] },
        { time: 0.7, color: [0.8, 0.2, 0.05] },
        { time: 1, color: [0.2, 0.05, 0.02] },
      ],
      gravity: [0, 1, 0], drag: 0.1, turbulence: 0.5,
      blendMode: 'additive', emitterShape: 'sphere', shapeRadius: 0.3,
    },
  },
  {
    id: 'smoke', name: 'Smoke', category: 'Nature', thumbnail: '💨',
    config: {
      emissionRate: 30, maxParticles: 200, lifetime: [2, 5],
      speed: [0.3, 1], direction: [0, 1, 0], spread: 0.4,
      startSize: [0.1, 0.2], endSize: [0.5, 1.0],
      colorOverLife: [
        { time: 0, color: [0.4, 0.4, 0.4] },
        { time: 0.5, color: [0.5, 0.5, 0.5] },
        { time: 1, color: [0.3, 0.3, 0.3] },
      ],
      gravity: [0, 0.5, 0], drag: 0.15, turbulence: 0.8,
      blendMode: 'normal', emitterShape: 'sphere', shapeRadius: 0.2,
    },
  },
  {
    id: 'sparks', name: 'Sparks', category: 'FX', thumbnail: '✨',
    config: {
      emissionRate: 100, maxParticles: 500, lifetime: [0.3, 1],
      speed: [3, 8], direction: [0, 1, 0], spread: Math.PI / 3,
      startSize: [0.02, 0.05], endSize: [0, 0.01],
      colorOverLife: [
        { time: 0, color: [1, 1, 0.8] },
        { time: 0.5, color: [1, 0.6, 0.1] },
        { time: 1, color: [1, 0.2, 0] },
      ],
      gravity: [0, -9.8, 0], drag: 0.01,
      blendMode: 'additive', emitterShape: 'point',
    },
  },
  {
    id: 'rain', name: 'Rain', category: 'Weather', thumbnail: '🌧️',
    config: {
      emissionRate: 200, maxParticles: 2000, lifetime: [1, 2],
      speed: [8, 12], direction: [0, -1, 0], spread: 0.05,
      startSize: [0.01, 0.02], endSize: [0.01, 0.02],
      colorOverLife: [
        { time: 0, color: [0.6, 0.7, 0.9] },
        { time: 1, color: [0.4, 0.5, 0.8] },
      ],
      gravity: [0, -9.8, 0], drag: 0,
      blendMode: 'normal', emitterShape: 'box', shapeSize: [10, 0, 10],
      position: [0, 8, 0],
    },
  },
  {
    id: 'snow', name: 'Snow', category: 'Weather', thumbnail: '❄️',
    config: {
      emissionRate: 60, maxParticles: 1000, lifetime: [4, 8],
      speed: [0.3, 0.8], direction: [0, -1, 0], spread: 0.3,
      startSize: [0.03, 0.08], endSize: [0.02, 0.06],
      colorOverLife: [
        { time: 0, color: [1, 1, 1] },
        { time: 1, color: [0.9, 0.95, 1] },
      ],
      gravity: [0, -0.5, 0], drag: 0.3, turbulence: 1.5,
      blendMode: 'normal', emitterShape: 'box', shapeSize: [10, 0, 10],
      position: [0, 8, 0],
    },
  },
  {
    id: 'magic', name: 'Magic Aura', category: 'FX', thumbnail: '🔮',
    config: {
      emissionRate: 40, maxParticles: 300, lifetime: [1, 3],
      speed: [0.5, 1.5], direction: [0, 1, 0], spread: Math.PI,
      startSize: [0.03, 0.08], endSize: [0, 0.02],
      colorOverLife: [
        { time: 0, color: [0.5, 0.2, 1] },
        { time: 0.5, color: [0.2, 0.5, 1] },
        { time: 1, color: [0.8, 0.3, 1] },
      ],
      gravity: [0, 0.5, 0], drag: 0.05, turbulence: 2,
      blendMode: 'additive', emitterShape: 'sphere', shapeRadius: 0.5,
    },
  },
  {
    id: 'explosion', name: 'Explosion', category: 'FX', thumbnail: '💥',
    config: {
      emissionRate: 0, burst: 200, maxParticles: 200, lifetime: [0.5, 2],
      speed: [5, 15], direction: [0, 0, 0], spread: Math.PI,
      startSize: [0.1, 0.3], endSize: [0, 0.05],
      colorOverLife: [
        { time: 0, color: [1, 1, 0.8] },
        { time: 0.2, color: [1, 0.6, 0.1] },
        { time: 0.5, color: [0.8, 0.2, 0.05] },
        { time: 1, color: [0.1, 0.05, 0.02] },
      ],
      gravity: [0, -3, 0], drag: 0.05, turbulence: 1,
      blendMode: 'additive', emitterShape: 'point',
    },
  },
  {
    id: 'dust', name: 'Dust Motes', category: 'Ambient', thumbnail: '🌫️',
    config: {
      emissionRate: 15, maxParticles: 200, lifetime: [5, 10],
      speed: [0.05, 0.2], direction: [0, 0.3, 0], spread: Math.PI,
      startSize: [0.01, 0.03], endSize: [0.01, 0.03],
      colorOverLife: [
        { time: 0, color: [0.8, 0.75, 0.6] },
        { time: 0.5, color: [0.9, 0.85, 0.7] },
        { time: 1, color: [0.7, 0.65, 0.5] },
      ],
      gravity: [0, 0.02, 0], drag: 0.5, turbulence: 3,
      blendMode: 'normal', emitterShape: 'box', shapeSize: [5, 3, 5],
    },
  },
  {
    id: 'fireflies', name: 'Fireflies', category: 'Ambient', thumbnail: '🪲',
    config: {
      emissionRate: 8, maxParticles: 100, lifetime: [3, 7],
      speed: [0.1, 0.5], direction: [0, 0.5, 0], spread: Math.PI,
      startSize: [0.02, 0.05], endSize: [0.02, 0.05],
      colorOverLife: [
        { time: 0, color: [0.2, 1, 0.3] },
        { time: 0.5, color: [0.5, 1, 0.2] },
        { time: 1, color: [0.1, 0.5, 0.1] },
      ],
      gravity: [0, 0.1, 0], drag: 0.3, turbulence: 4,
      blendMode: 'additive', emitterShape: 'box', shapeSize: [6, 3, 6],
    },
  },
  {
    id: 'confetti', name: 'Confetti', category: 'FX', thumbnail: '🎉',
    config: {
      emissionRate: 0, burst: 150, maxParticles: 150, lifetime: [2, 5],
      speed: [3, 8], direction: [0, 1, 0], spread: Math.PI / 4,
      startSize: [0.04, 0.08], endSize: [0.04, 0.08],
      colorOverLife: [
        { time: 0, color: [1, 0.3, 0.5] },
        { time: 0.33, color: [0.3, 0.8, 1] },
        { time: 0.66, color: [1, 1, 0.3] },
        { time: 1, color: [0.5, 1, 0.5] },
      ],
      gravity: [0, -3, 0], drag: 0.15, turbulence: 2,
      rotationSpeed: [-5, 5],
      blendMode: 'normal', emitterShape: 'point',
    },
  },
];

export const particleCategories = ['All', ...Array.from(new Set(particlePresets.map(p => p.category)))];

// ─── Particle Simulation (CPU-side for state) ──────

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  colorIndex: number; // for color over life interpolation
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function getEmitPosition(config: ParticleEmitterConfig): THREE.Vector3 {
  const pos = new THREE.Vector3(...config.position);
  switch (config.emitterShape) {
    case 'point': return pos;
    case 'sphere': {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * config.shapeRadius;
      return pos.add(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ));
    }
    case 'cone': {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * config.shapeRadius;
      return pos.add(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
    }
    case 'box': {
      return pos.add(new THREE.Vector3(
        (Math.random() - 0.5) * config.shapeSize[0],
        (Math.random() - 0.5) * config.shapeSize[1],
        (Math.random() - 0.5) * config.shapeSize[2],
      ));
    }
    case 'ring': {
      const a = Math.random() * Math.PI * 2;
      return pos.add(new THREE.Vector3(
        config.shapeRadius * Math.cos(a), 0, config.shapeRadius * Math.sin(a),
      ));
    }
    default: return pos;
  }
}

function getEmitVelocity(config: ParticleEmitterConfig): THREE.Vector3 {
  const speed = randomRange(config.speed[0], config.speed[1]);
  const dir = new THREE.Vector3(...config.direction).normalize();
  
  if (config.spread > 0) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * config.spread;
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    // Rotate to align with direction
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return new THREE.Vector3(x, y, z).applyQuaternion(quat).multiplyScalar(speed);
  }
  
  return dir.multiplyScalar(speed);
}

export function interpolateColorOverLife(stops: ColorStop[], t: number): [number, number, number] {
  if (stops.length === 0) return [1, 1, 1];
  if (stops.length === 1) return stops[0].color;
  if (t <= stops[0].time) return stops[0].color;
  if (t >= stops[stops.length - 1].time) return stops[stops.length - 1].color;

  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].time && t <= stops[i + 1].time) {
      const localT = (t - stops[i].time) / (stops[i + 1].time - stops[i].time);
      return [
        stops[i].color[0] + (stops[i + 1].color[0] - stops[i].color[0]) * localT,
        stops[i].color[1] + (stops[i + 1].color[1] - stops[i].color[1]) * localT,
        stops[i].color[2] + (stops[i + 1].color[2] - stops[i].color[2]) * localT,
      ];
    }
  }
  return stops[stops.length - 1].color;
}

export function createEmitter(presetId?: string): ParticleEmitterConfig {
  const base = { ...defaultEmitterConfig, id: `emitter-${Date.now()}` };
  if (presetId) {
    const preset = particlePresets.find(p => p.id === presetId);
    if (preset) return { ...base, ...preset.config, name: preset.name };
  }
  return base;
}
