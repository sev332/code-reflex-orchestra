import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Brain, TrendingUp, Archive, Zap, Database, Filter } from 'lucide-react';
import { MemoryEntry } from '@/types/production-types';
import { useProductionWisdomNET } from '@/hooks/useProductionWisdomNET';

export function AdvancedMemoryViewer() {
  const { queryMemory, storeMemory } = useProductionWisdomNET();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MemoryEntry['entry_type'] | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');

  const memoryTypes: { type: MemoryEntry['entry_type'] | 'all'; label: string; icon: any; color: string }[] = [
    { type: 'all', label: 'All', icon: Database, color: 'bg-gray-500' },
    { type: 'insight', label: 'Insights', icon: Brain, color: 'bg-purple-500' },
    { type: 'pattern', label: 'Patterns', icon: TrendingUp, color: 'bg-blue-500' },
    { type: 'knowledge', label: 'Knowledge', icon: Archive, color: 'bg-green-500' },
    { type: 'code', label: 'Code', icon: Zap, color: 'bg-orange-500' },
    { type: 'conversation', label: 'Conversations', icon: Search, color: 'bg-pink-500' },
    { type: 'error', label: 'Errors', icon: Filter, color: 'bg-red-500' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await queryMemory(searchQuery);
      const filteredResults = selectedType === 'all' 
        ? results 
        : results.filter(m => m.entry_type === selectedType);
      setMemories(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStoreMemory = async () => {
    if (!newMemoryContent.trim()) return;

    try {
      await storeMemory(
        newMemoryContent,
        'knowledge',
        'human_input',
        { created_by: 'hil_interface' }
      );
      setNewMemoryContent('');
      if (searchQuery) {
        await handleSearch();
      }
    } catch (error) {
      console.error('Failed to store memory:', error);
    }
  };

  const getTypeIcon = (type: MemoryEntry['entry_type']) => {
    const typeConfig = memoryTypes.find(t => t.type === type);
    if (!typeConfig) return Database;
    return typeConfig.icon;
  };

  const getTypeColor = (type: MemoryEntry['entry_type']) => {
    const typeConfig = memoryTypes.find(t => t.type === type);
    return typeConfig?.color || 'bg-gray-500';
  };

  const formatImportanceScore = (score: number) => {
    if (score >= 0.8) return { label: 'Critical', color: 'destructive' };
    if (score >= 0.6) return { label: 'High', color: 'default' };
    if (score >= 0.4) return { label: 'Medium', color: 'secondary' };
    return { label: 'Low', color: 'outline' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6" />
            Advanced Memory System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">Search Memory</TabsTrigger>
              <TabsTrigger value="store">Store Memory</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {memoryTypes.map((typeConfig) => {
                  const Icon = typeConfig.icon;
                  return (
                    <Button
                      key={typeConfig.type}
                      variant={selectedType === typeConfig.type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(typeConfig.type)}
                    >
                      <Icon className="w-3 h-3 mr-2" />
                      {typeConfig.label}
                    </Button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {memories.map((memory) => {
                  const Icon = getTypeIcon(memory.entry_type);
                  const importance = formatImportanceScore(memory.importance_score);
                  
                  return (
                    <Card key={memory.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-1 rounded ${getTypeColor(memory.entry_type)} text-white`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <Badge variant="outline">{memory.entry_type}</Badge>
                            <Badge variant={importance.color as any}>
                              {importance.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Accessed {memory.access_count} times
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            {memory.content.length > 200 
                              ? `${memory.content.substring(0, 200)}...`
                              : memory.content
                            }
                          </div>
                          
                          {memory.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {memory.tags.slice(0, 5).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(memory.created_at).toLocaleString()} | 
                            Source: {memory.source}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {memories.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-8 text-muted-foreground">
                    No memories found for "{searchQuery}"
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="store" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Add New Memory</label>
                  <textarea
                    className="w-full mt-2 p-3 border rounded-md min-h-[100px]"
                    placeholder="Enter new knowledge, insight, or information to store..."
                    value={newMemoryContent}
                    onChange={(e) => setNewMemoryContent(e.target.value)}
                  />
                </div>
                
                <Button onClick={handleStoreMemory} disabled={!newMemoryContent.trim()}>
                  <Archive className="w-4 h-4 mr-2" />
                  Store Memory
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analyze" className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {memoryTypes.slice(1).map((typeConfig) => {
                  const Icon = typeConfig.icon;
                  const count = memories.filter(m => m.entry_type === typeConfig.type).length;
                  
                  return (
                    <Card key={typeConfig.type} className="p-4 text-center">
                      <div className={`inline-flex p-3 rounded-full ${typeConfig.color} text-white mb-2`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground">{typeConfig.label}</div>
                    </Card>
                  );
                })}
              </div>
              
              <Card className="p-4">
                <h3 className="font-medium mb-3">Memory Quality Distribution</h3>
                <div className="space-y-2">
                  {['Critical', 'High', 'Medium', 'Low'].map((level) => {
                    const threshold = level === 'Critical' ? 0.8 : level === 'High' ? 0.6 : level === 'Medium' ? 0.4 : 0;
                    const count = memories.filter(m => {
                      const score = m.importance_score;
                      if (level === 'Critical') return score >= 0.8;
                      if (level === 'High') return score >= 0.6 && score < 0.8;
                      if (level === 'Medium') return score >= 0.4 && score < 0.6;
                      return score < 0.4;
                    }).length;
                    
                    return (
                      <div key={level} className="flex justify-between items-center">
                        <span className="text-sm">{level} Importance</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}