import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  Brain,
  Zap,
  Target
} from 'lucide-react';

export function AdvancedAnalytics() {
  const [performanceData, setPerformanceData] = useState([
    { time: '00:00', throughput: 45, latency: 120, accuracy: 96 },
    { time: '04:00', throughput: 52, latency: 115, accuracy: 97 },
    { time: '08:00', throughput: 78, latency: 98, accuracy: 95 },
    { time: '12:00', throughput: 89, latency: 105, accuracy: 98 },
    { time: '16:00', throughput: 76, latency: 110, accuracy: 96 },
    { time: '20:00', throughput: 64, latency: 125, accuracy: 94 }
  ]);

  const [agentEfficiency, setAgentEfficiency] = useState([
    { name: 'Orchestrator', value: 95, tasks: 234 },
    { name: 'Researcher', value: 87, tasks: 156 },
    { name: 'Coder', value: 92, tasks: 189 },
    { name: 'Analyst', value: 89, tasks: 167 },
    { name: 'Memory Mgr', value: 98, tasks: 78 }
  ]);

  const [taskDistribution, setTaskDistribution] = useState([
    { name: 'Code Generation', value: 35, color: '#8884d8' },
    { name: 'Research', value: 25, color: '#82ca9d' },
    { name: 'Analysis', value: 20, color: '#ffc658' },
    { name: 'Memory Ops', value: 12, color: '#ff7c7c' },
    { name: 'Orchestration', value: 8, color: '#8dd1e1' }
  ]);

  const [insights, setInsights] = useState([
    {
      type: 'performance',
      title: 'Peak Performance Window',
      description: 'System performs 23% better during 10:00-14:00 UTC',
      impact: 'high',
      recommendation: 'Schedule critical tasks during peak hours'
    },
    {
      type: 'efficiency',
      title: 'Memory System Optimization',
      description: 'Vector search latency reduced by 34% after recent updates',
      impact: 'medium',
      recommendation: 'Apply similar optimizations to other subsystems'
    },
    {
      type: 'capacity',
      title: 'Agent Load Balancing',
      description: 'Researcher agents approaching capacity limit',
      impact: 'medium',
      recommendation: 'Consider spawning additional researcher instances'
    }
  ]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5" />
            Advanced Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">98.5%</div>
              <div className="text-sm text-muted-foreground">Overall Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1.2M</div>
              <div className="text-sm text-muted-foreground">Tasks Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">89ms</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">$2.34</div>
              <div className="text-sm text-muted-foreground">Cost per Hour</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Agent Efficiency</TabsTrigger>
          <TabsTrigger value="distribution">Task Distribution</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="throughput" 
                    stroke="#8884d8" 
                    name="Throughput (req/min)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#82ca9d" 
                    name="Accuracy (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Efficiency Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-5 gap-4 mt-6">
                {agentEfficiency.map((agent, index) => (
                  <div key={index} className="text-center p-3 border rounded-lg">
                    <div className="font-semibold text-sm">{agent.name}</div>
                    <div className="text-2xl font-bold text-blue-600">{agent.value}%</div>
                    <div className="text-xs text-muted-foreground">{agent.tasks} tasks</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {taskDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-lg font-bold">{item.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <h3 className="font-semibold">{insight.title}</h3>
                    </div>
                    <Badge className={getImpactColor(insight.impact)} variant="secondary">
                      {insight.impact} impact
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-600">
                      Recommendation: {insight.recommendation}
                    </div>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <div className="text-lg font-bold">2.3x</div>
                  <div className="text-sm text-muted-foreground">Performance boost predicted with optimization</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <div className="text-lg font-bold">45%</div>
                  <div className="text-sm text-muted-foreground">Cost reduction potential identified</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Brain className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-lg font-bold">12h</div>
                  <div className="text-sm text-muted-foreground">Estimated time to next breakthrough</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}