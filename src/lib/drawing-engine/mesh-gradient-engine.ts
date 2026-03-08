// Mesh Gradient Engine — Gradient mesh creation and rendering
// Sprint 5: Gradient mesh for photorealistic coloring

import { Vec2, generateId } from './types';

// ============================================
// MESH TYPES
// ============================================

export interface MeshPoint {
  id: string;
  position: Vec2;
  color: string;
  opacity: number;
  // Bézier handles for smooth interpolation
  handleTop?: Vec2;
  handleRight?: Vec2;
  handleBottom?: Vec2;
  handleLeft?: Vec2;
}

export interface MeshGrid {
  id: string;
  rows: number;
  cols: number;
  points: MeshPoint[][]; // [row][col]
}

// ============================================
// MESH CREATION
// ============================================

export function createMeshGrid(
  x: number, y: number,
  width: number, height: number,
  rows: number = 3, cols: number = 3,
  baseColor: string = '#ffffff',
): MeshGrid {
  const points: MeshPoint[][] = [];

  for (let r = 0; r <= rows; r++) {
    const row: MeshPoint[] = [];
    for (let c = 0; c <= cols; c++) {
      const px = x + (c / cols) * width;
      const py = y + (r / rows) * height;
      const stepX = width / cols;
      const stepY = height / rows;

      row.push({
        id: generateId(),
        position: { x: px, y: py },
        color: baseColor,
        opacity: 1,
        handleTop: r > 0 ? { x: px, y: py - stepY * 0.33 } : undefined,
        handleBottom: r < rows ? { x: px, y: py + stepY * 0.33 } : undefined,
        handleLeft: c > 0 ? { x: px - stepX * 0.33, y: py } : undefined,
        handleRight: c < cols ? { x: px + stepX * 0.33, y: py } : undefined,
      });
    }
    points.push(row);
  }

  return { id: generateId(), rows: rows + 1, cols: cols + 1, points };
}

// ============================================
// MESH MANIPULATION
// ============================================

export function setMeshPointColor(
  mesh: MeshGrid,
  row: number, col: number,
  color: string,
  opacity: number = 1,
): MeshGrid {
  const points = mesh.points.map((r, ri) =>
    r.map((p, ci) =>
      ri === row && ci === col ? { ...p, color, opacity } : p
    )
  );
  return { ...mesh, points };
}

export function moveMeshPoint(
  mesh: MeshGrid,
  row: number, col: number,
  dx: number, dy: number,
): MeshGrid {
  const points = mesh.points.map((r, ri) =>
    r.map((p, ci) => {
      if (ri !== row || ci !== col) return p;
      return {
        ...p,
        position: { x: p.position.x + dx, y: p.position.y + dy },
        handleTop: p.handleTop ? { x: p.handleTop.x + dx, y: p.handleTop.y + dy } : undefined,
        handleRight: p.handleRight ? { x: p.handleRight.x + dx, y: p.handleRight.y + dy } : undefined,
        handleBottom: p.handleBottom ? { x: p.handleBottom.x + dx, y: p.handleBottom.y + dy } : undefined,
        handleLeft: p.handleLeft ? { x: p.handleLeft.x + dx, y: p.handleLeft.y + dy } : undefined,
      };
    })
  );
  return { ...mesh, points };
}

export function addMeshRow(mesh: MeshGrid, afterRow: number): MeshGrid {
  if (afterRow < 0 || afterRow >= mesh.rows - 1) return mesh;
  
  const newRow: MeshPoint[] = [];
  for (let c = 0; c < mesh.cols; c++) {
    const above = mesh.points[afterRow][c];
    const below = mesh.points[afterRow + 1][c];
    newRow.push({
      id: generateId(),
      position: {
        x: (above.position.x + below.position.x) / 2,
        y: (above.position.y + below.position.y) / 2,
      },
      color: lerpColor(above.color, below.color, 0.5),
      opacity: (above.opacity + below.opacity) / 2,
    });
  }

  const points = [
    ...mesh.points.slice(0, afterRow + 1),
    newRow,
    ...mesh.points.slice(afterRow + 1),
  ];

  return { ...mesh, rows: mesh.rows + 1, points };
}

export function addMeshCol(mesh: MeshGrid, afterCol: number): MeshGrid {
  if (afterCol < 0 || afterCol >= mesh.cols - 1) return mesh;

  const points = mesh.points.map(row => {
    const left = row[afterCol];
    const right = row[afterCol + 1];
    const newPoint: MeshPoint = {
      id: generateId(),
      position: {
        x: (left.position.x + right.position.x) / 2,
        y: (left.position.y + right.position.y) / 2,
      },
      color: lerpColor(left.color, right.color, 0.5),
      opacity: (left.opacity + right.opacity) / 2,
    };
    return [...row.slice(0, afterCol + 1), newPoint, ...row.slice(afterCol + 1)];
  });

  return { ...mesh, cols: mesh.cols + 1, points };
}

// ============================================
// MESH RENDERING
// ============================================

export function renderMeshGradient(
  ctx: CanvasRenderingContext2D,
  mesh: MeshGrid,
): void {
  // Render each cell as a bilinear gradient patch
  for (let r = 0; r < mesh.rows - 1; r++) {
    for (let c = 0; c < mesh.cols - 1; c++) {
      const tl = mesh.points[r][c];
      const tr = mesh.points[r][c + 1];
      const bl = mesh.points[r + 1][c];
      const br = mesh.points[r + 1][c + 1];
      
      renderMeshCell(ctx, tl, tr, bl, br);
    }
  }
}

function renderMeshCell(
  ctx: CanvasRenderingContext2D,
  tl: MeshPoint, tr: MeshPoint,
  bl: MeshPoint, br: MeshPoint,
): void {
  // Subdivide cell into small triangles for smooth interpolation
  const steps = 8;
  
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const u0 = i / steps, u1 = (i + 1) / steps;
      const v0 = j / steps, v1 = (j + 1) / steps;

      // Bilinear interpolation for position and color
      const p00 = bilinearPos(tl, tr, bl, br, u0, v0);
      const p10 = bilinearPos(tl, tr, bl, br, u1, v0);
      const p01 = bilinearPos(tl, tr, bl, br, u0, v1);
      const p11 = bilinearPos(tl, tr, bl, br, u1, v1);

      const c00 = bilinearColor(tl, tr, bl, br, u0, v0);
      const cCenter = bilinearColor(tl, tr, bl, br, (u0 + u1) / 2, (v0 + v1) / 2);

      // Draw quad as two triangles
      ctx.fillStyle = cCenter;
      ctx.globalAlpha = bilinearOpacity(tl, tr, bl, br, (u0 + u1) / 2, (v0 + v1) / 2);
      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function bilinearPos(tl: MeshPoint, tr: MeshPoint, bl: MeshPoint, br: MeshPoint, u: number, v: number): Vec2 {
  const top = lerp2(tl.position, tr.position, u);
  const bot = lerp2(bl.position, br.position, u);
  return lerp2(top, bot, v);
}

function bilinearColor(tl: MeshPoint, tr: MeshPoint, bl: MeshPoint, br: MeshPoint, u: number, v: number): string {
  const topC = lerpColor(tl.color, tr.color, u);
  const botC = lerpColor(bl.color, br.color, u);
  return lerpColor(topC, botC, v);
}

function bilinearOpacity(tl: MeshPoint, tr: MeshPoint, bl: MeshPoint, br: MeshPoint, u: number, v: number): number {
  const top = tl.opacity * (1 - u) + tr.opacity * u;
  const bot = bl.opacity * (1 - u) + br.opacity * u;
  return top * (1 - v) + bot * v;
}

function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ============================================
// COLOR UTILITIES
// ============================================

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}

// ============================================
// MESH HIT TESTING
// ============================================

export function hitTestMeshPoint(
  mesh: MeshGrid,
  worldPoint: Vec2,
  tolerance: number = 8,
): { row: number; col: number } | null {
  for (let r = 0; r < mesh.rows; r++) {
    for (let c = 0; c < mesh.cols; c++) {
      const p = mesh.points[r][c].position;
      const dx = worldPoint.x - p.x;
      const dy = worldPoint.y - p.y;
      if (dx * dx + dy * dy < tolerance * tolerance) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// ============================================
// MESH PRESETS
// ============================================

export const MESH_PRESETS: { name: string; create: (x: number, y: number, w: number, h: number) => MeshGrid }[] = [
  {
    name: 'Sunset',
    create: (x, y, w, h) => {
      const mesh = createMeshGrid(x, y, w, h, 3, 3, '#ff6b35');
      let m = setMeshPointColor(mesh, 0, 0, '#ff4444');
      m = setMeshPointColor(m, 0, 1, '#ff6b35');
      m = setMeshPointColor(m, 0, 2, '#ffa500');
      m = setMeshPointColor(m, 0, 3, '#ffcc00');
      m = setMeshPointColor(m, 1, 0, '#cc3366');
      m = setMeshPointColor(m, 1, 3, '#ff9900');
      m = setMeshPointColor(m, 2, 0, '#663399');
      m = setMeshPointColor(m, 2, 3, '#ff6600');
      m = setMeshPointColor(m, 3, 0, '#1a0033');
      m = setMeshPointColor(m, 3, 1, '#330066');
      m = setMeshPointColor(m, 3, 2, '#660033');
      m = setMeshPointColor(m, 3, 3, '#993300');
      return m;
    },
  },
  {
    name: 'Aurora',
    create: (x, y, w, h) => {
      const mesh = createMeshGrid(x, y, w, h, 3, 3, '#00ff88');
      let m = setMeshPointColor(mesh, 0, 0, '#000033');
      m = setMeshPointColor(m, 0, 3, '#000066');
      m = setMeshPointColor(m, 1, 0, '#00cc66');
      m = setMeshPointColor(m, 1, 1, '#00ffaa');
      m = setMeshPointColor(m, 1, 2, '#66ffcc');
      m = setMeshPointColor(m, 1, 3, '#00cc99');
      m = setMeshPointColor(m, 2, 0, '#003366');
      m = setMeshPointColor(m, 2, 1, '#0066cc');
      m = setMeshPointColor(m, 2, 2, '#3399ff');
      m = setMeshPointColor(m, 2, 3, '#0033cc');
      m = setMeshPointColor(m, 3, 0, '#000022');
      m = setMeshPointColor(m, 3, 3, '#000044');
      return m;
    },
  },
  {
    name: 'Metal',
    create: (x, y, w, h) => {
      const mesh = createMeshGrid(x, y, w, h, 2, 4, '#888888');
      let m = setMeshPointColor(mesh, 0, 0, '#cccccc');
      m = setMeshPointColor(m, 0, 1, '#999999');
      m = setMeshPointColor(m, 0, 2, '#dddddd');
      m = setMeshPointColor(m, 0, 3, '#aaaaaa');
      m = setMeshPointColor(m, 0, 4, '#bbbbbb');
      m = setMeshPointColor(m, 1, 0, '#777777');
      m = setMeshPointColor(m, 1, 2, '#eeeeee');
      m = setMeshPointColor(m, 1, 4, '#888888');
      m = setMeshPointColor(m, 2, 0, '#666666');
      m = setMeshPointColor(m, 2, 1, '#999999');
      m = setMeshPointColor(m, 2, 2, '#aaaaaa');
      m = setMeshPointColor(m, 2, 3, '#777777');
      m = setMeshPointColor(m, 2, 4, '#999999');
      return m;
    },
  },
];
