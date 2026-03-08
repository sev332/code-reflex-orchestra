// Terminal — Full terminal emulator with multiple sessions, command history, AI shell assistant
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, X, Terminal, ChevronRight, Wand2, Copy, Trash2,
  Maximize, Minimize, Settings, Search, Clock, FolderOpen,
  ArrowUp, ArrowDown, Split, CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'ai';
  content: string;
  timestamp: Date;
}

interface TerminalSession {
  id: string;
  name: string;
  cwd: string;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
  env: Record<string, string>;
}

// Simple simulated filesystem & commands
const simulateCommand = (cmd: string, session: TerminalSession): TerminalLine[] => {
  const ts = new Date();
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  const line = (content: string, type: TerminalLine['type'] = 'output'): TerminalLine => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, content, timestamp: ts,
  });

  switch (command) {
    case '': return [];
    case 'help': return [
      line('Available commands:', 'system'),
      line('  help          Show this help'),
      line('  echo <text>   Print text'),
      line('  ls            List files'),
      line('  cd <dir>      Change directory'),
      line('  pwd           Print working directory'),
      line('  cat <file>    Show file contents'),
      line('  mkdir <dir>   Create directory'),
      line('  clear         Clear terminal'),
      line('  date          Show current date'),
      line('  whoami        Show current user'),
      line('  env           Show environment'),
      line('  export K=V    Set env variable'),
      line('  history       Show command history'),
      line('  curl <url>    Simulate HTTP request'),
      line('  node -e <js>  Evaluate JavaScript'),
      line('  python -c <p> Evaluate Python (simulated)'),
      line('  ai <prompt>   Ask AI assistant'),
    ];
    case 'echo': return [line(args.join(' '))];
    case 'pwd': return [line(session.cwd)];
    case 'whoami': return [line('lucid-user')];
    case 'date': return [line(new Date().toISOString())];
    case 'hostname': return [line('lucid-browser-os')];
    case 'uname': return [line('LUCID BrowserOS 1.0.0 WASM aarch64')];
    case 'uptime': return [line(`up ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}, load average: 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}`)];
    case 'ls': return [
      line('drwxr-xr-x  src/          4096  Mar  8 2026'),
      line('drwxr-xr-x  public/       4096  Mar  8 2026'),
      line('-rw-r--r--  package.json   2048  Mar  8 2026'),
      line('-rw-r--r--  tsconfig.json   512  Mar  8 2026'),
      line('-rw-r--r--  vite.config.ts  256  Mar  8 2026'),
      line('-rw-r--r--  README.md      1024  Mar  8 2026'),
    ];
    case 'cd': return [line(`Changed directory to ${args[0] || '~'}`, 'system')];
    case 'cat':
      if (!args[0]) return [line('cat: missing file operand', 'error')];
      return [line(`// Contents of ${args[0]}`, 'system'), line(`export default function App() {\n  return <div>Hello LUCID</div>;\n}`)];
    case 'mkdir':
      if (!args[0]) return [line('mkdir: missing operand', 'error')];
      return [line(`Directory '${args[0]}' created`, 'system')];
    case 'clear': return [{ ...line(''), type: 'system', content: '__CLEAR__' }];
    case 'env': return Object.entries(session.env).map(([k, v]) => line(`${k}=${v}`));
    case 'export': {
      const match = args.join(' ').match(/^(\w+)=(.*)$/);
      if (match) return [line(`Set ${match[1]}=${match[2]}`, 'system')];
      return [line('export: invalid syntax', 'error')];
    }
    case 'history': return session.history.map((h, i) => line(`  ${i + 1}  ${h}`));
    case 'curl':
      if (!args[0]) return [line('curl: no URL specified', 'error')];
      return [
        line(`  % Total    % Received  Time     Speed`),
        line(`  100  1024   100  1024  0:00:00  1024k`),
        line(`{"status":"ok","message":"Simulated response from ${args[0]}"}`),
      ];
    case 'node':
      if (args[0] === '-e' && args.length > 1) {
        try {
          const code = args.slice(1).join(' ').replace(/['"]/g, '');
          return [line(`> ${code}`), line(String(eval(code)))];
        } catch (e: any) { return [line(e.message, 'error')]; }
      }
      return [line('Node.js v20.11.0 (WASM)')];
    case 'python':
      if (args[0] === '-c') return [line(`Python 3.12.0 (simulated)`), line(`>>> ${args.slice(1).join(' ')}`)];
      return [line('Python 3.12.0 (WASM) — interactive mode not available', 'system')];
    case 'ai': {
      const prompt = args.join(' ');
      if (!prompt) return [line('Usage: ai <prompt>', 'error')];
      return [
        line(`🤖 AI Assistant:`, 'ai'),
        line(`Processing: "${prompt}"`, 'ai'),
        line(`Based on my analysis, here's a suggestion for "${prompt}":`, 'ai'),
        line(`Try breaking the problem into smaller components and testing each one individually.`, 'ai'),
      ];
    }
    case 'git':
      if (args[0] === 'status') return [line('On branch main\nYour branch is up to date.\nnothing to commit, working tree clean')];
      if (args[0] === 'log') return [
        line('commit a1b2c3d (HEAD -> main)'),
        line('Author: lucid-user <user@lucid.os>'),
        line('Date:   ' + new Date().toDateString()),
        line(''),
        line('    Latest changes'),
      ];
      return [line(`git: '${args[0]}' is not a git command`, 'error')];
    case 'npm':
    case 'bun':
    case 'yarn':
      return [line(`${command} v1.0.0 — package manager (simulated)`, 'system')];
    case 'top':
      return [
        line('PID   USER     %CPU  %MEM   COMMAND'),
        line(`${Math.floor(Math.random() * 9000 + 1000)}  lucid    ${(Math.random() * 10).toFixed(1)}   ${(Math.random() * 5).toFixed(1)}    vite`),
        line(`${Math.floor(Math.random() * 9000 + 1000)}  lucid    ${(Math.random() * 5).toFixed(1)}   ${(Math.random() * 3).toFixed(1)}    typescript`),
        line(`${Math.floor(Math.random() * 9000 + 1000)}  lucid    ${(Math.random() * 2).toFixed(1)}   ${(Math.random() * 2).toFixed(1)}    esbuild`),
      ];
    case 'neofetch':
      return [
        line('       ╭───────────╮'),
        line('       │  LUCID OS │        lucid-user@browser-os'),
        line('       │  ◉ ◉ ◉   │        OS: LUCID BrowserOS 1.0'),
        line('       │  ═══════  │        Kernel: WASM 4.0'),
        line('       ╰───────────╯        Shell: lucid-sh 1.0'),
        line('                            Resolution: ' + window.innerWidth + 'x' + window.innerHeight),
        line('                            CPU: Browser V8 Engine'),
        line('                            Memory: ' + ((performance as any).memory?.usedJSHeapSize ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A')),
      ];
    default:
      return [line(`${command}: command not found. Type 'help' for available commands.`, 'error')];
  }
};

const createSession = (name?: string): TerminalSession => ({
  id: `session-${Date.now()}`,
  name: name || `Session ${Math.floor(Math.random() * 100)}`,
  cwd: '~/lucid-project',
  lines: [
    { id: 'welcome', type: 'system', content: '╭─────────────────────────────────────────╮', timestamp: new Date() },
    { id: 'welcome2', type: 'system', content: '│  LUCID Terminal v1.0 — Browser OS Shell │', timestamp: new Date() },
    { id: 'welcome3', type: 'system', content: '│  Type "help" for available commands      │', timestamp: new Date() },
    { id: 'welcome4', type: 'system', content: '╰─────────────────────────────────────────╯', timestamp: new Date() },
  ],
  history: [],
  historyIndex: -1,
  env: {
    HOME: '/home/lucid-user',
    USER: 'lucid-user',
    SHELL: '/bin/lucid-sh',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    NODE_ENV: 'development',
    EDITOR: 'monaco',
  },
});

export function TerminalPage() {
  const [sessions, setSessions] = useState<TerminalSession[]>([createSession('Main')]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [input, setInput] = useState('');
  const [splitView, setSplitView] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.lines.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId]);

  const executeCommand = useCallback((cmd: string) => {
    if (!cmd.trim()) return;

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const inputLine: TerminalLine = {
        id: `in-${Date.now()}`, type: 'input', content: cmd, timestamp: new Date(),
      };
      const outputLines = simulateCommand(cmd, s);

      if (outputLines.some(l => l.content === '__CLEAR__')) {
        return { ...s, lines: [], history: [...s.history, cmd], historyIndex: -1 };
      }

      // Handle export
      let newEnv = { ...s.env };
      if (cmd.startsWith('export ')) {
        const match = cmd.slice(7).match(/^(\w+)=(.*)$/);
        if (match) newEnv[match[1]] = match[2];
      }

      // Handle cd
      let newCwd = s.cwd;
      if (cmd.startsWith('cd ')) {
        const dir = cmd.slice(3).trim();
        if (dir === '~' || dir === '') newCwd = '~/lucid-project';
        else if (dir === '..') newCwd = s.cwd.split('/').slice(0, -1).join('/') || '~';
        else if (dir.startsWith('/')) newCwd = dir;
        else newCwd = `${s.cwd}/${dir}`;
      }

      return {
        ...s,
        lines: [...s.lines, inputLine, ...outputLines],
        history: [...s.history, cmd],
        historyIndex: -1,
        env: newEnv,
        cwd: newCwd,
      };
    }));
    setInput('');
  }, [activeSessionId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s;
        const newIdx = s.historyIndex < s.history.length - 1 ? s.historyIndex + 1 : s.historyIndex;
        setInput(s.history[s.history.length - 1 - newIdx] || '');
        return { ...s, historyIndex: newIdx };
      }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s;
        const newIdx = s.historyIndex > 0 ? s.historyIndex - 1 : -1;
        setInput(newIdx >= 0 ? (s.history[s.history.length - 1 - newIdx] || '') : '');
        return { ...s, historyIndex: newIdx };
      }));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic autocomplete
      const cmds = ['help', 'echo', 'ls', 'cd', 'pwd', 'cat', 'mkdir', 'clear', 'date', 'whoami', 'env', 'export', 'history', 'curl', 'node', 'python', 'ai', 'git', 'npm', 'top', 'neofetch', 'uname', 'hostname', 'uptime'];
      const match = cmds.filter(c => c.startsWith(input));
      if (match.length === 1) setInput(match[0] + ' ');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      executeCommand('clear');
    }
  }, [input, activeSessionId, executeCommand]);

  const addSession = useCallback(() => {
    const s = createSession();
    setSessions(prev => [...prev, s]);
    setActiveSessionId(s.id);
  }, []);

  const closeSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const ns = createSession('Main');
        setActiveSessionId(ns.id);
        return [ns];
      }
      if (activeSessionId === id) setActiveSessionId(filtered[0].id);
      return filtered;
    });
  }, [activeSessionId]);

  const renderTerminal = (session: TerminalSession) => (
    <div
      className="flex-1 flex flex-col bg-[#0a0a0f] font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {session.lines.map(line => (
          <div key={line.id} className="flex">
            {line.type === 'input' && (
              <span className="shrink-0">
                <span className="text-emerald-400">lucid</span>
                <span className="text-muted-foreground">:</span>
                <span className="text-blue-400">{session.cwd}</span>
                <span className="text-muted-foreground"> $ </span>
              </span>
            )}
            <span className={cn(
              'whitespace-pre-wrap break-all',
              line.type === 'error' && 'text-red-400',
              line.type === 'system' && 'text-muted-foreground',
              line.type === 'ai' && 'text-cyan-400',
              line.type === 'output' && 'text-foreground/90',
              line.type === 'input' && 'text-foreground',
            )}>
              {line.content}
            </span>
          </div>
        ))}
      </div>

      {/* Input line */}
      <div className="flex items-center px-3 py-2 border-t border-border/10 bg-[#0d0d14]">
        <span className="text-emerald-400 shrink-0">lucid</span>
        <span className="text-muted-foreground shrink-0">:</span>
        <span className="text-blue-400 shrink-0">{session.cwd}</span>
        <span className="text-muted-foreground shrink-0 mr-2"> $ </span>
        <input
          ref={session.id === activeSessionId ? inputRef : undefined}
          value={session.id === activeSessionId ? input : ''}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-foreground caret-emerald-400"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Tab bar */}
      <div className="h-9 bg-background/60 backdrop-blur border-b border-border/30 flex items-center px-1 gap-0.5 shrink-0">
        {sessions.map(s => (
          <div
            key={s.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs cursor-pointer transition-all',
              s.id === activeSessionId ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted/30'
            )}
            onClick={() => setActiveSessionId(s.id)}
          >
            <Terminal className="w-3 h-3" />
            <span>{s.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeSession(s.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="icon" onClick={addSession} className="w-7 h-7 ml-1">
          <Plus className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1" />
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setSplitView(v => !v)} className={cn('w-7 h-7', splitView && 'text-primary')}>
              <Split className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Split View</TooltipContent>
        </Tooltip>
      </div>

      {/* Terminal content */}
      <div className={cn('flex-1 flex', splitView ? 'flex-row' : 'flex-col')}>
        {renderTerminal(activeSession)}
        {splitView && sessions.length > 1 && (
          <>
            <div className="w-px bg-border/30" />
            {renderTerminal(sessions.find(s => s.id !== activeSessionId) || sessions[0])}
          </>
        )}
      </div>
    </div>
  );
}
