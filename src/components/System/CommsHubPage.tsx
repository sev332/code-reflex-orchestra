// Comms Hub — Discord-like messaging with channels, threads, DMs
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Hash, Plus, Send, Search, Settings, Users, Volume2, Video,
  Pin, Star, Smile, Paperclip, AtSign, Bell, BellOff, ChevronDown,
  MessageSquare, Circle, PhoneCall, MoreHorizontal, Edit3, Trash2,
  Crown, Shield, Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  isBot?: boolean;
  reactions?: { emoji: string; count: number; reacted: boolean }[];
  replyTo?: string;
  isPinned?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  category: string;
  unread: number;
  description?: string;
  messages: Message[];
}

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role: 'admin' | 'moderator' | 'member' | 'bot';
}

const mockUsers: User[] = [
  { id: 'u1', name: 'Alex', avatar: 'A', status: 'online', role: 'admin' },
  { id: 'u2', name: 'AIMOS', avatar: '🤖', status: 'online', role: 'bot' },
  { id: 'u3', name: 'Sage', avatar: 'S', status: 'online', role: 'moderator' },
  { id: 'u4', name: 'Nova', avatar: 'N', status: 'idle', role: 'member' },
  { id: 'u5', name: 'Echo', avatar: 'E', status: 'dnd', role: 'member' },
  { id: 'u6', name: 'Verifier', avatar: '✓', status: 'online', role: 'bot' },
  { id: 'u7', name: 'Retriever', avatar: '🔍', status: 'online', role: 'bot' },
  { id: 'u8', name: 'Luna', avatar: 'L', status: 'offline', role: 'member' },
];

const now = new Date();
const mockChannels: Channel[] = [
  {
    id: 'c1', name: 'general', type: 'text', category: 'WORKSPACE', unread: 3,
    description: 'General discussion for the team',
    messages: [
      { id: 'm1', author: 'Alex', avatar: 'A', content: 'Hey everyone! The new Browser OS features are looking great 🎉', timestamp: new Date(now.getTime() - 3600000 * 2) },
      { id: 'm2', author: 'AIMOS', avatar: '🤖', content: 'I\'ve completed the analysis of the new productivity suite. Performance metrics look solid across all 4 apps.', timestamp: new Date(now.getTime() - 3600000), isBot: true },
      { id: 'm3', author: 'Sage', avatar: 'S', content: 'The spreadsheet canvas renderer is surprisingly smooth. Nice work on the formula parser too.', timestamp: new Date(now.getTime() - 1800000) },
      { id: 'm4', author: 'Nova', avatar: 'N', content: 'When are we starting on the 3D Studio? I have some shader ideas I\'d love to test', timestamp: new Date(now.getTime() - 900000) },
      { id: 'm5', author: 'Alex', avatar: 'A', content: '3D Studio is Wave 2 — should be next! @AIMOS can you prep the React Three Fiber setup?', timestamp: new Date(now.getTime() - 300000) },
      { id: 'm6', author: 'AIMOS', avatar: '🤖', content: 'Already on it. I\'ve prepared a scene graph system with transform gizmos, material editor, and 6 GLSL shader presets. Ready for review.', timestamp: new Date(now.getTime() - 60000), isBot: true, reactions: [{ emoji: '🚀', count: 3, reacted: true }, { emoji: '👏', count: 2, reacted: false }] },
    ],
  },
  {
    id: 'c2', name: 'dev-frontend', type: 'text', category: 'DEVELOPMENT', unread: 0,
    description: 'Frontend development discussion',
    messages: [
      { id: 'm7', author: 'Sage', avatar: 'S', content: 'Should we use canvas or DOM for the spreadsheet grid?', timestamp: new Date(now.getTime() - 7200000) },
      { id: 'm8', author: 'AIMOS', avatar: '🤖', content: 'Canvas is recommended for performance with thousands of cells. DOM rendering would cause significant layout thrashing at scale.', timestamp: new Date(now.getTime() - 7100000), isBot: true },
    ],
  },
  {
    id: 'c3', name: 'agent-logs', type: 'text', category: 'AI SYSTEMS', unread: 12,
    description: 'Real-time agent activity logs',
    messages: [
      { id: 'm9', author: 'Verifier', avatar: '✓', content: '[VERIFY] Claim validated: Canvas grid performance > 60fps at 10k cells ✅ Confidence: 0.94', timestamp: new Date(now.getTime() - 120000), isBot: true },
      { id: 'm10', author: 'Retriever', avatar: '🔍', content: '[RETRIEVE] Found 12 relevant memory entries for query "browser OS architecture" (RS avg: 0.87)', timestamp: new Date(now.getTime() - 60000), isBot: true },
    ],
  },
  { id: 'c4', name: 'voice-chat', type: 'voice', category: 'WORKSPACE', unread: 0, messages: [] },
  { id: 'c5', name: 'announcements', type: 'announcement', category: 'WORKSPACE', unread: 1,
    messages: [
      { id: 'm11', author: 'Alex', avatar: 'A', content: '📢 Wave 1 of Browser OS is complete! Spreadsheet, Calendar, Email, and Tasks are now live. Great work team!', timestamp: new Date(now.getTime() - 86400000), isPinned: true, reactions: [{ emoji: '🎉', count: 5, reacted: true }] },
    ],
  },
];

const categories = ['WORKSPACE', 'DEVELOPMENT', 'AI SYSTEMS'];
const statusColors = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-gray-500' };
const roleIcons: Record<string, React.ComponentType<any>> = { admin: Crown, moderator: Shield, bot: Bot };

export function CommsHubPage() {
  const [channels] = useState(mockChannels);
  const [activeChannelId, setActiveChannelId] = useState('c1');
  const [messageInput, setMessageInput] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeChannelId]);

  const sendMessage = useCallback(() => {
    if (!messageInput.trim()) return;
    // In production, this would send via WebSocket/Supabase realtime
    setMessageInput('');
  }, [messageInput]);

  return (
    <div className="h-full flex bg-background/30">
      {/* Channel list */}
      <div className="w-56 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
        {/* Server header */}
        <div className="h-12 px-4 border-b border-border/30 flex items-center justify-between">
          <span className="text-sm font-semibold">LUCID Workspace</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>

        <ScrollArea className="flex-1">
          <div className="py-2">
            {categories.map(cat => (
              <div key={cat} className="mb-2">
                <button className="w-full flex items-center gap-1 px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                  <ChevronDown className="w-3 h-3" />
                  {cat}
                </button>
                {channels.filter(c => c.category === cat).map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={cn(
                      'w-full flex items-center gap-1.5 px-3 py-1 mx-1 rounded-md text-sm transition-colors',
                      activeChannelId === ch.id ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    )}
                  >
                    {ch.type === 'voice' ? <Volume2 className="w-4 h-4 shrink-0" /> :
                     ch.type === 'announcement' ? <Bell className="w-4 h-4 shrink-0" /> :
                     <Hash className="w-4 h-4 shrink-0" />}
                    <span className="truncate flex-1 text-left text-xs">{ch.name}</span>
                    {ch.unread > 0 && (
                      <Badge className="bg-red-500 text-white text-[9px] h-4 px-1.5 border-0">{ch.unread}</Badge>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User bar */}
        <div className="h-12 px-2 border-t border-border/30 flex items-center gap-2 bg-background/40">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">A</AvatarFallback>
            </Avatar>
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background', statusColors.online)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Alex</p>
            <p className="text-[10px] text-muted-foreground">Online</p>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Settings className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Channel header */}
        <div className="h-12 px-4 border-b border-border/30 flex items-center gap-3 shrink-0 bg-background/40">
          <Hash className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-sm">{activeChannel.name}</span>
          {activeChannel.description && (
            <>
              <div className="w-px h-6 bg-border/30" />
              <span className="text-xs text-muted-foreground truncate">{activeChannel.description}</span>
            </>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8"><Pin className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShowMembers(v => !v)} className={cn('w-8 h-8', showMembers && 'text-primary')}>
              <Users className="w-4 h-4" />
            </Button>
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search" className="h-7 text-xs pl-7 bg-muted/30 border-border/30" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {activeChannel.messages.map(msg => (
                <div key={msg.id} className="group flex gap-3 hover:bg-muted/10 rounded-lg px-2 py-1 -mx-2 transition-colors">
                  <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                    <AvatarFallback className={cn(
                      'text-sm',
                      msg.isBot ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'
                    )}>
                      {msg.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-semibold', msg.isBot && 'text-primary')}>{msg.author}</span>
                      {msg.isBot && <Badge className="text-[8px] h-3.5 px-1 bg-primary/20 text-primary border-0">BOT</Badge>}
                      {msg.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <Button variant="ghost" size="icon" className="w-6 h-6"><Smile className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6"><MessageSquare className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6"><MoreHorizontal className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {msg.reactions.map((r, i) => (
                          <button key={i} className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors',
                            r.reacted ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-muted/30 border-border/30 hover:bg-muted/50'
                          )}>
                            <span>{r.emoji}</span>
                            <span>{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members sidebar */}
          {showMembers && (
            <div className="w-56 bg-background/40 border-l border-border/30 shrink-0">
              <ScrollArea className="h-full">
                <div className="p-3">
                  {['online', 'idle', 'dnd', 'offline'].map(status => {
                    const users = mockUsers.filter(u => u.status === status);
                    if (users.length === 0) return null;
                    return (
                      <div key={status} className="mb-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                          {status === 'dnd' ? 'Do Not Disturb' : status} — {users.length}
                        </p>
                        {users.map(user => {
                          const RoleIcon = roleIcons[user.role];
                          return (
                            <div key={user.id} className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-muted/30 cursor-pointer">
                              <div className="relative">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className={cn('text-xs', user.role === 'bot' ? 'bg-primary/20 text-primary' : 'bg-muted')}>
                                    {user.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[user.status])} />
                              </div>
                              <span className="text-xs truncate flex-1">{user.name}</span>
                              {RoleIcon && <RoleIcon className="w-3 h-3 text-muted-foreground shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="px-4 py-3 border-t border-border/20 shrink-0">
          <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
            <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0"><Plus className="w-4 h-4" /></Button>
            <Input
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Message #${activeChannel.name}`}
              className="flex-1 bg-transparent border-none h-7 text-sm"
            />
            <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0"><Paperclip className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0"><Smile className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={sendMessage} className="w-7 h-7 shrink-0" disabled={!messageInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
