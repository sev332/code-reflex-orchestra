import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, ChevronDown, ChevronRight, Network, Database, 
  GitBranch, Target, Zap, CheckCircle2, AlertCircle,
  Eye, MemoryStick, Cpu, Activity, TrendingUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ReasoningStep {
  node: string;
  type: 'PLAN' | 'RETRIEVE' | 'CONDENSE' | 'REASON' | 'VERIFY' | 'FORMAT' | 'AUDIT';
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  input?: any;
  output?: any;
  confidence?: number;
  tokensUsed?: number;
  agentId?: string;
}

interface ContextItem {
  id: string;
  content: string;
  source: string;
  rs_score: number; // Retrieval Score (RS = QS × IDS × (1-DD))
  qs_score: number; // Quality Score
  ids_score: number; // Index Depth Score
  dd_score: number; // Dependency Delta
  importance: number;
  hierarchyLevel: number;
  tags: string[];
  selected: boolean;
  reasoning: string;
}

interface AIMOSOrchestration {
  traceId: string;
  mode: string;
  budget: {
    total: number;
    used: number;
    distribution: Record<string, number>;
  };
  steps: ReasoningStep[];
  agents: {
    id: string;
    role: string;
    tasksCompleted: number;
    status: string;
  }[];
  context: ContextItem[];
  verification: {
    kappa: number; // Coverage score
    ece: number; // Expected Calibration Error
    confidence: number;
    citations: number;
  };
  metadata: {
    startTime: string;
    endTime?: string;
    totalDuration?: number;
  };
}

interface AIMOSThoughtsPanelProps {
  orchestration: AIMOSOrchestration;
  messageId: string;
}

export const AIMOSThoughtsPanel: React.FC<AIMOSThoughtsPanelProps> = ({
  orchestration,
  messageId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const getStepIcon = (type: ReasoningStep['type']) => {
    switch (type) {
      case 'PLAN': return <Target className="w-4 h-4" />;
      case 'RETRIEVE': return <Database className="w-4 h-4" />;
      case 'CONDENSE': return <Zap className="w-4 h-4" />;
      case 'REASON': return <Brain className="w-4 h-4" />;
      case 'VERIFY': return <CheckCircle2 className="w-4 h-4" />;
      case 'FORMAT': return <Activity className="w-4 h-4" />;
      case 'AUDIT': return <Eye className="w-4 h-4" />;
    }
  };

  const getStepColor = (status: ReasoningStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500 animate-pulse';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const calculateBudgetPercentage = () => {
    return (orchestration.budget.used / orchestration.budget.total) * 100;
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
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-primary">AIMOS Orchestration</span>
                  <span className="text-xs text-muted-foreground">
                    {orchestration.mode} • {orchestration.steps.length} nodes • {orchestration.agents.length} agents
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    κ: {orchestration.verification.kappa.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ECE: {orchestration.verification.ece.toFixed(3)}
                  </Badge>
                  <Badge 
                    variant={orchestration.verification.confidence > 0.85 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {(orchestration.verification.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border/50">
              <Tabs defaultValue="reasoning" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger 
                    value="reasoning" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Reasoning Chain
                  </TabsTrigger>
                  <TabsTrigger 
                    value="context"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Context Selection
                  </TabsTrigger>
                  <TabsTrigger 
                    value="agents"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Network className="w-4 h-4 mr-2" />
                    Agent Coordination
                  </TabsTrigger>
                  <TabsTrigger 
                    value="budget"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    Token Budget
                  </TabsTrigger>
                </TabsList>

                {/* Reasoning Chain Tab */}
                <TabsContent value="reasoning" className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {orchestration.steps.map((step, idx) => (
                        <Card 
                          key={idx}
                          className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                            selectedStep === step.node ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedStep(selectedStep === step.node ? null : step.node)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={getStepColor(step.status)}>
                                {getStepIcon(step.type)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{step.type}</div>
                                <div className="text-xs text-muted-foreground">
                                  Node: {step.node}
                                  {step.agentId && ` • Agent: ${step.agentId}`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {step.duration && (
                                <Badge variant="outline" className="text-xs">
                                  {step.duration}ms
                                </Badge>
                              )}
                              {step.confidence !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  {(step.confidence * 100).toFixed(0)}%
                                </Badge>
                              )}
                              <Badge 
                                variant={
                                  step.status === 'completed' ? 'default' : 
                                  step.status === 'failed' ? 'destructive' : 
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {step.status}
                              </Badge>
                            </div>
                          </div>

                          {selectedStep === step.node && (
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                              {step.input && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">Input:</div>
                                  <div className="text-xs bg-background/50 p-2 rounded">
                                    {typeof step.input === 'string' ? step.input : JSON.stringify(step.input, null, 2)}
                                  </div>
                                </div>
                              )}
                              {step.output && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">Output:</div>
                                  <div className="text-xs bg-background/50 p-2 rounded">
                                    {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                                  </div>
                                </div>
                              )}
                              {step.tokensUsed && (
                                <div className="text-xs text-muted-foreground">
                                  Tokens used: {step.tokensUsed}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Context Selection Tab */}
                <TabsContent value="context" className="p-4">
                  <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                    <div className="text-sm font-semibold mb-2">CMC Retrieval Algorithm</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>RS = QS × IDS × (1 - DD)</div>
                      <div>QS = 0.4·Completeness + 0.3·Density + 0.3·Relevance</div>
                      <div>IDS = normalized(log(1 + depth) × connectivity)</div>
                      <div>DD = cosine similarity × temporal decay</div>
                    </div>
                  </div>

                  <ScrollArea className="h-[350px]">
                    <div className="space-y-3">
                      {orchestration.context.map((item, idx) => (
                        <Card 
                          key={item.id}
                          className={`p-4 ${item.selected ? 'border-primary bg-primary/5' : 'opacity-60'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {item.selected ? (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                RS: {item.rs_score.toFixed(3)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                L{item.hierarchyLevel}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Imp: {item.importance}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-sm mb-2 line-clamp-2">
                            {item.content}
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">QS:</span>{' '}
                              <span className="font-mono">{item.qs_score.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IDS:</span>{' '}
                              <span className="font-mono">{item.ids_score.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">DD:</span>{' '}
                              <span className="font-mono">{item.dd_score.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {item.selected && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="text-xs text-muted-foreground">
                                <span className="font-semibold">Selection reasoning:</span> {item.reasoning}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground mt-1">
                            Source: {item.source}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Agent Coordination Tab */}
                <TabsContent value="agents" className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {orchestration.agents.map((agent) => (
                        <Card key={agent.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-sm">{agent.role}</div>
                              <div className="text-xs text-muted-foreground">ID: {agent.id}</div>
                            </div>
                            
                            <Badge 
                              variant={agent.status === 'idle' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {agent.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3" />
                            <span>Tasks completed: {agent.tasksCompleted}</span>
                          </div>

                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Contribution</div>
                            <Progress 
                              value={(agent.tasksCompleted / orchestration.steps.length) * 100} 
                              className="h-2"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <Card className="mt-4 p-3 bg-accent/10">
                    <div className="text-xs space-y-1">
                      <div className="font-semibold">MAS Coordination Protocol:</div>
                      <div>• DAG-based task graph with parallel lanes</div>
                      <div>• Self-Refine loop for single-agent correction</div>
                      <div>• Multi-agent debate with quorum for conflicts</div>
                      <div>• Runtime healing for state corruption</div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Token Budget Tab */}
                <TabsContent value="budget" className="p-4">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Total Budget Usage</div>
                        <div className="text-sm">
                          <span className="font-mono">{orchestration.budget.used}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="font-mono">{orchestration.budget.total}</span>
                        </div>
                      </div>
                      <Progress value={calculateBudgetPercentage()} className="h-3" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {calculateBudgetPercentage().toFixed(1)}% utilized
                      </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(orchestration.budget.distribution).map(([node, tokens]) => (
                        <Card key={node} className="p-3">
                          <div className="text-xs text-muted-foreground mb-1">{node}</div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-lg font-mono font-semibold">{tokens}</div>
                            <div className="text-xs text-muted-foreground">tokens</div>
                          </div>
                          <Progress 
                            value={(tokens / orchestration.budget.total) * 100} 
                            className="h-1 mt-2"
                          />
                        </Card>
                      ))}
                    </div>

                    <Card className="p-3 bg-accent/10">
                      <div className="text-xs space-y-1">
                        <div className="font-semibold">Dumbbell Allocation Strategy:</div>
                        <div>• Head/Tail sections: ≥20% each (mission-critical)</div>
                        <div>• Middle section: Compressed, ≤60%</div>
                        <div>• VERIFY/AUDIT nodes: Never throttled under pressure</div>
                        <div>• Adaptive reallocation based on uncertainty signals</div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-sm font-semibold mb-2">Verification Metrics</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Coverage (κ):</span>
                          <span className="font-mono">{orchestration.verification.kappa.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">ECE:</span>
                          <span className="font-mono">{orchestration.verification.ece.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Citations:</span>
                          <span className="font-mono">{orchestration.verification.citations}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-mono">{(orchestration.verification.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
