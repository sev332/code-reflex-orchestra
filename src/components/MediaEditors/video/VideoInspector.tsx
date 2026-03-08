// Video inspector panel — clip properties, color grading, transitions
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, Wand2, Palette, SlidersHorizontal, Layers,
  ChevronDown, ChevronRight, Blend, Contrast, Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClipData {
  id: string;
  name: string;
  type: string;
  startTime: number;
  duration: number;
  opacity?: number;
  speed?: number;
}

interface VideoInspectorProps {
  selectedClip: ClipData | null;
  onAiAction: (prompt: string) => void;
  className?: string;
}

export const VideoInspector: React.FC<VideoInspectorProps> = ({
  selectedClip, onAiAction, className,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'color' | 'effects'>('properties');

  const tabs = [
    { id: 'properties' as const, label: 'Props', icon: <SlidersHorizontal className="w-3 h-3" /> },
    { id: 'color' as const, label: 'Color', icon: <Palette className="w-3 h-3" /> },
    { id: 'effects' as const, label: 'FX', icon: <Layers className="w-3 h-3" /> },
  ];

  return (
    <div className={cn('flex flex-col bg-background/60 backdrop-blur-sm', className)}>
      <div className="px-3 py-1.5 border-b border-border/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Inspector</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] transition-colors',
              activeTab === tab.id ? 'text-primary border-b border-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {!selectedClip ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">Select a clip to inspect</p>
          ) : activeTab === 'properties' ? (
            <>
              <div>
                <span className="text-[10px] text-muted-foreground">Clip</span>
                <p className="text-xs font-medium">{selectedClip.name}</p>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 mt-1">{selectedClip.type}</Badge>
              </div>
              <div className="space-y-2">
                <PropSlider label="Opacity" value={selectedClip.opacity ?? 100} min={0} max={100} unit="%" />
                <PropSlider label="Speed" value={(selectedClip.speed ?? 1) * 100} min={25} max={400} unit="%" />
                <PropSlider label="Volume" value={100} min={0} max={200} unit="%" />
                <PropSlider label="Blur" value={0} min={0} max={100} unit="px" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground">Time</span>
                <div className="grid grid-cols-2 gap-1 mt-0.5 text-[9px] font-mono">
                  <div className="bg-muted/20 rounded px-1.5 py-0.5">In: {selectedClip.startTime.toFixed(1)}s</div>
                  <div className="bg-muted/20 rounded px-1.5 py-0.5">Dur: {selectedClip.duration.toFixed(1)}s</div>
                </div>
              </div>
            </>
          ) : activeTab === 'color' ? (
            <>
              <div className="space-y-2">
                <PropSlider label="Brightness" value={0} min={-100} max={100} unit="" />
                <PropSlider label="Contrast" value={0} min={-100} max={100} unit="" />
                <PropSlider label="Saturation" value={0} min={-100} max={100} unit="" />
                <PropSlider label="Temperature" value={0} min={-100} max={100} unit="" />
                <PropSlider label="Tint" value={0} min={-100} max={100} unit="" />
                <PropSlider label="Highlights" value={0} min={-100} max={100} unit="" />
                <PropSlider label="Shadows" value={0} min={-100} max={100} unit="" />
              </div>
              <div className="pt-2 border-t border-border/20">
                <span className="text-[9px] text-muted-foreground font-semibold">LUT Presets</span>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {['Cinematic', 'Warm', 'Cool', 'Vintage', 'Noir', 'Vivid'].map(lut => (
                    <Button key={lut} variant="outline" size="sm" className="h-5 text-[8px] px-1">{lut}</Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-semibold">Transitions</span>
                {['Cross Dissolve', 'Slide', 'Zoom', 'Wipe', 'Fade to Black'].map(tr => (
                  <Button key={tr} variant="outline" size="sm" className="w-full h-6 text-[10px] justify-start gap-1">
                    <Blend className="w-3 h-3" /> {tr}
                  </Button>
                ))}
              </div>
              <div className="pt-2 border-t border-border/20 space-y-1">
                <span className="text-[9px] text-muted-foreground font-semibold">Filters</span>
                {['Sharpen', 'Gaussian Blur', 'Vignette', 'Film Grain', 'Chromatic Aberration'].map(fx => (
                  <Button key={fx} variant="outline" size="sm" className="w-full h-6 text-[10px] justify-start gap-1">
                    <Sparkles className="w-3 h-3" /> {fx}
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* AI tools section */}
          <div className="pt-2 border-t border-border/20">
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-semibold text-muted-foreground uppercase">AI Tools</span>
            </div>
            <div className="space-y-1">
              {['Auto-cut highlights', 'Generate captions', 'Color match scene', 'Remove background', 'Smart reframe', 'AI transition'].map(action => (
                <Button key={action} variant="outline" size="sm" className="w-full text-[10px] justify-start h-6 gap-1" onClick={() => onAiAction(action)}>
                  <Wand2 className="w-3 h-3" />{action}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const PropSlider: React.FC<{ label: string; value: number; min: number; max: number; unit: string }> = ({
  label, value, min, max, unit,
}) => (
  <div>
    <div className="flex items-center justify-between mb-0.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="text-[8px] font-mono text-muted-foreground">{value}{unit}</span>
    </div>
    <Slider value={[value]} min={min} max={max} className="w-full" />
  </div>
);
