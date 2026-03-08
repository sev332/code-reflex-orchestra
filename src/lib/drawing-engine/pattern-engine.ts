// Pattern Engine — Pattern creation, tiling, and pattern fill
// Sprint 5: Pattern system

import { Vec2, DrawableEntity, generateId, FillAppearance } from './types';

// ============================================
// PATTERN TYPES
// ============================================

export type PatternTileType = 'grid' | 'brick-h' | 'brick-v' | 'hex';

export interface PatternTile {
  id: string;
  entityIds: string[]; // entities that make up one tile
  width: number;
  height: number;
}

export interface PatternDef {
  id: string;
  name: string;
  tile: PatternTile;
  tileType: PatternTileType;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
  offsetX: number;
  offsetY: number;
  spacing: number; // gap between tiles
}

export function createPattern(
  name: string,
  tileWidth: number,
  tileHeight: number,
  tileType: PatternTileType = 'grid',
  entityIds: string[] = [],
): PatternDef {
  return {
    id: generateId(),
    name,
    tile: { id: generateId(), entityIds, width: tileWidth, height: tileHeight },
    tileType,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    spacing: 0,
  };
}

export function updatePatternTransform(
  pattern: PatternDef,
  updates: Partial<Pick<PatternDef, 'scaleX' | 'scaleY' | 'rotation' | 'offsetX' | 'offsetY' | 'spacing'>>,
): PatternDef {
  return { ...pattern, ...updates };
}

// ============================================
// PATTERN TILING — compute tile positions for a bounding area
// ============================================

export interface TileInstance {
  x: number;
  y: number;
  rotation: number;
}

export function computeTilePositions(
  pattern: PatternDef,
  areaWidth: number,
  areaHeight: number,
): TileInstance[] {
  const tw = pattern.tile.width * pattern.scaleX + pattern.spacing;
  const th = pattern.tile.height * pattern.scaleY + pattern.spacing;
  if (tw <= 0 || th <= 0) return [];

  const cols = Math.ceil(areaWidth / tw) + 2;
  const rows = Math.ceil(areaHeight / th) + 2;
  const tiles: TileInstance[] = [];

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      let x = c * tw + pattern.offsetX;
      let y = r * th + pattern.offsetY;

      // Apply tile type offsets
      switch (pattern.tileType) {
        case 'brick-h':
          if (r % 2 !== 0) x += tw / 2;
          break;
        case 'brick-v':
          if (c % 2 !== 0) y += th / 2;
          break;
        case 'hex':
          if (r % 2 !== 0) x += tw / 2;
          y = r * th * 0.866; // sin(60°)
          break;
      }

      tiles.push({ x, y, rotation: pattern.rotation });
    }
  }

  return tiles;
}

// ============================================
// RENDER PATTERN TO CANVAS (for preview & fill)
// ============================================

export function renderPatternToCanvas(
  ctx: CanvasRenderingContext2D,
  pattern: PatternDef,
  width: number,
  height: number,
  tileRenderer: (ctx: CanvasRenderingContext2D, tile: PatternTile, scale: number) => void,
): void {
  const tiles = computeTilePositions(pattern, width, height);
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  for (const inst of tiles) {
    ctx.save();
    ctx.translate(inst.x, inst.y);
    if (inst.rotation) ctx.rotate((inst.rotation * Math.PI) / 180);
    ctx.scale(pattern.scaleX, pattern.scaleY);
    tileRenderer(ctx, pattern.tile, 1);
    ctx.restore();
  }

  ctx.restore();
}

// ============================================
// BUILT-IN PATTERN PRESETS
// ============================================

export interface PatternPreset {
  name: string;
  category: 'geometric' | 'organic' | 'decorative';
  create: () => PatternDef;
  renderTile: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    name: 'Dots',
    category: 'geometric',
    create: () => createPattern('Dots', 20, 20, 'grid'),
    renderTile: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    name: 'Stripes H',
    category: 'geometric',
    create: () => createPattern('Stripes H', 20, 10, 'grid'),
    renderTile: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff33';
      ctx.fillRect(0, 0, w, h / 2);
    },
  },
  {
    name: 'Stripes V',
    category: 'geometric',
    create: () => createPattern('Stripes V', 10, 20, 'grid'),
    renderTile: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff33';
      ctx.fillRect(0, 0, w / 2, h);
    },
  },
  {
    name: 'Crosshatch',
    category: 'geometric',
    create: () => createPattern('Crosshatch', 16, 16, 'grid'),
    renderTile: (ctx, w, h) => {
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, h);
      ctx.moveTo(w, 0); ctx.lineTo(0, h);
      ctx.stroke();
    },
  },
  {
    name: 'Checkerboard',
    category: 'geometric',
    create: () => createPattern('Checkerboard', 20, 20, 'grid'),
    renderTile: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(0, 0, w / 2, h / 2);
      ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
    },
  },
  {
    name: 'Hexagons',
    category: 'geometric',
    create: () => createPattern('Hexagons', 30, 26, 'hex'),
    renderTile: (ctx, w, h) => {
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 1;
      const r = Math.min(w, h) * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](w / 2 + r * Math.cos(a), h / 2 + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.stroke();
    },
  },
  {
    name: 'Diamonds',
    category: 'decorative',
    create: () => createPattern('Diamonds', 24, 24, 'brick-h'),
    renderTile: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff22';
      ctx.beginPath();
      ctx.moveTo(w / 2, 2);
      ctx.lineTo(w - 2, h / 2);
      ctx.lineTo(w / 2, h - 2);
      ctx.lineTo(2, h / 2);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    name: 'Waves',
    category: 'organic',
    create: () => createPattern('Waves', 40, 20, 'grid'),
    renderTile: (ctx, w, h) => {
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.quadraticCurveTo(w / 4, 0, w / 2, h / 2);
      ctx.quadraticCurveTo(w * 3 / 4, h, w, h / 2);
      ctx.stroke();
    },
  },
];

// ============================================
// PATTERN LIBRARY (user-saved patterns)
// ============================================

export interface PatternLibrary {
  patterns: PatternDef[];
}

export function addToLibrary(library: PatternLibrary, pattern: PatternDef): PatternLibrary {
  return { patterns: [...library.patterns, pattern] };
}

export function removeFromLibrary(library: PatternLibrary, patternId: string): PatternLibrary {
  return { patterns: library.patterns.filter(p => p.id !== patternId) };
}
