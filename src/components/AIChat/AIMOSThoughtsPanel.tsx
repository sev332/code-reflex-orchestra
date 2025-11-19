import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, ChevronDown, ChevronRight, Network, 
  Target, Zap, CheckCircle2, AlertCircle, Clock,
  Eye, MemoryStick, Activity, TrendingUp, User, Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ThinkingStep {
  type: string;
  agent: string;
  status: string;
  duration?: number;
  detail?: string;
}

interface AgentActivity {
  id: string;
  name: string;
  role: string;
  status: string;
  tasksCompleted: number;
}

interface OrchestrationPlan {
  totalSteps: number;
  currentStep: number;
  complexity: string;
  memoryStrategy: string;
}

interface Verification {
  confidence: number;
  provenance_coverage: number;
  semantic_entropy: number;
}

interface AIMOSThoughtsPanelProps {
  thinkingSteps: ThinkingStep[];
  agents: AgentActivity[];
  orchestrationPlan: OrchestrationPlan;
  verification: Verification;
  messageId: string;
}

export const AIMOSThoughtsPanel: React.FC<AIMOSThoughtsPanelProps> = ({
  thinkingSteps,
  agents,
  orchestrationPlan,
  verification,
  messageId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStepIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'goal_set': <Target className="w-4 h-4" />,
      'context_analyze': <Brain className="w-4 h-4" />,
      'chain_build': <Network className="w-4 h-4" />,
      'source_search': <Sparkles className="w-4 h-4" />,
      'self_check': <CheckCircle2 className="w-4 h-4" />,
      'confidence_assess': <TrendingUp className="w-4 h-4" />,
      'decision': <Eye className="w-4 h-4" />,
    };
    return iconMap[type] || <Activity className="w-4 h-4" />;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500 animate-pulse';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const calculateProgress = () => {
    return (orchestrationPlan.currentStep / orchestrationPlan.totalSteps) * 100;
  };

  return (
    <div className="mb-4">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5">
          <CollapsibleTrigger className="w-full p-4 hover:bg-accent/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-primary" />
                )}
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-semibold">AI Thinking Process</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MemoryStick className="w-3 h-3" />
                    {thinkingSteps.length} Steps
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Network className="w-3 h-3" />
                    {agents.length} Agents
                  </Badge>
                  <Badge 
                    variant={verification.confidence > 0.8 ? "default" : "outline"}
                    className="flex items-center gap-1"
                  >
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(verification.confidence * 100)}% Confidence
                  </Badge>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4">
              <Tabs defaultValue="steps" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="steps">Thinking Steps</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[450px] mt-4">
                  {/* Thinking Steps Tab */}
                  <TabsContent value="steps" className="space-y-4">
                    <div className="space-y-2">
                      {thinkingSteps.map((step, idx) => (
                        <Card 
                          key={idx}
                          className="p-3 hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${getStepColor(step.status)}`}>
                              {getStepIcon(step.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{step.type}</span>
                                <Badge variant="outline" className="text-xs">
                                  {step.agent}
                                </Badge>
                                {step.duration && (
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {step.duration}ms
                                  </Badge>
                                )}
                              </div>
                              {step.detail && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {step.detail}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Agents Tab */}
                  <TabsContent value="agents" className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {agents.map((agent) => (
                        <Card key={agent.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">{agent.role}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant={agent.status === 'active' ? 'default' : 'secondary'}
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
                  </TabsContent>

                  {/* Metrics Tab */}
                  <TabsContent value="metrics" className="space-y-4">
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Orchestration Progress</span>
                            <span className="font-mono">
                              {orchestrationPlan.currentStep} / {orchestrationPlan.totalSteps}
                            </span>
                          </div>
                          <Progress value={calculateProgress()} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-background/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">κ (Coverage)</div>
                            <div className="text-lg font-bold">{verification.provenance_coverage.toFixed(2)}</div>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Semantic Entropy</div>
                            <div className="text-lg font-bold">{verification.semantic_entropy.toFixed(3)}</div>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                            <div className="text-lg font-bold">{Math.round(verification.confidence * 100)}%</div>
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Complexity</div>
                            <div className="text-lg font-bold">{orchestrationPlan.complexity}</div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <div className="text-xs font-medium mb-2">Memory Strategy</div>
                          <div className="text-sm text-muted-foreground">
                            {orchestrationPlan.memoryStrategy}
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <div className="text-xs font-medium mb-2">Message ID</div>
                          <div className="text-xs font-mono text-muted-foreground break-all">
                            {messageId}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
