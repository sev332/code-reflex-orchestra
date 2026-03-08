// Presentations — Keynote/PowerPoint-grade slide editor with 1920x1080 canvas, presenter mode, grid view
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import {
  Plus, Trash2, Copy, ChevronLeft, ChevronRight, Play, Maximize,
  Type, Image, Square, Circle, LayoutGrid, Palette, Wand2, Download,
  Settings, AlignLeft, AlignCenter, AlignRight, Bold,
  Code2, ChevronDown, Presentation, MousePointer,
  Eye, EyeOff, Sparkles, GripVertical, ZoomIn, ZoomOut, X,
  ArrowUp, ArrowDown, ArrowLeft, Layers, Lock, Unlock, Grid3x3, Minus,
  RotateCcw, ExternalLink, Monitor, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'code';
  x: number; y: number; width: number; height: number;
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
    lineHeight?: number;
    letterSpacing?: number;
    border?: string;
    shadow?: string;
  };
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  transition: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
  transitionDuration: number;
  notes: string;
  layout: string;
}

// ─── Templates ─────────────────────────────

const createEl = (overrides: Partial<SlideElement> & { id: string; type: SlideElement['type'] }): SlideElement => ({
  x: 0, y: 0, width: 100, height: 100, rotation: 0, content: '',
  style: { fontSize: 24, color: '#ffffff', textAlign: 'left', opacity: 1 },
  locked: false, visible: true, zIndex: 0,
  ...overrides,
});

interface SlideTemplate { id: string; name: string; category: string; preview: string; create: () => Slide }

const slideTemplates: SlideTemplate[] = [
  {
    id: 'title', name: 'Title Slide', category: 'Basics', preview: '📊',
    create: () => makeSlide('linear-gradient(135deg, #0f0c29, #302b63, #24243e)', 'title', [
      createEl({ id: 'title', type: 'text', x: 5, y: 28, width: 90, height: 18, content: 'Presentation Title', style: { fontSize: 64, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', lineHeight: 1.1 }, zIndex: 1 }),
      createEl({ id: 'subtitle', type: 'text', x: 15, y: 52, width: 70, height: 10, content: 'Subtitle or description goes here', style: { fontSize: 24, color: '#aaaacc', textAlign: 'center' }, zIndex: 2 }),
      createEl({ id: 'accent-line', type: 'shape', x: 35, y: 48, width: 30, height: 0.3, content: '', style: { backgroundColor: 'rgba(100,130,255,0.5)' }, zIndex: 0 }),
    ]),
  },
  {
    id: 'content', name: 'Content', category: 'Basics', preview: '📝',
    create: () => makeSlide('linear-gradient(135deg, #1a1a2e, #16213e)', 'content', [
      createEl({ id: 'h', type: 'text', x: 5, y: 5, width: 60, height: 8, content: 'Section Title', style: { fontSize: 40, fontWeight: 'bold', color: '#ffffff' }, zIndex: 1 }),
      createEl({ id: 'divider', type: 'shape', x: 5, y: 14, width: 8, height: 0.4, content: '', style: { backgroundColor: '#6366f1' }, zIndex: 0 }),
      createEl({ id: 'body', type: 'text', x: 5, y: 20, width: 52, height: 65, content: '• Key point one with supporting detail\n\n• Key point two with evidence and data\n\n• Key point three with actionable insight\n\n• Key point four with clear conclusion', style: { fontSize: 20, color: '#ccccdd', padding: 8, lineHeight: 1.6 }, zIndex: 1 }),
      createEl({ id: 'visual', type: 'shape', x: 62, y: 18, width: 33, height: 70, content: '', style: { backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 16, border: '1px solid rgba(99,102,241,0.15)' }, zIndex: 0 }),
    ]),
  },
  {
    id: 'two-col', name: 'Two Columns', category: 'Layouts', preview: '⬜⬜',
    create: () => makeSlide('linear-gradient(135deg, #0a0a1a, #1a1a3e)', 'two-col', [
      createEl({ id: 'h', type: 'text', x: 5, y: 5, width: 90, height: 8, content: 'Comparison', style: { fontSize: 40, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }, zIndex: 1 }),
      createEl({ id: 'left', type: 'text', x: 3, y: 18, width: 45, height: 72, content: 'Left Column\n\n• Point A\n• Point B\n• Point C', style: { fontSize: 18, color: '#ccccdd', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.05)' }, zIndex: 1 }),
      createEl({ id: 'right', type: 'text', x: 52, y: 18, width: 45, height: 72, content: 'Right Column\n\n• Point X\n• Point Y\n• Point Z', style: { fontSize: 18, color: '#ccccdd', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.05)' }, zIndex: 1 }),
    ]),
  },
  {
    id: 'quote', name: 'Quote', category: 'Basics', preview: '💬',
    create: () => makeSlide('linear-gradient(135deg, #141e30, #243b55)', 'quote', [
      createEl({ id: 'mark', type: 'text', x: 8, y: 18, width: 10, height: 15, content: '"', style: { fontSize: 120, color: 'rgba(99,102,241,0.3)', fontFamily: 'Georgia, serif' }, zIndex: 0 }),
      createEl({ id: 'quote', type: 'text', x: 12, y: 28, width: 76, height: 25, content: 'The only way to do great work is to love what you do.', style: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', lineHeight: 1.4 }, zIndex: 1 }),
      createEl({ id: 'author', type: 'text', x: 25, y: 58, width: 50, height: 6, content: '— Steve Jobs', style: { fontSize: 20, color: '#8888aa', textAlign: 'center' }, zIndex: 1 }),
    ]),
  },
  {
    id: 'code-slide', name: 'Code Snippet', category: 'Technical', preview: '💻',
    create: () => makeSlide('#0d1117', 'code-slide', [
      createEl({ id: 'h', type: 'text', x: 5, y: 5, width: 90, height: 7, content: 'Code Example', style: { fontSize: 32, fontWeight: 'bold', color: '#e6edf3' }, zIndex: 1 }),
      createEl({ id: 'code', type: 'code', x: 5, y: 16, width: 90, height: 74, content: 'function fibonacci(n: number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// Memoized version\nconst memo = new Map<number, number>();\nfunction fib(n: number): number {\n  if (memo.has(n)) return memo.get(n)!;\n  const result = n <= 1 ? n : fib(n - 1) + fib(n - 2);\n  memo.set(n, result);\n  return result;\n}', style: { fontSize: 18, color: '#e6edf3', backgroundColor: '#161b22', borderRadius: 12, padding: 24, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }, zIndex: 1 }),
    ]),
  },
  {
    id: 'big-number', name: 'Big Number', category: 'Data', preview: '🔢',
    create: () => makeSlide('linear-gradient(135deg, #667eea, #764ba2)', 'big-number', [
      createEl({ id: 'num', type: 'text', x: 10, y: 18, width: 80, height: 30, content: '99.9%', style: { fontSize: 120, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', lineHeight: 1 }, zIndex: 1 }),
      createEl({ id: 'label', type: 'text', x: 15, y: 55, width: 70, height: 10, content: 'Uptime across all production services', style: { fontSize: 28, color: '#ffffffcc', textAlign: 'center' }, zIndex: 1 }),
    ]),
  },
  {
    id: 'thankyou', name: 'Thank You', category: 'Basics', preview: '🎉',
    create: () => makeSlide('linear-gradient(135deg, #667eea, #764ba2)', 'thankyou', [
      createEl({ id: 'thanks', type: 'text', x: 10, y: 28, width: 80, height: 20, content: 'Thank You!', style: { fontSize: 72, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }, zIndex: 1 }),
      createEl({ id: 'contact', type: 'text', x: 20, y: 55, width: 60, height: 8, content: 'Questions? Reach out at hello@example.com', style: { fontSize: 20, color: '#ffffffcc', textAlign: 'center' }, zIndex: 1 }),
    ]),
  },
];

const makeSlide = (bg: string, layout: string, elements: SlideElement[]): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  elements,
  background: bg,
  transition: 'fade',
  transitionDuration: 300,
  notes: '',
  layout,
});

const createBlankSlide = (): Slide => makeSlide('linear-gradient(135deg, #1a1a2e, #16213e)', 'blank', []);

// ─── Scaled Slide Renderer ─────────────────
const SLIDE_W = 1920;
const SLIDE_H = 1080;

const ScaledSlide: React.FC<{
  slide: Slide;
  scale: number;
  selectedId?: string | null;
  onSelectElement?: (id: string | null) => void;
  interactive?: boolean;
}> = ({ slide, scale, selectedId, onSelectElement, interactive }) => (
  <div className="relative overflow-hidden" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
    <div
      className="absolute origin-top-left"
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        transform: `scale(${scale})`,
        background: slide.background,
      }}
    >
      {slide.elements.filter(e => e.visible).sort((a, b) => a.zIndex - b.zIndex).map(el => (
        <div
          key={el.id}
          className={cn(
            interactive && 'cursor-pointer',
            interactive && selectedId === el.id && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent'
          )}
          onClick={interactive ? (e) => { e.stopPropagation(); onSelectElement?.(el.id); } : undefined}
          style={{
            position: 'absolute',
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
            lineHeight: el.style.lineHeight,
            letterSpacing: el.style.letterSpacing,
            border: el.style.border,
            boxShadow: el.style.shadow,
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
          }}
        >
          {el.content}
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Component ────────────────────────

export function PresentationsPage() {
  const [slides, setSlides] = useState<Slide[]>([
    slideTemplates[0].create(),
    slideTemplates[1].create(),
    slideTemplates[3].create(),
    slideTemplates[4].create(),
    slideTemplates[5].create(),
    slideTemplates[6].create(),
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.45);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [rightPanel, setRightPanel] = useState<'design' | 'element' | 'ai'>('design');
  const [aiPrompt, setAiPrompt] = useState('');
  const [dragSlide, setDragSlide] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const presenterRef = useRef<HTMLDivElement>(null);
  const [presenterTimer, setPresenterTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentSlideIndex] || null;
  const selectedElement = currentSlide?.elements.find(e => e.id === selectedElementId) || null;

  // Auto-fit zoom to canvas container
  useEffect(() => {
    if (!canvasRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = (width - 80) / SLIDE_W;
        const scaleY = (height - 80) / SLIDE_H;
        setZoom(Math.min(scaleX, scaleY, 0.8));
      }
    });
    resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, [showGrid]);

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
    const newSlide = template ? template.create() : createBlankSlide();
    setSlides(prev => [...prev.slice(0, currentSlideIndex + 1), newSlide, ...prev.slice(currentSlideIndex + 1)]);
    setCurrentSlideIndex(prev => prev + 1);
  }, [currentSlideIndex]);

  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
    if (currentSlideIndex >= index && currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
  }, [slides.length, currentSlideIndex]);

  const duplicateSlide = useCallback((index: number) => {
    const slide = slides[index];
    const dup: Slide = { ...slide, id: `slide-${Date.now()}`, elements: slide.elements.map(e => ({ ...e, id: `${e.id}-${Date.now()}` })) };
    setSlides(prev => [...prev.slice(0, index + 1), dup, ...prev.slice(index + 1)]);
    setCurrentSlideIndex(index + 1);
  }, [slides]);

  const addElement = useCallback((type: SlideElement['type']) => {
    const maxZ = Math.max(0, ...(currentSlide?.elements.map(e => e.zIndex) || []));
    const newEl = createEl({
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      x: 20, y: 30,
      width: type === 'text' ? 60 : 30,
      height: type === 'text' ? 12 : 25,
      content: type === 'text' ? 'New Text' : type === 'code' ? '// code here' : '',
      style: {
        fontSize: type === 'text' ? 28 : 16,
        color: '#ffffff',
        backgroundColor: type === 'shape' ? 'rgba(99,102,241,0.15)' : type === 'code' ? '#161b22' : undefined,
        borderRadius: type === 'shape' ? 12 : type === 'code' ? 8 : 0,
        textAlign: 'left',
        opacity: 1,
        padding: type === 'code' ? 16 : type === 'text' ? 4 : 0,
        fontFamily: type === 'code' ? "'JetBrains Mono', monospace" : undefined,
      },
      zIndex: maxZ + 1,
    });
    updateSlide(currentSlideIndex, { elements: [...(currentSlide?.elements || []), newEl] });
    setSelectedElementId(newEl.id);
    setRightPanel('element');
  }, [currentSlide, currentSlideIndex, updateSlide]);

  const deleteElement = useCallback((elementId: string) => {
    if (!currentSlide) return;
    updateSlide(currentSlideIndex, { elements: currentSlide.elements.filter(e => e.id !== elementId) });
    setSelectedElementId(null);
  }, [currentSlide, currentSlideIndex, updateSlide]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isPresenting) {
        if (e.key === 'Escape') { setIsPresenting(false); if (timerRef.current) clearInterval(timerRef.current); }
        if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1));
        if (e.key === 'ArrowLeft') setCurrentSlideIndex(i => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Delete' && selectedElementId) deleteElement(selectedElementId);
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) setShowGrid(g => !g);
      if (e.key === 'F5') { e.preventDefault(); startPresenting(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPresenting, selectedElementId, slides.length]);

  const startPresenting = () => {
    setIsPresenting(true);
    setPresenterTimer(0);
    timerRef.current = setInterval(() => setPresenterTimer(t => t + 1), 1000);
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Presenter Mode ──────────────────────
  if (isPresenting && currentSlide) {
    return (
      <div
        ref={presenterRef}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
        onClick={() => { if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(i => i + 1); else setIsPresenting(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setIsPresenting(false); if (timerRef.current) clearInterval(timerRef.current); }
          if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1));
          if (e.key === 'ArrowLeft') setCurrentSlideIndex(i => Math.max(0, i - 1));
        }}
        tabIndex={0}
        autoFocus
      >
        <ScaledSlide slide={currentSlide} scale={Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H)} />

        {/* Presenter HUD */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/70 backdrop-blur-md rounded-full px-6 py-2 opacity-0 hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(i => Math.max(0, i - 1)); }} className="w-8 h-8 text-white/70"><ChevronLeft className="w-5 h-5" /></Button>
          <span className="text-sm text-white/70 font-mono min-w-[60px] text-center">{currentSlideIndex + 1} / {slides.length}</span>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1)); }} className="w-8 h-8 text-white/70"><ChevronRight className="w-5 h-5" /></Button>
          <div className="w-px h-5 bg-white/20" />
          <span className="text-xs text-white/50 font-mono"><Timer className="w-3 h-3 inline mr-1" />{formatTimer(presenterTimer)}</span>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsPresenting(false); if (timerRef.current) clearInterval(timerRef.current); }} className="w-8 h-8 text-white/70"><X className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  // ─── Grid View ───────────────────────────
  if (showGrid) {
    return (
      <div className="h-full flex flex-col bg-background/30">
        <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowGrid(false)} className="h-7 text-xs gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Editor</Button>
          <span className="text-xs font-semibold flex-1 text-center">{slides.length} Slides</span>
          <Button variant="default" size="sm" onClick={startPresenting} className="h-7 text-xs gap-1.5"><Play className="w-3.5 h-3.5" /> Present</Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-6 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className={cn(
                  'group cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg',
                  i === currentSlideIndex ? 'border-primary shadow-primary/20' : 'border-border/30 hover:border-border/60'
                )}
                onClick={() => { setCurrentSlideIndex(i); setShowGrid(false); }}
              >
                <ScaledSlide slide={slide} scale={0.14} />
                <div className="bg-background/80 px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }}><Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}><Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}
            {/* Add slide card */}
            <button onClick={() => addSlide()} className="rounded-lg border-2 border-dashed border-border/30 flex items-center justify-center aspect-video hover:border-primary/50 hover:bg-muted/10 transition-all">
              <Plus className="w-8 h-8 text-muted-foreground/30" />
            </button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ─── Editor View ─────────────────────────
  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Toolbar ─── */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-2 gap-0.5 shrink-0">
        {/* Element tools */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-1.5 mr-1">
          {([
            { type: 'text' as const, icon: Type, label: 'Text' },
            { type: 'shape' as const, icon: Square, label: 'Shape' },
            { type: 'image' as const, icon: Image, label: 'Image' },
            { type: 'code' as const, icon: Code2, label: 'Code' },
          ]).map(({ type, icon: Icon, label }) => (
            <Tooltip key={type} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => addElement(type)} className="w-8 h-8"><Icon className="w-4 h-4" /></Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Text formatting */}
        {selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'code') && (
          <div className="flex items-center gap-0.5 border-r border-border/30 pr-1.5 mr-1">
            <Button variant="ghost" size="icon"
              onClick={() => updateElementStyle(selectedElement.id, { fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={cn('w-8 h-8', selectedElement.style.fontWeight === 'bold' && 'bg-primary/20 text-primary')}>
              <Bold className="w-4 h-4" />
            </Button>
            {(['left', 'center', 'right'] as const).map(align => (
              <Button key={align} variant="ghost" size="icon"
                onClick={() => updateElementStyle(selectedElement.id, { textAlign: align })}
                className={cn('w-8 h-8', selectedElement.style.textAlign === align && 'bg-primary/20 text-primary')}>
                {align === 'left' ? <AlignLeft className="w-4 h-4" /> : align === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
              </Button>
            ))}
            <Select value={String(selectedElement.style.fontSize || 24)} onValueChange={v => updateElementStyle(selectedElement.id, { fontSize: parseInt(v) })}>
              <SelectTrigger className="w-16 h-7 text-xs bg-muted/30 border-border/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120].map(s => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1" />

        {/* View controls */}
        <Button variant="ghost" size="icon" onClick={() => setShowGrid(true)} className="w-8 h-8"><Grid3x3 className="w-4 h-4" /></Button>

        <div className="flex items-center gap-1 border-r border-border/30 pr-2 mr-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))} className="w-7 h-7" disabled={currentSlideIndex === 0}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center font-mono">{currentSlideIndex + 1} / {slides.length}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1))} className="w-7 h-7" disabled={currentSlideIndex >= slides.length - 1}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        <Button variant="default" size="sm" onClick={startPresenting} className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90">
          <Play className="w-3.5 h-3.5" /> Present
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Slide Thumbnails ─── */}
        <div className="w-44 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          <div className="px-2 py-1.5 border-b border-border/20 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Slides</span>
            <Button variant="ghost" size="icon" onClick={() => addSlide()} className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1.5">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={cn(
                    'group relative rounded-md border-2 cursor-pointer transition-all overflow-hidden',
                    i === currentSlideIndex ? 'border-primary shadow-md shadow-primary/20' : 'border-border/20 hover:border-border/50'
                  )}
                  onClick={() => { setCurrentSlideIndex(i); setSelectedElementId(null); }}
                  draggable
                  onDragStart={() => setDragSlide(i)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    if (dragSlide !== null && dragSlide !== i) {
                      setSlides(prev => {
                        const arr = [...prev];
                        const [moved] = arr.splice(dragSlide, 1);
                        arr.splice(i, 0, moved);
                        return arr;
                      });
                      setCurrentSlideIndex(i);
                    }
                    setDragSlide(null);
                  }}
                >
                  <ScaledSlide slide={slide} scale={0.085} />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between px-1.5 py-0.5">
                    <span className="text-[9px] text-white/70 font-mono">{i + 1}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); duplicateSlide(i); }}><Copy className="w-3 h-3 text-white/60 hover:text-white" /></button>
                      <button onClick={e => { e.stopPropagation(); deleteSlide(i); }}><Trash2 className="w-3 h-3 text-white/60 hover:text-red-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Template quick-add */}
            <div className="px-2 pt-2 pb-4 border-t border-border/20 mt-2">
              <p className="text-[9px] text-muted-foreground uppercase font-semibold mb-1.5 px-1 tracking-wider">Templates</p>
              <div className="space-y-0.5">
                {slideTemplates.map(t => (
                  <button key={t.id} onClick={() => addSlide(t)} className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs hover:bg-muted/30 transition-colors">
                    <span className="text-sm">{t.preview}</span>
                    <span className="text-foreground/70 text-[11px]">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* ─── Canvas ─── */}
        <div className="flex-1 flex flex-col">
          <div ref={canvasRef} className="flex-1 flex items-center justify-center bg-muted/5 overflow-auto p-8" onClick={() => setSelectedElementId(null)}>
            {currentSlide && (
              <div className="shadow-2xl rounded-lg overflow-hidden" style={{ boxShadow: '0 25px 60px -10px rgba(0,0,0,0.5)' }}>
                <ScaledSlide
                  slide={currentSlide}
                  scale={zoom}
                  selectedId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  interactive
                />
              </div>
            )}
          </div>

          {/* Notes bar */}
          {showNotes && (
            <div className="h-24 border-t border-border/30 bg-background/60 flex flex-col shrink-0">
              <div className="px-3 py-1 border-b border-border/10 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Speaker Notes</span>
                <Button variant="ghost" size="icon" onClick={() => setShowNotes(false)} className="w-5 h-5"><X className="w-3 h-3" /></Button>
              </div>
              <Textarea
                value={currentSlide?.notes || ''}
                onChange={e => currentSlide && updateSlide(currentSlideIndex, { notes: e.target.value })}
                className="flex-1 bg-transparent border-none text-xs resize-none focus-visible:ring-0 p-2"
                placeholder="Add speaker notes for this slide..."
              />
            </div>
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <div className="w-64 bg-background/60 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
          <div className="flex border-b border-border/30">
            {([
              { id: 'design' as const, label: 'Design' },
              { id: 'element' as const, label: 'Element' },
              { id: 'ai' as const, label: '✦ AI' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightPanel(tab.id)}
                className={cn('flex-1 text-xs py-2 border-b-2 transition-colors',
                  rightPanel === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {rightPanel === 'design' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Background</label>
                    <Input
                      value={currentSlide?.background || ''}
                      onChange={e => currentSlide && updateSlide(currentSlideIndex, { background: e.target.value })}
                      className="h-7 text-xs mt-1 bg-muted/30 border-border/30"
                    />
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      {[
                        'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                        'linear-gradient(135deg, #1a1a2e, #16213e)',
                        'linear-gradient(135deg, #141e30, #243b55)',
                        'linear-gradient(135deg, #667eea, #764ba2)',
                        '#0d1117', '#1a1a1a', '#ffffff',
                        'linear-gradient(135deg, #f093fb, #f5576c)',
                      ].map((bg, i) => (
                        <button key={i} onClick={() => currentSlide && updateSlide(currentSlideIndex, { background: bg })}
                          className="w-full aspect-video rounded border border-border/30 hover:ring-2 hover:ring-primary transition-all" style={{ background: bg }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Transition</label>
                    <Select value={currentSlide?.transition || 'fade'} onValueChange={v => currentSlide && updateSlide(currentSlideIndex, { transition: v as any })}>
                      <SelectTrigger className="h-7 text-xs mt-1 bg-muted/30 border-border/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['none', 'fade', 'slide', 'zoom', 'flip'].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)} className="w-full h-7 text-xs justify-start gap-1.5">
                      {showNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showNotes ? 'Hide' : 'Show'} Notes
                    </Button>
                  </div>
                </>
              )}

              {rightPanel === 'element' && (
                selectedElement ? (
                  <>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">{selectedElement.type} Content</label>
                      <Textarea value={selectedElement.content} onChange={e => updateElement(selectedElement.id, { content: e.target.value })}
                        className="mt-1 text-xs bg-muted/30 border-border/30 min-h-[60px]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Position & Size (%)</label>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {(['x', 'y', 'width', 'height'] as const).map(key => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground w-3 uppercase">{key[0]}</span>
                            <Input type="number" value={selectedElement[key]}
                              onChange={e => updateElement(selectedElement.id, { [key]: parseFloat(e.target.value) || 0 })}
                              className="h-6 text-[11px] bg-muted/30 border-border/30 px-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={selectedElement.style.color || '#ffffff'}
                          onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })}
                          className="w-8 h-7 rounded border-0 cursor-pointer" />
                        <Input value={selectedElement.style.color || '#ffffff'}
                          onChange={e => updateElementStyle(selectedElement.id, { color: e.target.value })}
                          className="h-7 text-xs bg-muted/30 border-border/30 flex-1" />
                      </div>
                    </div>
                    {selectedElement.style.backgroundColor !== undefined && (
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Fill</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={selectedElement.style.backgroundColor?.startsWith('rgba') ? '#6366f1' : selectedElement.style.backgroundColor || '#000000'}
                            onChange={e => updateElementStyle(selectedElement.id, { backgroundColor: e.target.value })}
                            className="w-8 h-7 rounded border-0 cursor-pointer" />
                          <Input value={selectedElement.style.backgroundColor || ''}
                            onChange={e => updateElementStyle(selectedElement.id, { backgroundColor: e.target.value })}
                            className="h-7 text-xs bg-muted/30 border-border/30 flex-1" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Opacity: {((selectedElement.style.opacity ?? 1) * 100).toFixed(0)}%</label>
                      <Slider value={[selectedElement.style.opacity ?? 1]} onValueChange={([v]) => updateElementStyle(selectedElement.id, { opacity: v })} min={0} max={1} step={0.05} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Rotation: {selectedElement.rotation}°</label>
                      <Slider value={[selectedElement.rotation]} onValueChange={([v]) => updateElement(selectedElement.id, { rotation: v })} min={-180} max={180} step={1} className="mt-1" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => updateElement(selectedElement.id, { zIndex: selectedElement.zIndex + 1 })}><ArrowUp className="w-3 h-3 mr-1" /> Up</Button>
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => updateElement(selectedElement.id, { zIndex: Math.max(0, selectedElement.zIndex - 1) })}><ArrowDown className="w-3 h-3 mr-1" /> Down</Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteElement(selectedElement.id)} className="w-full h-7 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MousePointer className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-xs text-muted-foreground">Select an element to edit</p>
                  </div>
                )
              )}

              {rightPanel === 'ai' && (
                <>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">AI Slide Generator</label>
                    <Textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      className="mt-1 text-xs bg-muted/30 border-border/30 min-h-[80px]"
                      placeholder="Describe the slide you want to create..." />
                    <Button variant="default" size="sm" className="w-full mt-2 h-7 text-xs gap-1"><Sparkles className="w-3 h-3" /> Generate Slide</Button>
                  </div>
                  <div className="border-t border-border/20 pt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Quick Actions</p>
                    {['Generate outline from topic', 'Improve slide content', 'Add supporting data', 'Create speaker notes'].map(action => (
                      <button key={action} className="w-full text-left text-xs py-1.5 px-2 rounded-md hover:bg-muted/30 text-foreground/70 transition-colors">{action}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
