// Procedural Geometry Tools Panel for 3D Studio
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mountain, Layers, Box, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  terrainPresets, defaultTerrainConfig, proceduralDefaults,
  type TerrainConfig, type ProceduralConfig,
} from '@/lib/3d-engine/terrain-generator';

interface ProceduralToolsProps {
  onAddTerrain: (config: TerrainConfig) => void;
  onAddProcedural: (config: ProceduralConfig) => void;
}

function SliderRow({ label, value, onChange, min = 0, max = 1, step = 0.01, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{value.toFixed(step >= 1 ? 0 : 2)}{suffix || ''}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  );
}

export function ProceduralToolsPanel({ onAddTerrain, onAddProcedural }: ProceduralToolsProps) {
  const [terrainConfig, setTerrainConfig] = useState<TerrainConfig>(defaultTerrainConfig);

  const updateTerrain = (patch: Partial<TerrainConfig>) => setTerrainConfig(prev => ({ ...prev, ...patch }));

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
          <Mountain className="w-3 h-3" /> Procedural Tools
        </div>

        {/* Terrain Presets */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">TERRAIN PRESETS</Label>
          <div className="grid grid-cols-3 gap-1">
            {terrainPresets.map(p => (
              <button key={p.id}
                className="rounded border border-border/30 p-1.5 hover:border-primary/50 hover:bg-muted/20 transition-all text-center"
                onClick={() => {
                  const cfg = { ...defaultTerrainConfig, ...p.config };
                  setTerrainConfig(cfg);
                  onAddTerrain(cfg);
                }}>
                <div className="text-lg">{p.thumbnail}</div>
                <div className="text-[8px] text-foreground truncate">{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/20" />

        {/* Terrain Config */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">TERRAIN PARAMETERS</Label>
          <SliderRow label="Width" value={terrainConfig.width} onChange={v => updateTerrain({ width: v })} min={5} max={50} step={1} suffix="m" />
          <SliderRow label="Depth" value={terrainConfig.depth} onChange={v => updateTerrain({ depth: v })} min={5} max={50} step={1} suffix="m" />
          <SliderRow label="Resolution" value={terrainConfig.resolution} onChange={v => updateTerrain({ resolution: v })} min={1} max={8} step={1} suffix="/m" />
          <SliderRow label="Height Scale" value={terrainConfig.heightScale} onChange={v => updateTerrain({ heightScale: v })} min={0.1} max={10} step={0.1} />
          <SliderRow label="Octaves" value={terrainConfig.octaves} onChange={v => updateTerrain({ octaves: v })} min={1} max={10} step={1} />
          <SliderRow label="Lacunarity" value={terrainConfig.lacunarity} onChange={v => updateTerrain({ lacunarity: v })} min={1} max={4} step={0.1} />
          <SliderRow label="Gain" value={terrainConfig.gain} onChange={v => updateTerrain({ gain: v })} min={0.1} max={0.9} step={0.05} />
          <SliderRow label="Seed" value={terrainConfig.seed} onChange={v => updateTerrain({ seed: v })} min={0} max={999} step={1} />
          <SliderRow label="Erosion" value={terrainConfig.erosionStrength} onChange={v => updateTerrain({ erosionStrength: v })} max={1} />
          <SliderRow label="Water Level" value={terrainConfig.waterLevel} onChange={v => updateTerrain({ waterLevel: v })} max={1} />

          <Button variant="default" size="sm" className="w-full h-7 text-[10px] gap-1"
            onClick={() => onAddTerrain(terrainConfig)}>
            <Mountain className="w-3 h-3" /> Generate Terrain
          </Button>
        </div>

        <Separator className="bg-border/20" />

        {/* Procedural Shapes */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">PROCEDURAL SHAPES</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(proceduralDefaults).map(([key, config]) => (
              <button key={key}
                className="rounded border border-border/30 p-2 hover:border-primary/50 hover:bg-muted/20 transition-all text-center"
                onClick={() => onAddProcedural(config)}>
                <Box className="w-4 h-4 mx-auto mb-1 text-primary/60" />
                <div className="text-[9px] font-medium text-foreground capitalize">{key}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
