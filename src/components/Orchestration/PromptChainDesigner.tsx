import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Plus,
  Play,
  Save,
  Download,
  Upload,
  Zap,
  Code,
  Search,
  Database,
  GitBranch,
  Target,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ChainNode {
  id: string;
  type: 'prompt' | 'llm' | 'tool' | 'condition' | 'merge' | 'output';
  data: {
    label: string;
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    toolName?: string;
    condition?: string;
    status?: 'idle' | 'running' | 'complete' | 'error';
    output?: string;
  };
  position: { x: number; y: number };
}

interface PromptChainDesignerProps {
  onExecute: (chain: { nodes: ChainNode[]; edges: Edge[] }) => Promise<void>;
  isExecuting?: boolean;
}

export const PromptChainDesigner = ({ onExecute, isExecuting }: PromptChainDesignerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ChainNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<ChainNode | null>(null);
  const [chainName, setChainName] = useState('Untitled Chain');

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: 'hsl(var(--primary))' },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = (type: ChainNode['type']) => {
    const newNode: ChainNode = {
      id: `${type}-${Date.now()}`,
      type,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        status: 'idle',
      },
      position: { x: Math.random() * 500, y: Math.random() * 300 },
    };

    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${type} node`);
  };

  const updateNodeData = (nodeId: string, updates: Partial<ChainNode['data']>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      toast.error('Add at least one node to execute');
      return;
    }

    await onExecute({ nodes, edges });
  };

  const saveChain = () => {
    const chainData = {
      name: chainName,
      nodes,
      edges,
      version: '1.0',
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chainData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chainName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chain exported');
  };

  const loadChain = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setChainName(data.name || 'Imported Chain');
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        toast.success('Chain imported');
      } catch (error) {
        toast.error('Failed to import chain');
      }
    };
    reader.readAsText(file);
  };

  const getNodeColor = (type: ChainNode['type']) => {
    switch (type) {
      case 'prompt': return 'hsl(var(--primary))';
      case 'llm': return 'hsl(var(--accent))';
      case 'tool': return 'hsl(var(--chart-2))';
      case 'condition': return 'hsl(var(--chart-3))';
      case 'merge': return 'hsl(var(--chart-4))';
      case 'output': return 'hsl(var(--chart-5))';
      default: return 'hsl(var(--muted))';
    }
  };

  const getNodeIcon = (type: ChainNode['type']) => {
    switch (type) {
      case 'prompt': return Brain;
      case 'llm': return Zap;
      case 'tool': return Code;
      case 'condition': return GitBranch;
      case 'merge': return Target;
      case 'output': return Database;
      default: return AlertCircle;
    }
  };

  const getStatusIcon = (status: ChainNode['data']['status']) => {
    switch (status) {
      case 'running': return <div className="animate-spin"><Zap className="w-3 h-3" /></div>;
      case 'complete': return <Check className="w-3 h-3 text-success" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-destructive" />;
      default: return null;
    }
  };

  const CustomNode = ({ data, id }: any) => {
    const Icon = getNodeIcon(data.type);
    return (
      <div
        onClick={() => setSelectedNode(nodes.find(n => n.id === id) || null)}
        className="px-4 py-3 shadow-lg rounded-lg border-2 bg-card cursor-pointer hover:shadow-xl transition-all"
        style={{ borderColor: getNodeColor(data.type), minWidth: 200 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color: getNodeColor(data.type) }} />
          <span className="font-semibold text-sm">{data.label}</span>
          {getStatusIcon(data.status)}
        </div>
        {data.prompt && (
          <p className="text-xs text-muted-foreground truncate">{data.prompt.substring(0, 50)}...</p>
        )}
        {data.model && (
          <Badge variant="outline" className="text-xs mt-1">{data.model}</Badge>
        )}
      </div>
    );
  };

  const nodeTypes = {
    prompt: CustomNode,
    llm: CustomNode,
    tool: CustomNode,
    condition: CustomNode,
    merge: CustomNode,
    output: CustomNode,
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Node Library */}
      <Card className="w-64 border-r rounded-none p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Chain Nodes
          </h3>
          <div className="space-y-2">
            {[
              { type: 'prompt' as const, label: 'Prompt', icon: Brain },
              { type: 'llm' as const, label: 'LLM Call', icon: Zap },
              { type: 'tool' as const, label: 'Tool', icon: Code },
              { type: 'condition' as const, label: 'Condition', icon: GitBranch },
              { type: 'merge' as const, label: 'Merge', icon: Target },
              { type: 'output' as const, label: 'Output', icon: Database },
            ].map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode(type)}
              >
                <Icon className="w-4 h-4 mr-2" style={{ color: getNodeColor(type) }} />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <Input
            value={chainName}
            onChange={(e) => setChainName(e.target.value)}
            placeholder="Chain name"
            className="text-sm"
          />
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute Chain'}
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={saveChain}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <label>
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input type="file" accept=".json" className="hidden" onChange={loadChain} />
            </label>
          </Button>
        </div>
      </Card>

      {/* Center - Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes.map(n => ({ ...n, type: n.type as string }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Right Sidebar - Node Properties */}
      {selectedNode && (
        <Card className="w-80 border-l rounded-none p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Node Properties</h3>
                <Badge style={{ backgroundColor: getNodeColor(selectedNode.type) }}>
                  {selectedNode.type}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  className="mt-1"
                />
              </div>

              {(selectedNode.type === 'prompt' || selectedNode.type === 'llm') && (
                <div>
                  <label className="text-sm font-medium">Prompt</label>
                  <Textarea
                    value={selectedNode.data.prompt || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                    className="mt-1 min-h-[100px]"
                    placeholder="Enter your prompt..."
                  />
                </div>
              )}

              {selectedNode.type === 'llm' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      value={selectedNode.data.model || 'google/gemini-2.5-flash'}
                      onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Tokens</label>
                    <Input
                      type="number"
                      value={selectedNode.data.maxTokens || 1000}
                      onChange={(e) => updateNodeData(selectedNode.id, { maxTokens: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === 'tool' && (
                <div>
                  <label className="text-sm font-medium">Tool Name</label>
                  <Input
                    value={selectedNode.data.toolName || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { toolName: e.target.value })}
                    className="mt-1"
                    placeholder="search, code_generator, etc."
                  />
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div>
                  <label className="text-sm font-medium">Condition</label>
                  <Textarea
                    value={selectedNode.data.condition || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., output.contains('yes')"
                  />
                </div>
              )}

              {selectedNode.data.output && (
                <div>
                  <label className="text-sm font-medium">Output</label>
                  <Textarea
                    value={selectedNode.data.output}
                    readOnly
                    className="mt-1 min-h-[100px] bg-muted"
                  />
                </div>
              )}

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                  setSelectedNode(null);
                  toast.info('Node deleted');
                }}
              >
                Delete Node
              </Button>
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};
