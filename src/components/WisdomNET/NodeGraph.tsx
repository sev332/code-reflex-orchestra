// WisdomNET Advanced Node Graph - Hierarchical Network Visualization

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Brain, Database, Cog, File, Folder, Network, Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useWisdomNET } from '@/contexts/WisdomNETContext';

interface GraphNode {
  id: string;
  name: string;
  type: 'branch' | 'leaf' | 'agent' | 'memory' | 'connection';
  position: { x: number; y: number };
  connections: string[];
  children?: string[];
  parent?: string;
  metadata: {
    description?: string;
    status?: 'active' | 'idle' | 'error';
    importance?: number;
    lastModified?: string;
    embeddings?: number;
    ragLinks?: string[];
  };
  collapsed?: boolean;
}

interface GraphConnection {
  id: string;
  source: string;
  target: string;
  type: 'hierarchy' | 'semantic' | 'reference' | 'memory';
  strength: number;
  label?: string;
}

const mockGraphData: GraphNode[] = [
  {
    id: 'root',
    name: 'WisdomNET Core',
    type: 'branch',
    position: { x: 400, y: 50 },
    connections: ['rag_core', 'ui_engine', 'multi_agent', 'memory_hub'],
    children: ['rag_core', 'ui_engine', 'multi_agent', 'memory_hub'],
    metadata: { status: 'active', importance: 10, embeddings: 1247 }
  },
  {
    id: 'rag_core',
    name: 'RAG Core',
    type: 'branch',
    position: { x: 200, y: 200 },
    connections: ['embeddings', 'retrieval', 'context', 'memory_hub'],
    children: ['embeddings', 'retrieval', 'context'],
    parent: 'root',
    metadata: { status: 'active', importance: 9, embeddings: 856, ragLinks: ['memory_hub', 'deep_memory'] }
  },
  {
    id: 'embeddings',
    name: 'Vector Embeddings',
    type: 'leaf',
    position: { x: 100, y: 320 },
    connections: ['retrieval', 'short_term', 'long_term'],
    parent: 'rag_core',
    metadata: { status: 'active', importance: 8, embeddings: 2341 }
  },
  {
    id: 'retrieval',
    name: 'Context Retrieval',
    type: 'leaf',
    position: { x: 200, y: 320 },
    connections: ['embeddings', 'context', 'orchestrator'],
    parent: 'rag_core',
    metadata: { status: 'active', importance: 7, embeddings: 1123 }
  },
  {
    id: 'context',
    name: 'Context Engine',
    type: 'leaf',
    position: { x: 300, y: 320 },
    connections: ['retrieval', 'planner', 'engineer'],
    parent: 'rag_core',
    metadata: { status: 'active', importance: 8, embeddings: 987 }
  },
  {
    id: 'ui_engine',
    name: 'UI Engine',
    type: 'branch',
    position: { x: 600, y: 200 },
    connections: ['dashboard', 'agents', 'chat', 'root'],
    children: ['dashboard', 'agents', 'chat'],
    parent: 'root',
    metadata: { status: 'active', importance: 7, embeddings: 654 }
  },
  {
    id: 'multi_agent',
    name: 'Multi Agent',
    type: 'branch',
    position: { x: 400, y: 300 },
    connections: ['orchestrator', 'planner', 'engineer', 'context'],
    children: ['orchestrator', 'planner', 'engineer'],
    parent: 'root',
    metadata: { status: 'active', importance: 9, embeddings: 1432 }
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    type: 'agent',
    position: { x: 350, y: 420 },
    connections: ['planner', 'engineer', 'retrieval', 'memory_keeper'],
    parent: 'multi_agent',
    metadata: { status: 'active', importance: 10, ragLinks: ['rag_core', 'memory_hub'] }
  },
  {
    id: 'planner',
    name: 'Planner Agent',
    type: 'agent',
    position: { x: 400, y: 420 },
    connections: ['orchestrator', 'engineer', 'context'],
    parent: 'multi_agent',
    metadata: { status: 'idle', importance: 8 }
  },
  {
    id: 'engineer',
    name: 'Engineer Agent',
    type: 'agent',
    position: { x: 450, y: 420 },
    connections: ['planner', 'orchestrator', 'context'],
    parent: 'multi_agent',
    metadata: { status: 'idle', importance: 8 }
  },
  {
    id: 'memory_hub',
    name: 'Memory Hub',
    type: 'branch',
    position: { x: 100, y: 150 },
    connections: ['short_term', 'long_term', 'deep_memory', 'rag_core'],
    children: ['short_term', 'long_term', 'deep_memory'],
    parent: 'root',
    metadata: { status: 'active', importance: 9, embeddings: 3456 }
  },
  {
    id: 'short_term',
    name: 'Short Term',
    type: 'memory',
    position: { x: 50, y: 250 },
    connections: ['long_term', 'embeddings', 'memory_keeper'],
    parent: 'memory_hub',
    metadata: { status: 'active', importance: 7, embeddings: 234 }
  },
  {
    id: 'long_term',
    name: 'Long Term',
    type: 'memory',
    position: { x: 100, y: 250 },
    connections: ['short_term', 'deep_memory', 'embeddings'],
    parent: 'memory_hub',
    metadata: { status: 'active', importance: 8, embeddings: 1876 }
  },
  {
    id: 'deep_memory',
    name: 'Deep Memory',
    type: 'memory',
    position: { x: 150, y: 250 },
    connections: ['long_term', 'rag_core'],
    parent: 'memory_hub',
    metadata: { status: 'idle', importance: 6, embeddings: 5432 }
  }
];

const mockConnections: GraphConnection[] = [
  { id: 'root-rag', source: 'root', target: 'rag_core', type: 'hierarchy', strength: 1 },
  { id: 'root-ui', source: 'root', target: 'ui_engine', type: 'hierarchy', strength: 1 },
  { id: 'root-agent', source: 'root', target: 'multi_agent', type: 'hierarchy', strength: 1 },
  { id: 'root-memory', source: 'root', target: 'memory_hub', type: 'hierarchy', strength: 1 },
  { id: 'rag-embed', source: 'rag_core', target: 'embeddings', type: 'hierarchy', strength: 1 },
  { id: 'rag-ret', source: 'rag_core', target: 'retrieval', type: 'hierarchy', strength: 1 },
  { id: 'rag-ctx', source: 'rag_core', target: 'context', type: 'hierarchy', strength: 1 },
  { id: 'embed-ret', source: 'embeddings', target: 'retrieval', type: 'semantic', strength: 0.9 },
  { id: 'ret-ctx', source: 'retrieval', target: 'context', type: 'semantic', strength: 0.8 },
  { id: 'ctx-orch', source: 'context', target: 'orchestrator', type: 'semantic', strength: 0.7 },
  { id: 'orch-plan', source: 'orchestrator', target: 'planner', type: 'reference', strength: 0.9 },
  { id: 'plan-eng', source: 'planner', target: 'engineer', type: 'reference', strength: 0.8 },
  { id: 'embed-short', source: 'embeddings', target: 'short_term', type: 'memory', strength: 0.6 },
  { id: 'short-long', source: 'short_term', target: 'long_term', type: 'memory', strength: 0.9 },
  { id: 'long-deep', source: 'long_term', target: 'deep_memory', type: 'memory', strength: 0.7 },
  { id: 'rag-memory', source: 'rag_core', target: 'memory_hub', type: 'semantic', strength: 0.8 }
];

export function NodeGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>(mockGraphData);
  const [connections] = useState<GraphConnection[]>(mockConnections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  // Cross-panel deep linking: highlight a node when a global focus event is dispatched
  useEffect(() => {
    const handler = (e: any) => {
      const detail = (e as any).detail || {};
      if (detail?.nodeId) {
        setSelectedNode(detail.nodeId);
      }
    };
    // @ts-ignore - CustomEvent typing on window
    window.addEventListener('wisdomnet:focus-node', handler as any);
    return () => {
      // @ts-ignore
      window.removeEventListener('wisdomnet:focus-node', handler as any);
    };
  }, []);

  const toggleBranch = useCallback((nodeId: string) => {
    setCollapsedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const getNodeIcon = (type: string, status?: string) => {
    switch (type) {
      case 'branch':
        return <Folder className="w-4 h-4 text-wisdom-primary" />;
      case 'leaf':
        return <File className="w-4 h-4 text-accent" />;
      case 'agent':
        return <Brain className={`w-4 h-4 ${status === 'active' ? 'text-wisdom-success' : 'text-muted-foreground'}`} />;
      case 'memory':
        return <Database className="w-4 h-4 text-wisdom-memory" />;
      case 'connection':
        return <Network className="w-4 h-4 text-secondary" />;
      default:
        return <Cog className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'hierarchy':
        return 'stroke-wisdom-primary';
      case 'semantic':
        return 'stroke-wisdom-neural';
      case 'reference':
        return 'stroke-accent';
      case 'memory':
        return 'stroke-wisdom-memory';
      default:
        return 'stroke-muted-foreground';
    }
  };

  const getVisibleNodes = () => {
    const visible = new Set<string>();
    
    const addNodeAndParents = (nodeId: string) => {
      visible.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node?.parent && !collapsedBranches.has(node.parent)) {
        addNodeAndParents(node.parent);
      }
    };

    const addChildren = (nodeId: string) => {
      if (collapsedBranches.has(nodeId)) return;
      
      const node = nodes.find(n => n.id === nodeId);
      if (node?.children) {
        node.children.forEach(childId => {
          visible.add(childId);
          addChildren(childId);
        });
      }
    };

    // Start with root
    visible.add('root');
    addChildren('root');

    return nodes.filter(node => visible.has(node.id));
  };

  const visibleNodes = getVisibleNodes();
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleConnections = connections.filter(
    conn => visibleNodeIds.has(conn.source) && visibleNodeIds.has(conn.target)
  );

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node?.type === 'branch') {
      toggleBranch(nodeId);
    }
  };

  return (
    <Card className="h-full bg-background/50 backdrop-blur border-wisdom-primary/20">
      <div className="p-4 border-b border-wisdom-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-wisdom-primary" />
            <h3 className="font-semibold text-foreground">Master Index Network</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className="text-xs"
            >
              {showConnections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showConnections ? 'Hide' : 'Show'} Connections
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 h-[600px] overflow-hidden relative">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 800 500"
          className="border border-wisdom-primary/10 rounded-lg bg-gradient-to-br from-background/80 to-wisdom-surface/20"
        >
          {/* Connection Lines */}
          {showConnections && visibleConnections.map(conn => {
            const sourceNode = visibleNodes.find(n => n.id === conn.source);
            const targetNode = visibleNodes.find(n => n.id === conn.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <g key={conn.id}>
                <line
                  x1={sourceNode.position.x}
                  y1={sourceNode.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  className={`${getConnectionColor(conn.type)} transition-opacity duration-200`}
                  strokeWidth={conn.strength * 2}
                  strokeOpacity={selectedNode ? 
                    (selectedNode === conn.source || selectedNode === conn.target ? 0.8 : 0.2) : 
                    0.4
                  }
                  strokeDasharray={conn.type === 'semantic' ? '5,5' : 'none'}
                />
                {conn.type === 'reference' && (
                  <circle
                    cx={(sourceNode.position.x + targetNode.position.x) / 2}
                    cy={(sourceNode.position.y + targetNode.position.y) / 2}
                    r="2"
                    className="fill-accent"
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map(node => (
            <g key={node.id}>
              {/* Node Circle */}
              <circle
                cx={node.position.x}
                cy={node.position.y}
                r={node.type === 'branch' ? 25 : 18}
                className={`
                  fill-background stroke-2 cursor-pointer transition-all duration-200
                  ${selectedNode === node.id ? 'stroke-wisdom-primary fill-wisdom-primary/20' : 'stroke-wisdom-primary/40'}
                  ${node.metadata.status === 'active' ? 'drop-shadow-wisdom-glow' : ''}
                  hover:stroke-wisdom-primary hover:fill-wisdom-primary/10
                `}
                onClick={() => handleNodeClick(node.id)}
              />

              {/* Node Icon */}
              <foreignObject
                x={node.position.x - 8}
                y={node.position.y - 8}
                width="16"
                height="16"
                className="pointer-events-none"
              >
                {getNodeIcon(node.type, node.metadata.status)}
              </foreignObject>

              {/* Branch Collapse Indicator */}
              {node.type === 'branch' && (
                <foreignObject
                  x={node.position.x + 15}
                  y={node.position.y - 8}
                  width="16"
                  height="16"
                  className="pointer-events-none"
                >
                  {collapsedBranches.has(node.id) ? 
                    <ChevronRight className="w-3 h-3 text-wisdom-primary" /> : 
                    <ChevronDown className="w-3 h-3 text-wisdom-primary" />
                  }
                </foreignObject>
              )}

              {/* Node Label */}
              <text
                x={node.position.x}
                y={node.position.y + 35}
                textAnchor="middle"
                className="text-xs font-medium fill-foreground pointer-events-none"
              >
                {node.name}
              </text>

              {/* Embedding Count Badge */}
              {node.metadata.embeddings && (
                <foreignObject
                  x={node.position.x - 15}
                  y={node.position.y - 35}
                  width="30"
                  height="16"
                  className="pointer-events-none"
                >
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                    {node.metadata.embeddings}
                  </Badge>
                </foreignObject>
              )}
            </g>
          ))}

          {/* Neural Activity Indicators */}
          {visibleNodes
            .filter(node => node.metadata.status === 'active')
            .map(node => (
              <circle
                key={`pulse-${node.id}`}
                cx={node.position.x}
                cy={node.position.y}
                r="30"
                className="fill-none stroke-wisdom-neural/30 animate-pulse"
                strokeWidth="1"
              />
            ))
          }
        </svg>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-64 bg-background/95 backdrop-blur border border-wisdom-primary/20 rounded-lg p-3 shadow-lg">
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getNodeIcon(node.type, node.metadata.status)}
                    <h4 className="font-semibold text-sm">{node.name}</h4>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Type: {node.type} | Status: {node.metadata.status || 'unknown'}
                  </div>

                  {node.metadata.embeddings && (
                    <div className="text-xs">
                      <Badge variant="outline" className="text-xs">
                        {node.metadata.embeddings} embeddings
                      </Badge>
                    </div>
                  )}

                  {node.connections.length > 0 && (
                    <div className="text-xs">
                      <strong>Connected to:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.connections.slice(0, 4).map(connId => (
                          <Badge key={connId} variant="secondary" className="text-xs px-1 py-0">
                            {nodes.find(n => n.id === connId)?.name || connId}
                          </Badge>
                        ))}
                        {node.connections.length > 4 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            +{node.connections.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {node.metadata.ragLinks && (
                    <div className="text-xs">
                      <strong>RAG Links:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.metadata.ragLinks.map(linkId => (
                          <Badge key={linkId} variant="outline" className="text-xs px-1 py-0 border-wisdom-neural">
                            {linkId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </Card>
  );
}