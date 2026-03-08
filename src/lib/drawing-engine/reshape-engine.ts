// Reshape Engine — Sprint 3: Width Tool, Warp, Twirl, Pucker, Bloat, etc.
// Interactive mesh deformation tools for path manipulation

import { DrawableEntity, Vec2, generateId } from './types';
import { getEntityBounds } from './engine';
import { ensurePathData } from './node-editing';

// ============================================
// WIDTH TOOL — Variable-width stroke profiles
// ============================================

export interface WidthPoint {
  position: number; // 0-1 along path
  leftWidth: number;
  rightWidth: number;
}

export interface WidthProfile {
  points: WidthPoint[];
}

export const defaultWidthProfile: WidthProfile = {
  points: [
    { position: 0, leftWidth: 1, rightWidth: 1 },
    { position: 1, leftWidth: 1, rightWidth: 1 },
  ],
};

export const WIDTH_PRESETS: { name: string; profile: WidthProfile }[] = [
  {
    name: 'Uniform',
    profile: { points: [{ position: 0, leftWidth: 1, rightWidth: 1 }, { position: 1, leftWidth: 1, rightWidth: 1 }] },
  },
  {
    name: 'Pointed',
    profile: { points: [{ position: 0, leftWidth: 0, rightWidth: 0 }, { position: 0.5, leftWidth: 1, rightWidth: 1 }, { position: 1, leftWidth: 0, rightWidth: 0 }] },
  },
  {
    name: 'Tapered Start',
    profile: { points: [{ position: 0, leftWidth: 0, rightWidth: 0 }, { position: 0.3, leftWidth: 1, rightWidth: 1 }, { position: 1, leftWidth: 1, rightWidth: 1 }] },
  },
  {
    name: 'Tapered End',
    profile: { points: [{ position: 0, leftWidth: 1, rightWidth: 1 }, { position: 0.7, leftWidth: 1, rightWidth: 1 }, { position: 1, leftWidth: 0, rightWidth: 0 }] },
  },
  {
    name: 'Calligraphic',
    profile: { points: [{ position: 0, leftWidth: 0.2, rightWidth: 0.8 }, { position: 0.5, leftWidth: 0.8, rightWidth: 0.2 }, { position: 1, leftWidth: 0.2, rightWidth: 0.8 }] },
  },
  {
    name: 'Asymmetric',
    profile: { points: [{ position: 0, leftWidth: 0.3, rightWidth: 1 }, { position: 1, leftWidth: 1, rightWidth: 0.3 }] },
  },
];

export function addWidthPoint(profile: WidthProfile, position: number, leftWidth: number, rightWidth: number): WidthProfile {
  const points = [...profile.points, { position, leftWidth, rightWidth }]
    .sort((a, b) => a.position - b.position);
  return { points };
}

export function removeWidthPoint(profile: WidthProfile, index: number): WidthProfile {
  if (profile.points.length <= 2) return profile;
  const points = profile.points.filter((_, i) => i !== index);
  return { points };
}

export function getWidthAtPosition(profile: WidthProfile, t: number): { left: number; right: number } {
  if (profile.points.length === 0) return { left: 1, right: 1 };
  if (t <= profile.points[0].position) return { left: profile.points[0].leftWidth, right: profile.points[0].rightWidth };
  if (t >= profile.points[profile.points.length - 1].position) {
    const last = profile.points[profile.points.length - 1];
    return { left: last.leftWidth, right: last.rightWidth };
  }
  
  for (let i = 0; i < profile.points.length - 1; i++) {
    const a = profile.points[i];
    const b = profile.points[i + 1];
    if (t >= a.position && t <= b.position) {
      const segT = (t - a.position) / (b.position - a.position);
      return {
        left: a.leftWidth + (b.leftWidth - a.leftWidth) * segT,
        right: a.rightWidth + (b.rightWidth - a.rightWidth) * segT,
      };
    }
  }
  
  return { left: 1, right: 1 };
}

// ============================================
// WARP TOOLS — Point displacement fields
// ============================================

export interface WarpToolConfig {
  type: 'warp' | 'twirl' | 'pucker' | 'bloat' | 'scallop' | 'crystallize' | 'wrinkle';
  radius: number;
  intensity: number;
  detail: number; // For procedural tools
}

export const defaultWarpConfig: WarpToolConfig = {
  type: 'warp',
  radius: 50,
  intensity: 0.5,
  detail: 4,
};

/**
 * Apply a warp tool displacement to an entity's path data at a given point.
 * Returns a new entity with modified anchor positions.
 */
export function applyWarpAtPoint(
  entity: DrawableEntity,
  center: Vec2,
  config: WarpToolConfig,
  direction?: Vec2, // For warp tool: the push direction
): DrawableEntity {
  const converted = ensurePathData(entity);
  if (!converted.pathData) return entity;
  
  const pathData = JSON.parse(JSON.stringify(converted.pathData));
  
  for (const contour of pathData.contours) {
    for (const anchor of contour.anchors) {
      const dx = anchor.position.x - center.x;
      const dy = anchor.position.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > config.radius) continue;
      
      // Falloff: smooth bell curve
      const falloff = Math.pow(1 - dist / config.radius, 2);
      const strength = falloff * config.intensity;
      
      switch (config.type) {
        case 'warp': {
          const dir = direction ?? { x: 0, y: 0 };
          anchor.position.x += dir.x * strength * 10;
          anchor.position.y += dir.y * strength * 10;
          if (anchor.handleIn) {
            anchor.handleIn.x += dir.x * strength * 10;
            anchor.handleIn.y += dir.y * strength * 10;
          }
          if (anchor.handleOut) {
            anchor.handleOut.x += dir.x * strength * 10;
            anchor.handleOut.y += dir.y * strength * 10;
          }
          break;
        }
        case 'twirl': {
          const angle = strength * Math.PI * 0.5;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const newX = center.x + dx * cos - dy * sin;
          const newY = center.y + dx * sin + dy * cos;
          anchor.position.x = newX;
          anchor.position.y = newY;
          // Rotate handles too
          if (anchor.handleIn) {
            const hdx = anchor.handleIn.x - center.x;
            const hdy = anchor.handleIn.y - center.y;
            anchor.handleIn.x = center.x + hdx * cos - hdy * sin;
            anchor.handleIn.y = center.y + hdx * sin + hdy * cos;
          }
          if (anchor.handleOut) {
            const hdx = anchor.handleOut.x - center.x;
            const hdy = anchor.handleOut.y - center.y;
            anchor.handleOut.x = center.x + hdx * cos - hdy * sin;
            anchor.handleOut.y = center.y + hdx * sin + hdy * cos;
          }
          break;
        }
        case 'pucker': {
          // Pull points toward center
          anchor.position.x += (center.x - anchor.position.x) * strength * 0.3;
          anchor.position.y += (center.y - anchor.position.y) * strength * 0.3;
          break;
        }
        case 'bloat': {
          // Push points away from center
          if (dist > 0.1) {
            const pushX = (dx / dist) * strength * config.radius * 0.2;
            const pushY = (dy / dist) * strength * config.radius * 0.2;
            anchor.position.x += pushX;
            anchor.position.y += pushY;
          }
          break;
        }
        case 'scallop': {
          // Wavy perturbation
          const waveAngle = Math.atan2(dy, dx) * config.detail;
          const wave = Math.sin(waveAngle) * strength * config.radius * 0.15;
          anchor.position.x += (dx / (dist || 1)) * wave;
          anchor.position.y += (dy / (dist || 1)) * wave;
          break;
        }
        case 'crystallize': {
          // Spike outward
          if (dist > 0.1) {
            const spike = strength * config.radius * 0.3 * (Math.random() * 0.5 + 0.5);
            anchor.position.x += (dx / dist) * spike;
            anchor.position.y += (dy / dist) * spike;
          }
          break;
        }
        case 'wrinkle': {
          // Random displacement
          const wx = (Math.random() - 0.5) * strength * config.radius * 0.3;
          const wy = (Math.random() - 0.5) * strength * config.radius * 0.3;
          anchor.position.x += wx;
          anchor.position.y += wy;
          // Also wrinkle handles for extra detail
          if (anchor.handleIn) {
            anchor.handleIn.x += (Math.random() - 0.5) * strength * config.radius * 0.2;
            anchor.handleIn.y += (Math.random() - 0.5) * strength * config.radius * 0.2;
          }
          if (anchor.handleOut) {
            anchor.handleOut.x += (Math.random() - 0.5) * strength * config.radius * 0.2;
            anchor.handleOut.y += (Math.random() - 0.5) * strength * config.radius * 0.2;
          }
          break;
        }
      }
    }
  }
  
  return { ...converted, pathData };
}

// ============================================
// ENVELOPE DISTORT
// ============================================

export interface EnvelopeMesh {
  rows: number;
  cols: number;
  points: Vec2[][]; // [row][col] grid of control points
}

export function createEnvelopeMesh(bounds: { x: number; y: number; width: number; height: number }, rows: number = 4, cols: number = 4): EnvelopeMesh {
  const points: Vec2[][] = [];
  for (let r = 0; r <= rows; r++) {
    const row: Vec2[] = [];
    for (let c = 0; c <= cols; c++) {
      row.push({
        x: bounds.x + (c / cols) * bounds.width,
        y: bounds.y + (r / rows) * bounds.height,
      });
    }
    points.push(row);
  }
  return { rows, cols, points };
}

export function applyEnvelopeToPoint(mesh: EnvelopeMesh, normalizedX: number, normalizedY: number): Vec2 {
  // Bilinear interpolation on mesh
  const u = Math.max(0, Math.min(1, normalizedX));
  const v = Math.max(0, Math.min(1, normalizedY));
  
  const col = u * mesh.cols;
  const row = v * mesh.rows;
  
  const c0 = Math.floor(col);
  const r0 = Math.floor(row);
  const c1 = Math.min(c0 + 1, mesh.cols);
  const r1 = Math.min(r0 + 1, mesh.rows);
  
  const cu = col - c0;
  const rv = row - r0;
  
  const p00 = mesh.points[r0]?.[c0] ?? { x: 0, y: 0 };
  const p10 = mesh.points[r0]?.[c1] ?? { x: 0, y: 0 };
  const p01 = mesh.points[r1]?.[c0] ?? { x: 0, y: 0 };
  const p11 = mesh.points[r1]?.[c1] ?? { x: 0, y: 0 };
  
  return {
    x: (1 - cu) * (1 - rv) * p00.x + cu * (1 - rv) * p10.x + (1 - cu) * rv * p01.x + cu * rv * p11.x,
    y: (1 - cu) * (1 - rv) * p00.y + cu * (1 - rv) * p10.y + (1 - cu) * rv * p01.y + cu * rv * p11.y,
  };
}

/**
 * Apply envelope distort to an entity by warping all its path points through the mesh.
 */
export function applyEnvelopeDistort(entity: DrawableEntity, mesh: EnvelopeMesh): DrawableEntity {
  const converted = ensurePathData(entity);
  if (!converted.pathData) return entity;
  
  const bounds = getEntityBounds(entity);
  const pathData = JSON.parse(JSON.stringify(converted.pathData));
  
  for (const contour of pathData.contours) {
    for (const anchor of contour.anchors) {
      // Normalize point to 0-1 within bounds
      const nx = (anchor.position.x - bounds.x) / (bounds.width || 1);
      const ny = (anchor.position.y - bounds.y) / (bounds.height || 1);
      
      const warped = applyEnvelopeToPoint(mesh, nx, ny);
      anchor.position.x = warped.x;
      anchor.position.y = warped.y;
      
      // Warp handles too
      if (anchor.handleIn) {
        const hnx = (anchor.handleIn.x - bounds.x) / (bounds.width || 1);
        const hny = (anchor.handleIn.y - bounds.y) / (bounds.height || 1);
        const hw = applyEnvelopeToPoint(mesh, hnx, hny);
        anchor.handleIn.x = hw.x;
        anchor.handleIn.y = hw.y;
      }
      if (anchor.handleOut) {
        const hnx = (anchor.handleOut.x - bounds.x) / (bounds.width || 1);
        const hny = (anchor.handleOut.y - bounds.y) / (bounds.height || 1);
        const hw = applyEnvelopeToPoint(mesh, hnx, hny);
        anchor.handleOut.x = hw.x;
        anchor.handleOut.y = hw.y;
      }
    }
  }
  
  return { ...converted, pathData };
}

// ============================================
// PUPPET WARP — Pin-based deformation
// ============================================

export interface PuppetPin {
  id: string;
  position: Vec2;
  originalPosition: Vec2;
  locked: boolean;
}

export interface PuppetWarpState {
  pins: PuppetPin[];
  meshDensity: number; // triangulation density
}

export function createPuppetPin(position: Vec2): PuppetPin {
  return {
    id: generateId(),
    position: { ...position },
    originalPosition: { ...position },
    locked: false,
  };
}

export function movePuppetPin(state: PuppetWarpState, pinId: string, newPos: Vec2): PuppetWarpState {
  return {
    ...state,
    pins: state.pins.map(p =>
      p.id === pinId ? { ...p, position: { ...newPos } } : p
    ),
  };
}

/**
 * Apply puppet warp deformation to entity paths.
 * Uses inverse distance weighting from each pin to deform points.
 */
export function applyPuppetWarp(entity: DrawableEntity, state: PuppetWarpState): DrawableEntity {
  const converted = ensurePathData(entity);
  if (!converted.pathData || state.pins.length < 2) return entity;
  
  const pathData = JSON.parse(JSON.stringify(converted.pathData));
  
  // Calculate displacement field from pins
  const movedPins = state.pins.filter(p =>
    p.position.x !== p.originalPosition.x || p.position.y !== p.originalPosition.y
  );
  
  if (movedPins.length === 0) return entity;
  
  for (const contour of pathData.contours) {
    for (const anchor of contour.anchors) {
      const displaced = applyPinDisplacement(anchor.position, state.pins);
      anchor.position.x = displaced.x;
      anchor.position.y = displaced.y;
      
      if (anchor.handleIn) {
        const hd = applyPinDisplacement(anchor.handleIn as Vec2, state.pins);
        anchor.handleIn.x = hd.x;
        anchor.handleIn.y = hd.y;
      }
      if (anchor.handleOut) {
        const hd = applyPinDisplacement(anchor.handleOut as Vec2, state.pins);
        anchor.handleOut.x = hd.x;
        anchor.handleOut.y = hd.y;
      }
    }
  }
  
  return { ...converted, pathData };
}

function applyPinDisplacement(point: Vec2, pins: PuppetPin[]): Vec2 {
  let totalWeight = 0;
  let dx = 0, dy = 0;
  
  for (const pin of pins) {
    const dist = Math.sqrt(
      (point.x - pin.originalPosition.x) ** 2 +
      (point.y - pin.originalPosition.y) ** 2
    );
    
    // Inverse distance weighting
    const weight = 1 / Math.pow(Math.max(dist, 1), 2);
    totalWeight += weight;
    
    const pinDx = pin.position.x - pin.originalPosition.x;
    const pinDy = pin.position.y - pin.originalPosition.y;
    
    dx += pinDx * weight;
    dy += pinDy * weight;
  }
  
  if (totalWeight > 0) {
    dx /= totalWeight;
    dy /= totalWeight;
  }
  
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}
