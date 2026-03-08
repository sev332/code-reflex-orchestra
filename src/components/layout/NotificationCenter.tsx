// Notification Center — system alerts, agent activity, toast history
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, X, Check, CheckCheck, Trash2, Settings, Filter,
  AlertTriangle, Info, CheckCircle2, XCircle, Zap,
  Brain, Cpu, GitBranch, MessageSquare, FileText, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'agent';
  timestamp: Date;
  read: boolean;
  source?: string;
  action?: { label: string; onClick: () => void };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ComponentType<any>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  agent: Brain,
};

const typeColors: Record<string, string> = {
  info: 'text-primary',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-destructive',
  agent: 'text-purple-400',
};

// Demo notifications
const demoNotifications: Notification[] = [
  { id: '1', title: 'Agent Alpha completed task', message: 'Background analysis of document corpus finished with 94% confidence.', type: 'agent', timestamp: new Date(Date.now() - 60000), read: false, source: 'Agent System' },
  { id: '2', title: 'Memory consolidation complete', message: '12 context entries compressed and indexed. Storage reduced by 34%.', type: 'success', timestamp: new Date(Date.now() - 180000), read: false, source: 'CMC' },
  { id: '3', title: 'API rate limit approaching', message: 'Google AI API usage at 82% of daily quota. Consider reducing batch sizes.', type: 'warning', timestamp: new Date(Date.now() - 300000), read: false, source: 'API Monitor' },
  { id: '4', title: 'New orchestration template', message: 'Multi-agent debate chain template is now available in the template library.', type: 'info', timestamp: new Date(Date.now() - 600000), read: true, source: 'Orchestration' },
  { id: '5', title: 'Dream Mode insight', message: 'Recurring pattern detected: reasoning chains improve 18% with structured prompts.', type: 'agent', timestamp: new Date(Date.now() - 900000), read: true, source: 'Dream Mode' },
  { id: '6', title: 'Document indexed', message: 'UNIFIED_TEXTBOOK.md successfully chunked into 47 segments with hierarchical index.', type: 'success', timestamp: new Date(Date.now() - 1200000), read: true, source: 'Document System' },
  { id: '7', title: 'Edge function deployed', message: 'chain-executor function updated to v2.3 with improved error handling.', type: 'info', timestamp: new Date(Date.now() - 1800000), read: true, source: 'Supabase' },
  { id: '8', title: 'Calibration drift detected', message: 'ECE score increased to 0.08. Auto-recalibration scheduled.', type: 'warning', timestamp: new Date(Date.now() - 3600000), read: true, source: 'VIF' },
];

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications;
  }, [notifications, filter]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div className="fixed top-11 right-12 w-96 z-[91] max-h-[70vh]">
        <div className="bg-background/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="text-[9px] h-4 px-1.5 bg-primary/20 text-primary border-0">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={markAllRead}>
                  <CheckCheck className="w-3 h-3" /> Read All
                </Button>
              )}
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-3 py-1.5 border-b border-border/20 flex items-center gap-1 shrink-0">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize',
                  filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            ))}
            <div className="flex-1" />
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 text-muted-foreground" onClick={clearAll}>
                <Trash2 className="w-2.5 h-2.5" /> Clear
              </Button>
            )}
          </div>

          {/* Notification list */}
          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{filter === 'unread' ? 'All caught up!' : 'No notifications'}</p>
              </div>
            ) : (
              <div className="p-1.5">
                {filtered.map(notif => {
                  const Icon = typeIcons[notif.type] || Info;
                  const color = typeColors[notif.type] || 'text-muted-foreground';
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className={cn(
                        'px-2.5 py-2 rounded-lg mb-0.5 transition-colors cursor-pointer group relative',
                        !notif.read ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/20'
                      )}
                    >
                      {!notif.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />}
                      <div className="flex items-start gap-2.5 pl-2">
                        <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn('text-xs font-medium truncate', !notif.read && 'text-foreground')}>{notif.title}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {notif.source && <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border/30">{notif.source}</Badge>}
                            <span className="text-[9px] text-muted-foreground/50">{formatTime(notif.timestamp)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                        >
                          <X className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
