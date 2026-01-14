// Dream Session Browser - Review past exploration sessions
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Calendar,
  Lightbulb,
  BookOpen,
  GitBranch,
  Clock,
  TrendingUp,
  Search,
  ChevronRight,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DreamSession {
  id: string;
  focus: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_explorations: number;
  total_insights: number;
  documents: string[];
  metadata: Record<string, any>;
}

interface SessionInsight {
  id: string;
  content: string;
  insight_type: string;
  confidence: number;
  frequency: number;
  reasoning_style: string | null;
  tags: string[];
  created_at: string;
}

interface SessionJournalEntry {
  id: string;
  title: string;
  content: string;
  entry_type: string;
  tags: string[];
  created_at: string;
}

interface DreamSessionBrowserProps {
  onSessionSelect?: (sessionId: string) => void;
  onClose?: () => void;
}

export const DreamSessionBrowser: React.FC<DreamSessionBrowserProps> = ({
  onSessionSelect,
  onClose
}) => {
  const [sessions, setSessions] = useState<DreamSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DreamSession | null>(null);
  const [sessionInsights, setSessionInsights] = useState<SessionInsight[]>([]);
  const [sessionJournal, setSessionJournal] = useState<SessionJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('insights');

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dream_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSessions((data || []) as DreamSession[]);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch session details
  const fetchSessionDetails = useCallback(async (sessionId: string) => {
    try {
      const [insightsRes, journalRes] = await Promise.all([
        supabase
          .from('dream_insights')
          .select('*')
          .eq('session_id', sessionId)
          .order('confidence', { ascending: false }),
        supabase
          .from('dream_journal')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
      ]);

      if (insightsRes.data) setSessionInsights(insightsRes.data as SessionInsight[]);
      if (journalRes.data) setSessionJournal(journalRes.data as SessionJournalEntry[]);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    }
  }, []);

  // Handle session selection
  const handleSelectSession = (session: DreamSession) => {
    setSelectedSession(session);
    fetchSessionDetails(session.id);
    onSessionSelect?.(session.id);
  };

  // Filter sessions by search term
  const filteredSessions = sessions.filter(session =>
    session.focus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    totalInsights: sessions.reduce((sum, s) => sum + (s.total_insights || 0), 0),
    totalExplorations: sessions.reduce((sum, s) => sum + (s.total_explorations || 0), 0)
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDuration = (startedAt: string, endedAt: string | null) => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'discovery': return <Lightbulb className="w-4 h-4 text-cyan-400" />;
      case 'experiment': return <GitBranch className="w-4 h-4 text-purple-400" />;
      case 'reflection': return <Eye className="w-4 h-4 text-amber-400" />;
      case 'improvement': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'loop_break': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <BookOpen className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold">Dream Session Browser</h2>
            <p className="text-xs text-muted-foreground">
              Review past AI explorations & insights
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchSessions}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-card/30 border-b border-border/50">
        <div className="text-center">
          <p className="text-lg font-bold text-purple-400">{stats.totalSessions}</p>
          <p className="text-[10px] text-muted-foreground">Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-400">{stats.activeSessions}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-400">{stats.totalInsights}</p>
          <p className="text-[10px] text-muted-foreground">Insights</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-cyan-400">{stats.totalExplorations}</p>
          <p className="text-[10px] text-muted-foreground">Explorations</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions List */}
        <div className="w-1/3 border-r border-border/50 flex flex-col">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sessions..."
                className="pl-8 h-8 text-sm bg-background/50"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No sessions found
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:bg-accent/50",
                      selectedSession?.id === session.id && "bg-accent border-purple-500/50"
                    )}
                    onClick={() => handleSelectSession(session)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.focus}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] py-0",
                              session.status === 'active' && "border-emerald-500/50 text-emerald-400",
                              session.status === 'complete' && "border-cyan-500/50 text-cyan-400",
                              session.status === 'paused' && "border-amber-500/50 text-amber-400"
                            )}
                          >
                            {session.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.started_at, session.ended_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    
                    <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        {session.total_insights || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-purple-400" />
                        {session.total_explorations || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.started_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Session Details */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Session Header */}
              <div className="p-4 border-b border-border/50 bg-card/30">
                <h3 className="font-medium">{selectedSession.focus}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {new Date(selectedSession.started_at).toLocaleString()}
                  </Badge>
                  {selectedSession.ended_at && (
                    <span className="text-xs text-muted-foreground">
                      → {new Date(selectedSession.ended_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-2 bg-background/50">
                  <TabsTrigger value="insights" className="text-xs">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Insights ({sessionInsights.length})
                  </TabsTrigger>
                  <TabsTrigger value="journal" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Journal ({sessionJournal.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="flex-1 overflow-hidden m-0 p-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {sessionInsights.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No insights discovered in this session
                        </p>
                      ) : (
                        sessionInsights.map((insight) => (
                          <Card key={insight.id} className="p-3 bg-card/50 border-amber-500/20">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm">{insight.content}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {insight.insight_type}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                                    {((insight.confidence || 0) * 100).toFixed(0)}% confident
                                  </Badge>
                                  {insight.reasoning_style && (
                                    <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                                      {insight.reasoning_style}
                                    </Badge>
                                  )}
                                  {insight.frequency > 1 && (
                                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                                      ×{insight.frequency}
                                    </Badge>
                                  )}
                                </div>
                                {insight.tags && insight.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {insight.tags.map((tag, i) => (
                                      <span key={i} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="journal" className="flex-1 overflow-hidden m-0 p-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {sessionJournal.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No journal entries in this session
                        </p>
                      ) : (
                        sessionJournal.map((entry) => (
                          <Card key={entry.id} className="p-3 bg-card/50">
                            <div className="flex items-start gap-2">
                              {getEntryTypeIcon(entry.entry_type)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">{entry.title}</h4>
                                  <Badge variant="outline" className="text-[10px]">
                                    {entry.entry_type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{entry.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(entry.created_at).toLocaleTimeString()}
                                  </span>
                                  {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {entry.tags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a session to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamSessionBrowser;
