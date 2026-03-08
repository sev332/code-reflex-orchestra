// Illustrator App — Dark Pro Studio Drawing Engine
// Sprint 1: Pen handle dragging, Text tool, Color picker, SVG export, Undo wiring
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  MousePointer2, Pencil, PenTool, Paintbrush, Eraser, Square, Circle,
  Hexagon, Star, Minus, Type, Pipette, Hand, ZoomIn, PaintBucket,
  Undo, Redo, Plus, Eye, EyeOff, Lock, Unlock, Trash2, Copy,
  Grid3x3, Magnet,
  Download, Upload, Maximize2, RotateCw,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDrawingEngine } from '@/lib/drawing-engine/useDrawingEngine';
import { renderScene } from '@/lib/drawing-engine/renderer';
import { ToolId, Vec2 } from '@/lib/drawing-engine/types';
import type { RawInputSample } from '@/lib/drawing-engine/brush-core';
import { ColorPicker } from './ColorPicker';
import { BUILT_IN_FONTS } from '@/lib/drawing-engine/text-engine';

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS: { id: ToolId; icon: React.ComponentType<any>; label: string; shortcut: string; group: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V', group: 'select' },
  { id: 'direct-select', icon: MousePointer2, label: 'Direct Select', shortcut: 'A', group: 'select' },
  { id: 'pen', icon: PenTool, label: 'Pen', shortcut: 'P', group: 'draw' },
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'N', group: 'draw' },
  { id: 'brush', icon: Paintbrush, label: 'Brush', shortcut: 'B', group: 'draw' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E', group: 'draw' },
  { id: 'shape-rect', icon: Square, label: 'Rectangle', shortcut: 'R', group: 'shape' },
  { id: 'shape-ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O', group: 'shape' },
  { id: 'shape-polygon', icon: Hexagon, label: 'Polygon', shortcut: 'Y', group: 'shape' },
  { id: 'shape-star', icon: Star, label: 'Star', shortcut: 'S', group: 'shape' },
  { id: 'shape-line', icon: Minus, label: 'Line', shortcut: 'L', group: 'shape' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T', group: 'other' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I', group: 'other' },
  { id: 'fill-bucket', icon: PaintBucket, label: 'Fill', shortcut: 'G', group: 'other' },
  { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H', group: 'nav' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom', shortcut: 'Z', group: 'nav' },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1a1a2e',
  '#f472b6', '#a78bfa', '#67e8f9', '#4ade80', '#fbbf24', '#fb923c',
];

// ============================================
// MAIN COMPONENT
// ============================================

export function IllustratorApp() {
  const engine = useDrawingEngine();
  const { state, preview } = engine;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Vec2 | null>(null);
  const [dragStart, setDragStart] = useState<Vec2 | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Vec2 | null>(null);
  const [activePanel, setActivePanel] = useState<'properties' | 'layers'>('properties');
  const animRef = useRef<number>(0);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render loop — passes live preview, node overlay, and transform handles to renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${canvasSize.width}px`;
      canvas.style.height = `${canvasSize.height}px`;

      renderScene(
        ctx,
        state.scene,
        state.viewport,
        state.selection.selectedIds,
        state.selection.hoveredId,
        canvasSize.width,
        canvasSize.height,
        state.gridEnabled,
        state.gridSize,
        preview,
        engine.nodeOverlay,
        engine.computedTransformHandles,
      );

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, canvasSize, preview, engine.nodeOverlay, engine.computedTransformHandles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { engine.deleteSelected(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.shiftKey ? engine.redo() : engine.undo(); e.preventDefault(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { engine.redo(); e.preventDefault(); return; }
      if (e.key === 'Escape' && engine.penAnchors.length > 0) {
        // Finish pen path on Escape
        engine.finishPenPath();
        return;
      }
      const tool = TOOLS.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) engine.setTool(tool.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  // ============================================
  // POINTER INTERACTION (not mouse — for pressure)
  // ============================================

  const screenToWorld = useCallback((sx: number, sy: number): Vec2 => ({
    x: sx / state.viewport.zoom - state.viewport.panX,
    y: sy / state.viewport.zoom - state.viewport.panY,
  }), [state.viewport]);

  const makeSample = (e: React.PointerEvent, world: Vec2): RawInputSample => ({
    x: world.x,
    y: world.y,
    pressure: e.pressure || 0.5,
    tiltX: (e as any).tiltX || 0,
    tiltY: (e as any).tiltY || 0,
    timestamp: e.timeStamp,
    pointerType: (e.pointerType as 'pen' | 'mouse' | 'touch') || 'mouse',
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const tool = state.tool.activeToolId;

    // Capture pointer for smooth tracking
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Pan
    if (tool === 'hand' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Direct Select — node editing
    if (tool === 'direct-select') {
      // Try node drag first
      if (engine.nodeOverlay.enabled && engine.beginNodeDrag(world)) {
        setIsDrawing(true);
        return;
      }
      // Try to enter node edit on an entity
      const hitId = engine.hitTestAtPoint({ x: sx, y: sy });
      if (hitId) {
        engine.select([hitId]);
        engine.enterNodeEdit(hitId);
      } else {
        engine.exitNodeEdit();
        engine.select([]);
      }
      return;
    }

    // Select — with transform handles
    if (tool === 'select') {
      // Try transform handle first
      if (engine.beginTransform(world)) {
        setIsDrawing(true);
        return;
      }
      const hitId = engine.hitTestAtPoint({ x: sx, y: sy });
      if (hitId) {
        if (e.shiftKey) {
          const ids = state.selection.selectedIds.includes(hitId)
            ? state.selection.selectedIds.filter(id => id !== hitId)
            : [...state.selection.selectedIds, hitId];
          engine.select(ids);
        } else {
          engine.select([hitId]);
        }
        setDragStart(world);
      } else {
        engine.select([]);
      }
      // Exit node edit when switching to select
      engine.exitNodeEdit();
      return;
    }

    // Pen tool — click to add anchor
    if (tool === 'pen') {
      engine.addPenAnchor({ x: world.x, y: world.y });
      return;
    }

    // Brush / Pencil — start BrushSession
    if (tool === 'brush' || tool === 'pencil') {
      setIsDrawing(true);
      engine.beginBrushStroke(makeSample(e, world));
      return;
    }

    // Shape tools
    if (tool.startsWith('shape-')) {
      setIsDrawing(true);
      setDrawStart(world);
      if (tool === 'shape-line') {
        engine.beginLinePreview(world, state.tool.strokeColor, state.tool.strokeWidth);
      } else {
        const shapeKind = tool.replace('shape-', '');
        engine.beginShapePreview(world, shapeKind, state.tool.fillColor, state.tool.strokeColor, state.tool.strokeWidth);
      }
    }
  }, [state.tool, state.viewport, state.selection.selectedIds, engine, screenToWorld]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const tool = state.tool.activeToolId;

    // Pan
    if (isPanning && panStart) {
      const dx = (e.clientX - panStart.x) / state.viewport.zoom;
      const dy = (e.clientY - panStart.y) / state.viewport.zoom;
      engine.pan(dx, dy);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Node drag (direct-select)
    if (isDrawing && tool === 'direct-select') {
      engine.updateNodeDrag(world);
      return;
    }

    // Transform drag (select)
    if (isDrawing && tool === 'select' && engine.transformState.active) {
      engine.updateTransform(world);
      return;
    }

    // Drag selected
    if (dragStart && state.selection.selectedIds.length > 0) {
      engine.moveSelected(world.x - dragStart.x, world.y - dragStart.y);
      setDragStart(world);
      return;
    }

    // Brush / Pencil — update session
    if (isDrawing && (tool === 'brush' || tool === 'pencil')) {
      engine.updateBrushStroke(makeSample(e, world));
      return;
    }

    // Shape preview
    if (isDrawing && drawStart) {
      if (tool === 'shape-line') {
        engine.updateLinePreview(world);
      } else {
        engine.updateShapePreview(world);
      }
      return;
    }

    // Pen cursor tracking
    if (tool === 'pen') {
      engine.updatePenCursor(world);
      return;
    }

    // Hover
    if (tool === 'select') {
      engine.setHovered(engine.hitTestAtPoint({ x: sx, y: sy }));
    }
  }, [isPanning, panStart, dragStart, isDrawing, drawStart, state, engine, screenToWorld]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (isPanning) { setIsPanning(false); setPanStart(null); return; }
    if (dragStart) { setDragStart(null); return; }

    const tool = state.tool.activeToolId;

    // End node drag
    if (tool === 'direct-select' && isDrawing) {
      engine.endNodeDrag();
      setIsDrawing(false);
      return;
    }

    // End transform
    if (tool === 'select' && engine.transformState.active) {
      engine.endTransform();
      setIsDrawing(false);
      return;
    }

    if (!isDrawing) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const { fillColor, strokeColor, strokeWidth } = state.tool;

    // Brush / Pencil — finalize
    if (tool === 'brush' || tool === 'pencil') {
      const size = tool === 'brush' ? engine.activeBrushPreset.baseSize : 2;
      engine.endBrushStroke(makeSample(e, world), strokeColor, size);
    }

    // Shape finalization
    if (drawStart && tool === 'shape-rect') {
      const x = Math.min(drawStart.x, world.x), y = Math.min(drawStart.y, world.y);
      const w = Math.abs(world.x - drawStart.x), h = Math.abs(world.y - drawStart.y);
      if (w > 2 && h > 2) engine.addEntity(engine.createRectEntity(x, y, w, h, fillColor, strokeColor, strokeWidth));
      engine.endShapePreview();
    } else if (drawStart && tool === 'shape-ellipse') {
      const cx = (drawStart.x + world.x) / 2, cy = (drawStart.y + world.y) / 2;
      const rx = Math.abs(world.x - drawStart.x) / 2, ry = Math.abs(world.y - drawStart.y) / 2;
      if (rx > 2 && ry > 2) engine.addEntity(engine.createEllipseEntity(cx, cy, rx, ry, fillColor, strokeColor, strokeWidth));
      engine.endShapePreview();
    } else if (drawStart && tool === 'shape-line') {
      engine.addEntity(engine.createLineEntity(drawStart.x, drawStart.y, world.x, world.y, strokeColor, strokeWidth));
      engine.endLinePreview();
    } else if (drawStart && (tool === 'shape-polygon' || tool === 'shape-star')) {
      const x = Math.min(drawStart.x, world.x), y = Math.min(drawStart.y, world.y);
      const w = Math.abs(world.x - drawStart.x), h = Math.abs(world.y - drawStart.y);
      if (w > 2 && h > 2) engine.addEntity(engine.createRectEntity(x, y, w, h, fillColor, strokeColor, strokeWidth));
      engine.endShapePreview();
    }

    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, isPanning, dragStart, state.tool, engine, screenToWorld]);


  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      engine.setZoom(state.viewport.zoom * (e.deltaY > 0 ? 0.9 : 1.1));
    } else {
      engine.pan(-e.deltaX / state.viewport.zoom, -e.deltaY / state.viewport.zoom);
    }
  }, [engine, state.viewport.zoom]);

  const zoomPercent = Math.round(state.viewport.zoom * 100);
  const selectedEntity = state.selection.selectedIds.length === 1
    ? state.scene.entities[state.selection.selectedIds[0]]
    : null;
  const entityCount = Object.keys(state.scene.entities).length;

  return (
    <div className="h-full flex flex-col bg-[hsl(220,27%,4%)] text-[hsl(193,30%,75%)] select-none overflow-hidden">
      {/* Top toolbar */}
      <div className="h-10 flex items-center justify-between px-2 border-b border-[hsl(220,15%,12%)] bg-[hsl(220,27%,6%)] shrink-0 gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={engine.undo} disabled={!engine.canUndo}>
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={engine.redo} disabled={!engine.canRedo}>
            <Redo className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-[hsl(220,15%,15%)] mx-1" />
          <Button variant="ghost" size="icon" className={cn('w-7 h-7', state.gridEnabled && 'text-primary bg-primary/10')} onClick={engine.toggleGrid}>
            <Grid3x3 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className={cn('w-7 h-7', state.snapEnabled && 'text-primary bg-primary/10')} onClick={engine.toggleSnap}>
            <Magnet className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{zoomPercent}%</span>
          <div className="w-px h-5 bg-[hsl(220,15%,15%)]" />
          <span className="text-muted-foreground">{entityCount} objects</span>
          {state.selection.selectedIds.length > 0 && (
            <>
              <div className="w-px h-5 bg-[hsl(220,15%,15%)]" />
              <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                {state.selection.selectedIds.length} selected
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Upload className="w-3 h-3" /> Import
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left tool strip */}
        <div className="w-11 border-r border-[hsl(220,15%,12%)] bg-[hsl(220,27%,5%)] flex flex-col items-center py-2 gap-0.5 shrink-0 overflow-y-auto">
          {(() => {
            let lastGroup = '';
            return TOOLS.map(tool => {
              const Icon = tool.icon;
              const showDivider = lastGroup && lastGroup !== tool.group;
              lastGroup = tool.group;
              return (
                <React.Fragment key={tool.id}>
                  {showDivider && <div className="w-6 h-px bg-[hsl(220,15%,15%)] my-1" />}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'w-8 h-8 rounded-md transition-all',
                          state.tool.activeToolId === tool.id
                            ? 'bg-primary/15 text-primary shadow-[0_0_8px_hsl(193,100%,50%,0.2)]'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        onClick={() => engine.setTool(tool.id)}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {tool.label} <span className="text-muted-foreground ml-1">{tool.shortcut}</span>
                    </TooltipContent>
                  </Tooltip>
                </React.Fragment>
              );
            });
          })()}

          {/* Color swatches at bottom */}
          <div className="mt-auto flex flex-col items-center gap-1.5 pt-2">
            <div className="relative w-7 h-7">
              <div
                className="absolute top-0 left-0 w-5 h-5 rounded-sm border border-[hsl(220,15%,25%)] cursor-pointer z-10"
                style={{ backgroundColor: state.tool.fillColor }}
                title="Fill color"
              />
              <div
                className="absolute bottom-0 right-0 w-5 h-5 rounded-sm border border-[hsl(220,15%,25%)] cursor-pointer"
                style={{ backgroundColor: state.tool.strokeColor }}
                title="Stroke color"
              />
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: getCursorForTool(state.tool.activeToolId, isPanning), touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => { setIsDrawing(false); setIsPanning(false); setDragStart(null); }}
            onWheel={handleWheel}
            onContextMenu={e => e.preventDefault()}
          />

          {/* Floating zoom controls */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[hsl(220,27%,6%)/90] backdrop-blur-sm rounded-lg border border-[hsl(220,15%,15%)] px-2 py-1">
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => engine.setZoom(state.viewport.zoom * 0.8)}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-[10px] w-10 text-center font-mono">{zoomPercent}%</span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => engine.setZoom(state.viewport.zoom * 1.25)}>
              <Plus className="w-3 h-3" />
            </Button>
            <div className="w-px h-4 bg-[hsl(220,15%,15%)]" />
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => { engine.setZoom(1); engine.pan(-state.viewport.panX, -state.viewport.panY); }}>
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Brush preset indicator */}
          {(state.tool.activeToolId === 'brush') && (
            <div className="absolute top-3 left-3 bg-[hsl(220,27%,6%)/90] backdrop-blur-sm rounded-lg border border-[hsl(220,15%,15%)] px-3 py-1.5 text-[10px]">
              <span className="text-muted-foreground">Brush:</span>{' '}
              <span className="text-primary font-medium">{engine.activeBrushPreset.name}</span>
              <span className="text-muted-foreground ml-2">{engine.activeBrushPreset.baseSize}px</span>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-56 border-l border-[hsl(220,15%,12%)] bg-[hsl(220,27%,5%)] flex flex-col shrink-0">
          <div className="flex border-b border-[hsl(220,15%,12%)]">
            <button
              className={cn(
                'flex-1 py-2 text-[11px] font-medium transition-colors',
                activePanel === 'properties' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActivePanel('properties')}
            >
              Properties
            </button>
            <button
              className={cn(
                'flex-1 py-2 text-[11px] font-medium transition-colors',
                activePanel === 'layers' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActivePanel('layers')}
            >
              Layers
            </button>
          </div>

          <ScrollArea className="flex-1">
            {activePanel === 'properties' ? (
              <PropertiesPanel engine={engine} selectedEntity={selectedEntity} />
            ) : (
              <LayersPanel engine={engine} />
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROPERTIES PANEL
// ============================================

function PropertiesPanel({ engine, selectedEntity }: { engine: ReturnType<typeof useDrawingEngine>; selectedEntity: any }) {
  const { state } = engine;

  return (
    <div className="p-3 space-y-4">
      {/* Fill & Stroke */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Appearance</div>
        <div className="space-y-1.5 mb-3">
          <div className="text-[10px] text-muted-foreground">Fill</div>
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                className={cn(
                  'w-5 h-5 rounded-sm border transition-all',
                  state.tool.fillColor === color ? 'border-primary scale-110 shadow-[0_0_6px_hsl(193,100%,50%,0.3)]' : 'border-[hsl(220,15%,20%)] hover:border-[hsl(220,15%,30%)]'
                )}
                style={{ backgroundColor: color }}
                onClick={() => engine.setFillColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground">Stroke</div>
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                className={cn(
                  'w-5 h-5 rounded-sm border transition-all',
                  state.tool.strokeColor === color ? 'border-primary scale-110 shadow-[0_0_6px_hsl(193,100%,50%,0.3)]' : 'border-[hsl(220,15%,20%)] hover:border-[hsl(220,15%,30%)]'
                )}
                style={{ backgroundColor: color }}
                onClick={() => engine.setStrokeColor(color)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground w-10">Width</span>
            <Slider
              value={[state.tool.strokeWidth]}
              min={0} max={20} step={0.5}
              onValueChange={([v]) => engine.setStrokeWidth(v)}
              className="flex-1"
            />
            <span className="text-[10px] font-mono w-6 text-right">{state.tool.strokeWidth}</span>
          </div>
        </div>
      </div>

      {/* Brush presets */}
      {(state.tool.activeToolId === 'brush' || state.tool.activeToolId === 'pencil') && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Brush Presets</div>
          <div className="space-y-1">
            {engine.brushPresets.map(preset => (
              <button
                key={preset.id}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] transition-colors',
                  engine.activeBrushPreset.id === preset.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-[hsl(220,15%,10%)] hover:text-foreground'
                )}
                onClick={() => engine.setActiveBrushPreset(preset)}
              >
                <div className="w-4 h-4 rounded-full border border-[hsl(220,15%,20%)]" style={{ backgroundColor: preset.color }} />
                <span className="flex-1 text-left">{preset.name}</span>
                <span className="text-[8px] text-muted-foreground/60">{preset.baseSize}px</span>
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14">Size</span>
              <Slider value={[engine.activeBrushPreset.baseSize]} min={1} max={100} step={1} className="flex-1" />
              <span className="text-[10px] font-mono w-6 text-right">{engine.activeBrushPreset.baseSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14">Opacity</span>
              <Slider value={[engine.activeBrushPreset.opacity * 100]} min={0} max={100} step={1} className="flex-1" />
              <span className="text-[10px] font-mono w-6 text-right">{Math.round(engine.activeBrushPreset.opacity * 100)}%</span>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-muted-foreground/50">
            Stabilizer: {engine.activeBrushPreset.session.stabilizer.mode} • Min dist: {engine.activeBrushPreset.session.minDistance}px
          </div>
        </div>
      )}

      {/* Selected entity props */}
      {selectedEntity && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Transform</div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-4">X</span>
              <Input value={Math.round(selectedEntity.transform.translateX)} className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)]" readOnly />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-4">Y</span>
              <Input value={Math.round(selectedEntity.transform.translateY)} className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)]" readOnly />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-4">W</span>
              <Input value={Math.round(selectedEntity.shapeProps?.width ?? 0)} className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)]" readOnly />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-4">H</span>
              <Input value={Math.round(selectedEntity.shapeProps?.height ?? 0)} className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)]" readOnly />
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={engine.deleteSelected}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7"><Copy className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="w-7 h-7"><RotateCw className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}

      {/* Alignment */}
      {state.selection.selectedIds.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Align</div>
          <div className="flex gap-0.5">
            {[AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical].map((Icon, i) => (
              <Button key={i} variant="ghost" size="icon" className="w-7 h-7"><Icon className="w-3.5 h-3.5" /></Button>
            ))}
          </div>
        </div>
      )}

      {/* Path Operations */}
      {state.selection.selectedIds.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Path Ops</div>
          <div className="grid grid-cols-3 gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-[9px]" onClick={() => engine.pathSimplify(2)}>
              Simplify
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px]" onClick={() => engine.pathReverse()}>
              Reverse
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px]" onClick={() => engine.pathOffset(5)}>
              Offset
            </Button>
          </div>
          {state.selection.selectedIds.length >= 2 && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-3">Boolean</div>
              <div className="grid grid-cols-3 gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[9px]" onClick={() => engine.pathBoolean('union')}>
                  Union
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[9px]" onClick={() => engine.pathBoolean('subtract')}>
                  Subtract
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[9px]" onClick={() => engine.pathBoolean('intersect')}>
                  Intersect
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Node editing info */}
      {engine.nodeOverlay.enabled && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Node Editing</div>
          <p className="text-[9px] text-muted-foreground">Click anchors to move them. Drag handles to reshape curves. Press Delete to remove selected anchor.</p>
          <Button variant="ghost" size="sm" className="h-7 text-[9px] mt-1 w-full" onClick={() => engine.exitNodeEdit()}>
            Exit Node Edit
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// LAYERS PANEL
// ============================================

function LayersPanel({ engine }: { engine: ReturnType<typeof useDrawingEngine> }) {
  const { state } = engine;

  return (
    <div className="p-2 space-y-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layers</span>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={engine.addLayer}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {[...state.scene.layers].reverse().map(layer => {
        const isActive = layer.id === state.scene.activeLayerId;
        const layerEntities = layer.entities.map(id => state.scene.entities[id]).filter(Boolean);

        return (
          <div key={layer.id} className="rounded-md overflow-hidden">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors text-[11px]',
                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-[hsl(220,15%,10%)]'
              )}
              onClick={() => engine.setActiveLayer(layer.id)}
            >
              <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={e => { e.stopPropagation(); engine.toggleLayerVisibility(layer.id); }}>
                {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground/50" />}
              </Button>
              <span className="flex-1 truncate">{layer.name}</span>
              <Badge variant="outline" className="text-[8px] h-4 px-1 border-[hsl(220,15%,20%)]">
                {layerEntities.length}
              </Badge>
              <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={e => { e.stopPropagation(); engine.toggleLayerLock(layer.id); }}>
                {layer.locked ? <Lock className="w-3 h-3 text-muted-foreground/50" /> : <Unlock className="w-3 h-3" />}
              </Button>
            </div>

            {isActive && layerEntities.length > 0 && (
              <div className="pl-6 border-l border-[hsl(220,15%,12%)] ml-3">
                {layerEntities.map(entity => (
                  <div
                    key={entity.id}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 text-[10px] cursor-pointer transition-colors',
                      state.selection.selectedIds.includes(entity.id)
                        ? 'bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(220,15%,8%)]'
                    )}
                    onClick={() => engine.select([entity.id])}
                  >
                    <div className="w-3 h-3 rounded-sm border border-[hsl(220,15%,20%)]" style={{ backgroundColor: entity.fill.color }} />
                    <span className="flex-1 truncate">{entity.name}</span>
                    <span className="text-[8px] text-muted-foreground/50">{entity.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getCursorForTool(tool: ToolId, isPanning: boolean): string {
  if (isPanning) return 'grabbing';
  switch (tool) {
    case 'select': return 'default';
    case 'direct-select': return 'default';
    case 'hand': return 'grab';
    case 'zoom': return 'zoom-in';
    case 'eyedropper': return 'crosshair';
    case 'text': return 'text';
    default: return 'crosshair';
  }
}
