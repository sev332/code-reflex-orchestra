// Crop Engine — Professional crop with aspect ratios, handles, and overlay

import { type Rect, type Point, clamp } from './types';

export interface CropHandle {
  id: string;
  position: Point;
  cursor: string;
}

export interface CropState {
  isActive: boolean;
  bounds: Rect | null;
  handles: CropHandle[];
  aspectRatio: number | null; // null = free, e.g. 16/9, 1, 4/3
  dragging: string | null;
  dragStart: Point | null;
}

export const CROP_PRESETS = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '5:4', ratio: 5 / 4 },
] as const;

export class CropEngine {
  private state: CropState = {
    isActive: false, bounds: null, handles: [],
    aspectRatio: null, dragging: null, dragStart: null,
  };
  private imageWidth = 0;
  private imageHeight = 0;
  private handleSize = 8;

  initialize(width: number, height: number) {
    this.imageWidth = width;
    this.imageHeight = height;
  }

  start(aspectRatio: number | null = null) {
    const margin = 0.1;
    let x = Math.floor(this.imageWidth * margin);
    let y = Math.floor(this.imageHeight * margin);
    let w = Math.floor(this.imageWidth * (1 - margin * 2));
    let h = Math.floor(this.imageHeight * (1 - margin * 2));

    if (aspectRatio) {
      if (w / h > aspectRatio) w = Math.floor(h * aspectRatio);
      else h = Math.floor(w / aspectRatio);
      x = Math.floor((this.imageWidth - w) / 2);
      y = Math.floor((this.imageHeight - h) / 2);
    }

    this.state = {
      isActive: true,
      bounds: { x, y, width: w, height: h },
      handles: this.computeHandles({ x, y, width: w, height: h }),
      aspectRatio,
      dragging: null,
      dragStart: null,
    };
  }

  cancel() {
    this.state = { isActive: false, bounds: null, handles: [], aspectRatio: null, dragging: null, dragStart: null };
  }

  apply(): Rect | null {
    const bounds = this.state.bounds;
    this.cancel();
    return bounds;
  }

  getState(): CropState { return this.state; }

  handlePointerDown(worldX: number, worldY: number): boolean {
    if (!this.state.isActive || !this.state.bounds) return false;
    const handle = this.hitTestHandle(worldX, worldY);
    if (handle) {
      this.state.dragging = handle;
      this.state.dragStart = { x: worldX, y: worldY };
      return true;
    }
    // Check if inside bounds for move
    const b = this.state.bounds;
    if (worldX >= b.x && worldX <= b.x + b.width && worldY >= b.y && worldY <= b.y + b.height) {
      this.state.dragging = 'move';
      this.state.dragStart = { x: worldX, y: worldY };
      return true;
    }
    return false;
  }

  handlePointerMove(worldX: number, worldY: number): void {
    if (!this.state.dragging || !this.state.dragStart || !this.state.bounds) return;
    const dx = worldX - this.state.dragStart.x;
    const dy = worldY - this.state.dragStart.y;
    const b = { ...this.state.bounds };

    if (this.state.dragging === 'move') {
      b.x = clamp(b.x + dx, 0, this.imageWidth - b.width);
      b.y = clamp(b.y + dy, 0, this.imageHeight - b.height);
    } else {
      // Resize handles
      const d = this.state.dragging;
      if (d.includes('w')) { b.x += dx; b.width -= dx; }
      if (d.includes('e')) { b.width += dx; }
      if (d.includes('n')) { b.y += dy; b.height -= dy; }
      if (d.includes('s')) { b.height += dy; }

      // Enforce minimum size
      if (b.width < 10) { b.width = 10; }
      if (b.height < 10) { b.height = 10; }

      // Enforce aspect ratio
      if (this.state.aspectRatio) {
        if (d.includes('e') || d.includes('w')) {
          b.height = Math.round(b.width / this.state.aspectRatio);
        } else {
          b.width = Math.round(b.height * this.state.aspectRatio);
        }
      }

      // Clamp to image
      b.x = clamp(b.x, 0, this.imageWidth - 10);
      b.y = clamp(b.y, 0, this.imageHeight - 10);
      b.width = clamp(b.width, 10, this.imageWidth - b.x);
      b.height = clamp(b.height, 10, this.imageHeight - b.y);
    }

    this.state.bounds = b;
    this.state.handles = this.computeHandles(b);
    this.state.dragStart = { x: worldX, y: worldY };
  }

  handlePointerUp(): void {
    this.state.dragging = null;
    this.state.dragStart = null;
  }

  renderOverlay(ctx: CanvasRenderingContext2D, zoom: number) {
    if (!this.state.isActive || !this.state.bounds) return;
    const { x, y, width: w, height: h } = this.state.bounds;
    const iw = this.imageWidth, ih = this.imageHeight;

    // Darkened outside
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, iw, y);
    ctx.fillRect(0, y + h, iw, ih - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, iw - x - w, h);

    // Rule of thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    for (let i = 1; i <= 2; i++) {
      ctx.moveTo(x + (w * i) / 3, y);
      ctx.lineTo(x + (w * i) / 3, y + h);
      ctx.moveTo(x, y + (h * i) / 3);
      ctx.lineTo(x + w, y + (h * i) / 3);
    }
    ctx.stroke();

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Handles
    const hs = this.handleSize / zoom;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5 / zoom;
    for (const handle of this.state.handles) {
      ctx.fillRect(handle.position.x - hs / 2, handle.position.y - hs / 2, hs, hs);
      ctx.strokeRect(handle.position.x - hs / 2, handle.position.y - hs / 2, hs, hs);
    }
    ctx.restore();
  }

  private computeHandles(b: Rect): CropHandle[] {
    const mx = b.x + b.width / 2, my = b.y + b.height / 2;
    return [
      { id: 'nw', position: { x: b.x, y: b.y }, cursor: 'nwse-resize' },
      { id: 'n', position: { x: mx, y: b.y }, cursor: 'ns-resize' },
      { id: 'ne', position: { x: b.x + b.width, y: b.y }, cursor: 'nesw-resize' },
      { id: 'w', position: { x: b.x, y: my }, cursor: 'ew-resize' },
      { id: 'e', position: { x: b.x + b.width, y: my }, cursor: 'ew-resize' },
      { id: 'sw', position: { x: b.x, y: b.y + b.height }, cursor: 'nesw-resize' },
      { id: 's', position: { x: mx, y: b.y + b.height }, cursor: 'ns-resize' },
      { id: 'se', position: { x: b.x + b.width, y: b.y + b.height }, cursor: 'nwse-resize' },
    ];
  }

  private hitTestHandle(wx: number, wy: number): string | null {
    const threshold = this.handleSize * 1.5;
    for (const h of this.state.handles) {
      if (Math.abs(wx - h.position.x) < threshold && Math.abs(wy - h.position.y) < threshold) return h.id;
    }
    return null;
  }
}
