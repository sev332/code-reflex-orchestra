// Email client with inbox, compose, folders, threading, AI drafting
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Mail, Inbox, Send, FileText, Trash2, Star, Archive, Search,
  Plus, Reply, ReplyAll, Forward, MoreHorizontal, Paperclip,
  Clock, ChevronDown, Wand2, AlertCircle, Tag, Flag,
  Bold, Italic, Underline, Link, List, Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Email {
  id: string;
  from: { name: string; email: string; avatar?: string };
  to: string[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  isFlagged: boolean;
  folder: string;
  labels?: string[];
  attachments?: { name: string; size: string }[];
  thread?: string;
}

type Folder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'starred';

const folders: { id: Folder; label: string; icon: React.ComponentType<any>; count?: number }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 4 },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText, count: 1 },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const demoEmails: Email[] = [
  {
    id: '1', from: { name: 'Alex Chen', email: 'alex@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'AIMOS v2.0 Architecture Review', preview: 'I\'ve completed the initial review of the AIMOS architecture proposal...',
    body: 'Hi,\n\nI\'ve completed the initial review of the AIMOS architecture proposal. Key findings:\n\n1. The CMC memory system shows excellent scalability with the RS scoring mechanism\n2. APOE orchestration handles parallel reasoning chains efficiently\n3. VIF verification needs additional calibration for edge cases\n\nI recommend we schedule a deep-dive session this week to discuss the uncertainty quantification approach.\n\nBest,\nAlex',
    date: new Date(2026, 2, 7, 10, 30), isRead: false, isStarred: true, isFlagged: false, folder: 'inbox', labels: ['Architecture'],
    attachments: [{ name: 'aimos-review.pdf', size: '2.4 MB' }],
  },
  {
    id: '2', from: { name: 'Jordan Lee', email: 'jordan@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Sprint 14 Planning Notes', preview: 'Here are the key items from today\'s sprint planning...',
    body: 'Team,\n\nHere are the key items from today\'s sprint planning:\n\n- Complete the 3D Studio shader library integration\n- Ship the spreadsheet formula parser\n- Fix calendar drag-to-create events\n- Email client AI drafting feature\n\nVelocity target: 42 points.\n\nThanks,\nJordan',
    date: new Date(2026, 2, 7, 9, 15), isRead: false, isStarred: false, isFlagged: true, folder: 'inbox', labels: ['Sprint'],
  },
  {
    id: '3', from: { name: 'LUCID System', email: 'system@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Memory Compaction Complete', preview: 'Your CMC memory store has been compacted. 847 entries optimized...',
    body: 'Automated notification:\n\nYour CMC memory store has been compacted.\n\n- 847 entries optimized\n- Compression ratio: 3.2x\n- Quality score maintained above θ_Q (0.65)\n- 12 low-priority entries archived\n\nNo action required.',
    date: new Date(2026, 2, 7, 8, 0), isRead: true, isStarred: false, isFlagged: false, folder: 'inbox',
  },
  {
    id: '4', from: { name: 'Sam Rivera', email: 'sam@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Re: 3D Shader Library Sources', preview: 'Found some excellent GLSL resources we should integrate...',
    body: 'Hey,\n\nFound some excellent GLSL resources we should integrate into the 3D Studio:\n\n- Shadertoy top-rated collection (200+ shaders)\n- GLSL Sandbox curated list\n- Custom PBR material library from our internal tests\n\nI can start the integration pipeline tomorrow.\n\nSam',
    date: new Date(2026, 2, 6, 16, 45), isRead: true, isStarred: true, isFlagged: false, folder: 'inbox', labels: ['3D Studio'],
  },
  {
    id: '5', from: { name: 'You', email: 'user@lucid.dev' }, to: ['alex@lucid.dev'],
    subject: 'Re: AIMOS v2.0 Architecture Review', preview: 'Thanks for the thorough review. Let\'s schedule...',
    body: 'Thanks for the thorough review, Alex.\n\nLet\'s schedule the deep-dive for Thursday at 2pm. I\'ll prepare the VIF calibration data.\n\nBest',
    date: new Date(2026, 2, 7, 11, 0), isRead: true, isStarred: false, isFlagged: false, folder: 'sent',
  },
];

export function EmailPage() {
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [emails, setEmails] = useState<Email[]>(demoEmails);

  const filteredEmails = useMemo(() => {
    let list = emails.filter(e => {
      if (activeFolder === 'starred') return e.isStarred;
      return e.folder === activeFolder;
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => e.subject.toLowerCase().includes(q) || e.from.name.toLowerCase().includes(q) || e.preview.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [emails, activeFolder, searchQuery]);

  const toggleStar = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: !e.isStarred } : e));
  };

  const markRead = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
  };

  const formatDate = (d: Date) => {
    const now = new Date(2026, 2, 7);
    if (d.toDateString() === now.toDateString()) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="h-full flex bg-background">
      {/* Folder sidebar */}
      <div className="w-52 border-r border-border/30 flex flex-col shrink-0">
        <div className="p-2">
          <Button className="w-full gap-1 h-9 text-sm" onClick={() => setIsComposing(true)}>
            <Plus className="w-4 h-4" /> Compose
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1 space-y-0.5">
            {folders.map(f => {
              const Icon = f.icon;
              const isActive = activeFolder === f.id;
              const count = f.id === 'inbox' ? emails.filter(e => e.folder === 'inbox' && !e.isRead).length : f.count;
              return (
                <Button
                  key={f.id}
                  variant="ghost"
                  onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); }}
                  className={cn(
                    'w-full justify-start h-8 px-3 text-sm',
                    isActive && 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon className={cn('w-4 h-4 mr-2', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="flex-1 text-left">{f.label}</span>
                  {count && count > 0 && (
                    <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 h-4">{count}</Badge>
                  )}
                </Button>
              );
            })}
          </div>
          <div className="p-3 mt-2 border-t border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Labels</p>
            <div className="space-y-1">
              {['Architecture', 'Sprint', '3D Studio'].map(l => (
                <button key={l} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full px-2 py-1 rounded hover:bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {l}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Email list */}
      <div className="w-96 border-r border-border/30 flex flex-col shrink-0">
        <div className="p-2 border-b border-border/20 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/20 border-none"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/15">
            {filteredEmails.map(email => (
              <button
                key={email.id}
                onClick={() => { setSelectedEmail(email); markRead(email.id); setIsComposing(false); }}
                className={cn(
                  'w-full text-left p-3 hover:bg-white/5 transition-colors',
                  selectedEmail?.id === email.id && 'bg-primary/10',
                  !email.isRead && 'bg-white/[0.02]'
                )}
              >
                <div className="flex items-start gap-2">
                  <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">
                      {email.from.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={cn('text-sm truncate', !email.isRead && 'font-semibold')}>{email.from.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{formatDate(email.date)}</span>
                    </div>
                    <p className={cn('text-xs truncate', !email.isRead ? 'text-foreground' : 'text-muted-foreground')}>{email.subject}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{email.preview}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {email.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      {email.isFlagged && <Flag className="w-3 h-3 text-red-500" />}
                      {email.attachments && <Paperclip className="w-3 h-3 text-muted-foreground" />}
                      {email.labels?.map(l => (
                        <Badge key={l} variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-primary/30 text-primary">{l}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filteredEmails.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emails</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Email viewer / Compose */}
      <div className="flex-1 flex flex-col min-w-0">
        {isComposing ? (
          <ComposeView
            data={composeData}
            onChange={setComposeData}
            onSend={() => { setIsComposing(false); setComposeData({ to: '', subject: '', body: '' }); }}
            onDiscard={() => setIsComposing(false)}
          />
        ) : selectedEmail ? (
          <EmailViewer email={selectedEmail} onToggleStar={toggleStar} onReply={() => { setIsComposing(true); setComposeData({ to: selectedEmail.from.email, subject: `Re: ${selectedEmail.subject}`, body: '' }); }} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an email to read</p>
              <p className="text-xs text-muted-foreground/60">or compose a new message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailViewer({ email, onToggleStar, onReply }: { email: Email; onToggleStar: (id: string) => void; onReply: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/30 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onReply}><Reply className="w-3.5 h-3.5" />Reply</Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><ReplyAll className="w-3.5 h-3.5" />Reply All</Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Forward className="w-3.5 h-3.5" />Forward</Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onToggleStar(email.id)}>
          <Star className={cn('w-3.5 h-3.5', email.isStarred && 'text-amber-500 fill-amber-500')} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Archive className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs"><Wand2 className="w-3.5 h-3.5 text-primary" />AI Summarize</Button>
      </div>

      {/* Email content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl">
          <h1 className="text-xl font-semibold mb-4">{email.subject}</h1>
          <div className="flex items-start gap-3 mb-6">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">
                {email.from.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{email.from.name}</span>
                <span className="text-xs text-muted-foreground">&lt;{email.from.email}&gt;</span>
              </div>
              <p className="text-xs text-muted-foreground">to {email.to.join(', ')}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {email.date.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {email.body}
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 border-t border-border/20 pt-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                {email.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 border border-border/30 rounded-lg px-3 py-2 text-xs hover:bg-white/5 cursor-pointer">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-muted-foreground">{a.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ComposeView({ data, onChange, onSend, onDiscard }: { data: { to: string; subject: string; body: string }; onChange: (d: any) => void; onSend: () => void; onDiscard: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 shrink-0">
        <h3 className="text-sm font-medium">New Message</h3>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> AI Draft
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onDiscard}>Discard</Button>
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={onSend}><Send className="w-3.5 h-3.5" /> Send</Button>
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">To:</span>
          <Input value={data.to} onChange={(e) => onChange({ ...data, to: e.target.value })} className="h-8 text-sm bg-muted/20 border-none" placeholder="recipient@example.com" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Subject:</span>
          <Input value={data.subject} onChange={(e) => onChange({ ...data, subject: e.target.value })} className="h-8 text-sm bg-muted/20 border-none" placeholder="Subject" />
        </div>
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 py-1 border-y border-border/20">
          <Button variant="ghost" size="icon" className="w-7 h-7"><Bold className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Italic className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Underline className="w-3.5 h-3.5" /></Button>
          <div className="w-px h-4 bg-border/30 mx-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7"><List className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Link className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Image className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7"><Paperclip className="w-3.5 h-3.5" /></Button>
        </div>
        <Textarea
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
          placeholder="Write your message..."
          className="flex-1 resize-none bg-muted/10 border-none text-sm leading-relaxed min-h-[200px]"
        />
      </div>
    </div>
  );
}
