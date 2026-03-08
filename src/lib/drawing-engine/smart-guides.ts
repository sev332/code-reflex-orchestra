// Smart Guides Engine — Sprint 4: Snapping, alignment hints, rulers, measure tool
// Real-time visual guides that show alignment, spacing, and dimensions

import { DrawableEntity, Vec2, BoundingBox, SnapGuide } from './types';
import { getEntityBounds } from './engine';

// ============================================
// SNAP GUIDE TYPES
// ============================================

export interface SmartGuide {
  type: 'alignment' | 'spacing' | 'dimension' | 'intersection';
  axis: 'horizontal' | 'vertical' | 'both';
  position: number;
  start: Vec2;
  end: Vec2;
  label?: string;
  strength: number; // 0-1, higher = stronger snap
}

export interface SnapResult {
  snappedPoint: Vec2;
  guides: SmartGuide[];
  didSnap: boolean;
}

export interface SmartGuideConfig {
  enabled: boolean;
  snapTolerance: number; // pixels
  showAlignmentGuides: boolean;
  showSpacingGuides: boolean;
  showDimensionLabels: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  snapToArtboard: boolean;
  gridSize: number;
}

export const defaultSmartGuideConfig: SmartGuideConfig = {
  enabled: true,
  snapTolerance: 6,
  showAlignmentGuides: true,
  showSpacingGuides: true,
  showDimensionLabels: true,
  snapToGrid: true,
  snapToObjects: true,
  snapToArtboard: true,
  gridSize: 20,
};

// ============================================
// SNAP CALCULATION
// ============================================

export function calculateSnapGuides(
  movingBounds: BoundingBox,
  otherEntities: DrawableEntity[],
  artboard: { x: number; y: number; width: number; height: number } | null,
  config: SmartGuideConfig,
  zoom: number,
): SnapResult {
  const guides: SmartGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;
  const tolerance = config.snapTolerance / zoom;

  const movingCenterX = movingBounds.x + movingBounds.width / 2;
  const movingCenterY = movingBounds.y + movingBounds.height / 2;
  const movingRight = movingBounds.x + movingBounds.width;
  const movingBottom = movingBounds.y + movingBounds.height;

  // Snap to other objects
  if (config.snapToObjects) {
    for (const entity of otherEntities) {
      const b = getEntityBounds(entity);
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const right = b.x + b.width;
      const bottom = b.y + b.height;

      // Left edge alignment
      if (Math.abs(movingBounds.x - b.x) < tolerance) {
        snapX = b.x;
        guides.push({ type: 'alignment', axis: 'vertical', position: b.x, start: { x: b.x, y: Math.min(movingBounds.y, b.y) }, end: { x: b.x, y: Math.max(movingBottom, bottom) }, strength: 1 });
      }
      // Right edge alignment
      if (Math.abs(movingRight - right) < tolerance) {
        snapX = right - movingBounds.width;
        guides.push({ type: 'alignment', axis: 'vertical', position: right, start: { x: right, y: Math.min(movingBounds.y, b.y) }, end: { x: right, y: Math.max(movingBottom, bottom) }, strength: 1 });
      }
      // Center X alignment
      if (Math.abs(movingCenterX - cx) < tolerance) {
        snapX = cx - movingBounds.width / 2;
        guides.push({ type: 'alignment', axis: 'vertical', position: cx, start: { x: cx, y: Math.min(movingBounds.y, b.y) }, end: { x: cx, y: Math.max(movingBottom, bottom) }, strength: 0.8 });
      }
      // Left-to-right
      if (Math.abs(movingBounds.x - right) < tolerance) {
        snapX = right;
        guides.push({ type: 'alignment', axis: 'vertical', position: right, start: { x: right, y: Math.min(movingBounds.y, b.y) }, end: { x: right, y: Math.max(movingBottom, bottom) }, strength: 0.9 });
      }
      // Right-to-left
      if (Math.abs(movingRight - b.x) < tolerance) {
        snapX = b.x - movingBounds.width;
        guides.push({ type: 'alignment', axis: 'vertical', position: b.x, start: { x: b.x, y: Math.min(movingBounds.y, b.y) }, end: { x: b.x, y: Math.max(movingBottom, bottom) }, strength: 0.9 });
      }

      // Top edge
      if (Math.abs(movingBounds.y - b.y) < tolerance) {
        snapY = b.y;
        guides.push({ type: 'alignment', axis: 'horizontal', position: b.y, start: { x: Math.min(movingBounds.x, b.x), y: b.y }, end: { x: Math.max(movingRight, right), y: b.y }, strength: 1 });
      }
      // Bottom edge
      if (Math.abs(movingBottom - bottom) < tolerance) {
        snapY = bottom - movingBounds.height;
        guides.push({ type: 'alignment', axis: 'horizontal', position: bottom, start: { x: Math.min(movingBounds.x, b.x), y: bottom }, end: { x: Math.max(movingRight, right), y: bottom }, strength: 1 });
      }
      // Center Y
      if (Math.abs(movingCenterY - cy) < tolerance) {
        snapY = cy - movingBounds.height / 2;
        guides.push({ type: 'alignment', axis: 'horizontal', position: cy, start: { x: Math.min(movingBounds.x, b.x), y: cy }, end: { x: Math.max(movingRight, right), y: cy }, strength: 0.8 });
      }
    }
  }

  // Snap to artboard
  if (config.snapToArtboard && artboard) {
    const ab = artboard;
    const abCx = ab.x + ab.width / 2;
    const abCy = ab.y + ab.height / 2;
    const abRight = ab.x + ab.width;
    const abBottom = ab.y + ab.height;

    if (Math.abs(movingBounds.x - ab.x) < tolerance) { snapX = ab.x; guides.push({ type: 'alignment', axis: 'vertical', position: ab.x, start: { x: ab.x, y: ab.y }, end: { x: ab.x, y: abBottom }, strength: 1 }); }
    if (Math.abs(movingRight - abRight) < tolerance) { snapX = abRight - movingBounds.width; guides.push({ type: 'alignment', axis: 'vertical', position: abRight, start: { x: abRight, y: ab.y }, end: { x: abRight, y: abBottom }, strength: 1 }); }
    if (Math.abs(movingCenterX - abCx) < tolerance) { snapX = abCx - movingBounds.width / 2; guides.push({ type: 'alignment', axis: 'vertical', position: abCx, start: { x: abCx, y: ab.y }, end: { x: abCx, y: abBottom }, strength: 0.8, label: 'center' }); }
    if (Math.abs(movingBounds.y - ab.y) < tolerance) { snapY = ab.y; guides.push({ type: 'alignment', axis: 'horizontal', position: ab.y, start: { x: ab.x, y: ab.y }, end: { x: abRight, y: ab.y }, strength: 1 }); }
    if (Math.abs(movingBottom - abBottom) < tolerance) { snapY = abBottom - movingBounds.height; guides.push({ type: 'alignment', axis: 'horizontal', position: abBottom, start: { x: ab.x, y: abBottom }, end: { x: abRight, y: abBottom }, strength: 1 }); }
    if (Math.abs(movingCenterY - abCy) < tolerance) { snapY = abCy - movingBounds.height / 2; guides.push({ type: 'alignment', axis: 'horizontal', position: abCy, start: { x: ab.x, y: abCy }, end: { x: abRight, y: abCy }, strength: 0.8, label: 'center' }); }
  }

  // Snap to grid
  if (config.snapToGrid) {
    const gs = config.gridSize;
    const gridSnapX = Math.round(movingBounds.x / gs) * gs;
    const gridSnapY = Math.round(movingBounds.y / gs) * gs;
    if (snapX === null && Math.abs(movingBounds.x - gridSnapX) < tolerance) snapX = gridSnapX;
    if (snapY === null && Math.abs(movingBounds.y - gridSnapY) < tolerance) snapY = gridSnapY;
  }

  return {
    snappedPoint: {
      x: snapX ?? movingBounds.x,
      y: snapY ?? movingBounds.y,
    },
    guides,
    didSnap: snapX !== null || snapY !== null,
  };
}

// ============================================
// SPACING GUIDES — Equal spacing detection
// ============================================

export function calculateSpacingGuides(
  movingBounds: BoundingBox,
  otherEntities: DrawableEntity[],
  tolerance: number,
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const bounds = otherEntities.map(e => getEntityBounds(e));
  
  // Sort by position for gap analysis
  const hSorted = [...bounds].sort((a, b) => a.x - b.x);
  const vSorted = [...bounds].sort((a, b) => a.y - b.y);
  
  // Check horizontal gaps
  for (let i = 0; i < hSorted.length - 1; i++) {
    const gap = hSorted[i + 1].x - (hSorted[i].x + hSorted[i].width);
    if (gap <= 0) continue;
    
    // Check if moving object has same gap to any neighbor
    const gapToLeft = movingBounds.x - (hSorted[i].x + hSorted[i].width);
    const gapToRight = hSorted[i + 1].x - (movingBounds.x + movingBounds.width);
    
    if (Math.abs(gapToLeft - gap) < tolerance) {
      guides.push({
        type: 'spacing', axis: 'horizontal', position: 0, strength: 0.7,
        start: { x: hSorted[i].x + hSorted[i].width, y: movingBounds.y + movingBounds.height / 2 },
        end: { x: movingBounds.x, y: movingBounds.y + movingBounds.height / 2 },
        label: `${Math.round(gap)}`,
      });
    }
    if (Math.abs(gapToRight - gap) < tolerance) {
      guides.push({
        type: 'spacing', axis: 'horizontal', position: 0, strength: 0.7,
        start: { x: movingBounds.x + movingBounds.width, y: movingBounds.y + movingBounds.height / 2 },
        end: { x: hSorted[i + 1].x, y: movingBounds.y + movingBounds.height / 2 },
        label: `${Math.round(gap)}`,
      });
    }
  }
  
  return guides;
}

// ============================================
// RULER DATA
// ============================================

export interface RulerTick {
  position: number; // in pixels
  worldPosition: number; // in world units
  isMajor: boolean;
  label?: string;
}

export function generateRulerTicks(
  viewportStart: number,
  viewportSize: number,
  zoom: number,
  panOffset: number,
): RulerTick[] {
  const ticks: RulerTick[] = [];
  
  // Determine tick spacing based on zoom
  const baseSpacing = getIdealTickSpacing(zoom);
  const majorSpacing = baseSpacing * 5;
  
  const worldStart = -panOffset;
  const worldEnd = worldStart + viewportSize / zoom;
  
  const startTick = Math.floor(worldStart / baseSpacing) * baseSpacing;
  const endTick = Math.ceil(worldEnd / baseSpacing) * baseSpacing;
  
  for (let w = startTick; w <= endTick; w += baseSpacing) {
    const screenPos = (w + panOffset) * zoom;
    const isMajor = Math.abs(w % majorSpacing) < 0.01;
    ticks.push({
      position: screenPos,
      worldPosition: w,
      isMajor,
      label: isMajor ? `${Math.round(w)}` : undefined,
    });
  }
  
  return ticks;
}

function getIdealTickSpacing(zoom: number): number {
  const pixelSpacing = 10; // minimum pixels between ticks
  const worldSpacing = pixelSpacing / zoom;
  
  // Snap to nice numbers: 1, 2, 5, 10, 20, 50, 100...
  const niceNumbers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  for (const n of niceNumbers) {
    if (n >= worldSpacing) return n;
  }
  return 1000;
}

// ============================================
// MEASURE TOOL
// ============================================

export interface Measurement {
  start: Vec2;
  end: Vec2;
  distance: number;
  angle: number; // degrees
  deltaX: number;
  deltaY: number;
}

export function calculateMeasurement(start: Vec2, end: Vec2): Measurement {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return {
    start,
    end,
    distance: Math.sqrt(dx * dx + dy * dy),
    angle: Math.atan2(dy, dx) * (180 / Math.PI),
    deltaX: dx,
    deltaY: dy,
  };
}

// ============================================
// GUIDE LINES (user-created)
// ============================================

export interface GuideLine {
  id: string;
  axis: 'horizontal' | 'vertical';
  position: number; // world coordinate
  locked: boolean;
  color: string;
}

export function createGuideLine(axis: 'horizontal' | 'vertical', position: number): GuideLine {
  return {
    id: `guide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    axis,
    position,
    locked: false,
    color: 'hsla(193,100%,50%,0.5)',
  };
}

// ============================================
// SMART GUIDE RENDERING
// ============================================

export function renderSmartGuides(
  ctx: CanvasRenderingContext2D,
  guides: SmartGuide[],
  vp: { panX: number; panY: number; zoom: number },
): void {
  ctx.save();
  
  for (const guide of guides) {
    const sx = (guide.start.x + vp.panX) * vp.zoom;
    const sy = (guide.start.y + vp.panY) * vp.zoom;
    const ex = (guide.end.x + vp.panX) * vp.zoom;
    const ey = (guide.end.y + vp.panY) * vp.zoom;
    
    if (guide.type === 'alignment') {
      ctx.strokeStyle = 'hsla(340,100%,55%,0.8)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    } else if (guide.type === 'spacing') {
      ctx.strokeStyle = 'hsla(160,100%,50%,0.7)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      
      // Label
      if (guide.label) {
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        ctx.fillStyle = 'hsla(160,100%,50%,0.9)';
        ctx.font = '9px Inter, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(guide.label, mx, my - 4);
      }
    }
  }
  
  ctx.setLineDash([]);
  ctx.restore();
}

// ============================================
// RULER RENDERING
// ============================================

export function renderRuler(
  ctx: CanvasRenderingContext2D,
  axis: 'horizontal' | 'vertical',
  ticks: RulerTick[],
  size: number, // width for horizontal, height for vertical
  rulerThickness: number,
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = 'hsl(220,27%,8%)';
  if (axis === 'horizontal') {
    ctx.fillRect(0, 0, size, rulerThickness);
  } else {
    ctx.fillRect(0, 0, rulerThickness, size);
  }
  
  // Border
  ctx.strokeStyle = 'hsl(220,15%,15%)';
  ctx.lineWidth = 1;
  if (axis === 'horizontal') {
    ctx.beginPath(); ctx.moveTo(0, rulerThickness); ctx.lineTo(size, rulerThickness); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(rulerThickness, 0); ctx.lineTo(rulerThickness, size); ctx.stroke();
  }
  
  // Ticks
  for (const tick of ticks) {
    if (tick.position < 0 || tick.position > size) continue;
    
    const tickLen = tick.isMajor ? rulerThickness * 0.6 : rulerThickness * 0.3;
    ctx.strokeStyle = tick.isMajor ? 'hsla(193,30%,65%,0.8)' : 'hsla(193,30%,65%,0.3)';
    ctx.lineWidth = tick.isMajor ? 1 : 0.5;
    
    ctx.beginPath();
    if (axis === 'horizontal') {
      ctx.moveTo(tick.position, rulerThickness);
      ctx.lineTo(tick.position, rulerThickness - tickLen);
    } else {
      ctx.moveTo(rulerThickness, tick.position);
      ctx.lineTo(rulerThickness - tickLen, tick.position);
    }
    ctx.stroke();
    
    // Label
    if (tick.label) {
      ctx.fillStyle = 'hsla(193,30%,65%,0.6)';
      ctx.font = '8px Inter, system-ui';
      if (axis === 'horizontal') {
        ctx.textAlign = 'left';
        ctx.fillText(tick.label, tick.position + 2, 9);
      } else {
        ctx.save();
        ctx.translate(9, tick.position + 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText(tick.label, 0, 0);
        ctx.restore();
      }
    }
  }
  
  ctx.restore();
}

// ============================================
// GUIDE LINE RENDERING
// ============================================

export function renderGuideLines(
  ctx: CanvasRenderingContext2D,
  guides: GuideLine[],
  vp: { panX: number; panY: number; zoom: number },
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.save();
  
  for (const guide of guides) {
    ctx.strokeStyle = guide.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    
    ctx.beginPath();
    if (guide.axis === 'horizontal') {
      const y = (guide.position + vp.panY) * vp.zoom;
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    } else {
      const x = (guide.position + vp.panX) * vp.zoom;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
  ctx.restore();
}
