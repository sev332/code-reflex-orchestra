import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cpu, 
  Zap, 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface AIModel {
  id: string;
  name: string;
  type: 'reasoning' | 'creative' | 'analytical' | 'conversational';
  status: 'active' | 'idle' | 'busy' | 'error';
  performance: number;
  currentTasks: number;
  maxTasks: number;
  avgResponseTime: number;
  successRate: number;
  cost: number;
}

export function AIModelOrchestrator() {
  const [models, setModels] = useState<AIModel[]>([
    {
      id: 'gpt-5',
      name: 'GPT-5 Flagship',
      type: 'reasoning',
      status: 'active',
      performance: 0.95,
      currentTasks: 3,
      maxTasks: 10,
      avgResponseTime: 1200,
      successRate: 0.98,
      cost: 0.03
    },
    {
      id: 'o3',
      name: 'O3 Reasoning',
      type: 'analytical',
      status: 'busy',
      performance: 0.92,
      currentTasks: 8,
      maxTasks: 8,
      avgResponseTime: 2100,
      successRate: 0.96,
      cost: 0.05
    },
    {
      id: 'claude-3.5',
      name: 'Claude 3.5 Sonnet',
      type: 'creative',
      status: 'active',
      performance: 0.89,
      currentTasks: 2,
      maxTasks: 12,
      avgResponseTime: 800,
      successRate: 0.94,
      cost: 0.02
    },
    {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      type: 'conversational',
      status: 'idle',
      performance: 0.88,
      currentTasks: 0,
      maxTasks: 15,
      avgResponseTime: 600,
      successRate: 0.92,
      cost: 0.01
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    totalRequests: 1247,
    avgLatency: 950,
    errorRate: 0.02,
    costPerHour: 2.34,
    throughput: 45.7
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setModels(prev => prev.map(model => ({
        ...model,
        currentTasks: Math.max(0, model.currentTasks + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
        avgResponseTime: model.avgResponseTime + (Math.random() - 0.5) * 100,
        performance: Math.max(0.7, Math.min(1, model.performance + (Math.random() - 0.5) * 0.02))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: AIModel['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'busy': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'idle': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: AIModel['type']) => {
    switch (type) {
      case 'reasoning': return 'bg-purple-100 text-purple-800';
      case 'creative': return 'bg-pink-100 text-pink-800';
      case 'analytical': return 'bg-blue-100 text-blue-800';
      case 'conversational': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModelAction = (modelId: string, action: 'pause' | 'resume' | 'restart') => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, status: action === 'pause' ? 'idle' : 'active' }
        : model
    ));
    toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} action applied to model`);
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="w-5 h-5" />
            AI Model Orchestrator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemMetrics.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemMetrics.avgLatency}ms</div>
              <div className="text-sm text-muted-foreground">Avg Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{(systemMetrics.errorRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${systemMetrics.costPerHour.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Cost/Hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemMetrics.throughput}</div>
              <div className="text-sm text-muted-foreground">Req/Min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">Active Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="routing">Smart Routing</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          {models.map((model) => (
            <Card key={model.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(model.status)}
                    <div>
                      <h3 className="font-semibold">{model.name}</h3>
                      <Badge className={getTypeColor(model.type)} variant="secondary">
                        {model.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModelAction(model.id, 'pause')}
                    >
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModelAction(model.id, 'restart')}
                    >
                      Restart
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold">{model.currentTasks}/{model.maxTasks}</div>
                    <div className="text-xs text-muted-foreground">Active Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{model.avgResponseTime.toFixed(0)}ms</div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{(model.successRate * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">${model.cost.toFixed(3)}</div>
                    <div className="text-xs text-muted-foreground">Cost/1K tokens</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance</span>
                    <span>{(model.performance * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={model.performance * 100} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Capacity</span>
                    <span>{((model.currentTasks / model.maxTasks) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(model.currentTasks / model.maxTasks) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{model.name}</div>
                      <Badge className={getTypeColor(model.type)} variant="secondary">
                        {model.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{(model.performance * 100).toFixed(0)}%</div>
                        <div className="text-muted-foreground">Performance</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{model.avgResponseTime.toFixed(0)}ms</div>
                        <div className="text-muted-foreground">Latency</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">${model.cost.toFixed(3)}</div>
                        <div className="text-muted-foreground">Cost</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Intelligent Routing Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-2">Creative Tasks → Claude 3.5 Sonnet</div>
                  <div className="text-sm text-muted-foreground">
                    Writing, brainstorming, creative problem solving
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-2">Complex Reasoning → O3 Reasoning</div>
                  <div className="text-sm text-muted-foreground">
                    Multi-step analysis, mathematical problems, logical reasoning
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-2">General Tasks → GPT-5 Flagship</div>
                  <div className="text-sm text-muted-foreground">
                    Balanced performance for most use cases
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-2">Quick Responses → GPT-4.1 Mini</div>
                  <div className="text-sm text-muted-foreground">
                    Simple queries, fast responses, cost-efficient
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