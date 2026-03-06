// AI-Powered Image Editor with Gemini Integration
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Image, Upload, Download, Undo, Redo, ZoomIn, ZoomOut,
  Crop, RotateCw, FlipHorizontal, FlipVertical, Palette,
  Wand2, Sparkles, Layers, Type, Eraser, Paintbrush,
  Move, Square, Circle, Triangle, Minus, Plus, Sun,
  Contrast, Droplets, Eye, Loader2, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Tool = 'select' | 'brush' | 'eraser' | 'crop' | 'text' | 'shape' | 'move';

interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hue: number;
}

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [adjustments, setAdjustments] = useState<AdjustmentState>({
    brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0
  });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activePanel, setActivePanel] = useState<'tools' | 'adjust' | 'ai' | 'layers'>('tools');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setCurrentImage(src);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), src]);
      setHistoryIndex(prev => prev + 1);
      drawImageToCanvas(src);
    };
    reader.readAsDataURL(file);
  };

  const drawImageToCanvas = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = getFilterString();
      ctx.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [adjustments]);

  const getFilterString = () => {
    return `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px) hue-rotate(${adjustments.hue}deg)`;
  };

  // AI image processing via Gemini
  const processWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-agents', {
        body: {
          action: 'image_edit',
          prompt: aiPrompt,
          image: currentImage,
        }
      });
      if (error) throw error;
      if (data?.result) {
        toast.success('AI processing complete');
      }
    } catch (e) {
      toast.error('AI processing failed');
    } finally {
      setIsProcessing(false);
      setAiPrompt('');
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      const prev = history[historyIndex - 1];
      setCurrentImage(prev);
      drawImageToCanvas(prev);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      const next = history[historyIndex + 1];
      setCurrentImage(next);
      drawImageToCanvas(next);
    }
  };

  const tools = [
    { id: 'select' as Tool, icon: Move, label: 'Select' },
    { id: 'brush' as Tool, icon: Paintbrush, label: 'Brush' },
    { id: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
    { id: 'crop' as Tool, icon: Crop, label: 'Crop' },
    { id: 'text' as Tool, icon: Type, label: 'Text' },
    { id: 'shape' as Tool, icon: Square, label: 'Shape' },
  ];

  const adjustmentSliders = [
    { key: 'brightness' as const, icon: Sun, label: 'Brightness', min: 0, max: 200 },
    { key: 'contrast' as const, icon: Contrast, label: 'Contrast', min: 0, max: 200 },
    { key: 'saturation' as const, icon: Droplets, label: 'Saturation', min: 0, max: 200 },
    { key: 'blur' as const, icon: Eye, label: 'Blur', min: 0, max: 20 },
    { key: 'hue' as const, icon: Palette, label: 'Hue Rotate', min: 0, max: 360 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 shrink-0 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.min(z + 25, 400))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.max(z - 25, 25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-8 h-8"><RotateCw className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8"><FlipHorizontal className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8"><FlipVertical className="w-4 h-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> Upload
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tool sidebar */}
        <div className="w-12 border-r border-border/30 flex flex-col items-center py-2 gap-1 shrink-0">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="icon"
                className={cn('w-9 h-9 rounded-lg', activeTool === tool.id && 'bg-primary/15 text-primary')}
                onClick={() => setActiveTool(tool.id)}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-auto bg-[hsl(220,27%,3%)]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, hsla(220,27%,8%,1) 0%, hsla(220,27%,3%,1) 100%)' }}>
          {currentImage ? (
            <div className="absolute inset-0 flex items-center justify-center p-8" style={{ transform: `scale(${zoom / 100})` }}>
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full shadow-2xl shadow-black/50 rounded-sm"
                style={{ filter: getFilterString() }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div
                className="text-center p-12 rounded-2xl border-2 border-dashed border-border/30 bg-muted/5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Drop an image or click to upload</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Supports PNG, JPG, SVG, WebP</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-64 border-l border-border/30 flex flex-col shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-border/30 px-1 py-1 gap-0.5">
            {[
              { id: 'tools' as const, icon: SlidersHorizontal, label: 'Tools' },
              { id: 'adjust' as const, icon: Sun, label: 'Adjust' },
              { id: 'ai' as const, icon: Sparkles, label: 'AI' },
              { id: 'layers' as const, icon: Layers, label: 'Layers' },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 px-2 text-xs gap-1 flex-1', activePanel === tab.id && 'bg-primary/15 text-primary')}
                  onClick={() => setActivePanel(tab.id)}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              {activePanel === 'adjust' && (
                <div className="space-y-4">
                  {adjustmentSliders.map(slider => {
                    const Icon = slider.icon;
                    return (
                      <div key={slider.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs">{slider.label}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{adjustments[slider.key]}</span>
                        </div>
                        <Slider
                          value={[adjustments[slider.key]]}
                          min={slider.min}
                          max={slider.max}
                          step={1}
                          onValueChange={([v]) => {
                            setAdjustments(prev => ({ ...prev, [slider.key]: v }));
                            if (currentImage) drawImageToCanvas(currentImage);
                          }}
                          className="w-full"
                        />
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs mt-2"
                    onClick={() => setAdjustments({ brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0 })}
                  >
                    Reset All
                  </Button>
                </div>
              )}

              {activePanel === 'ai' && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Image Tools</div>
                  <Textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to do with the image..."
                    className="text-xs h-24 bg-muted/20 border-border/30"
                  />
                  <Button
                    size="sm"
                    className="w-full text-xs gap-1"
                    onClick={processWithAI}
                    disabled={isProcessing || !currentImage}
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isProcessing ? 'Processing...' : 'Apply AI Edit'}
                  </Button>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground">Quick Actions</p>
                    {['Remove background', 'Upscale 2x', 'Auto-enhance', 'Add depth of field', 'Convert to illustration'].map(action => (
                      <Button key={action} variant="outline" size="sm" className="w-full text-xs justify-start h-7 gap-1" onClick={() => setAiPrompt(action)}>
                        <Wand2 className="w-3 h-3" />{action}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'tools' && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active: {activeTool}</div>
                  {activeTool === 'brush' && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs">Size</span>
                        <Slider value={[10]} min={1} max={100} className="mt-1" />
                      </div>
                      <div>
                        <span className="text-xs">Opacity</span>
                        <Slider value={[100]} min={0} max={100} className="mt-1" />
                      </div>
                      <div>
                        <span className="text-xs">Hardness</span>
                        <Slider value={[80]} min={0} max={100} className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activePanel === 'layers' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Layers</span>
                    <Button variant="ghost" size="icon" className="w-6 h-6"><Plus className="w-3 h-3" /></Button>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2 border border-border/20">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs flex-1">Background</span>
                      <Badge variant="outline" className="text-[8px] h-3.5">100%</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
