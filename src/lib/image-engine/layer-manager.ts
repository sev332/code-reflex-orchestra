// Layer Manager — Professional layer system with blend modes, opacity, and operations

import { type Layer, type BlendMode, type Rect, generateId } from './types';

export class LayerManager {
  private layers: Layer[] = [];
  private activeLayerId: string | null = null;
  private imageWidth = 0;
  private imageHeight = 0;

  initialize(width: number, height: number): void {
    this.imageWidth = width;
    this.imageHeight = height;
    this.layers = [];
    this.addLayer('Background');
  }

  addLayer(name?: string): Layer {
    const canvas = document.createElement('canvas');
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    const layer: Layer = {
      id: generateId(),
      name: name || `Layer ${this.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      canvas,
      position: { x: 0, y: 0 },
      bounds: { x: 0, y: 0, width: this.imageWidth, height: this.imageHeight },
    };
    this.layers.push(layer);
    this.activeLayerId = layer.id;
    return layer;
  }

  removeLayer(id: string): void {
    if (this.layers.length <= 1) return;
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    this.layers.splice(idx, 1);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[Math.min(idx, this.layers.length - 1)]?.id ?? null;
    }
  }

  duplicateLayer(id: string): Layer | null {
    const src = this.getLayer(id);
    if (!src) return null;
    const layer = this.addLayer(src.name + ' copy');
    const ctx = layer.canvas.getContext('2d')!;
    ctx.drawImage(src.canvas, 0, 0);
    layer.opacity = src.opacity;
    layer.blendMode = src.blendMode;
    return layer;
  }

  moveLayer(id: string, direction: 'up' | 'down'): void {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= this.layers.length) return;
    [this.layers[idx], this.layers[newIdx]] = [this.layers[newIdx], this.layers[idx]];
  }

  mergeDown(id: string): void {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx <= 0) return;
    const top = this.layers[idx];
    const bottom = this.layers[idx - 1];
    const ctx = bottom.canvas.getContext('2d')!;
    ctx.globalAlpha = top.opacity / 100;
    ctx.globalCompositeOperation = this.blendModeToComposite(top.blendMode);
    ctx.drawImage(top.canvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    this.layers.splice(idx, 1);
    if (this.activeLayerId === id) this.activeLayerId = bottom.id;
  }

  flattenAll(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    const ctx = canvas.getContext('2d')!;
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = this.blendModeToComposite(layer.blendMode);
      ctx.drawImage(layer.canvas, layer.position.x, layer.position.y);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  }

  getLayer(id: string): Layer | undefined { return this.layers.find(l => l.id === id); }
  getActiveLayer(): Layer | undefined { return this.layers.find(l => l.id === this.activeLayerId); }
  setActiveLayer(id: string) { this.activeLayerId = id; }
  getLayers(): Layer[] { return [...this.layers]; }
  getActiveLayerId(): string | null { return this.activeLayerId; }

  setLayerOpacity(id: string, opacity: number) {
    const l = this.getLayer(id);
    if (l) l.opacity = Math.max(0, Math.min(100, opacity));
  }

  setLayerBlendMode(id: string, mode: BlendMode) {
    const l = this.getLayer(id);
    if (l) l.blendMode = mode;
  }

  toggleLayerVisibility(id: string) {
    const l = this.getLayer(id);
    if (l) l.visible = !l.visible;
  }

  toggleLayerLock(id: string) {
    const l = this.getLayer(id);
    if (l) l.locked = !l.locked;
  }

  renameLayer(id: string, name: string) {
    const l = this.getLayer(id);
    if (l) l.name = name;
  }

  private blendModeToComposite(mode: BlendMode): GlobalCompositeOperation {
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
