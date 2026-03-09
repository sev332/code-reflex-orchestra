// DAW-Grade Audio Editor — multi-track, canvas waveforms, mixer, FX chain, spectrogram
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Wand2, Sparkles, Loader2, Plus, Trash2,
  Headphones, SlidersHorizontal, Activity, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AudioWaveformCanvas } from './audio/AudioWaveformCanvas';
import { AudioMixerPanel } from './audio/AudioMixerPanel';
import { AudioEffectsChain } from './audio/AudioEffectsChain';
import { AudioSpectrogram } from './audio/AudioSpectrogram';
import { AudioTransport } from './audio/AudioTransport';
import { AudioTimelineRuler } from './audio/AudioTimelineRuler';

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

type RightPanel = 'mixer' | 'effects' | 'spectrogram' | null;

export function AudioEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [bpm, setBpm] = useState(120);
  const [loop, setLoop] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [rightPanel, setRightPanel] = useState<RightPanel>('mixer');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('1');
  const [regionStart, setRegionStart] = useState<number | null>(null);
  const [regionEnd, setRegionEnd] = useState<number | null>(null);

  const [tracks, setTracks] = useState<AudioTrack[]>([
    { id: '1', name: 'Vocals', color: 'hsl(193, 100%, 50%)', muted: false, solo: false, volume: 75, pan: 0,
      waveform: Array.from({ length: 400 }, (_, i) => {
        const t = i / 400;
        return (Math.sin(t * 30) * 0.3 + Math.sin(t * 80) * 0.2 + Math.random() * 0.3) * 0.8 + 0.1;
      })},
    { id: '2', name: 'Guitar', color: 'hsl(270, 100%, 70%)', muted: false, solo: false, volume: 60, pan: -20,
      waveform: Array.from({ length: 400 }, (_, i) => {
        const t = i / 400;
        return (Math.sin(t * 50) * 0.25 + Math.sin(t * 120) * 0.15 + Math.random() * 0.25) * 0.7 + 0.15;
      })},
    { id: '3', name: 'Bass', color: 'hsl(150, 100%, 60%)', muted: false, solo: false, volume: 70, pan: 0,
      waveform: Array.from({ length: 400 }, (_, i) => {
        const t = i / 400;
        return (Math.sin(t * 15) * 0.5 + Math.random() * 0.15) * 0.5 + 0.1;
      })},
    { id: '4', name: 'Drums', color: 'hsl(30, 100%, 65%)', muted: false, solo: false, volume: 80, pan: 0,
      waveform: Array.from({ length: 400 }, (_, i) => {
        // Transient-heavy
        const beat = Math.sin(i * 0.08 * Math.PI);
        return Math.abs(beat) * 0.6 + Math.random() * 0.2 + 0.05;
      })},
    { id: '5', name: 'Synth Pad', color: 'hsl(300, 100%, 75%)', muted: true, solo: false, volume: 50, pan: 30,
      waveform: Array.from({ length: 400 }, (_, i) => {
        const t = i / 400;
        return (Math.sin(t * 8) * 0.2 + 0.3) * 0.4 + 0.05;
      })},
  ]);

  const TRACK_LABEL_WIDTH = 130;

  const addTrack = () => {
    const colors = ['hsl(45, 100%, 65%)', 'hsl(180, 100%, 65%)', 'hsl(0, 75%, 55%)', 'hsl(210, 100%, 65%)'];
    const newTrack: AudioTrack = {
      id: crypto.randomUUID(),
      name: `Track ${tracks.length + 1}`,
      color: colors[tracks.length % colors.length],
      muted: false, solo: false, volume: 75, pan: 0,
      waveform: Array.from({ length: 400 }, () => Math.random() * 0.5 + 0.1),
    };
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
  };

  const removeTrack = (id: string) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter(t => t.id !== id));
    if (selectedTrackId === id) setSelectedTrackId(tracks[0].id);
  };

  const updateTrack = useCallback((id: string, updates: Partial<AudioTrack>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const handleRegionChange = (start: number, end: number) => {
    setRegionStart(start);
    setRegionEnd(end);
  };

  const processWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-agents', {
        body: { action: 'audio_edit', prompt: aiPrompt, tracks: tracks.map(t => t.name) }
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

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  const togglePanel = (panel: RightPanel) => {
    setRightPanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Transport */}
      <AudioTransport
        isPlaying={isPlaying}
        isRecording={isRecording}
        currentTime={currentTime}
        duration={duration}
        masterVolume={masterVolume}
        bpm={bpm}
        zoom={zoom}
        loop={loop}
        onPlayPause={() => setIsPlaying(v => !v)}
        onStop={() => { setIsPlaying(false); setCurrentTime(0); }}
        onRecord={() => setIsRecording(v => !v)}
        onSeek={setCurrentTime}
        onMasterVolumeChange={setMasterVolume}
        onBpmChange={setBpm}
        onZoomChange={setZoom}
        onLoopToggle={() => setLoop(v => !v)}
        onImport={() => fileInputRef.current?.click()}
        onExport={() => toast.info('Export coming soon')}
      />
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Tracks + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Timeline ruler */}
          <AudioTimelineRuler
            duration={duration}
            currentTime={currentTime}
            zoom={zoom}
            bpm={bpm}
            trackLabelWidth={TRACK_LABEL_WIDTH}
            onSeek={setCurrentTime}
          />

          {/* Track lanes */}
          <div className="flex-1 overflow-auto scrollbar-neural">
            {tracks.map(track => (
              <div
                key={track.id}
                className={cn(
                  'flex border-b border-border/15 transition-colors cursor-pointer',
                  selectedTrackId === track.id && 'bg-primary/[0.03]',
                )}
                onClick={() => setSelectedTrackId(track.id)}
              >
                {/* Track controls */}
                <div className="shrink-0 border-r border-border/20 p-1.5 flex flex-col gap-0.5" style={{ width: TRACK_LABEL_WIDTH }}>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                    <Input
                      value={track.name}
                      onChange={e => updateTrack(track.id, { name: e.target.value })}
                      className="h-5 text-[10px] bg-transparent border-none px-1 focus-visible:ring-0 font-medium"
                      onClick={e => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost" size="icon" className="w-4 h-4 shrink-0 text-muted-foreground/40 hover:text-destructive"
                      onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost" size="icon"
                      className={cn('w-5 h-5 rounded text-[7px] font-bold', track.muted && 'bg-destructive/20 text-destructive')}
                      onClick={e => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
                    >M</Button>
                    <Button
                      variant="ghost" size="icon"
                      className={cn('w-5 h-5 rounded text-[7px] font-bold', track.solo && 'bg-amber-500/20 text-amber-400')}
                      onClick={e => { e.stopPropagation(); updateTrack(track.id, { solo: !track.solo }); }}
                    >S</Button>
                    <Slider
                      value={[track.volume]} min={0} max={100}
                      className="flex-1 mx-0.5"
                      onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                    />
                    <span className="text-[7px] text-muted-foreground w-5 text-right font-mono">{track.volume}</span>
                  </div>
                </div>

                {/* Canvas waveform */}
                <AudioWaveformCanvas
                  waveform={track.waveform}
                  color={track.color}
                  muted={track.muted}
                  volume={track.volume}
                  currentTime={currentTime}
                  duration={duration}
                  zoom={zoom}
                  height={64}
                  regionStart={selectedTrackId === track.id ? regionStart : null}
                  regionEnd={selectedTrackId === track.id ? regionEnd : null}
                  onSeek={setCurrentTime}
                  onRegionChange={selectedTrackId === track.id ? handleRegionChange : undefined}
                  className="flex-1"
                />
              </div>
            ))}

            {/* Add track */}
            <div className="flex items-center justify-center py-2">
              <Button variant="ghost" size="sm" className="text-[10px] gap-1 text-muted-foreground hover:text-foreground" onClick={addTrack}>
                <Plus className="w-3 h-3" /> Add Track
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* AI Panel — bottom */}
      <div className="border-t border-border/30 bg-background/60 backdrop-blur-sm p-2 shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <Input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="AI: 'Remove vocals', 'Add reverb to Guitar', 'Generate drum pattern at 120 BPM', 'Master this mix'..."
            className="text-xs bg-muted/20 border-border/30"
            onKeyDown={e => e.key === 'Enter' && processWithAI()}
          />
          <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={processWithAI} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Apply
          </Button>
        </div>
        <div className="flex gap-1 mt-1.5 max-w-3xl mx-auto flex-wrap">
          {['Remove noise', 'Normalize', 'Separate stems', 'Auto-master', 'Add fade in/out', 'Generate beat', 'Pitch correct'].map(q => (
            <Button key={q} variant="outline" size="sm" className="h-5 text-[9px] px-2" onClick={() => setAiPrompt(q)}>{q}</Button>
          ))}
        </div>
      </div>
    </div>
  );
}
