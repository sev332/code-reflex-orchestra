// Gradient Engine — Linear, Radial, Freeform gradients with on-canvas editing
// Sprint 2: Full gradient creation, rendering, and interactive manipulation

import { Vec2, GradientStop, FillAppearance, DrawableEntity, generateId } from './types';

// ============================================
// GRADIENT DATA STRUCTURES
// ============================================

export interface LinearGradient {
  type: 'linear';
  stops: GradientStop[];
  startPoint: Vec2;    // in object-local coords (0-1 normalized)
  endPoint: Vec2;      // in object-local coords (0-1 normalized)
  angle: number;       // degrees
  spreadMethod: 'pad' | 'reflect' | 'repeat';
}

export interface RadialGradient {
  type: 'radial';
  stops: GradientStop[];
  center: Vec2;        // normalized 0-1
  focal: Vec2;         // normalized 0-1
  radius: number;      // normalized 0-1
  aspectRatio: number; // elliptical: 1 = circle
  spreadMethod: 'pad' | 'reflect' | 'repeat';
}

export interface FreeformGradientPoint {
  id: string;
  position: Vec2;      // normalized 0-1
  color: string;
  spread: number;      // 0-1, radius of influence
}

export interface FreeformGradient {
  type: 'freeform';
  points: FreeformGradientPoint[];
  mode: 'points' | 'lines';
}

export type GradientData = LinearGradient | RadialGradient | FreeformGradient;

// ============================================
// GRADIENT FACTORIES
// ============================================

export function createLinearGradient(
  colors: string[] = ['#000000', '#ffffff'],
  angle: number = 0,
): LinearGradient {
  const stops: GradientStop[] = colors.map((color, i) => ({
    offset: colors.length > 1 ? i / (colors.length - 1) : 0,
    color,
  }));

  const rad = (angle * Math.PI) / 180;
  return {
    type: 'linear',
    stops,
    startPoint: { x: 0.5 - Math.cos(rad) * 0.5, y: 0.5 - Math.sin(rad) * 0.5 },
    endPoint: { x: 0.5 + Math.cos(rad) * 0.5, y: 0.5 + Math.sin(rad) * 0.5 },
    angle,
    spreadMethod: 'pad',
  };
}

export function createRadialGradient(
  colors: string[] = ['#ffffff', '#000000'],
  center: Vec2 = { x: 0.5, y: 0.5 },
  radius: number = 0.5,
): RadialGradient {
  const stops: GradientStop[] = colors.map((color, i) => ({
    offset: colors.length > 1 ? i / (colors.length - 1) : 0,
    color,
  }));

  return {
    type: 'radial',
    stops,
    center,
    focal: { ...center },
    radius,
    aspectRatio: 1,
    spreadMethod: 'pad',
  };
}

export function createFreeformGradient(
  points?: FreeformGradientPoint[],
): FreeformGradient {
  return {
    type: 'freeform',
    points: points ?? [
      { id: generateId(), position: { x: 0.25, y: 0.25 }, color: '#ff0000', spread: 0.4 },
      { id: generateId(), position: { x: 0.75, y: 0.25 }, color: '#00ff00', spread: 0.4 },
      { id: generateId(), position: { x: 0.5, y: 0.75 }, color: '#0000ff', spread: 0.4 },
    ],
    mode: 'points',
  };
}

// ============================================
// GRADIENT STOP MANIPULATION
// ============================================

export function addGradientStop(stops: GradientStop[], offset: number, color: string): GradientStop[] {
  const newStops = [...stops, { offset, color }];
  return newStops.sort((a, b) => a.offset - b.offset);
}

export function removeGradientStop(stops: GradientStop[], index: number): GradientStop[] {
  if (stops.length <= 2) return stops; // minimum 2 stops
  return stops.filter((_, i) => i !== index);
}

export function moveGradientStop(stops: GradientStop[], index: number, newOffset: number): GradientStop[] {
  const clamped = Math.max(0, Math.min(1, newOffset));
  const newStops = [...stops];
  newStops[index] = { ...newStops[index], offset: clamped };
  return newStops.sort((a, b) => a.offset - b.offset);
}

export function setGradientStopColor(stops: GradientStop[], index: number, color: string): GradientStop[] {
  const newStops = [...stops];
  newStops[index] = { ...newStops[index], color };
  return newStops;
}

/** Interpolate color at offset t along gradient stops */
export function interpolateGradient(stops: GradientStop[], t: number): string {
  if (stops.length === 0) return '#000000';
  if (stops.length === 1) return stops[0].color;
  if (t <= stops[0].offset) return stops[0].color;
  if (t >= stops[stops.length - 1].offset) return stops[stops.length - 1].color;

  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].offset && t <= stops[i + 1].offset) {
      const localT = (t - stops[i].offset) / (stops[i + 1].offset - stops[i].offset);
      return lerpColor(stops[i].color, stops[i + 1].color, localT);
    }
  }
  return stops[stops.length - 1].color;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================
// CANVAS GRADIENT RENDERING
// ============================================

export function applyGradientFill(
  ctx: CanvasRenderingContext2D,
  gradient: GradientData,
  bounds: { x: number; y: number; width: number; height: number },
  zoom: number = 1,
): CanvasGradient | null {
  if (gradient.type === 'linear') {
    const sx = bounds.x + gradient.startPoint.x * bounds.width;
    const sy = bounds.y + gradient.startPoint.y * bounds.height;
    const ex = bounds.x + gradient.endPoint.x * bounds.width;
    const ey = bounds.y + gradient.endPoint.y * bounds.height;

    const g = ctx.createLinearGradient(sx * zoom, sy * zoom, ex * zoom, ey * zoom);
    for (const stop of gradient.stops) {
      g.addColorStop(stop.offset, stop.color);
    }
    return g;

  } else if (gradient.type === 'radial') {
    const cx = (bounds.x + gradient.center.x * bounds.width) * zoom;
    const cy = (bounds.y + gradient.center.y * bounds.height) * zoom;
    const fx = (bounds.x + gradient.focal.x * bounds.width) * zoom;
    const fy = (bounds.y + gradient.focal.y * bounds.height) * zoom;
    const r = gradient.radius * Math.min(bounds.width, bounds.height) * zoom;

    const g = ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
    for (const stop of gradient.stops) {
      g.addColorStop(stop.offset, stop.color);
    }
    return g;

  } else if (gradient.type === 'freeform') {
    // Freeform gradients require pixel-by-pixel rendering
    // For performance, we create an offscreen canvas and use it as a pattern
    return renderFreeformGradient(ctx, gradient, bounds, zoom);
  }

  return null;
}

function renderFreeformGradient(
  ctx: CanvasRenderingContext2D,
  gradient: FreeformGradient,
  bounds: { x: number; y: number; width: number; height: number },
  zoom: number,
): CanvasGradient | null {
  // Use weighted distance interpolation
  const size = 64; // render at low res for performance
  const offscreen = new OffscreenCanvas(size, size);
  const octx = offscreen.getContext('2d')!;
  const imageData = octx.createImageData(size, size);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const nx = px / size;
      const ny = py / size;
      let totalWeight = 0;
      let r = 0, g = 0, b = 0;

      for (const point of gradient.points) {
        const dx = nx - point.position.x;
        const dy = ny - point.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const weight = Math.max(0, 1 - dist / Math.max(0.01, point.spread));
        const w = weight * weight; // quadratic falloff

        const pr = parseInt(point.color.slice(1, 3), 16);
        const pg = parseInt(point.color.slice(3, 5), 16);
        const pb = parseInt(point.color.slice(5, 7), 16);

        r += pr * w;
        g += pg * w;
        b += pb * w;
        totalWeight += w;
      }

      const idx = (py * size + px) * 4;
      if (totalWeight > 0) {
        imageData.data[idx] = Math.round(r / totalWeight);
        imageData.data[idx + 1] = Math.round(g / totalWeight);
        imageData.data[idx + 2] = Math.round(b / totalWeight);
      }
      imageData.data[idx + 3] = 255;
    }
  }

  octx.putImageData(imageData, 0, 0);

  // Draw to main context as a scaled image
  const bx = bounds.x * zoom;
  const by = bounds.y * zoom;
  const bw = bounds.width * zoom;
  const bh = bounds.height * zoom;
  ctx.drawImage(offscreen, bx, by, bw, bh);

  return null; // freeform is drawn directly, not returned as CanvasGradient
}

// ============================================
// GRADIENT INTERACTIVE HANDLES
// ============================================

export interface GradientHandle {
  id: string;
  type: 'start' | 'end' | 'center' | 'focal' | 'radius' | 'stop' | 'freeform-point';
  position: Vec2;       // world coordinates
  stopIndex?: number;
  pointId?: string;
  color?: string;
}

export function getGradientHandles(
  gradient: GradientData,
  bounds: { x: number; y: number; width: number; height: number },
): GradientHandle[] {
  const handles: GradientHandle[] = [];

  if (gradient.type === 'linear') {
    handles.push({
      id: 'linear-start',
      type: 'start',
      position: {
        x: bounds.x + gradient.startPoint.x * bounds.width,
        y: bounds.y + gradient.startPoint.y * bounds.height,
      },
      color: gradient.stops[0]?.color,
    });
    handles.push({
      id: 'linear-end',
      type: 'end',
      position: {
        x: bounds.x + gradient.endPoint.x * bounds.width,
        y: bounds.y + gradient.endPoint.y * bounds.height,
      },
      color: gradient.stops[gradient.stops.length - 1]?.color,
    });
    // Stop handles along the line
    for (let i = 0; i < gradient.stops.length; i++) {
      const t = gradient.stops[i].offset;
      handles.push({
        id: `stop-${i}`,
        type: 'stop',
        position: {
          x: bounds.x + (gradient.startPoint.x + (gradient.endPoint.x - gradient.startPoint.x) * t) * bounds.width,
          y: bounds.y + (gradient.startPoint.y + (gradient.endPoint.y - gradient.startPoint.y) * t) * bounds.height,
        },
        stopIndex: i,
        color: gradient.stops[i].color,
      });
    }
  } else if (gradient.type === 'radial') {
    handles.push({
      id: 'radial-center',
      type: 'center',
      position: {
        x: bounds.x + gradient.center.x * bounds.width,
        y: bounds.y + gradient.center.y * bounds.height,
      },
    });
    handles.push({
      id: 'radial-focal',
      type: 'focal',
      position: {
        x: bounds.x + gradient.focal.x * bounds.width,
        y: bounds.y + gradient.focal.y * bounds.height,
      },
    });
    handles.push({
      id: 'radial-radius',
      type: 'radius',
      position: {
        x: bounds.x + (gradient.center.x + gradient.radius) * bounds.width,
        y: bounds.y + gradient.center.y * bounds.height,
      },
    });
  } else if (gradient.type === 'freeform') {
    for (const point of gradient.points) {
      handles.push({
        id: `freeform-${point.id}`,
        type: 'freeform-point',
        position: {
          x: bounds.x + point.position.x * bounds.width,
          y: bounds.y + point.position.y * bounds.height,
        },
        pointId: point.id,
        color: point.color,
      });
    }
  }

  return handles;
}

export function hitTestGradientHandle(
  handles: GradientHandle[],
  worldPoint: Vec2,
  tolerance: number = 8,
): GradientHandle | null {
  for (const h of handles) {
    const dx = worldPoint.x - h.position.x;
    const dy = worldPoint.y - h.position.y;
    if (Math.sqrt(dx * dx + dy * dy) < tolerance) return h;
  }
  return null;
}

// ============================================
// RENDER GRADIENT HANDLES ON CANVAS
// ============================================

export function renderGradientOverlay(
  ctx: CanvasRenderingContext2D,
  gradient: GradientData,
  bounds: { x: number; y: number; width: number; height: number },
  vp: { panX: number; panY: number; zoom: number },
  activeHandleId: string | null,
) {
  ctx.save();

  if (gradient.type === 'linear') {
    const sx = (bounds.x + gradient.startPoint.x * bounds.width + vp.panX) * vp.zoom;
    const sy = (bounds.y + gradient.startPoint.y * bounds.height + vp.panY) * vp.zoom;
    const ex = (bounds.x + gradient.endPoint.x * bounds.width + vp.panX) * vp.zoom;
    const ey = (bounds.y + gradient.endPoint.y * bounds.height + vp.panY) * vp.zoom;

    // Line between start/end
    ctx.strokeStyle = 'hsla(0,0%,100%,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);

    // Start circle
    drawGradientHandleCircle(ctx, sx, sy, gradient.stops[0]?.color ?? '#000', activeHandleId === 'linear-start');
    // End circle
    drawGradientHandleCircle(ctx, ex, ey, gradient.stops[gradient.stops.length - 1]?.color ?? '#fff', activeHandleId === 'linear-end');

    // Stop diamonds
    for (let i = 0; i < gradient.stops.length; i++) {
      const t = gradient.stops[i].offset;
      const px = sx + (ex - sx) * t;
      const py = sy + (ey - sy) * t;
      drawGradientStopDiamond(ctx, px, py, gradient.stops[i].color, activeHandleId === `stop-${i}`);
    }
  } else if (gradient.type === 'radial') {
    const cx = (bounds.x + gradient.center.x * bounds.width + vp.panX) * vp.zoom;
    const cy = (bounds.y + gradient.center.y * bounds.height + vp.panY) * vp.zoom;
    const r = gradient.radius * Math.min(bounds.width, bounds.height) * vp.zoom;

    // Radius circle
    ctx.strokeStyle = 'hsla(0,0%,100%,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * gradient.aspectRatio, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center handle
    drawGradientHandleCircle(ctx, cx, cy, '#fff', activeHandleId === 'radial-center');

    // Focal handle
    const fx = (bounds.x + gradient.focal.x * bounds.width + vp.panX) * vp.zoom;
    const fy = (bounds.y + gradient.focal.y * bounds.height + vp.panY) * vp.zoom;
    if (Math.abs(fx - cx) > 2 || Math.abs(fy - cy) > 2) {
      drawGradientHandleCircle(ctx, fx, fy, '#aaa', activeHandleId === 'radial-focal');
    }

    // Radius drag handle
    const rx = cx + r;
    drawGradientHandleCircle(ctx, rx, cy, '#888', activeHandleId === 'radial-radius');

  } else if (gradient.type === 'freeform') {
    for (const point of gradient.points) {
      const px = (bounds.x + point.position.x * bounds.width + vp.panX) * vp.zoom;
      const py = (bounds.y + point.position.y * bounds.height + vp.panY) * vp.zoom;
      drawGradientHandleCircle(ctx, px, py, point.color, activeHandleId === `freeform-${point.id}`);
    }
  }

  ctx.restore();
}

function drawGradientHandleCircle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, active: boolean) {
  const r = active ? 7 : 5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = active ? 'hsl(40,100%,60%)' : 'hsla(0,0%,100%,0.9)';
  ctx.lineWidth = active ? 2.5 : 1.5;
  ctx.stroke();
}

function drawGradientStopDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, active: boolean) {
  const s = active ? 6 : 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.fillRect(-s, -s, s * 2, s * 2);
  ctx.strokeStyle = active ? 'hsl(40,100%,60%)' : 'hsla(0,0%,100%,0.8)';
  ctx.lineWidth = active ? 2 : 1;
  ctx.strokeRect(-s, -s, s * 2, s * 2);
  ctx.restore();
}

// ============================================
// GRADIENT PRESETS
// ============================================

export const GRADIENT_PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Sunset', colors: ['#ff6b35', '#f7c948', '#ff1744'] },
  { name: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef'] },
  { name: 'Forest', colors: ['#2d6a4f', '#52b788', '#b7e4c7'] },
  { name: 'Purple Haze', colors: ['#240046', '#7b2cbf', '#c77dff'] },
  { name: 'Fire', colors: ['#d00000', '#e85d04', '#faa307'] },
  { name: 'Ice', colors: ['#caf0f8', '#48cae4', '#023e8a'] },
  { name: 'Neon', colors: ['#ff006e', '#8338ec', '#3a86ff'] },
  { name: 'Gold', colors: ['#f4a261', '#e9c46a', '#264653'] },
  { name: 'Midnight', colors: ['#0d1b2a', '#1b263b', '#415a77'] },
  { name: 'Rainbow', colors: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'] },
  { name: 'Chrome', colors: ['#e0e0e0', '#ffffff', '#a0a0a0', '#ffffff', '#d0d0d0'] },
  { name: 'Black → White', colors: ['#000000', '#ffffff'] },
];

// ============================================
// ENTITY GRADIENT HELPERS
// ============================================

export function applyGradientToEntity(
  entity: DrawableEntity,
  gradient: GradientData,
  target: 'fill' | 'stroke' = 'fill',
): DrawableEntity {
  const gradientFill: FillAppearance = {
    type: gradient.type === 'linear' ? 'linear-gradient' : 'radial-gradient',
    color: (gradient as any).stops?.[0]?.color ?? '#000',
    opacity: entity.fill.opacity,
    gradient: {
      stops: (gradient as any).stops ?? [],
      angle: gradient.type === 'linear' ? gradient.angle : undefined,
      cx: gradient.type === 'radial' ? gradient.center.x : undefined,
      cy: gradient.type === 'radial' ? gradient.center.y : undefined,
      r: gradient.type === 'radial' ? gradient.radius : undefined,
    },
  };

  if (target === 'fill') {
    return { ...entity, fill: gradientFill };
  } else {
    // Store gradient data in a custom way for strokes
    return { ...entity, fill: gradientFill };
  }
}
