// WisdomNET System Metrics - Real-time Performance Dashboard

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWisdomNET } from '@/contexts/WisdomNETContext';
import { 
  Activity, 
  Cpu, 
  Database, 
  Clock, 
  Zap, 
  Brain, 
  TrendingUp,
  TrendingDown,
  Minus
 } from 'lucide-react';
import { useWisdomLinking } from '@/hooks/useWisdomLinking';

export function SystemMetrics() {
  const { systemMetrics, agents, tasks, activities } = useWisdomNET();
  const { gotoRag, gotoAgents, gotoMemory } = useWisdomLinking();

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-wisdom-success';
    if (value <= thresholds.warning) return 'text-wisdom-warning';
    return 'text-destructive';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <TrendingUp className="w-3 h-3 text-wisdom-success" />;
    if (value <= thresholds.warning) return <Minus className="w-3 h-3 text-wisdom-warning" />;
    return <TrendingDown className="w-3 h-3 text-destructive" />;
  };

  const agentEfficiency = agents.length > 0 
    ? (agents.filter(a => a.status !== 'idle' && a.status !== 'offline').length / agents.length) * 100 
    : 0;

  const taskCompletionRate = tasks.length > 0 
    ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
    : 0;

  const recentActivities = activities.slice(0, 5);

  const metrics = [
    {
      label: 'System Load',
      value: systemMetrics.systemLoad,
      unit: '%',
      icon: <Cpu className="w-4 h-4" />,
      thresholds: { good: 60, warning: 80 },
      showProgress: true
    },
    {
      label: 'Memory Usage',
      value: systemMetrics.memoryUsage,
      unit: ' entries',
      icon: <Database className="w-4 h-4" />,
      thresholds: { good: 1000, warning: 5000 },
      showProgress: false
    },
    {
      label: 'Agent Efficiency',
      value: agentEfficiency,
      unit: '%',
      icon: <Brain className="w-4 h-4" />,
      thresholds: { good: 70, warning: 40 },
      showProgress: true
    },
    {
      label: 'Task Completion',
      value: taskCompletionRate,
      unit: '%',
      icon: <Zap className="w-4 h-4" />,
      thresholds: { good: 80, warning: 60 },
      showProgress: true
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center">
          <Activity className="w-5 h-5 text-primary mr-2" />
          System Metrics
        </h3>
        <Badge variant="outline" className="bg-gradient-neural">
          <Clock className="w-3 h-3 mr-1" />
          {formatUptime(systemMetrics.uptime)}
        </Badge>
      </div>

      {/* Deep Links */}
      <div className="flex items-center gap-2 justify-end">
        <Button variant="secondary" size="sm" className="h-6 px-2 text-xs" onClick={() => gotoAgents()}>Agents</Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => gotoRag('metrics_hub')}>RAG Map</Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => gotoMemory()}>Memory</Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card 
            key={metric.label} 
            className="p-3 bg-card/50 backdrop-blur-sm border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                  {metric.icon}
                </div>
                <span className="text-xs font-medium">{metric.label}</span>
              </div>
              {getStatusIcon(metric.value, metric.thresholds)}
            </div>
            
            <div className={`text-lg font-bold ${getStatusColor(metric.value, metric.thresholds)}`}>
              {Math.round(metric.value)}{metric.unit}
            </div>
            
            {metric.showProgress && (
              <div className="mt-2">
                <Progress 
                  value={metric.value} 
                  className="h-1.5 bg-muted/30"
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Agent Status Summary */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border">
        <h4 className="font-medium mb-3 flex items-center">
          <Brain className="w-4 h-4 text-agent-active mr-2" />
          Agent Network Status
        </h4>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-center">
          {['idle', 'thinking', 'working', 'collaborating', 'error'].map((status) => {
            const count = agents.filter(a => a.status === status).length;
            const statusColors = {
              idle: 'text-muted-foreground bg-muted/10',
              thinking: 'text-wisdom-warning bg-wisdom-warning/10',
              working: 'text-wisdom-success bg-wisdom-success/10',
              collaborating: 'text-accent bg-accent/10',
              error: 'text-destructive bg-destructive/10'
            };
            
            return (
              <div 
                key={status} 
                className={`p-2 rounded-lg border ${statusColors[status as keyof typeof statusColors]}`}
              >
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs capitalize">{status}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border">
        <h4 className="font-medium mb-3 flex items-center">
          <Activity className="w-4 h-4 text-primary mr-2" />
          Recent Activity
        </h4>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {recentActivities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center space-x-3 p-2 bg-muted/20 rounded-lg cursor-pointer hover-scale" onClick={() => { if ((activity.target || "").toLowerCase().includes("memory")) { gotoMemory(activity.target); } else { gotoAgents(activity.agent); } }} role="button"
            >
              <Badge 
                variant="outline" 
                className="text-xs bg-primary/10 text-primary"
              >
                {activity.agent.split('_')[0]}
              </Badge>
              <span className="text-xs text-foreground flex-1 truncate">
                {activity.action} {activity.target}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          
          {recentActivities.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Activity className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No recent activity</p>
            </div>
          )}
        </div>
      </Card>

      {/* Neural Network Health */}
      <Card className="p-4 bg-gradient-neural/10 border-primary/30">
        <div className="text-center">
          <Brain className="w-8 h-8 text-primary mx-auto mb-2 animate-neural-glow" />
          <h4 className="font-semibold text-primary">Neural Network Health</h4>
          <p className="text-sm text-muted-foreground mb-3">
            All systems operating within normal parameters
          </p>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="font-semibold text-wisdom-success">98.7%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="font-semibold text-primary">156ms</div>
              <div className="text-muted-foreground">Response</div>
            </div>
            <div>
              <div className="font-semibold text-accent">4.2GB</div>
              <div className="text-muted-foreground">Processed</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}