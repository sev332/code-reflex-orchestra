// Code Builder IDE - Restructured: Monaco as main content, bottom drawer for terminal/console/debug/git
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileCode, Plus, Save, Download, Upload, Trash2, Copy,
  FolderTree, Folder, FolderOpen, File, ChevronRight,
  ChevronDown, Search, Sparkles, Play, Terminal, GitBranch,
  Brain, Eye, Zap, RefreshCw, Check, X, Settings,
  Code2, FileJson, FileType, Loader2, Map, Bug,
  ChevronUp, Maximize2, Minimize2, LayoutGrid, Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface CodeBuilderIDEProps {
  onClose?: () => void;
}

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode className="w-4 h-4 text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-400" />;
  if (name.endsWith('.css') || name.endsWith('.scss')) return <FileType className="w-4 h-4 text-pink-400" />;
  if (name.endsWith('.md')) return <FileType className="w-4 h-4 text-muted-foreground" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

const getLanguage = (name: string): string => {
  if (name.endsWith('.tsx')) return 'typescript';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.html')) return 'html';
  if (name.endsWith('.md')) return 'markdown';
  return 'plaintext';
};

type BottomTab = 'terminal' | 'console' | 'debug' | 'git-map' | 'problems';

// Git commit node for subway map
interface GitCommit {
  id: string;
  message: string;
  branch: string;
  timestamp: string;
  author: string;
  parents: string[];
  color: string;
}

export function CodeBuilderIDE({ onClose }: CodeBuilderIDEProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      id: 'src', name: 'src', type: 'folder', isOpen: true,
      children: [
        {
          id: 'components', name: 'components', type: 'folder', isOpen: true,
          children: [
            { id: 'app-tsx', name: 'App.tsx', type: 'file', language: 'typescript',
              content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Welcome to Code Builder</h1>\n    </div>\n  );\n}\n\nexport default App;` }
          ]
        },
        { id: 'index-tsx', name: 'index.tsx', type: 'file', language: 'typescript',
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './components/App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);` },
        { id: 'index-css', name: 'index.css', type: 'file', language: 'css',
          content: `* { margin: 0; padding: 0; box-sizing: border-box; }\n.app { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #1a1a2e; color: white; }` }
      ]
    },
    { id: 'package-json', name: 'package.json', type: 'file', language: 'json',
      content: `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": { "react": "^18.2.0" }\n}` }
  ]);

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ lucid-ide initialized', '$ watching for changes...']);
  const [consoleOutput, setConsoleOutput] = useState<string[]>(['[info] Console ready']);
  const [debugOutput, setDebugOutput] = useState<string[]>(['Debugger not attached']);
  const [problems, setProblems] = useState<string[]>([]);

  // Bottom drawer
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(true);
  const [bottomDrawerHeight, setBottomDrawerHeight] = useState(200);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('terminal');
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const [bottomMaximized, setBottomMaximized] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');

  const editorRef = useRef<any>(null);

  // Git subway map data
  const [gitCommits] = useState<GitCommit[]>([
    { id: 'c7', message: 'feat: add AI chat integration', branch: 'feature/ai-chat', timestamp: '2m ago', author: 'AI', parents: ['c6'], color: 'hsl(var(--primary))' },
    { id: 'c6', message: 'refactor: clean up components', branch: 'main', timestamp: '15m ago', author: 'Dev', parents: ['c5'], color: 'hsl(var(--wisdom-success))' },
    { id: 'c5', message: 'merge: feature/docs into main', branch: 'main', timestamp: '1h ago', author: 'Dev', parents: ['c4', 'c3'], color: 'hsl(var(--wisdom-success))' },
    { id: 'c4', message: 'feat: document builder MVP', branch: 'feature/docs', timestamp: '2h ago', author: 'AI', parents: ['c2'], color: 'hsl(var(--wisdom-neural))' },
    { id: 'c3', message: 'fix: memory leak in editor', branch: 'main', timestamp: '3h ago', author: 'Dev', parents: ['c2'], color: 'hsl(var(--wisdom-success))' },
    { id: 'c2', message: 'feat: initial IDE layout', branch: 'main', timestamp: '5h ago', author: 'Dev', parents: ['c1'], color: 'hsl(var(--wisdom-success))' },
    { id: 'c1', message: 'init: project scaffold', branch: 'main', timestamp: '1d ago', author: 'Dev', parents: [], color: 'hsl(var(--wisdom-success))' },
  ]);

  // File operations
  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) { const f = findFile(node.children, id); if (f) return f; }
    }
    return null;
  };

  const updateFileContent = (id: string, content: string) => {
    const update = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => n.id === id ? { ...n, content } : n.children ? { ...n, children: update(n.children) } : n);
    setFileTree(update(fileTree));
    setOpenFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
    if (selectedFile?.id === id) setSelectedFile({ ...selectedFile, content });
  };

  const toggleFolder = (id: string) => {
    const update = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => n.id === id ? { ...n, isOpen: !n.isOpen } : n.children ? { ...n, children: update(n.children) } : n);
    setFileTree(update(fileTree));
  };

  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      if (!openFiles.find(f => f.id === file.id)) setOpenFiles(prev => [...prev, file]);
    } else {
      toggleFolder(file.id);
    }
  };

  const closeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) {
      const remaining = openFiles.filter(f => f.id !== id);
      setSelectedFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  // Terminal command execution
  const executeCommand = (cmd: string) => {
    setTerminalOutput(prev => [...prev, `$ ${cmd}`]);
    if (cmd === 'clear') { setTerminalOutput([]); return; }
    if (cmd === 'help') { setTerminalOutput(prev => [...prev, 'Available: clear, help, build, run, test, git status']); return; }
    if (cmd === 'build') { setTerminalOutput(prev => [...prev, '⚡ Building...', '✓ Build complete in 1.2s']); return; }
    if (cmd === 'run') { setTerminalOutput(prev => [...prev, '▶ Starting dev server...', '  → http://localhost:5173']); return; }
    if (cmd.startsWith('git')) { setTerminalOutput(prev => [...prev, `[git] ${cmd.slice(4)} executed`]); return; }
    setTerminalOutput(prev => [...prev, `Command not found: ${cmd}`]);
  };

  // Bottom drawer resize
  useEffect(() => {
    if (!isResizingBottom) return;
    const move = (e: MouseEvent) => {
      const vh = window.innerHeight;
      const newH = vh - e.clientY - 48; // 48 = top bar
      setBottomDrawerHeight(Math.max(100, Math.min(vh * 0.6, newH)));
    };
    const up = () => setIsResizingBottom(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingBottom]);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    editor.updateOptions({
      fontSize: 14, minimap: { enabled: true }, wordWrap: 'on',
      lineNumbers: 'on', padding: { top: 16 }, smoothScrolling: true,
      cursorBlinking: 'smooth', cursorSmoothCaretAnimation: 'on',
    });
  };

  const effectiveBottomH = bottomMaximized ? window.innerHeight * 0.6 : bottomDrawerOpen ? bottomDrawerHeight : 0;

  const bottomTabs: { id: BottomTab; label: string; icon: React.ComponentType<any>; count?: number }[] = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'console', label: 'Console', icon: Monitor, count: consoleOutput.length },
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'problems', label: 'Problems', icon: Zap, count: problems.length },
    { id: 'git-map', label: 'Git Map', icon: GitBranch },
  ];

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur relative">
      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginBottom: bottomDrawerOpen ? effectiveBottomH + 32 : 32 }}>
        {/* File Tabs */}
        {openFiles.length > 0 && (
          <div className="flex items-center border-b border-border/30 bg-muted/10 overflow-x-auto shrink-0">
            {openFiles.map(file => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border-r border-border/30 cursor-pointer transition-colors",
                  selectedFile?.id === file.id ? "bg-background border-b-2 border-b-primary" : "hover:bg-muted/30"
                )}
                onClick={() => setSelectedFile(file)}
              >
                {getFileIcon(file.name)}
                <span className="text-xs whitespace-nowrap">{file.name}</span>
                <Button variant="ghost" size="icon" className="w-4 h-4 opacity-60 hover:opacity-100" onClick={(e) => closeFile(file.id, e)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1">
          {selectedFile ? (
            <Editor
              height="100%"
              language={selectedFile.language || 'typescript'}
              value={selectedFile.content || ''}
              onChange={(value) => updateFileContent(selectedFile.id, value || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: true }, wordWrap: 'on', lineNumbers: 'on', padding: { top: 16 }, smoothScrolling: true }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Code2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a file to start editing</p>
                <p className="text-sm mt-1 text-muted-foreground/60">Open files from the left drawer explorer</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar — always visible */}
      <div className="fixed bottom-0 left-12 right-12 z-30" style={{ left: 'calc(48px)', right: 'calc(48px)' }}>
        {/* Bottom Drawer Content */}
        {bottomDrawerOpen && (
          <div
            className="bg-background/98 backdrop-blur-xl border-t border-x border-border/40 rounded-t-lg overflow-hidden"
            style={{ height: effectiveBottomH }}
          >
            {/* Resize handle */}
            <div
              className="h-1 cursor-row-resize hover:bg-primary/40 transition-colors"
              onMouseDown={() => setIsResizingBottom(true)}
            />

            {/* Tab content */}
            <div className="h-full overflow-hidden">
              {activeBottomTab === 'terminal' && (
                <div className="h-full flex flex-col">
                  <ScrollArea className="flex-1 px-3 py-1">
                    <div className="font-mono text-xs space-y-0.5">
                      {terminalOutput.map((line, i) => (
                        <div key={i} className={cn(
                          line.startsWith('$') ? 'text-primary' :
                          line.startsWith('✓') ? 'text-emerald-400' :
                          line.startsWith('⚡') ? 'text-amber-400' :
                          line.startsWith('▶') ? 'text-cyan-400' :
                          'text-muted-foreground'
                        )}>{line}</div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex items-center gap-2 px-3 py-1 border-t border-border/20">
                    <span className="text-primary text-xs font-mono">$</span>
                    <Input
                      value={terminalInput}
                      onChange={e => setTerminalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && terminalInput.trim()) { executeCommand(terminalInput.trim()); setTerminalInput(''); } }}
                      placeholder="Type a command..."
                      className="h-6 text-xs font-mono bg-transparent border-none focus-visible:ring-0 px-0"
                    />
                  </div>
                </div>
              )}

              {activeBottomTab === 'console' && (
                <ScrollArea className="h-full px-3 py-2">
                  <div className="font-mono text-xs space-y-1">
                    {consoleOutput.map((line, i) => (
                      <div key={i} className={cn(
                        line.includes('[error]') ? 'text-destructive' :
                        line.includes('[warn]') ? 'text-amber-400' :
                        'text-muted-foreground'
                      )}>{line}</div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {activeBottomTab === 'debug' && (
                <div className="h-full p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1"><Play className="w-3 h-3" /> Start</Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1">Step Over</Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1">Step Into</Button>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {debugOutput.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </div>
              )}

              {activeBottomTab === 'problems' && (
                <ScrollArea className="h-full px-3 py-2">
                  {problems.length === 0 ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 p-2">
                      <Check className="w-4 h-4 text-emerald-400" /> No problems detected
                    </div>
                  ) : (
                    <div className="font-mono text-xs space-y-1">
                      {problems.map((p, i) => <div key={i} className="text-amber-400">{p}</div>)}
                    </div>
                  )}
                </ScrollArea>
              )}

              {activeBottomTab === 'git-map' && (
                <ScrollArea className="h-full px-3 py-2">
                  <GitSubwayMap commits={gitCommits} />
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        {/* Bottom Tab Bar */}
        <div className="h-8 bg-background/90 backdrop-blur-xl border-t border-border/40 flex items-center px-2 gap-0.5">
          {bottomTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeBottomTab === tab.id && bottomDrawerOpen;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeBottomTab === tab.id && bottomDrawerOpen) {
                    setBottomDrawerOpen(false);
                  } else {
                    setActiveBottomTab(tab.id);
                    setBottomDrawerOpen(true);
                  }
                }}
                className={cn(
                  'h-6 px-2 text-[10px] gap-1 rounded-sm',
                  isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge variant="outline" className="h-3.5 px-1 text-[8px] ml-0.5">{tab.count}</Badge>
                )}
              </Button>
            );
          })}

          <div className="flex-1" />

          <Button
            variant="ghost" size="icon" className="w-5 h-5"
            onClick={() => setBottomMaximized(!bottomMaximized)}
          >
            {bottomMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setBottomDrawerOpen(!bottomDrawerOpen)}>
            {bottomDrawerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </Button>

          {/* Status items */}
          <div className="flex items-center gap-2 ml-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> main</span>
            <span>UTF-8</span>
            <span>{selectedFile?.language || 'Plain Text'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Git Subway Map Component
function GitSubwayMap({ commits }: { commits: GitCommit[] }) {
  const branches = [...new Set(commits.map(c => c.branch))];
  const branchColors: Record<string, string> = {};
  const palette = [
    'hsl(var(--wisdom-success))',
    'hsl(var(--primary))',
    'hsl(var(--wisdom-neural))',
    'hsl(var(--wisdom-warning))',
    'hsl(var(--wisdom-memory))',
  ];
  branches.forEach((b, i) => { branchColors[b] = palette[i % palette.length]; });

  return (
    <div className="relative">
      {/* Branch legend */}
      <div className="flex items-center gap-3 mb-3 px-1">
        {branches.map(b => (
          <div key={b} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: branchColors[b] }} />
            <span className="text-[10px] font-mono text-muted-foreground">{b}</span>
          </div>
        ))}
      </div>

      {/* Commit lines */}
      <div className="space-y-0">
        {commits.map((commit, i) => {
          const branchIdx = branches.indexOf(commit.branch);
          const isMerge = commit.parents.length > 1;

          return (
            <div key={commit.id} className="flex items-start gap-3 group py-1.5 hover:bg-muted/20 rounded px-1 transition-colors">
              {/* Subway lines */}
              <div className="relative flex items-center" style={{ width: branches.length * 24, minWidth: branches.length * 24 }}>
                {branches.map((b, bi) => {
                  const isActive = b === commit.branch;
                  const xPos = bi * 24 + 8;
                  return (
                    <div key={bi} className="absolute" style={{ left: xPos - 1 }}>
                      {/* Vertical line */}
                      <div
                        className="w-0.5 absolute -top-2"
                        style={{
                          backgroundColor: branchColors[b],
                          opacity: isActive || (i > 0 && commits.slice(0, i).some(c => c.branch === b)) ? 0.4 : 0.08,
                          height: 32,
                        }}
                      />
                      {/* Node */}
                      {isActive && (
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full border-2 relative z-10 transition-transform group-hover:scale-125",
                            isMerge && 'w-3.5 h-3.5'
                          )}
                          style={{
                            borderColor: branchColors[b],
                            backgroundColor: isMerge ? branchColors[b] : 'hsl(var(--background))',
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Commit info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary/70">{commit.id}</span>
                  <span className="text-xs truncate">{commit.message}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{commit.author}</span>
                  <span>•</span>
                  <span>{commit.timestamp}</span>
                  {isMerge && <Badge variant="outline" className="text-[8px] h-3.5 px-1">merge</Badge>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
