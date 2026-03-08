// Drawing Engine — State Manager with Command (Undo/Redo) System
import {
  EditorState, Scene, Layer, DrawableEntity, Command, ViewportState,
  ToolState, SelectionState, ToolId, Vec2, BoundingBox,
  createDefaultTransform, createDefaultFill, createDefaultStroke,
  createDefaultBlend, generateId, BrushPreset,
} from './types';

// ============================================
// DEFAULT STATE FACTORIES
// ============================================

const defaultBrushPreset: BrushPreset = {
  id: 'default-pen',
  name: 'Smooth Pen',
  category: 'pen',
  size: 4,
  opacity: 1,
  hardness: 1,
  spacing: 0.1,
  smoothing: 0.5,
  pressureSizeMap: true,
  pressureOpacityMap: false,
  tiltEnabled: false,
};

const createDefaultToolState = (): ToolState => ({
  activeToolId: 'select',
  brushPreset: defaultBrushPreset,
  fillColor: '#4a9eff',
  strokeColor: '#ffffff',
  strokeWidth: 2,
  fontSize: 24,
  fontFamily: 'Inter',
  cornerRadius: 0,
  sides: 6,
  starPoints: 5,
  innerRadius: 0.4,
});

const createDefaultLayer = (): Layer => ({
  id: generateId(),
  name: 'Layer 1',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'normal',
  entities: [],
  collapsed: false,
});

export const createDefaultScene = (): Scene => {
  const layer = createDefaultLayer();
  return {
    entities: {},
    layers: [layer],
    activeLayerId: layer.id,
    artboards: [{
      id: generateId(),
      name: 'Artboard 1',
      x: 0, y: 0, width: 1920, height: 1080,
      backgroundColor: '#1a1a2e',
    }],
  };
};

export const createDefaultEditorState = (): EditorState => ({
  scene: createDefaultScene(),
  viewport: { panX: 0, panY: 0, zoom: 1, rotation: 0 },
  selection: { selectedIds: [], hoveredId: null, selectionBounds: null },
  tool: createDefaultToolState(),
  snapEnabled: true,
  gridEnabled: true,
  gridSize: 20,
  rulerEnabled: true,
  guides: [],
});

// ============================================
// COMMAND HISTORY
// ============================================

export class CommandHistory {
  private stack: Command[] = [];
  private pointer = -1;
  private maxSize = 200;

  execute(cmd: Command) {
    // Truncate future
    this.stack = this.stack.slice(0, this.pointer + 1);
    cmd.execute();
    this.stack.push(cmd);
    if (this.stack.length > this.maxSize) this.stack.shift();
    else this.pointer++;
  }

  undo(): Command | null {
    if (this.pointer < 0) return null;
    const cmd = this.stack[this.pointer];
    cmd.undo();
    this.pointer--;
    return cmd;
  }

  redo(): Command | null {
    if (this.pointer >= this.stack.length - 1) return null;
    this.pointer++;
    const cmd = this.stack[this.pointer];
    cmd.execute();
    return cmd;
  }

  get canUndo() { return this.pointer >= 0; }
  get canRedo() { return this.pointer < this.stack.length - 1; }
  get currentLabel() { return this.pointer >= 0 ? this.stack[this.pointer].label : null; }
}

// ============================================
// ENTITY OPERATIONS
// ============================================

export function createRectEntity(x: number, y: number, w: number, h: number, fill: string, stroke: string, strokeWidth: number): DrawableEntity {
  return {
    id: generateId(),
    type: 'shape',
    name: 'Rectangle',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: { ...createDefaultTransform(), translateX: x, translateY: y },
    blend: createDefaultBlend(),
    shapeKind: 'rectangle',
    shapeProps: { width: w, height: h },
    fill: { ...createDefaultFill(), color: fill },
    stroke: { ...createDefaultStroke(), color: stroke, width: strokeWidth },
  };
}

export function createEllipseEntity(cx: number, cy: number, rx: number, ry: number, fill: string, stroke: string, strokeWidth: number): DrawableEntity {
  return {
    id: generateId(),
    type: 'shape',
    name: 'Ellipse',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: { ...createDefaultTransform(), translateX: cx - rx, translateY: cy - ry },
    blend: createDefaultBlend(),
    shapeKind: 'ellipse',
    shapeProps: { width: rx * 2, height: ry * 2 },
    fill: { ...createDefaultFill(), color: fill },
    stroke: { ...createDefaultStroke(), color: stroke, width: strokeWidth },
  };
}

export function createLineEntity(x1: number, y1: number, x2: number, y2: number, color: string, width: number): DrawableEntity {
  return {
    id: generateId(),
    type: 'shape',
    name: 'Line',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: createDefaultTransform(),
    blend: createDefaultBlend(),
    shapeKind: 'line',
    shapeProps: { x1, y1, x2, y2 },
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { ...createDefaultStroke(), color, width },
  };
}

export function createBrushStrokeEntity(points: { x: number; y: number; pressure: number }[], color: string, size: number): DrawableEntity {
  return {
    id: generateId(),
    type: 'brush-stroke',
    name: 'Brush Stroke',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: createDefaultTransform(),
    blend: createDefaultBlend(),
    brushPoints: points.map(p => ({ ...p, timestamp: Date.now(), tiltX: 0, tiltY: 0 })),
    fill: { type: 'none', color: 'transparent', opacity: 0 },
    stroke: { ...createDefaultStroke(), color, width: size },
  };
}

export function getEntityBounds(entity: DrawableEntity): BoundingBox {
  const t = entity.transform;
  if (entity.shapeKind === 'line' && entity.shapeProps) {
    const p = entity.shapeProps;
    const minX = Math.min(p.x1, p.x2);
    const minY = Math.min(p.y1, p.y2);
    return { x: minX, y: minY, width: Math.abs(p.x2 - p.x1), height: Math.abs(p.y2 - p.y1) };
  }
  const w = entity.shapeProps?.width ?? 100;
  const h = entity.shapeProps?.height ?? 100;
  return { x: t.translateX, y: t.translateY, width: w, height: h };
}

export function hitTest(entity: DrawableEntity, point: Vec2, tolerance: number = 4): boolean {
  const bounds = getEntityBounds(entity);
  const expanded = {
    x: bounds.x - tolerance,
    y: bounds.y - tolerance,
    width: bounds.width + tolerance * 2,
    height: bounds.height + tolerance * 2,
  };
  return (
    point.x >= expanded.x && point.x <= expanded.x + expanded.width &&
    point.y >= expanded.y && point.y <= expanded.y + expanded.height
  );
}
