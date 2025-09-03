import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Server,
  Clock,
  Cpu
} from 'lucide-react';

interface SystemEvent {
  id: string;
  timestamp: Date;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  source: string;
}

export function RealtimeMonitor() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    overall: 98.5,
    agents: 97.2,
    memory: 99.1,
    api: 96.8,
    database: 99.5
  });
  
  const [liveMetrics, setLiveMetrics] = useState({
    requestsPerSecond: 24.7,
    activeConnections: 156,
    memoryUsage: 67.3,
    cpuUsage: 45.2,
    responseTime: 120
  });

  useEffect(() => {
    // Simulate real-time events
    const interval = setInterval(() => {
      const eventTypes = ['success', 'warning', 'error', 'info'] as const;
      const sources = ['Agent-001', 'Memory-System', 'API-Gateway', 'Database', 'ML-Pipeline'];
      const messages = [
        'Task completed successfully',
        'High memory usage detected',
        'Connection timeout occurred',
        'New agent spawned',
        'Knowledge base updated',
        'API rate limit approached',
        'Vector search optimized',
        'Model inference completed'
      ];

      const newEvent: SystemEvent = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)]
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
      
      // Update live metrics
      setLiveMetrics(prev => ({
        ...prev,
        requestsPerSecond: prev.requestsPerSecond + (Math.random() - 0.5) * 5,
        activeConnections: prev.activeConnections + Math.floor((Math.random() - 0.5) * 10),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 2)),
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 3)),
        responseTime: Math.max(50, prev.responseTime + (Math.random() - 0.5) * 20)
      }));

      // Update system health
      setSystemHealth(prev => ({
        overall: Math.max(95, Math.min(100, prev.overall + (Math.random() - 0.5) * 0.5)),
        agents: Math.max(90, Math.min(100, prev.agents + (Math.random() - 0.5) * 1)),
        memory: Math.max(95, Math.min(100, prev.memory + (Math.random() - 0.5) * 0.3)),
        api: Math.max(90, Math.min(100, prev.api + (Math.random() - 0.5) * 0.8)),
        database: Math.max(98, Math.min(100, prev.database + (Math.random() - 0.5) * 0.2))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: SystemEvent['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEventBadgeVariant = (type: SystemEvent['type']) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 98) return 'text-green-600';
    if (score >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{liveMetrics.requestsPerSecond.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Req/sec</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Server className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{liveMetrics.activeConnections}</div>
            <div className="text-sm text-muted-foreground">Connections</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{liveMetrics.memoryUsage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Memory</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Cpu className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{liveMetrics.cpuUsage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">CPU</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-pink-500" />
            <div className="text-2xl font-bold">{Math.round(liveMetrics.responseTime)}ms</div>
            <div className="text-sm text-muted-foreground">Response</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Health</span>
                <span className={`font-bold ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.overall.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemHealth.overall} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Agent Systems</span>
                <span className={`font-bold ${getHealthColor(systemHealth.agents)}`}>
                  {systemHealth.agents.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemHealth.agents} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Systems</span>
                <span className={`font-bold ${getHealthColor(systemHealth.memory)}`}>
                  {systemHealth.memory.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemHealth.memory} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>API Gateway</span>
                <span className={`font-bold ${getHealthColor(systemHealth.api)}`}>
                  {systemHealth.api.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemHealth.api} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Database</span>
                <span className={`font-bold ${getHealthColor(systemHealth.database)}`}>
                  {systemHealth.database.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemHealth.database} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Live Event Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                        {event.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm truncate">{event.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">↗ 12%</div>
              <div className="text-sm text-muted-foreground">Throughput (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">↘ 8%</div>
              <div className="text-sm text-muted-foreground">Latency (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">↗ 23%</div>
              <div className="text-sm text-muted-foreground">Accuracy (24h)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}