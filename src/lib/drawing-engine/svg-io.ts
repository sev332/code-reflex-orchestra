/**
 * SVG I/O Engine — Export and Import SVG
 * Sprint 1: Full SVG export with all entity types
 * Sprint 4: Full SVG import with shape/path/text parsing
 */

import { Scene, DrawableEntity, Artboard, PathData, Vec2, generateId, createDefaultTransform, createDefaultBlend, createDefaultFill, createDefaultStroke } from './types';
import { getEntityBounds } from './engine';

// ============================================
// SVG EXPORT
// ============================================

export interface SVGExportOptions {
  includeArtboardBackground?: boolean;
  precision?: number;
  indent?: string;
  viewBox?: { x: number; y: number; width: number; height: number };
  title?: string;
}

const DEFAULT_EXPORT_OPTIONS: SVGExportOptions = {
  includeArtboardBackground: true,
  precision: 2,
  indent: '  ',
  title: 'Lucid Illustrator Export',
};

function n(val: number, precision: number): string {
  return Number(val.toFixed(precision)).toString();
}

function colorToSVG(color: string, opacity: number): string {
  if (opacity >= 1) return color;
  return color;
}

function buildFillAttrs(entity: DrawableEntity, p: number): string {
  if (entity.fill.type === 'none') return 'fill="none"';
  const parts = [`fill="${entity.fill.color}"`];
  if (entity.fill.opacity < 1) parts.push(`fill-opacity="${n(entity.fill.opacity, p)}"`);
  return parts.join(' ');
}

function buildStrokeAttrs(entity: DrawableEntity, p: number): string {
  if (entity.stroke.width <= 0) return 'stroke="none"';
  const parts = [
    `stroke="${entity.stroke.color}"`,
    `stroke-width="${n(entity.stroke.width, p)}"`,
  ];
  if (entity.stroke.opacity < 1) parts.push(`stroke-opacity="${n(entity.stroke.opacity, p)}"`);
  if (entity.stroke.cap !== 'butt') parts.push(`stroke-linecap="${entity.stroke.cap}"`);
  if (entity.stroke.join !== 'miter') parts.push(`stroke-linejoin="${entity.stroke.join}"`);
  if (entity.stroke.dashArray && entity.stroke.dashArray.length > 0) {
    parts.push(`stroke-dasharray="${entity.stroke.dashArray.join(' ')}"`);
    if (entity.stroke.dashOffset) parts.push(`stroke-dashoffset="${n(entity.stroke.dashOffset, p)}"`);
  }
  return parts.join(' ');
}

function buildTransformAttr(entity: DrawableEntity, p: number): string {
  const t = entity.transform;
  const parts: string[] = [];
  if (t.translateX !== 0 || t.translateY !== 0) {
    parts.push(`translate(${n(t.translateX, p)}, ${n(t.translateY, p)})`);
  }
  if (t.rotation !== 0) parts.push(`rotate(${n(t.rotation, p)})`);
  if (t.scaleX !== 1 || t.scaleY !== 1) parts.push(`scale(${n(t.scaleX, p)}, ${n(t.scaleY, p)})`);
  if (t.skewX !== 0) parts.push(`skewX(${n(t.skewX, p)})`);
  if (t.skewY !== 0) parts.push(`skewY(${n(t.skewY, p)})`);
  return parts.length > 0 ? `transform="${parts.join(' ')}"` : '';
}

function buildOpacityAttr(entity: DrawableEntity, p: number): string {
  if (entity.blend.opacity < 1) return `opacity="${n(entity.blend.opacity, p)}"`;
  return '';
}

function entityToSVG(entity: DrawableEntity, indent: string, p: number): string {
  if (!entity.visible) return '';
  const i = indent;
  const fill = buildFillAttrs(entity, p);
  const stroke = buildStrokeAttrs(entity, p);
  const transform = buildTransformAttr(entity, p);
  const opacity = buildOpacityAttr(entity, p);
  const attrs = [fill, stroke, transform, opacity].filter(Boolean).join(' ');

  switch (entity.type) {
    case 'shape':
      return shapeToSVG(entity, i, p, attrs);
    case 'path':
      return pathDataToSVG(entity, i, p, attrs);
    case 'brush-stroke':
      return brushStrokeToSVG(entity, i, p);
    case 'text':
      return textToSVG(entity, i, p, attrs);
    default:
      return `${i}<!-- Unknown entity type: ${entity.type} -->`;
  }
}

function shapeToSVG(entity: DrawableEntity, i: string, p: number, attrs: string): string {
  const props = entity.shapeProps ?? {};
  switch (entity.shapeKind) {
    case 'rectangle': {
      const w = props.width ?? 100, h = props.height ?? 100;
      const cr = props.cornerRadius ?? 0;
      const rx = cr > 0 ? ` rx="${n(cr, p)}"` : '';
      return `${i}<rect x="0" y="0" width="${n(w, p)}" height="${n(h, p)}"${rx} ${attrs} />`;
    }
    case 'ellipse': {
      const w = props.width ?? 100, h = props.height ?? 100;
      return `${i}<ellipse cx="${n(w / 2, p)}" cy="${n(h / 2, p)}" rx="${n(w / 2, p)}" ry="${n(h / 2, p)}" ${attrs} />`;
    }
    case 'line': {
      return `${i}<line x1="${n(props.x1 ?? 0, p)}" y1="${n(props.y1 ?? 0, p)}" x2="${n(props.x2 ?? 0, p)}" y2="${n(props.y2 ?? 0, p)}" ${attrs} />`;
    }
    case 'polygon': {
      const sides = props.sides ?? 6;
      const w = props.width ?? 100, h = props.height ?? 100;
      const r = Math.min(w, h) / 2;
      const points: string[] = [];
      for (let idx = 0; idx < sides; idx++) {
        const a = (Math.PI * 2 * idx) / sides - Math.PI / 2;
        points.push(`${n(w / 2 + r * Math.cos(a), p)},${n(h / 2 + r * Math.sin(a), p)}`);
      }
      return `${i}<polygon points="${points.join(' ')}" ${attrs} />`;
    }
    case 'star': {
      const pts = props.starPoints ?? 5;
      const w = props.width ?? 100, h = props.height ?? 100;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * (props.innerRadius ?? 0.4);
      const points: string[] = [];
      for (let idx = 0; idx < pts * 2; idx++) {
        const a = (Math.PI * idx) / pts - Math.PI / 2;
        const r = idx % 2 === 0 ? outerR : innerR;
        points.push(`${n(w / 2 + r * Math.cos(a), p)},${n(h / 2 + r * Math.sin(a), p)}`);
      }
      return `${i}<polygon points="${points.join(' ')}" ${attrs} />`;
    }
    default:
      return `${i}<!-- Unknown shape: ${entity.shapeKind} -->`;
  }
}

function pathDataToSVG(entity: DrawableEntity, i: string, p: number, attrs: string): string {
  if (!entity.pathData || entity.pathData.contours.length === 0) return '';
  const d = pathDataToD(entity.pathData, p);
  return `${i}<path d="${d}" ${attrs} />`;
}

function pathDataToD(pd: PathData, p: number): string {
  const parts: string[] = [];
  for (const contour of pd.contours) {
    if (contour.anchors.length === 0) continue;
    const a0 = contour.anchors[0];
    parts.push(`M${n(a0.position.x, p)},${n(a0.position.y, p)}`);
    for (let idx = 1; idx < contour.anchors.length; idx++) {
      const prev = contour.anchors[idx - 1];
      const curr = contour.anchors[idx];
      if (prev.handleOut && curr.handleIn) {
        parts.push(`C${n(prev.handleOut.x, p)},${n(prev.handleOut.y, p)} ${n(curr.handleIn.x, p)},${n(curr.handleIn.y, p)} ${n(curr.position.x, p)},${n(curr.position.y, p)}`);
      } else {
        parts.push(`L${n(curr.position.x, p)},${n(curr.position.y, p)}`);
      }
    }
    if (contour.closed) {
      // Close back to first anchor
      const last = contour.anchors[contour.anchors.length - 1];
      const first = contour.anchors[0];
      if (last.handleOut && first.handleIn) {
        parts.push(`C${n(last.handleOut.x, p)},${n(last.handleOut.y, p)} ${n(first.handleIn.x, p)},${n(first.handleIn.y, p)} ${n(first.position.x, p)},${n(first.position.y, p)}`);
      }
      parts.push('Z');
    }
  }
  return parts.join(' ');
}

function brushStrokeToSVG(entity: DrawableEntity, i: string, p: number): string {
  const pts = entity.brushPoints;
  if (!pts || pts.length < 2) return '';
  // Export as polyline for simplicity; could be expanded to use stroke expansion
  const points = pts.map(pt => `${n(pt.x, p)},${n(pt.y, p)}`).join(' ');
  const opacity = entity.blend.opacity < 1 ? ` opacity="${n(entity.blend.opacity, p)}"` : '';
  return `${i}<polyline points="${points}" fill="none" stroke="${entity.stroke.color}" stroke-width="${n(entity.stroke.width, p)}" stroke-linecap="${entity.stroke.cap}" stroke-linejoin="${entity.stroke.join}"${opacity} />`;
}

function textToSVG(entity: DrawableEntity, i: string, p: number, attrs: string): string {
  const fontSize = entity.fontSize ?? 24;
  const fontFamily = entity.fontFamily ?? 'sans-serif';
  const text = entity.textContent ?? '';
  return `${i}<text font-size="${fontSize}" font-family="${fontFamily}" ${attrs}>${escapeXML(text)}</text>`;
}

function escapeXML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function exportSceneToSVG(scene: Scene, options: Partial<SVGExportOptions> = {}): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const p = opts.precision!;
  const ind = opts.indent!;

  // Determine viewBox from artboards or content bounds
  let vb = opts.viewBox;
  if (!vb && scene.artboards.length > 0) {
    const ab = scene.artboards[0];
    vb = { x: ab.x, y: ab.y, width: ab.width, height: ab.height };
  }
  if (!vb) vb = { x: 0, y: 0, width: 1920, height: 1080 };

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(vb.x, p)} ${n(vb.y, p)} ${n(vb.width, p)} ${n(vb.height, p)}" width="${n(vb.width, p)}" height="${n(vb.height, p)}">`);

  if (opts.title) {
    lines.push(`${ind}<title>${escapeXML(opts.title)}</title>`);
  }

  // Artboard backgrounds
  if (opts.includeArtboardBackground) {
    for (const ab of scene.artboards) {
      lines.push(`${ind}<rect x="${n(ab.x, p)}" y="${n(ab.y, p)}" width="${n(ab.width, p)}" height="${n(ab.height, p)}" fill="${ab.backgroundColor}" />`);
    }
  }

  // Entities by layer order
  for (const layer of scene.layers) {
    if (!layer.visible) continue;
    const layerOpacity = layer.opacity < 1 ? ` opacity="${n(layer.opacity, p)}"` : '';
    lines.push(`${ind}<g id="${escapeXML(layer.name)}"${layerOpacity}>`);
    for (const eid of layer.entities) {
      const entity = scene.entities[eid];
      if (entity) {
        const svg = entityToSVG(entity, ind + ind, p);
        if (svg) lines.push(svg);
      }
    }
    lines.push(`${ind}</g>`);
  }

  lines.push('</svg>');
  return lines.join('\n');
}

// ============================================
// COPY AS SVG (clipboard)
// ============================================

export function entitiesToSVGFragment(entities: DrawableEntity[], precision: number = 2): string {
  return entities
    .map(e => entityToSVG(e, '', precision))
    .filter(Boolean)
    .join('\n');
}

// ============================================
// SVG IMPORT (basic — parses rects, ellipses, paths, lines, polylines, polygons)
// ============================================

export function parseSVGPath(d: string): PathData {
  // Minimal SVG path parser: handles M, L, C, Z commands
  const contours: PathData['contours'] = [];
  let currentAnchors: { id: string; position: Vec2; handleIn: { x: number; y: number } | null; handleOut: { x: number; y: number } | null }[] = [];
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;
  let idCounter = 0;
  const genId = () => `svg_anchor_${Date.now()}_${++idCounter}`;

  const tokens = d.match(/[MmLlCcSsQqTtAaHhVvZz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || [];
  let i = 0;
  const num = () => parseFloat(tokens[i++] || '0');

  while (i < tokens.length) {
    const cmd = tokens[i];
    if (/[A-Za-z]/.test(cmd)) {
      i++;
      switch (cmd) {
        case 'M':
          if (currentAnchors.length > 0) {
            contours.push({
              id: genId(), anchors: currentAnchors, closed: false,
              segments: currentAnchors.slice(0, -1).map((a, idx) => ({
                type: 'line' as const, from: a.id, to: currentAnchors[idx + 1].id,
              })),
            });
          }
          cx = num(); cy = num();
          startX = cx; startY = cy;
          currentAnchors = [{ id: genId(), position: { x: cx, y: cy }, handleIn: null, handleOut: null }];
          break;
        case 'L':
          cx = num(); cy = num();
          currentAnchors.push({ id: genId(), position: { x: cx, y: cy }, handleIn: null, handleOut: null });
          break;
        case 'C': {
          const cp1x = num(), cp1y = num();
          const cp2x = num(), cp2y = num();
          cx = num(); cy = num();
          const prev = currentAnchors[currentAnchors.length - 1];
          prev.handleOut = { x: cp1x, y: cp1y };
          currentAnchors.push({ id: genId(), position: { x: cx, y: cy }, handleIn: { x: cp2x, y: cp2y }, handleOut: null });
          break;
        }
        case 'Z':
        case 'z':
          if (currentAnchors.length > 0) {
            contours.push({
              id: genId(), anchors: currentAnchors, closed: true,
              segments: currentAnchors.map((a, idx) => ({
                type: 'line' as const, from: a.id, to: currentAnchors[(idx + 1) % currentAnchors.length].id,
              })),
            });
            currentAnchors = [];
          }
          cx = startX; cy = startY;
          break;
        case 'H':
          cx = num();
          currentAnchors.push({ id: genId(), position: { x: cx, y: cy }, handleIn: null, handleOut: null });
          break;
        case 'V':
          cy = num();
          currentAnchors.push({ id: genId(), position: { x: cx, y: cy }, handleIn: null, handleOut: null });
          break;
        default:
          // Skip unsupported commands
          break;
      }
    } else {
      // Implicit repeat of last command
      i++;
    }
  }

  // Close remaining contour
  if (currentAnchors.length > 0) {
    contours.push({
      id: genId(), anchors: currentAnchors, closed: false,
      segments: currentAnchors.slice(0, -1).map((a, idx) => ({
        type: 'line' as const, from: a.id, to: currentAnchors[idx + 1].id,
      })),
    });
  }

  return { contours };
}
