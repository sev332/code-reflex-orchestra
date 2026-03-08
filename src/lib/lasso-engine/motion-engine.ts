/**
 * Motion Engine — Boundary Instrument Thesis §5-6
 * 
 * 4-force model that governs how the lasso path point moves:
 * 1. Edge Attraction — pulls toward nearby gradient peaks
 * 2. Tangent Flow — biases motion along edge tangent direction
 * 3. Cursor Spring — elastic connection to raw cursor position
 * 4. Inertia — momentum from previous motion (smoothing)
 * 
 * The compositor blends these forces based on local field confidence.
 */

import {
  FieldCache,
  sampleField,
  sampleGradient,
  sampleCoherence,
  sampleOrientation,
} from './field-engine';

// ============================================
// TYPES
// ============================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface ForceWeights {
  attraction: number;   // [0,1] — edge pull strength
  flow: number;         // [0,1] — tangent flow bias
  spring: number;       // [0,1] — cursor fidelity
  inertia: number;      // [0,1] — momentum smoothing
}

export interface MotionState {
  position: Vec2;       // current snapped position
  velocity: Vec2;       // momentum vector
  cursor: Vec2;         // raw cursor position
  confidence: number;   // local field confidence [0,1]
  speed: number;        // cursor speed (px/tick)
}

export interface MotionConfig {
  baseWeights: ForceWeights;
  attractionRadius: number;       // search radius for edge pull (px)
  attractionFalloff: number;      // how quickly attraction fades with distance
  springStiffness: number;        // cursor spring k
  inertiaDecay: number;           // velocity damping [0,1] — 0 = no inertia
  maxDisplacement: number;        // max displacement from cursor per tick
  speedAdaptation: boolean;       // adapt weights based on cursor speed
  coherenceGating: boolean;       // reduce assistance in low-coherence areas
}

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  baseWeights: { attraction: 0.6, flow: 0.3, spring: 0.8, inertia: 0.2 },
  attractionRadius: 12,
  attractionFalloff: 0.5,
  springStiffness: 0.4,
  inertiaDecay: 0.85,
  maxDisplacement: 8,
  speedAdaptation: true,
  coherenceGating: true,
};

// ============================================
// FORCE COMPUTATIONS
// ============================================

/**
 * Edge Attraction: search a local neighborhood for the strongest
 * gradient peak and return a pull vector toward it.
 */
function computeAttraction(
  cache: FieldCache, pos: Vec2, radius: number, falloff: number
): Vec2 {
  const { width: w, height: h, gradMag } = cache;
  let bestMag = 0;
  let bestX = pos.x;
  let bestY = pos.y;

  const r = Math.ceil(radius);
  const x0 = Math.max(1, Math.floor(pos.x) - r);
  const y0 = Math.max(1, Math.floor(pos.y) - r);
  const x1 = Math.min(w - 2, Math.floor(pos.x) + r);
  const y1 = Math.min(h - 2, Math.floor(pos.y) + r);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      const mag = gradMag[y * w + x];
      const weight = mag * Math.exp(-falloff * dist);
      if (weight > bestMag) {
        bestMag = weight;
        bestX = x;
        bestY = y;
      }
    }
  }

  const dx = bestX - pos.x;
  const dy = bestY - pos.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.5) return { x: 0, y: 0 };

  return { x: dx / len, y: dy / len };
}

/**
 * Tangent Flow: bias motion along the dominant edge orientation.
 * The orientation field gives the edge direction; we project 
 * the cursor-to-position delta onto this tangent.
 */
function computeFlow(cache: FieldCache, pos: Vec2, cursorDelta: Vec2): Vec2 {
  const ori = sampleOrientation(cache, pos.x, pos.y);
  // Tangent is along the edge (perpendicular to gradient)
  const tx = Math.cos(ori);
  const ty = Math.sin(ori);

  // Project cursor delta onto tangent
  const dot = cursorDelta.x * tx + cursorDelta.y * ty;
  return { x: tx * Math.sign(dot), y: ty * Math.sign(dot) };
}

/**
 * Cursor Spring: elastic pull back toward raw cursor position.
 */
function computeSpring(pos: Vec2, cursor: Vec2, stiffness: number): Vec2 {
  const dx = cursor.x - pos.x;
  const dy = cursor.y - pos.y;
  return { x: dx * stiffness, y: dy * stiffness };
}

/**
 * Inertia: carry forward previous velocity with decay.
 */
function computeInertia(velocity: Vec2, decay: number): Vec2 {
  return { x: velocity.x * decay, y: velocity.y * decay };
}

// ============================================
// ADAPTIVE WEIGHT MODULATION
// ============================================

function adaptWeights(
  base: ForceWeights,
  config: MotionConfig,
  cache: FieldCache,
  pos: Vec2,
  speed: number
): ForceWeights {
  let { attraction, flow, spring, inertia } = { ...base };

  // Coherence gating: in low-coherence areas, reduce field forces
  if (config.coherenceGating) {
    const coh = sampleCoherence(cache, pos.x, pos.y);
    attraction *= coh;
    flow *= coh;
    // Increase spring to keep close to cursor in ambiguous areas
    spring = spring + (1 - coh) * (1 - spring) * 0.5;
  }

  // Speed adaptation: at high speed, favor inertia; at low speed, favor attraction
  if (config.speedAdaptation && speed > 0) {
    const speedFactor = Math.min(speed / 10, 1); // normalize to ~10px/tick
    attraction *= (1 - speedFactor * 0.5);
    inertia = inertia + speedFactor * (1 - inertia) * 0.4;
  }

  return { attraction, flow, spring, inertia };
}

// ============================================
// FORCE COMPOSITOR
// ============================================

export function stepMotion(
  state: MotionState,
  newCursor: Vec2,
  cache: FieldCache,
  config: MotionConfig
): MotionState {
  const { position: pos, velocity } = state;

  // Cursor delta and speed
  const cdx = newCursor.x - state.cursor.x;
  const cdy = newCursor.y - state.cursor.y;
  const speed = Math.sqrt(cdx * cdx + cdy * cdy);
  const cursorDelta = { x: cdx, y: cdy };

  // Adaptive weights
  const w = adaptWeights(config.baseWeights, config, cache, pos, speed);

  // Compute individual forces
  const fAttract = computeAttraction(cache, pos, config.attractionRadius, config.attractionFalloff);
  const fFlow = computeFlow(cache, pos, cursorDelta);
  const fSpring = computeSpring(pos, newCursor, config.springStiffness);
  const fInertia = computeInertia(velocity, config.inertiaDecay);

  // Composite force
  let fx = w.attraction * fAttract.x
         + w.flow * fFlow.x
         + w.spring * fSpring.x
         + w.inertia * fInertia.x;

  let fy = w.attraction * fAttract.y
         + w.flow * fFlow.y
         + w.spring * fSpring.y
         + w.inertia * fInertia.y;

  // Clamp displacement
  const fLen = Math.sqrt(fx * fx + fy * fy);
  if (fLen > config.maxDisplacement) {
    const scale = config.maxDisplacement / fLen;
    fx *= scale;
    fy *= scale;
  }

  const newPos = {
    x: Math.max(0, Math.min(cache.width - 1, pos.x + fx)),
    y: Math.max(0, Math.min(cache.height - 1, pos.y + fy)),
  };

  const newVelocity = { x: fx, y: fy };
  const confidence = sampleCoherence(cache, newPos.x, newPos.y);

  return {
    position: newPos,
    velocity: newVelocity,
    cursor: newCursor,
    confidence,
    speed,
  };
}

export function initMotionState(cursor: Vec2): MotionState {
  return {
    position: { ...cursor },
    velocity: { x: 0, y: 0 },
    cursor: { ...cursor },
    confidence: 0,
    speed: 0,
  };
}
