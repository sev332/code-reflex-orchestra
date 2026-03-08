// Professional mixer panel with vertical faders and VU meters
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackMixerData {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}

interface AudioMixerPanelProps {
  tracks: TrackMixerData[];
  masterVolume: number;
  onTrackUpdate: (id: string, updates: Partial<TrackMixerData>) => void;
  onMasterVolumeChange: (v: number) => void;
}

const VUMeter: React.FC<{ level: number; color: string; muted: boolean }> = ({ level, color, muted }) => {
  const segments = 16;
  return (
    <div className="flex flex-col-reverse gap-px w-2">
      {Array.from({ length: segments }, (_, i) => {
        const threshold = (i / segments) * 100;
        const active = !muted && level > threshold;
        const isHot = i >= segments - 3;
        const isWarm = i >= segments - 6;
        return (
          <div
            key={i}
            className="h-1.5 rounded-[1px] transition-colors duration-75"
            style={{
              backgroundColor: active
                ? isHot ? 'hsl(0, 75%, 55%)' : isWarm ? 'hsl(30, 100%, 65%)' : color
                : 'hsla(220, 15%, 18%, 0.5)',
            }}
          />
        );
      })}
    </div>
  );
};

const ChannelStrip: React.FC<{
  track: TrackMixerData;
  onUpdate: (updates: Partial<TrackMixerData>) => void;
}> = ({ track, onUpdate }) => {
  // Simulate VU from volume
  const vuLevel = track.muted ? 0 : track.volume * (0.6 + Math.random() * 0.4);

  return (
    <div className="flex flex-col items-center gap-1 w-14 px-1">
      {/* Track name */}
      <span className="text-[8px] text-muted-foreground truncate w-full text-center font-medium">{track.name}</span>

      {/* Pan knob visual */}
      <div className="relative w-8 h-3 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all"
          style={{
            left: track.pan < 0 ? `${50 + track.pan / 2}%` : '50%',
            width: `${Math.abs(track.pan / 2)}%`,
            backgroundColor: track.color,
            opacity: 0.5,
          }}
        />
        <div
          className="absolute top-0.5 bottom-0.5 w-1 rounded-full bg-foreground/80"
          style={{ left: `${50 + track.pan / 2}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <Slider
        value={[track.pan]}
        min={-100}
        max={100}
        className="w-10"
        onValueChange={([v]) => onUpdate({ pan: v })}
      />

      {/* Fader + VU */}
      <div className="flex items-end gap-1 h-24">
        <VUMeter level={vuLevel} color={track.color} muted={track.muted} />
        <div className="h-full flex flex-col items-center justify-end">
          <Slider
            value={[track.volume]}
            min={0}
            max={100}
            orientation="vertical"
            className="h-20"
            onValueChange={([v]) => onUpdate({ volume: v })}
          />
        </div>
        <VUMeter level={vuLevel * 0.9} color={track.color} muted={track.muted} />
      </div>

      {/* Volume readout */}
      <span className="text-[8px] font-mono text-muted-foreground">
        {track.volume === 0 ? '-∞' : `${Math.round(20 * Math.log10(track.volume / 100))}dB`}
      </span>

      {/* M / S buttons */}
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className={cn('w-5 h-5 rounded text-[7px] font-bold', track.muted && 'bg-destructive/20 text-destructive')}
          onClick={() => onUpdate({ muted: !track.muted })}
        >
          M
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('w-5 h-5 rounded text-[7px] font-bold', track.solo && 'bg-amber-500/20 text-amber-400')}
          onClick={() => onUpdate({ solo: !track.solo })}
        >
          S
        </Button>
      </div>
    </div>
  );
};

export const AudioMixerPanel: React.FC<AudioMixerPanelProps> = ({
  tracks, masterVolume, onTrackUpdate, onMasterVolumeChange,
}) => {
  return (
    <div className="border-l border-border/30 bg-background/60 backdrop-blur-sm flex flex-col">
      <div className="px-2 py-1.5 border-b border-border/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mixer</span>
      </div>

      <div className="flex-1 flex items-end overflow-x-auto px-1 py-2 gap-px">
        {tracks.map(track => (
          <ChannelStrip
            key={track.id}
            track={track}
            onUpdate={(updates) => onTrackUpdate(track.id, updates)}
          />
        ))}

        {/* Master fader */}
        <div className="border-l border-border/30 ml-1 pl-1">
          <div className="flex flex-col items-center gap-1 w-14 px-1">
            <span className="text-[8px] text-primary font-bold">MASTER</span>
            <div className="flex items-end gap-1 h-24">
              <VUMeter level={masterVolume * 0.85} color="hsl(193, 100%, 50%)" muted={false} />
              <Slider
                value={[masterVolume]}
                min={0}
                max={100}
                orientation="vertical"
                className="h-20"
                onValueChange={([v]) => onMasterVolumeChange(v)}
              />
              <VUMeter level={masterVolume * 0.8} color="hsl(193, 100%, 50%)" muted={false} />
            </div>
            <span className="text-[8px] font-mono text-primary">
              {masterVolume === 0 ? '-∞' : `${Math.round(20 * Math.log10(masterVolume / 100))}dB`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
