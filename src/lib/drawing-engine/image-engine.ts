/**
 * Image Engine — Sprint 6
 * Raster image placement, loading, rendering, and basic transforms.
 * Images live as DrawableEntities with type='image'.
 */

import { DrawableEntity, generateId, createDefaultTransform, createDefaultFill, createDefaultStroke, createDefaultBlend } from './types';

// ============================================
// IMAGE DATA
// ============================================

export interface ImageData_ {
  src: string;           // data URL or blob URL
  naturalWidth: number;
  naturalHeight: number;
  element?: HTMLImageElement; // cached loaded element (not serialized)
}

// Global image cache — maps entity.id → loaded HTMLImageElement
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(entityId: string): HTMLImageElement | null {
  return imageCache.get(entityId) ?? null;
}

export function setCachedImage(entityId: string, img: HTMLImageElement): void {
  imageCache.set(entityId, img);
}

export function removeCachedImage(entityId: string): void {
  imageCache.delete(entityId);
}

// ============================================
// LOAD IMAGE FROM FILE
// ============================================

export function loadImageFromFile(file: File): Promise<{ src: string; width: number; height: number; element: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => resolve({ src, width: img.naturalWidth, height: img.naturalHeight, element: img });
      img.onerror = reject;
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImageFromURL(url: string): Promise<{ src: string; width: number; height: number; element: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ src: url, width: img.naturalWidth, height: img.naturalHeight, element: img });
    img.onerror = reject;
    img.src = url;
  });
}

// ============================================
// CREATE IMAGE ENTITY
// ============================================

export function createImageEntity(
  src: string,
  naturalWidth: number,
  naturalHeight: number,
  x: number,
  y: number,
  displayWidth?: number,
  displayHeight?: number
): DrawableEntity {
  const w = displayWidth ?? Math.min(naturalWidth, 600);
  const scale = w / naturalWidth;
  const h = displayHeight ?? naturalHeight * scale;

  return {
    id: generateId(),
    type: 'image',
    name: 'Image',
    visible: true,
    locked: false,
    topologyMode: 'isolated',
    transform: {
      ...createDefaultTransform(),
      translateX: x,
      translateY: y,
    },
    blend: createDefaultBlend(),
    fill: { ...createDefaultFill(), type: 'none', opacity: 0 },
    stroke: { ...createDefaultStroke(), width: 0, opacity: 0 },
    shapeKind: 'rectangle',
    shapeProps: {
      width: w,
      height: h,
      naturalWidth,
      naturalHeight,
    },
    // Store src in textContent for serialization
    textContent: src,
  };
}

// ============================================
// RENDER IMAGE ENTITY
// ============================================

export function renderImageEntity(
  ctx: CanvasRenderingContext2D,
  entity: DrawableEntity,
  vp: { panX: number; panY: number; zoom: number }
): void {
  if (entity.type !== 'image' || !entity.textContent) return;

  const img = getCachedImage(entity.id);
  if (!img) {
    // Start loading
    const loadImg = new Image();
    loadImg.crossOrigin = 'anonymous';
    loadImg.onload = () => setCachedImage(entity.id, loadImg);
    loadImg.src = entity.textContent;
    
    // Render placeholder
    const tx = entity.transform;
    const sx = (tx.translateX + vp.panX) * vp.zoom;
    const sy = (tx.translateY + vp.panY) * vp.zoom;
    const sw = (entity.shapeProps?.width ?? 100) * vp.zoom;
    const sh = (entity.shapeProps?.height ?? 100) * vp.zoom;
    ctx.save();
    ctx.fillStyle = 'hsla(220,20%,15%,0.5)';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = 'hsla(220,20%,30%,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.setLineDash([]);
    // Loading text
    ctx.fillStyle = 'hsla(220,20%,50%,0.8)';
    ctx.font = `${12 * vp.zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', sx + sw / 2, sy + sh / 2);
    ctx.restore();
    return;
  }

  const tx = entity.transform;
  const sx = (tx.translateX + vp.panX) * vp.zoom;
  const sy = (tx.translateY + vp.panY) * vp.zoom;
  const sw = (entity.shapeProps?.width ?? img.naturalWidth) * vp.zoom * tx.scaleX;
  const sh = (entity.shapeProps?.height ?? img.naturalHeight) * vp.zoom * tx.scaleY;

  ctx.save();
  ctx.globalAlpha = entity.blend.opacity;

  // Apply rotation
  if (tx.rotation !== 0) {
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    ctx.translate(cx, cy);
    ctx.rotate((tx.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.restore();
}

// ============================================
// IMAGE TRACE (Basic — posterize + edge detect)
// ============================================

export interface TraceOptions {
  threshold: number;       // 0-255 for B&W threshold
  colors: number;          // Number of color levels (2-16)
  smoothing: number;       // Path simplification (0-10)
  minArea: number;         // Minimum region area in px
}

export const defaultTraceOptions: TraceOptions = {
  threshold: 128,
  colors: 4,
  smoothing: 3,
  minArea: 20,
};

/**
 * Basic image trace: posterize into N colors then create bounding-box regions.
 * A full contour-tracing algorithm (Suzuki-Abe or Potrace) would be needed
 * for production quality — this is a fast approximation.
 */
export function traceImageBasic(
  imgData: globalThis.ImageData,
  options: TraceOptions = defaultTraceOptions
): { paths: { x: number; y: number; w: number; h: number; color: string }[] } {
  const { width, height, data } = imgData;
  const levels = options.colors;
  const step = 256 / levels;

  // Posterize
  const quantized = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    quantized[i] = Math.floor(gray / step);
  }

  // Find connected regions (simple scanline)
  const visited = new Uint8Array(width * height);
  const regions: { level: number; minX: number; minY: number; maxX: number; maxY: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      
      const level = quantized[idx];
      let minX = x, maxX = x, minY = y, maxY = y;
      let area = 0;
      
      // Flood fill
      const stack = [idx];
      while (stack.length > 0) {
        const ci = stack.pop()!;
        if (visited[ci] || quantized[ci] !== level) continue;
        visited[ci] = 1;
        area++;
        
        const cx = ci % width;
        const cy = Math.floor(ci / width);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        
        if (cx > 0) stack.push(ci - 1);
        if (cx < width - 1) stack.push(ci + 1);
        if (cy > 0) stack.push(ci - width);
        if (cy < height - 1) stack.push(ci + width);
      }
      
      if (area >= options.minArea) {
        regions.push({ level, minX, minY, maxX, maxY });
      }
    }
  }

  return {
    paths: regions.map(r => {
      const v = Math.round((r.level * step + step / 2));
      return {
        x: r.minX,
        y: r.minY,
        w: r.maxX - r.minX,
        h: r.maxY - r.minY,
        color: `rgb(${v},${v},${v})`,
      };
    }),
  };
}
