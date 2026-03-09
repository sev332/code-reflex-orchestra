// Database Explorer — Visual ERD, SQL query editor, table inspector, data browser
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Database, Table2, Play, Search, ChevronRight, ChevronDown,
  Key, Hash, Calendar, Type, ToggleLeft, FileJson, Link2,
  ArrowUpDown, Wand2, RefreshCw, Copy, Download, Plus,
  Eye, Code2, GitBranch, Columns, Filter, MoreVertical, Trash2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─────────── Types ─────────── */
interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isForeign: boolean;
  defaultValue?: string;
  foreignTable?: string;
  foreignColumn?: string;
}

interface TableDef {
  name: string;
  schema: string;
  columns: Column[];
  rowCount: number;
  size: string;
  indexes?: string[];
  rls?: boolean;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  time: number;
  query: string;
}

interface QueryHistoryItem {
  query: string;
  time: number;
  rowCount: number;
  timestamp: Date;
}

const typeIcons: Record<string, React.ComponentType<any>> = {
  uuid: Key, text: Type, integer: Hash, timestamp: Calendar, boolean: ToggleLeft,
  jsonb: FileJson, bigint: Hash, numeric: Hash, 'ARRAY': FileJson,
  'USER-DEFINED': FileJson, real: Hash, varchar: Type,
};

/* ─────────── Mock data ─────────── */
const mockTables: TableDef[] = [
  { name: 'agents', schema: 'public', rowCount: 8, size: '48 KB', rls: true,
    indexes: ['agents_pkey', 'idx_agents_status'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'role', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'status', type: 'text', nullable: false, isPrimary: false, isForeign: false, defaultValue: "'idle'" },
      { name: 'capabilities', type: 'ARRAY', nullable: false, isPrimary: false, isForeign: false },
      { name: 'performance_score', type: 'numeric', nullable: true, isPrimary: false, isForeign: false, defaultValue: '0.5' },
      { name: 'configuration', type: 'jsonb', nullable: true, isPrimary: false, isForeign: false },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false, defaultValue: 'now()' },
      { name: 'updated_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false, defaultValue: 'now()' },
    ] },
  { name: 'tasks', schema: 'public', rowCount: 24, size: '128 KB', rls: true,
    indexes: ['tasks_pkey', 'idx_tasks_status', 'idx_tasks_agent'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'title', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'status', type: 'text', nullable: false, isPrimary: false, isForeign: false, defaultValue: "'pending'" },
      { name: 'priority', type: 'integer', nullable: true, isPrimary: false, isForeign: false, defaultValue: '5' },
      { name: 'assigned_agent_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'agents', foreignColumn: 'id' },
      { name: 'parent_task_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'tasks', foreignColumn: 'id' },
      { name: 'description', type: 'text', nullable: true, isPrimary: false, isForeign: false },
      { name: 'progress', type: 'numeric', nullable: true, isPrimary: false, isForeign: false, defaultValue: '0' },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false },
    ] },
  { name: 'conversations', schema: 'public', rowCount: 156, size: '512 KB', rls: true,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'session_id', type: 'uuid', nullable: false, isPrimary: false, isForeign: false },
      { name: 'title', type: 'text', nullable: true, isPrimary: false, isForeign: false },
      { name: 'agent_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'agents', foreignColumn: 'id' },
      { name: 'context', type: 'jsonb', nullable: true, isPrimary: false, isForeign: false },
      { name: 'is_active', type: 'boolean', nullable: true, isPrimary: false, isForeign: false, defaultValue: 'true' },
    ] },
  { name: 'messages', schema: 'public', rowCount: 1284, size: '2.1 MB', rls: true,
    indexes: ['messages_pkey', 'idx_messages_conversation'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'conversation_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'conversations', foreignColumn: 'id' },
      { name: 'role', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'content', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'metadata', type: 'jsonb', nullable: true, isPrimary: false, isForeign: false },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false },
    ] },
  { name: 'cmc_memories', schema: 'public', rowCount: 342, size: '890 KB', rls: true,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'content', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'tier', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'token_count', type: 'integer', nullable: false, isPrimary: false, isForeign: false },
      { name: 'retrieval_score', type: 'numeric', nullable: true, isPrimary: false, isForeign: false },
      { name: 'importance', type: 'numeric', nullable: true, isPrimary: false, isForeign: false, defaultValue: '0.5' },
      { name: 'tags', type: 'ARRAY', nullable: true, isPrimary: false, isForeign: false },
    ] },
  { name: 'documents', schema: 'public', rowCount: 18, size: '96 KB', rls: true,
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'title', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'file_name', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'mime_type', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'file_size', type: 'bigint', nullable: false, isPrimary: false, isForeign: false },
      { name: 'processing_status', type: 'text', nullable: false, isPrimary: false, isForeign: false, defaultValue: "'pending'" },
      { name: 'user_id', type: 'uuid', nullable: false, isPrimary: false, isForeign: false },
    ] },
  { name: 'dream_sessions', schema: 'public', rowCount: 42, size: '256 KB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'focus', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'status', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'total_insights', type: 'integer', nullable: true, isPrimary: false, isForeign: false },
      { name: 'started_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false },
    ] },
];

const generateMockRows = (table: TableDef, count: number): Record<string, any>[] => {
  const names = ['Alpha Agent', 'Reasoner', 'Validator', 'Planner', 'Observer', 'Executor', 'Scheduler', 'Memory Manager'];
  const statuses = ['active', 'idle', 'pending', 'completed', 'error'];
  const roles = ['assistant', 'user', 'system'];

  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, any> = {};
    table.columns.forEach(col => {
      if (col.type === 'uuid') row[col.name] = crypto.randomUUID().slice(0, 8) + '...';
      else if (col.name === 'name') row[col.name] = names[i % names.length];
      else if (col.name === 'title') row[col.name] = `Task ${i + 1}: ${['Analyze data', 'Process query', 'Generate report', 'Validate theory'][i % 4]}`;
      else if (col.name === 'content') row[col.name] = `Content entry ${i + 1}...`;
      else if (col.name === 'role') row[col.name] = roles[i % roles.length];
      else if (col.name === 'status') row[col.name] = statuses[i % statuses.length];
      else if (col.type === 'text') row[col.name] = `${col.name}_${i + 1}`;
      else if (col.type === 'integer' || col.type === 'numeric' || col.type === 'bigint' || col.type === 'real') row[col.name] = Math.floor(Math.random() * 100);
      else if (col.type === 'boolean') row[col.name] = i % 2 === 0;
      else if (col.type === 'timestamp') row[col.name] = new Date(Date.now() - i * 3600000).toISOString().slice(0, 19);
      else if (col.type === 'jsonb') row[col.name] = '{ ... }';
      else if (col.type === 'ARRAY') row[col.name] = `[${Math.ceil(Math.random() * 5)} items]`;
      else row[col.name] = `val_${i}`;
    });
    return row;
  });
};

/* ─────────── ERD Canvas ─────────── */
function ERDCanvas({ tables, selectedTable, onSelectTable }: { tables: TableDef[]; selectedTable: TableDef; onSelectTable: (t: TableDef) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Initialize positions in a grid
  useEffect(() => {
    const cols = 3;
    const spacingX = 280;
    const spacingY = 200;
    const pos: Record<string, { x: number; y: number }> = {};
    tables.forEach((t, i) => {
      pos[t.name] = { x: 40 + (i % cols) * spacingX, y: 40 + Math.floor(i / cols) * spacingY };
    });
    setPositions(pos);
  }, [tables.length]);

  // Draw ERD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.offsetWidth; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.offsetHeight); ctx.stroke();
    }
    for (let y = 0; y < canvas.offsetHeight; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.offsetWidth, y); ctx.stroke();
    }

    // Draw relationships (FK lines)
    tables.forEach(t => {
      const pos = positions[t.name];
      if (!pos) return;

      t.columns.forEach(col => {
        if (col.isForeign && col.foreignTable) {
          const targetPos = positions[col.foreignTable];
          if (!targetPos) return;

          const startX = pos.x + 120;
          const startY = pos.y + 30 + t.columns.indexOf(col) * 6;
          const endX = targetPos.x + 120;
          const endY = targetPos.y + 20;

          // Bezier curve
          ctx.beginPath();
          ctx.strokeStyle = selectedTable.name === t.name || selectedTable.name === col.foreignTable
            ? 'rgba(96, 165, 250, 0.7)' : 'rgba(96, 165, 250, 0.2)';
          ctx.lineWidth = selectedTable.name === t.name || selectedTable.name === col.foreignTable ? 2 : 1;
          ctx.setLineDash([4, 4]);
          const cpx = (startX + endX) / 2;
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cpx, startY, cpx, endY, endX, endY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrow
          const angle = Math.atan2(endY - startY, endX - startX);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - 8 * Math.cos(angle - 0.4), endY - 8 * Math.sin(angle - 0.4));
          ctx.lineTo(endX - 8 * Math.cos(angle + 0.4), endY - 8 * Math.sin(angle + 0.4));
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      });
    });

    // Draw table cards
    tables.forEach(t => {
      const pos = positions[t.name];
      if (!pos) return;

      const isSelected = selectedTable.name === t.name;
      const cardW = 240;
      const headerH = 32;
      const colH = 20;
      const cardH = headerH + t.columns.length * colH + 8;

      // Shadow
      ctx.shadowColor = isSelected ? 'rgba(96, 165, 250, 0.3)' : 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = isSelected ? 12 : 6;
      ctx.shadowOffsetY = 2;

      // Card background
      ctx.fillStyle = isSelected ? 'rgba(30, 40, 60, 0.95)' : 'rgba(20, 25, 35, 0.9)';
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, cardW, cardH, 8);
      ctx.fill();

      // Border
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = isSelected ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Header
      ctx.fillStyle = isSelected ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, cardW, headerH, [8, 8, 0, 0]);
      ctx.fill();

      // Table name
      ctx.fillStyle = isSelected ? '#60a5fa' : '#e2e8f0';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.fillText(`📋 ${t.name}`, pos.x + 10, pos.y + 21);

      // Row count
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px ui-sans-serif, system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(`${t.rowCount} rows`, pos.x + cardW - 10, pos.y + 21);
      ctx.textAlign = 'left';

      // Columns
      t.columns.forEach((col, ci) => {
        const cy = pos.y + headerH + 4 + ci * colH;
        const icon = col.isPrimary ? '🔑' : col.isForeign ? '🔗' : '  ';

        ctx.fillStyle = col.isPrimary ? 'rgba(251, 191, 36, 0.8)' : col.isForeign ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255,255,255,0.6)';
        ctx.font = '11px ui-monospace, monospace';
        ctx.fillText(`${icon} ${col.name}`, pos.x + 8, cy + 14);

        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(col.type, pos.x + cardW - 10, cy + 14);
        ctx.textAlign = 'left';
      });
    });
  }, [positions, tables, selectedTable]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const t of tables) {
      const pos = positions[t.name];
      if (!pos) continue;
      if (x >= pos.x && x <= pos.x + 240 && y >= pos.y && y <= pos.y + 32 + t.columns.length * 20 + 8) {
        setDragging(t.name);
        setOffset({ x: x - pos.x, y: y - pos.y });
        onSelectTable(t);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPositions(prev => ({
      ...prev,
      [dragging]: { x: e.clientX - rect.left - offset.x, y: e.clientY - rect.top - offset.y },
    }));
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => setDragging(null)}
    />
  );
}

/* ─────────── SQL Keywords for highlighting ─────────── */
const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'INTO', 'VALUES', 'SET', 'TABLE', 'INDEX', 'PRIMARY', 'FOREIGN', 'KEY', 'REFERENCES', 'CASCADE', 'NULL', 'DEFAULT', 'TRUE', 'FALSE', 'WITH', 'RECURSIVE', 'UNION', 'ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'RETURNING'];

/* ─────────── Main Component ─────────── */
export function DatabaseExplorerPage() {
  const [selectedTable, setSelectedTable] = useState<TableDef>(mockTables[0]);
  const [activeView, setActiveView] = useState<'data' | 'schema' | 'query' | 'erd'>('data');
  const [query, setQuery] = useState(`SELECT * FROM ${mockTables[0].name} LIMIT 20;`);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set([mockTables[0].name]));
  const [nlQuery, setNlQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  const filteredTables = mockTables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));

  const mockData = useMemo(() => {
    let data = generateMockRows(selectedTable, Math.min(selectedTable.rowCount, 25));

    // Apply filter
    if (filterColumn && filterValue) {
      data = data.filter(row => String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase()));
    }

    // Apply sort
    if (sortColumn) {
      data.sort((a, b) => {
        const va = a[sortColumn] ?? '';
        const vb = b[sortColumn] ?? '';
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [selectedTable, sortColumn, sortDirection, filterColumn, filterValue]);

  const executeQuery = useCallback(() => {
    const start = performance.now();
    const matchedTable = mockTables.find(t => query.toLowerCase().includes(t.name));
    if (matchedTable) {
      const rows = generateMockRows(matchedTable, 15);
      const time = Math.round(performance.now() - start + Math.random() * 50);
      const result: QueryResult = {
        columns: matchedTable.columns.map(c => c.name),
        rows, rowCount: rows.length, time, query,
      };
      setQueryResult(result);
      setQueryHistory(prev => [{ query, time, rowCount: rows.length, timestamp: new Date() }, ...prev].slice(0, 20));
      toast.success(`Query returned ${rows.length} rows in ${time}ms`);
    } else {
      toast.error('No matching table found in query');
    }
  }, [query]);

  const toggleTable = (name: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const generateNLQuery = () => {
    const mapping: Record<string, string> = {
      'active agents': `SELECT * FROM agents WHERE status = 'active' ORDER BY performance_score DESC;`,
      'recent tasks': `SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10;`,
      'message count': `SELECT conversation_id, COUNT(*) as msg_count FROM messages GROUP BY conversation_id ORDER BY msg_count DESC;`,
    };
    const key = Object.keys(mapping).find(k => nlQuery.toLowerCase().includes(k));
    setQuery(key ? mapping[key] : `-- Generated from: "${nlQuery}"\nSELECT * FROM agents WHERE status = 'active' AND performance_score > 0.8;`);
    toast.success('Query generated from natural language');
  };

  const views = [
    { id: 'data' as const, label: 'Data', icon: Table2 },
    { id: 'schema' as const, label: 'Schema', icon: Columns },
    { id: 'query' as const, label: 'SQL', icon: Code2 },
    { id: 'erd' as const, label: 'ERD', icon: GitBranch },
  ];

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Header */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <Database className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Database Explorer</span>
        <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-400">
          {mockTables.length} tables
        </Badge>
        <Badge variant="outline" className="text-[9px] h-4 border-border/30">
          {mockTables.reduce((a, t) => a + t.rowCount, 0).toLocaleString()} rows
        </Badge>

        <div className="relative w-44">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={tableSearch} onChange={e => setTableSearch(e.target.value)} placeholder="Filter tables..." className="h-7 text-xs pl-8 bg-muted/30 border-border/30" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Table2 className="w-3.5 h-3.5" />
              {selectedTable.name}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {filteredTables.map((table) => (
              <DropdownMenuItem
                key={table.name}
                onClick={() => {
                  setSelectedTable(table);
                  setQuery(`SELECT * FROM ${table.name} LIMIT 20;`);
                }}
                className="flex items-center gap-2"
              >
                <Table2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="flex-1">{table.name}</span>
                <span className="text-[10px] text-muted-foreground">{table.rowCount}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />
        <div className="flex gap-0.5 bg-muted/20 rounded-lg p-0.5">
          {views.map(v => {
            const Icon = v.icon;
            return (
              <Button key={v.id} variant="ghost" size="sm" onClick={() => setActiveView(v.id)}
                className={cn('h-7 text-xs gap-1 px-2.5 rounded-md', activeView === v.id && 'bg-primary/15 text-primary')}>
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </Button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8"><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ─── Data View ─── */}
          {activeView === 'data' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Filter bar */}
              <div className="px-3 py-1.5 border-b border-border/20 flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">{selectedTable.name}</span>
                <div className="flex-1" />
                {filterColumn && (
                  <div className="flex items-center gap-1 bg-muted/20 rounded px-2 py-0.5">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px]">{filterColumn}:</span>
                    <Input
                      value={filterValue} onChange={e => setFilterValue(e.target.value)}
                      className="h-5 w-24 text-[10px] bg-transparent border-none p-0"
                      placeholder="filter..."
                    />
                    <button onClick={() => { setFilterColumn(null); setFilterValue(''); }} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(JSON.stringify(mockData, null, 2)); toast.success('Data copied'); }}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                  <Download className="w-3 h-3" /> CSV
                </Button>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                    <tr className="border-b border-border/30">
                      <th className="px-2 py-1.5 text-left w-8 text-muted-foreground">#</th>
                      {selectedTable.columns.map(col => (
                        <th key={col.name} className="px-3 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1 group">
                            {col.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                            {col.isForeign && <Link2 className="w-3 h-3 text-blue-400" />}
                            {col.name}
                            <button onClick={() => handleSort(col.name)} className="opacity-30 hover:opacity-100 transition-opacity">
                              <ArrowUpDown className={cn('w-3 h-3', sortColumn === col.name && 'text-primary opacity-100')} />
                            </button>
                            <button onClick={() => setFilterColumn(col.name)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                              <Filter className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockData.map((row, i) => (
                      <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors group">
                        <td className="px-2 py-1.5 text-muted-foreground/40 font-mono">{i + 1}</td>
                        {selectedTable.columns.map(col => (
                          <td key={col.name} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate font-mono">
                            {row[col.name] === null ? <span className="text-muted-foreground/40 italic">NULL</span> :
                             typeof row[col.name] === 'boolean' ? (
                               <Badge variant="outline" className={cn('text-[9px] h-4', row[col.name] ? 'border-emerald-500/30 text-emerald-400' : 'border-border/30')}>
                                 {String(row[col.name])}
                               </Badge>
                             ) :
                             col.name === 'status' ? (
                               <Badge variant="outline" className={cn('text-[9px] h-4',
                                 row[col.name] === 'active' && 'border-emerald-500/30 text-emerald-400',
                                 row[col.name] === 'idle' && 'border-amber-500/30 text-amber-400',
                                 row[col.name] === 'error' && 'border-red-500/30 text-red-400',
                               )}>
                                 {row[col.name]}
                               </Badge>
                             ) : String(row[col.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/20 px-4 py-1.5 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {filterColumn ? `${mockData.length} filtered` : `Showing ${Math.min(25, selectedTable.rowCount)}`} of {selectedTable.rowCount} rows
                </span>
                <div className="flex items-center gap-2">
                  {sortColumn && <Badge variant="outline" className="text-[9px] h-4">Sorted by {sortColumn} {sortDirection}</Badge>}
                  <span className="text-[10px] text-muted-foreground">{selectedTable.size}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Schema View ─── */}
          {activeView === 'schema' && (
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold">{selectedTable.name}</h2>
                  <Badge variant="outline" className="text-[10px]">{selectedTable.schema}</Badge>
                  <Badge variant="outline" className="text-[10px]">{selectedTable.columns.length} columns</Badge>
                  {selectedTable.rls && <Badge className="text-[10px] h-5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">RLS Enabled</Badge>}
                </div>

                {/* Column details */}
                <div className="space-y-1.5">
                  {selectedTable.columns.map((col, i) => (
                    <div key={col.name} className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      'bg-card/30 border-border/20 hover:bg-card/50'
                    )}>
                      <div className="w-6 text-center text-[10px] text-muted-foreground">{i + 1}</div>
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                        {col.isPrimary ? <Key className="w-4 h-4 text-amber-400" /> :
                         col.isForeign ? <Link2 className="w-4 h-4 text-blue-400" /> :
                         (() => { const I = typeIcons[col.type] || Type; return <I className="w-4 h-4 text-muted-foreground" />; })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium font-mono">{col.name}</span>
                          {col.isPrimary && <Badge className="text-[9px] h-4 bg-amber-500/20 text-amber-400 border-amber-500/30" variant="outline">PK</Badge>}
                          {col.isForeign && (
                            <Badge className="text-[9px] h-4 bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30" variant="outline"
                              onClick={() => { const t = mockTables.find(t => t.name === col.foreignTable); if (t) setSelectedTable(t); }}>
                              FK → {col.foreignTable}.{col.foreignColumn || 'id'}
                            </Badge>
                          )}
                          {!col.nullable && <Badge className="text-[9px] h-4" variant="outline">NOT NULL</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground font-mono">{col.type}</span>
                          {col.defaultValue && <span className="text-[10px] text-muted-foreground">default: {col.defaultValue}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Indexes */}
                {selectedTable.indexes && selectedTable.indexes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Indexes</h3>
                    <div className="space-y-1">
                      {selectedTable.indexes.map(idx => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded bg-muted/20 text-xs font-mono">
                          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                          {idx}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* ─── Query View ─── */}
          {activeView === 'query' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* NL input */}
              <div className="px-4 py-2 border-b border-border/20 flex items-center gap-2 shrink-0">
                <Wand2 className="w-4 h-4 text-primary shrink-0" />
                <Input value={nlQuery} onChange={e => setNlQuery(e.target.value)}
                  placeholder="Describe your query... (e.g., 'Show me all active agents with high performance')"
                  className="h-8 text-xs bg-muted/30 border-border/30 flex-1"
                  onKeyDown={e => e.key === 'Enter' && generateNLQuery()} />
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={generateNLQuery}>
                  <Wand2 className="w-3 h-3" /> Generate
                </Button>
              </div>

              {/* SQL editor + history */}
              <div className="h-[40%] border-b border-border/20 flex">
                <div className="flex-1 flex flex-col">
                  <Textarea value={query} onChange={e => setQuery(e.target.value)}
                    className="flex-1 font-mono text-xs bg-[#0d0d14] border-none rounded-none resize-none p-4"
                    spellCheck={false}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); executeQuery(); } }}
                  />
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-background/60 shrink-0">
                    <Button size="sm" onClick={executeQuery} className="h-7 text-xs gap-1">
                      <Play className="w-3 h-3" /> Run
                    </Button>
                    <span className="text-[10px] text-muted-foreground">⌘+Enter</span>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowQueryHistory(!showQueryHistory)}>
                      History ({queryHistory.length})
                    </Button>
                  </div>
                </div>

                {/* Query history sidebar */}
                {showQueryHistory && (
                  <div className="w-64 border-l border-border/20 flex flex-col">
                    <div className="p-2 border-b border-border/20 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">History</span>
                      <button onClick={() => setShowQueryHistory(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-1 space-y-0.5">
                        {queryHistory.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => setQuery(h.query)}
                            className="w-full text-left p-2 rounded text-[10px] hover:bg-muted/20 transition-colors"
                          >
                            <p className="font-mono truncate text-foreground/70">{h.query.slice(0, 60)}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                              <span>{h.rowCount} rows</span>
                              <span>{h.time}ms</span>
                            </div>
                          </button>
                        ))}
                        {queryHistory.length === 0 && (
                          <p className="text-[10px] text-muted-foreground p-3 text-center">No history yet</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="flex-1 overflow-auto">
                {queryResult ? (
                  <>
                    <div className="sticky top-0 bg-background/95 backdrop-blur px-4 py-1.5 border-b border-border/20 flex items-center gap-2 z-10">
                      <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/30 text-emerald-400">
                        {queryResult.rowCount} rows
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5 border-border/30">{queryResult.time}ms</Badge>
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(JSON.stringify(queryResult.rows, null, 2)); toast.success('Copied'); }}>
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="sticky top-8 bg-background/95">
                        <tr className="border-b border-border/30">
                          {queryResult.columns.map(c => (
                            <th key={c} className="px-3 py-1.5 text-left font-medium text-muted-foreground">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, i) => (
                          <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                            {queryResult.columns.map(c => (
                              <td key={c} className="px-3 py-1.5 font-mono max-w-[200px] truncate">{String(row[c] ?? 'NULL')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <div className="text-center">
                      <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Run a query to see results</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">⌘+Enter to execute</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ERD View ─── */}
          {activeView === 'erd' && (
            <div className="flex-1 relative">
              <ERDCanvas tables={mockTables} selectedTable={selectedTable} onSelectTable={setSelectedTable} />
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur">
                  {mockTables.length} tables • {mockTables.reduce((s, t) => s + t.columns.filter(c => c.isForeign).length, 0)} relationships
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground bg-background/80 backdrop-blur rounded px-2 py-1">
                Drag tables to rearrange • Click to select
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
