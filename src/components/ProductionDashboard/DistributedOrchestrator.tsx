import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Network, 
  Cpu, 
  HardDrive, 
  Globe, 
  Zap, 
  Activity,
  Users,
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Maximize
} from 'lucide-react';

interface DistributedNode {
  id: string;
  name: string;
  location: string;
  type: 'coordinator' | 'worker' | 'storage' | 'edge';
  status: 'online' | 'offline' | 'maintenance' | 'overloaded';
  cpu_usage: number;
  memory_usage: number;
  storage_usage: number;
  network_latency: number;
  tasks_processing: number;
  capacity: number;
  last_heartbeat: Date;
  region: string;
}

interface DistributedTask {
  id: string;
  name: string;
  type: 'computation' | 'storage' | 'ai_inference' | 'data_processing';
  status: 'queued' | 'distributing' | 'processing' | 'completed' | 'failed';
  assigned_nodes: string[];
  priority: number;
  progress: number;
  estimated_completion: Date;
  resource_requirements: {
    cpu: number;
    memory: number;
    storage: number;
  };
  dependencies: string[];
}

interface OrchestrationMetrics {
  total_nodes: number;
  active_nodes: number;
  total_tasks: number;
  completed_tasks: number;
  average_latency: number;
  throughput: number;
  resource_utilization: number;
  fault_tolerance: number;
}

export function DistributedOrchestrator() {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<DistributedNode[]>([]);
  const [tasks, setTasks] = useState<DistributedTask[]>([]);
  const [metrics, setMetrics] = useState<OrchestrationMetrics>({
    total_nodes: 0,
    active_nodes: 0,
    total_tasks: 0,
    completed_tasks: 0,
    average_latency: 0,
    throughput: 0,
    resource_utilization: 0,
    fault_tolerance: 0
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [orchestrationMode, setOrchestrationMode] = useState<'automatic' | 'manual' | 'hybrid'>('automatic');

  useEffect(() => {
    initializeDistributedSystem();
    
    const interval = setInterval(() => {
      updateNodeMetrics();
      updateTaskProgress();
      updateOrchestrationMetrics();
      simulateSystemEvents();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const initializeDistributedSystem = () => {
    const initialNodes: DistributedNode[] = [
      {
        id: 'coord-us-east',
        name: 'US East Coordinator',
        location: 'Virginia',
        type: 'coordinator',
        status: 'online',
        cpu_usage: 45,
        memory_usage: 67,
        storage_usage: 34,
        network_latency: 12,
        tasks_processing: 8,
        capacity: 16,
        last_heartbeat: new Date(),
        region: 'us-east-1'
      },
      {
        id: 'worker-us-west',
        name: 'US West Worker Cluster',
        location: 'California',
        type: 'worker',
        status: 'online',
        cpu_usage: 78,
        memory_usage: 82,
        storage_usage: 45,
        network_latency: 89,
        tasks_processing: 12,
        capacity: 16,
        last_heartbeat: new Date(),
        region: 'us-west-1'
      },
      {
        id: 'edge-eu-central',
        name: 'EU Central Edge',
        location: 'Frankfurt',
        type: 'edge',
        status: 'online',
        cpu_usage: 23,
        memory_usage: 34,
        storage_usage: 12,
        network_latency: 156,
        tasks_processing: 3,
        capacity: 8,
        last_heartbeat: new Date(),
        region: 'eu-central-1'
      },
      {
        id: 'storage-asia',
        name: 'Asia Storage Cluster',
        location: 'Singapore',
        type: 'storage',
        status: 'online',
        cpu_usage: 15,
        memory_usage: 45,
        storage_usage: 78,
        network_latency: 234,
        tasks_processing: 2,
        capacity: 4,
        last_heartbeat: new Date(),
        region: 'ap-southeast-1'
      }
    ];

    const initialTasks: DistributedTask[] = [
      {
        id: 'task-ai-inference-1',
        name: 'Large Language Model Inference',
        type: 'ai_inference',
        status: 'processing',
        assigned_nodes: ['worker-us-west', 'coord-us-east'],
        priority: 8,
        progress: 67,
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000),
        resource_requirements: {
          cpu: 80,
          memory: 90,
          storage: 20
        },
        dependencies: []
      },
      {
        id: 'task-data-proc-1',
        name: 'Multi-modal Data Processing',
        type: 'data_processing',
        status: 'distributing',
        assigned_nodes: ['edge-eu-central', 'storage-asia'],
        priority: 6,
        progress: 23,
        estimated_completion: new Date(Date.now() + 12 * 60 * 1000),
        resource_requirements: {
          cpu: 45,
          memory: 60,
          storage: 85
        },
        dependencies: ['task-ai-inference-1']
      }
    ];

    setNodes(initialNodes);
    setTasks(initialTasks);
  };

  const updateNodeMetrics = () => {
    setNodes(prev => prev.map(node => ({
      ...node,
      cpu_usage: Math.max(0, Math.min(100, node.cpu_usage + (Math.random() - 0.5) * 10)),
      memory_usage: Math.max(0, Math.min(100, node.memory_usage + (Math.random() - 0.5) * 8)),
      storage_usage: Math.max(0, Math.min(100, node.storage_usage + (Math.random() - 0.5) * 2)),
      network_latency: Math.max(5, node.network_latency + (Math.random() - 0.5) * 20),
      tasks_processing: Math.max(0, Math.min(node.capacity, node.tasks_processing + Math.floor((Math.random() - 0.5) * 3))),
      last_heartbeat: new Date(),
      status: node.cpu_usage > 95 ? 'overloaded' : 
              Math.random() > 0.98 ? 'maintenance' : 'online'
    })));
  };

  const updateTaskProgress = () => {
    setTasks(prev => prev.map(task => {
      if (task.status === 'processing') {
        const newProgress = Math.min(100, task.progress + Math.random() * 5);
        return {
          ...task,
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : 'processing'
        };
      }
      if (task.status === 'distributing' && Math.random() > 0.7) {
        return { ...task, status: 'processing' };
      }
      return task;
    }));
  };

  const updateOrchestrationMetrics = () => {
    const activeNodes = nodes.filter(n => n.status === 'online').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const avgLatency = nodes.reduce((sum, node) => sum + node.network_latency, 0) / nodes.length;
    const avgUtilization = nodes.reduce((sum, node) => sum + (node.cpu_usage + node.memory_usage) / 2, 0) / nodes.length;

    setMetrics({
      total_nodes: nodes.length,
      active_nodes: activeNodes,
      total_tasks: tasks.length,
      completed_tasks: completedTasks,
      average_latency: avgLatency,
      throughput: 45 + Math.random() * 20,
      resource_utilization: avgUtilization,
      fault_tolerance: (activeNodes / nodes.length) * 100
    });
  };

  const simulateSystemEvents = () => {
    // Randomly spawn new tasks
    if (Math.random() > 0.95 && tasks.length < 10) {
      const taskTypes = ['computation', 'storage', 'ai_inference', 'data_processing'] as const;
      const newTask: DistributedTask = {
        id: `task-${Date.now()}`,
        name: `Auto-generated ${taskTypes[Math.floor(Math.random() * taskTypes.length)]} task`,
        type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
        status: 'queued',
        assigned_nodes: [],
        priority: Math.floor(Math.random() * 10) + 1,
        progress: 0,
        estimated_completion: new Date(Date.now() + (5 + Math.random() * 15) * 60 * 1000),
        resource_requirements: {
          cpu: Math.floor(Math.random() * 80) + 20,
          memory: Math.floor(Math.random() * 70) + 30,
          storage: Math.floor(Math.random() * 60) + 10
        },
        dependencies: []
      };

      setTasks(prev => [...prev, newTask]);
      
      toast({
        title: "New Task Queued",
        description: `${newTask.name} added to orchestration queue`,
      });
    }
  };

  const assignTaskToNode = (taskId: string, nodeId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assigned_nodes: [...task.assigned_nodes, nodeId],
          status: task.assigned_nodes.length === 0 ? 'distributing' : task.status
        };
      }
      return task;
    }));

    toast({
      title: "Task Assigned",
      description: `Task assigned to node ${nodeId}`,
    });
  };

  const rebalanceLoad = () => {
    const overloadedNodes = nodes.filter(n => n.cpu_usage > 85 || n.memory_usage > 90);
    const availableNodes = nodes.filter(n => n.cpu_usage < 60 && n.memory_usage < 70 && n.status === 'online');

    if (overloadedNodes.length > 0 && availableNodes.length > 0) {
      toast({
        title: "Load Rebalancing",
        description: `Redistributing tasks from ${overloadedNodes.length} overloaded nodes`,
      });
    }
  };

  const getNodeStatusColor = (status: DistributedNode['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'overloaded': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaskStatusColor = (status: DistributedTask['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'distributing': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getNodeTypeIcon = (type: DistributedNode['type']) => {
    switch (type) {
      case 'coordinator': return Network;
      case 'worker': return Cpu;
      case 'storage': return HardDrive;
      case 'edge': return Globe;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Nodes</p>
                <p className="text-2xl font-bold">{metrics.total_nodes}</p>
                <p className="text-xs text-green-600">{metrics.active_nodes} active</p>
              </div>
              <Network className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Throughput</p>
                <p className="text-2xl font-bold">{Math.round(metrics.throughput)}</p>
                <p className="text-xs text-muted-foreground">tasks/min</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{Math.round(metrics.average_latency)}</p>
                <p className="text-xs text-muted-foreground">ms</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fault Tolerance</p>
                <p className="text-2xl font-bold">{Math.round(metrics.fault_tolerance)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orchestration Control</CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={orchestrationMode === 'automatic' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setOrchestrationMode('automatic')}
              >
                Automatic
              </Badge>
              <Badge 
                variant={orchestrationMode === 'hybrid' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setOrchestrationMode('hybrid')}
              >
                Hybrid
              </Badge>
              <Badge 
                variant={orchestrationMode === 'manual' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setOrchestrationMode('manual')}
              >
                Manual
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={rebalanceLoad} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Rebalance Load
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Config
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Report
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Resource Utilization:</span>
              <Progress value={metrics.resource_utilization} className="w-32" />
              <span className="text-sm font-medium">{Math.round(metrics.resource_utilization)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs defaultValue="topology" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="topology">Network Topology</TabsTrigger>
          <TabsTrigger value="tasks">Task Distribution</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nodes.map((node) => {
              const NodeIcon = getNodeTypeIcon(node.type);
              return (
                <Card 
                  key={node.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedNode === node.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <NodeIcon className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium text-sm">{node.name}</h4>
                          <p className="text-xs text-muted-foreground">{node.location} ({node.region})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getNodeStatusColor(node.status)}`} />
                        <Badge variant="outline" className="text-xs">{node.type}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>CPU Usage</span>
                          <span>{Math.round(node.cpu_usage)}%</span>
                        </div>
                        <Progress value={node.cpu_usage} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Memory</span>
                          <span>{Math.round(node.memory_usage)}%</span>
                        </div>
                        <Progress value={node.memory_usage} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Storage</span>
                          <span>{Math.round(node.storage_usage)}%</span>
                        </div>
                        <Progress value={node.storage_usage} className="h-1" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{node.tasks_processing}/{node.capacity} tasks</span>
                      <span>{Math.round(node.network_latency)}ms latency</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{task.name}</h4>
                        <Badge variant="outline">{task.type}</Badge>
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Priority: {task.priority}/10 • 
                        ETA: {task.estimated_completion.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{Math.round(task.progress)}%</p>
                      <Progress value={task.progress} className="w-24 h-2" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-muted-foreground">CPU Req</span>
                      <p className="text-sm font-medium">{task.resource_requirements.cpu}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Memory Req</span>
                      <p className="text-sm font-medium">{task.resource_requirements.memory}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Storage Req</span>
                      <p className="text-sm font-medium">{task.resource_requirements.storage}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Assigned to:</span>
                      {task.assigned_nodes.length === 0 ? (
                        <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                      ) : (
                        task.assigned_nodes.map(nodeId => (
                          <Badge key={nodeId} variant="outline" className="text-xs">
                            {nodes.find(n => n.id === nodeId)?.name || nodeId}
                          </Badge>
                        ))
                      )}
                    </div>
                    
                    {orchestrationMode !== 'automatic' && task.assigned_nodes.length === 0 && (
                      <div className="flex gap-1">
                        {nodes.filter(n => n.status === 'online').map(node => (
                          <Button
                            key={node.id}
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                            onClick={() => assignTaskToNode(task.id, node.id)}
                          >
                            {node.name.split(' ')[0]}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall System Health</span>
                      <span>{Math.round(metrics.fault_tolerance)}%</span>
                    </div>
                    <Progress value={metrics.fault_tolerance} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Resource Utilization</span>
                      <span>{Math.round(metrics.resource_utilization)}%</span>
                    </div>
                    <Progress value={metrics.resource_utilization} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Performance</span>
                      <span>{Math.round(100 - metrics.average_latency / 5)}%</span>
                    </div>
                    <Progress value={100 - metrics.average_latency / 5} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Tasks</span>
                    <span className="text-lg font-bold">{metrics.total_tasks}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-lg font-bold text-green-600">{metrics.completed_tasks}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Processing</span>
                    <span className="text-lg font-bold text-blue-600">
                      {tasks.filter(t => t.status === 'processing').length}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Queued</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {tasks.filter(t => t.status === 'queued').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Throughput</span>
                    <span className="text-sm font-medium">{Math.round(metrics.throughput)} tasks/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Latency</span>
                    <span className="text-sm font-medium">{Math.round(metrics.average_latency)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost Efficiency</span>
                    <span className="text-sm font-medium">$0.023/task</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Compute Tasks</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">AI Inference</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Data Processing</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Storage Operations</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">US East</span>
                    <span className="text-sm font-medium">12ms avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">US West</span>
                    <span className="text-sm font-medium">89ms avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">EU Central</span>
                    <span className="text-sm font-medium">156ms avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Asia Pacific</span>
                    <span className="text-sm font-medium">234ms avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}