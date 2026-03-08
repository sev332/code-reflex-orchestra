// Phase 6 — Viewport & Camera System
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Camera, Bookmark, Download, Plus, Trash2, Eye, Grid3x3 } from 'lucide-react';

export type ViewportMode = 'solid' | 'wireframe' | 'normals' | 'depth' | 'ao' | 'uv';
export type ViewportLayout = 'single' | 'split-h' | 'split-v' | 'quad';

export interface CameraBookmark {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface CinematicSettings {
  fov: number;
  focalLength: number;
  sensorSize: number;
  near: number;
  far: number;
  orthographic: boolean;
}

export const defaultCinematic: CinematicSettings = {
  fov: 50,
  focalLength: 50,
  sensorSize: 36,
  near: 0.1,
  far: 1000,
  orthographic: false,
};

export interface ScreenshotConfig {
  width: number;
  height: number;
  transparent: boolean;
  superSampling: number;
}

interface ViewportManagerProps {
  viewportMode: ViewportMode;
  onViewportModeChange: (mode: ViewportMode) => void;
  layout: ViewportLayout;
  onLayoutChange: (layout: ViewportLayout) => void;
  bookmarks: CameraBookmark[];
  onBookmarksChange: (bookmarks: CameraBookmark[]) => void;
  onRestoreBookmark: (bookmark: CameraBookmark) => void;
  cinematic: CinematicSettings;
  onCinematicChange: (settings: CinematicSettings) => void;
  onScreenshot: (config: ScreenshotConfig) => void;
}

export function ViewportManagerPanel({
  viewportMode, onViewportModeChange, layout, onLayoutChange,
  bookmarks, onBookmarksChange, onRestoreBookmark,
  cinematic, onCinematicChange, onScreenshot,
}: ViewportManagerProps) {
  const [screenshotConfig, setScreenshotConfig] = useState<ScreenshotConfig>({
    width: 1920, height: 1080, transparent: false, superSampling: 2,
  });

  const addBookmark = () => {
    const newBookmark: CameraBookmark = {
      id: `cam-${Date.now()}`,
      name: `View ${bookmarks.length + 1}`,
      position: [5, 4, 8],
      target: [0, 0, 0],
      fov: cinematic.fov,
    };
    onBookmarksChange([...bookmarks, newBookmark]);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Viewport & Camera</div>

        {/* Render Mode */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">RENDER MODE</Label>
          <div className="grid grid-cols-3 gap-1">
            {([
              { mode: 'solid' as const, label: 'Solid' },
              { mode: 'wireframe' as const, label: 'Wire' },
              { mode: 'normals' as const, label: 'Normal' },
              { mode: 'depth' as const, label: 'Depth' },
              { mode: 'ao' as const, label: 'AO' },
              { mode: 'uv' as const, label: 'UV' },
            ]).map(({ mode, label }) => (
              <Button key={mode} variant={viewportMode === mode ? 'default' : 'outline'} size="sm"
                onClick={() => onViewportModeChange(mode)}
                className="h-6 text-[9px] px-1">
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/20" />

        {/* Layout */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">LAYOUT</Label>
          <div className="grid grid-cols-2 gap-1">
            {([
              { l: 'single' as const, label: 'Single' },
              { l: 'split-h' as const, label: 'Split H' },
              { l: 'split-v' as const, label: 'Split V' },
              { l: 'quad' as const, label: 'Quad' },
            ]).map(({ l, label }) => (
              <Button key={l} variant={layout === l ? 'default' : 'outline'} size="sm"
                onClick={() => onLayoutChange(l)}
                className="h-6 text-[9px] px-1">
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/20" />

        {/* Camera Settings */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">CAMERA</Label>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Orthographic</span>
            <Switch checked={cinematic.orthographic}
              onCheckedChange={v => onCinematicChange({ ...cinematic, orthographic: v })}
              className="scale-75" />
          </div>
          {([
            { label: 'FOV', key: 'fov' as const, min: 10, max: 120, step: 1 },
            { label: 'Focal Length', key: 'focalLength' as const, min: 12, max: 200, step: 1 },
            { label: 'Near Clip', key: 'near' as const, min: 0.01, max: 10, step: 0.01 },
            { label: 'Far Clip', key: 'far' as const, min: 100, max: 10000, step: 100 },
          ]).map(({ label, key, min, max, step }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{cinematic[key]}</span>
              </div>
              <Slider value={[cinematic[key]]} onValueChange={([v]) => onCinematicChange({ ...cinematic, [key]: v })}
                min={min} max={max} step={step} />
            </div>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Camera Bookmarks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-foreground/60">BOOKMARKS</Label>
            <Button variant="ghost" size="icon" onClick={addBookmark} className="w-5 h-5">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {bookmarks.map((bm, i) => (
            <div key={bm.id} className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => onRestoreBookmark(bm)}
                className="flex-1 h-6 text-[9px] justify-start gap-1 px-2">
                <Bookmark className="w-3 h-3" /> {bm.name}
              </Button>
              <Button variant="ghost" size="icon"
                onClick={() => onBookmarksChange(bookmarks.filter(b => b.id !== bm.id))}
                className="w-5 h-5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </div>
          ))}
          {bookmarks.length === 0 && (
            <p className="text-[9px] text-muted-foreground text-center py-1">No bookmarks yet</p>
          )}
        </div>

        <Separator className="bg-border/20" />

        {/* Screenshot */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">RENDER TO IMAGE</Label>
          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-foreground">Width</span>
              <Input value={screenshotConfig.width}
                onChange={e => setScreenshotConfig(c => ({ ...c, width: parseInt(e.target.value) || 1920 }))}
                className="h-6 text-[10px] bg-muted/20 border-border/20 px-1" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-muted-foreground">Height</span>
              <Input value={screenshotConfig.height}
                onChange={e => setScreenshotConfig(c => ({ ...c, height: parseInt(e.target.value) || 1080 }))}
                className="h-6 text-[10px] bg-muted/20 border-border/20 px-1" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Transparent BG</span>
            <Switch checked={screenshotConfig.transparent}
              onCheckedChange={v => setScreenshotConfig(c => ({ ...c, transparent: v }))}
              className="scale-75" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Super Sampling</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{screenshotConfig.superSampling}x</span>
            </div>
            <Slider value={[screenshotConfig.superSampling]}
              onValueChange={([v]) => setScreenshotConfig(c => ({ ...c, superSampling: v }))}
              min={1} max={4} step={1} />
          </div>
          <Button variant="outline" size="sm" onClick={() => onScreenshot(screenshotConfig)}
            className="w-full h-7 text-xs gap-1">
            <Download className="w-3 h-3" /> Render Screenshot
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
