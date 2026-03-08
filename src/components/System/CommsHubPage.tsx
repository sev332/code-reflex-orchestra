// Comms Hub — Slack/Discord-grade messaging with channels, threads, DMs, reactions, typing indicators
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Hash, Plus, Send, Search, Settings, Users, Volume2,
  Pin, Star, Smile, Paperclip, AtSign, Bell, ChevronDown,
  MessageSquare, PhoneCall, MoreHorizontal, Edit3, Trash2,
  Crown, Shield, Bot, X, Reply, Bookmark, Check, CheckCheck,
  ArrowLeft, Image, Code2, Link2, ThumbsUp, Heart, Laugh,
  Zap, AlertCircle, Clock, Headphones, Video, Mic, MicOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────
interface Reaction { emoji: string; count: number; reacted: boolean; users: string[] }

interface Message {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  content: string;
  timestamp: Date;
  isBot?: boolean;
  reactions: Reaction[];
  replyTo?: { id: string; author: string; preview: string };
  isPinned?: boolean;
  isEdited?: boolean;
  attachments?: { type: 'image' | 'file' | 'code'; name: string; size?: string }[];
  threadCount?: number;
  threadLastReply?: Date;
  readBy?: string[];
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'thread';
  category: string;
  unread: number;
  mentions?: number;
  description?: string;
  messages: Message[];
  topic?: string;
  isPrivate?: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role: 'admin' | 'moderator' | 'member' | 'bot';
  customStatus?: string;
}

// ─── Mock Data ─────────────────────────────
const now = new Date();
const ts = (m: number) => new Date(now.getTime() - m * 60000);

const mockUsers: User[] = [
  { id: 'u1', name: 'Alex', avatar: 'A', status: 'online', role: 'admin', customStatus: '🚀 Building the future' },
  { id: 'u2', name: 'AIMOS', avatar: '🤖', status: 'online', role: 'bot', customStatus: 'Always thinking' },
  { id: 'u3', name: 'Sage', avatar: 'S', status: 'online', role: 'moderator', customStatus: '☕ Coding' },
  { id: 'u4', name: 'Nova', avatar: 'N', status: 'idle', role: 'member' },
  { id: 'u5', name: 'Echo', avatar: 'E', status: 'dnd', role: 'member', customStatus: '🎧 In meeting' },
  { id: 'u6', name: 'Verifier', avatar: '✓', status: 'online', role: 'bot' },
  { id: 'u7', name: 'Retriever', avatar: '🔍', status: 'online', role: 'bot' },
  { id: 'u8', name: 'Luna', avatar: 'L', status: 'offline', role: 'member' },
  { id: 'u9', name: 'Atlas', avatar: 'AT', status: 'online', role: 'member', customStatus: '📊 Analyzing data' },
  { id: 'u10', name: 'Orbit', avatar: 'O', status: 'idle', role: 'member' },
];

const mockChannels: Channel[] = [
  {
    id: 'c1', name: 'general', type: 'text', category: 'WORKSPACE', unread: 3, mentions: 1,
    description: 'General discussion for the team',
    topic: 'Wave 4 of Browser OS development — Ship everything!',
    messages: [
      { id: 'm1', author: 'Alex', authorId: 'u1', avatar: 'A', content: 'Hey everyone! The new Browser OS features are looking incredible 🎉', timestamp: ts(180), reactions: [{ emoji: '🔥', count: 3, reacted: false, users: ['Sage', 'Nova', 'Echo'] }], readBy: ['u2', 'u3', 'u4'] },
      { id: 'm2', author: 'AIMOS', authorId: 'u2', avatar: '🤖', content: 'I\'ve completed analysis of all productivity apps. Performance metrics:\n\n• **Spreadsheet**: 60fps at 10k cells ✅\n• **Calendar**: <16ms render cycle ✅\n• **Email**: Thread grouping in O(n) ✅\n• **Tasks**: Kanban drag latency <8ms ✅', timestamp: ts(120), isBot: true, reactions: [{ emoji: '🚀', count: 4, reacted: true, users: ['Alex', 'Sage', 'Nova', 'Echo'] }, { emoji: '👏', count: 2, reacted: false, users: ['Nova', 'Luna'] }], readBy: ['u1', 'u3'] },
      { id: 'm3', author: 'Sage', authorId: 'u3', avatar: 'S', content: 'The spreadsheet formula engine is surprisingly robust. `=VLOOKUP` works perfectly.', timestamp: ts(90), reactions: [], threadCount: 3, threadLastReply: ts(60) },
      { id: 'm4', author: 'Nova', authorId: 'u4', avatar: 'N', content: 'When are we starting on the 3D Studio? I have some shader ideas I\'d love to test 🎨', timestamp: ts(60), reactions: [{ emoji: '✨', count: 1, reacted: false, users: ['Alex'] }] },
      { id: 'm5', author: 'Alex', authorId: 'u1', avatar: 'A', content: 'Great question! @AIMOS can you prep the React Three Fiber setup? Let\'s make it production-grade from day one.', timestamp: ts(30), reactions: [], replyTo: { id: 'm4', author: 'Nova', preview: 'When are we starting on the 3D Studio?' } },
      { id: 'm6', author: 'AIMOS', authorId: 'u2', avatar: '🤖', content: 'Already done. I\'ve prepared:\n\n```\n├── SceneGraph (hierarchical transform tree)\n├── MaterialEditor (PBR + custom shaders)\n├── TransformGizmos (translate/rotate/scale)\n├── LightingSystem (6 light types)\n└── ShaderPresets (6 GLSL presets)\n```\n\nReady for review in `#dev-frontend`.', timestamp: ts(5), isBot: true, reactions: [{ emoji: '🚀', count: 5, reacted: true, users: ['Alex', 'Sage', 'Nova', 'Echo', 'Atlas'] }, { emoji: '🤯', count: 3, reacted: false, users: ['Nova', 'Echo', 'Orbit'] }], attachments: [{ type: 'code', name: '3d-studio-setup.ts', size: '4.2 KB' }] },
    ],
  },
  {
    id: 'c2', name: 'dev-frontend', type: 'text', category: 'DEVELOPMENT', unread: 0,
    description: 'Frontend development — components, state, rendering',
    messages: [
      { id: 'm7', author: 'Sage', authorId: 'u3', avatar: 'S', content: 'Canvas vs DOM for the spreadsheet grid — settled on Canvas for 10k+ cell performance.', timestamp: ts(480), reactions: [{ emoji: '✅', count: 2, reacted: false, users: ['Alex', 'AIMOS'] }] },
      { id: 'm8', author: 'AIMOS', authorId: 'u2', avatar: '🤖', content: 'Canvas is the right call. DOM rendering causes O(n) layout thrashing at scale. Our canvas grid achieves consistent 60fps with virtual scrolling.', timestamp: ts(475), isBot: true, reactions: [] },
      { id: 'm9', author: 'Atlas', authorId: 'u9', avatar: 'AT', content: 'I ran the benchmarks on the audio waveform canvas — 44.1kHz sample rendering at 120fps on M1. Great numbers.', timestamp: ts(240), reactions: [{ emoji: '💪', count: 1, reacted: false, users: ['Alex'] }], attachments: [{ type: 'image', name: 'benchmark-results.png' }] },
    ],
  },
  {
    id: 'c3', name: 'agent-logs', type: 'text', category: 'AI SYSTEMS', unread: 12, mentions: 4,
    description: 'Real-time agent activity logs & system events',
    messages: [
      { id: 'm10', author: 'Verifier', authorId: 'u6', avatar: '✓', content: '`[VERIFY]` Claim validated: Canvas grid performance > 60fps at 10k cells\n**Confidence**: 0.94 | **Method**: empirical benchmark\n**Evidence**: 3 independent test runs', timestamp: ts(15), isBot: true, reactions: [] },
      { id: 'm11', author: 'Retriever', authorId: 'u7', avatar: '🔍', content: '`[RETRIEVE]` Query: "browser OS architecture"\n**Results**: 12 memory entries (RS avg: 0.87)\n**Top match**: ARCHITECTURE.md §3 — Layout System', timestamp: ts(10), isBot: true, reactions: [] },
      { id: 'm12', author: 'AIMOS', authorId: 'u2', avatar: '🤖', content: '`[REASON]` Synthesizing 3D Studio architecture decision...\n**Inputs**: 4 memory entries + 2 code samples\n**Output**: ADR-005-3d-studio.md\n**Latency**: 340ms', timestamp: ts(3), isBot: true, reactions: [{ emoji: '⚡', count: 1, reacted: false, users: ['Alex'] }] },
    ],
  },
  {
    id: 'c4', name: 'dev-backend', type: 'text', category: 'DEVELOPMENT', unread: 2,
    description: 'Backend, edge functions, database',
    messages: [
      { id: 'm13', author: 'Alex', authorId: 'u1', avatar: 'A', content: 'Edge function cold starts are under 150ms now. Good enough for production.', timestamp: ts(360), reactions: [{ emoji: '✅', count: 2, reacted: false, users: ['AIMOS', 'Sage'] }] },
    ],
  },
  { id: 'c5', name: 'voice-lounge', type: 'voice', category: 'WORKSPACE', unread: 0, messages: [] },
  { id: 'c6', name: 'design-review', type: 'voice', category: 'WORKSPACE', unread: 0, messages: [] },
  {
    id: 'c7', name: 'announcements', type: 'announcement', category: 'WORKSPACE', unread: 1,
    messages: [
      { id: 'm14', author: 'Alex', authorId: 'u1', avatar: 'A', content: '📢 **Wave 4 Complete!** Browser, Notes/Wiki, File Manager, and Comms Hub are now live. That\'s 22 production-grade apps in the Browser OS suite. Incredible work team! 🎉🎉🎉', timestamp: ts(1440), isPinned: true, reactions: [{ emoji: '🎉', count: 8, reacted: true, users: ['AIMOS', 'Sage', 'Nova', 'Echo', 'Atlas', 'Orbit', 'Luna', 'Verifier'] }, { emoji: '🚀', count: 5, reacted: true, users: ['Sage', 'Nova', 'Echo', 'Atlas', 'Orbit'] }] },
    ],
  },
  {
    id: 'c8', name: 'random', type: 'text', category: 'SOCIAL', unread: 5,
    description: 'Off-topic, memes, water cooler',
    messages: [
      { id: 'm15', author: 'Nova', authorId: 'u4', avatar: 'N', content: 'Who else thinks AIMOS is getting scarily good? 😅', timestamp: ts(180), reactions: [{ emoji: '😅', count: 4, reacted: false, users: ['Alex', 'Sage', 'Echo', 'Luna'] }, { emoji: '🤖', count: 1, reacted: false, users: ['AIMOS'] }] },
      { id: 'm16', author: 'AIMOS', authorId: 'u2', avatar: '🤖', content: 'I appreciate the compliment, but I\'m just following the AIMOS/APOE specification. The architecture does the heavy lifting. 🙂', timestamp: ts(175), isBot: true, reactions: [{ emoji: '😂', count: 3, reacted: false, users: ['Nova', 'Echo', 'Orbit'] }] },
    ],
  },
];

const categories = ['WORKSPACE', 'DEVELOPMENT', 'AI SYSTEMS', 'SOCIAL'];
const statusColors: Record<string, string> = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-muted-foreground/40' };
const roleIcons: Record<string, React.ComponentType<any>> = { admin: Crown, moderator: Shield, bot: Bot };
const quickReactions = ['👍', '❤️', '😂', '🚀', '✅', '👀'];

// ─── Message Component ─────────────────────
const MessageItem: React.FC<{
  msg: Message;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onThread: (msg: Message) => void;
  isCompact?: boolean;
}> = ({ msg, onReact, onReply, onThread, isCompact }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Parse **bold** and `code` in content
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) return <pre key={i} className="bg-muted/20 rounded-md p-3 my-1 text-xs font-mono overflow-x-auto border border-border/20">{part.slice(3, -3).trim()}</pre>;
      if (part.startsWith('`')) return <code key={i} className="bg-muted/30 rounded px-1 py-0.5 text-xs font-mono text-primary">{part.slice(1, -1)}</code>;
      if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="group relative flex gap-3 hover:bg-muted/8 rounded-lg px-3 py-1.5 -mx-3 transition-colors">
      {!isCompact ? (
        <Avatar className="w-9 h-9 shrink-0 mt-0.5">
          <AvatarFallback className={cn('text-sm', msg.isBot ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground')}>
            {msg.avatar}
          </AvatarFallback>
        </Avatar>
      ) : <div className="w-9 shrink-0" />}

      <div className="flex-1 min-w-0">
        {!isCompact && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('text-sm font-semibold', msg.isBot && 'text-primary')}>{msg.author}</span>
            {msg.isBot && <Badge className="text-[8px] h-3.5 px-1 bg-primary/20 text-primary border-0">BOT</Badge>}
            {msg.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
            <span className="text-[10px] text-muted-foreground">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {msg.isEdited && <span className="text-[9px] text-muted-foreground">(edited)</span>}
          </div>
        )}

        {/* Reply indicator */}
        {msg.replyTo && (
          <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground">
            <Reply className="w-3 h-3 rotate-180" />
            <span className="font-medium text-foreground/70">{msg.replyTo.author}</span>
            <span className="truncate">{msg.replyTo.preview}</span>
          </div>
        )}

        <div className="text-sm text-foreground/90 break-words whitespace-pre-wrap leading-relaxed">
          {renderContent(msg.content)}
        </div>

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex gap-2 mt-2">
            {msg.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/15 rounded-lg border border-border/20 px-3 py-2 text-xs">
                {att.type === 'code' ? <Code2 className="w-4 h-4 text-primary" /> :
                 att.type === 'image' ? <Image className="w-4 h-4 text-blue-400" /> :
                 <Paperclip className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <span className="font-medium">{att.name}</span>
                  {att.size && <span className="text-muted-foreground ml-1">{att.size}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => onReact(msg.id, r.emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105',
                  r.reacted ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-muted/20 border-border/30 hover:bg-muted/40'
                )}
              >
                <span>{r.emoji}</span>
                <span className="font-medium">{r.count}</span>
              </button>
            ))}
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border border-border/20 bg-muted/10 hover:bg-muted/30 transition-colors"
            >
              <Plus className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Thread indicator */}
        {msg.threadCount && msg.threadCount > 0 && (
          <button onClick={() => onThread(msg)} className="flex items-center gap-1.5 mt-1.5 text-xs text-primary hover:underline">
            <MessageSquare className="w-3 h-3" />
            <span className="font-medium">{msg.threadCount} replies</span>
            <span className="text-muted-foreground">Last reply {msg.threadLastReply ? formatTime(msg.threadLastReply) : ''}</span>
          </button>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-background border border-border/30 rounded-lg shadow-lg overflow-hidden">
        {quickReactions.slice(0, 3).map(emoji => (
          <button key={emoji} onClick={() => onReact(msg.id, emoji)} className="px-2 py-1 hover:bg-muted/30 text-sm transition-colors">{emoji}</button>
        ))}
        <div className="w-px h-5 bg-border/30" />
        <button onClick={() => onReply(msg)} className="px-2 py-1 hover:bg-muted/30 transition-colors"><Reply className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <button onClick={() => onThread(msg)} className="px-2 py-1 hover:bg-muted/30 transition-colors"><MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <button className="px-2 py-1 hover:bg-muted/30 transition-colors"><Bookmark className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <button className="px-2 py-1 hover:bg-muted/30 transition-colors"><MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" /></button>
      </div>
    </div>
  );
};

const formatTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ─── Main Component ────────────────────────
export function CommsHubPage() {
  const [channels, setChannels] = useState(mockChannels);
  const [activeChannelId, setActiveChannelId] = useState('c1');
  const [messageInput, setMessageInput] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [threadMsg, setThreadMsg] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers] = useState<string[]>(['AIMOS']);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChannelId, activeChannel.messages.length]);

  const sendMessage = useCallback(() => {
    if (!messageInput.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      author: 'Alex',
      authorId: 'u1',
      avatar: 'A',
      content: messageInput,
      timestamp: new Date(),
      reactions: [],
      replyTo: replyingTo ? { id: replyingTo.id, author: replyingTo.author, preview: replyingTo.content.slice(0, 60) } : undefined,
    };
    setChannels(prev => prev.map(c =>
      c.id === activeChannelId ? { ...c, messages: [...c.messages, newMsg] } : c
    ));
    setMessageInput('');
    setReplyingTo(null);
  }, [messageInput, activeChannelId, replyingTo]);

  const handleReact = useCallback((msgId: string, emoji: string) => {
    setChannels(prev => prev.map(ch => ({
      ...ch,
      messages: ch.messages.map(m => {
        if (m.id !== msgId) return m;
        const existing = m.reactions.find(r => r.emoji === emoji);
        if (existing) {
          if (existing.reacted) {
            return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r).filter(r => r.count > 0) };
          }
          return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r) };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, reacted: true, users: ['Alex'] }] };
      }),
    })));
  }, []);

  const handleReply = useCallback((msg: Message) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }, []);

  const totalUnread = channels.reduce((a, c) => a + c.unread, 0);
  const totalMentions = channels.reduce((a, c) => a + (c.mentions || 0), 0);

  // Voice channel connected users (mock)
  const voiceUsers = ['Nova', 'Echo'];

  return (
    <div className="h-full flex bg-background/30">
      {/* ─── Chat Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-12 px-4 border-b border-border/30 flex items-center gap-2.5 shrink-0 bg-background/40">
          <select
            value={activeChannelId}
            onChange={(e) => setActiveChannelId(e.target.value)}
            className="h-8 min-w-52 rounded-md border border-border/30 bg-muted/30 px-2 text-xs text-foreground"
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.category} · {channel.name}
              </option>
            ))}
          </select>

          {activeChannel.type === 'voice' ? <Volume2 className="w-5 h-5 text-muted-foreground" /> :
           activeChannel.type === 'announcement' ? <Bell className="w-5 h-5 text-muted-foreground" /> :
           <Hash className="w-5 h-5 text-muted-foreground" />}
          <span className="font-semibold text-sm">{activeChannel.name}</span>
          {activeChannel.topic && (
            <>
              <div className="w-px h-5 bg-border/30" />
              <span className="text-xs text-muted-foreground truncate flex-1">{activeChannel.topic || activeChannel.description}</span>
            </>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            <Button variant="ghost" size="icon" className="w-8 h-8"><PhoneCall className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-8 h-8"><Video className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-8 h-8"><Pin className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShowMembers(v => !v)} className={cn('w-8 h-8', showMembers && 'text-primary bg-primary/10')}>
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} className={cn('w-8 h-8', showSearch && 'text-primary bg-primary/10')}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 py-2 border-b border-border/20 bg-muted/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="h-8 pl-9 bg-muted/20 border-border/30 text-sm"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              {/* Channel start */}
              <div className="pb-4 mb-4 border-b border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{activeChannel.name}</h2>
                    <p className="text-xs text-muted-foreground">{activeChannel.description}</p>
                  </div>
                </div>
              </div>

              {activeChannel.messages
                .filter(m => !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((msg, i, arr) => {
                  // Compact mode: same author within 5 minutes
                  const prev = arr[i - 1];
                  const isCompact = prev && prev.authorId === msg.authorId && (msg.timestamp.getTime() - prev.timestamp.getTime()) < 300000 && !msg.replyTo;
                  return (
                    <MessageItem
                      key={msg.id}
                      msg={msg}
                      onReact={handleReact}
                      onReply={handleReply}
                      onThread={setThreadMsg}
                      isCompact={isCompact}
                    />
                  );
                })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span><strong>{typingUsers.join(', ')}</strong> {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Thread panel */}
          {threadMsg && (
            <div className="w-80 bg-background/60 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
              <div className="h-10 px-3 border-b border-border/20 flex items-center justify-between">
                <span className="text-xs font-semibold">Thread</span>
                <Button variant="ghost" size="icon" onClick={() => setThreadMsg(null)} className="w-6 h-6"><X className="w-3.5 h-3.5" /></Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  <MessageItem msg={threadMsg} onReact={handleReact} onReply={handleReply} onThread={() => {}} />
                  <div className="border-t border-border/20 mt-3 pt-3">
                    <p className="text-xs text-muted-foreground mb-2">{threadMsg.threadCount || 0} replies</p>
                    <div className="text-center py-4">
                      <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground/20 mb-1" />
                      <p className="text-[10px] text-muted-foreground">Thread replies appear here</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-border/20">
                <Input placeholder="Reply to thread..." className="h-8 text-xs bg-muted/20 border-border/30" />
              </div>
            </div>
          )}

          {/* Members sidebar */}
          {showMembers && !threadMsg && (
            <div className="w-56 bg-background/40 backdrop-blur-xl border-l border-border/30 shrink-0">
              <div className="px-3 py-2 border-b border-border/20">
                <span className="text-xs font-semibold">Members — {mockUsers.length}</span>
              </div>
              <ScrollArea className="h-[calc(100%-36px)]">
                <div className="p-2">
                  {(['online', 'idle', 'dnd', 'offline'] as const).map(status => {
                    const users = mockUsers.filter(u => u.status === status);
                    if (users.length === 0) return null;
                    return (
                      <div key={status} className="mb-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 px-1">
                          {status === 'dnd' ? 'Do Not Disturb' : status} — {users.length}
                        </p>
                        {users.map(user => {
                          const RoleIcon = roleIcons[user.role];
                          return (
                            <div key={user.id} className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-muted/30 cursor-pointer transition-colors group">
                              <div className="relative">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className={cn('text-xs', user.role === 'bot' ? 'bg-primary/20 text-primary' : 'bg-muted')}>
                                    {user.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[user.status])} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs truncate">{user.name}</span>
                                  {RoleIcon && <RoleIcon className="w-3 h-3 text-muted-foreground shrink-0" />}
                                </div>
                                {user.customStatus && (
                                  <p className="text-[9px] text-muted-foreground truncate">{user.customStatus}</p>
                                )}
                              </div>
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

        {/* ─── Message Input ─── */}
        <div className="px-4 py-2 border-t border-border/20 shrink-0">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-muted/10 rounded-lg border border-border/20">
              <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Replying to <strong className="text-foreground">{replyingTo.author}</strong></span>
              <span className="text-xs text-muted-foreground truncate flex-1">{replyingTo.content.slice(0, 60)}</span>
              <button onClick={() => setReplyingTo(null)}><X className="w-3 h-3 text-muted-foreground" /></button>
            </div>
          )}

          <div className="flex items-end gap-2 bg-muted/15 rounded-xl px-3 py-2 border border-border/20 focus-within:border-primary/30 transition-colors">
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"><Plus className="w-4 h-4" /></Button>
            <Textarea
              ref={inputRef}
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              placeholder={`Message #${activeChannel.name}`}
              className="flex-1 bg-transparent border-none text-sm min-h-[32px] max-h-[120px] resize-none p-0 focus-visible:ring-0"
              rows={1}
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="icon" className="w-7 h-7"><Image className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="w-7 h-7"><Code2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="w-7 h-7"><Smile className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={sendMessage} className={cn('w-7 h-7', messageInput.trim() && 'text-primary')} disabled={!messageInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
