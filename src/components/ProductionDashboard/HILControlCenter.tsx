import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Play, Pause, StopCircle, Settings, Eye, AlertCircle } from 'lucide-react';
import { Agent, Task, HILIntervention } from '@/types/production-types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HILControlCenterProps {
  agents: Agent[];
  tasks: Task[];
  onAgentAction: (agentId: string, action: string) => void;
  onTaskAction: (taskId: string, action: string) => void;
}

export function HILControlCenter({ agents, tasks, onAgentAction, onTaskAction }: HILControlCenterProps) {
  const [interventions, setInterventions] = useState<HILIntervention[]>([]);
  const [supervisionMode, setSupervisionMode] = useState<'monitoring' | 'intervention' | 'emergency'>('monitoring');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInterventions();
    const interval = setInterval(loadInterventions, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadInterventions = async () => {
    try {
      const { data, error } = await supabase
        .from('hil_interventions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterventions((data || []) as HILIntervention[]);
    } catch (error) {
      console.error('Failed to load interventions:', error);
    }
  };

  const createIntervention = async (
    type: HILIntervention['intervention_type'],
    reason: string,
    agentId?: string,
    taskId?: string
  ) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('hil_interventions')
        .insert({
          intervention_type: type,
          reason,
          agent_id: agentId,
          task_id: taskId,
          status: 'pending'
        });

      if (error) throw error;
      
      await loadInterventions();
      toast.success(`Intervention created: ${type}`);
    } catch (error) {
      console.error('Failed to create intervention:', error);
      toast.error('Failed to create intervention');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveIntervention = async (interventionId: string, resolution: string) => {
    try {
      const { error } = await supabase
        .from('hil_interventions')
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', interventionId);

      if (error) throw error;
      
      await loadInterventions();
      toast.success('Intervention resolved');
    } catch (error) {
      console.error('Failed to resolve intervention:', error);
      toast.error('Failed to resolve intervention');
    }
  };

  const criticalAgents = agents.filter(a => a.status === 'critical' || a.status === 'error');
  const highPriorityTasks = tasks.filter(t => t.priority >= 8 && t.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Eye className="w-5 h-5" />
            Human-in-the-Loop Control Center
            <Badge variant={supervisionMode === 'emergency' ? 'destructive' : 'secondary'}>
              {supervisionMode.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={supervisionMode === 'monitoring' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSupervisionMode('monitoring')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Monitor
            </Button>
            <Button
              variant={supervisionMode === 'intervention' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSupervisionMode('intervention')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Intervene
            </Button>
            <Button
              variant={supervisionMode === 'emergency' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setSupervisionMode('emergency')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{agents.filter(a => a.status === 'active').length}</div>
              <div className="text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{criticalAgents.length}</div>
              <div className="text-muted-foreground">Critical Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{interventions.length}</div>
              <div className="text-muted-foreground">Pending Interventions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{highPriorityTasks.length}</div>
              <div className="text-muted-foreground">High Priority Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Interventions */}
      {interventions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Pending Interventions ({interventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interventions.map((intervention) => (
              <div key={intervention.id} className="p-3 border rounded-lg bg-amber-50/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{intervention.intervention_type}</Badge>
                      <span className="text-sm font-medium">{intervention.reason}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(intervention.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveIntervention(intervention.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveIntervention(intervention.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Control */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.name}</span>
                      <Badge 
                        variant={agent.status === 'critical' ? 'destructive' : 
                               agent.status === 'active' ? 'default' : 'secondary'}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Performance: {(agent.performance_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAgentAction(agent.id, 'pause')}
                      disabled={isLoading}
                    >
                      <Pause className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAgentAction(agent.id, 'resume')}
                      disabled={isLoading}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createIntervention('override', `Manual override for ${agent.name}`, agent.id)}
                      disabled={isLoading}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Task Supervision */}
        <Card>
          <CardHeader>
            <CardTitle>Task Supervision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityTasks.map((task) => (
              <div key={task.id} className="p-3 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{task.title}</span>
                    <Badge variant={task.priority >= 9 ? 'destructive' : 'secondary'}>
                      P{task.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {task.status} | Progress: {(task.progress * 100).toFixed(0)}%
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createIntervention('approval_required', `Review needed for ${task.title}`, undefined, task.id)}
                      disabled={isLoading}
                    >
                      Require Approval
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTaskAction(task.id, 'priority_boost')}
                      disabled={isLoading}
                    >
                      Boost Priority
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {highPriorityTasks.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No high-priority tasks requiring supervision
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Controls */}
      {supervisionMode === 'emergency' && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Emergency Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="destructive"
                onClick={() => createIntervention('emergency_stop', 'Emergency stop triggered by human operator')}
                disabled={isLoading}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Emergency Stop All
              </Button>
              <Button
                variant="outline"
                onClick={() => createIntervention('pause', 'System pause triggered by human operator')}
                disabled={isLoading}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause System
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}