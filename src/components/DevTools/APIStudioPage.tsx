// API Studio — Postman-like API testing, collections, environments
import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyValue { key: string; value: string; enabled: boolean; }
interface APIRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: string;
  bodyType: 'none' | 'json' | 'form' | 'raw';
  auth: { type: 'none' | 'bearer' | 'basic'; token?: string; username?: string; password?: string };
}
interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}
interface Collection {
  id: string;
  name: string;
  requests: APIRequest[];
  expanded: boolean;
}
interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
}

const methodColors: Record<string, string> = {
  GET: 'text-emerald-400', POST: 'text-amber-400', PUT: 'text-blue-400',
  PATCH: 'text-purple-400', DELETE: 'text-red-400', HEAD: 'text-gray-400', OPTIONS: 'text-pink-400',
};

const createRequest = (name?: string): APIRequest => ({
  id: `req-${Date.now()}`, name: name || 'New Request', method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
  params: [], body: '', bodyType: 'none',
  auth: { type: 'none' },
});

export function APIStudioPage() {
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: 'col-1', name: 'Sample Collection', expanded: true,
      requests: [
        { ...createRequest('Get Posts'), url: 'https://jsonplaceholder.typicode.com/posts' },
        { ...createRequest('Get Post'), url: 'https://jsonplaceholder.typicode.com/posts/1' },
        { ...createRequest('Create Post'), method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts', body: '{\n  "title": "Hello",\n  "body": "World",\n  "userId": 1\n}', bodyType: 'json' },
      ],
    },
  ]);
  const [activeRequest, setActiveRequest] = useState<APIRequest>(collections[0].requests[0]);
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'cookies'>('body');
  const [environments, setEnvironments] = useState<Environment[]>([
    { id: 'env-1', name: 'Development', variables: [{ key: 'BASE_URL', value: 'https://jsonplaceholder.typicode.com', enabled: true }, { key: 'API_KEY', value: 'dev-key-123', enabled: true }] },
    { id: 'env-2', name: 'Production', variables: [{ key: 'BASE_URL', value: 'https://api.production.com', enabled: true }] },
  ]);
  const [activeEnv, setActiveEnv] = useState('env-1');
  const [history, setHistory] = useState<{ request: APIRequest; response: APIResponse; timestamp: Date }[]>([]);

  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const headers: Record<string, string> = {};
      activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => { headers[h.key] = h.value; });
      if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
        headers['Authorization'] = `Bearer ${activeRequest.auth.token}`;
      }

      const fetchOpts: RequestInit = { method: activeRequest.method, headers };
      if (['POST', 'PUT', 'PATCH'].includes(activeRequest.method) && activeRequest.body) {
        fetchOpts.body = activeRequest.body;
      }

      const res = await fetch(activeRequest.url, fetchOpts);
      const text = await res.text();
      const elapsed = Math.round(performance.now() - start);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      let formattedBody = text;
      try { formattedBody = JSON.stringify(JSON.parse(text), null, 2); } catch {}

      const apiResponse: APIResponse = {
        status: res.status, statusText: res.statusText,
        headers: resHeaders, body: formattedBody,
        time: elapsed, size: new Blob([text]).size,
      };
      setResponse(apiResponse);
      setHistory(prev => [{ request: { ...activeRequest }, response: apiResponse, timestamp: new Date() }, ...prev.slice(0, 49)]);
    } catch (err: any) {
      setResponse({
        status: 0, statusText: 'Error',
        headers: {}, body: `Error: ${err.message}`,
        time: Math.round(performance.now() - start), size: 0,
      });
    }
    setIsLoading(false);
  }, [activeRequest]);

  const updateRequest = useCallback((updates: Partial<APIRequest>) => {
    setActiveRequest(prev => ({ ...prev, ...updates }));
  }, []);

  const addKeyValue = useCallback((field: 'headers' | 'params') => {
    updateRequest({ [field]: [...activeRequest[field], { key: '', value: '', enabled: true }] });
  }, [activeRequest, updateRequest]);

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Top bar */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">API Studio</span>
        <div className="flex-1" />
        <Select value={activeEnv} onValueChange={setActiveEnv}>
          <SelectTrigger className="w-36 h-7 text-xs bg-muted/30 border-border/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {environments.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Collections sidebar */}
        <div className="w-56 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Collections</span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => {
              setCollections(prev => [...prev, { id: `col-${Date.now()}`, name: 'New Collection', requests: [createRequest()], expanded: true }]);
            }}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {collections.map(col => (
                <div key={col.id}>
                  <button
                    onClick={() => setCollections(prev => prev.map(c => c.id === col.id ? { ...c, expanded: !c.expanded } : c))}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium hover:bg-muted/30 rounded-md"
                  >
                    {col.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">{col.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto">{col.requests.length}</Badge>
                  </button>
                  {col.expanded && col.requests.map(req => (
                    <button
                      key={req.id}
                      onClick={() => setActiveRequest(req)}
                      className={cn(
                        'w-full flex items-center gap-1.5 px-2 py-1 pl-7 text-xs rounded-md transition-colors',
                        activeRequest.id === req.id ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-muted/30'
                      )}
                    >
                      <span className={cn('text-[10px] font-bold w-8 shrink-0', methodColors[req.method])}>{req.method.slice(0, 3)}</span>
                      <span className="truncate">{req.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main request area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* URL bar */}
          <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
            <Select value={activeRequest.method} onValueChange={v => updateRequest({ method: v as any })}>
              <SelectTrigger className={cn('w-24 h-9 text-xs font-bold border-border/30', methodColors[activeRequest.method])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                  <SelectItem key={m} value={m} className={methodColors[m]}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={activeRequest.url}
              onChange={e => updateRequest({ url: e.target.value })}
              placeholder="Enter request URL"
              className="flex-1 h-9 bg-muted/30 border-border/30 font-mono text-sm"
            />
            <Button onClick={sendRequest} disabled={isLoading} className="h-9 px-4 gap-1.5">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
          </div>

          {/* Request config tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col flex-1">
              <TabsList className="bg-transparent border-b border-border/30 rounded-none h-9 px-4 justify-start w-full">
                <TabsTrigger value="params" className="text-xs data-[state=active]:bg-primary/10 rounded-none">Params</TabsTrigger>
                <TabsTrigger value="headers" className="text-xs data-[state=active]:bg-primary/10 rounded-none">Headers</TabsTrigger>
                <TabsTrigger value="body" className="text-xs data-[state=active]:bg-primary/10 rounded-none">Body</TabsTrigger>
                <TabsTrigger value="auth" className="text-xs data-[state=active]:bg-primary/10 rounded-none">Auth</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden flex flex-col">
                <TabsContent value="params" className="m-0 flex-1 overflow-auto p-4">
                  <KeyValueEditor items={activeRequest.params} onChange={params => updateRequest({ params })} onAdd={() => addKeyValue('params')} />
                </TabsContent>
                <TabsContent value="headers" className="m-0 flex-1 overflow-auto p-4">
                  <KeyValueEditor items={activeRequest.headers} onChange={headers => updateRequest({ headers })} onAdd={() => addKeyValue('headers')} />
                </TabsContent>
                <TabsContent value="body" className="m-0 flex-1 overflow-auto p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {(['none', 'json', 'form', 'raw'] as const).map(t => (
                      <Button key={t} variant="outline" size="sm" onClick={() => updateRequest({ bodyType: t })}
                        className={cn('h-6 text-[10px] capitalize', activeRequest.bodyType === t && 'bg-primary/15 text-primary border-primary/30')}>
                        {t}
                      </Button>
                    ))}
                  </div>
                  {activeRequest.bodyType !== 'none' && (
                    <Textarea
                      value={activeRequest.body}
                      onChange={e => updateRequest({ body: e.target.value })}
                      className="font-mono text-xs min-h-[200px] bg-muted/30 border-border/30"
                      placeholder={activeRequest.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                    />
                  )}
                </TabsContent>
                <TabsContent value="auth" className="m-0 flex-1 overflow-auto p-4">
                  <Select value={activeRequest.auth.type} onValueChange={v => updateRequest({ auth: { ...activeRequest.auth, type: v as any } })}>
                    <SelectTrigger className="w-48 h-8 text-xs bg-muted/30 border-border/30 mb-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                  {activeRequest.auth.type === 'bearer' && (
                    <Input
                      value={activeRequest.auth.token || ''}
                      onChange={e => updateRequest({ auth: { ...activeRequest.auth, token: e.target.value } })}
                      placeholder="Enter token..."
                      className="h-8 text-xs bg-muted/30 border-border/30 font-mono"
                    />
                  )}
                  {activeRequest.auth.type === 'basic' && (
                    <div className="space-y-2">
                      <Input placeholder="Username" value={activeRequest.auth.username || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, username: e.target.value } })} className="h-8 text-xs bg-muted/30 border-border/30" />
                      <Input placeholder="Password" type="password" value={activeRequest.auth.password || ''} onChange={e => updateRequest({ auth: { ...activeRequest.auth, password: e.target.value } })} className="h-8 text-xs bg-muted/30 border-border/30" />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Response area */}
            <div className="border-t border-border/30 flex flex-col" style={{ height: '45%' }}>
              <div className="h-9 flex items-center px-4 border-b border-border/20 gap-3 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">Response</span>
                {response && (
                  <>
                    <Badge className={cn('text-[10px] h-5',
                      response.status >= 200 && response.status < 300 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      response.status >= 400 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    )} variant="outline">
                      {response.status} {response.statusText}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-5 border-border/30">{response.time}ms</Badge>
                    <Badge variant="outline" className="text-[10px] h-5 border-border/30">{(response.size / 1024).toFixed(1)}KB</Badge>
                  </>
                )}
                <div className="flex-1" />
                {response && (
                  <div className="flex gap-0.5">
                    {(['body', 'headers'] as const).map(t => (
                      <Button key={t} variant="ghost" size="sm" onClick={() => setResponseTab(t)}
                        className={cn('h-6 text-[10px] capitalize', responseTab === t && 'bg-primary/15 text-primary')}>
                        {t}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1">
                {response ? (
                  <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-foreground/90">
                    {responseTab === 'body' ? response.body :
                     Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <div className="text-center">
                      <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Send a request to see the response</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyValueEditor({ items, onChange, onAdd }: { items: KeyValue[]; onChange: (items: KeyValue[]) => void; onAdd: () => void }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={e => { const n = [...items]; n[i] = { ...n[i], enabled: e.target.checked }; onChange(n); }}
            className="w-4 h-4 rounded"
          />
          <Input value={item.key} onChange={e => { const n = [...items]; n[i] = { ...n[i], key: e.target.value }; onChange(n); }}
            placeholder="Key" className="h-7 text-xs bg-muted/30 border-border/30 flex-1" />
          <Input value={item.value} onChange={e => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; onChange(n); }}
            placeholder="Value" className="h-7 text-xs bg-muted/30 border-border/30 flex-1" />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} className="w-7 h-7 hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs gap-1">
        <Plus className="w-3 h-3" /> Add
      </Button>
    </div>
  );
}
