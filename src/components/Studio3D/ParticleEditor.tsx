// Particle Editor Panel for 3D Studio
import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Trash2, Sparkles, ChevronDown, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParticleEmitterConfig, EmitterShape } from '@/lib/3d-engine/particle-system';
import {
  particlePresets, particleCategories, createEmitter, defaultEmitterConfig,
} from '@/lib/3d-engine/particle-system';

interface ParticleEditorProps {
  emitters: ParticleEmitterConfig[];
  onEmittersChange: (emitters: ParticleEmitterConfig[]) => void;
  selectedEmitterId: string | null;
  onSelectEmitter: (id: string | null) => void;
}

function RangeSlider({ label, value, onChange, min = 0, max = 10, step = 0.1 }: {
  label: string; value: [number, number]; onChange: (v: [number, number]) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{value[0].toFixed(1)} – {value[1].toFixed(1)}</span>
      </div>
      <div className="flex gap-1">
        <Slider value={[value[0]]} onValueChange={([v]) => onChange([v, Math.max(v, value[1])])} min={min} max={max} step={step} className="flex-1" />
        <Slider value={[value[1]]} onValueChange={([v]) => onChange([Math.min(value[0], v), v])} min={min} max={max} step={step} className="flex-1" />
      </div>
    </div>
  );
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

export function ParticleEditorPanel({ emitters, onEmittersChange, selectedEmitterId, onSelectEmitter }: ParticleEditorProps) {
  const [presetSearch, setPresetSearch] = useState('');
  const [presetCategory, setPresetCategory] = useState('All');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['emission', 'lifetime', 'velocity', 'size', 'color']));

  const selected = emitters.find(e => e.id === selectedEmitterId);

  const toggleSection = (s: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const updateEmitter = (id: string, patch: Partial<ParticleEmitterConfig>) => {
    onEmittersChange(emitters.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const addEmitterFromPreset = (presetId?: string) => {
    const emitter = createEmitter(presetId);
    onEmittersChange([...emitters, emitter]);
    onSelectEmitter(emitter.id);
  };

  const removeEmitter = (id: string) => {
    onEmittersChange(emitters.filter(e => e.id !== id));
    if (selectedEmitterId === id) onSelectEmitter(null);
  };

  const filteredPresets = useMemo(() => {
    return particlePresets.filter(p => {
      if (presetCategory !== 'All' && p.category !== presetCategory) return false;
      if (presetSearch && !p.name.toLowerCase().includes(presetSearch.toLowerCase())) return false;
      return true;
    });
  }, [presetCategory, presetSearch]);

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <button
      className="flex items-center gap-1 w-full text-left py-0.5"
      onClick={() => toggleSection(id)}
    >
      {expandedSections.has(id) ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
      <Label className="text-[10px] font-medium text-foreground/60 uppercase tracking-wider cursor-pointer">{title}</Label>
    </button>
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Particle System
        </div>

        {/* Emitter list */}
        <div className="space-y-1">
          {emitters.map(em => (
            <div
              key={em.id}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[10px] cursor-pointer transition-colors',
                selectedEmitterId === em.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted/30'
              )}
              onClick={() => onSelectEmitter(em.id)}
            >
              <button onClick={e => { e.stopPropagation(); updateEmitter(em.id, { enabled: !em.enabled }); }}
                className="shrink-0">
                {em.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
              </button>
              <span className="flex-1 truncate font-medium">{em.name}</span>
              <Badge variant="outline" className="text-[8px] px-1 py-0 border-border/30">{em.maxParticles}</Badge>
              <button onClick={e => { e.stopPropagation(); removeEmitter(em.id); }}
                className="shrink-0 hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-6 text-[10px] gap-1 border-dashed border-border/30"
            onClick={() => addEmitterFromPreset()}>
            <Plus className="w-3 h-3" /> Add Emitter
          </Button>
        </div>

        <Separator className="bg-border/20" />

        {/* Presets */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-foreground/60 uppercase tracking-wider">Presets</div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input value={presetSearch} onChange={e => setPresetSearch(e.target.value)}
              placeholder="Search presets..." className="h-6 text-[10px] pl-7 bg-muted/30 border-border/30" />
          </div>
          <div className="flex flex-wrap gap-1">
            {particleCategories.map(cat => (
              <Badge key={cat} variant={presetCategory === cat ? 'default' : 'outline'}
                className={cn('text-[8px] px-1 py-0 cursor-pointer', presetCategory === cat ? 'bg-primary text-primary-foreground' : 'border-border/40')}
                onClick={() => setPresetCategory(cat)}>
                {cat}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {filteredPresets.map(p => (
              <button key={p.id}
                className="rounded border border-border/30 p-1.5 hover:border-primary/50 hover:bg-muted/20 transition-all text-center"
                onClick={() => addEmitterFromPreset(p.id)}>
                <div className="text-lg">{p.thumbnail}</div>
                <div className="text-[8px] text-foreground truncate">{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected emitter properties */}
        {selected && (
          <>
            <Separator className="bg-border/20" />

            <div className="space-y-2">
              <Input value={selected.name} onChange={e => updateEmitter(selected.id, { name: e.target.value })}
                className="h-6 text-[10px] bg-muted/30 border-border/30 font-medium" />

              {/* Emission */}
              <SectionHeader id="emission" title="Emission" />
              {expandedSections.has('emission') && (
                <div className="space-y-2 pl-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Shape</span>
                    <Select value={selected.emitterShape} onValueChange={v => updateEmitter(selected.id, { emitterShape: v as EmitterShape })}>
                      <SelectTrigger className="h-6 text-[10px] bg-muted/20 border-border/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['point', 'sphere', 'cone', 'box', 'ring'] as EmitterShape[]).map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <SliderRow label="Rate" value={selected.emissionRate} onChange={v => updateEmitter(selected.id, { emissionRate: v })} min={0} max={500} step={1} suffix="/s" />
                  <SliderRow label="Max Particles" value={selected.maxParticles} onChange={v => updateEmitter(selected.id, { maxParticles: v })} min={10} max={5000} step={10} />
                  <SliderRow label="Burst" value={selected.burst} onChange={v => updateEmitter(selected.id, { burst: v })} min={0} max={500} step={1} />
                  {(selected.emitterShape === 'sphere' || selected.emitterShape === 'ring') && (
                    <SliderRow label="Radius" value={selected.shapeRadius} onChange={v => updateEmitter(selected.id, { shapeRadius: v })} max={5} step={0.1} />
                  )}
                </div>
              )}

              {/* Lifetime */}
              <SectionHeader id="lifetime" title="Lifetime" />
              {expandedSections.has('lifetime') && (
                <div className="pl-3">
                  <RangeSlider label="Lifetime (s)" value={selected.lifetime} onChange={v => updateEmitter(selected.id, { lifetime: v })} max={20} />
                </div>
              )}

              {/* Velocity */}
              <SectionHeader id="velocity" title="Velocity" />
              {expandedSections.has('velocity') && (
                <div className="space-y-2 pl-3">
                  <RangeSlider label="Speed" value={selected.speed} onChange={v => updateEmitter(selected.id, { speed: v })} max={20} />
                  <SliderRow label="Spread" value={selected.spread} onChange={v => updateEmitter(selected.id, { spread: v })} max={Math.PI} step={0.05} />
                  <SliderRow label="Gravity Y" value={selected.gravity[1]} onChange={v => updateEmitter(selected.id, { gravity: [selected.gravity[0], v, selected.gravity[2]] })} min={-20} max={20} step={0.5} />
                  <SliderRow label="Drag" value={selected.drag} onChange={v => updateEmitter(selected.id, { drag: v })} />
                  <SliderRow label="Turbulence" value={selected.turbulence} onChange={v => updateEmitter(selected.id, { turbulence: v })} max={5} />
                </div>
              )}

              {/* Size */}
              <SectionHeader id="size" title="Size" />
              {expandedSections.has('size') && (
                <div className="space-y-2 pl-3">
                  <RangeSlider label="Start Size" value={selected.startSize} onChange={v => updateEmitter(selected.id, { startSize: v })} max={2} step={0.01} />
                  <RangeSlider label="End Size" value={selected.endSize} onChange={v => updateEmitter(selected.id, { endSize: v })} max={2} step={0.01} />
                </div>
              )}

              {/* Color */}
              <SectionHeader id="color" title="Color Over Life" />
              {expandedSections.has('color') && (
                <div className="space-y-1.5 pl-3">
                  {/* Color gradient preview */}
                  <div
                    className="h-4 rounded-sm border border-border/30"
                    style={{
                      background: `linear-gradient(to right, ${selected.colorOverLife
                        .map(s => `rgb(${s.color.map(c => Math.round(c * 255)).join(',')}) ${s.time * 100}%`)
                        .join(', ')})`,
                    }}
                  />
                  {selected.colorOverLife.map((stop, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-[8px] text-muted-foreground w-6 tabular-nums">{(stop.time * 100).toFixed(0)}%</span>
                      <input
                        type="color"
                        value={`#${stop.color.map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`}
                        onChange={e => {
                          const hex = e.target.value;
                          const r = parseInt(hex.slice(1, 3), 16) / 255;
                          const g = parseInt(hex.slice(3, 5), 16) / 255;
                          const b = parseInt(hex.slice(5, 7), 16) / 255;
                          const updated = [...selected.colorOverLife];
                          updated[i] = { ...updated[i], color: [r, g, b] };
                          updateEmitter(selected.id, { colorOverLife: updated });
                        }}
                        className="w-6 h-4 rounded border border-border/30 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Rendering */}
              <SectionHeader id="rendering" title="Rendering" />
              {expandedSections.has('rendering') && (
                <div className="space-y-2 pl-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Blend Mode</span>
                    <Select value={selected.blendMode} onValueChange={v => updateEmitter(selected.id, { blendMode: v as any })}>
                      <SelectTrigger className="h-6 text-[10px] bg-muted/20 border-border/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="additive">Additive</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="multiply">Multiply</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <SliderRow label="Opacity" value={selected.opacity} onChange={v => updateEmitter(selected.id, { opacity: v })} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
