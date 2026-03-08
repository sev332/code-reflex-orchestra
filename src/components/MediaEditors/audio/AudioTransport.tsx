// Professional transport bar with BPM, time signature, and recording
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipBack, SkipForward, Square,
  Volume2, Repeat, Mic, Upload, Download,
  ZoomIn, ZoomOut, Disc,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioTransportProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  bpm: number;
  zoom: number;
  loop: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onSeek: (time: number) => void;
  onMasterVolumeChange: (v: number) => void;
  onBpmChange: (bpm: number) => void;
  onZoomChange: (zoom: number) => void;
  onLoopToggle: () => void;
  onImport: () => void;
  onExport: () => void;
}

const formatTimecode = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export const AudioTransport: React.FC<AudioTransportProps> = ({
  isPlaying, isRecording, currentTime, duration, masterVolume, bpm, zoom, loop,
  onPlayPause, onStop, onRecord, onSeek, onMasterVolumeChange, onBpmChange,
  onZoomChange, onLoopToggle, onImport, onExport,
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-background/70 backdrop-blur-sm shrink-0">
      {/* Transport controls */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onSeek(0)}>
          <SkipBack className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className={cn('w-9 h-9 rounded-full', isPlaying && 'bg-primary/20 text-primary')}
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onStop}>
          <Square className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className={cn('w-7 h-7 rounded-full', isRecording && 'bg-destructive/20 text-destructive animate-pulse')}
          onClick={onRecord}
        >
          <Disc className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Timecode display */}
      <div className="bg-muted/30 rounded-md px-3 py-1 border border-border/20 font-mono">
        <span className="text-sm text-primary font-semibold tracking-wider">{formatTimecode(currentTime)}</span>
      </div>

      {/* BPM */}
      <div className="flex items-center gap-1 bg-muted/20 rounded-md px-2 py-0.5 border border-border/20">
        <span className="text-[9px] text-muted-foreground">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={e => onBpmChange(Number(e.target.value))}
          className="w-10 bg-transparent text-xs font-mono text-foreground text-center border-none outline-none"
          min={20}
          max={300}
        />
      </div>

      {/* Loop */}
      <Button
        variant="ghost" size="icon"
        className={cn('w-7 h-7', loop && 'bg-primary/15 text-primary')}
        onClick={onLoopToggle}
      >
        <Repeat className="w-3.5 h-3.5" />
      </Button>

      <div className="flex-1" />

      {/* Master volume */}
      <div className="flex items-center gap-1">
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
        <Slider value={[masterVolume]} min={0} max={100} className="w-20" onValueChange={([v]) => onMasterVolumeChange(v)} />
        <span className="text-[8px] font-mono text-muted-foreground w-8">
          {masterVolume === 0 ? '-∞' : `${Math.round(20 * Math.log10(masterVolume / 100))}dB`}
        </span>
      </div>

      <div className="w-px h-5 bg-border/30" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.5))}>
          <ZoomOut className="w-3 h-3" />
        </Button>
        <span className="text-[9px] font-mono text-muted-foreground w-8 text-center">{zoom.toFixed(1)}x</span>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onZoomChange(Math.min(8, zoom + 0.5))}>
          <ZoomIn className="w-3 h-3" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border/30" />

      {/* Import/Export */}
      <div className="flex items-center gap-0.5">
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={onImport}>
          <Upload className="w-3 h-3" /> Import
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={onExport}>
          <Download className="w-3 h-3" /> Export
        </Button>
      </div>
    </div>
  );
};
