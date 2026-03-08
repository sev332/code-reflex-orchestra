// Transform Engine — Sprint 3: Professional transform tools
// Rotate, Reflect, Scale, Shear with custom origin point
// Free Transform with perspective distort
// Transform Each for independent per-object transforms

import { DrawableEntity, Vec2, BoundingBox, generateId } from './types';
import { getEntityBounds } from './engine';

// ============================================
// TRANSFORM ORIGIN
// ============================================

export type TransformOriginPreset = 
  | 'center' | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface TransformOrigin {
  x: number;
  y: number;
  preset?: TransformOriginPreset;
}

export function getOriginFromPreset(bounds: BoundingBox, preset: TransformOriginPreset): Vec2 {
  const { x, y, width: w, height: h } = bounds;
  switch (preset) {
    case 'top-left': return { x, y };
    case 'top-center': return { x: x + w / 2, y };
    case 'top-right': return { x: x + w, y };
    case 'middle-left': return { x, y: y + h / 2 };
    case 'center': return { x: x + w / 2, y: y + h / 2 };
    case 'middle-right': return { x: x + w, y: y + h / 2 };
    case 'bottom-left': return { x, y: y + h };
    case 'bottom-center': return { x: x + w / 2, y: y + h };
    case 'bottom-right': return { x: x + w, y: y + h };
  }
}

// ============================================
// ROTATE TOOL
// ============================================

export function rotateEntity(
  entity: DrawableEntity,
  angleDeg: number,
  origin: Vec2,
  copy: boolean = false,
): DrawableEntity {
  const bounds = getEntityBounds(entity);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  
  // Rotate center point around origin
  const rad = (angleDeg * Math.PI) / 180;
  const dx = cx - origin.x;
  const dy = cy - origin.y;
  const newCx = origin.x + dx * Math.cos(rad) - dy * Math.sin(rad);
  const newCy = origin.y + dx * Math.sin(rad) + dy * Math.cos(rad);
  
  const result: DrawableEntity = {
    ...entity,
    id: copy ? generateId() : entity.id,
    name: copy ? `${entity.name} copy` : entity.name,
    transform: {
      ...entity.transform,
      translateX: entity.transform.translateX + (newCx - cx),
      translateY: entity.transform.translateY + (newCy - cy),
      rotation: (entity.transform.rotation + angleDeg) % 360,
    },
  };
  return result;
}

// ============================================
// REFLECT TOOL
// ============================================

export type ReflectAxis = 'horizontal' | 'vertical' | 'custom';

export function reflectEntity(
  entity: DrawableEntity,
  axis: ReflectAxis,
  origin: Vec2,
  customAngleDeg?: number,
  copy: boolean = false,
): DrawableEntity {
  const bounds = getEntityBounds(entity);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  
  let newCx = cx, newCy = cy;
  let addRotation = 0;
  
  if (axis === 'horizontal') {
    // Reflect across horizontal axis through origin
    newCy = 2 * origin.y - cy;
    addRotation = -2 * entity.transform.rotation;
  } else if (axis === 'vertical') {
    // Reflect across vertical axis through origin
    newCx = 2 * origin.x - cx;
    addRotation = -2 * entity.transform.rotation;
  } else if (axis === 'custom' && customAngleDeg !== undefined) {
    const rad = (customAngleDeg * Math.PI) / 180;
    const dx = cx - origin.x;
    const dy = cy - origin.y;
    // Reflect point across line through origin at angle
    const cos2 = Math.cos(2 * rad);
    const sin2 = Math.sin(2 * rad);
    newCx = origin.x + dx * cos2 + dy * sin2;
    newCy = origin.y + dx * sin2 - dy * cos2;
    addRotation = 2 * customAngleDeg - 2 * entity.transform.rotation;
  }
  
  return {
    ...entity,
    id: copy ? generateId() : entity.id,
    name: copy ? `${entity.name} reflected` : entity.name,
    transform: {
      ...entity.transform,
      translateX: entity.transform.translateX + (newCx - cx),
      translateY: entity.transform.translateY + (newCy - cy),
      rotation: (entity.transform.rotation + addRotation) % 360,
      scaleX: axis === 'vertical' ? -entity.transform.scaleX : entity.transform.scaleX,
      scaleY: axis === 'horizontal' ? -entity.transform.scaleY : entity.transform.scaleY,
    },
  };
}

// ============================================
// SCALE TOOL (with origin)
// ============================================

export function scaleEntity(
  entity: DrawableEntity,
  scaleX: number,
  scaleY: number,
  origin: Vec2,
  copy: boolean = false,
): DrawableEntity {
  const bounds = getEntityBounds(entity);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  
  // Scale position relative to origin
  const newCx = origin.x + (cx - origin.x) * scaleX;
  const newCy = origin.y + (cy - origin.y) * scaleY;
  
  const newWidth = (entity.shapeProps?.width ?? 100) * Math.abs(scaleX);
  const newHeight = (entity.shapeProps?.height ?? 100) * Math.abs(scaleY);
  
  return {
    ...entity,
    id: copy ? generateId() : entity.id,
    name: copy ? `${entity.name} copy` : entity.name,
    transform: {
      ...entity.transform,
      translateX: newCx - newWidth / 2,
      translateY: newCy - newHeight / 2,
    },
    shapeProps: {
      ...entity.shapeProps,
      width: newWidth,
      height: newHeight,
    },
  };
}

// ============================================
// SHEAR TOOL
// ============================================

export function shearEntity(
  entity: DrawableEntity,
  shearAngleDeg: number,
  axis: 'horizontal' | 'vertical',
  origin: Vec2,
  copy: boolean = false,
): DrawableEntity {
  const shearRad = (shearAngleDeg * Math.PI) / 180;
  const shearValue = Math.tan(shearRad);
  
  return {
    ...entity,
    id: copy ? generateId() : entity.id,
    name: copy ? `${entity.name} sheared` : entity.name,
    transform: {
      ...entity.transform,
      skewX: axis === 'horizontal' ? shearValue * (180 / Math.PI) : entity.transform.skewX,
      skewY: axis === 'vertical' ? shearValue * (180 / Math.PI) : entity.transform.skewY,
    },
  };
}

// ============================================
// FREE TRANSFORM (perspective + distort)
// ============================================

export interface FreeTransformCorners {
  topLeft: Vec2;
  topRight: Vec2;
  bottomLeft: Vec2;
  bottomRight: Vec2;
}

export function computeFreeTransformFromCorners(
  originalBounds: BoundingBox,
  corners: FreeTransformCorners,
): { translateX: number; translateY: number; scaleX: number; scaleY: number; rotation: number; skewX: number; skewY: number } {
  const { x, y, width, height } = originalBounds;
  
  // Compute affine approximation from corner positions
  const newWidth = Math.sqrt(
    (corners.topRight.x - corners.topLeft.x) ** 2 +
    (corners.topRight.y - corners.topLeft.y) ** 2
  );
  const newHeight = Math.sqrt(
    (corners.bottomLeft.x - corners.topLeft.x) ** 2 +
    (corners.bottomLeft.y - corners.topLeft.y) ** 2
  );
  
  const rotation = Math.atan2(
    corners.topRight.y - corners.topLeft.y,
    corners.topRight.x - corners.topLeft.x
  ) * (180 / Math.PI);
  
  const skewX = Math.atan2(
    corners.bottomLeft.x - corners.topLeft.x - (corners.bottomRight.x - corners.topRight.x),
    newHeight
  ) * (180 / Math.PI);
  
  return {
    translateX: corners.topLeft.x,
    translateY: corners.topLeft.y,
    scaleX: newWidth / (width || 1),
    scaleY: newHeight / (height || 1),
    rotation,
    skewX,
    skewY: 0,
  };
}

// ============================================
// TRANSFORM EACH — apply independently to multiple objects
// ============================================

export interface TransformEachOptions {
  scaleX: number;
  scaleY: number;
  rotation: number;
  moveX: number;
  moveY: number;
  reflectX: boolean;
  reflectY: boolean;
  randomize: boolean;
}

export const defaultTransformEachOptions: TransformEachOptions = {
  scaleX: 100,
  scaleY: 100,
  rotation: 0,
  moveX: 0,
  moveY: 0,
  reflectX: false,
  reflectY: false,
  randomize: false,
};

export function transformEach(
  entities: DrawableEntity[],
  options: TransformEachOptions,
): DrawableEntity[] {
  return entities.map(entity => {
    const bounds = getEntityBounds(entity);
    const center: Vec2 = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    
    const rand = options.randomize ? () => Math.random() : () => 1;
    
    let result = entity;
    
    // Scale
    const sx = (options.scaleX / 100) * rand();
    const sy = (options.scaleY / 100) * rand();
    if (sx !== 1 || sy !== 1) {
      result = scaleEntity(result, sx, sy, center);
    }
    
    // Rotate
    const rot = options.rotation * rand();
    if (rot !== 0) {
      result = rotateEntity(result, rot, center);
    }
    
    // Move
    const mx = options.moveX * rand();
    const my = options.moveY * rand();
    if (mx !== 0 || my !== 0) {
      result = {
        ...result,
        transform: {
          ...result.transform,
          translateX: result.transform.translateX + mx,
          translateY: result.transform.translateY + my,
        },
      };
    }
    
    // Reflect
    if (options.reflectX) {
      result = reflectEntity(result, 'vertical', center);
    }
    if (options.reflectY) {
      result = reflectEntity(result, 'horizontal', center);
    }
    
    return result;
  });
}

// ============================================
// TRANSFORM PANEL DATA
// ============================================

export interface TransformPanelData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

export function getTransformPanelData(entity: DrawableEntity): TransformPanelData {
  const bounds = getEntityBounds(entity);
  return {
    x: Math.round(entity.transform.translateX * 100) / 100,
    y: Math.round(entity.transform.translateY * 100) / 100,
    width: Math.round(bounds.width * 100) / 100,
    height: Math.round(bounds.height * 100) / 100,
    rotation: Math.round(entity.transform.rotation * 100) / 100,
    scaleX: Math.round(entity.transform.scaleX * 10000) / 100,
    scaleY: Math.round(entity.transform.scaleY * 10000) / 100,
    skewX: Math.round(entity.transform.skewX * 100) / 100,
    skewY: Math.round(entity.transform.skewY * 100) / 100,
  };
}

export function applyTransformPanelData(
  entity: DrawableEntity,
  data: Partial<TransformPanelData>,
): DrawableEntity {
  const result = { ...entity };
  
  if (data.x !== undefined) result.transform = { ...result.transform, translateX: data.x };
  if (data.y !== undefined) result.transform = { ...result.transform, translateY: data.y };
  if (data.rotation !== undefined) result.transform = { ...result.transform, rotation: data.rotation };
  if (data.skewX !== undefined) result.transform = { ...result.transform, skewX: data.skewX };
  if (data.skewY !== undefined) result.transform = { ...result.transform, skewY: data.skewY };
  
  if (data.width !== undefined || data.height !== undefined) {
    result.shapeProps = {
      ...result.shapeProps,
      ...(data.width !== undefined ? { width: data.width } : {}),
      ...(data.height !== undefined ? { height: data.height } : {}),
    };
  }
  
  return result;
}
