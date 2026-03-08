import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface PostProcessingSettings {
  // Bloom
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;
  // SSAO
  ssaoEnabled: boolean;
  ssaoIntensity: number;
  ssaoRadius: number;
  ssaoBias: number;
  // Depth of Field
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;
  // Vignette
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  vignetteOffset: number;
  // Chromatic Aberration
  chromaticEnabled: boolean;
  chromaticOffset: number;
  // Tone Mapping
  toneMapping: 'aces' | 'reinhard' | 'cineon' | 'linear' | 'agx';
  exposure: number;
  // Shadows
  shadowMapSize: number;
  shadowBias: number;
  shadowNormalBias: number;
  // Ambient
  ambientIntensity: number;
  // Color Grading
  saturation: number;
  contrast: number;
  brightness: number;
}

export const defaultPostProcessing: PostProcessingSettings = {
  bloomEnabled: true,
  bloomIntensity: 0.5,
  bloomThreshold: 0.8,
  bloomRadius: 0.6,
  ssaoEnabled: true,
  ssaoIntensity: 1.0,
  ssaoRadius: 0.2,
  ssaoBias: 0.025,
  dofEnabled: false,
  dofFocusDistance: 5,
  dofFocalLength: 0.05,
  dofBokehScale: 3,
  vignetteEnabled: false,
  vignetteIntensity: 0.5,
  vignetteOffset: 0.3,
  chromaticEnabled: false,
  chromaticOffset: 0.002,
  toneMapping: 'aces',
  exposure: 1.0,
  shadowMapSize: 2048,
  shadowBias: -0.0001,
  shadowNormalBias: 0.02,
  ambientIntensity: 0.3,
  saturation: 1.0,
  contrast: 1.0,
  brightness: 1.0,
};

interface RenderSettingsProps {
  settings: PostProcessingSettings;
  onChange: (settings: PostProcessingSettings) => void;
}

function EffectSection({ title, enabled, onToggle, children, badge }: {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-foreground">{title}</Label>
          {badge && <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">{badge}</Badge>}
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} className="scale-75" />
      </div>
      {enabled && <div className="space-y-2 pl-1">{children}</div>}
    </div>
  );
}

function SliderRow({ label, value, onChange, min = 0, max = 1, step = 0.01, suffix }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {value.toFixed(step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3)}{suffix || ''}
        </span>
      </div>
      <Slider
        value={[value]} onValueChange={([v]) => onChange(v)}
        min={min} max={max} step={step}
        className="h-4"
      />
    </div>
  );
}

export function RenderSettingsPanel({ settings, onChange }: RenderSettingsProps) {
  const update = (patch: Partial<PostProcessingSettings>) => onChange({ ...settings, ...patch });

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Render Pipeline</div>

        {/* Tone Mapping & Exposure */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Tone Mapping</Label>
          <Select value={settings.toneMapping} onValueChange={v => update({ toneMapping: v as any })}>
            <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aces">ACES Filmic</SelectItem>
              <SelectItem value="reinhard">Reinhard</SelectItem>
              <SelectItem value="cineon">Cineon</SelectItem>
              <SelectItem value="agx">AgX</SelectItem>
              <SelectItem value="linear">Linear (None)</SelectItem>
            </SelectContent>
          </Select>
          <SliderRow label="Exposure" value={settings.exposure} onChange={v => update({ exposure: v })} min={0.1} max={4} step={0.05} suffix="×" />
        </div>

        <Separator className="bg-border/20" />

        {/* Bloom */}
        <EffectSection title="Bloom" enabled={settings.bloomEnabled} onToggle={v => update({ bloomEnabled: v })} badge="HDR">
          <SliderRow label="Intensity" value={settings.bloomIntensity} onChange={v => update({ bloomIntensity: v })} max={3} step={0.05} />
          <SliderRow label="Threshold" value={settings.bloomThreshold} onChange={v => update({ bloomThreshold: v })} />
          <SliderRow label="Radius" value={settings.bloomRadius} onChange={v => update({ bloomRadius: v })} />
        </EffectSection>

        <Separator className="bg-border/20" />

        {/* SSAO */}
        <EffectSection title="Ambient Occlusion" enabled={settings.ssaoEnabled} onToggle={v => update({ ssaoEnabled: v })} badge="SSAO">
          <SliderRow label="Intensity" value={settings.ssaoIntensity} onChange={v => update({ ssaoIntensity: v })} max={3} step={0.05} />
          <SliderRow label="Radius" value={settings.ssaoRadius} onChange={v => update({ ssaoRadius: v })} max={1} step={0.01} />
          <SliderRow label="Bias" value={settings.ssaoBias} onChange={v => update({ ssaoBias: v })} max={0.1} step={0.001} />
        </EffectSection>

        <Separator className="bg-border/20" />

        {/* Depth of Field */}
        <EffectSection title="Depth of Field" enabled={settings.dofEnabled} onToggle={v => update({ dofEnabled: v })} badge="DOF">
          <SliderRow label="Focus Distance" value={settings.dofFocusDistance} onChange={v => update({ dofFocusDistance: v })} max={30} step={0.5} suffix="m" />
          <SliderRow label="Focal Length" value={settings.dofFocalLength} onChange={v => update({ dofFocalLength: v })} max={0.2} step={0.005} />
          <SliderRow label="Bokeh Scale" value={settings.dofBokehScale} onChange={v => update({ dofBokehScale: v })} max={10} step={0.5} />
        </EffectSection>

        <Separator className="bg-border/20" />

        {/* Vignette */}
        <EffectSection title="Vignette" enabled={settings.vignetteEnabled} onToggle={v => update({ vignetteEnabled: v })}>
          <SliderRow label="Intensity" value={settings.vignetteIntensity} onChange={v => update({ vignetteIntensity: v })} />
          <SliderRow label="Offset" value={settings.vignetteOffset} onChange={v => update({ vignetteOffset: v })} />
        </EffectSection>

        <Separator className="bg-border/20" />

        {/* Chromatic Aberration */}
        <EffectSection title="Chromatic Aberration" enabled={settings.chromaticEnabled} onToggle={v => update({ chromaticEnabled: v })}>
          <SliderRow label="Offset" value={settings.chromaticOffset} onChange={v => update({ chromaticOffset: v })} max={0.02} step={0.0005} />
        </EffectSection>

        <Separator className="bg-border/20" />

        {/* Color Grading */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Color Grading</Label>
          <SliderRow label="Saturation" value={settings.saturation} onChange={v => update({ saturation: v })} max={2} step={0.05} />
          <SliderRow label="Contrast" value={settings.contrast} onChange={v => update({ contrast: v })} max={2} step={0.05} />
          <SliderRow label="Brightness" value={settings.brightness} onChange={v => update({ brightness: v })} max={2} step={0.05} />
        </div>

        <Separator className="bg-border/20" />

        {/* Shadow Quality */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Shadow Quality</Label>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Shadow Map</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{settings.shadowMapSize}px</span>
            </div>
            <Select value={String(settings.shadowMapSize)} onValueChange={v => update({ shadowMapSize: Number(v) })}>
              <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512">512 (Low)</SelectItem>
                <SelectItem value="1024">1024 (Medium)</SelectItem>
                <SelectItem value="2048">2048 (High)</SelectItem>
                <SelectItem value="4096">4096 (Ultra)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SliderRow label="Shadow Bias" value={settings.shadowBias} onChange={v => update({ shadowBias: v })} min={-0.001} max={0} step={0.00005} />
          <SliderRow label="Normal Bias" value={settings.shadowNormalBias} onChange={v => update({ shadowNormalBias: v })} max={0.1} step={0.005} />
        </div>

        <Separator className="bg-border/20" />

        {/* Ambient */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Ambient Light</Label>
          <SliderRow label="Intensity" value={settings.ambientIntensity} onChange={v => update({ ambientIntensity: v })} max={2} step={0.05} />
        </div>
      </div>
    </ScrollArea>
  );
}
