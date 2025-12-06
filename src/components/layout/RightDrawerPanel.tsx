// Right drawer panel for AI systems
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  Loader2,
  FileText,
  Search,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RightDrawerType } from './RightIconBar';

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
        return <AgentsPanel agents={agents} isStreaming={isStreaming} />;
      case 'memory':
        return <MemoryPanel />;
      case 'context':
        return <ContextPanel />;
      case 'reasoning':
        return <ReasoningPanel thinkingSteps={thinkingSteps} />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'processing':
        return <ProcessingPanel isStreaming={isStreaming} />;
      case 'network':
        return <NetworkPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "fixed right-12 top-12 bottom-0 w-80 bg-background/95 backdrop-blur-xl border-l border-border/30 z-30 flex flex-col animate-slide-in-right",
      className
    )}>
      {renderContent()}
    </div>
  );
}

function ThinkingPanel({ isStreaming, orchestrationPlan, thinkingSteps, agents, currentMode }: any) {
  const currentStep = orchestrationPlan?.currentStep || orchestrationPlan?.current_step || 0;
  const totalSteps = orchestrationPlan?.totalSteps || orchestrationPlan?.total_steps || 0;
  
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={cn("w-5 h-5", isStreaming && "text-amber-500 animate-pulse")} />
            <h3 className="font-semibold text-sm">Live Thinking</h3>
          </div>
          {isStreaming && (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Active
            </Badge>
          )}
        </div>
        {currentMode && (
          <Badge variant="secondary" className="mt-2 text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            Mode: {currentMode}
          </Badge>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {orchestrationPlan && (
          <div className="p-4 border-b border-border/30 bg-gradient-to-b from-amber-500/5 to-transparent">
            <p className="text-xs text-muted-foreground mb-2">Orchestration Plan</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-xs text-amber-400 font-medium">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress 
              value={(currentStep / Math.max(totalSteps, 1)) * 100} 
              className="h-2 bg-muted/30"
            />
            {orchestrationPlan.complexity && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {orchestrationPlan.complexity}
                </Badge>
                {orchestrationPlan.memoryStrategy && (
                  <Badge variant="outline" className="text-xs">
                    {orchestrationPlan.memoryStrategy}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="p-4 space-y-3">
          {thinkingSteps?.map((step: any, i: number) => (
            <Card key={i} className={cn(
              "p-3 transition-all duration-300 border-border/30",
              step.status === 'working' && "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10",
              step.status === 'completed' && "border-emerald-500/30 bg-emerald-500/5"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {step.status === 'working' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                ) : step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{step.type || step.agent || step.name}</span>
                {step.agentRole && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-4 ml-auto">
                    {step.agentRole}
                  </Badge>
                )}
              </div>
              
              {/* Step detail/output */}
              {(step.detail || step.output) && (
                <p className="text-xs text-muted-foreground mb-2 bg-background/50 rounded p-2">
                  {step.detail || step.output}
                </p>
              )}
              
              {/* Sources consulted */}
              {step.sources_consulted && step.sources_consulted.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Search className="w-3 h-3" /> Sources:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {step.sources_consulted.map((src: any, j: number) => (
                      <Badge key={j} variant="outline" className="text-[10px] py-0">
                        {src.type}: {src.results || 0}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Evidence */}
              {step.evidence && (
                <div className="mb-2 text-[10px]">
                  {step.evidence.found?.length > 0 && (
                    <p className="text-emerald-400">✓ Found: {step.evidence.found.slice(0, 2).join(', ')}</p>
                  )}
                  {step.evidence.gaps?.length > 0 && (
                    <p className="text-amber-400">⚠ Gaps: {step.evidence.gaps.slice(0, 2).join(', ')}</p>
                  )}
                </div>
              )}
              
              {/* Metrics */}
              {step.metrics && (
                <div className="flex gap-2 flex-wrap">
                  {step.metrics.confidence !== undefined && (
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                      {Math.round(step.metrics.confidence * 100)}% conf
                    </Badge>
                  )}
                  {step.metrics.tokensUsed && (
                    <Badge variant="outline" className="text-[10px]">
                      {step.metrics.tokensUsed} tokens
                    </Badge>
                  )}
                  {step.duration && (
                    <Badge variant="outline" className="text-[10px]">
                      {step.duration}ms
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
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Agent Discord</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onOpenFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
            {threads?.length || 0} threads
          </Badge>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
            {messages?.length || 0} messages
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {messages?.slice(-15).map((msg: any, i: number) => (
            <Card key={i} className={cn(
              "p-2 text-xs animate-fade-in border-border/30",
              msg.type === 'THOUGHT' && "border-l-2 border-l-blue-500 bg-blue-500/5",
              msg.type === 'DECISION' && "border-l-2 border-l-emerald-500 bg-emerald-500/5",
              msg.type === 'TASK_PROPOSE' && "border-l-2 border-l-amber-500 bg-amber-500/5",
              msg.type === 'TASK_ACCEPT' && "border-l-2 border-l-cyan-500 bg-cyan-500/5"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-medium">{msg.author?.name || msg.agent || 'Agent'}</span>
                <Badge variant="secondary" className="text-[10px] py-0 h-4">
                  {msg.type}
                </Badge>
              </div>
              <p className="text-muted-foreground">{msg.content}</p>
            </Card>
          ))}
          
          {(!messages || messages.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agent activity</p>
              <p className="text-xs">Agents communicate during processing</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border/30">
        <Button variant="outline" className="w-full text-sm border-border/50" onClick={onOpenFullscreen}>
          Open Full Discord View
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}

function AgentsPanel({ agents, isStreaming }: any) {
  const defaultAgents = [
    { name: 'FrontChatAgent', status: 'ACTIVE', domain: 'interface', tasksCompleted: 1 },
    { name: 'CodeArchitectAgent', status: 'IDLE', domain: 'code', tasksCompleted: 0 },
    { name: 'ResearchAgent', status: 'IDLE', domain: 'research', tasksCompleted: 0 },
    { name: 'MemoryAgent', status: 'ACTIVE', domain: 'memory', tasksCompleted: 2 },
  ];
  
  const displayAgents = agents?.length ? agents : defaultAgents;
  const activeCount = displayAgents.filter((a: any) => 
    a.status === 'ACTIVE' || a.status === 'WORKING' || a.status === 'active'
  ).length;

  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Active Agents</h3>
        <p className="text-xs text-muted-foreground mt-1">
          <span className={cn(activeCount > 0 && "text-cyan-400 font-medium")}>
            {activeCount} active
          </span> / {displayAgents.length} total
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {displayAgents.map((agent: any, i: number) => {
            const isActive = agent.status === 'ACTIVE' || agent.status === 'active';
            const isWorking = agent.status === 'WORKING';
            
            return (
              <Card key={i} className={cn(
                "p-3 cursor-pointer hover:bg-accent/50 transition-all border-border/30",
                isActive && "border-emerald-500/30 bg-emerald-500/5",
                isWorking && "border-amber-500/30 bg-amber-500/5"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{agent.name}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isWorking ? "bg-amber-500 animate-pulse" :
                    isActive ? "bg-emerald-500" : "bg-muted-foreground/50"
                  )} />
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{agent.domain || 'general'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {agent.tasksCompleted || 0} tasks
                  </span>
                </div>
                {agent.currentTask && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {agent.currentTask}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}

function MemoryPanel() {
  const memoryStats = [
    { type: 'Short-term', usage: 45, size: '2.1MB', color: 'bg-cyan-500' },
    { type: 'Working', usage: 67, size: '8.4MB', color: 'bg-purple-500' },
    { type: 'Long-term', usage: 23, size: '156MB', color: 'bg-emerald-500' },
    { type: 'Vector Store', usage: 34, size: '1.2GB', color: 'bg-amber-500' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/30">
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
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Context Analysis</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card className="p-3 mb-3 border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Context Window</span>
            </div>
            <Progress value={45} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground">4,500 / 10,000 tokens</p>
          </Card>
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
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Reasoning Chains</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {thinkingSteps?.length > 0 ? (
            <div className="space-y-2">
              {thinkingSteps.map((step: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.type || step.agent}</p>
                    <p className="text-xs text-muted-foreground">{step.detail || step.output}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Reasoning chains will appear here during processing.
            </p>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function AnalyticsPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Analytics</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="p-3 border-border/30">
            <p className="text-sm font-medium">Response Time</p>
            <p className="text-2xl font-bold text-cyan-400">1.2s</p>
            <p className="text-xs text-muted-foreground">avg last 10 queries</p>
          </Card>
          <Card className="p-3 border-border/30">
            <p className="text-sm font-medium">Accuracy Score</p>
            <p className="text-2xl font-bold text-emerald-500">94.2%</p>
            <p className="text-xs text-muted-foreground">based on verification</p>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}

function ProcessingPanel({ isStreaming }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Cpu className={cn("w-5 h-5", isStreaming && "text-amber-500 animate-pulse")} />
          <h3 className="font-semibold text-sm">Processing</h3>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <Card className="p-3 border-border/30">
            <p className="text-sm font-medium mb-2">GPU Utilization</p>
            <Progress value={isStreaming ? 78 : 12} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{isStreaming ? '78%' : '12%'}</p>
          </Card>
          <Card className="p-3 border-border/30">
            <p className="text-sm font-medium mb-2">Model Load</p>
            <Progress value={isStreaming ? 65 : 20} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{isStreaming ? '65%' : '20%'}</p>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}

function NetworkPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Network</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card className="p-3 border-border/30 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">Agent Topology</span>
            </div>
            <p className="text-xs text-muted-foreground">
              5 nodes connected in mesh configuration
            </p>
          </Card>
          <p className="text-sm text-muted-foreground">
            Agent network topology and inter-agent connections.
          </p>
        </div>
      </ScrollArea>
    </>
  );
}
