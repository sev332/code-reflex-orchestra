// Email client — Conversation threading, AI drafts, snooze, scheduled send, smart filters
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Mail, Inbox, Send, FileText, Trash2, Star, Archive, Search,
  Plus, Reply, ReplyAll, Forward, Paperclip,
  Clock, Wand2, Flag, Tag,
  Bold, Italic, Underline, Link, List, Image,
  ChevronDown, ChevronRight, MoreVertical, AlarmClock,
  CalendarClock, Sparkles, Check, CheckCheck, X,
  Loader2, CornerDownRight, AtSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────── Types ─────────── */
interface EmailContact { name: string; email: string; }

interface Email {
  id: string;
  from: EmailContact;
  to: string[];
  cc?: string[];
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  isFlagged: boolean;
  folder: string;
  labels?: string[];
  attachments?: { name: string; size: string; type: string }[];
  threadId?: string;
  replyTo?: string;
  scheduledAt?: Date;
  snoozedUntil?: Date;
}

type Folder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'starred' | 'snoozed' | 'scheduled';

/* ─────────── Demo data ─────────── */
const folders: { id: Folder; label: string; icon: React.ComponentType<any>; count?: number }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'snoozed', label: 'Snoozed', icon: AlarmClock },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'scheduled', label: 'Scheduled', icon: CalendarClock },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const labelColors: Record<string, string> = {
  Architecture: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Sprint: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  '3D Studio': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  Personal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const demoEmails: Email[] = [
  {
    id: '1', threadId: 'thread-1',
    from: { name: 'Alex Chen', email: 'alex@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'AIMOS v2.0 Architecture Review',
    preview: 'I\'ve completed the initial review of the AIMOS architecture proposal...',
    body: 'Hi,\n\nI\'ve completed the initial review of the AIMOS architecture proposal. Key findings:\n\n1. The CMC memory system shows excellent scalability with the RS scoring mechanism\n2. APOE orchestration handles parallel reasoning chains efficiently\n3. VIF verification needs additional calibration for edge cases\n\nI recommend we schedule a deep-dive session this week to discuss the uncertainty quantification approach.\n\nBest,\nAlex',
    date: new Date(2026, 2, 7, 10, 30), isRead: false, isStarred: true, isFlagged: false, folder: 'inbox',
    labels: ['Architecture'],
    attachments: [
      { name: 'aimos-review.pdf', size: '2.4 MB', type: 'pdf' },
      { name: 'architecture-diagram.png', size: '890 KB', type: 'image' },
    ],
  },
  {
    id: '1b', threadId: 'thread-1', replyTo: '1',
    from: { name: 'You', email: 'user@lucid.dev' }, to: ['alex@lucid.dev'],
    subject: 'Re: AIMOS v2.0 Architecture Review',
    preview: 'Thanks for the thorough review. Let\'s schedule...',
    body: 'Thanks for the thorough review, Alex.\n\nLet\'s schedule the deep-dive for Thursday at 2pm. I\'ll prepare the VIF calibration data.\n\nBest',
    date: new Date(2026, 2, 7, 11, 0), isRead: true, isStarred: false, isFlagged: false, folder: 'sent',
    labels: ['Architecture'],
  },
  {
    id: '1c', threadId: 'thread-1', replyTo: '1b',
    from: { name: 'Alex Chen', email: 'alex@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Re: AIMOS v2.0 Architecture Review',
    preview: 'Thursday 2pm works perfectly. I\'ll also bring the benchmark results...',
    body: 'Thursday 2pm works perfectly.\n\nI\'ll also bring the benchmark results from the latest CMC stress test — some interesting patterns in the memory compaction phase.\n\nSee you then!\nAlex',
    date: new Date(2026, 2, 7, 11, 45), isRead: false, isStarred: false, isFlagged: false, folder: 'inbox',
    labels: ['Architecture'],
  },
  {
    id: '2', threadId: 'thread-2',
    from: { name: 'Jordan Lee', email: 'jordan@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Sprint 14 Planning Notes',
    preview: 'Here are the key items from today\'s sprint planning...',
    body: 'Team,\n\nHere are the key items from today\'s sprint planning:\n\n- Complete the 3D Studio shader library integration\n- Ship the spreadsheet formula parser\n- Fix calendar drag-to-create events\n- Email client AI drafting feature\n\nVelocity target: 42 points.\n\nThanks,\nJordan',
    date: new Date(2026, 2, 7, 9, 15), isRead: false, isStarred: false, isFlagged: true, folder: 'inbox',
    labels: ['Sprint'],
  },
  {
    id: '3', threadId: 'thread-3',
    from: { name: 'LUCID System', email: 'system@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Memory Compaction Complete',
    preview: 'Your CMC memory store has been compacted. 847 entries optimized...',
    body: 'Automated notification:\n\nYour CMC memory store has been compacted.\n\n- 847 entries optimized\n- Compression ratio: 3.2x\n- Quality score maintained above θ_Q (0.65)\n- 12 low-priority entries archived\n\nNo action required.',
    date: new Date(2026, 2, 7, 8, 0), isRead: true, isStarred: false, isFlagged: false, folder: 'inbox',
  },
  {
    id: '4', threadId: 'thread-4',
    from: { name: 'Sam Rivera', email: 'sam@lucid.dev' }, to: ['user@lucid.dev'],
    subject: '3D Shader Library Sources',
    preview: 'Found some excellent GLSL resources we should integrate...',
    body: 'Hey,\n\nFound some excellent GLSL resources we should integrate into the 3D Studio:\n\n- Shadertoy top-rated collection (200+ shaders)\n- GLSL Sandbox curated list\n- Custom PBR material library from our internal tests\n\nI can start the integration pipeline tomorrow.\n\nSam',
    date: new Date(2026, 2, 6, 16, 45), isRead: true, isStarred: true, isFlagged: false, folder: 'inbox',
    labels: ['3D Studio'],
    attachments: [{ name: 'shader-catalog.xlsx', size: '156 KB', type: 'spreadsheet' }],
  },
  {
    id: '5', threadId: 'thread-5',
    from: { name: 'Mira Patel', email: 'mira@lucid.dev' }, to: ['user@lucid.dev'],
    subject: 'Security Audit — Action Required',
    preview: 'The latest security scan flagged two medium-priority items...',
    body: 'Hi,\n\nThe latest security scan flagged two medium-priority items:\n\n1. CSP headers need tightening on the API proxy\n2. Session token rotation interval should be reduced from 24h to 4h\n\nPlease review and approve the proposed fixes before EOD Friday.\n\nMira\nSecurity Lead',
    date: new Date(2026, 2, 6, 14, 20), isRead: true, isStarred: false, isFlagged: true, folder: 'inbox',
    labels: ['Urgent'],
  },
];

/* ─────────── AI Draft templates ─────────── */
const aiDraftTemplates = [
  { label: 'Professional Reply', prompt: 'professional' },
  { label: 'Concise Summary', prompt: 'concise' },
  { label: 'Friendly Tone', prompt: 'friendly' },
  { label: 'Request Action', prompt: 'action' },
];

const generateAIDraft = (style: string, originalBody: string): string => {
  const drafts: Record<string, string> = {
    professional: `Thank you for your message. I've reviewed the details and have the following observations:\n\n1. The points raised are well-considered and align with our current direction\n2. I'd suggest we schedule a follow-up to discuss implementation specifics\n3. I'll prepare a detailed analysis for our next meeting\n\nPlease let me know if you have any questions.\n\nBest regards`,
    concise: `Thanks for this. Noted and agreed on all points. Let's sync up tomorrow to finalize.\n\nBest`,
    friendly: `Hey! Thanks so much for sharing this — really appreciate the thorough work.\n\nEverything looks great to me! Let's catch up soon to hash out the next steps. Looking forward to it! 🚀\n\nCheers`,
    action: `Thanks for this update. To move forward, I'd like to:\n\n☐ Review the attached materials by EOD today\n☐ Schedule a 30-min sync for tomorrow\n☐ Draft an implementation plan by Friday\n\nCan you confirm these timelines work for you?\n\nBest`,
  };
  return drafts[style] || drafts.professional;
};

/* ─────────── Snooze options ─────────── */
const snoozeOptions = [
  { label: 'Later today', hours: 3 },
  { label: 'Tomorrow morning', hours: 14 },
  { label: 'This weekend', hours: 72 },
  { label: 'Next week', hours: 168 },
];

/* ─────────── Main Component ─────────── */
export function EmailPage() {
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', subject: '', body: '' });
  const [emails, setEmails] = useState<Email[]>(demoEmails);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'thread'>('list');

  // ─── AI Integration ──────────────────────────
  const { notifyChange } = useAIAppIntegration({
    appId: 'email',
    getContext: () => {
      const unread = emails.filter(e => !e.isRead && e.folder === 'inbox').length;
      const starred = emails.filter(e => e.isStarred).length;
      return {
        appId: 'email',
        appName: 'Email',
        summary: `${activeFolder} folder. ${unread} unread, ${starred} starred, ${emails.length} total emails.`,
        activeView: activeFolder,
        itemCount: emails.length,
        selectedItems: selectedEmail ? [selectedEmail.id] : [],
        metadata: { activeFolder, unread, starred, isComposing, searchQuery },
      };
    },
    onAction: async (action) => {
      switch (action.capabilityId) {
        case 'email.draft': {
          setComposeData({ to: action.params.to || '', cc: '', subject: action.params.subject || '', body: action.params.body || '' });
          setIsComposing(true);
          return { success: true, message: 'Compose window opened' };
        }
        case 'email.search': {
          const query = action.params.query || '';
          setSearchQuery(query);
          return { success: true, message: `Searching for: "${query}"` };
        }
        case 'email.summarize': {
          if (selectedEmail) {
            return { success: true, data: { subject: selectedEmail.subject, from: selectedEmail.from.name, preview: selectedEmail.preview }, message: `Email from ${selectedEmail.from.name}: ${selectedEmail.subject}` };
          }
          return { success: false, error: 'No email selected' };
        }
        default:
          return { success: false, error: `Unknown capability: ${action.capabilityId}` };
      }
    },
  });

  useEffect(() => { notifyChange(); }, [activeFolder, emails.length, selectedEmail?.id, isComposing]);

  const threadMap = useMemo(() => {
    const map = new Map<string, Email[]>();
    emails.forEach(e => {
      const tid = e.threadId || e.id;
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid)!.push(e);
    });
    map.forEach(arr => arr.sort((a, b) => a.date.getTime() - b.date.getTime()));
    return map;
  }, [emails]);

  // Get latest email per thread for list view
  const filteredEmails = useMemo(() => {
    let list = emails;

    // Folder filtering
    if (activeFolder === 'starred') list = list.filter(e => e.isStarred);
    else if (activeFolder === 'snoozed') list = list.filter(e => e.snoozedUntil);
    else if (activeFolder === 'scheduled') list = list.filter(e => e.scheduledAt);
    else list = list.filter(e => e.folder === activeFolder);

    // Label filtering
    if (activeLabel) list = list.filter(e => e.labels?.includes(activeLabel));

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.name.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
      );
    }

    // Deduplicate by thread — show latest
    const seen = new Set<string>();
    const deduped: Email[] = [];
    const sorted = [...list].sort((a, b) => b.date.getTime() - a.date.getTime());
    for (const e of sorted) {
      const tid = e.threadId || e.id;
      if (!seen.has(tid)) { seen.add(tid); deduped.push(e); }
    }
    return deduped;
  }, [emails, activeFolder, searchQuery, activeLabel]);

  const toggleStar = useCallback((id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: !e.isStarred } : e));
  }, []);

  const markRead = useCallback((id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
  }, []);

  const archiveEmail = useCallback((id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'archive' } : e));
    setSelectedEmail(null);
  }, []);

  const trashEmail = useCallback((id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'trash' } : e));
    setSelectedEmail(null);
  }, []);

  const snoozeEmail = useCallback((id: string, hours: number) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, snoozedUntil: new Date(Date.now() + hours * 3600000) } : e));
  }, []);

  const getThreadCount = (email: Email): number => {
    const tid = email.threadId || email.id;
    return threadMap.get(tid)?.length || 1;
  };

  const getUnreadCount = (folder: Folder): number => {
    if (folder === 'starred') return emails.filter(e => e.isStarred && !e.isRead).length;
    if (folder === 'snoozed') return emails.filter(e => e.snoozedUntil).length;
    if (folder === 'scheduled') return emails.filter(e => e.scheduledAt).length;
    return emails.filter(e => e.folder === folder && !e.isRead).length;
  };

  const formatDate = (d: Date) => {
    const now = new Date(2026, 2, 8);
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    if (diff < 172800000) return 'Yesterday';
    return `${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  };

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    emails.forEach(e => e.labels?.forEach(l => set.add(l)));
    return Array.from(set);
  }, [emails]);

  return (
    <div className="h-full flex bg-background">
      {/* ── Email list ── */}
      <div className="w-96 border-r border-border/30 flex flex-col shrink-0">
        <div className="p-2 border-b border-border/20 shrink-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-8 gap-1.5 text-xs px-3" onClick={() => { setIsComposing(true); setComposeData({ to: '', cc: '', subject: '', body: '' }); }}>
              <Plus className="w-3.5 h-3.5" /> Compose
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm bg-muted/20 border-none"
              />
            </div>
          </div>

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-1 pr-2">
              {folders.map((f) => {
                const isActive = activeFolder === f.id && !activeLabel;
                const count = getUnreadCount(f.id);
                return (
                  <Button
                    key={f.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); setActiveLabel(null); }}
                    className={cn('h-6 px-2 text-[10px] gap-1', isActive && 'bg-primary/10 text-primary')}
                  >
                    <f.icon className="w-3 h-3" />
                    {f.label}
                    {count > 0 && <Badge className="bg-primary/20 text-primary text-[9px] px-1 h-4">{count}</Badge>}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          {allLabels.length > 0 && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex items-center gap-1 pr-2">
                {allLabels.map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    onClick={() => { setActiveLabel(activeLabel === label ? null : label); setActiveFolder('inbox'); }}
                    className={cn('h-6 px-2 text-[10px] gap-1', activeLabel === label && 'bg-primary/10 text-primary')}
                  >
                    <Tag className="w-3 h-3" />
                    {label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/15">
            {filteredEmails.map(email => {
              const threadCount = getThreadCount(email);
              const threadEmails = threadMap.get(email.threadId || email.id) || [email];
              const hasUnreadInThread = threadEmails.some(e => !e.isRead);

              return (
                <button
                  key={email.id}
                  onClick={() => { setSelectedEmail(email); markRead(email.id); setIsComposing(false); }}
                  className={cn(
                    'w-full text-left p-3 hover:bg-white/5 transition-colors group',
                    selectedEmail?.threadId === email.threadId && selectedEmail?.id ? 'bg-primary/10' : '',
                    hasUnreadInThread && 'bg-white/[0.02]'
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
                        <span className={cn('text-sm truncate', hasUnreadInThread && 'font-semibold')}>{email.from.name}</span>
                        {threadCount > 1 && (
                          <Badge variant="outline" className="text-[9px] px-1 h-4 border-border/30 text-muted-foreground shrink-0">
                            {threadCount}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{formatDate(email.date)}</span>
                      </div>
                      <p className={cn('text-xs truncate', hasUnreadInThread ? 'text-foreground' : 'text-muted-foreground')}>{email.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{email.preview}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {email.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        {email.isFlagged && <Flag className="w-3 h-3 text-red-500" />}
                        {email.attachments && <Paperclip className="w-3 h-3 text-muted-foreground" />}
                        {email.snoozedUntil && <AlarmClock className="w-3 h-3 text-blue-400" />}
                        {email.labels?.map(l => (
                          <Badge key={l} variant="outline" className={cn('text-[8px] px-1 py-0 h-3.5', labelColors[l] || 'border-primary/30 text-primary')}>{l}</Badge>
                        ))}
                        {/* Hover actions */}
                        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); archiveEmail(email.id); }} className="p-0.5 rounded hover:bg-white/10">
                            <Archive className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); trashEmail(email.id); }} className="p-0.5 rounded hover:bg-white/10">
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredEmails.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emails</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Email viewer / Compose ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {isComposing ? (
          <ComposeView
            data={composeData}
            onChange={setComposeData}
            onSend={() => { setIsComposing(false); }}
            onSchedule={() => setShowScheduleDialog(true)}
            onDiscard={() => setIsComposing(false)}
            replyContext={selectedEmail}
          />
        ) : selectedEmail ? (
          <ThreadViewer
            email={selectedEmail}
            thread={threadMap.get(selectedEmail.threadId || selectedEmail.id) || [selectedEmail]}
            onToggleStar={toggleStar}
            onArchive={archiveEmail}
            onTrash={trashEmail}
            onSnooze={snoozeEmail}
            onReply={(email) => {
              setIsComposing(true);
              setComposeData({ to: email.from.email, cc: '', subject: `Re: ${email.subject.replace(/^Re: /, '')}`, body: '' });
            }}
            onForward={(email) => {
              setIsComposing(true);
              setComposeData({ to: '', cc: '', subject: `Fwd: ${email.subject}`, body: `\n\n---------- Forwarded message ----------\nFrom: ${email.from.name} <${email.from.email}>\nDate: ${email.date.toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}` });
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an email to read</p>
              <p className="text-xs text-muted-foreground/60 mt-1">or compose a new message</p>
            </div>
          </div>
        )}
      </div>

      {/* Schedule dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Schedule Send</DialogTitle>
            <DialogDescription>Choose when to send this email</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Tomorrow morning', time: '8:00 AM' },
              { label: 'Tomorrow afternoon', time: '1:00 PM' },
              { label: 'Monday morning', time: '8:00 AM' },
              { label: 'Pick date & time', time: 'Custom' },
            ].map(opt => (
              <Button key={opt.label} variant="outline" className="h-16 flex-col gap-1" onClick={() => setShowScheduleDialog(false)}>
                <CalendarClock className="w-5 h-5 text-primary" />
                <span className="text-xs">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.time}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────── Thread Viewer ─────────── */
function ThreadViewer({
  email, thread, onToggleStar, onArchive, onTrash, onSnooze, onReply, onForward,
}: {
  email: Email;
  thread: Email[];
  onToggleStar: (id: string) => void;
  onArchive: (id: string) => void;
  onTrash: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
}) {
  const [collapsedEmails, setCollapsedEmails] = useState<Set<string>>(
    new Set(thread.slice(0, -1).map(e => e.id))
  );
  const [quickReply, setQuickReply] = useState('');

  const toggleCollapse = (id: string) => {
    setCollapsedEmails(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const latestEmail = thread[thread.length - 1];

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/30 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onReply(latestEmail)}>
          <Reply className="w-3.5 h-3.5" />Reply
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <ReplyAll className="w-3.5 h-3.5" />Reply All
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onForward(latestEmail)}>
          <Forward className="w-3.5 h-3.5" />Forward
        </Button>
        <div className="w-px h-4 bg-border/30 mx-1" />

        {/* Snooze dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <AlarmClock className="w-3.5 h-3.5" />Snooze
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/95 backdrop-blur-xl border-border/50">
            {snoozeOptions.map(opt => (
              <DropdownMenuItem key={opt.label} onClick={() => onSnooze(email.id, opt.hours)}>
                <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" className="h-7" onClick={() => onToggleStar(email.id)}>
          <Star className={cn('w-3.5 h-3.5', email.isStarred && 'text-amber-500 fill-amber-500')} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7" onClick={() => onArchive(email.id)}>
          <Archive className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => onTrash(email.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Wand2 className="w-3.5 h-3.5 text-primary" />AI Summary
        </Button>
      </div>

      {/* Thread view */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl space-y-1">
          <h1 className="text-xl font-semibold mb-2">{email.subject.replace(/^(Re|Fwd): /, '')}</h1>
          {thread.length > 1 && (
            <p className="text-xs text-muted-foreground mb-4">{thread.length} messages in thread</p>
          )}

          {thread.map((msg, idx) => {
            const isCollapsed = collapsedEmails.has(msg.id);
            const isLast = idx === thread.length - 1;

            return (
              <div key={msg.id} className={cn(
                'rounded-lg border transition-all',
                isLast ? 'border-border/30 bg-card/50' : 'border-border/15 bg-card/20',
              )}>
                {/* Header — always visible */}
                <button
                  onClick={() => toggleCollapse(msg.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">
                      {msg.from.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{msg.from.name}</span>
                      {msg.replyTo && <CornerDownRight className="w-3 h-3 text-muted-foreground" />}
                      <span className="text-[10px] text-muted-foreground ml-auto">{msg.date.toLocaleString()}</span>
                      <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', isCollapsed && '-rotate-90')} />
                    </div>
                    {isCollapsed && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.preview || msg.body.slice(0, 80)}</p>
                    )}
                  </div>
                </button>

                {/* Body — collapsible */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 pt-0 ml-11">
                    <p className="text-xs text-muted-foreground mb-3">
                      to {msg.to.join(', ')}
                      {msg.cc && msg.cc.length > 0 && <>, cc: {msg.cc.join(', ')}</>}
                    </p>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {msg.body}
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {msg.attachments.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 border border-border/30 rounded-lg px-3 py-2 text-xs hover:bg-white/5 cursor-pointer">
                            <FileText className="w-4 h-4 text-primary" />
                            <div>
                              <p className="font-medium">{a.name}</p>
                              <p className="text-muted-foreground">{a.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick reply */}
          <div className="mt-4 rounded-lg border border-border/30 bg-card/30 p-3">
            <div className="flex items-start gap-2">
              <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                <AvatarFallback className="text-[9px] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={quickReply}
                  onChange={e => setQuickReply(e.target.value)}
                  placeholder="Write a quick reply..."
                  className="min-h-[60px] bg-transparent border-none resize-none text-sm p-0 focus-visible:ring-0"
                />
                <div className="flex items-center gap-1 mt-2">
                  <Button size="sm" className="h-7 text-xs gap-1" disabled={!quickReply.trim()}>
                    <Send className="w-3 h-3" /> Reply
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Paperclip className="w-3.5 h-3.5" />
                  </Button>
                  <div className="flex-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Draft
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background/95 backdrop-blur-xl border-border/50">
                      {aiDraftTemplates.map(t => (
                        <DropdownMenuItem key={t.prompt} onClick={() => setQuickReply(generateAIDraft(t.prompt, latestEmail.body))}>
                          <Wand2 className="w-3.5 h-3.5 mr-2 text-primary" />
                          {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

/* ─────────── Compose View ─────────── */
function ComposeView({
  data, onChange, onSend, onSchedule, onDiscard, replyContext,
}: {
  data: { to: string; cc: string; subject: string; body: string };
  onChange: (d: any) => void;
  onSend: () => void;
  onSchedule: () => void;
  onDiscard: () => void;
  replyContext?: Email | null;
}) {
  const [showCc, setShowCc] = useState(!!data.cc);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const handleAIDraft = (style: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      onChange({ ...data, body: generateAIDraft(style, replyContext?.body || '') });
      setIsGenerating(false);
      setShowAIPanel(false);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 shrink-0">
        <h3 className="text-sm font-medium">{data.subject.startsWith('Re:') ? 'Reply' : data.subject.startsWith('Fwd:') ? 'Forward' : 'New Message'}</h3>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowAIPanel(!showAIPanel)}>
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Draft
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onDiscard}>
          <X className="w-3.5 h-3.5 mr-1" /> Discard
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-7 gap-1 text-xs">
              <Send className="w-3.5 h-3.5" /> Send
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border/50">
            <DropdownMenuItem onClick={onSend}>
              <Send className="w-3.5 h-3.5 mr-2" /> Send now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSchedule}>
              <CalendarClock className="w-3.5 h-3.5 mr-2" /> Schedule send
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">To:</span>
            <Input value={data.to} onChange={(e) => onChange({ ...data, to: e.target.value })} className="h-8 text-sm bg-muted/20 border-none" placeholder="recipient@example.com" />
            {!showCc && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground shrink-0" onClick={() => setShowCc(true)}>Cc/Bcc</Button>
            )}
          </div>
          {showCc && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 shrink-0">Cc:</span>
              <Input value={data.cc} onChange={(e) => onChange({ ...data, cc: e.target.value })} className="h-8 text-sm bg-muted/20 border-none" placeholder="cc@example.com" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">Subject:</span>
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
            <Button variant="ghost" size="icon" className="w-7 h-7"><AtSign className="w-3.5 h-3.5" /></Button>
          </div>

          {isGenerating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">AI is drafting your email...</p>
              </div>
            </div>
          ) : (
            <Textarea
              value={data.body}
              onChange={(e) => onChange({ ...data, body: e.target.value })}
              placeholder="Write your message..."
              className="flex-1 resize-none bg-muted/10 border-none text-sm leading-relaxed min-h-[200px]"
            />
          )}
        </div>

        {/* AI Draft panel */}
        {showAIPanel && (
          <div className="w-64 border-l border-border/30 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI Drafts</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Choose a tone and AI will draft your email</p>
            <div className="space-y-1.5">
              {aiDraftTemplates.map(t => (
                <Button
                  key={t.prompt}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => handleAIDraft(t.prompt)}
                >
                  <Wand2 className="w-3.5 h-3.5 mr-2 text-primary" />
                  {t.label}
                </Button>
              ))}
            </div>
            {replyContext && (
              <div className="mt-4 p-2 rounded bg-muted/20 border border-border/20">
                <p className="text-[10px] text-muted-foreground mb-1">Replying to:</p>
                <p className="text-[11px] font-medium truncate">{replyContext.subject}</p>
                <p className="text-[10px] text-muted-foreground truncate">{replyContext.preview}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
