import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Zap, 
  Eye, 
  Settings, 
  Activity, 
  Database,
  Users,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useProductionWisdomNET } from '@/hooks/useProductionWisdomNET';
import { HILControlCenter } from './HILControlCenter';
import { AdvancedMemoryViewer } from './AdvancedMemoryViewer';
import { ProductionSystemMap } from './ProductionSystemMap';
import { VectorMemorySystem } from './VectorMemorySystem';
import { AIModelOrchestrator } from './AIModelOrchestrator';
import { RealtimeMonitor } from './RealtimeMonitor';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { IntegrationTesting } from './IntegrationTesting';
import InfiniTree from '@/components/InfiniTree';
import { toast } from 'sonner';

export function ProductionDashboard() {
  const {
    isInitialized,
    isLoading,
    agents,
    tasks,
    metrics,
    initialize,
    refreshState,
    createTask
  } = useProductionWisdomNET();

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleAgentAction = async (agentId: string, action: string) => {
    try {
      // In a full implementation, this would call the appropriate agent control functions
      toast.success(`Agent action: ${action} on ${agentId}`);
      await refreshState();
    } catch (error) {
      toast.error(`Failed to perform agent action: ${action}`);
    }
  };

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      // In a full implementation, this would call the appropriate task control functions
      toast.success(`Task action: ${action} on ${taskId}`);
      await refreshState();
    } catch (error) {
      toast.error(`Failed to perform task action: ${action}`);
    }
  };

  const handleCreateTask = async (type: string) => {
    try {
      const taskId = await createTask(
        `New ${type} Task`,
        `Auto-generated ${type} task from dashboard`,
        type,
        7 // High priority
      );
      toast.success(`Created new ${type} task: ${taskId.slice(0, 8)}...`);
    } catch (error) {
      toast.error(`Failed to create ${type} task`);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Brain className="w-6 h-6 animate-pulse" />
              Initializing Production WisdomNET
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Starting advanced agents, loading memory systems, and establishing HIL controls...
              </p>
            </div>
            <Button 
              onClick={initialize} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Initializing...' : 'Initialize System'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold">WisdomNET Production</h1>
                  <p className="text-sm text-gray-400">Advanced AGI Development System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{metrics.active_agents} Active Agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{metrics.pending_tasks} Pending Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>{metrics.memory_entries} Memory Entries</span>
                </div>
              </div>
              
              <Badge 
                variant={metrics.system_load > 0.8 ? 'destructive' : 'default'}
                className="bg-white/10 border-white/20"
              >
                Load: {(metrics.system_load * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 bg-white/5 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
              <Activity className="w-3 h-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="hil" className="data-[state=active]:bg-white/10">
              <Eye className="w-3 h-3 mr-1" />
              HIL
            </TabsTrigger>
            <TabsTrigger value="ai-models" className="data-[state=active]:bg-white/10">
              <Brain className="w-3 h-3 mr-1" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="vector-memory" className="data-[state=active]:bg-white/10">
              <Database className="w-3 h-3 mr-1" />
              Vector Memory
            </TabsTrigger>
            <TabsTrigger value="realtime" className="data-[state=active]:bg-white/10">
              <Zap className="w-3 h-3 mr-1" />
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10">
              <TrendingUp className="w-3 h-3 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="testing" className="data-[state=active]:bg-white/10">
              <Settings className="w-3 h-3 mr-1" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="system-map" className="data-[state=active]:bg-white/10">
              <Users className="w-3 h-3 mr-1" />
              System Map
            </TabsTrigger>
            <TabsTrigger value="3d-view" className="data-[state=active]:bg-white/10">
              <Activity className="w-3 h-3 mr-1" />
              3D View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Agents</p>
                      <p className="text-3xl font-bold text-green-400">{metrics.active_agents}</p>
                    </div>
                    <Users className="w-12 h-12 text-green-400/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Pending Tasks</p>
                      <p className="text-3xl font-bold text-blue-400">{metrics.pending_tasks}</p>
                    </div>
                    <Activity className="w-12 h-12 text-blue-400/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Completed (24h)</p>
                      <p className="text-3xl font-bold text-purple-400">{metrics.completed_tasks_24h}</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-purple-400/50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">System Load</p>
                      <p className={`text-3xl font-bold ${metrics.system_load > 0.8 ? 'text-red-400' : 'text-green-400'}`}>
                        {(metrics.system_load * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Settings className="w-12 h-12 text-gray-400/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Agent Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agents.slice(0, 6).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-400">{agent.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={agent.status === 'active' ? 'default' : 'secondary'}
                          className="bg-white/10"
                        >
                          {agent.status}
                        </Badge>
                        <div className="text-sm text-right">
                          <div>{(agent.performance_score * 100).toFixed(0)}%</div>
                          <div className="text-xs text-gray-500">Performance</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.slice(0, 6).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-400">{task.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 'secondary'}
                          className="bg-white/10"
                        >
                          {task.status}
                        </Badge>
                        <div className="text-sm text-right">
                          <div>P{task.priority}</div>
                          <div className="text-xs text-gray-500">{(task.progress * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => handleCreateTask('research')}
                    variant="outline"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                  >
                    Create Research Task
                  </Button>
                  <Button 
                    onClick={() => handleCreateTask('code')}
                    variant="outline"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                  >
                    Create Code Task
                  </Button>
                  <Button 
                    onClick={() => handleCreateTask('analyze')}
                    variant="outline"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                  >
                    Create Analysis Task
                  </Button>
                  <Button 
                    onClick={refreshState}
                    variant="outline"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                  >
                    Refresh System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hil">
            <HILControlCenter
              agents={agents}
              tasks={tasks}
              onAgentAction={handleAgentAction}
              onTaskAction={handleTaskAction}
            />
          </TabsContent>

          <TabsContent value="ai-models">
            <AIModelOrchestrator />
          </TabsContent>

          <TabsContent value="vector-memory">
            <VectorMemorySystem />
          </TabsContent>

          <TabsContent value="realtime">
            <RealtimeMonitor />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="testing">
            <IntegrationTesting />
          </TabsContent>

          <TabsContent value="system-map">
            <ProductionSystemMap
              agents={agents}
              tasks={tasks}
              metrics={metrics}
            />
          </TabsContent>

          <TabsContent value="3d-view">
            <Card className="bg-white/5 border-white/10 h-[800px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  3D System Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <InfiniTree />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}