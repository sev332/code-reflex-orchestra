// Pro-grade task manager: Kanban, list, Gantt, detail panel, bulk ops, keyboard shortcuts, activity feed
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Search, Filter, MoreHorizontal, Clock, Tag,
  KanbanSquare, List, Calendar as CalendarIcon, Wand2, AlertCircle,
  ArrowUp, ArrowRight, ArrowDown, Trash2, MessageSquare,
  CheckCircle2, Circle, Timer, PauseCircle, GripVertical,
  ChevronRight, ChevronDown, BarChart3, Zap, X, Link2,
  ArrowUpDown, Layers, Users, Pen, CalendarDays, GanttChart,
  Activity, Send, CheckSquare, Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, startOfDay, isToday, isBefore } from 'date-fns';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
type ViewMode = 'kanban' | 'list' | 'gantt';
type SortKey = 'priority' | 'dueDate' | 'createdAt' | 'assignee' | 'status' | 'title';
type GroupKey = 'none' | 'status' | 'priority' | 'assignee' | 'project' | 'label';

interface ActivityEntry {
  id: string;
  timestamp: Date;
  type: 'status_change' | 'priority_change' | 'assignee_change' | 'comment' | 'subtask_done' | 'created' | 'label_change';
  description: string;
  actor?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

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
  startDate?: Date;
  createdAt: Date;
  subtasks: SubTask[];
  comments: Comment[];
  project?: string;
  estimate?: string;
  dependencies: string[];
  blockedBy: string[];
  activity: ActivityEntry[];
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted/10' },
  todo: { label: 'To Do', icon: Circle, color: 'text-[hsl(210,80%,60%)]', bgColor: 'bg-[hsl(210,80%,60%)]/5' },
  in_progress: { label: 'In Progress', icon: Timer, color: 'text-[hsl(45,100%,65%)]', bgColor: 'bg-[hsl(45,100%,65%)]/5' },
  review: { label: 'Review', icon: PauseCircle, color: 'text-[hsl(270,80%,65%)]', bgColor: 'bg-[hsl(270,80%,65%)]/5' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-[hsl(150,100%,60%)]', bgColor: 'bg-[hsl(150,100%,60%)]/5' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ComponentType<any>; color: string; order: number }> = {
  urgent: { label: 'Urgent', icon: AlertCircle, color: 'text-destructive', order: 0 },
  high: { label: 'High', icon: ArrowUp, color: 'text-[hsl(30,100%,60%)]', order: 1 },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-[hsl(45,100%,65%)]', order: 2 },
  low: { label: 'Low', icon: ArrowDown, color: 'text-[hsl(210,70%,55%)]', order: 3 },
};

const ASSIGNEES = [
  { name: 'Alex', initials: 'AC', color: 'bg-primary/20 text-primary' },
  { name: 'Jordan', initials: 'JL', color: 'bg-[hsl(270,80%,60%)]/20 text-[hsl(270,90%,75%)]' },
  { name: 'Sam', initials: 'SR', color: 'bg-[hsl(150,100%,60%)]/20 text-[hsl(150,80%,70%)]' },
];

const ALL_LABELS = ['Spreadsheet', 'Core', 'Calendar', 'Email', 'AI', 'UI', '3D', 'Creative', 'Terminal', 'Infra', 'Database', 'Files', 'Notes', 'Knowledge', 'Bug'];

const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

function genId() { return 'T-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
function genSubId() { return 's-' + Math.random().toString(36).slice(2, 8); }
function genActId() { return 'a-' + Math.random().toString(36).slice(2, 8); }

const demoTasks: Task[] = [
  { id: 'T-A1B2', title: 'Implement canvas-based spreadsheet grid', description: 'Build a high-performance canvas renderer for the spreadsheet grid with virtual scrolling support.', status: 'done', priority: 'high', assignee: ASSIGNEES[0], labels: ['Spreadsheet', 'Core'], createdAt: new Date(2026, 2, 1), startDate: new Date(2026, 2, 1), dueDate: new Date(2026, 2, 7), estimate: '8h', comments: [{ id: 'c1', text: 'Grid rendering is complete, moving to formula parser.', author: 'Alex', timestamp: new Date(2026, 2, 3) }], project: 'Browser OS', subtasks: [{ id: 's-1', title: 'Grid rendering', done: true }, { id: 's-2', title: 'Cell selection', done: true }, { id: 's-3', title: 'Formula parser', done: true }], dependencies: [], blockedBy: [], activity: [{ id: 'a1', timestamp: new Date(2026, 2, 1), type: 'created', description: 'Task created' }, { id: 'a2', timestamp: new Date(2026, 2, 7), type: 'status_change', description: 'Status → Done', actor: 'Alex' }] },
  { id: 'T-C3D4', title: 'Build calendar week/day views', status: 'in_progress', priority: 'high', assignee: ASSIGNEES[1], labels: ['Calendar'], createdAt: new Date(2026, 2, 3), startDate: new Date(2026, 2, 4), dueDate: new Date(2026, 2, 10), estimate: '6h', project: 'Browser OS', comments: [], subtasks: [{ id: 's-4', title: 'Week view grid', done: true }, { id: 's-5', title: 'Day view', done: false }, { id: 's-6', title: 'Drag to create', done: false }], dependencies: [], blockedBy: [], activity: [{ id: 'a3', timestamp: new Date(2026, 2, 3), type: 'created', description: 'Task created' }] },
  { id: 'T-E5F6', title: 'Email AI drafting integration', status: 'todo', priority: 'medium', labels: ['Email', 'AI'], createdAt: new Date(2026, 2, 5), estimate: '4h', project: 'Browser OS', comments: [], subtasks: [], dependencies: ['T-A1B2'], blockedBy: [], activity: [{ id: 'a4', timestamp: new Date(2026, 2, 5), type: 'created', description: 'Task created' }] },
  { id: 'T-G7H8', title: 'App Launcher search optimization', status: 'todo', priority: 'medium', assignee: ASSIGNEES[2], labels: ['UI'], createdAt: new Date(2026, 2, 5), startDate: new Date(2026, 2, 8), dueDate: new Date(2026, 2, 14), project: 'Browser OS', comments: [], subtasks: [], dependencies: [], blockedBy: [], activity: [] },
  { id: 'T-I9J0', title: '3D Studio shader library browser', status: 'backlog', priority: 'high', labels: ['3D', 'Creative'], createdAt: new Date(2026, 2, 4), project: 'Browser OS', estimate: '12h', comments: [], subtasks: [], dependencies: [], blockedBy: [], activity: [] },
  { id: 'T-K1L2', title: 'Terminal WebSocket connection', status: 'backlog', priority: 'low', labels: ['Terminal', 'Infra'], createdAt: new Date(2026, 2, 2), project: 'Browser OS', comments: [], subtasks: [], dependencies: [], blockedBy: [], activity: [] },
  { id: 'T-M3N4', title: 'Database explorer schema visualizer', status: 'review', priority: 'medium', assignee: ASSIGNEES[0], labels: ['Database'], createdAt: new Date(2026, 2, 2), startDate: new Date(2026, 2, 3), dueDate: new Date(2026, 2, 8), project: 'Browser OS', comments: [{ id: 'c2', text: 'ERD looks great, just need export SVG.', author: 'Jordan', timestamp: new Date(2026, 2, 6) }, { id: 'c3', text: 'Working on it now.', author: 'Alex', timestamp: new Date(2026, 2, 7) }], subtasks: [{ id: 's-7', title: 'ERD rendering', done: true }, { id: 's-8', title: 'Relation lines', done: true }, { id: 's-9', title: 'Export SVG', done: false }], dependencies: [], blockedBy: [], activity: [] },
  { id: 'T-O5P6', title: 'File manager drag-drop upload', status: 'todo', priority: 'low', labels: ['Files'], createdAt: new Date(2026, 2, 6), startDate: new Date(2026, 2, 11), dueDate: new Date(2026, 2, 16), project: 'Browser OS', comments: [], subtasks: [], dependencies: [], blockedBy: [], activity: [] },
  { id: 'T-Q7R8', title: 'Notes wiki bidirectional linking', status: 'in_progress', priority: 'medium', assignee: ASSIGNEES[1], labels: ['Notes', 'Knowledge'], createdAt: new Date(2026, 2, 1), startDate: new Date(2026, 2, 2), dueDate: new Date(2026, 2, 12), project: 'Browser OS', estimate: '10h', comments: [{ id: 'c4', text: 'Backlinks panel is tricky with large datasets.', author: 'Jordan', timestamp: new Date(2026, 2, 5) }], subtasks: [{ id: 's-10', title: 'Parse [[links]]', done: true }, { id: 's-11', title: 'Backlinks panel', done: false }], dependencies: [], blockedBy: [], activity: [] },
  { id: 'T-S9T0', title: 'Fix right drawer resize handle z-index', status: 'done', priority: 'urgent', assignee: ASSIGNEES[1], labels: ['Bug', 'UI'], createdAt: new Date(2026, 2, 6), startDate: new Date(2026, 2, 6), dueDate: new Date(2026, 2, 6), project: 'Browser OS', comments: [], subtasks: [], dependencies: [], blockedBy: [], activity: [] },
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
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [groupKey, setGroupKey] = useState<GroupKey>('status');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Keep selectedTask in sync with tasks
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
      else setSelectedTask(null);
    }
  }, [tasks]);

  // ─── AI Integration ──────────────────────────
  const { notifyChange } = useAIAppIntegration({
    appId: 'tasks',
    getContext: () => {
      const byStatus = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
      tasks.forEach(t => byStatus[t.status]++);
      const overdue = tasks.filter(t => t.dueDate && t.status !== 'done' && t.dueDate < new Date()).length;
      return {
        appId: 'tasks', appName: 'Tasks',
        summary: `${tasks.length} tasks (${byStatus.in_progress} in progress, ${byStatus.todo} to do, ${overdue} overdue). View: ${viewMode}.`,
        activeView: viewMode, itemCount: tasks.length,
        selectedItems: selectedTask ? [selectedTask.id] : [],
        metadata: { byStatus, overdue, viewMode, sortKey, groupKey },
      };
    },
    onAction: async (action) => {
      switch (action.capabilityId) {
        case 'tasks.list': return { success: true, data: tasks.map(t => `${t.id}: ${t.title} [${t.status}]`).join('\n') };
        case 'tasks.analyze': return { success: true, data: { total: tasks.length } };
        default: return { success: false, error: `Unknown: ${action.capabilityId}` };
      }
    },
  });
  useEffect(() => { notifyChange(); }, [tasks.length, viewMode, selectedTask?.id]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const addActivity = useCallback((taskId: string, entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, activity: [...t.activity, { ...entry, id: genActId(), timestamp: new Date() }] };
    }));
  }, []);

  const addTask = useCallback((title: string, status: TaskStatus) => {
    if (!title.trim()) return;
    const task: Task = {
      id: genId(), title, status, priority: 'medium', labels: [],
      createdAt: new Date(), project: 'Browser OS', comments: [], subtasks: [],
      dependencies: [], blockedBy: [],
      activity: [{ id: genActId(), timestamp: new Date(), type: 'created', description: 'Task created' }],
    };
    setTasks(prev => [task, ...prev]);
  }, []);

  const moveTask = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const oldLabel = statusConfig[t.status].label;
      const newLabel = statusConfig[newStatus].label;
      return {
        ...t,
        status: newStatus,
        activity: [...t.activity, { id: genActId(), timestamp: new Date(), type: 'status_change' as const, description: `${oldLabel} → ${newLabel}` }],
      };
    }));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const sub = t.subtasks.find(s => s.id === subtaskId);
      return {
        ...t,
        subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s),
        activity: [...t.activity, { id: genActId(), timestamp: new Date(), type: 'subtask_done' as const, description: `${sub?.done ? 'Reopened' : 'Completed'}: ${sub?.title}` }],
      };
    }));
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const sub: SubTask = { id: genSubId(), title, done: false };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [selectedTask]);

  const addComment = useCallback((taskId: string, text: string) => {
    const comment: Comment = { id: genActId(), text, author: 'You', timestamp: new Date() };
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        comments: [...t.comments, comment],
        activity: [...t.activity, { id: genActId(), timestamp: new Date(), type: 'comment' as const, description: `Commented: "${text.slice(0, 50)}${text.length > 50 ? '…' : ''}"` }],
      };
    }));
  }, []);

  const counts = useMemo(() => {
    const m: Record<TaskStatus, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
    filtered.forEach(t => m[t.status]++);
    return m;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => t.dueDate && isBefore(t.dueDate, startOfDay(new Date())) && t.status !== 'done').length;
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

  // Bulk operations
  const toggleSelect = useCallback((id: string, shiftKey?: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map(t => t.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const bulkMove = useCallback((status: TaskStatus) => {
    selectedIds.forEach(id => moveTask(id, status));
    deselectAll();
  }, [selectedIds, moveTask, deselectAll]);

  const bulkSetPriority = useCallback((p: TaskPriority) => {
    selectedIds.forEach(id => updateTask(id, { priority: p }));
    deselectAll();
  }, [selectedIds, updateTask, deselectAll]);

  const bulkDelete = useCallback(() => {
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
    if (selectedTask && selectedIds.has(selectedTask.id)) setSelectedTask(null);
    deselectAll();
  }, [selectedIds, selectedTask, deselectAll]);

  const bulkAssign = useCallback((assignee: typeof ASSIGNEES[0] | undefined) => {
    selectedIds.forEach(id => updateTask(id, { assignee }));
    deselectAll();
  }, [selectedIds, updateTask, deselectAll]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (selectedTask) { setSelectedTask(null); return; }
        if (selectedIds.size > 0) { deselectAll(); return; }
        if (searchQuery) { setSearchQuery(''); return; }
      }
      if (isInput) return;

      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setInlineCreateColumn('todo');
        return;
      }
      if (e.key >= '1' && e.key <= '4' && selectedTask) {
        const p = priorities[parseInt(e.key) - 1];
        updateTask(selectedTask.id, { priority: p });
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTask && !isInput) {
        deleteTask(selectedTask.id);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filtered.length) {
        setSelectedTask(filtered[focusedIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTask, selectedIds, searchQuery, filtered, focusedIndex, deselectAll, updateTask, deleteTask]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 shrink-0">
        <h2 className="text-sm font-semibold">Tasks</h2>

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
          <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
            {stats.done}/{stats.total}
          </Badge>
        </div>

        <div className="flex-1" />

        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search tasks… ( / )"
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

        {/* Sort (list/gantt) */}
        {(viewMode === 'list' || viewMode === 'gantt') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['priority', 'dueDate', 'createdAt', 'title', 'status', 'assignee'] as SortKey[]).map(k => (
                <DropdownMenuItem key={k} onClick={() => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }}>
                  {k === sortKey && <span className="mr-1">{sortAsc ? '↑' : '↓'}</span>}
                  {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Group (list) */}
        {viewMode === 'list' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Layers className="w-3.5 h-3.5" /> Group
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['none', 'status', 'priority', 'assignee', 'project'] as GroupKey[]).map(k => (
                <DropdownMenuItem key={k} onClick={() => setGroupKey(k)}>
                  {groupKey === k && <CheckCircle2 className="w-3 h-3 mr-1 text-primary" />}
                  {k === 'none' ? 'No grouping' : k.charAt(0).toUpperCase() + k.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5">
          {([['kanban', KanbanSquare], ['list', List], ['gantt', GanttChart]] as [ViewMode, React.ComponentType<any>][]).map(([v, Icon]) => (
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
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border-b border-primary/20 shrink-0">
          <Checkbox checked={selectedIds.size === filtered.length} onCheckedChange={(c) => c ? selectAll() : deselectAll()} />
          <span className="text-xs font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-[10px]">Move to…</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {statuses.map(s => {
                const sc = statusConfig[s]; const SI = sc.icon;
                return <DropdownMenuItem key={s} onClick={() => bulkMove(s)}><SI className={cn('w-3 h-3 mr-1', sc.color)} />{sc.label}</DropdownMenuItem>;
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-[10px]">Priority</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {priorities.map(p => {
                const pc = priorityConfig[p]; const PI = pc.icon;
                return <DropdownMenuItem key={p} onClick={() => bulkSetPriority(p)}><PI className={cn('w-3 h-3 mr-1', pc.color)} />{pc.label}</DropdownMenuItem>;
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-[10px]">Assign</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ASSIGNEES.map(a => (
                <DropdownMenuItem key={a.name} onClick={() => bulkAssign(a)}>{a.name}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => bulkAssign(undefined)}>Unassign</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="h-6 text-[10px] text-destructive" onClick={bulkDelete}>
            <Trash2 className="w-3 h-3 mr-0.5" /> Delete
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={deselectAll}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
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
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}
          {viewMode === 'list' && (
            <ListView
              tasks={filtered}
              onSelect={setSelectedTask}
              onMove={moveTask}
              sortKey={sortKey}
              sortAsc={sortAsc}
              groupKey={groupKey}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              focusedIndex={focusedIndex}
            />
          )}
          {viewMode === 'gantt' && (
            <GanttView tasks={filtered} onSelect={setSelectedTask} allTasks={tasks} />
          )}
        </div>

        {/* Detail panel */}
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            allTasks={tasks}
            onClose={() => setSelectedTask(null)}
            onMove={moveTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onAddComment={addComment}
            onAddActivity={addActivity}
          />
        )}
      </div>
    </div>
  );
}

// ─── Kanban View ────────────────────────────
function KanbanView({ tasks, counts, onMove, onSelect, onDragStart, onDragOver, onDrop, onDragEnd, dragOverColumn, draggedTaskId, inlineCreateColumn, inlineCreateTitle, setInlineCreateColumn, setInlineCreateTitle, onInlineCreate, inlineInputRef, selectedIds, onToggleSelect }: {
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
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
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
                    isSelected={selectedIds.has(task.id)}
                    onToggleSelect={() => onToggleSelect(task.id)}
                  />
                ))}

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

function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging, isSelected, onToggleSelect }: {
  task: Task; onClick: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void; isDragging: boolean;
  isSelected: boolean; onToggleSelect: () => void;
}) {
  const pConfig = priorityConfig[task.priority];
  const PIcon = pConfig.icon;
  const completedSubs = task.subtasks.filter(s => s.done).length;
  const totalSubs = task.subtasks.length;
  const progress = totalSubs > 0 ? Math.round(completedSubs / totalSubs * 100) : 0;
  const isOverdue = task.dueDate && isBefore(task.dueDate, startOfDay(new Date())) && task.status !== 'done';
  const isBlocked = task.blockedBy.length > 0;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'p-3 cursor-pointer hover:bg-muted/10 transition-all border-border/20 bg-card/60 group',
        isDragging && 'opacity-40 scale-95 rotate-1',
        isSelected && 'ring-2 ring-primary/50 border-primary/30',
        isOverdue && 'border-destructive/30',
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="mt-0.5" onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}>
          <Checkbox checked={isSelected} className="opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100" />
        </div>
        <PIcon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', pConfig.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">{task.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{task.id}</p>
        </div>
      </div>

      {isBlocked && (
        <div className="flex items-center gap-1 mb-1.5 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[9px]">
          <Link2 className="w-2.5 h-2.5" /> Blocked
        </div>
      )}

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
        {isOverdue && <Badge variant="outline" className="text-[8px] px-1 h-3.5 text-destructive border-destructive/30">Overdue</Badge>}
        {task.dueDate && !isOverdue && (
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <CalendarDays className="w-2.5 h-2.5" />{format(task.dueDate, 'M/d')}
          </span>
        )}
        {task.estimate && (
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{task.estimate}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{task.comments.length}</span>
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

// ─── List View with Sorting & Grouping ──────
function ListView({ tasks, onSelect, onMove, sortKey, sortAsc, groupKey, selectedIds, onToggleSelect, focusedIndex }: {
  tasks: Task[]; onSelect: (t: Task) => void; onMove: (id: string, s: TaskStatus) => void;
  sortKey: SortKey; sortAsc: boolean; groupKey: GroupKey;
  selectedIds: Set<string>; onToggleSelect: (id: string) => void;
  focusedIndex: number;
}) {
  const sorted = useMemo(() => {
    const list = [...tasks];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'priority': cmp = priorityConfig[a.priority].order - priorityConfig[b.priority].order; break;
        case 'dueDate': cmp = (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity); break;
        case 'createdAt': cmp = a.createdAt.getTime() - b.createdAt.getTime(); break;
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'status': cmp = statuses.indexOf(a.status) - statuses.indexOf(b.status); break;
        case 'assignee': cmp = (a.assignee?.name ?? 'zzz').localeCompare(b.assignee?.name ?? 'zzz'); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [tasks, sortKey, sortAsc]);

  const groups = useMemo(() => {
    if (groupKey === 'none') return [{ key: 'all', label: 'All Tasks', tasks: sorted }];
    const map = new Map<string, Task[]>();
    sorted.forEach(t => {
      let key: string;
      switch (groupKey) {
        case 'status': key = t.status; break;
        case 'priority': key = t.priority; break;
        case 'assignee': key = t.assignee?.name ?? 'Unassigned'; break;
        case 'project': key = t.project ?? 'No Project'; break;
        default: key = 'all';
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([key, tasks]) => ({
      key,
      label: groupKey === 'status' ? statusConfig[key as TaskStatus]?.label ?? key :
             groupKey === 'priority' ? priorityConfig[key as TaskPriority]?.label ?? key : key,
      tasks,
    }));
  }, [sorted, groupKey]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  let globalIdx = -1;

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        {/* Header */}
        <div className="grid grid-cols-[28px_auto_1fr_100px_80px_80px_80px_40px] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/20 font-semibold">
          <span />
          <span>P</span>
          <span>Title</span>
          <span>Status</span>
          <span>Assignee</span>
          <span>Labels</span>
          <span>Due</span>
          <span />
        </div>

        {groups.map(group => (
          <div key={group.key}>
            {groupKey !== 'none' && (
              <button
                onClick={() => toggleGroup(group.key)}
                className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-muted/10 transition-colors"
              >
                {collapsedGroups.has(group.key) ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span className="text-xs font-semibold">{group.label}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">{group.tasks.length}</Badge>
              </button>
            )}
            {!collapsedGroups.has(group.key) && group.tasks.map(task => {
              globalIdx++;
              const idx = globalIdx;
              const pConfig = priorityConfig[task.priority];
              const PIcon = pConfig.icon;
              const sConfig = statusConfig[task.status];
              const SIcon = sConfig.icon;
              const completedSubs = task.subtasks.filter(s => s.done).length;
              const totalSubs = task.subtasks.length;
              const isOverdue = task.dueDate && isBefore(task.dueDate, startOfDay(new Date())) && task.status !== 'done';
              const isFocused = idx === focusedIndex;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'grid grid-cols-[28px_auto_1fr_100px_80px_80px_80px_40px] gap-2 px-3 py-2.5 text-xs items-center hover:bg-muted/10 w-full text-left border-b border-border/10 transition-colors cursor-pointer',
                    selectedIds.has(task.id) && 'bg-primary/5',
                    isFocused && 'ring-1 ring-inset ring-primary/40',
                  )}
                >
                  <div onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}>
                    <Checkbox checked={selectedIds.has(task.id)} />
                  </div>
                  <PIcon className={cn('w-3.5 h-3.5', pConfig.color)} />
                  <button onClick={() => onSelect(task)} className="truncate flex items-center gap-2 text-left">
                    <span className="text-muted-foreground font-mono text-[10px]">{task.id}</span>
                    <span>{task.title}</span>
                    {totalSubs > 0 && <span className="text-[9px] text-muted-foreground">{completedSubs}/{totalSubs}</span>}
                    {task.dependencies.length > 0 && <Link2 className="w-3 h-3 text-muted-foreground" />}
                  </button>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5 justify-center gap-0.5', sConfig.color)}>
                    <SIcon className="w-3 h-3" />{sConfig.label}
                  </Badge>
                  <div>{task.assignee ? (
                    <Avatar className="w-5 h-5"><AvatarFallback className={cn('text-[8px]', task.assignee.color)}>{task.assignee.initials}</AvatarFallback></Avatar>
                  ) : <span className="text-muted-foreground">—</span>}</div>
                  <div className="flex gap-0.5 overflow-hidden">
                    {task.labels.slice(0, 1).map(l => <Badge key={l} variant="outline" className="text-[8px] px-1 h-3.5 shrink-0">{l}</Badge>)}
                  </div>
                  <span className={cn('text-muted-foreground', isOverdue && 'text-destructive font-medium')}>
                    {task.dueDate ? format(task.dueDate, 'M/d') : '—'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statuses.map(s => {
                        const sc = statusConfig[s]; const SI = sc.icon;
                        return <DropdownMenuItem key={s} onClick={() => onMove(task.id, s)}><SI className={cn('w-3 h-3 mr-1', sc.color)} />{sc.label}</DropdownMenuItem>;
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Gantt Timeline View ────────────────────
function GanttView({ tasks, onSelect, allTasks }: { tasks: Task[]; onSelect: (t: Task) => void; allTasks: Task[] }) {
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('day');
  const cellWidth = zoom === 'day' ? 40 : zoom === 'week' ? 24 : 12;

  const { startDate, totalDays, sorted } = useMemo(() => {
    const withDates = tasks.filter(t => t.startDate || t.dueDate || t.createdAt);
    const sorted = [...withDates].sort((a, b) => {
      const aDate = a.startDate || a.dueDate || a.createdAt;
      const bDate = b.startDate || b.dueDate || b.createdAt;
      return aDate.getTime() - bDate.getTime();
    });
    const allDates = sorted.flatMap(t => [t.startDate, t.dueDate, t.createdAt].filter(Boolean) as Date[]);
    const minDate = allDates.length > 0 ? addDays(startOfDay(new Date(Math.min(...allDates.map(d => d.getTime())))), -2) : startOfDay(new Date());
    const maxDate = allDates.length > 0 ? addDays(startOfDay(new Date(Math.max(...allDates.map(d => d.getTime())))), 5) : addDays(new Date(), 14);
    const totalDays = Math.max(differenceInDays(maxDate, minDate), 14);
    return { startDate: minDate, totalDays, sorted };
  }, [tasks]);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
  }, [startDate, totalDays]);

  const today = startOfDay(new Date());
  const todayOffset = differenceInDays(today, startDate);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 shrink-0">
        <span className="text-[10px] text-muted-foreground font-medium">Zoom:</span>
        {(['day', 'week', 'month'] as const).map(z => (
          <Button key={z} variant={zoom === z ? 'secondary' : 'ghost'} size="sm" className="h-5 text-[10px] px-2" onClick={() => setZoom(z)}>
            {z.charAt(0).toUpperCase() + z.slice(1)}
          </Button>
        ))}
      </div>
      <ScrollArea className="flex-1">
        <div className="relative" style={{ minWidth: totalDays * cellWidth + 240 }}>
          {/* Date header */}
          <div className="flex sticky top-0 z-10 bg-background border-b border-border/20">
            <div className="w-60 shrink-0 px-3 py-1.5 text-[10px] text-muted-foreground font-semibold border-r border-border/20">Task</div>
            <div className="flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-center text-[9px] py-1.5 border-r border-border/10 shrink-0',
                    isToday(day) && 'bg-primary/10 font-bold text-primary',
                    day.getDay() === 0 || day.getDay() === 6 ? 'text-muted-foreground/50 bg-muted/5' : 'text-muted-foreground',
                  )}
                  style={{ width: cellWidth }}
                >
                  <div>{format(day, 'd')}</div>
                  <div className="text-[8px]">{format(day, 'EEE')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Today marker */}
          {todayOffset >= 0 && todayOffset < totalDays && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-primary/60 z-20 pointer-events-none"
              style={{ left: 240 + todayOffset * cellWidth + cellWidth / 2 }}
            />
          )}

          {/* Task rows */}
          {sorted.map(task => {
            const taskStart = task.startDate || task.dueDate || task.createdAt;
            const taskEnd = task.dueDate || (task.startDate ? addDays(task.startDate, 3) : addDays(task.createdAt, 1));
            const startOffset = differenceInDays(startOfDay(taskStart), startDate);
            const duration = Math.max(differenceInDays(startOfDay(taskEnd), startOfDay(taskStart)), 1);
            const sConfig = statusConfig[task.status];
            const pConfig = priorityConfig[task.priority];
            const PIcon = pConfig.icon;
            const barColor = task.status === 'done' ? 'bg-[hsl(150,100%,60%)]/40' :
                             task.status === 'in_progress' ? 'bg-[hsl(45,100%,65%)]/40' :
                             task.status === 'review' ? 'bg-[hsl(270,80%,65%)]/40' : 'bg-muted/40';

            return (
              <div key={task.id} className="flex items-center border-b border-border/10 hover:bg-muted/5 transition-colors">
                <button
                  onClick={() => onSelect(task)}
                  className="w-60 shrink-0 px-3 py-2 flex items-center gap-2 text-left truncate border-r border-border/20"
                >
                  <PIcon className={cn('w-3 h-3 shrink-0', pConfig.color)} />
                  <span className="text-xs truncate">{task.title}</span>
                </button>
                <div className="relative flex-1" style={{ height: 32 }}>
                  {/* Bar */}
                  <div
                    className={cn('absolute top-1.5 h-5 rounded-md cursor-pointer transition-colors hover:brightness-110 flex items-center px-2', barColor)}
                    style={{
                      left: startOffset * cellWidth,
                      width: Math.max(duration * cellWidth, cellWidth),
                    }}
                    onClick={() => onSelect(task)}
                  >
                    <span className="text-[9px] font-medium truncate">{task.title}</span>
                  </div>
                  {/* Dependency arrows */}
                  {task.dependencies.map(depId => {
                    const dep = allTasks.find(t => t.id === depId);
                    if (!dep) return null;
                    const depEnd = dep.dueDate || dep.createdAt;
                    const depEndOffset = differenceInDays(startOfDay(depEnd), startDate);
                    return (
                      <div
                        key={depId}
                        className="absolute top-4 h-[2px] bg-muted-foreground/30"
                        style={{
                          left: depEndOffset * cellWidth + cellWidth,
                          width: Math.max((startOffset - depEndOffset - 1) * cellWidth, 0),
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Task Detail Panel ──────────────────────
function TaskDetailPanel({ task, allTasks, onClose, onMove, onToggleSubtask, onAddSubtask, onDelete, onUpdate, onAddComment, onAddActivity }: {
  task: Task; allTasks: Task[];
  onClose: () => void; onMove: (id: string, s: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onAddComment: (taskId: string, text: string) => void;
  onAddActivity: (taskId: string, entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
}) {
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(task.description ?? '');
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitleValue(task.title); setDescValue(task.description ?? ''); }, [task.id]);
  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);

  const sConfig = statusConfig[task.status];
  const SIcon = sConfig.icon;
  const pConfig = priorityConfig[task.priority];
  const PIcon = pConfig.icon;
  const completedSubs = task.subtasks.filter(s => s.done).length;
  const totalSubs = task.subtasks.length;
  const progress = totalSubs > 0 ? Math.round(completedSubs / totalSubs * 100) : 0;

  const saveTitle = () => {
    if (titleValue.trim() && titleValue !== task.title) {
      onUpdate(task.id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const saveDesc = () => {
    onUpdate(task.id, { description: descValue.trim() || undefined });
    setEditingDesc(false);
  };

  return (
    <div className="w-[400px] border-l border-border/30 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">{task.id}</span>
        {task.dependencies.length > 0 && (
          <Badge variant="outline" className="text-[9px] gap-0.5"><Link2 className="w-2.5 h-2.5" />{task.dependencies.length} dep</Badge>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/20 shrink-0">
        {(['details', 'activity', 'comments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 text-xs py-2 transition-colors border-b-2 capitalize',
              activeTab === tab ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
            {tab === 'comments' && task.comments.length > 0 && (
              <Badge className="ml-1 bg-primary/20 text-primary text-[9px] px-1 h-3.5">{task.comments.length}</Badge>
            )}
            {tab === 'activity' && task.activity.length > 0 && (
              <Badge className="ml-1 bg-muted text-muted-foreground text-[9px] px-1 h-3.5">{task.activity.length}</Badge>
            )}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeTab === 'details' && (
            <>
              {/* Editable Title */}
              {editingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(task.title); setEditingTitle(false); } }}
                  className="text-base font-semibold border-primary/30 bg-primary/5"
                />
              ) : (
                <h2
                  className="text-base font-semibold leading-tight cursor-pointer hover:text-primary transition-colors group flex items-center gap-1"
                  onClick={() => setEditingTitle(true)}
                >
                  {task.title}
                  <Pen className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
              )}

              {/* Editable Description */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  Description
                  {!editingDesc && <Pen className="w-2.5 h-2.5 cursor-pointer hover:text-foreground" onClick={() => setEditingDesc(true)} />}
                </p>
                {editingDesc ? (
                  <div className="space-y-1.5">
                    <Textarea
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      placeholder="Add a description…"
                      className="min-h-[80px] text-sm bg-muted/20 border-border/30"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-[10px]" onClick={saveDesc}>Save</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setDescValue(task.description ?? ''); setEditingDesc(false); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-sm leading-relaxed text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => setEditingDesc(true)}
                  >
                    {task.description || 'Click to add description…'}
                  </p>
                )}
              </div>

              {/* Progress */}
              {totalSubs > 0 && (
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-xs font-medium text-primary">{progress}%</span>
                </div>
              )}

              {/* Properties grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Status */}
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
                        const sc = statusConfig[s]; const SI = sc.icon;
                        return <DropdownMenuItem key={s} onClick={() => onMove(task.id, s)}><SI className={cn('w-4 h-4 mr-2', sc.color)} />{sc.label}</DropdownMenuItem>;
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Priority */}
                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Priority</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={cn('h-7 gap-1 text-xs w-full justify-start', pConfig.color)}>
                        <PIcon className="w-3.5 h-3.5" />{pConfig.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {priorities.map(p => {
                        const pc = priorityConfig[p]; const PI = pc.icon;
                        return <DropdownMenuItem key={p} onClick={() => {
                          onUpdate(task.id, { priority: p });
                          onAddActivity(task.id, { type: 'priority_change', description: `Priority → ${pc.label}` });
                        }}><PI className={cn('w-4 h-4 mr-2', pc.color)} />{pc.label}</DropdownMenuItem>;
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Assignee */}
                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Assignee</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs w-full justify-start">
                        {task.assignee ? (
                          <><Avatar className="w-4 h-4"><AvatarFallback className={cn('text-[7px]', task.assignee.color)}>{task.assignee.initials}</AvatarFallback></Avatar>{task.assignee.name}</>
                        ) : 'Unassigned'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {ASSIGNEES.map(a => (
                        <DropdownMenuItem key={a.name} onClick={() => {
                          onUpdate(task.id, { assignee: a });
                          onAddActivity(task.id, { type: 'assignee_change', description: `Assigned to ${a.name}` });
                        }}>
                          <Avatar className="w-4 h-4 mr-2"><AvatarFallback className={cn('text-[7px]', a.color)}>{a.initials}</AvatarFallback></Avatar>
                          {a.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onUpdate(task.id, { assignee: undefined })}>Unassign</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Due Date */}
                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Due Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn('h-7 text-xs w-full justify-start gap-1', !task.dueDate && 'text-muted-foreground')}>
                        <CalendarDays className="w-3 h-3" />
                        {task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : 'Set date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={task.dueDate}
                        onSelect={(date) => onUpdate(task.id, { dueDate: date ?? undefined })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Estimate */}
                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Estimate</p>
                  <EditableField
                    value={task.estimate ?? ''}
                    placeholder="e.g. 4h"
                    onSave={(v) => onUpdate(task.id, { estimate: v || undefined })}
                  />
                </div>

                {/* Project */}
                <div>
                  <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Project</p>
                  <EditableField
                    value={task.project ?? ''}
                    placeholder="Project name"
                    onSave={(v) => onUpdate(task.id, { project: v || undefined })}
                  />
                </div>
              </div>

              {/* Labels */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Labels</p>
                <div className="flex gap-1 flex-wrap">
                  {task.labels.map(l => (
                    <Badge key={l} variant="outline" className="text-xs gap-0.5 group/label">
                      {l}
                      <X
                        className="w-2.5 h-2.5 cursor-pointer opacity-0 group-hover/label:opacity-100 transition-opacity"
                        onClick={() => onUpdate(task.id, { labels: task.labels.filter(x => x !== l) })}
                      />
                    </Badge>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5 gap-0.5">
                        <Plus className="w-2.5 h-2.5" /> Add
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {ALL_LABELS.filter(l => !task.labels.includes(l)).map(l => (
                        <DropdownMenuItem key={l} onClick={() => {
                          onUpdate(task.id, { labels: [...task.labels, l] });
                          onAddActivity(task.id, { type: 'label_change', description: `Added label: ${l}` });
                        }}>{l}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Dependencies</p>
                {task.dependencies.length > 0 ? (
                  <div className="space-y-1">
                    {task.dependencies.map(depId => {
                      const dep = allTasks.find(t => t.id === depId);
                      return (
                        <div key={depId} className="flex items-center gap-2 text-xs">
                          <Link2 className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-muted-foreground text-[10px]">{depId}</span>
                          <span className="truncate flex-1">{dep?.title ?? 'Unknown'}</span>
                          {dep && <Badge variant="outline" className={cn('text-[8px] h-3.5', statusConfig[dep.status].color)}>{statusConfig[dep.status].label}</Badge>}
                          <X className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => onUpdate(task.id, { dependencies: task.dependencies.filter(d => d !== depId) })} />
                        </div>
                      );
                    })}
                  </div>
                ) : <span className="text-xs text-muted-foreground">None</span>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] mt-1 gap-0.5"><Plus className="w-2.5 h-2.5" /> Add dependency</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {allTasks.filter(t => t.id !== task.id && !task.dependencies.includes(t.id)).slice(0, 10).map(t => (
                      <DropdownMenuItem key={t.id} onClick={() => onUpdate(task.id, { dependencies: [...task.dependencies, t.id] })}>
                        <span className="font-mono text-[10px] mr-1">{t.id}</span> {t.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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
                      <Checkbox checked={st.done} onCheckedChange={() => onToggleSubtask(task.id, st.id)} />
                      <span className={cn('text-sm flex-1', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSubtask.trim()) { onAddSubtask(task.id, newSubtask); setNewSubtask(''); }
                      }}
                      placeholder="Add subtask..."
                      className="h-7 text-xs bg-muted/20 border-border/30 flex-1"
                    />
                    <Button size="sm" className="h-7 w-7 p-0" disabled={!newSubtask.trim()} onClick={() => { if (newSubtask.trim()) { onAddSubtask(task.id, newSubtask); setNewSubtask(''); } }}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-2">
              {task.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                [...task.activity].reverse().map(entry => (
                  <div key={entry.id} className="flex items-start gap-2 py-1.5 border-b border-border/10">
                    <Activity className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">{entry.description}</p>
                      <p className="text-[10px] text-muted-foreground">{format(entry.timestamp, 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-3">
              {task.comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              )}
              {task.comments.map(c => (
                <div key={c.id} className="p-2.5 rounded-lg bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{c.author[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">{format(c.timestamp, 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-sm pl-7">{c.text}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-border/20">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 h-8 text-xs bg-muted/20 border-border/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) { onAddComment(task.id, newComment); setNewComment(''); }
                  }}
                />
                <Button size="sm" className="h-8 w-8 p-0" disabled={!newComment.trim()} onClick={() => { if (newComment.trim()) { onAddComment(task.id, newComment); setNewComment(''); } }}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Editable inline field ──────────────────
function EditableField({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  if (editing) {
    return (
      <Input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onSave(val); setEditing(false); } if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
        placeholder={placeholder}
        className="h-7 text-xs bg-muted/20 border-border/30"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="h-7 px-2 text-xs text-left w-full rounded-md border border-border/20 hover:border-border/40 transition-colors flex items-center"
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  );
}
