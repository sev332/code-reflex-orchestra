// Auto-Exploration Control Panel with configurable intervals and diversity controls
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  Settings,
  Zap,
  Brain,
  GitBranch,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoExploration, ExplorationStrategy, AutoExplorationConfig } from '@/hooks/useAutoExploration';

const STRATEGY_INFO: Record<ExplorationStrategy, { label: string; description: string; icon: React.ReactNode }> = {
  breadth_first: {
    label: 'Breadth First',
    description: 'Explore many topics shallowly',
    icon: <Shuffle className="w-4 h-4" />
  },
  depth_first: {
    label: 'Depth First',
    description: 'Explore one topic deeply',
    icon: <Target className="w-4 h-4" />
  },
  random_walk: {
    label: 'Random Walk',
    description: 'Random topic selection',
    icon: <Sparkles className="w-4 h-4" />
  },
  insight_guided: {
    label: 'Insight Guided',
    description: 'Follow high-confidence insights',
    icon: <Lightbulb className="w-4 h-4" />
  },
  gap_filling: {
    label: 'Gap Filling',
    description: 'Find unexplored areas',
    icon: <GitBranch className="w-4 h-4" />
  },
  meta_reflection: {
    label: 'Meta Reflection',
    description: 'Reflect on past explorations',
    icon: <Brain className="w-4 h-4" />
  }
};

export const AutoExplorationPanel: React.FC = () => {
  const {
    state,
    config,
    dreamMode,
    start,
    pause,
    stop,
    updateConfig,
    executeExploration
  } = useAutoExploration();

  const [showSettings, setShowSettings] = useState(false);
  const [focusInput, setFocusInput] = useState('');

  const handleStart = () => {
    if (!dreamMode.currentSession && !focusInput) {
      // Need a focus for new session
      return;
    }
    start(focusInput || undefined);
  };

  const toggleStrategy = (strategy: ExplorationStrategy) => {
    const current = config.explorationStrategies;
    const updated = current.includes(strategy)
      ? current.filter(s => s !== strategy)
      : [...current, strategy];
    
    if (updated.length > 0) {
      updateConfig({ explorationStrategies: updated });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold">Auto-Exploration</h2>
            <p className="text-xs text-muted-foreground">
              Continuous AI-driven exploration
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className={cn("w-4 h-4", showSettings && "text-primary")} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Session Focus Input */}
          {!dreamMode.currentSession && (
            <Card className="p-4">
              <Label className="text-xs text-muted-foreground">Exploration Focus</Label>
              <Input
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                placeholder="What should I explore?"
                className="mt-2"
              />
            </Card>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!state.isActive ? (
              <Button 
                onClick={handleStart}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                disabled={!dreamMode.currentSession && !focusInput}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Exploration
              </Button>
            ) : (
              <>
                <Button 
                  onClick={pause}
                  variant="secondary"
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  onClick={stop}
                  variant="destructive"
                  size="icon"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={executeExploration}
              disabled={!dreamMode.currentSession}
              title="Manual exploration"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Current State */}
          {state.isActive && (
            <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Exploring...</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{state.currentIteration} / {config.maxIterations}</span>
                  </div>
                  <Progress value={(state.currentIteration / config.maxIterations) * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-card/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Strategy</p>
                    <Badge className="mt-1">{STRATEGY_INFO[state.currentStrategy].label}</Badge>
                  </div>
                  <div className="p-2 bg-card/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Diversity</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {(state.diversityScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {state.currentPrompt && (
                  <div className="p-2 bg-card/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground mb-1">Current Prompt</p>
                    <p className="text-xs line-clamp-2">{state.currentPrompt}</p>
                  </div>
                )}

                {state.loopsDetected > 0 && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">{state.loopsDetected} loops detected & avoided</span>
                  </div>
                )}

                {state.lastInsight && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-[10px] text-amber-400 mb-1">Latest Insight</p>
                    <p className="text-xs line-clamp-2">{state.lastInsight.content}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <Card className="p-4 space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </h3>

              {/* Interval */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Timer className="w-3 h-3" /> Interval
                  </Label>
                  <span>{(config.intervalMs / 1000).toFixed(0)}s</span>
                </div>
                <Slider
                  value={[config.intervalMs]}
                  onValueChange={([v]) => updateConfig({ intervalMs: v })}
                  min={5000}
                  max={120000}
                  step={5000}
                  className="w-full"
                />
              </div>

              {/* Diversity Threshold */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Shuffle className="w-3 h-3" /> Diversity
                  </Label>
                  <span>{(config.diversityThreshold * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[config.diversityThreshold]}
                  onValueChange={([v]) => updateConfig({ diversityThreshold: v })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Max Iterations */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <Label className="text-muted-foreground">Max Iterations</Label>
                  <span>{config.maxIterations}</span>
                </div>
                <Slider
                  value={[config.maxIterations]}
                  onValueChange={([v]) => updateConfig({ maxIterations: v })}
                  min={10}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Min Confidence */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <Label className="text-muted-foreground">Min Confidence</Label>
                  <span>{(config.minConfidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[config.minConfidenceThreshold]}
                  onValueChange={([v]) => updateConfig({ minConfidenceThreshold: v })}
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Pause on Loop</Label>
                  <Switch
                    checked={config.pauseOnLoop}
                    onCheckedChange={(v) => updateConfig({ pauseOnLoop: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Predictive Shortcuts (PSR)</Label>
                  <Switch
                    checked={config.enablePSR}
                    onCheckedChange={(v) => updateConfig({ enablePSR: v })}
                  />
                </div>
              </div>

              {/* Strategies */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Active Strategies</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STRATEGY_INFO) as ExplorationStrategy[]).map((strategy) => {
                    const info = STRATEGY_INFO[strategy];
                    const isActive = config.explorationStrategies.includes(strategy);
                    return (
                      <Button
                        key={strategy}
                        variant={isActive ? "secondary" : "outline"}
                        size="sm"
                        className={cn(
                          "justify-start gap-2 h-auto py-2",
                          isActive && "border-primary/50"
                        )}
                        onClick={() => toggleStrategy(strategy)}
                      >
                        {info.icon}
                        <div className="text-left">
                          <p className="text-xs font-medium">{info.label}</p>
                          <p className="text-[10px] text-muted-foreground">{info.description}</p>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Session Info */}
          {dreamMode.currentSession && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Current Session</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {dreamMode.currentSession.focus}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-card/50 rounded-lg">
                  <p className="text-lg font-bold text-purple-400">
                    {dreamMode.currentSession.total_explorations || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Explorations</p>
                </div>
                <div className="p-2 bg-card/50 rounded-lg">
                  <p className="text-lg font-bold text-amber-400">
                    {dreamMode.currentSession.total_insights || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Insights</p>
                </div>
                <div className="p-2 bg-card/50 rounded-lg">
                  <p className="text-lg font-bold text-cyan-400">
                    {dreamMode.insights.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">In Memory</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
