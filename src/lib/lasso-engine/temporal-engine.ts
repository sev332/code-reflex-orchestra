/**
 * Temporal Engine + Path Body — Boundary Instrument Thesis §8-9
 * 
 * - Time-indexed path vertices with confidence metadata
 * - Floating tail (backtrack by reversing chronology)
 * - Path smoothing (Chaikin subdivision)
 * - Mask rasterizer (scanline fill from closed path)
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
}

// ============================================
// PATH BODY
// ============================================

export class PathBody {
  vertices: PathVertex[] = [];
  closed = false;

  get length() { return this.vertices.length; }
  get isEmpty() { return this.vertices.length === 0; }
  get lastVertex() { return this.vertices[this.vertices.length - 1] ?? null; }

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
  rewindTo(t: number): number {
    const before = this.vertices.length;
    this.vertices = this.vertices.filter(v => v.t <= t);
    return before - this.vertices.length;
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
    // Find all x-intersections with polygon edges
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

    // Fill between pairs
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

  // Simple box blur approximation for feathering
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
