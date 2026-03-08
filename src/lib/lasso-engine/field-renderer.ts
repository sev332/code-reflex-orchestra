/**
 * Field Renderer — Diagnostic overlays for the Boundary Instrument
 * 
 * Renders gradient magnitude, coherence, terrain, and confidence
 * as translucent overlays on the canvas.
 */

import type { FieldCache } from './field-engine';
import type { PathVertex } from './temporal-engine';

/**
 * Render gradient magnitude as a heat overlay
 */
export function renderGradientOverlay(
  ctx: CanvasRenderingContext2D,
  cache: FieldCache,
  opacity: number = 0.4
) {
  const { width, height, gradMag } = cache;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  let maxMag = 0;
  for (let i = 0; i < gradMag.length; i++) {
    if (gradMag[i] > maxMag) maxMag = gradMag[i];
  }
  const inv = maxMag > 0 ? 1 / maxMag : 1;

  for (let i = 0; i < gradMag.length; i++) {
    const v = gradMag[i] * inv;
    const pi = i * 4;
    // Cyan-hot colormap
    data[pi] = Math.round(v * 80);
    data[pi + 1] = Math.round(v * 220);
    data[pi + 2] = Math.round(v * 255);
    data[pi + 3] = Math.round(v * 255 * opacity);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Render coherence as a magenta overlay
 */
export function renderCoherenceOverlay(
  ctx: CanvasRenderingContext2D,
  cache: FieldCache,
  opacity: number = 0.3
) {
  const { width, height, coherence } = cache;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < coherence.length; i++) {
    const v = coherence[i];
    const pi = i * 4;
    data[pi] = Math.round(v * 220);
    data[pi + 1] = Math.round(v * 50);
    data[pi + 2] = Math.round(v * 200);
    data[pi + 3] = Math.round(v * 255 * opacity);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Render the lasso path with confidence-colored ribbon
 */
export function renderLassoPath(
  ctx: CanvasRenderingContext2D,
  vertices: PathVertex[],
  closed: boolean,
  showConfidence: boolean = true
) {
  if (vertices.length < 2) return;

  ctx.save();

  if (showConfidence) {
    // Draw confidence ribbon — width and color vary with confidence
    for (let i = 0; i < vertices.length - 1; i++) {
      const a = vertices[i];
      const b = vertices[i + 1];
      const conf = (a.confidence + b.confidence) / 2;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      // High confidence = cyan, low = amber
      const r = Math.round(255 * (1 - conf));
      const g = Math.round(200 * conf + 140 * (1 - conf));
      const bl = Math.round(255 * conf);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, 0.9)`;
      ctx.lineWidth = 1.5 + conf * 1.5;
      ctx.stroke();
    }
  } else {
    // Simple path
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    if (closed) ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Marching ants for closed path
  if (closed) {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -(performance.now() / 40) % 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw start point indicator
  if (vertices.length > 0) {
    const start = vertices[0];
    ctx.beginPath();
    ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 180, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Render mask overlay (semi-transparent fill)
 */
export function renderMaskOverlay(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  width: number,
  height: number,
  color: [number, number, number] = [0, 180, 255],
  opacity: number = 0.25
) {
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < mask.length; i++) {
    const pi = i * 4;
    if (mask[i] > 0) {
      data[pi] = color[0];
      data[pi + 1] = color[1];
      data[pi + 2] = color[2];
      data[pi + 3] = Math.round((mask[i] / 255) * 255 * opacity);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
