// Real-time spectrogram visualization — canvas-based frequency display
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart3, Activity } from 'lucide-react';

interface AudioSpectrogramProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  className?: string;
}

type ViewMode = 'spectrogram' | 'spectrum';

export const AudioSpectrogram: React.FC<AudioSpectrogramProps> = ({
  isPlaying, currentTime, duration, className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[][]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('spectrogram');

  // Generate synthetic frequency data (simulates FFT output)
  const generateFreqBins = useCallback(() => {
    const bins = 64;
    const data: number[] = [];
    const timePhase = currentTime * 2;

    for (let i = 0; i < bins; i++) {
      const freq = i / bins;
      // Simulate typical audio spectrum shape: strong low-mid, rolloff at high
      let magnitude = Math.exp(-freq * 2) * 0.8;
      // Add harmonic peaks
      magnitude += Math.sin(freq * 12 + timePhase) * 0.15 * Math.exp(-freq);
      magnitude += Math.sin(freq * 24 + timePhase * 1.5) * 0.08 * Math.exp(-freq * 0.5);
      // Random variation
      magnitude += (Math.random() - 0.5) * 0.1 * (isPlaying ? 1 : 0.1);
      magnitude = Math.max(0, Math.min(1, magnitude));
      if (!isPlaying) magnitude *= 0.15;
      data.push(magnitude);
    }
    return data;
  }, [currentTime, isPlaying]);

  const drawSpectrogram = useCallback(() => {
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

    const freqData = generateFreqBins();

    if (viewMode === 'spectrogram') {
      // Waterfall spectrogram
      historyRef.current.push(freqData);
      if (historyRef.current.length > w) historyRef.current.shift();

      const history = historyRef.current;
      const colW = Math.max(1, w / history.length);

      for (let col = 0; col < history.length; col++) {
        const bins = history[col];
        const binH = h / bins.length;

        for (let row = 0; row < bins.length; row++) {
          const magnitude = bins[row];
          const y = h - (row + 1) * binH;

          // Color: black -> deep blue -> cyan -> yellow -> white
          let r: number, g: number, b: number;
          if (magnitude < 0.25) {
            const t = magnitude / 0.25;
            r = 0; g = t * 20; b = t * 80;
          } else if (magnitude < 0.5) {
            const t = (magnitude - 0.25) / 0.25;
            r = 0; g = 20 + t * 180; b = 80 + t * 120;
          } else if (magnitude < 0.75) {
            const t = (magnitude - 0.5) / 0.25;
            r = t * 255; g = 200 + t * 55; b = 200 - t * 100;
          } else {
            const t = (magnitude - 0.75) / 0.25;
            r = 255; g = 255; b = 100 + t * 155;
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(col * colW, y, colW + 0.5, binH + 0.5);
        }
      }

      // Frequency labels
      ctx.fillStyle = 'hsla(193, 100%, 85%, 0.4)';
      ctx.font = '8px JetBrains Mono, monospace';
      const freqLabels = ['20k', '10k', '5k', '2k', '1k', '500', '200', '60'];
      freqLabels.forEach((label, i) => {
        const y = (i / freqLabels.length) * h + 8;
        ctx.fillText(label, 2, y);
      });
    } else {
      // Real-time spectrum analyzer (bars)
      ctx.fillStyle = 'hsla(220, 27%, 4%, 0.9)';
      ctx.fillRect(0, 0, w, h);

      const barW = w / freqData.length;

      for (let i = 0; i < freqData.length; i++) {
        const magnitude = freqData[i];
        const barH = magnitude * h * 0.9;
        const x = i * barW;
        const y = h - barH;

        // Gradient bar
        const grad = ctx.createLinearGradient(x, h, x, y);
        grad.addColorStop(0, 'hsla(193, 100%, 50%, 0.6)');
        grad.addColorStop(0.6, 'hsla(270, 100%, 70%, 0.6)');
        grad.addColorStop(1, 'hsla(0, 75%, 55%, 0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 0.5, y, barW - 1, barH);

        // Peak cap
        ctx.fillStyle = 'hsla(193, 100%, 85%, 0.8)';
        ctx.fillRect(x + 0.5, y - 2, barW - 1, 1.5);
      }

      // Grid
      ctx.strokeStyle = 'hsla(220, 15%, 18%, 0.3)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(w, y);
        ctx.stroke();
      }

      // dB labels
      ctx.fillStyle = 'hsla(193, 100%, 85%, 0.3)';
      ctx.font = '8px JetBrains Mono, monospace';
      ['0dB', '-12dB', '-24dB', '-36dB'].forEach((label, i) => {
        ctx.fillText(label, w - 28, (h / 4) * i + 10);
      });
    }
  }, [viewMode, generateFreqBins]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      drawSpectrogram();
      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [drawSpectrogram]);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {viewMode === 'spectrogram' ? 'Spectrogram' : 'Spectrum'}
        </span>
        <div className="flex gap-0.5">
          <Button
            variant="ghost" size="icon" className={cn('w-5 h-5', viewMode === 'spectrogram' && 'text-primary')}
            onClick={() => setViewMode('spectrogram')}
          >
            <BarChart3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost" size="icon" className={cn('w-5 h-5', viewMode === 'spectrum' && 'text-primary')}
            onClick={() => setViewMode('spectrum')}
          >
            <Activity className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <canvas ref={canvasRef} className="flex-1 w-full min-h-0" />
    </div>
  );
};
