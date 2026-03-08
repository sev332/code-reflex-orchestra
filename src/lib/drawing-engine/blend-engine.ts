// Blend Engine — Sprint 3: Shape blending, Clipping Masks, Opacity Masks
// Morph between shapes with specified steps, blend along spine paths

import { DrawableEntity, Vec2, generateId, createDefaultTransform, createDefaultBlend } from './types';
import { getEntityBounds } from './engine';

// ============================================
// BLEND TOOL — Morph between shapes
// ============================================

export type BlendMode = 'smooth-color' | 'specified-steps' | 'specified-distance';

export interface BlendOptions {
  mode: BlendMode;
  steps?: number;
  distance?: number;
  spine?: Vec2[]; // Optional path to distribute blended shapes along
}

export const defaultBlendOptions: BlendOptions = {
  mode: 'specified-steps',
  steps: 8,
};

/**
 * Create blended intermediate entities between two shapes.
 * Returns array of interpolated entities (including start and end).
 */
export function createBlend(
  startEntity: DrawableEntity,
  endEntity: DrawableEntity,
  options: BlendOptions,
): DrawableEntity[] {
  const numSteps = getBlendSteps(startEntity, endEntity, options);
  if (numSteps < 1) return [startEntity, endEntity];
  
  const results: DrawableEntity[] = [startEntity];
  const startBounds = getEntityBounds(startEntity);
  const endBounds = getEntityBounds(endEntity);
  
  for (let i = 1; i <= numSteps; i++) {
    const t = i / (numSteps + 1);
    
    // Interpolate position
    const tx = lerp(startEntity.transform.translateX, endEntity.transform.translateX, t);
    const ty = lerp(startEntity.transform.translateY, endEntity.transform.translateY, t);
    
    // Interpolate size
    const w = lerp(startBounds.width, endBounds.width, t);
    const h = lerp(startBounds.height, endBounds.height, t);
    
    // Interpolate rotation
    const rot = lerp(startEntity.transform.rotation, endEntity.transform.rotation, t);
    
    // Interpolate colors
    const fillColor = interpolateColor(startEntity.fill.color, endEntity.fill.color, t);
    const strokeColor = interpolateColor(startEntity.stroke.color, endEntity.stroke.color, t);
    const fillOpacity = lerp(startEntity.fill.opacity, endEntity.fill.opacity, t);
    const strokeWidth = lerp(startEntity.stroke.width, endEntity.stroke.width, t);
    
    // Apply spine position if available
    let finalTx = tx, finalTy = ty;
    if (options.spine && options.spine.length >= 2) {
      const spinePoint = getPointOnSpine(options.spine, t);
      finalTx = spinePoint.x - w / 2;
      finalTy = spinePoint.y - h / 2;
    }
    
    const blendedEntity: DrawableEntity = {
      id: generateId(),
      type: startEntity.type,
      name: `Blend Step ${i}`,
      visible: true,
      locked: false,
      topologyMode: 'isolated',
      transform: {
        ...createDefaultTransform(),
        translateX: finalTx,
        translateY: finalTy,
        rotation: rot,
        scaleX: lerp(startEntity.transform.scaleX, endEntity.transform.scaleX, t),
        scaleY: lerp(startEntity.transform.scaleY, endEntity.transform.scaleY, t),
      },
      blend: {
        mode: 'normal',
        opacity: lerp(startEntity.blend.opacity, endEntity.blend.opacity, t),
      },
      shapeKind: startEntity.shapeKind,
      shapeProps: {
        ...startEntity.shapeProps,
        width: w,
        height: h,
      },
      fill: {
        type: startEntity.fill.type,
        color: fillColor,
        opacity: fillOpacity,
      },
      stroke: {
        color: strokeColor,
        width: strokeWidth,
        opacity: lerp(startEntity.stroke.opacity, endEntity.stroke.opacity, t),
        cap: startEntity.stroke.cap,
        join: startEntity.stroke.join,
      },
    };
    
    results.push(blendedEntity);
  }
  
  results.push(endEntity);
  return results;
}

function getBlendSteps(
  start: DrawableEntity,
  end: DrawableEntity,
  options: BlendOptions,
): number {
  switch (options.mode) {
    case 'specified-steps':
      return options.steps ?? 8;
    case 'specified-distance': {
      const sb = getEntityBounds(start);
      const eb = getEntityBounds(end);
      const dist = Math.sqrt(
        (eb.x - sb.x) ** 2 + (eb.y - sb.y) ** 2
      );
      return Math.max(1, Math.floor(dist / (options.distance ?? 50)));
    }
    case 'smooth-color': {
      // Auto-calculate steps based on color difference
      const diff = colorDistance(start.fill.color, end.fill.color);
      return Math.max(2, Math.min(50, Math.round(diff / 10)));
    }
  }
}

// ============================================
// CLIPPING MASK
// ============================================

export interface ClippingMask {
  id: string;
  clipPathEntityId: string; // The shape used as clip path
  clippedEntityIds: string[]; // Entities being clipped
}

export function createClippingMask(
  clipEntity: DrawableEntity,
  contentEntities: DrawableEntity[],
): ClippingMask {
  return {
    id: generateId(),
    clipPathEntityId: clipEntity.id,
    clippedEntityIds: contentEntities.map(e => e.id),
  };
}

export function releaseClippingMask(mask: ClippingMask): string[] {
  return [mask.clipPathEntityId, ...mask.clippedEntityIds];
}

/**
 * Render a clipping mask group to canvas
 */
export function renderClippingMask(
  ctx: CanvasRenderingContext2D,
  clipEntity: DrawableEntity,
  contentEntities: DrawableEntity[],
  renderEntityFn: (ctx: CanvasRenderingContext2D, entity: DrawableEntity) => void,
  zoom: number,
): void {
  ctx.save();
  
  // Build clip path from the clip entity
  const clipPath = buildClipPath(clipEntity, zoom);
  if (clipPath) {
    ctx.clip(clipPath);
  }
  
  // Render all content entities within the clip
  for (const entity of contentEntities) {
    renderEntityFn(ctx, entity);
  }
  
  ctx.restore();
  
  // Optionally render the clip outline
  if (clipPath) {
    ctx.save();
    ctx.strokeStyle = 'hsla(193,100%,50%,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke(clipPath);
    ctx.restore();
  }
}

function buildClipPath(entity: DrawableEntity, zoom: number): Path2D | null {
  const path = new Path2D();
  const t = entity.transform;
  const p = entity.shapeProps ?? {};
  const w = (p.width ?? 100) * zoom;
  const h = (p.height ?? 100) * zoom;
  const wx = t.translateX * zoom;
  const wy = t.translateY * zoom;
  
  switch (entity.shapeKind) {
    case 'rectangle':
      path.rect(wx, wy, w, h);
      break;
    case 'ellipse':
      path.ellipse(wx + w / 2, wy + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    default:
      // For paths, try to use pathData
      if (entity.pathData) {
        for (const contour of entity.pathData.contours) {
          if (contour.anchors.length < 2) continue;
          const a0 = contour.anchors[0];
          path.moveTo(a0.position.x * zoom, a0.position.y * zoom);
          for (let i = 1; i < contour.anchors.length; i++) {
            const prev = contour.anchors[i - 1];
            const curr = contour.anchors[i];
            if (prev.handleOut && curr.handleIn) {
              path.bezierCurveTo(
                prev.handleOut.x * zoom, prev.handleOut.y * zoom,
                curr.handleIn.x * zoom, curr.handleIn.y * zoom,
                curr.position.x * zoom, curr.position.y * zoom,
              );
            } else {
              path.lineTo(curr.position.x * zoom, curr.position.y * zoom);
            }
          }
          if (contour.closed) path.closePath();
        }
      } else {
        path.rect(wx, wy, w, h);
      }
  }
  
  return path;
}

// ============================================
// OPACITY MASK
// ============================================

export interface OpacityMask {
  id: string;
  maskEntityId: string; // Grayscale mask shape
  targetEntityIds: string[];
  inverted: boolean;
}

export function createOpacityMask(
  maskEntity: DrawableEntity,
  targetEntities: DrawableEntity[],
  inverted: boolean = false,
): OpacityMask {
  return {
    id: generateId(),
    maskEntityId: maskEntity.id,
    targetEntityIds: targetEntities.map(e => e.id),
    inverted,
  };
}

// ============================================
// UTILITY
// ============================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

function getPointOnSpine(spine: Vec2[], t: number): Vec2 {
  if (spine.length < 2) return spine[0] ?? { x: 0, y: 0 };
  
  // Calculate total spine length
  let totalLength = 0;
  const segLengths: number[] = [];
  for (let i = 1; i < spine.length; i++) {
    const len = Math.sqrt(
      (spine[i].x - spine[i - 1].x) ** 2 +
      (spine[i].y - spine[i - 1].y) ** 2
    );
    segLengths.push(len);
    totalLength += len;
  }
  
  // Find point at parameter t along spine
  let targetDist = t * totalLength;
  let accumulated = 0;
  
  for (let i = 0; i < segLengths.length; i++) {
    if (accumulated + segLengths[i] >= targetDist) {
      const segT = (targetDist - accumulated) / segLengths[i];
      return {
        x: lerp(spine[i].x, spine[i + 1].x, segT),
        y: lerp(spine[i].y, spine[i + 1].y, segT),
      };
    }
    accumulated += segLengths[i];
  }
  
  return spine[spine.length - 1];
}
