// Video preview canvas with frame-accurate display and overlay controls
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Film, Monitor, Smartphone, Tablet, Maximize2, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPreviewCanvasProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  previewSize: '16:9' | '9:16' | '1:1' | '4:3';
  onPreviewSizeChange: (size: '16:9' | '9:16' | '1:1' | '4:3') => void;
  className?: string;
}

export const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  currentTime, duration, isPlaying, previewSize, onPreviewSizeChange, className,
}) => {
  const [showGuides, setShowGuides] = useState(false);
  const previewAspectRatio = previewSize === '16:9' ? '16/9' : previewSize === '9:16' ? '9/16' : previewSize === '4:3' ? '4/3' : '1/1';

  const formatTC = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const f = Math.floor((s % 1) * 30); // 30fps
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col bg-[hsl(220,27%,3%)]', className)}>
      {/* Preview controls */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-1">
          {(['16:9', '9:16', '1:1', '4:3'] as const).map(size => (
            <Button
              key={size}
              variant="ghost"
              size="sm"
              className={cn('h-5 px-1.5 text-[9px]', previewSize === size && 'bg-primary/15 text-primary')}
              onClick={() => onPreviewSizeChange(size)}
            >
              {size}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" className={cn('w-5 h-5', showGuides && 'text-primary')}
            onClick={() => setShowGuides(v => !v)}
          >
            <Grid3X3 className="w-3 h-3" />
          </Button>
          <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-mono">
            {formatTC(currentTime)}
          </Badge>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-3 min-h-0">
        <div
          className="relative bg-black/80 rounded-lg border border-border/20 shadow-2xl shadow-black/50 overflow-hidden"
          style={{
            aspectRatio: previewAspectRatio,
            maxHeight: '100%',
            maxWidth: '100%',
            width: previewSize === '9:16' ? '40%' : '90%',
          }}
        >
          {/* Simulated video content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground/30">
              <Film className="w-10 h-10 mx-auto mb-1.5" />
              <p className="text-[10px]">Preview</p>
            </div>
          </div>

          {/* Rule of thirds overlay */}
          {showGuides && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {[1, 2].map(i => (
                <React.Fragment key={i}>
                  <line x1={`${(i / 3) * 100}%`} y1="0" x2={`${(i / 3) * 100}%`} y2="100%" stroke="hsla(193, 100%, 50%, 0.2)" strokeWidth={0.5} />
                  <line x1="0" y1={`${(i / 3) * 100}%`} x2="100%" y2={`${(i / 3) * 100}%`} stroke="hsla(193, 100%, 50%, 0.2)" strokeWidth={0.5} />
                </React.Fragment>
              ))}
              {/* Safe area */}
              <rect x="5%" y="5%" width="90%" height="90%" fill="none" stroke="hsla(30, 100%, 65%, 0.15)" strokeWidth={0.5} strokeDasharray="4 4" />
            </svg>
          )}

          {/* Playback indicator */}
          {isPlaying && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Frame info bar */}
      <div className="flex items-center justify-between px-3 py-0.5 border-t border-border/20 text-[8px] font-mono text-muted-foreground shrink-0">
        <span>Frame {Math.floor(currentTime * 30)} / {Math.floor(duration * 30)}</span>
        <span>30fps • {previewSize}</span>
        <span>{((currentTime / duration) * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};
