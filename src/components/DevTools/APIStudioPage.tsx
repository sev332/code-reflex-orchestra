// API Studio — Postman/Insomnia-grade REST client with collections, env variables, code gen, history, response viewer
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send, Plus, Trash2, Copy, FolderOpen, ChevronRight, ChevronDown,
  Save, Clock, Settings, Code2, Wand2, Play, Globe, Lock,
  FileJson, Eye, EyeOff, Download, Upload, Zap, Search,
  X, Star, Bookmark, ArrowUpRight, ArrowDownRight, Timer,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  Braces, FileCode, Hash, Layers, Variable,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────
interface KeyValue { key: string; value: string; description?: string; enabled: boolean }
interface APIRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: string;
  bodyType: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'graphql';
  auth: { type: 'none' | 'bearer' | 'basic' | 'api-key'; token?: string; username?: string; password?: string; headerName?: string };
  preRequestScript?: string;
  testScript?: string;
}
interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
  testResults?: { name: string; passed: boolean }[];
}
interface Collection {
  id: string;
  name: string;
  requests: APIRequest[];
  expanded: boolean;
  description?: string;
}
interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
  isActive: boolean;
}
interface HistoryEntry {
  request: APIRequest;
  response: APIResponse;
  timestamp: Date;
}

// ─── Utilities ─────────────────────────────
const methodColors: Record<string, string> = {
  GET: 'text-emerald-400', POST: 'text-amber-400', PUT: 'text-blue-400',
  PATCH: 'text-purple-400', DELETE: 'text-red-400', HEAD: 'text-muted-foreground', OPTIONS: 'text-pink-400',
};
const methodBgColors: Record<string, string> = {
  GET: 'bg-emerald-500/10', POST: 'bg-amber-500/10', PUT: 'bg-blue-500/10',
  PATCH: 'bg-purple-500/10', DELETE: 'bg-red-500/10', HEAD: 'bg-muted/10', OPTIONS: 'bg-pink-500/10',
};

const statusColor = (s: number) => s >= 200 && s < 300 ? 'text-emerald-400' : s >= 400 ? 'text-red-400' : 'text-amber-400';
const statusBg = (s: number) => s >= 200 && s < 300 ? 'bg-emerald-500/15 border-emerald-500/30' : s >= 400 ? 'bg-red-500/15 border-red-500/30' : 'bg-amber-500/15 border-amber-500/30';

const createRequest = (name?: string, method: APIRequest['method'] = 'GET'): APIRequest => ({
  id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: name || 'New Request', method,
  url: '', headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
  params: [], body: '', bodyType: method === 'GET' ? 'none' : 'json',
  auth: { type: 'none' },
});

const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const generateCurl = (req: APIRequest): string => {
  let cmd = `curl -X ${req.method}`;
  cmd += ` '${req.url}'`;
  req.headers.filter(h => h.enabled && h.key).forEach(h => { cmd += ` \\\n  -H '${h.key}: ${h.value}'`; });
  if (req.auth.type === 'bearer' && req.auth.token) cmd += ` \\\n  -H 'Authorization: Bearer ${req.auth.token}'`;
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) cmd += ` \\\n  -d '${req.body}'`;
  return cmd;
};

const generateJS = (req: APIRequest): string => {
  let code = `const response = await fetch('${req.url}', {\n  method: '${req.method}',\n`;
  const hdrs = req.headers.filter(h => h.enabled && h.key);
  if (hdrs.length > 0) {
    code += `  headers: {\n`;
    hdrs.forEach(h => { code += `    '${h.key}': '${h.value}',\n`; });
    if (req.auth.type === 'bearer') code += `    'Authorization': 'Bearer ${req.auth.token || ''}',\n`;
    code += `  },\n`;
  }
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    code += `  body: JSON.stringify(${req.body}),\n`;
  }
  code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
  return code;
};

// ─── KeyValue Editor ───────────────────────
function KeyValueEditor({ items, onChange, onAdd, showDescription }: {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  onAdd: () => void;
  showDescription?: boolean;
}) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-semibold px-1">
        <span className="w-5" />
        <span className="flex-1">Key</span>
        <span className="flex-1">Value</span>
        {showDescription && <span className="flex-1">Description</span>}
        <span className="w-6" />
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 group">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={e => { const n = [...items]; n[i] = { ...n[i], enabled: e.target.checked }; onChange(n); }}
            className="w-4 h-4 rounded accent-primary"
          />
          <Input value={item.key} onChange={e => { const n = [...items]; n[i] = { ...n[i], key: e.target.value }; onChange(n); }}
            placeholder="Key" className={cn('h-7 text-xs bg-muted/20 border-border/20 flex-1 font-mono', !item.enabled && 'opacity-40')} />
          <Input value={item.value} onChange={e => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; onChange(n); }}
            placeholder="Value" className={cn('h-7 text-xs bg-muted/20 border-border/20 flex-1 font-mono', !item.enabled && 'opacity-40')} />
          {showDescription && (
            <Input value={item.description || ''} onChange={e => { const n = [...items]; n[i] = { ...n[i], description: e.target.value }; onChange(n); }}
              placeholder="Description" className="h-7 text-xs bg-muted/20 border-border/20 flex-1" />
          )}
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={onAdd} className="h-6 text-[10px] gap-1 text-muted-foreground">
        <Plus className="w-3 h-3" /> Add
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────
export function APIStudioPage() {
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: 'col-1', name: 'JSONPlaceholder', expanded: true, description: 'Sample REST API',
      requests: [
        { ...createRequest('List Posts'), url: 'https://jsonplaceholder.typicode.com/posts' },
        { ...createRequest('Get Post'), url: 'https://jsonplaceholder.typicode.com/posts/1' },
        { ...createRequest('Create Post', 'POST'), url: 'https://jsonplaceholder.typicode.com/posts', body: '{\n  "title": "Hello World",\n  "body": "This is a test post",\n  "userId": 1\n}', bodyType: 'json' },
        { ...createRequest('Update Post', 'PUT'), url: 'https://jsonplaceholder.typicode.com/posts/1', body: '{\n  "id": 1,\n  "title": "Updated Title",\n  "body": "Updated body",\n  "userId": 1\n}', bodyType: 'json' },
        { ...createRequest('Delete Post', 'DELETE'), url: 'https://jsonplaceholder.typicode.com/posts/1' },
      ],
    },
    {
      id: 'col-2', name: 'Auth Endpoints', expanded: false,
      requests: [
        { ...createRequest('Login', 'POST'), url: 'https://api.example.com/auth/login', body: '{\n  "email": "user@example.com",\n  "password": "secret"\n}', bodyType: 'json' },
        { ...createRequest('Get Profile'), url: 'https://api.example.com/auth/profile', auth: { type: 'bearer', token: 'eyJhbGciOiJIUzI1NiJ9...' } },
      ],
    },
  ]);
  const [activeRequest, setActiveRequest] = useState<APIRequest>(collections[0].requests[0]);
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'cookies' | 'tests'>('body');
  const [environments, setEnvironments] = useState<Environment[]>([
    { id: 'env-1', name: 'Development', isActive: true, variables: [
      { key: 'BASE_URL', value: 'https://jsonplaceholder.typicode.com', enabled: true },
      { key: 'API_KEY', value: 'dev-key-12345', enabled: true },
      { key: 'TOKEN', value: 'eyJhbGciOiJIUzI1NiJ9.dev', enabled: true },
    ]},
    { id: 'env-2', name: 'Staging', isActive: false, variables: [
      { key: 'BASE_URL', value: 'https://staging-api.example.com', enabled: true },
      { key: 'API_KEY', value: 'stg-key-67890', enabled: true },
    ]},
    { id: 'env-3', name: 'Production', isActive: false, variables: [
      { key: 'BASE_URL', value: 'https://api.example.com', enabled: true },
    ]},
  ]);
  const [activeEnvId, setActiveEnvId] = useState('env-1');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [codeGenLang, setCodeGenLang] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [sidebarView, setSidebarView] = useState<'collections' | 'history' | 'environments'>('collections');
  const [responseBodyView, setResponseBodyView] = useState<'pretty' | 'raw'>('pretty');

  const activeEnv = environments.find(e => e.id === activeEnvId);

  // Variable interpolation
  const interpolateVars = useCallback((text: string): string => {
    if (!activeEnv) return text;
    let result = text;
    activeEnv.variables.filter(v => v.enabled).forEach(v => {
      result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value);
    });
    return result;
  }, [activeEnv]);

  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const url = interpolateVars(activeRequest.url);
      const headers: Record<string, string> = {};
      activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => { headers[interpolateVars(h.key)] = interpolateVars(h.value); });
      if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
        headers['Authorization'] = `Bearer ${interpolateVars(activeRequest.auth.token)}`;
      } else if (activeRequest.auth.type === 'api-key' && activeRequest.auth.headerName && activeRequest.auth.token) {
        headers[activeRequest.auth.headerName] = interpolateVars(activeRequest.auth.token);
      }

      const fetchOpts: RequestInit = { method: activeRequest.method, headers };
      if (['POST', 'PUT', 'PATCH'].includes(activeRequest.method) && activeRequest.body) {
        fetchOpts.body = interpolateVars(activeRequest.body);
      }

      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      const elapsed = Math.round(performance.now() - start);
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      let formattedBody = text;
      try { formattedBody = JSON.stringify(JSON.parse(text), null, 2); } catch {}

      // Simple test runner
      const testResults: { name: string; passed: boolean }[] = [];
      if (activeRequest.testScript) {
        if (activeRequest.testScript.includes('status === 200')) testResults.push({ name: 'Status is 200', passed: res.status === 200 });
        if (activeRequest.testScript.includes('has body')) testResults.push({ name: 'Response has body', passed: text.length > 0 });
        if (activeRequest.testScript.includes('is json')) testResults.push({ name: 'Response is JSON', passed: (() => { try { JSON.parse(text); return true; } catch { return false; } })() });
      }

      const apiResponse: APIResponse = {
        status: res.status, statusText: res.statusText,
        headers: resHeaders, body: formattedBody,
        time: elapsed, size: new Blob([text]).size,
        testResults: testResults.length > 0 ? testResults : undefined,
      };
      setResponse(apiResponse);
      setHistory(prev => [{ request: { ...activeRequest }, response: apiResponse, timestamp: new Date() }, ...prev.slice(0, 99)]);
    } catch (err: any) {
      setResponse({
        status: 0, statusText: 'Error', headers: {},
        body: `Error: ${err.message}\n\nThis may be due to CORS restrictions or network issues.`,
        time: Math.round(performance.now() - start), size: 0,
      });
    }
    setIsLoading(false);
  }, [activeRequest, interpolateVars]);

  const updateRequest = useCallback((updates: Partial<APIRequest>) => {
    setActiveRequest(prev => ({ ...prev, ...updates }));
  }, []);

  const addKV = useCallback((field: 'headers' | 'params') => {
    updateRequest({ [field]: [...activeRequest[field], { key: '', value: '', enabled: true }] });
  }, [activeRequest, updateRequest]);

  const addRequestToCollection = useCallback((colId: string) => {
    const req = createRequest();
    setCollections(prev => prev.map(c => c.id === colId ? { ...c, requests: [...c.requests, req] } : c));
    setActiveRequest(req);
  }, []);

  const generatedCode = useMemo(() => {
    switch (codeGenLang) {
      case 'curl': return generateCurl(activeRequest);
      case 'javascript': return generateJS(activeRequest);
      case 'python': return `import requests\n\nresponse = requests.${activeRequest.method.toLowerCase()}(\n    '${activeRequest.url}',\n    headers=${JSON.stringify(Object.fromEntries(activeRequest.headers.filter(h => h.enabled).map(h => [h.key, h.value])), null, 4)},\n${activeRequest.body ? `    json=${activeRequest.body},\n` : ''})\n\nprint(response.json())`;
      default: return '';
    }
  }, [activeRequest, codeGenLang]);

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Top Bar ─── */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">API Studio</span>
        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={() => setShowCodeGen(!showCodeGen)} className={cn('h-7 text-xs gap-1', showCodeGen && 'text-primary bg-primary/10')}>
          <Code2 className="w-3.5 h-3.5" /> Code
        </Button>

        <div className="w-px h-5 bg-border/30" />

        <Select value={activeEnvId} onValueChange={setActiveEnvId}>
          <SelectTrigger className="w-36 h-7 text-xs bg-muted/30 border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {environments.map(e => (
              <SelectItem key={e.id} value={e.id}>
                <div className="flex items-center gap-1.5">
                  <Variable className="w-3 h-3" />
                  {e.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Sidebar ─── */}
        <div className="w-60 bg-background/50 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          {/* Sidebar tabs */}
          <div className="flex border-b border-border/20">
            {([
              { id: 'collections' as const, icon: FolderOpen, label: 'Collections' },
              { id: 'history' as const, icon: Clock, label: 'History' },
              { id: 'environments' as const, icon: Variable, label: 'Env' },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setSidebarView(id)}
                className={cn('flex-1 flex items-center justify-center gap-1 py-2 text-[10px] border-b-2 transition-colors',
                  sidebarView === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {sidebarView === 'collections' && (
              <div className="p-1">
                {collections.map(col => (
                  <div key={col.id}>
                    <button
                      onClick={() => setCollections(prev => prev.map(c => c.id === col.id ? { ...c, expanded: !c.expanded } : c))}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium hover:bg-muted/30 rounded-md group"
                    >
                      {col.expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate flex-1 text-left">{col.name}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{col.requests.length}</Badge>
                      <button onClick={e => { e.stopPropagation(); addRequestToCollection(col.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </button>
                    {col.expanded && col.requests.map(req => (
                      <button
                        key={req.id}
                        onClick={() => { setActiveRequest(req); setResponse(null); }}
                        className={cn(
                          'w-full flex items-center gap-1.5 px-2 py-1 pl-7 text-xs rounded-md transition-colors',
                          activeRequest.id === req.id ? 'bg-primary/15 text-foreground' : 'text-foreground/60 hover:bg-muted/20 hover:text-foreground'
                        )}
                      >
                        <span className={cn('text-[9px] font-bold w-8 shrink-0 uppercase', methodColors[req.method])}>{req.method.slice(0, 3)}</span>
                        <span className="truncate">{req.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 mt-2 text-muted-foreground"
                  onClick={() => setCollections(prev => [...prev, { id: `col-${Date.now()}`, name: 'New Collection', requests: [], expanded: true }])}>
                  <Plus className="w-3 h-3" /> New Collection
                </Button>
              </div>
            )}

            {sidebarView === 'history' && (
              <div className="p-1 space-y-0.5">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-6 h-6 mx-auto text-muted-foreground/20 mb-2" />
                    <p className="text-[10px] text-muted-foreground">No history yet</p>
                  </div>
                ) : history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveRequest(h.request); setResponse(h.response); }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-muted/20 transition-colors"
                  >
                    <span className={cn('text-[9px] font-bold w-7 shrink-0', methodColors[h.request.method])}>{h.request.method.slice(0, 3)}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="truncate text-foreground/70">{h.request.name}</p>
                      <p className="text-[9px] text-muted-foreground">{h.timestamp.toLocaleTimeString()}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[8px] h-4 px-1', statusBg(h.response.status))}>{h.response.status}</Badge>
                  </button>
                ))}
              </div>
            )}

            {sidebarView === 'environments' && (
              <div className="p-2 space-y-3">
                {environments.map(env => (
                  <div key={env.id} className={cn('rounded-lg border p-2', env.id === activeEnvId ? 'border-primary/30 bg-primary/5' : 'border-border/20')}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={cn('w-2 h-2 rounded-full', env.id === activeEnvId ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
                      <span className="text-xs font-medium">{env.name}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">{env.variables.length} vars</span>
                    </div>
                    {env.variables.map((v, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px] font-mono px-1">
                        <span className="text-primary/70">{`{{${v.key}}}`}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-foreground/60 truncate">{v.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ─── Main Request Area ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* URL Bar */}
          <div className="px-4 py-2.5 border-b border-border/20 flex items-center gap-2">
            <Select value={activeRequest.method} onValueChange={v => updateRequest({ method: v as any })}>
              <SelectTrigger className={cn('w-28 h-9 text-xs font-bold border-border/30', methodBgColors[activeRequest.method], methodColors[activeRequest.method])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                  <SelectItem key={m} value={m}><span className={cn('font-bold', methodColors[m])}>{m}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Input
                value={activeRequest.url}
                onChange={e => updateRequest({ url: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && sendRequest()}
                placeholder="https://api.example.com/endpoint  or  {{BASE_URL}}/posts"
                className="h-9 bg-muted/20 border-border/30 font-mono text-sm pr-8"
              />
              {activeRequest.url.includes('{{') && (
                <Variable className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
              )}
            </div>
            <Button onClick={sendRequest} disabled={isLoading} className="h-9 px-5 gap-1.5 font-medium">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9"><Save className="w-4 h-4" /></Button>
          </div>

          {/* Request Config */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col" style={{ height: '50%' }}>
              <TabsList className="bg-transparent border-b border-border/30 rounded-none h-8 px-4 justify-start w-full">
                {([
                  { id: 'params', label: 'Params', count: activeRequest.params.filter(p => p.enabled && p.key).length },
                  { id: 'headers', label: 'Headers', count: activeRequest.headers.filter(h => h.enabled && h.key).length },
                  { id: 'body', label: 'Body' },
                  { id: 'auth', label: 'Auth' },
                  { id: 'scripts', label: 'Tests' },
                ] as const).map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs data-[state=active]:bg-primary/10 rounded-none gap-1 h-full">
                    {tab.label}
                    {'count' in tab && tab.count > 0 && <Badge className="text-[8px] h-3.5 px-1 bg-primary/20 text-primary border-0">{tab.count}</Badge>}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="params" className="m-0 p-3">
                  <KeyValueEditor items={activeRequest.params} onChange={params => updateRequest({ params })} onAdd={() => addKV('params')} showDescription />
                </TabsContent>
                <TabsContent value="headers" className="m-0 p-3">
                  <KeyValueEditor items={activeRequest.headers} onChange={headers => updateRequest({ headers })} onAdd={() => addKV('headers')} />
                </TabsContent>
                <TabsContent value="body" className="m-0 p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    {(['none', 'json', 'form-data', 'x-www-form-urlencoded', 'raw', 'graphql'] as const).map(t => (
                      <Button key={t} variant="outline" size="sm" onClick={() => updateRequest({ bodyType: t })}
                        className={cn('h-6 text-[10px]', activeRequest.bodyType === t && 'bg-primary/15 text-primary border-primary/30')}>
                        {t === 'x-www-form-urlencoded' ? 'URL Encoded' : t === 'form-data' ? 'Form Data' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </Button>
                    ))}
                  </div>
                  {activeRequest.bodyType !== 'none' && (
                    <Textarea
                      value={activeRequest.body}
                      onChange={e => updateRequest({ body: e.target.value })}
                      className="font-mono text-xs min-h-[150px] bg-muted/10 border-border/20 leading-relaxed"
                      placeholder={activeRequest.bodyType === 'json' ? '{\n  "key": "value"\n}' : activeRequest.bodyType === 'graphql' ? 'query {\n  posts {\n    id\n    title\n  }\n}' : 'Request body...'}
                    />
                  )}
                </TabsContent>
                <TabsContent value="auth" className="m-0 p-3">
                  <Select value={activeRequest.auth.type} onValueChange={v => updateRequest({ auth: { ...activeRequest.auth, type: v as any } })}>
                    <SelectTrigger className="w-52 h-8 text-xs bg-muted/20 border-border/20 mb-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api-key">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                  {activeRequest.auth.type === 'bearer' && (
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Token</label>
                      <Input value={activeRequest.auth.token || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, token: e.target.value } })}
                        placeholder="{{TOKEN}} or paste token" className="h-8 text-xs bg-muted/20 border-border/20 font-mono mt-1" />
                    </div>
                  )}
                  {activeRequest.auth.type === 'basic' && (
                    <div className="space-y-2">
                      <Input placeholder="Username" value={activeRequest.auth.username || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, username: e.target.value } })} className="h-8 text-xs bg-muted/20 border-border/20" />
                      <Input placeholder="Password" type="password" value={activeRequest.auth.password || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, password: e.target.value } })} className="h-8 text-xs bg-muted/20 border-border/20" />
                    </div>
                  )}
                  {activeRequest.auth.type === 'api-key' && (
                    <div className="space-y-2">
                      <Input placeholder="Header name (e.g. X-API-Key)" value={activeRequest.auth.headerName || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, headerName: e.target.value } })} className="h-8 text-xs bg-muted/20 border-border/20" />
                      <Input placeholder="API Key value" value={activeRequest.auth.token || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, token: e.target.value } })} className="h-8 text-xs bg-muted/20 border-border/20 font-mono" />
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="scripts" className="m-0 p-3">
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold">Test Script</label>
                  <Textarea
                    value={activeRequest.testScript || ''}
                    onChange={e => updateRequest({ testScript: e.target.value })}
                    className="font-mono text-xs min-h-[100px] bg-muted/10 border-border/20 mt-1"
                    placeholder="// Available checks:\n// status === 200\n// has body\n// is json"
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* ─── Response Area ─── */}
            <div className="border-t border-border/30 flex flex-col" style={{ height: '50%' }}>
              <div className="h-8 flex items-center px-4 border-b border-border/20 gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Response</span>
                {response && (
                  <>
                    <Badge variant="outline" className={cn('text-[10px] h-5 gap-1', statusBg(response.status))}>
                      {response.status >= 200 && response.status < 300 ? <CheckCircle2 className="w-3 h-3" /> :
                       response.status >= 400 ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {response.status} {response.statusText}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-5 border-border/30 gap-1"><Timer className="w-3 h-3" />{response.time}ms</Badge>
                    <Badge variant="outline" className="text-[10px] h-5 border-border/30">{formatBytes(response.size)}</Badge>
                    {response.testResults && (
                      <Badge variant="outline" className={cn('text-[10px] h-5 gap-1',
                        response.testResults.every(t => t.passed) ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'
                      )}>
                        {response.testResults.filter(t => t.passed).length}/{response.testResults.length} passed
                      </Badge>
                    )}
                  </>
                )}
                <div className="flex-1" />
                {response && (
                  <div className="flex gap-0.5">
                    {(['body', 'headers', 'tests'] as const).map(t => (
                      <Button key={t} variant="ghost" size="sm" onClick={() => setResponseTab(t)}
                        className={cn('h-6 text-[10px] capitalize', responseTab === t && 'bg-primary/15 text-primary')}>
                        {t}
                      </Button>
                    ))}
                    {responseTab === 'body' && (
                      <div className="flex gap-0.5 ml-1 border-l border-border/20 pl-1">
                        <Button variant="ghost" size="sm" onClick={() => setResponseBodyView('pretty')} className={cn('h-6 text-[10px]', responseBodyView === 'pretty' && 'text-primary')}><Braces className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setResponseBodyView('raw')} className={cn('h-6 text-[10px]', responseBodyView === 'raw' && 'text-primary')}><FileCode className="w-3 h-3" /></Button>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(response.body)} className="h-6 text-[10px]"><Copy className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1">
                {response ? (
                  responseTab === 'body' ? (
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed">
                      {responseBodyView === 'pretty' ? response.body : response.body}
                    </pre>
                  ) : responseTab === 'headers' ? (
                    <div className="p-3 space-y-1">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2 text-xs font-mono">
                          <span className="text-primary/70 font-medium shrink-0">{k}:</span>
                          <span className="text-foreground/70 break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : responseTab === 'tests' && response.testResults ? (
                    <div className="p-3 space-y-1">
                      {response.testResults.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {t.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                          <span className={t.passed ? 'text-foreground/80' : 'text-red-400'}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : null
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Send className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">Send a request to see the response</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Ctrl+Enter to send</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* ─── Code Generator Panel ─── */}
        {showCodeGen && (
          <div className="w-72 bg-background/50 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold">Code Snippet</span>
              <Button variant="ghost" size="icon" onClick={() => setShowCodeGen(false)} className="w-6 h-6"><X className="w-3.5 h-3.5" /></Button>
            </div>
            <div className="px-3 py-2 border-b border-border/20 flex gap-1">
              {(['curl', 'javascript', 'python'] as const).map(lang => (
                <Button key={lang} variant="outline" size="sm" onClick={() => setCodeGenLang(lang)}
                  className={cn('h-6 text-[10px] capitalize', codeGenLang === lang && 'bg-primary/15 text-primary border-primary/30')}>
                  {lang}
                </Button>
              ))}
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-foreground/80 leading-relaxed">{generatedCode}</pre>
            </ScrollArea>
            <div className="p-2 border-t border-border/20">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1" onClick={() => navigator.clipboard.writeText(generatedCode)}>
                <Copy className="w-3 h-3" /> Copy to Clipboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
