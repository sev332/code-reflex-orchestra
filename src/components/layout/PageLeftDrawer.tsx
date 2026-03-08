// Per-page left drawer: Side icon bar (always visible) + expandable drawer panel with sub-tabs
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Clock, Star, Settings, Search, FileText, FolderKanban, BookOpen,
  GitBranch, HardDrive, Folder, Cloud, Plus, Upload, ChevronRight,
  File, Database, Tag, Layers, Play, BarChart3, History, Image,
  Music, Video, Map, Sliders, Wand2, Scissors, Volume2, Film,
  Navigation, MapPin, MessageSquare, Zap, Code2, Palette, Globe,
  FolderTree, Workflow, Table2, CalendarDays, Mail, KanbanSquare,
  Box, Terminal, Beaker, LayoutDashboard, StickyNote, FolderOpen,
  MessageCircle, Presentation, Users, Inbox, Send, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

interface SideIcon {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  shortcut?: string;
}

interface SubTab {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
}

interface PageDrawerConfig {
  sideIcons: SideIcon[];
  subTabs: Record<string, SubTab[]>;
}

const defaultConfig: PageDrawerConfig = {
  sideIcons: [
    { id: 'browse', icon: Search, label: 'Browse' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ],
  subTabs: {},
};

const pageConfigs: Record<PageId, PageDrawerConfig> = {
  chat: {
    sideIcons: [
      { id: 'chat', icon: MessageSquare, label: 'Chat', shortcut: '⌘1' },
      { id: 'history', icon: Clock, label: 'History', shortcut: '⌘H' },
      { id: 'library', icon: BookOpen, label: 'Library', shortcut: '⌘L' },
      { id: 'search', icon: Search, label: 'Search', shortcut: '⌘K' },
      { id: 'favorites', icon: Star, label: 'Favorites' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      chat: [{ id: 'recent', icon: Clock, label: 'Recent' }, { id: 'pinned', icon: Star, label: 'Pinned' }],
      history: [{ id: 'conversations', icon: MessageSquare, label: 'Conversations' }, { id: 'timeline', icon: History, label: 'Timeline' }],
      library: [{ id: 'docs', icon: FileText, label: 'Docs' }, { id: 'knowledge', icon: Database, label: 'Knowledge' }, { id: 'tags', icon: Tag, label: 'Tags' }],
      settings: [{ id: 'general', icon: Settings, label: 'General' }, { id: 'appearance', icon: Palette, label: 'Appearance' }, { id: 'ai', icon: Wand2, label: 'AI Prefs' }],
    },
  },
  orchestration: {
    sideIcons: [
      { id: 'tasks', icon: Layers, label: 'Tasks' },
      { id: 'runs', icon: Play, label: 'Runs' },
      { id: 'workflows', icon: Workflow, label: 'Workflows' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {
      tasks: [{ id: 'active', icon: Play, label: 'Active' }, { id: 'queue', icon: Layers, label: 'Queue' }, { id: 'completed', icon: Star, label: 'Done' }],
      runs: [{ id: 'live', icon: Play, label: 'Live' }, { id: 'past', icon: History, label: 'Past' }],
    },
  },
  documents: {
    sideIcons: [
      { id: 'storage', icon: HardDrive, label: 'Storage' },
      { id: 'projects', icon: FolderKanban, label: 'Projects' },
      { id: 'structure', icon: FolderTree, label: 'Structure' },
      { id: 'tags', icon: Tag, label: 'Tags' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'upload', icon: Upload, label: 'Upload' },
    ],
    subTabs: {
      storage: [{ id: 'local', icon: Folder, label: 'Local' }, { id: 'cloud', icon: Cloud, label: 'Cloud' }, { id: 'recent', icon: Clock, label: 'Recent' }],
      structure: [{ id: 'index', icon: Layers, label: 'Index' }, { id: 'map', icon: Map, label: 'Map' }],
    },
  },
  ide: {
    sideIcons: [
      { id: 'files', icon: File, label: 'Files' },
      { id: 'git', icon: GitBranch, label: 'Git' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'extensions', icon: Layers, label: 'Extensions' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      files: [{ id: 'explorer', icon: FolderTree, label: 'Explorer' }, { id: 'open', icon: FileText, label: 'Open Files' }],
      git: [{ id: 'branches', icon: GitBranch, label: 'Branches' }, { id: 'history', icon: History, label: 'History' }, { id: 'changes', icon: FileText, label: 'Changes' }],
    },
  },
  image: {
    sideIcons: [
      { id: 'gallery', icon: Image, label: 'Gallery' },
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'adjustments', icon: Sliders, label: 'Adjust' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
    subTabs: {},
  },
  audio: {
    sideIcons: [
      { id: 'tracks', icon: Music, label: 'Tracks' },
      { id: 'effects', icon: Volume2, label: 'Effects' },
      { id: 'library', icon: BookOpen, label: 'Library' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
    subTabs: {},
  },
  video: {
    sideIcons: [
      { id: 'timeline', icon: Film, label: 'Timeline' },
      { id: 'clips', icon: Scissors, label: 'Clips' },
      { id: 'effects', icon: Palette, label: 'Effects' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
    subTabs: {},
  },
  map: {
    sideIcons: [
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'places', icon: MapPin, label: 'Places' },
      { id: 'navigate', icon: Navigation, label: 'Navigate' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {},
  },
  // ─── New pages ─────────────────
  spreadsheet: {
    sideIcons: [
      { id: 'sheets', icon: Table2, label: 'Sheets' },
      { id: 'formulas', icon: Code2, label: 'Formulas' },
      { id: 'charts', icon: BarChart3, label: 'Charts' },
      { id: 'data', icon: Database, label: 'Data' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Analysis' },
    ],
    subTabs: {
      sheets: [{ id: 'all', icon: Table2, label: 'All' }, { id: 'recent', icon: Clock, label: 'Recent' }],
    },
  },
  calendar: {
    sideIcons: [
      { id: 'calendars', icon: CalendarDays, label: 'Calendars' },
      { id: 'events', icon: Clock, label: 'Upcoming' },
      { id: 'people', icon: Users, label: 'People' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      calendars: [{ id: 'mine', icon: Star, label: 'Mine' }, { id: 'shared', icon: Users, label: 'Shared' }],
    },
  },
  email: {
    sideIcons: [
      { id: 'inbox', icon: Inbox, label: 'Inbox' },
      { id: 'compose', icon: Plus, label: 'Compose' },
      { id: 'sent', icon: Send, label: 'Sent' },
      { id: 'labels', icon: Tag, label: 'Labels' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {},
  },
  tasks: {
    sideIcons: [
      { id: 'board', icon: KanbanSquare, label: 'Board' },
      { id: 'projects', icon: FolderKanban, label: 'Projects' },
      { id: 'filters', icon: Filter, label: 'Filters' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    ],
    subTabs: {
      projects: [{ id: 'active', icon: Play, label: 'Active' }, { id: 'archived', icon: History, label: 'Archived' }],
    },
  },
  presentations: {
    sideIcons: [
      { id: 'slides', icon: Presentation, label: 'Slides' },
      { id: 'templates', icon: LayoutDashboard, label: 'Templates' },
      { id: 'elements', icon: Layers, label: 'Elements' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      slides: [{ id: 'all', icon: Presentation, label: 'All' }, { id: 'recent', icon: Clock, label: 'Recent' }],
    },
  },
  studio3d: {
    sideIcons: [
      { id: 'scene', icon: Box, label: 'Scene Graph' },
      { id: 'assets', icon: Folder, label: 'Assets' },
      { id: 'shaders', icon: Palette, label: 'Shaders' },
      { id: 'materials', icon: Layers, label: 'Materials' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      assets: [{ id: 'models', icon: Box, label: 'Models' }, { id: 'textures', icon: Image, label: 'Textures' }],
    },
  },
  terminal: {
    sideIcons: [
      { id: 'sessions', icon: Terminal, label: 'Sessions' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {},
  },
  apistudio: {
    sideIcons: [
      { id: 'collections', icon: Folder, label: 'Collections' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'environments', icon: Settings, label: 'Envs' },
    ],
    subTabs: {},
  },
  database: {
    sideIcons: [
      { id: 'tables', icon: Database, label: 'Tables' },
      { id: 'queries', icon: Code2, label: 'Queries' },
      { id: 'schema', icon: GitBranch, label: 'Schema' },
    ],
    subTabs: {},
  },
  dashboard: {
    sideIcons: [
      { id: 'dashboards', icon: LayoutDashboard, label: 'Dashboards' },
      { id: 'widgets', icon: Layers, label: 'Widgets' },
      { id: 'data', icon: Database, label: 'Data Sources' },
    ],
    subTabs: {},
  },
  browser: {
    sideIcons: [
      { id: 'bookmarks', icon: Star, label: 'Bookmarks' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'reading', icon: BookOpen, label: 'Reading List' },
    ],
    subTabs: {},
  },
  notes: {
    sideIcons: [
      { id: 'notes', icon: StickyNote, label: 'Notes' },
      { id: 'graph', icon: GitBranch, label: 'Graph' },
      { id: 'tags', icon: Tag, label: 'Tags' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {},
  },
  files: {
    sideIcons: [
      { id: 'browse', icon: FolderOpen, label: 'Browse' },
      { id: 'recent', icon: Clock, label: 'Recent' },
      { id: 'starred', icon: Star, label: 'Starred' },
      { id: 'cloud', icon: Cloud, label: 'Cloud' },
    ],
    subTabs: {},
  },
  comms: {
    sideIcons: [
      { id: 'channels', icon: MessageCircle, label: 'Channels' },
      { id: 'dms', icon: MessageSquare, label: 'DMs' },
      { id: 'threads', icon: GitBranch, label: 'Threads' },
    ],
    subTabs: {},
  },
  illustrator: {
    sideIcons: [
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'assets', icon: FolderOpen, label: 'Assets' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {},
  },
  settings: {
    sideIcons: [
      { id: 'general', icon: Settings, label: 'General' },
    ],
    subTabs: {},
  },
};

interface PageLeftDrawerProps {
  activePage: PageId;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (view: string) => void;
}

export function PageLeftDrawer({ activePage, isOpen, onToggle, onNavigate }: PageLeftDrawerProps) {
  const config = pageConfigs[activePage] || defaultConfig;
  const [activeIcon, setActiveIcon] = useState<string | null>(config.sideIcons[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [drawerWidth, setDrawerWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const newConfig = pageConfigs[activePage] || defaultConfig;
    const firstIcon = newConfig.sideIcons[0]?.id || null;
    setActiveIcon(firstIcon);
    if (firstIcon && newConfig.subTabs[firstIcon]) {
      setActiveSubTab(newConfig.subTabs[firstIcon][0]?.id || '');
    } else {
      setActiveSubTab('');
    }
  }, [activePage]);

  useEffect(() => {
    if (activeIcon && config.subTabs[activeIcon]) {
      setActiveSubTab(config.subTabs[activeIcon][0]?.id || '');
    } else {
      setActiveSubTab('');
    }
  }, [activeIcon, config.subTabs]);

  const handleIconClick = (iconId: string) => {
    if (activeIcon === iconId && isOpen) {
      onToggle();
    } else {
      setActiveIcon(iconId);
      if (!isOpen) onToggle();
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      const newW = e.clientX - 48;
      setDrawerWidth(Math.max(200, Math.min(450, newW)));
    };
    const up = () => setIsResizing(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const subTabs = activeIcon ? config.subTabs[activeIcon] || [] : [];

  return (
    <>
      <div className="fixed left-0 top-12 bottom-0 w-12 bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 flex flex-col items-center py-3 gap-1">
        {config.sideIcons.map((item) => {
          const Icon = item.icon;
          const isActive = activeIcon === item.id && isOpen;
          return (
            <Tooltip key={item.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleIconClick(item.id)}
                  className={cn('w-10 h-10 rounded-xl transition-all duration-200', isActive && 'bg-primary/10 text-primary shadow-sm')}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{item.label}</span>
                {item.shortcut && <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{item.shortcut}</kbd>}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="flex-1" />
        {!config.sideIcons.find(s => s.id === 'settings') && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                onClick={() => handleIconClick('settings')}
                className={cn('w-10 h-10 rounded-xl transition-all duration-200', activeIcon === 'settings' && isOpen && 'bg-primary/10 text-primary')}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        )}
      </div>

      {isOpen && activeIcon && (
        <div
          className="fixed top-12 bottom-0 z-30 flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/30"
          style={{ left: 48, width: drawerWidth }}
        >
          {subTabs.length > 0 && (
            <div className="flex items-center border-b border-border/30 px-2 py-1 gap-0.5 shrink-0">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <Tooltip key={tab.id} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setActiveSubTab(tab.id)}
                        className={cn('h-7 px-2 gap-1 rounded-md text-xs transition-all shrink-0', isActive && 'bg-primary/15 text-primary shadow-sm')}
                      >
                        <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                        <span>{tab.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">{tab.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}

          <div className="px-3 py-2 border-b border-border/20 shrink-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {config.sideIcons.find(s => s.id === activeIcon)?.label || activeIcon}
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <LeftDrawerContent page={activePage} sideTab={activeIcon} subTab={activeSubTab} onNavigate={onNavigate} />
          </div>

          <div
            onMouseDown={handleMouseDown}
            className={cn('absolute top-0 bottom-0 right-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50', isResizing && 'bg-primary/50')}
          />
        </div>
      )}
    </>
  );
}

function LeftDrawerContent({ page, sideTab, subTab, onNavigate }: { page: PageId; sideTab: string; subTab: string; onNavigate?: (v: string) => void }) {
  if (sideTab === 'search') return <SearchSubPanel />;
  if (sideTab === 'settings') return <SettingsSubPanel />;

  switch (page) {
    case 'chat':
      if (sideTab === 'chat') return <ChatRecentPanel />;
      if (sideTab === 'history') return <ChatHistoryPanel />;
      if (sideTab === 'favorites') return <FavoritesPanel />;
      if (sideTab === 'library') return <LibraryPanel />;
      break;
    case 'orchestration':
      return <PlaceholderSubPanel page={page} subTab={sideTab} />;
    case 'documents':
      if (sideTab === 'storage') return <DocumentStoragePanel onNavigate={onNavigate} />;
      if (sideTab === 'projects') return <ProjectsPanel />;
      if (sideTab === 'upload') return <UploadPanel />;
      break;
    case 'ide':
      if (sideTab === 'files') return <FilesPanel />;
      if (sideTab === 'git') return <GitSubPanel />;
      break;
    case 'calendar':
      if (sideTab === 'calendars') return <CalendarListPanel />;
      if (sideTab === 'events') return <UpcomingEventsPanel />;
      if (sideTab === 'people') return <PeoplePanel />;
      break;
    case 'email':
      if (sideTab === 'inbox') return <EmailFoldersPanel />;
      if (sideTab === 'compose') return <ComposePanel />;
      if (sideTab === 'sent') return <EmailSentPanel />;
      if (sideTab === 'labels') return <EmailLabelsPanel />;
      break;
    case 'apistudio':
      if (sideTab === 'collections') return <APICollectionsPanel />;
      if (sideTab === 'history') return <APIHistoryPanel />;
      if (sideTab === 'environments') return <APIEnvironmentsPanel />;
      break;
    case 'database':
      if (sideTab === 'tables') return <DBTablesPanel />;
      if (sideTab === 'queries') return <DBQueriesPanel />;
      if (sideTab === 'schema') return <DBSchemaPanel />;
      break;
    case 'notes':
      if (sideTab === 'notes') return <NotesListPanel />;
      if (sideTab === 'graph') return <NotesGraphPanel />;
      if (sideTab === 'tags') return <NotesTagsPanel />;
      break;
    case 'files':
      if (sideTab === 'browse') return <FilesBrowsePanel />;
      if (sideTab === 'recent') return <FilesRecentPanel />;
      if (sideTab === 'starred') return <FilesStarredPanel />;
      if (sideTab === 'cloud') return <FilesCloudPanel />;
      break;
    case 'comms':
      if (sideTab === 'channels') return <CommsChannelsPanel />;
      if (sideTab === 'dms') return <CommsDMsPanel />;
      if (sideTab === 'threads') return <CommsThreadsPanel />;
      break;
  }

  return <PlaceholderSubPanel page={page} subTab={sideTab} />;
}

// ─── Sub-panels (same as before, abbreviated) ──────────

function SearchSubPanel() {
  return (
    <div className="p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search everything..." className="pl-9 bg-muted/30 border-none" autoFocus />
      </div>
      <p className="text-xs text-muted-foreground mt-3">Search across documents, conversations, memory, and code.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Documents', 'Messages', 'Memory', 'Code'].map(t => (
          <Badge key={t} variant="outline" className="cursor-pointer hover:bg-accent/50 text-xs">{t}</Badge>
        ))}
      </div>
    </div>
  );
}

function SettingsSubPanel() {
  const sections = [
    { name: 'General', desc: 'App preferences and defaults' },
    { name: 'Appearance', desc: 'Theme and visual settings' },
    { name: 'AI Preferences', desc: 'Model selection and behavior' },
    { name: 'Keyboard Shortcuts', desc: 'Customize key bindings' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {sections.map((s, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-3 px-2">
            <div className="text-left">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function ChatRecentPanel() {
  const chats = [
    { title: 'Document Builder Architecture', time: '2m ago', messages: 12 },
    { title: 'APOE Orchestration', time: '1h ago', messages: 45 },
    { title: 'Memory System Design', time: '3h ago', messages: 23 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Chat</Button>
        {chats.map((c, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.time} • {c.messages} msgs</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function ChatHistoryPanel() {
  const history = [
    { query: 'APOE orchestration architecture', time: '10m ago' },
    { query: 'Document analysis chain', time: '1h ago' },
    { query: 'Memory systems overview', time: '3h ago' },
    { query: 'SAM protocol validation', time: '1d ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {history.map((item, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{item.query}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function FavoritesPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No favorites yet</p>
      <p className="text-xs">Star items to access them quickly</p>
    </div>
  );
}

function LibraryPanel() {
  const categories = [
    { name: 'System Documentation', count: 42, icon: Database },
    { name: 'Research Papers', count: 18, icon: FileText },
    { name: 'Code References', count: 156, icon: File },
    { name: 'Tagged Content', count: 89, icon: Tag },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} items</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function DocumentStoragePanel({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const folders = [
    { name: 'My Documents', count: 12, icon: Folder },
    { name: 'Shared', count: 5, icon: Cloud },
    { name: 'Recent', count: 8, icon: Clock },
    { name: 'Starred', count: 3, icon: Star },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search docs..." className="pl-8 h-8 text-sm bg-muted/30 border-none" />
        </div>
        <div className="space-y-1">
          {folders.map((f, i) => {
            const Icon = f.icon;
            return (
              <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
                <Icon className="w-4 h-4 mr-2 text-primary" />
                <span className="flex-1 text-left text-sm">{f.name}</span>
                <Badge variant="secondary" className="text-[10px]">{f.count}</Badge>
              </Button>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full text-sm"><Upload className="w-4 h-4 mr-2" />Upload</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

function ProjectsPanel() {
  const projects = [
    { name: 'AIMOS Development', status: 'active', progress: 67 },
    { name: 'Research Pipeline', status: 'active', progress: 45 },
    { name: 'Documentation', status: 'paused', progress: 80 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {projects.map((p, i) => (
          <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{p.name}</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full mb-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
            </div>
            <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function UploadPanel() {
  return (
    <div className="p-4 flex flex-col items-center gap-3">
      <div className="w-full border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, TXT, MD and more</p>
      </div>
    </div>
  );
}

function FilesPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">File Explorer</p>
      <p className="text-xs">Browse project files</p>
    </div>
  );
}

function GitSubPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Git Panel</p>
      <p className="text-xs">Branches, commits, history</p>
    </div>
  );
}

function PlaceholderSubPanel({ page, subTab }: { page: string; subTab: string }) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm capitalize">{subTab}</p>
      <p className="text-xs">{page} — {subTab} panel</p>
    </div>
  );
}
