// Canvas-based waveform renderer — sample-accurate, GPU-accelerated appearance
import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformCanvasProps {
  waveform: number[];
  color: string;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  zoom: number;
  height?: number;
  regionStart?: number | null;
  regionEnd?: number | null;
  onSeek?: (time: number) => void;
  onRegionChange?: (start: number, end: number) => void;
  className?: string;
}

export const AudioWaveformCanvas: React.FC<AudioWaveformCanvasProps> = ({
  waveform, color, muted, volume, currentTime, duration, zoom,
  height = 80, regionStart, regionEnd, onSeek, onRegionChange, className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const isDraggingRef = useRef<'seek' | 'region-start' | 'region-end' | 'region-create' | null>(null);
  const dragStartXRef = useRef(0);

  const getTimeFromX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(duration, (x / (rect.width * zoom)) * duration));
  }, [duration, zoom]);

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

    // Clear
    ctx.clearRect(0, 0, w, h);

    const totalW = w * zoom;
    const barCount = waveform.length;
    const barW = totalW / barCount;
    const midY = h / 2;
    const volScale = volume / 100;

    // Region highlight
    if (regionStart != null && regionEnd != null) {
      const rx1 = (regionStart / duration) * totalW;
      const rx2 = (regionEnd / duration) * totalW;
      ctx.fillStyle = muted
        ? 'hsla(193, 30%, 65%, 0.06)'
        : color.replace(')', ', 0.08)').replace('hsl(', 'hsla(');
      ctx.fillRect(rx1, 0, rx2 - rx1, h);

      // Region edges
      ctx.strokeStyle = muted ? 'hsla(193, 30%, 65%, 0.3)' : color.replace(')', ', 0.5)').replace('hsl(', 'hsla(');
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rx1, 0); ctx.lineTo(rx1, h);
      ctx.moveTo(rx2, 0); ctx.lineTo(rx2, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Waveform — mirrored bars with rounded caps
    for (let i = 0; i < barCount; i++) {
      const x = i * barW;
      if (x > w) break; // clip to visible

      const amp = waveform[i] * volScale;
      const barH = amp * (h * 0.42);

      if (muted) {
        ctx.fillStyle = 'hsla(193, 30%, 65%, 0.12)';
      } else {
        // Gradient per bar — brighter at center
        const grad = ctx.createLinearGradient(x, midY - barH, x, midY + barH);
        const baseColor = color.replace('hsl(', '').replace(')', '');
        grad.addColorStop(0, `hsla(${baseColor}, 0.25)`);
        grad.addColorStop(0.5, `hsla(${baseColor}, 0.7)`);
        grad.addColorStop(1, `hsla(${baseColor}, 0.25)`);
        ctx.fillStyle = grad;
      }

      const bw = Math.max(1, barW * 0.7);
      const r = Math.min(bw / 2, 2);

      // Top half
      if (barH > r) {
        ctx.beginPath();
        ctx.moveTo(x, midY);
        ctx.lineTo(x, midY - barH + r);
        ctx.arcTo(x, midY - barH, x + bw, midY - barH, r);
        ctx.arcTo(x + bw, midY - barH, x + bw, midY - barH + r, r);
        ctx.lineTo(x + bw, midY);
        ctx.fill();

        // Bottom mirror
        ctx.beginPath();
        ctx.moveTo(x, midY);
        ctx.lineTo(x, midY + barH - r);
        ctx.arcTo(x, midY + barH, x + bw, midY + barH, r);
        ctx.arcTo(x + bw, midY + barH, x + bw, midY + barH - r, r);
        ctx.lineTo(x + bw, midY);
        ctx.fill();
      } else {
        ctx.fillRect(x, midY - barH, bw, barH * 2);
      }
    }

    // Center line
    ctx.strokeStyle = muted ? 'hsla(193, 30%, 65%, 0.08)' : color.replace(')', ', 0.15)').replace('hsl(', 'hsla(');
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(totalW, midY);
    ctx.stroke();

    // Playhead
    const phX = (currentTime / duration) * totalW;
    if (phX <= w) {
      // Glow
      const glowGrad = ctx.createRadialGradient(phX, midY, 0, phX, midY, 20);
      glowGrad.addColorStop(0, 'hsla(193, 100%, 50%, 0.3)');
      glowGrad.addColorStop(1, 'hsla(193, 100%, 50%, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(phX - 20, 0, 40, h);

      // Line
      ctx.strokeStyle = 'hsl(193, 100%, 50%)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'hsl(193, 100%, 50%)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(phX, 0);
      ctx.lineTo(phX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Head triangle
      ctx.fillStyle = 'hsl(193, 100%, 50%)';
      ctx.beginPath();
      ctx.moveTo(phX - 4, 0);
      ctx.lineTo(phX + 4, 0);
      ctx.lineTo(phX, 6);
      ctx.closePath();
      ctx.fill();
    }
  }, [waveform, color, muted, volume, currentTime, duration, zoom, height, regionStart, regionEnd]);

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.altKey && onRegionChange) {
      isDraggingRef.current = 'region-create';
      dragStartXRef.current = getTimeFromX(e.clientX);
    } else if (onSeek) {
      isDraggingRef.current = 'seek';
      onSeek(getTimeFromX(e.clientX));
    }

    const handleMove = (ev: MouseEvent) => {
      if (isDraggingRef.current === 'seek' && onSeek) {
        onSeek(getTimeFromX(ev.clientX));
      } else if (isDraggingRef.current === 'region-create' && onRegionChange) {
        const t = getTimeFromX(ev.clientX);
        onRegionChange(Math.min(dragStartXRef.current, t), Math.max(dragStartXRef.current, t));
      }
    };
    const handleUp = () => {
      isDraggingRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden cursor-crosshair', className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
