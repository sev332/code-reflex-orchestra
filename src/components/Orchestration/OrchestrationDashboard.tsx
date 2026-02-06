// Orchestration Dashboard - UI for inspecting runs, queue, events, and budgets

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Square, SkipForward, RefreshCw, Download, 
  CheckCircle, XCircle, Clock, AlertTriangle, Zap,
  GitBranch, List, Activity, FileText, Settings
} from 'lucide-react';
import { OrchestrationKernel, OrchestrationTask, Snapshot, BudgetStatus } from '@/lib/orchestration';
import { OrchestrationDAG } from './OrchestrationDAG';

interface OrchestrationDashboardProps {
  kernel?: OrchestrationKernel;
  onCreateKernel?: () => OrchestrationKernel;
}

export const OrchestrationDashboard: React.FC<OrchestrationDashboardProps> = ({
  kernel: externalKernel,
  onCreateKernel,
}) => {
  const [kernel, setKernel] = useState<OrchestrationKernel | null>(externalKernel || null);
  const [runState, setRunState] = useState<ReturnType<OrchestrationKernel['getRunState']> | null>(null);
  const [tasks, setTasks] = useState<OrchestrationTask[]>([]);
  const [events, setEvents] = useState<ReturnType<OrchestrationKernel['getTimeline']>>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [activeTab, setActiveTab] = useState('queue');

  const refreshState = useCallback(() => {
    if (!kernel) return;
    setRunState(kernel.getRunState());
    setTasks(kernel.getTasks());
    setEvents(kernel.getTimeline());
    setBudgetStatus(kernel.getBudgetStatus());
  }, [kernel]);

  useEffect(() => {
    if (externalKernel) {
      setKernel(externalKernel);
    }
  }, [externalKernel]);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 1000);
    return () => clearInterval(interval);
  }, [refreshState]);

  const handleStart = async () => {
    if (!kernel && onCreateKernel) {
      const newKernel = onCreateKernel();
      setKernel(newKernel);
      await newKernel.start();
    } else if (kernel) {
      await kernel.start();
    }
    refreshState();
  };

  const handleStop = () => {
    kernel?.stop('User requested stop');
    refreshState();
  };

  const handleStep = async () => {
    if (kernel) {
      kernel.setMode('manual');
      await kernel.step();
      refreshState();
    }
  };

  const handleExport = () => {
    if (!kernel) return;
    const bundle = kernel.exportBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-${runState?.config.run_id || 'export'}.json`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'queued': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'blocked': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Orchestration Kernel</h2>
          {runState && (
            <Badge variant="outline" className={getStatusColor(runState.status)}>
              {runState.status}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleStep} disabled={!kernel}>
            <SkipForward className="w-4 h-4 mr-1" /> Step
          </Button>
          <Button size="sm" variant="outline" onClick={handleStart} disabled={runState?.status === 'running'}>
            <Play className="w-4 h-4 mr-1" /> Start
          </Button>
          <Button size="sm" variant="destructive" onClick={handleStop} disabled={runState?.status !== 'running'}>
            <Square className="w-4 h-4 mr-1" /> Stop
          </Button>
          <Button size="sm" variant="ghost" onClick={refreshState}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExport} disabled={!kernel}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Budget Meters */}
      {budgetStatus && (
        <div className="border-b border-border p-3 grid grid-cols-5 gap-4">
          {Object.entries(budgetStatus.details).map(([key, data]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="capitalize">{key.replace('_', ' ')}</span>
                <span>{Math.round(data.percent * 100)}%</span>
              </div>
              <Progress 
                value={data.percent * 100} 
                className={`h-1.5 ${data.percent > 0.8 ? 'bg-red-500/20' : ''}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-4 mt-2 w-fit">
            <TabsTrigger value="queue" className="gap-1">
              <List className="w-3 h-3" /> Queue
            </TabsTrigger>
            <TabsTrigger value="dag" className="gap-1">
              <GitBranch className="w-3 h-3" /> DAG
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1">
              <Activity className="w-3 h-3" /> Events
            </TabsTrigger>
            <TabsTrigger value="artifacts" className="gap-1">
              <FileText className="w-3 h-3" /> Artifacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No tasks in queue</p>
                ) : (
                  tasks.map(task => (
                    <Card key={task.task_id} className="bg-card/50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <span className="font-medium text-sm">{task.title}</span>
                              <Badge variant="secondary" className="text-xs">P{task.priority}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.prompt}
                            </p>
                            {task.acceptance_criteria.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {task.acceptance_criteria.map((c, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {c.type}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {task.dependencies.length > 0 && (
                              <span>Deps: {task.dependencies.length}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events" className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No events yet</p>
                ) : (
                  events.slice().reverse().map((event, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded hover:bg-muted/50">
                      <span className="text-muted-foreground w-20 shrink-0">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-muted-foreground">{event.summary}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dag" className="flex-1 p-4">
            <OrchestrationDAG tasks={tasks} />
          </TabsContent>

          <TabsContent value="artifacts" className="flex-1 p-4">
            <ScrollArea className="h-full">
              {kernel?.getArtifacts().map(artifact => (
                <Card key={artifact.id} className="mb-2">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm">{artifact.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {artifact.content.slice(0, 500)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrchestrationDashboard;
