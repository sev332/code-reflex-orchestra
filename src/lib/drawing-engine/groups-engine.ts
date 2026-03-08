// Groups & Isolation Mode Engine
// Sprint 2: Group/Ungroup, nested groups, isolation mode, clipping masks

import { DrawableEntity, generateId, createDefaultTransform, createDefaultBlend, createDefaultFill, createDefaultStroke, BoundingBox } from './types';
import { getEntityBounds } from './engine';

// ============================================
// GROUP OPERATIONS
// ============================================

/** Create a group entity from a set of child entities */
export function createGroup(
  entities: DrawableEntity[],
  name: string = 'Group',
): { group: DrawableEntity; removedIds: string[] } {
  const childIds = entities.map(e => e.id);

  // Compute group bounding box
  const bounds = computeGroupBounds(entities);

  const group: DrawableEntity = {
    id: generateId(),
    type: 'group',
    name,
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: {
      ...createDefaultTransform(),
      translateX: bounds.x,
      translateY: bounds.y,
    },
    blend: createDefaultBlend(),
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { ...createDefaultStroke(), width: 0 },
    children: childIds,
    shapeProps: { width: bounds.width, height: bounds.height },
  };

  // Update children to reference parent
  const updatedEntities = entities.map(e => ({
    ...e,
    parentId: group.id,
  }));

  return { group, removedIds: childIds };
}

/** Ungroup: remove group wrapper, restore children to parent scope */
export function ungroup(
  group: DrawableEntity,
  allEntities: Record<string, DrawableEntity>,
): { restoredEntities: DrawableEntity[]; removedGroupId: string } {
  if (group.type !== 'group' || !group.children) {
    return { restoredEntities: [], removedGroupId: group.id };
  }

  const restoredEntities = group.children
    .map(id => allEntities[id])
    .filter(Boolean)
    .map(e => ({
      ...e,
      parentId: undefined,
    }));

  return { restoredEntities, removedGroupId: group.id };
}

/** Deep ungroup: recursively ungroup all nested groups */
export function deepUngroup(
  group: DrawableEntity,
  allEntities: Record<string, DrawableEntity>,
): DrawableEntity[] {
  if (group.type !== 'group' || !group.children) return [group];

  const result: DrawableEntity[] = [];
  for (const childId of group.children) {
    const child = allEntities[childId];
    if (!child) continue;
    if (child.type === 'group') {
      result.push(...deepUngroup(child, allEntities));
    } else {
      result.push({ ...child, parentId: undefined });
    }
  }
  return result;
}

function computeGroupBounds(entities: DrawableEntity[]): BoundingBox {
  if (entities.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of entities) {
    const b = getEntityBounds(e);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ============================================
// ISOLATION MODE
// ============================================

export interface IsolationState {
  active: boolean;
  groupId: string | null;
  parentChain: string[];    // stack of group IDs for nested isolation
  dimmedEntityIds: string[]; // entities outside the isolated group
}

export const emptyIsolation: IsolationState = {
  active: false,
  groupId: null,
  parentChain: [],
  dimmedEntityIds: [],
};

/** Enter isolation mode for a group */
export function enterIsolation(
  groupId: string,
  allEntities: Record<string, DrawableEntity>,
  layers: { entities: string[] }[],
  currentIsolation: IsolationState,
): IsolationState {
  const group = allEntities[groupId];
  if (!group || group.type !== 'group' || !group.children) return currentIsolation;

  // Compute which entities should be dimmed (everything outside the group)
  const groupChildIds = new Set(group.children);
  const dimmedEntityIds: string[] = [];

  for (const layer of layers) {
    for (const eid of layer.entities) {
      if (!groupChildIds.has(eid) && eid !== groupId) {
        dimmedEntityIds.push(eid);
      }
    }
  }

  return {
    active: true,
    groupId,
    parentChain: currentIsolation.active
      ? [...currentIsolation.parentChain, currentIsolation.groupId!]
      : [],
    dimmedEntityIds,
  };
}

/** Exit isolation mode (go up one level or exit completely) */
export function exitIsolation(
  currentIsolation: IsolationState,
  allEntities: Record<string, DrawableEntity>,
  layers: { entities: string[] }[],
): IsolationState {
  if (!currentIsolation.active) return emptyIsolation;

  if (currentIsolation.parentChain.length > 0) {
    // Go up one level
    const parentId = currentIsolation.parentChain[currentIsolation.parentChain.length - 1];
    return enterIsolation(
      parentId,
      allEntities,
      layers,
      {
        ...currentIsolation,
        parentChain: currentIsolation.parentChain.slice(0, -1),
      },
    );
  }

  return emptyIsolation;
}

// ============================================
// CLIPPING MASKS
// ============================================

export interface ClipGroup {
  clipEntityId: string;    // the shape used as the mask
  contentIds: string[];     // entities being clipped
}

/** Create a clipping mask: top object clips objects below it */
export function createClippingMask(
  entities: DrawableEntity[],
): { clipGroup: ClipGroup; clipEntity: DrawableEntity; contentEntities: DrawableEntity[] } | null {
  if (entities.length < 2) return null;

  // Convention: topmost (last) entity is the clip shape
  const clipEntity = { ...entities[entities.length - 1] };
  const contentEntities = entities.slice(0, -1).map(e => ({
    ...e,
    // Mark as clipped
  }));

  return {
    clipGroup: {
      clipEntityId: clipEntity.id,
      contentIds: contentEntities.map(e => e.id),
    },
    clipEntity,
    contentEntities,
  };
}

/** Render clipped content using canvas clip() */
export function renderClippedContent(
  ctx: CanvasRenderingContext2D,
  clipEntity: DrawableEntity,
  contentEntities: DrawableEntity[],
  vp: { panX: number; panY: number; zoom: number },
  renderEntityFn: (ctx: CanvasRenderingContext2D, entity: DrawableEntity, vp: any, sel: boolean, hov: boolean) => void,
) {
  ctx.save();

  // Build clip path from clipEntity
  const t = clipEntity.transform;
  const wx = (t.translateX + vp.panX) * vp.zoom;
  const wy = (t.translateY + vp.panY) * vp.zoom;
  const p = clipEntity.shapeProps ?? { width: 100, height: 100 };
  const w = (p.width ?? 100) * vp.zoom;
  const h = (p.height ?? 100) * vp.zoom;

  ctx.beginPath();
  switch (clipEntity.shapeKind) {
    case 'ellipse':
      ctx.ellipse(wx + w / 2, wy + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'rectangle':
    default:
      ctx.rect(wx, wy, w, h);
      break;
  }
  ctx.clip();

  // Render content within clip
  for (const entity of contentEntities) {
    renderEntityFn(ctx, entity, vp, false, false);
  }

  ctx.restore();
}

// ============================================
// ARRANGE OPERATIONS
// ============================================

/** Bring entity to front of its layer */
export function bringToFront(layerEntities: string[], entityId: string): string[] {
  const filtered = layerEntities.filter(id => id !== entityId);
  return [...filtered, entityId];
}

/** Send entity to back of its layer */
export function sendToBack(layerEntities: string[], entityId: string): string[] {
  const filtered = layerEntities.filter(id => id !== entityId);
  return [entityId, ...filtered];
}

/** Bring entity forward one position */
export function bringForward(layerEntities: string[], entityId: string): string[] {
  const idx = layerEntities.indexOf(entityId);
  if (idx < 0 || idx >= layerEntities.length - 1) return layerEntities;
  const result = [...layerEntities];
  [result[idx], result[idx + 1]] = [result[idx + 1], result[idx]];
  return result;
}

/** Send entity backward one position */
export function sendBackward(layerEntities: string[], entityId: string): string[] {
  const idx = layerEntities.indexOf(entityId);
  if (idx <= 0) return layerEntities;
  const result = [...layerEntities];
  [result[idx], result[idx - 1]] = [result[idx - 1], result[idx]];
  return result;
}

// ============================================
// ALIGNMENT OPERATIONS
// ============================================

type AlignTarget = 'selection' | 'artboard';

export function alignEntities(
  entities: DrawableEntity[],
  alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
  target: AlignTarget = 'selection',
  artboardBounds?: BoundingBox,
): Map<string, { x: number; y: number }> {
  const moves = new Map<string, { x: number; y: number }>();
  if (entities.length === 0) return moves;

  // Compute reference bounds
  let refBounds: BoundingBox;
  if (target === 'artboard' && artboardBounds) {
    refBounds = artboardBounds;
  } else {
    refBounds = computeGroupBounds(entities);
  }

  for (const e of entities) {
    const b = getEntityBounds(e);
    let newX = e.transform.translateX;
    let newY = e.transform.translateY;

    switch (alignment) {
      case 'left':
        newX = refBounds.x;
        break;
      case 'center-h':
        newX = refBounds.x + (refBounds.width - b.width) / 2;
        break;
      case 'right':
        newX = refBounds.x + refBounds.width - b.width;
        break;
      case 'top':
        newY = refBounds.y;
        break;
      case 'center-v':
        newY = refBounds.y + (refBounds.height - b.height) / 2;
        break;
      case 'bottom':
        newY = refBounds.y + refBounds.height - b.height;
        break;
    }

    moves.set(e.id, { x: newX, y: newY });
  }

  return moves;
}

/** Distribute entities evenly */
export function distributeEntities(
  entities: DrawableEntity[],
  axis: 'horizontal' | 'vertical',
): Map<string, { x: number; y: number }> {
  const moves = new Map<string, { x: number; y: number }>();
  if (entities.length < 3) return moves;

  const boundsMap = entities.map(e => ({ entity: e, bounds: getEntityBounds(e) }));

  if (axis === 'horizontal') {
    boundsMap.sort((a, b) => a.bounds.x - b.bounds.x);
    const totalWidth = boundsMap.reduce((sum, b) => sum + b.bounds.width, 0);
    const totalSpan = boundsMap[boundsMap.length - 1].bounds.x + boundsMap[boundsMap.length - 1].bounds.width - boundsMap[0].bounds.x;
    const gap = (totalSpan - totalWidth) / (boundsMap.length - 1);

    let currentX = boundsMap[0].bounds.x;
    for (const item of boundsMap) {
      moves.set(item.entity.id, { x: currentX, y: item.entity.transform.translateY });
      currentX += item.bounds.width + gap;
    }
  } else {
    boundsMap.sort((a, b) => a.bounds.y - b.bounds.y);
    const totalHeight = boundsMap.reduce((sum, b) => sum + b.bounds.height, 0);
    const totalSpan = boundsMap[boundsMap.length - 1].bounds.y + boundsMap[boundsMap.length - 1].bounds.height - boundsMap[0].bounds.y;
    const gap = (totalSpan - totalHeight) / (boundsMap.length - 1);

    let currentY = boundsMap[0].bounds.y;
    for (const item of boundsMap) {
      moves.set(item.entity.id, { x: item.entity.transform.translateX, y: currentY });
      currentY += item.bounds.height + gap;
    }
  }

  return moves;
}
