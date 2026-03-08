/**
 * useLassoTool — React hook for the Boundary Instrument lasso
 * Phase 2+3: Adds organic unzip, proximity close, junction/quality state.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { LassoTool, type LassoConfig, type LassoPhase, DEFAULT_LASSO_CONFIG } from './lasso-tool';
import type { PathVertex, BacktrackEvent } from './temporal-engine';
import type { FieldCache } from './field-engine';
import type { Junction, ConfidenceZone, PathQualityReport } from './ambiguity-engine';
import {
  renderLassoPath, renderGradientOverlay, renderMaskOverlay,
  renderProximityCloseIndicator, renderJunctions,
  renderConfidenceZones, renderBacktrackGhost, renderQualityBadge,
} from './field-renderer';

export interface UseLassoToolReturn {
  lassoRef: React.MutableRefObject<LassoTool>;
  phase: LassoPhase;
  vertices: PathVertex[];
  confidence: number;
  fieldCache: FieldCache | null;
  mask: Uint8Array | null;
  // Phase 2+3
  distanceToStart: number;
  junctions: Junction[];
  confidenceZones: ConfidenceZone[];
  qualityReport: PathQualityReport | null;
  lastBacktrack: BacktrackEvent | null;

  loadImage: (canvas: HTMLCanvasElement) => void;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
  resetLasso: () => void;
  generateMask: () => Uint8Array | null;
  renderOverlay: (ctx: CanvasRenderingContext2D) => void;
  setConfig: (config: Partial<LassoConfig>) => void;
}

export function useLassoTool(initialConfig?: Partial<LassoConfig>): UseLassoToolReturn {
  const lassoRef = useRef(new LassoTool(initialConfig));
  const [phase, setPhase] = useState<LassoPhase>('idle');
  const [vertices, setVertices] = useState<PathVertex[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [fieldCache, setFieldCache] = useState<FieldCache | null>(null);
  const [mask, setMask] = useState<Uint8Array | null>(null);
  const [distanceToStart, setDistanceToStart] = useState(Infinity);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [confidenceZones, setConfidenceZones] = useState<ConfidenceZone[]>([]);
  const [qualityReport, setQualityReport] = useState<PathQualityReport | null>(null);
  const [lastBacktrack, setLastBacktrack] = useState<BacktrackEvent | null>(null);

  useEffect(() => {
    const lasso = lassoRef.current;
    lasso.onPhaseChange = (p) => {
      setPhase(p);
      if (p === 'closed') {
        setJunctions(lasso.junctions);
        setConfidenceZones(lasso.confidenceZones);
      }
    };
    lasso.onPathUpdate = (v) => setVertices([...v]);
    lasso.onConfidenceUpdate = setConfidence;
    lasso.onProximityClose = setDistanceToStart;
    lasso.onBacktrack = (evt) => setLastBacktrack(evt);
    lasso.onQualityUpdate = setQualityReport;
  }, []);

  const loadImage = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    lassoRef.current.loadImage(imageData);
    setFieldCache(lassoRef.current.getFieldCache());
    setMask(null);
    setVertices([]);
    setJunctions([]);
    setConfidenceZones([]);
    setQualityReport(null);
    setLastBacktrack(null);
  }, []);

  const getCanvasCoords = useCallback((e: React.PointerEvent): { x: number; y: number; pressure: number } => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvas = e.currentTarget as HTMLCanvasElement;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 1,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const { x, y, pressure } = getCanvasCoords(e);
    lassoRef.current.onPointerDown(x, y, pressure);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const { x, y, pressure } = getCanvasCoords(e);
    lassoRef.current.onPointerMove(x, y, pressure);
  }, [getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    lassoRef.current.onPointerUp();
    const m = lassoRef.current.getMask();
    if (m) setMask(m);
  }, []);

  const resetLasso = useCallback(() => {
    lassoRef.current.reset();
    setMask(null);
    setVertices([]);
    setJunctions([]);
    setConfidenceZones([]);
    setQualityReport(null);
    setLastBacktrack(null);
    setDistanceToStart(Infinity);
  }, []);

  const generateMask = useCallback(() => {
    const m = lassoRef.current.getMask();
    if (m) setMask(m);
    return m;
  }, []);

  const renderOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const lasso = lassoRef.current;

    // Field overlay
    if (lasso.config.showField && lasso.fieldCache) {
      renderGradientOverlay(ctx, lasso.fieldCache, 0.25);
    }

    // Confidence zone highlights (before path)
    if (lasso.config.showConfidenceZones && confidenceZones.length > 0 && vertices.length > 0) {
      renderConfidenceZones(ctx, vertices, confidenceZones);
    }

    // Backtrack ghost trail
    if (lasso.ghostVertices.length > 0) {
      renderBacktrackGhost(ctx, lasso.ghostVertices, lasso.getGhostFade());
    }

    // Path
    if (vertices.length > 0) {
      renderLassoPath(ctx, vertices, lasso.path.closed, lasso.config.showConfidence);
    }

    // Proximity close indicator (while drawing)
    if (lasso.phase === 'drawing' && vertices.length > 10 && lasso.path.firstVertex) {
      renderProximityCloseIndicator(
        ctx,
        lasso.path.firstVertex,
        lasso.distanceToStart,
        lasso.config.proximityCloseThreshold
      );
    }

    // Junction markers (after close)
    if (lasso.config.showJunctions && junctions.length > 0) {
      renderJunctions(ctx, junctions);
    }

    // Mask overlay
    if (mask && lasso.path.closed) {
      renderMaskOverlay(ctx, mask, lasso.imageWidth, lasso.imageHeight);
    }

    // Quality badge
    if (lasso.config.showQuality && qualityReport && lasso.path.closed) {
      const scoreLabel = `${(qualityReport.overallScore * 100).toFixed(0)}% quality · ${qualityReport.junctionCount} junctions`;
      renderQualityBadge(ctx, 8, 8, qualityReport.overallScore, scoreLabel);
    }
  }, [vertices, mask, junctions, confidenceZones, qualityReport]);

  const setConfig = useCallback((config: Partial<LassoConfig>) => {
    lassoRef.current.config = { ...lassoRef.current.config, ...config };
  }, []);

  return {
    lassoRef,
    phase,
    vertices,
    confidence,
    fieldCache,
    mask,
    distanceToStart,
    junctions,
    confidenceZones,
    qualityReport,
    lastBacktrack,
    loadImage,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetLasso,
    generateMask,
    renderOverlay,
    setConfig,
  };
}
