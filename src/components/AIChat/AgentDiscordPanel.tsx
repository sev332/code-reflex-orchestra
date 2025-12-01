import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Users, Hash, Clock, Brain, Target, Zap,
  CheckCircle2, AlertCircle, Lightbulb, FileText, Code,
  Network, ChevronRight, ChevronDown, Activity
} from 'lucide-react';
import type { 
  DiscordMessage, DiscordThread, AIMOSAgent, AIMOSMode 
} from '@/lib/aimos-core-types';

interface AgentDiscordPanelProps {
  messages: DiscordMessage[];
  threads: DiscordThread[];
  agents: AIMOSAgent[];
  isStreaming: boolean;
  selectedTimeRange?: { start: string; end: string };
}

export const AgentDiscordPanel: React.FC<AgentDiscordPanelProps> = ({
  messages,
  threads,
  agents,
  isStreaming,
  selectedTimeRange
}) => {
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Group messages by thread for cross-thread view
  const messagesByThread = useMemo(() => {
    const grouped: Record<string, DiscordMessage[]> = {};
    messages.forEach(msg => {
      if (!grouped[msg.thread_id]) grouped[msg.thread_id] = [];
      grouped[msg.thread_id].push(msg);
    });
    return grouped;
  }, [messages]);

  // Time-aligned view data
  const timelineData = useMemo(() => {
    if (selectedThreads.length === 0) return [];
    
    const relevantMessages = messages.filter(m => 
      selectedThreads.includes(m.thread_id)
    );
    
    return relevantMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages, selectedThreads]);

  const getMessageIcon = (type: DiscordMessage['type']) => {
    const icons: Record<string, React.ReactNode> = {
      'THOUGHT': <Brain className="w-4 h-4 text-purple-400" />,
      'DECISION': <CheckCircle2 className="w-4 h-4 text-green-400" />,
      'TASK_PROPOSE': <Target className="w-4 h-4 text-blue-400" />,
      'TASK_ACCEPT': <Zap className="w-4 h-4 text-yellow-400" />,
      'TASK_COMPLETE': <CheckCircle2 className="w-4 h-4 text-green-500" />,
      'TOOL_CALL': <Code className="w-4 h-4 text-cyan-400" />,
      'TOOL_RESULT': <FileText className="w-4 h-4 text-cyan-300" />,
      'SUMMARY': <FileText className="w-4 h-4 text-gray-400" />,
      'ALERT': <AlertCircle className="w-4 h-4 text-red-400" />,
    };
    return icons[type] || <MessageSquare className="w-4 h-4" />;
  };

  const getModeColor = (mode: AIMOSMode) => {
    const colors: Record<AIMOSMode, string> = {
      'GENERAL': 'bg-gray-500/20 text-gray-300',
      'PLANNING': 'bg-blue-500/20 text-blue-300',
      'REASONING': 'bg-purple-500/20 text-purple-300',
      'DEBUGGING': 'bg-red-500/20 text-red-300',
      'EXECUTION': 'bg-green-500/20 text-green-300',
      'REVIEW': 'bg-yellow-500/20 text-yellow-300',
      'LEARNING': 'bg-cyan-500/20 text-cyan-300',
    };
    return colors[mode];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleThread = (threadId: string) => {
    setSelectedThreads(prev => 
      prev.includes(threadId)
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-slate-900/95 via-background to-purple-950/30">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Agent Discord</h3>
              <p className="text-xs text-muted-foreground">
                Multi-agent communication fabric
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {threads.length} Threads
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {messages.length} Messages
            </Badge>
            {isStreaming && (
              <Badge className="bg-green-500/20 text-green-400 animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full grid grid-cols-4 m-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="cross-thread">Cross-Thread</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px]">
          {/* Timeline View */}
          <TabsContent value="timeline" className="p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agent messages yet
              </div>
            ) : (
              messages.map((msg, idx) => (
                <Card 
                  key={msg.id || idx}
                  className={`p-3 transition-all hover:bg-accent/10 ${
                    msg.type === 'ALERT' ? 'border-red-500/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getMessageIcon(msg.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{msg.author_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {msg.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-xs ${getModeColor(msg.mode)}`}>
                          {msg.mode}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {msg.content.length > 300 ? (
                          <>
                            {expandedMessages.has(msg.id) 
                              ? msg.content 
                              : msg.content.substring(0, 300) + '...'}
                            <Button 
                              variant="link" 
                              size="sm"
                              onClick={() => setExpandedMessages(prev => {
                                const next = new Set(prev);
                                if (next.has(msg.id)) next.delete(msg.id);
                                else next.add(msg.id);
                                return next;
                              })}
                              className="h-auto p-0 ml-1"
                            >
                              {expandedMessages.has(msg.id) ? 'Show less' : 'Show more'}
                            </Button>
                          </>
                        ) : msg.content}
                      </p>
                      {msg.links && Object.keys(msg.links).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {msg.links.docs?.map((doc, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc}
                            </Badge>
                          ))}
                          {msg.links.code?.map((code, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Code className="w-3 h-3 mr-1" />
                              {code}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        #{msg.channel} → {msg.thread_id.split('/').pop()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Threads View */}
          <TabsContent value="threads" className="p-4 space-y-2">
            {threads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No threads created yet
              </div>
            ) : (
              threads.map(thread => (
                <Card 
                  key={thread.id}
                  className={`p-3 cursor-pointer transition-all hover:bg-accent/10 ${
                    selectedThreads.includes(thread.id) ? 'border-primary' : ''
                  }`}
                  onClick={() => toggleThread(thread.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {selectedThreads.includes(thread.id) 
                        ? <ChevronDown className="w-4 h-4 text-primary" />
                        : <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{thread.name}</span>
                        <Badge className={getModeColor(thread.mode)}>
                          {thread.mode}
                        </Badge>
                        <Badge variant={thread.status === 'active' ? 'default' : 'secondary'}>
                          {thread.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {thread.workspace}/{thread.channel} • {thread.message_count} messages
                      </div>
                      <div className="flex gap-1 mt-2">
                        {thread.participants.slice(0, 3).map(agentId => {
                          const agent = agents.find(a => a.agent_id === agentId);
                          return (
                            <Badge key={agentId} variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {agent?.name || agentId}
                            </Badge>
                          );
                        })}
                        {thread.participants.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{thread.participants.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedThreads.includes(thread.id) && (
                    <div className="mt-3 pl-7 space-y-2 border-l-2 border-primary/30">
                      {(messagesByThread[thread.id] || []).map((msg, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-muted-foreground">
                            {formatTime(msg.timestamp)}
                          </span>
                          <span className="mx-2 font-medium">
                            {msg.author_name}:
                          </span>
                          <span className="text-foreground/80">
                            {msg.content.substring(0, 100)}
                            {msg.content.length > 100 ? '...' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Agents View */}
          <TabsContent value="agents" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map(agent => (
                <Card 
                  key={agent.agent_id}
                  className={`p-3 ${
                    agent.status === 'WORKING' 
                      ? 'border-blue-500/50 bg-blue-500/5' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      agent.status === 'WORKING'
                        ? 'bg-blue-500/20 animate-pulse'
                        : agent.status === 'ACTIVE'
                        ? 'bg-green-500/20'
                        : 'bg-muted'
                    }`}>
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{agent.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {agent.class} • {agent.domain}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge className={getModeColor(agent.current_mode)}>
                          {agent.current_mode}
                        </Badge>
                        <Badge 
                          variant={agent.status === 'WORKING' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.tasksCompleted} tasks • Priority: {agent.priority}
                      </div>
                      {agent.currentTask && (
                        <div className="text-xs text-primary mt-1 truncate">
                          Current: {agent.currentTask}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Cross-Thread View */}
          <TabsContent value="cross-thread" className="p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Select threads to compare in time-aligned view:
              </p>
              <div className="flex flex-wrap gap-2">
                {threads.map(thread => (
                  <Button
                    key={thread.id}
                    variant={selectedThreads.includes(thread.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleThread(thread.id)}
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {thread.name}
                  </Button>
                ))}
              </div>
            </div>

            {selectedThreads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Select threads above to see cross-thread timeline
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid gap-2" style={{ 
                  gridTemplateColumns: `100px repeat(${selectedThreads.length}, 1fr)` 
                }}>
                  <div className="text-xs font-medium text-muted-foreground">Time</div>
                  {selectedThreads.map(tid => {
                    const thread = threads.find(t => t.id === tid);
                    return (
                      <div key={tid} className="text-xs font-medium truncate">
                        {thread?.name || tid}
                      </div>
                    );
                  })}
                </div>
                
                {timelineData.map((msg, idx) => {
                  const colIndex = selectedThreads.indexOf(msg.thread_id);
                  return (
                    <div 
                      key={idx}
                      className="grid gap-2 py-1 border-t border-border/30"
                      style={{ 
                        gridTemplateColumns: `100px repeat(${selectedThreads.length}, 1fr)` 
                      }}
                    >
                      <div className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </div>
                      {selectedThreads.map((tid, i) => (
                        <div key={tid} className="text-xs">
                          {i === colIndex ? (
                            <div className="p-1 bg-accent/20 rounded">
                              <span className="font-medium">{msg.author_name}:</span>
                              <span className="ml-1 text-muted-foreground">
                                {msg.content.substring(0, 50)}...
                              </span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};
