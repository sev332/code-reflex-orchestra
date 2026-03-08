/**
 * Artboard Engine — Sprint 6
 * Multiple artboard management: create, resize, navigate, presets, reorder
 */

import { Artboard, generateId } from './types';

// ============================================
// ARTBOARD PRESETS
// ============================================

export interface ArtboardPreset {
  name: string;
  width: number;
  height: number;
  category: 'print' | 'screen' | 'mobile' | 'social' | 'custom';
}

export const ARTBOARD_PRESETS: ArtboardPreset[] = [
  // Print
  { name: 'A4', width: 595, height: 842, category: 'print' },
  { name: 'A3', width: 842, height: 1191, category: 'print' },
  { name: 'Letter', width: 612, height: 792, category: 'print' },
  { name: 'Legal', width: 612, height: 1008, category: 'print' },
  // Screen
  { name: 'HD 1080p', width: 1920, height: 1080, category: 'screen' },
  { name: '4K UHD', width: 3840, height: 2160, category: 'screen' },
  { name: 'MacBook Pro', width: 1440, height: 900, category: 'screen' },
  { name: 'Desktop', width: 1280, height: 800, category: 'screen' },
  // Mobile
  { name: 'iPhone 15', width: 393, height: 852, category: 'mobile' },
  { name: 'iPhone 15 Pro Max', width: 430, height: 932, category: 'mobile' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, category: 'mobile' },
  { name: 'Android Phone', width: 360, height: 800, category: 'mobile' },
  // Social
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'social' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { name: 'Twitter/X Post', width: 1200, height: 675, category: 'social' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'social' },
];

// ============================================
// ARTBOARD MANAGEMENT
// ============================================

export function createArtboard(
  x: number, y: number, width: number, height: number,
  name?: string, backgroundColor?: string
): Artboard {
  return {
    id: generateId(),
    name: name ?? `Artboard ${Date.now() % 1000}`,
    x, y, width, height,
    backgroundColor: backgroundColor ?? '#ffffff',
  };
}

export function createArtboardFromPreset(preset: ArtboardPreset, x: number, y: number): Artboard {
  return createArtboard(x, y, preset.width, preset.height, preset.name);
}

export function duplicateArtboard(artboard: Artboard, offsetX: number = 50): Artboard {
  return {
    ...artboard,
    id: generateId(),
    name: `${artboard.name} Copy`,
    x: artboard.x + artboard.width + offsetX,
  };
}

export function resizeArtboard(artboard: Artboard, width: number, height: number): Artboard {
  return { ...artboard, width: Math.max(10, width), height: Math.max(10, height) };
}

export function moveArtboard(artboard: Artboard, x: number, y: number): Artboard {
  return { ...artboard, x, y };
}

export function renameArtboard(artboard: Artboard, name: string): Artboard {
  return { ...artboard, name };
}

// ============================================
// ARTBOARD LAYOUT
// ============================================

export type ArtboardLayout = 'horizontal' | 'vertical' | 'grid';

export function rearrangeArtboards(
  artboards: Artboard[],
  layout: ArtboardLayout = 'horizontal',
  spacing: number = 50,
  gridCols: number = 3
): Artboard[] {
  if (artboards.length === 0) return artboards;

  return artboards.map((ab, i) => {
    switch (layout) {
      case 'horizontal': {
        const x = artboards.slice(0, i).reduce((sum, a) => sum + a.width + spacing, 0);
        return { ...ab, x, y: 0 };
      }
      case 'vertical': {
        const y = artboards.slice(0, i).reduce((sum, a) => sum + a.height + spacing, 0);
        return { ...ab, x: 0, y };
      }
      case 'grid': {
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        // Use max width/height in each row/col for alignment
        const maxW = Math.max(...artboards.map(a => a.width));
        const maxH = Math.max(...artboards.map(a => a.height));
        return { ...ab, x: col * (maxW + spacing), y: row * (maxH + spacing) };
      }
    }
  });
}

// ============================================
// ARTBOARD HIT TEST
// ============================================

export function hitTestArtboard(artboards: Artboard[], worldX: number, worldY: number): Artboard | null {
  // Reverse order so topmost artboard wins
  for (let i = artboards.length - 1; i >= 0; i--) {
    const ab = artboards[i];
    if (worldX >= ab.x && worldX <= ab.x + ab.width &&
        worldY >= ab.y && worldY <= ab.y + ab.height) {
      return ab;
    }
  }
  return null;
}

// ============================================
// ARTBOARD NAVIGATION
// ============================================

export interface ArtboardViewport {
  panX: number;
  panY: number;
  zoom: number;
}

export function fitArtboardToViewport(
  artboard: Artboard,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 40
): ArtboardViewport {
  const zoomX = (canvasWidth - padding * 2) / artboard.width;
  const zoomY = (canvasHeight - padding * 2) / artboard.height;
  const zoom = Math.min(zoomX, zoomY, 4);
  const panX = -artboard.x + (canvasWidth / zoom - artboard.width) / 2;
  const panY = -artboard.y + (canvasHeight / zoom - artboard.height) / 2;
  return { panX, panY, zoom };
}

export function fitAllArtboardsToViewport(
  artboards: Artboard[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 60
): ArtboardViewport {
  if (artboards.length === 0) return { panX: 0, panY: 0, zoom: 1 };
  const minX = Math.min(...artboards.map(a => a.x));
  const minY = Math.min(...artboards.map(a => a.y));
  const maxX = Math.max(...artboards.map(a => a.x + a.width));
  const maxY = Math.max(...artboards.map(a => a.y + a.height));
  const totalW = maxX - minX;
  const totalH = maxY - minY;
  const zoomX = (canvasWidth - padding * 2) / totalW;
  const zoomY = (canvasHeight - padding * 2) / totalH;
  const zoom = Math.min(zoomX, zoomY, 4);
  const panX = -minX + (canvasWidth / zoom - totalW) / 2;
  const panY = -minY + (canvasHeight / zoom - totalH) / 2;
  return { panX, panY, zoom };
}

// ============================================
// ENTITY-ARTBOARD ASSIGNMENT
// ============================================

export function getEntitiesOnArtboard(
  artboard: Artboard,
  entities: Record<string, { transform: { translateX: number; translateY: number } }>
): string[] {
  const result: string[] = [];
  for (const [id, entity] of Object.entries(entities)) {
    const ex = entity.transform.translateX;
    const ey = entity.transform.translateY;
    if (ex >= artboard.x && ex <= artboard.x + artboard.width &&
        ey >= artboard.y && ey <= artboard.y + artboard.height) {
      result.push(id);
    }
  }
  return result;
}
