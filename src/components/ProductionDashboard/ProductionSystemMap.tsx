import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Agent, Task, SystemMetrics } from '@/types/production-types';
import { useProductionWisdomNET } from '@/hooks/useProductionWisdomNET';
import { Zap, Activity, AlertTriangle, Settings } from 'lucide-react';

interface ProductionSystemMapProps {
  agents: Agent[];
  tasks: Task[];
  metrics: SystemMetrics;
}

export function ProductionSystemMap({ agents, tasks, metrics }: ProductionSystemMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'topology' | 'performance' | 'tasks'>('topology');

  const generateSystemMap = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create central orchestrator node
    const orchestrator = agents.find(a => a.role === 'orchestrator');
    if (orchestrator) {
      newNodes.push({
        id: 'orchestrator',
        type: 'default',
        position: { x: 300, y: 150 },
        data: {
          label: orchestrator.name,
          status: orchestrator.status,
          performance: orchestrator.performance_score,
          agent: orchestrator
        },
        style: {
          background: getNodeColor(orchestrator.status, orchestrator.performance_score),
          border: '2px solid',
          borderColor: orchestrator.status === 'critical' ? '#ef4444' : '#3b82f6',
          borderRadius: '12px',
          padding: '10px',
          minWidth: '140px',
          textAlign: 'center'
        }
      });
    }

    // Position other agents in a circle around orchestrator
    const otherAgents = agents.filter(a => a.role !== 'orchestrator');
    const centerX = 300;
    const centerY = 150;
    const radius = 200;

    otherAgents.forEach((agent, index) => {
      const angle = (index / otherAgents.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      newNodes.push({
        id: agent.id,
        type: 'default',
        position: { x: x - 70, y: y - 25 },
        data: {
          label: agent.name,
          status: agent.status,
          performance: agent.performance_score,
          agent: agent
        },
        style: {
          background: getNodeColor(agent.status, agent.performance_score),
          border: '2px solid',
          borderColor: agent.status === 'critical' ? '#ef4444' : 
                      agent.status === 'active' ? '#10b981' : '#6b7280',
          borderRadius: '8px',
          padding: '8px',
          minWidth: '120px',
          textAlign: 'center',
          fontSize: '12px'
        }
      });

      // Connect all agents to orchestrator
      if (orchestrator) {
        newEdges.push({
          id: `${orchestrator.id}-${agent.id}`,
          source: 'orchestrator',
          target: agent.id,
          type: 'smoothstep',
          style: {
            stroke: agent.status === 'active' ? '#10b981' : '#6b7280',
            strokeWidth: agent.status === 'active' ? 3 : 1
          },
          animated: agent.status === 'active'
        });
      }
    });

    // Add task flow visualization if in task mode
    if (viewMode === 'tasks') {
      const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'assigned');
      
      activeTasks.slice(0, 5).forEach((task, index) => {
        const assignedAgent = agents.find(a => a.id === task.assigned_agent_id);
        if (assignedAgent) {
          newNodes.push({
            id: `task-${task.id}`,
            type: 'default',
            position: { 
              x: 100 + index * 150, 
              y: 350 
            },
            data: {
              label: task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title,
              status: task.status,
              progress: task.progress,
              task: task
            },
            style: {
              background: getTaskColor(task.status, task.progress),
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '6px',
              fontSize: '11px',
              minWidth: '100px'
            }
          });

          newEdges.push({
            id: `${assignedAgent.id}-task-${task.id}`,
            source: assignedAgent.id,
            target: `task-${task.id}`,
            type: 'straight',
            style: {
              stroke: '#3b82f6',
              strokeDasharray: '5,5'
            }
          });
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agents, tasks, viewMode, setNodes, setEdges]);

  useEffect(() => {
    generateSystemMap();
  }, [generateSystemMap]);

  const getNodeColor = (status: Agent['status'], performance: number) => {
    if (status === 'critical' || status === 'error') return '#fef2f2';
    if (status === 'active') return performance > 0.7 ? '#f0fdf4' : '#fef3c7';
    return '#f9fafb';
  };

  const getTaskColor = (status: Task['status'], progress: number) => {
    if (status === 'completed') return '#f0fdf4';
    if (status === 'in_progress') return progress > 0.5 ? '#eff6ff' : '#fef3c7';
    return '#f3f4f6';
  };

  const onNodeClick = (event: any, node: Node) => {
    setSelectedNode(node.id);
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode)?.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5" />
              Production System Map
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'topology' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('topology')}
              >
                Topology
              </Button>
              <Button
                variant={viewMode === 'performance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('performance')}
              >
                Performance
              </Button>
              <Button
                variant={viewMode === 'tasks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tasks')}
              >
                Tasks
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{metrics.active_agents}</div>
              <div className="text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{metrics.pending_tasks}</div>
              <div className="text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{metrics.completed_tasks_24h}</div>
              <div className="text-muted-foreground">Completed 24h</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{(metrics.system_load * 100).toFixed(0)}%</div>
              <div className="text-muted-foreground">System Load</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{(metrics.error_rate * 100).toFixed(1)}%</div>
              <div className="text-muted-foreground">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-right"
              >
                <Background gap={20} size={1} />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.data.status === 'critical') return '#ef4444';
                    if (node.data.status === 'active') return '#10b981';
                    return '#6b7280';
                  }}
                />
              </ReactFlow>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedNodeData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedNodeData.agent ? 'Agent Details' : 'Task Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedNodeData.agent ? (
                  <>
                    <div>
                      <div className="font-medium">{selectedNodeData.agent.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedNodeData.agent.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={selectedNodeData.agent.status === 'active' ? 'default' : 'secondary'}
                      >
                        {selectedNodeData.agent.status}
                      </Badge>
                      <span className="text-sm">
                        {(selectedNodeData.agent.performance_score * 100).toFixed(0)}% Performance
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Capabilities:</strong>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedNodeData.agent.capabilities.slice(0, 3).map((cap: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{cap}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : selectedNodeData.task ? (
                  <>
                    <div>
                      <div className="font-medium">{selectedNodeData.task.title}</div>
                      <div className="text-sm text-muted-foreground">{selectedNodeData.task.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedNodeData.task.status}</Badge>
                      <span className="text-sm">
                        P{selectedNodeData.task.priority}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Progress:</strong> {(selectedNodeData.task.progress * 100).toFixed(0)}%
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedNodeData.task.progress * 100}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">CPU Load</span>
                <span className="text-sm font-medium">{(metrics.system_load * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Agents</span>
                <span className="text-sm font-medium">{metrics.active_agents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Memory Entries</span>
                <span className="text-sm font-medium">{metrics.memory_entries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Error Rate</span>
                <span className={`text-sm font-medium ${metrics.error_rate > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                  {(metrics.error_rate * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {metrics.error_rate > 0.1 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">High Error Rate Detected</span>
                </div>
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  <Settings className="w-3 h-3 mr-2" />
                  Investigate Issues
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}