// WisdomNET Memory Viewer - Knowledge Index Visualization

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWisdomNET } from '@/contexts/WisdomNETContext';
import { 
  Search, 
  Database, 
  Clock, 
  FileText, 
  Code, 
  Brain, 
  Zap,
  Filter,
  Download
} from 'lucide-react';

interface MemoryEntry {
  id: string;
  type: 'short-term' | 'long-term' | 'deep-memory';
  content: string;
  source: string;
  score: number;
  timestamp: string;
  tags: string[];
  accessCount: number;
}

const mockMemoryEntries: MemoryEntry[] = [
  {
    id: 'mem_001',
    type: 'short-term',
    content: 'User requested AGI system implementation with multi-agent architecture',
    source: 'chat-interface',
    score: 0.95,
    timestamp: new Date().toISOString(),
    tags: ['agi', 'multi-agent', 'user-request'],
    accessCount: 5
  },
  {
    id: 'mem_002',
    type: 'long-term',
    content: 'WisdomNET core architecture uses hierarchical RAG with vector embeddings',
    source: 'system-knowledge',
    score: 0.92,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    tags: ['architecture', 'rag', 'embeddings'],
    accessCount: 12
  },
  {
    id: 'mem_003',
    type: 'deep-memory',
    content: 'Previous implementation patterns for recursive development systems',
    source: 'archived-projects',
    score: 0.78,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    tags: ['patterns', 'recursive', 'development'],
    accessCount: 3
  },
  {
    id: 'mem_004',
    type: 'short-term',
    content: 'Agent orchestration requires priority-based task assignment',
    source: 'planner-agent',
    score: 0.88,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    tags: ['orchestration', 'priority', 'tasks'],
    accessCount: 8
  }
];

export function MemoryViewer() {
  const { queryMemory } = useWisdomNET();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [memories] = useState<MemoryEntry[]>(mockMemoryEntries);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      await queryMemory(searchQuery);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredMemories = memories.filter(memory => {
    const matchesType = selectedType === 'all' || memory.type === selectedType;
    const matchesSearch = !searchQuery || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'short-term':
        return 'bg-wisdom-warning/20 text-wisdom-warning border-wisdom-warning/30';
      case 'long-term':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'deep-memory':
        return 'bg-wisdom-memory/20 text-wisdom-memory border-wisdom-memory/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('chat')) return <FileText className="w-3 h-3" />;
    if (source.includes('agent')) return <Brain className="w-3 h-3" />;
    if (source.includes('code')) return <Code className="w-3 h-3" />;
    return <Database className="w-3 h-3" />;
  };

  const memoryStats = {
    shortTerm: memories.filter(m => m.type === 'short-term').length,
    longTerm: memories.filter(m => m.type === 'long-term').length,
    deepMemory: memories.filter(m => m.type === 'deep-memory').length,
    totalAccess: memories.reduce((sum, m) => sum + m.accessCount, 0)
  };

  return (
    <div className="space-y-4">
      {/* Memory Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-wisdom-warning/10 rounded-lg">
          <div className="font-semibold text-wisdom-warning">{memoryStats.shortTerm}</div>
          <div className="text-muted-foreground">Short</div>
        </div>
        <div className="text-center p-2 bg-primary/10 rounded-lg">
          <div className="font-semibold text-primary">{memoryStats.longTerm}</div>
          <div className="text-muted-foreground">Long</div>
        </div>
        <div className="text-center p-2 bg-wisdom-memory/10 rounded-lg">
          <div className="font-semibold text-wisdom-memory">{memoryStats.deepMemory}</div>
          <div className="text-muted-foreground">Deep</div>
        </div>
      </div>

      {/* Search Interface */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory..."
            className="text-xs bg-muted/30"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-2"
          >
            {isSearching ? (
              <div className="animate-neural-pulse">
                <Search className="w-3 h-3" />
              </div>
            ) : (
              <Search className="w-3 h-3" />
            )}
          </Button>
        </div>

        {/* Type Filter */}
        <div className="flex space-x-1">
          {['all', 'short-term', 'long-term', 'deep-memory'].map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="text-xs px-2 py-1 h-6"
            >
              {type === 'all' ? 'All' : type.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Memory Entries */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredMemories.map((memory) => (
          <Card 
            key={memory.id} 
            className="p-3 bg-card/30 backdrop-blur-sm border border-border hover:border-primary/30 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getSourceIcon(memory.source)}
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getTypeColor(memory.type)}`}
                >
                  {memory.type.replace('-', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent">
                  {(memory.score * 100).toFixed(0)}%
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  <span>{memory.accessCount}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-xs text-foreground mb-2 line-clamp-2">
              {memory.content}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {memory.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs px-1.5 py-0.5 bg-muted/20"
                >
                  {tag}
                </Badge>
              ))}
              {memory.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  +{memory.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(memory.timestamp).toLocaleTimeString()}</span>
              </div>
              <span className="text-xs">{memory.source}</span>
            </div>

            {/* Relevance Bar */}
            <div className="mt-2">
              <Progress 
                value={memory.score * 100} 
                className="h-1 bg-muted/30"
              />
            </div>
          </Card>
        ))}

        {filteredMemories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No memories found</p>
            <p className="text-xs">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Memory Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
        >
          <Filter className="w-3 h-3 mr-1" />
          Advanced
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
      </div>
    </div>
  );
}