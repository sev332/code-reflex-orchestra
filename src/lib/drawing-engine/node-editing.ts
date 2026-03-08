// Node Editing System — Direct selection of anchors, handles, and segments
import { DrawableEntity, Vec2, Anchor, Contour, PathData, generateId } from './types';
import { getEntityBounds } from './engine';

// ============================================
// TYPES
// ============================================

export type HandleSide = 'in' | 'out';

export interface NodeHit {
  entityId: string;
  anchorIndex: number;
  contourIndex: number;
  type: 'anchor' | 'handleIn' | 'handleOut';
}

export interface TransformHandle {
  position: Vec2;
  cursor: string;
  type: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';
}

export interface TransformState {
  active: boolean;
  type: 'scale' | 'rotate' | 'none';
  handle: TransformHandle['type'] | null;
  origin: Vec2;
  startMouse: Vec2;
  startBounds: { x: number; y: number; w: number; h: number };
  startTransforms: Record<string, { tx: number; ty: number; sx: number; sy: number; r: number; w?: number; h?: number }>;
}

export const emptyTransformState: TransformState = {
  active: false, type: 'none', handle: null,
  origin: { x: 0, y: 0 }, startMouse: { x: 0, y: 0 },
  startBounds: { x: 0, y: 0, w: 0, h: 0 }, startTransforms: {},
};

// ============================================
// SHAPE → PATH CONVERSION
// ============================================

export function shapeToPathData(entity: DrawableEntity): PathData | null {
  const p = entity.shapeProps;
  if (!p) return null;
  const t = entity.transform;

  switch (entity.shapeKind) {
    case 'rectangle': {
      const w = p.width ?? 100, h = p.height ?? 100;
      const x = t.translateX, y = t.translateY;
      const anchors: Anchor[] = [
        { id: generateId(), position: { x, y }, handleIn: null, handleOut: null },
        { id: generateId(), position: { x: x + w, y }, handleIn: null, handleOut: null },
        { id: generateId(), position: { x: x + w, y: y + h }, handleIn: null, handleOut: null },
        { id: generateId(), position: { x, y: y + h }, handleIn: null, handleOut: null },
      ];
      return {
        contours: [{
          id: generateId(), anchors, closed: true,
          segments: anchors.map((_, i) => ({
            type: 'line' as const,
            from: anchors[i].id,
            to: anchors[(i + 1) % anchors.length].id,
          })),
        }],
      };
    }
    case 'ellipse': {
      const w = p.width ?? 100, h = p.height ?? 100;
      const cx = t.translateX + w / 2, cy = t.translateY + h / 2;
      const rx = w / 2, ry = h / 2;
      // 4-point cubic approximation
      const k = 0.5522847498;
      const anchors: Anchor[] = [
        { id: generateId(), position: { x: cx, y: cy - ry }, handleIn: { x: cx - rx * k, y: cy - ry }, handleOut: { x: cx + rx * k, y: cy - ry } },
        { id: generateId(), position: { x: cx + rx, y: cy }, handleIn: { x: cx + rx, y: cy - ry * k }, handleOut: { x: cx + rx, y: cy + ry * k } },
        { id: generateId(), position: { x: cx, y: cy + ry }, handleIn: { x: cx + rx * k, y: cy + ry }, handleOut: { x: cx - rx * k, y: cy + ry } },
        { id: generateId(), position: { x: cx - rx, y: cy }, handleIn: { x: cx - rx, y: cy + ry * k }, handleOut: { x: cx - rx, y: cy - ry * k } },
      ];
      return {
        contours: [{
          id: generateId(), anchors, closed: true,
          segments: anchors.map((_, i) => ({
            type: 'cubic' as const,
            from: anchors[i].id,
            to: anchors[(i + 1) % anchors.length].id,
          })),
        }],
      };
    }
    case 'line': {
      const anchors: Anchor[] = [
        { id: generateId(), position: { x: p.x1 ?? 0, y: p.y1 ?? 0 }, handleIn: null, handleOut: null },
        { id: generateId(), position: { x: p.x2 ?? 100, y: p.y2 ?? 100 }, handleIn: null, handleOut: null },
      ];
      return {
        contours: [{
          id: generateId(), anchors, closed: false,
          segments: [{ type: 'line', from: anchors[0].id, to: anchors[1].id }],
        }],
      };
    }
    default: return null;
  }
}

// ============================================
// HIT TESTING FOR NODES
// ============================================

const NODE_RADIUS = 5;
const HANDLE_RADIUS = 4;

function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function hitTestNodes(
  entity: DrawableEntity,
  worldPoint: Vec2,
  zoom: number,
): NodeHit | null {
  const pd = entity.pathData;
  if (!pd) return null;
  const tol = NODE_RADIUS / zoom;
  const htol = HANDLE_RADIUS / zoom;

  for (let ci = 0; ci < pd.contours.length; ci++) {
    const contour = pd.contours[ci];
    for (let ai = 0; ai < contour.anchors.length; ai++) {
      const anchor = contour.anchors[ai];
      // Check handles first (they're on top visually)
      if (anchor.handleIn && dist(worldPoint, anchor.handleIn) <= htol) {
        return { entityId: entity.id, contourIndex: ci, anchorIndex: ai, type: 'handleIn' };
      }
      if (anchor.handleOut && dist(worldPoint, anchor.handleOut) <= htol) {
        return { entityId: entity.id, contourIndex: ci, anchorIndex: ai, type: 'handleOut' };
      }
      // Check anchor
      if (dist(worldPoint, anchor.position) <= tol) {
        return { entityId: entity.id, contourIndex: ci, anchorIndex: ai, type: 'anchor' };
      }
    }
  }
  return null;
}

// ============================================
// NODE MANIPULATION
// ============================================

export function moveAnchor(entity: DrawableEntity, hit: NodeHit, dx: number, dy: number): DrawableEntity {
  if (!entity.pathData) return entity;
  const pd = structuredClone(entity.pathData);
  const anchor = pd.contours[hit.contourIndex].anchors[hit.anchorIndex];

  if (hit.type === 'anchor') {
    anchor.position.x += dx;
    anchor.position.y += dy;
    // Move handles with anchor
    if (anchor.handleIn) { anchor.handleIn.x += dx; anchor.handleIn.y += dy; }
    if (anchor.handleOut) { anchor.handleOut.x += dx; anchor.handleOut.y += dy; }
  } else if (hit.type === 'handleIn' && anchor.handleIn) {
    anchor.handleIn.x += dx;
    anchor.handleIn.y += dy;
    // Mirror handle for smooth node
    if (anchor.handleOut) {
      const dix = anchor.handleIn.x - anchor.position.x;
      const diy = anchor.handleIn.y - anchor.position.y;
      const len = Math.sqrt(dix * dix + diy * diy);
      const outLen = Math.sqrt(
        (anchor.handleOut.x - anchor.position.x) ** 2 +
        (anchor.handleOut.y - anchor.position.y) ** 2
      );
      if (len > 0) {
        anchor.handleOut.x = anchor.position.x - (dix / len) * outLen;
        anchor.handleOut.y = anchor.position.y - (diy / len) * outLen;
      }
    }
  } else if (hit.type === 'handleOut' && anchor.handleOut) {
    anchor.handleOut.x += dx;
    anchor.handleOut.y += dy;
    // Mirror handle for smooth node
    if (anchor.handleIn) {
      const dox = anchor.handleOut.x - anchor.position.x;
      const doy = anchor.handleOut.y - anchor.position.y;
      const len = Math.sqrt(dox * dox + doy * doy);
      const inLen = Math.sqrt(
        (anchor.handleIn.x - anchor.position.x) ** 2 +
        (anchor.handleIn.y - anchor.position.y) ** 2
      );
      if (len > 0) {
        anchor.handleIn.x = anchor.position.x - (dox / len) * inLen;
        anchor.handleIn.y = anchor.position.y - (doy / len) * inLen;
      }
    }
  }

  return { ...entity, pathData: pd };
}

export function addAnchorOnSegment(entity: DrawableEntity, contourIndex: number, segIndex: number, t: number = 0.5): DrawableEntity {
  if (!entity.pathData) return entity;
  const pd = structuredClone(entity.pathData);
  const contour = pd.contours[contourIndex];
  const seg = contour.segments[segIndex];
  const fromAnchor = contour.anchors.find(a => a.id === seg.from)!;
  const toAnchor = contour.anchors.find(a => a.id === seg.to)!;

  // Interpolate position
  const newPos: Vec2 = {
    x: fromAnchor.position.x + (toAnchor.position.x - fromAnchor.position.x) * t,
    y: fromAnchor.position.y + (toAnchor.position.y - fromAnchor.position.y) * t,
  };

  const newAnchor: Anchor = {
    id: generateId(),
    position: newPos,
    handleIn: null,
    handleOut: null,
  };

  // Insert anchor and split segment
  const fromIdx = contour.anchors.findIndex(a => a.id === seg.from);
  const toIdx = contour.anchors.findIndex(a => a.id === seg.to);
  const insertIdx = Math.max(fromIdx, toIdx);
  contour.anchors.splice(insertIdx, 0, newAnchor);

  // Replace segment with two
  contour.segments.splice(segIndex, 1,
    { type: seg.type, from: seg.from, to: newAnchor.id },
    { type: seg.type, from: newAnchor.id, to: seg.to },
  );

  return { ...entity, pathData: pd };
}

export function deleteAnchor(entity: DrawableEntity, contourIndex: number, anchorIndex: number): DrawableEntity {
  if (!entity.pathData) return entity;
  const pd = structuredClone(entity.pathData);
  const contour = pd.contours[contourIndex];
  if (contour.anchors.length <= 2) return entity; // Can't delete below 2

  const anchor = contour.anchors[anchorIndex];
  // Remove anchor
  contour.anchors.splice(anchorIndex, 1);
  // Rebuild segments
  contour.segments = contour.anchors.map((a, i) => {
    const next = contour.anchors[(i + 1) % contour.anchors.length];
    if (!contour.closed && i === contour.anchors.length - 1) return null;
    return { type: 'line' as const, from: a.id, to: next.id };
  }).filter(Boolean) as any;

  return { ...entity, pathData: pd };
}

// ============================================
// CONVERT ENTITY TO EDITABLE PATH
// ============================================

export function ensurePathData(entity: DrawableEntity): DrawableEntity {
  if (entity.pathData) return entity;
  const pd = shapeToPathData(entity);
  if (!pd) return entity;
  return {
    ...entity,
    type: 'path',
    pathData: pd,
    // Keep shape rendering info for fallback
  };
}

// ============================================
// TRANSFORM HANDLES
// ============================================

export function getTransformHandles(
  entities: DrawableEntity[],
  zoom: number,
): TransformHandle[] {
  if (entities.length === 0) return [];

  // Compute combined bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of entities) {
    const b = getEntityBounds(e);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const pad = 8 / zoom; // visual padding

  return [
    { position: { x: minX - pad, y: minY - pad }, cursor: 'nwse-resize', type: 'nw' },
    { position: { x: cx, y: minY - pad }, cursor: 'ns-resize', type: 'n' },
    { position: { x: maxX + pad, y: minY - pad }, cursor: 'nesw-resize', type: 'ne' },
    { position: { x: maxX + pad, y: cy }, cursor: 'ew-resize', type: 'e' },
    { position: { x: maxX + pad, y: maxY + pad }, cursor: 'nwse-resize', type: 'se' },
    { position: { x: cx, y: maxY + pad }, cursor: 'ns-resize', type: 's' },
    { position: { x: minX - pad, y: maxY + pad }, cursor: 'nesw-resize', type: 'sw' },
    { position: { x: minX - pad, y: cy }, cursor: 'ew-resize', type: 'w' },
    { position: { x: cx, y: minY - pad - 20 / zoom }, cursor: 'grab', type: 'rotate' },
  ];
}

export function hitTestTransformHandle(
  handles: TransformHandle[],
  worldPoint: Vec2,
  zoom: number,
): TransformHandle | null {
  const tol = 6 / zoom;
  for (const h of handles) {
    if (dist(worldPoint, h.position) <= tol) return h;
  }
  return null;
}

// ============================================
// SCALE TRANSFORM
// ============================================

export function applyScaleTransform(
  entity: DrawableEntity,
  handle: TransformHandle['type'],
  dx: number, dy: number,
  startBounds: { x: number; y: number; w: number; h: number },
  startData: { tx: number; ty: number; sx: number; sy: number; w?: number; h?: number },
): DrawableEntity {
  let scaleX = 1, scaleY = 1;
  let offsetX = 0, offsetY = 0;

  const { w, h } = startBounds;
  if (w === 0 || h === 0) return entity;

  switch (handle) {
    case 'se': scaleX = (w + dx) / w; scaleY = (h + dy) / h; break;
    case 'nw': scaleX = (w - dx) / w; scaleY = (h - dy) / h; offsetX = dx; offsetY = dy; break;
    case 'ne': scaleX = (w + dx) / w; scaleY = (h - dy) / h; offsetY = dy; break;
    case 'sw': scaleX = (w - dx) / w; scaleY = (h + dy) / h; offsetX = dx; break;
    case 'n': scaleY = (h - dy) / h; offsetY = dy; break;
    case 's': scaleY = (h + dy) / h; break;
    case 'e': scaleX = (w + dx) / w; break;
    case 'w': scaleX = (w - dx) / w; offsetX = dx; break;
    default: return entity;
  }

  // Prevent negative or zero scale
  scaleX = Math.max(0.01, scaleX);
  scaleY = Math.max(0.01, scaleY);

  const newEntity = { ...entity, transform: { ...entity.transform } };

  // For shapes with shapeProps, scale dimensions directly
  if (entity.shapeProps && (entity.shapeKind === 'rectangle' || entity.shapeKind === 'ellipse')) {
    const origW = startData.w ?? entity.shapeProps.width ?? 100;
    const origH = startData.h ?? entity.shapeProps.height ?? 100;
    newEntity.shapeProps = {
      ...entity.shapeProps,
      width: origW * scaleX,
      height: origH * scaleY,
    };
    newEntity.transform.translateX = startData.tx + offsetX;
    newEntity.transform.translateY = startData.ty + offsetY;
  } else {
    // For other entities, modify transform scale
    newEntity.transform.scaleX = startData.sx * scaleX;
    newEntity.transform.scaleY = startData.sy * scaleY;
    newEntity.transform.translateX = startData.tx + offsetX;
    newEntity.transform.translateY = startData.ty + offsetY;
  }

  return newEntity;
}

// ============================================
// ROTATE TRANSFORM
// ============================================

export function applyRotateTransform(
  entity: DrawableEntity,
  origin: Vec2,
  startAngle: number,
  currentAngle: number,
  startRotation: number,
): DrawableEntity {
  const delta = currentAngle - startAngle;
  return {
    ...entity,
    transform: {
      ...entity.transform,
      rotation: startRotation + (delta * 180) / Math.PI,
    },
  };
}
