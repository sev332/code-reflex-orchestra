// AI-Powered Audio Editor with multi-track waveform visualization
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Music, Upload, Download, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Scissors, Copy, Trash2, Plus, Minus,
  Wand2, Sparkles, Mic, Radio, Headphones, Loader2,
  ZoomIn, ZoomOut, Repeat, Shuffle, MoreVertical, Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AudioTrack {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  waveform: number[];
}

export function AudioEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 min demo
  const [zoom, setZoom] = useState(1);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);

  const [tracks, setTracks] = useState<AudioTrack[]>([
    { id: '1', name: 'Vocals', color: 'hsl(var(--primary))', muted: false, solo: false, volume: 75, pan: 0,
      waveform: Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.1) },
    { id: '2', name: 'Instruments', color: 'hsl(var(--wisdom-neural))', muted: false, solo: false, volume: 60, pan: -20,
      waveform: Array.from({ length: 200 }, () => Math.random() * 0.6 + 0.2) },
    { id: '3', name: 'Bass', color: 'hsl(var(--wisdom-data-flow))', muted: false, solo: false, volume: 70, pan: 0,
      waveform: Array.from({ length: 200 }, () => Math.random() * 0.4 + 0.1) },
    { id: '4', name: 'Effects', color: 'hsl(var(--wisdom-warning))', muted: true, solo: false, volume: 50, pan: 30,
      waveform: Array.from({ length: 200 }, () => Math.random() * 0.3) },
  ]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const addTrack = () => {
    const colors = ['hsl(var(--wisdom-memory))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];
    setTracks(prev => [...prev, {
      id: crypto.randomUUID(),
      name: `Track ${prev.length + 1}`,
      color: colors[prev.length % colors.length],
      muted: false, solo: false, volume: 75, pan: 0,
      waveform: Array.from({ length: 200 }, () => Math.random() * 0.5 + 0.1)
    }]);
  };

  const processWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-agents', {
        body: { action: 'audio_edit', prompt: aiPrompt }
      });
      if (error) throw error;
      toast.success('AI audio processing applied');
    } catch {
      toast.error('AI processing failed');
    } finally {
      setIsProcessing(false);
      setAiPrompt('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Transport Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8"><SkipBack className="w-4 h-4" /></Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("w-10 h-10 rounded-full", isPlaying && "bg-primary/20 text-primary")}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8"><SkipForward className="w-4 h-4" /></Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="text-primary">{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-7 h-7"><Repeat className="w-3.5 h-3.5" /></Button>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            <Slider value={[masterVolume]} min={0} max={100} className="w-20" onValueChange={([v]) => setMasterVolume(v)} />
          </div>
          <div className="w-px h-5 bg-border/30" />
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setZoom(z => Math.min(z + 0.5, 4))}><ZoomIn className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}><ZoomOut className="w-3.5 h-3.5" /></Button>
        </div>

        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" />
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> Import
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Timeline ruler */}
      <div className="h-6 border-b border-border/30 bg-muted/10 flex items-end px-[140px] shrink-0 overflow-hidden">
        {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
          <div key={i} className="flex-shrink-0" style={{ width: `${(10 / duration) * 100 * zoom}%` }}>
            <span className="text-[9px] text-muted-foreground font-mono">{formatTime(i * 10)}</span>
          </div>
        ))}
      </div>

      {/* Tracks area */}
      <div className="flex-1 overflow-auto">
        {tracks.map(track => (
          <div key={track.id} className="flex border-b border-border/20 hover:bg-muted/5 transition-colors">
            {/* Track controls */}
            <div className="w-[140px] shrink-0 border-r border-border/30 p-2 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: track.color }} />
                <Input
                  value={track.name}
                  onChange={(e) => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, name: e.target.value } : t))}
                  className="h-5 text-[10px] bg-transparent border-none px-1 focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost" size="icon" className={cn("w-5 h-5 rounded text-[8px]", track.muted && "bg-destructive/20 text-destructive")}
                  onClick={() => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, muted: !t.muted } : t))}
                >M</Button>
                <Button
                  variant="ghost" size="icon" className={cn("w-5 h-5 rounded text-[8px]", track.solo && "bg-amber-500/20 text-amber-400")}
                  onClick={() => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, solo: !t.solo } : t))}
                >S</Button>
                <Slider
                  value={[track.volume]} min={0} max={100}
                  className="flex-1 mx-1"
                  onValueChange={([v]) => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, volume: v } : t))}
                />
                <span className="text-[8px] text-muted-foreground w-6 text-right">{track.volume}</span>
              </div>
            </div>

            {/* Waveform */}
            <div className="flex-1 relative h-16 overflow-hidden">
              <svg className="w-full h-full" preserveAspectRatio="none" style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left' }}>
                {/* Waveform bars */}
                {track.waveform.map((v, i) => {
                  const x = (i / track.waveform.length) * 100;
                  const h = v * 100;
                  return (
                    <rect
                      key={i}
                      x={`${x}%`}
                      y={`${50 - h / 2}%`}
                      width={`${100 / track.waveform.length * 0.8}%`}
                      height={`${h}%`}
                      fill={track.muted ? 'hsl(var(--muted-foreground))' : track.color}
                      opacity={track.muted ? 0.15 : 0.6}
                      rx="1"
                    />
                  );
                })}
              </svg>

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
                style={{ left: `${(currentTime / duration) * 100 * zoom}%` }}
              />
            </div>
          </div>
        ))}

        {/* Add track */}
        <div className="flex items-center justify-center py-3">
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={addTrack}>
            <Plus className="w-3 h-3" /> Add Track
          </Button>
        </div>
      </div>

      {/* AI Panel — bottom */}
      <div className="border-t border-border/30 bg-background/50 backdrop-blur-sm p-3 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <Input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="AI: 'Remove vocals', 'Add reverb to Track 2', 'Generate beat at 120 BPM'..."
            className="text-xs bg-muted/20 border-border/30"
            onKeyDown={e => e.key === 'Enter' && processWithAI()}
          />
          <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={processWithAI} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Apply
          </Button>
        </div>
        <div className="flex gap-1.5 mt-2 max-w-2xl mx-auto">
          {['Remove noise', 'Normalize', 'Add fade in/out', 'Separate stems', 'Auto-master'].map(q => (
            <Button key={q} variant="outline" size="sm" className="h-5 text-[9px] px-2" onClick={() => setAiPrompt(q)}>{q}</Button>
          ))}
        </div>
      </div>
    </div>
  );
}
