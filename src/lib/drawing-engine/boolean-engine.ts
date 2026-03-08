// Boolean Engine — Proper polygon clipping using Greiner-Hormann algorithm
// Sprint 2: Replaces bounding-box approximation with real path-path intersection
// Supports: Unite, Subtract (Minus Front/Back), Intersect, Exclude, Divide

import { Vec2, DrawableEntity, Anchor, Contour, PathData, generateId, createDefaultTransform, createDefaultBlend } from './types';
import { cubicBezierPoint } from './geometry-core';

// ============================================
// POLYGON REPRESENTATION
// Flatten all curves to polylines for boolean processing
// ============================================

interface Polygon {
  points: Vec2[];
  closed: boolean;
}

/** Flatten a Contour (with cubic Bézier segments) into a polygon */
function flattenContour(contour: Contour, flatness: number = 1.0): Polygon {
  const points: Vec2[] = [];
  const anchors = contour.anchors;
  if (anchors.length === 0) return { points: [], closed: contour.closed };

  points.push({ ...anchors[0].position });

  const segCount = contour.closed ? anchors.length : anchors.length - 1;
  for (let i = 0; i < segCount; i++) {
    const a0 = anchors[i];
    const a1 = anchors[(i + 1) % anchors.length];

    if (a0.handleOut && a1.handleIn) {
      // Cubic Bézier — adaptive subdivision
      flattenCubic(
        a0.position, a0.handleOut, a1.handleIn, a1.position,
        flatness, points
      );
    } else if (a0.handleOut) {
      // Quadratic approximation
      flattenCubic(
        a0.position, a0.handleOut,
        { x: (a0.handleOut.x + a1.position.x) / 2, y: (a0.handleOut.y + a1.position.y) / 2 },
        a1.position, flatness, points
      );
    } else {
      // Line segment
      points.push({ ...a1.position });
    }
  }

  return { points, closed: contour.closed };
}

function flattenCubic(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  flatness: number, result: Vec2[], depth: number = 0,
) {
  if (depth > 10) {
    result.push({ ...p3 });
    return;
  }

  // Check flatness: max distance of control points from line p0→p3
  const dx = p3.x - p0.x, dy = p3.y - p0.y;
  const len2 = dx * dx + dy * dy;

  if (len2 < 0.001) {
    result.push({ ...p3 });
    return;
  }

  const d1 = Math.abs((p1.x - p0.x) * dy - (p1.y - p0.y) * dx) / Math.sqrt(len2);
  const d2 = Math.abs((p2.x - p0.x) * dy - (p2.y - p0.y) * dx) / Math.sqrt(len2);

  if (d1 + d2 < flatness) {
    result.push({ ...p3 });
    return;
  }

  // De Casteljau subdivision at t=0.5
  const m01 = mid(p0, p1), m12 = mid(p1, p2), m23 = mid(p2, p3);
  const m012 = mid(m01, m12), m123 = mid(m12, m23);
  const m0123 = mid(m012, m123);

  flattenCubic(p0, m01, m012, m0123, flatness, result, depth + 1);
  flattenCubic(m0123, m123, m23, p3, flatness, result, depth + 1);
}

function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ============================================
// GREINER-HORMANN POLYGON CLIPPING
// ============================================

interface GHVertex {
  x: number;
  y: number;
  next: GHVertex | null;
  prev: GHVertex | null;
  intersect: boolean;
  entry: boolean;
  neighbor: GHVertex | null;
  alpha: number;     // parameter along edge where intersection occurs
  visited: boolean;
  originalIndex: number;
}

function createVertex(x: number, y: number, index: number = -1): GHVertex {
  return {
    x, y,
    next: null, prev: null,
    intersect: false,
    entry: false,
    neighbor: null,
    alpha: 0,
    visited: false,
    originalIndex: index,
  };
}

/** Build a doubly-linked list from polygon points */
function buildLinkedList(poly: Vec2[]): GHVertex | null {
  if (poly.length === 0) return null;
  const first = createVertex(poly[0].x, poly[0].y, 0);
  let current = first;

  for (let i = 1; i < poly.length; i++) {
    const v = createVertex(poly[i].x, poly[i].y, i);
    v.prev = current;
    current.next = v;
    current = v;
  }
  // Close the loop
  current.next = first;
  first.prev = current;
  return first;
}

/** Line segment intersection: (p1→p2) ∩ (p3→p4) */
function segmentIntersection(
  p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2,
): { alpha: number; beta: number } | null {
  const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x, dy2 = p4.y - p3.y;
  const denom = dx1 * dy2 - dy1 * dx2;

  if (Math.abs(denom) < 1e-10) return null; // parallel

  const dx3 = p3.x - p1.x, dy3 = p3.y - p1.y;
  const alpha = (dx3 * dy2 - dy3 * dx2) / denom;
  const beta = (dx3 * dy1 - dy3 * dx1) / denom;

  const eps = 1e-8;
  if (alpha > eps && alpha < 1 - eps && beta > eps && beta < 1 - eps) {
    return { alpha, beta };
  }
  return null;
}

/** Insert intersection vertex into linked list between v and v.next */
function insertIntersection(
  v: GHVertex, alpha: number, x: number, y: number,
): GHVertex {
  const iv = createVertex(x, y);
  iv.intersect = true;
  iv.alpha = alpha;

  // Find correct position (sorted by alpha)
  let current = v;
  while (current.next !== v.next!.next && current.next!.intersect && current.next!.alpha < alpha) {
    current = current.next!;
  }

  iv.next = current.next;
  iv.prev = current;
  if (current.next) current.next.prev = iv;
  current.next = iv;

  return iv;
}

/** Phase 1: Find all intersections between two polygons */
function findIntersections(subjHead: GHVertex, clipHead: GHVertex): number {
  let count = 0;
  let s = subjHead;

  do {
    if (!s.intersect) {
      let c = clipHead;
      do {
        if (!c.intersect) {
          const s1 = { x: s.x, y: s.y };
          let sNext = s.next!;
          while (sNext.intersect) sNext = sNext.next!;
          const s2 = { x: sNext.x, y: sNext.y };

          const c1 = { x: c.x, y: c.y };
          let cNext = c.next!;
          while (cNext.intersect) cNext = cNext.next!;
          const c2 = { x: cNext.x, y: cNext.y };

          const inter = segmentIntersection(s1, s2, c1, c2);
          if (inter) {
            const ix = s1.x + inter.alpha * (s2.x - s1.x);
            const iy = s1.y + inter.alpha * (s2.y - s1.y);

            const si = insertIntersection(s, inter.alpha, ix, iy);
            const ci = insertIntersection(c, inter.beta, ix, iy);
            si.neighbor = ci;
            ci.neighbor = si;
            count++;
          }
        }
        c = c.next!;
      } while (c !== clipHead);
    }
    s = s.next!;
  } while (s !== subjHead);

  return count;
}

/** Point-in-polygon test (ray casting) */
function pointInPolygon(px: number, py: number, head: GHVertex): boolean {
  let inside = false;
  let v = head;
  do {
    const next = v.next!;
    if ((v.y > py) !== (next.y > py) &&
        px < ((next.x - v.x) * (py - v.y)) / (next.y - v.y) + v.x) {
      inside = !inside;
    }
    v = next;
  } while (v !== head);
  return inside;
}

/** Phase 2: Mark entry/exit for intersection vertices */
function markEntryExit(subjHead: GHVertex, clipHead: GHVertex, operation: 'union' | 'intersect' | 'subtract') {
  // Determine initial status based on whether subject's first point is inside clip
  let inside = pointInPolygon(subjHead.x, subjHead.y, clipHead);
  
  if (operation === 'subtract') inside = !inside;
  // For union: entry=true when we enter the other polygon (coming from outside)
  // For intersect: entry=true when we enter the other polygon (coming from outside)

  let v = subjHead;
  do {
    if (v.intersect) {
      v.entry = !inside;
      inside = !inside;
    }
    v = v.next!;
  } while (v !== subjHead);

  // Mark clip polygon
  inside = pointInPolygon(clipHead.x, clipHead.y, subjHead);
  if (operation === 'union' || operation === 'subtract') inside = !inside;

  v = clipHead;
  do {
    if (v.intersect) {
      v.entry = !inside;
      inside = !inside;
    }
    v = v.next!;
  } while (v !== clipHead);
}

/** Phase 3: Traverse and collect result polygons */
function collectPolygons(subjHead: GHVertex): Vec2[][] {
  const results: Vec2[][] = [];
  let v = subjHead;

  // Reset visited
  let reset = subjHead;
  do { reset.visited = false; reset = reset.next!; } while (reset !== subjHead);

  do {
    if (v.intersect && !v.visited) {
      const polygon: Vec2[] = [];
      let current = v;
      let useSubject = true;

      do {
        current.visited = true;
        if (current.neighbor) current.neighbor.visited = true;

        if (current.entry) {
          // Walk forward
          do {
            current = current.next!;
            polygon.push({ x: current.x, y: current.y });
            current.visited = true;
            if (current.neighbor) current.neighbor.visited = true;
          } while (!current.intersect);
        } else {
          // Walk backward
          do {
            current = current.prev!;
            polygon.push({ x: current.x, y: current.y });
            current.visited = true;
            if (current.neighbor) current.neighbor.visited = true;
          } while (!current.intersect);
        }

        // Switch to neighbor
        if (current.neighbor) {
          current = current.neighbor;
          useSubject = !useSubject;
        }
      } while (current !== v && polygon.length < 10000);

      if (polygon.length >= 3) {
        results.push(polygon);
      }
    }
    v = v.next!;
  } while (v !== subjHead);

  return results;
}

// ============================================
// PUBLIC BOOLEAN API
// ============================================

function polygonToContour(points: Vec2[]): Contour {
  const anchors: Anchor[] = points.map(p => ({
    id: generateId(),
    position: { x: p.x, y: p.y },
    handleIn: null,
    handleOut: null,
  }));

  const segments = anchors.map((a, i) => ({
    type: 'line' as const,
    from: a.id,
    to: anchors[(i + 1) % anchors.length].id,
  }));

  return { id: generateId(), anchors, segments, closed: true };
}

function entityToPolygons(entity: DrawableEntity): Polygon[] {
  if (entity.pathData) {
    return entity.pathData.contours.map(c => flattenContour(c));
  }

  // Convert shapes to polygons
  const t = entity.transform;
  const p = entity.shapeProps ?? { width: 100, height: 100 };
  const w = p.width ?? 100, h = p.height ?? 100;
  const x = t.translateX, y = t.translateY;

  switch (entity.shapeKind) {
    case 'rectangle':
      return [{
        points: [
          { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
        ],
        closed: true,
      }];
    case 'ellipse': {
      const cx = x + w / 2, cy = y + h / 2;
      const rx = w / 2, ry = h / 2;
      const pts: Vec2[] = [];
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const angle = (Math.PI * 2 * i) / segments;
        pts.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
      }
      return [{ points: pts, closed: true }];
    }
    case 'polygon': {
      const sides = p.sides ?? 6;
      const r = Math.min(w, h) / 2;
      const cx = x + w / 2, cy = y + h / 2;
      const pts: Vec2[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
      return [{ points: pts, closed: true }];
    }
    case 'star': {
      const starPts = p.starPoints ?? 5;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * (p.innerRadius ?? 0.4);
      const cx = x + w / 2, cy = y + h / 2;
      const pts: Vec2[] = [];
      for (let i = 0; i < starPts * 2; i++) {
        const angle = (Math.PI * i) / starPts - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
      return [{ points: pts, closed: true }];
    }
    default:
      return [];
  }
}

function performBoolean(
  entityA: DrawableEntity,
  entityB: DrawableEntity,
  operation: 'union' | 'intersect' | 'subtract' | 'exclude',
): DrawableEntity {
  const polysA = entityToPolygons(entityA);
  const polysB = entityToPolygons(entityB);

  if (polysA.length === 0 || polysB.length === 0) {
    return { ...entityA, pathData: { contours: [] } };
  }

  const resultContours: Contour[] = [];

  // Process each pair of polygons
  for (const pA of polysA) {
    for (const pB of polysB) {
      if (!pA.closed || !pB.closed || pA.points.length < 3 || pB.points.length < 3) continue;

      if (operation === 'exclude') {
        // Exclude = union of (A-B) and (B-A)
        const r1 = clipPolygons(pA.points, pB.points, 'subtract');
        const r2 = clipPolygons(pB.points, pA.points, 'subtract');
        r1.forEach(p => resultContours.push(polygonToContour(p)));
        r2.forEach(p => resultContours.push(polygonToContour(p)));
      } else {
        const results = clipPolygons(pA.points, pB.points, operation);
        results.forEach(p => resultContours.push(polygonToContour(p)));
      }
    }
  }

  // If no intersections were found, handle edge cases
  if (resultContours.length === 0) {
    if (operation === 'union') {
      // Just combine all contours
      const allContours = [
        ...polysA.map(p => polygonToContour(p.points)),
        ...polysB.map(p => polygonToContour(p.points)),
      ];
      return createResultEntity(entityA, allContours, 'Union');
    } else if (operation === 'subtract') {
      return createResultEntity(entityA, polysA.map(p => polygonToContour(p.points)), 'Subtract');
    } else if (operation === 'intersect') {
      // Check containment
      if (polysA[0] && polysB[0] && isPolygonInsidePolygon(polysA[0].points, polysB[0].points)) {
        return createResultEntity(entityA, polysA.map(p => polygonToContour(p.points)), 'Intersect');
      }
      if (polysA[0] && polysB[0] && isPolygonInsidePolygon(polysB[0].points, polysA[0].points)) {
        return createResultEntity(entityA, polysB.map(p => polygonToContour(p.points)), 'Intersect');
      }
      return createResultEntity(entityA, [], 'Intersect');
    }
  }

  const name = operation.charAt(0).toUpperCase() + operation.slice(1);
  return createResultEntity(entityA, resultContours, name);
}

function clipPolygons(polyA: Vec2[], polyB: Vec2[], operation: 'union' | 'intersect' | 'subtract'): Vec2[][] {
  const subjHead = buildLinkedList(polyA);
  const clipHead = buildLinkedList(polyB);

  if (!subjHead || !clipHead) return [];

  const intersectionCount = findIntersections(subjHead, clipHead);

  if (intersectionCount === 0) {
    // No intersections — handle containment
    return [];
  }

  markEntryExit(subjHead, clipHead, operation);
  return collectPolygons(subjHead);
}

function isPolygonInsidePolygon(inner: Vec2[], outer: Vec2[]): boolean {
  if (inner.length === 0) return false;
  // Test if first point of inner is inside outer
  return isPointInPolygon(inner[0], outer);
}

function isPointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if ((polygon[i].y > point.y) !== (polygon[j].y > point.y) &&
        point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x) {
      inside = !inside;
    }
  }
  return inside;
}

function createResultEntity(source: DrawableEntity, contours: Contour[], name: string): DrawableEntity {
  return {
    id: generateId(),
    type: 'path',
    name,
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: createDefaultTransform(),
    blend: { ...source.blend },
    pathData: { contours },
    fill: { ...source.fill },
    stroke: { ...source.stroke },
  };
}

// ============================================
// PATHFINDER OPERATIONS — Public API
// ============================================

/** Unite: merge overlapping shapes into one */
export function pathfinderUnite(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  return performBoolean(a, b, 'union');
}

/** Minus Front: subtract front shape from back */
export function pathfinderMinusFront(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  return performBoolean(a, b, 'subtract');
}

/** Minus Back: subtract back shape from front */
export function pathfinderMinusBack(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  return performBoolean(b, a, 'subtract');
}

/** Intersect: keep only the overlapping area */
export function pathfinderIntersect(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  return performBoolean(a, b, 'intersect');
}

/** Exclude: keep only non-overlapping areas (XOR) */
export function pathfinderExclude(a: DrawableEntity, b: DrawableEntity): DrawableEntity {
  return performBoolean(a, b, 'exclude');
}

/** Divide: split both shapes at all intersection points */
export function pathfinderDivide(a: DrawableEntity, b: DrawableEntity): DrawableEntity[] {
  const intersection = performBoolean(a, b, 'intersect');
  const subtractAB = performBoolean(a, b, 'subtract');
  const subtractBA = performBoolean(b, a, 'subtract');

  return [subtractAB, intersection, subtractBA].filter(
    e => e.pathData && e.pathData.contours.length > 0
  );
}

// ============================================
// SCISSORS TOOL — Cut path at a point
// ============================================

export function scissorsAtPoint(
  entity: DrawableEntity,
  worldPoint: Vec2,
  tolerance: number = 5,
): DrawableEntity[] {
  if (!entity.pathData) return [entity];

  const result: DrawableEntity[] = [];

  for (const contour of entity.pathData.contours) {
    const poly = flattenContour(contour);
    if (poly.points.length < 2) continue;

    // Find closest point on polygon
    let bestDist = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < poly.points.length; i++) {
      const p = poly.points[i];
      const d = Math.sqrt((p.x - worldPoint.x) ** 2 + (p.y - worldPoint.y) ** 2);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestDist > tolerance || bestIdx < 0) {
      // No cut — keep contour as-is
      result.push(createResultEntity(entity, [contour], entity.name));
      continue;
    }

    if (contour.closed) {
      // Open the closed path at the cut point
      const reordered = [
        ...poly.points.slice(bestIdx),
        ...poly.points.slice(0, bestIdx + 1),
      ];
      const newAnchors: Anchor[] = reordered.map(p => ({
        id: generateId(),
        position: { x: p.x, y: p.y },
        handleIn: null,
        handleOut: null,
      }));
      const newContour: Contour = {
        id: generateId(),
        anchors: newAnchors,
        segments: newAnchors.slice(0, -1).map((a, i) => ({
          type: 'line' as const,
          from: a.id,
          to: newAnchors[i + 1].id,
        })),
        closed: false,
      };
      result.push(createResultEntity(entity, [newContour], `${entity.name} (cut)`));
    } else {
      // Split open path into two
      const part1 = poly.points.slice(0, bestIdx + 1);
      const part2 = poly.points.slice(bestIdx);

      if (part1.length >= 2) {
        const anchors1: Anchor[] = part1.map(p => ({
          id: generateId(), position: { ...p }, handleIn: null, handleOut: null,
        }));
        result.push(createResultEntity(entity, [{
          id: generateId(), anchors: anchors1, closed: false,
          segments: anchors1.slice(0, -1).map((a, i) => ({
            type: 'line' as const, from: a.id, to: anchors1[i + 1].id,
          })),
        }], `${entity.name} A`));
      }
      if (part2.length >= 2) {
        const anchors2: Anchor[] = part2.map(p => ({
          id: generateId(), position: { ...p }, handleIn: null, handleOut: null,
        }));
        result.push(createResultEntity(entity, [{
          id: generateId(), anchors: anchors2, closed: false,
          segments: anchors2.slice(0, -1).map((a, i) => ({
            type: 'line' as const, from: a.id, to: anchors2[i + 1].id,
          })),
        }], `${entity.name} B`));
      }
    }
  }

  return result.length > 0 ? result : [entity];
}

// ============================================
// KNIFE TOOL — Freehand cut through objects
// ============================================

export function knifeCut(
  entity: DrawableEntity,
  knifePath: Vec2[],
): DrawableEntity[] {
  if (!entity.pathData || knifePath.length < 2) return [entity];

  // Find intersection points between knife path and entity contours
  const polygons = entityToPolygons(entity);
  if (polygons.length === 0) return [entity];

  const poly = polygons[0];
  if (!poly.closed || poly.points.length < 3) return [entity];

  // Find entry/exit points of knife through the polygon
  const intersections: { polyIdx: number; knifeIdx: number; point: Vec2 }[] = [];

  for (let ki = 0; ki < knifePath.length - 1; ki++) {
    for (let pi = 0; pi < poly.points.length; pi++) {
      const pNext = (pi + 1) % poly.points.length;
      const inter = segmentIntersection(
        knifePath[ki], knifePath[ki + 1],
        poly.points[pi], poly.points[pNext],
      );
      if (inter) {
        const ix = knifePath[ki].x + inter.alpha * (knifePath[ki + 1].x - knifePath[ki].x);
        const iy = knifePath[ki].y + inter.alpha * (knifePath[ki + 1].y - knifePath[ki].y);
        intersections.push({ polyIdx: pi, knifeIdx: ki, point: { x: ix, y: iy } });
      }
    }
  }

  // Need at least 2 intersection points to make a cut
  if (intersections.length < 2) return [entity];

  // Sort by polygon edge index
  intersections.sort((a, b) => a.polyIdx - b.polyIdx || a.knifeIdx - b.knifeIdx);

  // Create two halves using the first pair of intersections
  const [enter, exit] = [intersections[0], intersections[1]];

  // Build two polygons
  const half1: Vec2[] = [];
  const half2: Vec2[] = [];

  // Half 1: from enter to exit along polygon, then knife path back
  for (let i = enter.polyIdx + 1; i !== (exit.polyIdx + 1) % poly.points.length; i = (i + 1) % poly.points.length) {
    half1.push(poly.points[i]);
    if (half1.length > poly.points.length) break;
  }
  half1.unshift(enter.point);
  half1.push(exit.point);

  // Half 2: from exit to enter along polygon, then knife path back
  for (let i = (exit.polyIdx + 1) % poly.points.length; i !== (enter.polyIdx + 1) % poly.points.length; i = (i + 1) % poly.points.length) {
    half2.push(poly.points[i]);
    if (half2.length > poly.points.length) break;
  }
  half2.unshift(exit.point);
  half2.push(enter.point);

  const results: DrawableEntity[] = [];
  if (half1.length >= 3) {
    results.push(createResultEntity(entity, [polygonToContour(half1)], `${entity.name} A`));
  }
  if (half2.length >= 3) {
    results.push(createResultEntity(entity, [polygonToContour(half2)], `${entity.name} B`));
  }

  return results.length > 0 ? results : [entity];
}

// ============================================
// SHAPE BUILDER — Region detection & merge/subtract
// ============================================

export interface ShapeBuilderRegion {
  id: string;
  polygon: Vec2[];
  sourceEntities: string[];
  highlighted: boolean;
}

/** Detect all regions formed by overlapping entities */
export function detectShapeBuilderRegions(entities: DrawableEntity[]): ShapeBuilderRegion[] {
  const regions: ShapeBuilderRegion[] = [];
  const allPolygons = entities.map(e => ({ id: e.id, polygons: entityToPolygons(e) }));

  // For each pair of entities, detect overlapping regions
  for (let i = 0; i < allPolygons.length; i++) {
    for (let j = i + 1; j < allPolygons.length; j++) {
      const a = allPolygons[i];
      const b = allPolygons[j];

      for (const pa of a.polygons) {
        for (const pb of b.polygons) {
          if (!pa.closed || !pb.closed) continue;
          // Try to find intersection region
          const intersectionResults = clipPolygons(pa.points, pb.points, 'intersect');
          for (const ir of intersectionResults) {
            if (ir.length >= 3) {
              regions.push({
                id: generateId(),
                polygon: ir,
                sourceEntities: [a.id, b.id],
                highlighted: false,
              });
            }
          }
        }
      }
    }
  }

  // Also add non-overlapping parts as regions
  for (const entry of allPolygons) {
    for (const poly of entry.polygons) {
      if (!poly.closed) continue;
      regions.push({
        id: generateId(),
        polygon: poly.points,
        sourceEntities: [entry.id],
        highlighted: false,
      });
    }
  }

  return regions;
}

/** Merge selected regions into one shape */
export function mergeRegions(regions: ShapeBuilderRegion[]): Contour {
  // Simple approach: union all polygons
  if (regions.length === 0) return { id: generateId(), anchors: [], segments: [], closed: true };
  if (regions.length === 1) return polygonToContour(regions[0].polygon);

  // Sequential union
  let current = regions[0].polygon;
  for (let i = 1; i < regions.length; i++) {
    const merged = clipPolygons(current, regions[i].polygon, 'union');
    if (merged.length > 0) {
      current = merged[0];
    }
  }

  return polygonToContour(current);
}
