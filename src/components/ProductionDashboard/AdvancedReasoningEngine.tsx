import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  GitBranch, 
  Search, 
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  TreePine,
  Network,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface ReasoningStep {
  id: string;
  step_number: number;
  type: 'analysis' | 'hypothesis' | 'deduction' | 'validation' | 'synthesis';
  content: string;
  confidence: number;
  dependencies: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_time: number;
  evidence: string[];
}

interface ReasoningChain {
  id: string;
  query: string;
  approach: 'chain_of_thought' | 'tree_of_thought' | 'graph_reasoning' | 'analogical';
  steps: ReasoningStep[];
  status: 'initializing' | 'processing' | 'completed' | 'failed';
  confidence: number;
  total_time: number;
  conclusion: string | null;
  alternative_paths: number;
}

interface ReasoningMetrics {
  active_chains: number;
  completed_chains: number;
  average_depth: number;
  success_rate: number;
  average_confidence: number;
  total_processing_time: number;
}

export function AdvancedReasoningEngine() {
  const { toast } = useToast();
  const [chains, setChains] = useState<ReasoningChain[]>([]);
  const [metrics, setMetrics] = useState<ReasoningMetrics>({
    active_chains: 0,
    completed_chains: 0,
    average_depth: 0,
    success_rate: 0,
    average_confidence: 0,
    total_processing_time: 0
  });
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Initialize with sample reasoning chains
    initializeReasoningChains();
    
    const interval = setInterval(() => {
      updateChainProgress();
      updateMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeReasoningChains = () => {
    const sampleChains: ReasoningChain[] = [
      {
        id: 'chain-1',
        query: 'Analyze the optimal resource allocation strategy for multi-agent task distribution',
        approach: 'chain_of_thought',
        steps: [
          {
            id: 'step-1',
            step_number: 1,
            type: 'analysis',
            content: 'Examining current resource distribution patterns across active agents',
            confidence: 0.89,
            dependencies: [],
            status: 'completed',
            processing_time: 1240,
            evidence: ['Agent utilization metrics', 'Task completion rates', 'Resource constraints']
          },
          {
            id: 'step-2',
            step_number: 2,
            type: 'hypothesis',
            content: 'Hypothesis: Load balancing based on agent specialization yields 23% efficiency gain',
            confidence: 0.76,
            dependencies: ['step-1'],
            status: 'processing',
            processing_time: 0,
            evidence: ['Historical performance data', 'Specialization metrics']
          }
        ],
        status: 'processing',
        confidence: 0.82,
        total_time: 1240,
        conclusion: null,
        alternative_paths: 3
      }
    ];

    setChains(sampleChains);
  };

  const updateChainProgress = () => {
    setChains(prev => prev.map(chain => {
      if (chain.status === 'processing') {
        const updatedSteps = chain.steps.map(step => {
          if (step.status === 'processing') {
            return {
              ...step,
              processing_time: step.processing_time + 1000,
              confidence: Math.min(0.95, step.confidence + 0.01)
            };
          }
          return step;
        });

        // Simulate step completion
        const processingStep = updatedSteps.find(s => s.status === 'processing');
        if (processingStep && Math.random() > 0.95) {
          processingStep.status = 'completed';
          
          // Add next step if applicable
          if (updatedSteps.length < 6 && Math.random() > 0.7) {
            const newStep: ReasoningStep = {
              id: `step-${updatedSteps.length + 1}`,
              step_number: updatedSteps.length + 1,
              type: ['deduction', 'validation', 'synthesis'][Math.floor(Math.random() * 3)] as any,
              content: `Step ${updatedSteps.length + 1}: Advanced reasoning process...`,
              confidence: 0.5 + Math.random() * 0.3,
              dependencies: [processingStep.id],
              status: 'processing',
              processing_time: 0,
              evidence: [`Evidence set ${updatedSteps.length + 1}`]
            };
            updatedSteps.push(newStep);
          }
        }

        return {
          ...chain,
          steps: updatedSteps,
          total_time: chain.total_time + 1000,
          confidence: updatedSteps.reduce((sum, step) => sum + step.confidence, 0) / updatedSteps.length
        };
      }
      return chain;
    }));
  };

  const updateMetrics = () => {
    setMetrics(prev => {
      const activeChains = chains.filter(c => c.status === 'processing').length;
      const completedChains = chains.filter(c => c.status === 'completed').length;
      const totalSteps = chains.reduce((sum, chain) => sum + chain.steps.length, 0);
      const avgConfidence = chains.reduce((sum, chain) => sum + chain.confidence, 0) / chains.length;
      
      return {
        active_chains: activeChains,
        completed_chains: completedChains,
        average_depth: totalSteps / chains.length || 0,
        success_rate: completedChains / chains.length * 100 || 0,
        average_confidence: avgConfidence * 100 || 0,
        total_processing_time: chains.reduce((sum, chain) => sum + chain.total_time, 0)
      };
    });
  };

  const startReasoningChain = async (approach: ReasoningChain['approach']) => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a reasoning query",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('advanced-ai-processor', {
        body: {
          type: 'reasoning',
          query: query,
          approach: approach,
          parameters: {
            max_depth: 8,
            confidence_threshold: 0.7,
            enable_self_reflection: true,
            parallel_branches: approach === 'tree_of_thought' ? 3 : 1
          }
        }
      });

      if (error) throw error;

      const newChain: ReasoningChain = {
        id: `chain-${Date.now()}`,
        query: query,
        approach: approach,
        steps: [{
          id: `step-initial-${Date.now()}`,
          step_number: 1,
          type: 'analysis',
          content: `Initializing ${approach.replace('_', ' ')} reasoning for: "${query}"`,
          confidence: 0.5,
          dependencies: [],
          status: 'processing',
          processing_time: 0,
          evidence: ['Query analysis', 'Context evaluation']
        }],
        status: 'processing',
        confidence: 0.5,
        total_time: 0,
        conclusion: null,
        alternative_paths: approach === 'tree_of_thought' ? 3 : 1
      };

      setChains(prev => [newChain, ...prev]);
      setQuery('');
      
      toast({
        title: "Reasoning Chain Started",
        description: `Initiated ${approach.replace('_', ' ')} reasoning process`,
      });
    } catch (error) {
      console.error('Reasoning error:', error);
      toast({
        title: "Reasoning Error",
        description: "Failed to start reasoning chain",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (type: ReasoningStep['type']) => {
    switch (type) {
      case 'analysis': return Search;
      case 'hypothesis': return Lightbulb;
      case 'deduction': return ArrowRight;
      case 'validation': return CheckCircle;
      case 'synthesis': return Target;
      default: return Brain;
    }
  };

  const getStepColor = (status: ReasoningStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getApproachIcon = (approach: ReasoningChain['approach']) => {
    switch (approach) {
      case 'chain_of_thought': return ArrowRight;
      case 'tree_of_thought': return TreePine;
      case 'graph_reasoning': return Network;
      case 'analogical': return GitBranch;
      default: return Brain;
    }
  };

  return (
    <div className="space-y-6">
      {/* Reasoning Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Chains</p>
                <p className="text-2xl font-bold">{metrics.active_chains}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{metrics.completed_chains}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Depth</p>
                <p className="text-2xl font-bold">{Math.round(metrics.average_depth)}</p>
              </div>
              <TreePine className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(metrics.success_rate)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{Math.round(metrics.average_confidence)}%</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{Math.round(metrics.total_processing_time / 1000)}s</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Reasoning Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your reasoning query or problem statement..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
            />
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => startReasoningChain('chain_of_thought')}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Chain of Thought
              </Button>
              
              <Button 
                onClick={() => startReasoningChain('tree_of_thought')}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TreePine className="h-4 w-4" />
                Tree of Thought
              </Button>
              
              <Button 
                onClick={() => startReasoningChain('graph_reasoning')}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Network className="h-4 w-4" />
                Graph Reasoning
              </Button>
              
              <Button 
                onClick={() => startReasoningChain('analogical')}
                disabled={isProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Analogical
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reasoning Chains */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Chains</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {chains.filter(chain => chain.status === 'processing').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active reasoning chains</p>
                  <p className="text-sm text-muted-foreground">Start a new reasoning process above</p>
                </CardContent>
              </Card>
            ) : (
              chains
                .filter(chain => chain.status === 'processing')
                .map((chain) => {
                  const ApproachIcon = getApproachIcon(chain.approach);
                  return (
                    <Card key={chain.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <ApproachIcon className="h-5 w-5 text-primary" />
                              <Badge variant="outline">
                                {chain.approach.replace('_', ' ')}
                              </Badge>
                              <Badge variant="secondary">
                                {chain.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{chain.query}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Confidence: {Math.round(chain.confidence * 100)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {Math.round(chain.total_time / 1000)}s elapsed
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {chain.steps.map((step, index) => {
                            const StepIcon = getStepIcon(step.type);
                            return (
                              <div key={step.id} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`p-2 rounded-full border-2 ${
                                    step.status === 'completed' ? 'border-green-500 bg-green-50' :
                                    step.status === 'processing' ? 'border-blue-500 bg-blue-50' :
                                    'border-gray-300 bg-gray-50'
                                  }`}>
                                    <StepIcon className={`h-4 w-4 ${getStepColor(step.status)}`} />
                                  </div>
                                  {index < chain.steps.length - 1 && (
                                    <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Step {step.step_number}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {step.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(step.confidence * 100)}% confidence
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm">{step.content}</p>
                                  
                                  {step.evidence.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {step.evidence.map((evidence, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {evidence}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {step.status === 'processing' && (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                                      <span className="text-xs text-muted-foreground">
                                        Processing... ({Math.round(step.processing_time / 1000)}s)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No completed reasoning chains yet</p>
              <p className="text-sm text-muted-foreground">Completed chains will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reasoning Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Confidence</span>
                      <span>{Math.round(metrics.average_confidence)}%</span>
                    </div>
                    <Progress value={metrics.average_confidence} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{Math.round(metrics.success_rate)}%</span>
                    </div>
                    <Progress value={metrics.success_rate} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Chain Depth</span>
                      <span>{Math.round(metrics.average_depth)} steps</span>
                    </div>
                    <Progress value={Math.min(100, metrics.average_depth * 10)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approach Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-sm">Chain of Thought</span>
                    </div>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TreePine className="h-4 w-4" />
                      <span className="text-sm">Tree of Thought</span>
                    </div>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      <span className="text-sm">Graph Reasoning</span>
                    </div>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <span className="text-sm">Analogical</span>
                    </div>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}