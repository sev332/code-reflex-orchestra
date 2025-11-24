import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Network, Target, Zap, CheckCircle2, 
  Clock, Activity, TrendingUp, User, Sparkles,
  Loader2, AlertCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { StreamingStep, OrchestrationPlan, AgentInfo } from '@/hooks/useStreamingReasoning';

interface LiveThinkingPanelProps {
  orchestrationPlan: OrchestrationPlan | null;
  thinkingSteps: StreamingStep[];
  agents: AgentInfo[];
  isStreaming: boolean;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export const LiveThinkingPanel: React.FC<LiveThinkingPanelProps> = ({
  orchestrationPlan,
  thinkingSteps,
  agents,
  isStreaming,
  isCollapsible = true,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const getStepIcon = (type: string, status: string) => {
    if (status === "working") return <Loader2 className="w-4 h-4 animate-spin" />;
    if (status === "error") return <AlertCircle className="w-4 h-4" />;
    
    const iconMap: Record<string, React.ReactNode> = {
      'decompose': <Target className="w-4 h-4" />,
      'context_retrieve': <Brain className="w-4 h-4" />,
      'hypothesize': <Sparkles className="w-4 h-4" />,
      'evidence_gather': <Network className="w-4 h-4" />,
      'multi_integrate': <Network className="w-4 h-4" />,
      'critique': <TrendingUp className="w-4 h-4" />,
      'synthesize': <Zap className="w-4 h-4" />,
      'verify': <CheckCircle2 className="w-4 h-4" />,
      'meta_reflect': <Brain className="w-4 h-4" />,
      'memory_store': <Activity className="w-4 h-4" />,
    };
    return iconMap[type] || <Activity className="w-4 h-4" />;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'working': return 'text-blue-500 animate-pulse';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const calculateProgress = () => {
    if (!orchestrationPlan) return 0;
    return (orchestrationPlan.currentStep / orchestrationPlan.totalSteps) * 100;
  };

  // Always show if there are thinking steps (for historical reasoning)
  if (!orchestrationPlan && !isStreaming && thinkingSteps.length === 0) return null;

  return (
    <Card className="mb-4 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-lg">
      <div 
        className="p-4 border-b border-border/50 cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Brain className={`w-6 h-6 text-primary ${isStreaming ? 'animate-pulse' : ''}`} />
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                AI Deep Reasoning Process
                {isCollapsible && (
                  <span className="text-xs text-muted-foreground">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isStreaming ? 'Live multi-agent orchestration' : 'Historical reasoning trace'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {thinkingSteps.length} / {orchestrationPlan?.totalSteps || 0} Steps
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {agents.length} Agents
            </Badge>
          </div>
        </div>
        
        {orchestrationPlan && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{orchestrationPlan.currentStep} / {orchestrationPlan.totalSteps}</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex gap-2 text-xs">
              <Badge variant="outline">{orchestrationPlan.complexity}</Badge>
              <Badge variant="outline">{orchestrationPlan.memoryStrategy}</Badge>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4">
          <Tabs defaultValue="steps" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="steps">Thinking Steps</TabsTrigger>
            <TabsTrigger value="agents">Active Agents</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            {/* Thinking Steps Tab */}
            <TabsContent value="steps" className="space-y-3">
              {thinkingSteps.map((step, idx) => (
                <Card 
                  key={idx}
                  className={`p-4 transition-all ${
                    step.status === "working" 
                      ? "border-blue-500 shadow-lg shadow-blue-500/20 bg-blue-500/5" 
                      : "hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getStepColor(step.status)}`}>
                      {getStepIcon(step.type, step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-medium">{step.type.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className="text-xs">
                          {step.agent}
                        </Badge>
                        {step.duration && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.duration}ms
                          </Badge>
                        )}
                        {step.status === "working" && (
                          <Badge className="text-xs bg-blue-500">Processing...</Badge>
                        )}
                      </div>
                      
                      {step.metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                          {step.metrics.confidence !== undefined && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Confidence:</span>
                              <span className="ml-1 font-mono font-semibold">
                                {(step.metrics.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {step.metrics.tokensUsed !== undefined && step.metrics.tokensUsed > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Tokens:</span>
                              <span className="ml-1 font-mono">{step.metrics.tokensUsed}</span>
                            </div>
                          )}
                          {step.metrics.coherenceScore !== undefined && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Coherence:</span>
                              <span className="ml-1 font-mono">
                                {(step.metrics.coherenceScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                          {step.metrics.citationCount !== undefined && step.metrics.citationCount > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Citations:</span>
                              <span className="ml-1 font-mono">{step.metrics.citationCount}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                       {step.detail && (
                        <details className="mt-2" open={step.detail.length <= 300}>
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground mb-1">
                            {step.detail.length > 300 ? 'View full reasoning output' : 'Reasoning output'}
                          </summary>
                          <div className="p-3 bg-background/50 rounded-md border border-border/50">
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                              {step.detail}
                            </p>
                          </div>
                        </details>
                      )}
                      
                      {step.inputPrompt && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View input prompt
                          </summary>
                          <div className="mt-1 p-2 bg-muted/30 rounded text-xs font-mono">
                            {step.inputPrompt}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              {isStreaming && thinkingSteps.length === 0 && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Initializing reasoning pipeline...</p>
                </div>
              )}
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <Card key={agent.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        agent.status === "working" 
                          ? "bg-blue-500/20 animate-pulse" 
                          : "bg-primary/10"
                      }`}>
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{agent.role}</div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={agent.status === "working" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {agent.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {agent.tasksCompleted} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {agents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No agents active yet
                </div>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {orchestrationPlan && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Orchestration Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complexity:</span>
                      <span className="font-medium">{orchestrationPlan.complexity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory Strategy:</span>
                      <span className="font-medium">{orchestrationPlan.memoryStrategy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Steps:</span>
                      <span className="font-medium">{orchestrationPlan.totalSteps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Step:</span>
                      <span className="font-medium">{orchestrationPlan.currentStep}</span>
                    </div>
                  </div>
                </Card>
              )}
              
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Step Metrics Summary</h4>
                <div className="space-y-3">
                  {thinkingSteps.filter(s => s.metrics).map((step, idx) => (
                    <div key={idx} className="pb-3 border-b border-border/30 last:border-0">
                      <div className="text-sm font-medium mb-2">{step.type.replace(/_/g, ' ')}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {step.metrics?.confidence !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <div className="font-mono font-semibold">
                              {(step.metrics.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                        {step.metrics?.tokensUsed !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Tokens:</span>
                            <div className="font-mono">{step.metrics.tokensUsed}</div>
                          </div>
                        )}
                        {step.metrics?.coherenceScore !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Coherence:</span>
                            <div className="font-mono">
                              {(step.metrics.coherenceScore * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                        {step.metrics?.informationDensity !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Info Density:</span>
                            <div className="font-mono">
                              {(step.metrics.informationDensity * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        </div>
      )}
    </Card>
  );
};
