// Render Pipeline — Full canvas rendering with layers, selection, marching ants, pixel grid

import { type Layer, type Point, type BlendMode } from './types';
import { CoordinateSystem } from './coordinate-system';
import { type Selection } from './selection-manager';

export interface RenderOptions {
  showGrid: boolean;
  showSelection: boolean;
  gridThreshold: number;
  backgroundColor: string;
}

export class RenderPipeline {
  private ctx: CanvasRenderingContext2D;
  private coordSystem: CoordinateSystem;
  private options: RenderOptions;
  private checkerboard: CanvasPattern | null = null;
  private marchingAntsOffset = 0;
  private animFrame: number | null = null;

  constructor(ctx: CanvasRenderingContext2D, coordSystem: CoordinateSystem, options?: Partial<RenderOptions>) {
    this.ctx = ctx;
    this.coordSystem = coordSystem;
    this.options = {
      showGrid: true,
      showSelection: true,
      gridThreshold: 8,
      backgroundColor: '#0a0a0f',
      ...options,
    };
    this.createCheckerboard();
  }

  setContext(ctx: CanvasRenderingContext2D) { this.ctx = ctx; }

  private createCheckerboard() {
    const s = 8;
    const c = document.createElement('canvas');
    c.width = s * 2; c.height = s * 2;
    const g = c.getContext('2d')!;
    g.fillStyle = '#1a1a2a'; g.fillRect(0, 0, s * 2, s * 2);
    g.fillStyle = '#222238'; g.fillRect(0, 0, s, s); g.fillRect(s, s, s, s);
    this.checkerboard = this.ctx.createPattern(c, 'repeat');
  }

  render(layers: Layer[], selection: Selection | null, cursorPos: Point | null, cursorSize?: number): void {
    const { ctx } = this;
    const dpr = this.coordSystem.dpr;
    const { width: cw, height: ch } = this.coordSystem.canvasSize;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw * dpr, ch * dpr);

    // Apply world transform
    this.coordSystem.applyTransform(ctx);

    // Background
    const iw = this.coordSystem.imageSize.width;
    const ih = this.coordSystem.imageSize.height;
    if (this.checkerboard) {
      ctx.fillStyle = this.checkerboard;
      ctx.fillRect(0, 0, iw, ih);
    }

    // Canvas border
    ctx.strokeStyle = 'hsla(220, 60%, 50%, 0.4)';
    ctx.lineWidth = 1 / this.coordSystem.zoom;
    ctx.strokeRect(0, 0, iw, ih);

    // Layers
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = this.blendToComposite(layer.blendMode);
      ctx.drawImage(layer.canvas, layer.position.x, layer.position.y);
      ctx.restore();
    }

    // Selection overlay
    if (selection?.active && selection.mask && selection.bounds && this.options.showSelection) {
      this.drawSelection(selection);
    }

    // Pixel grid at high zoom
    if (this.options.showGrid && this.coordSystem.zoom >= this.options.gridThreshold) {
      this.drawPixelGrid();
    }

    // Reset transform for screen-space overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Cursor
    if (cursorPos && cursorSize) {
      const screen = this.coordSystem.worldToScreen(cursorPos.x, cursorPos.y);
      const radius = (cursorSize / 2) * this.coordSystem.zoom;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawSelection(selection: Selection) {
    const { ctx } = this;
    const { mask, bounds } = selection;
    if (!mask || !bounds) return;
    const w = selection.mask!.length > 0 ? Math.sqrt(mask.length) : 0;
    if (w === 0) return;

    const imageW = this.coordSystem.imageSize.width;

    // Tinted overlay
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = 'hsl(200, 80%, 55%)';
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (mask[y * imageW + x] > 0) ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();

    // Marching ants
    const lw = 1 / this.coordSystem.zoom;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = lw;
    ctx.setLineDash([4 / this.coordSystem.zoom, 4 / this.coordSystem.zoom]);
    ctx.lineDashOffset = this.marchingAntsOffset / this.coordSystem.zoom;
    ctx.beginPath();
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (mask[y * imageW + x] > 0) {
          const top = y > 0 ? mask[(y - 1) * imageW + x] : 0;
          const bottom = y < this.coordSystem.imageSize.height - 1 ? mask[(y + 1) * imageW + x] : 0;
          const left = x > 0 ? mask[y * imageW + (x - 1)] : 0;
          const right = x < imageW - 1 ? mask[y * imageW + (x + 1)] : 0;
          if (top === 0) { ctx.moveTo(x, y); ctx.lineTo(x + 1, y); }
          if (bottom === 0) { ctx.moveTo(x, y + 1); ctx.lineTo(x + 1, y + 1); }
          if (left === 0) { ctx.moveTo(x, y); ctx.lineTo(x, y + 1); }
          if (right === 0) { ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + 1); }
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawPixelGrid() {
    const { ctx } = this;
    const zoom = this.coordSystem.zoom;
    const iw = this.coordSystem.imageSize.width;
    const ih = this.coordSystem.imageSize.height;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    for (let x = 0; x <= iw; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, ih); }
    for (let y = 0; y <= ih; y++) { ctx.moveTo(0, y); ctx.lineTo(iw, y); }
    ctx.stroke();
    ctx.restore();
  }

  startMarchingAnts() {
    const animate = () => {
      this.marchingAntsOffset = (this.marchingAntsOffset + 0.5) % 16;
      this.animFrame = requestAnimationFrame(animate);
    };
    this.animFrame = requestAnimationFrame(animate);
  }

  stopMarchingAnts() {
    if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
  }

  private blendToComposite(mode: BlendMode): GlobalCompositeOperation {
    const map: Record<string, GlobalCompositeOperation> = {
      'normal': 'source-over', 'multiply': 'multiply', 'screen': 'screen',
      'overlay': 'overlay', 'darken': 'darken', 'lighten': 'lighten',
      'color-dodge': 'color-dodge', 'color-burn': 'color-burn',
      'hard-light': 'hard-light', 'soft-light': 'soft-light',
      'difference': 'difference', 'exclusion': 'exclusion',
      'hue': 'hue', 'saturation': 'saturation', 'color': 'color', 'luminosity': 'luminosity',
    };
    return map[mode] || 'source-over';
  }
}
