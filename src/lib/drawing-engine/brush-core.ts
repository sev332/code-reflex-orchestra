// ============================================
// BRUSH CORE — Input-to-Mark Transformation Engine
// Per Volume II of the Ultimate Drawing Engine doctrine
// ============================================
// Owns: input sampling, filtering/stabilization, dynamic signal mapping,
//       deposition models, vector/raster/hybrid capture, replay/provenance

import { Vec2 } from './types';
import { distance, lerp, normalize, sub, add, scale } from './geometry-core';
import { evaluatePressure, PressureCurve, defaultPressureCurve } from './stroke-core';

// ============================================
// INPUT SAMPLE MODEL
// ============================================

export interface RawInputSample {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  timestamp: number;
  pointerType: 'pen' | 'mouse' | 'touch';
}

export interface NormalizedSample {
  position: Vec2;
  pressure: number;     // [0,1] after pressure curve
  tilt: Vec2;            // normalized tilt
  velocity: number;      // px/ms
  curvature: number;     // local curvature estimate
  timestamp: number;
  arcLength: number;     // cumulative distance from start
}

// ============================================
// SMOOTHING / STABILIZER FRAMEWORK
// ============================================

export type StabilizerMode = 'none' | 'moving-average' | 'lazy-mouse' | 'pulled-string' | 'catmull-rom';

export interface StabilizerConfig {
  mode: StabilizerMode;
  /** For moving-average: window size in samples */
  windowSize: number;
  /** For lazy-mouse / pulled-string: string length in px */
  stringLength: number;
  /** For all: [0,1] smoothing factor applied to output */
  smoothingFactor: number;
  /** Whether to catch up to final point on release */
  catchUpOnRelease: boolean;
}

export const defaultStabilizer: StabilizerConfig = {
  mode: 'moving-average',
  windowSize: 4,
  stringLength: 20,
  smoothingFactor: 0.4,
  catchUpOnRelease: true,
};

export class InputStabilizer {
  private config: StabilizerConfig;
  private buffer: Vec2[] = [];
  private lastOutput: Vec2 | null = null;

  constructor(config: StabilizerConfig = defaultStabilizer) {
    this.config = config;
  }

  reset() {
    this.buffer = [];
    this.lastOutput = null;
  }

  process(raw: Vec2): Vec2 {
    switch (this.config.mode) {
      case 'none':
        return raw;

      case 'moving-average': {
        this.buffer.push(raw);
        if (this.buffer.length > this.config.windowSize) {
          this.buffer.shift();
        }
        const avg: Vec2 = { x: 0, y: 0 };
        for (const p of this.buffer) {
          avg.x += p.x;
          avg.y += p.y;
        }
        avg.x /= this.buffer.length;
        avg.y /= this.buffer.length;

        if (this.lastOutput) {
          const f = this.config.smoothingFactor;
          this.lastOutput = {
            x: this.lastOutput.x + (avg.x - this.lastOutput.x) * (1 - f),
            y: this.lastOutput.y + (avg.y - this.lastOutput.y) * (1 - f),
          };
        } else {
          this.lastOutput = avg;
        }
        return this.lastOutput;
      }

      case 'lazy-mouse':
      case 'pulled-string': {
        if (!this.lastOutput) {
          this.lastOutput = { ...raw };
          return this.lastOutput;
        }
        const dist = distance(this.lastOutput, raw);
        if (dist > this.config.stringLength) {
          const dir = normalize(sub(raw, this.lastOutput));
          this.lastOutput = add(this.lastOutput, scale(dir, dist - this.config.stringLength));
        }
        return this.lastOutput;
      }

      case 'catmull-rom': {
        this.buffer.push(raw);
        if (this.buffer.length > 4) this.buffer.shift();
        if (this.buffer.length < 4) return raw;
        // Catmull-Rom interpolation at t=0.5 between points[1] and points[2]
        const [p0, p1, p2, p3] = this.buffer;
        const t = 0.5;
        return {
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t),
        };
      }
    }
  }

  /** On pen release, generate catch-up points to the final position */
  release(finalPos: Vec2, steps: number = 6): Vec2[] {
    if (!this.config.catchUpOnRelease || !this.lastOutput) return [finalPos];
    const catchUp: Vec2[] = [];
    for (let i = 1; i <= steps; i++) {
      catchUp.push(lerp(this.lastOutput, finalPos, i / steps));
    }
    return catchUp;
  }
}

// ============================================
// DYNAMIC SIGNAL MAPPING
// ============================================

export type DynamicChannel = 'pressure' | 'tilt_x' | 'tilt_y' | 'velocity' | 'curvature' | 'direction' | 'random';
export type MappedTarget = 'width' | 'opacity' | 'rotation' | 'scatter' | 'spacing';

export interface ChannelMapping {
  source: DynamicChannel;
  target: MappedTarget;
  curve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'step';
  min: number;
  max: number;
  invert: boolean;
}

export function evaluateMapping(mapping: ChannelMapping, value: number): number {
  let v = Math.max(0, Math.min(1, value));
  if (mapping.invert) v = 1 - v;

  // Apply curve
  switch (mapping.curve) {
    case 'linear': break;
    case 'ease-in': v = v * v; break;
    case 'ease-out': v = 1 - (1 - v) * (1 - v); break;
    case 'ease-in-out': v = v < 0.5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v); break;
    case 'step': v = v > 0.5 ? 1 : 0; break;
  }

  return mapping.min + v * (mapping.max - mapping.min);
}

// ============================================
// BRUSH SESSION — Full capture pipeline
// ============================================

export interface BrushSessionConfig {
  stabilizer: StabilizerConfig;
  pressureCurve: PressureCurve;
  channelMappings: ChannelMapping[];
  minDistance: number; // min distance between samples in px
  captureMode: 'vector' | 'blob' | 'hybrid';
}

export const defaultBrushSessionConfig: BrushSessionConfig = {
  stabilizer: defaultStabilizer,
  pressureCurve: defaultPressureCurve,
  channelMappings: [
    { source: 'pressure', target: 'width', curve: 'linear', min: 0.2, max: 1.0, invert: false },
  ],
  minDistance: 2,
  captureMode: 'vector',
};

export class BrushSession {
  private config: BrushSessionConfig;
  private stabilizer: InputStabilizer;
  private rawSamples: RawInputSample[] = [];
  private normalizedSamples: NormalizedSample[] = [];
  private outputPoints: Vec2[] = [];
  private outputPressures: number[] = [];
  private outputWidths: number[] = [];
  private totalArcLength: number = 0;
  private _isActive: boolean = false;

  constructor(config: BrushSessionConfig = defaultBrushSessionConfig) {
    this.config = config;
    this.stabilizer = new InputStabilizer(config.stabilizer);
  }

  get isActive() { return this._isActive; }
  get points() { return this.outputPoints; }
  get pressures() { return this.outputPressures; }
  get widths() { return this.outputWidths; }
  get samples() { return this.normalizedSamples; }

  begin(sample: RawInputSample) {
    this._isActive = true;
    this.stabilizer.reset();
    this.rawSamples = [sample];
    this.totalArcLength = 0;

    const pos = this.stabilizer.process({ x: sample.x, y: sample.y });
    const pressure = evaluatePressure(sample.pressure, this.config.pressureCurve);
    const normalized: NormalizedSample = {
      position: pos,
      pressure,
      tilt: { x: sample.tiltX, y: sample.tiltY },
      velocity: 0,
      curvature: 0,
      timestamp: sample.timestamp,
      arcLength: 0,
    };

    this.normalizedSamples = [normalized];
    this.outputPoints = [pos];
    this.outputPressures = [pressure];
    this.outputWidths = [this._computeWidth(normalized)];
  }

  update(sample: RawInputSample): Vec2 | null {
    if (!this._isActive) return null;

    this.rawSamples.push(sample);
    const pos = this.stabilizer.process({ x: sample.x, y: sample.y });

    // Min distance filter
    const lastPt = this.outputPoints[this.outputPoints.length - 1];
    const dist = distance(lastPt, pos);
    if (dist < this.config.minDistance) return null;

    this.totalArcLength += dist;
    const pressure = evaluatePressure(sample.pressure, this.config.pressureCurve);
    const velocity = this.rawSamples.length > 1
      ? dist / Math.max(1, sample.timestamp - this.rawSamples[this.rawSamples.length - 2].timestamp)
      : 0;

    // Estimate local curvature
    let curvature = 0;
    if (this.outputPoints.length >= 3) {
      const p0 = this.outputPoints[this.outputPoints.length - 2];
      const p1 = lastPt;
      const p2 = pos;
      const d1 = sub(p1, p0);
      const d2 = sub(p2, p1);
      const cross = d1.x * d2.y - d1.y * d2.x;
      const dLen = distance(p0, p1) * distance(p1, p2);
      curvature = dLen > 1e-6 ? Math.abs(cross) / dLen : 0;
    }

    const normalized: NormalizedSample = {
      position: pos,
      pressure,
      tilt: { x: sample.tiltX, y: sample.tiltY },
      velocity,
      curvature,
      timestamp: sample.timestamp,
      arcLength: this.totalArcLength,
    };

    this.normalizedSamples.push(normalized);
    this.outputPoints.push(pos);
    this.outputPressures.push(pressure);
    this.outputWidths.push(this._computeWidth(normalized));

    return pos;
  }

  end(sample: RawInputSample): { points: Vec2[]; pressures: number[]; widths: number[] } {
    if (!this._isActive) return { points: [], pressures: [], widths: [] };

    // Catch up
    const catchUpPoints = this.stabilizer.release({ x: sample.x, y: sample.y });
    const lastPressure = this.outputPressures[this.outputPressures.length - 1] ?? 0.5;
    for (const pt of catchUpPoints) {
      const lastPt = this.outputPoints[this.outputPoints.length - 1];
      if (distance(lastPt, pt) >= this.config.minDistance / 2) {
        this.outputPoints.push(pt);
        // Fade pressure to zero for natural taper
        const fadeP = lastPressure * (1 - catchUpPoints.indexOf(pt) / catchUpPoints.length);
        this.outputPressures.push(fadeP);
        this.outputWidths.push(this._computeWidth({
          position: pt, pressure: fadeP, tilt: { x: 0, y: 0 },
          velocity: 0, curvature: 0, timestamp: sample.timestamp, arcLength: this.totalArcLength,
        }));
      }
    }

    this._isActive = false;
    return {
      points: [...this.outputPoints],
      pressures: [...this.outputPressures],
      widths: [...this.outputWidths],
    };
  }

  private _computeWidth(sample: NormalizedSample): number {
    let widthMult = 1;
    for (const mapping of this.config.channelMappings) {
      if (mapping.target !== 'width') continue;
      let channelValue = 0;
      switch (mapping.source) {
        case 'pressure': channelValue = sample.pressure; break;
        case 'velocity': channelValue = Math.min(1, sample.velocity / 2); break;
        case 'curvature': channelValue = Math.min(1, sample.curvature * 10); break;
        case 'tilt_x': channelValue = Math.abs(sample.tilt.x); break;
        case 'tilt_y': channelValue = Math.abs(sample.tilt.y); break;
        case 'direction': channelValue = 0.5; break;
        case 'random': channelValue = Math.random(); break;
      }
      widthMult *= evaluateMapping(mapping, channelValue);
    }
    return widthMult;
  }
}

// ============================================
// BRUSH PRESET
// ============================================

export interface BrushPresetFull {
  id: string;
  name: string;
  category: 'pen' | 'pencil' | 'ink' | 'marker' | 'airbrush' | 'calligraphy' | 'blob' | 'custom';
  baseSize: number;
  opacity: number;
  session: BrushSessionConfig;
  widthProfile: import('./stroke-core').WidthProfile;
  capStyle: import('./stroke-core').CapStyle;
  joinStyle: import('./stroke-core').JoinStyle;
  color: string;
}

export const BUILT_IN_PRESETS: BrushPresetFull[] = [
  {
    id: 'smooth-pen',
    name: 'Smooth Pen',
    category: 'pen',
    baseSize: 4,
    opacity: 1,
    session: {
      ...defaultBrushSessionConfig,
      stabilizer: { ...defaultStabilizer, mode: 'moving-average', windowSize: 5, smoothingFactor: 0.4 },
    },
    widthProfile: {
      mode: 'pressure', baseWidth: 4, samples: [],
      startTaper: 0.05, endTaper: 0.1, taperCurve: 'ease-out', minWidth: 0.5,
    },
    capStyle: 'round',
    joinStyle: 'round',
    color: '#ffffff',
  },
  {
    id: 'hard-pencil',
    name: 'Hard Pencil',
    category: 'pencil',
    baseSize: 2,
    opacity: 0.85,
    session: {
      ...defaultBrushSessionConfig,
      stabilizer: { ...defaultStabilizer, mode: 'none', smoothingFactor: 0 },
      minDistance: 1,
    },
    widthProfile: {
      mode: 'pressure', baseWidth: 2, samples: [],
      startTaper: 0, endTaper: 0, taperCurve: 'linear', minWidth: 0.3,
    },
    capStyle: 'round',
    joinStyle: 'round',
    color: '#888888',
  },
  {
    id: 'ink-brush',
    name: 'Ink Brush',
    category: 'ink',
    baseSize: 8,
    opacity: 1,
    session: {
      ...defaultBrushSessionConfig,
      stabilizer: { ...defaultStabilizer, mode: 'pulled-string', stringLength: 15, smoothingFactor: 0.3 },
      channelMappings: [
        { source: 'pressure', target: 'width', curve: 'ease-in', min: 0.1, max: 1.0, invert: false },
        { source: 'velocity', target: 'width', curve: 'ease-out', min: 0.6, max: 1.0, invert: true },
      ],
    },
    widthProfile: {
      mode: 'pressure', baseWidth: 8, samples: [],
      startTaper: 0.08, endTaper: 0.15, taperCurve: 'ease-in-out', minWidth: 0.3,
    },
    capStyle: 'tapered',
    joinStyle: 'round',
    color: '#1a1a1a',
  },
  {
    id: 'marker',
    name: 'Marker',
    category: 'marker',
    baseSize: 12,
    opacity: 0.7,
    session: {
      ...defaultBrushSessionConfig,
      stabilizer: { ...defaultStabilizer, mode: 'moving-average', windowSize: 3, smoothingFactor: 0.2 },
    },
    widthProfile: {
      mode: 'uniform', baseWidth: 12, samples: [],
      startTaper: 0, endTaper: 0, taperCurve: 'linear', minWidth: 10,
    },
    capStyle: 'square',
    joinStyle: 'bevel',
    color: '#4a9eff',
  },
  {
    id: 'calligraphy',
    name: 'Calligraphy',
    category: 'calligraphy',
    baseSize: 6,
    opacity: 1,
    session: {
      ...defaultBrushSessionConfig,
      stabilizer: { ...defaultStabilizer, mode: 'catmull-rom', smoothingFactor: 0.5 },
      channelMappings: [
        { source: 'pressure', target: 'width', curve: 'linear', min: 0.3, max: 1.0, invert: false },
        { source: 'tilt_x', target: 'width', curve: 'linear', min: 0.5, max: 1.5, invert: false },
      ],
    },
    widthProfile: {
      mode: 'pressure', baseWidth: 6, samples: [],
      startTaper: 0.1, endTaper: 0.1, taperCurve: 'ease-in-out', minWidth: 0.5,
    },
    capStyle: 'tapered',
    joinStyle: 'round',
    color: '#2d1b69',
  },
];
