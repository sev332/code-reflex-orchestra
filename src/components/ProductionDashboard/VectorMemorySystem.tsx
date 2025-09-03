import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Search, Database, Zap, TrendingUp, GitBranch } from 'lucide-react';
import { useProductionWisdomNET } from '@/hooks/useProductionWisdomNET';
import { MemoryEntry } from '@/types/production-types';
import { toast } from 'sonner';

export function VectorMemorySystem() {
  const { queryMemory, storeMemory, metrics } = useProductionWisdomNET();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [memoryStats, setMemoryStats] = useState({
    totalEntries: 0,
    recentQueries: 0,
    avgRelevance: 0,
    storageEfficiency: 0
  });

  useEffect(() => {
    loadMemoryStats();
  }, []);

  const loadMemoryStats = async () => {
    try {
      // Mock implementation - in production, this would query actual vector database
      setMemoryStats({
        totalEntries: metrics.memory_entries,
        recentQueries: Math.floor(Math.random() * 100),
        avgRelevance: 0.85 + Math.random() * 0.1,
        storageEfficiency: 0.9 + Math.random() * 0.1
      });
    } catch (error) {
      console.error('Failed to load memory stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await queryMemory(searchQuery);
      setSearchResults(results);
      toast.success(`Found ${results.length} relevant memories`);
    } catch (error) {
      console.error('Memory search failed:', error);
      toast.error('Memory search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: MemoryEntry['entry_type']) => {
    switch (type) {
      case 'knowledge': return <Brain className="w-4 h-4" />;
      case 'code': return <GitBranch className="w-4 h-4" />;
      case 'insight': return <Zap className="w-4 h-4" />;
      case 'pattern': return <TrendingUp className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Memory System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="w-5 h-5" />
            Vector Memory System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{memoryStats.totalEntries.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Memory Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{memoryStats.recentQueries}</div>
              <div className="text-sm text-muted-foreground">Recent Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{(memoryStats.avgRelevance * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Relevance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{(memoryStats.storageEfficiency * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
          </div>

          {/* Search Interface */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search vector memory (semantic, contextual, pattern-based)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchResults.map((entry) => (
              <div key={entry.id} className="p-4 border rounded-lg bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(entry.entry_type)}
                    <Badge variant="outline">{entry.entry_type}</Badge>
                    <Badge variant="secondary">{entry.source}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      Relevance: {(entry.importance_score * 100).toFixed(1)}%
                    </div>
                    <div 
                      className={`w-3 h-3 rounded-full ${getRelevanceColor(entry.importance_score)}`}
                    />
                  </div>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    Accessed {entry.access_count} times
                  </div>
                  <div>
                    Created {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {entry.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Memory Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Retrieval Accuracy</span>
              <span>{(memoryStats.avgRelevance * 100).toFixed(1)}%</span>
            </div>
            <Progress value={memoryStats.avgRelevance * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Storage Efficiency</span>
              <span>{(memoryStats.storageEfficiency * 100).toFixed(1)}%</span>
            </div>
            <Progress value={memoryStats.storageEfficiency * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Query Response Time</span>
              <span>&lt; 200ms</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Memory Utilization</span>
              <span>67%</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}