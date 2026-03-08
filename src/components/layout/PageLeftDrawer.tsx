// Per-page left drawer: side icon rail + live action drawer (no mock records)
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Star,
  Settings,
  Search,
  FileText,
  FolderKanban,
  BookOpen,
  GitBranch,
  HardDrive,
  Folder,
  Cloud,
  Plus,
  Upload,
  ChevronRight,
  File,
  Database,
  Tag,
  Layers,
  Play,
  BarChart3,
  History,
  Image,
  Music,
  Video,
  Map,
  Sliders,
  Wand2,
  Scissors,
  Volume2,
  Film,
  Navigation,
  MapPin,
  MessageSquare,
  Zap,
  Code2,
  Palette,
  Globe,
  FolderTree,
  Workflow,
  Table2,
  CalendarDays,
  KanbanSquare,
  Box,
  Terminal,
  LayoutDashboard,
  StickyNote,
  FolderOpen,
  MessageCircle,
  Presentation,
  Inbox,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { emitPageDrawerAction } from '@/lib/page-drawer-events';
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
      { id: 'people', icon: MessageCircle, label: 'People' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      calendars: [{ id: 'mine', icon: Star, label: 'Mine' }, { id: 'shared', icon: MessageCircle, label: 'Shared' }],
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
      { id: 'filters', icon: Search, label: 'Filters' },
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
      { id: 'environments', icon: Settings, label: 'Environments' },
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
    sideIcons: [{ id: 'general', icon: Settings, label: 'General' }],
    subTabs: {},
  },
};

interface PageLeftDrawerProps {
  activePage: PageId;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (view: string) => void;
}

interface DrawerActionItem {
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  value: string;
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
    setActiveSubTab(firstIcon && newConfig.subTabs[firstIcon] ? newConfig.subTabs[firstIcon][0]?.id || '' : '');
  }, [activePage]);

  useEffect(() => {
    setActiveSubTab(activeIcon && config.subTabs[activeIcon] ? config.subTabs[activeIcon][0]?.id || '' : '');
  }, [activeIcon, config.subTabs]);

  const handleIconClick = (iconId: string) => {
    if (activeIcon === iconId && isOpen) {
      onToggle();
      return;
    }
    setActiveIcon(iconId);
    if (!isOpen) onToggle();
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      const newWidth = e.clientX - 48;
      setDrawerWidth(Math.max(200, Math.min(450, newWidth)));
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
                        variant="ghost"
                        size="sm"
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
              {config.sideIcons.find((s) => s.id === activeIcon)?.label || activeIcon}
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <LeftDrawerContent
              page={activePage}
              sideTab={activeIcon}
              subTab={activeSubTab}
              config={config}
              onNavigate={onNavigate}
            />
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

function LeftDrawerContent({
  page,
  sideTab,
  subTab,
  config,
  onNavigate,
}: {
  page: PageId;
  sideTab: string;
  subTab: string;
  config: PageDrawerConfig;
  onNavigate?: (v: string) => void;
}) {
  if (sideTab === 'search') return <SearchSubPanel />;
  if (sideTab === 'settings') return <SettingsSubPanel />;

  return <LiveActionPanel page={page} sideTab={sideTab} subTab={subTab} config={config} onNavigate={onNavigate} />;
}

function SearchSubPanel() {
  return (
    <div className="p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search current workspace..." className="pl-9 bg-muted/30 border-none" autoFocus />
      </div>
      <p className="text-xs text-muted-foreground mt-3">Live search across the active page context.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Panels', 'Commands', 'Files', 'Settings'].map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SettingsSubPanel() {
  const sections = [
    { name: 'General', desc: 'Workspace preferences' },
    { name: 'Appearance', desc: 'Theme and density' },
    { name: 'Shortcuts', desc: 'Keyboard mappings' },
    { name: 'Integrations', desc: 'Connections and tokens' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {sections.map((section) => (
          <Button key={section.name} variant="ghost" className="w-full justify-start h-auto py-3 px-2">
            <div className="text-left">
              <p className="text-sm font-medium">{section.name}</p>
              <p className="text-xs text-muted-foreground">{section.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function LiveActionPanel({
  page,
  sideTab,
  subTab,
  config,
  onNavigate,
}: {
  page: string;
  sideTab: string;
  subTab: string;
  config: PageDrawerConfig;
  onNavigate?: (v: string) => void;
}) {
  const actions = useMemo<DrawerActionItem[]>(() => {
    const currentSubTabs = config.subTabs[sideTab] || [];
    if (currentSubTabs.length > 0) {
      return currentSubTabs.map((tab) => ({
        label: tab.label,
        description: tab.id === subTab ? 'Currently selected' : 'Switch to this panel tab',
        icon: tab.icon,
        value: tab.id,
      }));
    }

    return config.sideIcons
      .filter((icon) => icon.id !== sideTab)
      .slice(0, 4)
      .map((icon) => ({
        label: icon.label,
        description: 'Open this drawer section',
        icon: icon.icon,
        value: icon.id,
      }));
  }, [config.sideIcons, config.subTabs, sideTab, subTab]);

  const currentLabel = config.sideIcons.find((icon) => icon.id === sideTab)?.label || sideTab;

  const handleAction = (item: DrawerActionItem) => {
    emitPageDrawerAction({ page, action: sideTab, value: item.value });
    if (item.value === 'documents' || item.value === 'ide' || item.value === 'tasks') {
      onNavigate?.(item.value);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="rounded-md border border-border/40 bg-muted/20 p-2.5">
          <p className="text-xs font-medium">{currentLabel} • Live Mode</p>
          <p className="text-xs text-muted-foreground mt-1">
            No synthetic records are shown here; this panel only emits real workspace actions.
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="space-y-1">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.value}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2.5 px-2"
                  onClick={() => handleAction(item)}
                >
                  <Icon className="w-4 h-4 mr-2 text-primary shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
            No bound actions for this tab yet.
          </div>
        )}

        <Button
          variant="outline"
          className="w-full justify-start text-xs"
          onClick={() => emitPageDrawerAction({ page, action: sideTab, value: 'open-search' })}
        >
          <Search className="w-3.5 h-3.5 mr-2" />
          Open contextual search
        </Button>
      </div>
    </ScrollArea>
  );
}
