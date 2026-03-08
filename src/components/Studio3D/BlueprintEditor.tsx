// Phase 8 — Blueprint Visual Scripting (Unreal Blueprint equivalent)
import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Handle, Position, type Connection, type Node, type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Play, Trash2, Zap, GitBranch, RotateCcw, Timer, MousePointer, Move, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Node Types ────────────────────────────────────

type BlueprintNodeCategory = 'event' | 'action' | 'logic' | 'variable';

interface BlueprintNodeDef {
  type: string;
  label: string;
  category: BlueprintNodeCategory;
  icon: string;
  inputs: string[];
  outputs: string[];
  color: string;
}

const nodeLibrary: BlueprintNodeDef[] = [
  // Events
  { type: 'onStart', label: 'On Start', category: 'event', icon: '▶', inputs: [], outputs: ['exec'], color: 'hsl(0 70% 50%)' },
  { type: 'onClick', label: 'On Click', category: 'event', icon: '👆', inputs: [], outputs: ['exec', 'objectId'], color: 'hsl(0 70% 50%)' },
  { type: 'onCollision', label: 'On Collision', category: 'event', icon: '💥', inputs: [], outputs: ['exec', 'otherBody'], color: 'hsl(0 70% 50%)' },
  { type: 'onTimer', label: 'On Timer', category: 'event', icon: '⏱', inputs: [], outputs: ['exec'], color: 'hsl(0 70% 50%)' },
  { type: 'onKey', label: 'On Key Press', category: 'event', icon: '⌨', inputs: [], outputs: ['exec', 'key'], color: 'hsl(0 70% 50%)' },
  // Actions
  { type: 'moveTo', label: 'Move To', category: 'action', icon: '➡', inputs: ['exec', 'target', 'x', 'y', 'z'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'rotate', label: 'Rotate', category: 'action', icon: '🔄', inputs: ['exec', 'target', 'x', 'y', 'z'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'scale', label: 'Scale', category: 'action', icon: '📐', inputs: ['exec', 'target', 'x', 'y', 'z'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'setMaterial', label: 'Set Material', category: 'action', icon: '🎨', inputs: ['exec', 'target', 'color'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'playAnim', label: 'Play Animation', category: 'action', icon: '🎬', inputs: ['exec', 'target', 'clip'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'spawnParticle', label: 'Spawn Particle', category: 'action', icon: '✨', inputs: ['exec', 'preset', 'position'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'destroy', label: 'Destroy', category: 'action', icon: '💀', inputs: ['exec', 'target'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  { type: 'log', label: 'Print Log', category: 'action', icon: '📝', inputs: ['exec', 'message'], outputs: ['exec'], color: 'hsl(210 70% 50%)' },
  // Logic
  { type: 'branch', label: 'Branch', category: 'logic', icon: '🔀', inputs: ['exec', 'condition'], outputs: ['true', 'false'], color: 'hsl(120 60% 40%)' },
  { type: 'loop', label: 'For Loop', category: 'logic', icon: '🔁', inputs: ['exec', 'count'], outputs: ['body', 'done', 'index'], color: 'hsl(120 60% 40%)' },
  { type: 'delay', label: 'Delay', category: 'logic', icon: '⏳', inputs: ['exec', 'seconds'], outputs: ['exec'], color: 'hsl(120 60% 40%)' },
  { type: 'random', label: 'Random', category: 'logic', icon: '🎲', inputs: ['min', 'max'], outputs: ['value'], color: 'hsl(120 60% 40%)' },
  { type: 'compare', label: 'Compare', category: 'logic', icon: '⚖', inputs: ['a', 'b'], outputs: ['equal', 'greater', 'less'], color: 'hsl(120 60% 40%)' },
  // Variables
  { type: 'getVar', label: 'Get Variable', category: 'variable', icon: '📦', inputs: ['name'], outputs: ['value'], color: 'hsl(45 80% 50%)' },
  { type: 'setVar', label: 'Set Variable', category: 'variable', icon: '📥', inputs: ['exec', 'name', 'value'], outputs: ['exec'], color: 'hsl(45 80% 50%)' },
];

// ─── Custom Node Component ─────────────────────────

function BlueprintNode({ data }: { data: any }) {
  const def = data.def as BlueprintNodeDef;
  return (
    <div className="rounded-lg border-2 shadow-lg min-w-[140px] overflow-hidden"
      style={{ borderColor: def.color, background: 'hsl(var(--card))' }}>
      <div className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
        style={{ background: def.color, color: 'white' }}>
        <span>{def.icon}</span>
        <span>{def.label}</span>
      </div>
      <div className="px-2 py-1.5 space-y-1">
        {def.inputs.map((input, i) => (
          <div key={`in-${i}`} className="flex items-center gap-1 text-[10px] text-muted-foreground relative">
            <Handle type="target" position={Position.Left} id={`in-${i}`}
              style={{ background: def.color, width: 8, height: 8, left: -4 }} />
            <span className="ml-1">{input}</span>
          </div>
        ))}
        {def.outputs.map((output, i) => (
          <div key={`out-${i}`} className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground relative">
            <span className="mr-1">{output}</span>
            <Handle type="source" position={Position.Right} id={`out-${i}`}
              style={{ background: def.color, width: 8, height: 8, right: -4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = { blueprint: BlueprintNode };

// ─── Blueprint Templates ───────────────────────────

interface BlueprintTemplate {
  name: string;
  description: string;
  icon: string;
  nodes: Array<{ type: string; position: { x: number; y: number } }>;
  edges: Array<{ source: number; sourceHandle: string; target: number; targetHandle: string }>;
}

const templates: BlueprintTemplate[] = [
  {
    name: 'Click to Move',
    description: 'Move object when clicked',
    icon: '👆',
    nodes: [
      { type: 'onClick', position: { x: 0, y: 0 } },
      { type: 'moveTo', position: { x: 250, y: 0 } },
    ],
    edges: [{ source: 0, sourceHandle: 'out-0', target: 1, targetHandle: 'in-0' }],
  },
  {
    name: 'Collision Response',
    description: 'React to physics collision',
    icon: '💥',
    nodes: [
      { type: 'onCollision', position: { x: 0, y: 0 } },
      { type: 'setMaterial', position: { x: 250, y: 0 } },
      { type: 'spawnParticle', position: { x: 250, y: 120 } },
    ],
    edges: [
      { source: 0, sourceHandle: 'out-0', target: 1, targetHandle: 'in-0' },
      { source: 0, sourceHandle: 'out-0', target: 2, targetHandle: 'in-0' },
    ],
  },
  {
    name: 'Timer Loop',
    description: 'Repeat action on interval',
    icon: '⏱',
    nodes: [
      { type: 'onTimer', position: { x: 0, y: 0 } },
      { type: 'rotate', position: { x: 250, y: 0 } },
    ],
    edges: [{ source: 0, sourceHandle: 'out-0', target: 1, targetHandle: 'in-0' }],
  },
];

// ─── Main Blueprint Editor ─────────────────────────

interface BlueprintEditorProps {
  className?: string;
}

export function BlueprintEditor({ className }: BlueprintEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedCategory, setSelectedCategory] = useState<BlueprintNodeCategory | 'all'>('all');
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds));
  }, [setEdges]);

  const addNode = useCallback((def: BlueprintNodeDef) => {
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNode: Node = {
      id,
      type: 'blueprint',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { def },
    };
    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  const loadTemplate = useCallback((template: BlueprintTemplate) => {
    const newNodes: Node[] = template.nodes.map((n, i) => {
      const def = nodeLibrary.find(d => d.type === n.type)!;
      return {
        id: `tpl-${i}-${Date.now()}`,
        type: 'blueprint',
        position: n.position,
        data: { def },
      };
    });
    const newEdges: Edge[] = template.edges.map((e, i) => ({
      id: `edge-${i}-${Date.now()}`,
      source: newNodes[e.source].id,
      sourceHandle: e.sourceHandle,
      target: newNodes[e.target].id,
      targetHandle: e.targetHandle,
      animated: true,
      style: { stroke: 'hsl(var(--primary))' },
    }));
    setNodes(nds => [...nds, ...newNodes]);
    setEdges(eds => [...eds, ...newEdges]);
  }, [setNodes, setEdges]);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const filteredLibrary = useMemo(() =>
    selectedCategory === 'all' ? nodeLibrary : nodeLibrary.filter(n => n.category === selectedCategory),
    [selectedCategory]
  );

  const categories: Array<{ id: BlueprintNodeCategory | 'all'; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All', icon: <Zap className="w-3 h-3" /> },
    { id: 'event', label: 'Events', icon: <MousePointer className="w-3 h-3" /> },
    { id: 'action', label: 'Actions', icon: <Move className="w-3 h-3" /> },
    { id: 'logic', label: 'Logic', icon: <GitBranch className="w-3 h-3" /> },
    { id: 'variable', label: 'Vars', icon: <Palette className="w-3 h-3" /> },
  ];

  return (
    <div className={cn("flex flex-col bg-background/30", className)}>
      {/* Toolbar */}
      <div className="h-9 bg-background/80 border-b border-border/30 flex items-center px-2 gap-1 shrink-0">
        <Badge variant="outline" className="text-[10px] px-1.5 border-border/30 gap-1">
          <Zap className="w-3 h-3" /> Blueprint
        </Badge>
        <div className="flex-1" />
        <Button variant={isRunning ? 'default' : 'outline'} size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className="h-6 text-[10px] gap-1">
          {isRunning ? <><RotateCcw className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Run</>}
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-[10px] gap-1 text-muted-foreground">
          <Trash2 className="w-3 h-3" /> Clear
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Library */}
        <div className="w-48 bg-background/60 border-r border-border/30 flex flex-col shrink-0">
          <div className="flex items-center gap-0.5 p-1 border-b border-border/20">
            {categories.map(cat => (
              <Button key={cat.id} variant="ghost" size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn('h-6 text-[9px] px-1.5', selectedCategory === cat.id && 'bg-primary/20 text-primary')}>
                {cat.icon}
              </Button>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {filteredLibrary.map(def => (
                <Button key={def.type} variant="ghost" size="sm"
                  onClick={() => addNode(def)}
                  className="w-full h-7 text-[10px] justify-start gap-1.5 px-2 hover:bg-muted/30">
                  <span>{def.icon}</span>
                  <span>{def.label}</span>
                </Button>
              ))}
            </div>

            <div className="p-1.5 border-t border-border/20">
              <div className="text-[9px] font-semibold text-foreground/50 uppercase tracking-wider mb-1 px-1">Templates</div>
              {templates.map((tpl, i) => (
                <Button key={i} variant="outline" size="sm"
                  onClick={() => loadTemplate(tpl)}
                  className="w-full h-auto p-1.5 mb-1 flex flex-col items-start gap-0.5 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-medium">
                    <span>{tpl.icon}</span> {tpl.name}
                  </div>
                  <span className="text-[8px] text-muted-foreground">{tpl.description}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={2}
              style={{ background: 'hsl(var(--muted))' }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
