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
// EMAIL DRAWER PANELS
// ============================================================

const EMAIL_FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 3 },
  { id: 'starred', label: 'Starred', icon: Star, count: 2 },
  { id: 'snoozed', label: 'Snoozed', icon: AlarmClock, count: 1 },
  { id: 'sent', label: 'Sent', icon: Send, count: 0 },
  { id: 'scheduled', label: 'Scheduled', icon: CalendarClock, count: 0 },
  { id: 'drafts', label: 'Drafts', icon: FileText, count: 1 },
  { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
  { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
];

const EMAIL_LABELS = [
  { name: 'Architecture', color: 'bg-violet-500/20 text-violet-400' },
  { name: 'Sprint', color: 'bg-amber-500/20 text-amber-400' },
  { name: '3D Studio', color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Urgent', color: 'bg-red-500/20 text-red-400' },
  { name: 'Personal', color: 'bg-blue-500/20 text-blue-400' },
];

export function EmailInboxPanel() {
  const [activeFolder, setActiveFolder] = useState('inbox');
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs mb-2">
          <Plus className="w-3.5 h-3.5" /> Compose
        </Button>
        {EMAIL_FOLDERS.map(f => {
          const Icon = f.icon;
          const isActive = activeFolder === f.id;
          return (
            <Button
              key={f.id}
              variant="ghost"
              size="sm"
              onClick={() => { setActiveFolder(f.id); emitPageDrawerAction({ page: 'email', action: 'folder', value: f.id }); }}
              className={cn('w-full justify-start h-8 px-2 text-xs gap-2', isActive && 'bg-primary/10 text-primary')}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className="flex-1 text-left">{f.label}</span>
              {f.count > 0 && <Badge variant="outline" className="text-[10px] px-1.5 h-4">{f.count}</Badge>}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function EmailLabelsPanel() {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Labels</span>
          <Button variant="ghost" size="icon" className="w-6 h-6"><Plus className="w-3 h-3" /></Button>
        </div>
        {EMAIL_LABELS.map(l => (
          <Button
            key={l.name}
            variant="ghost"
            size="sm"
            onClick={() => { setActiveLabel(activeLabel === l.name ? null : l.name); emitPageDrawerAction({ page: 'email', action: 'label', value: l.name }); }}
            className={cn('w-full justify-start h-8 px-2 text-xs gap-2', activeLabel === l.name && 'bg-primary/10')}
          >
            <div className={cn('w-3 h-3 rounded-full', l.color.split(' ')[0])} />
            <span>{l.name}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function EmailSearchPanel() {
  return (
    <div className="p-3 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search emails..." className="pl-9 bg-muted/30 border-none" autoFocus />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Quick Filters</p>
        {['Unread', 'Has Attachments', 'Flagged', 'This Week'].map(f => (
          <Button key={f} variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">{f}</Button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CALENDAR DRAWER PANELS
// ============================================================

export function CalendarListPanel() {
  const calendars = [
    { name: 'Work', color: 'bg-primary', enabled: true },
    { name: 'Personal', color: 'bg-[hsl(270,80%,60%)]', enabled: true },
    { name: 'Team', color: 'bg-[hsl(150,100%,60%)]', enabled: true },
    { name: 'Holidays', color: 'bg-[hsl(45,100%,65%)]', enabled: false },
  ];
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(calendars.map(c => [c.name, c.enabled]))
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Calendar
        </Button>
        <div className="space-y-1">
          {calendars.map(cal => (
            <div key={cal.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20">
              <Checkbox
                checked={enabled[cal.name]}
                onCheckedChange={(checked) => setEnabled(prev => ({ ...prev, [cal.name]: !!checked }))}
              />
              <div className={cn('w-3 h-3 rounded-full', cal.color)} />
              <span className="text-xs flex-1">{cal.name}</span>
            </div>
          ))}
        </div>

        {/* Mini Calendar */}
        <div className="border border-border/30 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">March 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-px text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-[9px] text-muted-foreground py-0.5">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => (
              <button
                key={i}
                className={cn(
                  'text-[10px] py-0.5 rounded hover:bg-primary/20',
                  i + 1 === 8 && 'bg-primary text-primary-foreground font-bold',
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export function CalendarUpcomingPanel() {
  const upcoming = [
    { title: 'Team Standup', time: '9:00 AM', color: 'border-l-primary' },
    { title: 'Design Review', time: '2:00 PM', color: 'border-l-[hsl(270,80%,60%)]' },
    { title: 'Sprint Planning', time: 'Tomorrow 10:00 AM', color: 'border-l-[hsl(150,100%,60%)]' },
    { title: 'AI Deep Dive', time: 'Mar 10, 1:00 PM', color: 'border-l-destructive' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1.5">
        {upcoming.map((ev, i) => (
          <div key={i} className={cn('border-l-2 pl-3 py-2 rounded-r-md hover:bg-muted/20 cursor-pointer', ev.color)}>
            <p className="text-xs font-medium">{ev.title}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {ev.time}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// TASKS DRAWER PANELS
// ============================================================

export function TasksBoardPanel() {
  const statusCounts = [
    { label: 'Backlog', count: 2, icon: Circle, color: 'text-muted-foreground' },
    { label: 'To Do', count: 3, icon: Circle, color: 'text-[hsl(210,80%,60%)]' },
    { label: 'In Progress', count: 2, icon: Timer, color: 'text-[hsl(45,100%,65%)]' },
    { label: 'Review', count: 1, icon: PauseCircle, color: 'text-[hsl(270,80%,65%)]' },
    { label: 'Done', count: 4, icon: CheckCircle2, color: 'text-[hsl(150,100%,60%)]' },
  ];
  const total = statusCounts.reduce((a, s) => a + s.count, 0);
  const done = statusCounts.find(s => s.label === 'Done')?.count || 0;
  const completion = Math.round((done / total) * 100);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Task
        </Button>

        <div className="bg-muted/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Progress</span>
            <span className="text-xs text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{done} done</span>
            <span>{total} total</span>
          </div>
        </div>

        <div className="space-y-0.5">
          {statusCounts.map(s => {
            const Icon = s.icon;
            return (
              <Button
                key={s.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 text-xs gap-2"
                onClick={() => emitPageDrawerAction({ page: 'tasks', action: 'filter-status', value: s.label })}
              >
                <Icon className={cn('w-4 h-4', s.color)} />
                <span className="flex-1 text-left">{s.label}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 h-4">{s.count}</Badge>
              </Button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

export function TasksProjectsPanel() {
  const projects = [
    { name: 'Browser OS', tasks: 8, color: 'bg-primary' },
    { name: 'AIMOS Engine', tasks: 5, color: 'bg-[hsl(270,80%,60%)]' },
    { name: 'Design System', tasks: 3, color: 'bg-[hsl(150,100%,60%)]' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-7">
          <Plus className="w-3.5 h-3.5" /> New Project
        </Button>
        {projects.map(p => (
          <div key={p.name} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/20 cursor-pointer">
            <div className={cn('w-3 h-3 rounded', p.color)} />
            <span className="text-xs flex-1">{p.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{p.tasks}</Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function TasksAnalyticsPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Open', value: '8', color: 'text-primary' },
            { label: 'Done', value: '4', color: 'text-[hsl(150,100%,60%)]' },
            { label: 'Overdue', value: '1', color: 'text-destructive' },
            { label: 'Avg Time', value: '2.3d', color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="bg-muted/20 rounded-lg p-2 text-center">
              <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Velocity</p>
          <div className="h-20 bg-muted/10 rounded-lg border border-border/20 flex items-end justify-around px-2 pb-1">
            {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
              <div key={i} className="w-3 rounded-t bg-primary/40" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground px-1">
            <span>Mon</span><span>Sun</span>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// FILES DRAWER PANELS
// ============================================================

interface FileNode { name: string; type: 'file' | 'folder'; children?: FileNode[] }

const FILE_TREE: FileNode[] = [
  { name: 'src', type: 'folder', children: [
    { name: 'components', type: 'folder', children: [
      { name: 'App.tsx', type: 'file' },
      { name: 'Header.tsx', type: 'file' },
      { name: 'Sidebar.tsx', type: 'file' },
    ]},
    { name: 'hooks', type: 'folder', children: [
      { name: 'useAuth.ts', type: 'file' },
      { name: 'useTheme.ts', type: 'file' },
    ]},
    { name: 'lib', type: 'folder', children: [
      { name: 'utils.ts', type: 'file' },
      { name: 'api.ts', type: 'file' },
    ]},
    { name: 'main.tsx', type: 'file' },
  ]},
  { name: 'public', type: 'folder', children: [
    { name: 'favicon.ico', type: 'file' },
    { name: 'robots.txt', type: 'file' },
  ]},
  { name: 'docs', type: 'folder', children: [
    { name: 'ARCHITECTURE.md', type: 'file' },
    { name: 'API.md', type: 'file' },
  ]},
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
];

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isFolder = node.type === 'folder';
  return (
    <div>
      <button
        onClick={() => isFolder && setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-1 py-1 pr-2 text-xs hover:bg-muted/20 rounded-sm',
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {isFolder ? (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : <span className="w-3 shrink-0" />}
        {isFolder ? <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && expanded && node.children?.map((child, i) => (
        <FileTreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FilesBrowsePanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1 px-2 mb-2">
          <Button variant="ghost" size="icon" className="w-6 h-6"><Plus className="w-3 h-3" /></Button>
          <Button variant="ghost" size="icon" className="w-6 h-6"><Upload className="w-3 h-3" /></Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="w-6 h-6"><Search className="w-3 h-3" /></Button>
        </div>
        {FILE_TREE.map((node, i) => (
          <FileTreeNode key={i} node={node} />
        ))}
      </div>
    </ScrollArea>
  );
}

export function FilesRecentPanel() {
  const recent = [
    { name: 'App.tsx', path: '/src/components/', time: '2m ago' },
    { name: 'api.ts', path: '/src/lib/', time: '5m ago' },
    { name: 'ARCHITECTURE.md', path: '/docs/', time: '1h ago' },
    { name: 'index.css', path: '/src/', time: '2h ago' },
    { name: 'package.json', path: '/', time: '3h ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {recent.map((f, i) => (
          <Button key={i} variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2 text-left">
            <File className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{f.path} · {f.time}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function FilesStarredPanel() {
  const starred = [
    { name: 'App.tsx', path: '/src/components/' },
    { name: 'api.ts', path: '/src/lib/' },
    { name: 'ARCHITECTURE.md', path: '/docs/' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {starred.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <Star className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p>No starred files</p>
          </div>
        ) : starred.map((f, i) => (
          <Button key={i} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="truncate">{f.name}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// IDE DRAWER PANELS
// ============================================================

export function IDEFilesPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Explorer</span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5"><FolderOpen className="w-3 h-3" /></Button>
          </div>
        </div>
        {FILE_TREE.map((node, i) => (
          <FileTreeNode key={i} node={node} />
        ))}
      </div>
    </ScrollArea>
  );
}

export function IDEGitPanel() {
  const changes = [
    { name: 'PageLeftDrawer.tsx', status: 'M', color: 'text-amber-400' },
    { name: 'drawer-panels/index.tsx', status: 'A', color: 'text-[hsl(150,100%,60%)]' },
    { name: 'old-sidebar.tsx', status: 'D', color: 'text-destructive' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">main</span>
          <Badge variant="outline" className="text-[10px] px-1 h-4 ml-auto">{changes.length}</Badge>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">Changes</p>
          {changes.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 text-xs">
              <Badge variant="outline" className={cn('text-[9px] px-1 h-4 font-mono', c.color)}>{c.status}</Badge>
              <span className="truncate flex-1">{c.name}</span>
            </div>
          ))}
        </div>
        <Input placeholder="Commit message..." className="text-xs h-8 bg-muted/20 border-border/30" />
        <Button size="sm" className="w-full h-7 text-xs">Commit</Button>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// ILLUSTRATOR DRAWER PANELS
// ============================================================

export function IllustratorLayersPanel() {
  const [layers] = useState([
    { id: '1', name: 'Shape Layer', visible: true, locked: false },
    { id: '2', name: 'Text Layer', visible: true, locked: false },
    { id: '3', name: 'Background', visible: true, locked: true },
  ]);
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Layers</span>
          <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
        </div>
        {layers.map(l => (
          <div key={l.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted/20 group">
            <GripVertical className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab" />
            <button className="shrink-0">{l.visible ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />}</button>
            <button className="shrink-0">{l.locked ? <Lock className="w-3.5 h-3.5 text-muted-foreground/50" /> : <Unlock className="w-3.5 h-3.5 text-muted-foreground" />}</button>
            <span className="text-xs truncate flex-1">{l.name}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function IllustratorAssetsPanel() {
  const assets = [
    { name: 'Color Swatches', count: 18 },
    { name: 'Gradients', count: 6 },
    { name: 'Patterns', count: 4 },
    { name: 'Symbols', count: 8 },
    { name: 'Brushes', count: 12 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {assets.map(a => (
          <Button key={a.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">{a.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{a.count}</Badge>
          </Button>
        ))}
        <div className="grid grid-cols-6 gap-1 p-2 mt-2">
          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
            '#8b5cf6', '#ec4899', '#ffffff', '#000000', '#6b7280', '#1a1a2e',
            '#f472b6', '#a78bfa', '#67e8f9', '#4ade80', '#fbbf24', '#fb923c',
          ].map(c => (
            <button key={c} className="w-full aspect-square rounded border border-border/30 hover:scale-110 transition-transform" style={{ background: c }} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================
// IMAGE EDITOR DRAWER PANELS
// ============================================================

export function ImageGalleryPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs">
          <Upload className="w-3.5 h-3.5" /> Open Image
        </Button>
        <p className="text-[10px] text-muted-foreground uppercase font-medium px-1">Recent</p>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-square rounded-md bg-muted/20 border border-border/20 flex items-center justify-center cursor-pointer hover:border-primary/50">
              <Image className="w-5 h-5 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function ImageLayersPanel() {
  const layers = [
    { name: 'Adjustment', opacity: 80, visible: true },
    { name: 'Layer 1', opacity: 100, visible: true },
    { name: 'Background', opacity: 100, visible: true },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Layers</span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="w-5 h-5"><Copy className="w-3 h-3" /></Button>
          </div>
        </div>
        {layers.map((l, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-2 rounded-md hover:bg-muted/20 border border-transparent hover:border-border/30">
            <button>{l.visible ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />}</button>
            <div className="w-8 h-6 rounded bg-muted/30 border border-border/20" />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{l.name}</p>
              <p className="text-[9px] text-muted-foreground">{l.opacity}%</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function ImageAdjustPanel() {
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {[
          { label: 'Brightness', value: brightness, set: setBrightness, min: 0, max: 200 },
          { label: 'Contrast', value: contrast, set: setContrast, min: 0, max: 200 },
          { label: 'Saturation', value: saturation, set: setSaturation, min: 0, max: 200 },
        ].map(s => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs">{s.label}</span>
              <span className="text-[10px] text-muted-foreground">{s.value[0]}</span>
            </div>
            <Slider value={s.value} onValueChange={s.set} min={s.min} max={s.max} step={1} className="w-full" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function ImageAIToolsPanel() {
  const tools = [
    { label: 'Remove Background', desc: 'AI-powered background removal' },
    { label: 'Enhance', desc: 'Auto-improve quality' },
    { label: 'Upscale 2x', desc: 'AI super-resolution' },
    { label: 'Inpaint', desc: 'Remove objects' },
    { label: 'Style Transfer', desc: 'Apply artistic styles' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {tools.map(t => (
          <Button key={t.label} variant="ghost" size="sm" className="w-full justify-start h-auto py-2.5 px-2 text-left">
            <Wand2 className="w-4 h-4 mr-2 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium">{t.label}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// AUDIO EDITOR DRAWER PANELS
// ============================================================

export function AudioTracksPanel() {
  const tracks = [
    { name: 'Vocals', color: 'bg-primary', muted: false, solo: false },
    { name: 'Guitar', color: 'bg-[hsl(150,100%,60%)]', muted: false, solo: false },
    { name: 'Drums', color: 'bg-[hsl(45,100%,65%)]', muted: true, solo: false },
    { name: 'Bass', color: 'bg-[hsl(270,80%,60%)]', muted: false, solo: false },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Track
        </Button>
        {tracks.map(t => (
          <div key={t.name} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/20">
            <div className={cn('w-2 h-8 rounded-full', t.color)} />
            <span className="text-xs flex-1">{t.name}</span>
            <Badge variant="outline" className={cn('text-[9px] px-1 h-4', t.muted && 'text-destructive border-destructive/30')}>
              {t.muted ? 'M' : 'S'}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function AudioEffectsPanel() {
  const effects = ['EQ', 'Compressor', 'Reverb', 'Delay', 'Chorus', 'Limiter'];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 mb-2">Effects Chain</p>
        {effects.map(fx => (
          <Button key={fx} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
            {fx}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function AudioLibraryPanel() {
  const samples = [
    { name: 'Kick 808', duration: '0:02' },
    { name: 'Hi-Hat Loop', duration: '0:04' },
    { name: 'Synth Pad', duration: '0:08' },
    { name: 'Vocal Chop', duration: '0:03' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Input placeholder="Search samples..." className="text-xs h-7 bg-muted/20 border-border/30 mb-2" />
        {samples.map(s => (
          <div key={s.name} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 cursor-pointer">
            <Play className="w-3 h-3 text-primary" />
            <span className="text-xs flex-1">{s.name}</span>
            <span className="text-[10px] text-muted-foreground">{s.duration}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// VIDEO EDITOR DRAWER PANELS
// ============================================================

export function VideoTimelinePanel() {
  const clips = [
    { name: 'Intro.mp4', duration: '0:05', type: 'video' },
    { name: 'Main Content.mp4', duration: '2:30', type: 'video' },
    { name: 'Outro.mp4', duration: '0:10', type: 'video' },
    { name: 'BGM.mp3', duration: '3:00', type: 'audio' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Import Media
        </Button>
        {clips.map(c => (
          <div key={c.name} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/20">
            {c.type === 'video' ? <Film className="w-4 h-4 text-primary shrink-0" /> : <Music className="w-4 h-4 text-[hsl(150,100%,60%)] shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function VideoClipsPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <Input placeholder="Search clips..." className="text-xs h-7 bg-muted/20 border-border/30" />
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-video rounded bg-muted/20 border border-border/20 flex items-center justify-center cursor-pointer hover:border-primary/50">
              <Film className="w-5 h-5 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function VideoEffectsPanel() {
  const effects = ['Fade In', 'Fade Out', 'Cross Dissolve', 'Blur', 'Color Grade', 'Speed Ramp'];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {effects.map(fx => (
          <Button key={fx} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {fx}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// ORCHESTRATION DRAWER PANELS
// ============================================================

export function OrchestrationTasksPanel() {
  const tasks = [
    { name: 'Data Pipeline', status: 'running', progress: 65 },
    { name: 'Model Training', status: 'queued', progress: 0 },
    { name: 'Validation', status: 'completed', progress: 100 },
    { name: 'Deployment', status: 'waiting', progress: 0 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1.5">
        {tasks.map(t => (
          <div key={t.name} className="px-2 py-2 rounded-md hover:bg-muted/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{t.name}</span>
              <Badge variant="outline" className={cn('text-[9px] px-1 h-4',
                t.status === 'running' && 'text-primary border-primary/30',
                t.status === 'completed' && 'text-[hsl(150,100%,60%)] border-[hsl(150,100%,60%)]/30',
                t.status === 'queued' && 'text-muted-foreground',
              )}>{t.status}</Badge>
            </div>
            {t.status === 'running' && <Progress value={t.progress} className="h-1" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function OrchestrationRunsPanel() {
  const runs = [
    { id: 'RUN-001', time: '2m ago', status: 'success' },
    { id: 'RUN-002', time: '15m ago', status: 'failed' },
    { id: 'RUN-003', time: '1h ago', status: 'success' },
    { id: 'RUN-004', time: '3h ago', status: 'success' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {runs.map(r => (
          <div key={r.id} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/20 cursor-pointer">
            <div className={cn('w-2 h-2 rounded-full', r.status === 'success' ? 'bg-[hsl(150,100%,60%)]' : 'bg-destructive')} />
            <span className="text-xs font-mono flex-1">{r.id}</span>
            <span className="text-[10px] text-muted-foreground">{r.time}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function OrchestrationWorkflowsPanel() {
  const workflows = [
    { name: 'CI/CD Pipeline', nodes: 8 },
    { name: 'Data ETL', nodes: 5 },
    { name: 'AI Training', nodes: 12 },
    { name: 'Deployment', nodes: 6 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5 mb-1">
          <Plus className="w-3.5 h-3.5" /> New Workflow
        </Button>
        {workflows.map(w => (
          <Button key={w.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Workflow className="w-3.5 h-3.5 text-primary" />
            <span className="flex-1 text-left">{w.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{w.nodes}</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// DOCUMENTS DRAWER PANELS
// ============================================================

export function DocumentsStoragePanel() {
  const items = [
    { name: 'Architecture Docs', type: 'folder', count: 5 },
    { name: 'API Specifications', type: 'folder', count: 3 },
    { name: 'Meeting Notes', type: 'folder', count: 12 },
    { name: 'Research Papers', type: 'folder', count: 8 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs mb-1">
          <Plus className="w-3.5 h-3.5" /> New Document
        </Button>
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
        <div className="h-px bg-border/30 my-1" />
        {items.map(item => (
          <Button key={item.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="flex-1 text-left truncate">{item.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{item.count}</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function DocumentsTagsPanel() {
  const tags = [
    { name: 'Architecture', count: 8 },
    { name: 'API', count: 5 },
    { name: 'Design', count: 4 },
    { name: 'Research', count: 6 },
    { name: 'Core', count: 3 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {tags.map(t => (
          <Button key={t.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">{t.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{t.count}</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// MAP DRAWER PANELS
// ============================================================

export function MapLayersPanel() {
  const layers = [
    { name: 'Streets', enabled: true },
    { name: 'Satellite', enabled: false },
    { name: 'Traffic', enabled: false },
    { name: 'Transit', enabled: true },
    { name: 'Terrain', enabled: false },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {layers.map(l => (
          <div key={l.name} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20">
            <Checkbox checked={l.enabled} />
            <span className="text-xs">{l.name}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function MapPlacesPanel() {
  const places = [
    { name: 'Home', address: '123 Main St' },
    { name: 'Office', address: '456 Business Ave' },
    { name: 'Gym', address: '789 Fitness Blvd' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Place
        </Button>
        {places.map(p => (
          <div key={p.name} className="px-2 py-2 rounded hover:bg-muted/20 cursor-pointer">
            <p className="text-xs font-medium flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> {p.name}</p>
            <p className="text-[10px] text-muted-foreground ml-[18px]">{p.address}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// SPREADSHEET DRAWER PANELS
// ============================================================

export function SpreadsheetSheetsPanel() {
  const sheets = [
    { name: 'Sheet 1', rows: 1000, active: true },
    { name: 'Data Import', rows: 500, active: false },
    { name: 'Summary', rows: 50, active: false },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Sheet
        </Button>
        {sheets.map(s => (
          <Button key={s.name} variant="ghost" size="sm" className={cn('w-full justify-start h-8 px-2 text-xs gap-2', s.active && 'bg-primary/10 text-primary')}>
            <Table2 className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">{s.name}</span>
            <span className="text-[10px] text-muted-foreground">{s.rows}r</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function SpreadsheetFormulasPanel() {
  const categories = ['Math', 'Statistics', 'Text', 'Date', 'Lookup', 'Logical', 'Financial'];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Input placeholder="Search formulas..." className="text-xs h-7 bg-muted/20 border-border/30 mb-2" />
        {categories.map(c => (
          <Button key={c} variant="ghost" size="sm" className="w-full justify-start h-7 px-2 text-xs gap-2">
            <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
            {c}
            <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// NOTES DRAWER PANELS
// ============================================================

export function NotesListPanel() {
  const notes = [
    { title: 'Architecture Notes', modified: '2m ago', preview: 'Key decisions on...' },
    { title: 'Meeting Notes', modified: '1h ago', preview: 'Sprint planning...' },
    { title: 'Research Links', modified: '3h ago', preview: 'Papers on AGI...' },
    { title: 'Daily Journal', modified: '1d ago', preview: 'Progress update...' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs mb-1">
          <Plus className="w-3.5 h-3.5" /> New Note
        </Button>
        {notes.map(n => (
          <Button key={n.title} variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2 text-left">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{n.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{n.preview} · {n.modified}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function NotesGraphPanel() {
  return (
    <div className="p-3 flex flex-col items-center justify-center h-full">
      <div className="w-full aspect-square bg-muted/10 rounded-lg border border-border/20 flex items-center justify-center">
        <div className="text-center">
          <GitBranch className="w-8 h-8 text-primary/30 mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">Knowledge graph</p>
          <p className="text-[9px] text-muted-foreground/50">4 notes · 6 links</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STUDIO 3D DRAWER PANELS
// ============================================================

export function Studio3DScenePanel() {
  const nodes = [
    { name: 'Scene Root', type: 'group', children: [
      { name: 'Camera', type: 'camera' },
      { name: 'Sun Light', type: 'light' },
      { name: 'Cube', type: 'mesh' },
      { name: 'Sphere', type: 'mesh' },
      { name: 'Ground Plane', type: 'mesh' },
    ]},
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Scene Graph</span>
          <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
        </div>
        {nodes.map(n => (
          <div key={n.name}>
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium">
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
              <Box className="w-3.5 h-3.5 text-primary" />
              {n.name}
            </div>
            {n.children?.map(child => (
              <div key={child.name} className="flex items-center gap-1 pl-7 pr-2 py-1 text-xs hover:bg-muted/20 rounded cursor-pointer">
                <Box className="w-3 h-3 text-muted-foreground" />
                <span>{child.name}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">{child.type}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// PRESENTATIONS DRAWER PANELS
// ============================================================

export function PresentationsSlidesPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1.5">
        <Button size="sm" className="w-full h-7 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Slide
        </Button>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'aspect-video rounded-md border cursor-pointer hover:border-primary/50 bg-muted/10 flex items-center justify-center',
              i === 0 && 'border-primary',
            )}
          >
            <span className="text-[10px] text-muted-foreground">Slide {i + 1}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// COMMS HUB DRAWER PANELS
// ============================================================

export function CommsChannelsPanel() {
  const channels = [
    { name: 'general', unread: 3 },
    { name: 'engineering', unread: 1 },
    { name: 'design', unread: 0 },
    { name: 'random', unread: 5 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Channels</span>
          <Button variant="ghost" size="icon" className="w-5 h-5"><Plus className="w-3 h-3" /></Button>
        </div>
        {channels.map(ch => (
          <Button key={ch.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">#{ch.name}</span>
            {ch.unread > 0 && <Badge className="bg-primary/20 text-primary text-[9px] px-1 h-4">{ch.unread}</Badge>}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function CommsDMsPanel() {
  const dms = [
    { name: 'Alex Chen', status: 'online' },
    { name: 'Jordan Lee', status: 'away' },
    { name: 'Sam Ross', status: 'offline' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {dms.map(dm => (
          <Button key={dm.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <div className={cn('w-2 h-2 rounded-full', dm.status === 'online' ? 'bg-[hsl(150,100%,60%)]' : dm.status === 'away' ? 'bg-[hsl(45,100%,65%)]' : 'bg-muted-foreground')} />
            <span>{dm.name}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// TERMINAL DRAWER PANELS
// ============================================================

export function TerminalSessionsPanel() {
  const sessions = [
    { name: 'zsh — main', active: true },
    { name: 'node — dev server', active: true },
    { name: 'bash — build', active: false },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Session
        </Button>
        {sessions.map(s => (
          <Button key={s.name} variant="ghost" size="sm" className={cn('w-full justify-start h-8 px-2 text-xs gap-2', s.active && 'text-primary')}>
            <Terminal className="w-3.5 h-3.5" />
            <span className="flex-1 text-left truncate">{s.name}</span>
            {s.active && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(150,100%,60%)]" />}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// API STUDIO DRAWER PANELS
// ============================================================

export function APICollectionsPanel() {
  const collections = [
    { name: 'AIMOS API', requests: 12 },
    { name: 'User Service', requests: 8 },
    { name: 'Auth API', requests: 5 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-7 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Collection
        </Button>
        {collections.map(c => (
          <Button key={c.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="flex-1 text-left">{c.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{c.requests}</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// DATABASE DRAWER PANELS
// ============================================================

export function DatabaseTablesPanel() {
  const tables = [
    { name: 'agents', rows: 5 },
    { name: 'conversations', rows: 23 },
    { name: 'documents', rows: 12 },
    { name: 'messages', rows: 156 },
    { name: 'tasks', rows: 34 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {tables.map(t => (
          <Button key={t.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <Database className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1 text-left font-mono">{t.name}</span>
            <span className="text-[10px] text-muted-foreground">{t.rows}r</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// DASHBOARD BUILDER DRAWER PANELS
// ============================================================

export function DashboardListPanel() {
  const dashboards = [
    { name: 'System Overview', widgets: 8 },
    { name: 'Performance', widgets: 5 },
    { name: 'AI Metrics', widgets: 6 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <Button size="sm" className="w-full h-7 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Dashboard
        </Button>
        {dashboards.map(d => (
          <Button key={d.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            <span className="flex-1 text-left">{d.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 h-4">{d.widgets}w</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// BROWSER DRAWER PANELS
// ============================================================

export function BrowserBookmarksPanel() {
  const bookmarks = [
    { name: 'MDN Web Docs', url: 'developer.mozilla.org' },
    { name: 'React Docs', url: 'react.dev' },
    { name: 'Tailwind CSS', url: 'tailwindcss.com' },
    { name: 'TypeScript', url: 'typescriptlang.org' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {bookmarks.map(b => (
          <Button key={b.name} variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2 text-left">
            <Globe className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs truncate">{b.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{b.url}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// CHAT DRAWER PANELS
// ============================================================

export function ChatHistoryPanel() {
  const chats = [
    { title: 'AIMOS Architecture Discussion', time: '2m ago', msgs: 12 },
    { title: 'Code Review Request', time: '1h ago', msgs: 8 },
    { title: 'Bug Investigation', time: '3h ago', msgs: 24 },
    { title: 'Feature Planning', time: '1d ago', msgs: 15 },
    { title: 'Research Synthesis', time: '2d ago', msgs: 30 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        <Button size="sm" className="w-full h-8 gap-1.5 text-xs mb-1">
          <Plus className="w-3.5 h-3.5" /> New Chat
        </Button>
        {chats.map(c => (
          <Button key={c.title} variant="ghost" size="sm" className="w-full justify-start h-auto py-2 px-2 text-left">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{c.title}</p>
              <p className="text-[10px] text-muted-foreground">{c.msgs} msgs · {c.time}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function ChatLibraryPanel() {
  const docs = [
    { name: 'AIMOS Documentation', type: 'doc' },
    { name: 'UI Canon', type: 'doc' },
    { name: 'Architecture Spec', type: 'doc' },
    { name: 'API Reference', type: 'doc' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        {docs.map(d => (
          <Button key={d.name} variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-xs gap-2">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate">{d.name}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

export function ChatFavoritesPanel() {
  return (
    <div className="p-4 text-center">
      <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">No starred messages yet</p>
      <p className="text-[10px] text-muted-foreground/50 mt-1">Star messages to save them here</p>
    </div>
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
