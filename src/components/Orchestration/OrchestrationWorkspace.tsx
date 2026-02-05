// Orchestration Workspace - Combined Dashboard + Test Runner + Demo

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, TestTube, Play, Plus, Trash2, RefreshCw,
  CheckCircle, Clock, Target, List, Settings
} from 'lucide-react';
import { OrchestrationDashboard } from './OrchestrationDashboard';
import { OrchestrationTestRunner } from './OrchestrationTestRunner';
import { 
  OrchestrationKernel, 
  OrchestrationTask, 
  RunConfig,
  AcceptanceCriterion,
  TaskPriority,
  createDefaultBudgets
} from '@/lib/orchestration';

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
    
    const config: Partial<RunConfig> = {
      run_id: `run-${Date.now()}`,
      project_id: 'demo-project',
      mode: 'supervised',
      budgets,
      name: 'Demo Run',
      description: 'Demo orchestration run'
    };

    const newKernel = new OrchestrationKernel(config, {
      onEvent: (event) => console.log('Event:', event.type),
      onTaskComplete: (task) => console.log('Task complete:', task.title),
      onCheckpoint: (snapshot) => console.log('Checkpoint created'),
    });

    // Add pinned context
    newKernel.addContext('pinned', 'This is a demo orchestration run.', 'constraint', 100);
    newKernel.addContext('pinned', 'All tasks should be completed within budget.', 'constraint', 90);
    newKernel.addContext('pinned', 'Verify results before marking complete.', 'instruction', 80);

    // Add demo tasks
    demoTasks.forEach((task) => {
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
  }, [demoTasks]);

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

  const getValidPriority = (value: number): TaskPriority => {
    const priorities: TaskPriority[] = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const closest = priorities.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    return closest;
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
        </TabsList>

        {/* Demo Run Tab */}
        <TabsContent value="demo" className="flex-1 p-4 overflow-hidden">
          <div className="h-full grid grid-cols-2 gap-4">
            {/* Task Setup */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Task Queue Setup
                  </span>
                  <Button size="sm" variant="ghost" onClick={addDemoTask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
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
                              <Badge variant="secondary" className="text-xs">
                                P{task.priority}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
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
                              min="0"
                              max="100"
                              step="10"
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
              </CardContent>
            </Card>

            {/* Run Controls & Status */}
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
                      <Button variant="outline" onClick={() => setKernel(null)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Status */}
              <Card className="flex-1">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Quick Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kernel ? (
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
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('dashboard')}
                      >
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
      </Tabs>
    </div>
  );
};

export default OrchestrationWorkspace;
