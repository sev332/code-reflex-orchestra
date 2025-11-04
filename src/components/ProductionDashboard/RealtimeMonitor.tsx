import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface ExecutionEvent {
  id: string;
  chainName: string;
  status: 'running' | 'success' | 'failed';
  startedAt: string;
  completedAt?: string;
  latencyMs?: number;
  nodeCount: number;
}

export const RealtimeMonitor = () => {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);

  // Simulate real-time events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: ExecutionEvent = {
        id: crypto.randomUUID(),
        chainName: ['Code Generation', 'Research Analysis', 'Content Creation'][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.1 ? 'success' : 'failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        latencyMs: Math.floor(Math.random() * 1000) + 200,
        nodeCount: Math.floor(Math.random() * 8) + 3
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      running: 'default',
      success: 'secondary',
      failed: 'destructive'
    };
    return variants[status] || 'default';
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Real-time Executions
          </h3>
          <Badge variant="outline">{events.length} events</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(event.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{event.chainName}</span>
                      <Badge variant={getStatusBadge(event.status)} className="text-xs">
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.latencyMs}ms
                      </span>
                      <span>{event.nodeCount} nodes</span>
                      <span>{new Date(event.startedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
