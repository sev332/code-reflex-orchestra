// WisdomNET Project Tree - Hierarchical Structure Visualization

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Brain, Database, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWisdomNET } from '@/contexts/WisdomNETContext';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'agent' | 'memory' | 'config';
  children?: TreeNode[];
  metadata?: {
    description?: string;
    status?: 'active' | 'idle' | 'error';
    lastModified?: string;
  };
}

const mockTreeData: TreeNode = {
  id: 'root',
  name: 'WisdomNET',
  type: 'folder',
  children: [
    {
      id: 'rag_core',
      name: 'RAG Core',
      type: 'folder',
      metadata: { status: 'active' },
      children: [
        { id: 'embeddings', name: 'embeddings.ts', type: 'file' },
        { id: 'retrieval', name: 'retrieval.ts', type: 'file' },
        { id: 'context', name: 'context.ts', type: 'file' }
      ]
    },
    {
      id: 'ui_engine',
      name: 'UI Engine',
      type: 'folder',
      metadata: { status: 'active' },
      children: [
        { id: 'dashboard', name: 'Dashboard.tsx', type: 'file' },
        { id: 'agents', name: 'AgentPanel.tsx', type: 'file' },
        { id: 'chat', name: 'ChatInterface.tsx', type: 'file' }
      ]
    },
    {
      id: 'multi_agent',
      name: 'Multi Agent',
      type: 'folder',
      metadata: { status: 'active' },
      children: [
        { id: 'orchestrator', name: 'Orchestrator Agent', type: 'agent', metadata: { status: 'active' } },
        { id: 'planner', name: 'Planner Agent', type: 'agent', metadata: { status: 'idle' } },
        { id: 'engineer', name: 'Engineer Agent', type: 'agent', metadata: { status: 'idle' } }
      ]
    },
    {
      id: 'memory_hub',
      name: 'Memory Hub',
      type: 'folder',
      metadata: { status: 'active' },
      children: [
        { id: 'short_term', name: 'Short Term', type: 'memory', metadata: { status: 'active' } },
        { id: 'long_term', name: 'Long Term', type: 'memory', metadata: { status: 'active' } },
        { id: 'deep_memory', name: 'Deep Memory', type: 'memory', metadata: { status: 'idle' } }
      ]
    },
    {
      id: 'api_hub',
      name: 'API Hub',
      type: 'folder',
      metadata: { status: 'active' },
      children: [
        { id: 'supabase', name: 'Supabase Config', type: 'config' },
        { id: 'github', name: 'GitHub Integration', type: 'config' },
        { id: 'langchain', name: 'LangChain Setup', type: 'config' }
      ]
    }
  ]
};

function TreeNodeComponent({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const { selectNode, selectedNode } = useWisdomNET();

  const handleNodeClick = () => {
    selectNode(node.id);
    if (node.children) {
      setIsExpanded(!isExpanded);
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'folder':
        return isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />;
      case 'file':
        return <File className="w-4 h-4 text-muted-foreground" />;
      case 'agent':
        return <Brain className="w-4 h-4 text-agent-active" />;
      case 'memory':
        return <Database className="w-4 h-4 text-wisdom-memory" />;
      case 'config':
        return <Cog className="w-4 h-4 text-accent" />;
      default:
        return <Folder className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    if (!node.metadata?.status) return null;
    
    const statusColors = {
      active: 'bg-wisdom-success/20 text-wisdom-success',
      idle: 'bg-muted/20 text-muted-foreground',
      error: 'bg-destructive/20 text-destructive'
    };

    return (
      <Badge 
        variant="outline" 
        className={`ml-2 text-xs ${statusColors[node.metadata.status]}`}
      >
        {node.metadata.status}
      </Badge>
    );
  };

  const isSelected = selectedNode === node.id;

  return (
    <div className="select-none">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNodeClick}
        className={`
          w-full justify-start h-8 px-2 hover:bg-accent/20 transition-all duration-200
          ${isSelected ? 'bg-primary/20 border border-primary/30' : ''}
          ${level > 0 ? 'ml-' + (level * 4) : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="text-sm font-medium truncate">{node.name}</span>
          </div>
          {getStatusBadge()}
        </div>
      </Button>

      {isExpanded && node.children && (
        <div className="animate-mind-expand">
          {node.children.map((child) => (
            <TreeNodeComponent 
              key={child.id} 
              node={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectTree() {
  return (
    <div className="space-y-1 overflow-y-auto max-h-full">
      <TreeNodeComponent node={mockTreeData} />
    </div>
  );
}