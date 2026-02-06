// Orchestration Workspace - Combined Dashboard + Test Runner + Demo + History
import React, { useState, useCallback } from 'react';
import { useOrchestrationLLM } from '@/hooks/useOrchestrationLLM';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, TestTube, Play, Plus, Trash2, RefreshCw,
  CheckCircle, Clock, Target, List, Settings, History, GitBranch
} from 'lucide-react';
import { OrchestrationDashboard } from './OrchestrationDashboard';
import { OrchestrationTestRunner } from './OrchestrationTestRunner';
import { RunHistoryBrowser } from './RunHistoryBrowser';
import { DependencyEditor } from './DependencyEditor';
import { 
  OrchestrationKernel, 
  OrchestrationTask, 
  RunConfig,
  AcceptanceCriterion,
  TaskPriority,
  createDefaultBudgets,
  generateId,
} from '@/lib/orchestration';
import { runLogStore, RunLogEntry } from '@/lib/orchestration/run-log-store';

interface DemoTask {
  title: string;
  prompt: string;
  priority: TaskPriority;
  dependencies: string[];
  acceptance_criteria: AcceptanceCriterion[];
}

export const OrchestrationWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState('demo');
  const [kernel, setKernel] = useState<OrchestrationKernel | null>(null);
  const [useLLM, setUseLLM] = useState(true);
  const [showDepEditor, setShowDepEditor] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { executeTask: llmExecuteTask, executeTaskStreaming } = useOrchestrationLLM();
  const [demoTasks, setDemoTasks] = useState<DemoTask[]>([
    {
      title: 'Analyze user requirements',
      prompt: 'Review the user story and extract key requirements',
      priority: 80,
      dependencies: [],
      acceptance_criteria: [
        { id: 'req-1', type: 'contains', description: 'Contains requirements', config: { pattern: 'requirements' } },
        { id: 'req-2', type: 'word_limit', description: 'At least 50 words', config: { min: 50 } }
      ]
    },
    {
      title: 'Design system architecture',
      prompt: 'Create a high-level architecture based on requirements',
      priority: 70,
      dependencies: [],
      acceptance_criteria: [
        { id: 'arch-1', type: 'contains', description: 'Contains architecture', config: { pattern: 'architecture' } }
      ]
    },
    {
      title: 'Implement core features',
      prompt: 'Build the main functionality following the architecture',
      priority: 60,
      dependencies: [],
      acceptance_criteria: []
    }
  ]);

  const createKernelWithTasks = useCallback(() => {
    const budgets = createDefaultBudgets();
    const runId = `run-${Date.now()}`;
    
    const config: Partial<RunConfig> = {
      run_id: runId,
      project_id: 'demo-project',
      mode: 'supervised',
      budgets,
      name: 'Demo Run',
      description: 'Demo orchestration run'
    };

    const collectedEvents: any[] = [];

    const streamingExecute = useLLM ? async (task: OrchestrationTask, ctx: string) => {
      setIsStreaming(true);
      setStreamingOutput('');
      const result = await executeTaskStreaming(task, ctx, (_chunk, accumulated) => {
        setStreamingOutput(accumulated);
      });
      setIsStreaming(false);
      return result;
    } : undefined;

    const newKernel = new OrchestrationKernel(config, {
      onEvent: (event) => {
        collectedEvents.push(event);
        console.log('Event:', event.type, event.payload);
      },
      onTaskComplete: (task, success) => {
        console.log('Task complete:', task.title, success ? '✓' : '✗');
      },
      onCheckpoint: () => console.log('Checkpoint created'),
      onStop: (reason) => {
        // Save run log
        const logEntry: RunLogEntry = {
          id: generateId(),
          type: 'demo',
          name: `Demo Run (${demoTasks.length} tasks)`,
          timestamp: new Date().toISOString(),
          duration_ms: 0,
          status: 'stopped',
          events: collectedEvents,
          snapshots: [],
          tasksSummary: {
            total: demoTasks.length,
            done: newKernel.getTasks().filter(t => t.status === 'done').length,
            failed: newKernel.getTasks().filter(t => t.status === 'failed').length,
            queued: newKernel.getTasks().filter(t => t.status === 'queued').length,
            canceled: 0,
          },
          traces: [],
          budgets: newKernel.getBudgetStatus() as any,
        };
        runLogStore.addLog(logEntry);
      },
      executeTask: streamingExecute || (useLLM ? llmExecuteTask : undefined),
    });

    // Add pinned context
    newKernel.addContext('pinned', 'This is a demo orchestration run.', 'constraint', 100);
    newKernel.addContext('pinned', 'All tasks should be completed within budget.', 'constraint', 90);
    newKernel.addContext('pinned', 'Verify results before marking complete.', 'instruction', 80);

    // Add demo tasks with IDs for dependency tracking
    const taskIds = demoTasks.map((_, i) => `task-${i}`);
    demoTasks.forEach((task, _i) => {
      // Map task-N style deps to actual task IDs (handled by kernel)
      newKernel.addTask({
        title: task.title,
        prompt: task.prompt,
        priority: task.priority,
        dependencies: task.dependencies,
        acceptance_criteria: task.acceptance_criteria,
        tags: ['demo']
      });
    });

    setKernel(newKernel);
    return newKernel;
  }, [demoTasks, useLLM, llmExecuteTask, executeTaskStreaming]);

  const addDemoTask = () => {
    setDemoTasks(prev => [...prev, {
      title: `New Task ${prev.length + 1}`,
      prompt: 'Describe what this task should accomplish',
      priority: 50 as TaskPriority,
      dependencies: [],
      acceptance_criteria: []
    }]);
  };

  const removeDemoTask = (index: number) => {
    setDemoTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateDemoTask = (index: number, updates: Partial<DemoTask>) => {
    setDemoTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  };

  const handleDependenciesChange = (taskIndex: number, dependencies: string[]) => {
    updateDemoTask(taskIndex, { dependencies });
  };

  const getValidPriority = (value: number): TaskPriority => {
    const priorities: TaskPriority[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return priorities.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">Orchestration Workspace</h1>
            <p className="text-xs text-muted-foreground">
              Autonomous task execution with event-sourced state
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          System Ready
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="demo" className="gap-1.5">
            <Play className="w-3.5 h-3.5" /> Demo Run
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <List className="w-3.5 h-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-1.5">
            <TestTube className="w-3.5 h-3.5" /> Test Harness
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-3.5 h-3.5" /> History
          </TabsTrigger>
        </TabsList>

        {/* Demo Run Tab */}
        <TabsContent value="demo" className="flex-1 p-4 overflow-hidden">
          <div className="h-full grid grid-cols-2 gap-4">
            {/* Left: Task Setup or Dependency Editor */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {showDepEditor ? <GitBranch className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                    {showDepEditor ? 'Dependency Editor' : 'Task Queue Setup'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setShowDepEditor(!showDepEditor)} title={showDepEditor ? 'Show task list' : 'Edit dependencies'}>
                      {showDepEditor ? <List className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                    </Button>
                    {!showDepEditor && (
                      <Button size="sm" variant="ghost" onClick={addDemoTask}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {showDepEditor ? (
                  <div className="h-full">
                    <DependencyEditor
                      tasks={demoTasks}
                      onDependenciesChange={handleDependenciesChange}
                    />
                  </div>
                ) : (
                  <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-3">
                      {demoTasks.map((task, index) => (
                        <Card key={index} className="bg-muted/30">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={task.title || ''}
                                onChange={(e) => updateDemoTask(index, { title: e.target.value })}
                                className="flex-1 bg-transparent border-none text-sm font-medium focus:outline-none"
                                placeholder="Task title"
                              />
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">P{task.priority}</Badge>
                                {task.dependencies.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.dependencies.length} deps
                                  </Badge>
                                )}
                                <Button 
                                  size="sm" variant="ghost" 
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeDemoTask(index)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <textarea
                              value={task.prompt || ''}
                              onChange={(e) => updateDemoTask(index, { prompt: e.target.value })}
                              className="w-full bg-background/50 rounded p-2 text-xs resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Task prompt..."
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Priority:</span>
                              <input
                                type="range"
                                min="0" max="100" step="10"
                                value={task.priority || 50}
                                onChange={(e) => updateDemoTask(index, { priority: getValidPriority(parseInt(e.target.value)) })}
                                className="flex-1 h-1"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Right: Run Controls & Streaming Output */}
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Run Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Max Tokens</span>
                      <p className="font-medium">50,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Max Time</span>
                      <p className="font-medium">5 min</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Max Iterations</span>
                      <p className="font-medium">50</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Mode</span>
                      <p className="font-medium">Supervised</p>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useLLM}
                          onChange={(e) => setUseLLM(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-xs text-muted-foreground">Use Real LLM (Gemini 3 Flash) with Streaming</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={createKernelWithTasks}
                      disabled={demoTasks.length === 0}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Create & Start Run
                    </Button>
                    {kernel && (
                      <Button variant="outline" onClick={() => { setKernel(null); setStreamingOutput(''); }}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Streaming Output / Status */}
              <Card className="flex-1 flex flex-col">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isStreaming ? (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {isStreaming ? 'Streaming Output' : 'Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {isStreaming || streamingOutput ? (
                    <ScrollArea className="h-full">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                        {streamingOutput}
                        {isStreaming && <span className="animate-pulse">▊</span>}
                      </pre>
                    </ScrollArea>
                  ) : kernel ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Kernel initialized</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Tasks: {kernel.getTasks().length}</p>
                        <p>Events: {kernel.getTimeline().length}</p>
                        <p>Status: {kernel.getRunState().status}</p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab('dashboard')}>
                        Open Full Dashboard
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active run</p>
                      <p className="text-xs">Configure tasks and start a run</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 overflow-hidden">
          <OrchestrationDashboard 
            kernel={kernel || undefined}
            onCreateKernel={createKernelWithTasks}
          />
        </TabsContent>

        {/* Test Harness Tab */}
        <TabsContent value="tests" className="flex-1 overflow-hidden">
          <OrchestrationTestRunner />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-hidden">
          <RunHistoryBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrchestrationWorkspace;
