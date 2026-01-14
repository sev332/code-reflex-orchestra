// Dream Mode - AI's virtual sandbox for self-prompting, exploration, and self-improvement
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Brain,
  Sparkles,
  Play,
  Pause,
  GitBranch,
  BookOpen,
  Lightbulb,
  Eye,
  FileText,
  Network,
  Download,
  Loader2,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDreamMode } from '@/hooks/useDreamMode';
import { NeuralVisualization } from './NeuralVisualization';
import { MultiPathComparison } from './MultiPathComparison';

export const DreamModeCore: React.FC = () => {
const {
    currentSession,
    isExploring,
    currentThought,
    explorationProgress,
    insights,
    reasoningPaths,
    journal,
    loopDetected,
    loopCount,
    startSession,
    endSession,
    explore
  } = useDreamMode();
  
  const isActive = !!currentSession;
  const session = currentSession;

  const [activeTab, setActiveTab] = useState('overview');
  const [explorationFocus, setExplorationFocus] = useState('');
  const [autoExplore, setAutoExplore] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);

  // Start Dream Session
  const handleStartSession = useCallback(async () => {
    await startSession(explorationFocus || 'General AIMOS exploration');
    toast.success('Dream Mode activated', {
      description: 'AI exploration session started'
    });
  }, [explorationFocus, startSession]);

  // Export session data
  const handleExport = () => {
    const data = { session, insights, reasoningPaths, journal, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-session-${session?.id?.substring(0, 8) || 'export'}.json`;
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
              {loopDetected && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Loop Detected ({loopCount})
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
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={endSession}>
                {session?.status === 'active' ? (
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
                    <RotateCcw className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Auto-Exploration Loop</span>
                  </div>
                  <Switch
                    checked={autoExplore}
                    onCheckedChange={setAutoExplore}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleStartSession}
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
              <TabsTrigger value="neural" className="text-xs">
                <Network className="w-3 h-3 mr-1" />
                Neural View
              </TabsTrigger>
              <TabsTrigger value="reasoning" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" />
                Reasoning
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card className="p-3 bg-card/50">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-muted-foreground">Documents</span>
                      </div>
                      <p className="text-xl font-bold">{session?.documents?.length || 0}</p>
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
                      <p className="text-xl font-bold">{insights.length}</p>
                    </Card>
                    <Card className="p-3 bg-card/50">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-muted-foreground">Journal</span>
                      </div>
                      <p className="text-xl font-bold">{journal.length}</p>
                    </Card>
                  </div>

                  {/* Loop Detection Status */}
                  {loopDetected && (
                    <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-300">Loop Pattern Detected</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            The system detected repetitive exploration patterns. 
                            Applying boredom mechanic to introduce exploration diversity.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}


                  {/* Quick Actions */}
                  <Card className="p-4 bg-card/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      Exploration Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => explore('Self-directed exploration')}
                        disabled={isExploring}
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        Run Exploration
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowVisualization(!showVisualization)}
                      >
                        <Network className="w-4 h-4 mr-1" />
                        {showVisualization ? 'Hide' : 'Show'} Neural View
                      </Button>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="neural" className="flex-1 overflow-hidden m-0 p-4">
              <div className="h-full rounded-lg overflow-hidden border border-purple-500/20">
                <NeuralVisualization
                  isActive={isExploring}
                  currentThought={currentThought}
                  explorationProgress={explorationProgress}
                  loopDetected={loopDetected}
                />
              </div>
            </TabsContent>

            <TabsContent value="reasoning" className="flex-1 overflow-hidden m-0 p-4">
              <MultiPathComparison
                paths={reasoningPaths}
                onSelectPath={(pathId) => console.log('Selected path:', pathId)}
              />
            </TabsContent>

            <TabsContent value="journal" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {journal.length === 0 ? (
                    <Card className="p-4 bg-card/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Journal entries will appear as the AI explores and learns
                      </p>
                    </Card>
                  ) : (
                    journal.map((entry) => (
                      <Card key={entry.id} className="p-4 bg-card/50">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            entry.entry_type === 'discovery' && "bg-cyan-500/20",
                            entry.entry_type === 'experiment' && "bg-purple-500/20",
                            entry.entry_type === 'reflection' && "bg-amber-500/20",
                            entry.entry_type === 'improvement' && "bg-emerald-500/20"
                          )}>
                            {entry.entry_type === 'discovery' && <Lightbulb className="w-4 h-4 text-cyan-400" />}
                            {entry.entry_type === 'experiment' && <GitBranch className="w-4 h-4 text-purple-400" />}
                            {entry.entry_type === 'reflection' && <Eye className="w-4 h-4 text-amber-400" />}
                            {entry.entry_type === 'improvement' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{entry.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{entry.content}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entry.tags?.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {insights.length === 0 ? (
                    <Card className="p-4 bg-card/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Insights will be discovered as exploration progresses
                      </p>
                    </Card>
                  ) : (
                    insights.map((insight) => (
                      <Card key={insight.id} className="p-3 bg-card/50 border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">{insight.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px]">
                                {insight.insight_type}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {((insight.confidence || 0) * 100).toFixed(0)}% confidence
                              </Badge>
                              {insight.frequency && insight.frequency > 1 && (
                                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                                  ×{insight.frequency} occurrences
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
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
