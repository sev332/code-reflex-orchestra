// Per-page left drawer: side icon rail + real functional drawer panels
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Clock, Star, Settings, Search, FileText, FolderKanban, BookOpen, GitBranch,
  HardDrive, Folder, Cloud, Plus, Upload, ChevronRight, File, Database, Tag,
  Layers, Play, BarChart3, History, Image, Music, Video, Map, Sliders, Wand2,
  Scissors, Volume2, Film, Navigation, MapPin, MessageSquare, Zap, Code2,
  Palette, Globe, FolderTree, Workflow, Table2, CalendarDays, KanbanSquare,
  Box, Terminal, LayoutDashboard, StickyNote, FolderOpen, MessageCircle,
  Presentation, Inbox, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

// Import all real drawer panels
import {
  EmailInboxPanel, EmailLabelsPanel, EmailSearchPanel,
  CalendarListPanel, CalendarUpcomingPanel, CalendarPeoplePanel,
  TasksBoardPanel, TasksProjectsPanel, TasksAnalyticsPanel, TasksFiltersPanel,
  FilesBrowsePanel, FilesRecentPanel, FilesStarredPanel,
  IDEFilesPanel, IDEGitPanel, IDEExtensionsPanel,
  IllustratorLayersPanel, IllustratorAssetsPanel,
  ImageGalleryPanel, ImageLayersPanel, ImageAdjustPanel, ImageAIToolsPanel,
  AudioTracksPanel, AudioEffectsPanel, AudioLibraryPanel, AudioAIToolsPanel,
  VideoTimelinePanel, VideoClipsPanel, VideoEffectsPanel, VideoAIToolsPanel,
  OrchestrationTasksPanel, OrchestrationRunsPanel, OrchestrationWorkflowsPanel, OrchestrationAnalyticsPanel,
  DocumentsStoragePanel, DocumentsTagsPanel,
  MapLayersPanel, MapPlacesPanel, MapNavigatePanel,
  SpreadsheetSheetsPanel, SpreadsheetFormulasPanel, SpreadsheetChartsPanel, SpreadsheetDataPanel, SpreadsheetAIPanel,
  NotesListPanel, NotesGraphPanel,
  Studio3DScenePanel, Studio3DShadersPanel, Studio3DMaterialsPanel,
  PresentationsSlidesPanel, PresentationsTemplatesPanel, PresentationsElementsPanel,
  CommsChannelsPanel, CommsDMsPanel, CommsThreadsPanel,
  TerminalSessionsPanel, TerminalHistoryPanel,
  APICollectionsPanel, APIHistoryPanel, APIEnvironmentsPanel,
  DatabaseTablesPanel, DatabaseQueriesPanel, DatabaseSchemaPanel,
  DashboardListPanel, DashboardWidgetsPanel, DashboardDataPanel,
  BrowserBookmarksPanel, BrowserHistoryPanel, BrowserReadingListPanel,
  ChatHistoryPanel, ChatLibraryPanel, ChatFavoritesPanel,
  GenericSettingsPanel, GenericSearchPanel,
} from './drawer-panels';

interface SideIcon {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  shortcut?: string;
}

interface PageDrawerConfig {
  sideIcons: SideIcon[];
}

const pageConfigs: Record<PageId, PageDrawerConfig> = {
  chat: {
    sideIcons: [
      { id: 'chat', icon: MessageSquare, label: 'Chat', shortcut: '⌘1' },
      { id: 'history', icon: Clock, label: 'History', shortcut: '⌘H' },
      { id: 'library', icon: BookOpen, label: 'Library', shortcut: '⌘L' },
      { id: 'favorites', icon: Star, label: 'Favorites' },
      { id: 'search', icon: Search, label: 'Search', shortcut: '⌘K' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
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
  },
  ide: {
    sideIcons: [
      { id: 'files', icon: File, label: 'Files' },
      { id: 'git', icon: GitBranch, label: 'Git' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'extensions', icon: Layers, label: 'Extensions' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
  image: {
    sideIcons: [
      { id: 'gallery', icon: Image, label: 'Gallery' },
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'adjustments', icon: Sliders, label: 'Adjust' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
  },
  audio: {
    sideIcons: [
      { id: 'tracks', icon: Music, label: 'Tracks' },
      { id: 'effects', icon: Volume2, label: 'Effects' },
      { id: 'library', icon: BookOpen, label: 'Library' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
  },
  video: {
    sideIcons: [
      { id: 'timeline', icon: Film, label: 'Timeline' },
      { id: 'clips', icon: Scissors, label: 'Clips' },
      { id: 'effects', icon: Palette, label: 'Effects' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
  },
  map: {
    sideIcons: [
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'places', icon: MapPin, label: 'Places' },
      { id: 'navigate', icon: Navigation, label: 'Navigate' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
  },
  spreadsheet: {
    sideIcons: [
      { id: 'sheets', icon: Table2, label: 'Sheets' },
      { id: 'formulas', icon: Code2, label: 'Formulas' },
      { id: 'charts', icon: BarChart3, label: 'Charts' },
      { id: 'data', icon: Database, label: 'Data' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Analysis' },
    ],
  },
  calendar: {
    sideIcons: [
      { id: 'calendars', icon: CalendarDays, label: 'Calendars' },
      { id: 'events', icon: Clock, label: 'Upcoming' },
      { id: 'people', icon: MessageCircle, label: 'People' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
  email: {
    sideIcons: [
      { id: 'inbox', icon: Inbox, label: 'Inbox' },
      { id: 'compose', icon: Plus, label: 'Compose' },
      { id: 'sent', icon: Send, label: 'Sent' },
      { id: 'labels', icon: Tag, label: 'Labels' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
  },
  tasks: {
    sideIcons: [
      { id: 'board', icon: KanbanSquare, label: 'Board' },
      { id: 'projects', icon: FolderKanban, label: 'Projects' },
      { id: 'filters', icon: Search, label: 'Filters' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  presentations: {
    sideIcons: [
      { id: 'slides', icon: Presentation, label: 'Slides' },
      { id: 'templates', icon: LayoutDashboard, label: 'Templates' },
      { id: 'elements', icon: Layers, label: 'Elements' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
  studio3d: {
    sideIcons: [
      { id: 'scene', icon: Box, label: 'Scene Graph' },
      { id: 'assets', icon: Folder, label: 'Assets' },
      { id: 'shaders', icon: Palette, label: 'Shaders' },
      { id: 'materials', icon: Layers, label: 'Materials' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
  terminal: {
    sideIcons: [
      { id: 'sessions', icon: Terminal, label: 'Sessions' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
  apistudio: {
    sideIcons: [
      { id: 'collections', icon: Folder, label: 'Collections' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'environments', icon: Settings, label: 'Environments' },
    ],
  },
  database: {
    sideIcons: [
      { id: 'tables', icon: Database, label: 'Tables' },
      { id: 'queries', icon: Code2, label: 'Queries' },
      { id: 'schema', icon: GitBranch, label: 'Schema' },
    ],
  },
  dashboard: {
    sideIcons: [
      { id: 'dashboards', icon: LayoutDashboard, label: 'Dashboards' },
      { id: 'widgets', icon: Layers, label: 'Widgets' },
      { id: 'data', icon: Database, label: 'Data Sources' },
    ],
  },
  browser: {
    sideIcons: [
      { id: 'bookmarks', icon: Star, label: 'Bookmarks' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'reading', icon: BookOpen, label: 'Reading List' },
    ],
  },
  notes: {
    sideIcons: [
      { id: 'notes', icon: StickyNote, label: 'Notes' },
      { id: 'graph', icon: GitBranch, label: 'Graph' },
      { id: 'tags', icon: Tag, label: 'Tags' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
  },
  files: {
    sideIcons: [
      { id: 'browse', icon: FolderOpen, label: 'Browse' },
      { id: 'recent', icon: Clock, label: 'Recent' },
      { id: 'starred', icon: Star, label: 'Starred' },
      { id: 'cloud', icon: Cloud, label: 'Cloud' },
    ],
  },
  comms: {
    sideIcons: [
      { id: 'channels', icon: MessageCircle, label: 'Channels' },
      { id: 'dms', icon: MessageSquare, label: 'DMs' },
      { id: 'threads', icon: GitBranch, label: 'Threads' },
    ],
  },
  illustrator: {
    sideIcons: [
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'assets', icon: FolderOpen, label: 'Assets' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
  settings: {
    sideIcons: [{ id: 'general', icon: Settings, label: 'General' }],
  },
};

const defaultConfig: PageDrawerConfig = {
  sideIcons: [
    { id: 'browse', icon: Search, label: 'Browse' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ],
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
  const [drawerWidth, setDrawerWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const newConfig = pageConfigs[activePage] || defaultConfig;
    setActiveIcon(newConfig.sideIcons[0]?.id || null);
  }, [activePage]);

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

  const currentLabel = config.sideIcons.find(s => s.id === activeIcon)?.label || activeIcon || '';

  return (
    <>
      {/* Side icon rail */}
      <div className="fixed left-0 top-11 w-12 border-r border-border/50 z-40 flex flex-col items-center py-3 gap-1" style={{ bottom: 36, background: 'hsl(var(--background) / var(--ui-transparency, 0.5))', backdropFilter: 'blur(24px) saturate(180%)' }}>
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

      {/* Drawer panel */}
      {isOpen && activeIcon && (
        <div
          className="fixed top-11 z-30 flex flex-col border-r border-border/30"
          style={{ left: 48, width: drawerWidth, bottom: 36, background: 'hsl(var(--background) / var(--ui-transparency, 0.5))', backdropFilter: 'blur(24px) saturate(180%)' }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/20 shrink-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentLabel}</p>
          </div>

          {/* Content — real panels */}
          <div className="flex-1 overflow-hidden">
            <DrawerPanelRouter page={activePage} tab={activeIcon} />
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className={cn('absolute top-0 bottom-0 right-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50', isResizing && 'bg-primary/50')}
          />
        </div>
      )}
    </>
  );
}

// ============================================================
// PANEL ROUTER — maps (page, tab) → real component
// ============================================================

function DrawerPanelRouter({ page, tab }: { page: PageId; tab: string }) {
  // Chat
  if (page === 'chat') {
    if (tab === 'chat' || tab === 'history') return <ChatHistoryPanel />;
    if (tab === 'library') return <ChatLibraryPanel />;
    if (tab === 'favorites') return <ChatFavoritesPanel />;
    if (tab === 'search') return <GenericSearchPanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
  }

  // Email
  if (page === 'email') {
    if (tab === 'inbox' || tab === 'compose' || tab === 'sent') return <EmailInboxPanel />;
    if (tab === 'labels') return <EmailLabelsPanel />;
    if (tab === 'search') return <EmailSearchPanel />;
  }

  // Calendar
  if (page === 'calendar') {
    if (tab === 'calendars') return <CalendarListPanel />;
    if (tab === 'events') return <CalendarUpcomingPanel />;
    if (tab === 'people') return <CalendarPeoplePanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
    return <CalendarListPanel />;
  }

  // Tasks
  if (page === 'tasks') {
    if (tab === 'board') return <TasksBoardPanel />;
    if (tab === 'projects') return <TasksProjectsPanel />;
    if (tab === 'filters') return <TasksFiltersPanel />;
    if (tab === 'analytics') return <TasksAnalyticsPanel />;
  }

  // Files
  if (page === 'files') {
    if (tab === 'browse') return <FilesBrowsePanel />;
    if (tab === 'recent') return <FilesRecentPanel />;
    if (tab === 'starred') return <FilesStarredPanel />;
    if (tab === 'cloud') return <FilesBrowsePanel />;
  }

  // IDE
  if (page === 'ide') {
    if (tab === 'files') return <IDEFilesPanel />;
    if (tab === 'git') return <IDEGitPanel />;
    if (tab === 'search') return <GenericSearchPanel />;
    if (tab === 'extensions') return <IDEExtensionsPanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
    return <IDEFilesPanel />;
  }

  // Illustrator
  if (page === 'illustrator') {
    if (tab === 'layers') return <IllustratorLayersPanel />;
    if (tab === 'assets') return <IllustratorAssetsPanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
  }

  // Image
  if (page === 'image') {
    if (tab === 'gallery') return <ImageGalleryPanel />;
    if (tab === 'layers') return <ImageLayersPanel />;
    if (tab === 'adjustments') return <ImageAdjustPanel />;
    if (tab === 'ai-tools') return <ImageAIToolsPanel />;
  }

  // Audio
  if (page === 'audio') {
    if (tab === 'tracks') return <AudioTracksPanel />;
    if (tab === 'effects') return <AudioEffectsPanel />;
    if (tab === 'library') return <AudioLibraryPanel />;
    if (tab === 'ai-tools') return <AudioAIToolsPanel />;
  }

  // Video
  if (page === 'video') {
    if (tab === 'timeline') return <VideoTimelinePanel />;
    if (tab === 'clips') return <VideoClipsPanel />;
    if (tab === 'effects') return <VideoEffectsPanel />;
    if (tab === 'ai-tools') return <VideoAIToolsPanel />;
  }

  // Orchestration
  if (page === 'orchestration') {
    if (tab === 'tasks') return <OrchestrationTasksPanel />;
    if (tab === 'runs') return <OrchestrationRunsPanel />;
    if (tab === 'workflows') return <OrchestrationWorkflowsPanel />;
    if (tab === 'analytics') return <OrchestrationAnalyticsPanel />;
    if (tab === 'history') return <OrchestrationRunsPanel />;
    if (tab === 'search') return <GenericSearchPanel />;
  }

  // Documents
  if (page === 'documents') {
    if (tab === 'storage' || tab === 'projects' || tab === 'structure') return <DocumentsStoragePanel />;
    if (tab === 'tags') return <DocumentsTagsPanel />;
    if (tab === 'search') return <GenericSearchPanel />;
    if (tab === 'upload') return <DocumentsStoragePanel />;
  }

  // Map
  if (page === 'map') {
    if (tab === 'layers') return <MapLayersPanel />;
    if (tab === 'places') return <MapPlacesPanel />;
    if (tab === 'navigate') return <MapNavigatePanel />;
    if (tab === 'search') return <GenericSearchPanel />;
    return <MapLayersPanel />;
  }

  // Spreadsheet
  if (page === 'spreadsheet') {
    if (tab === 'sheets') return <SpreadsheetSheetsPanel />;
    if (tab === 'formulas') return <SpreadsheetFormulasPanel />;
    if (tab === 'charts') return <SpreadsheetChartsPanel />;
    if (tab === 'data') return <SpreadsheetDataPanel />;
    if (tab === 'ai-tools') return <SpreadsheetAIPanel />;
    return <SpreadsheetSheetsPanel />;
  }

  // Notes
  if (page === 'notes') {
    if (tab === 'notes') return <NotesListPanel />;
    if (tab === 'graph') return <NotesGraphPanel />;
    if (tab === 'tags') return <DocumentsTagsPanel />;
    if (tab === 'search') return <GenericSearchPanel />;
  }

  // Studio 3D
  if (page === 'studio3d') {
    if (tab === 'scene') return <Studio3DScenePanel />;
    if (tab === 'assets') return <IllustratorAssetsPanel />;
    if (tab === 'shaders') return <Studio3DShadersPanel />;
    if (tab === 'materials') return <Studio3DMaterialsPanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
    return <Studio3DScenePanel />;
  }

  // Presentations
  if (page === 'presentations') {
    if (tab === 'slides') return <PresentationsSlidesPanel />;
    if (tab === 'templates') return <PresentationsTemplatesPanel />;
    if (tab === 'elements') return <PresentationsElementsPanel />;
    if (tab === 'ai-tools') return <SpreadsheetAIPanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
    return <PresentationsSlidesPanel />;
  }

  // Comms
  if (page === 'comms') {
    if (tab === 'channels') return <CommsChannelsPanel />;
    if (tab === 'dms') return <CommsDMsPanel />;
    if (tab === 'threads') return <CommsThreadsPanel />;
    return <CommsChannelsPanel />;
  }

  // Terminal
  if (page === 'terminal') {
    if (tab === 'sessions') return <TerminalSessionsPanel />;
    if (tab === 'history') return <TerminalHistoryPanel />;
    if (tab === 'settings') return <GenericSettingsPanel />;
  }

  // API Studio
  if (page === 'apistudio') {
    if (tab === 'collections') return <APICollectionsPanel />;
    if (tab === 'history') return <APIHistoryPanel />;
    if (tab === 'environments') return <APIEnvironmentsPanel />;
  }

  // Database
  if (page === 'database') {
    if (tab === 'tables') return <DatabaseTablesPanel />;
    if (tab === 'queries') return <DatabaseQueriesPanel />;
    if (tab === 'schema') return <DatabaseSchemaPanel />;
    return <DatabaseTablesPanel />;
  }

  // Dashboard
  if (page === 'dashboard') {
    if (tab === 'dashboards') return <DashboardListPanel />;
    if (tab === 'widgets') return <DashboardWidgetsPanel />;
    if (tab === 'data') return <DashboardDataPanel />;
    return <DashboardListPanel />;
  }

  // Browser
  if (page === 'browser') {
    if (tab === 'bookmarks') return <BrowserBookmarksPanel />;
    if (tab === 'history') return <BrowserHistoryPanel />;
    if (tab === 'reading') return <BrowserReadingListPanel />;
  }

  // Settings
  if (page === 'settings') return <GenericSettingsPanel />;

  // Fallback
  if (tab === 'search') return <GenericSearchPanel />;
  if (tab === 'settings') return <GenericSettingsPanel />;

  return <GenericSearchPanel />;
}
