// NLE-Grade Video Editor — canvas timeline, keyframes, preview, inspector
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipBack, SkipForward, Square,
  Scissors, Copy, Trash2, Plus, Type, Image as ImageIcon, Music,
  Upload, Download, Wand2, Sparkles, Loader2,
  ZoomIn, ZoomOut, Eye, Diamond, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VideoTimelineCanvas, type TimelineClip, type TimelineTrack } from './video/VideoTimelineCanvas';
import { VideoPreviewCanvas } from './video/VideoPreviewCanvas';
import { VideoInspector } from './video/VideoInspector';
import { VideoKeyframeEngine } from './video/VideoKeyframeEngine';

type BottomPanel = 'timeline' | 'keyframes';

export function VideoEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(120);
  const [zoom, setZoom] = useState(1);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('timeline');

  const [tracks, setTracks] = useState<TimelineTrack[]>([
    { id: 'v1', name: 'Video 1', type: 'video', locked: false, visible: true, height: 40 },
    { id: 'v2', name: 'Video 2', type: 'video', locked: false, visible: true, height: 40 },
    { id: 'a1', name: 'Audio', type: 'audio', locked: false, visible: true, height: 32 },
    { id: 't1', name: 'Text', type: 'text', locked: false, visible: true, height: 28 },
    { id: 'e1', name: 'Effects', type: 'effects', locked: false, visible: true, height: 28 },
  ]);

  const [clips, setClips] = useState<TimelineClip[]>([
    { id: 'c1', name: 'Intro.mp4', type: 'video', startTime: 0, duration: 15, track: 0, color: 'hsl(193, 100%, 50%)' },
    { id: 'c2', name: 'Main.mp4', type: 'video', startTime: 15, duration: 45, track: 0, color: 'hsl(193, 100%, 50%)' },
    { id: 'c3', name: 'B-Roll.mp4', type: 'video', startTime: 20, duration: 25, track: 1, color: 'hsl(270, 100%, 70%)' },
    { id: 'c4', name: 'Outro.mp4', type: 'video', startTime: 60, duration: 20, track: 0, color: 'hsl(193, 100%, 50%)' },
    { id: 'c5', name: 'BGM.mp3', type: 'audio', startTime: 0, duration: 80, track: 2, color: 'hsl(150, 100%, 60%)' },
    { id: 'c6', name: 'Title Card', type: 'text', startTime: 0, duration: 5, track: 3, color: 'hsl(30, 100%, 65%)' },
    { id: 'c7', name: 'Color Grade', type: 'effect', startTime: 0, duration: 80, track: 4, color: 'hsl(300, 100%, 75%)' },
  ]);

  const TRACK_LABEL_WIDTH = 90;

  const formatTC = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const f = Math.floor((s % 1) * 30);
    return `${m}:${sec.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  const handleClipMove = useCallback((id: string, startTime: number, track: number) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, startTime, track } : c));
  }, []);

  const handleClipResize = useCallback((id: string, startTime: number, dur: number) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, startTime, duration: dur } : c));
  }, []);

  const processWithAI = async (prompt?: string) => {
    const p = prompt || aiPrompt;
    if (!p.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('gemini-agents', {
        body: { action: 'video_edit', prompt: p }
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

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/30 bg-background/70 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="w-7 h-7"><Scissors className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Copy className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Trash2 className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7"><Type className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><ImageIcon className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Music className="w-3.5 h-3.5" /></Button>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentTime(0)}>
            <SkipBack className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={cn('w-9 h-9 rounded-full', isPlaying && 'bg-primary/20 text-primary')}
            onClick={() => setIsPlaying(v => !v)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setIsPlaying(false); setCurrentTime(0); }}>
            <Square className="w-3 h-3" />
          </Button>
          <div className="bg-muted/30 rounded px-2 py-0.5 border border-border/20 font-mono">
            <span className="text-xs text-primary font-semibold">{formatTC(currentTime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setZoom(z => Math.max(0.5, z - 0.5))}>
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-[9px] font-mono text-muted-foreground w-7 text-center">{zoom}x</span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setZoom(z => Math.min(6, z + 0.5))}>
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <input ref={fileInputRef} type="file" accept="video/*,audio/*,image/*" className="hidden" />
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> Import
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Main area: Preview + Inspector */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <VideoPreviewCanvas
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          previewSize={previewSize}
          onPreviewSizeChange={setPreviewSize}
          className="flex-1"
        />
        <VideoInspector
          selectedClip={selectedClip}
          onAiAction={(prompt) => processWithAI(prompt)}
          className="w-52 shrink-0 border-l border-border/20"
        />
      </div>

      {/* Bottom panel tabs */}
      <div className="flex items-center border-t border-border/30 bg-background/70 px-2 shrink-0">
        {([
          { id: 'timeline' as const, label: 'Timeline', icon: <Layers className="w-3 h-3" /> },
          { id: 'keyframes' as const, label: 'Keyframes', icon: <Diamond className="w-3 h-3" /> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setBottomPanel(tab.id)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-[10px] transition-colors border-b',
              bottomPanel === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Scrub slider */}
        <Slider
          value={[currentTime]} min={0} max={duration}
          className="w-48 mx-2"
          onValueChange={([v]) => setCurrentTime(v)}
        />
        <span className="text-[9px] font-mono text-muted-foreground">{formatTC(duration)}</span>
      </div>

      {/* Timeline / Keyframes panel */}
      <div className="h-[220px] shrink-0 flex border-t border-border/20">
        {bottomPanel === 'timeline' ? (
          <div className="flex-1 flex">
            {/* Track labels */}
            <div className="shrink-0 border-r border-border/20 flex flex-col" style={{ width: TRACK_LABEL_WIDTH }}>
              {tracks.map(track => (
                <div
                  key={track.id}
                  className="flex items-center px-2 gap-1 border-b border-border/10"
                  style={{ height: track.height }}
                >
                  <span className="text-[9px] text-muted-foreground truncate flex-1">{track.name}</span>
                  <Button variant="ghost" size="icon" className="w-4 h-4 shrink-0">
                    <Eye className="w-2.5 h-2.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Canvas timeline */}
            <VideoTimelineCanvas
              tracks={tracks}
              clips={clips}
              currentTime={currentTime}
              duration={duration}
              zoom={zoom}
              selectedClipId={selectedClipId}
              trackLabelWidth={0}
              onSeek={setCurrentTime}
              onClipSelect={setSelectedClipId}
              onClipMove={handleClipMove}
              onClipResize={handleClipResize}
              className="flex-1"
            />
          </div>
        ) : (
          <VideoKeyframeEngine
            currentTime={currentTime}
            duration={duration}
            clipName={selectedClip?.name || 'No clip selected'}
            className="flex-1"
          />
        )}
      </div>

      {/* AI bar */}
      <div className="border-t border-border/30 bg-background/60 backdrop-blur-sm p-2 shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <Input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="AI: 'Auto-edit highlights', 'Add subtitles', 'Generate intro', 'Smart reframe for 9:16'..."
            className="text-xs bg-muted/20 border-border/30"
            onKeyDown={e => e.key === 'Enter' && processWithAI()}
          />
          <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => processWithAI()} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
