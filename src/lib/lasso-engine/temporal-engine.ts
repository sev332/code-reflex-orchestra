/**
 * Temporal Engine — Boundary Instrument Thesis §8-9
 * 
 * Phase 2: Full temporal sophistication
 * - Time-indexed path vertices with confidence metadata
 * - Floating tail (organic unzip backtracking)
 * - Proximity close detection (auto-close when near start)
 * - Path smoothing (Chaikin subdivision)
 * - Curvature analysis for junction detection
 * - Mask rasterizer (scanline fill from closed path)
 * - Feathered mask (distance-based blur)
 */

import type { Vec2 } from './motion-engine';

// ============================================
// PATH VERTEX
// ============================================

export interface PathVertex {
  x: number;
  y: number;
  t: number;           // timestamp (ms)
  confidence: number;  // field confidence at this point [0,1]
  pressure: number;    // stylus pressure [0,1] (1.0 for mouse)
  speed: number;       // cursor speed at this sample
  curvature?: number;  // local curvature (set during analysis)
}

// ============================================
// BACKTRACK EVENT (for UI feedback)
// ============================================

export interface BacktrackEvent {
  removedCount: number;
  rewindTime: number;
  tailPosition: Vec2 | null;
}

// ============================================
// PATH BODY
// ============================================

export class PathBody {
  vertices: PathVertex[] = [];
  closed = false;
  private _backtrackLog: BacktrackEvent[] = [];

  get length() { return this.vertices.length; }
  get isEmpty() { return this.vertices.length === 0; }
  get lastVertex() { return this.vertices[this.vertices.length - 1] ?? null; }
  get firstVertex() { return this.vertices[0] ?? null; }
  get backtrackLog() { return this._backtrackLog; }

  /** Add a new vertex with minimum distance gating */
  push(v: PathVertex, minDist: number = 2): boolean {
    if (this.vertices.length > 0) {
      const last = this.lastVertex!;
      const dx = v.x - last.x;
      const dy = v.y - last.y;
      if (dx * dx + dy * dy < minDist * minDist) return false;
    }
    this.vertices.push(v);
    return true;
  }

  /** Floating tail: remove vertices newer than time t (backtrack) */
  rewindTo(t: number): BacktrackEvent {
    const before = this.vertices.length;
    this.vertices = this.vertices.filter(v => v.t <= t);
    const removed = before - this.vertices.length;
    const evt: BacktrackEvent = {
      removedCount: removed,
      rewindTime: t,
      tailPosition: this.lastVertex ? { x: this.lastVertex.x, y: this.lastVertex.y } : null,
    };
    this._backtrackLog.push(evt);
    return evt;
  }

  /** 
   * Organic unzip — remove tail vertices when cursor backtracks
   * over previous path within a proximity threshold.
   * Returns number of vertices removed.
   */
  organicUnzip(cursor: Vec2, proximityThreshold: number = 8): BacktrackEvent {
    if (this.vertices.length < 3) {
      return { removedCount: 0, rewindTime: 0, tailPosition: null };
    }

    // Walk backward from tail, find the deepest vertex the cursor is close to
    let deepestMatch = -1;
    const threshSq = proximityThreshold * proximityThreshold;

    // Start from second-to-last and work backward (skip last few to avoid jitter)
    const startIdx = Math.max(0, this.vertices.length - 3);
    for (let i = startIdx; i >= 0; i--) {
      const v = this.vertices[i];
      const dx = cursor.x - v.x;
      const dy = cursor.y - v.y;
      if (dx * dx + dy * dy < threshSq) {
        deepestMatch = i;
        break; // take the deepest (earliest) match
      }
    }

    if (deepestMatch >= 0 && deepestMatch < this.vertices.length - 2) {
      const removedCount = this.vertices.length - deepestMatch - 1;
      const rewindTime = this.vertices[deepestMatch].t;
      this.vertices = this.vertices.slice(0, deepestMatch + 1);
      const evt: BacktrackEvent = {
        removedCount,
        rewindTime,
        tailPosition: this.lastVertex ? { x: this.lastVertex.x, y: this.lastVertex.y } : null,
      };
      this._backtrackLog.push(evt);
      return evt;
    }

    return { removedCount: 0, rewindTime: 0, tailPosition: null };
  }

  /** Check if cursor is near the start point (for proximity close) */
  isNearStart(cursor: Vec2, threshold: number = 12): boolean {
    if (this.vertices.length < 10 || !this.firstVertex) return false;
    const dx = cursor.x - this.firstVertex.x;
    const dy = cursor.y - this.firstVertex.y;
    return dx * dx + dy * dy < threshold * threshold;
  }

  /** Distance from cursor to start point */
  distanceToStart(cursor: Vec2): number {
    if (!this.firstVertex) return Infinity;
    const dx = cursor.x - this.firstVertex.x;
    const dy = cursor.y - this.firstVertex.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Remove the last N vertices */
  popLast(n: number = 1): PathVertex[] {
    return this.vertices.splice(-n, n);
  }

  /** Close the path (connect last to first) */
  close() {
    this.closed = true;
  }

  /** Get path as flat coordinate pairs for rendering */
  toCoords(): number[] {
    const coords: number[] = [];
    for (const v of this.vertices) {
      coords.push(v.x, v.y);
    }
    return coords;
  }

  /** Compute total path length in pixels */
  pathLength(): number {
    let len = 0;
    for (let i = 1; i < this.vertices.length; i++) {
      const a = this.vertices[i - 1];
      const b = this.vertices[i];
      len += Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    }
    return len;
  }

  /** Compute average confidence across the path */
  averageConfidence(): number {
    if (this.vertices.length === 0) return 0;
    let sum = 0;
    for (const v of this.vertices) sum += v.confidence;
    return sum / this.vertices.length;
  }

  /** Find low-confidence zones (potential junctions / ambiguities) */
  findLowConfidenceZones(threshold: number = 0.3, minRunLength: number = 3): { start: number; end: number; avgConf: number }[] {
    const zones: { start: number; end: number; avgConf: number }[] = [];
    let runStart = -1;
    let runSum = 0;

    for (let i = 0; i < this.vertices.length; i++) {
      if (this.vertices[i].confidence < threshold) {
        if (runStart < 0) { runStart = i; runSum = 0; }
        runSum += this.vertices[i].confidence;
      } else if (runStart >= 0) {
        const runLen = i - runStart;
        if (runLen >= minRunLength) {
          zones.push({ start: runStart, end: i - 1, avgConf: runSum / runLen });
        }
        runStart = -1;
      }
    }

    if (runStart >= 0) {
      const runLen = this.vertices.length - runStart;
      if (runLen >= minRunLength) {
        zones.push({ start: runStart, end: this.vertices.length - 1, avgConf: runSum / runLen });
      }
    }

    return zones;
  }

  /** Compute curvature at each vertex (discrete curvature via Menger) */
  computeCurvature(): void {
    for (let i = 0; i < this.vertices.length; i++) {
      if (i === 0 || i === this.vertices.length - 1) {
        this.vertices[i].curvature = 0;
        continue;
      }
      const a = this.vertices[i - 1];
      const b = this.vertices[i];
      const c = this.vertices[i + 1];

      // Menger curvature = 2 * area(triangle) / (|ab| * |bc| * |ca|)
      const area2 = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));
      const ab = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
      const bc = Math.sqrt((c.x - b.x) ** 2 + (c.y - b.y) ** 2);
      const ca = Math.sqrt((a.x - c.x) ** 2 + (a.y - c.y) ** 2);
      const denom = ab * bc * ca;
      this.vertices[i].curvature = denom > 1e-6 ? area2 / denom : 0;
    }
  }

  /** Find sharp corners (high curvature points) */
  findCorners(curvatureThreshold: number = 0.15): number[] {
    this.computeCurvature();
    const corners: number[] = [];
    for (let i = 1; i < this.vertices.length - 1; i++) {
      const k = this.vertices[i].curvature ?? 0;
      if (k > curvatureThreshold) {
        // Local maximum check
        const kPrev = this.vertices[i - 1].curvature ?? 0;
        const kNext = this.vertices[i + 1].curvature ?? 0;
        if (k >= kPrev && k >= kNext) {
          corners.push(i);
        }
      }
    }
    return corners;
  }

  /** Chaikin subdivision smoothing (1 iteration) */
  smooth(iterations: number = 1): void {
    for (let iter = 0; iter < iterations; iter++) {
      if (this.vertices.length < 3) return;
      const smoothed: PathVertex[] = [this.vertices[0]];

      for (let i = 0; i < this.vertices.length - 1; i++) {
        const a = this.vertices[i];
        const b = this.vertices[i + 1];
        smoothed.push({
          x: a.x * 0.75 + b.x * 0.25,
          y: a.y * 0.75 + b.y * 0.25,
          t: a.t * 0.75 + b.t * 0.25,
          confidence: (a.confidence + b.confidence) / 2,
          pressure: (a.pressure + b.pressure) / 2,
          speed: (a.speed + b.speed) / 2,
        });
        smoothed.push({
          x: a.x * 0.25 + b.x * 0.75,
          y: a.y * 0.25 + b.y * 0.75,
          t: a.t * 0.25 + b.t * 0.75,
          confidence: (a.confidence + b.confidence) / 2,
          pressure: (a.pressure + b.pressure) / 2,
          speed: (a.speed + b.speed) / 2,
        });
      }

      smoothed.push(this.vertices[this.vertices.length - 1]);
      this.vertices = smoothed;
    }
  }

  /** Selective smooth — only smooth vertices in low-confidence zones */
  selectiveSmooth(confThreshold: number = 0.4): void {
    if (this.vertices.length < 5) return;
    const result: PathVertex[] = [this.vertices[0]];

    for (let i = 1; i < this.vertices.length - 1; i++) {
      const v = this.vertices[i];
      if (v.confidence < confThreshold) {
        // Smooth this vertex by averaging with neighbors
        const prev = this.vertices[i - 1];
        const next = this.vertices[i + 1];
        result.push({
          ...v,
          x: prev.x * 0.25 + v.x * 0.5 + next.x * 0.25,
          y: prev.y * 0.25 + v.y * 0.5 + next.y * 0.25,
        });
      } else {
        result.push(v);
      }
    }

    result.push(this.vertices[this.vertices.length - 1]);
    this.vertices = result;
  }

  /** Clone the path body */
  clone(): PathBody {
    const pb = new PathBody();
    pb.vertices = this.vertices.map(v => ({ ...v }));
    pb.closed = this.closed;
    return pb;
  }
}

// ============================================
// MASK RASTERIZER (scanline fill)
// ============================================

export function rasterizeMask(
  path: PathBody,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  if (path.length < 3 || !path.closed) return mask;

  const verts = path.vertices;
  const n = verts.length;

  // Scanline fill
  for (let y = 0; y < height; y++) {
    const intersections: number[] = [];

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const yi = verts[i].y;
      const yj = verts[j].y;

      if ((yi <= y && yj > y) || (yj <= y && yi > y)) {
        const t = (y - yi) / (yj - yi);
        intersections.push(verts[i].x + t * (verts[j].x - verts[i].x));
      }
    }

    intersections.sort((a, b) => a - b);

    for (let k = 0; k < intersections.length - 1; k += 2) {
      const x0 = Math.max(0, Math.ceil(intersections[k]));
      const x1 = Math.min(width - 1, Math.floor(intersections[k + 1]));
      for (let x = x0; x <= x1; x++) {
        mask[y * width + x] = 255;
      }
    }
  }

  return mask;
}

// ============================================
// FEATHERED MASK (distance-based blur)
// ============================================

export function featherMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  if (radius <= 0) return mask;

  const result = new Uint8Array(width * height);
  const r = Math.ceil(radius);
  const area = (2 * r + 1) * (2 * r + 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const sy = Math.max(0, Math.min(height - 1, y + dy));
          const sx = Math.max(0, Math.min(width - 1, x + dx));
          sum += mask[sy * width + sx];
        }
      }
      result[y * width + x] = Math.round(sum / area);
    }
  }

  return result;
}
