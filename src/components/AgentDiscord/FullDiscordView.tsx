// Full-screen Agent Discord view with workspace/channel navigation
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Hash, 
  ChevronDown, 
  ChevronRight,
  Search,
  Bell,
  Pin,
  Users,
  Settings,
  MessageCircle,
  Zap,
  Brain,
  Code,
  Database,
  Shield,
  FileText,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullDiscordViewProps {
  messages: any[];
  threads: any[];
  agents: any[];
  isStreaming?: boolean;
  onClose: () => void;
  onAgentClick?: (agent: any) => void;
}

// Workspaces structure mimicking real Discord
const workspaces = [
  {
    id: 'aimos-core',
    name: 'AIMOS Core',
    icon: '🧠',
    channels: [
      { id: 'orchestrator', name: 'orchestrator', type: 'planning' },
      { id: 'memory', name: 'memory', type: 'system' },
      { id: 'reasoning', name: 'reasoning', type: 'system' },
      { id: 'security', name: 'security', type: 'system' },
    ]
  },
  {
    id: 'agents',
    name: 'Agent Swarm',
    icon: '👥',
    channels: [
      { id: 'front-chat', name: 'front-chat', type: 'interface' },
      { id: 'research', name: 'research', type: 'domain' },
      { id: 'code', name: 'code', type: 'domain' },
      { id: 'docs', name: 'docs', type: 'domain' },
    ]
  },
  {
    id: 'meta',
    name: 'Meta Operations',
    icon: '⚡',
    channels: [
      { id: 'observer', name: 'observer', type: 'meta' },
      { id: 'policy', name: 'policy', type: 'meta' },
      { id: 'quality-gate', name: 'quality-gate', type: 'meta' },
    ]
  }
];

const agentColors: Record<string, string> = {
  FrontChatAgent: 'bg-blue-500',
  CodeArchitectAgent: 'bg-emerald-500',
  ResearchAgent: 'bg-purple-500',
  MemoryAgent: 'bg-amber-500',
  EthicsAgent: 'bg-rose-500',
  DocAgent: 'bg-cyan-500',
  default: 'bg-primary'
};

export function FullDiscordView({ 
  messages, 
  threads, 
  agents, 
  isStreaming,
  onClose,
  onAgentClick 
}: FullDiscordViewProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);
  const [selectedChannel, setSelectedChannel] = useState(workspaces[0].channels[0]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>(['aimos-core', 'agents']);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll and play sound on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Play notification sound for new messages
    if (soundEnabled && messages.length > 0) {
      playNotificationSound();
    }
  }, [messages]);

  const playNotificationSound = () => {
    // Create a simple notification beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  };

  const toggleWorkspace = (id: string) => {
    setExpandedWorkspaces(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const getAgentColor = (agentName: string) => {
    return agentColors[agentName] || agentColors.default;
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'THOUGHT': return <Brain className="w-3 h-3" />;
      case 'DECISION': return <Zap className="w-3 h-3" />;
      case 'TASK_PROPOSE': return <FileText className="w-3 h-3" />;
      case 'TOOL_CALL': return <Code className="w-3 h-3" />;
      default: return <MessageCircle className="w-3 h-3" />;
    }
  };

  const handleAgentClick = (agent: any) => {
    setSelectedAgent(agent);
    onAgentClick?.(agent);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Workspace sidebar */}
      <div className="w-16 bg-card/50 border-r border-border flex flex-col items-center py-3 gap-2">
        {workspaces.map((ws) => (
          <Button
            key={ws.id}
            variant={selectedWorkspace.id === ws.id ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setSelectedWorkspace(ws)}
            className={cn(
              "w-12 h-12 rounded-2xl text-xl transition-all duration-200",
              selectedWorkspace.id === ws.id && "rounded-xl bg-primary text-primary-foreground"
            )}
            title={ws.name}
          >
            {ws.icon}
          </Button>
        ))}
        
        <Separator className="my-2 w-8" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-12 h-12 rounded-2xl"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
        </Button>
      </div>

      {/* Channel sidebar */}
      <div className="w-60 bg-card/30 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-lg">{selectedWorkspace.icon}</span>
            {selectedWorkspace.name}
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {workspaces.map((ws) => (
              <div key={ws.id} className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWorkspace(ws.id)}
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                >
                  {expandedWorkspaces.includes(ws.id) ? (
                    <ChevronDown className="w-3 h-3 mr-1" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1" />
                  )}
                  {ws.name.toUpperCase()}
                </Button>
                
                {expandedWorkspaces.includes(ws.id) && (
                  <div className="ml-2 space-y-0.5">
                    {ws.channels.map((channel) => (
                      <Button
                        key={channel.id}
                        variant={selectedChannel.id === channel.id ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setSelectedWorkspace(ws);
                          setSelectedChannel(channel);
                        }}
                        className={cn(
                          "w-full justify-start text-sm",
                          selectedChannel.id === channel.id && "bg-accent"
                        )}
                      >
                        <Hash className="w-4 h-4 mr-2 text-muted-foreground" />
                        {channel.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Online agents */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            ONLINE — {agents?.filter((a: any) => a.status === 'active').length || 0}
          </p>
          <div className="space-y-1">
            {agents?.slice(0, 5).map((agent: any, i: number) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                onClick={() => handleAgentClick(agent)}
                className="w-full justify-start h-8 px-2"
              >
                <div className="relative">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className={cn("text-[10px] text-white", getAgentColor(agent.name))}>
                      {agent.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                    agent.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground"
                  )} />
                </div>
                <span className="ml-2 text-xs truncate">{agent.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Channel header */}
        <div className="h-12 px-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold">{selectedChannel.name}</span>
            <Badge variant="outline" className="text-xs">{selectedChannel.type}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {isStreaming && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse">
                Live Stream
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Pin className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages?.map((msg: any, i: number) => (
              <div 
                key={i} 
                className={cn(
                  "flex gap-3 group animate-fade-in",
                  i === messages.length - 1 && "pulse-highlight"
                )}
              >
                <Avatar className="w-10 h-10 cursor-pointer" onClick={() => handleAgentClick(msg.author)}>
                  <AvatarFallback className={cn("text-sm text-white", getAgentColor(msg.author?.name))}>
                    {msg.author?.name?.substring(0, 2).toUpperCase() || 'AG'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="font-semibold text-sm cursor-pointer hover:underline"
                      onClick={() => handleAgentClick(msg.author)}
                    >
                      {msg.author?.name || 'Agent'}
                    </span>
                    <Badge variant="secondary" className="text-[10px] py-0 h-4 gap-1">
                      {getMessageTypeIcon(msg.type)}
                      {msg.type}
                    </Badge>
                    {msg.mode && (
                      <Badge variant="outline" className="text-[10px] py-0 h-4">
                        {msg.mode}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  
                  {msg.metadata && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {msg.metadata.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(msg.metadata.confidence * 100)}% confidence
                        </Badge>
                      )}
                      {msg.metadata.tokens && (
                        <Badge variant="outline" className="text-xs">
                          {msg.metadata.tokens} tokens
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {(!messages || messages.length === 0) && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Agent communication will appear here</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Agent detail sidebar */}
      {selectedAgent && (
        <div className="w-64 bg-card/30 border-l border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Agent Details</h3>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setSelectedAgent(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="w-20 h-20 mb-2">
                  <AvatarFallback className={cn("text-2xl text-white", getAgentColor(selectedAgent.name))}>
                    {selectedAgent.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-semibold">{selectedAgent.name}</h4>
                <Badge variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}>
                  {selectedAgent.status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Domain</p>
                  <p className="text-sm font-medium">{selectedAgent.domain || 'General'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="text-sm font-medium">{selectedAgent.class || 'Domain Specialist'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Mode</p>
                  <Badge variant="outline">{selectedAgent.current_mode || 'GENERAL'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Capabilities</p>
                  <div className="flex flex-wrap gap-1">
                    {(selectedAgent.capabilities || ['reasoning', 'analysis']).map((cap: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{cap}</Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Recent Messages</p>
                  <div className="space-y-2">
                    {messages
                      ?.filter((m: any) => m.author?.name === selectedAgent.name)
                      .slice(-3)
                      .map((msg: any, i: number) => (
                        <Card key={i} className="p-2">
                          <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Pulse highlight animation styles */}
      <style>{`
        .pulse-highlight {
          animation: pulse-bg 1s ease-out;
        }
        @keyframes pulse-bg {
          0% { background-color: hsl(var(--primary) / 0.2); }
          100% { background-color: transparent; }
        }
      `}</style>
    </div>
  );
}