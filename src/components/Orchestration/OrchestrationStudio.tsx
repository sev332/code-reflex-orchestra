import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PromptChainDesigner, ChainNode } from './PromptChainDesigner';
import { MonacoCodeEditor } from './MonacoCodeEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Workflow, 
  Code, 
  Brain, 
  Zap, 
  Save, 
  FolderOpen,
  Play,
  History,
  BookOpen,
  Trash2
} from 'lucide-react';
import { Edge } from '@xyflow/react';
import { orchestrationTemplates, ChainTemplate } from '@/lib/orchestration-templates';
import { useOrchestrationMemory } from '@/hooks/useOrchestrationMemory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

export const OrchestrationStudio = () => {
  const [activeTab, setActiveTab] = useState('designer');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentChain, setCurrentChain] = useState<{ nodes: ChainNode[]; edges: Edge[] } | null>(null);
  const [chainName, setChainName] = useState('');
  const [chainDescription, setChainDescription] = useState('');
  
  const { savedChains, isLoading: memoryLoading, saveChain, loadChains, loadChain, deleteChain, incrementExecutionCount } = useOrchestrationMemory();

  useEffect(() => {
    loadChains();
  }, [loadChains]);

  const executeChain = async (chain: { nodes: ChainNode[]; edges: Edge[] }) => {
    setIsExecuting(true);
    setCurrentChain(chain);
    toast.info('Executing prompt chain...');

    try {
      const { data, error } = await supabase.functions.invoke('chain-executor', {
        body: { chain },
      });

      if (error) throw error;

      // Store execution in history
      const execution = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        chain,
        results: data,
      };
      setExecutionHistory(prev => [execution, ...prev.slice(0, 9)]);

      // If chain generated code, show it in the editor
      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
        setActiveTab('editor');
      }

      toast.success('Chain executed successfully');
      return data;
    } catch (error) {
      console.error('Chain execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Chain execution failed');
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveChain = async () => {
    if (!currentChain || !chainName) {
      toast.error('Please provide a name for the chain');
      return;
    }

    const success = await saveChain(chainName, chainDescription, currentChain.nodes, currentChain.edges);
    if (success) {
      setShowSaveDialog(false);
      setChainName('');
      setChainDescription('');
    }
  };

  const handleLoadChain = async (chainId: string) => {
    const chain = await loadChain(chainId);
    if (chain) {
      setCurrentChain({ nodes: chain.nodes, edges: chain.edges });
      setShowLoadDialog(false);
      toast.success(`Loaded chain: ${chain.name}`);
    }
  };

  const handleLoadTemplate = (template: ChainTemplate) => {
    setCurrentChain({ nodes: template.nodes, edges: template.edges });
    setShowTemplates(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const executeCode = async (code: string, language: string): Promise<string> => {
    toast.info('Executing code...');

    try {
      const { data, error } = await supabase.functions.invoke('code-executor', {
        body: { code, language },
      });

      if (error) throw error;

      return data.output || 'Code executed successfully (no output)';
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Code execution failed');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-mind">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Workflow className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neural-glow">
                  Orchestration Studio
                </h1>
                <p className="text-sm text-muted-foreground">
                  Design and execute complex AI workflows
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(true)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Templates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={!currentChain}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLoadDialog(true)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Load
              </Button>
              {executionHistory.length > 0 && (
                <Badge variant="outline" className="gap-2">
                  <History className="w-3 h-3" />
                  {executionHistory.length} executions
                </Badge>
              )}
              {isExecuting && (
                <Badge variant="default" className="gap-2 animate-pulse">
                  <Zap className="w-3 h-3" />
                  Executing
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b bg-muted/30">
            <div className="container mx-auto px-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="designer" className="gap-2">
                  <Workflow className="w-4 h-4" />
                  Chain Designer
                </TabsTrigger>
                <TabsTrigger value="editor" className="gap-2">
                  <Code className="w-4 h-4" />
                  Code Editor
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="w-4 h-4" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="designer" className="h-full m-0 p-0">
              <PromptChainDesigner 
                onExecute={executeChain}
                isExecuting={isExecuting}
                initialNodes={currentChain?.nodes}
                initialEdges={currentChain?.edges}
              />
            </TabsContent>

            <TabsContent value="editor" className="h-full m-0 p-0">
              <MonacoCodeEditor
                onExecute={executeCode}
                initialCode={generatedCode}
              />
            </TabsContent>

            <TabsContent value="history" className="h-full m-0 p-6">
              <div className="container mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Execution History</h2>
                  {executionHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExecutionHistory([]);
                        toast.info('History cleared');
                      }}
                    >
                      Clear History
                    </Button>
                  )}
                </div>

                {executionHistory.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No executions yet. Design and run a chain to see history.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {executionHistory.map((execution) => (
                      <Card key={execution.id} className="p-4 hover:bg-accent/5 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">
                                {execution.chain.nodes.length} nodes
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(execution.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">
                              Executed chain with {execution.chain.edges.length} connections
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Load this execution back into the designer
                              toast.info('Load execution feature coming soon');
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chain Templates</DialogTitle>
            <DialogDescription>
              Select a pre-built template to get started quickly
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-2 gap-4">
              {orchestrationTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleLoadTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.nodes.length} nodes
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Chain</DialogTitle>
            <DialogDescription>
              Save this chain to memory for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chain Name</Label>
              <Input
                id="name"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                placeholder="My Amazing Chain"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={chainDescription}
                onChange={(e) => setChainDescription(e.target.value)}
                placeholder="What does this chain do?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChain} disabled={!chainName}>
              <Save className="w-4 h-4 mr-2" />
              Save Chain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Chain</DialogTitle>
            <DialogDescription>
              Load a previously saved chain from memory
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {savedChains.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No saved chains yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedChains.map((chain) => (
                  <Card
                    key={chain.id}
                    className="p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{chain.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {chain.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{chain.nodes.length} nodes</span>
                          <span>{chain.executionCount} executions</span>
                          <span>{new Date(chain.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadChain(chain.id)}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteChain(chain.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
