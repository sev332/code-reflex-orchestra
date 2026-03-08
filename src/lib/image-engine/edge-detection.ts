// Advanced Edge Detection Engine
// Supports: Sobel, Prewitt, Scharr, Roberts Cross, Laplacian of Gaussian, Canny

export interface EdgeMap {
  magnitude: Float32Array;
  direction: Float32Array;
  width: number;
  height: number;
}

export interface EdgeDetectionOptions {
  method: 'sobel' | 'prewitt' | 'scharr' | 'roberts' | 'log' | 'canny';
  sensitivity: number;
  threshold: number;
  hysteresisLow: number;
  hysteresisHigh: number;
  gaussianBlur: boolean;
  blurRadius: number;
  nonMaxSuppression: boolean;
}

export const DEFAULT_EDGE_OPTIONS: EdgeDetectionOptions = {
  method: 'sobel',
  sensitivity: 50,
  threshold: 30,
  hysteresisLow: 20,
  hysteresisHigh: 80,
  gaussianBlur: true,
  blurRadius: 1.4,
  nonMaxSuppression: true,
};

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
const PREWITT_X = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
const PREWITT_Y = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];
const SCHARR_X = [[-3, 0, 3], [-10, 0, 10], [-3, 0, 3]];
const SCHARR_Y = [[-3, -10, -3], [0, 0, 0], [3, 10, 3]];
const LAPLACIAN = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

export class EdgeDetectionEngine {
  private grayscale: Float32Array;
  private width: number;
  private height: number;
  private edgeMap: EdgeMap | null = null;
  private options: EdgeDetectionOptions;

  constructor(imageData: ImageData, options: Partial<EdgeDetectionOptions> = {}) {
    this.width = imageData.width;
    this.height = imageData.height;
    this.options = { ...DEFAULT_EDGE_OPTIONS, ...options };
    this.grayscale = this.convertToGrayscale(imageData);
  }

  private convertToGrayscale(imageData: ImageData): Float32Array {
    const { data, width, height } = imageData;
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
    return gray;
  }

  private gaussianBlurPass(input: Float32Array, sigma: number): Float32Array {
    const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
    const kernel = new Float32Array(kernelSize);
    const center = Math.floor(kernelSize / 2);
    let sum = 0;
    for (let i = 0; i < kernelSize; i++) {
      const x = i - center;
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
      sum += kernel[i];
    }
    for (let i = 0; i < kernelSize; i++) kernel[i] /= sum;

    const temp = new Float32Array(this.width * this.height);
    const output = new Float32Array(this.width * this.height);
    const halfSize = center;

    // Horizontal
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let s = 0, w = 0;
        for (let k = -halfSize; k <= halfSize; k++) {
          const px = Math.min(Math.max(x + k, 0), this.width - 1);
          const kv = kernel[k + halfSize];
          s += input[y * this.width + px] * kv;
          w += kv;
        }
        temp[y * this.width + x] = s / w;
      }
    }
    // Vertical
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let s = 0, w = 0;
        for (let k = -halfSize; k <= halfSize; k++) {
          const py = Math.min(Math.max(y + k, 0), this.height - 1);
          const kv = kernel[k + halfSize];
          s += temp[py * this.width + x] * kv;
          w += kv;
        }
        output[y * this.width + x] = s / w;
      }
    }
    return output;
  }

  private convolve2D(input: Float32Array, kernelX: number[][], kernelY: number[][]): { gx: Float32Array; gy: Float32Array } {
    const gx = new Float32Array(this.width * this.height);
    const gy = new Float32Array(this.width * this.height);
    const kSize = kernelX.length;
    const half = Math.floor(kSize / 2);

    for (let y = half; y < this.height - half; y++) {
      for (let x = half; x < this.width - half; x++) {
        let sumX = 0, sumY = 0;
        for (let ky = 0; ky < kSize; ky++) {
          for (let kx = 0; kx < kSize; kx++) {
            const val = input[(y + ky - half) * this.width + (x + kx - half)];
            sumX += val * kernelX[ky][kx];
            sumY += val * kernelY[ky][kx];
          }
        }
        const idx = y * this.width + x;
        gx[idx] = sumX;
        gy[idx] = sumY;
      }
    }
    return { gx, gy };
  }

  private computeMagnitudeAndDirection(gx: Float32Array, gy: Float32Array): EdgeMap {
    const magnitude = new Float32Array(this.width * this.height);
    const direction = new Float32Array(this.width * this.height);
    const sensitivity = this.options.sensitivity / 50;
    for (let i = 0; i < this.width * this.height; i++) {
      magnitude[i] = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]) * sensitivity;
      direction[i] = Math.atan2(gy[i], gx[i]);
    }
    return { magnitude, direction, width: this.width, height: this.height };
  }

  private nonMaximumSuppression(edgeMap: EdgeMap): EdgeMap {
    const { magnitude, direction, width, height } = edgeMap;
    const suppressed = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const angle = direction[idx];
        const mag = magnitude[idx];
        const angleNorm = ((angle * 180 / Math.PI) + 180) % 180;
        let n1: number, n2: number;
        if (angleNorm < 22.5 || angleNorm >= 157.5) {
          n1 = magnitude[idx - 1]; n2 = magnitude[idx + 1];
        } else if (angleNorm < 67.5) {
          n1 = magnitude[(y - 1) * width + x + 1]; n2 = magnitude[(y + 1) * width + x - 1];
        } else if (angleNorm < 112.5) {
          n1 = magnitude[(y - 1) * width + x]; n2 = magnitude[(y + 1) * width + x];
        } else {
          n1 = magnitude[(y - 1) * width + x - 1]; n2 = magnitude[(y + 1) * width + x + 1];
        }
        suppressed[idx] = (mag >= n1 && mag >= n2) ? mag : 0;
      }
    }
    return { magnitude: suppressed, direction, width, height };
  }

  private doubleThreshold(edgeMap: EdgeMap): EdgeMap {
    const { magnitude, direction, width, height } = edgeMap;
    const thresholded = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      if (magnitude[i] >= this.options.hysteresisHigh) thresholded[i] = 255;
      else if (magnitude[i] >= this.options.hysteresisLow) thresholded[i] = 128;
    }
    return { magnitude: thresholded, direction, width, height };
  }

  private hysteresisTracking(edgeMap: EdgeMap): EdgeMap {
    const { magnitude, direction, width, height } = edgeMap;
    const result = new Float32Array(magnitude);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (result[idx] === 128) {
          let hasStrong = false;
          for (let dy = -1; dy <= 1 && !hasStrong; dy++)
            for (let dx = -1; dx <= 1 && !hasStrong; dx++)
              if ((dx || dy) && result[(y + dy) * width + (x + dx)] === 255) hasStrong = true;
          result[idx] = hasStrong ? 255 : 0;
        }
      }
    }
    return { magnitude: result, direction, width, height };
  }

  compute(): EdgeMap {
    let input = this.grayscale;
    if (this.options.gaussianBlur && this.options.method !== 'log') {
      input = this.gaussianBlurPass(input, this.options.blurRadius);
    }

    let edgeMap: EdgeMap;
    switch (this.options.method) {
      case 'sobel': {
        const { gx, gy } = this.convolve2D(input, SOBEL_X, SOBEL_Y);
        edgeMap = this.computeMagnitudeAndDirection(gx, gy);
        break;
      }
      case 'prewitt': {
        const { gx, gy } = this.convolve2D(input, PREWITT_X, PREWITT_Y);
        edgeMap = this.computeMagnitudeAndDirection(gx, gy);
        break;
      }
      case 'scharr': {
        const { gx, gy } = this.convolve2D(input, SCHARR_X, SCHARR_Y);
        edgeMap = this.computeMagnitudeAndDirection(gx, gy);
        break;
      }
      case 'canny': {
        const { gx, gy } = this.convolve2D(input, SOBEL_X, SOBEL_Y);
        edgeMap = this.computeMagnitudeAndDirection(gx, gy);
        if (this.options.nonMaxSuppression) edgeMap = this.nonMaximumSuppression(edgeMap);
        edgeMap = this.doubleThreshold(edgeMap);
        edgeMap = this.hysteresisTracking(edgeMap);
        break;
      }
      case 'log': {
        const blurred = this.gaussianBlurPass(this.grayscale, this.options.blurRadius);
        const mag = new Float32Array(this.width * this.height);
        const dir = new Float32Array(this.width * this.height);
        for (let y = 1; y < this.height - 1; y++) {
          for (let x = 1; x < this.width - 1; x++) {
            let sum = 0;
            for (let ky = 0; ky < 3; ky++)
              for (let kx = 0; kx < 3; kx++)
                sum += blurred[(y + ky - 1) * this.width + (x + kx - 1)] * LAPLACIAN[ky][kx];
            mag[y * this.width + x] = Math.abs(sum) * (this.options.sensitivity / 50);
          }
        }
        edgeMap = { magnitude: mag, direction: dir, width: this.width, height: this.height };
        break;
      }
      default: {
        const { gx, gy } = this.convolve2D(input, SOBEL_X, SOBEL_Y);
        edgeMap = this.computeMagnitudeAndDirection(gx, gy);
      }
    }

    if (this.options.nonMaxSuppression && this.options.method !== 'canny') {
      edgeMap = this.nonMaximumSuppression(edgeMap);
    }
    this.edgeMap = edgeMap;
    return edgeMap;
  }

  getEdgeStrength(x: number, y: number): number {
    if (!this.edgeMap) return 0;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.edgeMap.magnitude[Math.floor(y) * this.width + Math.floor(x)];
  }

  getEdgeCost(x: number, y: number, maxStrength = 255): number {
    return maxStrength - Math.min(this.getEdgeStrength(x, y), maxStrength);
  }

  getEdgeMap(): EdgeMap | null { return this.edgeMap; }
}

export function visualizeEdgeMap(edgeMap: EdgeMap): ImageData {
  const { magnitude, width, height } = edgeMap;
  const imageData = new ImageData(width, height);
  let max = 0;
  for (let i = 0; i < magnitude.length; i++) if (magnitude[i] > max) max = magnitude[i];
  for (let i = 0; i < magnitude.length; i++) {
    const v = max > 0 ? Math.floor((magnitude[i] / max) * 255) : 0;
    const idx = i * 4;
    imageData.data[idx] = v;
    imageData.data[idx + 1] = v;
    imageData.data[idx + 2] = v;
    imageData.data[idx + 3] = 255;
  }
  return imageData;
}
