// Keyframe animation engine — property curves with bezier interpolation
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Plus, Diamond, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Keyframe {
  time: number;
  value: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface AnimatedProperty {
  name: string;
  keyframes: Keyframe[];
  min: number;
  max: number;
  unit: string;
  color: string;
  expanded: boolean;
}

interface VideoKeyframeEngineProps {
  currentTime: number;
  duration: number;
  clipName: string;
  className?: string;
}

const DEFAULT_PROPERTIES: AnimatedProperty[] = [
  { name: 'Opacity', keyframes: [
    { time: 0, value: 100, easing: 'ease-in-out' },
    { time: 5, value: 100, easing: 'linear' },
  ], min: 0, max: 100, unit: '%', color: 'hsl(193, 100%, 50%)', expanded: true },
  { name: 'Scale', keyframes: [
    { time: 0, value: 100, easing: 'ease-out' },
  ], min: 0, max: 300, unit: '%', color: 'hsl(270, 100%, 70%)', expanded: false },
  { name: 'Position X', keyframes: [], min: -1920, max: 1920, unit: 'px', color: 'hsl(150, 100%, 60%)', expanded: false },
  { name: 'Position Y', keyframes: [], min: -1080, max: 1080, unit: 'px', color: 'hsl(30, 100%, 65%)', expanded: false },
  { name: 'Rotation', keyframes: [], min: -360, max: 360, unit: '°', color: 'hsl(300, 100%, 75%)', expanded: false },
];

export const VideoKeyframeEngine: React.FC<VideoKeyframeEngineProps> = ({
  currentTime, duration, clipName, className,
}) => {
  const [properties, setProperties] = useState<AnimatedProperty[]>(DEFAULT_PROPERTIES);

  const toggleExpand = (idx: number) => {
    setProperties(prev => prev.map((p, i) => i === idx ? { ...p, expanded: !p.expanded } : p));
  };

  const addKeyframe = (propIdx: number) => {
    setProperties(prev => prev.map((p, i) => {
      if (i !== propIdx) return p;
      const existing = p.keyframes.find(k => Math.abs(k.time - currentTime) < 0.1);
      if (existing) return p;
      const value = interpolateValue(p.keyframes, currentTime, p.min, p.max);
      return {
        ...p,
        keyframes: [...p.keyframes, { time: currentTime, value, easing: 'ease-in-out' as const }]
          .sort((a, b) => a.time - b.time),
      };
    }));
  };

  const removeKeyframe = (propIdx: number, kfIdx: number) => {
    setProperties(prev => prev.map((p, i) =>
      i === propIdx ? { ...p, keyframes: p.keyframes.filter((_, ki) => ki !== kfIdx) } : p
    ));
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="px-3 py-1.5 border-b border-border/20 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Keyframes — {clipName}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {properties.map((prop, pi) => (
          <div key={prop.name} className="border-b border-border/10">
            {/* Property header */}
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-muted/10 cursor-pointer"
              onClick={() => toggleExpand(pi)}
            >
              {prop.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prop.color }} />
              <span className="text-[10px] font-medium flex-1">{prop.name}</span>
              <Badge variant="outline" className="text-[7px] h-3.5 px-1">
                {prop.keyframes.length} kf
              </Badge>
              <Button
                variant="ghost" size="icon" className="w-4 h-4"
                onClick={e => { e.stopPropagation(); addKeyframe(pi); }}
                title="Add keyframe at current time"
              >
                <Diamond className="w-3 h-3" />
              </Button>
            </div>

            {/* Expanded: curve visualization + keyframe list */}
            {prop.expanded && (
              <div className="px-2 pb-2">
                <KeyframeCurve
                  keyframes={prop.keyframes}
                  duration={duration}
                  currentTime={currentTime}
                  color={prop.color}
                  min={prop.min}
                  max={prop.max}
                />

                {/* Keyframe list */}
                {prop.keyframes.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {prop.keyframes.map((kf, ki) => (
                      <div key={ki} className="flex items-center gap-1 text-[9px]">
                        <Diamond className="w-2.5 h-2.5 shrink-0" style={{ color: prop.color }} />
                        <span className="text-muted-foreground w-10">{kf.time.toFixed(1)}s</span>
                        <span className="font-mono w-12">{kf.value.toFixed(0)}{prop.unit}</span>
                        <span className="text-muted-foreground/50 flex-1">{kf.easing}</span>
                        <Button
                          variant="ghost" size="icon" className="w-3.5 h-3.5 text-destructive/50 hover:text-destructive"
                          onClick={() => removeKeyframe(pi, ki)}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {prop.keyframes.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/50 text-center py-1">No keyframes</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Interpolate value at time t from keyframes
function interpolateValue(keyframes: Keyframe[], t: number, min: number, max: number): number {
  if (keyframes.length === 0) return (min + max) / 2;
  if (keyframes.length === 1) return keyframes[0].value;
  if (t <= keyframes[0].time) return keyframes[0].value;
  if (t >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1].value;

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      const progress = (t - keyframes[i].time) / (keyframes[i + 1].time - keyframes[i].time);
      return keyframes[i].value + (keyframes[i + 1].value - keyframes[i].value) * progress;
    }
  }
  return keyframes[0].value;
}

// SVG keyframe curve mini visualization
const KeyframeCurve: React.FC<{
  keyframes: Keyframe[];
  duration: number;
  currentTime: number;
  color: string;
  min: number;
  max: number;
}> = ({ keyframes, duration, currentTime, color, min, max }) => {
  const w = 220;
  const h = 36;
  const pad = 4;

  const toX = (t: number) => pad + ((t / duration) * (w - pad * 2));
  const toY = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);

  // Generate curve points
  const points: string[] = [];
  if (keyframes.length > 0) {
    for (let x = 0; x <= w; x++) {
      const t = (x / w) * duration;
      const v = interpolateValue(keyframes, t, min, max);
      points.push(`${x},${toY(v)}`);
    }
  }

  return (
    <svg width={w} height={h} className="w-full rounded bg-muted/10">
      {/* Grid */}
      <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="hsla(220, 15%, 18%, 0.3)" strokeWidth={0.5} />

      {/* Curve */}
      {points.length > 0 && (
        <>
          <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.2} opacity={0.7} />
          <polygon points={`${pad},${h - pad} ${points.join(' ')} ${w - pad},${h - pad}`} fill={color} opacity={0.05} />
        </>
      )}

      {/* Keyframe diamonds */}
      {keyframes.map((kf, i) => (
        <g key={i} transform={`translate(${toX(kf.time)}, ${toY(kf.value)})`}>
          <rect x={-3} y={-3} width={6} height={6} fill={color} transform="rotate(45)" opacity={0.8} />
        </g>
      ))}

      {/* Current time indicator */}
      <line x1={toX(currentTime)} y1={0} x2={toX(currentTime)} y2={h} stroke="hsl(193, 100%, 50%)" strokeWidth={0.8} opacity={0.5} />
    </svg>
  );
};
