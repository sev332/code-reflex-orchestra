// Phase 7 — Scene Management & World Building
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
import { FolderOpen, Plus, Trash2, Eye, EyeOff, Lock, Unlock, Save, Cloud, Sun, Layers } from 'lucide-react';

// ─── Types ─────────────────────────────────────────

export interface SceneLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  objectIds: string[];
}

export interface Prefab {
  id: string;
  name: string;
  category: string;
  objectData: any[]; // serialized SceneObjects
  thumbnail: string;
  createdAt: number;
}

export interface FogConfig {
  enabled: boolean;
  type: 'linear' | 'exponential' | 'height';
  color: string;
  near: number;
  far: number;
  density: number;
  heightMin: number;
  heightMax: number;
}

export interface SkyConfig {
  enabled: boolean;
  type: 'procedural' | 'hdri' | 'color';
  sunPosition: [number, number, number];
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  elevation: number;
  azimuth: number;
  backgroundColor: string;
}

export const defaultFog: FogConfig = {
  enabled: false,
  type: 'exponential',
  color: '#8899aa',
  near: 10,
  far: 50,
  density: 0.02,
  heightMin: 0,
  heightMax: 10,
};

export const defaultSky: SkyConfig = {
  enabled: true,
  type: 'procedural',
  sunPosition: [100, 50, 100],
  turbidity: 8,
  rayleigh: 2,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  elevation: 45,
  azimuth: 180,
  backgroundColor: '#0a0a1a',
};

const layerColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8844', '#8844ff'];

interface SceneManagerPanelProps {
  layers: SceneLayer[];
  onLayersChange: (layers: SceneLayer[]) => void;
  prefabs: Prefab[];
  onPrefabsChange: (prefabs: Prefab[]) => void;
  onInstantiatePrefab: (prefab: Prefab) => void;
  fog: FogConfig;
  onFogChange: (fog: FogConfig) => void;
  sky: SkyConfig;
  onSkyChange: (sky: SkyConfig) => void;
  selectedObjectId: string | null;
  onSaveAsPrefab: () => void;
}

export function SceneManagerPanel({
  layers, onLayersChange, prefabs, onPrefabsChange,
  onInstantiatePrefab, fog, onFogChange, sky, onSkyChange,
  selectedObjectId, onSaveAsPrefab,
}: SceneManagerPanelProps) {

  const addLayer = () => {
    const newLayer: SceneLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      color: layerColors[layers.length % layerColors.length],
      objectIds: [],
    };
    onLayersChange([...layers, newLayer]);
  };

  const updateLayer = (id: string, updates: Partial<SceneLayer>) => {
    onLayersChange(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLayer = (id: string) => {
    onLayersChange(layers.filter(l => l.id !== id));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Scene Manager</div>

        {/* Layers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-foreground/60">LAYERS</Label>
            <Button variant="ghost" size="icon" onClick={addLayer} className="w-5 h-5">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center gap-1 rounded px-1.5 py-1 bg-muted/20">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
              <Input value={layer.name}
                onChange={e => updateLayer(layer.id, { name: e.target.value })}
                className="h-5 text-[9px] bg-transparent border-0 px-1 flex-1" />
              <Button variant="ghost" size="icon"
                onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                className="w-4 h-4">
                {layer.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
              </Button>
              <Button variant="ghost" size="icon"
                onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                className="w-4 h-4">
                {layer.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </Button>
              <Button variant="ghost" size="icon"
                onClick={() => removeLayer(layer.id)}
                className="w-4 h-4 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </div>
          ))}
          {layers.length === 0 && (
            <p className="text-[9px] text-muted-foreground text-center py-1">No layers</p>
          )}
        </div>

        <Separator className="bg-border/20" />

        {/* Prefabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-foreground/60">PREFABS</Label>
            <Button variant="ghost" size="sm" onClick={onSaveAsPrefab}
              disabled={!selectedObjectId}
              className="h-5 text-[9px] px-1.5 gap-0.5">
              <Save className="w-2.5 h-2.5" /> Save
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {prefabs.map(prefab => (
              <Button key={prefab.id} variant="outline" size="sm"
                onClick={() => onInstantiatePrefab(prefab)}
                className="h-auto p-2 flex flex-col items-center gap-1 text-[9px]">
                <span className="text-lg">{prefab.thumbnail}</span>
                <span className="truncate w-full text-center">{prefab.name}</span>
              </Button>
            ))}
          </div>
          {prefabs.length === 0 && (
            <p className="text-[9px] text-muted-foreground text-center py-1">No prefabs saved</p>
          )}
        </div>

        <Separator className="bg-border/20" />

        {/* Fog */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-foreground/60">FOG</Label>
            <Switch checked={fog.enabled} onCheckedChange={v => onFogChange({ ...fog, enabled: v })} className="scale-75" />
          </div>
          {fog.enabled && (
            <>
              <Select value={fog.type} onValueChange={(v: any) => onFogChange({ ...fog, type: v })}>
                <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="height">Height-based</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Color</span>
                <input type="color" value={fog.color}
                  onChange={e => onFogChange({ ...fog, color: e.target.value })}
                  className="w-8 h-6 rounded border border-border/30 cursor-pointer" />
              </div>
              {fog.type === 'linear' && (
                <>
                  {[
                    { label: 'Near', key: 'near' as const, min: 0, max: 100, step: 1 },
                    { label: 'Far', key: 'far' as const, min: 10, max: 200, step: 1 },
                  ].map(({ label, key, min, max, step }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{fog[key]}</span>
                      </div>
                      <Slider value={[fog[key]]} onValueChange={([v]) => onFogChange({ ...fog, [key]: v })}
                        min={min} max={max} step={step} />
                    </div>
                  ))}
                </>
              )}
              {fog.type === 'exponential' && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground">Density</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{fog.density.toFixed(3)}</span>
                  </div>
                  <Slider value={[fog.density]} onValueChange={([v]) => onFogChange({ ...fog, density: v })}
                    min={0.001} max={0.2} step={0.001} />
                </div>
              )}
            </>
          )}
        </div>

        <Separator className="bg-border/20" />

        {/* Sky */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-foreground/60">SKY</Label>
            <Switch checked={sky.enabled} onCheckedChange={v => onSkyChange({ ...sky, enabled: v })} className="scale-75" />
          </div>
          {sky.enabled && (
            <>
              <Select value={sky.type} onValueChange={(v: any) => onSkyChange({ ...sky, type: v })}>
                <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedural">Procedural</SelectItem>
                  <SelectItem value="hdri">HDRI</SelectItem>
                  <SelectItem value="color">Solid Color</SelectItem>
                </SelectContent>
              </Select>
              {sky.type === 'procedural' && (
                <>
                  {[
                    { label: 'Elevation', key: 'elevation' as const, min: -10, max: 90, step: 1 },
                    { label: 'Azimuth', key: 'azimuth' as const, min: 0, max: 360, step: 1 },
                    { label: 'Turbidity', key: 'turbidity' as const, min: 1, max: 20, step: 0.5 },
                    { label: 'Rayleigh', key: 'rayleigh' as const, min: 0, max: 4, step: 0.1 },
                  ].map(({ label, key, min, max, step }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{sky[key]}</span>
                      </div>
                      <Slider value={[sky[key]]} onValueChange={([v]) => onSkyChange({ ...sky, [key]: v })}
                        min={min} max={max} step={step} />
                    </div>
                  ))}
                </>
              )}
              {sky.type === 'color' && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Background</span>
                  <input type="color" value={sky.backgroundColor}
                    onChange={e => onSkyChange({ ...sky, backgroundColor: e.target.value })}
                    className="w-8 h-6 rounded border border-border/30 cursor-pointer" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
