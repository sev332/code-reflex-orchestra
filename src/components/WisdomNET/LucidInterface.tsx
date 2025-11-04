import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Code, Cpu, Database, Eye, Lightbulb, 
  Zap, Network, FileText, Settings, Play, Pause,
  ChevronRight, Activity, BarChart3, Target
} from 'lucide-react';
import { LucidCore, createDefaultLucidConfig, type LongPromptChain, type SystemInsight, type CodeAnalysisResult } from '@/lib/lucid-core';
import { MultiLLMEngine, type MultiLLMRequest } from '@/lib/multi-llm-engine';

interface LucidInterfaceProps {
  className?: string;
}

export function LucidInterface({ className }: LucidInterfaceProps) {
  const [lucidCore] = useState(() => new LucidCore(createDefaultLucidConfig()));
  const [multiLLM] = useState(() => MultiLLMEngine.getInstance());
  const [systemState, setSystemState] = useState<any>({});
  const [activeChains, setActiveChains] = useState<LongPromptChain[]>([]);
  const [insights, setInsights] = useState<SystemInsight[]>([]);
  const [codeAnalysis, setCodeAnalysis] = useState<CodeAnalysisResult[]>([]);
  const [memoryStats, setMemoryStats] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState('overview');
  const [promptInput, setPromptInput] = useState('');
  const [chainTitle, setChainTitle] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o', 'claude-3-5-sonnet-20241022']);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSystemData = async () => {
      setSystemState(lucidCore.getCurrentState());
      setActiveChains(lucidCore.getActivePromptChains());
      setInsights(lucidCore.getSystemInsights());
      setCodeAnalysis(lucidCore.getCodebaseAnalysis());
      setMemoryStats(lucidCore.getMemoryStats());
    };

    updateSystemData();
    const interval = setInterval(updateSystemData, 2000);
    return () => clearInterval(interval);
  }, [lucidCore]);

  const createLongPromptChain = async () => {
    if (!promptInput.trim() || !chainTitle.trim()) return;
    
    setIsProcessing(true);
    try {
      const steps = [
        {
          prompt: `Analyze this request: ${promptInput}`,
          model: selectedModels[0],
          maxTokens: 2000,
          temperature: 0.3,
          dependencies: []
        },
        {
          prompt: `Based on the analysis, create a detailed implementation plan`,
          model: selectedModels[1] || selectedModels[0],
          maxTokens: 3000,
          temperature: 0.5,
          dependencies: []
        },
        {
          prompt: `Generate code or detailed steps for implementation`,
          model: selectedModels[0],
          maxTokens: 4000,
          temperature: 0.7,
          dependencies: []
        }
      ];

      await lucidCore.createLongPromptChain(chainTitle, steps);
      setChainTitle('');
      setPromptInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeMultiLLMQuery = async () => {
    if (!promptInput.trim()) return;

    setIsProcessing(true);
    try {
      const request: MultiLLMRequest = {
        provider: 'lovable',
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: promptInput }]
      };

      const response = await multiLLM.route(request.messages, request);
      console.log('Multi-LLM Response:', response);
      
      // Store in memory
      await lucidCore.storeMemory({
        type: 'conversation',
        content: {
          prompt: promptInput,
          response: response,
          models: selectedModels
        },
        embeddings: [], // Would generate real embeddings
        importance: 0.8,
        tags: ['multi-llm', 'query'],
        relationships: []
      });

      setPromptInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSystemInsights = async () => {
    setIsProcessing(true);
    try {
      await lucidCore.generateSystemInsights();
    } finally {
      setIsProcessing(false);
    }
  };

  const availableModels = multiLLM.getAvailableModels();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* LUCID Header */}
      <Card className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  LUCID Meta-System
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Autonomous AI Development Architecture
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={systemState.systemHealth === 'optimal' ? 'default' : 'destructive'}>
                {systemState.systemHealth || 'initializing'}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{activeChains.length} active chains</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Code Analysis</p>
                <p className="text-2xl font-bold">{systemState.codebaseSize || 0}</p>
                <p className="text-xs text-muted-foreground">files analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Memory Store</p>
                <p className="text-2xl font-bold">{memoryStats.total || 0}</p>
                <p className="text-xs text-muted-foreground">memories stored</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
                <p className="text-xs text-muted-foreground">suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Active Tasks</p>
                <p className="text-2xl font-bold">{activeChains.length}</p>
                <p className="text-xs text-muted-foreground">processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chains">Prompt Chains</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="code">Code Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-LLM Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>Multi-LLM Engine</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Models</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableModels.slice(0, 6).map(model => (
                      <Badge
                        key={model.id}
                        variant={selectedModels.includes(model.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedModels(prev =>
                            prev.includes(model.id)
                              ? prev.filter(id => id !== model.id)
                              : [...prev, model.id]
                          );
                        }}
                      >
                        {model.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Enter your prompt for multi-LLM analysis..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={executeMultiLLMQuery} 
                  disabled={isProcessing || !promptInput.trim()}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Execute Multi-LLM Query
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{((memoryStats.total || 0) / 1000 * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(memoryStats.total || 0) / 1000 * 100} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Analysis Complete</span>
                    <span>{codeAnalysis.length > 0 ? '100' : '0'}%</span>
                  </div>
                  <Progress value={codeAnalysis.length > 0 ? 100 : 0} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Insights Generated</span>
                    <span>{insights.length}</span>
                  </div>
                  <Progress value={Math.min(insights.length * 10, 100)} className="mt-1" />
                </div>
                <Button 
                  onClick={generateSystemInsights}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Generate New Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Long Prompt Chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Chain title..."
                value={chainTitle}
                onChange={(e) => setChainTitle(e.target.value)}
              />
              <Textarea
                placeholder="Describe the complex task for multi-step processing..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={createLongPromptChain}
                disabled={isProcessing || !promptInput.trim() || !chainTitle.trim()}
              >
                <Play className="h-4 w-4 mr-2" />
                Create Chain
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {activeChains.map(chain => (
              <Card key={chain.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{chain.title}</CardTitle>
                    <Badge variant={chain.status === 'executing' ? 'default' : 'secondary'}>
                      {chain.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{chain.currentStep + 1} / {chain.steps.length}</span>
                    </div>
                    <Progress value={(chain.currentStep + 1) / chain.steps.length * 100} />
                    <div className="text-xs text-muted-foreground">
                      Started: {new Date(chain.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {insights.map(insight => (
                <Card key={insight.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={insight.priority === 'critical' ? 'destructive' : 'default'}>
                            {insight.priority}
                          </Badge>
                          <span className="font-medium">{insight.type}</span>
                        </div>
                        <p className="text-sm">{insight.description}</p>
                        <div className="text-xs text-muted-foreground">
                          Affects: {insight.affectedFiles.join(', ')}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(memoryStats.byType || {}).map(([type, count]) => (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{count as number}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type.replace('_', ' ')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableModels.map(model => (
                <Card key={model.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{model.name}</h4>
                        <Badge variant="outline">{model.provider}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {model.costTier}
                        </Badge>
                        {model.multimodal && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Vision
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Best for: {model.bestFor.join(', ')}
                      </div>
                      <div className="text-xs">
                        Context: {(model.contextWindow / 1000).toFixed(0)}k tokens
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {codeAnalysis.map(analysis => (
                <Card key={analysis.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{analysis.filePath}</h4>
                        <Badge variant={analysis.complexity > 5 ? 'destructive' : 'default'}>
                          Complexity: {analysis.complexity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{analysis.purpose}</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.patterns.map(pattern => (
                          <Badge key={pattern} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                      {analysis.suggestions.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Suggestions:</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {analysis.suggestions.map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}