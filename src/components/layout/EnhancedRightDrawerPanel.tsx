// Enhanced Right Drawer Panel with full transparency and detailed history
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  ChevronDown,
  Maximize2,
  CheckCircle,
  Clock,
  Loader2,
  FileText,
  Search,
  Zap,
  History,
  MessageSquare,
  Target,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Layers,
  BarChart3,
  RefreshCw,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RightDrawerType } from './RightIconBar';

interface EnhancedRightDrawerPanelProps {
  activeDrawer: RightDrawerType;
  onClose: () => void;
  onOpenFullscreen?: (type: string) => void;
  isStreaming?: boolean;
  orchestrationPlan?: any;
  thinkingSteps?: any[];
  agents?: any[];
  discordMessages?: any[];
  discordThreads?: any[];
  currentMode?: string;
  // New props for enhanced data
  reasoningHistory?: any[];
  memoryEntries?: any[];
  contextWindow?: any;
  processingMetrics?: any;
  className?: string;
}

export function EnhancedRightDrawerPanel({ 
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
  reasoningHistory = [],
  memoryEntries = [],
  contextWindow,
  processingMetrics,
  className 
}: EnhancedRightDrawerPanelProps) {
  if (!activeDrawer) return null;

  const renderContent = () => {
    switch (activeDrawer) {
      case 'thinking':
        return (
          <EnhancedThinkingPanel 
            isStreaming={isStreaming}
            orchestrationPlan={orchestrationPlan}
            thinkingSteps={thinkingSteps}
            agents={agents}
            currentMode={currentMode}
            reasoningHistory={reasoningHistory}
          />
        );
      case 'discord':
        return (
          <EnhancedDiscordPanel 
            messages={discordMessages}
            threads={discordThreads}
            agents={agents}
            isStreaming={isStreaming}
            onOpenFullscreen={() => onOpenFullscreen?.('discord')}
          />
        );
      case 'agents':
        return <EnhancedAgentsPanel agents={agents} isStreaming={isStreaming} />;
      case 'memory':
        return <EnhancedMemoryPanel entries={memoryEntries} />;
      case 'context':
        return <EnhancedContextPanel contextWindow={contextWindow} />;
      case 'reasoning':
        return <EnhancedReasoningPanel thinkingSteps={thinkingSteps} history={reasoningHistory} />;
      case 'analytics':
        return <EnhancedAnalyticsPanel metrics={processingMetrics} />;
      case 'processing':
        return <EnhancedProcessingPanel isStreaming={isStreaming} metrics={processingMetrics} />;
      case 'network':
        return <NetworkPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "fixed right-12 top-12 bottom-0 w-96 bg-background/95 backdrop-blur-xl border-l border-border/30 z-30 flex flex-col animate-slide-in-right",
      className
    )}>
      {renderContent()}
    </div>
  );
}

function EnhancedThinkingPanel({ isStreaming, orchestrationPlan, thinkingSteps, agents, currentMode, reasoningHistory }: any) {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  
  const currentStep = orchestrationPlan?.currentStep || orchestrationPlan?.current_step || 0;
  const totalSteps = orchestrationPlan?.totalSteps || orchestrationPlan?.total_steps || 0;
  
  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <>
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={cn("w-5 h-5", isStreaming && "text-amber-500 animate-pulse")} />
            <h3 className="font-semibold text-sm">Deep Thinking</h3>
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 bg-muted/30">
          <TabsTrigger value="live" className="flex-1 text-xs gap-1">
            <Activity className="w-3 h-3" />
            Live
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs gap-1">
            <History className="w-3 h-3" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="flex-1 m-0">
          <ScrollArea className="h-full">
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
                <div className="flex flex-wrap gap-2 mt-3">
                  {orchestrationPlan.complexity && (
                    <Badge variant="outline" className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      {orchestrationPlan.complexity}
                    </Badge>
                  )}
                  {orchestrationPlan.memoryStrategy && (
                    <Badge variant="outline" className="text-xs">
                      <Database className="w-3 h-3 mr-1" />
                      {orchestrationPlan.memoryStrategy}
                    </Badge>
                  )}
                  {orchestrationPlan.tokenBudget && (
                    <Badge variant="outline" className="text-xs">
                      <Layers className="w-3 h-3 mr-1" />
                      {orchestrationPlan.tokenBudget} tokens
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="p-4 space-y-2">
              {thinkingSteps?.map((step: any, i: number) => {
                const isExpanded = expandedSteps.has(i);
                
                return (
                  <Collapsible key={i} open={isExpanded} onOpenChange={() => toggleStep(i)}>
                    <Card className={cn(
                      "transition-all duration-300 border-border/30 overflow-hidden",
                      step.status === 'working' && "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10",
                      step.status === 'completed' && "border-emerald-500/30 bg-emerald-500/5"
                    )}>
                      <CollapsibleTrigger className="w-full p-3 text-left">
                        <div className="flex items-center gap-2">
                          {step.status === 'working' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          ) : step.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm flex-1">{step.type || step.agent || step.name}</span>
                          {step.agentRole && (
                            <Badge variant="secondary" className="text-[10px] py-0 h-4">
                              {step.agentRole}
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Quick metrics */}
                        {step.metrics && !isExpanded && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {step.metrics.confidence !== undefined && (
                              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                                {Math.round(step.metrics.confidence * 100)}% conf
                              </Badge>
                            )}
                            {step.duration && (
                              <Badge variant="outline" className="text-[10px]">
                                {step.duration}ms
                              </Badge>
                            )}
                          </div>
                        )}
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-3">
                          {/* Full output */}
                          {(step.detail || step.output) && (
                            <div className="bg-background/50 rounded p-2">
                              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Output
                              </p>
                              <p className="text-xs text-foreground/90">{step.detail || step.output}</p>
                            </div>
                          )}
                          
                          {/* Reasoning trace */}
                          {step.reasoning && (
                            <div className="bg-purple-500/5 rounded p-2 border border-purple-500/20">
                              <p className="text-[10px] text-purple-400 mb-1 flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" /> Reasoning
                              </p>
                              <p className="text-xs">{step.reasoning}</p>
                            </div>
                          )}
                          
                          {/* Sources consulted */}
                          {step.sources_consulted && step.sources_consulted.length > 0 && (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                <Search className="w-3 h-3" /> Sources Consulted
                              </p>
                              <div className="space-y-1">
                                {step.sources_consulted.map((src: any, j: number) => (
                                  <div key={j} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                                    <span className="text-xs">{src.type}</span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {src.results || 0} results
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Evidence */}
                          {step.evidence && (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">Evidence</p>
                              <div className="space-y-1">
                                {step.evidence.found?.length > 0 && (
                                  <div className="bg-emerald-500/10 rounded p-2">
                                    <p className="text-[10px] text-emerald-400 mb-1">✓ Found</p>
                                    <ul className="text-xs space-y-0.5">
                                      {step.evidence.found.map((f: string, k: number) => (
                                        <li key={k}>• {f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {step.evidence.gaps?.length > 0 && (
                                  <div className="bg-amber-500/10 rounded p-2">
                                    <p className="text-[10px] text-amber-400 mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Gaps
                                    </p>
                                    <ul className="text-xs space-y-0.5">
                                      {step.evidence.gaps.map((g: string, k: number) => (
                                        <li key={k}>• {g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Full metrics */}
                          {step.metrics && (
                            <div className="grid grid-cols-2 gap-2">
                              {step.metrics.confidence !== undefined && (
                                <div className="bg-muted/30 rounded p-2">
                                  <p className="text-[10px] text-muted-foreground">Confidence</p>
                                  <p className="text-sm font-medium text-cyan-400">
                                    {Math.round(step.metrics.confidence * 100)}%
                                  </p>
                                </div>
                              )}
                              {step.metrics.tokensUsed && (
                                <div className="bg-muted/30 rounded p-2">
                                  <p className="text-[10px] text-muted-foreground">Tokens</p>
                                  <p className="text-sm font-medium">{step.metrics.tokensUsed}</p>
                                </div>
                              )}
                              {step.duration && (
                                <div className="bg-muted/30 rounded p-2">
                                  <p className="text-[10px] text-muted-foreground">Duration</p>
                                  <p className="text-sm font-medium">{step.duration}ms</p>
                                </div>
                              )}
                              {step.metrics.quality !== undefined && (
                                <div className="bg-muted/30 rounded p-2">
                                  <p className="text-[10px] text-muted-foreground">Quality</p>
                                  <p className="text-sm font-medium">{Math.round(step.metrics.quality * 100)}%</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
              
              {(!thinkingSteps || thinkingSteps.length === 0) && !isStreaming && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active thinking</p>
                  <p className="text-xs">Ask something to see reasoning</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {reasoningHistory?.length > 0 ? (
                reasoningHistory.map((session: any, i: number) => (
                  <Card key={i} className="p-3 border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{session.query?.slice(0, 40)}...</span>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(session.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {session.steps?.length || 0} steps
                      </Badge>
                      {session.confidence && (
                        <Badge variant="outline" className="text-[10px] text-cyan-400">
                          {Math.round(session.confidence * 100)}% conf
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reasoning history</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  );
}

function EnhancedDiscordPanel({ messages, threads, agents, isStreaming, onOpenFullscreen }: any) {
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
          {messages?.slice(-20).map((msg: any, i: number) => (
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
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              <p className="text-muted-foreground">{msg.content}</p>
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
      
      <div className="p-3 border-t border-border/30">
        <Button variant="outline" className="w-full text-sm border-border/50" onClick={onOpenFullscreen}>
          Open Full Discord View
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}

function EnhancedAgentsPanel({ agents, isStreaming }: any) {
  const defaultAgents = [
    { name: 'FrontChatAgent', status: 'ACTIVE', domain: 'interface', tasksCompleted: 1, currentTask: 'Processing response' },
    { name: 'CodeArchitectAgent', status: 'IDLE', domain: 'code', tasksCompleted: 0 },
    { name: 'ResearchAgent', status: 'IDLE', domain: 'research', tasksCompleted: 0 },
    { name: 'MemoryAgent', status: 'ACTIVE', domain: 'memory', tasksCompleted: 2, currentTask: 'Indexing context' },
    { name: 'VerifierAgent', status: 'IDLE', domain: 'verification', tasksCompleted: 0 },
  ];
  
  const displayAgents = agents?.length ? agents : defaultAgents;

  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Active Agents</h3>
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
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
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

function EnhancedMemoryPanel({ entries }: { entries: any[] }) {
  const [activeTab, setActiveTab] = useState<'live' | 'stored' | 'vector'>('live');
  
  const memoryStats = [
    { type: 'Short-term', usage: 45, size: '2.1MB', entries: 23, color: 'bg-cyan-500' },
    { type: 'Working', usage: 67, size: '8.4MB', entries: 156, color: 'bg-purple-500' },
    { type: 'Long-term', usage: 23, size: '156MB', entries: 1243, color: 'bg-emerald-500' },
    { type: 'Vector Store', usage: 34, size: '1.2GB', entries: 8934, color: 'bg-amber-500' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Memory Systems</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 bg-muted/30">
          <TabsTrigger value="live" className="flex-1 text-xs">Live</TabsTrigger>
          <TabsTrigger value="stored" className="flex-1 text-xs">Stored</TabsTrigger>
          <TabsTrigger value="vector" className="flex-1 text-xs">Vector</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {memoryStats.map((mem, i) => (
                <Card key={i} className="p-3 border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", mem.color)} />
                      <span className="text-sm font-medium">{mem.type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{mem.size}</span>
                  </div>
                  <Progress value={mem.usage} className="h-1.5 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{mem.usage}% utilized</span>
                    <span>{mem.entries.toLocaleString()} entries</span>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stored" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {entries?.length > 0 ? entries.map((entry: any, i: number) => (
                <Card key={i} className="p-3 border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Archive className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{entry.title || entry.key}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                  <div className="flex gap-1 mt-2">
                    {entry.tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </Card>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No stored memories</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="vector" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Card className="p-4 border-border/30 bg-gradient-to-br from-purple-500/5 to-cyan-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">Vector Embeddings</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Dimensions</p>
                    <p className="text-lg font-medium">1536</p>
                  </div>
                  <div className="bg-background/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Total Vectors</p>
                    <p className="text-lg font-medium">8,934</p>
                  </div>
                  <div className="bg-background/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Index Type</p>
                    <p className="text-lg font-medium">HNSW</p>
                  </div>
                  <div className="bg-background/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Query Latency</p>
                    <p className="text-lg font-medium">12ms</p>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  );
}

function EnhancedContextPanel({ contextWindow }: any) {
  const contextData = contextWindow || {
    used: 4500,
    total: 10000,
    breakdown: [
      { name: 'System Prompt', tokens: 800, color: 'bg-purple-500' },
      { name: 'Chat History', tokens: 2200, color: 'bg-cyan-500' },
      { name: 'Retrieved Docs', tokens: 1200, color: 'bg-emerald-500' },
      { name: 'Working Memory', tokens: 300, color: 'bg-amber-500' },
    ]
  };

  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Context Window</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Token Usage</span>
            </div>
            <Progress value={(contextData.used / contextData.total) * 100} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{contextData.used.toLocaleString()} used</span>
              <span>{contextData.total.toLocaleString()} total</span>
            </div>
          </Card>

          <Card className="p-4 border-border/30">
            <p className="text-sm font-medium mb-3">Breakdown</p>
            <div className="space-y-3">
              {contextData.breakdown.map((item: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">{item.tokens} tokens</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", item.color)}
                      style={{ width: `${(item.tokens / contextData.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}

function EnhancedReasoningPanel({ thinkingSteps, history }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Reasoning Chains</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {thinkingSteps?.length > 0 ? (
            <div className="space-y-3">
              {thinkingSteps.map((step: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                    step.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                    step.status === 'working' ? "bg-amber-500/20 text-amber-400" :
                    "bg-muted/50 text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.type || step.agent}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.detail || step.output}</p>
                    {step.metrics?.confidence && (
                      <Badge variant="outline" className="text-[10px] mt-1 border-cyan-500/30 text-cyan-400">
                        {Math.round(step.metrics.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reasoning chains</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function EnhancedAnalyticsPanel({ metrics }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <h3 className="font-semibold text-sm">Analytics</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-pink-400" />
              <span className="font-medium">Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Avg Response</p>
                <p className="text-lg font-medium">2.3s</p>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Tokens/sec</p>
                <p className="text-lg font-medium">45</p>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Cache Hit</p>
                <p className="text-lg font-medium">78%</p>
              </div>
              <div className="bg-muted/30 rounded p-2">
                <p className="text-xs text-muted-foreground">Quality</p>
                <p className="text-lg font-medium text-emerald-400">94%</p>
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}

function EnhancedProcessingPanel({ isStreaming, metrics }: any) {
  return (
    <>
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Processing</h3>
          {isStreaming && (
            <Badge className="bg-red-500/20 text-red-400 animate-pulse">
              <Cpu className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-red-400" />
              <span className="font-medium">System Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">CPU Usage</span>
                <span className="text-xs">45%</span>
              </div>
              <Progress value={45} className="h-1.5" />
              
              <div className="flex justify-between mt-3">
                <span className="text-xs text-muted-foreground">Memory</span>
                <span className="text-xs">2.4GB</span>
              </div>
              <Progress value={60} className="h-1.5" />
              
              <div className="flex justify-between mt-3">
                <span className="text-xs text-muted-foreground">GPU</span>
                <span className="text-xs">{isStreaming ? '78%' : '12%'}</span>
              </div>
              <Progress value={isStreaming ? 78 : 12} className="h-1.5" />
            </div>
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
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Connections</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/30 rounded p-2">
                <span className="text-xs">Supabase</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Connected</Badge>
              </div>
              <div className="flex items-center justify-between bg-muted/30 rounded p-2">
                <span className="text-xs">AI Gateway</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Ready</Badge>
              </div>
              <div className="flex items-center justify-between bg-muted/30 rounded p-2">
                <span className="text-xs">Vector Store</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}
