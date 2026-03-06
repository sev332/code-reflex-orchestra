// AI-Powered Video Editor with timeline, clips, and effects
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Video, Upload, Download, Play, Pause, SkipBack, SkipForward,
  Volume2, Scissors, Copy, Trash2, Plus, Type, Image,
  Wand2, Sparkles, Film, Monitor, Smartphone, Tablet,
  Loader2, ZoomIn, ZoomOut, Layers, Music, ChevronDown,
  Square, MoreVertical, Clock, Maximize2, Eye, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TimelineClip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image';
  startTime: number;
  duration: number;
  track: number;
  color: string;
  thumbnail?: string;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effects';
  locked: boolean;
  visible: boolean;
}

export function VideoEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(120);
  const [zoom, setZoom] = useState(1);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const [tracks] = useState<TimelineTrack[]>([
    { id: 'v1', name: 'Video 1', type: 'video', locked: false, visible: true },
    { id: 'v2', name: 'Video 2', type: 'video', locked: false, visible: true },
    { id: 'a1', name: 'Audio', type: 'audio', locked: false, visible: true },
    { id: 't1', name: 'Text', type: 'text', locked: false, visible: true },
    { id: 'e1', name: 'Effects', type: 'effects', locked: false, visible: true },
  ]);

  const [clips] = useState<TimelineClip[]>([
    { id: 'c1', name: 'Intro.mp4', type: 'video', startTime: 0, duration: 15, track: 0, color: 'hsl(var(--primary))' },
    { id: 'c2', name: 'Main.mp4', type: 'video', startTime: 15, duration: 45, track: 0, color: 'hsl(var(--primary))' },
    { id: 'c3', name: 'B-Roll.mp4', type: 'video', startTime: 20, duration: 25, track: 1, color: 'hsl(var(--wisdom-neural))' },
    { id: 'c4', name: 'Outro.mp4', type: 'video', startTime: 60, duration: 20, track: 0, color: 'hsl(var(--primary))' },
    { id: 'c5', name: 'BGM.mp3', type: 'audio', startTime: 0, duration: 80, track: 2, color: 'hsl(var(--wisdom-data-flow))' },
    { id: 'c6', name: 'Title Card', type: 'text', startTime: 0, duration: 5, track: 3, color: 'hsl(var(--wisdom-warning))' },
    { id: 'c7', name: 'Color Grade', type: 'image', startTime: 0, duration: 80, track: 4, color: 'hsl(var(--wisdom-memory))' },
  ]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const processWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-agents', {
        body: { action: 'video_edit', prompt: aiPrompt }
      });
      if (error) throw error;
      toast.success('AI video processing applied');
    } catch {
      toast.error('AI processing failed');
    } finally {
      setIsProcessing(false);
      setAiPrompt('');
    }
  };

  const previewAspectRatio = previewSize === '16:9' ? '16/9' : previewSize === '9:16' ? '9/16' : '1/1';

  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7"><Scissors className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Copy className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Trash2 className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7"><Type className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Image className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Music className="w-3.5 h-3.5" /></Button>
        </div>
        <div className="flex items-center gap-1">
          {(['16:9', '9:16', '1:1'] as const).map(size => (
            <Button
              key={size}
              variant="ghost"
              size="sm"
              className={cn('h-6 px-2 text-[10px]', previewSize === size && 'bg-primary/15 text-primary')}
              onClick={() => setPreviewSize(size)}
            >{size}</Button>
          ))}
          <div className="w-px h-4 bg-border/30 mx-1" />
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" />
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> Import
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Preview + Inspector */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center p-4 bg-[hsl(220,27%,3%)]">
          <div
            className="bg-black/80 rounded-lg border border-border/20 shadow-2xl shadow-black/50 flex items-center justify-center overflow-hidden"
            style={{ aspectRatio: previewAspectRatio, maxHeight: '100%', maxWidth: '100%', width: previewSize === '9:16' ? '40%' : '90%' }}
          >
            <div className="text-center text-muted-foreground/40">
              <Film className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs">Video Preview</p>
              <p className="text-[10px] mt-0.5">{previewSize}</p>
            </div>
          </div>
        </div>

        {/* Inspector panel */}
        <div className="w-56 border-l border-border/30 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border/20">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inspector</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {selectedClip ? (
                <>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Clip</span>
                    <p className="text-xs font-medium">{clips.find(c => c.id === selectedClip)?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-[10px] text-muted-foreground">Opacity</span><Slider value={[100]} min={0} max={100} className="mt-1" /></div>
                    <div><span className="text-[10px] text-muted-foreground">Speed</span><Slider value={[100]} min={25} max={400} className="mt-1" /></div>
                    <div><span className="text-[10px] text-muted-foreground">Volume</span><Slider value={[100]} min={0} max={200} className="mt-1" /></div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Select a clip to inspect</p>
              )}

              {/* AI tools */}
              <div className="pt-2 border-t border-border/20">
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">AI Tools</span>
                </div>
                <div className="space-y-1">
                  {['Auto-cut highlights', 'Generate captions', 'Color match', 'Remove background', 'AI transition'].map(action => (
                    <Button key={action} variant="outline" size="sm" className="w-full text-[10px] justify-start h-6 gap-1" onClick={() => setAiPrompt(action)}>
                      <Wand2 className="w-3 h-3" />{action}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-t border-border/30 bg-background/50 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7"><SkipBack className="w-3.5 h-3.5" /></Button>
          <Button
            variant="ghost" size="icon"
            className={cn("w-9 h-9 rounded-full", isPlaying && "bg-primary/20 text-primary")}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><SkipForward className="w-3.5 h-3.5" /></Button>
        </div>
        <span className="text-xs font-mono text-primary">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]} min={0} max={duration}
          className="flex-1"
          onValueChange={([v]) => setCurrentTime(v)}
        />
        <span className="text-xs font-mono text-muted-foreground">{formatTime(duration)}</span>
        <div className="flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          <Slider value={[80]} min={0} max={100} className="w-16" />
        </div>
      </div>

      {/* Timeline */}
      <div className="h-[200px] border-t border-border/30 bg-muted/5 flex flex-col shrink-0">
        {/* Timeline ruler */}
        <div className="h-5 border-b border-border/20 flex items-end pl-[100px] overflow-hidden shrink-0">
          {Array.from({ length: Math.ceil(duration / 5) }).map((_, i) => (
            <div key={i} className="flex-shrink-0" style={{ width: `${(5 / duration) * 100 * zoom}%` }}>
              <span className="text-[8px] text-muted-foreground font-mono">{formatTime(i * 5)}</span>
            </div>
          ))}
        </div>

        {/* Track lanes */}
        <ScrollArea className="flex-1">
          {tracks.map((track, ti) => (
            <div key={track.id} className="flex h-8 border-b border-border/10">
              {/* Track label */}
              <div className="w-[100px] shrink-0 border-r border-border/20 flex items-center px-2 gap-1">
                <span className="text-[9px] text-muted-foreground truncate">{track.name}</span>
                <Button variant="ghost" size="icon" className="w-4 h-4 ml-auto shrink-0">
                  <Eye className="w-2.5 h-2.5" />
                </Button>
              </div>

              {/* Clips on this track */}
              <div className="flex-1 relative">
                {clips.filter(c => c.track === ti).map(clip => (
                  <div
                    key={clip.id}
                    className={cn(
                      "absolute top-1 bottom-1 rounded-md border cursor-pointer transition-all hover:brightness-110",
                      selectedClip === clip.id ? 'ring-1 ring-primary border-primary/50' : 'border-transparent'
                    )}
                    style={{
                      left: `${(clip.startTime / duration) * 100 * zoom}%`,
                      width: `${(clip.duration / duration) * 100 * zoom}%`,
                      backgroundColor: clip.color.replace(')', ', 0.3)').replace('hsl(', 'hsla('),
                      borderColor: clip.color.replace(')', ', 0.5)').replace('hsl(', 'hsla('),
                    }}
                    onClick={() => setSelectedClip(clip.id)}
                  >
                    <span className="text-[8px] px-1 truncate block leading-[22px] text-foreground/80">{clip.name}</span>
                  </div>
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary shadow-[0_0_4px_hsl(var(--primary))] z-10"
                  style={{ left: `${(currentTime / duration) * 100 * zoom}%` }}
                />
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* AI bar */}
      <div className="border-t border-border/30 bg-background/50 p-2 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <Input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="AI: 'Auto-edit highlights', 'Add subtitles', 'Generate intro animation'..."
            className="text-xs bg-muted/20 border-border/30"
            onKeyDown={e => e.key === 'Enter' && processWithAI()}
          />
          <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={processWithAI} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
