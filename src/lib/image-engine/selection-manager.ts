// Selection Manager — Mask-based selection with modes, feather, expand, contract

import { type Rect, type Point, type SelectionMode } from './types';
import { expandMask, contractMask, invertMask, combineMasks } from './flood-fill';

export interface Selection {
  mask: Uint8ClampedArray | null;
  bounds: Rect | null;
  active: boolean;
}

export class SelectionManager {
  private width: number;
  private height: number;
  private currentMask: Uint8ClampedArray | null = null;
  private currentBounds: Rect | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setDimensions(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.clear();
  }

  getSelection(): Selection {
    return { mask: this.currentMask, bounds: this.currentBounds, active: this.currentMask !== null };
  }

  setSelection(mask: Uint8ClampedArray, bounds: Rect) {
    this.currentMask = mask;
    this.currentBounds = bounds;
  }

  clear() { this.currentMask = null; this.currentBounds = null; }

  selectAll() {
    this.currentMask = new Uint8ClampedArray(this.width * this.height);
    this.currentMask.fill(255);
    this.currentBounds = { x: 0, y: 0, width: this.width, height: this.height };
  }

  applyMask(newMask: Uint8ClampedArray, newBounds: Rect, mode: SelectionMode) {
    if (!this.currentMask || mode === 'new') {
      this.currentMask = newMask;
      this.currentBounds = newBounds;
      return;
    }
    switch (mode) {
      case 'add': this.currentMask = combineMasks(this.currentMask, newMask, 'add'); break;
      case 'subtract': this.currentMask = combineMasks(this.currentMask, newMask, 'subtract'); break;
      case 'intersect': this.currentMask = combineMasks(this.currentMask, newMask, 'intersect'); break;
    }
    this.currentBounds = this.calculateBounds();
  }

  expand(amount: number) {
    if (!this.currentMask) return;
    this.currentMask = expandMask(this.currentMask, this.width, this.height, amount);
    this.currentBounds = this.calculateBounds();
  }

  contract(amount: number) {
    if (!this.currentMask) return;
    this.currentMask = contractMask(this.currentMask, this.width, this.height, amount);
    this.currentBounds = this.calculateBounds();
  }

  invert() {
    if (!this.currentMask) { this.selectAll(); return; }
    this.currentMask = invertMask(this.currentMask);
    this.currentBounds = this.calculateBounds();
  }

  feather(radius: number) {
    if (!this.currentMask || radius <= 0) return;
    const result = new Uint8ClampedArray(this.currentMask.length);
    const size = Math.ceil(radius * 2) + 1;
    const half = Math.floor(size / 2);
    const sigma = radius / 3;
    const kernel: number[][] = [];
    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = x - half, dy = y - half;
        kernel[y][x] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
    }
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let sum = 0, wSum = 0;
        for (let ky = 0; ky < size; ky++) {
          for (let kx = 0; kx < size; kx++) {
            const sx = x + kx - half, sy = y + ky - half;
            if (sx >= 0 && sx < this.width && sy >= 0 && sy < this.height) {
              const w = kernel[ky][kx];
              sum += this.currentMask![sy * this.width + sx] * w;
              wSum += w;
            }
          }
        }
        result[y * this.width + x] = Math.round(sum / wSum);
      }
    }
    this.currentMask = result;
  }

  isPointInSelection(x: number, y: number): boolean {
    if (!this.currentMask) return false;
    const idx = Math.floor(y) * this.width + Math.floor(x);
    return idx >= 0 && idx < this.currentMask.length && this.currentMask[idx] > 0;
  }

  private calculateBounds(): Rect | null {
    if (!this.currentMask) return null;
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
    let has = false;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.currentMask[y * this.width + x] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          has = true;
        }
      }
    }
    return has ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null;
  }
}
