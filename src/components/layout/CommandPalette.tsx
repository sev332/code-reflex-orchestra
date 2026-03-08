// Command Palette — ⌘K Spotlight-style launcher with fuzzy search
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare, Zap, FileText, Code2, Image, Music, Video, Map,
  Table2, CalendarDays, Mail, KanbanSquare, MessageCircle,
  Box, LayoutDashboard, Database, Terminal, Globe, StickyNote,
  FolderOpen, Presentation, Beaker, PenTool, Settings, Search,
  ArrowRight, Clock, Star, Command, CornerDownLeft, ArrowUp, ArrowDown,
  Palette, Moon, Sun, Bell, Maximize2, Minimize2, Download,
  HelpCircle, Keyboard, RefreshCw, Trash2, Copy, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  activePage: PageId;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<any>;
  category: 'navigation' | 'action' | 'recent' | 'settings';
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

export function CommandPalette({ isOpen, onClose, onNavigate, activePage }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build command list
  const commands = useMemo((): CommandItem[] => {
    const nav: CommandItem[] = [
      { id: 'nav-chat', label: 'Chat', description: 'AI Assistant', icon: MessageSquare, category: 'navigation', action: () => onNavigate('chat'), shortcut: '⌘1', keywords: ['ai', 'assistant', 'talk'] },
      { id: 'nav-orchestration', label: 'Orchestration', description: 'AI Workflow Studio', icon: Zap, category: 'navigation', action: () => onNavigate('orchestration'), keywords: ['chain', 'workflow', 'pipeline'] },
      { id: 'nav-documents', label: 'Documents', description: 'Document Builder', icon: FileText, category: 'navigation', action: () => onNavigate('documents'), shortcut: '⌘D', keywords: ['docs', 'write', 'editor'] },
      { id: 'nav-ide', label: 'Code Builder', description: 'Full IDE', icon: Code2, category: 'navigation', action: () => onNavigate('ide'), keywords: ['code', 'programming', 'develop'] },
      { id: 'nav-image', label: 'Image Editor', description: 'Photo editing', icon: Image, category: 'navigation', action: () => onNavigate('image'), keywords: ['photo', 'picture', 'edit'] },
      { id: 'nav-illustrator', label: 'Illustrator', description: 'Vector drawing', icon: PenTool, category: 'navigation', action: () => onNavigate('illustrator'), keywords: ['draw', 'vector', 'design', 'svg'] },
      { id: 'nav-audio', label: 'Audio Editor', description: 'DAW & mixing', icon: Music, category: 'navigation', action: () => onNavigate('audio'), keywords: ['music', 'sound', 'mix', 'daw'] },
      { id: 'nav-video', label: 'Video Editor', description: 'NLE timeline', icon: Video, category: 'navigation', action: () => onNavigate('video'), keywords: ['film', 'movie', 'clip', 'edit'] },
      { id: 'nav-map', label: 'Map', description: 'Geospatial viewer', icon: Map, category: 'navigation', action: () => onNavigate('map'), keywords: ['geo', 'location', 'globe'] },
      { id: 'nav-spreadsheet', label: 'Spreadsheet', description: 'Data & formulas', icon: Table2, category: 'navigation', action: () => onNavigate('spreadsheet'), keywords: ['excel', 'sheets', 'data', 'table'] },
      { id: 'nav-calendar', label: 'Calendar', description: 'Schedule & events', icon: CalendarDays, category: 'navigation', action: () => onNavigate('calendar'), keywords: ['schedule', 'event', 'date'] },
      { id: 'nav-email', label: 'Email', description: 'Mail client', icon: Mail, category: 'navigation', action: () => onNavigate('email'), keywords: ['mail', 'inbox', 'message'] },
      { id: 'nav-tasks', label: 'Tasks', description: 'Kanban & todo', icon: KanbanSquare, category: 'navigation', action: () => onNavigate('tasks'), keywords: ['todo', 'kanban', 'project'] },
      { id: 'nav-presentations', label: 'Presentations', description: 'Slide deck editor', icon: Presentation, category: 'navigation', action: () => onNavigate('presentations'), keywords: ['slides', 'keynote', 'powerpoint'] },
      { id: 'nav-studio3d', label: '3D Studio', description: 'Scene editor', icon: Box, category: 'navigation', action: () => onNavigate('studio3d'), keywords: ['three', '3d', 'scene', 'model'] },
      { id: 'nav-terminal', label: 'Terminal', description: 'Shell emulator', icon: Terminal, category: 'navigation', action: () => onNavigate('terminal'), keywords: ['shell', 'cli', 'bash', 'command'] },
      { id: 'nav-apistudio', label: 'API Studio', description: 'REST client', icon: Beaker, category: 'navigation', action: () => onNavigate('apistudio'), keywords: ['api', 'rest', 'http', 'postman'] },
      { id: 'nav-database', label: 'Database', description: 'SQL explorer', icon: Database, category: 'navigation', action: () => onNavigate('database'), keywords: ['sql', 'query', 'table', 'schema'] },
      { id: 'nav-dashboard', label: 'Dashboard', description: 'Analytics builder', icon: LayoutDashboard, category: 'navigation', action: () => onNavigate('dashboard'), keywords: ['analytics', 'chart', 'metrics', 'grafana'] },
      { id: 'nav-browser', label: 'Browser', description: 'Web browser', icon: Globe, category: 'navigation', action: () => onNavigate('browser'), keywords: ['web', 'browse', 'internet'] },
      { id: 'nav-notes', label: 'Notes', description: 'Wiki & notes', icon: StickyNote, category: 'navigation', action: () => onNavigate('notes'), keywords: ['wiki', 'note', 'notion'] },
      { id: 'nav-files', label: 'Files', description: 'File manager', icon: FolderOpen, category: 'navigation', action: () => onNavigate('files'), keywords: ['file', 'folder', 'finder'] },
      { id: 'nav-comms', label: 'Comms Hub', description: 'Team chat', icon: MessageCircle, category: 'navigation', action: () => onNavigate('comms'), keywords: ['chat', 'discord', 'slack', 'team'] },
    ];

    const actions: CommandItem[] = [
      { id: 'act-reload', label: 'Reload Page', icon: RefreshCw, category: 'action', action: () => window.location.reload(), shortcut: '⌘R' },
      { id: 'act-fullscreen', label: 'Toggle Fullscreen', icon: Maximize2, category: 'action', action: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(), shortcut: 'F11' },
      { id: 'act-copy-url', label: 'Copy Current URL', icon: Copy, category: 'action', action: () => { navigator.clipboard.writeText(window.location.href); } },
    ];

    return [...nav, ...actions];
  }, [onNavigate]);

  // Fuzzy search
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent/navigation by default
      return commands.filter(c => c.category === 'navigation').slice(0, 12);
    }
    const q = query.toLowerCase();
    return commands
      .filter(c => {
        const haystack = [c.label, c.description, ...(c.keywords || [])].join(' ').toLowerCase();
        // Simple fuzzy: all query chars appear in order
        let hi = 0;
        for (const ch of q) {
          hi = haystack.indexOf(ch, hi);
          if (hi === -1) return false;
          hi++;
        }
        return true;
      })
      .sort((a, b) => {
        // Exact prefix match first
        const aStarts = a.label.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.label.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, 15);
  }, [query, commands]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Keyboard nav
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group by category
  const grouped: { label: string; items: (CommandItem & { index: number })[] }[] = [];
  const cats: Record<string, CommandItem[]> = {};
  filtered.forEach(item => {
    if (!cats[item.category]) cats[item.category] = [];
    cats[item.category].push(item);
  });
  let idx = 0;
  const catLabels: Record<string, string> = { navigation: 'Apps', action: 'Actions', recent: 'Recent', settings: 'Settings' };
  for (const [cat, items] of Object.entries(cats)) {
    grouped.push({
      label: catLabels[cat] || cat,
      items: items.map(item => ({ ...item, index: idx++ })),
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" onClick={onClose} />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]">
        <div className="bg-background/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search apps, commands, actions..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              autoComplete="off"
              spellCheck={false}
            />
            <Badge variant="outline" className="text-[9px] border-border/40 text-muted-foreground shrink-0">ESC</Badge>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-8 text-center">
                <HelpCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No results for "{query}"</p>
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.label}>
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{group.label}</span>
                  </div>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = item.index === selectedIndex;
                    const isCurrent = item.id === `nav-${activePage}`;
                    return (
                      <button
                        key={item.id}
                        data-index={item.index}
                        onClick={() => { item.action(); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(item.index)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-lg transition-colors text-left',
                          isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}
                        style={{ width: 'calc(100% - 8px)' }}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isActive ? 'bg-primary/15 text-primary' : 'bg-muted/30'
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{item.label}</span>
                            {isCurrent && <Badge className="text-[8px] h-3.5 px-1 bg-primary/20 text-primary border-0">Active</Badge>}
                          </div>
                          {item.description && <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>}
                        </div>
                        {item.shortcut && (
                          <Badge variant="outline" className="text-[9px] h-5 border-border/30 text-muted-foreground/60 shrink-0">{item.shortcut}</Badge>
                        )}
                        {isActive && <CornerDownLeft className="w-3 h-3 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" /> Navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="w-2.5 h-2.5" /> Select</span>
              <span className="flex items-center gap-1">ESC Close</span>
            </div>
            <span className="flex items-center gap-1"><Command className="w-2.5 h-2.5" />K</span>
          </div>
        </div>
      </div>
    </>
  );
}
