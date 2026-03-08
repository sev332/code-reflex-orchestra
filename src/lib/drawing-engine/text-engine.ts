/**
 * Text Engine — Point text, area text, text rendering, and text-to-path conversion
 * Sprint 1: Core text creation, rendering, and editing
 */

import { DrawableEntity, Vec2, generateId, createDefaultTransform, createDefaultBlend, createDefaultFill, createDefaultStroke } from './types';

// ============================================
// TEXT TYPES
// ============================================

export type TextAlignment = 'left' | 'center' | 'right';
export type TextBaseline = 'top' | 'middle' | 'alphabetic' | 'bottom';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle: 'normal' | 'italic' | 'oblique';
  letterSpacing: number;   // tracking in px
  lineHeight: number;      // multiplier (e.g., 1.4)
  textAlign: TextAlignment;
  textDecoration: 'none' | 'underline' | 'line-through';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 24,
  fontWeight: 400,
  fontStyle: 'normal',
  letterSpacing: 0,
  lineHeight: 1.4,
  textAlign: 'left',
  textDecoration: 'none',
  textTransform: 'none',
};

// ============================================
// FONT REGISTRY — Available system & web fonts
// ============================================

export interface FontEntry {
  family: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  weights: number[];
}

export const BUILT_IN_FONTS: FontEntry[] = [
  { family: 'Inter', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'system-ui', category: 'sans-serif', weights: [400, 700] },
  { family: 'Georgia', category: 'serif', weights: [400, 700] },
  { family: 'Times New Roman', category: 'serif', weights: [400, 700] },
  { family: 'Courier New', category: 'monospace', weights: [400, 700] },
  { family: 'Arial', category: 'sans-serif', weights: [400, 700] },
  { family: 'Helvetica', category: 'sans-serif', weights: [300, 400, 700] },
  { family: 'Verdana', category: 'sans-serif', weights: [400, 700] },
  { family: 'Trebuchet MS', category: 'sans-serif', weights: [400, 700] },
  { family: 'Impact', category: 'display', weights: [400] },
  { family: 'Comic Sans MS', category: 'handwriting', weights: [400, 700] },
  { family: 'Palatino Linotype', category: 'serif', weights: [400, 700] },
  { family: 'Lucida Console', category: 'monospace', weights: [400] },
  { family: 'Tahoma', category: 'sans-serif', weights: [400, 700] },
  { family: 'Garamond', category: 'serif', weights: [400, 700] },
];

// ============================================
// TEXT ENTITY CREATION
// ============================================

export function createPointTextEntity(
  x: number, y: number,
  text: string,
  style: Partial<TextStyle> = {},
  fill: string = '#ffffff',
): DrawableEntity {
  const s = { ...DEFAULT_TEXT_STYLE, ...style };
  return {
    id: generateId(),
    type: 'text',
    name: text.substring(0, 20) || 'Text',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: { ...createDefaultTransform(), translateX: x, translateY: y },
    blend: createDefaultBlend(),
    fill: { ...createDefaultFill(), color: fill },
    stroke: { ...createDefaultStroke(), width: 0 },
    textContent: text,
    fontSize: s.fontSize,
    fontFamily: s.fontFamily,
    shapeProps: {
      // Store text-specific props in shapeProps
      fontWeight: typeof s.fontWeight === 'number' ? s.fontWeight : 400,
      letterSpacing: s.letterSpacing,
      lineHeight: s.lineHeight,
      // area text dimensions (0 = point text)
      textWidth: 0,
      textHeight: 0,
    },
  };
}

export function createAreaTextEntity(
  x: number, y: number,
  width: number, height: number,
  text: string,
  style: Partial<TextStyle> = {},
  fill: string = '#ffffff',
): DrawableEntity {
  const s = { ...DEFAULT_TEXT_STYLE, ...style };
  return {
    id: generateId(),
    type: 'text',
    name: text.substring(0, 20) || 'Area Text',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: { ...createDefaultTransform(), translateX: x, translateY: y },
    blend: createDefaultBlend(),
    fill: { ...createDefaultFill(), color: fill },
    stroke: { ...createDefaultStroke(), width: 0 },
    textContent: text,
    fontSize: s.fontSize,
    fontFamily: s.fontFamily,
    shapeProps: {
      width,
      height,
      fontWeight: typeof s.fontWeight === 'number' ? s.fontWeight : 400,
      letterSpacing: s.letterSpacing,
      lineHeight: s.lineHeight,
      textWidth: width,
      textHeight: height,
    },
  };
}

// ============================================
// TEXT MEASUREMENT
// ============================================

let _measureCanvas: HTMLCanvasElement | null = null;
let _measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    _measureCanvas = document.createElement('canvas');
    _measureCtx = _measureCanvas.getContext('2d')!;
  }
  return _measureCtx;
}

export function measureText(
  text: string,
  style: Partial<TextStyle> = {},
): { width: number; height: number; lines: string[] } {
  const s = { ...DEFAULT_TEXT_STYLE, ...style };
  const ctx = getMeasureCtx();
  ctx.font = buildCSSFont(s);

  const lines = text.split('\n');
  let maxWidth = 0;
  for (const line of lines) {
    const m = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, m.width);
  }

  const lineHeightPx = s.fontSize * s.lineHeight;
  return {
    width: maxWidth + (s.letterSpacing * text.length),
    height: lineHeightPx * lines.length,
    lines,
  };
}

export function wrapText(
  text: string,
  maxWidth: number,
  style: Partial<TextStyle> = {},
): string[] {
  const s = { ...DEFAULT_TEXT_STYLE, ...style };
  const ctx = getMeasureCtx();
  ctx.font = buildCSSFont(s);

  const paragraphs = text.split('\n');
  const result: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) { result.push(''); continue; }
    const words = paragraph.split(' ');
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        result.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    result.push(currentLine);
  }

  return result;
}

export function buildCSSFont(style: Partial<TextStyle>): string {
  const s = { ...DEFAULT_TEXT_STYLE, ...style };
  const italic = s.fontStyle !== 'normal' ? `${s.fontStyle} ` : '';
  const weight = s.fontWeight !== 400 ? `${s.fontWeight} ` : '';
  return `${italic}${weight}${s.fontSize}px ${s.fontFamily}`;
}

// ============================================
// TEXT RENDERING — Render text entities to Canvas2D
// ============================================

export function renderTextEntity(
  ctx: CanvasRenderingContext2D,
  entity: DrawableEntity,
  vp: { panX: number; panY: number; zoom: number },
  isSelected: boolean,
  isHovered: boolean,
) {
  if (!entity.textContent) return;
  const t = entity.transform;
  const zoom = vp.zoom;
  const wx = (t.translateX + vp.panX) * zoom;
  const wy = (t.translateY + vp.panY) * zoom;
  const fontSize = (entity.fontSize ?? 24) * zoom;
  const fontFamily = entity.fontFamily ?? 'Inter, system-ui, sans-serif';
  const fontWeight = entity.shapeProps?.fontWeight ?? 400;
  const letterSpacing = (entity.shapeProps?.letterSpacing ?? 0) * zoom;
  const lineHeight = entity.shapeProps?.lineHeight ?? 1.4;
  const textWidth = (entity.shapeProps?.textWidth ?? 0) * zoom;
  const textHeight = (entity.shapeProps?.textHeight ?? 0) * zoom;

  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.globalAlpha = entity.blend.opacity;

  // Build font
  const fontStr = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.font = fontStr;
  ctx.fillStyle = entity.fill.color;
  ctx.textBaseline = 'top';

  const isAreaText = textWidth > 0 && textHeight > 0;
  const lineHeightPx = fontSize * lineHeight;

  let lines: string[];
  if (isAreaText) {
    // Wrap text within area
    lines = wrapText(entity.textContent, textWidth / zoom, {
      fontSize: entity.fontSize ?? 24,
      fontFamily,
      fontWeight,
      letterSpacing: entity.shapeProps?.letterSpacing ?? 0,
    });

    // Clip to area
    ctx.beginPath();
    ctx.rect(0, 0, textWidth, textHeight);
    ctx.clip();
  } else {
    lines = entity.textContent.split('\n');
  }

  // Draw each line
  if (entity.fill.type !== 'none') {
    ctx.fillStyle = entity.fill.color;
    ctx.globalAlpha *= entity.fill.opacity;
    for (let i = 0; i < lines.length; i++) {
      if (letterSpacing !== 0) {
        drawTextWithLetterSpacing(ctx, lines[i], 0, i * lineHeightPx, letterSpacing);
      } else {
        ctx.fillText(lines[i], 0, i * lineHeightPx);
      }
    }
  }

  // Stroke text
  if (entity.stroke.width > 0) {
    ctx.strokeStyle = entity.stroke.color;
    ctx.lineWidth = entity.stroke.width * zoom;
    ctx.globalAlpha = entity.blend.opacity * entity.stroke.opacity;
    for (let i = 0; i < lines.length; i++) {
      ctx.strokeText(lines[i], 0, i * lineHeightPx);
    }
  }

  ctx.restore();

  // Selection/hover overlay
  if (isSelected || isHovered) {
    const measuredSize = measureText(entity.textContent, {
      fontSize: entity.fontSize ?? 24,
      fontFamily,
      fontWeight,
    });
    const boxW = isAreaText ? textWidth : measuredSize.width * zoom;
    const boxH = isAreaText ? textHeight : measuredSize.height * zoom;
    ctx.save();
    ctx.strokeStyle = isSelected ? 'hsl(193,100%,50%)' : 'hsla(193,100%,50%,0.4)';
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.setLineDash(isSelected ? [] : [4, 4]);
    ctx.strokeRect(wx - 2, wy - 2, boxW + 4, boxH + 4);
    ctx.restore();
  }
}

function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  spacing: number,
) {
  let currentX = x;
  for (const char of text) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + spacing;
  }
}

// ============================================
// TEXT BOUNDS
// ============================================

export function getTextBounds(entity: DrawableEntity): { width: number; height: number } {
  if (!entity.textContent) return { width: 100, height: 30 };
  const textWidth = entity.shapeProps?.textWidth ?? 0;
  const textHeight = entity.shapeProps?.textHeight ?? 0;
  if (textWidth > 0 && textHeight > 0) {
    return { width: textWidth, height: textHeight };
  }
  const measured = measureText(entity.textContent, {
    fontSize: entity.fontSize ?? 24,
    fontFamily: entity.fontFamily,
    fontWeight: entity.shapeProps?.fontWeight ?? 400,
  });
  return { width: measured.width, height: measured.height };
}
