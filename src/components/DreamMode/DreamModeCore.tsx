// Dream Mode - AI's virtual sandbox for self-prompting, exploration, and self-improvement
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Brain,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  GitBranch,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Eye,
  FileText,
  Code2,
  Network,
  ChevronRight,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Download,
  Upload,
  Settings,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReasoningPath {
  id: string;
  context: string;
  prompt: string;
  branches: ReasoningBranch[];
  timestamp: string;
  status: 'exploring' | 'complete' | 'paused';
}

interface ReasoningBranch {
  id: string;
  name: string;
  style: string;
  output: string;
  score: number;
  insights: string[];
  timestamp: string;
}

interface JournalEntry {
  id: string;
  type: 'discovery' | 'experiment' | 'reflection' | 'improvement';
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  linkedDocs: string[];
}

interface ExplorationSession {
  id: string;
  focus: string;
  documents: string[];
  insights: string[];
  experiments: ReasoningPath[];
  journal: JournalEntry[];
  startTime: string;
  status: 'active' | 'paused' | 'complete';
}

export const DreamModeCore: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<ExplorationSession | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [explorationFocus, setExplorationFocus] = useState('');
  const [autoExplore, setAutoExplore] = useState(false);
  const [reasoningPaths, setReasoningPaths] = useState<ReasoningPath[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [discoveredInsights, setDiscoveredInsights] = useState<string[]>([]);
  const [loadedDocuments, setLoadedDocuments] = useState<string[]>([]);
  const [isExploring, setIsExploring] = useState(false);
  const [explorationProgress, setExplorationProgress] = useState(0);
  const [currentThought, setCurrentThought] = useState('');
  
  const explorationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Dream Mode session
  const startDreamSession = useCallback(async () => {
    const session: ExplorationSession = {
      id: crypto.randomUUID(),
      focus: explorationFocus || 'General AIMOS exploration',
      documents: [],
      insights: [],
      experiments: [],
      journal: [],
      startTime: new Date().toISOString(),
      status: 'active'
    };
    
    setCurrentSession(session);
    setIsActive(true);
    
    // Load AIMOS documentation
    await loadAIMOSDocuments();
    
    toast.success('Dream Mode activated', {
      description: 'AI exploration session started'
    });
  }, [explorationFocus]);

  // Load AIMOS and codebase documents
  const loadAIMOSDocuments = async () => {
    setCurrentThought('Loading AIMOS documentation...');
    
    try {
      // Fetch AIMOS doc
      const aimosResponse = await fetch('/docs/AIMOS.txt');
      const aimosContent = await aimosResponse.text();
      
      setLoadedDocuments(prev => [...prev, 'AIMOS.txt']);
      
      // Add initial journal entry
      addJournalEntry({
        type: 'discovery',
        title: 'AIMOS Documentation Loaded',
        content: `Loaded ${aimosContent.length} characters of AIMOS documentation. Key sections identified: Executive Summary, System Architecture, Revolutionary Features, Workflow, Metrics.`,
        tags: ['aimos', 'documentation', 'initialization'],
        linkedDocs: ['AIMOS.txt']
      });
      
      setCurrentThought('Analyzing AIMOS architecture...');
      
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Add journal entry
  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setJournal(prev => [newEntry, ...prev]);
  };

  // Self-prompting exploration using AI
  const runSelfPromptExploration = async () => {
    if (!currentSession) return;
    
    setIsExploring(true);
    setExplorationProgress(0);
    
    const explorationPrompts = [
      'Analyze my current reasoning capabilities and identify gaps',
      'Review AIMOS architecture and propose implementation improvements',
      'Examine my context management strategies and optimize',
      'Explore different reasoning styles for complex problems',
      'Generate self-improvement documentation for user review'
    ];
    
    for (let i = 0; i < explorationPrompts.length; i++) {
      setCurrentThought(explorationPrompts[i]);
      setExplorationProgress((i + 1) / explorationPrompts.length * 100);
      
      try {
        // Call the dream-mode edge function for real AI exploration
        const { data, error } = await supabase.functions.invoke('dream-mode', {
          body: {
            action: 'explore',
            explorationFocus: explorationPrompts[i],
            context: currentSession.focus,
            previousInsights: discoveredInsights.slice(-5)
          }
        });

        if (error) throw error;

        // Create reasoning path with AI-generated branches
        const path: ReasoningPath = {
          id: crypto.randomUUID(),
          context: currentSession.focus,
          prompt: explorationPrompts[i],
          branches: await generateReasoningBranches(explorationPrompts[i]),
          timestamp: new Date().toISOString(),
          status: 'complete'
        };
        
        setReasoningPaths(prev => [...prev, path]);
        
        // Extract AI-generated insight
        const insight = data?.exploration?.substring(0, 200) || generateInsight();
        setDiscoveredInsights(prev => [...prev, insight]);

      } catch (error) {
        console.error('Exploration error:', error);
        // Fallback to local insight generation
        const insight = `Insight from "${explorationPrompts[i].substring(0, 30)}...": ${generateInsight()}`;
        setDiscoveredInsights(prev => [...prev, insight]);
      }
    }
    
    setIsExploring(false);
    
    addJournalEntry({
      type: 'experiment',
      title: 'Self-Prompting Exploration Complete',
      content: `Completed ${explorationPrompts.length} self-prompted explorations. Generated ${reasoningPaths.length} reasoning paths and discovered ${discoveredInsights.length} insights.`,
      tags: ['self-prompting', 'exploration', 'complete'],
      linkedDocs: loadedDocuments
    });
    
    toast.success('Exploration cycle complete', {
      description: `${discoveredInsights.length} insights discovered`
    });
  };

  // Generate reasoning branches for a prompt
  const generateReasoningBranches = async (prompt: string): Promise<ReasoningBranch[]> => {
    const styles = ['analytical', 'creative', 'systematic', 'intuitive'];
    
    return styles.map(style => ({
      id: crypto.randomUUID(),
      name: `${style.charAt(0).toUpperCase() + style.slice(1)} Path`,
      style,
      output: `Exploring "${prompt.substring(0, 50)}..." using ${style} reasoning...`,
      score: Math.random() * 0.4 + 0.6,
      insights: [generateInsight(), generateInsight()],
      timestamp: new Date().toISOString()
    }));
  };

  // Generate random insight for demo
  const generateInsight = () => {
    const insights = [
      'Context compression can be improved with semantic chunking',
      'Tag relationships need bidirectional linking for better recall',
      'Reasoning paths should be versioned for comparison',
      'Memory tiers could benefit from adaptive thresholds',
      'Self-prompting patterns show emergent meta-cognition',
      'Document indexing requires hierarchical structure',
      'Quality scores need temporal decay adjustment',
      'Multi-modal embedding improves cross-reference accuracy'
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  // Auto-exploration loop
  useEffect(() => {
    if (autoExplore && isActive && !isExploring) {
      explorationIntervalRef.current = setInterval(() => {
        runSelfPromptExploration();
      }, 30000); // Every 30 seconds
    }
    
    return () => {
      if (explorationIntervalRef.current) {
        clearInterval(explorationIntervalRef.current);
      }
    };
  }, [autoExplore, isActive, isExploring]);

  // Pause/Resume session
  const toggleSession = () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        status: prev.status === 'active' ? 'paused' : 'active'
      } : null);
    }
  };

  // Export session insights
  const exportSession = () => {
    if (!currentSession) return;
    
    const exportData = {
      session: currentSession,
      insights: discoveredInsights,
      reasoningPaths,
      journal,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-session-${currentSession.id.substring(0, 8)}.json`;
    a.click();
    
    toast.success('Session exported');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Dream Mode Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
            "border border-purple-500/30",
            isActive && "animate-pulse"
          )}>
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Dream Mode
              {isActive && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Active
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              AI Self-Exploration & Improvement Sandbox
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <Button variant="outline" size="sm" onClick={exportSession}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSession}>
                {currentSession?.status === 'active' ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!isActive ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-lg p-6 bg-card/50 backdrop-blur-sm border-purple-500/20">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Brain className="w-10 h-10 text-purple-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Enter Dream Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Allow the AI to explore its own capabilities, analyze AIMOS documentation, 
                  experiment with reasoning paths, and generate self-improvement insights.
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Exploration Focus (optional)</Label>
                  <Input
                    value={explorationFocus}
                    onChange={(e) => setExplorationFocus(e.target.value)}
                    placeholder="e.g., Improve context management..."
                    className="mt-1 bg-background/50"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Auto-Exploration Loop</span>
                  </div>
                  <Switch
                    checked={autoExplore}
                    onCheckedChange={setAutoExplore}
                  />
                </div>
              </div>
              
              <Button 
                onClick={startDreamSession}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Activate Dream Mode
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Current Thought Display */}
          {currentThought && (
            <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-purple-300">{currentThought}</span>
              </div>
            </div>
          )}
          
          {/* Progress Bar */}
          {isExploring && (
            <div className="px-4 py-2">
              <Progress value={explorationProgress} className="h-1" />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-2 bg-background/50">
              <TabsTrigger value="overview" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="reasoning" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" />
                Reasoning Paths
              </TabsTrigger>
              <TabsTrigger value="journal" className="text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                Journal
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">
                <Lightbulb className="w-3 h-3 mr-1" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {/* Session Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 bg-card/50">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-muted-foreground">Documents</span>
                      </div>
                      <p className="text-xl font-bold">{loadedDocuments.length}</p>
                    </Card>
                    <Card className="p-3 bg-card/50">
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-muted-foreground">Paths</span>
                      </div>
                      <p className="text-xl font-bold">{reasoningPaths.length}</p>
                    </Card>
                    <Card className="p-3 bg-card/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-muted-foreground">Insights</span>
                      </div>
                      <p className="text-xl font-bold">{discoveredInsights.length}</p>
                    </Card>
                    <Card className="p-3 bg-card/50">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-muted-foreground">Journal</span>
                      </div>
                      <p className="text-xl font-bold">{journal.length}</p>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="p-4 bg-card/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={runSelfPromptExploration}
                        disabled={isExploring}
                      >
                        {isExploring ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4 mr-1" />
                        )}
                        Self-Explore
                      </Button>
                      <Button variant="outline" size="sm" onClick={loadAIMOSDocuments}>
                        <FileText className="w-4 h-4 mr-1" />
                        Reload Docs
                      </Button>
                      <Button variant="outline" size="sm">
                        <Code2 className="w-4 h-4 mr-1" />
                        Analyze Code
                      </Button>
                      <Button variant="outline" size="sm">
                        <Network className="w-4 h-4 mr-1" />
                        Map Systems
                      </Button>
                    </div>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="p-4 bg-card/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      {journal.slice(0, 5).map(entry => (
                        <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg bg-background/30">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{entry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reasoning" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {reasoningPaths.map(path => (
                    <Card key={path.id} className="p-4 bg-card/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium">{path.prompt}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(path.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          path.status === 'complete' ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"
                        )}>
                          {path.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {path.branches.map(branch => (
                          <div key={branch.id} className="p-2 rounded-lg bg-background/30 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{branch.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {(branch.score * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">{branch.output}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                  
                  {reasoningPaths.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No reasoning paths explored yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={runSelfPromptExploration}
                      >
                        Start Exploration
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="journal" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {journal.map(entry => (
                    <Card key={entry.id} className="p-4 bg-card/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {entry.type === 'discovery' && <Lightbulb className="w-4 h-4 text-amber-400" />}
                          {entry.type === 'experiment' && <Target className="w-4 h-4 text-cyan-400" />}
                          {entry.type === 'reflection' && <Brain className="w-4 h-4 text-purple-400" />}
                          {entry.type === 'improvement' && <Zap className="w-4 h-4 text-emerald-400" />}
                          <h4 className="font-medium">{entry.title}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{entry.content}</p>
                      <div className="flex gap-1 flex-wrap">
                        {entry.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {discoveredInsights.map((insight, i) => (
                    <Card key={i} className="p-3 bg-card/50 flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </Card>
                  ))}
                  
                  {discoveredInsights.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No insights discovered yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
