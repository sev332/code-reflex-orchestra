/**
 * useLassoTool — React hook for the Boundary Instrument lasso
 * Manages lifecycle: image loading, pointer events, rendering, mask output.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { LassoTool, type LassoConfig, type LassoPhase, DEFAULT_LASSO_CONFIG } from './lasso-tool';
import type { PathVertex } from './temporal-engine';
import type { FieldCache } from './field-engine';
import { renderLassoPath, renderGradientOverlay, renderMaskOverlay } from './field-renderer';

export interface UseLassoToolReturn {
  lassoRef: React.MutableRefObject<LassoTool>;
  phase: LassoPhase;
  vertices: PathVertex[];
  confidence: number;
  fieldCache: FieldCache | null;
  mask: Uint8Array | null;

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

  useEffect(() => {
    const lasso = lassoRef.current;
    lasso.onPhaseChange = setPhase;
    lasso.onPathUpdate = (v) => setVertices([...v]);
    lasso.onConfidenceUpdate = setConfidence;
  }, []);

  const loadImage = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    lassoRef.current.loadImage(imageData);
    setFieldCache(lassoRef.current.getFieldCache());
    setMask(null);
    setVertices([]);
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
  }, []);

  const generateMask = useCallback(() => {
    const m = lassoRef.current.getMask();
    if (m) setMask(m);
    return m;
  }, []);

  const renderOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const lasso = lassoRef.current;

    // Field overlay (if enabled)
    if (lasso.config.showField && lasso.fieldCache) {
      renderGradientOverlay(ctx, lasso.fieldCache, 0.25);
    }

    // Path
    if (vertices.length > 0) {
      renderLassoPath(ctx, vertices, lasso.path.closed, lasso.config.showConfidence);
    }

    // Mask overlay
    if (mask && lasso.path.closed) {
      renderMaskOverlay(ctx, mask, lasso.imageWidth, lasso.imageHeight);
    }
  }, [vertices, mask]);

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
