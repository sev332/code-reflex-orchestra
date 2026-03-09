// Professional Image Editor — Canvas-based with real layer system, selection, brush, crop
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Image, Upload, Download, Undo, Redo, ZoomIn, ZoomOut,
  Crop, RotateCw, FlipHorizontal, FlipVertical, Palette,
  Wand2, Sparkles, Layers, Type, Eraser, Paintbrush,
  Move, Square, Circle, Minus, Plus, Sun,
  Contrast, Droplets, Eye, EyeOff, Loader2, SlidersHorizontal,
  Lasso, Scissors, X, Lock, Unlock, Trash2, Copy, ChevronUp,
  ChevronDown, Hand, Pipette, MousePointer, Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { type ToolId, type Color, type BrushSettings, DEFAULT_BRUSH, DEFAULT_COLOR } from '@/lib/image-engine/types';
import { CoordinateSystem } from '@/lib/image-engine/coordinate-system';
import { LayerManager } from '@/lib/image-engine/layer-manager';
import { SelectionManager } from '@/lib/image-engine/selection-manager';
import { RenderPipeline } from '@/lib/image-engine/render-pipeline';
import { BrushEngine } from '@/lib/image-engine/brush-engine';
import { FastFloodFill } from '@/lib/image-engine/flood-fill';
import { CropEngine, CROP_PRESETS } from '@/lib/image-engine/crop-engine';
import { HistoryManager } from '@/lib/image-engine/history-manager';

type PanelId = 'tools' | 'adjust' | 'ai' | 'layers';

interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hue: number;
}

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core engines (persistent refs)
  const coordSystem = useRef(new CoordinateSystem());
  const layerMgr = useRef(new LayerManager());
  const selMgr = useRef(new SelectionManager(1, 1));
  const brushEngine = useRef(new BrushEngine());
  const cropEngine = useRef(new CropEngine());
  const historyMgr = useRef(new HistoryManager());
  const renderPipeline = useRef<RenderPipeline | null>(null);
  const animFrame = useRef(0);

  // State
  const [hasImage, setHasImage] = useState(false);

  // ─── AI Integration ──────────────────────────
  useAIAppIntegration({
    appId: 'image',
    getContext: () => ({
      appId: 'image', appName: 'Image Editor',
      summary: `${hasImage ? 'Image loaded' : 'No image'}. Tool: ${activeTool}. ${layers.length} layers.`,
      activeView: activeTool, itemCount: layers.length,
      metadata: { hasImage, activeTool, zoom, layerCount: layers.length },
    }),
  });

  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [activePanel, setActivePanel] = useState<PanelId>('tools');
  const [zoom, setZoom] = useState(100);
  const [layers, setLayers] = useState<Array<{ id: string; name: string; visible: boolean; locked: boolean; opacity: number; blendMode: string }>>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({ ...DEFAULT_BRUSH });
  const [foregroundColor, setForegroundColor] = useState<Color>({ ...DEFAULT_COLOR });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustments, setAdjustments] = useState<AdjustmentState>({
    brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0,
  });
  const [isCropping, setIsCropping] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [, forceRender] = useState(0);

  // Sync layers state from manager
  const syncLayers = useCallback(() => {
    const ls = layerMgr.current.getLayers();
    setLayers(ls.map(l => ({
      id: l.id, name: l.name, visible: l.visible,
      locked: l.locked, opacity: l.opacity, blendMode: l.blendMode,
    })));
    setActiveLayerId(layerMgr.current.getActiveLayerId());
    setCanUndo(historyMgr.current.canUndo);
    setCanRedo(historyMgr.current.canRedo);
  }, []);

  // Render loop
  const requestRender = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(() => {
      if (!renderPipeline.current) return;
      const sel = selMgr.current.getSelection();
      renderPipeline.current.render(
        layerMgr.current.getLayers(),
        sel,
        cursorPos,
        activeTool === 'brush' || activeTool === 'eraser' ? brushSettings.size : undefined,
      );
      // Crop overlay
      if (isCropping) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          coordSystem.current.applyTransform(ctx);
          cropEngine.current.renderOverlay(ctx, coordSystem.current.zoom);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      }
    });
  }, [cursorPos, activeTool, brushSettings.size, isCropping]);

  useEffect(() => {
    requestRender();
  }, [requestRender, layers, zoom, cursorPos, isCropping]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      coordSystem.current.setCanvasSize(rect.width, rect.height);
      requestRender();
    };

    const ctx = canvas.getContext('2d')!;
    renderPipeline.current = new RenderPipeline(ctx, coordSystem.current);
    renderPipeline.current.startMarchingAnts();

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      renderPipeline.current?.stopMarchingAnts();
    };
  }, []);

  // Marching ants animation loop
  useEffect(() => {
    if (!hasImage) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      requestRender();
      setTimeout(() => requestAnimationFrame(loop), 80);
    };
    loop();
    return () => { running = false; };
  }, [hasImage, requestRender]);

  // Load image
  const loadImage = useCallback((src: string) => {
    const img = new window.Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      coordSystem.current.setImageSize(w, h);
      coordSystem.current.fitToView();
      setZoom(Math.round(coordSystem.current.zoom * 100));

      layerMgr.current.initialize(w, h);
      selMgr.current.setDimensions(w, h);
      cropEngine.current.initialize(w, h);

      // Draw image onto background layer
      const bgLayer = layerMgr.current.getActiveLayer();
      if (bgLayer) {
        const ctx = bgLayer.canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
      }

      // Save initial history
      historyMgr.current.push('Open Image', layerMgr.current.getLayers());

      setHasImage(true);
      syncLayers();
      requestRender();
      toast.success(`Image loaded · ${w}×${h}`);
    };
    img.src = src;
  }, [syncLayers, requestRender]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Save history snapshot
  const saveHistory = useCallback((label: string) => {
    historyMgr.current.push(label, layerMgr.current.getLayers());
    syncLayers();
  }, [syncLayers]);

  const undo = useCallback(() => {
    const snapshot = historyMgr.current.undo();
    if (snapshot) {
      historyMgr.current.restoreSnapshot(snapshot, layerMgr.current.getLayers());
      syncLayers();
      requestRender();
    }
  }, [syncLayers, requestRender]);

  const redo = useCallback(() => {
    const snapshot = historyMgr.current.redo();
    if (snapshot) {
      historyMgr.current.restoreSnapshot(snapshot, layerMgr.current.getLayers());
      syncLayers();
      requestRender();
    }
  }, [syncLayers, requestRender]);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    const newZoom = coordSystem.current.zoom * (1 + delta * 0.15);
    coordSystem.current.setZoom(newZoom);
    setZoom(Math.round(coordSystem.current.zoom * 100));
    requestRender();
  }, [requestRender]);

  // Canvas pointer handlers
  const getWorldPos = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return coordSystem.current.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!hasImage) return;
    const world = getWorldPos(e);

    // Middle button or hand tool = pan
    if (e.button === 1 || activeTool === 'hand') {
      setIsPanning(true);
      return;
    }

    // Crop tool
    if (isCropping) {
      cropEngine.current.handlePointerDown(world.x, world.y);
      return;
    }

    // Magic wand
    if (activeTool === 'magic-wand') {
      const layer = layerMgr.current.getActiveLayer();
      if (!layer) return;
      const ctx = layer.canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
      const ff = new FastFloodFill(imageData);
      const result = ff.execute(world.x, world.y, { tolerance: 32, contiguous: true });
      selMgr.current.applyMask(result.mask, result.bounds, e.shiftKey ? 'add' : 'new');
      requestRender();
      toast.success(`Selected ${result.pixelCount.toLocaleString()} pixels`);
      return;
    }

    // Eyedropper
    if (activeTool === 'eyedropper') {
      const flat = layerMgr.current.flattenAll();
      const ctx = flat.getContext('2d')!;
      const px = Math.floor(world.x);
      const py = Math.floor(world.y);
      if (px >= 0 && px < flat.width && py >= 0 && py < flat.height) {
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        const color = { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
        setForegroundColor(color);
        setBrushSettings(prev => ({ ...prev, color }));
        toast.success(`Color picked: rgb(${color.r}, ${color.g}, ${color.b})`);
      }
      return;
    }

    // Brush / Eraser
    if (activeTool === 'brush' || activeTool === 'eraser') {
      const layer = layerMgr.current.getActiveLayer();
      if (!layer || layer.locked) return;
      setIsDrawing(true);
      const settings = { ...brushSettings, color: foregroundColor };
      brushEngine.current.beginStroke(world, settings, activeTool === 'eraser');
      brushEngine.current.renderStrokeToCanvas(layer.canvas, [world], settings, activeTool === 'eraser');
      requestRender();
      return;
    }
  }, [hasImage, activeTool, isCropping, getWorldPos, brushSettings, foregroundColor, requestRender]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!hasImage) return;
    const world = getWorldPos(e);
    setCursorPos(world);

    if (isPanning) {
      coordSystem.current.setPan(
        coordSystem.current.pan.x + e.movementX,
        coordSystem.current.pan.y + e.movementY,
      );
      requestRender();
      return;
    }

    if (isCropping) {
      cropEngine.current.handlePointerMove(world.x, world.y);
      requestRender();
      return;
    }

    if (isDrawing && (activeTool === 'brush' || activeTool === 'eraser')) {
      const layer = layerMgr.current.getActiveLayer();
      if (!layer) return;
      const points = brushEngine.current.continueStroke(world, e.pressure || 1);
      if (points.length > 0) {
        brushEngine.current.renderStrokeToCanvas(layer.canvas, points, { ...brushSettings, color: foregroundColor }, activeTool === 'eraser', e.pressure || 1);
        requestRender();
      }
    }
  }, [hasImage, isPanning, isCropping, isDrawing, activeTool, getWorldPos, brushSettings, foregroundColor, requestRender]);

  const handlePointerUp = useCallback(() => {
    if (isPanning) { setIsPanning(false); return; }
    if (isCropping) { cropEngine.current.handlePointerUp(); return; }
    if (isDrawing) {
      brushEngine.current.endStroke();
      setIsDrawing(false);
      saveHistory(activeTool === 'eraser' ? 'Erase' : 'Brush');
    }
  }, [isPanning, isCropping, isDrawing, activeTool, saveHistory]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!hasImage) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      handleZoom(e.deltaY < 0 ? 1 : -1);
    } else {
      coordSystem.current.setPan(
        coordSystem.current.pan.x - e.deltaX,
        coordSystem.current.pan.y - e.deltaY,
      );
      requestRender();
    }
  }, [hasImage, handleZoom, requestRender]);

  // Export
  const exportImage = useCallback(() => {
    if (!hasImage) return;
    const flat = layerMgr.current.flattenAll();
    const url = flat.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-image.png';
    a.click();
    toast.success('Image exported');
  }, [hasImage]);

  // Crop
  const startCrop = useCallback(() => {
    cropEngine.current.start(null);
    setIsCropping(true);
    requestRender();
  }, [requestRender]);

  const applyCrop = useCallback(() => {
    const bounds = cropEngine.current.apply();
    if (!bounds) return;
    const ls = layerMgr.current.getLayers();
    for (const layer of ls) {
      const ctx = layer.canvas.getContext('2d')!;
      const cropped = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
      layer.canvas.width = bounds.width;
      layer.canvas.height = bounds.height;
      ctx.putImageData(cropped, 0, 0);
      layer.bounds = { ...bounds, x: 0, y: 0 };
    }
    coordSystem.current.setImageSize(bounds.width, bounds.height);
    coordSystem.current.fitToView();
    setZoom(Math.round(coordSystem.current.zoom * 100));
    selMgr.current.setDimensions(bounds.width, bounds.height);
    cropEngine.current.initialize(bounds.width, bounds.height);
    setIsCropping(false);
    saveHistory('Crop');
    requestRender();
    toast.success(`Cropped to ${bounds.width}×${bounds.height}`);
  }, [saveHistory, requestRender]);

  // AI processing
  const processWithAI = async () => {
    if (!aiPrompt.trim() || !hasImage) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-agents', {
        body: { action: 'image_edit', prompt: aiPrompt, image: layerMgr.current.flattenAll().toDataURL() },
      });
      if (error) throw error;
      if (data?.result) toast.success('AI processing complete');
    } catch { toast.error('AI processing failed'); }
    finally { setIsProcessing(false); setAiPrompt(''); }
  };

  // Tools configuration
  const tools: Array<{ id: ToolId; icon: React.ElementType; label: string; shortcut?: string }> = [
    { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
    { id: 'move', icon: Move, label: 'Move', shortcut: 'M' },
    { id: 'magic-wand', icon: Wand2, label: 'Magic Wand', shortcut: 'W' },
    { id: 'brush', icon: Paintbrush, label: 'Brush', shortcut: 'B' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
    { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
    { id: 'crop', icon: Crop, label: 'Crop', shortcut: 'C' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'shape', icon: Square, label: 'Shape', shortcut: 'U' },
    { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
  ];

  const adjustmentSliders = [
    { key: 'brightness' as const, icon: Sun, label: 'Brightness', min: 0, max: 200 },
    { key: 'contrast' as const, icon: Contrast, label: 'Contrast', min: 0, max: 200 },
    { key: 'saturation' as const, icon: Droplets, label: 'Saturation', min: 0, max: 200 },
    { key: 'blur' as const, icon: Eye, label: 'Blur', min: 0, max: 20 },
    { key: 'hue' as const, icon: Palette, label: 'Hue Rotate', min: 0, max: 360 },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); selMgr.current.selectAll(); requestRender(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); selMgr.current.clear(); requestRender(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') { e.preventDefault(); selMgr.current.invert(); requestRender(); return; }
      if (e.key === 'Escape' && isCropping) { cropEngine.current.cancel(); setIsCropping(false); requestRender(); return; }
      if (e.key === 'Enter' && isCropping) { applyCrop(); return; }

      const shortcuts: Record<string, ToolId> = { v: 'select', m: 'move', w: 'magic-wand', b: 'brush', e: 'eraser', i: 'eyedropper', c: 'crop', t: 'text', u: 'shape', h: 'hand' };
      const tool = shortcuts[e.key.toLowerCase()];
      if (tool) {
        if (tool === 'crop') startCrop();
        else setActiveTool(tool);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, requestRender, isCropping, applyCrop, startCrop]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={undo} disabled={!canUndo}>
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={redo} disabled={!canRedo}>
            <Redo className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleZoom(1)}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-9 text-center font-mono">{zoom}%</span>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleZoom(-1)}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => {
            coordSystem.current.fitToView();
            setZoom(Math.round(coordSystem.current.zoom * 100));
            requestRender();
          }}>
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7"><RotateCw className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><FlipHorizontal className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><FlipVertical className="w-3.5 h-3.5" /></Button>
          {isCropping && (
            <>
              <div className="w-px h-4 bg-border/30 mx-1" />
              <Button variant="default" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={applyCrop}>
                ✓ Apply Crop
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => {
                cropEngine.current.cancel();
                setIsCropping(false);
                requestRender();
              }}>
                Cancel
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasImage && (
            <div className="text-[9px] text-muted-foreground font-mono mr-2">
              {coordSystem.current.imageSize.width}×{coordSystem.current.imageSize.height}
              {cursorPos && coordSystem.current.isInBounds(cursorPos.x, cursorPos.y) &&
                ` · ${Math.floor(cursorPos.x)}, ${Math.floor(cursorPos.y)}`
              }
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> Open
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={exportImage} disabled={!hasImage}>
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tool sidebar */}
        <div className="w-10 border-r border-border/30 flex flex-col items-center py-1.5 gap-0.5 shrink-0 bg-card/30">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="icon"
                title={`${tool.label} (${tool.shortcut})`}
                className={cn('w-8 h-8 rounded-lg', activeTool === tool.id && 'bg-primary/15 text-primary ring-1 ring-primary/30')}
                onClick={() => {
                  if (tool.id === 'crop') startCrop();
                  else setActiveTool(tool.id);
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
          <div className="flex-1" />
          {/* Foreground color swatch */}
          <div
            className="w-6 h-6 rounded border border-border/50 cursor-pointer shadow-sm"
            style={{ backgroundColor: `rgb(${foregroundColor.r},${foregroundColor.g},${foregroundColor.b})` }}
            title="Foreground Color"
          />
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ background: 'hsl(var(--background))' }}
        >
          <canvas
            ref={canvasRef}
            className={cn(
              'absolute inset-0 w-full h-full',
              activeTool === 'brush' && 'cursor-crosshair',
              activeTool === 'eraser' && 'cursor-crosshair',
              activeTool === 'hand' && (isPanning ? 'cursor-grabbing' : 'cursor-grab'),
              activeTool === 'eyedropper' && 'cursor-crosshair',
              activeTool === 'magic-wand' && 'cursor-crosshair',
              activeTool === 'crop' && 'cursor-crosshair',
              activeTool === 'move' && 'cursor-move',
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => { setCursorPos(null); handlePointerUp(); }}
            onWheel={handleWheel}
            onContextMenu={e => e.preventDefault()}
          />

          {!hasImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="text-center p-10 rounded-2xl border-2 border-dashed border-border/30 bg-muted/5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all pointer-events-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-14 h-14 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground/60">Drop an image or click to open</p>
                <p className="text-[10px] text-muted-foreground/40 mt-1">PNG, JPG, SVG, WebP</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
