// ============================================
// STROKE CORE — Visible Line Realization
// Per Part XV of the Ultimate Drawing Engine doctrine
// ============================================
// Owns: skeleton interpretation, width profiles, pressure curves,
//       tapering, caps/joins, stroke expansion, line correction

import { Vec2 } from './types';
import {
  distance, normalize, sub, add, scale, perpendicular, lerp,
  flattenCubic, cubicBezierPoint, cubicBezierTangent, cubicBezierNormal,
  buildArcLengthTable, arcLengthToT,
  variableWidthOffset, offsetPolyline,
} from './geometry-core';

// ============================================
// WIDTH PROFILE SYSTEM
// ============================================

export type WidthProfileMode = 'uniform' | 'sampled' | 'pressure' | 'procedural' | 'tapered';

export interface WidthProfile {
  mode: WidthProfileMode;
  baseWidth: number;
  /** For sampled/pressure mode: position [0-1] → width multiplier pairs */
  samples: { position: number; multiplier: number }[];
  /** Taper config */
  startTaper: number; // [0-1] fraction of total length for start taper
  endTaper: number;   // [0-1] fraction of total length for end taper
  taperCurve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  minWidth: number;
}

export const defaultWidthProfile: WidthProfile = {
  mode: 'uniform',
  baseWidth: 4,
  samples: [],
  startTaper: 0,
  endTaper: 0,
  taperCurve: 'linear',
  minWidth: 0.5,
};

/** Evaluate width at a normalized position [0,1] along the stroke */
export function evaluateWidth(profile: WidthProfile, position: number, pressure: number = 1): number {
  let width = profile.baseWidth;

  switch (profile.mode) {
    case 'uniform':
      break;
    case 'pressure':
      width *= pressure;
      break;
    case 'sampled': {
      if (profile.samples.length === 0) break;
      // Interpolate between samples
      const sorted = [...profile.samples].sort((a, b) => a.position - b.position);
      if (position <= sorted[0].position) {
        width *= sorted[0].multiplier;
      } else if (position >= sorted[sorted.length - 1].position) {
        width *= sorted[sorted.length - 1].multiplier;
      } else {
        for (let i = 1; i < sorted.length; i++) {
          if (position <= sorted[i].position) {
            const t = (position - sorted[i - 1].position) / (sorted[i].position - sorted[i - 1].position);
            width *= sorted[i - 1].multiplier + (sorted[i].multiplier - sorted[i - 1].multiplier) * t;
            break;
          }
        }
      }
      break;
    }
    case 'tapered':
      width *= pressure;
      break;
    case 'procedural':
      // Sine-wave procedural width for now
      width *= 0.5 + 0.5 * Math.sin(position * Math.PI * 4);
      break;
  }

  // Apply tapering
  if (profile.startTaper > 0 && position < profile.startTaper) {
    const taperT = position / profile.startTaper;
    width *= applyTaperCurve(taperT, profile.taperCurve);
  }
  if (profile.endTaper > 0 && position > (1 - profile.endTaper)) {
    const taperT = (1 - position) / profile.endTaper;
    width *= applyTaperCurve(taperT, profile.taperCurve);
  }

  return Math.max(width, profile.minWidth);
}

function applyTaperCurve(t: number, curve: WidthProfile['taperCurve']): number {
  switch (curve) {
    case 'linear': return t;
    case 'ease-in': return t * t;
    case 'ease-out': return 1 - (1 - t) * (1 - t);
    case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  }
}

// ============================================
// PRESSURE CURVE — Input→Response mapping
// ============================================

export interface PressureCurve {
  gamma: number;    // power curve exponent (1 = linear)
  threshold: number; // minimum pressure to register
  ceiling: number;   // maximum output
  softness: number;  // interpolation softness
}

export const defaultPressureCurve: PressureCurve = {
  gamma: 1.0,
  threshold: 0.05,
  ceiling: 1.0,
  softness: 0.5,
};

export function evaluatePressure(raw: number, curve: PressureCurve): number {
  if (raw < curve.threshold) return 0;
  const normalized = (raw - curve.threshold) / (1 - curve.threshold);
  const curved = Math.pow(Math.max(0, Math.min(1, normalized)), curve.gamma);
  return Math.min(curved, curve.ceiling);
}

// ============================================
// CAP GENERATION
// ============================================

export type CapStyle = 'butt' | 'round' | 'square' | 'tapered';

export function generateCap(
  point: Vec2,
  tangent: Vec2,
  width: number,
  style: CapStyle,
  isStart: boolean,
): Vec2[] {
  const half = width / 2;
  const normal = perpendicular(tangent);
  const dir = isStart ? scale(tangent, -1) : tangent;

  switch (style) {
    case 'butt':
      return [
        add(point, scale(normal, half)),
        add(point, scale(normal, -half)),
      ];
    case 'square': {
      const ext = add(point, scale(dir, half));
      return [
        add(ext, scale(normal, half)),
        add(ext, scale(normal, -half)),
      ];
    }
    case 'round': {
      const segments = 8;
      const pts: Vec2[] = [];
      const startAngle = isStart ? Math.PI / 2 : -Math.PI / 2;
      for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (i / segments) * Math.PI;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        pts.push({
          x: point.x + (normal.x * cos + dir.x * sin) * half,
          y: point.y + (normal.y * cos + dir.y * sin) * half,
        });
      }
      return pts;
    }
    case 'tapered':
      return [add(point, scale(dir, half * 0.3))];
  }
}

// ============================================
// JOIN GENERATION
// ============================================

export type JoinStyle = 'miter' | 'round' | 'bevel';

export function generateJoin(
  point: Vec2,
  prevTangent: Vec2, nextTangent: Vec2,
  width: number,
  style: JoinStyle,
  side: 'left' | 'right',
  miterLimit: number = 4,
): Vec2[] {
  const half = width / 2;
  const sign = side === 'left' ? 1 : -1;
  const n1 = { x: -prevTangent.y * sign, y: prevTangent.x * sign };
  const n2 = { x: -nextTangent.y * sign, y: nextTangent.x * sign };
  const p1 = add(point, scale(n1, half));
  const p2 = add(point, scale(n2, half));

  switch (style) {
    case 'bevel':
      return [p1, p2];
    case 'miter': {
      const dotN = n1.x * n2.x + n1.y * n2.y;
      if (dotN > -0.99 && dotN < 0.99) {
        const miterDir = normalize(add(n1, n2));
        const miterLen = half / Math.max(0.1, (miterDir.x * n1.x + miterDir.y * n1.y));
        if (miterLen / half <= miterLimit) {
          return [add(point, scale(miterDir, miterLen))];
        }
      }
      return [p1, p2]; // fallback to bevel
    }
    case 'round': {
      const pts: Vec2[] = [];
      const angle1 = Math.atan2(n1.y, n1.x);
      let angle2 = Math.atan2(n2.y, n2.x);
      let diff = angle2 - angle1;
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      const steps = Math.max(2, Math.ceil(Math.abs(diff) * 4));
      for (let i = 0; i <= steps; i++) {
        const a = angle1 + (i / steps) * diff;
        pts.push(add(point, { x: Math.cos(a) * half, y: Math.sin(a) * half }));
      }
      return pts;
    }
  }
}

// ============================================
// STROKE EXPANSION PIPELINE
// Per doctrine: skeleton → parameterize → width → caps/joins → boundary
// ============================================

export interface StrokeExpansionInput {
  skeletonPoints: Vec2[];
  pressures?: number[];
  widthProfile: WidthProfile;
  pressureCurve: PressureCurve;
  capStyle: CapStyle;
  joinStyle: JoinStyle;
}

export interface StrokeExpansionResult {
  leftOutline: Vec2[];
  rightOutline: Vec2[];
  startCap: Vec2[];
  endCap: Vec2[];
  /** Full closed boundary path for rendering */
  boundary: Vec2[];
}

export function expandStroke(input: StrokeExpansionInput): StrokeExpansionResult {
  const { skeletonPoints, pressures, widthProfile, pressureCurve, capStyle, joinStyle } = input;
  const n = skeletonPoints.length;
  if (n < 2) {
    return { leftOutline: [], rightOutline: [], startCap: [], endCap: [], boundary: [] };
  }

  // Compute per-point widths
  const totalLen = computePolylineLength(skeletonPoints);
  const widths: number[] = [];
  let cumLen = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) cumLen += distance(skeletonPoints[i - 1], skeletonPoints[i]);
    const pos = totalLen > 0 ? cumLen / totalLen : 0;
    const pressure = pressures ? evaluatePressure(pressures[i], pressureCurve) : 1;
    widths.push(evaluateWidth(widthProfile, pos, pressure));
  }

  // Generate outlines
  const leftOutline = variableWidthOffset(skeletonPoints, widths, 'left');
  const rightOutline = variableWidthOffset(skeletonPoints, widths, 'right');

  // Generate caps
  const startTan = normalize(sub(skeletonPoints[1], skeletonPoints[0]));
  const endTan = normalize(sub(skeletonPoints[n - 1], skeletonPoints[n - 2]));
  const startCap = generateCap(skeletonPoints[0], startTan, widths[0], capStyle, true);
  const endCap = generateCap(skeletonPoints[n - 1], endTan, widths[n - 1], capStyle, false);

  // Assemble closed boundary
  const boundary = [
    ...leftOutline,
    ...endCap,
    ...[...rightOutline].reverse(),
    ...startCap,
  ];

  return { leftOutline, rightOutline, startCap, endCap, boundary };
}

function computePolylineLength(points: Vec2[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

// ============================================
// LINE CORRECTION — Post-draw refinement
// ============================================

/** Smooth a polyline using Chaikin's corner cutting */
export function smoothPolyline(points: Vec2[], iterations: number = 2): Vec2[] {
  let current = points;
  for (let iter = 0; iter < iterations; iter++) {
    if (current.length < 3) break;
    const next: Vec2[] = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      next.push(lerp(current[i], current[i + 1], 0.25));
      next.push(lerp(current[i], current[i + 1], 0.75));
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

/** Simplify a polyline using Ramer-Douglas-Peucker algorithm */
export function simplifyPolyline(points: Vec2[], epsilon: number = 1.0): Vec2[] {
  if (points.length <= 2) return [...points];

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToLineDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolyline(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPolyline(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function pointToLineDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

// ============================================
// VARIABLE WIDTH EDITING
// ============================================

export interface WidthHandle {
  id: string;
  position: number; // [0,1] along stroke
  width: number;
}

export function widthHandlesToProfile(handles: WidthHandle[], baseWidth: number): WidthProfile {
  return {
    mode: 'sampled',
    baseWidth,
    samples: handles.map(h => ({ position: h.position, multiplier: h.width / baseWidth })),
    startTaper: 0,
    endTaper: 0,
    taperCurve: 'linear',
    minWidth: 0.5,
  };
}
