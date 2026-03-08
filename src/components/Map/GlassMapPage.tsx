// Glass Map — Pro geospatial tool with layers, drawing, measurement, POI, heatmap, routing
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, Layers, MapPin, Navigation, Compass, ZoomIn, ZoomOut,
  Maximize2, Globe, Satellite, Mountain, Moon,
  Plus, Minus, LocateFixed, Route, Eye, EyeOff, Ruler,
  PenTool, Circle, Square, Trash2, Crosshair, Activity,
  Thermometer, Wind, Droplets, TreePine, Building2, Plane,
  Ship, Train, Car, Anchor, Flag, Star, Heart, AlertTriangle,
  ChevronRight, ChevronDown, X, Download, Share2, Settings,
  Clock, BarChart3, Filter, Bookmark, Undo2, MousePointer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  icon: string;
  color: string;
  description?: string;
  tags?: string[];
  visible: boolean;
}

interface MapLayer {
  id: string;
  name: string;
  type: 'markers' | 'heatmap' | 'routes' | 'regions' | 'grid' | 'weather' | 'traffic' | 'satellite-overlay';
  visible: boolean;
  opacity: number;
  color?: string;
  data?: any;
}

interface DrawingShape {
  id: string;
  type: 'point' | 'line' | 'polygon' | 'circle' | 'rectangle';
  points: [number, number][];
  color: string;
  label?: string;
  radius?: number;
  measurement?: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
}

type MapStyle = 'glass' | 'satellite' | 'terrain' | 'dark' | 'light' | 'topo';
type DrawTool = 'select' | 'point' | 'line' | 'polygon' | 'circle' | 'rectangle' | 'measure' | 'route';

/* ─── POI Categories ─── */
const poiCategories = [
  { id: 'tech', name: 'Tech Hubs', icon: '🖥️', color: 'hsl(193, 100%, 50%)' },
  { id: 'research', name: 'Research', icon: '🔬', color: 'hsl(270, 80%, 60%)' },
  { id: 'data', name: 'Data Centers', icon: '🏢', color: 'hsl(150, 100%, 50%)' },
  { id: 'transport', name: 'Transport', icon: '✈️', color: 'hsl(45, 100%, 60%)' },
  { id: 'energy', name: 'Energy', icon: '⚡', color: 'hsl(30, 100%, 55%)' },
  { id: 'custom', name: 'Custom', icon: '📍', color: 'hsl(0, 80%, 60%)' },
];

/* ─── Demo Data ─── */
const defaultMarkers: MapMarker[] = [
  { id: '1', name: 'Neural Hub Alpha', lat: 40.7128, lng: -74.006, type: 'tech', icon: '🖥️', color: 'hsl(193, 100%, 50%)', description: 'Primary AI research facility', tags: ['AI', 'HQ'], visible: true },
  { id: '2', name: 'DeepMind London', lat: 51.5074, lng: -0.1278, type: 'research', icon: '🔬', color: 'hsl(270, 80%, 60%)', description: 'Advanced research lab', tags: ['AI', 'Research'], visible: true },
  { id: '3', name: 'Tokyo Data Nexus', lat: 35.6762, lng: 139.6503, type: 'data', icon: '🏢', color: 'hsl(150, 100%, 50%)', description: 'High-throughput data center', tags: ['Infrastructure'], visible: true },
  { id: '4', name: 'Sydney Observatory', lat: -33.8688, lng: 151.2093, type: 'research', icon: '🔬', color: 'hsl(270, 80%, 60%)', description: 'Astronomical research station', tags: ['Space'], visible: true },
  { id: '5', name: 'Berlin AI Campus', lat: 52.5200, lng: 13.4050, type: 'tech', icon: '🖥️', color: 'hsl(193, 100%, 50%)', description: 'European AI hub', tags: ['AI', 'Europe'], visible: true },
  { id: '6', name: 'Singapore Compute Farm', lat: 1.3521, lng: 103.8198, type: 'data', icon: '🏢', color: 'hsl(150, 100%, 50%)', description: 'APAC compute cluster', tags: ['Infrastructure'], visible: true },
  { id: '7', name: 'Dubai Solar Grid', lat: 25.2048, lng: 55.2708, type: 'energy', icon: '⚡', color: 'hsl(30, 100%, 55%)', description: 'Renewable energy grid', tags: ['Energy'], visible: true },
  { id: '8', name: 'São Paulo Hub', lat: -23.5505, lng: -46.6333, type: 'tech', icon: '🖥️', color: 'hsl(193, 100%, 50%)', description: 'LATAM operations', tags: ['Regional'], visible: true },
];

const defaultLayers: MapLayer[] = [
  { id: 'markers', name: 'Points of Interest', type: 'markers', visible: true, opacity: 1 },
  { id: 'heatmap', name: 'Activity Heatmap', type: 'heatmap', visible: false, opacity: 0.6, color: 'hsl(0, 100%, 50%)' },
  { id: 'routes', name: 'Network Routes', type: 'routes', visible: true, opacity: 0.5 },
  { id: 'regions', name: 'Coverage Regions', type: 'regions', visible: false, opacity: 0.3 },
  { id: 'grid', name: 'Coordinate Grid', type: 'grid', visible: true, opacity: 0.15 },
  { id: 'weather', name: 'Weather Overlay', type: 'weather', visible: false, opacity: 0.4 },
  { id: 'traffic', name: 'Network Traffic', type: 'traffic', visible: false, opacity: 0.5 },
];

/* ─── Map Component ─── */
export function GlassMapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Map state
  const [center, setCenter] = useState<[number, number]>([-20, 20]);
  const [zoom, setZoom] = useState(1.8);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  // UI state
  const [activeStyle, setActiveStyle] = useState<MapStyle>('glass');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>('select');
  const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);

  // Data state
  const [markers, setMarkers] = useState<MapMarker[]>(defaultMarkers);
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [drawings, setDrawings] = useState<DrawingShape[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [bookmarks, setBookmarks] = useState<{ name: string; center: [number, number]; zoom: number }[]>([
    { name: 'Overview', center: [-20, 20], zoom: 1.8 },
    { name: 'North America', center: [-95, 40], zoom: 4 },
    { name: 'Europe', center: [10, 50], zoom: 4.5 },
    { name: 'Asia Pacific', center: [120, 20], zoom: 3.5 },
  ]);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Stats
  const stats = useMemo(() => ({
    markers: markers.filter(m => m.visible).length,
    layers: layers.filter(l => l.visible).length,
    drawings: drawings.length,
    routes: routePoints.length,
  }), [markers, layers, drawings, routePoints]);

  // ─── Coordinate conversion ───
  const lngLatToScreen = useCallback((lng: number, lat: number, w: number, h: number): [number, number] => {
    const x = ((lng - center[0]) * zoom * w / 360) + w / 2;
    const y = ((-lat + center[1]) * zoom * h / 180) + h / 2;
    return [x, y];
  }, [center, zoom]);

  const screenToLngLat = useCallback((sx: number, sy: number, w: number, h: number): [number, number] => {
    const lng = ((sx - w / 2) / (zoom * w / 360)) + center[0];
    const lat = -(((sy - h / 2) / (zoom * h / 180)) - center[1]);
    return [lng, lat];
  }, [center, zoom]);

  // ─── Canvas Renderer ───
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    const styleColors: Record<MapStyle, { bg1: string; bg2: string; bg3: string; water: string; land: string; grid: string; text: string }> = {
      glass: { bg1: 'hsl(220, 27%, 8%)', bg2: 'hsl(220, 27%, 5%)', bg3: 'hsl(220, 27%, 3%)', water: 'hsla(200, 100%, 40%, 0.12)', land: 'hsla(150, 40%, 25%, 0.1)', grid: 'hsla(193, 100%, 50%, 0.04)', text: 'hsla(0,0%,100%,0.7)' },
      dark: { bg1: 'hsl(0, 0%, 8%)', bg2: 'hsl(0, 0%, 5%)', bg3: 'hsl(0, 0%, 3%)', water: 'hsla(210, 80%, 30%, 0.15)', land: 'hsla(120, 30%, 20%, 0.12)', grid: 'hsla(0,0%,100%,0.03)', text: 'hsla(0,0%,100%,0.6)' },
      satellite: { bg1: 'hsl(210, 40%, 12%)', bg2: 'hsl(210, 50%, 8%)', bg3: 'hsl(210, 50%, 5%)', water: 'hsla(210, 100%, 35%, 0.2)', land: 'hsla(100, 40%, 25%, 0.15)', grid: 'hsla(0,0%,100%,0.02)', text: 'hsla(0,0%,100%,0.6)' },
      terrain: { bg1: 'hsl(200, 30%, 12%)', bg2: 'hsl(200, 25%, 8%)', bg3: 'hsl(200, 20%, 5%)', water: 'hsla(200, 80%, 40%, 0.18)', land: 'hsla(80, 40%, 30%, 0.15)', grid: 'hsla(0,0%,100%,0.03)', text: 'hsla(0,0%,100%,0.7)' },
      light: { bg1: 'hsl(210, 20%, 95%)', bg2: 'hsl(210, 20%, 90%)', bg3: 'hsl(210, 20%, 85%)', water: 'hsla(210, 80%, 60%, 0.25)', land: 'hsla(100, 30%, 70%, 0.3)', grid: 'hsla(0,0%,0%,0.05)', text: 'hsla(0,0%,0%,0.7)' },
      topo: { bg1: 'hsl(45, 15%, 12%)', bg2: 'hsl(45, 10%, 8%)', bg3: 'hsl(45, 10%, 5%)', water: 'hsla(200, 70%, 40%, 0.15)', land: 'hsla(45, 30%, 25%, 0.12)', grid: 'hsla(45, 50%, 50%, 0.04)', text: 'hsla(45, 20%, 80%, 0.7)' },
    };
    const sc = styleColors[activeStyle];

    const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.8);
    bg.addColorStop(0, sc.bg1);
    bg.addColorStop(0.5, sc.bg2);
    bg.addColorStop(1, sc.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid layer
    const gridLayer = layers.find(l => l.id === 'grid');
    if (gridLayer?.visible) {
      ctx.globalAlpha = gridLayer.opacity;
      ctx.strokeStyle = sc.grid;
      ctx.lineWidth = 0.5;
      // Longitude lines
      for (let lng = -180; lng <= 180; lng += 15) {
        const [x] = lngLatToScreen(lng, 0, w, h);
        if (x > -50 && x < w + 50) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
      }
      // Latitude lines
      for (let lat = -90; lat <= 90; lat += 15) {
        const [, y] = lngLatToScreen(0, lat, w, h);
        if (y > -50 && y < h + 50) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      }
      // Equator + Prime Meridian stronger
      ctx.lineWidth = 1;
      ctx.strokeStyle = sc.grid.replace(/[\d.]+\)$/, '0.12)');
      const [eqX] = lngLatToScreen(0, 0, w, h);
      const [, eqY] = lngLatToScreen(0, 0, w, h);
      ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(w, eqY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eqX, 0); ctx.lineTo(eqX, h); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Simplified world landmasses
    const continents: { points: [number, number][]; name: string }[] = [
      { name: 'N.America', points: [[-130,55],[-125,65],[-100,70],[-80,65],[-60,50],[-65,45],[-80,30],[-90,25],[-105,20],[-120,30],[-130,45]] },
      { name: 'S.America', points: [[-80,12],[-60,5],[-50,-5],[-45,-15],[-40,-20],[-50,-35],[-55,-50],[-70,-55],[-75,-45],[-70,-20],[-80,-5]] },
      { name: 'Europe', points: [[-10,40],[0,45],[5,50],[10,55],[20,60],[30,65],[40,60],[30,50],[25,40],[20,35],[10,38],[0,38]] },
      { name: 'Africa', points: [[-15,30],[10,35],[30,30],[40,15],[45,5],[40,-10],[35,-25],[30,-35],[20,-35],[15,-25],[5,-5],[0,5],[-10,10],[-15,20]] },
      { name: 'Asia', points: [[40,40],[50,50],[60,55],[80,65],[100,60],[120,55],[140,50],[145,40],[130,30],[120,20],[110,15],[100,10],[80,15],[70,25],[60,35]] },
      { name: 'Australia', points: [[115,-15],[130,-12],[145,-15],[150,-25],[148,-35],[140,-38],[130,-35],[115,-25]] },
    ];

    continents.forEach(cont => {
      ctx.fillStyle = sc.land;
      ctx.beginPath();
      const pts = cont.points.map(([lng, lat]) => lngLatToScreen(lng, lat, w, h));
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i][0] + pts[i - 1][0]) / 2;
        const yc = (pts[i][1] + pts[i - 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], xc, yc);
      }
      ctx.closePath();
      ctx.fill();

      // Coastline glow
      ctx.strokeStyle = sc.water.replace(/[\d.]+\)$/, '0.2)');
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Water bodies glow
    const waterBodies: [number, number, number][] = [[-40, 30, 60], [70, 0, 50], [-150, 10, 80], [30, -50, 40]];
    waterBodies.forEach(([lng, lat, r]) => {
      const [cx, cy] = lngLatToScreen(lng, lat, w, h);
      const radius = r * zoom;
      const wg = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      wg.addColorStop(0, sc.water);
      wg.addColorStop(1, 'transparent');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Heatmap layer
    const heatLayer = layers.find(l => l.id === 'heatmap');
    if (heatLayer?.visible) {
      ctx.globalAlpha = heatLayer.opacity;
      markers.filter(m => m.visible).forEach(m => {
        const [mx, my] = lngLatToScreen(m.lng, m.lat, w, h);
        const hr = 60 * zoom;
        const hg = ctx.createRadialGradient(mx, my, 0, mx, my, hr);
        hg.addColorStop(0, 'hsla(0, 100%, 50%, 0.4)');
        hg.addColorStop(0.3, 'hsla(30, 100%, 50%, 0.2)');
        hg.addColorStop(0.6, 'hsla(60, 100%, 50%, 0.1)');
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(mx, my, hr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // Routes layer
    const routeLayer = layers.find(l => l.id === 'routes');
    if (routeLayer?.visible && markers.filter(m => m.visible).length > 1) {
      ctx.globalAlpha = routeLayer.opacity;
      const visibleM = markers.filter(m => m.visible);
      ctx.strokeStyle = 'hsla(193, 100%, 50%, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 10]);
      for (let i = 0; i < visibleM.length; i++) {
        for (let j = i + 1; j < visibleM.length; j++) {
          if (Math.random() > 0.6) continue; // Only some connections
          const [x1, y1] = lngLatToScreen(visibleM[i].lng, visibleM[i].lat, w, h);
          const [x2, y2] = lngLatToScreen(visibleM[j].lng, visibleM[j].lat, w, h);
          // Curved arc
          const cx2 = (x1 + x2) / 2;
          const cy2 = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.15;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx2, cy2, x2, y2);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Region coverage
    const regionLayer = layers.find(l => l.id === 'regions');
    if (regionLayer?.visible) {
      ctx.globalAlpha = regionLayer.opacity;
      markers.filter(m => m.visible).forEach(m => {
        const [mx, my] = lngLatToScreen(m.lng, m.lat, w, h);
        const rr = 35 * zoom;
        ctx.fillStyle = m.color.replace(')', ', 0.08)').replace('hsl(', 'hsla(');
        ctx.strokeStyle = m.color.replace(')', ', 0.3)').replace('hsl(', 'hsla(');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // Markers
    const markerLayer = layers.find(l => l.id === 'markers');
    if (markerLayer?.visible) {
      markers.filter(m => m.visible).forEach(marker => {
        const [px, py] = lngLatToScreen(marker.lng, marker.lat, w, h);
        if (px < -50 || px > w + 50 || py < -50 || py > h + 50) return;

        const isSelected = selectedMarker?.id === marker.id;
        const pulseR = isSelected ? 28 : 20;

        // Outer glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, pulseR * 2);
        glow.addColorStop(0, marker.color.replace(')', ', 0.5)').replace('hsl(', 'hsla('));
        glow.addColorStop(0.4, marker.color.replace(')', ', 0.15)').replace('hsl(', 'hsla('));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, pulseR * 2, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = marker.color;
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = marker.color.replace(')', ', 0.5)').replace('hsl(', 'hsla(');
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 14 : 10, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        if (zoom > 2 || isSelected) {
          ctx.font = `${isSelected ? '600 12px' : '11px'} system-ui`;
          ctx.fillStyle = sc.text;
          ctx.textAlign = 'center';
          ctx.fillText(marker.name, px, py - 18);
        }
      });
    }

    // Drawings
    drawings.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color.replace(')', ', 0.1)').replace('hsl(', 'hsla(');
      ctx.lineWidth = 2;

      if (shape.type === 'point' && shape.points.length) {
        const [sx, sy] = lngLatToScreen(shape.points[0][0], shape.points[0][1], w, h);
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (shape.type === 'line' && shape.points.length >= 2) {
        ctx.beginPath();
        shape.points.forEach((p, i) => {
          const [sx, sy] = lngLatToScreen(p[0], p[1], w, h);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        });
        ctx.stroke();
      } else if (shape.type === 'polygon' && shape.points.length >= 3) {
        ctx.beginPath();
        shape.points.forEach((p, i) => {
          const [sx, sy] = lngLatToScreen(p[0], p[1], w, h);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        });
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (shape.type === 'circle' && shape.points.length && shape.radius) {
        const [sx, sy] = lngLatToScreen(shape.points[0][0], shape.points[0][1], w, h);
        const r = shape.radius * zoom * 2;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    });

    // Measurement line
    if (activeTool === 'measure' && measurePoints.length >= 1) {
      ctx.strokeStyle = 'hsl(45, 100%, 60%)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      measurePoints.forEach((p, i) => {
        const [sx, sy] = lngLatToScreen(p[0], p[1], w, h);
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance label
      if (measurePoints.length >= 2) {
        const d = haversineDistance(measurePoints[0][1], measurePoints[0][0], measurePoints[1][1], measurePoints[1][0]);
        const mid = lngLatToScreen(
          (measurePoints[0][0] + measurePoints[1][0]) / 2,
          (measurePoints[0][1] + measurePoints[1][1]) / 2, w, h
        );
        ctx.font = '600 12px system-ui';
        ctx.fillStyle = 'hsl(45, 100%, 60%)';
        ctx.textAlign = 'center';
        ctx.fillText(`${d.toFixed(0)} km`, mid[0], mid[1] - 10);
      }
    }

    // Cursor crosshair for drawing tools
    if (activeTool !== 'select') {
      const [clng, clat] = mousePos;
      const [cx, cy] = lngLatToScreen(clng, clat, w, h);
      ctx.strokeStyle = 'hsla(0,0%,100%,0.3)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    animRef.current = requestAnimationFrame(render);
  }, [center, zoom, activeStyle, markers, layers, drawings, selectedMarker, activeTool, measurePoints, mousePos, lngLatToScreen]);

  // Haversine distance
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Canvas setup and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [render]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (activeTool === 'select') {
      // Check marker click
      const w = rect.width;
      const h = rect.height;
      const clicked = markers.filter(m => m.visible).find(m => {
        const [mx, my] = lngLatToScreen(m.lng, m.lat, w, h);
        return Math.hypot(sx - mx, sy - my) < 15;
      });
      if (clicked) {
        setSelectedMarker(clicked);
        setShowDetails(true);
        return;
      }
      setSelectedMarker(null);
      setShowDetails(false);
      // Start drag
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, cx: center[0], cy: center[1] };
    } else if (activeTool === 'measure') {
      const [lng, lat] = screenToLngLat(sx, sy, rect.width, rect.height);
      setMeasurePoints(prev => prev.length >= 2 ? [[lng, lat]] : [...prev, [lng, lat]]);
    } else if (activeTool === 'point') {
      const [lng, lat] = screenToLngLat(sx, sy, rect.width, rect.height);
      const newShape: DrawingShape = {
        id: crypto.randomUUID(),
        type: 'point',
        points: [[lng, lat]],
        color: 'hsl(45, 100%, 60%)',
        label: `Point ${drawings.length + 1}`,
      };
      setDrawings(prev => [...prev, newShape]);
    }
  }, [activeTool, markers, center, lngLatToScreen, screenToLngLat, drawings.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [lng, lat] = screenToLngLat(sx, sy, rect.width, rect.height);
    setMousePos([lng, lat]);

    if (isDragging && dragStart.current) {
      const dx = (e.clientX - dragStart.current.x) / (zoom * rect.width / 360);
      const dy = (e.clientY - dragStart.current.y) / (zoom * rect.height / 180);
      setCenter([dragStart.current.cx - dx, dragStart.current.cy + dy]);
    }
  }, [isDragging, zoom, screenToLngLat]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(20, z * (e.deltaY < 0 ? 1.15 : 0.87))));
  }, []);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return markers.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery, markers]);

  const flyTo = (lng: number, lat: number, z?: number) => {
    setCenter([lng, lat]);
    if (z) setZoom(z);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  const mapStyles: { id: MapStyle; icon: typeof Globe; label: string }[] = [
    { id: 'glass', icon: Globe, label: 'Glass' },
    { id: 'satellite', icon: Satellite, label: 'Satellite' },
    { id: 'terrain', icon: Mountain, label: 'Terrain' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'topo', icon: Activity, label: 'Topo' },
  ];

  const drawTools: { id: DrawTool; icon: typeof MousePointer; label: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'point', icon: MapPin, label: 'Point' },
    { id: 'line', icon: PenTool, label: 'Line' },
    { id: 'polygon', icon: Square, label: 'Polygon' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'measure', icon: Ruler, label: 'Measure' },
  ];

  return (
    <div className="h-full relative overflow-hidden" ref={containerRef}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0", activeTool !== 'select' ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* ─── Floating UI ─── */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Search bar — top center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
          <div className="relative">
            <div className="flex items-center gap-2 bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl px-3 py-1.5 shadow-lg shadow-black/20 min-w-[360px]">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search locations, POIs, coordinates..."
                className="h-7 bg-transparent border-none text-sm focus-visible:ring-0 px-0"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </Button>
              )}
              <Badge variant="outline" className="text-[9px] shrink-0 border-primary/30 text-primary">⌘K</Badge>
            </div>
            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-background/80 backdrop-blur-2xl border border-border/30 rounded-xl shadow-lg overflow-hidden">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    className="w-full px-3 py-2 text-left hover:bg-primary/10 flex items-center gap-2 text-sm transition-colors"
                    onClick={() => { flyTo(r.lng, r.lat, 5); setSelectedMarker(r); setShowDetails(true); setSearchQuery(''); }}
                  >
                    <span>{r.icon}</span>
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground">{r.lat.toFixed(1)}°, {r.lng.toFixed(1)}°</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Style selector — top right */}
        <div className="absolute top-3 right-3 pointer-events-auto">
          <div className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl p-1 flex gap-0.5 shadow-lg shadow-black/20">
            {mapStyles.map(style => {
              const Icon = style.icon;
              return (
                <Tooltip key={style.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveStyle(style.id)}
                      className={cn('w-7 h-7 rounded-lg', activeStyle === style.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{style.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Left toolbar — Layers + Draw + Bookmarks */}
        <div className="absolute left-3 top-3 bottom-16 pointer-events-auto flex flex-col gap-2">
          {/* Tool buttons */}
          <div className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl p-1 flex flex-col gap-0.5 shadow-lg shadow-black/20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('w-8 h-8 rounded-lg', showLayers && 'bg-primary/20 text-primary')} onClick={() => { setShowLayers(!showLayers); setShowDrawTools(false); }}>
                  <Layers className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Layers</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('w-8 h-8 rounded-lg', showDrawTools && 'bg-primary/20 text-primary')} onClick={() => { setShowDrawTools(!showDrawTools); setShowLayers(false); }}>
                  <PenTool className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Draw</TooltipContent>
            </Tooltip>
            <div className="h-px bg-border/20 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground" onClick={() => setActiveTool('measure')}>
                  <Ruler className={cn("w-4 h-4", activeTool === 'measure' && 'text-[hsl(45,100%,60%)]')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Measure</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground" onClick={() => setActiveTool('select')}>
                  <MousePointer className={cn("w-4 h-4", activeTool === 'select' && 'text-primary')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Select</TooltipContent>
            </Tooltip>
          </div>

          {/* Layers panel */}
          {showLayers && (
            <div className="bg-background/60 backdrop-blur-2xl border border-border/30 rounded-xl shadow-lg shadow-black/20 w-56 overflow-hidden">
              <div className="px-3 py-2 border-b border-border/20 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>LAYERS</span>
                <Badge variant="outline" className="text-[9px]">{stats.layers} active</Badge>
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="p-1.5 space-y-0.5">
                  {layers.map(layer => (
                    <div key={layer.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 group">
                      <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={() => toggleLayerVisibility(layer.id)}>
                        {layer.visible ? <Eye className="w-3 h-3 text-primary" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                      </Button>
                      <span className="text-xs flex-1 truncate">{layer.name}</span>
                      <div className="w-14 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Slider
                          value={[layer.opacity * 100]}
                          onValueChange={([v]) => setLayerOpacity(layer.id, v / 100)}
                          max={100}
                          step={5}
                          className="h-3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Draw tools panel */}
          {showDrawTools && (
            <div className="bg-background/60 backdrop-blur-2xl border border-border/30 rounded-xl shadow-lg shadow-black/20 w-48 overflow-hidden">
              <div className="px-3 py-2 border-b border-border/20 text-xs font-semibold text-muted-foreground">DRAW TOOLS</div>
              <div className="p-1.5 space-y-0.5">
                {drawTools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                        activeTool === tool.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted/20 text-muted-foreground'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tool.label}
                    </button>
                  );
                })}
                {drawings.length > 0 && (
                  <>
                    <div className="h-px bg-border/20 mx-1 my-1" />
                    <button
                      onClick={() => setDrawings([])}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All ({drawings.length})
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bookmarks */}
          <div className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl p-1 flex flex-col gap-0.5 shadow-lg shadow-black/20 mt-auto">
            {bookmarks.map((bm, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => flyTo(bm.center[0], bm.center[1], bm.zoom)}>
                    <Bookmark className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{bm.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Zoom controls — right center */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl p-1 flex flex-col gap-0.5 shadow-lg shadow-black/20">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setZoom(z => Math.min(z * 1.3, 20))}>
              <Plus className="w-4 h-4" />
            </Button>
            <div className="text-center text-[9px] text-muted-foreground font-mono py-0.5">
              {zoom.toFixed(1)}×
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setZoom(z => Math.max(z / 1.3, 0.5))}>
              <Minus className="w-4 h-4" />
            </Button>
            <div className="h-px bg-border/30 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => { setCenter([-20, 20]); setZoom(1.8); }}>
                  <Compass className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Reset View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                  <LocateFixed className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">My Location</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Detail panel — right side */}
        {showDetails && selectedMarker && (
          <div className="absolute top-14 right-14 pointer-events-auto w-64">
            <div className="bg-background/70 backdrop-blur-2xl border border-border/30 rounded-xl shadow-xl shadow-black/30 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedMarker.icon}</span>
                  <span className="text-sm font-semibold truncate">{selectedMarker.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => { setShowDetails(false); setSelectedMarker(null); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="p-3 space-y-2.5">
                <p className="text-xs text-muted-foreground">{selectedMarker.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="font-mono">{selectedMarker.lat.toFixed(4)}°, {selectedMarker.lng.toFixed(4)}°</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] capitalize border-primary/20">{selectedMarker.type}</Badge>
                  {selectedMarker.tags?.map(t => (
                    <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                  ))}
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => flyTo(selectedMarker.lng, selectedMarker.lat, 8)}>
                    <Crosshair className="w-3 h-3 mr-1" /> Focus
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => { setMarkers(prev => prev.filter(m => m.id !== selectedMarker.id)); setShowDetails(false); setSelectedMarker(null); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POI cards — bottom */}
        <div className="absolute bottom-3 left-14 right-14 pointer-events-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-neural">
            {markers.filter(m => m.visible).slice(0, 6).map(marker => (
              <button
                key={marker.id}
                onClick={() => { flyTo(marker.lng, marker.lat, 5); setSelectedMarker(marker); setShowDetails(true); }}
                className={cn(
                  "bg-background/30 backdrop-blur-2xl border border-border/30 rounded-xl p-2.5 min-w-[180px] shrink-0 shadow-lg shadow-black/20 hover:bg-background/50 transition-colors text-left",
                  selectedMarker?.id === marker.id && 'border-primary/40 bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: marker.color, boxShadow: `0 0 6px ${marker.color}` }} />
                  <span className="text-[11px] font-medium truncate">{marker.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="font-mono">{marker.lat.toFixed(2)}°, {marker.lng.toFixed(2)}°</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar — bottom left */}
        <div className="absolute bottom-3 left-3 pointer-events-auto">
          <div className="bg-background/30 backdrop-blur-xl border border-border/20 rounded-lg px-2.5 py-1 flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
            <span>{mousePos[1].toFixed(3)}°N</span>
            <span>{mousePos[0].toFixed(3)}°E</span>
            <span className="text-primary/60">Z{zoom.toFixed(1)}</span>
            <span>{stats.markers} POIs</span>
            {drawings.length > 0 && <span>{drawings.length} shapes</span>}
            {activeTool !== 'select' && <Badge className="text-[8px] h-3.5 px-1 bg-primary/20 text-primary border-0">{activeTool.toUpperCase()}</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}
