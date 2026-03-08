/**
 * Field Engine — Boundary Instrument Thesis §19
 * 
 * Constructs the local contour field from image data:
 * - Sobel gradient extraction (magnitude + direction)
 * - Structure tensor (coherence, cornerness, dominant orientation)
 * - Scalar terrain synthesis (contour valleys for path snapping)
 * - Continuous sub-pixel sampler (bilinear interpolation)
 */

// ============================================
// IMAGE DATA CACHE
// ============================================

export interface FieldCache {
  width: number;
  height: number;
  // Per-pixel channels (flat arrays for performance)
  gradMag: Float32Array;      // gradient magnitude
  gradDir: Float32Array;      // gradient direction (radians)
  gradX: Float32Array;        // horizontal gradient
  gradY: Float32Array;        // vertical gradient
  coherence: Float32Array;    // structure tensor coherence [0,1]
  cornerness: Float32Array;   // structure tensor cornerness
  orientation: Float32Array;  // dominant edge orientation (radians)
  terrain: Float32Array;      // scalar terrain (inverted magnitude = valleys at edges)
  luminance: Float32Array;    // grayscale luminance
}

// ============================================
// GRADIENT EXTRACTION (Sobel)
// ============================================

function luminanceFromRGBA(data: Uint8ClampedArray, i: number): number {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function buildLuminance(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    lum[i] = luminanceFromRGBA(data, i * 4) / 255;
  }
  return lum;
}

function sobelGradients(
  lum: Float32Array, w: number, h: number
): { gx: Float32Array; gy: Float32Array; mag: Float32Array; dir: Float32Array } {
  const n = w * h;
  const gx = new Float32Array(n);
  const gy = new Float32Array(n);
  const mag = new Float32Array(n);
  const dir = new Float32Array(n);

  // Sobel kernels applied per pixel (skip border)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const tl = lum[(y - 1) * w + (x - 1)];
      const t  = lum[(y - 1) * w + x];
      const tr = lum[(y - 1) * w + (x + 1)];
      const l  = lum[y * w + (x - 1)];
      const r  = lum[y * w + (x + 1)];
      const bl = lum[(y + 1) * w + (x - 1)];
      const b  = lum[(y + 1) * w + x];
      const br = lum[(y + 1) * w + (x + 1)];

      const sx = -tl + tr - 2 * l + 2 * r - bl + br;
      const sy = -tl - 2 * t - tr + bl + 2 * b + br;

      gx[idx] = sx;
      gy[idx] = sy;
      mag[idx] = Math.sqrt(sx * sx + sy * sy);
      dir[idx] = Math.atan2(sy, sx);
    }
  }
  return { gx, gy, mag, dir };
}

// ============================================
// STRUCTURE TENSOR (windowed)
// ============================================

function structureTensor(
  gx: Float32Array, gy: Float32Array, w: number, h: number, windowR: number = 2
): { coherence: Float32Array; cornerness: Float32Array; orientation: Float32Array } {
  const n = w * h;
  const coherence = new Float32Array(n);
  const cornerness = new Float32Array(n);
  const orientation = new Float32Array(n);

  for (let y = windowR; y < h - windowR; y++) {
    for (let x = windowR; x < w - windowR; x++) {
      let Jxx = 0, Jxy = 0, Jyy = 0;

      for (let dy = -windowR; dy <= windowR; dy++) {
        for (let dx = -windowR; dx <= windowR; dx++) {
          const i = (y + dy) * w + (x + dx);
          Jxx += gx[i] * gx[i];
          Jxy += gx[i] * gy[i];
          Jyy += gy[i] * gy[i];
        }
      }

      const idx = y * w + x;
      const trace = Jxx + Jyy;
      const det = Jxx * Jyy - Jxy * Jxy;
      const disc = Math.sqrt(Math.max(0, (Jxx - Jyy) ** 2 + 4 * Jxy * Jxy));

      // Eigenvalues
      const l1 = (trace + disc) / 2;
      const l2 = (trace - disc) / 2;

      // Coherence: how "edgy" vs "cornery" — (l1-l2)/(l1+l2)
      coherence[idx] = trace > 1e-6 ? (l1 - l2) / (l1 + l2) : 0;

      // Cornerness (Harris-like): det - k * trace^2
      cornerness[idx] = det - 0.04 * trace * trace;

      // Dominant orientation (perpendicular to gradient = along the edge)
      orientation[idx] = 0.5 * Math.atan2(2 * Jxy, Jxx - Jyy);
    }
  }

  return { coherence, cornerness, orientation };
}

// ============================================
// SCALAR TERRAIN (valleys at edges)
// ============================================

function buildTerrain(mag: Float32Array): Float32Array {
  const terrain = new Float32Array(mag.length);
  // Find max magnitude for normalization
  let maxMag = 0;
  for (let i = 0; i < mag.length; i++) {
    if (mag[i] > maxMag) maxMag = mag[i];
  }
  const inv = maxMag > 0 ? 1 / maxMag : 1;
  // Invert: high gradient = low terrain (valleys)
  for (let i = 0; i < mag.length; i++) {
    terrain[i] = 1 - mag[i] * inv;
  }
  return terrain;
}

// ============================================
// SUB-PIXEL SAMPLER (bilinear)
// ============================================

export function sampleField(field: Float32Array, w: number, h: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0;
  const fy = y - y0;

  const v00 = field[y0 * w + x0] || 0;
  const v10 = field[y0 * w + x1] || 0;
  const v01 = field[y1 * w + x0] || 0;
  const v11 = field[y1 * w + x1] || 0;

  return v00 * (1 - fx) * (1 - fy)
       + v10 * fx * (1 - fy)
       + v01 * (1 - fx) * fy
       + v11 * fx * fy;
}

export function sampleGradient(
  cache: FieldCache, x: number, y: number
): { mag: number; dir: number; gx: number; gy: number } {
  const { width: w, height: h } = cache;
  return {
    mag: sampleField(cache.gradMag, w, h, x, y),
    dir: sampleField(cache.gradDir, w, h, x, y),
    gx: sampleField(cache.gradX, w, h, x, y),
    gy: sampleField(cache.gradY, w, h, x, y),
  };
}

export function sampleTerrain(cache: FieldCache, x: number, y: number): number {
  return sampleField(cache.terrain, cache.width, cache.height, x, y);
}

export function sampleCoherence(cache: FieldCache, x: number, y: number): number {
  return sampleField(cache.coherence, cache.width, cache.height, x, y);
}

export function sampleOrientation(cache: FieldCache, x: number, y: number): number {
  return sampleField(cache.orientation, cache.width, cache.height, x, y);
}

// ============================================
// FIELD CACHE BUILDER
// ============================================

export function buildFieldCache(imageData: ImageData): FieldCache {
  const { width, height } = imageData;
  const luminance = buildLuminance(imageData);
  const { gx, gy, mag, dir } = sobelGradients(luminance, width, height);
  const { coherence, cornerness, orientation } = structureTensor(gx, gy, width, height, 2);
  const terrain = buildTerrain(mag);

  return {
    width, height,
    gradMag: mag,
    gradDir: dir,
    gradX: gx,
    gradY: gy,
    coherence,
    cornerness,
    orientation,
    terrain,
    luminance,
  };
}
