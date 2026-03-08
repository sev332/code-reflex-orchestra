/**
 * Lasso Tool — Integrates Field, Motion, Temporal, and Ambiguity engines
 * into a single interaction controller.
 * 
 * Phase 2+3: Adds organic unzip backtracking, proximity close,
 * junction detection, path quality scoring.
 */

import { buildFieldCache, type FieldCache } from './field-engine';
import { stepMotion, initMotionState, type MotionState, type MotionConfig, DEFAULT_MOTION_CONFIG, type Vec2 } from './motion-engine';
import { PathBody, type PathVertex, type BacktrackEvent, rasterizeMask, featherMask } from './temporal-engine';
import { detectJunctions, mapConfidenceZones, scorePathQuality, type Junction, type ConfidenceZone, type PathQualityReport } from './ambiguity-engine';

// ============================================
// TOOL MODES
// ============================================

export type LassoMode = 'freeform' | 'field-assisted' | 'polygon';

export interface LassoConfig {
  mode: LassoMode;
  motion: MotionConfig;
  minVertexDist: number;
  featherRadius: number;
  smoothIterations: number;
  showField: boolean;
  showConfidence: boolean;
  // Phase 2+3 additions
  enableOrganicUnzip: boolean;
  unzipProximity: number;        // px threshold for backtrack detection
  proximityCloseThreshold: number; // px to auto-close
  showJunctions: boolean;
  showQuality: boolean;
  showConfidenceZones: boolean;
  autoSelectiveSmooth: boolean;  // smooth low-confidence zones on close
}

export const DEFAULT_LASSO_CONFIG: LassoConfig = {
  mode: 'field-assisted',
  motion: DEFAULT_MOTION_CONFIG,
  minVertexDist: 2,
  featherRadius: 0,
  smoothIterations: 1,
  showField: false,
  showConfidence: true,
  enableOrganicUnzip: true,
  unzipProximity: 10,
  proximityCloseThreshold: 14,
  showJunctions: true,
  showQuality: true,
  showConfidenceZones: true,
  autoSelectiveSmooth: true,
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

  // Phase 2+3 state
  ghostVertices: PathVertex[] = [];     // recently removed vertices (for ghost trail)
  ghostFadeStart: number = 0;           // timestamp when ghost started fading
  distanceToStart: number = Infinity;   // live distance to start point
  junctions: Junction[] = [];
  confidenceZones: ConfidenceZone[] = [];
  qualityReport: PathQualityReport | null = null;
  lastBacktrackEvent: BacktrackEvent | null = null;

  // Callbacks
  onPathUpdate?: (vertices: PathVertex[]) => void;
  onPhaseChange?: (phase: LassoPhase) => void;
  onConfidenceUpdate?: (confidence: number) => void;
  onBacktrack?: (event: BacktrackEvent) => void;
  onProximityClose?: (distance: number) => void;
  onQualityUpdate?: (report: PathQualityReport) => void;

  constructor(config: Partial<LassoConfig> = {}) {
    this.config = { ...DEFAULT_LASSO_CONFIG, ...config };
  }

  loadImage(imageData: ImageData) {
    this.imageWidth = imageData.width;
    this.imageHeight = imageData.height;
    this.fieldCache = buildFieldCache(imageData);
    this.reset();
  }

  reset() {
    this.path = new PathBody();
    this.phase = 'idle';
    this.motionState = null;
    this.ghostVertices = [];
    this.ghostFadeStart = 0;
    this.distanceToStart = Infinity;
    this.junctions = [];
    this.confidenceZones = [];
    this.qualityReport = null;
    this.lastBacktrackEvent = null;
    this.onPhaseChange?.('idle');
  }

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

  onPointerMove(x: number, y: number, pressure: number = 1) {
    if (this.phase !== 'drawing' || !this.motionState) return;

    const cursor: Vec2 = { x, y };
    let finalPos: Vec2;

    // Check for organic unzip (backtracking)
    if (this.config.enableOrganicUnzip && this.path.length > 5) {
      const unzipResult = this.path.organicUnzip(cursor, this.config.unzipProximity);
      if (unzipResult.removedCount > 0) {
        this.lastBacktrackEvent = unzipResult;
        this.ghostVertices = []; // could store removed verts for ghost trail
        this.ghostFadeStart = performance.now();
        this.onBacktrack?.(unzipResult);
        this.onPathUpdate?.(this.path.vertices);

        // Reset motion state to path tail
        if (this.path.lastVertex) {
          this.motionState = initMotionState({ x: this.path.lastVertex.x, y: this.path.lastVertex.y });
          this.motionState.cursor = cursor;
        }
        return;
      }
    }

    if (this.config.mode === 'field-assisted' && this.fieldCache) {
      this.motionState = stepMotion(this.motionState, cursor, this.fieldCache, this.config.motion);
      finalPos = this.motionState.position;
      this.onConfidenceUpdate?.(this.motionState.confidence);
    } else {
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

    // Proximity close detection
    this.distanceToStart = this.path.distanceToStart(finalPos);
    this.onProximityClose?.(this.distanceToStart);

    // Auto-close if near start
    if (this.path.isNearStart(finalPos, this.config.proximityCloseThreshold)) {
      this.onPointerUp();
    }
  }

  onPointerUp() {
    if (this.phase !== 'drawing') return;

    this.path.close();

    // Auto selective smooth for low-confidence zones
    if (this.config.autoSelectiveSmooth) {
      this.path.selectiveSmooth(0.35);
    }

    if (this.config.smoothIterations > 0) {
      this.path.smooth(this.config.smoothIterations);
    }

    this.phase = 'closed';
    this.onPhaseChange?.('closed');
    this.onPathUpdate?.(this.path.vertices);

    // Run ambiguity analysis
    this.junctions = detectJunctions(this.path, this.fieldCache);
    this.confidenceZones = mapConfidenceZones(this.path);
    this.qualityReport = scorePathQuality(this.path, this.fieldCache);
    this.onQualityUpdate?.(this.qualityReport);
  }

  rewind(toTime: number) {
    if (this.phase !== 'drawing') return;
    this.path.rewindTo(toTime);
    this.onPathUpdate?.(this.path.vertices);
  }

  getMask(): Uint8Array | null {
    if (!this.path.closed || this.path.length < 3) return null;
    const mask = rasterizeMask(this.path, this.imageWidth, this.imageHeight);
    if (this.config.featherRadius > 0) {
      return featherMask(mask, this.imageWidth, this.imageHeight, this.config.featherRadius);
    }
    return mask;
  }

  getFieldCache(): FieldCache | null {
    return this.fieldCache;
  }

  /** Ghost trail fade progress [0,1] */
  getGhostFade(): number {
    if (this.ghostFadeStart === 0) return 1;
    return Math.min(1, (performance.now() - this.ghostFadeStart) / 800);
  }

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
