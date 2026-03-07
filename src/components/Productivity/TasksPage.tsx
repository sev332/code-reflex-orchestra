// Tasks & project management — Kanban + List + Timeline views
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Search, Filter, SortAsc, MoreHorizontal, Clock, Tag,
  KanbanSquare, List, Calendar, Wand2, AlertCircle,
  ArrowUp, ArrowRight, ArrowDown, Trash2, Edit, MessageSquare,
  CheckCircle2, Circle, Timer, PauseCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
type ViewMode = 'kanban' | 'list' | 'timeline';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: { name: string; initials: string };
  labels: string[];
  dueDate?: Date;
  createdAt: Date;
  subtasks?: { title: string; done: boolean }[];
  comments?: number;
  project?: string;
  estimate?: string;
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ComponentType<any>; color: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: 'text-muted-foreground' },
  todo: { label: 'To Do', icon: Circle, color: 'text-blue-400' },
  in_progress: { label: 'In Progress', icon: Timer, color: 'text-amber-400' },
  review: { label: 'Review', icon: PauseCircle, color: 'text-purple-400' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-400' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ComponentType<any>; color: string }> = {
  urgent: { label: 'Urgent', icon: AlertCircle, color: 'text-red-500' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-500' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-amber-500' },
  low: { label: 'Low', icon: ArrowDown, color: 'text-blue-400' },
};

const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

function genId() { return 'T-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }

const demoTasks: Task[] = [
  { id: 'T-A1B2', title: 'Implement canvas-based spreadsheet grid', status: 'done', priority: 'high', assignee: { name: 'Alex', initials: 'AC' }, labels: ['Spreadsheet', 'Core'], createdAt: new Date(2026, 2, 1), dueDate: new Date(2026, 2, 7), estimate: '8h', comments: 3, project: 'Browser OS', subtasks: [{ title: 'Grid rendering', done: true }, { title: 'Cell selection', done: true }, { title: 'Formula parser', done: true }] },
  { id: 'T-C3D4', title: 'Build calendar week/day views', status: 'in_progress', priority: 'high', assignee: { name: 'Jordan', initials: 'JL' }, labels: ['Calendar'], createdAt: new Date(2026, 2, 3), dueDate: new Date(2026, 2, 10), estimate: '6h', project: 'Browser OS' },
  { id: 'T-E5F6', title: 'Email AI drafting integration', status: 'todo', priority: 'medium', labels: ['Email', 'AI'], createdAt: new Date(2026, 2, 5), estimate: '4h', project: 'Browser OS' },
  { id: 'T-G7H8', title: 'App Launcher search optimization', status: 'todo', priority: 'medium', assignee: { name: 'Sam', initials: 'SR' }, labels: ['UI'], createdAt: new Date(2026, 2, 5), project: 'Browser OS' },
  { id: 'T-I9J0', title: '3D Studio shader library browser', status: 'backlog', priority: 'high', labels: ['3D', 'Creative'], createdAt: new Date(2026, 2, 4), project: 'Browser OS', estimate: '12h' },
  { id: 'T-K1L2', title: 'Terminal WebSocket connection', status: 'backlog', priority: 'low', labels: ['Terminal', 'Infra'], createdAt: new Date(2026, 2, 2), project: 'Browser OS' },
  { id: 'T-M3N4', title: 'Database explorer schema visualizer', status: 'review', priority: 'medium', assignee: { name: 'Alex', initials: 'AC' }, labels: ['Database'], createdAt: new Date(2026, 2, 2), dueDate: new Date(2026, 2, 8), project: 'Browser OS', comments: 5 },
  { id: 'T-O5P6', title: 'File manager drag-drop upload', status: 'todo', priority: 'low', labels: ['Files'], createdAt: new Date(2026, 2, 6), project: 'Browser OS' },
  { id: 'T-Q7R8', title: 'Notes wiki bidirectional linking', status: 'backlog', priority: 'medium', labels: ['Notes', 'Knowledge'], createdAt: new Date(2026, 2, 1), project: 'Browser OS', estimate: '10h' },
  { id: 'T-S9T0', title: 'Fix right drawer resize handle z-index', status: 'done', priority: 'urgent', assignee: { name: 'Jordan', initials: 'JL' }, labels: ['Bug', 'UI'], createdAt: new Date(2026, 2, 6), project: 'Browser OS' },
];

export function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');

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

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: genId(),
      title: newTaskTitle,
      status: newTaskStatus,
      priority: 'medium',
      labels: [],
      createdAt: new Date(),
      project: 'Browser OS',
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
    setShowNewTask(false);
  };

  const moveTask = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const counts = useMemo(() => {
    const m: Record<TaskStatus, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
    filtered.forEach(t => m[t.status]++);
    return m;
  }, [filtered]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 shrink-0">
        <h2 className="text-sm font-semibold">Tasks</h2>
        <Badge variant="outline" className="text-[10px]">{filtered.length} items</Badge>
        <div className="flex-1" />

        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs bg-muted/20 border-none"
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
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterLabels([])}>Clear filters</DropdownMenuItem>
              </>
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

        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowNewTask(true)}>
          <Plus className="w-3.5 h-3.5" /> Task
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> AI
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' && (
          <KanbanView tasks={filtered} counts={counts} onMove={moveTask} onSelect={setSelectedTask} onAddToColumn={(status) => { setNewTaskStatus(status); setShowNewTask(true); }} />
        )}
        {viewMode === 'list' && (
          <ListView tasks={filtered} onSelect={setSelectedTask} onMove={moveTask} />
        )}
        {viewMode === 'timeline' && (
          <TimelineView tasks={filtered} onSelect={setSelectedTask} />
        )}
      </div>

      {/* New task dialog */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50 max-w-md">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="bg-muted/30 border-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowNewTask(false)}>Cancel</Button>
            <Button size="sm" onClick={addTask}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task detail sheet */}
      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} onMove={moveTask} />
      )}
    </div>
  );
}

// ─── Kanban View ─────
function KanbanView({ tasks, counts, onMove, onSelect, onAddToColumn }: { tasks: Task[]; counts: Record<TaskStatus, number>; onMove: (id: string, s: TaskStatus) => void; onSelect: (t: Task) => void; onAddToColumn: (s: TaskStatus) => void }) {
  return (
    <div className="h-full flex gap-3 p-3 overflow-x-auto">
      {statuses.map(status => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const columnTasks = tasks.filter(t => t.status === status);

        return (
          <div key={status} className="w-72 shrink-0 flex flex-col bg-muted/10 rounded-xl border border-border/20">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 shrink-0">
              <Icon className={cn('w-4 h-4', config.color)} />
              <span className="text-xs font-medium">{config.label}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 h-4 ml-auto">{counts[status]}</Badge>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {columnTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => onSelect(task)} />
                ))}
              </div>
            </ScrollArea>

            <button
              onClick={() => onAddToColumn(status)}
              className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border-t border-border/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const pConfig = priorityConfig[task.priority];
  const PIcon = pConfig.icon;
  const completedSubs = task.subtasks?.filter(s => s.done).length || 0;
  const totalSubs = task.subtasks?.length || 0;

  return (
    <Card
      onClick={onClick}
      className="p-3 cursor-pointer hover:bg-white/5 transition-colors border-border/20 bg-background/60"
    >
      <div className="flex items-start gap-2 mb-2">
        <PIcon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', pConfig.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">{task.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{task.id}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {task.labels.slice(0, 2).map(l => (
          <Badge key={l} variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-primary/30 text-primary">{l}</Badge>
        ))}
        {task.labels.length > 2 && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">+{task.labels.length - 2}</Badge>}
        <div className="flex-1" />
        {totalSubs > 0 && (
          <span className="text-[10px] text-muted-foreground">{completedSubs}/{totalSubs}</span>
        )}
        {task.comments && task.comments > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{task.comments}</span>
        )}
        {task.assignee && (
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{task.assignee.initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}

// ─── List View ─────
function ListView({ tasks, onSelect, onMove }: { tasks: Task[]; onSelect: (t: Task) => void; onMove: (id: string, s: TaskStatus) => void }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="grid grid-cols-[auto_1fr_100px_80px_80px_100px_40px] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/20">
          <span>Priority</span><span>Title</span><span>Status</span><span>Assignee</span><span>Labels</span><span>Due</span><span />
        </div>
        {tasks.map(task => {
          const pConfig = priorityConfig[task.priority];
          const PIcon = pConfig.icon;
          const sConfig = statusConfig[task.status];
          const SIcon = sConfig.icon;
          return (
            <button
              key={task.id}
              onClick={() => onSelect(task)}
              className="grid grid-cols-[auto_1fr_100px_80px_80px_100px_40px] gap-2 px-3 py-2.5 text-xs items-center hover:bg-white/5 w-full text-left border-b border-border/10 transition-colors"
            >
              <PIcon className={cn('w-3.5 h-3.5', pConfig.color)} />
              <div className="truncate">
                <span className="text-muted-foreground mr-2">{task.id}</span>
                {task.title}
              </div>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 h-5 justify-center', sConfig.color)}>
                <SIcon className="w-3 h-3 mr-1" />{sConfig.label}
              </Badge>
              <div>{task.assignee ? (
                <Avatar className="w-5 h-5"><AvatarFallback className="text-[8px] bg-primary/20 text-primary">{task.assignee.initials}</AvatarFallback></Avatar>
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

// ─── Timeline View ─────
function TimelineView({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  const tasksWithDates = tasks.filter(t => t.dueDate || t.createdAt);
  const sorted = tasksWithDates.sort((a, b) => (a.dueDate || a.createdAt).getTime() - (b.dueDate || b.createdAt).getTime());

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="relative border-l-2 border-border/30 ml-6 space-y-4">
          {sorted.map((task, i) => {
            const sConfig = statusConfig[task.status];
            const SIcon = sConfig.icon;
            const date = task.dueDate || task.createdAt;
            return (
              <div key={task.id} className="relative pl-8">
                <div className={cn('absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center', 
                  task.status === 'done' ? 'border-emerald-500' : task.status === 'in_progress' ? 'border-amber-500' : 'border-border')}>
                  <div className={cn('w-2 h-2 rounded-full', 
                    task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-amber-500 animate-pulse' : 'bg-border')} />
                </div>
                <button onClick={() => onSelect(task)} className="w-full text-left">
                  <Card className="p-3 hover:bg-white/5 transition-colors border-border/20">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{date.getMonth() + 1}/{date.getDate()}</span>
                      <Badge variant="outline" className={cn('text-[10px] h-4', sConfig.color)}>{sConfig.label}</Badge>
                      <span className="text-xs font-medium truncate flex-1">{task.title}</span>
                      {task.assignee && <Avatar className="w-5 h-5"><AvatarFallback className="text-[8px] bg-primary/20 text-primary">{task.assignee.initials}</AvatarFallback></Avatar>}
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

// ─── Task Detail Panel ─────
function TaskDetailPanel({ task, onClose, onMove }: { task: Task; onClose: () => void; onMove: (id: string, s: TaskStatus) => void }) {
  const sConfig = statusConfig[task.status];
  const SIcon = sConfig.icon;
  const pConfig = priorityConfig[task.priority];
  const PIcon = pConfig.icon;

  return (
    <div className="fixed right-12 top-12 bottom-0 w-96 bg-background/95 backdrop-blur-xl border-l border-border/30 z-40 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">{task.id}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">{task.title}</h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-7 gap-1 text-xs w-full', sConfig.color)}>
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
              <p className="text-muted-foreground mb-1">Priority</p>
              <Badge variant="outline" className={cn('text-xs', pConfig.color)}><PIcon className="w-3 h-3 mr-1" />{pConfig.label}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Assignee</p>
              <p>{task.assignee?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Due Date</p>
              <p>{task.dueDate ? task.dueDate.toLocaleDateString() : 'None'}</p>
            </div>
            {task.estimate && (
              <div>
                <p className="text-muted-foreground mb-1">Estimate</p>
                <p>{task.estimate}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1">Project</p>
              <p>{task.project || 'None'}</p>
            </div>
          </div>

          {task.labels.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Labels</p>
              <div className="flex gap-1 flex-wrap">
                {task.labels.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
              </div>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Subtasks ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})</p>
              <div className="space-y-1.5">
                {task.subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox checked={st.done} />
                    <span className={cn('text-sm', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{task.description}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
