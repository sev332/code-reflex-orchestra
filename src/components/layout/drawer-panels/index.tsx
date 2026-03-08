// Real, functional drawer panel content for every page
// Each panel is self-contained with its own state and renders real UI
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Clock, Star, Search, FileText, FolderKanban, BookOpen, GitBranch,
  HardDrive, Folder, Cloud, Plus, Upload, ChevronRight, ChevronDown,
  File, Database, Tag, Layers, Play, BarChart3, History, Image,
  Music, Video, Map, Sliders, Wand2, Scissors, Volume2, Film,
  Navigation, MapPin, MessageSquare, Zap, Code2, Palette, Globe,
  FolderTree, Workflow, Table2, CalendarDays, KanbanSquare, Box,
  Terminal, LayoutDashboard, StickyNote, FolderOpen, MessageCircle,
  Presentation, Inbox, Send, Archive, Trash2, Flag, AlarmClock,
  CalendarClock, Mail, Settings, Circle, Timer, PauseCircle, CheckCircle2,
  AlertCircle, ArrowUp, ArrowRight, ArrowDown, Eye, EyeOff, Lock, Unlock,
  Paintbrush, PenTool, MousePointer2, Square, Type, Pipette, Hand,
  ZoomIn, Eraser, Grid3X3, Magnet, FileJson, FileCode, FileImage,
  MoreHorizontal, Copy, Download, GripVertical, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { emitPageDrawerAction } from '@/lib/page-drawer-events';

// ============================================================
// EMAIL DRAWER PANELS (Perfected)
// ============================================================

const EMAIL_FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 3, color: '' },
  { id: 'starred', label: 'Starred', icon: Star, count: 2, color: 'text-amber-400' },
  { id: 'snoozed', label: 'Snoozed', icon: AlarmClock, count: 1, color: 'text-blue-400' },
  { id: 'sent', label: 'Sent', icon: Send, count: 0, color: '' },
  { id: 'scheduled', label: 'Scheduled', icon: CalendarClock, count: 0, color: '' },
  { id: 'drafts', label: 'Drafts', icon: FileText, count: 1, color: '' },
  { id: 'archive', label: 'Archive', icon: Archive, count: 0, color: '' },
  { id: 'trash', label: 'Trash', icon: Trash2, count: 0, color: '' },
];

const EMAIL_LABELS = [
  { name: 'Architecture', color: 'hsl(270, 80%, 60%)', count: 3 },
  { name: 'Sprint', color: 'hsl(45, 100%, 65%)', count: 2 },
  { name: '3D Studio', color: 'hsl(150, 100%, 60%)', count: 1 },
  { name: 'Urgent', color: 'hsl(0, 80%, 60%)', count: 1 },
  { name: 'Personal', color: 'hsl(210, 80%, 60%)', count: 4 },
];

export function EmailInboxPanel() {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const totalUnread = EMAIL_FOLDERS.reduce((a, f) => a + f.count, 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" className="w-full h-9 gap-1.5 text-xs font-medium">
          <Plus className="w-4 h-4" /> Compose
        </Button>

        {/* Unread summary */}
        <div className="bg-muted/15 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">{totalUnread} unread</p>
            <p className="text-[10px] text-muted-foreground">across all folders</p>
          </div>
          <Mail className="w-5 h-5 text-primary/40" />
        </div>

        <div className="space-y-0.5">
          {EMAIL_FOLDERS.map(f => {
            const Icon = f.icon;
            const isActive = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFolder(f.id); emitPageDrawerAction({ page: 'email', action: 'folder', value: f.id }); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all',
                  isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : f.color || 'text-muted-foreground')} />
                <span className="flex-1 text-left font-medium">{f.label}</span>
                {f.count > 0 && (
                  <span className={cn(
                    'text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground',
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Quick Actions</p>
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" /> Mark all read
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Wand2 className="w-3.5 h-3.5 text-primary" /> AI Sort inbox
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export function EmailLabelsPanel() {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Labels</span>
          <Button variant="ghost" size="icon" className="w-6 h-6"><Plus className="w-3 h-3" /></Button>
        </div>

        <div className="space-y-0.5">
          {EMAIL_LABELS.map(l => (
            <button
              key={l.name}
              onClick={() => { setActiveLabel(activeLabel === l.name ? null : l.name); emitPageDrawerAction({ page: 'email', action: 'label', value: l.name }); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all',
                activeLabel === l.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
              )}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="flex-1 text-left">{l.name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 h-4">{l.count}</Badge>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2">
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2 text-muted-foreground">
            <Settings className="w-3.5 h-3.5" /> Manage Labels
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export function EmailSearchPanel() {
  const [query, setQuery] = useState('');
  const filters = [
    { label: 'Unread', icon: Mail, active: false },
    { label: 'Has Attachments', icon: FileText, active: false },
    { label: 'Flagged', icon: Flag, active: false },
    { label: 'This Week', icon: Clock, active: false },
    { label: 'From: Me', icon: Send, active: false },
  ];
  return (
    <div className="p-3 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search emails..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-muted/30 border-none"
          autoFocus
        />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Quick Filters</p>
        {filters.map(f => {
          const Icon = f.icon;
          return (
            <Button key={f.label} variant="ghost" size="sm" className="w-full justify-start h-7 text-xs gap-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              {f.label}
            </Button>
          );
        })}
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Recent Searches</p>
        {['AIMOS architecture', 'security audit', 'shader catalog'].map(s => (
          <Button key={s} variant="ghost" size="sm" className="w-full justify-start h-7 text-xs gap-2 text-muted-foreground">
            <History className="w-3 h-3" />
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CALENDAR DRAWER PANELS (Perfected)
// ============================================================

export function CalendarListPanel() {
  const calendars = [
    { name: 'Work', color: 'hsl(var(--primary))', enabled: true, events: 12 },
    { name: 'Personal', color: 'hsl(270, 80%, 60%)', enabled: true, events: 5 },
    { name: 'Team', color: 'hsl(150, 100%, 60%)', enabled: true, events: 8 },
    { name: 'Holidays', color: 'hsl(45, 100%, 65%)', enabled: false, events: 3 },
    { name: 'Birthdays', color: 'hsl(340, 80%, 60%)', enabled: false, events: 2 },
  ];

  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(calendars.map(c => [c.name, c.enabled]))
  );

  const [selectedDate, setSelectedDate] = useState(8);
  const [miniCalMonth, setMiniCalMonth] = useState({ month: 2, year: 2026 });
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Days with events (for dots)
  const eventDays = new Set([8, 9, 10, 11, 12, 13, 15, 18, 22]);

  // Generate mini calendar days properly
  const firstDay = new Date(miniCalMonth.year, miniCalMonth.month, 1).getDay();
  const daysInMonth = new Date(miniCalMonth.year, miniCalMonth.month + 1, 0).getDate();
  const prevMonthDays = new Date(miniCalMonth.year, miniCalMonth.month, 0).getDate();

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        <Button size="sm" className="w-full h-9 gap-1.5 text-xs font-medium">
          <Plus className="w-4 h-4" /> New Event
        </Button>

        {/* Interactive Mini Calendar */}
        <div className="border border-border/30 rounded-xl p-2.5 bg-muted/5">
          <div className="flex items-center justify-between mb-2">
            <button
              className="text-muted-foreground hover:text-foreground p-0.5"
              onClick={() => setMiniCalMonth(prev => {
                const m = prev.month - 1;
                return m < 0 ? { month: 11, year: prev.year - 1 } : { ...prev, month: m };
              })}
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
            <span className="text-xs font-semibold">{monthNames[miniCalMonth.month]} {miniCalMonth.year}</span>
            <button
              className="text-muted-foreground hover:text-foreground p-0.5"
              onClick={() => setMiniCalMonth(prev => {
                const m = prev.month + 1;
                return m > 11 ? { month: 0, year: prev.year + 1 } : { ...prev, month: m };
              })}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-[9px] text-muted-foreground/60 font-medium py-1">{d}</div>
            ))}
            {/* Previous month overflow */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`prev-${i}`} className="text-[10px] py-1 text-muted-foreground/20">
                {prevMonthDays - firstDay + i + 1}
              </div>
            ))}
            {/* Current month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDate;
              const isToday = day === 8 && miniCalMonth.month === 2 && miniCalMonth.year === 2026;
              const hasEvent = eventDays.has(day);
              return (
                <button
                  key={day}
                  onClick={() => { setSelectedDate(day); emitPageDrawerAction({ page: 'calendar', action: 'select-date', value: `${miniCalMonth.year}-${miniCalMonth.month + 1}-${day}` }); }}
                  className={cn(
                    'text-[10px] py-1 rounded-md relative transition-all',
                    isSelected ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted/30',
                    isToday && !isSelected && 'font-bold text-primary ring-1 ring-primary/40',
                  )}
                >
                  {day}
                  {hasEvent && !isSelected && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendars */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">My Calendars</p>
          {calendars.map(cal => (
            <div key={cal.name} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/20 group">
              <Checkbox
                checked={enabled[cal.name]}
                onCheckedChange={(checked) => setEnabled(prev => ({ ...prev, [cal.name]: !!checked }))}
                className="border-muted-foreground/40"
              />
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cal.color }} />
              <span className={cn('text-xs flex-1', !enabled[cal.name] && 'text-muted-foreground')}>{cal.name}</span>
              <span className="text-[10px] text-muted-foreground">{cal.events}</span>
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 gap-2 text-muted-foreground">
          <Plus className="w-3.5 h-3.5" /> Add Calendar
        </Button>
      </div>
    </ScrollArea>
  );
}

export function CalendarUpcomingPanel() {
  const sections = [
    { label: 'Today · March 8', events: [
      { title: 'Team Standup', time: '9:00 – 9:30 AM', color: 'hsl(var(--primary))', location: 'Virtual' },
      { title: 'Lunch Break', time: '12:00 – 1:00 PM', color: 'hsl(210, 90%, 55%)', location: null },
      { title: 'Design Review', time: '2:00 – 3:30 PM', color: 'hsl(270, 80%, 60%)', location: 'Room 3B' },
    ]},
    { label: 'Tomorrow · March 9', events: [
      { title: 'Sprint Planning', time: '10:00 – 11:30 AM', color: 'hsl(150, 100%, 60%)', location: null },
    ]},
    { label: 'Tuesday · March 10', events: [
      { title: 'AI Architecture Deep Dive', time: '1:00 – 4:00 PM', color: 'hsl(0, 80%, 55%)', location: null },
    ]},
    { label: 'Wednesday · March 11', events: [
      { title: 'Code Review', time: '11:00 AM – 12:00 PM', color: 'hsl(45, 100%, 65%)', location: null },
    ]},
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {sections.map(section => (
          <div key={section.label} className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1">{section.label}</p>
            {section.events.map((ev, i) => (
              <button
                key={i}
                className="w-full text-left rounded-lg hover:bg-muted/20 transition-colors group"
              >
                <div className="flex gap-2 px-1 py-1.5">
                  <div className="w-0.5 rounded-full shrink-0 self-stretch" style={{ background: ev.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.time}
                    </p>
                    {ev.location && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.location}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}


// ============================================================
// TASKS DRAWER PANELS (Perfected)
// ============================================================

export function TasksBoardPanel() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const statusCounts = [
    { id: 'backlog', label: 'Backlog', count: 2, icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted/10' },
    { id: 'todo', label: 'To Do', count: 3, icon: Circle, color: 'text-[hsl(210,80%,60%)]', bgColor: 'bg-[hsl(210,80%,60%)]/5' },
    { id: 'in_progress', label: 'In Progress', count: 2, icon: Timer, color: 'text-[hsl(45,100%,65%)]', bgColor: 'bg-[hsl(45,100%,65%)]/5' },
    { id: 'review', label: 'Review', count: 1, icon: PauseCircle, color: 'text-[hsl(270,80%,65%)]', bgColor: 'bg-[hsl(270,80%,65%)]/5' },
    { id: 'done', label: 'Done', count: 4, icon: CheckCircle2, color: 'text-[hsl(150,100%,60%)]', bgColor: 'bg-[hsl(150,100%,60%)]/5' },
  ];
  const total = statusCounts.reduce((a, s) => a + s.count, 0);
  const done = statusCounts.find(s => s.label === 'Done')?.count || 0;
  const inProgress = statusCounts.find(s => s.label === 'In Progress')?.count || 0;
  const completion = Math.round((done / total) * 100);

  // Quick task input
  const [quickTask, setQuickTask] = useState('');

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {/* Quick add */}
        <div className="flex gap-1">
          <Input
            placeholder="Quick add task..."
            value={quickTask}
            onChange={(e) => setQuickTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && quickTask.trim()) { emitPageDrawerAction({ page: 'tasks', action: 'add-task', value: quickTask }); setQuickTask(''); } }}
            className="h-8 text-xs bg-muted/20 border-border/30 flex-1"
          />
          <Button size="sm" className="h-8 w-8 p-0 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress card */}
        <div className="rounded-xl border border-border/20 bg-muted/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">{completion}% Complete</p>
              <p className="text-[10px] text-muted-foreground">{done}/{total} tasks done</p>
            </div>
            <div className="w-10 h-10 relative">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.2" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${completion} ${100 - completion}`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="flex gap-3 text-[10px]">
            <span className="text-[hsl(45,100%,65%)]">● {inProgress} active</span>
            <span className="text-destructive">● 1 overdue</span>
          </div>
        </div>

        {/* Status filters */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">By Status</p>
          {statusCounts.map(s => {
            const Icon = s.icon;
            const isActive = activeFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveFilter(isActive ? null : s.id); emitPageDrawerAction({ page: 'tasks', action: 'filter-status', value: s.id }); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all',
                  isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
                )}
              >
                <Icon className={cn('w-4 h-4', s.color)} />
                <span className="flex-1 text-left font-medium">{s.label}</span>
                <span className={cn(
                  'text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground',
                )}>
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Priority breakdown */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">By Priority</p>
          {[
            { label: 'Urgent', icon: AlertCircle, color: 'text-destructive', count: 1 },
            { label: 'High', icon: ArrowUp, color: 'text-[hsl(30,100%,60%)]', count: 3 },
            { label: 'Medium', icon: ArrowRight, color: 'text-[hsl(45,100%,65%)]', count: 5 },
            { label: 'Low', icon: ArrowDown, color: 'text-[hsl(210,70%,55%)]', count: 3 },
          ].map(p => {
            const Icon = p.icon;
            return (
              <button key={p.label} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/25 transition-all">
                <Icon className={cn('w-3.5 h-3.5', p.color)} />
                <span className="flex-1 text-left">{p.label}</span>
                <span className="text-[10px] text-muted-foreground">{p.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

export function TasksProjectsPanel() {
  const [activeProject, setActiveProject] = useState('Browser OS');
  const projects = [
    { name: 'Browser OS', tasks: 8, done: 3, color: 'hsl(var(--primary))' },
    { name: 'AIMOS Engine', tasks: 5, done: 1, color: 'hsl(270, 80%, 60%)' },
    { name: 'Design System', tasks: 3, done: 2, color: 'hsl(150, 100%, 60%)' },
    { name: 'Documentation', tasks: 4, done: 4, color: 'hsl(45, 100%, 65%)' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-7">
          <Plus className="w-3.5 h-3.5" /> New Project
        </Button>
        {projects.map(p => {
          const isActive = activeProject === p.name;
          const pct = Math.round((p.done / p.tasks) * 100);
          return (
            <button
              key={p.name}
              onClick={() => { setActiveProject(p.name); emitPageDrawerAction({ page: 'tasks', action: 'select-project', value: p.name }); }}
              className={cn(
                'w-full text-left px-2.5 py-2.5 rounded-lg transition-all',
                isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded shrink-0" style={{ background: p.color }} />
                <span className="text-xs font-medium flex-1">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.done}/{p.tasks}</span>
              </div>
              <Progress value={pct} className="h-1" />
            </button>
          );
        })}

        {/* Labels */}
        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Labels</p>
          {['Core', 'UI', 'Backend', 'Spreadsheet', 'Calendar', 'AI'].map(l => (
            <Button key={l} variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-2 mr-1">
              <Tag className="w-3 h-3 text-muted-foreground" />{l}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function TasksAnalyticsPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Open', value: '8', color: 'text-primary', trend: '+2' },
            { label: 'Done', value: '4', color: 'text-[hsl(150,100%,60%)]', trend: '+1' },
            { label: 'Overdue', value: '1', color: 'text-destructive', trend: '0' },
            { label: 'Avg Time', value: '2.3d', color: 'text-muted-foreground', trend: '-0.5d' },
          ].map(s => (
            <div key={s.label} className="bg-muted/15 rounded-xl p-2.5 border border-border/10">
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <span className={cn('text-[9px]', s.trend.startsWith('-') ? 'text-[hsl(150,100%,60%)]' : s.trend === '0' ? 'text-muted-foreground' : 'text-[hsl(45,100%,65%)]')}>{s.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly velocity */}
        <div className="rounded-xl border border-border/20 bg-muted/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Weekly Velocity</p>
            <Badge variant="outline" className="text-[9px] h-4">This Week</Badge>
          </div>
          <div className="h-24 flex items-end justify-between gap-1 px-1">
            {[
              { day: 'M', val: 40 }, { day: 'T', val: 65 }, { day: 'W', val: 50 },
              { day: 'T', val: 80 }, { day: 'F', val: 70 }, { day: 'S', val: 90 }, { day: 'S', val: 55 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm bg-primary/30 hover:bg-primary/60 transition-colors" style={{ height: `${d.val}%` }} />
                <span className="text-[8px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team workload */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Team Workload</p>
          {[
            { name: 'Alex', tasks: 4, color: 'bg-primary' },
            { name: 'Jordan', tasks: 3, color: 'bg-[hsl(270,80%,60%)]' },
            { name: 'Sam', tasks: 2, color: 'bg-[hsl(150,100%,60%)]' },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-2 px-2">
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-background', m.color)}>
                {m.name[0]}
              </div>
              <span className="text-xs flex-1">{m.name}</span>
              <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', m.color)} style={{ width: `${(m.tasks / 5) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-3 text-right">{m.tasks}</span>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// FILES DRAWER PANELS (Perfected)
// ============================================================

interface FileNode { name: string; type: 'file' | 'folder'; ext?: string; size?: string; modified?: string; starred?: boolean; children?: FileNode[] }

const FILE_TREE: FileNode[] = [
  { name: 'src', type: 'folder', children: [
    { name: 'components', type: 'folder', children: [
      { name: 'layout', type: 'folder', children: [
        { name: 'PageLeftDrawer.tsx', type: 'file', ext: 'tsx', size: '15 KB', modified: '2m ago' },
        { name: 'PageTopBar.tsx', type: 'file', ext: 'tsx', size: '8 KB', modified: '1h ago' },
        { name: 'BottomDock.tsx', type: 'file', ext: 'tsx', size: '4 KB', modified: '3h ago' },
      ]},
      { name: 'AIChat', type: 'folder', children: [
        { name: 'AdvancedPersistentChat.tsx', type: 'file', ext: 'tsx', size: '12 KB', modified: '1h ago' },
      ]},
      { name: 'Productivity', type: 'folder', children: [
        { name: 'CalendarPage.tsx', type: 'file', ext: 'tsx', size: '18 KB', modified: '2h ago' },
        { name: 'EmailPage.tsx', type: 'file', ext: 'tsx', size: '22 KB', modified: '3h ago' },
        { name: 'TasksPage.tsx', type: 'file', ext: 'tsx', size: '20 KB', modified: '4h ago' },
        { name: 'SpreadsheetPage.tsx', type: 'file', ext: 'tsx', size: '35 KB', modified: '6h ago' },
      ]},
    ]},
    { name: 'hooks', type: 'folder', children: [
      { name: 'useAIMOS.ts', type: 'file', ext: 'ts', size: '4 KB', modified: '12h ago' },
      { name: 'useChatPersistence.ts', type: 'file', ext: 'ts', size: '3 KB', modified: '1d ago' },
    ]},
    { name: 'lib', type: 'folder', children: [
      { name: 'utils.ts', type: 'file', ext: 'ts', size: '2 KB', modified: '6h ago' },
      { name: 'page-drawer-events.ts', type: 'file', ext: 'ts', size: '1 KB', modified: '1h ago' },
    ]},
    { name: 'index.css', type: 'file', ext: 'css', size: '8 KB', modified: '2h ago' },
    { name: 'main.tsx', type: 'file', ext: 'tsx', size: '1 KB', modified: '1d ago' },
  ]},
  { name: 'public', type: 'folder', children: [
    { name: 'docs', type: 'folder', children: [
      { name: 'AIMOS.txt', type: 'file', ext: 'txt', size: '24 KB', modified: '1w ago' },
      { name: 'DrawingEngine.txt', type: 'file', ext: 'txt', size: '18 KB', modified: '1w ago' },
    ]},
    { name: 'favicon.ico', type: 'file', ext: 'ico', size: '1 KB', modified: '2w ago' },
  ]},
  { name: 'docs', type: 'folder', children: [
    { name: 'ARCHITECTURE.md', type: 'file', ext: 'md', size: '16 KB', modified: '6h ago', starred: true },
    { name: 'UI_CANON.md', type: 'file', ext: 'md', size: '12 KB', modified: '1d ago', starred: true },
  ]},
  { name: 'package.json', type: 'file', ext: 'json', size: '2 KB', modified: '1h ago' },
  { name: 'tailwind.config.ts', type: 'file', ext: 'ts', size: '1 KB', modified: '1d ago' },
];

const EXT_COLORS: Record<string, string> = {
  tsx: 'text-[hsl(210,80%,60%)]', ts: 'text-[hsl(210,80%,60%)]',
  css: 'text-[hsl(270,80%,60%)]', json: 'text-[hsl(45,100%,65%)]',
  md: 'text-[hsl(150,100%,60%)]', txt: 'text-muted-foreground',
  ico: 'text-muted-foreground',
};

function FileTreeNode({ node, depth = 0, activeFile, onSelect }: { node: FileNode; depth?: number; activeFile?: string; onSelect?: (name: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isFolder = node.type === 'folder';
  const isActive = activeFile === node.name;
  const extColor = node.ext ? EXT_COLORS[node.ext] || 'text-muted-foreground' : '';

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) setExpanded(!expanded);
          else onSelect?.(node.name);
        }}
        className={cn(
          'w-full flex items-center gap-1.5 py-[3px] pr-2 text-xs rounded-md transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/20',
        )}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
      >
        {isFolder ? (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground/60 shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        ) : <span className="w-3 shrink-0" />}
        {isFolder ? (
          <Folder className={cn('w-3.5 h-3.5 shrink-0', expanded ? 'text-primary' : 'text-amber-400')} />
        ) : (
          <File className={cn('w-3.5 h-3.5 shrink-0', extColor)} />
        )}
        <span className="truncate flex-1">{node.name}</span>
        {node.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />}
      </button>
      {isFolder && expanded && node.children?.map((child, i) => (
        <FileTreeNode key={i} node={child} depth={depth + 1} activeFile={activeFile} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function FilesBrowsePanel() {
  const [activeFile, setActiveFile] = useState<string>('PageLeftDrawer.tsx');
  return (
    <ScrollArea className="h-full">
      <div className="p-1.5 space-y-1">
        <div className="flex items-center gap-1 px-1.5 mb-1">
          <Button variant="ghost" size="icon" className="w-6 h-6" title="New File"><Plus className="w-3 h-3" /></Button>
          <Button variant="ghost" size="icon" className="w-6 h-6" title="New Folder"><FolderOpen className="w-3 h-3" /></Button>
          <Button variant="ghost" size="icon" className="w-6 h-6" title="Upload"><Upload className="w-3 h-3" /></Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="w-6 h-6" title="Search"><Search className="w-3 h-3" /></Button>
        </div>
        {FILE_TREE.map((node, i) => (
          <FileTreeNode key={i} node={node} activeFile={activeFile} onSelect={setActiveFile} />
        ))}
        <div className="px-2 py-2 mt-2 text-[10px] text-muted-foreground/50">
          {FILE_TREE.length} items · workspace root
        </div>
      </div>
    </ScrollArea>
  );
}

export function FilesRecentPanel() {
  const recent = [
    { name: 'PageLeftDrawer.tsx', path: 'src/components/layout/', time: '2m ago', ext: 'tsx' },
    { name: 'drawer-panels/index.tsx', path: 'src/components/layout/', time: '5m ago', ext: 'tsx' },
    { name: 'ARCHITECTURE.md', path: 'docs/', time: '1h ago', ext: 'md' },
    { name: 'index.css', path: 'src/', time: '2h ago', ext: 'css' },
    { name: 'package.json', path: './', time: '3h ago', ext: 'json' },
    { name: 'CalendarPage.tsx', path: 'src/components/Productivity/', time: '4h ago', ext: 'tsx' },
    { name: 'EmailPage.tsx', path: 'src/components/Productivity/', time: '6h ago', ext: 'tsx' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {recent.map((f, i) => (
          <button key={i} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/25 transition-colors">
            <File className={cn('w-3.5 h-3.5 shrink-0', EXT_COLORS[f.ext] || 'text-muted-foreground')} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{f.path} · {f.time}</p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function FilesStarredPanel() {
  const starred = [
    { name: 'ARCHITECTURE.md', path: 'docs/' },
    { name: 'UI_CANON.md', path: 'docs/' },
    { name: 'api.ts', path: 'src/lib/' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {starred.map((f, i) => (
          <button key={i} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/25 transition-colors">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{f.path}</p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// IDE DRAWER PANELS (Perfected)
// ============================================================

export function IDEFilesPanel() {
  const [activeFile, setActiveFile] = useState<string>('PageLeftDrawer.tsx');
  const [openFiles] = useState(['PageLeftDrawer.tsx', 'index.tsx', 'CalendarPage.tsx']);

  return (
    <ScrollArea className="h-full">
      <div className="p-1.5">
        {/* Open files tabs */}
        <div className="mb-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1.5 mb-1">Open Editors ({openFiles.length})</p>
          {openFiles.map(f => (
            <button
              key={f}
              onClick={() => setActiveFile(f)}
              className={cn(
                'w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors group',
                activeFile === f ? 'bg-primary/10 text-primary' : 'hover:bg-muted/20',
              )}
            >
              <File className={cn('w-3 h-3 shrink-0', activeFile === f ? 'text-primary' : 'text-[hsl(210,80%,60%)]')} />
              <span className="truncate flex-1">{f}</span>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted/50 shrink-0">
                <span className="text-[10px] text-muted-foreground">×</span>
              </button>
            </button>
          ))}
        </div>

        {/* File tree */}
        <div className="border-t border-border/20 pt-1.5">
          <div className="flex items-center justify-between px-1.5 mb-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Explorer</span>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="w-5 h-5"><FolderOpen className="w-3 h-3" /></Button>
            </div>
          </div>
          {FILE_TREE.map((node, i) => (
            <FileTreeNode key={i} node={node} activeFile={activeFile} onSelect={setActiveFile} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function IDEGitPanel() {
  const [commitMsg, setCommitMsg] = useState('');
  const changes = [
    { name: 'PageLeftDrawer.tsx', status: 'M', color: 'text-[hsl(45,100%,65%)]', path: 'src/components/layout/' },
    { name: 'index.tsx', status: 'A', color: 'text-[hsl(150,100%,60%)]', path: 'src/components/layout/drawer-panels/' },
    { name: 'page-drawer-events.ts', status: 'M', color: 'text-[hsl(45,100%,65%)]', path: 'src/lib/' },
  ];
  const staged = [changes[0]];
  const unstaged = changes.slice(1);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {/* Branch */}
        <div className="flex items-center gap-2 px-1">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">main</span>
          <Badge variant="outline" className="text-[10px] px-1.5 h-4 ml-auto">{changes.length} changes</Badge>
        </div>

        {/* Commit */}
        <div className="space-y-1.5">
          <Input
            placeholder="Commit message..."
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            className="text-xs h-8 bg-muted/20 border-border/30"
          />
          <div className="flex gap-1">
            <Button size="sm" className="flex-1 h-7 text-xs" disabled={!commitMsg.trim()}>Commit</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2">Push</Button>
          </div>
        </div>

        {/* Staged */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Staged ({staged.length})</p>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Unstage all"><ArrowDown className="w-3 h-3" /></Button>
          </div>
          {staged.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 text-xs group">
              <Badge variant="outline" className={cn('text-[9px] px-1 h-4 font-mono', c.color)}>{c.status}</Badge>
              <span className="truncate flex-1">{c.name}</span>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted/50">
                <ArrowDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        {/* Unstaged */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Changes ({unstaged.length})</p>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Stage all"><ArrowUp className="w-3 h-3" /></Button>
          </div>
          {unstaged.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 text-xs group">
              <Badge variant="outline" className={cn('text-[9px] px-1 h-4 font-mono', c.color)}>{c.status}</Badge>
              <span className="truncate flex-1">{c.name}</span>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted/50">
                <ArrowUp className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// ILLUSTRATOR DRAWER PANELS (Perfected)
// ============================================================

export function IllustratorLayersPanel() {
  const [activeLayer, setActiveLayer] = useState('1');
  const [layers, setLayers] = useState([
    { id: '1', name: 'Vector Shapes', visible: true, locked: false, color: 'hsl(var(--primary))' },
    { id: '2', name: 'Typography', visible: true, locked: false, color: 'hsl(270, 80%, 60%)' },
    { id: '3', name: 'Icons', visible: true, locked: false, color: 'hsl(150, 100%, 60%)' },
    { id: '4', name: 'Guidelines', visible: false, locked: true, color: 'hsl(45, 100%, 65%)' },
    { id: '5', name: 'Background', visible: true, locked: true, color: 'hsl(210, 80%, 55%)' },
  ]);

  const toggleVisibility = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  const toggleLock = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Layers</span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Add Layer"><Plus className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Group"><Layers className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Delete"><Trash2 className="w-3 h-3" /></Button>
          </div>
        </div>
        {layers.map(l => (
          <div
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-2 rounded-lg transition-all cursor-pointer group',
              activeLayer === l.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
            )}
          >
            <GripVertical className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground cursor-grab shrink-0" />
            <div className="w-2 h-full min-h-[16px] rounded-sm shrink-0" style={{ background: l.color }} />
            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(l.id); }} className="shrink-0">
              {l.visible ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleLock(l.id); }} className="shrink-0">
              {l.locked ? <Lock className="w-3.5 h-3.5 text-muted-foreground/40" /> : <Unlock className="w-3.5 h-3.5 text-muted-foreground/60" />}
            </button>
            <span className={cn('text-xs truncate flex-1', !l.visible && 'text-muted-foreground/40')}>{l.name}</span>
          </div>
        ))}

        {/* Blend mode & opacity for active layer */}
        <div className="border-t border-border/20 pt-2 mt-2 px-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Opacity</span>
            <span className="text-[10px] text-muted-foreground">100%</span>
          </div>
          <Slider defaultValue={[100]} max={100} step={1} className="w-full" />
        </div>
      </div>
    </ScrollArea>
  );
}

export function IllustratorAssetsPanel() {
  const [activeSection, setActiveSection] = useState('swatches');
  const sections = [
    { id: 'swatches', label: 'Swatches' },
    { id: 'gradients', label: 'Gradients' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'brushes', label: 'Brushes' },
    { id: 'symbols', label: 'Symbols' },
  ];

  const swatchColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280', '#1a1a2e',
    '#f472b6', '#a78bfa', '#67e8f9', '#4ade80', '#fbbf24', '#fb923c',
    '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb',
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {/* Section tabs */}
        <div className="flex flex-wrap gap-0.5">
          {sections.map(s => (
            <Button
              key={s.id}
              variant={activeSection === s.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(s.id)}
              className={cn('h-6 text-[10px] px-2', activeSection === s.id && 'bg-primary/15 text-primary')}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {activeSection === 'swatches' && (
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-1.5 p-1">
              {swatchColors.map(c => (
                <button
                  key={c}
                  className="w-full aspect-square rounded-md border border-border/30 hover:scale-110 hover:ring-2 hover:ring-primary/50 transition-all shadow-sm"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs h-7 gap-1.5">
              <Plus className="w-3 h-3" /> Add Color
            </Button>
          </div>
        )}

        {activeSection === 'gradients' && (
          <div className="grid grid-cols-3 gap-1.5 p-1">
            {[
              'linear-gradient(135deg, #ef4444, #f97316)',
              'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              'linear-gradient(135deg, #22c55e, #06b6d4)',
              'linear-gradient(135deg, #ec4899, #8b5cf6)',
              'radial-gradient(circle, #fbbf24, #ea580c)',
              'linear-gradient(180deg, #1a1a2e, #3b82f6)',
            ].map((g, i) => (
              <button key={i} className="aspect-square rounded-lg border border-border/30 hover:ring-2 hover:ring-primary/50 transition-all" style={{ background: g }} />
            ))}
          </div>
        )}

        {activeSection === 'brushes' && (
          <div className="space-y-1">
            {['Round', 'Flat', 'Calligraphy', 'Scatter', 'Art', 'Pattern'].map(b => (
              <Button key={b} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
                <Paintbrush className="w-3.5 h-3.5 text-muted-foreground" /> {b}
              </Button>
            ))}
          </div>
        )}

        {(activeSection === 'patterns' || activeSection === 'symbols') && (
          <div className="grid grid-cols-3 gap-1.5 p-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted/20 border border-border/20 flex items-center justify-center cursor-pointer hover:border-primary/50">
                <Palette className="w-5 h-5 text-muted-foreground/20" />
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// IMAGE EDITOR DRAWER PANELS (Perfected)
// ============================================================

export function ImageGalleryPanel() {
  const [activeTab, setActiveTab] = useState('recent');
  const tabs = [
    { id: 'recent', label: 'Recent' },
    { id: 'imports', label: 'Imports' },
    { id: 'generated', label: 'AI Generated' },
  ];
  const recentImages = [
    { name: 'hero-banner.png', size: '2.4 MB', dims: '1920×1080' },
    { name: 'icon-set.svg', size: '128 KB', dims: '512×512' },
    { name: 'photo-edit.jpg', size: '3.1 MB', dims: '4032×3024' },
    { name: 'texture-01.png', size: '1.8 MB', dims: '2048×2048' },
    { name: 'gradient-bg.png', size: '450 KB', dims: '1920×1080' },
    { name: 'avatar.png', size: '85 KB', dims: '256×256' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Upload className="w-3.5 h-3.5" /> Open Image
        </Button>
        <div className="flex gap-0.5 bg-muted/20 rounded-lg p-0.5">
          {tabs.map(t => (
            <Button key={t.id} variant={activeTab === t.id ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setActiveTab(t.id)}
              className={cn('flex-1 h-6 text-[10px]', activeTab === t.id && 'bg-primary/15 text-primary')}
            >{t.label}</Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {recentImages.map((img, i) => (
            <button key={i} className="group relative aspect-square rounded-lg bg-muted/20 border border-border/20 hover:border-primary/50 transition-all overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground/20" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] font-medium truncate">{img.name}</p>
                <p className="text-[8px] text-muted-foreground">{img.dims}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-1 text-[10px] text-muted-foreground/50">{recentImages.length} images · {activeTab}</div>
      </div>
    </ScrollArea>
  );
}

export function ImageLayersPanel() {
  const [layers, setLayers] = useState([
    { id: 'adj', name: 'Curves Adjustment', type: 'adjustment', opacity: 80, visible: true, locked: false, blend: 'Normal' },
    { id: 'l2', name: 'Retouching', type: 'layer', opacity: 100, visible: true, locked: false, blend: 'Normal' },
    { id: 'l1', name: 'Layer 1', type: 'layer', opacity: 100, visible: true, locked: false, blend: 'Normal' },
    { id: 'bg', name: 'Background', type: 'layer', opacity: 100, visible: true, locked: true, blend: 'Normal' },
  ]);
  const [activeLayer, setActiveLayer] = useState('l1');
  const activeData = layers.find(l => l.id === activeLayer);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Layers</span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Add Layer"><Plus className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Duplicate"><Copy className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Merge Down"><Layers className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Delete"><Trash2 className="w-3 h-3" /></Button>
          </div>
        </div>
        {layers.map(l => (
          <div
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-2 rounded-lg transition-all cursor-pointer group',
              activeLayer === l.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
            )}
          >
            <GripVertical className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground shrink-0" />
            <button onClick={(e) => { e.stopPropagation(); setLayers(prev => prev.map(x => x.id === l.id ? { ...x, visible: !x.visible } : x)); }}>
              {l.visible ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />}
            </button>
            <div className="w-8 h-6 rounded bg-muted/30 border border-border/20 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs truncate', !l.visible && 'text-muted-foreground/40')}>{l.name}</p>
              <p className="text-[9px] text-muted-foreground">{l.blend} · {l.opacity}%</p>
            </div>
            {l.locked && <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
          </div>
        ))}

        {/* Active layer properties */}
        {activeData && (
          <div className="border-t border-border/20 pt-2 mt-2 px-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Opacity</span>
              <span className="text-[10px] font-mono text-muted-foreground">{activeData.opacity}%</span>
            </div>
            <Slider defaultValue={[activeData.opacity]} max={100} step={1} className="w-full" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Blend Mode</span>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">{activeData.blend}</Badge>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function ImageAdjustPanel() {
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [exposure, setExposure] = useState([0]);
  const [highlights, setHighlights] = useState([0]);
  const [shadows, setShadows] = useState([0]);
  const [temperature, setTemperature] = useState([6500]);
  const [sharpness, setSharpness] = useState([0]);

  const adjustments = [
    { label: 'Exposure', value: exposure, set: setExposure, min: -100, max: 100, unit: '' },
    { label: 'Brightness', value: brightness, set: setBrightness, min: 0, max: 200, unit: '' },
    { label: 'Contrast', value: contrast, set: setContrast, min: 0, max: 200, unit: '' },
    { label: 'Highlights', value: highlights, set: setHighlights, min: -100, max: 100, unit: '' },
    { label: 'Shadows', value: shadows, set: setShadows, min: -100, max: 100, unit: '' },
    { label: 'Saturation', value: saturation, set: setSaturation, min: 0, max: 200, unit: '' },
    { label: 'Temperature', value: temperature, set: setTemperature, min: 2000, max: 10000, unit: 'K' },
    { label: 'Sharpness', value: sharpness, set: setSharpness, min: 0, max: 100, unit: '' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Adjustments</p>
          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-primary">Reset All</Button>
        </div>
        {adjustments.map(s => (
          <div key={s.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">{s.label}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{s.value[0]}{s.unit}</span>
            </div>
            <Slider value={s.value} onValueChange={s.set} min={s.min} max={s.max} step={1} className="w-full" />
          </div>
        ))}

        {/* Presets */}
        <div className="border-t border-border/20 pt-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Presets</p>
          {['Auto Enhance', 'Vivid', 'Cinematic', 'B&W', 'Warm Sunset', 'Cool Blue'].map(p => (
            <Button key={p} variant="ghost" size="sm" className="w-full justify-start h-7 px-2 text-xs gap-2">
              <Palette className="w-3.5 h-3.5 text-muted-foreground" /> {p}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function ImageAIToolsPanel() {
  const tools = [
    { label: 'Remove Background', desc: 'AI-powered background removal', icon: Scissors, status: 'ready' },
    { label: 'Auto Enhance', desc: 'One-click quality improvement', icon: Sparkles, status: 'ready' },
    { label: 'Upscale 2×', desc: 'AI super-resolution upscaling', icon: ZoomIn, status: 'ready' },
    { label: 'Inpaint / Remove', desc: 'Remove unwanted objects', icon: Eraser, status: 'ready' },
    { label: 'Style Transfer', desc: 'Apply artistic styles', icon: Palette, status: 'ready' },
    { label: 'Generative Fill', desc: 'AI-fill selected regions', icon: Wand2, status: 'beta' },
    { label: 'Face Retouch', desc: 'Auto skin smoothing', icon: Sparkles, status: 'ready' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">AI Tools</p>
        {tools.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.label} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-muted/25 transition-all group border border-transparent hover:border-border/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium">{t.label}</p>
                  {t.status === 'beta' && <Badge className="bg-primary/20 text-primary text-[8px] px-1 h-3.5">BETA</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// AUDIO EDITOR DRAWER PANELS (Perfected)
// ============================================================

export function AudioTracksPanel() {
  const [tracks, setTracks] = useState([
    { id: 't1', name: 'Vocals', color: 'hsl(var(--primary))', muted: false, solo: false, volume: 80, pan: 0 },
    { id: 't2', name: 'Guitar', color: 'hsl(150, 100%, 60%)', muted: false, solo: false, volume: 65, pan: -20 },
    { id: 't3', name: 'Drums', color: 'hsl(45, 100%, 65%)', muted: true, solo: false, volume: 90, pan: 0 },
    { id: 't4', name: 'Bass', color: 'hsl(270, 80%, 60%)', muted: false, solo: false, volume: 70, pan: 10 },
    { id: 't5', name: 'Synth Pad', color: 'hsl(210, 80%, 60%)', muted: false, solo: false, volume: 45, pan: -30 },
  ]);
  const [activeTrack, setActiveTrack] = useState('t1');

  const toggleMute = (id: string) => setTracks(prev => prev.map(t => t.id === id ? { ...t, muted: !t.muted } : t));
  const toggleSolo = (id: string) => setTracks(prev => prev.map(t => t.id === id ? { ...t, solo: !t.solo } : t));

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Tracks ({tracks.length})</span>
          <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
        </div>

        {tracks.map(t => (
          <div
            key={t.id}
            onClick={() => setActiveTrack(t.id)}
            className={cn(
              'px-2 py-2 rounded-lg transition-all cursor-pointer',
              activeTrack === t.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: t.color }} />
              <span className={cn('text-xs flex-1 font-medium', t.muted && 'text-muted-foreground/50 line-through')}>{t.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(t.id); }}
                className={cn('text-[9px] font-bold w-5 h-5 rounded flex items-center justify-center', t.muted ? 'bg-destructive/20 text-destructive' : 'hover:bg-muted/30 text-muted-foreground')}
              >M</button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSolo(t.id); }}
                className={cn('text-[9px] font-bold w-5 h-5 rounded flex items-center justify-center', t.solo ? 'bg-[hsl(45,100%,65%)]/20 text-[hsl(45,100%,65%)]' : 'hover:bg-muted/30 text-muted-foreground')}
              >S</button>
            </div>
            {activeTrack === t.id && (
              <div className="mt-2 space-y-1.5 pl-3.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
                  <Slider defaultValue={[t.volume]} max={100} step={1} className="flex-1" />
                  <span className="text-[9px] text-muted-foreground w-6 text-right">{t.volume}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-3 shrink-0">P</span>
                  <Slider defaultValue={[t.pan + 50]} max={100} step={1} className="flex-1" />
                  <span className="text-[9px] text-muted-foreground w-6 text-right">{t.pan > 0 ? `R${t.pan}` : t.pan < 0 ? `L${Math.abs(t.pan)}` : 'C'}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Master */}
        <div className="border-t border-border/20 pt-2 mt-2">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Master</span>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground font-mono">-3.2 dB</span>
          </div>
          <div className="px-2 mt-1">
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden flex gap-px">
              <div className="h-full bg-[hsl(150,100%,60%)] rounded-l-full" style={{ width: '60%' }} />
              <div className="h-full bg-[hsl(45,100%,65%)]" style={{ width: '15%' }} />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export function AudioEffectsPanel() {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const chain = [
    { id: 'eq', name: 'Parametric EQ', active: true, preset: '10-Band' },
    { id: 'comp', name: 'Compressor', active: true, preset: 'Vocal Squeeze' },
    { id: 'reverb', name: 'Reverb', active: true, preset: 'Large Hall' },
    { id: 'delay', name: 'Delay', active: false, preset: 'Stereo Ping' },
    { id: 'chorus', name: 'Chorus', active: false, preset: 'Default' },
    { id: 'limiter', name: 'Limiter', active: true, preset: '-1 dB Ceiling' },
  ];
  const available = ['Distortion', 'Flanger', 'Phaser', 'Noise Gate', 'De-Esser', 'Pitch Shift'];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Effects Chain</p>
        {chain.map((fx, i) => (
          <div
            key={fx.id}
            onClick={() => setActiveEffect(activeEffect === fx.id ? null : fx.id)}
            className={cn(
              'px-2.5 py-2 rounded-lg transition-all cursor-pointer border',
              activeEffect === fx.id ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted/20 border-transparent',
            )}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-3 h-3 text-muted-foreground/20 shrink-0" />
              <span className="text-[10px] font-mono text-muted-foreground/40 w-3">{i + 1}</span>
              <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', fx.active ? 'bg-[hsl(150,100%,60%)]' : 'bg-muted-foreground/30')} />
              <span className="text-xs font-medium flex-1">{fx.name}</span>
              <Checkbox checked={fx.active} className="w-3.5 h-3.5" />
            </div>
            {activeEffect === fx.id && (
              <div className="mt-2 pl-8 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Preset:</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{fx.preset}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Edit</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-destructive">Remove</Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Add Effect</p>
          {available.map(fx => (
            <Button key={fx} variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
              <Plus className="w-3 h-3 text-primary" /> {fx}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function AudioLibraryPanel() {
  const [activeCategory, setActiveCategory] = useState('drums');
  const categories = [
    { id: 'drums', label: 'Drums', count: 24 },
    { id: 'synths', label: 'Synths', count: 18 },
    { id: 'vocals', label: 'Vocals', count: 12 },
    { id: 'sfx', label: 'SFX', count: 32 },
    { id: 'loops', label: 'Loops', count: 15 },
  ];
  const samples: Record<string, Array<{name: string; dur: string; bpm?: number}>> = {
    drums: [
      { name: 'Kick 808', dur: '0:02', bpm: 120 },
      { name: 'Snare Tight', dur: '0:01' },
      { name: 'Hi-Hat Closed', dur: '0:01' },
      { name: 'Clap Analog', dur: '0:01' },
      { name: 'Tom Floor', dur: '0:02' },
    ],
    synths: [
      { name: 'Pad Warm', dur: '0:08' },
      { name: 'Lead Saw', dur: '0:04' },
      { name: 'Bass Sub', dur: '0:03' },
    ],
    vocals: [
      { name: 'Vocal Chop A', dur: '0:03' },
      { name: 'Harmony Stack', dur: '0:05' },
    ],
    sfx: [
      { name: 'Riser Sweep', dur: '0:04' },
      { name: 'Impact Hit', dur: '0:02' },
    ],
    loops: [
      { name: 'Drum Loop 120', dur: '0:04', bpm: 120 },
      { name: 'Guitar Riff', dur: '0:08', bpm: 95 },
    ],
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Input placeholder="Search samples..." className="text-xs h-7 bg-muted/20 border-border/30" />

        <div className="flex flex-wrap gap-0.5">
          {categories.map(c => (
            <Button key={c.id} variant={activeCategory === c.id ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setActiveCategory(c.id)}
              className={cn('h-6 text-[10px] px-2', activeCategory === c.id && 'bg-primary/15 text-primary')}
            >{c.label} <span className="text-muted-foreground ml-0.5">{c.count}</span></Button>
          ))}
        </div>

        <div className="space-y-0.5">
          {(samples[activeCategory] || []).map(s => (
            <div key={s.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 cursor-pointer group">
              <button className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 shrink-0">
                <Play className="w-3 h-3 text-primary" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{s.name}</p>
                <p className="text-[9px] text-muted-foreground">{s.dur}{s.bpm ? ` · ${s.bpm} BPM` : ''}</p>
              </div>
              <Button variant="ghost" size="icon" className="w-5 h-5 opacity-0 group-hover:opacity-100"><Plus className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// VIDEO EDITOR DRAWER PANELS (Perfected)
// ============================================================

export function VideoTimelinePanel() {
  const [activeClip, setActiveClip] = useState('c1');
  const clips = [
    { id: 'c1', name: 'Intro.mp4', duration: '0:05', type: 'video', size: '12 MB', fps: 30 },
    { id: 'c2', name: 'Main Content.mp4', duration: '2:30', type: 'video', size: '245 MB', fps: 60 },
    { id: 'c3', name: 'B-Roll_01.mp4', duration: '0:15', type: 'video', size: '38 MB', fps: 30 },
    { id: 'c4', name: 'Outro.mp4', duration: '0:10', type: 'video', size: '18 MB', fps: 30 },
    { id: 'c5', name: 'BGM.mp3', duration: '3:00', type: 'audio', size: '8 MB' },
    { id: 'c6', name: 'Voiceover.wav', duration: '2:45', type: 'audio', size: '32 MB' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Upload className="w-3.5 h-3.5" /> Import Media
        </Button>

        {/* Project stats */}
        <div className="bg-muted/15 rounded-lg px-3 py-2 grid grid-cols-3 gap-2">
          <div><p className="text-[10px] text-muted-foreground">Duration</p><p className="text-xs font-semibold">5:45</p></div>
          <div><p className="text-[10px] text-muted-foreground">Clips</p><p className="text-xs font-semibold">{clips.length}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Size</p><p className="text-xs font-semibold">353 MB</p></div>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Timeline</p>
          {clips.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveClip(c.id)}
              className={cn(
                'w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg transition-all',
                activeClip === c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              {c.type === 'video' ? <Film className="w-4 h-4 text-primary shrink-0" /> : <Music className="w-4 h-4 text-[hsl(150,100%,60%)] shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {c.duration} · {c.size}{'fps' in c ? ` · ${c.fps}fps` : ''}
                </p>
              </div>
              <GripVertical className="w-3 h-3 text-muted-foreground/20 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function VideoClipsPanel() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex items-center gap-1">
          <Input placeholder="Search clips..." className="text-xs h-7 bg-muted/20 border-border/30 flex-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex gap-0.5 flex-wrap">
          {['All', 'Video', 'Audio', 'Image'].map(f => (
            <Badge key={f} variant="outline" className="text-[10px] px-1.5 h-5 cursor-pointer hover:bg-primary/10">{f}</Badge>
          ))}
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <button key={i} className="group relative aspect-video rounded-lg bg-muted/20 border border-border/20 hover:border-primary/50 transition-all overflow-hidden">
                <Film className="w-5 h-5 text-muted-foreground/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 bg-background/70 px-1 py-0.5 rounded-tl text-[8px] font-mono text-muted-foreground">0:{String(i * 5 + 3).padStart(2, '0')}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {['Clip_001.mp4', 'Clip_002.mp4', 'BGM.mp3', 'Logo.png'].map(name => (
              <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 text-xs">
                <Film className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function VideoEffectsPanel() {
  const [activeCategory, setActiveCategory] = useState('transitions');
  const categories = ['Transitions', 'Color', 'Motion', 'Text', 'Audio'];
  const effects: Record<string, string[]> = {
    transitions: ['Fade In', 'Fade Out', 'Cross Dissolve', 'Slide Left', 'Zoom In', 'Wipe'],
    color: ['Color Grade', 'LUT Import', 'HSL Adjust', 'Curves', 'Vignette'],
    motion: ['Speed Ramp', 'Stabilize', 'Ken Burns', 'Zoom Pan', 'Shake'],
    text: ['Title', 'Lower Third', 'Caption', 'Credits'],
    audio: ['Fade Audio', 'Normalize', 'Noise Reduce', 'Ducking'],
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex flex-wrap gap-0.5">
          {categories.map(c => (
            <Button key={c} variant={activeCategory === c.toLowerCase() ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setActiveCategory(c.toLowerCase())}
              className={cn('h-6 text-[10px] px-2', activeCategory === c.toLowerCase() && 'bg-primary/15 text-primary')}
            >{c}</Button>
          ))}
        </div>

        <div className="space-y-0.5">
          {(effects[activeCategory] || []).map(fx => (
            <button key={fx} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/25 transition-all group">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs flex-1">{fx}</span>
              <Plus className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// ORCHESTRATION DRAWER PANELS (Perfected)
// ============================================================

export function OrchestrationTasksPanel() {
  const [activeTask, setActiveTask] = useState('t1');
  const tasks = [
    { id: 't1', name: 'Data Pipeline', status: 'running', progress: 65, agent: 'ETL-Agent', started: '2m ago', eta: '~3m' },
    { id: 't2', name: 'Model Training', status: 'queued', progress: 0, agent: 'ML-Agent', started: null, eta: '~15m' },
    { id: 't3', name: 'Validation Suite', status: 'completed', progress: 100, agent: 'QA-Agent', started: '10m ago', eta: null },
    { id: 't4', name: 'Deployment', status: 'waiting', progress: 0, agent: 'DevOps-Agent', started: null, eta: '~5m' },
    { id: 't5', name: 'Monitoring Setup', status: 'failed', progress: 30, agent: 'Ops-Agent', started: '5m ago', eta: null },
  ];

  const statusColors: Record<string, string> = {
    running: 'text-primary border-primary/30',
    completed: 'text-[hsl(150,100%,60%)] border-[hsl(150,100%,60%)]/30',
    queued: 'text-muted-foreground border-muted-foreground/30',
    waiting: 'text-[hsl(45,100%,65%)] border-[hsl(45,100%,65%)]/30',
    failed: 'text-destructive border-destructive/30',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Run', val: '1', color: 'text-primary' },
            { label: 'Done', val: '1', color: 'text-[hsl(150,100%,60%)]' },
            { label: 'Queue', val: '2', color: 'text-muted-foreground' },
            { label: 'Fail', val: '1', color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="bg-muted/15 rounded-lg px-2 py-1.5 text-center">
              <p className={cn('text-lg font-bold', s.color)}>{s.val}</p>
              <p className="text-[8px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-0.5">
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTask(t.id)}
              className={cn(
                'w-full text-left px-2.5 py-2 rounded-lg transition-all',
                activeTask === t.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{t.name}</span>
                <Badge variant="outline" className={cn('text-[9px] px-1 h-4', statusColors[t.status])}>{t.status}</Badge>
              </div>
              {t.status === 'running' && <Progress value={t.progress} className="h-1 mb-1" />}
              {activeTask === t.id && (
                <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1.5">
                  <p>Agent: <span className="font-mono text-foreground/80">{t.agent}</span></p>
                  {t.started && <p>Started: {t.started}</p>}
                  {t.eta && <p>ETA: {t.eta}</p>}
                  {t.status === 'failed' && <p className="text-destructive">Error: Connection timeout</p>}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function OrchestrationRunsPanel() {
  const runs = [
    { id: 'RUN-001', time: '2m ago', status: 'success', duration: '4m 12s', tasks: 5 },
    { id: 'RUN-002', time: '15m ago', status: 'failed', duration: '2m 05s', tasks: 3 },
    { id: 'RUN-003', time: '1h ago', status: 'success', duration: '8m 30s', tasks: 8 },
    { id: 'RUN-004', time: '3h ago', status: 'success', duration: '3m 45s', tasks: 4 },
    { id: 'RUN-005', time: '6h ago', status: 'cancelled', duration: '1m 10s', tasks: 2 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Run History</p>
        {runs.map(r => (
          <button key={r.id} className="w-full text-left flex items-center gap-2 px-2.5 py-2.5 rounded-lg hover:bg-muted/20 transition-all">
            <div className={cn('w-2 h-2 rounded-full shrink-0',
              r.status === 'success' ? 'bg-[hsl(150,100%,60%)]' : r.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-medium">{r.id}</span>
                <Badge variant="outline" className={cn('text-[8px] px-1 h-3.5',
                  r.status === 'success' ? 'text-[hsl(150,100%,60%)] border-[hsl(150,100%,60%)]/30' :
                  r.status === 'failed' ? 'text-destructive border-destructive/30' : 'text-muted-foreground'
                )}>{r.status}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{r.duration} · {r.tasks} tasks · {r.time}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function OrchestrationWorkflowsPanel() {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const workflows = [
    { id: 'w1', name: 'CI/CD Pipeline', nodes: 8, lastRun: '2m ago', status: 'active' },
    { id: 'w2', name: 'Data ETL', nodes: 5, lastRun: '1h ago', status: 'active' },
    { id: 'w3', name: 'AI Training', nodes: 12, lastRun: '3h ago', status: 'paused' },
    { id: 'w4', name: 'Deployment', nodes: 6, lastRun: '1d ago', status: 'active' },
    { id: 'w5', name: 'Nightly Tests', nodes: 4, lastRun: '12h ago', status: 'active' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Workflow
        </Button>

        <div className="space-y-0.5">
          {workflows.map(w => (
            <button
              key={w.id}
              onClick={() => { setActiveWorkflow(w.id); emitPageDrawerAction({ page: 'orchestration', action: 'open-workflow', value: w.id }); }}
              className={cn(
                'w-full text-left px-2.5 py-2.5 rounded-lg transition-all',
                activeWorkflow === w.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Workflow className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium flex-1">{w.name}</span>
                <div className={cn('w-1.5 h-1.5 rounded-full', w.status === 'active' ? 'bg-[hsl(150,100%,60%)]' : 'bg-muted-foreground')} />
              </div>
              <p className="text-[10px] text-muted-foreground pl-5">{w.nodes} nodes · Last run {w.lastRun}</p>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Templates</p>
          {['Basic Pipeline', 'Fan-Out/Fan-In', 'Conditional Branch'].map(t => (
            <Button key={t} variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
              <LayoutDashboard className="w-3 h-3 text-muted-foreground" /> {t}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// DOCUMENTS DRAWER PANELS (Perfected)
// ============================================================

export function DocumentsStoragePanel() {
  const [activeFolder, setActiveFolder] = useState('arch');
  const folders = [
    { id: 'arch', name: 'Architecture Docs', count: 5, icon: FolderOpen, color: 'text-primary' },
    { id: 'api', name: 'API Specifications', count: 3, icon: Folder, color: 'text-amber-400' },
    { id: 'meeting', name: 'Meeting Notes', count: 12, icon: Folder, color: 'text-[hsl(270,80%,60%)]' },
    { id: 'research', name: 'Research Papers', count: 8, icon: Folder, color: 'text-[hsl(150,100%,60%)]' },
    { id: 'drafts', name: 'Drafts', count: 2, icon: Folder, color: 'text-muted-foreground' },
  ];
  const recentDocs = [
    { name: 'ARCHITECTURE.md', modified: '2h ago', size: '16 KB' },
    { name: 'API_REFERENCE.md', modified: '4h ago', size: '32 KB' },
    { name: 'Sprint_Review.md', modified: '1d ago', size: '8 KB' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex gap-1">
          <Button size="sm" className="flex-1 h-8 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New</Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" /> Upload</Button>
        </div>

        {/* Storage overview */}
        <div className="bg-muted/15 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Storage used</span>
            <span className="text-[10px] font-mono text-muted-foreground">2.4 GB / 10 GB</span>
          </div>
          <Progress value={24} className="h-1" />
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Folders</p>
          {folders.map(f => {
            const Icon = f.icon;
            const isActive = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFolder(f.id); emitPageDrawerAction({ page: 'documents', action: 'folder', value: f.id }); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all',
                  isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : f.color)} />
                <span className="flex-1 text-left font-medium">{f.name}</span>
                <Badge variant="outline" className="text-[10px] px-1 h-4">{f.count}</Badge>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Recent Documents</p>
          {recentDocs.map(d => (
            <button key={d.name} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{d.name}</p>
                <p className="text-[10px] text-muted-foreground">{d.size} · {d.modified}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function DocumentsTagsPanel() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = [
    { name: 'Architecture', count: 8, color: 'hsl(var(--primary))' },
    { name: 'API', count: 5, color: 'hsl(210, 80%, 60%)' },
    { name: 'Design', count: 4, color: 'hsl(270, 80%, 60%)' },
    { name: 'Research', count: 6, color: 'hsl(150, 100%, 60%)' },
    { name: 'Core', count: 3, color: 'hsl(45, 100%, 65%)' },
    { name: 'Deprecated', count: 1, color: 'hsl(0, 60%, 50%)' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Tags</span>
          <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
        </div>
        <div className="space-y-0.5">
          {tags.map(t => (
            <button
              key={t.name}
              onClick={() => setActiveTag(activeTag === t.name ? null : t.name)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all',
                activeTag === t.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
              )}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
              <span className="flex-1 text-left">{t.name}</span>
              <Badge variant="outline" className="text-[10px] px-1 h-4">{t.count}</Badge>
            </button>
          ))}
        </div>

        {/* Tag cloud */}
        <div className="border-t border-border/20 pt-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-2">Cloud</p>
          <div className="flex flex-wrap gap-1 px-1">
            {tags.map(t => (
              <Badge key={t.name} variant="outline" className="text-[10px] px-2 h-5 cursor-pointer hover:bg-primary/10"
                style={{ borderColor: t.color + '40' }}
              >{t.name}</Badge>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// MAP DRAWER PANELS (Perfected)
// ============================================================

export function MapLayersPanel() {
  const [layers, setLayers] = useState([
    { id: 'streets', name: 'Streets', enabled: true, type: 'base' },
    { id: 'satellite', name: 'Satellite', enabled: false, type: 'base' },
    { id: 'terrain', name: 'Terrain', enabled: false, type: 'base' },
    { id: 'traffic', name: 'Traffic', enabled: false, type: 'overlay' },
    { id: 'transit', name: 'Transit', enabled: true, type: 'overlay' },
    { id: 'bike', name: 'Bike Lanes', enabled: false, type: 'overlay' },
    { id: 'labels', name: 'Labels', enabled: true, type: 'overlay' },
  ]);

  const toggleLayer = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  const baseLayers = layers.filter(l => l.type === 'base');
  const overlays = layers.filter(l => l.type === 'overlay');

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {/* Base map styles */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Map Style</p>
          <div className="grid grid-cols-3 gap-1.5">
            {baseLayers.map(l => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={cn(
                  'aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 text-center transition-all',
                  l.enabled ? 'border-primary bg-primary/10' : 'border-border/30 hover:border-primary/50',
                )}
              >
                <Map className={cn('w-5 h-5', l.enabled ? 'text-primary' : 'text-muted-foreground/40')} />
                <span className="text-[9px]">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overlays */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Overlays</p>
          {overlays.map(l => (
            <div key={l.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/20">
              <Checkbox checked={l.enabled} onCheckedChange={() => toggleLayer(l.id)} className="w-3.5 h-3.5" />
              <span className={cn('text-xs flex-1', !l.enabled && 'text-muted-foreground')}>{l.name}</span>
              {l.enabled && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
          ))}
        </div>

        {/* Map controls */}
        <div className="border-t border-border/20 pt-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Controls</p>
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Navigation className="w-3.5 h-3.5 text-primary" /> My Location
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Magnet className="w-3.5 h-3.5 text-muted-foreground" /> Snap to Grid
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export function MapPlacesPanel() {
  const [activePlace, setActivePlace] = useState<string | null>(null);
  const saved = [
    { id: 'p1', name: 'Home', address: '123 Main St, San Francisco', lat: 37.78, lng: -122.41, icon: '🏠' },
    { id: 'p2', name: 'Office', address: '456 Business Ave, Palo Alto', lat: 37.44, lng: -122.14, icon: '🏢' },
    { id: 'p3', name: 'Gym', address: '789 Fitness Blvd, San Jose', lat: 37.33, lng: -121.89, icon: '💪' },
    { id: 'p4', name: 'Park', address: 'Golden Gate Park, SF', lat: 37.77, lng: -122.48, icon: '🌳' },
  ];
  const recent = [
    { name: 'Coffee Shop', address: '321 Brew Lane' },
    { name: 'Library', address: '654 Knowledge Dr' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search places..." className="pl-8 h-7 text-xs bg-muted/20 border-border/30" />
        </div>

        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Save Place
        </Button>

        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Saved Places</p>
          {saved.map(p => (
            <button
              key={p.id}
              onClick={() => { setActivePlace(p.id); emitPageDrawerAction({ page: 'map', action: 'goto-place', value: p.id }); }}
              className={cn(
                'w-full text-left px-2.5 py-2 rounded-lg transition-all',
                activePlace === p.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.address}</p>
                </div>
                <MapPin className="w-3 h-3 text-primary shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Recent</p>
          {recent.map(r => (
            <button key={r.name} className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/20 text-xs">
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.address}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// SPREADSHEET DRAWER PANELS (Perfected)
// ============================================================

export function SpreadsheetSheetsPanel() {
  const [activeSheet, setActiveSheet] = useState('s1');
  const sheets = [
    { id: 's1', name: 'Sheet 1', rows: 1000, cols: 26, active: true, color: 'hsl(var(--primary))' },
    { id: 's2', name: 'Data Import', rows: 500, cols: 12, active: false, color: 'hsl(150, 100%, 60%)' },
    { id: 's3', name: 'Summary', rows: 50, cols: 8, active: false, color: 'hsl(270, 80%, 60%)' },
    { id: 's4', name: 'Charts', rows: 10, cols: 4, active: false, color: 'hsl(45, 100%, 65%)' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Sheet
        </Button>

        <div className="space-y-0.5">
          {sheets.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSheet(s.id); emitPageDrawerAction({ page: 'spreadsheet', action: 'switch-sheet', value: s.id }); }}
              className={cn(
                'w-full text-left px-2.5 py-2 rounded-lg transition-all',
                activeSheet === s.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: s.color }} />
                <Table2 className={cn('w-3.5 h-3.5 shrink-0', activeSheet === s.id ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.rows}×{s.cols} cells</p>
                </div>
                <MoreHorizontal className="w-3 h-3 text-muted-foreground/30" />
              </div>
            </button>
          ))}
        </div>

        {/* Sheet actions */}
        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Duplicate Sheet
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Download className="w-3.5 h-3.5 text-muted-foreground" /> Export CSV
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export function SpreadsheetFormulasPanel() {
  const [activeCategory, setActiveCategory] = useState('math');
  const categories = [
    { id: 'math', label: 'Math', formulas: ['SUM', 'AVERAGE', 'MAX', 'MIN', 'ROUND', 'ABS'] },
    { id: 'stats', label: 'Statistics', formulas: ['COUNT', 'COUNTIF', 'STDEV', 'MEDIAN', 'MODE'] },
    { id: 'text', label: 'Text', formulas: ['CONCAT', 'LEFT', 'RIGHT', 'TRIM', 'UPPER', 'LOWER'] },
    { id: 'date', label: 'Date', formulas: ['TODAY', 'NOW', 'DATEDIF', 'YEAR', 'MONTH'] },
    { id: 'lookup', label: 'Lookup', formulas: ['VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH'] },
    { id: 'logical', label: 'Logical', formulas: ['IF', 'AND', 'OR', 'NOT', 'IFS'] },
    { id: 'financial', label: 'Financial', formulas: ['PMT', 'FV', 'NPV', 'IRR'] },
  ];

  const active = categories.find(c => c.id === activeCategory);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Input placeholder="Search formulas..." className="text-xs h-7 bg-muted/20 border-border/30" />

        <div className="flex flex-wrap gap-0.5">
          {categories.map(c => (
            <Button key={c.id} variant={activeCategory === c.id ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setActiveCategory(c.id)}
              className={cn('h-6 text-[10px] px-2', activeCategory === c.id && 'bg-primary/15 text-primary')}
            >{c.label}</Button>
          ))}
        </div>

        <div className="space-y-0.5">
          {active?.formulas.map(f => (
            <button key={f} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/25 transition-all group">
              <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-mono font-medium flex-1">{f}()</span>
              <Plus className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// NOTES DRAWER PANELS (Perfected)
// ============================================================

export function NotesListPanel() {
  const [activeNote, setActiveNote] = useState('n1');
  const [sortBy, setSortBy] = useState<'modified' | 'title'>('modified');
  const notes = [
    { id: 'n1', title: 'Architecture Notes', modified: '2m ago', preview: 'Key decisions on the LUCID OS layout...', tags: ['architecture'], pinned: true },
    { id: 'n2', title: 'Meeting Notes', modified: '1h ago', preview: 'Sprint planning outcomes and action items...', tags: ['sprint'], pinned: true },
    { id: 'n3', title: 'Research Links', modified: '3h ago', preview: 'Papers on AGI and multi-modal processing...', tags: ['research', 'AI'], pinned: false },
    { id: 'n4', title: 'Daily Journal', modified: '1d ago', preview: 'Progress update on drawer system...', tags: ['personal'], pinned: false },
    { id: 'n5', title: 'API Design Ideas', modified: '2d ago', preview: 'RESTful patterns for orchestration...', tags: ['api'], pinned: false },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex gap-1">
          <Button size="sm" className="flex-1 h-8 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> New Note</Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSortBy(sortBy === 'modified' ? 'title' : 'modified')}>
            <ArrowDown className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search notes..." className="pl-8 h-7 text-xs bg-muted/20 border-border/30" />
        </div>

        <div className="space-y-0.5">
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => { setActiveNote(n.id); emitPageDrawerAction({ page: 'notes', action: 'open-note', value: n.id }); }}
              className={cn(
                'w-full text-left px-2.5 py-2.5 rounded-lg transition-all',
                activeNote === n.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
              )}
            >
              <div className="flex items-start gap-1.5">
                {n.pinned && <Star className="w-3 h-3 text-amber-400 fill-amber-400 mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{n.preview}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] text-muted-foreground/60">{n.modified}</span>
                    {n.tags.map(t => (
                      <Badge key={t} variant="outline" className="text-[8px] px-1 h-3.5">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function NotesGraphPanel() {
  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase">Knowledge Graph</p>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5">5 notes · 8 links</Badge>
      </div>
      <div className="flex-1 bg-muted/10 rounded-xl border border-border/20 relative overflow-hidden">
        {/* Simulated graph nodes */}
        {[
          { x: 50, y: 35, label: 'Architecture', primary: true },
          { x: 25, y: 60, label: 'Meeting', primary: false },
          { x: 75, y: 55, label: 'Research', primary: false },
          { x: 40, y: 80, label: 'Journal', primary: false },
          { x: 65, y: 25, label: 'API', primary: false },
        ].map((node, i) => (
          <div key={i} className="absolute flex flex-col items-center" style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}>
            <div className={cn('w-4 h-4 rounded-full border-2', node.primary ? 'bg-primary border-primary' : 'bg-muted border-border')} />
            <span className="text-[8px] text-muted-foreground mt-0.5">{node.label}</span>
          </div>
        ))}
        {/* Connection lines hint */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <line x1="50%" y1="35%" x2="25%" y2="60%" stroke="currentColor" strokeWidth="1" />
          <line x1="50%" y1="35%" x2="75%" y2="55%" stroke="currentColor" strokeWidth="1" />
          <line x1="50%" y1="35%" x2="65%" y2="25%" stroke="currentColor" strokeWidth="1" />
          <line x1="25%" y1="60%" x2="40%" y2="80%" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-7 gap-1.5">
        <ZoomIn className="w-3 h-3" /> Open Full Graph
      </Button>
    </div>
  );
}

// ============================================================
// STUDIO 3D DRAWER PANELS (Perfected)
// ============================================================

export function Studio3DScenePanel() {
  const [activeNode, setActiveNode] = useState('cube');
  const [expanded, setExpanded] = useState(true);

  const typeIcons: Record<string, typeof Box> = {
    group: Layers,
    camera: Film,
    light: Sparkles,
    mesh: Box,
  };

  const nodes = [
    { id: 'root', name: 'Scene Root', type: 'group', children: [
      { id: 'cam', name: 'Main Camera', type: 'camera', children: [] },
      { id: 'sun', name: 'Sun Light', type: 'light', children: [] },
      { id: 'env', name: 'Environment', type: 'light', children: [] },
      { id: 'cube', name: 'Cube', type: 'mesh', children: [] },
      { id: 'sphere', name: 'Sphere', type: 'mesh', children: [] },
      { id: 'plane', name: 'Ground Plane', type: 'mesh', children: [] },
    ]},
  ];

  const typeColors: Record<string, string> = {
    group: 'text-primary',
    camera: 'text-[hsl(210,80%,60%)]',
    light: 'text-[hsl(45,100%,65%)]',
    mesh: 'text-[hsl(150,100%,60%)]',
  };

  const renderNode = (node: typeof nodes[0], depth: number = 0) => {
    const Icon = typeIcons[node.type] || Box;
    const isActive = activeNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div key={node.id}>
        <button
          onClick={() => { setActiveNode(node.id); if (hasChildren && depth === 0) setExpanded(!expanded); }}
          className={cn(
            'w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-md text-xs transition-colors',
            isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/20',
          )}
          style={{ paddingLeft: `${6 + depth * 14}px` }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground/60 shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          ) : <span className="w-3 shrink-0" />}
          <Icon className={cn('w-3.5 h-3.5 shrink-0', typeColors[node.type])} />
          <span className="truncate flex-1">{node.name}</span>
          <Eye className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        </button>
        {hasChildren && expanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Scene Graph</span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Add Mesh"><Plus className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5" title="Delete"><Trash2 className="w-3 h-3" /></Button>
          </div>
        </div>
        {nodes.map(n => renderNode(n))}

        {/* Properties hint */}
        <div className="border-t border-border/20 pt-2 space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Transform</p>
          {['Position', 'Rotation', 'Scale'].map(prop => (
            <div key={prop} className="flex items-center gap-1.5 px-2">
              <span className="text-[10px] text-muted-foreground w-12">{prop}</span>
              <div className="flex gap-0.5 flex-1">
                {['X', 'Y', 'Z'].map(axis => (
                  <div key={axis} className="flex-1 bg-muted/20 rounded px-1.5 py-0.5 text-[9px] font-mono text-center">{prop === 'Scale' ? '1.00' : '0.00'}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// PRESENTATIONS DRAWER PANELS (Perfected)
// ============================================================

export function PresentationsSlidesPanel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    { title: 'Title Slide', layout: 'title' },
    { title: 'Introduction', layout: 'content' },
    { title: 'Key Features', layout: 'two-column' },
    { title: 'Architecture', layout: 'content' },
    { title: 'Thank You', layout: 'title' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex gap-1">
          <Button size="sm" className="flex-1 h-7 gap-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Add Slide</Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Copy className="w-3.5 h-3.5" /></Button>
        </div>

        <div className="space-y-1.5">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActiveSlide(i); emitPageDrawerAction({ page: 'presentations', action: 'goto-slide', value: String(i) }); }}
              className={cn(
                'w-full rounded-lg overflow-hidden border transition-all',
                activeSlide === i ? 'border-primary ring-1 ring-primary/30' : 'border-border/30 hover:border-primary/50',
              )}
            >
              <div className="aspect-video bg-muted/10 flex items-center justify-center relative">
                <span className="text-[10px] text-muted-foreground">{s.title}</span>
                <span className="absolute top-1 left-1.5 text-[8px] font-bold text-muted-foreground/40">{i + 1}</span>
                <Badge variant="outline" className="absolute bottom-1 right-1 text-[7px] px-1 h-3">{s.layout}</Badge>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2 text-center">
          <p className="text-[10px] text-muted-foreground">{slides.length} slides · {activeSlide + 1} selected</p>
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// COMMS HUB DRAWER PANELS (Perfected)
// ============================================================

export function CommsChannelsPanel() {
  const [activeChannel, setActiveChannel] = useState('general');
  const sections = [
    { label: 'Starred', channels: [
      { name: 'general', unread: 3, description: 'General discussion' },
      { name: 'engineering', unread: 1, description: 'Engineering team' },
    ]},
    { label: 'Channels', channels: [
      { name: 'design', unread: 0, description: 'Design reviews' },
      { name: 'random', unread: 5, description: 'Off-topic' },
      { name: 'announcements', unread: 0, description: 'Company news' },
      { name: 'help', unread: 2, description: 'Questions & support' },
    ]},
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search channels..." className="pl-8 h-7 text-xs bg-muted/20 border-border/30" />
        </div>

        {sections.map(section => (
          <div key={section.label} className="space-y-0.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase">{section.label}</span>
              {section.label === 'Channels' && <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>}
            </div>
            {section.channels.map(ch => (
              <button
                key={ch.name}
                onClick={() => { setActiveChannel(ch.name); emitPageDrawerAction({ page: 'comms', action: 'open-channel', value: ch.name }); }}
                className={cn(
                  'w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all',
                  activeChannel === ch.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
                )}
              >
                <MessageCircle className={cn('w-3.5 h-3.5 shrink-0', activeChannel === ch.name ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={cn('text-xs', ch.unread > 0 && 'font-semibold')}>#{ch.name}</span>
                  </div>
                </div>
                {ch.unread > 0 && (
                  <span className="text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center">{ch.unread}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function CommsDMsPanel() {
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const dms = [
    { name: 'Alex Chen', status: 'online', lastMsg: 'Sounds good, let me check...', time: '2m ago', unread: 1 },
    { name: 'Jordan Lee', status: 'away', lastMsg: 'PR is ready for review', time: '1h ago', unread: 0 },
    { name: 'Sam Ross', status: 'offline', lastMsg: 'Thanks for the help!', time: '1d ago', unread: 0 },
    { name: 'Morgan White', status: 'online', lastMsg: 'Meeting at 3pm?', time: '2h ago', unread: 2 },
  ];
  const statusColors: Record<string, string> = {
    online: 'bg-[hsl(150,100%,60%)]',
    away: 'bg-[hsl(45,100%,65%)]',
    offline: 'bg-muted-foreground/40',
  };
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-2 mb-1">Direct Messages</p>
        {dms.map(dm => (
          <button
            key={dm.name}
            onClick={() => { setActiveDM(dm.name); emitPageDrawerAction({ page: 'comms', action: 'open-dm', value: dm.name }); }}
            className={cn(
              'w-full text-left px-2.5 py-2 rounded-lg transition-all',
              activeDM === dm.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
            )}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-bold">{dm.name.split(' ').map(n => n[0]).join('')}</div>
                <div className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[dm.status])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs', dm.unread > 0 && 'font-semibold')}>{dm.name}</span>
                  <span className="text-[9px] text-muted-foreground">{dm.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{dm.lastMsg}</p>
              </div>
              {dm.unread > 0 && (
                <span className="text-[9px] font-semibold min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">{dm.unread}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// TERMINAL DRAWER PANELS (Perfected)
// ============================================================

export function TerminalSessionsPanel() {
  const [activeSession, setActiveSession] = useState('s1');
  const sessions = [
    { id: 's1', name: 'zsh — main', cwd: '~/project', active: true, pid: 1234 },
    { id: 's2', name: 'node — dev server', cwd: '~/project', active: true, pid: 5678 },
    { id: 's3', name: 'bash — build', cwd: '~/project/dist', active: false, pid: null },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Session
        </Button>

        <div className="space-y-0.5">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSession(s.id); emitPageDrawerAction({ page: 'terminal', action: 'switch-session', value: s.id }); }}
              className={cn(
                'w-full text-left px-2.5 py-2.5 rounded-lg transition-all',
                activeSession === s.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2">
                <Terminal className={cn('w-3.5 h-3.5 shrink-0', activeSession === s.id ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.cwd}{s.pid ? ` · PID ${s.pid}` : ''}</p>
                </div>
                {s.active && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(150,100%,60%)] shrink-0" />}
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Quick Commands</p>
          {['npm run dev', 'git status', 'npm test', 'npm run build'].map(cmd => (
            <Button key={cmd} variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2 font-mono">
              <Play className="w-3 h-3 text-primary" /> {cmd}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// API STUDIO DRAWER PANELS (Perfected)
// ============================================================

export function APICollectionsPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'aimos': true });
  const collections = [
    { id: 'aimos', name: 'AIMOS API', requests: [
      { method: 'GET', path: '/agents', label: 'List Agents' },
      { method: 'POST', path: '/chat', label: 'Send Message' },
      { method: 'GET', path: '/memory', label: 'Get Memory' },
      { method: 'PUT', path: '/agents/:id', label: 'Update Agent' },
    ]},
    { id: 'user', name: 'User Service', requests: [
      { method: 'GET', path: '/users', label: 'List Users' },
      { method: 'POST', path: '/auth/login', label: 'Login' },
    ]},
    { id: 'auth', name: 'Auth API', requests: [
      { method: 'POST', path: '/token', label: 'Get Token' },
      { method: 'POST', path: '/refresh', label: 'Refresh Token' },
    ]},
  ];

  const methodColors: Record<string, string> = {
    GET: 'text-[hsl(150,100%,60%)]',
    POST: 'text-[hsl(210,80%,60%)]',
    PUT: 'text-[hsl(45,100%,65%)]',
    DELETE: 'text-destructive',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex gap-1 mb-1">
          <Button size="sm" className="flex-1 h-7 gap-1.5 text-xs"><Plus className="w-3 h-3" /> New</Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs"><Upload className="w-3 h-3" /> Import</Button>
        </div>

        {collections.map(c => (
          <div key={c.id}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20 text-xs font-medium"
            >
              {expanded[c.id] ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="flex-1 text-left">{c.name}</span>
              <Badge variant="outline" className="text-[9px] px-1 h-3.5">{c.requests.length}</Badge>
            </button>
            {expanded[c.id] && c.requests.map((r, i) => (
              <button key={i} className="w-full flex items-center gap-2 pl-8 pr-2 py-1.5 rounded-md hover:bg-muted/20 text-xs">
                <span className={cn('text-[9px] font-bold font-mono w-7 text-right', methodColors[r.method])}>{r.method}</span>
                <span className="flex-1 text-left truncate font-mono text-muted-foreground">{r.path}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// DATABASE DRAWER PANELS (Perfected)
// ============================================================

export function DatabaseTablesPanel() {
  const [activeTable, setActiveTable] = useState('agents');
  const tables = [
    { name: 'agents', rows: 5, cols: 11, type: 'table' },
    { name: 'conversations', rows: 23, cols: 8, type: 'table' },
    { name: 'documents', rows: 12, cols: 13, type: 'table' },
    { name: 'messages', rows: 156, cols: 7, type: 'table' },
    { name: 'tasks', rows: 34, cols: 18, type: 'table' },
    { name: 'dream_sessions', rows: 8, cols: 11, type: 'table' },
    { name: 'memory_entries', rows: 45, cols: 11, type: 'table' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search tables..." className="pl-8 h-7 text-xs bg-muted/20 border-border/30" />
        </div>

        <div className="bg-muted/15 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">{tables.length} tables</p>
            <p className="text-[10px] text-muted-foreground">{tables.reduce((a, t) => a + t.rows, 0)} total rows</p>
          </div>
          <Database className="w-5 h-5 text-primary/30" />
        </div>

        <div className="space-y-0.5">
          {tables.map(t => (
            <button
              key={t.name}
              onClick={() => { setActiveTable(t.name); emitPageDrawerAction({ page: 'database', action: 'open-table', value: t.name }); }}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all',
                activeTable === t.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/25 border border-transparent',
              )}
            >
              <Database className={cn('w-3.5 h-3.5 shrink-0', activeTable === t.name ? 'text-primary' : 'text-muted-foreground')} />
              <span className="font-mono flex-1 text-left">{t.name}</span>
              <span className="text-[10px] text-muted-foreground">{t.rows}r · {t.cols}c</span>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Plus className="w-3 h-3 text-primary" /> New Table
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
            <Code2 className="w-3 h-3 text-muted-foreground" /> SQL Editor
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// DASHBOARD BUILDER DRAWER PANELS (Perfected)
// ============================================================

export function DashboardListPanel() {
  const [activeDashboard, setActiveDashboard] = useState('d1');
  const dashboards = [
    { id: 'd1', name: 'System Overview', widgets: 8, updated: '2m ago', status: 'live' },
    { id: 'd2', name: 'Performance', widgets: 5, updated: '1h ago', status: 'live' },
    { id: 'd3', name: 'AI Metrics', widgets: 6, updated: '3h ago', status: 'draft' },
    { id: 'd4', name: 'User Analytics', widgets: 4, updated: '1d ago', status: 'live' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Dashboard
        </Button>

        <div className="space-y-0.5">
          {dashboards.map(d => (
            <button
              key={d.id}
              onClick={() => { setActiveDashboard(d.id); emitPageDrawerAction({ page: 'dashboard', action: 'open-dashboard', value: d.id }); }}
              className={cn(
                'w-full text-left px-2.5 py-2.5 rounded-lg transition-all',
                activeDashboard === d.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className={cn('w-4 h-4 shrink-0', activeDashboard === d.id ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium">{d.name}</p>
                    <div className={cn('w-1.5 h-1.5 rounded-full', d.status === 'live' ? 'bg-[hsl(150,100%,60%)]' : 'bg-muted-foreground')} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.widgets} widgets · {d.updated}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border/20 pt-2 space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-1">Widget Library</p>
          {['Chart', 'Metric Card', 'Table', 'Map', 'Timeline'].map(w => (
            <Button key={w} variant="ghost" size="sm" className="w-full justify-start h-7 px-2.5 text-xs gap-2">
              <Layers className="w-3 h-3 text-muted-foreground" /> {w}
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// BROWSER DRAWER PANELS (Perfected)
// ============================================================

export function BrowserBookmarksPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'dev': true });
  const folders = [
    { id: 'dev', name: 'Development', bookmarks: [
      { name: 'MDN Web Docs', url: 'developer.mozilla.org', favicon: '📘' },
      { name: 'React Docs', url: 'react.dev', favicon: '⚛️' },
      { name: 'Tailwind CSS', url: 'tailwindcss.com', favicon: '🎨' },
      { name: 'TypeScript', url: 'typescriptlang.org', favicon: '🔷' },
    ]},
    { id: 'tools', name: 'Tools', bookmarks: [
      { name: 'GitHub', url: 'github.com', favicon: '🐙' },
      { name: 'Vercel', url: 'vercel.com', favicon: '▲' },
    ]},
    { id: 'research', name: 'Research', bookmarks: [
      { name: 'ArXiv', url: 'arxiv.org', favicon: '📄' },
      { name: 'Google Scholar', url: 'scholar.google.com', favicon: '🎓' },
    ]},
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Bookmarks</span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5"><FolderOpen className="w-3 h-3" /></Button>
          </div>
        </div>

        {folders.map(f => (
          <div key={f.id}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20 text-xs font-medium"
            >
              {expanded[f.id] ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="flex-1 text-left">{f.name}</span>
              <span className="text-[10px] text-muted-foreground">{f.bookmarks.length}</span>
            </button>
            {expanded[f.id] && f.bookmarks.map((b, i) => (
              <button key={i} className="w-full flex items-center gap-2 pl-8 pr-2 py-1.5 rounded-md hover:bg-muted/20 text-xs group">
                <span className="text-sm shrink-0">{b.favicon}</span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs truncate">{b.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{b.url}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// CHAT DRAWER PANELS (Perfected)
// ============================================================

export function ChatHistoryPanel() {
  const [activeChat, setActiveChat] = useState<string | null>('c1');
  const [searchQuery, setSearchQuery] = useState('');

  const chats = [
    { id: 'c1', title: 'AIMOS Architecture Discussion', time: '2m ago', msgs: 12, pinned: true, hasUnread: true },
    { id: 'c2', title: 'Code Review — Drawer Refactor', time: '45m ago', msgs: 8, pinned: true, hasUnread: false },
    { id: 'c3', title: 'Bug Investigation: Canvas Rendering', time: '3h ago', msgs: 24, pinned: false, hasUnread: false },
    { id: 'c4', title: 'Sprint 6 Feature Planning', time: '1d ago', msgs: 15, pinned: false, hasUnread: false },
    { id: 'c5', title: 'Research: Multi-Modal LLMs', time: '2d ago', msgs: 30, pinned: false, hasUnread: false },
    { id: 'c6', title: 'Orchestration Pipeline Design', time: '3d ago', msgs: 18, pinned: false, hasUnread: false },
    { id: 'c7', title: 'Performance Optimization Notes', time: '5d ago', msgs: 9, pinned: false, hasUnread: false },
  ];

  const pinned = chats.filter(c => c.pinned);
  const recent = chats.filter(c => !c.pinned);
  const filtered = searchQuery
    ? chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const renderChat = (c: typeof chats[0]) => (
    <button
      key={c.id}
      onClick={() => { setActiveChat(c.id); emitPageDrawerAction({ page: 'chat', action: 'open-chat', value: c.id }); }}
      className={cn(
        'w-full text-left px-2.5 py-2 rounded-lg transition-all group',
        activeChat === c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/30 border border-transparent',
      )}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', activeChat === c.id ? 'text-primary' : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className={cn('text-xs truncate flex-1', c.hasUnread && 'font-semibold')}>{c.title}</p>
            {c.hasUnread && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{c.msgs} messages · {c.time}</p>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/50 shrink-0">
          <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </button>
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Conversation
        </Button>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-7 text-xs bg-muted/20 border-border/30"
          />
        </div>

        {filtered ? (
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">{filtered.length} results</p>
            {filtered.map(renderChat)}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Pinned
                </p>
                {pinned.map(renderChat)}
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Recent</p>
              {recent.map(renderChat)}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

export function ChatLibraryPanel() {
  const [activeSection, setActiveSection] = useState('docs');
  const sections = [
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'snippets', label: 'Saved Snippets', icon: Code2 },
  ];

  const docs = [
    { name: 'AIMOS Documentation', size: '24 KB', type: 'txt', updated: '1d ago' },
    { name: 'UI Canon Specification', size: '18 KB', type: 'md', updated: '2d ago' },
    { name: 'Architecture Spec', size: '32 KB', type: 'md', updated: '3d ago' },
    { name: 'API Reference', size: '45 KB', type: 'md', updated: '1w ago' },
    { name: 'Drawing Engine Docs', size: '28 KB', type: 'txt', updated: '1w ago' },
    { name: 'Principia Morphica', size: '15 KB', type: 'txt', updated: '2w ago' },
  ];

  const knowledge = [
    { name: 'Reasoning Chains', entries: 23 },
    { name: 'Memory Context', entries: 156 },
    { name: 'Dream Insights', entries: 45 },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        <div className="flex gap-0.5 bg-muted/20 rounded-lg p-0.5">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <Button
                key={s.id}
                variant={activeSection === s.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(s.id)}
                className={cn('flex-1 h-6 text-[10px] gap-1 px-1', activeSection === s.id && 'bg-primary/15 text-primary')}
              >
                <Icon className="w-3 h-3" />
                {s.label}
              </Button>
            );
          })}
        </div>

        {activeSection === 'docs' && (
          <div className="space-y-0.5">
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </Button>
            {docs.map(d => (
              <button
                key={d.name}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d.size} · .{d.type} · {d.updated}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeSection === 'knowledge' && (
          <div className="space-y-1">
            {knowledge.map(k => (
              <div key={k.name} className="px-2.5 py-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{k.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-4">{k.entries}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'snippets' && (
          <div className="p-3 text-center">
            <Code2 className="w-6 h-6 text-muted-foreground/20 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Save code snippets from chat</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function ChatFavoritesPanel() {
  const starred = [
    { text: 'The CMC memory system uses RS scoring with decay...', chat: 'AIMOS Architecture', time: '2h ago' },
    { text: 'Canvas rendering optimization: batch draws per frame...', chat: 'Bug Investigation', time: '1d ago' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {starred.length === 0 ? (
          <div className="p-6 text-center">
            <Star className="w-8 h-8 text-muted-foreground/15 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No starred messages yet</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Star important messages to save them here</p>
          </div>
        ) : (
          starred.map((s, i) => (
            <div key={i} className="px-2.5 py-2 rounded-lg border border-border/20 hover:border-primary/30 cursor-pointer transition-colors">
              <div className="flex items-start gap-2">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs line-clamp-2">{s.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">from {s.chat} · {s.time}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// GENERIC FALLBACK (Settings, etc.)
// ============================================================

export function GenericSettingsPanel() {
  const sections = [
    { name: 'General', desc: 'Workspace preferences' },
    { name: 'Appearance', desc: 'Theme and density' },
    { name: 'Shortcuts', desc: 'Keyboard mappings' },
    { name: 'Integrations', desc: 'Connections and tokens' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {sections.map(s => (
          <Button key={s.name} variant="ghost" className="w-full justify-start h-auto py-3 px-2">
            <div className="text-left">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function GenericSearchPanel() {
  return (
    <div className="p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9 bg-muted/30 border-none" autoFocus />
      </div>
      <p className="text-xs text-muted-foreground mt-3">Search across the active workspace.</p>
    </div>
  );
}

export function GenericHistoryPanel() {
  const items = [
    { action: 'Opened file', time: '2m ago' },
    { action: 'Edited document', time: '15m ago' },
    { action: 'Ran build', time: '1h ago' },
    { action: 'Committed changes', time: '3h ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-xs">
            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="flex-1">{item.action}</span>
            <span className="text-[10px] text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
