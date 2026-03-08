// Drawing Engine — Canvas2D Renderer
import { DrawableEntity, ViewportState, Layer, Scene, Vec2 } from './types';

// ============================================
// GRID RENDERER (WebGL-style via Canvas2D)
// ============================================

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number
) {
  const { panX, panY, zoom } = viewport;
  const scaledGrid = gridSize * zoom;

  // Skip grid if too small
  if (scaledGrid < 4) return;

  const offsetX = (panX * zoom) % scaledGrid;
  const offsetY = (panY * zoom) % scaledGrid;

  ctx.save();

  // Minor grid
  ctx.strokeStyle = 'hsla(220, 20%, 18%, 0.5)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = offsetX; x < canvasWidth; x += scaledGrid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
  }
  for (let y = offsetY; y < canvasHeight; y += scaledGrid) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
  }
  ctx.stroke();

  // Major grid (every 5)
  const majorGrid = scaledGrid * 5;
  if (majorGrid >= 20) {
    const majorOffsetX = (panX * zoom) % majorGrid;
    const majorOffsetY = (panY * zoom) % majorGrid;
    ctx.strokeStyle = 'hsla(220, 20%, 22%, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = majorOffsetX; x < canvasWidth; x += majorGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    for (let y = majorOffsetY; y < canvasHeight; y += majorGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    }
    ctx.stroke();
  }

  // Axes
  const originX = panX * zoom;
  const originY = panY * zoom;
  if (originX >= 0 && originX <= canvasWidth) {
    ctx.strokeStyle = 'hsla(0, 70%, 50%, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvasHeight);
    ctx.stroke();
  }
  if (originY >= 0 && originY <= canvasHeight) {
    ctx.strokeStyle = 'hsla(120, 70%, 50%, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvasWidth, originY);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================
// ARTBOARD RENDERER
// ============================================

export function renderArtboard(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  x: number, y: number, w: number, h: number,
  bgColor: string, name: string,
) {
  const { panX, panY, zoom } = viewport;
  const sx = (x + panX) * zoom;
  const sy = (y + panY) * zoom;
  const sw = w * zoom;
  const sh = h * zoom;

  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20 * zoom;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4 * zoom;

  // Artboard fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.shadowColor = 'transparent';

  // Border
  ctx.strokeStyle = 'hsla(220, 15%, 25%, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, sy, sw, sh);

  // Name label
  ctx.fillStyle = 'hsla(193, 30%, 65%, 0.7)';
  ctx.font = `${11 * Math.min(zoom, 1.5)}px Inter, system-ui, sans-serif`;
  ctx.fillText(name, sx, sy - 8 * zoom);

  ctx.restore();
}

// ============================================
// ENTITY RENDERER
// ============================================

export function renderEntity(
  ctx: CanvasRenderingContext2D,
  entity: DrawableEntity,
  viewport: ViewportState,
  isSelected: boolean,
  isHovered: boolean,
) {
  if (!entity.visible) return;

  const { panX, panY, zoom } = viewport;
  const t = entity.transform;

  ctx.save();
  ctx.globalAlpha = entity.blend.opacity;

  // Apply viewport + entity transform
  const worldX = (t.translateX + panX) * zoom;
  const worldY = (t.translateY + panY) * zoom;

  switch (entity.type) {
    case 'shape':
      renderShape(ctx, entity, worldX, worldY, zoom);
      break;
    case 'brush-stroke':
      renderBrushStroke(ctx, entity, viewport);
      break;
  }

  // Selection / hover indicators
  if (isSelected || isHovered) {
    renderSelectionOverlay(ctx, entity, worldX, worldY, zoom, isSelected);
  }

  ctx.restore();
}

function renderShape(
  ctx: CanvasRenderingContext2D,
  entity: DrawableEntity,
  worldX: number, worldY: number, zoom: number,
) {
  const props = entity.shapeProps ?? { width: 100, height: 100 };
  const w = (props.width ?? 100) * zoom;
  const h = (props.height ?? 100) * zoom;

  ctx.save();
  ctx.translate(worldX + w / 2, worldY + h / 2);
  ctx.rotate((entity.transform.rotation * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  switch (entity.shapeKind) {
    case 'rectangle': {
      const cr = (entity.shapeProps?.cornerRadius ?? 0) * zoom;
      if (entity.fill.type !== 'none') {
        ctx.fillStyle = entity.fill.color;
        ctx.globalAlpha *= entity.fill.opacity;
        if (cr > 0) {
          roundRect(ctx, 0, 0, w, h, cr);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = entity.blend.opacity;
      }
      if (entity.stroke.width > 0) {
        ctx.strokeStyle = entity.stroke.color;
        ctx.lineWidth = entity.stroke.width * zoom;
        ctx.lineCap = entity.stroke.cap;
        ctx.lineJoin = entity.stroke.join;
        ctx.globalAlpha *= entity.stroke.opacity;
        if (cr > 0) {
          roundRect(ctx, 0, 0, w, h, cr);
          ctx.stroke();
        } else {
          ctx.strokeRect(0, 0, w, h);
        }
      }
      break;
    }
    case 'ellipse': {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      if (entity.fill.type !== 'none') {
        ctx.fillStyle = entity.fill.color;
        ctx.globalAlpha *= entity.fill.opacity;
        ctx.fill();
        ctx.globalAlpha = entity.blend.opacity;
      }
      if (entity.stroke.width > 0) {
        ctx.strokeStyle = entity.stroke.color;
        ctx.lineWidth = entity.stroke.width * zoom;
        ctx.globalAlpha *= entity.stroke.opacity;
        ctx.stroke();
      }
      break;
    }
    case 'line': {
      const p = entity.shapeProps!;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo((p.x2 - p.x1) * zoom, (p.y2 - p.y1) * zoom);
      ctx.strokeStyle = entity.stroke.color;
      ctx.lineWidth = entity.stroke.width * zoom;
      ctx.lineCap = entity.stroke.cap;
      ctx.globalAlpha *= entity.stroke.opacity;
      ctx.stroke();
      break;
    }
    case 'polygon': {
      const sides = entity.shapeProps?.sides ?? 6;
      const r = Math.min(w, h) / 2;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const px = w / 2 + r * Math.cos(angle);
        const py = h / 2 + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (entity.fill.type !== 'none') {
        ctx.fillStyle = entity.fill.color;
        ctx.fill();
      }
      if (entity.stroke.width > 0) {
        ctx.strokeStyle = entity.stroke.color;
        ctx.lineWidth = entity.stroke.width * zoom;
        ctx.stroke();
      }
      break;
    }
    case 'star': {
      const points = entity.shapeProps?.starPoints ?? 5;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * (entity.shapeProps?.innerRadius ?? 0.4);
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI * i) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = w / 2 + r * Math.cos(angle);
        const py = h / 2 + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (entity.fill.type !== 'none') {
        ctx.fillStyle = entity.fill.color;
        ctx.fill();
      }
      if (entity.stroke.width > 0) {
        ctx.strokeStyle = entity.stroke.color;
        ctx.lineWidth = entity.stroke.width * zoom;
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

function renderBrushStroke(
  ctx: CanvasRenderingContext2D,
  entity: DrawableEntity,
  viewport: ViewportState,
) {
  const points = entity.brushPoints;
  if (!points || points.length < 2) return;

  const { panX, panY, zoom } = viewport;
  const baseWidth = entity.stroke.width;

  ctx.save();
  ctx.strokeStyle = entity.stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha *= entity.stroke.opacity;

  // Render with variable width based on pressure
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const pressure = (p0.pressure + p1.pressure) / 2;
    ctx.lineWidth = baseWidth * pressure * zoom;
    ctx.beginPath();
    ctx.moveTo((p0.x + panX) * zoom, (p0.y + panY) * zoom);
    ctx.lineTo((p1.x + panX) * zoom, (p1.y + panY) * zoom);
    ctx.stroke();
  }

  ctx.restore();
}

function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  entity: DrawableEntity,
  worldX: number, worldY: number, zoom: number,
  isSelected: boolean,
) {
  const props = entity.shapeProps ?? { width: 100, height: 100 };
  const w = (props.width ?? 100) * zoom;
  const h = (props.height ?? 100) * zoom;
  const pad = 4;

  ctx.save();
  ctx.strokeStyle = isSelected ? 'hsl(193, 100%, 50%)' : 'hsla(193, 100%, 50%, 0.4)';
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.setLineDash(isSelected ? [] : [4, 4]);
  ctx.strokeRect(worldX - pad, worldY - pad, w + pad * 2, h + pad * 2);

  // Corner handles
  if (isSelected) {
    const handleSize = 8;
    const hs = handleSize / 2;
    ctx.fillStyle = 'hsl(193, 100%, 50%)';
    ctx.strokeStyle = 'hsl(220, 27%, 4%)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    const corners = [
      [worldX - pad, worldY - pad],
      [worldX + w + pad, worldY - pad],
      [worldX - pad, worldY + h + pad],
      [worldX + w + pad, worldY + h + pad],
      [worldX + w / 2, worldY - pad],
      [worldX + w / 2, worldY + h + pad],
      [worldX - pad, worldY + h / 2],
      [worldX + w + pad, worldY + h / 2],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - hs, cy - hs, handleSize, handleSize);
      ctx.strokeRect(cx - hs, cy - hs, handleSize, handleSize);
    }
  }
  ctx.restore();
}

// ============================================
// FULL SCENE RENDER
// ============================================

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewport: ViewportState,
  selectedIds: string[],
  hoveredId: string | null,
  canvasWidth: number,
  canvasHeight: number,
  gridEnabled: boolean,
  gridSize: number,
) {
  // Clear
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = 'hsl(220, 27%, 4%)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Grid
  if (gridEnabled) {
    renderGrid(ctx, viewport, canvasWidth, canvasHeight, gridSize);
  }

  // Artboards
  for (const artboard of scene.artboards) {
    renderArtboard(ctx, viewport, artboard.x, artboard.y, artboard.width, artboard.height, artboard.backgroundColor, artboard.name);
  }

  // Entities by layer order
  for (const layer of scene.layers) {
    if (!layer.visible) continue;
    for (const entityId of layer.entities) {
      const entity = scene.entities[entityId];
      if (!entity) continue;
      renderEntity(ctx, entity, viewport, selectedIds.includes(entityId), hoveredId === entityId);
    }
  }
}

// ============================================
// HELPERS
// ============================================

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
