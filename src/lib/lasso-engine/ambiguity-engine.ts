/**
 * Ambiguity Engine — Boundary Instrument Thesis §10-12
 * 
 * Phase 3: Confidence-driven ambiguity mechanics
 * - Junction detection at low-coherence intersections
 * - Alternative path suggestions at ambiguous regions
 * - Confidence zone mapping for visual feedback
 * - Path quality scoring
 */

import type { FieldCache } from './field-engine';
import { sampleCoherence, sampleField } from './field-engine';
import { PathBody, type PathVertex } from './temporal-engine';
import type { Vec2 } from './motion-engine';

// ============================================
// JUNCTION — ambiguous branching point
// ============================================

export interface Junction {
  index: number;          // vertex index in path
  position: Vec2;
  confidence: number;     // field confidence (low = ambiguous)
  coherence: number;      // structure tensor coherence
  candidateDirections: Vec2[];  // possible alternative directions
  severity: 'mild' | 'moderate' | 'severe';
}

// ============================================
// CONFIDENCE ZONE — contiguous region of similar confidence
// ============================================

export interface ConfidenceZone {
  startIndex: number;
  endIndex: number;
  avgConfidence: number;
  minConfidence: number;
  level: 'high' | 'medium' | 'low' | 'critical';
  centroid: Vec2;
}

// ============================================
// PATH QUALITY REPORT
// ============================================

export interface PathQualityReport {
  overallScore: number;         // [0,1]
  avgConfidence: number;
  lowConfidenceRatio: number;   // fraction of path with low confidence
  junctionCount: number;
  smoothness: number;           // inverse of avg curvature
  closureQuality: number;       // how clean the close is [0,1]
  zones: ConfidenceZone[];
  junctions: Junction[];
}

// ============================================
// JUNCTION DETECTOR
// ============================================

export function detectJunctions(
  path: PathBody,
  cache: FieldCache | null,
  confidenceThreshold: number = 0.25,
  minSpacing: number = 20
): Junction[] {
  if (!cache || path.length < 10) return [];

  const junctions: Junction[] = [];
  let lastJunctionIdx = -minSpacing;

  for (let i = 5; i < path.vertices.length - 5; i++) {
    const v = path.vertices[i];

    // Skip if too close to last junction
    if (i - lastJunctionIdx < minSpacing) continue;

    // Check local confidence dip
    const conf = v.confidence;
    if (conf >= confidenceThreshold) continue;

    // Verify it's a local minimum (not just noise)
    const prevConf = path.vertices[i - 3].confidence;
    const nextConf = path.vertices[Math.min(i + 3, path.vertices.length - 1)].confidence;
    if (conf > prevConf || conf > nextConf) continue;

    // Sample coherence from field
    const coherence = sampleCoherence(cache, v.x, v.y);

    // Compute candidate alternative directions from gradient field
    const candidates = computeCandidateDirections(cache, v, path, i);

    const severity: Junction['severity'] =
      conf < 0.1 ? 'severe' :
      conf < 0.2 ? 'moderate' : 'mild';

    junctions.push({
      index: i,
      position: { x: v.x, y: v.y },
      confidence: conf,
      coherence,
      candidateDirections: candidates,
      severity,
    });

    lastJunctionIdx = i;
  }

  return junctions;
}

/** 
 * At an ambiguous point, sample the gradient field in a ring 
 * to find alternative strong-edge directions the path could follow.
 */
function computeCandidateDirections(
  cache: FieldCache,
  vertex: PathVertex,
  path: PathBody,
  vertexIndex: number
): Vec2[] {
  const candidates: Vec2[] = [];
  const sampleRadius = 15;
  const numSamples = 12;

  // Current path direction
  let pathDir = 0;
  if (vertexIndex > 0) {
    const prev = path.vertices[vertexIndex - 1];
    pathDir = Math.atan2(vertex.y - prev.y, vertex.x - prev.x);
  }

  for (let i = 0; i < numSamples; i++) {
    const angle = (i / numSamples) * Math.PI * 2;

    // Skip directions close to current path direction (within ±30°)
    const angleDiff = Math.abs(((angle - pathDir + Math.PI) % (Math.PI * 2)) - Math.PI);
    if (angleDiff < Math.PI / 6) continue;

    const sx = vertex.x + Math.cos(angle) * sampleRadius;
    const sy = vertex.y + Math.sin(angle) * sampleRadius;

    // Check bounds
    if (sx < 0 || sx >= cache.width || sy < 0 || sy >= cache.height) continue;

    const mag = sampleField(cache.gradMag, cache.width, cache.height, sx, sy);
    const coh = sampleField(cache.coherence, cache.width, cache.height, sx, sy);

    // Only suggest directions with strong edges
    if (mag > 0.3 && coh > 0.4) {
      candidates.push({
        x: Math.cos(angle),
        y: Math.sin(angle),
      });
    }
  }

  return candidates;
}

// ============================================
// CONFIDENCE ZONE MAPPER
// ============================================

export function mapConfidenceZones(path: PathBody): ConfidenceZone[] {
  if (path.length < 5) return [];

  const zones: ConfidenceZone[] = [];
  let zoneStart = 0;
  let currentLevel = classifyConfidence(path.vertices[0].confidence);

  for (let i = 1; i < path.vertices.length; i++) {
    const level = classifyConfidence(path.vertices[i].confidence);

    if (level !== currentLevel || i === path.vertices.length - 1) {
      // Close current zone
      const end = (level !== currentLevel) ? i - 1 : i;
      const zoneVerts = path.vertices.slice(zoneStart, end + 1);

      let sumConf = 0;
      let minConf = 1;
      let cx = 0, cy = 0;
      for (const v of zoneVerts) {
        sumConf += v.confidence;
        if (v.confidence < minConf) minConf = v.confidence;
        cx += v.x;
        cy += v.y;
      }

      zones.push({
        startIndex: zoneStart,
        endIndex: end,
        avgConfidence: sumConf / zoneVerts.length,
        minConfidence: minConf,
        level: currentLevel,
        centroid: { x: cx / zoneVerts.length, y: cy / zoneVerts.length },
      });

      zoneStart = i;
      currentLevel = level;
    }
  }

  return zones;
}

function classifyConfidence(c: number): ConfidenceZone['level'] {
  if (c >= 0.7) return 'high';
  if (c >= 0.4) return 'medium';
  if (c >= 0.15) return 'low';
  return 'critical';
}

// ============================================
// PATH QUALITY SCORER
// ============================================

export function scorePathQuality(
  path: PathBody,
  cache: FieldCache | null
): PathQualityReport {
  const junctions = detectJunctions(path, cache);
  const zones = mapConfidenceZones(path);

  // Average confidence
  const avgConfidence = path.averageConfidence();

  // Low confidence ratio
  let lowCount = 0;
  for (const v of path.vertices) {
    if (v.confidence < 0.3) lowCount++;
  }
  const lowConfidenceRatio = path.length > 0 ? lowCount / path.length : 0;

  // Smoothness (inverse of average curvature)
  path.computeCurvature();
  let curvSum = 0;
  for (const v of path.vertices) {
    curvSum += v.curvature ?? 0;
  }
  const avgCurv = path.length > 0 ? curvSum / path.length : 0;
  const smoothness = 1 / (1 + avgCurv * 50);

  // Closure quality
  let closureQuality = 0;
  if (path.closed && path.length >= 3) {
    const first = path.firstVertex!;
    const last = path.lastVertex!;
    const dist = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
    closureQuality = Math.max(0, 1 - dist / 20);
  }

  // Overall score
  const overallScore = Math.max(0, Math.min(1,
    avgConfidence * 0.35 +
    (1 - lowConfidenceRatio) * 0.25 +
    smoothness * 0.2 +
    closureQuality * 0.1 +
    (1 - Math.min(junctions.length / 5, 1)) * 0.1
  ));

  return {
    overallScore,
    avgConfidence,
    lowConfidenceRatio,
    junctionCount: junctions.length,
    smoothness,
    closureQuality,
    zones,
    junctions,
  };
}
