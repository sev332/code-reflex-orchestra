// File Manager — Finder-grade file browser with tree, drag-drop, preview, tabs
import React, { useState, useCallback, useMemo, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderOpen, File, FileText, FileJson, FileCode, FileImage, FileAudio,
  FileVideo, ChevronRight, ChevronDown, Plus, Trash2, Copy, Scissors,
  Download, Upload, Search, List, Star, Clock, HardDrive,
  ArrowLeft, ArrowRight, Home, LayoutGrid, SortAsc, Eye,
  FolderPlus, MoreHorizontal, Folder, X, Columns,
  Check, ArrowUpDown, Tag, Archive, ExternalLink, Pencil,
  Grid3x3, Monitor, Database, FileArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  mimeType?: string;
  modifiedAt: Date;
  createdAt: Date;
  starred: boolean;
  path: string;
  tags?: string[];
  children?: FileItem[];
}

// ─── Utilities ─────────────────────────────
const fileIcons: Record<string, React.ComponentType<any>> = {
  'text/': FileText, 'application/json': FileJson, 'text/typescript': FileCode,
  'text/javascript': FileCode, 'text/css': FileCode, 'text/html': FileCode,
  'image/': FileImage, 'audio/': FileAudio, 'video/': FileVideo,
  'application/pdf': FileText, 'application/zip': FileArchive,
};

const getFileIcon = (mimeType?: string): React.ComponentType<any> => {
  if (!mimeType) return File;
  for (const [key, icon] of Object.entries(fileIcons)) {
    if (mimeType.startsWith(key) || mimeType === key) return icon;
  }
  return File;
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const formatDate = (d: Date): string => {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString();
};

const getExtension = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : '';
};

// ─── Mock File System (richer) ─────────────
const ts = (h: number) => new Date(Date.now() - h * 3600000);

const mockFS: FileItem[] = [
  { id: 'f1', name: 'src', type: 'folder', size: 0, modifiedAt: ts(1), createdAt: ts(720), starred: false, path: '/src', children: [
    { id: 'f1a', name: 'components', type: 'folder', size: 0, modifiedAt: ts(1), createdAt: ts(600), starred: false, path: '/src/components', children: [
      { id: 'f1a1', name: 'App.tsx', type: 'file', size: 4096, mimeType: 'text/typescript', modifiedAt: ts(2), createdAt: ts(500), starred: true, path: '/src/components/App.tsx', tags: ['core'] },
      { id: 'f1a2', name: 'Header.tsx', type: 'file', size: 2048, mimeType: 'text/typescript', modifiedAt: ts(5), createdAt: ts(480), starred: false, path: '/src/components/Header.tsx' },
      { id: 'f1a3', name: 'Sidebar.tsx', type: 'file', size: 3072, mimeType: 'text/typescript', modifiedAt: ts(3), createdAt: ts(460), starred: true, path: '/src/components/Sidebar.tsx', tags: ['layout'] },
      { id: 'f1a4', name: 'Button.tsx', type: 'file', size: 1536, mimeType: 'text/typescript', modifiedAt: ts(8), createdAt: ts(500), starred: false, path: '/src/components/Button.tsx', tags: ['ui'] },
      { id: 'f1a5', name: 'Modal.tsx', type: 'file', size: 2560, mimeType: 'text/typescript', modifiedAt: ts(12), createdAt: ts(400), starred: false, path: '/src/components/Modal.tsx', tags: ['ui'] },
    ]},
    { id: 'f1b', name: 'hooks', type: 'folder', size: 0, modifiedAt: ts(4), createdAt: ts(500), starred: false, path: '/src/hooks', children: [
      { id: 'f1b1', name: 'useAuth.ts', type: 'file', size: 1024, mimeType: 'text/typescript', modifiedAt: ts(24), createdAt: ts(400), starred: false, path: '/src/hooks/useAuth.ts' },
      { id: 'f1b2', name: 'useTheme.ts', type: 'file', size: 768, mimeType: 'text/typescript', modifiedAt: ts(48), createdAt: ts(400), starred: false, path: '/src/hooks/useTheme.ts' },
    ]},
    { id: 'f1c', name: 'lib', type: 'folder', size: 0, modifiedAt: ts(2), createdAt: ts(500), starred: false, path: '/src/lib', children: [
      { id: 'f1c1', name: 'utils.ts', type: 'file', size: 2048, mimeType: 'text/typescript', modifiedAt: ts(6), createdAt: ts(500), starred: false, path: '/src/lib/utils.ts', tags: ['core'] },
      { id: 'f1c2', name: 'api.ts', type: 'file', size: 4096, mimeType: 'text/typescript', modifiedAt: ts(3), createdAt: ts(480), starred: true, path: '/src/lib/api.ts', tags: ['core'] },
    ]},
    { id: 'f1d', name: 'assets', type: 'folder', size: 0, modifiedAt: ts(10), createdAt: ts(600), starred: false, path: '/src/assets', children: [
      { id: 'f1d1', name: 'logo.svg', type: 'file', size: 4096, mimeType: 'image/svg+xml', modifiedAt: ts(168), createdAt: ts(600), starred: false, path: '/src/assets/logo.svg' },
      { id: 'f1d2', name: 'background.png', type: 'file', size: 245760, mimeType: 'image/png', modifiedAt: ts(120), createdAt: ts(500), starred: false, path: '/src/assets/background.png' },
      { id: 'f1d3', name: 'hero.jpg', type: 'file', size: 512000, mimeType: 'image/jpeg', modifiedAt: ts(72), createdAt: ts(300), starred: false, path: '/src/assets/hero.jpg' },
    ]},
    { id: 'f1e', name: 'main.tsx', type: 'file', size: 512, mimeType: 'text/typescript', modifiedAt: ts(1), createdAt: ts(720), starred: false, path: '/src/main.tsx', tags: ['core'] },
    { id: 'f1f', name: 'index.css', type: 'file', size: 8192, mimeType: 'text/css', modifiedAt: ts(2), createdAt: ts(720), starred: false, path: '/src/index.css' },
  ]},
  { id: 'f2', name: 'public', type: 'folder', size: 0, modifiedAt: ts(24), createdAt: ts(720), starred: false, path: '/public', children: [
    { id: 'f2a', name: 'favicon.ico', type: 'file', size: 1024, mimeType: 'image/x-icon', modifiedAt: ts(720), createdAt: ts(720), starred: false, path: '/public/favicon.ico' },
    { id: 'f2b', name: 'robots.txt', type: 'file', size: 128, mimeType: 'text/plain', modifiedAt: ts(720), createdAt: ts(720), starred: false, path: '/public/robots.txt' },
    { id: 'f2c', name: 'manifest.json', type: 'file', size: 256, mimeType: 'application/json', modifiedAt: ts(720), createdAt: ts(720), starred: false, path: '/public/manifest.json' },
  ]},
  { id: 'f3', name: 'docs', type: 'folder', size: 0, modifiedAt: ts(6), createdAt: ts(600), starred: true, path: '/docs', children: [
    { id: 'f3a', name: 'ARCHITECTURE.md', type: 'file', size: 16384, mimeType: 'text/markdown', modifiedAt: ts(6), createdAt: ts(500), starred: true, path: '/docs/ARCHITECTURE.md', tags: ['docs'] },
    { id: 'f3b', name: 'API.md', type: 'file', size: 8192, mimeType: 'text/markdown', modifiedAt: ts(12), createdAt: ts(400), starred: false, path: '/docs/API.md', tags: ['docs'] },
    { id: 'f3c', name: 'CHANGELOG.md', type: 'file', size: 4096, mimeType: 'text/markdown', modifiedAt: ts(3), createdAt: ts(300), starred: false, path: '/docs/CHANGELOG.md' },
  ]},
  { id: 'f4', name: 'package.json', type: 'file', size: 2048, mimeType: 'application/json', modifiedAt: ts(1), createdAt: ts(720), starred: true, path: '/package.json', tags: ['config'] },
  { id: 'f5', name: 'tsconfig.json', type: 'file', size: 512, mimeType: 'application/json', modifiedAt: ts(168), createdAt: ts(720), starred: false, path: '/tsconfig.json', tags: ['config'] },
  { id: 'f6', name: 'vite.config.ts', type: 'file', size: 384, mimeType: 'text/typescript', modifiedAt: ts(48), createdAt: ts(720), starred: false, path: '/vite.config.ts', tags: ['config'] },
  { id: 'f7', name: 'README.md', type: 'file', size: 4096, mimeType: 'text/markdown', modifiedAt: ts(24), createdAt: ts(720), starred: false, path: '/README.md' },
  { id: 'f8', name: '.env', type: 'file', size: 128, mimeType: 'text/plain', modifiedAt: ts(48), createdAt: ts(720), starred: false, path: '/.env', tags: ['config'] },
  { id: 'f9', name: 'tailwind.config.ts', type: 'file', size: 1024, mimeType: 'text/typescript', modifiedAt: ts(24), createdAt: ts(720), starred: false, path: '/tailwind.config.ts', tags: ['config'] },
];

const countItems = (items: FileItem[]): number => {
  let c = 0;
  items.forEach(f => { c++; if (f.children) c += countItems(f.children); });
  return c;
};

const totalItems = countItems(mockFS);

type ViewMode = 'list' | 'grid' | 'columns';
type SortBy = 'name' | 'date' | 'size' | 'type';
type SidebarSection = 'favorites' | 'tags' | 'locations';

// ─── Tree Node ─────────────────────────────
const TreeNode: React.FC<{
  item: FileItem;
  depth: number;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  onNavigate: (path: string) => void;
  activePath: string;
}> = ({ item, depth, expanded, toggleExpand, onNavigate, activePath }) => {
  if (item.type !== 'folder') return null;
  const isExpanded = expanded.has(item.id);
  const isActive = activePath === item.path;
  const folders = item.children?.filter(c => c.type === 'folder') || [];

  return (
    <div>
      <button
        onClick={() => { toggleExpand(item.id); onNavigate(item.path); }}
        className={cn(
          'w-full flex items-center gap-1 py-1 pr-2 text-xs transition-colors rounded-md',
          isActive ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-muted/30 hover:text-foreground'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {folders.length > 0 ? (
          isExpanded ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
        ) : <span className="w-3 shrink-0" />}
        <Folder className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary' : 'text-amber-400')} />
        <span className="truncate">{item.name}</span>
        {item.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0 ml-auto" />}
      </button>
      {isExpanded && folders.map(child => (
        <TreeNode key={child.id} item={child} depth={depth + 1} expanded={expanded} toggleExpand={toggleExpand} onNavigate={onNavigate} activePath={activePath} />
      ))}
    </div>
  );
};

// ─── Preview Content ───────────────────────
const PreviewContent: React.FC<{ file: FileItem }> = ({ file }) => {
  const ext = getExtension(file.name);
  const isImage = file.mimeType?.startsWith('image/');
  const isCode = ['tsx', 'ts', 'js', 'jsx', 'css', 'html', 'json'].includes(ext.toLowerCase());

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/5">
        {isImage ? (
          <div className="w-full aspect-square bg-muted/10 rounded-lg border border-border/20 flex items-center justify-center">
            <FileImage className="w-16 h-16 text-primary/30" />
            <span className="text-xs text-muted-foreground absolute mt-20">Image Preview</span>
          </div>
        ) : isCode ? (
          <div className="w-full bg-muted/10 rounded-lg border border-border/20 p-4 font-mono text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className="flex gap-2"><span className="text-primary/50">1</span><span className="text-blue-400">import</span> {'{ useState }'} <span className="text-blue-400">from</span> <span className="text-emerald-400">'react'</span>;</div>
              <div className="flex gap-2"><span className="text-primary/50">2</span></div>
              <div className="flex gap-2"><span className="text-primary/50">3</span><span className="text-blue-400">export default function</span> <span className="text-amber-400">{file.name.replace(/\.\w+$/, '')}</span>() {'{'}</div>
              <div className="flex gap-2"><span className="text-primary/50">4</span>  <span className="text-blue-400">return</span> {'<div>...</div>'}</div>
              <div className="flex gap-2"><span className="text-primary/50">5</span>{'}'}</div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {(() => { const Icon = getFileIcon(file.mimeType); return <Icon className="w-20 h-20 text-muted-foreground/20 mx-auto" />; })()}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 border-t border-border/20 space-y-3">
        <h3 className="text-sm font-semibold truncate">{file.name}</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Kind', file.mimeType?.split('/')[1]?.toUpperCase() || ext || 'File'],
            ['Size', formatSize(file.size)],
            ['Modified', formatDate(file.modifiedAt)],
            ['Created', formatDate(file.createdAt)],
          ].map(([label, val]) => (
            <div key={label}>
              <span className="text-muted-foreground">{label}</span>
              <p className="font-medium">{val}</p>
            </div>
          ))}
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Path</span>
          <p className="text-xs font-mono bg-muted/20 rounded px-2 py-1 mt-0.5 break-all">{file.path}</p>
        </div>
        {file.tags && file.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {file.tags.map(t => (
              <Badge key={t} variant="outline" className="text-[9px] h-4 px-1.5">{t}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────
export function FileManagerPage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['f1']));
  const [history, setHistory] = useState<string[]>(['/']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [clipboard, setClipboard] = useState<{ files: FileItem[]; action: 'copy' | 'cut' } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarSection>('favorites');

  const toggleExpand = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedFiles(new Set());
    setPreviewFile(null);
    setHistory(prev => [...prev.slice(0, historyIdx + 1), path]);
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const goBack = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(i => i - 1);
      setCurrentPath(history[historyIdx - 1]);
      setSelectedFiles(new Set());
      setPreviewFile(null);
    }
  }, [historyIdx, history]);

  const goForward = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(i => i + 1);
      setCurrentPath(history[historyIdx + 1]);
      setSelectedFiles(new Set());
      setPreviewFile(null);
    }
  }, [historyIdx, history]);

  const getCurrentFiles = useCallback((path: string): FileItem[] => {
    if (path === '/') return mockFS;
    const parts = path.split('/').filter(Boolean);
    let current: FileItem[] = mockFS;
    for (const part of parts) {
      const folder = current.find(f => f.name === part && f.type === 'folder');
      if (folder?.children) current = folder.children;
      else return [];
    }
    return current;
  }, []);

  const currentFiles = useMemo(() => {
    let files = getCurrentFiles(currentPath);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchAll = (items: FileItem[]): FileItem[] => {
        let results: FileItem[] = [];
        items.forEach(f => {
          if (f.name.toLowerCase().includes(q)) results.push(f);
          if (f.children) results = [...results, ...searchAll(f.children)];
        });
        return results;
      };
      files = searchAll(files);
    }
    return [...files].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'date': cmp = b.modifiedAt.getTime() - a.modifiedAt.getTime(); break;
        case 'size': cmp = b.size - a.size; break;
        case 'type': cmp = (a.mimeType || '').localeCompare(b.mimeType || ''); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [currentPath, searchQuery, sortBy, sortAsc, getCurrentFiles]);

  const breadcrumbs = currentPath.split('/').filter(Boolean);
  const totalSize = currentFiles.reduce((a, f) => a + f.size, 0);

  const handleSort = (s: SortBy) => {
    if (sortBy === s) setSortAsc(!sortAsc);
    else { setSortBy(s); setSortAsc(true); }
  };

  const handleFileClick = useCallback((file: FileItem, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.has(file.id) ? next.delete(file.id) : next.add(file.id);
        return next;
      });
    } else if (e.shiftKey && selectedFiles.size > 0) {
      // Range select
      const ids = currentFiles.map(f => f.id);
      const lastSelected = [...selectedFiles].pop()!;
      const from = ids.indexOf(lastSelected);
      const to = ids.indexOf(file.id);
      const [start, end] = from < to ? [from, to] : [to, from];
      setSelectedFiles(new Set(ids.slice(start, end + 1)));
    } else {
      setSelectedFiles(new Set([file.id]));
    }
    if (file.type === 'file') setPreviewFile(file);
    else setPreviewFile(null);
  }, [currentFiles, selectedFiles]);

  const handleDoubleClick = useCallback((file: FileItem) => {
    if (file.type === 'folder') navigateTo(file.path);
  }, [navigateTo]);

  // Drag & drop
  const handleDragStart = useCallback((e: DragEvent, file: FileItem) => {
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverFolder(null), []);

  const handleDrop = useCallback((e: DragEvent, _targetFolder: FileItem) => {
    e.preventDefault();
    setDragOverFolder(null);
    // In production: move file to target folder
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    const collect = (items: FileItem[]) => items.forEach(f => { f.tags?.forEach(t => tags.add(t)); if (f.children) collect(f.children); });
    collect(mockFS);
    return [...tags].sort();
  }, []);

  const starredFiles = useMemo(() => {
    const starred: FileItem[] = [];
    const collect = (items: FileItem[]) => items.forEach(f => { if (f.starred) starred.push(f); if (f.children) collect(f.children); });
    collect(mockFS);
    return starred;
  }, []);

  const SortHeader: React.FC<{ label: string; field: SortBy; className?: string }> = ({ label, field, className: cls }) => (
    <th
      className={cn('px-3 py-1.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none', cls)}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && <ArrowUpDown className={cn('w-3 h-3', !sortAsc && 'rotate-180')} />}
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Toolbar ─── */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-2 gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={goBack} className="w-7 h-7" disabled={historyIdx <= 0}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={goForward} className="w-7 h-7" disabled={historyIdx >= history.length - 1}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigateTo('/')} className="w-7 h-7"><Home className="w-4 h-4" /></Button>

        {/* Breadcrumb bar */}
        <div className="flex items-center gap-0.5 flex-1 min-w-0 bg-muted/20 rounded-md px-2 py-1 mx-2">
          <button onClick={() => navigateTo('/')} className="text-xs text-muted-foreground hover:text-foreground shrink-0 font-medium">/</button>
          {breadcrumbs.map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <button onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/'))} className="text-xs hover:text-primary truncate font-medium">{part}</button>
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search files..." className="h-7 text-xs pl-8 bg-muted/30 border-border/30" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground" /></button>}
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-1">
          {([
            { mode: 'list' as const, icon: List },
            { mode: 'grid' as const, icon: LayoutGrid },
            { mode: 'columns' as const, icon: Columns },
          ]).map(({ mode, icon: Icon }) => (
            <Button key={mode} variant="ghost" size="icon" onClick={() => setViewMode(mode)} className={cn('w-7 h-7', viewMode === mode && 'text-primary bg-primary/10')}>
              <Icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-1">
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(!showPreview)} className={cn('w-7 h-7', showPreview && 'text-primary bg-primary/10')}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><FolderPlus className="w-3.5 h-3.5" /> New</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Upload className="w-3.5 h-3.5" /> Upload</Button>
        </div>

        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-0.5 border-l border-border/30 pl-2 ml-1">
            <Button variant="ghost" size="icon" onClick={() => setClipboard({ files: currentFiles.filter(f => selectedFiles.has(f.id)), action: 'copy' })} className="w-7 h-7"><Copy className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setClipboard({ files: currentFiles.filter(f => selectedFiles.has(f.id)), action: 'cut' })} className="w-7 h-7"><Scissors className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Sidebar (Tree + Favorites) ─── */}
        <div className="w-52 bg-background/50 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          {/* Quick links */}
          <div className="px-2 py-2 border-b border-border/20 space-y-0.5">
            {[
              { icon: Clock, label: 'Recents', color: 'text-blue-400' },
              { icon: Star, label: 'Favorites', color: 'text-amber-400' },
              { icon: Download, label: 'Downloads', color: 'text-emerald-400' },
              { icon: Archive, label: 'Archive', color: 'text-purple-400' },
            ].map(({ icon: Icon, label, color }) => (
              <button key={label} className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs text-foreground/70 hover:bg-muted/30 hover:text-foreground transition-colors">
                <Icon className={cn('w-3.5 h-3.5', color)} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Favorites */}
          {starredFiles.length > 0 && (
            <div className="px-2 py-2 border-b border-border/20">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Starred</p>
              {starredFiles.map(f => {
                const Icon = f.type === 'folder' ? Folder : getFileIcon(f.mimeType);
                return (
                  <button
                    key={f.id}
                    onClick={() => f.type === 'folder' ? navigateTo(f.path) : setPreviewFile(f)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs text-foreground/70 hover:bg-muted/30 hover:text-foreground transition-colors"
                  >
                    <Icon className={cn('w-3.5 h-3.5 shrink-0', f.type === 'folder' ? 'text-amber-400' : 'text-muted-foreground')} />
                    <span className="truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* File tree */}
          <div className="flex-1 overflow-hidden">
            <div className="px-2 py-1.5">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Explorer</p>
            </div>
            <ScrollArea className="h-[calc(100%-28px)]">
              <div className="px-1 pb-4">
                {mockFS.filter(f => f.type === 'folder').map(item => (
                  <TreeNode key={item.id} item={item} depth={0} expanded={expandedFolders} toggleExpand={toggleExpand} onNavigate={navigateTo} activePath={currentPath} />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Storage */}
          <div className="px-3 py-2 border-t border-border/20">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              <span>2.4 GB / 10 GB</span>
            </div>
            <div className="h-1 bg-muted/30 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: '24%' }} />
            </div>
          </div>
        </div>

        {/* ─── File Area ─── */}
        <div className="flex-1 overflow-auto">
          {searchQuery && (
            <div className="px-3 py-1.5 bg-muted/10 border-b border-border/20 flex items-center gap-2">
              <Search className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Results for "{searchQuery}" — {currentFiles.length} items</span>
            </div>
          )}

          {viewMode === 'list' ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <tr className="border-b border-border/30">
                  <SortHeader label="Name" field="name" />
                  <SortHeader label="Modified" field="date" className="w-24" />
                  <SortHeader label="Size" field="size" className="w-20 text-right" />
                  <SortHeader label="Kind" field="type" className="w-20" />
                </tr>
              </thead>
              <tbody>
                {currentFiles.map(file => {
                  const Icon = file.type === 'folder' ? Folder : getFileIcon(file.mimeType);
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <tr
                      key={file.id}
                      onClick={e => handleFileClick(file, e)}
                      onDoubleClick={() => handleDoubleClick(file)}
                      draggable
                      onDragStart={e => handleDragStart(e, file)}
                      onDragOver={file.type === 'folder' ? e => handleDragOver(e, file.id) : undefined}
                      onDragLeave={file.type === 'folder' ? handleDragLeave : undefined}
                      onDrop={file.type === 'folder' ? e => handleDrop(e, file) : undefined}
                      className={cn('border-b border-border/5 cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/15',
                        dragOverFolder === file.id && 'bg-primary/20 ring-1 ring-primary/30'
                      )}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-4 h-4 shrink-0', file.type === 'folder' ? 'text-amber-400' : 'text-muted-foreground')} />
                          <span className="truncate">{file.name}</span>
                          {file.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex gap-0.5 ml-1">
                              {file.tags.slice(0, 2).map(t => (
                                <span key={t} className="text-[8px] px-1 py-0 rounded bg-muted/30 text-muted-foreground">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{formatDate(file.modifiedAt)}</td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{file.type === 'folder' ? `${file.children?.length || 0} items` : formatSize(file.size)}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{file.type === 'folder' ? 'Folder' : getExtension(file.name) || 'File'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : viewMode === 'grid' ? (
            <div className="p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {currentFiles.map(file => {
                const Icon = file.type === 'folder' ? Folder : getFileIcon(file.mimeType);
                const isSelected = selectedFiles.has(file.id);
                return (
                  <button
                    key={file.id}
                    onClick={e => handleFileClick(file, e)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    draggable
                    onDragStart={e => handleDragStart(e, file)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all relative group',
                      isSelected ? 'bg-primary/15 ring-1 ring-primary/30' : 'hover:bg-muted/20'
                    )}
                  >
                    <Icon className={cn('w-10 h-10', file.type === 'folder' ? 'text-amber-400' : 'text-muted-foreground/60')} />
                    <span className="text-[10px] text-center truncate w-full leading-tight">{file.name}</span>
                    {file.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 absolute top-1.5 right-1.5" />}
                    {isSelected && <Check className="w-3 h-3 text-primary absolute top-1.5 left-1.5" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Column view */
            <div className="flex h-full overflow-x-auto">
              {(() => {
                const columns: FileItem[][] = [mockFS];
                const parts = currentPath.split('/').filter(Boolean);
                let current = mockFS;
                for (const part of parts) {
                  const folder = current.find(f => f.name === part && f.type === 'folder');
                  if (folder?.children) {
                    current = folder.children;
                    columns.push(current);
                  }
                }
                return columns.map((col, ci) => (
                  <div key={ci} className={cn('min-w-[200px] max-w-[240px] border-r border-border/20 flex-shrink-0', ci === columns.length - 1 && 'bg-muted/5')}>
                    <ScrollArea className="h-full">
                      {col.map(f => {
                        const Icon = f.type === 'folder' ? Folder : getFileIcon(f.mimeType);
                        const isActive = parts[ci] === f.name;
                        return (
                          <button
                            key={f.id}
                            onClick={e => { handleFileClick(f, e); if (f.type === 'folder') navigateTo(f.path); }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
                              isActive ? 'bg-primary/15 text-primary' : 'hover:bg-muted/20',
                              selectedFiles.has(f.id) && 'bg-primary/10'
                            )}
                          >
                            <Icon className={cn('w-3.5 h-3.5 shrink-0', f.type === 'folder' ? 'text-amber-400' : 'text-muted-foreground')} />
                            <span className="truncate flex-1 text-left">{f.name}</span>
                            {f.type === 'folder' && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                          </button>
                        );
                      })}
                    </ScrollArea>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* ─── Preview Panel ─── */}
        {showPreview && previewFile && (
          <div className="w-64 bg-background/50 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold">Inspector</span>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} className="w-6 h-6">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <PreviewContent file={previewFile} />
            </ScrollArea>
            {/* Quick actions */}
            <div className="p-2 border-t border-border/20 grid grid-cols-4 gap-1">
              {[
                { icon: ExternalLink, label: 'Open' },
                { icon: Copy, label: 'Copy' },
                { icon: Pencil, label: 'Rename' },
                { icon: Trash2, label: 'Delete' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex flex-col items-center gap-0.5 p-1.5 rounded-md hover:bg-muted/30 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Status Bar ─── */}
      <div className="h-6 bg-background/60 border-t border-border/30 flex items-center px-3 gap-4 text-[10px] text-muted-foreground shrink-0">
        <span>{currentFiles.length} items</span>
        <span>{formatSize(totalSize)}</span>
        {selectedFiles.size > 0 && <span className="text-primary">{selectedFiles.size} selected</span>}
        {clipboard && <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5" /> {clipboard.files.length} {clipboard.action === 'copy' ? 'copied' : 'cut'}</span>}
        <span className="ml-auto">{totalItems} total items</span>
      </div>
    </div>
  );
}
