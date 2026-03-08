// Drawing Engine — Canvas2D Renderer with LIVE PREVIEW + Text Rendering
import { DrawableEntity, ViewportState, Scene, Vec2 } from './types';
import { expandStroke, defaultWidthProfile, defaultPressureCurve } from './stroke-core';
import { distance as geoDist } from './geometry-core';
import { renderTextEntity } from './text-engine';

// ============================================
// GRID RENDERER
// ============================================

export function renderGrid(
  ctx: CanvasRenderingContext2D, viewport: ViewportState,
  cw: number, ch: number, gridSize: number,
) {
  const { panX, panY, zoom } = viewport;
  const sg = gridSize * zoom;
  if (sg < 4) return;
  const ox = (panX * zoom) % sg;
  const oy = (panY * zoom) % sg;
  ctx.save();
  ctx.strokeStyle = 'hsla(220,20%,18%,0.5)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = ox; x < cw; x += sg) { ctx.moveTo(x, 0); ctx.lineTo(x, ch); }
  for (let y = oy; y < ch; y += sg) { ctx.moveTo(0, y); ctx.lineTo(cw, y); }
  ctx.stroke();
  const mg = sg * 5;
  if (mg >= 20) {
    ctx.strokeStyle = 'hsla(220,20%,22%,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mox = (panX * zoom) % mg, moy = (panY * zoom) % mg;
    for (let x = mox; x < cw; x += mg) { ctx.moveTo(x, 0); ctx.lineTo(x, ch); }
    for (let y = moy; y < ch; y += mg) { ctx.moveTo(0, y); ctx.lineTo(cw, y); }
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================
// ARTBOARD RENDERER
// ============================================

export function renderArtboard(
  ctx: CanvasRenderingContext2D, vp: ViewportState,
  x: number, y: number, w: number, h: number, bg: string, name: string,
) {
  const sx = (x + vp.panX) * vp.zoom, sy = (y + vp.panY) * vp.zoom;
  const sw = w * vp.zoom, sh = h * vp.zoom;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20 * vp.zoom;
  ctx.fillStyle = bg;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'hsla(220,15%,25%,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, sy, sw, sh);
  ctx.fillStyle = 'hsla(193,30%,65%,0.7)';
  ctx.font = `${11 * Math.min(vp.zoom, 1.5)}px Inter, system-ui`;
  ctx.fillText(name, sx, sy - 8 * vp.zoom);
  ctx.restore();
}

// ============================================
// ENTITY RENDERER — shapes & brush strokes
// ============================================

export function renderEntity(
  ctx: CanvasRenderingContext2D, entity: DrawableEntity,
  vp: ViewportState, isSelected: boolean, isHovered: boolean,
) {
  if (!entity.visible) return;
  const t = entity.transform;
  ctx.save();
  ctx.globalAlpha = entity.blend.opacity;
  const wx = (t.translateX + vp.panX) * vp.zoom;
  const wy = (t.translateY + vp.panY) * vp.zoom;

  if (entity.type === 'shape') renderShape(ctx, entity, wx, wy, vp.zoom);
  else if (entity.type === 'brush-stroke') renderBrushStroke(ctx, entity, vp);
  else if (entity.type === 'text') { renderTextEntity(ctx, entity, vp, isSelected, isHovered); ctx.restore(); return; }
  else if (entity.type === 'path') renderPathEntity(ctx, entity, vp);

  if (isSelected || isHovered) renderSelectionOverlay(ctx, entity, wx, wy, vp.zoom, isSelected);
  ctx.restore();
}

function renderShape(ctx: CanvasRenderingContext2D, e: DrawableEntity, wx: number, wy: number, z: number) {
  const p = e.shapeProps ?? { width: 100, height: 100 };
  const w = (p.width ?? 100) * z, h = (p.height ?? 100) * z;
  ctx.save();
  ctx.translate(wx + w / 2, wy + h / 2);
  ctx.rotate((e.transform.rotation * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  const drawFill = () => { if (e.fill.type !== 'none') { ctx.fillStyle = e.fill.color; ctx.globalAlpha *= e.fill.opacity; ctx.fill(); ctx.globalAlpha = e.blend.opacity; } };
  const drawStroke = () => { if (e.stroke.width > 0) { ctx.strokeStyle = e.stroke.color; ctx.lineWidth = e.stroke.width * z; ctx.lineCap = e.stroke.cap; ctx.lineJoin = e.stroke.join; ctx.globalAlpha *= e.stroke.opacity; ctx.stroke(); } };

  switch (e.shapeKind) {
    case 'rectangle': {
      const cr = (p.cornerRadius ?? 0) * z;
      ctx.beginPath();
      if (cr > 0) roundRect(ctx, 0, 0, w, h, cr); else ctx.rect(0, 0, w, h);
      drawFill(); drawStroke(); break;
    }
    case 'ellipse':
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      drawFill(); drawStroke(); break;
    case 'polygon': {
      const sides = p.sides ?? 6; const r = Math.min(w, h) / 2;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) { const a = (Math.PI * 2 * i) / sides - Math.PI / 2; const px = w / 2 + r * Math.cos(a); const py = h / 2 + r * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.closePath(); drawFill(); drawStroke(); break;
    }
    case 'star': {
      const pts = p.starPoints ?? 5; const outerR = Math.min(w, h) / 2; const innerR = outerR * (p.innerRadius ?? 0.4);
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) { const a = (Math.PI * i) / pts - Math.PI / 2; const r = i % 2 === 0 ? outerR : innerR; const px = w / 2 + r * Math.cos(a); const py = h / 2 + r * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.closePath(); drawFill(); drawStroke(); break;
    }
    case 'line': {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((p.x2 - p.x1) * z, (p.y2 - p.y1) * z);
      drawStroke(); break;
    }
  }
  ctx.restore();
}

function renderBrushStroke(ctx: CanvasRenderingContext2D, e: DrawableEntity, vp: ViewportState) {
  const pts = e.brushPoints;
  if (!pts || pts.length < 2) return;
  const { panX, panY, zoom } = vp;
  const baseW = e.stroke.width;

  // Use stroke expansion for variable-width rendering
  const skeletonPoints = pts.map(p => ({ x: (p.x + panX) * zoom, y: (p.y + panY) * zoom }));
  const pressures = pts.map(p => p.pressure);
  const expansion = expandStroke({
    skeletonPoints, pressures,
    widthProfile: { ...defaultWidthProfile, mode: 'pressure', baseWidth: baseW * zoom, startTaper: 0.05, endTaper: 0.1, taperCurve: 'ease-out', minWidth: 0.3 },
    pressureCurve: defaultPressureCurve,
    capStyle: 'round', joinStyle: 'round',
  });

  if (expansion.boundary.length > 2) {
    ctx.save();
    ctx.fillStyle = e.stroke.color;
    ctx.globalAlpha *= e.stroke.opacity;
    ctx.beginPath();
    ctx.moveTo(expansion.boundary[0].x, expansion.boundary[0].y);
    for (let i = 1; i < expansion.boundary.length; i++) {
      ctx.lineTo(expansion.boundary[i].x, expansion.boundary[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ============================================
// LIVE PREVIEW RENDERER — Renders in-progress drawing
// ============================================

export function renderLivePreview(
  ctx: CanvasRenderingContext2D,
  vp: ViewportState,
  preview: LivePreviewState,
) {
  if (!preview.active) return;
  ctx.save();

  switch (preview.type) {
    case 'shape': {
      if (!preview.startWorld || !preview.currentWorld) break;
      const s = preview.startWorld, c = preview.currentWorld;
      const x = Math.min(s.x, c.x), y = Math.min(s.y, c.y);
      const w = Math.abs(c.x - s.x), h = Math.abs(c.y - s.y);
      const sx = (x + vp.panX) * vp.zoom, sy = (y + vp.panY) * vp.zoom;
      const sw = w * vp.zoom, sh = h * vp.zoom;

      ctx.fillStyle = preview.fillColor ?? '#4a9eff';
      ctx.globalAlpha = 0.5;

      if (preview.shapeKind === 'ellipse') {
        ctx.beginPath(); ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = preview.strokeColor ?? '#ffffff';
        ctx.lineWidth = (preview.strokeWidth ?? 2) * vp.zoom;
        ctx.globalAlpha = 0.8; ctx.stroke();
      } else {
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = preview.strokeColor ?? '#ffffff';
        ctx.lineWidth = (preview.strokeWidth ?? 2) * vp.zoom;
        ctx.globalAlpha = 0.8; ctx.strokeRect(sx, sy, sw, sh);
      }
      break;
    }
    case 'brush': {
      if (!preview.brushPoints || preview.brushPoints.length < 2) break;
      const pts = preview.brushPoints;
      const skeletonPoints = pts.map(p => ({ x: (p.x + vp.panX) * vp.zoom, y: (p.y + vp.panY) * vp.zoom }));
      const pressures = pts.map(p => p.pressure);
      const baseW = (preview.strokeWidth ?? 4) * vp.zoom;

      const expansion = expandStroke({
        skeletonPoints, pressures,
        widthProfile: { ...defaultWidthProfile, mode: 'pressure', baseWidth: baseW, startTaper: 0.05, endTaper: 0.1, taperCurve: 'ease-out', minWidth: 0.3 },
        pressureCurve: defaultPressureCurve,
        capStyle: 'round', joinStyle: 'round',
      });

      if (expansion.boundary.length > 2) {
        ctx.fillStyle = preview.strokeColor ?? '#ffffff';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(expansion.boundary[0].x, expansion.boundary[0].y);
        for (let i = 1; i < expansion.boundary.length; i++) ctx.lineTo(expansion.boundary[i].x, expansion.boundary[i].y);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'line': {
      if (!preview.startWorld || !preview.currentWorld) break;
      const s = preview.startWorld, c = preview.currentWorld;
      ctx.strokeStyle = preview.strokeColor ?? '#ffffff';
      ctx.lineWidth = (preview.strokeWidth ?? 2) * vp.zoom;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo((s.x + vp.panX) * vp.zoom, (s.y + vp.panY) * vp.zoom);
      ctx.lineTo((c.x + vp.panX) * vp.zoom, (c.y + vp.panY) * vp.zoom);
      ctx.stroke();
      break;
    }
    case 'pen': {
      if (!preview.penAnchors || preview.penAnchors.length === 0) break;
      ctx.strokeStyle = 'hsl(193,100%,50%)';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.9;
      // Draw constructed path
      const anchors = preview.penAnchors;
      if (anchors.length > 1) {
        ctx.beginPath();
        const a0 = anchors[0];
        ctx.moveTo((a0.x + vp.panX) * vp.zoom, (a0.y + vp.panY) * vp.zoom);
        for (let i = 1; i < anchors.length; i++) {
          const prev = anchors[i - 1];
          const curr = anchors[i];
          if (prev.handleOut && curr.handleIn) {
            ctx.bezierCurveTo(
              (prev.handleOut.x + vp.panX) * vp.zoom, (prev.handleOut.y + vp.panY) * vp.zoom,
              (curr.handleIn.x + vp.panX) * vp.zoom, (curr.handleIn.y + vp.panY) * vp.zoom,
              (curr.x + vp.panX) * vp.zoom, (curr.y + vp.panY) * vp.zoom,
            );
          } else {
            ctx.lineTo((curr.x + vp.panX) * vp.zoom, (curr.y + vp.panY) * vp.zoom);
          }
        }
        ctx.stroke();
      }
      // Draw anchor points
      for (const a of anchors) {
        const ax = (a.x + vp.panX) * vp.zoom, ay = (a.y + vp.panY) * vp.zoom;
        ctx.fillStyle = 'hsl(193,100%,50%)';
        ctx.fillRect(ax - 3, ay - 3, 6, 6);
        // Draw handles
        if (a.handleIn) {
          const hx = (a.handleIn.x + vp.panX) * vp.zoom, hy = (a.handleIn.y + vp.panY) * vp.zoom;
          ctx.strokeStyle = 'hsla(193,100%,50%,0.5)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.fillStyle = 'hsl(193,100%,70%)'; ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
        }
        if (a.handleOut) {
          const hx = (a.handleOut.x + vp.panX) * vp.zoom, hy = (a.handleOut.y + vp.panY) * vp.zoom;
          ctx.strokeStyle = 'hsla(193,100%,50%,0.5)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.fillStyle = 'hsl(193,100%,70%)'; ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Preview line to cursor
      if (preview.currentWorld && anchors.length > 0) {
        const last = anchors[anchors.length - 1];
        ctx.strokeStyle = 'hsla(193,100%,50%,0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo((last.x + vp.panX) * vp.zoom, (last.y + vp.panY) * vp.zoom);
        ctx.lineTo((preview.currentWorld.x + vp.panX) * vp.zoom, (preview.currentWorld.y + vp.panY) * vp.zoom);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      break;
    }
  }
  ctx.restore();
}

export interface PenAnchorPreview {
  x: number; y: number;
  handleIn?: { x: number; y: number } | null;
  handleOut?: { x: number; y: number } | null;
}

export interface LivePreviewState {
  active: boolean;
  type: 'shape' | 'brush' | 'line' | 'pen';
  shapeKind?: string;
  startWorld?: Vec2;
  currentWorld?: Vec2;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  brushPoints?: { x: number; y: number; pressure: number }[];
  penAnchors?: PenAnchorPreview[];
}

export const emptyPreview: LivePreviewState = { active: false, type: 'shape' };

function renderSelectionOverlay(ctx: CanvasRenderingContext2D, e: DrawableEntity, wx: number, wy: number, z: number, sel: boolean) {
  // Only show simple overlay if not in node-edit mode
  const p = e.shapeProps ?? { width: 100, height: 100 };
  const w = (p.width ?? 100) * z, h = (p.height ?? 100) * z;
  ctx.save();
  ctx.strokeStyle = sel ? 'hsl(193,100%,50%)' : 'hsla(193,100%,50%,0.4)';
  ctx.lineWidth = sel ? 1.5 : 1;
  ctx.setLineDash(sel ? [] : [4, 4]);
  ctx.strokeRect(wx - 2, wy - 2, w + 4, h + 4);
  ctx.restore();
}

// ============================================
// NODE EDITING OVERLAY
// ============================================

export interface NodeEditOverlay {
  enabled: boolean;
  entityId: string | null;
  activeNodeHit: import('./node-editing').NodeHit | null;
}

export const emptyNodeOverlay: NodeEditOverlay = { enabled: false, entityId: null, activeNodeHit: null };

export function renderNodeOverlay(
  ctx: CanvasRenderingContext2D, entity: DrawableEntity, vp: ViewportState,
  activeHit: import('./node-editing').NodeHit | null,
) {
  const pd = entity.pathData;
  if (!pd) return;
  ctx.save();

  for (let ci = 0; ci < pd.contours.length; ci++) {
    const contour = pd.contours[ci];
    if (contour.anchors.length > 1) {
      ctx.strokeStyle = 'hsl(193,100%,50%)';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      const a0 = contour.anchors[0];
      ctx.moveTo((a0.position.x + vp.panX) * vp.zoom, (a0.position.y + vp.panY) * vp.zoom);
      for (let i = 1; i < contour.anchors.length; i++) {
        const prev = contour.anchors[i - 1];
        const curr = contour.anchors[i];
        if (prev.handleOut && curr.handleIn) {
          ctx.bezierCurveTo(
            (prev.handleOut.x + vp.panX) * vp.zoom, (prev.handleOut.y + vp.panY) * vp.zoom,
            (curr.handleIn.x + vp.panX) * vp.zoom, (curr.handleIn.y + vp.panY) * vp.zoom,
            (curr.position.x + vp.panX) * vp.zoom, (curr.position.y + vp.panY) * vp.zoom,
          );
        } else {
          ctx.lineTo((curr.position.x + vp.panX) * vp.zoom, (curr.position.y + vp.panY) * vp.zoom);
        }
      }
      if (contour.closed) ctx.closePath();
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    for (let ai = 0; ai < contour.anchors.length; ai++) {
      const anchor = contour.anchors[ai];
      const ax = (anchor.position.x + vp.panX) * vp.zoom;
      const ay = (anchor.position.y + vp.panY) * vp.zoom;
      const isActive = activeHit && activeHit.contourIndex === ci && activeHit.anchorIndex === ai;

      if (anchor.handleIn) {
        const hx = (anchor.handleIn.x + vp.panX) * vp.zoom;
        const hy = (anchor.handleIn.y + vp.panY) * vp.zoom;
        ctx.strokeStyle = 'hsla(193,100%,50%,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = (isActive && activeHit?.type === 'handleIn') ? 'hsl(40,100%,60%)' : 'hsl(193,100%,70%)';
        ctx.beginPath(); ctx.arc(hx, hy, (isActive && activeHit?.type === 'handleIn') ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
      }
      if (anchor.handleOut) {
        const hx = (anchor.handleOut.x + vp.panX) * vp.zoom;
        const hy = (anchor.handleOut.y + vp.panY) * vp.zoom;
        ctx.strokeStyle = 'hsla(193,100%,50%,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.fillStyle = (isActive && activeHit?.type === 'handleOut') ? 'hsl(40,100%,60%)' : 'hsl(193,100%,70%)';
        ctx.beginPath(); ctx.arc(hx, hy, (isActive && activeHit?.type === 'handleOut') ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
      }

      const isAnchorActive = isActive && activeHit?.type === 'anchor';
      const size = isAnchorActive ? 5 : 4;
      ctx.fillStyle = isAnchorActive ? 'hsl(40,100%,60%)' : 'hsl(193,100%,50%)';
      ctx.strokeStyle = 'hsl(220,27%,4%)'; ctx.lineWidth = 1.5;
      ctx.fillRect(ax - size, ay - size, size * 2, size * 2);
      ctx.strokeRect(ax - size, ay - size, size * 2, size * 2);
    }
  }
  ctx.restore();
}

export function renderTransformHandles(
  ctx: CanvasRenderingContext2D,
  handles: import('./node-editing').TransformHandle[],
  vp: ViewportState,
) {
  ctx.save();
  // Draw bounding box
  const corners = handles.filter(h => ['nw', 'ne', 'se', 'sw'].includes(h.type));
  if (corners.length === 4) {
    const order = ['nw', 'ne', 'se', 'sw'];
    const sorted = order.map(t => corners.find(c => c.type === t)!);
    ctx.strokeStyle = 'hsla(193,100%,50%,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < sorted.length; i++) {
      const sx = (sorted[i].position.x + vp.panX) * vp.zoom;
      const sy = (sorted[i].position.y + vp.panY) * vp.zoom;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.closePath(); ctx.stroke();
  }

  for (const h of handles) {
    const sx = (h.position.x + vp.panX) * vp.zoom;
    const sy = (h.position.y + vp.panY) * vp.zoom;
    if (h.type === 'rotate') {
      ctx.fillStyle = 'hsl(193,100%,50%)'; ctx.strokeStyle = 'hsl(220,27%,4%)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const topHandle = handles.find(hh => hh.type === 'n');
      if (topHandle) {
        ctx.strokeStyle = 'hsla(193,100%,50%,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo((topHandle.position.x + vp.panX) * vp.zoom, (topHandle.position.y + vp.panY) * vp.zoom);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = 'hsl(193,100%,50%)'; ctx.strokeStyle = 'hsl(220,27%,4%)'; ctx.lineWidth = 1.5;
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
      ctx.strokeRect(sx - 4, sy - 4, 8, 8);
    }
  }
  ctx.restore();
}

// ============================================
// FULL SCENE RENDER
// ============================================

export function renderScene(
  ctx: CanvasRenderingContext2D, scene: Scene, vp: ViewportState,
  selectedIds: string[], hoveredId: string | null,
  cw: number, ch: number, gridEnabled: boolean, gridSize: number,
  preview?: LivePreviewState,
  nodeOverlay?: NodeEditOverlay,
  transformHandles?: import('./node-editing').TransformHandle[],
) {
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = 'hsl(220,27%,4%)';
  ctx.fillRect(0, 0, cw, ch);
  if (gridEnabled) renderGrid(ctx, vp, cw, ch, gridSize);
  for (const ab of scene.artboards) renderArtboard(ctx, vp, ab.x, ab.y, ab.width, ab.height, ab.backgroundColor, ab.name);
  for (const layer of scene.layers) {
    if (!layer.visible) continue;
    for (const eid of layer.entities) {
      const e = scene.entities[eid];
      if (e) renderEntity(ctx, e, vp, selectedIds.includes(eid), hoveredId === eid);
    }
  }
  if (preview) renderLivePreview(ctx, vp, preview);
  if (nodeOverlay?.enabled && nodeOverlay.entityId) {
    const entity = scene.entities[nodeOverlay.entityId];
    if (entity) renderNodeOverlay(ctx, entity, vp, nodeOverlay.activeNodeHit);
  }
  if (transformHandles && transformHandles.length > 0) {
    renderTransformHandles(ctx, transformHandles, vp);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
