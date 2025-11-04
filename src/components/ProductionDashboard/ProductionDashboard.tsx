import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Zap,
  TrendingUp,
  Server,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

export const ProductionDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock deployment data
  const deployments = [
    {
      id: '1',
      name: 'Code Generation Pipeline',
      environment: 'production',
      status: 'active',
      executionCount: 1250,
      errorRate: 0.02,
      avgLatencyMs: 450
    },
    {
      id: '2',
      name: 'Research Analysis Chain',
      environment: 'staging',
      status: 'active',
      executionCount: 89,
      errorRate: 0.05,
      avgLatencyMs: 680
    },
    {
      id: '3',
      name: 'Content Creation Flow',
      environment: 'production',
      status: 'active',
      executionCount: 2100,
      errorRate: 0.01,
      avgLatencyMs: 320
    }
  ];

  const metrics = {
    totalExecutions: 3439,
    avgLatency: 483,
    successRate: 98.2,
    activeDeployments: 3
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-mind">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neural-glow">
                  Production Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Monitor and manage deployed orchestration chains
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2">
                <Activity className="w-3 h-3" />
                All Systems Operational
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Executions</span>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-neural-glow">
                {metrics.totalExecutions.toLocaleString()}
              </div>
              <div className="text-xs text-green-500 mt-1">+12.5% from last hour</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Latency</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-neural-glow">
                {metrics.avgLatency}ms
              </div>
              <div className="text-xs text-green-500 mt-1">-8% from baseline</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-neural-glow">
                {metrics.successRate}%
              </div>
              <div className="text-xs text-green-500 mt-1">Above target</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Deployments</span>
                <Server className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-neural-glow">
                {metrics.activeDeployments}
              </div>
              <div className="text-xs text-muted-foreground mt-1">All healthy</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b bg-muted/30">
            <div className="container mx-auto px-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="deployments" className="gap-2">
                  <Server className="w-4 h-4" />
                  Deployments
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="container mx-auto max-w-7xl">
              <TabsContent value="overview" className="m-0">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Active Deployments</h2>
                  <div className="grid gap-4">
                    {deployments.map((deployment) => (
                      <Card key={deployment.id} className="p-4 hover:bg-accent/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{deployment.name}</h3>
                              <Badge variant={deployment.environment === 'production' ? 'default' : 'secondary'}>
                                {deployment.environment}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Activity className="w-3 h-3" />
                                {deployment.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Executions: </span>
                                <span className="font-medium">{deployment.executionCount.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Error Rate: </span>
                                <span className={`font-medium ${deployment.errorRate < 0.05 ? 'text-green-500' : 'text-yellow-500'}`}>
                                  {(deployment.errorRate * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Avg Latency: </span>
                                <span className="font-medium">{deployment.avgLatencyMs}ms</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Logs
                            </Button>
                            <Button variant="outline" size="sm">
                              Metrics
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deployments" className="m-0">
                <Card className="p-8 text-center">
                  <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Detailed deployment management coming soon
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="m-0">
                <Card className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Advanced analytics and insights coming soon
                  </p>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
