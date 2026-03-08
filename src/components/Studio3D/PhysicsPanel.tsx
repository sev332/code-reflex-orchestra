// Phase 3 — Physics Panel UI
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipBack, RotateCcw, Zap, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type PhysicsBodyConfig, type PhysicsWorldConfig, type PhysicsConstraint,
  defaultPhysicsBody, defaultPhysicsWorld, physicsPresets,
  type ColliderType, type ConstraintType,
} from '@/lib/3d-engine/physics-config';

interface PhysicsPanelProps {
  worldConfig: PhysicsWorldConfig;
  onWorldChange: (config: PhysicsWorldConfig) => void;
  bodies: PhysicsBodyConfig[];
  onBodiesChange: (bodies: PhysicsBodyConfig[]) => void;
  constraints: PhysicsConstraint[];
  onConstraintsChange: (constraints: PhysicsConstraint[]) => void;
  selectedObjectId: string | null;
  sceneObjects: Array<{ id: string; name: string; type: string }>;
  onSimulate: () => void;
  onPause: () => void;
  onReset: () => void;
  isSimulating: boolean;
}

export function PhysicsPanel({
  worldConfig, onWorldChange, bodies, onBodiesChange,
  constraints, onConstraintsChange, selectedObjectId, sceneObjects,
  onSimulate, onPause, onReset, isSimulating,
}: PhysicsPanelProps) {

  const selectedBody = bodies.find(b => b.objectId === selectedObjectId);

  const addBodyForSelected = () => {
    if (!selectedObjectId || selectedBody) return;
    onBodiesChange([...bodies, defaultPhysicsBody(selectedObjectId)]);
  };

  const updateBody = (updates: Partial<PhysicsBodyConfig>) => {
    if (!selectedObjectId) return;
    onBodiesChange(bodies.map(b =>
      b.objectId === selectedObjectId ? { ...b, ...updates } : b
    ));
  };

  const removeBody = () => {
    if (!selectedObjectId) return;
    onBodiesChange(bodies.filter(b => b.objectId !== selectedObjectId));
  };

  const applyPreset = (presetName: string) => {
    const preset = physicsPresets[presetName];
    if (preset) updateBody(preset);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Physics Engine</div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant={isSimulating ? 'default' : 'outline'}
            size="sm"
            onClick={isSimulating ? onPause : onSimulate}
            className="flex-1 h-7 text-xs gap-1"
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isSimulating ? 'Pause' : 'Simulate'}
          </Button>
          <Button variant="outline" size="icon" onClick={onReset} className="w-7 h-7">
            <SkipBack className="w-3 h-3" />
          </Button>
        </div>

        <Separator className="bg-border/20" />

        {/* World Settings */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">WORLD</Label>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Gravity Y</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{worldConfig.gravity[1].toFixed(1)}</span>
            </div>
            <Slider
              value={[worldConfig.gravity[1]]}
              onValueChange={([v]) => onWorldChange({ ...worldConfig, gravity: [0, v, 0] })}
              min={-20} max={0} step={0.1}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Time Scale</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{worldConfig.slowMotion.toFixed(1)}x</span>
            </div>
            <Slider
              value={[worldConfig.slowMotion]}
              onValueChange={([v]) => onWorldChange({ ...worldConfig, slowMotion: v })}
              min={0.1} max={3} step={0.1}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Debug Wireframe</span>
            <Switch
              checked={worldConfig.debugWireframe}
              onCheckedChange={v => onWorldChange({ ...worldConfig, debugWireframe: v })}
              className="scale-75"
            />
          </div>
        </div>

        <Separator className="bg-border/20" />

        {/* Selected Object Physics */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">RIGID BODY</Label>
          {selectedObjectId ? (
            selectedBody ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Enabled</span>
                  <Switch checked={selectedBody.enabled} onCheckedChange={v => updateBody({ enabled: v })} className="scale-75" />
                </div>

                <Select value={selectedBody.bodyType} onValueChange={(v: any) => updateBody({ bodyType: v })}>
                  <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                    <SelectItem value="kinematic">Kinematic</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedBody.colliderType} onValueChange={(v: ColliderType) => updateBody({ colliderType: v })}>
                  <SelectTrigger className="h-7 text-xs bg-muted/30 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="box">Box Collider</SelectItem>
                    <SelectItem value="sphere">Sphere Collider</SelectItem>
                    <SelectItem value="capsule">Capsule Collider</SelectItem>
                    <SelectItem value="mesh">Mesh Collider</SelectItem>
                    <SelectItem value="convexHull">Convex Hull</SelectItem>
                  </SelectContent>
                </Select>

                {([
                  { label: 'Mass', key: 'mass' as const, min: 0.01, max: 100, step: 0.1 },
                  { label: 'Friction', key: 'friction' as const, min: 0, max: 1, step: 0.01 },
                  { label: 'Restitution', key: 'restitution' as const, min: 0, max: 1, step: 0.01 },
                  { label: 'Linear Damping', key: 'linearDamping' as const, min: 0, max: 1, step: 0.01 },
                  { label: 'Angular Damping', key: 'angularDamping' as const, min: 0, max: 1, step: 0.01 },
                  { label: 'Gravity Scale', key: 'gravityScale' as const, min: 0, max: 5, step: 0.1 },
                ]).map(({ label, key, min, max, step }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{selectedBody[key].toFixed(2)}</span>
                    </div>
                    <Slider value={[selectedBody[key]]} onValueChange={([v]) => updateBody({ [key]: v })} min={min} max={max} step={step} />
                  </div>
                ))}

                <Separator className="bg-border/20" />

                <Label className="text-[10px] font-medium text-foreground/60">AXIS LOCKS</Label>
                <div className="grid grid-cols-2 gap-1">
                  {(['X', 'Y', 'Z'] as const).map(axis => (
                    <React.Fragment key={axis}>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={selectedBody[`lockTranslation${axis}` as keyof PhysicsBodyConfig] as boolean}
                          onCheckedChange={v => updateBody({ [`lockTranslation${axis}`]: v })}
                          className="scale-[0.6]"
                        />
                        <span className="text-[9px] text-muted-foreground">Pos {axis}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={selectedBody[`lockRotation${axis}` as keyof PhysicsBodyConfig] as boolean}
                          onCheckedChange={v => updateBody({ [`lockRotation${axis}`]: v })}
                          className="scale-[0.6]"
                        />
                        <span className="text-[9px] text-muted-foreground">Rot {axis}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <Separator className="bg-border/20" />

                <Label className="text-[10px] font-medium text-foreground/60">PRESETS</Label>
                <div className="grid grid-cols-2 gap-1">
                  {Object.keys(physicsPresets).map(name => (
                    <Button key={name} variant="outline" size="sm" onClick={() => applyPreset(name)}
                      className="h-6 text-[9px] px-1.5">
                      {name}
                    </Button>
                  ))}
                </div>

                <Button variant="ghost" size="sm" onClick={removeBody}
                  className="w-full h-7 text-xs text-destructive hover:text-destructive gap-1">
                  <Trash2 className="w-3 h-3" /> Remove Rigid Body
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={addBodyForSelected}
                className="w-full h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Rigid Body
              </Button>
            )
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2">Select an object</p>
          )}
        </div>

        <Separator className="bg-border/20" />

        {/* Bodies list */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-foreground/60">BODIES ({bodies.length})</Label>
          {bodies.map(body => {
            const obj = sceneObjects.find(o => o.id === body.objectId);
            return (
              <div key={body.objectId} className={cn(
                "flex items-center justify-between rounded px-2 py-1 text-[10px]",
                body.objectId === selectedObjectId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30'
              )}>
                <span>{obj?.name || body.objectId}</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-border/30">
                  {body.bodyType}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
