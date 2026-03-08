// Terminal — Full emulator with pipe simulation, autocomplete, themes, process viewer
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus, X, Terminal, Wand2, Trash2, Split, Palette, Cpu, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────── Types ─────────── */
interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'ai' | 'table';
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
  aliases: Record<string, string>;
}

interface TerminalTheme {
  name: string;
  bg: string;
  text: string;
  prompt: string;
  path: string;
  error: string;
  system: string;
  ai: string;
  selection: string;
}

const themes: TerminalTheme[] = [
  { name: 'Midnight', bg: '#0a0a0f', text: 'text-foreground/90', prompt: 'text-emerald-400', path: 'text-blue-400', error: 'text-red-400', system: 'text-muted-foreground', ai: 'text-cyan-400', selection: 'bg-primary/20' },
  { name: 'Dracula', bg: '#282a36', text: 'text-[#f8f8f2]', prompt: 'text-[#50fa7b]', path: 'text-[#bd93f9]', error: 'text-[#ff5555]', system: 'text-[#6272a4]', ai: 'text-[#8be9fd]', selection: 'bg-[#44475a]' },
  { name: 'Solarized', bg: '#002b36', text: 'text-[#839496]', prompt: 'text-[#859900]', path: 'text-[#268bd2]', error: 'text-[#dc322f]', system: 'text-[#586e75]', ai: 'text-[#2aa198]', selection: 'bg-[#073642]' },
  { name: 'Matrix', bg: '#0d1117', text: 'text-[#39d353]', prompt: 'text-[#39d353]', path: 'text-[#58a6ff]', error: 'text-[#f85149]', system: 'text-[#238636]', ai: 'text-[#79c0ff]', selection: 'bg-[#161b22]' },
];

/* ─────────── Simulated filesystem ─────────── */
const fileSystem: Record<string, string[]> = {
  '~': ['lucid-project', '.config', '.bashrc', '.profile'],
  '~/lucid-project': ['src', 'public', 'docs', 'supabase', 'package.json', 'tsconfig.json', 'vite.config.ts', 'README.md', 'index.html'],
  '~/lucid-project/src': ['components', 'hooks', 'lib', 'pages', 'App.tsx', 'main.tsx', 'index.css'],
  '~/lucid-project/src/components': ['AIChat', 'DreamMode', 'MediaEditors', 'Orchestration', 'Productivity', 'DevTools', 'layout', 'ui'],
};

const fileContents: Record<string, string> = {
  'package.json': '{\n  "name": "lucid-browser-os",\n  "version": "2.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  }\n}',
  'README.md': '# LUCID Browser OS\n\nA comprehensive AI-powered browser operating system.\n\n## Features\n- Multi-agent orchestration\n- CMC memory architecture\n- Dream Mode self-exploration\n- Full productivity suite',
  '.bashrc': '# LUCID Shell Configuration\nexport PS1="\\u@\\h:\\w$ "\nalias ll="ls -la"\nalias gs="git status"\nalias gp="git push"',
  'vite.config.ts': 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react-swc";\nimport path from "path";\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: { "@": path.resolve(__dirname, "./src") }\n  }\n});',
};

/* ─────────── Command engine with pipe support ─────────── */
const line = (content: string, type: TerminalLine['type'] = 'output'): TerminalLine => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type, content, timestamp: new Date(),
});

const executeAtomicCommand = (cmd: string, session: TerminalSession, pipeInput?: string): { lines: TerminalLine[]; env?: Record<string, string>; cwd?: string; clear?: boolean } => {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  // Check aliases first
  if (session.aliases[command]) {
    return executeAtomicCommand(session.aliases[command] + ' ' + args.join(' '), session, pipeInput);
  }

  switch (command) {
    case '': return { lines: [] };
    case 'help': return { lines: [
      line('╭──────────── LUCID Shell v2.0 ────────────╮', 'system'),
      line('│ BUILT-IN COMMANDS                         │', 'system'),
      line('├───────────────────────────────────────────┤', 'system'),
      line('│ help             Show this help            │', 'system'),
      line('│ echo <text>      Print text                │', 'system'),
      line('│ ls [-la]         List files                │', 'system'),
      line('│ cd <dir>         Change directory          │', 'system'),
      line('│ pwd              Working directory         │', 'system'),
      line('│ cat <file>       Show file contents        │', 'system'),
      line('│ head/tail <file> First/last lines          │', 'system'),
      line('│ grep <pat>       Search (pipe supported)   │', 'system'),
      line('│ wc [-l|-w|-c]    Word/line/char count      │', 'system'),
      line('│ sort / uniq      Sort/deduplicate lines    │', 'system'),
      line('│ mkdir/touch      Create dir/file           │', 'system'),
      line('│ clear            Clear terminal            │', 'system'),
      line('│ history          Command history           │', 'system'),
      line('│ alias k=v        Create alias              │', 'system'),
      line('│ env / export     Environment variables     │', 'system'),
      line('│ curl <url>       HTTP request              │', 'system'),
      line('│ node -e <js>     Evaluate JavaScript       │', 'system'),
      line('│ ps / top / htop  Process viewer            │', 'system'),
      line('│ git <cmd>        Git commands               │', 'system'),
      line('│ ai <prompt>      AI assistant              │', 'system'),
      line('│ neofetch         System info               │', 'system'),
      line('│ theme <name>     Change theme              │', 'system'),
      line('│                                            │', 'system'),
      line('│ PIPES: cmd1 | cmd2 | cmd3                  │', 'system'),
      line('│ REDIRECT: cmd > file  (simulated)          │', 'system'),
      line('╰───────────────────────────────────────────╯', 'system'),
    ] };

    case 'echo': {
      const text = args.join(' ').replace(/\$(\w+)/g, (_, k) => session.env[k] || '');
      return { lines: [line(text)] };
    }
    case 'pwd': return { lines: [line(session.cwd)] };
    case 'whoami': return { lines: [line('lucid-user')] };
    case 'date': return { lines: [line(new Date().toISOString())] };
    case 'hostname': return { lines: [line('lucid-browser-os')] };
    case 'uname': {
      if (args.includes('-a')) return { lines: [line('LUCID BrowserOS 2.0.0 WASM aarch64 lucid-browser-os')] };
      return { lines: [line('LUCID BrowserOS 2.0')] };
    }
    case 'uptime': return { lines: [line(`up ${Math.floor(Math.random() * 48)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}, load average: ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 1.5).toFixed(2)}, ${(Math.random()).toFixed(2)}`)] };

    case 'ls': {
      const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const dir = fileSystem[session.cwd] || ['(empty)'];
      const entries = showAll ? ['.', '..', ...dir] : dir;

      if (showLong) {
        return { lines: entries.map(f => {
          const isDir = !f.includes('.');
          const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = isDir ? '4096' : String(Math.floor(Math.random() * 10000)).padStart(5);
          return line(`${perms}  lucid  ${size}  Mar  8 2026  ${isDir ? `\x1b[34m${f}/\x1b[0m` : f}`);
        }) };
      }
      return { lines: [line(entries.map(f => f.includes('.') ? f : f + '/').join('  '))] };
    }

    case 'cd': {
      const dir = args[0] || '~';
      let newCwd = session.cwd;
      if (dir === '~' || dir === '') newCwd = '~';
      else if (dir === '..') newCwd = session.cwd.split('/').slice(0, -1).join('/') || '~';
      else if (dir.startsWith('/') || dir.startsWith('~')) newCwd = dir;
      else newCwd = `${session.cwd}/${dir}`;

      if (!fileSystem[newCwd]) return { lines: [line(`cd: no such directory: ${dir}`, 'error')] };
      return { lines: [], cwd: newCwd };
    }

    case 'cat': {
      if (!args[0]) return { lines: [line('cat: missing file operand', 'error')] };
      if (pipeInput) return { lines: [line(pipeInput)] };
      const content = fileContents[args[0]];
      if (!content) return { lines: [line(`cat: ${args[0]}: No such file or directory`, 'error')] };
      return { lines: content.split('\n').map(l => line(l)) };
    }

    case 'head': {
      const text = pipeInput || fileContents[args[args.length - 1]] || '';
      if (!text) return { lines: [line('head: missing input', 'error')] };
      const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
      return { lines: text.split('\n').slice(0, n).map(l => line(l)) };
    }

    case 'tail': {
      const text = pipeInput || fileContents[args[args.length - 1]] || '';
      if (!text) return { lines: [line('tail: missing input', 'error')] };
      const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
      return { lines: text.split('\n').slice(-n).map(l => line(l)) };
    }

    case 'grep': {
      const pattern = args[0];
      if (!pattern) return { lines: [line('grep: missing pattern', 'error')] };
      const text = pipeInput || fileContents[args[1]] || '';
      const matches = text.split('\n').filter(l => l.toLowerCase().includes(pattern.toLowerCase()));
      if (matches.length === 0) return { lines: [line('(no matches)', 'system')] };
      return { lines: matches.map(m => line(m.replace(new RegExp(`(${pattern})`, 'gi'), '[$1]'))) };
    }

    case 'wc': {
      const text = pipeInput || fileContents[args[args.length - 1]] || '';
      const lines_arr = text.split('\n');
      const words = text.split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      if (args.includes('-l')) return { lines: [line(`${lines_arr.length}`)] };
      if (args.includes('-w')) return { lines: [line(`${words}`)] };
      if (args.includes('-c')) return { lines: [line(`${chars}`)] };
      return { lines: [line(`  ${lines_arr.length}  ${words}  ${chars}`)] };
    }

    case 'sort': {
      const text = pipeInput || '';
      const sorted = text.split('\n').sort().filter(Boolean);
      return { lines: sorted.map(l => line(l)) };
    }

    case 'uniq': {
      const text = pipeInput || '';
      const unique = [...new Set(text.split('\n').filter(Boolean))];
      return { lines: unique.map(l => line(l)) };
    }

    case 'mkdir':
      if (!args[0]) return { lines: [line('mkdir: missing operand', 'error')] };
      return { lines: [line(`Directory '${args[0]}' created`, 'system')] };
    case 'touch':
      if (!args[0]) return { lines: [line('touch: missing operand', 'error')] };
      return { lines: [line(`Created '${args[0]}'`, 'system')] };
    case 'rm':
      if (!args[0]) return { lines: [line('rm: missing operand', 'error')] };
      return { lines: [line(`Removed '${args.join(' ')}'`, 'system')] };

    case 'clear': return { lines: [], clear: true };

    case 'env': return { lines: Object.entries(session.env).sort().map(([k, v]) => line(`${k}=${v}`)) };
    case 'export': {
      const match = args.join(' ').match(/^(\w+)=(.*)$/);
      if (match) return { lines: [line(`Set ${match[1]}=${match[2]}`, 'system')], env: { ...session.env, [match[1]]: match[2] } };
      return { lines: [line('export: usage: export KEY=VALUE', 'error')] };
    }

    case 'alias': {
      if (args.length === 0) {
        return { lines: Object.entries(session.aliases).map(([k, v]) => line(`alias ${k}='${v}'`)) };
      }
      const match = args.join(' ').match(/^(\w+)=["']?(.+?)["']?$/);
      if (match) return { lines: [line(`alias ${match[1]}='${match[2]}'`, 'system')] };
      return { lines: [line('alias: usage: alias name=value', 'error')] };
    }

    case 'history': return { lines: session.history.map((h, i) => line(`  ${String(i + 1).padStart(4)}  ${h}`)) };

    case 'curl': {
      if (!args[0]) return { lines: [line('curl: no URL specified', 'error')] };
      const url = args.find(a => !a.startsWith('-')) || args[0];
      return { lines: [
        line(`  % Total    % Received   Time      Speed`, 'system'),
        line(`  100  2048   100  2048    0:00:00   2048k`, 'system'),
        line(`{"status":"ok","data":{"message":"Response from ${url}","timestamp":"${new Date().toISOString()}","items":[{"id":1,"name":"item_1"},{"id":2,"name":"item_2"}]}}`),
      ] };
    }

    case 'node':
      if (args[0] === '-e' && args.length > 1) {
        try {
          const code = args.slice(1).join(' ').replace(/^['"]|['"]$/g, '');
          const result = String(new Function(`return ${code}`)());
          return { lines: [line(result)] };
        } catch (e: any) { return { lines: [line(e.message, 'error')] }; }
      }
      return { lines: [line('Node.js v22.0.0 (WASM) — Interactive mode', 'system')] };

    case 'python':
      if (args[0] === '-c') return { lines: [line(`>>> ${args.slice(1).join(' ')}`, 'system'), line('(Python simulation — output would appear here)')] };
      return { lines: [line('Python 3.13.0 (WASM) — interactive mode', 'system')] };

    case 'ps': return { lines: [
      line('  PID  STAT  %CPU  %MEM  COMMAND', 'system'),
      line(`    1  S      0.0   0.1  /sbin/init`),
      line(`  ${100 + Math.floor(Math.random() * 900)}  R      ${(Math.random() * 15).toFixed(1)}   ${(Math.random() * 5).toFixed(1)}  vite --host`),
      line(`  ${100 + Math.floor(Math.random() * 900)}  S      ${(Math.random() * 5).toFixed(1)}   ${(Math.random() * 3).toFixed(1)}  typescript --watch`),
      line(`  ${100 + Math.floor(Math.random() * 900)}  S      ${(Math.random() * 3).toFixed(1)}   ${(Math.random() * 2).toFixed(1)}  esbuild`),
      line(`  ${100 + Math.floor(Math.random() * 900)}  S      0.1   0.0  lucid-shell`),
    ] };

    case 'top':
    case 'htop': {
      const procs = [
        { name: 'vite', cpu: (Math.random() * 20).toFixed(1), mem: (Math.random() * 8).toFixed(1) },
        { name: 'typescript', cpu: (Math.random() * 10).toFixed(1), mem: (Math.random() * 5).toFixed(1) },
        { name: 'esbuild', cpu: (Math.random() * 5).toFixed(1), mem: (Math.random() * 3).toFixed(1) },
        { name: 'lucid-ai', cpu: (Math.random() * 30).toFixed(1), mem: (Math.random() * 12).toFixed(1) },
        { name: 'wasm-runtime', cpu: (Math.random() * 8).toFixed(1), mem: (Math.random() * 6).toFixed(1) },
      ];
      const totalCpu = procs.reduce((s, p) => s + parseFloat(p.cpu), 0).toFixed(1);
      const totalMem = procs.reduce((s, p) => s + parseFloat(p.mem), 0).toFixed(1);
      return { lines: [
        line(`┌─ LUCID System Monitor ── CPU: ${totalCpu}% ── MEM: ${totalMem}% ──┐`, 'system'),
        line(`│ PID   USER     %CPU  %MEM   TIME      COMMAND            │`, 'system'),
        line(`├─────────────────────────────────────────────────────────┤`, 'system'),
        ...procs.map(p => line(`│ ${String(Math.floor(Math.random() * 9000 + 1000)).padEnd(6)}lucid    ${p.cpu.padStart(5)}  ${p.mem.padStart(5)}   ${Math.floor(Math.random() * 60)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}  ${p.name.padEnd(19)}│`)),
        line(`└─────────────────────────────────────────────────────────┘`, 'system'),
      ] };
    }

    case 'neofetch': return { lines: [
      line(''),
      line('       ╭───────────────╮'),
      line('       │   ◈ LUCID OS  │     lucid-user@browser-os'),
      line('       │   ╭───────╮   │     ────────────────────'),
      line('       │   │ ◉ ◉ ◉ │   │     OS: LUCID BrowserOS 2.0'),
      line('       │   │ ═════ │   │     Kernel: WASM 4.2-aarch64'),
      line('       │   ╰───────╯   │     Shell: lucid-sh 2.0'),
      line('       ╰───────────────╯     Terminal: LUCID Term'),
      line(`                             Resolution: ${window.innerWidth}×${window.innerHeight}`),
      line('                             CPU: Browser V8 Engine (WASM)'),
      line(`                             Memory: ${Math.round(performance.now() / 100)}MB / 4096MB`),
      line('                             Uptime: ' + Math.floor(performance.now() / 60000) + ' minutes'),
      line('                             Packages: 47 (npm)'),
      line(''),
      line('       ████████████████     Colors:'),
      line('       ████████████████     ● ● ● ● ● ● ● ●'),
      line(''),
    ] };

    case 'git':
      if (args[0] === 'status') return { lines: [
        line('On branch main'),
        line('Your branch is up to date with \'origin/main\'.'),
        line(''),
        line('Changes not staged for commit:'),
        line('  modified:   src/components/Productivity/EmailPage.tsx'),
        line('  modified:   src/components/DevTools/TerminalPage.tsx'),
        line(''),
        line('no changes added to commit'),
      ] };
      if (args[0] === 'log') return { lines: [
        line('\x1b[33mcommit a1b2c3d\x1b[0m (HEAD -> main, origin/main)'),
        line('Author: lucid-user <user@lucid.os>'),
        line('Date:   ' + new Date().toDateString()),
        line(''),
        line('    feat: upgrade productivity suite to pro-grade'),
        line(''),
        line('\x1b[33mcommit e4f5g6h\x1b[0m'),
        line('Author: lucid-user <user@lucid.os>'),
        line('Date:   ' + new Date(Date.now() - 86400000).toDateString()),
        line(''),
        line('    feat: add DAW-grade audio editor'),
      ] };
      if (args[0] === 'branch') return { lines: [line('* main'), line('  feature/email-threading'), line('  feature/terminal-v2')] };
      if (args[0] === 'diff') return { lines: [
        line('diff --git a/src/App.tsx b/src/App.tsx'),
        line('--- a/src/App.tsx'),
        line('+++ b/src/App.tsx'),
        line('@@ -1,3 +1,5 @@'),
        line(' import React from "react";', 'system'),
        line('+import { NewFeature } from "./features";'),
        line(' export default function App() {', 'system'),
      ] };
      return { lines: [line(`git: '${args[0] || ''}' — see 'git --help'`, 'system')] };

    case 'npm':
    case 'bun':
    case 'yarn':
    case 'pnpm':
      if (args[0] === 'list' || args[0] === 'ls') return { lines: [
        line(`lucid-browser-os@2.0.0 ~/lucid-project`),
        line(`├── react@18.3.1`),
        line(`├── @xyflow/react@12.8.2`),
        line(`├── tailwindcss@4.x`),
        line(`└── 44 more packages`),
      ] };
      return { lines: [line(`${command} v1.x — package manager (simulated)`, 'system')] };

    case 'ai': {
      const prompt = args.join(' ');
      if (!prompt) return { lines: [line('Usage: ai <prompt>', 'error')] };
      return { lines: [
        line('', 'ai'),
        line('🤖 LUCID AI Assistant', 'ai'),
        line('─'.repeat(40), 'ai'),
        line(`Query: "${prompt}"`, 'ai'),
        line('', 'ai'),
        line('Based on my analysis:', 'ai'),
        line('1. Consider breaking the problem into smaller steps', 'ai'),
        line('2. Use the orchestration pipeline for complex tasks', 'ai'),
        line('3. Check the CMC memory for related prior solutions', 'ai'),
        line('', 'ai'),
        line('Confidence: 0.87 | Sources: 3 memories', 'ai'),
      ] };
    }

    case 'theme': {
      const name = args[0]?.toLowerCase();
      const found = themes.find(t => t.name.toLowerCase() === name);
      if (!found) return { lines: [line(`Available themes: ${themes.map(t => t.name).join(', ')}`, 'system')] };
      return { lines: [line(`Theme changed to ${found.name}`, 'system')] };
    }

    case 'tree': {
      const dir = fileSystem[session.cwd] || [];
      const output = [line(session.cwd)];
      dir.forEach((f, i) => {
        const isLast = i === dir.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        output.push(line(prefix + f));
        const subDir = fileSystem[`${session.cwd}/${f}`];
        if (subDir) {
          subDir.slice(0, 3).forEach((sf, j) => {
            const subPrefix = isLast ? '    ' : '│   ';
            output.push(line(subPrefix + (j === Math.min(2, subDir.length - 1) ? '└── ' : '├── ') + sf));
          });
          if (subDir.length > 3) output.push(line((isLast ? '    ' : '│   ') + `└── ... (${subDir.length - 3} more)`));
        }
      });
      return { lines: output };
    }

    case 'find': {
      const pattern = args.find(a => a.startsWith('-name'))
        ? args[args.indexOf('-name') + 1]
        : args[0] || '*';
      return { lines: [
        line('./src/App.tsx'),
        line('./src/main.tsx'),
        line('./src/index.css'),
        line(`(showing files matching "${pattern}" — simulated)`),
      ] };
    }

    case 'df': return { lines: [
      line('Filesystem      Size  Used  Avail  Use%  Mounted on'),
      line('/dev/wasm0      4.0G  1.2G  2.8G   30%  /'),
      line('tmpfs           512M   32M  480M    6%  /tmp'),
      line('lucid-storage   15G   230M  14.8G   2%  /home'),
    ] };

    case 'free': return { lines: [
      line('              total     used     free     shared   buff/cache   available'),
      line(`Mem:          4096     ${Math.floor(Math.random() * 2000 + 500)}     ${Math.floor(Math.random() * 1000 + 500)}       32        ${Math.floor(Math.random() * 800 + 200)}        ${Math.floor(Math.random() * 1500 + 500)}`),
      line(`Swap:         2048       0      2048`),
    ] };

    case 'which':
      if (!args[0]) return { lines: [line('which: missing argument', 'error')] };
      return { lines: [line(`/usr/local/bin/${args[0]}`)] };

    case 'man':
      return { lines: [line(`No manual entry for ${args[0] || '(nothing)'}. Try 'help'.`, 'system')] };

    case 'seq': {
      const n = parseInt(args[0]) || 10;
      return { lines: Array.from({ length: Math.min(n, 100) }, (_, i) => line(String(i + 1))) };
    }

    case 'yes': return { lines: Array.from({ length: 5 }, () => line(args[0] || 'y')).concat([line('... (stopped after 5 iterations)', 'system')]) };

    default:
      return { lines: [line(`${command}: command not found. Type 'help' for available commands.`, 'error')] };
  }
};

/* ─────────── Pipe executor ─────────── */
const executePipeline = (cmdLine: string, session: TerminalSession): { lines: TerminalLine[]; env?: Record<string, string>; cwd?: string; clear?: boolean } => {
  const pipeSegments = cmdLine.split(/\s*\|\s*/);
  let pipeData: string | undefined;
  let finalLines: TerminalLine[] = [];
  let env = session.env;
  let cwd = session.cwd;
  let shouldClear = false;

  for (let i = 0; i < pipeSegments.length; i++) {
    const seg = pipeSegments[i].trim();
    if (!seg) continue;

    const result = executeAtomicCommand(seg, { ...session, env, cwd }, pipeData);

    if (result.clear) { shouldClear = true; finalLines = []; pipeData = undefined; continue; }
    if (result.env) env = result.env;
    if (result.cwd) cwd = result.cwd;

    // If there's a next pipe, pass output as string
    if (i < pipeSegments.length - 1) {
      pipeData = result.lines.filter(l => l.type === 'output').map(l => l.content).join('\n');
      finalLines = []; // intermediate output is discarded
    } else {
      finalLines = result.lines;
    }
  }

  return { lines: finalLines, env, cwd, clear: shouldClear };
};

/* ─────────── Session factory ─────────── */
const createSession = (name?: string): TerminalSession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  name: name || `Shell ${Math.floor(Math.random() * 100)}`,
  cwd: '~/lucid-project',
  lines: [
    { id: 'w1', type: 'system', content: '╭─────────────────────────────────────────────╮', timestamp: new Date() },
    { id: 'w2', type: 'system', content: '│  LUCID Terminal v2.0 — Browser OS Shell      │', timestamp: new Date() },
    { id: 'w3', type: 'system', content: '│  Type "help" for commands • Pipes supported  │', timestamp: new Date() },
    { id: 'w4', type: 'system', content: '╰─────────────────────────────────────────────╯', timestamp: new Date() },
  ],
  history: [],
  historyIndex: -1,
  env: {
    HOME: '/home/lucid-user', USER: 'lucid-user', SHELL: '/bin/lucid-sh',
    PATH: '/usr/local/bin:/usr/bin:/bin', TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8', NODE_ENV: 'development', EDITOR: 'monaco',
    LUCID_VERSION: '2.0.0',
  },
  aliases: { ll: 'ls -la', gs: 'git status', gp: 'git push', la: 'ls -a', cls: 'clear' },
});

/* ─────────── Autocomplete ─────────── */
const allCommands = [
  'help', 'echo', 'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'grep', 'wc', 'sort', 'uniq',
  'mkdir', 'touch', 'rm', 'clear', 'date', 'whoami', 'env', 'export', 'alias', 'history',
  'curl', 'node', 'python', 'ai', 'git', 'npm', 'bun', 'top', 'htop', 'ps',
  'neofetch', 'uname', 'hostname', 'uptime', 'tree', 'find', 'df', 'free', 'which',
  'man', 'seq', 'yes', 'theme',
];

/* ─────────── Component ─────────── */
export function TerminalPage() {
  const [sessions, setSessions] = useState<TerminalSession[]>([createSession('Main')]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [input, setInput] = useState('');
  const [splitView, setSplitView] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<TerminalTheme>(themes[0]);
  const [autocompleteHints, setAutocompleteHints] = useState<string[]>([]);
  const [selectedHint, setSelectedHint] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeSession?.lines.length]);

  useEffect(() => { inputRef.current?.focus(); }, [activeSessionId]);

  // Autocomplete on input change
  useEffect(() => {
    const parts = input.split(/\s+/);
    if (parts.length === 1 && input.length > 0) {
      const matches = allCommands.filter(c => c.startsWith(input) && c !== input);
      setAutocompleteHints(matches.slice(0, 6));
      setSelectedHint(0);
    } else if (parts.length === 2 && parts[0] === 'cd') {
      const dir = fileSystem[activeSession.cwd] || [];
      const dirs = dir.filter(f => !f.includes('.'));
      const matches = dirs.filter(d => d.startsWith(parts[1]));
      setAutocompleteHints(matches.slice(0, 6));
      setSelectedHint(0);
    } else if (parts.length === 2 && ['cat', 'head', 'tail'].includes(parts[0])) {
      const dir = fileSystem[activeSession.cwd] || [];
      const files = dir.filter(f => f.includes('.'));
      const matches = files.filter(f => f.startsWith(parts[1]));
      setAutocompleteHints(matches.slice(0, 6));
      setSelectedHint(0);
    } else if (parts.length === 2 && parts[0] === 'theme') {
      const matches = themes.map(t => t.name.toLowerCase()).filter(n => n.startsWith(parts[1].toLowerCase()));
      setAutocompleteHints(matches.slice(0, 6));
      setSelectedHint(0);
    } else {
      setAutocompleteHints([]);
    }
  }, [input, activeSession?.cwd]);

  const executeCommand = useCallback((cmd: string) => {
    if (!cmd.trim()) return;
    setAutocompleteHints([]);

    // Handle theme change
    if (cmd.trim().startsWith('theme ')) {
      const name = cmd.trim().slice(6).toLowerCase();
      const found = themes.find(t => t.name.toLowerCase() === name);
      if (found) setCurrentTheme(found);
    }

    // Handle alias creation
    let newAliases = { ...activeSession.aliases };
    if (cmd.trim().startsWith('alias ')) {
      const match = cmd.trim().slice(6).match(/^(\w+)=["']?(.+?)["']?$/);
      if (match) newAliases[match[1]] = match[2];
    }

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;

      const inputLine: TerminalLine = {
        id: `in-${Date.now()}`, type: 'input', content: cmd, timestamp: new Date(),
      };

      const result = executePipeline(cmd, s);

      if (result.clear) {
        return { ...s, lines: [], history: [...s.history, cmd], historyIndex: -1, env: result.env || s.env, cwd: result.cwd || s.cwd, aliases: newAliases };
      }

      return {
        ...s,
        lines: [...s.lines, inputLine, ...result.lines],
        history: [...s.history, cmd],
        historyIndex: -1,
        env: result.env || s.env,
        cwd: result.cwd || s.cwd,
        aliases: newAliases,
      };
    }));
    setInput('');
  }, [activeSessionId, activeSession]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (autocompleteHints.length > 0) {
        setSelectedHint(h => Math.max(0, h - 1));
      } else {
        setSessions(prev => prev.map(s => {
          if (s.id !== activeSessionId) return s;
          const newIdx = s.historyIndex < s.history.length - 1 ? s.historyIndex + 1 : s.historyIndex;
          setInput(s.history[s.history.length - 1 - newIdx] || '');
          return { ...s, historyIndex: newIdx };
        }));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (autocompleteHints.length > 0) {
        setSelectedHint(h => Math.min(autocompleteHints.length - 1, h + 1));
      } else {
        setSessions(prev => prev.map(s => {
          if (s.id !== activeSessionId) return s;
          const newIdx = s.historyIndex > 0 ? s.historyIndex - 1 : -1;
          setInput(newIdx >= 0 ? (s.history[s.history.length - 1 - newIdx] || '') : '');
          return { ...s, historyIndex: newIdx };
        }));
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (autocompleteHints.length > 0) {
        const parts = input.split(/\s+/);
        if (parts.length <= 1) {
          setInput(autocompleteHints[selectedHint] + ' ');
        } else {
          parts[parts.length - 1] = autocompleteHints[selectedHint];
          setInput(parts.join(' ') + (parts[0] === 'cd' ? '/' : ' '));
        }
        setAutocompleteHints([]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      executeCommand('clear');
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setInput('');
      setAutocompleteHints([]);
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId
          ? { ...s, lines: [...s.lines, line(`^C`, 'system')] }
          : s
      ));
    }
  }, [input, activeSessionId, executeCommand, autocompleteHints, selectedHint]);

  const addSession = useCallback(() => {
    const s = createSession();
    setSessions(prev => [...prev, s]);
    setActiveSessionId(s.id);
  }, []);

  const closeSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) { const ns = createSession('Main'); setActiveSessionId(ns.id); return [ns]; }
      if (activeSessionId === id) setActiveSessionId(filtered[0].id);
      return filtered;
    });
  }, [activeSessionId]);

  const renderTerminal = (session: TerminalSession, isActive: boolean) => (
    <div
      className="flex-1 flex flex-col font-mono text-sm"
      style={{ backgroundColor: currentTheme.bg }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={isActive ? scrollRef : undefined} className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {session.lines.map(l => (
          <div key={l.id} className="flex">
            {l.type === 'input' && (
              <span className="shrink-0">
                <span className={currentTheme.prompt}>lucid</span>
                <span className="text-muted-foreground">:</span>
                <span className={currentTheme.path}>{session.cwd}</span>
                <span className="text-muted-foreground"> $ </span>
              </span>
            )}
            <span className={cn(
              'whitespace-pre-wrap break-all',
              l.type === 'error' && currentTheme.error,
              l.type === 'system' && currentTheme.system,
              l.type === 'ai' && currentTheme.ai,
              l.type === 'output' && currentTheme.text,
              l.type === 'input' && currentTheme.text,
            )}>
              {l.content}
            </span>
          </div>
        ))}
      </div>

      {/* Autocomplete popup */}
      {isActive && autocompleteHints.length > 0 && (
        <div className="mx-3 mb-1 bg-card/90 backdrop-blur border border-border/30 rounded-md overflow-hidden shadow-lg">
          {autocompleteHints.map((hint, i) => (
            <button
              key={hint}
              className={cn(
                'w-full text-left px-3 py-1 text-xs font-mono transition-colors',
                i === selectedHint ? 'bg-primary/20 text-primary' : 'text-foreground/70 hover:bg-white/5'
              )}
              onClick={() => {
                const parts = input.split(/\s+/);
                if (parts.length <= 1) setInput(hint + ' ');
                else { parts[parts.length - 1] = hint; setInput(parts.join(' ') + ' '); }
                setAutocompleteHints([]);
                inputRef.current?.focus();
              }}
            >
              {hint}
            </button>
          ))}
        </div>
      )}

      {/* Input line */}
      {isActive && (
        <div className="flex items-center px-3 py-2 border-t border-border/10" style={{ backgroundColor: `${currentTheme.bg}ee` }}>
          <span className={cn(currentTheme.prompt, 'shrink-0')}>lucid</span>
          <span className="text-muted-foreground shrink-0">:</span>
          <span className={cn(currentTheme.path, 'shrink-0')}>{session.cwd}</span>
          <span className="text-muted-foreground shrink-0 mr-2"> $ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn('flex-1 bg-transparent outline-none caret-emerald-400', currentTheme.text)}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: currentTheme.bg }}>
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
            <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-border/20">{s.cwd.split('/').pop()}</Badge>
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

        {/* Theme picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <Palette className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border/50">
            {themes.map(t => (
              <DropdownMenuItem key={t.name} onClick={() => setCurrentTheme(t)} className={cn(currentTheme.name === t.name && 'text-primary')}>
                <div className="w-3 h-3 rounded-full mr-2 border border-border/30" style={{ backgroundColor: t.bg }} />
                {t.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setSplitView(v => !v)} className={cn('w-7 h-7', splitView && 'text-primary')}>
              <Split className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Split View</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => executeCommand('clear')} className="w-7 h-7">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Clear</TooltipContent>
        </Tooltip>
      </div>

      {/* Terminal content */}
      <div className={cn('flex-1 flex', splitView ? 'flex-row' : 'flex-col')}>
        {renderTerminal(activeSession, true)}
        {splitView && sessions.length > 1 && (
          <>
            <div className="w-px bg-border/30" />
            {renderTerminal(sessions.find(s => s.id !== activeSessionId) || sessions[0], false)}
          </>
        )}
      </div>
    </div>
  );
}
