// Canvas-based video timeline with draggable clips, snap grid, and playhead
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TimelineClip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'effect';
  startTime: number;
  duration: number;
  track: number;
  color: string;
  opacity?: number;
  speed?: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effects';
  locked: boolean;
  visible: boolean;
  height: number;
}

interface VideoTimelineCanvasProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  zoom: number;
  selectedClipId: string | null;
  trackLabelWidth: number;
  onSeek: (time: number) => void;
  onClipSelect: (id: string | null) => void;
  onClipMove: (id: string, startTime: number, track: number) => void;
  onClipResize: (id: string, startTime: number, duration: number) => void;
  className?: string;
}

export const VideoTimelineCanvas: React.FC<VideoTimelineCanvasProps> = ({
  tracks, clips, currentTime, duration, zoom, selectedClipId, trackLabelWidth,
  onSeek, onClipSelect, onClipMove, onClipResize, className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type: 'move' | 'resize-left' | 'resize-right' | 'seek';
    clipId?: string;
    startX: number;
    origStart: number;
    origDuration: number;
    origTrack: number;
  } | null>(null);

  const getTimeFromX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const totalW = canvas.clientWidth * zoom;
    return Math.max(0, Math.min(duration, (x / totalW) * duration));
  }, [duration, zoom]);

  const getTrackFromY = useCallback((clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    let cumH = 0;
    for (let i = 0; i < tracks.length; i++) {
      cumH += tracks[i].height;
      if (y < cumH) return i;
    }
    return tracks.length - 1;
  }, [tracks]);

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

    const totalW = w * zoom;
    const pxPerSec = totalW / duration;

    // Background
    ctx.fillStyle = 'hsl(220, 27%, 4%)';
    ctx.fillRect(0, 0, w, h);

    // Track lanes
    let cumY = 0;
    tracks.forEach((track, ti) => {
      const th = track.height;

      // Alternating lane bg
      ctx.fillStyle = ti % 2 === 0 ? 'hsla(220, 27%, 6%, 0.5)' : 'hsla(220, 27%, 5%, 0.5)';
      ctx.fillRect(0, cumY, w, th);

      // Lane border
      ctx.strokeStyle = 'hsla(220, 15%, 18%, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, cumY + th);
      ctx.lineTo(w, cumY + th);
      ctx.stroke();

      cumY += th;
    });

    // Beat grid
    ctx.strokeStyle = 'hsla(220, 15%, 18%, 0.15)';
    ctx.lineWidth = 0.5;
    let gridInterval = 5;
    if (pxPerSec > 30) gridInterval = 2;
    if (pxPerSec > 60) gridInterval = 1;
    for (let t = 0; t <= duration; t += gridInterval) {
      const x = t * pxPerSec;
      if (x > w) break;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Clips
    clips.forEach(clip => {
      if (clip.track >= tracks.length) return;

      let y = 0;
      for (let i = 0; i < clip.track; i++) y += tracks[i].height;
      const th = tracks[clip.track].height;

      const x = clip.startTime * pxPerSec;
      const cw = clip.duration * pxPerSec;
      const pad = 2;
      const clipY = y + pad;
      const clipH = th - pad * 2;
      const r = 4;
      const isSelected = clip.id === selectedClipId;

      // Clip body
      const baseColor = clip.color;
      ctx.fillStyle = isSelected
        ? baseColor.replace(')', ', 0.45)').replace('hsl(', 'hsla(')
        : baseColor.replace(')', ', 0.25)').replace('hsl(', 'hsla(');

      // Rounded rect
      ctx.beginPath();
      ctx.moveTo(x + r, clipY);
      ctx.lineTo(x + cw - r, clipY);
      ctx.arcTo(x + cw, clipY, x + cw, clipY + r, r);
      ctx.lineTo(x + cw, clipY + clipH - r);
      ctx.arcTo(x + cw, clipY + clipH, x + cw - r, clipY + clipH, r);
      ctx.lineTo(x + r, clipY + clipH);
      ctx.arcTo(x, clipY + clipH, x, clipY + clipH - r, r);
      ctx.lineTo(x, clipY + r);
      ctx.arcTo(x, clipY, x + r, clipY, r);
      ctx.closePath();
      ctx.fill();

      // Clip border
      ctx.strokeStyle = isSelected
        ? 'hsl(193, 100%, 50%)'
        : baseColor.replace(')', ', 0.5)').replace('hsl(', 'hsla(');
      ctx.lineWidth = isSelected ? 1.5 : 0.5;
      ctx.stroke();

      // Clip waveform preview (for audio/video clips)
      if ((clip.type === 'audio' || clip.type === 'video') && cw > 30) {
        ctx.strokeStyle = baseColor.replace(')', ', 0.4)').replace('hsl(', 'hsla(');
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const steps = Math.min(100, Math.floor(cw));
        for (let s = 0; s < steps; s++) {
          const sx = x + (s / steps) * cw;
          const amp = (Math.sin(s * 0.5) * 0.3 + Math.sin(s * 1.2) * 0.2 + Math.random() * 0.15) * clipH * 0.3;
          const sy = clipY + clipH / 2 + amp;
          s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Clip label
      if (cw > 40) {
        ctx.fillStyle = 'hsla(193, 100%, 85%, 0.8)';
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.fillText(clip.name, x + 6, clipY + 12, cw - 12);
      }

      // Resize handles (when selected)
      if (isSelected) {
        ctx.fillStyle = 'hsl(193, 100%, 50%)';
        // Left handle
        ctx.fillRect(x, clipY + clipH / 2 - 6, 3, 12);
        // Right handle
        ctx.fillRect(x + cw - 3, clipY + clipH / 2 - 6, 3, 12);
      }

      // Duration badge
      if (cw > 60) {
        const durText = `${clip.duration.toFixed(1)}s`;
        ctx.fillStyle = 'hsla(193, 100%, 85%, 0.4)';
        ctx.font = '7px JetBrains Mono, monospace';
        ctx.fillText(durText, x + cw - ctx.measureText(durText).width - 5, clipY + clipH - 4);
      }
    });

    // Playhead
    const phX = currentTime * pxPerSec;
    if (phX <= w) {
      // Glow
      const glowGrad = ctx.createRadialGradient(phX, h / 2, 0, phX, h / 2, 15);
      glowGrad.addColorStop(0, 'hsla(193, 100%, 50%, 0.2)');
      glowGrad.addColorStop(1, 'hsla(193, 100%, 50%, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(phX - 15, 0, 30, h);

      ctx.strokeStyle = 'hsl(193, 100%, 50%)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'hsl(193, 100%, 50%)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(phX, 0);
      ctx.lineTo(phX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [tracks, clips, currentTime, duration, zoom, selectedClipId]);

  useEffect(() => {
    const frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const pxPerSec = (canvas.clientWidth * zoom) / duration;

    // Check if clicking on a clip
    let clickedClip: TimelineClip | null = null;
    let hitType: 'move' | 'resize-left' | 'resize-right' = 'move';

    for (const clip of clips) {
      if (clip.track >= tracks.length) continue;
      let y = 0;
      for (let i = 0; i < clip.track; i++) y += tracks[i].height;
      const th = tracks[clip.track].height;
      const cx = clip.startTime * pxPerSec;
      const cw = clip.duration * pxPerSec;

      if (mx >= cx && mx <= cx + cw && my >= y && my <= y + th) {
        clickedClip = clip;
        if (mx < cx + 6) hitType = 'resize-left';
        else if (mx > cx + cw - 6) hitType = 'resize-right';
        break;
      }
    }

    if (clickedClip) {
      onClipSelect(clickedClip.id);
      dragRef.current = {
        type: hitType,
        clipId: clickedClip.id,
        startX: e.clientX,
        origStart: clickedClip.startTime,
        origDuration: clickedClip.duration,
        origTrack: clickedClip.track,
      };
    } else {
      onClipSelect(null);
      dragRef.current = { type: 'seek', startX: e.clientX, origStart: 0, origDuration: 0, origTrack: 0 };
      onSeek(getTimeFromX(e.clientX));
    }

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const d = dragRef.current;

      if (d.type === 'seek') {
        onSeek(getTimeFromX(ev.clientX));
      } else if (d.clipId) {
        const dx = ev.clientX - d.startX;
        const dt = (dx / (canvas.clientWidth * zoom)) * duration;
        const newTrack = getTrackFromY(ev.clientY);

        if (d.type === 'move') {
          onClipMove(d.clipId, Math.max(0, d.origStart + dt), newTrack);
        } else if (d.type === 'resize-left') {
          const newStart = Math.max(0, d.origStart + dt);
          const newDur = d.origDuration - (newStart - d.origStart);
          if (newDur > 0.5) onClipResize(d.clipId, newStart, newDur);
        } else if (d.type === 'resize-right') {
          const newDur = Math.max(0.5, d.origDuration + dt);
          onClipResize(d.clipId, d.origStart, newDur);
        }
      }
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-default"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
