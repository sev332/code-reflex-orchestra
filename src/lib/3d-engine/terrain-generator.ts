// ─── Procedural Geometry & Terrain Generator ──────
// Phase 5: Advanced geometry tools

import * as THREE from 'three';

// ─── Noise Function (Simplex-like) ─────────────────

function hash2d(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) / 2147483648;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function noise2d(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = smoothstep(fx);
  const sy = smoothstep(fy);
  const n00 = hash2d(ix, iy);
  const n10 = hash2d(ix + 1, iy);
  const n01 = hash2d(ix, iy + 1);
  const n11 = hash2d(ix + 1, iy + 1);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function fbm(x: number, y: number, octaves: number, lacunarity: number, gain: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2d(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return value / maxValue;
}

// ─── Terrain Config ────────────────────────────────

export interface TerrainConfig {
  width: number;
  depth: number;
  resolution: number; // segments per unit
  heightScale: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  seed: number;
  plateauHeight: number; // flatten above this
  erosionStrength: number;
  waterLevel: number;
}

export const defaultTerrainConfig: TerrainConfig = {
  width: 20,
  depth: 20,
  resolution: 4,
  heightScale: 3,
  octaves: 6,
  lacunarity: 2,
  gain: 0.5,
  seed: 42,
  plateauHeight: 0.8,
  erosionStrength: 0.3,
  waterLevel: 0.2,
};

export interface TerrainPreset {
  id: string;
  name: string;
  thumbnail: string;
  config: Partial<TerrainConfig>;
}

export const terrainPresets: TerrainPreset[] = [
  { id: 'hills', name: 'Rolling Hills', thumbnail: '🏔️', config: { heightScale: 2, octaves: 4, gain: 0.4, lacunarity: 2, erosionStrength: 0.1 } },
  { id: 'mountains', name: 'Mountains', thumbnail: '⛰️', config: { heightScale: 6, octaves: 8, gain: 0.5, lacunarity: 2.2, erosionStrength: 0.4 } },
  { id: 'desert', name: 'Desert Dunes', thumbnail: '🏜️', config: { heightScale: 1.5, octaves: 3, gain: 0.6, lacunarity: 1.8, erosionStrength: 0 } },
  { id: 'canyon', name: 'Canyon', thumbnail: '🏞️', config: { heightScale: 5, octaves: 6, gain: 0.55, lacunarity: 2.5, plateauHeight: 0.6, erosionStrength: 0.7 } },
  { id: 'island', name: 'Island', thumbnail: '🏝️', config: { heightScale: 3, octaves: 5, gain: 0.45, waterLevel: 0.35, erosionStrength: 0.2 } },
  { id: 'flat', name: 'Flat Plains', thumbnail: '🌾', config: { heightScale: 0.3, octaves: 3, gain: 0.3, erosionStrength: 0 } },
];

// ─── Terrain Mesh Generator ────────────────────────

export function generateTerrainGeometry(config: TerrainConfig): THREE.BufferGeometry {
  const segW = Math.round(config.width * config.resolution);
  const segD = Math.round(config.depth * config.resolution);
  const geo = new THREE.PlaneGeometry(config.width, config.depth, segW, segD);
  geo.rotateX(-Math.PI / 2);

  const positions = geo.attributes.position;
  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    // Generate height
    let h = fbm(
      x * 0.15 + config.seed,
      z * 0.15 + config.seed * 0.7,
      config.octaves,
      config.lacunarity,
      config.gain
    );

    // Plateau clamp
    if (config.plateauHeight < 1) {
      h = Math.min(h, config.plateauHeight);
    }

    // Erosion: reduce height based on slope approximation
    if (config.erosionStrength > 0) {
      const dx = fbm((x + 0.1) * 0.15 + config.seed, z * 0.15 + config.seed * 0.7, config.octaves, config.lacunarity, config.gain) - h;
      const dz = fbm(x * 0.15 + config.seed, (z + 0.1) * 0.15 + config.seed * 0.7, config.octaves, config.lacunarity, config.gain) - h;
      const slope = Math.sqrt(dx * dx + dz * dz) * 10;
      h -= slope * config.erosionStrength * 0.5;
    }

    // Island mask: fade edges to water level
    const distFromCenter = Math.sqrt((x / config.width * 2) ** 2 + (z / config.depth * 2) ** 2);
    const islandMask = Math.max(0, 1 - distFromCenter * 1.2);

    const finalH = Math.max(config.waterLevel * config.heightScale * 0.1, h * config.heightScale * islandMask);
    positions.setY(i, finalH);

    // Color by height
    const normalizedH = finalH / config.heightScale;
    if (normalizedH < config.waterLevel * 0.3) {
      // Water / deep
      colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.3; colors[i * 3 + 2] = 0.6;
    } else if (normalizedH < config.waterLevel * 0.5) {
      // Sand
      colors[i * 3] = 0.76; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.5;
    } else if (normalizedH < 0.5) {
      // Grass
      colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.5; colors[i * 3 + 2] = 0.15;
    } else if (normalizedH < 0.75) {
      // Rock
      colors[i * 3] = 0.4; colors[i * 3 + 1] = 0.38; colors[i * 3 + 2] = 0.35;
    } else {
      // Snow
      colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.97;
    }
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// ─── Procedural Shape Generators ───────────────────

export interface ProceduralConfig {
  type: 'stairs' | 'arch' | 'spiral' | 'column' | 'wall' | 'bridge';
  params: Record<string, number>;
}

export const proceduralDefaults: Record<string, ProceduralConfig> = {
  stairs: { type: 'stairs', params: { steps: 10, width: 2, height: 3, depth: 4 } },
  arch: { type: 'arch', params: { radius: 2, thickness: 0.3, segments: 24 } },
  spiral: { type: 'spiral', params: { radius: 1, height: 4, turns: 3, tubeRadius: 0.1, segments: 128 } },
  column: { type: 'column', params: { radius: 0.3, height: 4, segments: 16, fluted: 1 } },
  wall: { type: 'wall', params: { width: 5, height: 3, thickness: 0.3, brickRows: 8 } },
  bridge: { type: 'bridge', params: { length: 8, width: 2, archHeight: 2, thickness: 0.3 } },
};

export function generateProceduralGeometry(config: ProceduralConfig): THREE.BufferGeometry {
  switch (config.type) {
    case 'stairs': {
      const { steps, width, height, depth } = config.params;
      const group = new THREE.Group();
      const stepH = height / steps;
      const stepD = depth / steps;
      for (let i = 0; i < steps; i++) {
        const box = new THREE.BoxGeometry(width, stepH, stepD);
        box.translate(0, stepH * i + stepH / 2, -stepD * i - stepD / 2);
        const mesh = new THREE.Mesh(box);
        group.add(mesh);
      }
      // Merge geometries
      const merged = new THREE.BufferGeometry();
      const geometries: THREE.BufferGeometry[] = [];
      group.children.forEach(child => {
        const m = child as THREE.Mesh;
        const g = m.geometry.clone();
        g.applyMatrix4(m.matrix);
        geometries.push(g);
      });
      return mergeGeometries(geometries);
    }
    case 'arch': {
      const { radius, thickness, segments } = config.params;
      const shape = new THREE.Shape();
      shape.absarc(0, 0, radius + thickness / 2, 0, Math.PI, false);
      shape.absarc(0, 0, radius - thickness / 2, Math.PI, 0, true);
      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.translate(0, 0, -thickness / 2);
      return geo;
    }
    case 'spiral': {
      const { radius, height, turns, tubeRadius, segments } = config.params;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * turns * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          t * height,
          Math.sin(angle) * radius,
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, segments, tubeRadius, 8, false);
    }
    case 'column': {
      const { radius: r, height: h, segments: seg } = config.params;
      return new THREE.CylinderGeometry(r, r * 1.1, h, seg);
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0];

  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of geometries) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;
  for (const g of geometries) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      positions[(vertOffset + i) * 3] = pos.getX(i);
      positions[(vertOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vertOffset + i) * 3 + 2] = pos.getZ(i);
      if (norm) {
        normals[(vertOffset + i) * 3] = norm.getX(i);
        normals[(vertOffset + i) * 3 + 1] = norm.getY(i);
        normals[(vertOffset + i) * 3 + 2] = norm.getZ(i);
      }
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) {
        indices[idxOffset + i] = g.index.getX(i) + vertOffset;
      }
      idxOffset += g.index.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices[idxOffset + i] = vertOffset + i;
      }
      idxOffset += pos.count;
    }
    vertOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices.slice(0, idxOffset), 1));
  merged.computeVertexNormals();
  return merged;
}

// ─── CSG Boolean Operations (simplified) ───────────

export type CSGOperation = 'union' | 'subtract' | 'intersect';

// Note: Full CSG requires a dedicated library. This provides mesh merging
// as a foundation. For true boolean ops, we'd integrate three-bvh-csg.
export function performCSG(
  geoA: THREE.BufferGeometry,
  geoB: THREE.BufferGeometry,
  operation: CSGOperation,
): THREE.BufferGeometry {
  // Simplified: for union, merge both geometries
  // For subtract/intersect, we scale down geoB as visual approximation
  switch (operation) {
    case 'union':
      return mergeGeometries([geoA, geoB]);
    case 'subtract':
    case 'intersect':
      // Placeholder: return geoA (full CSG would need three-bvh-csg)
      return geoA.clone();
    default:
      return geoA.clone();
  }
}
