// Symbol Engine — Reusable artwork instances with master editing
// Sprint 5: Symbol system

import { DrawableEntity, Vec2, generateId } from './types';

// ============================================
// SYMBOL DEFINITION & INSTANCE
// ============================================

export interface SymbolDef {
  id: string;
  name: string;
  // Master artwork (stored entities)
  masterEntities: DrawableEntity[];
  // Registration point (origin for placement)
  registrationPoint: Vec2;
  // 9-slice scaling config
  nineSlice?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  // Metadata
  createdAt: number;
  usageCount: number;
}

export interface SymbolInstance {
  id: string;
  symbolId: string; // references SymbolDef.id
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
  overrides?: Record<string, Partial<DrawableEntity>>; // per-instance overrides
}

// ============================================
// SYMBOL CREATION & MANAGEMENT
// ============================================

export function createSymbolDef(
  name: string,
  entities: DrawableEntity[],
  registrationPoint?: Vec2,
): SymbolDef {
  // Calculate center of all entities for default registration
  let cx = 0, cy = 0;
  for (const e of entities) {
    cx += e.transform.translateX;
    cy += e.transform.translateY;
  }
  if (entities.length > 0) {
    cx /= entities.length;
    cy /= entities.length;
  }

  return {
    id: generateId(),
    name,
    masterEntities: entities.map(e => ({ ...e })),
    registrationPoint: registrationPoint ?? { x: cx, y: cy },
    createdAt: Date.now(),
    usageCount: 0,
  };
}

export function createSymbolInstance(
  symbolDef: SymbolDef,
  position: Vec2,
  scale: number = 1,
  rotation: number = 0,
): SymbolInstance {
  return {
    id: generateId(),
    symbolId: symbolDef.id,
    transform: {
      x: position.x,
      y: position.y,
      scaleX: scale,
      scaleY: scale,
      rotation,
    },
  };
}

// Convert selection to a symbol, replacing originals with an instance
export function convertToSymbol(
  entities: DrawableEntity[],
  name: string,
): { symbolDef: SymbolDef; instance: SymbolInstance; removedIds: string[] } {
  const symbolDef = createSymbolDef(name, entities);
  const instance = createSymbolInstance(symbolDef, symbolDef.registrationPoint);
  return {
    symbolDef,
    instance,
    removedIds: entities.map(e => e.id),
  };
}

// Break a symbol instance back into editable entities
export function expandInstance(
  instance: SymbolInstance,
  symbolDef: SymbolDef,
): DrawableEntity[] {
  return symbolDef.masterEntities.map(master => {
    const entity: DrawableEntity = {
      ...JSON.parse(JSON.stringify(master)),
      id: generateId(),
      transform: {
        ...master.transform,
        translateX: master.transform.translateX - symbolDef.registrationPoint.x + instance.transform.x,
        translateY: master.transform.translateY - symbolDef.registrationPoint.y + instance.transform.y,
        scaleX: master.transform.scaleX * instance.transform.scaleX,
        scaleY: master.transform.scaleY * instance.transform.scaleY,
        rotation: master.transform.rotation + instance.transform.rotation,
      },
    };
    // Apply per-instance overrides
    if (instance.overrides?.[master.id]) {
      Object.assign(entity, instance.overrides[master.id]);
    }
    return entity;
  });
}

// Update symbol master — all instances auto-reflect changes
export function updateSymbolMaster(
  symbolDef: SymbolDef,
  updatedEntities: DrawableEntity[],
): SymbolDef {
  return {
    ...symbolDef,
    masterEntities: updatedEntities,
  };
}

// ============================================
// SYMBOL LIBRARY
// ============================================

export interface SymbolLibrary {
  symbols: SymbolDef[];
  instances: SymbolInstance[];
}

export const emptySymbolLibrary: SymbolLibrary = {
  symbols: [],
  instances: [],
};

export function addSymbolToLibrary(library: SymbolLibrary, def: SymbolDef): SymbolLibrary {
  return { ...library, symbols: [...library.symbols, def] };
}

export function removeSymbolFromLibrary(library: SymbolLibrary, symbolId: string): SymbolLibrary {
  return {
    symbols: library.symbols.filter(s => s.id !== symbolId),
    instances: library.instances.filter(i => i.symbolId !== symbolId),
  };
}

export function addInstanceToLibrary(library: SymbolLibrary, instance: SymbolInstance): SymbolLibrary {
  return { ...library, instances: [...library.instances, instance] };
}

export function getInstancesOfSymbol(library: SymbolLibrary, symbolId: string): SymbolInstance[] {
  return library.instances.filter(i => i.symbolId === symbolId);
}

// ============================================
// SYMBOL SPRAYER
// ============================================

export interface SprayerConfig {
  symbolId: string;
  density: number; // instances per spray
  radius: number; // spray area radius
  sizeVariance: number; // 0-1, random scale variation
  rotationVariance: number; // 0-360
  scatterMode: 'random' | 'uniform';
}

export const defaultSprayerConfig: SprayerConfig = {
  symbolId: '',
  density: 3,
  radius: 50,
  sizeVariance: 0.3,
  rotationVariance: 45,
  scatterMode: 'random',
};

export function spraySymbol(
  symbolDef: SymbolDef,
  center: Vec2,
  config: SprayerConfig,
): SymbolInstance[] {
  const instances: SymbolInstance[] = [];
  
  for (let i = 0; i < config.density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * config.radius;
    const x = center.x + Math.cos(angle) * dist;
    const y = center.y + Math.sin(angle) * dist;
    
    const scale = 1 + (Math.random() - 0.5) * 2 * config.sizeVariance;
    const rotation = (Math.random() - 0.5) * 2 * config.rotationVariance;
    
    instances.push(createSymbolInstance(symbolDef, { x, y }, scale, rotation));
  }

  return instances;
}

// ============================================
// SYMBOL-ENTITY BRIDGE (for rendering)
// ============================================

// Convert a SymbolInstance to a DrawableEntity for rendering
export function instanceToEntity(
  instance: SymbolInstance,
  symbolDef: SymbolDef,
): DrawableEntity {
  return {
    id: instance.id,
    type: 'symbol',
    name: `${symbolDef.name} instance`,
    visible: true,
    locked: false,
    topologyMode: 'symbol',
    transform: {
      translateX: instance.transform.x,
      translateY: instance.transform.y,
      rotation: instance.transform.rotation,
      scaleX: instance.transform.scaleX,
      scaleY: instance.transform.scaleY,
      skewX: 0,
      skewY: 0,
    },
    blend: { mode: 'normal', opacity: 1 },
    fill: { type: 'solid', color: '#4a9eff', opacity: 1 },
    stroke: { color: '#ffffff', width: 0, opacity: 0, cap: 'round', join: 'round' },
    children: symbolDef.masterEntities.map(e => e.id),
  };
}
