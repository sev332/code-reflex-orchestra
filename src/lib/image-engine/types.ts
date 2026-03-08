// Image Editor Core Types

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BrushSettings {
  size: number;
  opacity: number;     // 0-100
  hardness: number;    // 0-100
  spacing: number;     // 1-200 percent
  color: Color;
  flow: number;        // 0-100
  smoothing: number;   // 0-100
}

export interface SelectionMask {
  mask: Uint8ClampedArray;
  bounds: Rect;
  width: number;
  height: number;
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;     // 0-100
  blendMode: BlendMode;
  canvas: HTMLCanvasElement;
  position: Point;
  bounds: Rect;
}

export type SelectionMode = 'new' | 'add' | 'subtract' | 'intersect';

export type ToolId =
  | 'select' | 'move' | 'lasso' | 'magic-wand'
  | 'brush' | 'eraser' | 'clone-stamp' | 'gradient'
  | 'crop' | 'text' | 'shape' | 'eyedropper' | 'hand' | 'zoom';

export const DEFAULT_BRUSH: BrushSettings = {
  size: 10,
  opacity: 100,
  hardness: 80,
  spacing: 25,
  flow: 100,
  smoothing: 50,
  color: { r: 255, g: 255, b: 255, a: 255 },
};

export const DEFAULT_COLOR: Color = { r: 255, g: 255, b: 255, a: 255 };

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
