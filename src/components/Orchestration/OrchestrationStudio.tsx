import { useState } from 'react';
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
  History
} from 'lucide-react';
import { Edge } from '@xyflow/react';

export const OrchestrationStudio = () => {
  const [activeTab, setActiveTab] = useState('designer');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');

  const executeChain = async (chain: { nodes: ChainNode[]; edges: Edge[] }) => {
    setIsExecuting(true);
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
    </div>
  );
};
