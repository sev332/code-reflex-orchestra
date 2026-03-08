/**
 * Lasso Tool — Integrates Field, Motion, and Temporal engines
 * into a single interaction controller.
 * 
 * Usage:
 *   const lasso = new LassoTool(config);
 *   lasso.loadImage(imageData);
 *   lasso.onPointerDown(x, y, pressure);
 *   lasso.onPointerMove(x, y, pressure);
 *   lasso.onPointerUp();
 *   const mask = lasso.getMask();
 */

import { buildFieldCache, type FieldCache } from './field-engine';
import { stepMotion, initMotionState, type MotionState, type MotionConfig, DEFAULT_MOTION_CONFIG, type Vec2 } from './motion-engine';
import { PathBody, type PathVertex, rasterizeMask, featherMask } from './temporal-engine';

// ============================================
// TOOL MODES
// ============================================

export type LassoMode = 'freeform' | 'field-assisted' | 'polygon';

export interface LassoConfig {
  mode: LassoMode;
  motion: MotionConfig;
  minVertexDist: number;     // min pixel distance between vertices
  featherRadius: number;     // mask feather in px
  smoothIterations: number;  // post-close Chaikin passes
  showField: boolean;        // render field overlay
  showConfidence: boolean;   // render confidence ribbon
}

export const DEFAULT_LASSO_CONFIG: LassoConfig = {
  mode: 'field-assisted',
  motion: DEFAULT_MOTION_CONFIG,
  minVertexDist: 2,
  featherRadius: 0,
  smoothIterations: 1,
  showField: false,
  showConfidence: true,
};

// ============================================
// LASSO TOOL STATE
// ============================================

export type LassoPhase = 'idle' | 'drawing' | 'closed' | 'editing';

export interface LassoSnapshot {
  path: PathBody;
  phase: LassoPhase;
  motionState: MotionState | null;
}

export class LassoTool {
  config: LassoConfig;
  fieldCache: FieldCache | null = null;
  path: PathBody = new PathBody();
  phase: LassoPhase = 'idle';
  motionState: MotionState | null = null;
  imageWidth = 0;
  imageHeight = 0;

  // Callbacks for UI updates
  onPathUpdate?: (vertices: PathVertex[]) => void;
  onPhaseChange?: (phase: LassoPhase) => void;
  onConfidenceUpdate?: (confidence: number) => void;

  constructor(config: Partial<LassoConfig> = {}) {
    this.config = { ...DEFAULT_LASSO_CONFIG, ...config };
  }

  /** Load image and build field cache */
  loadImage(imageData: ImageData) {
    this.imageWidth = imageData.width;
    this.imageHeight = imageData.height;
    this.fieldCache = buildFieldCache(imageData);
    this.reset();
  }

  /** Reset to idle */
  reset() {
    this.path = new PathBody();
    this.phase = 'idle';
    this.motionState = null;
    this.onPhaseChange?.('idle');
  }

  /** Begin drawing */
  onPointerDown(x: number, y: number, pressure: number = 1) {
    if (this.phase === 'closed') {
      this.reset();
    }

    this.phase = 'drawing';
    this.onPhaseChange?.('drawing');

    const cursor: Vec2 = { x, y };
    this.motionState = initMotionState(cursor);

    const vertex: PathVertex = {
      x, y,
      t: performance.now(),
      confidence: 0,
      pressure,
      speed: 0,
    };
    this.path.push(vertex, 0);
    this.onPathUpdate?.(this.path.vertices);
  }

  /** Continue drawing — applies field-assisted motion in that mode */
  onPointerMove(x: number, y: number, pressure: number = 1) {
    if (this.phase !== 'drawing' || !this.motionState) return;

    const cursor: Vec2 = { x, y };
    let finalPos: Vec2;

    if (this.config.mode === 'field-assisted' && this.fieldCache) {
      // Field-assisted: step through motion engine
      this.motionState = stepMotion(this.motionState, cursor, this.fieldCache, this.config.motion);
      finalPos = this.motionState.position;
      this.onConfidenceUpdate?.(this.motionState.confidence);
    } else {
      // Freeform: use raw cursor
      finalPos = cursor;
      this.motionState.cursor = cursor;
      this.motionState.position = cursor;
    }

    const vertex: PathVertex = {
      x: finalPos.x,
      y: finalPos.y,
      t: performance.now(),
      confidence: this.motionState.confidence,
      pressure,
      speed: this.motionState.speed,
    };

    if (this.path.push(vertex, this.config.minVertexDist)) {
      this.onPathUpdate?.(this.path.vertices);
    }
  }

  /** End drawing and close the path */
  onPointerUp() {
    if (this.phase !== 'drawing') return;

    this.path.close();
    if (this.config.smoothIterations > 0) {
      this.path.smooth(this.config.smoothIterations);
    }
    this.phase = 'closed';
    this.onPhaseChange?.('closed');
    this.onPathUpdate?.(this.path.vertices);
  }

  /** Backtrack: rewind path to a given time */
  rewind(toTime: number) {
    if (this.phase !== 'drawing') return;
    this.path.rewindTo(toTime);
    this.onPathUpdate?.(this.path.vertices);
  }

  /** Generate binary mask from closed path */
  getMask(): Uint8Array | null {
    if (!this.path.closed || this.path.length < 3) return null;
    const mask = rasterizeMask(this.path, this.imageWidth, this.imageHeight);
    if (this.config.featherRadius > 0) {
      return featherMask(mask, this.imageWidth, this.imageHeight, this.config.featherRadius);
    }
    return mask;
  }

  /** Get current field cache for visualization */
  getFieldCache(): FieldCache | null {
    return this.fieldCache;
  }

  /** Export path as SVG path data */
  toSVGPath(): string {
    if (this.path.isEmpty) return '';
    const verts = this.path.vertices;
    let d = `M ${verts[0].x.toFixed(1)} ${verts[0].y.toFixed(1)}`;
    for (let i = 1; i < verts.length; i++) {
      d += ` L ${verts[i].x.toFixed(1)} ${verts[i].y.toFixed(1)}`;
    }
    if (this.path.closed) d += ' Z';
    return d;
  }
}
