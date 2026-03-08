// Path Operations — Boolean ops, simplify, offset, reverse
import { DrawableEntity, PathData, Anchor, Contour, Vec2, generateId, createDefaultTransform, createDefaultBlend, createDefaultFill, createDefaultStroke } from './types';
import { getEntityBounds } from './engine';

// ============================================
// PATH SIMPLIFY — Ramer-Douglas-Peucker
// ============================================

function perpDist(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

function rdpSimplify(points: Vec2[], epsilon: number): Vec2[] {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

export function simplifyPath(entity: DrawableEntity, tolerance: number = 2): DrawableEntity {
  if (!entity.pathData) return entity;
  const pd = structuredClone(entity.pathData);

  for (const contour of pd.contours) {
    const points = contour.anchors.map(a => a.position);
    const simplified = rdpSimplify(points, tolerance);
    contour.anchors = simplified.map(p => ({
      id: generateId(),
      position: p,
      handleIn: null,
      handleOut: null,
    }));
    // Rebuild segments
    contour.segments = contour.anchors.map((a, i) => {
      const next = contour.anchors[(i + 1) % contour.anchors.length];
      if (!contour.closed && i === contour.anchors.length - 1) return null;
      return { type: 'line' as const, from: a.id, to: next.id };
    }).filter(Boolean) as any;
  }

  return { ...entity, pathData: pd };
}

// ============================================
// REVERSE PATH
// ============================================

export function reversePath(entity: DrawableEntity): DrawableEntity {
  if (!entity.pathData) return entity;
  const pd = structuredClone(entity.pathData);

  for (const contour of pd.contours) {
    contour.anchors.reverse();
    // Swap handles
    for (const anchor of contour.anchors) {
      const temp = anchor.handleIn;
      anchor.handleIn = anchor.handleOut;
      anchor.handleOut = temp;
    }
    // Rebuild segments
    contour.segments = contour.anchors.map((a, i) => {
      const next = contour.anchors[(i + 1) % contour.anchors.length];
      if (!contour.closed && i === contour.anchors.length - 1) return null;
      return { type: 'line' as const, from: a.id, to: next.id };
    }).filter(Boolean) as any;
  }

  return { ...entity, pathData: pd };
}

// ============================================
// OFFSET PATH — Parallel curve approximation
// ============================================

export function offsetPath(entity: DrawableEntity, distance: number): DrawableEntity {
  if (!entity.pathData) return entity;
  const pd = structuredClone(entity.pathData);

  for (const contour of pd.contours) {
    const anchors = contour.anchors;
    if (anchors.length < 2) continue;

    for (let i = 0; i < anchors.length; i++) {
      const prev = anchors[(i - 1 + anchors.length) % anchors.length];
      const curr = anchors[i];
      const next = anchors[(i + 1) % anchors.length];

      // Compute normal at this point
      let nx: number, ny: number;
      if (!contour.closed && i === 0) {
        const dx = next.position.x - curr.position.x;
        const dy = next.position.y - curr.position.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / len; ny = dx / len;
      } else if (!contour.closed && i === anchors.length - 1) {
        const dx = curr.position.x - prev.position.x;
        const dy = curr.position.y - prev.position.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / len; ny = dx / len;
      } else {
        const dx1 = curr.position.x - prev.position.x;
        const dy1 = curr.position.y - prev.position.y;
        const dx2 = next.position.x - curr.position.x;
        const dy2 = next.position.y - curr.position.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
        nx = -(dy1 / len1 + dy2 / len2) / 2;
        ny = (dx1 / len1 + dx2 / len2) / 2;
        const nlen = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= nlen; ny /= nlen;
      }

      curr.position.x += nx * distance;
      curr.position.y += ny * distance;
      if (curr.handleIn) { curr.handleIn.x += nx * distance; curr.handleIn.y += ny * distance; }
      if (curr.handleOut) { curr.handleOut.x += nx * distance; curr.handleOut.y += ny * distance; }
    }
  }

  return { ...entity, pathData: pd };
}

// ============================================
// BOOLEAN OPERATIONS (Bounding-box approximation)
// Uses geometric sampling for visual accuracy
// ============================================

function boundsOverlap(a: DrawableEntity, b: DrawableEntity): boolean {
  const ba = getEntityBounds(a);
  const bb = getEntityBounds(b);
  return !(ba.x + ba.width < bb.x || bb.x + bb.width < ba.x ||
           ba.y + ba.height < bb.y || bb.y + bb.height < ba.y);
}

export function booleanUnion(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  // Merge: combine all contours from both paths
  const pdA = a.pathData ?? { contours: [] };
  const pdB = b.pathData ?? { contours: [] };

  const combinedContours = [
    ...structuredClone(pdA.contours),
    ...structuredClone(pdB.contours),
  ];

  const bounds1 = getEntityBounds(a);
  const bounds2 = getEntityBounds(b);
  const minX = Math.min(bounds1.x, bounds2.x);
  const minY = Math.min(bounds1.y, bounds2.y);
  const maxX = Math.max(bounds1.x + bounds1.width, bounds2.x + bounds2.width);
  const maxY = Math.max(bounds1.y + bounds1.height, bounds2.y + bounds2.height);

  return {
    id: generateId(),
    type: 'path',
    name: 'Union',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: createDefaultTransform(),
    blend: createDefaultBlend(),
    pathData: { contours: combinedContours },
    fill: { ...a.fill },
    stroke: { ...a.stroke },
  };
}

export function booleanSubtract(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  // Simplified: keep A's contours, add B's contours reversed (for hole)
  const pdA = a.pathData ?? { contours: [] };
  const pdB = b.pathData ?? { contours: [] };

  const reversedB = structuredClone(pdB.contours).map(c => {
    c.anchors.reverse();
    for (const anchor of c.anchors) {
      const temp = anchor.handleIn;
      anchor.handleIn = anchor.handleOut;
      anchor.handleOut = temp;
    }
    return c;
  });

  return {
    id: generateId(),
    type: 'path',
    name: 'Subtract',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: createDefaultTransform(),
    blend: createDefaultBlend(),
    pathData: { contours: [...structuredClone(pdA.contours), ...reversedB] },
    fill: { ...a.fill },
    stroke: { ...a.stroke },
  };
}

export function booleanIntersect(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  // Simplified: create new rect from intersection bounds
  const ba = getEntityBounds(a);
  const bb = getEntityBounds(b);
  const x = Math.max(ba.x, bb.x);
  const y = Math.max(ba.y, bb.y);
  const x2 = Math.min(ba.x + ba.width, bb.x + bb.width);
  const y2 = Math.min(ba.y + ba.height, bb.y + bb.height);

  if (x2 <= x || y2 <= y) {
    // No intersection
    return { ...a, pathData: { contours: [] } };
  }

  const w = x2 - x, h = y2 - y;
  const anchors: Anchor[] = [
    { id: generateId(), position: { x, y }, handleIn: null, handleOut: null },
    { id: generateId(), position: { x: x + w, y }, handleIn: null, handleOut: null },
    { id: generateId(), position: { x: x + w, y: y + h }, handleIn: null, handleOut: null },
    { id: generateId(), position: { x, y: y + h }, handleIn: null, handleOut: null },
  ];

  return {
    id: generateId(),
    type: 'path',
    name: 'Intersect',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: createDefaultTransform(),
    blend: createDefaultBlend(),
    pathData: {
      contours: [{
        id: generateId(), anchors, closed: true,
        segments: anchors.map((a, i) => ({
          type: 'line' as const,
          from: a.id, to: anchors[(i + 1) % anchors.length].id,
        })),
      }],
    },
    fill: { ...a.fill },
    stroke: { ...a.stroke },
  };
}
