import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWisdomNET } from '@/contexts/WisdomNETContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Cpu, 
  Database, 
  Network,
  Activity,
  Zap,
  Shield,
  Search,
  Globe,
  Eye,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface SystemMetrics {
  neuralActivity: number;
  memoryUsage: number;
  processingLoad: number;
  connectionStrength: number;
  autonomyLevel: number;
}

interface NeuralConnection {
  id: string;
  source: string;
  target: string;
  strength: number;
  type: 'memory' | 'processing' | 'data';
  active: boolean;
}

export function EnhancedOrchestrator() {
  const { agents, tasks, activities } = useWisdomNET();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    neuralActivity: 85,
    memoryUsage: 67,
    processingLoad: 72,
    connectionStrength: 91,
    autonomyLevel: 78
  });
  
  const [connections, setConnections] = useState<NeuralConnection[]>([]);
  const [systemStatus, setSystemStatus] = useState<'active' | 'paused' | 'initializing'>('active');
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  useEffect(() => {
    // Initialize neural connections
    const initConnections = () => {
      const newConnections: NeuralConnection[] = [];
      const nodeTypes = ['memory', 'processing', 'agent', 'task'];
      
      for (let i = 0; i < 50; i++) {
        newConnections.push({
          id: `conn_${i}`,
          source: `${nodeTypes[Math.floor(Math.random() * nodeTypes.length)]}_${Math.floor(Math.random() * 10)}`,
          target: `${nodeTypes[Math.floor(Math.random() * nodeTypes.length)]}_${Math.floor(Math.random() * 10)}`,
          strength: Math.random(),
          type: ['memory', 'processing', 'data'][Math.floor(Math.random() * 3)] as 'memory' | 'processing' | 'data',
          active: Math.random() > 0.3
        });
      }
      setConnections(newConnections);
    };

    initConnections();

    // Real-time metrics update
    const metricsInterval = setInterval(() => {
      setMetrics(prev => ({
        neuralActivity: Math.max(0, Math.min(100, prev.neuralActivity + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        processingLoad: Math.max(0, Math.min(100, prev.processingLoad + (Math.random() - 0.5) * 12)),
        connectionStrength: Math.max(0, Math.min(100, prev.connectionStrength + (Math.random() - 0.5) * 5)),
        autonomyLevel: Math.max(0, Math.min(100, prev.autonomyLevel + (Math.random() - 0.5) * 6))
      }));

      // Update connection activity
      setConnections(prev => prev.map(conn => ({
        ...conn,
        active: Math.random() > 0.4,
        strength: Math.max(0, Math.min(1, conn.strength + (Math.random() - 0.5) * 0.2))
      })));
    }, 2000);

    // Real-time data simulation
    const dataInterval = setInterval(() => {
      setRealTimeData(prev => [
        ...prev.slice(-20),
        {
          timestamp: new Date().toISOString(),
          event: ['neural_spike', 'memory_access', 'task_complete', 'agent_activate'][Math.floor(Math.random() * 4)],
          intensity: Math.random(),
          node: `node_${Math.floor(Math.random() * 20)}`
        }
      ]);
    }, 1000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const getMetricColor = (value: number) => {
    if (value > 80) return 'text-green-400 bg-green-500/20';
    if (value > 60) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'memory': return 'stroke-blue-400';
      case 'processing': return 'stroke-green-400';
      case 'data': return 'stroke-purple-400';
      default: return 'stroke-gray-400';
    }
  };

  const toggleSystemStatus = () => {
    setSystemStatus(prev => prev === 'active' ? 'paused' : 'active');
  };

  return (
    <div className="space-y-6">
      {/* System Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WisdomNET Orchestrator</h1>
            <p className="text-muted-foreground">Neural Interface & System Control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={systemStatus === 'active' ? 'default' : 'secondary'}>
            {systemStatus}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSystemStatus}
          >
            {systemStatus === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="neural" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="neural">Neural Network</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="memory">Memory Index</TabsTrigger>
        </TabsList>

        <TabsContent value="neural" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Neural Network Visualization
            </h3>
            
            <div className="relative bg-muted/10 rounded-lg p-4 h-96 overflow-hidden">
              <svg width="100%" height="100%" className="absolute inset-0">
                {/* Neural Connections */}
                {connections.slice(0, 30).map((conn, index) => (
                  <g key={conn.id}>
                    <line
                      x1={Math.random() * 800}
                      y1={Math.random() * 300}
                      x2={Math.random() * 800}
                      y2={Math.random() * 300}
                      className={`${getConnectionColor(conn.type)} ${conn.active ? 'opacity-80' : 'opacity-20'}`}
                      strokeWidth={conn.strength * 2}
                    />
                  </g>
                ))}
                
                {/* Neural Nodes */}
                {Array.from({ length: 20 }).map((_, index) => (
                  <circle
                    key={index}
                    cx={Math.random() * 800}
                    cy={Math.random() * 300}
                    r={Math.random() * 8 + 4}
                    className="fill-primary animate-pulse"
                    opacity={Math.random() * 0.8 + 0.2}
                  />
                ))}
              </svg>
              
              <div className="absolute top-4 right-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-400 rounded-full" />
                  <span>Memory Paths</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span>Processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-purple-400 rounded-full" />
                  <span>Data Flow</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{connections.filter(c => c.active).length}</div>
                <div className="text-sm text-muted-foreground">Active Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{Math.floor(connections.reduce((acc, c) => acc + c.strength, 0))}</div>
                <div className="text-sm text-muted-foreground">Total Strength</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{realTimeData.length}</div>
                <div className="text-sm text-muted-foreground">Neural Events</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(metrics).map(([key, value]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getMetricColor(value)}`}>
                    {Math.round(value)}%
                  </span>
                </div>
                <Progress value={value} className="h-2" />
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Real-Time Neural Activity
            </h3>
            
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {realTimeData.slice(-15).reverse().map((event, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        event.event === 'neural_spike' ? 'bg-red-400' :
                        event.event === 'memory_access' ? 'bg-blue-400' :
                        event.event === 'task_complete' ? 'bg-green-400' :
                        'bg-purple-400'
                      }`} />
                      <span className="capitalize">{event.event.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">@{event.node}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map(agent => (
              <Card key={agent.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      agent.status === 'working' ? 'bg-green-500/20' :
                      agent.status === 'thinking' ? 'bg-blue-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.role}</p>
                    </div>
                  </div>
                  
                  <Badge variant={agent.status === 'working' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing Load</span>
                    <span>{Math.floor(Math.random() * 100)}%</span>
                  </div>
                  <Progress value={Math.random() * 100} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">{agent.workingMemory.length}</div>
                      <div className="text-xs text-muted-foreground">Memory Items</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">{agent.priority}</div>
                      <div className="text-xs text-muted-foreground">Priority</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-400">{Math.floor(Math.random() * 50)}</div>
                      <div className="text-xs text-muted-foreground">Tasks Done</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Memory Index Overview
            </h3>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">2.3K</div>
                <div className="text-sm text-muted-foreground">Memory Entries</div>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-green-400">156</div>
                <div className="text-sm text-muted-foreground">Active Indexes</div>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">89%</div>
                <div className="text-sm text-muted-foreground">Retrieval Rate</div>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">12ms</div>
                <div className="text-sm text-muted-foreground">Avg Access Time</div>
              </div>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-3">
                {Array.from({ length: 20 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        Math.random() > 0.5 ? 'bg-green-400' : 'bg-blue-400'
                      }`} />
                      <div>
                        <div className="font-medium">Memory Block {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {['Code Context', 'User Interaction', 'System State', 'Task History'][Math.floor(Math.random() * 4)]}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Relevance</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}