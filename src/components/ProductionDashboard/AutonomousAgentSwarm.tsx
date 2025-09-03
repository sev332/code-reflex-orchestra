import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Brain, 
  Zap, 
  Network, 
  Target, 
  Activity, 
  Users,
  Bot,
  Workflow,
  ChevronRight,
  Plus,
  Settings,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface AgentSwarmNode {
  id: string;
  name: string;
  type: 'coordinator' | 'specialist' | 'scout' | 'executor' | 'analyzer';
  status: 'active' | 'idle' | 'learning' | 'collaborating' | 'spawning';
  capabilities: string[];
  performance_score: number;
  task_count: number;
  spawn_count: number;
  collaboration_links: string[];
  learning_progress: number;
  specialization_depth: number;
}

interface SwarmMetrics {
  total_agents: number;
  active_swarms: number;
  collective_intelligence: number;
  emergence_events: number;
  self_optimization_rate: number;
  knowledge_synthesis: number;
}

export function AutonomousAgentSwarm() {
  const { toast } = useToast();
  const [swarmNodes, setSwarmNodes] = useState<AgentSwarmNode[]>([]);
  const [metrics, setMetrics] = useState<SwarmMetrics>({
    total_agents: 0,
    active_swarms: 0,
    collective_intelligence: 0,
    emergence_events: 0,
    self_optimization_rate: 0,
    knowledge_synthesis: 0
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [swarmMode, setSwarmMode] = useState<'autonomous' | 'guided' | 'experimental'>('autonomous');

  useEffect(() => {
    // Initialize swarm with seed agents
    initializeSwarm();
    
    // Start swarm monitoring
    const interval = setInterval(() => {
      updateSwarmState();
      simulateEmergentBehavior();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const initializeSwarm = () => {
    const seedAgents: AgentSwarmNode[] = [
      {
        id: 'coordinator-alpha',
        name: 'Alpha Coordinator',
        type: 'coordinator',
        status: 'active',
        capabilities: ['task_distribution', 'resource_allocation', 'strategic_planning'],
        performance_score: 0.95,
        task_count: 47,
        spawn_count: 12,
        collaboration_links: ['spec-001', 'spec-002'],
        learning_progress: 0.89,
        specialization_depth: 0.92
      },
      {
        id: 'spec-001',
        name: 'Research Specialist',
        type: 'specialist',
        status: 'learning',
        capabilities: ['data_analysis', 'pattern_recognition', 'knowledge_synthesis'],
        performance_score: 0.87,
        task_count: 23,
        spawn_count: 5,
        collaboration_links: ['coordinator-alpha', 'analyzer-001'],
        learning_progress: 0.76,
        specialization_depth: 0.94
      },
      {
        id: 'scout-001',
        name: 'Intelligence Scout',
        type: 'scout',
        status: 'active',
        capabilities: ['environment_scanning', 'opportunity_detection', 'threat_assessment'],
        performance_score: 0.91,
        task_count: 67,
        spawn_count: 8,
        collaboration_links: [],
        learning_progress: 0.82,
        specialization_depth: 0.88
      }
    ];

    setSwarmNodes(seedAgents);
    updateMetrics(seedAgents);
  };

  const updateSwarmState = () => {
    setSwarmNodes(prev => prev.map(node => ({
      ...node,
      performance_score: Math.min(1, node.performance_score + (Math.random() - 0.4) * 0.02),
      learning_progress: Math.min(1, node.learning_progress + Math.random() * 0.01),
      task_count: node.task_count + Math.floor(Math.random() * 3),
      status: Math.random() > 0.8 ? 
        (['active', 'learning', 'collaborating'] as const)[Math.floor(Math.random() * 3)] : 
        node.status
    })));
  };

  const simulateEmergentBehavior = () => {
    // Simulate agent spawning
    if (Math.random() > 0.95 && swarmNodes.length < 15) {
      spawnNewAgent();
    }

    // Update collective metrics
    setMetrics(prev => ({
      ...prev,
      collective_intelligence: prev.collective_intelligence + Math.random() * 0.5,
      emergence_events: prev.emergence_events + (Math.random() > 0.9 ? 1 : 0),
      self_optimization_rate: Math.min(100, prev.self_optimization_rate + Math.random() * 0.2),
      knowledge_synthesis: Math.min(100, prev.knowledge_synthesis + Math.random() * 0.3)
    }));
  };

  const spawnNewAgent = () => {
    const agentTypes = ['specialist', 'executor', 'analyzer'] as const;
    const newAgent: AgentSwarmNode = {
      id: `agent-${Date.now()}`,
      name: `Emergent Agent ${swarmNodes.length + 1}`,
      type: agentTypes[Math.floor(Math.random() * agentTypes.length)],
      status: 'spawning',
      capabilities: ['adaptive_learning', 'task_execution'],
      performance_score: 0.5 + Math.random() * 0.3,
      task_count: 0,
      spawn_count: 0,
      collaboration_links: [],
      learning_progress: Math.random() * 0.3,
      specialization_depth: Math.random() * 0.5
    };

    setSwarmNodes(prev => [...prev, newAgent]);
    
    toast({
      title: "Agent Spawned",
      description: `New ${newAgent.type} agent emerged in the swarm`,
    });
  };

  const updateMetrics = (nodes: AgentSwarmNode[]) => {
    setMetrics({
      total_agents: nodes.length,
      active_swarms: Math.ceil(nodes.length / 5),
      collective_intelligence: nodes.reduce((sum, node) => sum + node.performance_score, 0) / nodes.length * 100,
      emergence_events: 0,
      self_optimization_rate: 0,
      knowledge_synthesis: 0
    });
  };

  const getNodeStatusColor = (status: AgentSwarmNode['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'learning': return 'bg-blue-500';
      case 'collaborating': return 'bg-purple-500';
      case 'spawning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getNodeIcon = (type: AgentSwarmNode['type']) => {
    switch (type) {
      case 'coordinator': return Brain;
      case 'specialist': return Target;
      case 'scout': return Eye;
      case 'executor': return Zap;
      case 'analyzer': return Activity;
      default: return Bot;
    }
  };

  return (
    <div className="space-y-6">
      {/* Swarm Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{metrics.total_agents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Swarms</p>
                <p className="text-2xl font-bold">{metrics.active_swarms}</p>
              </div>
              <Network className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collective IQ</p>
                <p className="text-2xl font-bold">{Math.round(metrics.collective_intelligence)}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emergence Events</p>
                <p className="text-2xl font-bold">{metrics.emergence_events}</p>
              </div>
              <Workflow className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Self-Optimization</p>
                <p className="text-2xl font-bold">{Math.round(metrics.self_optimization_rate)}%</p>
              </div>
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Knowledge Synthesis</p>
                <p className="text-2xl font-bold">{Math.round(metrics.knowledge_synthesis)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swarm Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={spawnNewAgent}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Spawn Agent
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Swarm Mode:</span>
            <Badge variant={swarmMode === 'autonomous' ? 'default' : 'secondary'}>
              {swarmMode.charAt(0).toUpperCase() + swarmMode.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {swarmMode === 'experimental' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Experimental Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Swarm Visualization */}
      <Tabs defaultValue="network" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="network">Network View</TabsTrigger>
          <TabsTrigger value="agents">Agent Details</TabsTrigger>
          <TabsTrigger value="emergence">Emergence Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Swarm Network Topology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {swarmNodes.map((node) => {
                  const IconComponent = getNodeIcon(node.type);
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
                            <IconComponent className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium text-sm">{node.name}</h4>
                              <p className="text-xs text-muted-foreground">{node.type}</p>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getNodeStatusColor(node.status)}`} />
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Performance</span>
                              <span>{Math.round(node.performance_score * 100)}%</span>
                            </div>
                            <Progress value={node.performance_score * 100} className="h-1" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Learning</span>
                              <span>{Math.round(node.learning_progress * 100)}%</span>
                            </div>
                            <Progress value={node.learning_progress * 100} className="h-1" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>{node.task_count} tasks</span>
                          <span>{node.spawn_count} spawned</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Capabilities & Specialization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {swarmNodes.map((node) => (
                  <div key={node.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{node.type}</Badge>
                        <span className="font-medium">{node.name}</span>
                        <Badge className={getNodeStatusColor(node.status).replace('bg-', 'bg-opacity-20 text-')}>
                          {node.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Specialization: {Math.round(node.specialization_depth * 100)}%
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {node.capabilities.map((capability) => (
                        <Badge key={capability} variant="secondary" className="text-xs">
                          {capability.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Performance: {Math.round(node.performance_score * 100)}%</span>
                      <span>Tasks: {node.task_count}</span>
                      <span>Collaborations: {node.collaboration_links.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergent Intelligence Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Collective Learning Curves</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Knowledge Synthesis</span>
                        <span>{Math.round(metrics.knowledge_synthesis)}%</span>
                      </div>
                      <Progress value={metrics.knowledge_synthesis} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Self-Optimization</span>
                        <span>{Math.round(metrics.self_optimization_rate)}%</span>
                      </div>
                      <Progress value={metrics.self_optimization_rate} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Collective Intelligence</span>
                        <span>{Math.round(metrics.collective_intelligence)}%</span>
                      </div>
                      <Progress value={metrics.collective_intelligence} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Emergence Events</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">New Agent Spawning</span>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Capability Transfer</span>
                      <Badge variant="secondary">Detected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Swarm Optimization</span>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}