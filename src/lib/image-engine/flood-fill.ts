// Ultra-Fast Flood Fill with Differential Preview
// Features: Ring BFS, circular expansion, global color select

export interface FloodFillOptions {
  tolerance: number;
  contiguous: boolean;
  connectivity: 4 | 8;
  maxPixels: number;
}

export interface FloodFillResult {
  mask: Uint8ClampedArray;
  bounds: { x: number; y: number; width: number; height: number };
  pixelCount: number;
  width: number;
  height: number;
}

export class FastFloodFill {
  private data: Uint8ClampedArray;
  private width: number;
  private height: number;

  constructor(imageData: ImageData) {
    this.data = imageData.data;
    this.width = imageData.width;
    this.height = imageData.height;
  }

  execute(seedX: number, seedY: number, options: Partial<FloodFillOptions> = {}): FloodFillResult {
    const opts: FloodFillOptions = {
      tolerance: 32,
      contiguous: true,
      connectivity: 4,
      maxPixels: 2_000_000,
      ...options,
    };

    seedX = Math.max(0, Math.min(this.width - 1, Math.floor(seedX)));
    seedY = Math.max(0, Math.min(this.height - 1, Math.floor(seedY)));

    if (!opts.contiguous) return this.globalSelect(seedX, seedY, opts.tolerance);

    const size = this.width * this.height;
    const mask = new Uint8ClampedArray(size);
    const visited = new Uint8Array(size);
    const queue = new Int32Array(Math.min(size, opts.maxPixels * 2));
    let qStart = 0, qEnd = 1;

    const seedIdx = seedY * this.width + seedX;
    const ci = seedIdx * 4;
    const sr = this.data[ci], sg = this.data[ci + 1], sb = this.data[ci + 2];

    queue[0] = seedIdx;
    visited[seedIdx] = 1;

    let minX = seedX, maxX = seedX, minY = seedY, maxY = seedY;
    let pixelCount = 0;

    const dx = opts.connectivity === 8 ? [0, 1, 1, 1, 0, -1, -1, -1] : [0, 1, 0, -1];
    const dy = opts.connectivity === 8 ? [-1, -1, 0, 1, 1, 1, 0, -1] : [-1, 0, 1, 0];
    const nc = dx.length;

    while (qStart < qEnd && pixelCount < opts.maxPixels) {
      const pi = queue[qStart++];
      if (visited[pi] >= 2) continue;

      const x = pi % this.width;
      const y = (pi / this.width) | 0;
      const cIdx = pi * 4;
      const dr = this.data[cIdx] - sr;
      const dg = this.data[cIdx + 1] - sg;
      const db = this.data[cIdx + 2] - sb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist <= opts.tolerance) {
        visited[pi] = 2;
        mask[pi] = 255;
        pixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        for (let i = 0; i < nc; i++) {
          const nx = x + dx[i], ny = y + dy[i];
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const ni = ny * this.width + nx;
            if (visited[ni] === 0 && qEnd < queue.length) {
              visited[ni] = 1;
              queue[qEnd++] = ni;
            }
          }
        }
      } else {
        visited[pi] = 3;
      }
    }

    return {
      mask,
      bounds: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
      pixelCount,
      width: this.width,
      height: this.height,
    };
  }

  private globalSelect(seedX: number, seedY: number, tolerance: number): FloodFillResult {
    const size = this.width * this.height;
    const mask = new Uint8ClampedArray(size);
    const si = (seedY * this.width + seedX) * 4;
    const sr = this.data[si], sg = this.data[si + 1], sb = this.data[si + 2];
    let pixelCount = 0;
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;

    for (let i = 0; i < size; i++) {
      const ci = i * 4;
      const dr = this.data[ci] - sr;
      const dg = this.data[ci + 1] - sg;
      const db = this.data[ci + 2] - sb;
      if (Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance) {
        mask[i] = 255;
        pixelCount++;
        const x = i % this.width, y = (i / this.width) | 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    return {
      mask,
      bounds: pixelCount > 0
        ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
        : { x: 0, y: 0, width: 0, height: 0 },
      pixelCount,
      width: this.width,
      height: this.height,
    };
  }
}

// Selection mask operations
export function expandMask(mask: Uint8ClampedArray, width: number, height: number, amount: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask);
  for (let iter = 0; iter < amount; iter++) {
    const temp = new Uint8ClampedArray(result);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (temp[idx] === 0) {
          if (temp[idx - 1] > 0 || temp[idx + 1] > 0 || temp[idx - width] > 0 || temp[idx + width] > 0) {
            result[idx] = 255;
          }
        }
      }
    }
  }
  return result;
}

export function contractMask(mask: Uint8ClampedArray, width: number, height: number, amount: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask);
  for (let iter = 0; iter < amount; iter++) {
    const temp = new Uint8ClampedArray(result);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (temp[idx] > 0) {
          if (temp[idx - 1] === 0 || temp[idx + 1] === 0 || temp[idx - width] === 0 || temp[idx + width] === 0) {
            result[idx] = 0;
          }
        }
      }
    }
  }
  return result;
}

export function invertMask(mask: Uint8ClampedArray): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask.length);
  for (let i = 0; i < mask.length; i++) result[i] = mask[i] > 0 ? 0 : 255;
  return result;
}

export function combineMasks(a: Uint8ClampedArray, b: Uint8ClampedArray, mode: 'add' | 'subtract' | 'intersect'): Uint8ClampedArray {
  const result = new Uint8ClampedArray(a.length);
  for (let i = 0; i < a.length; i++) {
    switch (mode) {
      case 'add': result[i] = Math.min(255, a[i] + b[i]); break;
      case 'subtract': result[i] = Math.max(0, a[i] - b[i]); break;
      case 'intersect': result[i] = Math.min(a[i], b[i]); break;
    }
  }
  return result;
}
