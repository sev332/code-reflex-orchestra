// Presentations — Slide deck builder with AI generation, templates, presenter mode
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import {
  Plus, Trash2, Copy, ChevronLeft, ChevronRight, Play, Maximize,
  Type, Image, Square, Circle, LayoutGrid, Palette, Wand2, Download,
  Upload, Settings, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, List, Code2, Minus, ChevronDown,
  Presentation, Monitor, Layers, MousePointer, Move, RotateCcw,
  Eye, EyeOff, Lock, Unlock, Grid3x3, Sparkles, FileText,
  ArrowRight, GripVertical, ZoomIn, ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'code';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    textAlign?: 'left' | 'center' | 'right';
    opacity?: number;
    padding?: number;
  };
  locked: boolean;
  visible: boolean;
}

interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  transition: 'none' | 'fade' | 'slide' | 'zoom';
  notes: string;
  layout: string;
}

interface SlideTemplate {
  id: string;
  name: string;
  category: string;
  slides: Partial<Slide>[];
  preview: string;
}

// ─── Templates ─────────────────────────────────────

const slideTemplates: SlideTemplate[] = [
  {
    id: 'title', name: 'Title Slide', category: 'Basics', preview: '📊',
    slides: [{
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      elements: [
        { id: 'title', type: 'text', x: 10, y: 30, width: 80, height: 15, rotation: 0, content: 'Presentation Title', style: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }, locked: false, visible: true },
        { id: 'subtitle', type: 'text', x: 20, y: 50, width: 60, height: 8, rotation: 0, content: 'Subtitle or description goes here', style: { fontSize: 20, color: '#aaaacc', textAlign: 'center' }, locked: false, visible: true },
      ],
    }],
  },
  {
    id: 'content', name: 'Content', category: 'Basics', preview: '📝',
    slides: [{
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      elements: [
        { id: 'heading', type: 'text', x: 5, y: 5, width: 90, height: 10, rotation: 0, content: 'Section Title', style: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' }, locked: false, visible: true },
        { id: 'body', type: 'text', x: 5, y: 20, width: 55, height: 65, rotation: 0, content: '• Key point one\n• Key point two\n• Key point three\n• Key point four', style: { fontSize: 18, color: '#ccccdd', padding: 8 }, locked: false, visible: true },
        { id: 'accent', type: 'shape', x: 65, y: 20, width: 30, height: 65, rotation: 0, content: '', style: { backgroundColor: 'rgba(100, 100, 255, 0.1)', borderRadius: 12 }, locked: false, visible: true },
      ],
    }],
  },
  {
    id: 'two-col', name: 'Two Columns', category: 'Layouts', preview: '⬜⬜',
    slides: [{
      background: 'linear-gradient(135deg, #0a0a1a, #1a1a3e)',
      elements: [
        { id: 'heading', type: 'text', x: 5, y: 5, width: 90, height: 10, rotation: 0, content: 'Comparison', style: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }, locked: false, visible: true },
        { id: 'left', type: 'text', x: 3, y: 20, width: 44, height: 70, rotation: 0, content: 'Left Column\n\n• Point A\n• Point B\n• Point C', style: { fontSize: 16, color: '#ccccdd', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16 }, locked: false, visible: true },
        { id: 'right', type: 'text', x: 53, y: 20, width: 44, height: 70, rotation: 0, content: 'Right Column\n\n• Point X\n• Point Y\n• Point Z', style: { fontSize: 16, color: '#ccccdd', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16 }, locked: false, visible: true },
      ],
    }],
  },
  {
    id: 'quote', name: 'Quote', category: 'Basics', preview: '💬',
    slides: [{
      background: 'linear-gradient(135deg, #141e30, #243b55)',
      elements: [
        { id: 'quote', type: 'text', x: 10, y: 25, width: 80, height: 30, rotation: 0, content: '"The only way to do great work is to love what you do."', style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }, locked: false, visible: true },
        { id: 'author', type: 'text', x: 25, y: 60, width: 50, height: 8, rotation: 0, content: '— Steve Jobs', style: { fontSize: 18, color: '#8888aa', textAlign: 'center' }, locked: false, visible: true },
      ],
    }],
  },
  {
    id: 'code-slide', name: 'Code Snippet', category: 'Technical', preview: '💻',
    slides: [{
      background: '#0d1117',
      elements: [
        { id: 'heading', type: 'text', x: 5, y: 5, width: 90, height: 8, rotation: 0, content: 'Code Example', style: { fontSize: 28, fontWeight: 'bold', color: '#e6edf3' }, locked: false, visible: true },
        { id: 'code', type: 'code', x: 5, y: 18, width: 90, height: 70, rotation: 0, content: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10)); // 55', style: { fontSize: 16, color: '#e6edf3', backgroundColor: '#161b22', borderRadius: 8, padding: 16, fontFamily: 'monospace' }, locked: false, visible: true },
      ],
    }],
  },
  {
    id: 'thankyou', name: 'Thank You', category: 'Basics', preview: '🎉',
    slides: [{
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      elements: [
        { id: 'thanks', type: 'text', x: 10, y: 30, width: 80, height: 20, rotation: 0, content: 'Thank You!', style: { fontSize: 64, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }, locked: false, visible: true },
        { id: 'contact', type: 'text', x: 20, y: 55, width: 60, height: 10, rotation: 0, content: 'Questions? Reach out at hello@example.com', style: { fontSize: 18, color: '#ffffffcc', textAlign: 'center' }, locked: false, visible: true },
      ],
    }],
  },
];

const createSlideFromTemplate = (template: SlideTemplate): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  elements: (template.slides[0]?.elements || []).map(e => ({ ...e } as SlideElement)),
  background: template.slides[0]?.background || '#1a1a2e',
  transition: 'fade',
  notes: '',
  layout: template.id,
});

const createBlankSlide = (): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  elements: [],
  background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  transition: 'fade',
  notes: '',
  layout: 'blank',
});

// ─── Main Component ────────────────────────────────

export function PresentationsPage() {
  const [slides, setSlides] = useState<Slide[]>([
    createSlideFromTemplate(slideTemplates[0]),
    createSlideFromTemplate(slideTemplates[1]),
    createSlideFromTemplate(slideTemplates[3]),
    createSlideFromTemplate(slideTemplates[5]),
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'design' | 'elements' | 'ai'>('design');
  const [zoom, setZoom] = useState(80);
  const [isPresenting, setIsPresenting] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('All');
  const [aiPrompt, setAiPrompt] = useState('');

  const currentSlide = slides[currentSlideIndex] || null;
  const selectedElement = currentSlide?.elements.find(e => e.id === selectedElementId) || null;

  const updateSlide = useCallback((index: number, updates: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== currentSlideIndex) return s;
      return { ...s, elements: s.elements.map(e => e.id === elementId ? { ...e, ...updates } : e) };
    }));
  }, [currentSlideIndex]);

  const updateElementStyle = useCallback((elementId: string, styleUpdates: Partial<SlideElement['style']>) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== currentSlideIndex) return s;
      return { ...s, elements: s.elements.map(e => e.id === elementId ? { ...e, style: { ...e.style, ...styleUpdates } } : e) };
    }));
  }, [currentSlideIndex]);

  const addSlide = useCallback((template?: SlideTemplate) => {
    const newSlide = template ? createSlideFromTemplate(template) : createBlankSlide();
    setSlides(prev => [...prev.slice(0, currentSlideIndex + 1), newSlide, ...prev.slice(currentSlideIndex + 1)]);
    setCurrentSlideIndex(prev => prev + 1);
  }, [currentSlideIndex]);

  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [slides.length, currentSlideIndex]);

  const duplicateSlide = useCallback((index: number) => {
    const slide = slides[index];
    const dup: Slide = {
      ...slide,
      id: `slide-${Date.now()}`,
      elements: slide.elements.map(e => ({ ...e, id: `${e.id}-${Date.now()}` })),
    };
    setSlides(prev => [...prev.slice(0, index + 1), dup, ...prev.slice(index + 1)]);
    setCurrentSlideIndex(index + 1);
  }, [slides]);

  const addElement = useCallback((type: SlideElement['type']) => {
    const newEl: SlideElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      x: 20, y: 30, width: 40, height: type === 'text' ? 10 : 20,
      rotation: 0,
      content: type === 'text' ? 'New Text' : type === 'code' ? '// code here' : '',
      style: {
        fontSize: type === 'text' ? 24 : 14,
        color: '#ffffff',
        backgroundColor: type === 'shape' ? 'rgba(100,100,255,0.2)' : undefined,
        borderRadius: type === 'shape' ? 8 : 0,
        textAlign: 'left',
        opacity: 1,
        padding: type === 'code' ? 12 : 0,
        fontFamily: type === 'code' ? 'monospace' : undefined,
      },
      locked: false,
      visible: true,
    };
    updateSlide(currentSlideIndex, { elements: [...(currentSlide?.elements || []), newEl] });
    setSelectedElementId(newEl.id);
  }, [currentSlide, currentSlideIndex, updateSlide]);

  const deleteElement = useCallback((elementId: string) => {
    if (!currentSlide) return;
    updateSlide(currentSlideIndex, { elements: currentSlide.elements.filter(e => e.id !== elementId) });
    setSelectedElementId(null);
  }, [currentSlide, currentSlideIndex, updateSlide]);

  const moveSlide = useCallback((from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= slides.length) return;
    setSlides(prev => {
      const arr = [...prev];
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return arr;
    });
    setCurrentSlideIndex(to);
  }, [slides.length]);

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'All') return slideTemplates;
    return slideTemplates.filter(t => t.category === templateFilter);
  }, [templateFilter]);

  // Presenter mode
  if (isPresenting && currentSlide) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
        onClick={() => {
          if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(i => i + 1);
          else setIsPresenting(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsPresenting(false);
          if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1));
          if (e.key === 'ArrowLeft') setCurrentSlideIndex(i => Math.max(0, i - 1));
        }}
        tabIndex={0}
        autoFocus
      >
        <div
          className="w-full h-full relative"
          style={{ background: currentSlide.background }}
        >
          {currentSlide.elements.filter(e => e.visible).map(el => (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: `${el.x}%`, top: `${el.y}%`,
                width: `${el.width}%`, height: `${el.height}%`,
                transform: `rotate(${el.rotation}deg)`,
                fontSize: el.style.fontSize ? `${el.style.fontSize * 1.5}px` : undefined,
                fontWeight: el.style.fontWeight,
                fontFamily: el.style.fontFamily,
                color: el.style.color,
                backgroundColor: el.style.backgroundColor,
                borderRadius: el.style.borderRadius,
                textAlign: el.style.textAlign,
                opacity: el.style.opacity,
                padding: el.style.padding,
                whiteSpace: 'pre-wrap',
              }}
            >
              {el.content}
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur rounded-full px-4 py-2">
          <span className="text-xs text-white/60">{currentSlideIndex + 1} / {slides.length}</span>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsPresenting(false); }} className="w-7 h-7 text-white/80 hover:text-white">
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Top Toolbar ─── */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-2 gap-1 shrink-0">
        {/* Add elements */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => addElement('text')} className="w-8 h-8">
                <Type className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Text</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => addElement('shape')} className="w-8 h-8">
                <Square className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Shape</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => addElement('image')} className="w-8 h-8">
                <Image className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Image</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => addElement('code')} className="w-8 h-8">
                <Code2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Code Block</TooltipContent>
          </Tooltip>
        </div>

        {/* Text formatting (shown when text element selected) */}
        {selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'code') && (
          <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
            <Button
              variant="ghost" size="icon"
              onClick={() => updateElementStyle(selectedElement.id, { fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={cn('w-8 h-8', selectedElement.style.fontWeight === 'bold' && 'bg-primary/20 text-primary')}
            >
              <Bold className="w-4 h-4" />
            </Button>
            {(['left', 'center', 'right'] as const).map(align => (
              <Button
                key={align}
                variant="ghost" size="icon"
                onClick={() => updateElementStyle(selectedElement.id, { textAlign: align })}
                className={cn('w-8 h-8', selectedElement.style.textAlign === align && 'bg-primary/20 text-primary')}
              >
                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                {align === 'right' && <AlignRight className="w-4 h-4" />}
              </Button>
            ))}
            <Select
              value={String(selectedElement.style.fontSize || 24)}
              onValueChange={v => updateElementStyle(selectedElement.id, { fontSize: parseInt(v) })}
            >
              <SelectTrigger className="w-16 h-7 text-xs bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72].map(s => (
                  <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1" />

        {/* Zoom */}
        <div className="flex items-center gap-1 border-r border-border/30 pr-2 mr-1">
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(30, z - 10))} className="w-7 h-7">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] text-muted-foreground w-8 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(150, z + 10))} className="w-7 h-7">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Slide nav */}
        <div className="flex items-center gap-1 border-r border-border/30 pr-2 mr-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))} className="w-7 h-7" disabled={currentSlideIndex === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1))} className="w-7 h-7" disabled={currentSlideIndex >= slides.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Present */}
        <Button variant="default" size="sm" onClick={() => setIsPresenting(true)} className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90">
          <Play className="w-3.5 h-3.5" />
          Present
        </Button>

        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Panel (thumbnails) */}
        <div className="w-48 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          <div className="px-2 py-2 border-b border-border/20 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Slides</span>
            <Button variant="ghost" size="icon" onClick={() => addSlide()} className="w-6 h-6">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={cn(
                    'group relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden',
                    i === currentSlideIndex
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-border/30 hover:border-border/60'
                  )}
                  onClick={() => setCurrentSlideIndex(i)}
                >
                  {/* Thumbnail */}
                  <div
                    className="aspect-video rounded-md overflow-hidden relative"
                    style={{ background: slide.background }}
                  >
                    {slide.elements.filter(e => e.visible).map(el => (
                      <div
                        key={el.id}
                        className="absolute overflow-hidden"
                        style={{
                          left: `${el.x}%`, top: `${el.y}%`,
                          width: `${el.width}%`, height: `${el.height}%`,
                          fontSize: `${(el.style.fontSize || 16) * 0.15}px`,
                          fontWeight: el.style.fontWeight,
                          color: el.style.color,
                          backgroundColor: el.style.backgroundColor,
                          borderRadius: el.style.borderRadius ? el.style.borderRadius * 0.3 : undefined,
                          textAlign: el.style.textAlign,
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}
                      >
                        {el.content.slice(0, 30)}
                      </div>
                    ))}
                  </div>

                  {/* Slide number + actions */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-between px-1.5 py-0.5">
                    <span className="text-[9px] text-white/70">{i + 1}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="text-white/60 hover:text-white">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} className="text-white/60 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add from template */}
              <div className="pt-2 border-t border-border/20">
                <p className="text-[9px] text-muted-foreground uppercase font-semibold mb-1.5 px-1">Templates</p>
                <div className="space-y-1">
                  {slideTemplates.slice(0, 4).map(t => (
                    <button
                      key={t.id}
                      onClick={() => addSlide(t)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/30 transition-colors"
                    >
                      <span>{t.preview}</span>
                      <span className="text-foreground/80">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-black/20 overflow-auto p-8">
          {currentSlide && (
            <div
              className="relative shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: `${16 * zoom * 0.5}px`,
                aspectRatio: '16/9',
                background: currentSlide.background,
              }}
              onClick={() => setSelectedElementId(null)}
            >
              {currentSlide.elements.filter(e => e.visible).map(el => (
                <div
                  key={el.id}
                  className={cn(
                    'absolute cursor-pointer transition-shadow',
                    selectedElementId === el.id && 'ring-2 ring-primary ring-offset-1 ring-offset-transparent'
                  )}
                  style={{
                    left: `${el.x}%`, top: `${el.y}%`,
                    width: `${el.width}%`, height: `${el.height}%`,
                    transform: `rotate(${el.rotation}deg)`,
                    fontSize: el.style.fontSize,
                    fontWeight: el.style.fontWeight,
                    fontFamily: el.style.fontFamily,
                    color: el.style.color,
                    backgroundColor: el.style.backgroundColor,
                    borderRadius: el.style.borderRadius,
                    textAlign: el.style.textAlign,
                    opacity: el.style.opacity,
                    padding: el.style.padding,
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                >
                  {el.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-72 bg-background/60 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
          <Tabs value={rightPanel} onValueChange={v => setRightPanel(v as any)} className="flex flex-col h-full">
            <TabsList className="w-full bg-transparent border-b border-border/30 rounded-none h-9 p-0">
              <TabsTrigger value="design" className="flex-1 text-xs h-full rounded-none data-[state=active]:bg-primary/10">Design</TabsTrigger>
              <TabsTrigger value="elements" className="flex-1 text-xs h-full rounded-none data-[state=active]:bg-primary/10">Element</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 text-xs h-full rounded-none data-[state=active]:bg-primary/10">
                <Sparkles className="w-3 h-3 mr-1" />AI
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="design" className="m-0 p-3 space-y-4">
                {/* Background */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Background</label>
                  <Input
                    value={currentSlide?.background || ''}
                    onChange={e => currentSlide && updateSlide(currentSlideIndex, { background: e.target.value })}
                    className="h-7 text-xs mt-1 bg-muted/30 border-border/30"
                    placeholder="CSS background value"
                  />
                  <div className="grid grid-cols-4 gap-1 mt-2">
                    {[
                      'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                      'linear-gradient(135deg, #1a1a2e, #16213e)',
                      'linear-gradient(135deg, #141e30, #243b55)',
                      'linear-gradient(135deg, #667eea, #764ba2)',
                      '#0d1117',
                      '#1a1a1a',
                      '#ffffff',
                      'linear-gradient(135deg, #f093fb, #f5576c)',
                    ].map((bg, i) => (
                      <button
                        key={i}
                        onClick={() => currentSlide && updateSlide(currentSlideIndex, { background: bg })}
                        className="w-full aspect-video rounded border border-border/30 hover:ring-2 hover:ring-primary transition-all"
                        style={{ background: bg }}
                      />
                    ))}
                  </div>
                </div>

                {/* Transition */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Transition</label>
                  <Select
                    value={currentSlide?.transition || 'fade'}
                    onValueChange={v => currentSlide && updateSlide(currentSlideIndex, { transition: v as any })}
                  >
                    <SelectTrigger className="h-7 text-xs mt-1 bg-muted/30 border-border/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Speaker Notes */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Speaker Notes</label>
                  <Textarea
                    value={currentSlide?.notes || ''}
                    onChange={e => currentSlide && updateSlide(currentSlideIndex, { notes: e.target.value })}
                    className="mt-1 text-xs bg-muted/30 border-border/30 min-h-[60px]"
                    placeholder="Add speaker notes..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="elements" className="m-0 p-3 space-y-4">
                {selectedElement ? (
                  <>
                    {/* Type & content */}
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {selectedElement.type} Element
                      </label>
                      <Textarea
                        value={selectedElement.content}
                        onChange={e => updateElement(selectedElement.id, { content: e.target.value })}
                        className="mt-1 text-xs bg-muted/30 border-border/30 min-h-[60px]"
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Position (%)</label>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {[
                          { label: 'X', key: 'x' as const },
                          { label: 'Y', key: 'y' as const },
                          { label: 'W', key: 'width' as const },
                          { label: 'H', key: 'height' as const },
                        ].map(({ label, key }) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground w-3">{label}</span>
                            <Input
                              type="number"
                              value={selectedElement[key]}
                              onChange={e => updateElement(selectedElement.id, { [key]: parseFloat(e.target.value) || 0 })}
                              className="h-6 text-[11px] bg-muted/30 border-border/30 px-1.5"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Style */}
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={selectedElement.style.color || '#ffffff'}
                          onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })}
                          className="w-8 h-7 rounded border-0 cursor-pointer"
                        />
                        <Input
                          value={selectedElement.style.color || '#ffffff'}
                          onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })}
                          className="h-7 text-xs bg-muted/30 border-border/30 flex-1"
                        />
                      </div>
                    </div>

                    {selectedElement.style.backgroundColor !== undefined && (
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Background</label>
                        <Input
                          value={selectedElement.style.backgroundColor || ''}
                          onChange={e => updateElementStyle(selectedElement.id, { backgroundColor: e.target.value })}
                          className="h-7 text-xs mt-1 bg-muted/30 border-border/30"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Opacity: {((selectedElement.style.opacity ?? 1) * 100).toFixed(0)}%
                      </label>
                      <Slider
                        value={[selectedElement.style.opacity ?? 1]}
                        onValueChange={([v]) => updateElementStyle(selectedElement.id, { opacity: v })}
                        min={0} max={1} step={0.05} className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Rotation: {selectedElement.rotation}°
                      </label>
                      <Slider
                        value={[selectedElement.rotation]}
                        onValueChange={([v]) => updateElement(selectedElement.id, { rotation: v })}
                        min={-180} max={180} step={1} className="mt-1"
                      />
                    </div>

                    <Button
                      variant="outline" size="sm"
                      onClick={() => deleteElement(selectedElement.id)}
                      className="w-full h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete Element
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MousePointer className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Click an element on the slide to edit</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai" className="m-0 p-3 space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">AI Slide Generator</label>
                  <Textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Describe what slides you want to generate...&#10;&#10;E.g.: 'Create a 5-slide pitch deck about our AI startup with market analysis, team, and financials'"
                    className="mt-1 text-xs bg-muted/30 border-border/30 min-h-[100px]"
                  />
                  <Button variant="default" size="sm" className="w-full h-8 text-xs mt-2 gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Slides
                  </Button>
                </div>

                <div className="border-t border-border/20 pt-3">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Quick Actions</label>
                  <div className="space-y-1.5 mt-2">
                    {[
                      { icon: Wand2, label: 'Improve current slide', desc: 'AI enhances layout and content' },
                      { icon: Palette, label: 'Redesign theme', desc: 'Generate new color scheme' },
                      { icon: FileText, label: 'Generate from document', desc: 'Convert a doc to slides' },
                      { icon: List, label: 'Add bullet points', desc: 'Auto-generate key points' },
                      { icon: Image, label: 'Suggest images', desc: 'AI image recommendations' },
                    ].map((action, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                      >
                        <action.icon className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{action.label}</p>
                          <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
