// File Manager — OS-level file browser with preview, metadata, cloud storage
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderOpen, File, FileText, FileJson, FileCode, FileImage, FileAudio,
  FileVideo, ChevronRight, ChevronDown, Plus, Trash2, Copy, Scissors,
  Download, Upload, Search, Grid3x3, List, Star, Clock, HardDrive,
  Cloud, ArrowLeft, ArrowRight, Home, LayoutGrid, SortAsc, Eye,
  FolderPlus, RefreshCw, MoreHorizontal, Info, Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  children?: FileItem[];
}

const fileIcons: Record<string, React.ComponentType<any>> = {
  'text/': FileText, 'application/json': FileJson, 'text/typescript': FileCode,
  'text/javascript': FileCode, 'image/': FileImage, 'audio/': FileAudio,
  'video/': FileVideo, 'application/pdf': FileText,
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

const mockFileSystem: FileItem[] = [
  {
    id: 'f1', name: 'src', type: 'folder', size: 0, modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src',
    children: [
      {
        id: 'f1a', name: 'components', type: 'folder', size: 0, modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/components',
        children: [
          { id: 'f1a1', name: 'App.tsx', type: 'file', size: 2048, mimeType: 'text/typescript', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/components/App.tsx' },
          { id: 'f1a2', name: 'Header.tsx', type: 'file', size: 1536, mimeType: 'text/typescript', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/components/Header.tsx' },
          { id: 'f1a3', name: 'Sidebar.tsx', type: 'file', size: 3072, mimeType: 'text/typescript', modifiedAt: new Date(), createdAt: new Date(), starred: true, path: '/src/components/Sidebar.tsx' },
        ],
      },
      { id: 'f1b', name: 'main.tsx', type: 'file', size: 512, mimeType: 'text/typescript', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/main.tsx' },
      { id: 'f1c', name: 'index.css', type: 'file', size: 8192, mimeType: 'text/css', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/index.css' },
      {
        id: 'f1d', name: 'assets', type: 'folder', size: 0, modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/assets',
        children: [
          { id: 'f1d1', name: 'logo.svg', type: 'file', size: 4096, mimeType: 'image/svg+xml', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/assets/logo.svg' },
          { id: 'f1d2', name: 'background.png', type: 'file', size: 245760, mimeType: 'image/png', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/src/assets/background.png' },
        ],
      },
    ],
  },
  {
    id: 'f2', name: 'public', type: 'folder', size: 0, modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/public',
    children: [
      { id: 'f2a', name: 'favicon.ico', type: 'file', size: 1024, mimeType: 'image/x-icon', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/public/favicon.ico' },
      { id: 'f2b', name: 'robots.txt', type: 'file', size: 128, mimeType: 'text/plain', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/public/robots.txt' },
    ],
  },
  { id: 'f3', name: 'package.json', type: 'file', size: 2048, mimeType: 'application/json', modifiedAt: new Date(), createdAt: new Date(), starred: true, path: '/package.json' },
  { id: 'f4', name: 'tsconfig.json', type: 'file', size: 512, mimeType: 'application/json', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/tsconfig.json' },
  { id: 'f5', name: 'vite.config.ts', type: 'file', size: 384, mimeType: 'text/typescript', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/vite.config.ts' },
  { id: 'f6', name: 'README.md', type: 'file', size: 4096, mimeType: 'text/markdown', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/README.md' },
  {
    id: 'f7', name: 'docs', type: 'folder', size: 0, modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/docs',
    children: [
      { id: 'f7a', name: 'ARCHITECTURE.md', type: 'file', size: 16384, mimeType: 'text/markdown', modifiedAt: new Date(), createdAt: new Date(), starred: true, path: '/docs/ARCHITECTURE.md' },
      { id: 'f7b', name: 'README.md', type: 'file', size: 2048, mimeType: 'text/markdown', modifiedAt: new Date(), createdAt: new Date(), starred: false, path: '/docs/README.md' },
    ],
  },
];

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';

export function FileManagerPage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const getCurrentFiles = useCallback((path: string): FileItem[] => {
    if (path === '/') return mockFileSystem;
    const parts = path.split('/').filter(Boolean);
    let current: FileItem[] = mockFileSystem;
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
      // Folders first
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'date': return b.modifiedAt.getTime() - a.modifiedAt.getTime();
        case 'size': return b.size - a.size;
        case 'type': return (a.mimeType || '').localeCompare(b.mimeType || '');
        default: return 0;
      }
    });
  }, [currentPath, searchQuery, sortBy, getCurrentFiles]);

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedFiles(new Set());
    setPreviewFile(null);
  }, []);

  const handleFileClick = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      navigateTo(file.path);
    } else {
      setSelectedFiles(new Set([file.id]));
      setPreviewFile(file);
    }
  }, [navigateTo]);

  const totalSize = currentFiles.reduce((a, f) => a + f.size, 0);

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Toolbar */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => { const parent = '/' + breadcrumbs.slice(0, -1).join('/'); navigateTo(parent || '/'); }} className="w-8 h-8" disabled={currentPath === '/'}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowRight className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => navigateTo('/')} className="w-8 h-8"><Home className="w-4 h-4" /></Button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <button onClick={() => navigateTo('/')} className="text-xs text-muted-foreground hover:text-foreground shrink-0">/</button>
          {breadcrumbs.map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <button onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/'))} className="text-xs hover:text-primary truncate">{part}</button>
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="h-7 text-xs pl-8 bg-muted/30 border-border/30" />
        </div>

        <div className="flex items-center gap-0.5 border-l border-border/30 pl-2">
          <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={cn('w-7 h-7', viewMode === 'list' && 'text-primary')}>
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={cn('w-7 h-7', viewMode === 'grid' && 'text-primary')}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><FolderPlus className="w-3.5 h-3.5" /> New</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Upload className="w-3.5 h-3.5" /> Upload</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File area */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'list' ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <tr className="border-b border-border/30">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setSortBy('name')}>
                    <div className="flex items-center gap-1">Name {sortBy === 'name' && <SortAsc className="w-3 h-3" />}</div>
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-28 cursor-pointer" onClick={() => setSortBy('date')}>Modified</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground w-20 cursor-pointer" onClick={() => setSortBy('size')}>Size</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Type</th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map(file => {
                  const Icon = file.type === 'folder' ? Folder : getFileIcon(file.mimeType);
                  const isSelected = selectedFiles.has(file.id);
                  return (
                    <tr
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      onDoubleClick={() => file.type === 'folder' && navigateTo(file.path)}
                      className={cn('border-b border-border/10 cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/20'
                      )}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-4 h-4 shrink-0', file.type === 'folder' ? 'text-amber-400' : 'text-muted-foreground')} />
                          <span className="truncate">{file.name}</span>
                          {file.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{file.modifiedAt.toLocaleDateString()}</td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{file.type === 'folder' ? '—' : formatSize(file.size)}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{file.type === 'folder' ? 'Folder' : file.mimeType?.split('/')[1] || 'File'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {currentFiles.map(file => {
                const Icon = file.type === 'folder' ? Folder : getFileIcon(file.mimeType);
                return (
                  <button
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    onDoubleClick={() => file.type === 'folder' && navigateTo(file.path)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl transition-colors',
                      selectedFiles.has(file.id) ? 'bg-primary/15' : 'hover:bg-muted/30'
                    )}
                  >
                    <Icon className={cn('w-10 h-10', file.type === 'folder' ? 'text-amber-400' : 'text-muted-foreground')} />
                    <span className="text-[10px] text-center truncate w-full">{file.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview panel */}
        {previewFile && (
          <div className="w-64 bg-background/60 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold">Preview</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="w-6 h-6">
                <Info className="w-3.5 h-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 text-center">
                {(() => { const Icon = getFileIcon(previewFile.mimeType); return <Icon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />; })()}
                <p className="text-sm font-medium break-all">{previewFile.name}</p>
                <div className="mt-4 space-y-2 text-left">
                  {[
                    ['Type', previewFile.mimeType || 'Unknown'],
                    ['Size', formatSize(previewFile.size)],
                    ['Modified', previewFile.modifiedAt.toLocaleString()],
                    ['Created', previewFile.createdAt.toLocaleString()],
                    ['Path', previewFile.path],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                      <p className="text-xs break-all">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-6 bg-background/60 border-t border-border/30 flex items-center px-3 gap-4 text-[10px] text-muted-foreground shrink-0">
        <span>{currentFiles.length} items</span>
        <span>{formatSize(totalSize)}</span>
        {selectedFiles.size > 0 && <span>{selectedFiles.size} selected</span>}
      </div>
    </div>
  );
}
