// Database Explorer — Schema visualizer, SQL query builder, table editor
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database, Table2, Play, Plus, Trash2, Search, ChevronRight, ChevronDown,
  Key, Hash, Calendar, Type, ToggleLeft, FileJson, Link2, Eye,
  Download, Upload, Wand2, Code2, RefreshCw, Settings, Copy,
  ArrowUpDown, Filter, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isForeign: boolean;
  defaultValue?: string;
  foreignTable?: string;
}

interface TableDef {
  name: string;
  schema: string;
  columns: Column[];
  rowCount: number;
  size: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  time: number;
}

const typeIcons: Record<string, React.ComponentType<any>> = {
  uuid: Key, text: Type, integer: Hash, timestamp: Calendar, boolean: ToggleLeft,
  jsonb: FileJson, bigint: Hash, numeric: Hash, 'ARRAY': FileJson,
  'USER-DEFINED': FileJson, real: Hash,
};

// Mock tables based on actual Supabase schema
const mockTables: TableDef[] = [
  { name: 'agents', schema: 'public', rowCount: 8, size: '48 KB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'role', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'status', type: 'text', nullable: false, isPrimary: false, isForeign: false, defaultValue: "'idle'" },
      { name: 'capabilities', type: 'ARRAY', nullable: false, isPrimary: false, isForeign: false },
      { name: 'performance_score', type: 'numeric', nullable: true, isPrimary: false, isForeign: false, defaultValue: '0.5' },
      { name: 'configuration', type: 'jsonb', nullable: true, isPrimary: false, isForeign: false },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false, defaultValue: 'now()' },
    ] },
  { name: 'tasks', schema: 'public', rowCount: 24, size: '128 KB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'title', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'status', type: 'text', nullable: false, isPrimary: false, isForeign: false, defaultValue: "'pending'" },
      { name: 'priority', type: 'integer', nullable: true, isPrimary: false, isForeign: false, defaultValue: '5' },
      { name: 'assigned_agent_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'agents' },
      { name: 'description', type: 'text', nullable: true, isPrimary: false, isForeign: false },
      { name: 'progress', type: 'numeric', nullable: true, isPrimary: false, isForeign: false, defaultValue: '0' },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false },
    ] },
  { name: 'conversations', schema: 'public', rowCount: 156, size: '512 KB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'session_id', type: 'uuid', nullable: false, isPrimary: false, isForeign: false },
      { name: 'title', type: 'text', nullable: true, isPrimary: false, isForeign: false },
      { name: 'agent_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'agents' },
      { name: 'context', type: 'jsonb', nullable: true, isPrimary: false, isForeign: false },
      { name: 'is_active', type: 'boolean', nullable: true, isPrimary: false, isForeign: false, defaultValue: 'true' },
    ] },
  { name: 'messages', schema: 'public', rowCount: 1284, size: '2.1 MB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'conversation_id', type: 'uuid', nullable: true, isPrimary: false, isForeign: true, foreignTable: 'conversations' },
      { name: 'role', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'content', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'metadata', type: 'jsonb', nullable: true, isPrimary: false, isForeign: false },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimary: false, isForeign: false },
    ] },
  { name: 'cmc_memories', schema: 'public', rowCount: 342, size: '890 KB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'content', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'tier', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'token_count', type: 'integer', nullable: false, isPrimary: false, isForeign: false },
      { name: 'retrieval_score', type: 'numeric', nullable: true, isPrimary: false, isForeign: false },
      { name: 'importance', type: 'numeric', nullable: true, isPrimary: false, isForeign: false, defaultValue: '0.5' },
      { name: 'tags', type: 'ARRAY', nullable: true, isPrimary: false, isForeign: false },
    ] },
  { name: 'documents', schema: 'public', rowCount: 18, size: '96 KB',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isForeign: false },
      { name: 'title', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'file_name', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'mime_type', type: 'text', nullable: false, isPrimary: false, isForeign: false },
      { name: 'file_size', type: 'bigint', nullable: false, isPrimary: false, isForeign: false },
      { name: 'processing_status', type: 'text', nullable: false, isPrimary: false, isForeign: false, defaultValue: "'pending'" },
      { name: 'user_id', type: 'uuid', nullable: false, isPrimary: false, isForeign: false },
    ] },
];

const generateMockRows = (table: TableDef, count: number): Record<string, any>[] => {
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, any> = {};
    table.columns.forEach(col => {
      if (col.type === 'uuid') row[col.name] = `${crypto.randomUUID().slice(0, 8)}...`;
      else if (col.type === 'text') row[col.name] = col.name === 'status' ? ['active', 'idle', 'pending'][i % 3] : `${col.name}_${i + 1}`;
      else if (col.type === 'integer' || col.type === 'numeric' || col.type === 'bigint') row[col.name] = Math.floor(Math.random() * 100);
      else if (col.type === 'boolean') row[col.name] = i % 2 === 0;
      else if (col.type === 'timestamp') row[col.name] = new Date(Date.now() - i * 3600000).toISOString().slice(0, 19);
      else if (col.type === 'jsonb') row[col.name] = '{}';
      else if (col.type === 'ARRAY') row[col.name] = '[]';
      else row[col.name] = `val_${i}`;
    });
    return row;
  });
};

export function DatabaseExplorerPage() {
  const [selectedTable, setSelectedTable] = useState<TableDef>(mockTables[0]);
  const [activeView, setActiveView] = useState<'data' | 'schema' | 'query'>('data');
  const [query, setQuery] = useState(`SELECT * FROM ${mockTables[0].name} LIMIT 20;`);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set([mockTables[0].name]));
  const [nlQuery, setNlQuery] = useState('');

  const filteredTables = mockTables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));

  const mockData = generateMockRows(selectedTable, Math.min(selectedTable.rowCount, 20));

  const executeQuery = useCallback(() => {
    const start = performance.now();
    // Simulate query execution
    const matchedTable = mockTables.find(t => query.toLowerCase().includes(t.name));
    if (matchedTable) {
      const rows = generateMockRows(matchedTable, 10);
      setQueryResult({
        columns: matchedTable.columns.map(c => c.name),
        rows, rowCount: rows.length,
        time: Math.round(performance.now() - start + Math.random() * 50),
      });
    }
  }, [query]);

  const toggleTable = (name: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/30">
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <Database className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Database Explorer</span>
        <div className="flex-1" />
        <div className="flex gap-0.5">
          {(['data', 'schema', 'query'] as const).map(v => (
            <Button key={v} variant="ghost" size="sm" onClick={() => setActiveView(v)}
              className={cn('h-7 text-xs capitalize', activeView === v && 'bg-primary/15 text-primary')}>
              {v}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8"><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Table list */}
        <div className="w-56 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={tableSearch} onChange={e => setTableSearch(e.target.value)} placeholder="Filter tables..." className="h-7 text-xs pl-8 bg-muted/30 border-border/30" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-1 pb-2">
              {filteredTables.map(table => (
                <div key={table.name}>
                  <button
                    onClick={() => { setSelectedTable(table); toggleTable(table.name); setQuery(`SELECT * FROM ${table.name} LIMIT 20;`); }}
                    className={cn(
                      'w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors',
                      selectedTable.name === table.name ? 'bg-primary/15 text-primary' : 'hover:bg-muted/30'
                    )}
                  >
                    {expandedTables.has(table.name) ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                    <Table2 className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span className="truncate flex-1 text-left">{table.name}</span>
                    <span className="text-[9px] text-muted-foreground">{table.rowCount}</span>
                  </button>
                  {expandedTables.has(table.name) && (
                    <div className="ml-6 space-y-0.5 py-0.5">
                      {table.columns.map(col => {
                        const TypeIcon = typeIcons[col.type] || Type;
                        return (
                          <div key={col.name} className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {col.isPrimary ? <Key className="w-2.5 h-2.5 text-amber-400 shrink-0" /> :
                             col.isForeign ? <Link2 className="w-2.5 h-2.5 text-blue-400 shrink-0" /> :
                             <TypeIcon className="w-2.5 h-2.5 shrink-0" />}
                            <span className="truncate">{col.name}</span>
                            <span className="text-[8px] opacity-60 ml-auto">{col.type.slice(0, 8)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-border/20">
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div className="flex justify-between"><span>Tables</span><span>{mockTables.length}</span></div>
              <div className="flex justify-between"><span>Total rows</span><span>{mockTables.reduce((a, t) => a + t.rowCount, 0).toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'data' && (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                  <tr className="border-b border-border/30">
                    {selectedTable.columns.map(col => (
                      <th key={col.name} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {col.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                          {col.isForeign && <Link2 className="w-3 h-3 text-blue-400" />}
                          {col.name}
                          <ArrowUpDown className="w-3 h-3 opacity-30 cursor-pointer hover:opacity-100" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((row, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      {selectedTable.columns.map(col => (
                        <td key={col.name} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate font-mono">
                          {row[col.name] === null ? <span className="text-muted-foreground/40 italic">NULL</span> :
                           typeof row[col.name] === 'boolean' ? <Badge variant="outline" className="text-[9px] h-4">{String(row[col.name])}</Badge> :
                           String(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/20 px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Showing {Math.min(20, selectedTable.rowCount)} of {selectedTable.rowCount} rows</span>
                <span className="text-[10px] text-muted-foreground">{selectedTable.size}</span>
              </div>
            </div>
          )}

          {activeView === 'schema' && (
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-3xl">
                <h2 className="text-lg font-semibold mb-4">{selectedTable.name}</h2>
                <div className="space-y-2">
                  {selectedTable.columns.map(col => (
                    <div key={col.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        {col.isPrimary ? <Key className="w-4 h-4 text-amber-400" /> :
                         col.isForeign ? <Link2 className="w-4 h-4 text-blue-400" /> :
                         (() => { const I = typeIcons[col.type] || Type; return <I className="w-4 h-4 text-muted-foreground" />; })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{col.name}</span>
                          {col.isPrimary && <Badge className="text-[9px] h-4 bg-amber-500/20 text-amber-400 border-amber-500/30" variant="outline">PK</Badge>}
                          {col.isForeign && <Badge className="text-[9px] h-4 bg-blue-500/20 text-blue-400 border-blue-500/30" variant="outline">FK → {col.foreignTable}</Badge>}
                          {!col.nullable && <Badge className="text-[9px] h-4" variant="outline">NOT NULL</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground font-mono">{col.type}</span>
                          {col.defaultValue && <span className="text-[10px] text-muted-foreground">= {col.defaultValue}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          {activeView === 'query' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Natural language input */}
              <div className="px-4 py-2 border-b border-border/20 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary shrink-0" />
                <Input value={nlQuery} onChange={e => setNlQuery(e.target.value)}
                  placeholder="Describe your query in natural language... (e.g., 'Show me all active agents with performance > 0.8')"
                  className="h-8 text-xs bg-muted/30 border-border/30 flex-1" />
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                  setQuery(`-- Generated from: "${nlQuery}"\nSELECT * FROM agents WHERE status = 'active' AND performance_score > 0.8;`);
                }}>
                  <Wand2 className="w-3 h-3" /> Generate
                </Button>
              </div>

              {/* SQL editor */}
              <div className="h-[40%] border-b border-border/20 flex flex-col">
                <Textarea value={query} onChange={e => setQuery(e.target.value)}
                  className="flex-1 font-mono text-xs bg-[#0d0d14] border-none rounded-none resize-none p-4"
                  spellCheck={false} />
                <div className="flex items-center gap-2 px-4 py-1.5 bg-background/60">
                  <Button size="sm" onClick={executeQuery} className="h-7 text-xs gap-1">
                    <Play className="w-3 h-3" /> Run Query
                  </Button>
                  <span className="text-[10px] text-muted-foreground">⌘+Enter to execute</span>
                </div>
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
                    Run a query to see results
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
