/**
 * Field Renderer — Diagnostic overlays for the Boundary Instrument
 * 
 * Phase 2+3: Enhanced with junction markers, confidence zones,
 * proximity close indicator, and backtrack ghost trail.
 */

import type { FieldCache } from './field-engine';
import type { PathVertex } from './temporal-engine';
import type { Junction, ConfidenceZone } from './ambiguity-engine';

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
    for (let i = 0; i < vertices.length - 1; i++) {
      const a = vertices[i];
      const b = vertices[i + 1];
      const conf = (a.confidence + b.confidence) / 2;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      const r = Math.round(255 * (1 - conf));
      const g = Math.round(200 * conf + 140 * (1 - conf));
      const bl = Math.round(255 * conf);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, 0.9)`;
      ctx.lineWidth = 1.5 + conf * 1.5;
      ctx.stroke();
    }
  } else {
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

  // Start point indicator
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
 * Render proximity-close indicator — glowing ring around start
 * when cursor approaches to close the path
 */
export function renderProximityCloseIndicator(
  ctx: CanvasRenderingContext2D,
  startPoint: { x: number; y: number },
  distance: number,
  threshold: number = 12
) {
  if (distance > threshold * 2) return;

  const t = Math.max(0, 1 - distance / (threshold * 2));
  const pulsePhase = (Math.sin(performance.now() / 150) + 1) / 2;
  const radius = 6 + t * 8 + pulsePhase * 3;
  const alpha = t * 0.8;

  ctx.save();

  // Outer glow
  const gradient = ctx.createRadialGradient(
    startPoint.x, startPoint.y, radius * 0.3,
    startPoint.x, startPoint.y, radius * 1.5
  );
  gradient.addColorStop(0, `rgba(0, 255, 180, ${alpha * 0.6})`);
  gradient.addColorStop(1, `rgba(0, 255, 180, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(startPoint.x, startPoint.y, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  ctx.beginPath();
  ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(0, 255, 180, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // "Close" dot
  if (distance < threshold) {
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render junction markers on the path
 */
export function renderJunctions(
  ctx: CanvasRenderingContext2D,
  junctions: Junction[]
) {
  ctx.save();

  for (const j of junctions) {
    const { position: p, severity, candidateDirections } = j;

    // Junction marker — diamond shape
    const size = severity === 'severe' ? 6 : severity === 'moderate' ? 5 : 4;
    const color = severity === 'severe' ? '255, 60, 60' :
                  severity === 'moderate' ? '255, 180, 40' : '255, 220, 100';

    ctx.beginPath();
    ctx.moveTo(p.x, p.y - size);
    ctx.lineTo(p.x + size, p.y);
    ctx.lineTo(p.x, p.y + size);
    ctx.lineTo(p.x - size, p.y);
    ctx.closePath();
    ctx.fillStyle = `rgba(${color}, 0.8)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Candidate direction arrows
    for (const dir of candidateDirections) {
      const arrowLen = 18;
      const ex = p.x + dir.x * arrowLen;
      const ey = p.y + dir.y * arrowLen;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = `rgba(${color}, 0.4)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const headLen = 5;
      const angle = Math.atan2(dir.y, dir.x);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
      ctx.strokeStyle = `rgba(${color}, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Render confidence zone highlights along the path
 */
export function renderConfidenceZones(
  ctx: CanvasRenderingContext2D,
  vertices: PathVertex[],
  zones: ConfidenceZone[]
) {
  ctx.save();

  for (const zone of zones) {
    if (zone.level === 'high') continue; // Don't highlight good zones

    const zoneVerts = vertices.slice(zone.startIndex, zone.endIndex + 1);
    if (zoneVerts.length < 2) continue;

    const color = zone.level === 'critical' ? 'rgba(255, 50, 50, 0.15)' :
                  zone.level === 'low' ? 'rgba(255, 180, 40, 0.12)' :
                  'rgba(255, 220, 100, 0.08)';

    // Draw a thickened highlight behind the path segment
    ctx.beginPath();
    ctx.moveTo(zoneVerts[0].x, zoneVerts[0].y);
    for (let i = 1; i < zoneVerts.length; i++) {
      ctx.lineTo(zoneVerts[i].x, zoneVerts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Render backtrack ghost trail — faded afterimage of removed vertices
 */
export function renderBacktrackGhost(
  ctx: CanvasRenderingContext2D,
  ghostVertices: PathVertex[],
  fadeProgress: number // 0 = just removed, 1 = fully faded
) {
  if (ghostVertices.length < 2 || fadeProgress >= 1) return;

  const alpha = Math.max(0, 0.4 * (1 - fadeProgress));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ghostVertices[0].x, ghostVertices[0].y);
  for (let i = 1; i < ghostVertices.length; i++) {
    ctx.lineTo(ghostVertices[i].x, ghostVertices[i].y);
  }
  ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
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

/**
 * Render path quality badge (small HUD element)
 */
export function renderQualityBadge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  score: number,
  label: string
) {
  ctx.save();
  
  const color = score >= 0.7 ? '0, 220, 130' :
                score >= 0.4 ? '255, 200, 40' : '255, 80, 60';

  // Background pill
  const textWidth = ctx.measureText(label).width + 30;
  ctx.fillStyle = `rgba(0, 0, 0, 0.6)`;
  ctx.beginPath();
  const h = 18;
  const r = 9;
  ctx.roundRect(x, y, textWidth, h, r);
  ctx.fill();

  // Score dot
  ctx.beginPath();
  ctx.arc(x + 10, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${color}, 0.9)`;
  ctx.fill();

  // Label
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 18, y + h / 2);

  ctx.restore();
}
