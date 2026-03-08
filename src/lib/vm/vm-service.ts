/**
 * Unified VM Service — Three-layer execution engine
 * Layer 1: In-browser (instant JS/TS/JSON execution)
 * Layer 2: Edge Function (server-side Deno sandbox)
 * Layer 3: External Cloud VM (E2B/Modal — future)
 *
 * Shared virtual filesystem accessible by all apps.
 */

export type VMBackend = 'browser' | 'edge' | 'cloud';
export type ProcessState = 'running' | 'completed' | 'error' | 'killed';

export interface VMFile {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  size: number;
  created: Date;
  modified: Date;
  permissions: string;
}

export interface VMProcess {
  pid: number;
  name: string;
  command: string;
  state: ProcessState;
  startTime: Date;
  endTime?: Date;
  output: string;
  exitCode?: number;
  backend: VMBackend;
}

export interface VMExecResult {
  output: string;
  exitCode: number;
  duration: number;
  backend: VMBackend;
  pid: number;
}

export interface VMStats {
  totalProcesses: number;
  activeProcesses: number;
  totalFiles: number;
  memoryUsed: number;
  uptime: number;
}

// ─── Virtual Filesystem ───
class VirtualFileSystem {
  private files: Map<string, VMFile> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.seed();
  }

  private seed() {
    const dirs = [
      '/', '/home', '/home/lucid', '/home/lucid/projects', '/home/lucid/projects/lucid-os',
      '/home/lucid/projects/lucid-os/src', '/home/lucid/projects/lucid-os/docs',
      '/tmp', '/var', '/var/log', '/etc',
    ];
    dirs.forEach(d => this.mkdirSync(d));

    this.writeFileSync('/home/lucid/.bashrc', '# LUCID Shell\nexport PS1="lucid@os:$PWD$ "\nalias ll="ls -la"\nalias gs="git status"');
    this.writeFileSync('/home/lucid/projects/lucid-os/package.json', JSON.stringify({ name: 'lucid-browser-os', version: '2.0.0', type: 'module' }, null, 2));
    this.writeFileSync('/home/lucid/projects/lucid-os/README.md', '# LUCID Browser OS\n\nA comprehensive AI-powered browser operating system.\n\n## Features\n- 24 pro-grade applications\n- Multi-agent orchestration\n- Unified VM execution engine\n- CMC memory architecture');
    this.writeFileSync('/home/lucid/projects/lucid-os/src/main.ts', 'import { createApp } from "./app";\n\nconst app = createApp();\napp.mount("#root");\nconsole.log("LUCID OS initialized");');
    this.writeFileSync('/etc/hostname', 'lucid-browser-os');
    this.writeFileSync('/etc/os-release', 'NAME="LUCID BrowserOS"\nVERSION="2.0.0"\nID=lucid\nPRETTY_NAME="LUCID Browser OS 2.0"');
    this.writeFileSync('/var/log/system.log', `[${new Date().toISOString()}] System booted\n[${new Date().toISOString()}] VM service initialized\n[${new Date().toISOString()}] All 24 apps loaded`);
  }

  mkdirSync(path: string) {
    if (this.files.has(path)) return;
    this.files.set(path, {
      name: path.split('/').pop() || '/',
      path, content: '', type: 'directory', size: 4096,
      created: new Date(), modified: new Date(), permissions: 'drwxr-xr-x',
    });
    this.notify();
  }

  writeFileSync(path: string, content: string) {
    // Ensure parent dirs
    const parts = path.split('/');
    for (let i = 1; i < parts.length - 1; i++) {
      const dir = parts.slice(0, i + 1).join('/') || '/';
      if (!this.files.has(dir)) this.mkdirSync(dir);
    }
    this.files.set(path, {
      name: parts.pop() || '',
      path, content, type: 'file', size: new Blob([content]).size,
      created: this.files.get(path)?.created || new Date(), modified: new Date(),
      permissions: '-rw-r--r--',
    });
    this.notify();
  }

  readFileSync(path: string): string | null {
    const f = this.files.get(path);
    return f?.type === 'file' ? f.content : null;
  }

  readdir(path: string): VMFile[] {
    const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
    const prefix = normalized === '' ? '/' : normalized;
    const result: VMFile[] = [];
    for (const [p, f] of this.files) {
      if (p === prefix) continue;
      const parent = p.substring(0, p.lastIndexOf('/')) || '/';
      if (parent === prefix) result.push(f);
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  exists(path: string): boolean { return this.files.has(path); }
  isDirectory(path: string): boolean { return this.files.get(path)?.type === 'directory' || false; }

  stat(path: string): VMFile | null { return this.files.get(path) || null; }

  rm(path: string, recursive = false) {
    if (recursive) {
      const prefix = path.endsWith('/') ? path : path + '/';
      for (const key of [...this.files.keys()]) {
        if (key === path || key.startsWith(prefix)) this.files.delete(key);
      }
    } else {
      this.files.delete(path);
    }
    this.notify();
  }

  find(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    return [...this.files.keys()].filter(k => regex.test(k));
  }

  du(): number {
    let total = 0;
    for (const f of this.files.values()) total += f.size;
    return total;
  }

  tree(path: string, depth = 3, prefix = ''): string[] {
    if (depth <= 0) return [];
    const entries = this.readdir(path);
    const lines: string[] = [];
    entries.forEach((entry, i) => {
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';
      lines.push(prefix + connector + entry.name + (entry.type === 'directory' ? '/' : ''));
      if (entry.type === 'directory') {
        lines.push(...this.tree(entry.path, depth - 1, prefix + childPrefix));
      }
    });
    return lines;
  }

  onChange(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private notify() { this.listeners.forEach(fn => fn()); }
}

// ─── Process Manager ───
class ProcessManager {
  private processes: Map<number, VMProcess> = new Map();
  private nextPid = 1000;
  private listeners: Set<() => void> = new Set();

  spawn(command: string, backend: VMBackend): VMProcess {
    const pid = this.nextPid++;
    const proc: VMProcess = {
      pid, name: command.split(/\s+/)[0], command, state: 'running',
      startTime: new Date(), output: '', backend,
    };
    this.processes.set(pid, proc);
    this.notify();
    return proc;
  }

  complete(pid: number, output: string, exitCode: number) {
    const proc = this.processes.get(pid);
    if (proc) {
      proc.state = exitCode === 0 ? 'completed' : 'error';
      proc.output = output;
      proc.exitCode = exitCode;
      proc.endTime = new Date();
      this.notify();
    }
  }

  kill(pid: number) {
    const proc = this.processes.get(pid);
    if (proc && proc.state === 'running') {
      proc.state = 'killed';
      proc.exitCode = 137;
      proc.endTime = new Date();
      this.notify();
    }
  }

  list(): VMProcess[] { return [...this.processes.values()]; }
  active(): VMProcess[] { return this.list().filter(p => p.state === 'running'); }
  get(pid: number): VMProcess | undefined { return this.processes.get(pid); }

  onChange(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private notify() { this.listeners.forEach(fn => fn()); }
}

// ─── Browser Executor ───
function executeBrowser(code: string, language: string, fs: VirtualFileSystem): { output: string; exitCode: number } {
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'js':
    case 'ts': {
      try {
        const logs: string[] = [];
        const mockConsole = {
          log: (...a: any[]) => logs.push(a.map(v => typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)).join(' ')),
          error: (...a: any[]) => logs.push('ERROR: ' + a.map(String).join(' ')),
          warn: (...a: any[]) => logs.push('WARN: ' + a.map(String).join(' ')),
          info: (...a: any[]) => logs.push('INFO: ' + a.map(String).join(' ')),
          table: (data: any) => logs.push(JSON.stringify(data, null, 2)),
          dir: (obj: any) => logs.push(JSON.stringify(obj, null, 2)),
          time: () => {}, timeEnd: () => {},
          assert: (cond: boolean, ...a: any[]) => { if (!cond) logs.push('Assertion failed: ' + a.join(' ')); },
          clear: () => {},
          group: (...a: any[]) => logs.push('▸ ' + a.join(' ')),
          groupEnd: () => {},
        };

        // Provide Math, Date, JSON, Array, Object, String, Number, etc.
        const mockFS = {
          readFile: (path: string) => fs.readFileSync(path),
          writeFile: (path: string, content: string) => fs.writeFileSync(path, content),
          readdir: (path: string) => fs.readdir(path).map(f => f.name),
          exists: (path: string) => fs.exists(path),
          mkdir: (path: string) => fs.mkdirSync(path),
          rm: (path: string) => fs.rm(path),
        };

        const fn = new Function('console', 'fs', 'fetch', 'setTimeout', 'setInterval', code);
        const result = fn(mockConsole, mockFS, undefined, undefined, undefined);
        if (result !== undefined && logs.length === 0) {
          logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
        }
        return { output: logs.join('\n') || '(no output)', exitCode: 0 };
      } catch (err) {
        return { output: `Error: ${err instanceof Error ? err.message : String(err)}`, exitCode: 1 };
      }
    }

    case 'json': {
      try {
        const parsed = JSON.parse(code);
        return { output: `✓ Valid JSON\n${JSON.stringify(parsed, null, 2)}`, exitCode: 0 };
      } catch (err) {
        return { output: `✗ Invalid JSON: ${err instanceof Error ? err.message : String(err)}`, exitCode: 1 };
      }
    }

    case 'shell':
    case 'bash':
    case 'sh': {
      // Simple shell script interpreter
      const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      const output: string[] = [];
      for (const l of lines) {
        if (l.startsWith('echo ')) {
          output.push(l.slice(5).replace(/^["']|["']$/g, ''));
        } else if (l.startsWith('cat ')) {
          const content = fs.readFileSync(l.slice(4).trim());
          output.push(content || `cat: file not found`);
        } else {
          output.push(`sh: executing '${l}'`);
        }
      }
      return { output: output.join('\n') || '(no output)', exitCode: 0 };
    }

    case 'python':
    case 'py': {
      // Basic Python interpreter (subset)
      try {
        const lines = code.split('\n');
        const output: string[] = [];
        const vars: Record<string, any> = {};

        for (const raw of lines) {
          const l = raw.trim();
          if (!l || l.startsWith('#')) continue;
          if (l.startsWith('print(')) {
            const expr = l.slice(6, -1);
            // Handle string literals, variables, f-strings basic
            let val = expr;
            if (expr.startsWith('"') || expr.startsWith("'")) {
              val = expr.slice(1, -1);
            } else if (vars[expr] !== undefined) {
              val = String(vars[expr]);
            } else {
              try { val = String(eval(expr)); } catch { val = expr; }
            }
            output.push(val);
          } else if (l.includes('=') && !l.includes('==')) {
            const [name, ...rest] = l.split('=');
            const value = rest.join('=').trim();
            try { vars[name.trim()] = eval(value); } catch { vars[name.trim()] = value.replace(/^["']|["']$/g, ''); }
          }
        }
        return { output: output.join('\n') || '(no output)', exitCode: 0 };
      } catch (err) {
        return { output: `PythonError: ${err instanceof Error ? err.message : String(err)}`, exitCode: 1 };
      }
    }

    default:
      return { output: `Unsupported language: ${language}`, exitCode: 1 };
  }
}

// ─── Singleton VM Instance ───
class VMService {
  readonly fs: VirtualFileSystem;
  readonly proc: ProcessManager;
  private startTime = Date.now();
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.fs = new VirtualFileSystem();
    this.proc = new ProcessManager();
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  }

  /** Execute code with automatic backend selection */
  async exec(code: string, language: string, preferredBackend?: VMBackend): Promise<VMExecResult> {
    const backend = preferredBackend || this.selectBackend(language);
    const process = this.proc.spawn(`${language}: ${code.slice(0, 40)}...`, backend);
    const start = performance.now();

    try {
      let output: string;
      let exitCode: number;

      switch (backend) {
        case 'browser': {
          const result = executeBrowser(code, language, this.fs);
          output = result.output;
          exitCode = result.exitCode;
          break;
        }
        case 'edge': {
          const result = await this.execEdge(code, language);
          output = result.output;
          exitCode = result.exitCode;
          break;
        }
        case 'cloud': {
          output = 'Cloud VM not yet configured. Add E2B_API_KEY to enable.';
          exitCode = 1;
          break;
        }
        default:
          output = 'Unknown backend';
          exitCode = 1;
      }

      const duration = performance.now() - start;
      this.proc.complete(process.pid, output, exitCode);
      return { output, exitCode, duration, backend, pid: process.pid };
    } catch (err) {
      const output = `VM Error: ${err instanceof Error ? err.message : String(err)}`;
      this.proc.complete(process.pid, output, 1);
      return { output, exitCode: 1, duration: performance.now() - start, backend, pid: process.pid };
    }
  }

  /** Run on edge function */
  private async execEdge(code: string, language: string): Promise<{ output: string; exitCode: number }> {
    try {
      const res = await fetch(`${this.supabaseUrl}/functions/v1/code-executor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
        },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      return { output: data.output || data.error || 'No output', exitCode: data.success ? 0 : 1 };
    } catch (err) {
      return { output: `Edge function error: ${err instanceof Error ? err.message : String(err)}`, exitCode: 1 };
    }
  }

  /** Auto-select best backend for language */
  private selectBackend(language: string): VMBackend {
    const browserLangs = ['javascript', 'typescript', 'js', 'ts', 'json', 'shell', 'bash', 'sh', 'python', 'py'];
    if (browserLangs.includes(language.toLowerCase())) return 'browser';
    return 'edge';
  }

  /** Quick eval for inline expressions (used by apps) */
  eval(expression: string): any {
    try {
      return new Function(`return (${expression})`)();
    } catch {
      return undefined;
    }
  }

  /** Get system stats */
  stats(): VMStats {
    return {
      totalProcesses: this.proc.list().length,
      activeProcesses: this.proc.active().length,
      totalFiles: this.fs.find('.*').length,
      memoryUsed: this.fs.du(),
      uptime: Date.now() - this.startTime,
    };
  }
}

// Global singleton
export const vm = new VMService();
