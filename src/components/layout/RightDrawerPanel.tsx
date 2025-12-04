// Right drawer panel for AI systems
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Users, 
  Database,
  Activity,
  Eye,
  GitBranch,
  Cpu,
  Network,
  ChevronRight,
  Maximize2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RightDrawerType } from './RightIconBar';
import { LiveThinkingPanel } from '@/components/AIChat/LiveThinkingPanel';
import { AgentDiscordPanel } from '@/components/AIChat/AgentDiscordPanel';

interface RightDrawerPanelProps {
  activeDrawer: RightDrawerType;
  onClose: () => void;
  onOpenFullscreen?: (type: string) => void;
  // Streaming data
  isStreaming?: boolean;
  orchestrationPlan?: any;
  thinkingSteps?: any[];
  agents?: any[];
  discordMessages?: any[];
  discordThreads?: any[];
  currentMode?: string;
  className?: string;
}

export function RightDrawerPanel({ 
  activeDrawer, 
  onClose, 
  onOpenFullscreen,
  isStreaming,
  orchestrationPlan,
  thinkingSteps,
  agents,
  discordMessages,
  discordThreads,
  currentMode,
  className 
}: RightDrawerPanelProps) {
  if (!activeDrawer) return null;

  const renderContent = () => {
    switch (activeDrawer) {
      case 'thinking':
        return (
          <ThinkingPanel 
            isStreaming={isStreaming}
            orchestrationPlan={orchestrationPlan}
            thinkingSteps={thinkingSteps}
            agents={agents}
            currentMode={currentMode}
          />
        );
      case 'discord':
        return (
          <DiscordPanel 
            messages={discordMessages}
            threads={discordThreads}
            agents={agents}
            isStreaming={isStreaming}
            onOpenFullscreen={() => onOpenFullscreen?.('discord')}
          />
        );
      case 'agents':
        return <AgentsPanel agents={agents} />;
      case 'memory':
        return <MemoryPanel />;
      case 'context':
        return <ContextPanel />;
      case 'reasoning':
        return <ReasoningPanel thinkingSteps={thinkingSteps} />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'processing':
        return <ProcessingPanel />;
      case 'network':
        return <NetworkPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "fixed right-12 top-12 bottom-0 w-80 bg-background/95 backdrop-blur-xl border-l border-border/50 z-30 flex flex-col animate-slide-in-right",
      className
    )}>
      {renderContent()}
    </div>
  );
}

function ThinkingPanel({ isStreaming, orchestrationPlan, thinkingSteps, agents, currentMode }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={cn("w-5 h-5", isStreaming && "text-amber-500 animate-pulse")} />
            <h3 className="font-semibold text-sm">Live Thinking</h3>
          </div>
          {isStreaming && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Active
            </Badge>
          )}
        </div>
        {currentMode && (
          <Badge variant="secondary" className="mt-2 text-xs">
            Mode: {currentMode}
          </Badge>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {orchestrationPlan && (
          <div className="p-4 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Orchestration Plan</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress</span>
              <span className="text-xs text-muted-foreground">
                {orchestrationPlan.current_step || 0}/{orchestrationPlan.total_steps || 0}
              </span>
            </div>
            <Progress 
              value={((orchestrationPlan.current_step || 0) / (orchestrationPlan.total_steps || 1)) * 100} 
              className="h-2"
            />
          </div>
        )}
        
        <div className="p-4 space-y-3">
          {thinkingSteps?.map((step: any, i: number) => (
            <Card key={i} className={cn(
              "p-3 transition-all duration-300",
              step.status === 'running' && "border-amber-500/50 bg-amber-500/5",
              step.status === 'completed' && "border-emerald-500/50 bg-emerald-500/5"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {step.status === 'running' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                ) : step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{step.agent || step.name}</span>
              </div>
              {step.output && (
                <p className="text-xs text-muted-foreground line-clamp-3">{step.output}</p>
              )}
              {step.metrics && (
                <div className="flex gap-2 mt-2">
                  {step.metrics.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(step.metrics.confidence * 100)}% conf
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          ))}
          
          {(!thinkingSteps || thinkingSteps.length === 0) && !isStreaming && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active thinking</p>
              <p className="text-xs">Ask something to see reasoning</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function DiscordPanel({ messages, threads, agents, isStreaming, onOpenFullscreen }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Agent Discord</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onOpenFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {threads?.length || 0} threads
          </Badge>
          <Badge variant="outline" className="text-xs">
            {messages?.length || 0} messages
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {messages?.slice(-10).map((msg: any, i: number) => (
            <Card key={i} className={cn(
              "p-2 text-xs animate-fade-in",
              msg.type === 'THOUGHT' && "border-l-2 border-l-blue-500",
              msg.type === 'DECISION' && "border-l-2 border-l-emerald-500",
              msg.type === 'TASK_PROPOSE' && "border-l-2 border-l-amber-500"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-medium">{msg.author?.name || 'Agent'}</span>
                <Badge variant="secondary" className="text-[10px] py-0 h-4">
                  {msg.type}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-2">{msg.content}</p>
            </Card>
          ))}
          
          {(!messages || messages.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agent activity</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border/50">
        <Button variant="outline" className="w-full text-sm" onClick={onOpenFullscreen}>
          Open Full Discord View
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}

function AgentsPanel({ agents }: any) {
  const defaultAgents = [
    { name: 'FrontChatAgent', status: 'active', domain: 'interface', tasks: 1 },
    { name: 'CodeArchitectAgent', status: 'idle', domain: 'code', tasks: 0 },
    { name: 'ResearchAgent', status: 'idle', domain: 'research', tasks: 0 },
    { name: 'MemoryAgent', status: 'active', domain: 'memory', tasks: 2 },
  ];
  
  const displayAgents = agents?.length ? agents : defaultAgents;

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Active Agents</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {displayAgents.filter((a: any) => a.status === 'active').length} active / {displayAgents.length} total
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {displayAgents.map((agent: any, i: number) => (
            <Card key={i} className={cn(
              "p-3 cursor-pointer hover:bg-accent/50 transition-colors",
              agent.status === 'active' && "border-emerald-500/30"
            )}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{agent.name}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  agent.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                )} />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{agent.domain}</Badge>
                <span className="text-xs text-muted-foreground">{agent.tasks || 0} tasks</span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

function MemoryPanel() {
  const memoryStats = [
    { type: 'Short-term', usage: 45, size: '2.1MB' },
    { type: 'Working', usage: 67, size: '8.4MB' },
    { type: 'Long-term', usage: 23, size: '156MB' },
    { type: 'Vector Store', usage: 34, size: '1.2GB' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Memory Systems</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {memoryStats.map((mem, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{mem.type}</span>
                <span className="text-xs text-muted-foreground">{mem.size}</span>
              </div>
              <Progress value={mem.usage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{mem.usage}% utilized</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

function ContextPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Context Analysis</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Real-time context window analysis and memory retrieval stats.
          </p>
        </div>
      </ScrollArea>
    </>
  );
}

function ReasoningPanel({ thinkingSteps }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Reasoning Chains</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Detailed reasoning chain visualization.
          </p>
        </div>
      </ScrollArea>
    </>
  );
}

function AnalyticsPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Analytics</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="p-3">
            <p className="text-sm font-medium">Response Time</p>
            <p className="text-2xl font-bold text-primary">1.2s</p>
            <p className="text-xs text-muted-foreground">avg last 10 queries</p>
          </Card>
          <Card className="p-3">
            <p className="text-sm font-medium">Accuracy Score</p>
            <p className="text-2xl font-bold text-emerald-500">94.2%</p>
            <p className="text-xs text-muted-foreground">based on verification</p>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}

function ProcessingPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Processing</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            CPU, GPU, and model processing metrics.
          </p>
        </div>
      </ScrollArea>
    </>
  );
}

function NetworkPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Network</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Agent network topology and connections.
          </p>
        </div>
      </ScrollArea>
    </>
  );
}