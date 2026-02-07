// Per-page left drawer with icon tab bar at top for subgroups
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  PanelLeftClose,
  PanelLeftOpen,
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
  Workflow,
  Image,
  Music,
  Video,
  Map,
  Palette,
  Sliders,
  Wand2,
  Scissors,
  Volume2,
  Film,
  Globe,
  Navigation,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

interface SubTab {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
}

// Define sub-tabs per page
const pageSubTabs: Record<PageId, SubTab[]> = {
  chat: [
    { id: 'history', icon: Clock, label: 'History' },
    { id: 'favorites', icon: Star, label: 'Favorites' },
    { id: 'library', icon: BookOpen, label: 'Library' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ],
  orchestration: [
    { id: 'tasks', icon: Layers, label: 'Tasks' },
    { id: 'runs', icon: Play, label: 'Runs' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'history', icon: History, label: 'History' },
  ],
  documents: [
    { id: 'storage', icon: HardDrive, label: 'Storage' },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
    { id: 'tags', icon: Tag, label: 'Tags' },
    { id: 'search', icon: Search, label: 'Search' },
  ],
  ide: [
    { id: 'files', icon: File, label: 'Files' },
    { id: 'git', icon: GitBranch, label: 'Git' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'extensions', icon: Layers, label: 'Extensions' },
  ],
  image: [
    { id: 'gallery', icon: Image, label: 'Gallery' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'adjustments', icon: Sliders, label: 'Adjust' },
    { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
  ],
  audio: [
    { id: 'tracks', icon: Music, label: 'Tracks' },
    { id: 'effects', icon: Volume2, label: 'Effects' },
    { id: 'library', icon: BookOpen, label: 'Library' },
    { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
  ],
  video: [
    { id: 'timeline', icon: Film, label: 'Timeline' },
    { id: 'clips', icon: Scissors, label: 'Clips' },
    { id: 'effects', icon: Palette, label: 'Effects' },
    { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
  ],
  map: [
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'places', icon: MapPin, label: 'Places' },
    { id: 'navigate', icon: Navigation, label: 'Navigate' },
    { id: 'search', icon: Search, label: 'Search' },
  ],
};

interface PageLeftDrawerProps {
  activePage: PageId;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (view: string) => void;
}

export function PageLeftDrawer({ activePage, isOpen, onToggle, onNavigate }: PageLeftDrawerProps) {
  const tabs = pageSubTabs[activePage] || [];
  const [activeSubTab, setActiveSubTab] = useState(tabs[0]?.id || '');
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  // Reset sub-tab when page changes
  useEffect(() => {
    const newTabs = pageSubTabs[activePage] || [];
    setActiveSubTab(newTabs[0]?.id || '');
  }, [activePage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      setWidth(Math.max(240, Math.min(500, e.clientX)));
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

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-12 bottom-0 w-10 bg-background/60 backdrop-blur-xl border-r border-border/30 z-40 flex flex-col items-center py-3">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggle}>
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Open Panel</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className="fixed left-0 top-12 bottom-0 z-40 flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/30"
      style={{ width }}
    >
      {/* Icon tab bar at top */}
      <div className="flex items-center border-b border-border/30 px-1 py-1 gap-0.5 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <Tooltip key={tab.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all shrink-0',
                    isActive && 'bg-primary/15 text-primary shadow-sm'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{tab.label}</TooltipContent>
            </Tooltip>
          );
        })}

        <div className="flex-1" />

        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={onToggle}>
          <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-hidden">
        <LeftDrawerContent page={activePage} subTab={activeSubTab} onNavigate={onNavigate} />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute top-0 bottom-0 right-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50',
          isResizing && 'bg-primary/50'
        )}
      />
    </div>
  );
}

// Sub-tab content renderer — shows relevant panels per page+tab combo
function LeftDrawerContent({ page, subTab, onNavigate }: { page: PageId; subTab: string; onNavigate?: (v: string) => void }) {
  // Common panels used across pages
  if (subTab === 'search') return <SearchSubPanel />;
  if (subTab === 'settings') return <SettingsSubPanel />;

  // Page-specific content
  switch (page) {
    case 'chat':
      if (subTab === 'history') return <ChatHistoryPanel />;
      if (subTab === 'favorites') return <FavoritesPanel />;
      if (subTab === 'library') return <LibraryPanel />;
      break;
    case 'orchestration':
      return <OrchestrationSubPanel subTab={subTab} />;
    case 'documents':
      if (subTab === 'storage') return <DocumentStoragePanel onNavigate={onNavigate} />;
      if (subTab === 'projects') return <ProjectsPanel />;
      if (subTab === 'tags') return <TagsPanel />;
      break;
    case 'ide':
      if (subTab === 'files') return <FilesPanel />;
      if (subTab === 'git') return <GitSubPanel />;
      if (subTab === 'extensions') return <ExtensionsPanel />;
      break;
    default:
      return <PlaceholderSubPanel page={page} subTab={subTab} />;
  }

  return <PlaceholderSubPanel page={page} subTab={subTab} />;
}

// ─── Reusable sub-panels ────────────────────────────────────────

function SearchSubPanel() {
  return (
    <div className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search everything..." className="pl-9 bg-muted/30 border-none" autoFocus />
      </div>
      <p className="text-xs text-muted-foreground mt-3">Search across documents, conversations, memory, and code.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-accent/50 text-xs">Documents</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-accent/50 text-xs">Messages</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-accent/50 text-xs">Memory</Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-accent/50 text-xs">Code</Badge>
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
        <p className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-wide">Recent Chats</p>
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
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{cat.name}</p>
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

function OrchestrationSubPanel({ subTab }: { subTab: string }) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm capitalize">{subTab}</p>
      <p className="text-xs">Orchestration {subTab} panel</p>
    </div>
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
    <>
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
                <Icon className="w-4 h-4 mr-2 text-cyan-400" />
                <span className="flex-1 text-left text-sm">{f.name}</span>
                <Badge variant="secondary" className="text-[10px]">{f.count}</Badge>
              </Button>
            );
          })}
        </div>
      </div>
      <div className="mt-auto p-3 border-t border-border/30 space-y-2">
        <Button variant="outline" className="w-full text-sm"><Upload className="w-4 h-4 mr-2" />Upload</Button>
        <Button variant="default" className="w-full text-sm" onClick={() => onNavigate?.('documents')}>
          Open Library <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
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
              <Folder className="w-4 h-4 text-cyan-400" />
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

function TagsPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Tags & Categories</p>
      <p className="text-xs">Organize documents with tags</p>
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

function ExtensionsPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Extensions</p>
      <p className="text-xs">Manage IDE extensions</p>
    </div>
  );
}

function PlaceholderSubPanel({ page, subTab }: { page: string; subTab: string }) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm capitalize">{subTab}</p>
      <p className="text-xs">{page} — {subTab} panel</p>
      <p className="text-xs mt-2 text-muted-foreground/60">Coming soon</p>
    </div>
  );
}
