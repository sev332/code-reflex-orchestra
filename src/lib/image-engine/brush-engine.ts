// Professional Brush Engine with pressure support, stamp generation, and stroke interpolation

import { type Point, type BrushSettings, type Color, distance, lerp } from './types';

export interface BrushStroke {
  points: Point[];
  settings: BrushSettings;
  isEraser: boolean;
}

export class BrushEngine {
  private stampCanvas: HTMLCanvasElement;
  private stampCtx: CanvasRenderingContext2D;
  private currentStroke: BrushStroke | null = null;
  private lastPoint: Point | null = null;

  constructor() {
    this.stampCanvas = document.createElement('canvas');
    this.stampCtx = this.stampCanvas.getContext('2d')!;
  }

  private generateStamp(settings: BrushSettings, pressure = 1): HTMLCanvasElement {
    const size = Math.max(1, Math.round(settings.size * pressure));
    this.stampCanvas.width = size * 2;
    this.stampCanvas.height = size * 2;
    const cx = size, cy = size, r = size;
    this.stampCtx.clearRect(0, 0, size * 2, size * 2);
    const hardness = settings.hardness / 100;
    const alpha = (settings.opacity / 100) * (settings.flow / 100);
    const { r: cr, g: cg, b: cb } = settings.color;

    if (hardness >= 0.99) {
      this.stampCtx.beginPath();
      this.stampCtx.arc(cx, cy, r, 0, Math.PI * 2);
      this.stampCtx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      this.stampCtx.fill();
    } else {
      const gradient = this.stampCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const innerStop = hardness * 0.9;
      gradient.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
      gradient.addColorStop(innerStop, `rgba(${cr},${cg},${cb},${alpha})`);
      gradient.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      this.stampCtx.beginPath();
      this.stampCtx.arc(cx, cy, r, 0, Math.PI * 2);
      this.stampCtx.fillStyle = gradient;
      this.stampCtx.fill();
    }
    return this.stampCanvas;
  }

  beginStroke(point: Point, settings: BrushSettings, isEraser = false): void {
    this.currentStroke = { points: [point], settings: { ...settings }, isEraser };
    this.lastPoint = point;
  }

  continueStroke(point: Point, pressure = 1): Point[] {
    if (!this.currentStroke || !this.lastPoint) return [];
    const dist = distance(this.lastPoint, point);
    const spacing = Math.max(1, this.currentStroke.settings.size * (this.currentStroke.settings.spacing / 100));
    if (dist < spacing * 0.5) return [];

    const steps = Math.ceil(dist / spacing);
    const interpolated: Point[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      interpolated.push({ x: lerp(this.lastPoint.x, point.x, t), y: lerp(this.lastPoint.y, point.y, t) });
    }
    this.currentStroke.points.push(...interpolated);
    this.lastPoint = point;
    return interpolated;
  }

  endStroke(): BrushStroke | null {
    const stroke = this.currentStroke;
    this.currentStroke = null;
    this.lastPoint = null;
    return stroke;
  }

  renderStrokeToCanvas(target: HTMLCanvasElement, points: Point[], settings: BrushSettings, isEraser = false, pressure = 1): void {
    const ctx = target.getContext('2d')!;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    const stamp = this.generateStamp(settings, pressure);
    const stampSize = stamp.width;
    for (const point of points) {
      ctx.drawImage(stamp, Math.round(point.x - stampSize / 2), Math.round(point.y - stampSize / 2));
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  getBrushCursor(settings: BrushSettings, zoom: number): { size: number } {
    return { size: Math.max(4, settings.size * zoom) };
  }
}
