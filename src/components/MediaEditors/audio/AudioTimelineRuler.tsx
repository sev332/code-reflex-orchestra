// Timeline ruler with beat grid, snap points, and markers
import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AudioTimelineRulerProps {
  duration: number;
  currentTime: number;
  zoom: number;
  bpm: number;
  trackLabelWidth: number;
  onSeek: (time: number) => void;
  className?: string;
}

export const AudioTimelineRuler: React.FC<AudioTimelineRulerProps> = ({
  duration, currentTime, zoom, bpm, trackLabelWidth, onSeek, className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const totalW = w * zoom;
    const pxPerSec = totalW / duration;
    const beatInterval = 60 / bpm;

    // Determine tick spacing based on zoom
    let majorInterval = 10; // seconds
    if (pxPerSec > 30) majorInterval = 5;
    if (pxPerSec > 60) majorInterval = 2;
    if (pxPerSec > 120) majorInterval = 1;

    // Minor ticks (beats)
    ctx.strokeStyle = 'hsla(220, 15%, 18%, 0.4)';
    ctx.lineWidth = 0.5;
    for (let t = 0; t < duration; t += beatInterval) {
      const x = t * pxPerSec;
      if (x > w) break;
      ctx.beginPath();
      ctx.moveTo(x, h - 4);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Major ticks
    ctx.strokeStyle = 'hsla(193, 30%, 65%, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'hsla(193, 100%, 85%, 0.5)';
    ctx.font = '9px JetBrains Mono, monospace';

    for (let t = 0; t <= duration; t += majorInterval) {
      const x = t * pxPerSec;
      if (x > w) break;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, x + 2, 10);
    }

    // Playhead marker
    const phX = currentTime * pxPerSec;
    if (phX <= w) {
      ctx.fillStyle = 'hsl(193, 100%, 50%)';
      ctx.beginPath();
      ctx.moveTo(phX - 5, 0);
      ctx.lineTo(phX + 5, 0);
      ctx.lineTo(phX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [duration, currentTime, zoom, bpm]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalW = canvas.clientWidth * zoom;
    const time = (x / totalW) * duration;
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  return (
    <div className={cn('h-6 border-b border-border/30 bg-muted/10 shrink-0 overflow-hidden cursor-pointer', className)}
      style={{ paddingLeft: trackLabelWidth }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleClick}
      />
    </div>
  );
};
