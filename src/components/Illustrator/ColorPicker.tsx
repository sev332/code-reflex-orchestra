/**
 * ColorPicker — Professional HSB/RGB/HEX color picker for Illustrator
 * Features: Spectrum saturation/brightness field, hue slider, hex/RGB inputs, opacity slider
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  colorFromHex, colorFromHSB, colorFromRGB,
  type ColorValue, type HarmonyType, generateHarmony,
} from '@/lib/drawing-engine/color-system';

interface ColorPickerProps {
  color: string;
  opacity?: number;
  onChange: (color: string, opacity?: number) => void;
  className?: string;
  showOpacity?: boolean;
  showHarmony?: boolean;
}

export function ColorPicker({
  color,
  opacity = 1,
  onChange,
  className,
  showOpacity = false,
  showHarmony = false,
}: ColorPickerProps) {
  const [cv, setCv] = useState<ColorValue>(() => colorFromHex(color, opacity));
  const [hexInput, setHexInput] = useState(color);
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<'spectrum' | 'hue' | null>(null);

  // Sync external color changes
  useEffect(() => {
    const newCv = colorFromHex(color, opacity);
    setCv(newCv);
    setHexInput(color);
  }, [color, opacity]);

  const applyColor = useCallback((newCv: ColorValue) => {
    setCv(newCv);
    setHexInput(newCv.hex);
    onChange(newCv.hex, newCv.opacity);
  }, [onChange]);

  // Draw spectrum (saturation/brightness field)
  useEffect(() => {
    const canvas = spectrumRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;

    // White to hue gradient (horizontal)
    const hueGrad = ctx.createLinearGradient(0, 0, w, 0);
    const pureHueRGB = colorFromHSB(cv.hsb.h, 100, 100).hex;
    hueGrad.addColorStop(0, '#ffffff');
    hueGrad.addColorStop(1, pureHueRGB);
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, w, h);

    // Black gradient (vertical)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw cursor
    const cx = (cv.hsb.s / 100) * w;
    const cy = (1 - cv.hsb.b / 100) * h;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
  }, [cv.hsb.h, cv.hsb.s, cv.hsb.b]);

  // Draw hue bar
  useEffect(() => {
    const canvas = hueRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    const hueGrad = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 6; i++) {
      hueGrad.addColorStop(i / 6, `hsl(${i * 60}, 100%, 50%)`);
    }
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw marker
    const hx = (cv.hsb.h / 360) * w;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx - 3, 0, 6, h);
  }, [cv.hsb.h]);

  const handleSpectrumInteraction = useCallback((e: React.PointerEvent) => {
    const canvas = spectrumRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    applyColor(colorFromHSB(cv.hsb.h, Math.round(x * 100), Math.round((1 - y) * 100), cv.opacity));
  }, [cv.hsb.h, cv.opacity, applyColor]);

  const handleHueInteraction = useCallback((e: React.PointerEvent) => {
    const canvas = hueRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    applyColor(colorFromHSB(Math.round(x * 360), cv.hsb.s, cv.hsb.b, cv.opacity));
  }, [cv.hsb.s, cv.hsb.b, cv.opacity, applyColor]);

  const handlePointerDown = useCallback((target: 'spectrum' | 'hue') => (e: React.PointerEvent) => {
    setIsDragging(target);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (target === 'spectrum') handleSpectrumInteraction(e);
    else handleHueInteraction(e);
  }, [handleSpectrumInteraction, handleHueInteraction]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging === 'spectrum') handleSpectrumInteraction(e);
    else if (isDragging === 'hue') handleHueInteraction(e);
  }, [isDragging, handleSpectrumInteraction, handleHueInteraction]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const handleHexChange = useCallback((val: string) => {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      applyColor(colorFromHex(val, cv.opacity));
    }
  }, [cv.opacity, applyColor]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Spectrum field */}
      <canvas
        ref={spectrumRef}
        width={200}
        height={150}
        className="w-full h-[120px] rounded cursor-crosshair"
        onPointerDown={handlePointerDown('spectrum')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Hue bar */}
      <canvas
        ref={hueRef}
        width={200}
        height={16}
        className="w-full h-3 rounded cursor-pointer"
        onPointerDown={handlePointerDown('hue')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Opacity slider */}
      {showOpacity && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8">A</span>
          <Slider
            value={[Math.round(cv.opacity * 100)]}
            min={0} max={100} step={1}
            onValueChange={([v]) => applyColor({ ...cv, opacity: v / 100 })}
            className="flex-1"
          />
          <span className="text-[10px] font-mono w-8 text-right">{Math.round(cv.opacity * 100)}%</span>
        </div>
      )}

      {/* Color inputs */}
      <div className="grid grid-cols-4 gap-1">
        <div className="col-span-2">
          <span className="text-[9px] text-muted-foreground">HEX</span>
          <Input
            value={hexInput}
            onChange={e => handleHexChange(e.target.value)}
            className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)] font-mono"
          />
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground">R</span>
          <Input
            type="number" min={0} max={255}
            value={cv.rgb.r}
            onChange={e => applyColor(colorFromRGB(+e.target.value, cv.rgb.g, cv.rgb.b, cv.opacity))}
            className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)] font-mono"
          />
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground">G</span>
          <Input
            type="number" min={0} max={255}
            value={cv.rgb.g}
            onChange={e => applyColor(colorFromRGB(cv.rgb.r, +e.target.value, cv.rgb.b, cv.opacity))}
            className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)] font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <span className="text-[9px] text-muted-foreground">B</span>
          <Input
            type="number" min={0} max={255}
            value={cv.rgb.b}
            onChange={e => applyColor(colorFromRGB(cv.rgb.r, cv.rgb.g, +e.target.value, cv.opacity))}
            className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)] font-mono"
          />
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground">H</span>
          <Input
            type="number" min={0} max={360}
            value={cv.hsb.h}
            onChange={e => applyColor(colorFromHSB(+e.target.value, cv.hsb.s, cv.hsb.b, cv.opacity))}
            className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)] font-mono"
          />
        </div>
        <div>
          <span className="text-[9px] text-muted-foreground">S</span>
          <Input
            type="number" min={0} max={100}
            value={cv.hsb.s}
            onChange={e => applyColor(colorFromHSB(cv.hsb.h, +e.target.value, cv.hsb.b, cv.opacity))}
            className="h-6 text-[10px] bg-[hsl(220,15%,8%)] border-[hsl(220,15%,15%)] font-mono"
          />
        </div>
      </div>

      {/* Color preview swatch */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-[hsl(220,15%,20%)]"
          style={{ backgroundColor: cv.hex, opacity: cv.opacity }}
        />
        <div className="text-[10px] text-muted-foreground font-mono">
          {cv.hex.toUpperCase()}
        </div>
      </div>

      {/* Harmony presets */}
      {showHarmony && (
        <div className="space-y-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Harmonies</span>
          {(['complementary', 'analogous', 'triadic', 'split-complementary'] as HarmonyType[]).map(type => {
            const colors = generateHarmony(cv, type);
            return (
              <div key={type} className="flex items-center gap-1">
                <span className="text-[8px] text-muted-foreground w-16 truncate capitalize">{type}</span>
                <div className="flex gap-0.5 flex-1">
                  {colors.map((c, i) => (
                    <button
                      key={i}
                      className="w-5 h-5 rounded-sm border border-[hsl(220,15%,20%)] hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.hex }}
                      onClick={() => applyColor(c)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
