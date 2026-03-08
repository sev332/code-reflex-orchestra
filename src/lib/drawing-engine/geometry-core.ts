// ============================================
// GEOMETRY CORE — Canonical Mathematical Substrate
// Per Part XIII of the Ultimate Drawing Engine doctrine
// ============================================
// Owns: points, anchors, handles, segments, contours, paths, networks
//       curve evaluation, intersection, offsetting, flattening, booleans

import { Vec2 } from './types';

// ============================================
// SEGMENT EVALUATION — Unified interface for all segment types
// ============================================

/** Evaluate a cubic Bézier at parameter t ∈ [0,1] */
export function cubicBezierPoint(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

/** First derivative of cubic Bézier */
export function cubicBezierDerivative(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return {
    x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

/** Second derivative of cubic Bézier */
export function cubicBezierSecondDerivative(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return {
    x: 6 * mt * (p2.x - 2 * p1.x + p0.x) + 6 * t * (p3.x - 2 * p2.x + p1.x),
    y: 6 * mt * (p2.y - 2 * p1.y + p0.y) + 6 * t * (p3.y - 2 * p2.y + p1.y),
  };
}

/** Tangent direction at t (normalized) */
export function cubicBezierTangent(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const d = cubicBezierDerivative(p0, p1, p2, p3, t);
  const len = Math.sqrt(d.x * d.x + d.y * d.y);
  return len > 1e-8 ? { x: d.x / len, y: d.y / len } : { x: 1, y: 0 };
}

/** Normal at t (perpendicular to tangent, left-side) */
export function cubicBezierNormal(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const tan = cubicBezierTangent(p0, p1, p2, p3, t);
  return { x: -tan.y, y: tan.x };
}

/** Curvature at parameter t */
export function cubicBezierCurvature(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): number {
  const d1 = cubicBezierDerivative(p0, p1, p2, p3, t);
  const d2 = cubicBezierSecondDerivative(p0, p1, p2, p3, t);
  const cross = d1.x * d2.y - d1.y * d2.x;
  const speed = Math.pow(d1.x * d1.x + d1.y * d1.y, 1.5);
  return speed > 1e-10 ? cross / speed : 0;
}

/** Evaluate quadratic Bézier at t */
export function quadraticBezierPoint(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

// ============================================
// SUBDIVISION — De Casteljau
// ============================================

export function subdivideCubic(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): [Vec2[], Vec2[]] {
  const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const f = lerp(d, e, t);
  return [
    [p0, a, d, f],
    [f, e, c, p3],
  ];
}

// ============================================
// FLATTENING — Adaptive polyline approximation
// ============================================

/** Flatten a cubic Bézier into polyline points under visual tolerance */
export function flattenCubic(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  tolerance: number = 0.5,
  maxDepth: number = 10,
): Vec2[] {
  const result: Vec2[] = [p0];
  _flattenCubicRecursive(p0, p1, p2, p3, tolerance, maxDepth, 0, result);
  result.push(p3);
  return result;
}

function _flattenCubicRecursive(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  tol: number, maxD: number, depth: number, out: Vec2[],
) {
  // Flatness test: max distance of control points from chord
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const d2 = Math.abs((p1.x - p3.x) * dy - (p1.y - p3.y) * dx);
  const d3 = Math.abs((p2.x - p3.x) * dy - (p2.y - p3.y) * dx);
  const chordLen = Math.sqrt(dx * dx + dy * dy);
  const flatness = chordLen > 1e-10 ? (d2 + d3) / chordLen : d2 + d3;

  if (flatness <= tol || depth >= maxD) {
    return;
  }

  const [left, right] = subdivideCubic(p0, p1, p2, p3, 0.5);
  _flattenCubicRecursive(left[0], left[1], left[2], left[3], tol, maxD, depth + 1, out);
  out.push(left[3]);
  _flattenCubicRecursive(right[0], right[1], right[2], right[3], tol, maxD, depth + 1, out);
}

// ============================================
// ARC-LENGTH — Approximate arc-length parameterization
// ============================================

/** Build a lookup table for arc-length → parameter mapping */
export function buildArcLengthTable(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  steps: number = 64,
): { t: number; len: number }[] {
  const table: { t: number; len: number }[] = [{ t: 0, len: 0 }];
  let totalLen = 0;
  let prev = p0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const pt = cubicBezierPoint(p0, p1, p2, p3, t);
    totalLen += distance(prev, pt);
    table.push({ t, len: totalLen });
    prev = pt;
  }
  return table;
}

/** Get parameter t for a given arc-length fraction [0,1] */
export function arcLengthToT(table: { t: number; len: number }[], fraction: number): number {
  const totalLen = table[table.length - 1].len;
  const target = fraction * totalLen;
  for (let i = 1; i < table.length; i++) {
    if (table[i].len >= target) {
      const prev = table[i - 1];
      const curr = table[i];
      const segLen = curr.len - prev.len;
      const f = segLen > 1e-10 ? (target - prev.len) / segLen : 0;
      return prev.t + (curr.t - prev.t) * f;
    }
  }
  return 1;
}

// ============================================
// BOUNDING — Tight and conservative bounds
// ============================================

export function cubicBezierBounds(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): { min: Vec2; max: Vec2 } {
  // Conservative bounds from control polygon
  const xs = [p0.x, p1.x, p2.x, p3.x];
  const ys = [p0.y, p1.y, p2.y, p3.y];
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

/** Tight bounds by finding extrema via derivative roots */
export function cubicBezierTightBounds(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): { min: Vec2; max: Vec2 } {
  const tValues = [0, 1];
  // Solve derivative = 0 for x and y
  for (const axis of ['x', 'y'] as const) {
    const a = -3 * p0[axis] + 9 * p1[axis] - 9 * p2[axis] + 3 * p3[axis];
    const b = 6 * p0[axis] - 12 * p1[axis] + 6 * p2[axis];
    const c = -3 * p0[axis] + 3 * p1[axis];
    if (Math.abs(a) > 1e-12) {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const sqrtDisc = Math.sqrt(disc);
        const t1 = (-b + sqrtDisc) / (2 * a);
        const t2 = (-b - sqrtDisc) / (2 * a);
        if (t1 > 0 && t1 < 1) tValues.push(t1);
        if (t2 > 0 && t2 < 1) tValues.push(t2);
      }
    } else if (Math.abs(b) > 1e-12) {
      const t = -c / b;
      if (t > 0 && t < 1) tValues.push(t);
    }
  }
  const points = tValues.map(t => cubicBezierPoint(p0, p1, p2, p3, t));
  return {
    min: { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)) },
    max: { x: Math.max(...points.map(p => p.x)), y: Math.max(...points.map(p => p.y)) },
  };
}

// ============================================
// CLOSEST POINT — Newton-Raphson closest point on cubic
// ============================================

export function closestPointOnCubic(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  target: Vec2,
  steps: number = 16,
  iterations: number = 4,
): { t: number; point: Vec2; distance: number } {
  // Coarse search
  let bestT = 0;
  let bestDist = Infinity;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = cubicBezierPoint(p0, p1, p2, p3, t);
    const d = distanceSq(pt, target);
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }

  // Newton-Raphson refinement
  for (let iter = 0; iter < iterations; iter++) {
    const pt = cubicBezierPoint(p0, p1, p2, p3, bestT);
    const d1 = cubicBezierDerivative(p0, p1, p2, p3, bestT);
    const d2 = cubicBezierSecondDerivative(p0, p1, p2, p3, bestT);
    const diff = { x: pt.x - target.x, y: pt.y - target.y };
    const num = diff.x * d1.x + diff.y * d1.y;
    const den = d1.x * d1.x + d1.y * d1.y + diff.x * d2.x + diff.y * d2.y;
    if (Math.abs(den) > 1e-12) {
      bestT = Math.max(0, Math.min(1, bestT - num / den));
    }
  }

  const bestPt = cubicBezierPoint(p0, p1, p2, p3, bestT);
  return { t: bestT, point: bestPt, distance: distance(bestPt, target) };
}

// ============================================
// CURVE FITTING — Fit cubic Bézier to point sequence
// ============================================

/** Fit a series of points with cubic Bézier segments using iterative error reduction */
export function fitCubicBeziers(
  points: Vec2[],
  tolerance: number = 2.0,
): Vec2[][] {
  if (points.length < 2) return [];
  if (points.length === 2) {
    const d = distance(points[0], points[1]) / 3;
    const tan = normalize(sub(points[1], points[0]));
    return [[
      points[0],
      add(points[0], scale(tan, d)),
      sub(points[1], scale(tan, d)),
      points[1],
    ]];
  }

  // Simple chord-length parameterization fitting
  const result: Vec2[][] = [];
  _fitCubicSegment(points, 0, points.length - 1,
    computeLeftTangent(points, 0),
    computeRightTangent(points, points.length - 1),
    tolerance, result);
  return result;
}

function _fitCubicSegment(
  points: Vec2[], first: number, last: number,
  tHat1: Vec2, tHat2: Vec2, error: number,
  result: Vec2[],
) {
  if (last - first === 1) {
    const d = distance(points[first], points[last]) / 3;
    result.push([points[first], add(points[first], scale(tHat1, d)), sub(points[last], scale(tHat2, d)), points[last]]);
    return;
  }

  // Chord-length parameterization
  const u = chordLengthParameterize(points, first, last);
  const bezier = generateBezier(points, first, last, u, tHat1, tHat2);
  const { maxError, splitPoint } = computeMaxError(points, first, last, bezier, u);

  if (maxError < error) {
    result.push(bezier);
    return;
  }

  // Split at point of max error
  const tHatCenter = computeCenterTangent(points, splitPoint);
  _fitCubicSegment(points, first, splitPoint, tHat1, negate(tHatCenter), error, result);
  _fitCubicSegment(points, splitPoint, last, tHatCenter, tHat2, error, result);
}

function chordLengthParameterize(points: Vec2[], first: number, last: number): number[] {
  const u: number[] = [0];
  for (let i = first + 1; i <= last; i++) {
    u.push(u[u.length - 1] + distance(points[i], points[i - 1]));
  }
  const total = u[u.length - 1];
  return total > 0 ? u.map(v => v / total) : u.map((_, i) => i / (u.length - 1));
}

function generateBezier(
  points: Vec2[], first: number, last: number,
  uPrime: number[], tHat1: Vec2, tHat2: Vec2,
): Vec2[] {
  const nPts = last - first + 1;
  const A: Vec2[][] = [];
  for (let i = 0; i < nPts; i++) {
    const u = uPrime[i];
    A.push([
      scale(tHat1, 3 * u * (1 - u) * (1 - u)),
      scale(tHat2, 3 * u * u * (1 - u)),
    ]);
  }

  const C = [[0, 0], [0, 0]];
  const X = [0, 0];
  for (let i = 0; i < nPts; i++) {
    C[0][0] += dot(A[i][0], A[i][0]);
    C[0][1] += dot(A[i][0], A[i][1]);
    C[1][0] = C[0][1];
    C[1][1] += dot(A[i][1], A[i][1]);
    const tmp = sub(points[first + i],
      cubicBezierPoint(points[first], points[first], points[last], points[last], uPrime[i]));
    X[0] += dot(A[i][0], tmp);
    X[1] += dot(A[i][1], tmp);
  }

  const det = C[0][0] * C[1][1] - C[0][1] * C[1][0];
  const alpha1 = det !== 0 ? (C[1][1] * X[0] - C[0][1] * X[1]) / det : 0;
  const alpha2 = det !== 0 ? (C[0][0] * X[1] - C[1][0] * X[0]) / det : 0;

  const segLen = distance(points[first], points[last]);
  const eps = 1e-6 * segLen;

  const p1 = alpha1 < eps ? add(points[first], scale(tHat1, segLen / 3)) : add(points[first], scale(tHat1, alpha1));
  const p2 = alpha2 < eps ? sub(points[last], scale(tHat2, segLen / 3)) : add(points[last], scale(tHat2, alpha2));

  return [points[first], p1, p2, points[last]];
}

function computeMaxError(
  points: Vec2[], first: number, last: number,
  bezier: Vec2[], u: number[],
): { maxError: number; splitPoint: number } {
  let maxDist = 0;
  let splitPoint = Math.floor((last - first + 1) / 2) + first;
  for (let i = 1; i < last - first; i++) {
    const pt = cubicBezierPoint(bezier[0], bezier[1], bezier[2], bezier[3], u[i]);
    const dist = distanceSq(pt, points[first + i]);
    if (dist >= maxDist) {
      maxDist = dist;
      splitPoint = first + i;
    }
  }
  return { maxError: maxDist, splitPoint };
}

function computeLeftTangent(points: Vec2[], index: number): Vec2 {
  return normalize(sub(points[index + 1], points[index]));
}

function computeRightTangent(points: Vec2[], index: number): Vec2 {
  return normalize(sub(points[index - 1], points[index]));
}

function computeCenterTangent(points: Vec2[], index: number): Vec2 {
  const v1 = sub(points[index - 1], points[index]);
  const v2 = sub(points[index], points[index + 1]);
  return normalize(add(v1, v2));
}

// ============================================
// INTERSECTION — Segment-segment intersection framework
// ============================================

export interface IntersectionResult {
  type: 'crossing' | 'tangential' | 'overlap' | 'endpoint';
  point: Vec2;
  t1: number; // parameter on first segment
  t2: number; // parameter on second segment
}

/** Line-line intersection */
export function lineLineIntersection(
  a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2,
): IntersectionResult | null {
  const d1 = sub(a1, a0);
  const d2 = sub(b1, b0);
  const cross = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(cross) < 1e-10) return null; // parallel

  const d = sub(b0, a0);
  const t = (d.x * d2.y - d.y * d2.x) / cross;
  const u = (d.x * d1.y - d.y * d1.x) / cross;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      type: 'crossing',
      point: add(a0, scale(d1, t)),
      t1: t,
      t2: u,
    };
  }
  return null;
}

/** Cubic-cubic approximate intersection via recursive subdivision */
export function cubicCubicIntersections(
  a0: Vec2, a1: Vec2, a2: Vec2, a3: Vec2,
  b0: Vec2, b1: Vec2, b2: Vec2, b3: Vec2,
  tolerance: number = 0.5,
  depth: number = 0,
  maxDepth: number = 8,
): IntersectionResult[] {
  const aBounds = cubicBezierBounds(a0, a1, a2, a3);
  const bBounds = cubicBezierBounds(b0, b1, b2, b3);

  // Quick reject
  if (aBounds.max.x < bBounds.min.x || aBounds.min.x > bBounds.max.x ||
      aBounds.max.y < bBounds.min.y || aBounds.min.y > bBounds.max.y) {
    return [];
  }

  // Check if small enough
  const aSize = Math.max(aBounds.max.x - aBounds.min.x, aBounds.max.y - aBounds.min.y);
  const bSize = Math.max(bBounds.max.x - bBounds.min.x, bBounds.max.y - bBounds.min.y);

  if ((aSize < tolerance && bSize < tolerance) || depth >= maxDepth) {
    const pt = cubicBezierPoint(a0, a1, a2, a3, 0.5);
    return [{ type: 'crossing', point: pt, t1: 0.5, t2: 0.5 }];
  }

  // Subdivide both and check all pairs
  const [aL, aR] = subdivideCubic(a0, a1, a2, a3, 0.5);
  const [bL, bR] = subdivideCubic(b0, b1, b2, b3, 0.5);

  return [
    ...cubicCubicIntersections(aL[0], aL[1], aL[2], aL[3], bL[0], bL[1], bL[2], bL[3], tolerance, depth + 1, maxDepth),
    ...cubicCubicIntersections(aL[0], aL[1], aL[2], aL[3], bR[0], bR[1], bR[2], bR[3], tolerance, depth + 1, maxDepth),
    ...cubicCubicIntersections(aR[0], aR[1], aR[2], aR[3], bL[0], bL[1], bL[2], bL[3], tolerance, depth + 1, maxDepth),
    ...cubicCubicIntersections(aR[0], aR[1], aR[2], aR[3], bR[0], bR[1], bR[2], bR[3], tolerance, depth + 1, maxDepth),
  ];
}

// ============================================
// OFFSETTING — Offset support primitives for Stroke Core
// ============================================

/** Generate offset points for a polyline at given distance */
export function offsetPolyline(points: Vec2[], dist: number, side: 'left' | 'right' = 'left'): Vec2[] {
  if (points.length < 2) return [];
  const sign = side === 'left' ? 1 : -1;
  const result: Vec2[] = [];

  for (let i = 0; i < points.length; i++) {
    let normal: Vec2;
    if (i === 0) {
      const dir = normalize(sub(points[1], points[0]));
      normal = { x: -dir.y * sign, y: dir.x * sign };
    } else if (i === points.length - 1) {
      const dir = normalize(sub(points[i], points[i - 1]));
      normal = { x: -dir.y * sign, y: dir.x * sign };
    } else {
      const d1 = normalize(sub(points[i], points[i - 1]));
      const d2 = normalize(sub(points[i + 1], points[i]));
      const n1: Vec2 = { x: -d1.y * sign, y: d1.x * sign };
      const n2: Vec2 = { x: -d2.y * sign, y: d2.x * sign };
      normal = normalize(add(n1, n2));
      // Miter scaling
      const dotN = dot(normal, n1);
      if (dotN > 0.1) {
        normal = scale(normal, 1 / dotN);
      }
    }
    result.push(add(points[i], scale(normal, dist)));
  }
  return result;
}

/** Generate variable-width offset using per-point widths */
export function variableWidthOffset(
  points: Vec2[],
  widths: number[],
  side: 'left' | 'right',
): Vec2[] {
  if (points.length < 2) return [];
  const sign = side === 'left' ? 1 : -1;
  const result: Vec2[] = [];

  for (let i = 0; i < points.length; i++) {
    const w = (widths[i] ?? widths[widths.length - 1]) / 2;
    let normal: Vec2;
    if (i === 0) {
      const dir = normalize(sub(points[1], points[0]));
      normal = { x: -dir.y * sign, y: dir.x * sign };
    } else if (i === points.length - 1) {
      const dir = normalize(sub(points[i], points[i - 1]));
      normal = { x: -dir.y * sign, y: dir.x * sign };
    } else {
      const d1 = normalize(sub(points[i], points[i - 1]));
      const d2 = normalize(sub(points[i + 1], points[i]));
      normal = normalize(add({ x: -d1.y * sign, y: d1.x * sign }, { x: -d2.y * sign, y: d2.x * sign }));
    }
    result.push(add(points[i], scale(normal, w)));
  }
  return result;
}

// ============================================
// BOOLEAN — Path boolean preparation
// ============================================

export type BooleanOp = 'union' | 'intersection' | 'subtraction' | 'xor';

// Boolean operations are complex; this is the preparation interface
// Full implementation deferred to Phase 2 per doctrine
export function prepareBooleanInput(contourPoints: Vec2[][]): {
  contours: Vec2[][];
  orientations: ('cw' | 'ccw')[];
} {
  return {
    contours: contourPoints,
    orientations: contourPoints.map(c => computeWindingDirection(c)),
  };
}

/** Compute winding direction of a closed polygon */
export function computeWindingDirection(points: Vec2[]): 'cw' | 'ccw' {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    sum += (p1.x - p0.x) * (p1.y + p0.y);
  }
  return sum > 0 ? 'cw' : 'ccw';
}

// ============================================
// POINT-IN-POLYGON — For region extraction and hit testing
// ============================================

export function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].y;
    const yj = polygon[j].y;
    if ((yi > point.y) !== (yj > point.y)) {
      const xIntersect = polygon[j].x + (point.y - yj) / (yi - yj) * (polygon[i].x - polygon[j].x);
      if (point.x < xIntersect) inside = !inside;
    }
  }
  return inside;
}

// ============================================
// VECTOR UTILITIES
// ============================================

export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function cross2D(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return len > 1e-10 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
}

export function negate(v: Vec2): Vec2 {
  return { x: -v.x, y: -v.y };
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}
