// Glass Map Page - Mapbox with transparent/glass aesthetic, glowing overlays, custom shaders
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Layers, MapPin, Navigation, Compass, ZoomIn, ZoomOut,
  Maximize2, Globe, Satellite, Mountain, Droplets, TreePine,
  Sun, Moon, Plus, Minus, LocateFixed, Route, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom glass-styled map
export function GlassMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStyle, setActiveStyle] = useState<'glass' | 'satellite' | 'terrain' | 'dark'>('glass');
  const [zoom, setZoom] = useState(3);
  const [center, setCenter] = useState<[number, number]>([-74.006, 40.7128]);
  const [showOverlays, setShowOverlays] = useState(true);
  const [is3D, setIs3D] = useState(false);

  // Markers for demo
  const [markers] = useState([
    { id: '1', name: 'Neural Hub Alpha', lat: 40.7128, lng: -74.006, type: 'hub', glow: 'hsl(var(--primary))' },
    { id: '2', name: 'Data Center Beta', lat: 51.5074, lng: -0.1278, type: 'datacenter', glow: 'hsl(var(--wisdom-neural))' },
    { id: '3', name: 'Research Station Gamma', lat: 35.6762, lng: 139.6503, type: 'research', glow: 'hsl(var(--wisdom-data-flow))' },
    { id: '4', name: 'Observatory Delta', lat: -33.8688, lng: 151.2093, type: 'observatory', glow: 'hsl(var(--wisdom-memory))' },
  ]);

  // Try Mapbox, fallback to canvas-based map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check for mapbox token
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (mapboxToken && (window as any).mapboxgl) {
      // Use Mapbox
      try {
        (window as any).mapboxgl.accessToken = mapboxToken;
        const map = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: getMapboxStyle(activeStyle),
          center: center,
          zoom: zoom,
          pitch: is3D ? 60 : 0,
          bearing: is3D ? -17.6 : 0,
        });

        map.on('load', () => {
          setMapLoaded(true);
          setMapInstance(map);
          addGlassOverlays(map);
        });

        return () => map.remove();
      } catch (e) {
        console.warn('Mapbox failed, using canvas fallback');
      }
    }

    // Canvas fallback — custom rendered glass map
    setMapLoaded(true);
    renderCanvasMap();
  }, [activeStyle, is3D]);

  const getMapboxStyle = (style: string) => {
    switch (style) {
      case 'glass': return 'mapbox://styles/mapbox/dark-v11';
      case 'satellite': return 'mapbox://styles/mapbox/satellite-streets-v12';
      case 'terrain': return 'mapbox://styles/mapbox/outdoors-v12';
      case 'dark': return 'mapbox://styles/mapbox/navigation-night-v1';
      default: return 'mapbox://styles/mapbox/dark-v11';
    }
  };

  const addGlassOverlays = (map: any) => {
    // Custom glass shader overlays would go here with Mapbox custom layers
  };

  // Canvas fallback renderer — beautiful procedural glass map
  const renderCanvasMap = useCallback(() => {
    if (!mapContainer.current) return;
    const container = mapContainer.current;
    const existing = container.querySelector('canvas');
    if (existing) existing.remove();

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth * 2;
    canvas.height = container.clientHeight * 2;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background gradient — deep space ocean feel
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.8);
    bg.addColorStop(0, 'hsl(220, 27%, 8%)');
    bg.addColorStop(0.5, 'hsl(220, 27%, 5%)');
    bg.addColorStop(1, 'hsl(220, 27%, 3%)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines — faint glass grid
    ctx.strokeStyle = 'hsla(193, 100%, 50%, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Water bodies — flowing gradients with glow
    const drawWater = (cx: number, cy: number, rx: number, ry: number) => {
      const waterGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      waterGrad.addColorStop(0, 'hsla(200, 100%, 40%, 0.15)');
      waterGrad.addColorStop(0.5, 'hsla(193, 100%, 50%, 0.08)');
      waterGrad.addColorStop(1, 'hsla(200, 80%, 30%, 0.02)');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glow ring
      ctx.strokeStyle = 'hsla(193, 100%, 50%, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2);
      ctx.stroke();
    };

    drawWater(w * 0.3, h * 0.35, 180, 120);
    drawWater(w * 0.7, h * 0.6, 220, 150);
    drawWater(w * 0.15, h * 0.7, 140, 90);

    // Land masses — subtle elevated surfaces
    const drawLand = (points: [number, number][], color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i][0] + points[i - 1][0]) / 2;
        const yc = (points[i][1] + points[i - 1][1]) / 2;
        ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xc, yc);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Continents as subtle glass shapes
    drawLand(
      [[w*0.2,h*0.15],[w*0.35,h*0.1],[w*0.45,h*0.15],[w*0.5,h*0.25],[w*0.45,h*0.4],[w*0.3,h*0.45],[w*0.15,h*0.35],[w*0.12,h*0.2]],
      'hsla(150, 40%, 20%, 0.12)'
    );
    drawLand(
      [[w*0.55,h*0.2],[w*0.75,h*0.15],[w*0.85,h*0.25],[w*0.82,h*0.45],[w*0.7,h*0.5],[w*0.55,h*0.4]],
      'hsla(150, 40%, 20%, 0.1)'
    );
    drawLand(
      [[w*0.55,h*0.55],[w*0.65,h*0.5],[w*0.78,h*0.55],[w*0.8,h*0.7],[w*0.7,h*0.8],[w*0.55,h*0.75]],
      'hsla(150, 40%, 20%, 0.08)'
    );

    // Terrain texture — mountains as small bright dots
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 2;
      ctx.fillStyle = `hsla(${150 + Math.random() * 60}, 60%, 50%, ${Math.random() * 0.06})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing marker nodes
    markers.forEach(marker => {
      // Convert lat/lng to canvas coords (simplified Mercator)
      const px = ((marker.lng + 180) / 360) * w;
      const py = ((90 - marker.lat) / 180) * h;

      // Outer glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 40);
      glow.addColorStop(0, marker.glow.replace(')', ', 0.6)').replace('hsl(', 'hsla('));
      glow.addColorStop(0.5, marker.glow.replace(')', ', 0.15)').replace('hsl(', 'hsla('));
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 40, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = marker.glow;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Ring pulse
      ctx.strokeStyle = marker.glow.replace(')', ', 0.4)').replace('hsl(', 'hsla(');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Connection lines between markers
    ctx.strokeStyle = 'hsla(193, 100%, 50%, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    for (let i = 0; i < markers.length - 1; i++) {
      const m1 = markers[i];
      const m2 = markers[i + 1];
      const x1 = ((m1.lng + 180) / 360) * w;
      const y1 = ((90 - m1.lat) / 180) * h;
      const x2 = ((m2.lng + 180) / 360) * w;
      const y2 = ((90 - m2.lat) / 180) * h;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Animated scan line effect (static frame)
    const scanY = h * 0.4;
    const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(0.5, 'hsla(193, 100%, 50%, 0.06)');
    scanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 20, w, 40);

  }, [markers]);

  // Resize handler
  useEffect(() => {
    const onResize = () => {
      if (!mapInstance) renderCanvasMap();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mapInstance, renderCanvasMap]);

  const mapStyles = [
    { id: 'glass' as const, icon: Globe, label: 'Glass' },
    { id: 'satellite' as const, icon: Satellite, label: 'Satellite' },
    { id: 'terrain' as const, icon: Mountain, label: 'Terrain' },
    { id: 'dark' as const, icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="h-full relative overflow-hidden">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Glass overlay UI — floating controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Search bar — top center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl px-3 py-1.5 shadow-lg shadow-black/20 min-w-[320px]">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search locations, coordinates..."
              className="h-7 bg-transparent border-none text-sm focus-visible:ring-0 px-0"
            />
            <Badge variant="outline" className="text-[9px] shrink-0 border-primary/30 text-primary">⌘K</Badge>
          </div>
        </div>

        {/* Style selector — top right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl p-1.5 flex gap-1 shadow-lg shadow-black/20">
            {mapStyles.map(style => {
              const Icon = style.icon;
              return (
                <Button
                  key={style.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveStyle(style.id)}
                  className={cn(
                    'h-7 px-2 text-xs gap-1 rounded-lg',
                    activeStyle === style.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{style.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Zoom controls — right center */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-xl p-1 flex flex-col gap-0.5 shadow-lg shadow-black/20">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setZoom(z => Math.min(z + 1, 20))}>
              <Plus className="w-4 h-4" />
            </Button>
            <div className="h-px bg-border/30 mx-1" />
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setZoom(z => Math.max(z - 1, 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <div className="h-px bg-border/30 mx-1" />
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setIs3D(!is3D)}>
              <Compass className={cn("w-4 h-4 transition-transform", is3D && 'text-primary rotate-45')} />
            </Button>
            <div className="h-px bg-border/30 mx-1" />
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
              <LocateFixed className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Location info cards — bottom */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-neural">
            {markers.map(marker => (
              <div
                key={marker.id}
                className="bg-background/30 backdrop-blur-2xl border border-border/30 rounded-xl p-3 min-w-[200px] shrink-0 shadow-lg shadow-black/20 hover:bg-background/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: marker.glow, boxShadow: `0 0 8px ${marker.glow}` }} />
                  <span className="text-xs font-medium truncate">{marker.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}</span>
                </div>
                <Badge variant="outline" className="mt-1.5 text-[9px] capitalize border-primary/20">{marker.type}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay toggle */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOverlays(!showOverlays)}
            className="bg-background/40 backdrop-blur-2xl border border-border/30 rounded-lg h-7 px-2 text-xs gap-1"
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Overlays
          </Button>
        </div>

        {/* Coordinate display */}
        <div className="absolute bottom-16 right-4 pointer-events-auto">
          <div className="bg-background/30 backdrop-blur-xl border border-border/20 rounded-lg px-2 py-1 text-[10px] font-mono text-muted-foreground">
            {center[1].toFixed(4)}°N, {center[0].toFixed(4)}°W · Zoom {zoom}
          </div>
        </div>
      </div>
    </div>
  );
}
