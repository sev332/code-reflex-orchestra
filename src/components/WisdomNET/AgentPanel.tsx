// WisdomNET Agent Panel - Multi-Agent Network Visualization

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWisdomNET } from '@/contexts/WisdomNETContext';
import { 
  Brain, 
  Clock, 
  Cpu, 
  Eye, 
  Hammer, 
  FileText, 
  Shield, 
  Zap,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react';
import { useWisdomLinking } from '@/hooks/useWisdomLinking';

const agentIcons = {
  'orchestrator': Brain,
  'planner': FileText,
  'engineer': Hammer,
  'memory-keeper': Brain,
  'qa-verifier': Eye,
  'ui-designer': Zap,
  'security-auditor': Shield,
  'performance-optimizer': Cpu
};

export function AgentPanel() {
  const { agents, updateAgentStatus, tasks } = useWisdomNET();
  const { gotoRag, gotoAgents } = useWisdomLinking();

  const getAgentIcon = (role: string) => {
    const IconComponent = agentIcons[role as keyof typeof agentIcons] || Brain;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thinking':
        return 'bg-wisdom-warning/20 text-wisdom-warning border-wisdom-warning/30';
      case 'working':
        return 'bg-wisdom-success/20 text-wisdom-success border-wisdom-success/30';
      case 'collaborating':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'error':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'offline':
        return 'bg-muted/20 text-muted-foreground border-muted/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getWorkload = (agentId: string) => {
    const agentTasks = tasks.filter(task => task.assignedAgent === agentId);
    const completedTasks = agentTasks.filter(task => task.status === 'completed');
    return {
      total: agentTasks.length,
      completed: completedTasks.length,
      percentage: agentTasks.length > 0 ? (completedTasks.length / agentTasks.length) * 100 : 0
    };
  };

  const roleToGraphNode = (role: string) => {
    switch (role) {
      case 'orchestrator':
        return 'orchestrator';
      case 'planner':
        return 'planner';
      case 'engineer':
        return 'engineer';
      case 'memory-keeper':
        return 'memory_hub';
      default:
        return 'multi_agent';
    }
  };

  const handleAgentAction = (agentId: string, action: 'pause' | 'resume' | 'configure') => {
    if (action === 'pause') {
      updateAgentStatus(agentId, 'offline');
    } else if (action === 'resume') {
      updateAgentStatus(agentId, 'idle');
    }
    // Configure action would open agent settings modal
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-full">
      {agents.map((agent) => {
        const workload = getWorkload(agent.id);
        
        return (
          <Card 
            key={agent.id} 
            className="p-4 bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-300"
          >
            {/* Agent Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`
                  p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 
                  ${agent.status === 'working' ? 'animate-neural-pulse' : ''}
                `}>
                  {getAgentIcon(agent.role)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{agent.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {agent.role.replace('-', ' ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(agent.status)}`}
                >
                  {agent.status}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleAgentAction(agent.id, 'configure')}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Agent Metrics */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Workload</span>
                <span>{workload.completed}/{workload.total} tasks</span>
              </div>
              <Progress 
                value={workload.percentage} 
                className="h-1.5 bg-muted/30"
              />
            </div>

            {/* Current Task */}
            {agent.currentTask && (
              <div className="bg-muted/20 rounded-lg p-2 mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Current:</span>
                </div>
                <p className="text-xs font-medium mt-1 truncate">
                  {agent.currentTask}
                </p>
              </div>
            )}

            {/* Agent Capabilities */}
            <div className="flex flex-wrap gap-1 mb-3">
              {agent.capabilities.slice(0, 3).map((capability) => (
                <Badge 
                  key={capability} 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5 bg-accent/10 text-accent"
                >
                  {capability}
                </Badge>
              ))}
              {agent.capabilities.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{agent.capabilities.length - 3}
                </Badge>
              )}
            </div>

            {/* Agent Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs flex-1"
                onClick={() => handleAgentAction(
                  agent.id, 
                  agent.status === 'offline' ? 'resume' : 'pause'
                )}
              >
                {agent.status === 'offline' ? (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </>
                )}
              </Button>
              
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-1 bg-gradient-neural"
              >
                P{agent.priority}
              </Badge>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  const targetNode = agent.role.includes('memory') ? 'memory' : 'agents';
                  const trace = agent.role.includes('memory')
                    ? ['e-agents-deep','e-deep-memory']
                    : ['e-chain-agents'];
                  gotoRag(targetNode, trace);
                }}
              >
                RAG Links
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => gotoAgents(roleToGraphNode(agent.role))}
              >
                Agent Graph
              </Button>
            </div>

            {/* Neural Activity Indicator */}
            {agent.status === 'thinking' && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-neural-pulse" />
                  <div className="w-1 h-1 bg-primary rounded-full animate-neural-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-neural-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-xs text-muted-foreground">Processing...</span>
              </div>
            )}
          </Card>
        );
      })}

      {/* Agent Network Status */}
      <Card className="p-3 bg-gradient-neural/10 border-primary/30">
        <div className="text-center">
          <Brain className="w-6 h-6 text-primary mx-auto mb-2 animate-neural-glow" />
          <p className="text-sm font-medium">Neural Network</p>
          <p className="text-xs text-muted-foreground">
            {agents.filter(a => a.status !== 'offline').length}/{agents.length} agents online
          </p>
        </div>
      </Card>
    </div>
  );
}