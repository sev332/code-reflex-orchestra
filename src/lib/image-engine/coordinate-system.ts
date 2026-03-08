// Coordinate System — Single Source of Truth for screen/world/image transforms

import { type Point, type Size, clamp } from './types';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 64;

export class CoordinateSystem {
  private _pan: Point = { x: 0, y: 0 };
  private _zoom = 1;
  private _rotation = 0;
  private _canvasSize: Size = { width: 0, height: 0 };
  private _imageSize: Size = { width: 0, height: 0 };

  get pan() { return { ...this._pan }; }
  get zoom() { return this._zoom; }
  get rotation() { return this._rotation; }
  get canvasSize() { return { ...this._canvasSize }; }
  get imageSize() { return { ...this._imageSize }; }
  get dpr() { return typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1; }

  setPan(x: number, y: number) { this._pan = { x, y }; }
  setZoom(zoom: number) { this._zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM); }
  setRotation(deg: number) { this._rotation = deg % 360; }
  setCanvasSize(w: number, h: number) { this._canvasSize = { width: w, height: h }; }
  setImageSize(w: number, h: number) { this._imageSize = { width: w, height: h }; }

  screenToWorld(screenX: number, screenY: number): Point {
    const cx = this._canvasSize.width / 2;
    const cy = this._canvasSize.height / 2;
    return {
      x: (screenX - cx - this._pan.x) / this._zoom + this._imageSize.width / 2,
      y: (screenY - cy - this._pan.y) / this._zoom + this._imageSize.height / 2,
    };
  }

  worldToScreen(worldX: number, worldY: number): Point {
    const cx = this._canvasSize.width / 2;
    const cy = this._canvasSize.height / 2;
    return {
      x: (worldX - this._imageSize.width / 2) * this._zoom + cx + this._pan.x,
      y: (worldY - this._imageSize.height / 2) * this._zoom + cy + this._pan.y,
    };
  }

  isInBounds(worldX: number, worldY: number): boolean {
    return worldX >= 0 && worldX < this._imageSize.width && worldY >= 0 && worldY < this._imageSize.height;
  }

  clampToBounds(p: Point): Point {
    return {
      x: clamp(p.x, 0, this._imageSize.width - 1),
      y: clamp(p.y, 0, this._imageSize.height - 1),
    };
  }

  zoomAroundPoint(screenX: number, screenY: number, newZoom: number): void {
    const world = this.screenToWorld(screenX, screenY);
    this._zoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    const cx = this._canvasSize.width / 2;
    const cy = this._canvasSize.height / 2;
    this._pan.x = screenX - cx - (world.x - this._imageSize.width / 2) * this._zoom;
    this._pan.y = screenY - cy - (world.y - this._imageSize.height / 2) * this._zoom;
  }

  fitToView(padding = 40): void {
    const aw = this._canvasSize.width - padding * 2;
    const ah = this._canvasSize.height - padding * 2;
    this._zoom = Math.min(aw / this._imageSize.width, ah / this._imageSize.height, 1);
    this._pan = { x: 0, y: 0 };
    this._rotation = 0;
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    const dpr = this.dpr;
    const cx = this._canvasSize.width / 2 * dpr;
    const cy = this._canvasSize.height / 2 * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(cx + this._pan.x * dpr, cy + this._pan.y * dpr);
    ctx.scale(this._zoom * dpr, this._zoom * dpr);
    ctx.translate(-this._imageSize.width / 2, -this._imageSize.height / 2);
    if (this._rotation !== 0) {
      ctx.translate(this._imageSize.width / 2, this._imageSize.height / 2);
      ctx.rotate((this._rotation * Math.PI) / 180);
      ctx.translate(-this._imageSize.width / 2, -this._imageSize.height / 2);
    }
  }
}
