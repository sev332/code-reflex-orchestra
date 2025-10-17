// 🔗 CONNECT: AI-MOS → Context Analysis & Audit System
// 🧩 INTENT: Interactive panel for viewing, analyzing, and editing AI context with AI-MOS integration
// ✅ SPEC: User can see AI context, audit it, discuss with AI, and edit/adjust context

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Database,
  Edit,
  Save,
  X,
  Check,
  AlertCircle,
  Activity,
  Clock,
  MemoryStick,
  Zap,
  Search,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useAIMOS } from '@/hooks/useAIMOS';
import { AIMOSMemory } from '@/lib/ai-mos-core';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContextAnalysisPanelProps {
  className?: string;
}

export const ContextAnalysisPanel: React.FC<ContextAnalysisPanelProps> = ({ className }) => {
  const {
    isThinking,
    currentMode,
    memoryStats,
    think,
    storeMemory,
    retrieveMemories,
    compressMemories,
    buildHierarchy,
    updateMemoryStats
  } = useAIMOS();

  const [memories, setMemories] = useState<AIMOSMemory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<AIMOSMemory | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasoningPrompt, setReasoningPrompt] = useState('');
  const [reasoningResult, setReasoningResult] = useState<any>(null);
  const [hierarchy, setHierarchy] = useState<any>(null);

  useEffect(() => {
    loadMemories();
    updateMemoryStats();
  }, []);

  const loadMemories = async () => {
    const allMemories = await retrieveMemories({ limit: 100 });
    setMemories(allMemories);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMemories();
      return;
    }

    const filtered = await retrieveMemories({
      tags: searchQuery.split(' ').filter(t => t.length > 2),
      minImportance: 3,
      limit: 50
    });
    setMemories(filtered);
  };

  const handleEditMemory = (memory: AIMOSMemory) => {
    setSelectedMemory(memory);
    setEditingContent(memory.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMemory) return;

    try {
      // Create new memory with updated content
      await storeMemory(editingContent, {
        type: selectedMemory.memoryType,
        importance: selectedMemory.importance,
        tags: selectedMemory.contextTags
      });

      toast.success('Memory updated successfully');
      setIsEditing(false);
      setSelectedMemory(null);
      loadMemories();
    } catch (error: any) {
      toast.error('Failed to update memory');
    }
  };

  const handleReasonAboutContext = async () => {
    if (!reasoningPrompt.trim()) {
      toast.error('Please enter a reasoning prompt');
      return;
    }

    const result = await think(reasoningPrompt, {
      mode: 'metacognitive',
      depth: 8,
      chainLength: 5
    });

    if (result) {
      setReasoningResult(result);
      
      // Store the reasoning as a new memory
      await storeMemory(
        JSON.stringify({ prompt: reasoningPrompt, result }),
        {
          type: 'meta',
          importance: 8,
          tags: ['ai-reasoning', 'context-analysis', 'metacognition']
        }
      );
    }
  };

  const handleBuildHierarchy = async () => {
    const h = await buildHierarchy();
    if (h) {
      setHierarchy(h);
      toast.success('Memory hierarchy built!');
    }
  };

  const getMemoryTypeColor = (type: AIMOSMemory['memoryType']) => {
    const colors = {
      episodic: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      semantic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      procedural: 'bg-green-500/20 text-green-300 border-green-500/30',
      working: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      meta: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="p-6 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Context Analysis
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-MOS Memory System - View, Audit & Edit AI Context
            </p>
          </div>
          <Button
            onClick={loadMemories}
            variant="outline"
            size="sm"
            className="neural-glow"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Memory Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-card/80 border-primary/20">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Memories</p>
                <p className="text-lg font-bold">{memoryStats.totalMemories}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-card/80 border-primary/20">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Hierarchy Levels</p>
                <p className="text-lg font-bold">{memoryStats.hierarchyLevels}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-card/80 border-primary/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Last Compression</p>
                <p className="text-xs font-medium">
                  {memoryStats.lastCompression 
                    ? new Date(memoryStats.lastCompression).toLocaleTimeString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="memories" className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4">
          <TabsTrigger value="memories">
            <MemoryStick className="w-4 h-4 mr-2" />
            Memories
          </TabsTrigger>
          <TabsTrigger value="reasoning">
            <Brain className="w-4 h-4 mr-2" />
            AI Reasoning
          </TabsTrigger>
          <TabsTrigger value="hierarchy">
            <Activity className="w-4 h-4 mr-2" />
            Hierarchy
          </TabsTrigger>
          <TabsTrigger value="audit">
            <AlertCircle className="w-4 h-4 mr-2" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memories" className="flex-1 flex flex-col p-6 pt-2">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search memories by tags or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Memory List */}
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {memories.map((memory) => (
                <Card 
                  key={memory.id} 
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:border-primary/50",
                    selectedMemory?.id === memory.id && "border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => setSelectedMemory(memory)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={cn("text-xs", getMemoryTypeColor(memory.memoryType))}>
                      {memory.memoryType}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Importance: {memory.importance}/10
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMemory(memory);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-2 line-clamp-3">{memory.content}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(memory.contextTags) && memory.contextTags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>Access: {memory.accessPattern.accessCount}x</span>
                    <span>Level: {memory.spatiotemporalContext.hierarchyLevel}</span>
                    <span>{memory.validationStatus}</span>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button onClick={compressMemories} variant="outline" className="flex-1">
              <Zap className="w-4 h-4 mr-2" />
              Compress Memories
            </Button>
            <Button onClick={handleBuildHierarchy} variant="outline" className="flex-1">
              <Activity className="w-4 h-4 mr-2" />
              Build Hierarchy
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="reasoning" className="flex-1 flex flex-col p-6 pt-2">
          <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Discuss AI Context with AI-MOS
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Ask the AI to reason about its own context, analyze memory patterns, or suggest improvements.
            </p>
            <Textarea
              placeholder="e.g., 'Analyze the current context and identify gaps in knowledge' or 'What are the most important memories for reasoning about quantum physics?'"
              value={reasoningPrompt}
              onChange={(e) => setReasoningPrompt(e.target.value)}
              className="mb-2"
              rows={3}
            />
            <Button 
              onClick={handleReasonAboutContext} 
              disabled={isThinking}
              className="w-full"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isThinking ? `AI-MOS ${currentMode} mode...` : 'Reason About Context'}
            </Button>
          </Card>

          {reasoningResult && (
            <ScrollArea className="flex-1">
              <Card className="p-4 bg-card/80">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  AI-MOS Reasoning Result
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Badge className="mb-2">Confidence: {(reasoningResult.confidence * 100).toFixed(0)}%</Badge>
                    <p className="text-sm">{reasoningResult.conclusion}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Reasoning Chain ({Array.isArray(reasoningResult.reasoning) ? reasoningResult.reasoning.length : 0} steps):
                    </p>
                    <div className="space-y-2">
                      {Array.isArray(reasoningResult.reasoning) && reasoningResult.reasoning.map((step: any, idx: number) => (
                        <Card key={idx} className="p-3 bg-background/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Step {step.step}</Badge>
                            <Badge className="text-xs">{step.mode}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              Confidence: {(step.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-xs">{step.output}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Memories Used: {Array.isArray(reasoningResult.memoriesUsed) ? reasoningResult.memoriesUsed.length : 0}
                    </p>
                  </div>
                </div>
              </Card>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="hierarchy" className="flex-1 p-6 pt-2">
          <ScrollArea className="h-full">
            {hierarchy ? (
              <div className="space-y-4">
                {Object.entries(hierarchy).map(([level, mems]: [string, any]) => (
                  <Card key={level} className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Level {level} - {Array.isArray(mems) ? mems.length : 0} memories
                    </h3>
                    <div className="space-y-2">
                      {Array.isArray(mems) && mems.slice(0, 5).map((mem: AIMOSMemory) => (
                        <div key={mem.id} className="p-2 bg-background rounded text-xs">
                          <Badge className={cn("mb-1", getMemoryTypeColor(mem.memoryType))}>
                            {mem.memoryType}
                          </Badge>
                          <p className="line-clamp-2">{mem.content}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No hierarchy built yet</p>
                <Button onClick={handleBuildHierarchy} className="mt-4">
                  Build Memory Hierarchy
                </Button>
              </Card>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="audit" className="flex-1 p-6 pt-2">
          <ScrollArea className="h-full">
            <Card className="p-4 bg-card/80 mb-4">
              <h3 className="font-semibold mb-2">Context Audit Trail</h3>
              <p className="text-xs text-muted-foreground mb-4">
                All context modifications and AI reasoning sessions are logged here for full transparency.
              </p>
              
              <div className="space-y-2">
                {memories.filter(m => m.memoryType === 'meta').map((mem) => (
                  <div key={mem.id} className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {new Date(mem.spatiotemporalContext.timestamp).toLocaleString()}
                      </Badge>
                      <Badge className="text-xs">Importance: {mem.importance}</Badge>
                    </div>
                    <p className="text-xs line-clamp-3">{mem.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {isEditing && selectedMemory && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-6 flex flex-col z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Memory
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="flex-1 mb-4"
            placeholder="Edit memory content..."
          />

          <div className="flex gap-2">
            <Button onClick={handleSaveEdit} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
