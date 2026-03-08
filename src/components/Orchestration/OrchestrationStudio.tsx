import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PromptChainDesigner, ChainNode } from './PromptChainDesigner';
import { MonacoCodeEditor } from './MonacoCodeEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Workflow, Code, Brain, Zap, Save, FolderOpen, Play, History,
  BookOpen, Trash2, Clock, CheckCircle2, XCircle, ChevronRight,
  BarChart3, Cpu, GitBranch, Search, Filter, MoreVertical, Copy,
  Download, Upload, Settings, Sparkles, RefreshCw, Eye, Pause,
} from 'lucide-react';
import { Edge } from '@xyflow/react';
import { orchestrationTemplates, ChainTemplate } from '@/lib/orchestration-templates';
import { useOrchestrationMemory } from '@/hooks/useOrchestrationMemory';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/* ─── Execution Status ─── */
interface ExecutionRecord {
  id: string;
  timestamp: string;
  chain: { nodes: ChainNode[]; edges: Edge[] };
  results: any;
  status: 'success' | 'error' | 'running';
  duration?: number;
  nodeCount: number;
}

export const OrchestrationStudio = () => {
  const [activeTab, setActiveTab] = useState('designer');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentChain, setCurrentChain] = useState<{ nodes: ChainNode[]; edges: Edge[] } | null>(null);
  const [chainName, setChainName] = useState('');
  const [chainDescription, setChainDescription] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);
  const [templateFilter, setTemplateFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  const { savedChains, isLoading: memoryLoading, saveChain, loadChains, loadChain, deleteChain, incrementExecutionCount } = useOrchestrationMemory();

  useEffect(() => { loadChains(); }, [loadChains]);

  const executeChain = async (chain: { nodes: ChainNode[]; edges: Edge[] }) => {
    setIsExecuting(true);
    setCurrentChain(chain);
    const startTime = Date.now();

    const runningExec: ExecutionRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      chain,
      results: null,
      status: 'running',
      nodeCount: chain.nodes.length,
    };
    setExecutionHistory(prev => [runningExec, ...prev.slice(0, 19)]);

    try {
      const { data, error } = await supabase.functions.invoke('chain-executor', {
        body: { chain },
      });

      if (error) throw error;

      const duration = Date.now() - startTime;
      setExecutionHistory(prev =>
        prev.map(e => e.id === runningExec.id ? { ...e, results: data, status: 'success', duration } : e)
      );

      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
        setActiveTab('editor');
      }

      toast.success(`Chain executed in ${(duration / 1000).toFixed(1)}s`);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      setExecutionHistory(prev =>
        prev.map(e => e.id === runningExec.id ? { ...e, status: 'error', duration, results: { error: (error as Error).message } } : e)
      );
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
      toast.success(`Loaded: ${chain.name}`);
    }
  };

  const handleLoadTemplate = (template: ChainTemplate) => {
    setCurrentChain({ nodes: template.nodes, edges: template.edges });
    setShowTemplates(false);
    toast.success(`Template: ${template.name}`);
  };

  const handleReplayExecution = (exec: ExecutionRecord) => {
    setCurrentChain(exec.chain);
    setActiveTab('designer');
    toast.info('Loaded execution into designer');
  };

  const executeCode = async (code: string, language: string): Promise<string> => {
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

  // Stats
  const successRate = executionHistory.length > 0
    ? Math.round((executionHistory.filter(e => e.status === 'success').length / executionHistory.filter(e => e.status !== 'running').length) * 100) || 0
    : 0;

  const avgDuration = executionHistory.filter(e => e.duration).length > 0
    ? (executionHistory.filter(e => e.duration).reduce((s, e) => s + (e.duration || 0), 0) / executionHistory.filter(e => e.duration).length / 1000).toFixed(1)
    : '0';

  const templateCategories = [...new Set(orchestrationTemplates.map(t => t.category))];
  const filteredTemplates = templateFilter === 'all'
    ? orchestrationTemplates
    : orchestrationTemplates.filter(t => t.category === templateFilter);

  const filteredHistory = historySearch
    ? executionHistory.filter(e => e.timestamp.includes(historySearch) || e.status.includes(historySearch.toLowerCase()))
    : executionHistory;

  return (
    <div className="h-full flex flex-col">
      {/* Compact toolbar */}
      <div className="h-10 border-b border-border/40 bg-card/30 backdrop-blur-sm flex items-center px-3 gap-1 shrink-0">
        <Workflow className="w-4 h-4 text-primary mr-1" />
        <span className="text-xs font-semibold mr-3">Orchestration</span>

        {/* Tabs inline */}
        <div className="flex items-center bg-muted/30 rounded-md p-0.5 gap-0.5">
          {[
            { id: 'designer', icon: Workflow, label: 'Designer' },
            { id: 'editor', icon: Code, label: 'Editor' },
            { id: 'history', icon: History, label: 'History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors',
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShowTemplates(true)}>
                <BookOpen className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Templates</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShowSaveDialog(true)} disabled={!currentChain}>
                <Save className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Chain</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShowLoadDialog(true)}>
                <FolderOpen className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load Chain</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border/40 mx-1" />

          {/* Stats badges */}
          {executionHistory.length > 0 && (
            <Badge variant="outline" className="text-[9px] h-5 gap-1 border-border/40">
              <BarChart3 className="w-2.5 h-2.5" />
              {executionHistory.length} runs · {successRate}% · {avgDuration}s avg
            </Badge>
          )}

          {isExecuting && (
            <Badge className="text-[9px] h-5 gap-1 animate-pulse bg-primary/20 text-primary border-0">
              <Zap className="w-2.5 h-2.5" />
              Running
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'designer' && (
          <PromptChainDesigner
            onExecute={executeChain}
            isExecuting={isExecuting}
            initialNodes={currentChain?.nodes}
            initialEdges={currentChain?.edges}
          />
        )}

        {activeTab === 'editor' && (
          <MonacoCodeEditor
            onExecute={executeCode}
            initialCode={generatedCode}
          />
        )}

        {activeTab === 'history' && (
          <div className="h-full flex">
            {/* History list */}
            <div className="w-80 border-r border-border/30 flex flex-col">
              <div className="p-2 border-b border-border/20">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Search history..."
                      className="h-7 text-xs pl-7"
                    />
                  </div>
                  {executionHistory.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0" onClick={() => { setExecutionHistory([]); toast.info('History cleared'); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear All</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filteredHistory.length === 0 ? (
                  <div className="p-8 text-center">
                    <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No executions yet</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredHistory.map(exec => (
                      <button
                        key={exec.id}
                        onClick={() => setSelectedExecution(exec)}
                        className={cn(
                          'w-full text-left px-2.5 py-2 rounded-lg transition-colors mb-0.5',
                          selectedExecution?.id === exec.id ? 'bg-primary/10' : 'hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {exec.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                          {exec.status === 'error' && <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                          {exec.status === 'running' && <RefreshCw className="w-3 h-3 text-primary animate-spin shrink-0" />}
                          <span className="text-[11px] font-medium truncate">{exec.nodeCount} nodes</span>
                          <span className="text-[9px] text-muted-foreground ml-auto">{exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '...'}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {new Date(exec.timestamp).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Execution detail */}
            <div className="flex-1 overflow-auto">
              {selectedExecution ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedExecution.status === 'success' && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Success</Badge>}
                      {selectedExecution.status === 'error' && <Badge className="bg-destructive/20 text-destructive border-0 text-[10px]">Failed</Badge>}
                      {selectedExecution.status === 'running' && <Badge className="bg-primary/20 text-primary border-0 text-[10px]">Running</Badge>}
                      <span className="text-sm text-muted-foreground">{new Date(selectedExecution.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleReplayExecution(selectedExecution)}>
                        <Play className="w-3 h-3" /> Replay
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedExecution.results, null, 2))}>
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 bg-card/30">
                      <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Cpu className="w-3 h-3" /> Nodes</div>
                      <div className="text-lg font-semibold">{selectedExecution.nodeCount}</div>
                    </Card>
                    <Card className="p-3 bg-card/30">
                      <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</div>
                      <div className="text-lg font-semibold">{selectedExecution.duration ? `${(selectedExecution.duration / 1000).toFixed(1)}s` : '—'}</div>
                    </Card>
                    <Card className="p-3 bg-card/30">
                      <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><GitBranch className="w-3 h-3" /> Edges</div>
                      <div className="text-lg font-semibold">{selectedExecution.chain.edges.length}</div>
                    </Card>
                  </div>

                  {/* Node pipeline visualization */}
                  <Card className="p-3 bg-card/30">
                    <div className="text-[10px] text-muted-foreground mb-2 font-semibold">EXECUTION PIPELINE</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedExecution.chain.nodes.map((node, i) => (
                        <div key={node.id} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[9px] h-5 border-primary/30">
                            {node.data?.label || node.type || `Node ${i + 1}`}
                          </Badge>
                          {i < selectedExecution.chain.nodes.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Results */}
                  <Card className="p-3 bg-card/30">
                    <div className="text-[10px] text-muted-foreground mb-2 font-semibold">OUTPUT</div>
                    <pre className="text-xs font-mono bg-background/50 rounded-lg p-3 overflow-auto max-h-[300px] whitespace-pre-wrap">
                      {JSON.stringify(selectedExecution.results, null, 2)}
                    </pre>
                  </Card>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Select an execution to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Chain Templates</DialogTitle>
            <DialogDescription>Select a pre-built template to get started</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            <Button variant={templateFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="h-6 text-[10px]" onClick={() => setTemplateFilter('all')}>All</Button>
            {templateCategories.map(cat => (
              <Button key={cat} variant={templateFilter === cat ? 'secondary' : 'ghost'} size="sm" className="h-6 text-[10px]" onClick={() => setTemplateFilter(cat)}>{cat}</Button>
            ))}
          </div>
          <ScrollArea className="h-[450px] pr-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30"
                  onClick={() => handleLoadTemplate(template)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-primary/15 rounded-lg shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold mb-0.5 truncate">{template.name}</h3>
                      <p className="text-[11px] text-muted-foreground mb-1.5 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px] h-4">{template.category}</Badge>
                        <span className="text-[9px] text-muted-foreground">{template.nodes.length} nodes</span>
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
            <DialogDescription>Save this chain for later use</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input id="name" value={chainName} onChange={e => setChainName(e.target.value)} placeholder="My Chain" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea id="description" value={chainDescription} onChange={e => setChainDescription(e.target.value)} placeholder="What does this chain do?" rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveChain} disabled={!chainName}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Chain</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[350px] pr-4">
            {savedChains.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No saved chains</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedChains.map(chain => (
                  <Card key={chain.id} className="p-3 hover:bg-accent/30 transition-colors border-border/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">{chain.name}</h3>
                        <p className="text-[11px] text-muted-foreground mb-1.5">{chain.description}</p>
                        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                          <span>{chain.nodes.length} nodes</span>
                          <span>{chain.executionCount} runs</span>
                          <span>{new Date(chain.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => handleLoadChain(chain.id)}>
                          <FolderOpen className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => deleteChain(chain.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
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
