// Node-based effects chain — EQ, Reverb, Compressor, Delay, Chorus
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Plus, X, ChevronDown, ChevronUp, Power, GripVertical,
  Activity, Waves, Gauge, Timer, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EffectParam {
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}

interface AudioEffect {
  id: string;
  type: 'eq' | 'reverb' | 'compressor' | 'delay' | 'chorus' | 'distortion';
  name: string;
  enabled: boolean;
  expanded: boolean;
  params: EffectParam[];
}

const EFFECT_PRESETS: Record<string, { name: string; icon: React.ReactNode; params: EffectParam[] }> = {
  eq: {
    name: 'Parametric EQ',
    icon: <Activity className="w-3 h-3" />,
    params: [
      { name: 'Low', value: 0, min: -12, max: 12, unit: 'dB' },
      { name: 'Low-Mid', value: 0, min: -12, max: 12, unit: 'dB' },
      { name: 'Mid', value: 0, min: -12, max: 12, unit: 'dB' },
      { name: 'Hi-Mid', value: 2, min: -12, max: 12, unit: 'dB' },
      { name: 'High', value: 1, min: -12, max: 12, unit: 'dB' },
    ],
  },
  reverb: {
    name: 'Reverb',
    icon: <Waves className="w-3 h-3" />,
    params: [
      { name: 'Size', value: 50, min: 0, max: 100, unit: '%' },
      { name: 'Decay', value: 2.5, min: 0.1, max: 10, unit: 's' },
      { name: 'Damping', value: 60, min: 0, max: 100, unit: '%' },
      { name: 'Mix', value: 25, min: 0, max: 100, unit: '%' },
    ],
  },
  compressor: {
    name: 'Compressor',
    icon: <Gauge className="w-3 h-3" />,
    params: [
      { name: 'Threshold', value: -18, min: -60, max: 0, unit: 'dB' },
      { name: 'Ratio', value: 4, min: 1, max: 20, unit: ':1' },
      { name: 'Attack', value: 10, min: 0.1, max: 100, unit: 'ms' },
      { name: 'Release', value: 100, min: 10, max: 1000, unit: 'ms' },
      { name: 'Gain', value: 3, min: 0, max: 24, unit: 'dB' },
    ],
  },
  delay: {
    name: 'Delay',
    icon: <Timer className="w-3 h-3" />,
    params: [
      { name: 'Time', value: 250, min: 1, max: 2000, unit: 'ms' },
      { name: 'Feedback', value: 40, min: 0, max: 95, unit: '%' },
      { name: 'Mix', value: 20, min: 0, max: 100, unit: '%' },
    ],
  },
  chorus: {
    name: 'Chorus',
    icon: <Sparkles className="w-3 h-3" />,
    params: [
      { name: 'Rate', value: 1.5, min: 0.1, max: 10, unit: 'Hz' },
      { name: 'Depth', value: 50, min: 0, max: 100, unit: '%' },
      { name: 'Mix', value: 30, min: 0, max: 100, unit: '%' },
    ],
  },
};

interface AudioEffectsChainProps {
  trackName: string;
  className?: string;
}

export const AudioEffectsChain: React.FC<AudioEffectsChainProps> = ({ trackName, className }) => {
  const [effects, setEffects] = useState<AudioEffect[]>([
    { id: '1', type: 'eq', ...EFFECT_PRESETS.eq, enabled: true, expanded: true },
    { id: '2', type: 'compressor', ...EFFECT_PRESETS.compressor, enabled: true, expanded: false },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addEffect = (type: string) => {
    const preset = EFFECT_PRESETS[type];
    if (!preset) return;
    setEffects(prev => [...prev, {
      id: crypto.randomUUID(),
      type: type as AudioEffect['type'],
      ...preset,
      params: preset.params.map(p => ({ ...p })),
      enabled: true,
      expanded: true,
    }]);
    setShowAddMenu(false);
  };

  const removeEffect = (id: string) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  };

  const updateParam = (effectId: string, paramIdx: number, value: number) => {
    setEffects(prev => prev.map(e => {
      if (e.id !== effectId) return e;
      const params = [...e.params];
      params[paramIdx] = { ...params[paramIdx], value };
      return { ...e, params };
    }));
  };

  const toggleEffect = (id: string, key: 'enabled' | 'expanded') => {
    setEffects(prev => prev.map(e => e.id === id ? { ...e, [key]: !e[key] } : e));
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          FX Chain — {trackName}
        </span>
        <Button
          variant="ghost" size="icon" className="w-5 h-5"
          onClick={() => setShowAddMenu(v => !v)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Add menu */}
      {showAddMenu && (
        <div className="p-2 border-b border-border/20 bg-muted/10 flex flex-wrap gap-1">
          {Object.entries(EFFECT_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-6 text-[10px] gap-1"
              onClick={() => addEffect(key)}
            >
              {preset.icon} {preset.name}
            </Button>
          ))}
        </div>
      )}

      {/* Effects list */}
      <div className="flex-1 overflow-auto">
        {effects.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <Waves className="w-6 h-6 mx-auto mb-1 opacity-30" />
            <p className="text-[10px]">No effects. Click + to add.</p>
          </div>
        )}

        {effects.map((effect, idx) => (
          <div key={effect.id} className={cn('border-b border-border/10', !effect.enabled && 'opacity-40')}>
            {/* Header */}
            <div className="flex items-center gap-1 px-2 py-1 hover:bg-muted/10">
              <GripVertical className="w-3 h-3 text-muted-foreground/30 cursor-grab" />
              <Button
                variant="ghost" size="icon" className="w-4 h-4"
                onClick={() => toggleEffect(effect.id, 'enabled')}
              >
                <Power className={cn('w-3 h-3', effect.enabled ? 'text-wisdom-data-flow' : 'text-muted-foreground')} />
              </Button>
              <span className="text-[10px] font-medium flex-1">{EFFECT_PRESETS[effect.type]?.icon} {effect.name}</span>
              <Badge variant="outline" className="text-[7px] h-3.5 px-1">{idx + 1}</Badge>
              <Button variant="ghost" size="icon" className="w-4 h-4" onClick={() => toggleEffect(effect.id, 'expanded')}>
                {effect.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-4 h-4 text-destructive/60 hover:text-destructive" onClick={() => removeEffect(effect.id)}>
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Params */}
            {effect.expanded && (
              <div className="px-3 pb-2 space-y-1.5">
                {effect.type === 'eq' && (
                  <EQVisualization params={effect.params} color="hsl(var(--primary))" />
                )}
                {effect.params.map((param, pi) => (
                  <div key={param.name} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-14 shrink-0">{param.name}</span>
                    <Slider
                      value={[param.value]}
                      min={param.min}
                      max={param.max}
                      step={(param.max - param.min) > 100 ? 1 : 0.1}
                      className="flex-1"
                      onValueChange={([v]) => updateParam(effect.id, pi, v)}
                    />
                    <span className="text-[8px] font-mono text-muted-foreground w-12 text-right">
                      {typeof param.value === 'number' ? (Number.isInteger(param.value) ? param.value : param.value.toFixed(1)) : param.value}{param.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Mini EQ curve visualization
const EQVisualization: React.FC<{ params: EffectParam[]; color: string }> = ({ params, color }) => {
  const w = 200;
  const h = 40;
  const midY = h / 2;

  // Generate curve points
  const points: string[] = [];
  const bands = params.length;
  for (let x = 0; x <= w; x++) {
    let y = midY;
    for (let b = 0; b < bands; b++) {
      const centerX = ((b + 0.5) / bands) * w;
      const dist = Math.abs(x - centerX);
      const sigma = w / (bands * 1.5);
      const gain = params[b].value;
      y -= gain * 1.5 * Math.exp(-(dist * dist) / (2 * sigma * sigma));
    }
    points.push(`${x},${y}`);
  }

  return (
    <svg width={w} height={h} className="w-full mb-1 rounded bg-muted/10">
      {/* Grid */}
      <line x1={0} y1={midY} x2={w} y2={midY} stroke="hsla(220, 15%, 18%, 0.5)" strokeWidth={0.5} />
      {/* Curve */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.8}
      />
      {/* Fill under curve */}
      <polygon
        points={`0,${midY} ${points.join(' ')} ${w},${midY}`}
        fill={color}
        opacity={0.08}
      />
      {/* Band markers */}
      {params.map((p, i) => {
        const cx = ((i + 0.5) / bands) * w;
        return (
          <circle
            key={i}
            cx={cx}
            cy={midY - p.value * 1.5}
            r={2.5}
            fill={color}
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
};
