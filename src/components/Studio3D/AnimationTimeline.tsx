// Animation Timeline — Unreal Sequencer-class timeline UI
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, ChevronRight, ChevronDown,
  Plus, Trash2, Eye, EyeOff, Lock, Unlock, Circle, Diamond, Download,
  Minus, Volume2, VolumeX, KeyRound, Timer, Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  AnimationClip, AnimationTrack, Keyframe, AnimatableProperty, EasingType,
} from '@/lib/3d-engine/animation-engine';
import {
  createKeyframe, createTrack, propertyLabels, propertyGroups,
  getObjectPropertyValue, easingFunctions,
} from '@/lib/3d-engine/animation-engine';

// ─── Types ─────────────────────────────────────────

interface SceneObjectRef {
  id: string;
  name: string;
  type: string;
}

interface AnimationTimelineProps {
  clip: AnimationClip;
  onClipChange: (clip: AnimationClip) => void;
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  sceneObjects: SceneObjectRef[];
  getObjectProperty: (objectId: string, property: AnimatableProperty) => number;
  selectedTrackId: string | null;
  onSelectTrack: (id: string | null) => void;
}

// ─── Constants ─────────────────────────────────────

const TRACK_HEIGHT = 24;
const HEADER_WIDTH = 220;
const PIXELS_PER_SECOND_BASE = 80;
const KEYFRAME_SIZE = 10;

const easingOptions: { value: EasingType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In/Out' },
  { value: 'cubicIn', label: 'Cubic In' },
  { value: 'cubicOut', label: 'Cubic Out' },
  { value: 'cubicInOut', label: 'Cubic In/Out' },
  { value: 'bounceIn', label: 'Bounce In' },
  { value: 'bounceOut', label: 'Bounce Out' },
  { value: 'elasticIn', label: 'Elastic In' },
  { value: 'elasticOut', label: 'Elastic Out' },
  { value: 'backIn', label: 'Back In' },
  { value: 'backOut', label: 'Back Out' },
];

// ─── Easing Curve Preview ──────────────────────────

function EasingPreview({ easing }: { easing: EasingType }) {
  const fn = easingFunctions[easing];
  const points = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = 4 + t * 32;
      const y = 20 - fn(t) * 16;
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [easing, fn]);

  return (
    <svg width="40" height="24" className="shrink-0">
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="hsl(var(--border))" strokeWidth="0.5" />
      <line x1="4" y1="4" x2="4" y2="20" stroke="hsl(var(--border))" strokeWidth="0.5" />
    </svg>
  );
}

// ─── Timeline Ruler ────────────────────────────────

function TimelineRuler({ duration, zoom, scrollLeft, width, currentTime, onTimeClick }: {
  duration: number; zoom: number; scrollLeft: number; width: number;
  currentTime: number; onTimeClick: (time: number) => void;
}) {
  const pps = PIXELS_PER_SECOND_BASE * zoom;
  const totalWidth = duration * pps;

  // Determine tick interval based on zoom
  let tickInterval = 1;
  if (pps < 40) tickInterval = 5;
  else if (pps < 80) tickInterval = 2;
  else if (pps > 200) tickInterval = 0.5;
  else if (pps > 400) tickInterval = 0.25;

  const ticks: { time: number; major: boolean }[] = [];
  for (let t = 0; t <= duration; t += tickInterval) {
    ticks.push({ time: t, major: t % (tickInterval * 2 === 0 ? 2 : Math.max(1, tickInterval)) === 0 });
  }

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(duration, x / pps));
    onTimeClick(time);
  };

  return (
    <div
      className="h-6 relative cursor-pointer border-b border-border/20"
      onClick={handleClick}
      style={{ width: Math.max(totalWidth, width) }}
    >
      {ticks.map(({ time, major }) => {
        const x = time * pps;
        return (
          <div key={time} className="absolute top-0" style={{ left: x }}>
            <div className={cn('w-px', major ? 'h-4 bg-foreground/30' : 'h-2 bg-foreground/15')} />
            {major && (
              <span className="absolute top-3 -translate-x-1/2 text-[8px] text-muted-foreground tabular-nums whitespace-nowrap">
                {time.toFixed(time % 1 === 0 ? 0 : 1)}s
              </span>
            )}
          </div>
        );
      })}
      {/* Playhead indicator in ruler */}
      <div
        className="absolute top-0 h-full w-0.5 bg-primary z-10"
        style={{ left: currentTime * pps }}
      >
        <div className="absolute -top-0.5 -left-1.5 w-3 h-2 bg-primary rounded-sm" />
      </div>
    </div>
  );
}

// ─── Main Timeline Component ───────────────────────

export function AnimationTimeline({
  clip, onClipChange, currentTime, onTimeChange,
  isPlaying, onPlayToggle, sceneObjects,
  getObjectProperty, selectedTrackId, onSelectTrack,
}: AnimationTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set());
  const [selectedKeyframes, setSelectedKeyframes] = useState<Set<string>>(new Set());
  const [draggingKeyframe, setDraggingKeyframe] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pps = PIXELS_PER_SECOND_BASE * zoom;

  // Group tracks by object
  const tracksByObject = useMemo(() => {
    const map = new Map<string, AnimationTrack[]>();
    for (const track of clip.tracks) {
      if (!map.has(track.objectId)) map.set(track.objectId, []);
      map.get(track.objectId)!.push(track);
    }
    return map;
  }, [clip.tracks]);

  const toggleExpand = (objectId: string) => {
    setExpandedObjects(prev => {
      const next = new Set(prev);
      if (next.has(objectId)) next.delete(objectId); else next.add(objectId);
      return next;
    });
  };

  const addTrackForObject = useCallback((objectId: string, property: AnimatableProperty) => {
    // Check if track already exists
    if (clip.tracks.some(t => t.objectId === objectId && t.property === property)) return;
    const track = createTrack(objectId, property);
    // Auto-add keyframe at time 0 with current value
    const currentValue = getObjectProperty(objectId, property);
    track.keyframes.push(createKeyframe(0, currentValue));
    track.keyframes.push(createKeyframe(clip.duration, currentValue));
    onClipChange({ ...clip, tracks: [...clip.tracks, track] });
    setExpandedObjects(prev => new Set(prev).add(objectId));
  }, [clip, onClipChange, getObjectProperty]);

  const removeTrack = useCallback((trackId: string) => {
    onClipChange({ ...clip, tracks: clip.tracks.filter(t => t.id !== trackId) });
  }, [clip, onClipChange]);

  const addKeyframeAtPlayhead = useCallback((trackId: string) => {
    const track = clip.tracks.find(t => t.id === trackId);
    if (!track) return;
    // Get interpolated or current value
    const value = getObjectProperty(track.objectId, track.property);
    const kf = createKeyframe(currentTime, value);
    const updated = clip.tracks.map(t =>
      t.id === trackId ? { ...t, keyframes: [...t.keyframes, kf] } : t
    );
    onClipChange({ ...clip, tracks: updated });
  }, [clip, onClipChange, currentTime, getObjectProperty]);

  const deleteSelectedKeyframes = useCallback(() => {
    if (selectedKeyframes.size === 0) return;
    const updated = clip.tracks.map(t => ({
      ...t,
      keyframes: t.keyframes.filter(kf => !selectedKeyframes.has(kf.id)),
    }));
    onClipChange({ ...clip, tracks: updated });
    setSelectedKeyframes(new Set());
  }, [clip, onClipChange, selectedKeyframes]);

  const updateKeyframeEasing = useCallback((kfId: string, easing: EasingType) => {
    const updated = clip.tracks.map(t => ({
      ...t,
      keyframes: t.keyframes.map(kf => kf.id === kfId ? { ...kf, easing } : kf),
    }));
    onClipChange({ ...clip, tracks: updated });
  }, [clip, onClipChange]);

  const toggleTrackMute = useCallback((trackId: string) => {
    const updated = clip.tracks.map(t =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    );
    onClipChange({ ...clip, tracks: updated });
  }, [clip, onClipChange]);

  // Handle scrubber drag on timeline area
  const handleTimelineScrub = useCallback((e: React.MouseEvent) => {
    if (isPlaying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(clip.duration, x / pps));
    onTimeChange(time);
  }, [clip.duration, pps, scrollLeft, onTimeChange, isPlaying]);

  // Build flat list of visible rows
  const visibleRows: Array<{ type: 'object' | 'track'; objectId: string; track?: AnimationTrack; obj?: SceneObjectRef }> = [];
  for (const obj of sceneObjects) {
    const hasTracks = tracksByObject.has(obj.id);
    if (hasTracks || true) { // Show all objects
      visibleRows.push({ type: 'object', objectId: obj.id, obj });
      if (expandedObjects.has(obj.id) && hasTracks) {
        for (const track of tracksByObject.get(obj.id)!) {
          visibleRows.push({ type: 'track', objectId: obj.id, track });
        }
      }
    }
  }

  // Selected keyframe for easing editor
  const selectedKfForEdit = useMemo(() => {
    if (selectedKeyframes.size !== 1) return null;
    const kfId = Array.from(selectedKeyframes)[0];
    for (const track of clip.tracks) {
      const kf = track.keyframes.find(k => k.id === kfId);
      if (kf) return kf;
    }
    return null;
  }, [selectedKeyframes, clip.tracks]);

  return (
    <div className="flex flex-col bg-background/90 backdrop-blur-xl border-t border-border/30">
      {/* ─── Transport Bar ─── */}
      <div className="h-8 flex items-center gap-1 px-2 border-b border-border/20 shrink-0">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onTimeChange(0)}>
              <SkipBack className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to Start</TooltipContent>
        </Tooltip>

        <Button
          variant={isPlaying ? 'default' : 'ghost'}
          size="icon" className="w-6 h-6"
          onClick={onPlayToggle}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onTimeChange(clip.duration)}>
              <SkipForward className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to End</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border/30 mx-1" />

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="icon" className={cn('w-6 h-6', clip.loop && 'text-primary')}
              onClick={() => onClipChange({ ...clip, loop: !clip.loop })}
            >
              <Repeat className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Loop</TooltipContent>
        </Tooltip>

        {/* Time display */}
        <div className="flex items-center gap-1 ml-2">
          <Timer className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] tabular-nums text-foreground font-mono w-12 text-right">
            {currentTime.toFixed(2)}s
          </span>
          <span className="text-[10px] text-muted-foreground">/</span>
          <Input
            value={clip.duration}
            onChange={e => {
              const d = parseFloat(e.target.value);
              if (!isNaN(d) && d > 0) onClipChange({ ...clip, duration: d });
            }}
            className="w-10 h-5 text-[10px] tabular-nums px-1 bg-muted/20 border-border/20 text-center"
          />
          <span className="text-[10px] text-muted-foreground">s</span>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-muted-foreground">Speed</span>
          <Select value={String(clip.speed)} onValueChange={v => onClipChange({ ...clip, speed: Number(v) })}>
            <SelectTrigger className="w-14 h-5 text-[10px] bg-muted/20 border-border/20 px-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0.25, 0.5, 1, 1.5, 2, 3].map(s => (
                <SelectItem key={s} value={String(s)}>{s}×</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {/* Keyframe actions */}
        {selectedKfForEdit && (
          <div className="flex items-center gap-1 mr-2">
            <EasingPreview easing={selectedKfForEdit.easing} />
            <Select value={selectedKfForEdit.easing} onValueChange={v => updateKeyframeEasing(selectedKfForEdit.id, v as EasingType)}>
              <SelectTrigger className="w-24 h-5 text-[10px] bg-muted/20 border-border/20 px-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {easingOptions.map(e => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={deleteSelectedKeyframes}
          disabled={selectedKeyframes.size === 0}>
          <Trash2 className="w-3 h-3" />
        </Button>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-[9px] text-muted-foreground w-8 text-center tabular-nums">{(zoom * 100).toFixed(0)}%</span>
          <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setZoom(z => Math.min(4, z + 0.25))}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Clip name */}
        <Input
          value={clip.name}
          onChange={e => onClipChange({ ...clip, name: e.target.value })}
          className="w-24 h-5 text-[10px] bg-muted/20 border-border/20 px-1 ml-1"
        />
      </div>

      {/* ─── Timeline Body ─── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: Math.max(120, visibleRows.length * TRACK_HEIGHT + 30) }}>
        {/* Track Headers */}
        <div className="shrink-0 border-r border-border/20 overflow-hidden" style={{ width: HEADER_WIDTH }}>
          {/* Ruler spacer */}
          <div className="h-6 border-b border-border/20 flex items-center px-2">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tracks</span>
          </div>
          <ScrollArea className="h-full">
            {visibleRows.map((row, i) => {
              if (row.type === 'object') {
                const obj = row.obj!;
                const isExpanded = expandedObjects.has(obj.id);
                const hasTracks = tracksByObject.has(obj.id);
                return (
                  <div
                    key={`obj-${obj.id}`}
                    className={cn(
                      'flex items-center gap-1 px-1 border-b border-border/10 cursor-pointer hover:bg-muted/20',
                      'group'
                    )}
                    style={{ height: TRACK_HEIGHT }}
                    onClick={() => toggleExpand(obj.id)}
                  >
                    {hasTracks ? (
                      isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <div className="w-3" />
                    )}
                    <span className="text-[10px] font-medium text-foreground truncate flex-1">{obj.name}</span>
                    {/* Add property track dropdown */}
                    <Select onValueChange={v => addTrackForObject(obj.id, v as AnimatableProperty)}>
                      <SelectTrigger className="w-5 h-4 p-0 border-0 bg-transparent opacity-0 group-hover:opacity-100">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(propertyGroups).map(([group, props]) => (
                          <React.Fragment key={group}>
                            <div className="text-[9px] text-muted-foreground px-2 pt-1 pb-0.5 uppercase">{group}</div>
                            {props.map(prop => {
                              const exists = clip.tracks.some(t => t.objectId === obj.id && t.property === prop);
                              if (obj.type.startsWith('light-') && !['position.x', 'position.y', 'position.z', 'intensity'].includes(prop)) return null;
                              return (
                                <SelectItem key={prop} value={prop} disabled={exists}>
                                  {propertyLabels[prop]} {exists ? '✓' : ''}
                                </SelectItem>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              // Track row
              const track = row.track!;
              return (
                <div
                  key={`track-${track.id}`}
                  className={cn(
                    'flex items-center gap-1 px-1 pl-5 border-b border-border/10 group',
                    selectedTrackId === track.id && 'bg-primary/10'
                  )}
                  style={{ height: TRACK_HEIGHT }}
                  onClick={() => onSelectTrack(track.id)}
                >
                  <Diamond className="w-2.5 h-2.5 text-primary/60 shrink-0" />
                  <span className="text-[9px] text-muted-foreground truncate flex-1">
                    {propertyLabels[track.property]}
                  </span>
                  <span className="text-[8px] text-muted-foreground tabular-nums mr-1">
                    {track.keyframes.length}kf
                  </span>
                  <Button variant="ghost" size="icon" className="w-4 h-4 opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); toggleTrackMute(track.id); }}>
                    {track.muted ? <VolumeX className="w-2.5 h-2.5 text-muted-foreground" /> : <Volume2 className="w-2.5 h-2.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-4 h-4 opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); addKeyframeAtPlayhead(track.id); }}>
                    <KeyRound className="w-2.5 h-2.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-destructive"
                    onClick={e => { e.stopPropagation(); removeTrack(track.id); }}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                </div>
              );
            })}
          </ScrollArea>
        </div>

        {/* Timeline Canvas Area */}
        <div
          className="flex-1 overflow-x-auto overflow-y-hidden relative"
          ref={scrollContainerRef}
          onScroll={e => setScrollLeft((e.target as HTMLElement).scrollLeft)}
        >
          <div style={{ width: Math.max(clip.duration * pps + 100, 600), minHeight: '100%' }}>
            {/* Ruler */}
            <TimelineRuler
              duration={clip.duration} zoom={zoom} scrollLeft={scrollLeft}
              width={scrollContainerRef.current?.clientWidth ?? 600}
              currentTime={currentTime} onTimeClick={onTimeChange}
            />

            {/* Track lanes */}
            <div className="relative" onClick={handleTimelineScrub}>
              {visibleRows.map((row, i) => {
                if (row.type === 'object') {
                  return (
                    <div
                      key={`lane-obj-${row.objectId}`}
                      className="border-b border-border/10 bg-muted/5"
                      style={{ height: TRACK_HEIGHT }}
                    />
                  );
                }

                const track = row.track!;
                const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);

                return (
                  <div
                    key={`lane-track-${track.id}`}
                    className={cn(
                      'border-b border-border/10 relative',
                      selectedTrackId === track.id && 'bg-primary/5',
                      track.muted && 'opacity-40'
                    )}
                    style={{ height: TRACK_HEIGHT }}
                  >
                    {/* Connection lines between keyframes */}
                    {sorted.length > 1 && sorted.map((kf, ki) => {
                      if (ki === sorted.length - 1) return null;
                      const x1 = kf.time * pps;
                      const x2 = sorted[ki + 1].time * pps;
                      return (
                        <div
                          key={`line-${kf.id}`}
                          className="absolute top-1/2 h-px bg-primary/30"
                          style={{ left: x1, width: x2 - x1 }}
                        />
                      );
                    })}

                    {/* Keyframe diamonds */}
                    {sorted.map(kf => {
                      const x = kf.time * pps;
                      const isSelected = selectedKeyframes.has(kf.id);
                      return (
                        <div
                          key={kf.id}
                          className={cn(
                            'absolute top-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125',
                            'z-10'
                          )}
                          style={{ left: x - KEYFRAME_SIZE / 2 }}
                          onClick={e => {
                            e.stopPropagation();
                            if (e.shiftKey) {
                              setSelectedKeyframes(prev => {
                                const next = new Set(prev);
                                if (next.has(kf.id)) next.delete(kf.id); else next.add(kf.id);
                                return next;
                              });
                            } else {
                              setSelectedKeyframes(new Set([kf.id]));
                            }
                          }}
                        >
                          <svg width={KEYFRAME_SIZE} height={KEYFRAME_SIZE} viewBox="0 0 10 10">
                            <rect
                              x="1" y="1" width="8" height="8"
                              transform="rotate(45 5 5)"
                              fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
                              stroke={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))'}
                              strokeWidth={isSelected ? 1.5 : 0.5}
                            />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Playhead line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                style={{ left: currentTime * pps }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
