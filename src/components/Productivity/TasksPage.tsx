// Pro-grade task manager: drag-drop Kanban, inline create, subtask toggling, progress bars, rich detail panel
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Search, Filter, MoreHorizontal, Clock, Tag,
  KanbanSquare, List, Calendar, Wand2, AlertCircle,
  ArrowUp, ArrowRight, ArrowDown, Trash2, MessageSquare,
  CheckCircle2, Circle, Timer, PauseCircle, GripVertical,
  ChevronRight, BarChart3, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
type ViewMode = 'kanban' | 'list' | 'timeline';

interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: { name: string; initials: string; color: string };
  labels: string[];
  dueDate?: Date;
  createdAt: Date;
  subtasks: SubTask[];
  comments: number;
  project?: string;
  estimate?: string;
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted/10' },
  todo: { label: 'To Do', icon: Circle, color: 'text-[hsl(210,80%,60%)]', bgColor: 'bg-[hsl(210,80%,60%)]/5' },
  in_progress: { label: 'In Progress', icon: Timer, color: 'text-[hsl(45,100%,65%)]', bgColor: 'bg-[hsl(45,100%,65%)]/5' },
  review: { label: 'Review', icon: PauseCircle, color: 'text-[hsl(270,80%,65%)]', bgColor: 'bg-[hsl(270,80%,65%)]/5' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-[hsl(150,100%,60%)]', bgColor: 'bg-[hsl(150,100%,60%)]/5' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ComponentType<any>; color: string }> = {
  urgent: { label: 'Urgent', icon: AlertCircle, color: 'text-destructive' },
  high: { label: 'High', icon: ArrowUp, color: 'text-[hsl(30,100%,60%)]' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-[hsl(45,100%,65%)]' },
  low: { label: 'Low', icon: ArrowDown, color: 'text-[hsl(210,70%,55%)]' },
};

const ASSIGNEES = [
  { name: 'Alex', initials: 'AC', color: 'bg-primary/20 text-primary' },
  { name: 'Jordan', initials: 'JL', color: 'bg-[hsl(270,80%,60%)]/20 text-[hsl(270,90%,75%)]' },
  { name: 'Sam', initials: 'SR', color: 'bg-[hsl(150,100%,60%)]/20 text-[hsl(150,80%,70%)]' },
];

const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

function genId() { return 'T-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
function genSubId() { return 's-' + Math.random().toString(36).slice(2, 8); }

const demoTasks: Task[] = [
  { id: 'T-A1B2', title: 'Implement canvas-based spreadsheet grid', status: 'done', priority: 'high', assignee: ASSIGNEES[0], labels: ['Spreadsheet', 'Core'], createdAt: new Date(2026, 2, 1), dueDate: new Date(2026, 2, 7), estimate: '8h', comments: 3, project: 'Browser OS', subtasks: [{ id: 's-1', title: 'Grid rendering', done: true }, { id: 's-2', title: 'Cell selection', done: true }, { id: 's-3', title: 'Formula parser', done: true }] },
  { id: 'T-C3D4', title: 'Build calendar week/day views', status: 'in_progress', priority: 'high', assignee: ASSIGNEES[1], labels: ['Calendar'], createdAt: new Date(2026, 2, 3), dueDate: new Date(2026, 2, 10), estimate: '6h', project: 'Browser OS', comments: 1, subtasks: [{ id: 's-4', title: 'Week view grid', done: true }, { id: 's-5', title: 'Day view', done: false }, { id: 's-6', title: 'Drag to create', done: false }] },
  { id: 'T-E5F6', title: 'Email AI drafting integration', status: 'todo', priority: 'medium', labels: ['Email', 'AI'], createdAt: new Date(2026, 2, 5), estimate: '4h', project: 'Browser OS', comments: 0, subtasks: [] },
  { id: 'T-G7H8', title: 'App Launcher search optimization', status: 'todo', priority: 'medium', assignee: ASSIGNEES[2], labels: ['UI'], createdAt: new Date(2026, 2, 5), project: 'Browser OS', comments: 0, subtasks: [] },
  { id: 'T-I9J0', title: '3D Studio shader library browser', status: 'backlog', priority: 'high', labels: ['3D', 'Creative'], createdAt: new Date(2026, 2, 4), project: 'Browser OS', estimate: '12h', comments: 0, subtasks: [] },
  { id: 'T-K1L2', title: 'Terminal WebSocket connection', status: 'backlog', priority: 'low', labels: ['Terminal', 'Infra'], createdAt: new Date(2026, 2, 2), project: 'Browser OS', comments: 0, subtasks: [] },
  { id: 'T-M3N4', title: 'Database explorer schema visualizer', status: 'review', priority: 'medium', assignee: ASSIGNEES[0], labels: ['Database'], createdAt: new Date(2026, 2, 2), dueDate: new Date(2026, 2, 8), project: 'Browser OS', comments: 5, subtasks: [{ id: 's-7', title: 'ERD rendering', done: true }, { id: 's-8', title: 'Relation lines', done: true }, { id: 's-9', title: 'Export SVG', done: false }] },
  { id: 'T-O5P6', title: 'File manager drag-drop upload', status: 'todo', priority: 'low', labels: ['Files'], createdAt: new Date(2026, 2, 6), project: 'Browser OS', comments: 0, subtasks: [] },
  { id: 'T-Q7R8', title: 'Notes wiki bidirectional linking', status: 'in_progress', priority: 'medium', assignee: ASSIGNEES[1], labels: ['Notes', 'Knowledge'], createdAt: new Date(2026, 2, 1), project: 'Browser OS', estimate: '10h', comments: 2, subtasks: [{ id: 's-10', title: 'Parse [[links]]', done: true }, { id: 's-11', title: 'Backlinks panel', done: false }] },
  { id: 'T-S9T0', title: 'Fix right drawer resize handle z-index', status: 'done', priority: 'urgent', assignee: ASSIGNEES[1], labels: ['Bug', 'UI'], createdAt: new Date(2026, 2, 6), project: 'Browser OS', comments: 0, subtasks: [] },
];

export function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [inlineCreateColumn, setInlineCreateColumn] = useState<TaskStatus | null>(null);
  const [inlineCreateTitle, setInlineCreateTitle] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => t.labels.forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.labels.some(l => l.toLowerCase().includes(q)));
    }
    if (filterLabels.length > 0) {
      list = list.filter(t => filterLabels.some(l => t.labels.includes(l)));
    }
    return list;
  }, [tasks, searchQuery, filterLabels]);

  const addTask = useCallback((title: string, status: TaskStatus) => {
    if (!title.trim()) return;
    const task: Task = {
      id: genId(), title, status, priority: 'medium', labels: [],
      createdAt: new Date(), project: 'Browser OS', comments: 0, subtasks: [],
    };
    setTasks(prev => [task, ...prev]);
  }, []);

  const moveTask = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === id) setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
  }, [selectedTask]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) };
    }));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, subtasks: prev.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) } : null);
    }
  }, [selectedTask]);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const sub: SubTask = { id: genSubId(), title, done: false };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, subtasks: [...prev.subtasks, sub] } : null);
    }
  }, [selectedTask]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
  }, [selectedTask]);

  const counts = useMemo(() => {
    const m: Record<TaskStatus, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
    filtered.forEach(t => m[t.status]++);
    return m;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'done').length;
    return { total, done, inProgress, overdue, completion: total > 0 ? Math.round(done / total * 100) : 0 };
  }, [tasks]);

  // Inline create handler
  const handleInlineCreate = () => {
    if (inlineCreateTitle.trim() && inlineCreateColumn) {
      addTask(inlineCreateTitle, inlineCreateColumn);
      setInlineCreateTitle('');
      setInlineCreateColumn(null);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) moveTask(draggedTaskId, status);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 shrink-0">
        <h2 className="text-sm font-semibold">Tasks</h2>

        {/* Quick stats */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1">
            <BarChart3 className="w-3 h-3" /> {stats.completion}%
          </Badge>
          <Progress value={stats.completion} className="w-20 h-1.5" />
          {stats.overdue > 0 && (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
              {stats.overdue} overdue
            </Badge>
          )}
        </div>

        <div className="flex-1" />

        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs bg-muted/20 border-border/30"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <Filter className="w-3.5 h-3.5" /> Filter
              {filterLabels.length > 0 && <Badge className="bg-primary/20 text-primary text-[10px] px-1 h-4">{filterLabels.length}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allLabels.map(l => (
              <DropdownMenuItem key={l} onClick={() => setFilterLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])}>
                <Checkbox checked={filterLabels.includes(l)} className="mr-2" />
                {l}
              </DropdownMenuItem>
            ))}
            {filterLabels.length > 0 && (
              <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setFilterLabels([])}>Clear all</DropdownMenuItem></>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5">
          {([['kanban', KanbanSquare], ['list', List], ['timeline', Calendar]] as [ViewMode, React.ComponentType<any>][]).map(([v, Icon]) => (
            <Button
              key={v}
              variant={viewMode === v ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(v)}
              className={cn('h-6 w-7 p-0 rounded-md', viewMode === v && 'bg-primary/15 text-primary')}
            >
              <Icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>

        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => { setInlineCreateColumn('todo'); }}>
          <Plus className="w-3.5 h-3.5" /> Task
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> AI
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' && (
          <KanbanView
            tasks={filtered}
            counts={counts}
            onMove={moveTask}
            onSelect={setSelectedTask}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            dragOverColumn={dragOverColumn}
            draggedTaskId={draggedTaskId}
            inlineCreateColumn={inlineCreateColumn}
            inlineCreateTitle={inlineCreateTitle}
            setInlineCreateColumn={setInlineCreateColumn}
            setInlineCreateTitle={setInlineCreateTitle}
            onInlineCreate={handleInlineCreate}
            inlineInputRef={inlineInputRef}
          />
        )}
        {viewMode === 'list' && (
          <ListView tasks={filtered} onSelect={setSelectedTask} onMove={moveTask} />
        )}
        {viewMode === 'timeline' && (
          <TimelineView tasks={filtered} onSelect={setSelectedTask} />
        )}
      </div>
    </div>
  );
}

// ─── Kanban View ────────────────────────────
function KanbanView({ tasks, counts, onMove, onSelect, onDragStart, onDragOver, onDrop, onDragEnd, dragOverColumn, draggedTaskId, inlineCreateColumn, inlineCreateTitle, setInlineCreateColumn, setInlineCreateTitle, onInlineCreate, inlineInputRef }: {
  tasks: Task[]; counts: Record<TaskStatus, number>;
  onMove: (id: string, s: TaskStatus) => void; onSelect: (t: Task) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, s: TaskStatus) => void;
  onDrop: (e: React.DragEvent, s: TaskStatus) => void;
  onDragEnd: () => void;
  dragOverColumn: TaskStatus | null; draggedTaskId: string | null;
  inlineCreateColumn: TaskStatus | null; inlineCreateTitle: string;
  setInlineCreateColumn: (s: TaskStatus | null) => void;
  setInlineCreateTitle: (t: string) => void;
  onInlineCreate: () => void;
  inlineInputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="h-full flex gap-3 p-3 overflow-x-auto">
      {statuses.map(status => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const columnTasks = tasks.filter(t => t.status === status);
        const isDragOver = dragOverColumn === status;

        return (
          <div
            key={status}
            className={cn(
              'w-72 shrink-0 flex flex-col rounded-xl border transition-colors',
              isDragOver ? 'border-primary/50 bg-primary/5' : 'border-border/20 bg-muted/5',
            )}
            onDragOver={(e) => onDragOver(e, status)}
            onDrop={(e) => onDrop(e, status)}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/20 shrink-0">
              <Icon className={cn('w-4 h-4', config.color)} />
              <span className="text-xs font-medium">{config.label}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 h-4 ml-auto">{counts[status]}</Badge>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onSelect(task)}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    isDragging={draggedTaskId === task.id}
                  />
                ))}

                {/* Inline create */}
                {inlineCreateColumn === status && (
                  <Card className="p-2 border-primary/30 bg-primary/5">
                    <Input
                      ref={inlineInputRef as any}
                      autoFocus
                      value={inlineCreateTitle}
                      onChange={(e) => setInlineCreateTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onInlineCreate();
                        if (e.key === 'Escape') { setInlineCreateColumn(null); setInlineCreateTitle(''); }
                      }}
                      onBlur={() => { if (!inlineCreateTitle.trim()) { setInlineCreateColumn(null); setInlineCreateTitle(''); } }}
                      placeholder="Task title..."
                      className="h-7 text-xs bg-transparent border-none p-0 focus-visible:ring-0"
                    />
                    <div className="flex gap-1 mt-1.5">
                      <Button size="sm" className="h-5 text-[10px] px-2" onClick={onInlineCreate}>Create</Button>
                      <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => { setInlineCreateColumn(null); setInlineCreateTitle(''); }}>Cancel</Button>
                    </div>
                  </Card>
                )}
              </div>
            </ScrollArea>

            <button
              onClick={() => { setInlineCreateColumn(status); setInlineCreateTitle(''); }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors border-t border-border/20 rounded-b-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }: {
  task: Task; onClick: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void; isDragging: boolean;
}) {
  const pConfig = priorityConfig[task.priority];
  const PIcon = pConfig.icon;
  const completedSubs = task.subtasks.filter(s => s.done).length;
  const totalSubs = task.subtasks.length;
  const progress = totalSubs > 0 ? Math.round(completedSubs / totalSubs * 100) : 0;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'p-3 cursor-pointer hover:bg-muted/10 transition-all border-border/20 bg-card/60 group',
        isDragging && 'opacity-40 scale-95 rotate-1',
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="w-3 h-3 mt-1 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab" />
        <PIcon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', pConfig.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">{task.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{task.id}</p>
        </div>
      </div>

      {/* Subtask progress */}
      {totalSubs > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <Progress value={progress} className="h-1 flex-1" />
          <span className="text-[9px] text-muted-foreground">{completedSubs}/{totalSubs}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {task.labels.slice(0, 2).map(l => (
          <Badge key={l} variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-primary/30 text-primary">{l}</Badge>
        ))}
        {task.labels.length > 2 && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">+{task.labels.length - 2}</Badge>}
        <div className="flex-1" />
        {task.estimate && (
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{task.estimate}
          </span>
        )}
        {task.comments > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{task.comments}</span>
        )}
        {task.assignee && (
          <Avatar className="w-5 h-5">
            <AvatarFallback className={cn('text-[8px]', task.assignee.color)}>{task.assignee.initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}

// ─── List View ──────────────────────────────
function ListView({ tasks, onSelect, onMove }: { tasks: Task[]; onSelect: (t: Task) => void; onMove: (id: string, s: TaskStatus) => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="grid grid-cols-[auto_1fr_100px_80px_80px_80px_40px] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/20 font-semibold">
          <span>P</span><span>Title</span><span>Status</span><span>Assignee</span><span>Labels</span><span>Due</span><span />
        </div>
        {tasks.map(task => {
          const pConfig = priorityConfig[task.priority];
          const PIcon = pConfig.icon;
          const sConfig = statusConfig[task.status];
          const SIcon = sConfig.icon;
          const completedSubs = task.subtasks.filter(s => s.done).length;
          const totalSubs = task.subtasks.length;

          return (
            <button
              key={task.id}
              onClick={() => onSelect(task)}
              className="grid grid-cols-[auto_1fr_100px_80px_80px_80px_40px] gap-2 px-3 py-2.5 text-xs items-center hover:bg-muted/10 w-full text-left border-b border-border/10 transition-colors"
            >
              <PIcon className={cn('w-3.5 h-3.5', pConfig.color)} />
              <div className="truncate flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">{task.id}</span>
                <span>{task.title}</span>
                {totalSubs > 0 && (
                  <span className="text-[9px] text-muted-foreground">{completedSubs}/{totalSubs}</span>
                )}
              </div>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5 justify-center gap-0.5', sConfig.color)}>
                <SIcon className="w-3 h-3" />{sConfig.label}
              </Badge>
              <div>{task.assignee ? (
                <Avatar className="w-5 h-5"><AvatarFallback className={cn('text-[8px]', task.assignee.color)}>{task.assignee.initials}</AvatarFallback></Avatar>
              ) : <span className="text-muted-foreground">—</span>}</div>
              <div className="flex gap-0.5 overflow-hidden">
                {task.labels.slice(0, 1).map(l => <Badge key={l} variant="outline" className="text-[8px] px-1 h-3.5 shrink-0">{l}</Badge>)}
              </div>
              <span className="text-muted-foreground">{task.dueDate ? `${task.dueDate.getMonth() + 1}/${task.dueDate.getDate()}` : '—'}</span>
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ─── Timeline View ──────────────────────────
function TimelineView({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  const sorted = useMemo(() => {
    return [...tasks]
      .filter(t => t.dueDate || t.createdAt)
      .sort((a, b) => (a.dueDate || a.createdAt).getTime() - (b.dueDate || b.createdAt).getTime());
  }, [tasks]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="relative border-l-2 border-border/30 ml-6 space-y-4">
          {sorted.map(task => {
            const sConfig = statusConfig[task.status];
            const SIcon = sConfig.icon;
            const date = task.dueDate || task.createdAt;
            const completedSubs = task.subtasks.filter(s => s.done).length;
            const totalSubs = task.subtasks.length;

            return (
              <div key={task.id} className="relative pl-8">
                <div className={cn(
                  'absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center',
                  task.status === 'done' ? 'border-[hsl(150,100%,60%)]' : task.status === 'in_progress' ? 'border-[hsl(45,100%,65%)]' : 'border-border'
                )}>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    task.status === 'done' ? 'bg-[hsl(150,100%,60%)]' : task.status === 'in_progress' ? 'bg-[hsl(45,100%,65%)] animate-pulse' : 'bg-border'
                  )} />
                </div>
                <button onClick={() => onSelect(task)} className="w-full text-left">
                  <Card className="p-3 hover:bg-muted/10 transition-colors border-border/20">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">{date.getMonth() + 1}/{date.getDate()}</span>
                      <Badge variant="outline" className={cn('text-[10px] h-4 gap-0.5', sConfig.color)}>
                        <SIcon className="w-2.5 h-2.5" />{sConfig.label}
                      </Badge>
                      <span className="text-xs font-medium truncate flex-1">{task.title}</span>
                      {totalSubs > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Progress value={totalSubs > 0 ? completedSubs / totalSubs * 100 : 0} className="w-12 h-1" />
                          <span className="text-[9px] text-muted-foreground">{completedSubs}/{totalSubs}</span>
                        </div>
                      )}
                      {task.assignee && <Avatar className="w-5 h-5"><AvatarFallback className={cn('text-[8px]', task.assignee.color)}>{task.assignee.initials}</AvatarFallback></Avatar>}
                    </div>
                  </Card>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Task Detail Panel ──────────────────────
function TaskDetailPanel({ task, onClose, onMove, onToggleSubtask, onAddSubtask, onDelete }: {
  task: Task; onClose: () => void; onMove: (id: string, s: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newSubtask, setNewSubtask] = useState('');
  const sConfig = statusConfig[task.status];
  const SIcon = sConfig.icon;
  const pConfig = priorityConfig[task.priority];
  const PIcon = pConfig.icon;
  const completedSubs = task.subtasks.filter(s => s.done).length;
  const totalSubs = task.subtasks.length;
  const progress = totalSubs > 0 ? Math.round(completedSubs / totalSubs * 100) : 0;

  return (
    <div className="w-96 border-l border-border/30 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">{task.id}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>✕</Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <h2 className="text-base font-semibold leading-tight">{task.title}</h2>

          {/* Progress */}
          {totalSubs > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-xs font-medium text-primary">{progress}%</span>
            </div>
          )}

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Status</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-7 gap-1 text-xs w-full justify-start', sConfig.color)}>
                    <SIcon className="w-3.5 h-3.5" />{sConfig.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {statuses.map(s => {
                    const sc = statusConfig[s];
                    const SI = sc.icon;
                    return <DropdownMenuItem key={s} onClick={() => onMove(task.id, s)}><SI className={cn('w-4 h-4 mr-2', sc.color)} />{sc.label}</DropdownMenuItem>;
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Priority</p>
              <Badge variant="outline" className={cn('text-xs gap-1', pConfig.color)}>
                <PIcon className="w-3 h-3" />{pConfig.label}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Assignee</p>
              <div className="flex items-center gap-1.5">
                {task.assignee ? (
                  <><Avatar className="w-5 h-5"><AvatarFallback className={cn('text-[8px]', task.assignee.color)}>{task.assignee.initials}</AvatarFallback></Avatar>
                  <span>{task.assignee.name}</span></>
                ) : <span className="text-muted-foreground">Unassigned</span>}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Due Date</p>
              <p>{task.dueDate ? task.dueDate.toLocaleDateString() : 'None'}</p>
            </div>
            {task.estimate && (
              <div>
                <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Estimate</p>
                <p className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.estimate}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Project</p>
              <p>{task.project || 'None'}</p>
            </div>
          </div>

          {/* Labels */}
          {task.labels.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Labels</p>
              <div className="flex gap-1 flex-wrap">
                {task.labels.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Subtasks {totalSubs > 0 && `(${completedSubs}/${totalSubs})`}
              </p>
            </div>
            <div className="space-y-1.5">
              {task.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={st.done}
                    onCheckedChange={() => onToggleSubtask(task.id, st.id)}
                  />
                  <span className={cn('text-sm flex-1', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                </div>
              ))}
              {/* Add subtask */}
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubtask.trim()) {
                      onAddSubtask(task.id, newSubtask);
                      setNewSubtask('');
                    }
                  }}
                  placeholder="Add subtask..."
                  className="h-7 text-xs bg-muted/20 border-border/30 flex-1"
                />
                <Button
                  size="sm" className="h-7 w-7 p-0"
                  disabled={!newSubtask.trim()}
                  onClick={() => { if (newSubtask.trim()) { onAddSubtask(task.id, newSubtask); setNewSubtask(''); } }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Description</p>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
