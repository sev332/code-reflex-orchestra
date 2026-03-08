// Drawing Engine Canonical Ontology — v1
// Based on the Ultimate Drawing Engine doctrine

// ============================================
// GEOMETRY PRIMITIVES
// ============================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// PATH ONTOLOGY
// ============================================

export type SegmentType = 'line' | 'quadratic' | 'cubic' | 'arc';

export interface Handle {
  x: number;
  y: number;
}

export interface Anchor {
  id: string;
  position: Vec2;
  handleIn: Handle | null;
  handleOut: Handle | null;
  cornerRadius?: number;
}

export interface Segment {
  type: SegmentType;
  from: string; // anchor id
  to: string;   // anchor id
}

export interface Contour {
  id: string;
  anchors: Anchor[];
  segments: Segment[];
  closed: boolean;
}

export interface PathData {
  contours: Contour[];
}

// ============================================
// STROKE & FILL APPEARANCE
// ============================================

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'miter' | 'round' | 'bevel';

export interface StrokeAppearance {
  color: string;
  width: number;
  opacity: number;
  cap: LineCap;
  join: LineJoin;
  dashArray?: number[];
  dashOffset?: number;
  variableWidth?: { position: number; width: number }[];
}

export type FillType = 'solid' | 'linear-gradient' | 'radial-gradient' | 'pattern' | 'none';

export interface GradientStop {
  offset: number;
  color: string;
}

export interface FillAppearance {
  type: FillType;
  color: string;
  opacity: number;
  gradient?: {
    stops: GradientStop[];
    angle?: number;
    cx?: number;
    cy?: number;
    r?: number;
  };
}

// ============================================
// BRUSH SYSTEM
// ============================================

export interface BrushPreset {
  id: string;
  name: string;
  category: 'pen' | 'pencil' | 'marker' | 'airbrush' | 'ink' | 'custom';
  size: number;
  opacity: number;
  hardness: number;
  spacing: number;
  smoothing: number;
  pressureSizeMap: boolean;
  pressureOpacityMap: boolean;
  tiltEnabled: boolean;
  textureId?: string;
}

export interface BrushStrokePoint {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  timestamp: number;
}

// ============================================
// DRAWABLE ENTITIES
// ============================================

export type TopologyMode = 'isolated' | 'merge' | 'network' | 'region' | 'procedural' | 'symbol';
export type DrawableType = 'path' | 'shape' | 'brush-stroke' | 'text' | 'image' | 'group' | 'symbol';
export type ShapeKind = 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'line' | 'arrow';

export interface Transform {
  translateX: number;
  translateY: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

export interface BlendMode {
  mode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn';
  opacity: number;
}

export interface DrawableEntity {
  id: string;
  type: DrawableType;
  name: string;
  visible: boolean;
  locked: boolean;
  topologyMode: TopologyMode;
  transform: Transform;
  blend: BlendMode;
  
  // Geometry
  pathData?: PathData;
  shapeKind?: ShapeKind;
  shapeProps?: Record<string, number>;
  brushPoints?: BrushStrokePoint[];
  
  // Appearance
  fill: FillAppearance;
  stroke: StrokeAppearance;
  
  // Text
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  
  // Hierarchy
  children?: string[];
  parentId?: string;
}

// ============================================
// LAYER SYSTEM
// ============================================

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  entities: string[];
  collapsed: boolean;
}

// ============================================
// SCENE
// ============================================

export interface Artboard {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
}

export interface Scene {
  entities: Record<string, DrawableEntity>;
  layers: Layer[];
  activeLayerId: string;
  artboards: Artboard[];
  activeArtboardId?: string;
}

// ============================================
// TOOLS
// ============================================

export type ToolId =
  | 'select' | 'direct-select' | 'pen' | 'pencil' | 'brush'
  | 'eraser' | 'shape-rect' | 'shape-ellipse' | 'shape-polygon'
  | 'shape-star' | 'shape-line' | 'text' | 'eyedropper'
  | 'hand' | 'zoom' | 'fill-bucket' | 'gradient';

export interface ToolState {
  activeToolId: ToolId;
  brushPreset: BrushPreset;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  cornerRadius: number;
  sides: number;
  starPoints: number;
  innerRadius: number;
}

// ============================================
// EDITOR STATE
// ============================================

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
  rotation: number;
}

export interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  selectionBounds: BoundingBox | null;
}

export interface SnapGuide {
  type: 'horizontal' | 'vertical' | 'point';
  position: number;
  label?: string;
}

export interface EditorState {
  scene: Scene;
  viewport: ViewportState;
  selection: SelectionState;
  tool: ToolState;
  snapEnabled: boolean;
  gridEnabled: boolean;
  gridSize: number;
  rulerEnabled: boolean;
  guides: SnapGuide[];
}

// ============================================
// COMMANDS (undo/redo)
// ============================================

export interface Command {
  id: string;
  label: string;
  timestamp: number;
  execute: () => void;
  undo: () => void;
}

// ============================================
// DEFAULT FACTORIES
// ============================================

export const createDefaultTransform = (): Transform => ({
  translateX: 0, translateY: 0, rotation: 0,
  scaleX: 1, scaleY: 1, skewX: 0, skewY: 0,
});

export const createDefaultFill = (): FillAppearance => ({
  type: 'solid', color: '#4a9eff', opacity: 1,
});

export const createDefaultStroke = (): StrokeAppearance => ({
  color: '#ffffff', width: 2, opacity: 1,
  cap: 'round', join: 'round',
});

export const createDefaultBlend = (): BlendMode => ({
  mode: 'normal', opacity: 1,
});

let _entityCounter = 0;
export const generateId = () => `entity_${Date.now()}_${++_entityCounter}`;
