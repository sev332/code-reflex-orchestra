// Persistent right drawer: Page mini-drawers with summary widgets + AI transparency systems
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageSquare, Zap, FileText, Code2, Image, Music, Video, Map,
  Table2, CalendarDays, Mail, KanbanSquare, MessageCircle,
  Box, LayoutDashboard, Database, Terminal, Globe, StickyNote,
  FolderOpen, Presentation, PenTool, Settings,
  Brain, Users, Eye, GitBranch, Activity, Cpu, Network,
  KeyRound, Workflow, Palette,
  Beaker,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedPersistentChat } from '@/components/AIChat/AdvancedPersistentChat';
import { EnhancedRightDrawerPanel } from './EnhancedRightDrawerPanel';
import { VaultPanel } from './VaultPanel';
import { AIContextPanel } from './AIContextPanel';
import { WorkflowsPanel } from './WorkflowsPanel';
import type { PageId } from './PageTopBar';

// The right icon bar now mirrors page icons for mini-drawer access
// Old AI system icons moved to bottom bar
const pageIcons: { id: PageId; icon: React.ComponentType<any>; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'orchestration', icon: Zap, label: 'Orchestration' },
  { id: 'documents', icon: FileText, label: 'Docs' },
  { id: 'ide', icon: Code2, label: 'Code' },
  { id: 'spreadsheet', icon: Table2, label: 'Sheets' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'email', icon: Mail, label: 'Email' },
  { id: 'tasks', icon: KanbanSquare, label: 'Tasks' },
  { id: 'presentations', icon: Presentation, label: 'Slides' },
  { id: 'image', icon: Image, label: 'Image' },
  { id: 'illustrator', icon: PenTool, label: 'Illustrator' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'video', icon: Video, label: 'Video' },
  { id: 'studio3d', icon: Box, label: '3D' },
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'apistudio', icon: Beaker, label: 'API' },
  { id: 'database', icon: Database, label: 'Database' },
  { id: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 'browser', icon: Globe, label: 'Browser' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
  { id: 'comms', icon: MessageCircle, label: 'Comms' },
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

interface PersistentRightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  isStreaming?: boolean;
  orchestrationPlan?: any;
  thinkingSteps?: any[];
  agents?: any[];
  discordMessages?: any[];
  discordThreads?: any[];
  currentMode?: string;
  onOpenFullscreen?: (type: string) => void;
  onOpenBackgroundSettings?: () => void;
}

export function PersistentRightDrawer({
  isOpen,
  onToggle,
  activePage,
  onPageChange,
  isStreaming,
  orchestrationPlan,
  thinkingSteps,
  agents,
  discordMessages,
  discordThreads,
  currentMode,
  onOpenFullscreen,
  onOpenBackgroundSettings,
}: PersistentRightDrawerProps) {
  const [selectedPage, setSelectedPage] = useState<PageId | null>(null);
  const [panelWidth, setPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  // On chat page, don't show chat in right drawer — it's the main content
  const isChatPage = activePage === 'chat';

  const handleIconClick = (pageId: PageId) => {
    // If clicking the same page that's already selected, collapse
    if (selectedPage === pageId && isOpen) {
      onToggle();
      return;
    }
    
    setSelectedPage(pageId);
    if (!isOpen) onToggle();
  };

  // Resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      const newW = window.innerWidth - e.clientX - 48;
      setPanelWidth(Math.max(280, Math.min(550, newW)));
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

  // Render the content based on selected page
  const renderDrawerContent = () => {
    if (!selectedPage) return null;

    // If the selected page matches active page, show AI-context for that page
    // Otherwise show a summary widget
    if (selectedPage === 'chat' && !isChatPage) {
      return <AdvancedPersistentChat />;
    }

    return <PageSummaryWidget pageId={selectedPage} onNavigate={onPageChange} />;
  };

  return (
    <>
      {/* Expandable Panel */}
      {isOpen && selectedPage && (
        <div
          className="fixed top-11 z-30 flex flex-col border-l border-border/30"
          style={{ 
            right: 48, 
            width: panelWidth, 
            bottom: 36,
            background: `hsl(var(--background) / var(--ui-transparency, 0.5))`,
            backdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute top-0 bottom-0 left-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50',
              isResizing && 'bg-primary/50'
            )}
          />

          {/* Header */}
          <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
            {(() => {
              const item = pageIcons.find(p => p.id === selectedPage);
              const Icon = item?.icon || MessageSquare;
              return (
                <>
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">{item?.label || selectedPage}</span>
                  {selectedPage !== activePage && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto text-[10px] h-5 px-2"
                      onClick={() => onPageChange(selectedPage)}
                    >
                      Open Full
                    </Button>
                  )}
                </>
              );
            })()}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {renderDrawerContent()}
          </div>
        </div>
      )}

      {/* Side Icon Bar — page icons */}
      <div 
        className="fixed right-0 top-11 z-40 w-12 border-l border-border/30 flex flex-col items-center py-2 gap-0.5 overflow-y-auto"
        style={{ 
          bottom: 36,
          background: `hsl(var(--background) / var(--ui-transparency, 0.5))`,
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-0.5 px-1">
            {pageIcons.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedPage === item.id && isOpen;
              const isCurrentPage = activePage === item.id;
              
              // Skip chat icon on chat page since it's already the main content
              if (item.id === 'chat' && isChatPage) return null;

              return (
                <Tooltip key={item.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleIconClick(item.id)}
                      className={cn(
                        'w-9 h-9 rounded-lg transition-all duration-200 relative',
                        isSelected && 'bg-primary/15 text-primary shadow-sm',
                        isCurrentPage && !isSelected && 'text-primary/70',
                        !isSelected && !isCurrentPage && 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isSelected && "scale-110")} />
                      {isCurrentPage && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {item.label}
                    {isCurrentPage && <span className="text-primary ml-1">(active)</span>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>

        {/* Background Settings at bottom */}
        {onOpenBackgroundSettings && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenBackgroundSettings}
                className="w-9 h-9 rounded-lg mt-1 hover:bg-white/10 shrink-0"
              >
                <Palette className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Background Settings</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}

// Summary widget for each page — shows condensed info
function PageSummaryWidget({ pageId, onNavigate }: { pageId: PageId; onNavigate: (p: PageId) => void }) {
  const summaries: Partial<Record<PageId, { title: string; stats: { label: string; value: string }[]; description: string }>> = {
    orchestration: {
      title: 'Orchestration Studio',
      stats: [{ label: 'Active Chains', value: '3' }, { label: 'Templates', value: '12' }, { label: 'Runs Today', value: '8' }],
      description: 'Design, test, and deploy AI orchestration chains with visual blueprint editing.',
    },
    documents: {
      title: 'Document Builder',
      stats: [{ label: 'Documents', value: '24' }, { label: 'Recent', value: '5' }, { label: 'Shared', value: '3' }],
      description: 'AI-powered document creation, editing, and collaboration.',
    },
    ide: {
      title: 'Code IDE',
      stats: [{ label: 'Files', value: '156' }, { label: 'Open', value: '4' }, { label: 'Changes', value: '12' }],
      description: 'Full-featured code editor with AI assistance and Git integration.',
    },
    spreadsheet: {
      title: 'Spreadsheet',
      stats: [{ label: 'Sheets', value: '8' }, { label: 'Cells', value: '2.4K' }, { label: 'Formulas', value: '34' }],
      description: 'Advanced spreadsheet with AI formulas and data analysis.',
    },
    calendar: {
      title: 'Calendar',
      stats: [{ label: 'Events Today', value: '3' }, { label: 'This Week', value: '12' }, { label: 'Reminders', value: '2' }],
      description: 'Smart calendar with AI scheduling and event management.',
    },
    email: {
      title: 'Email',
      stats: [{ label: 'Inbox', value: '23' }, { label: 'Unread', value: '5' }, { label: 'Drafts', value: '2' }],
      description: 'AI-powered email with smart sorting and draft assistance.',
    },
    tasks: {
      title: 'Tasks',
      stats: [{ label: 'Active', value: '8' }, { label: 'Completed', value: '34' }, { label: 'Overdue', value: '1' }],
      description: 'Kanban task management with AI prioritization.',
    },
    presentations: {
      title: 'Presentations',
      stats: [{ label: 'Decks', value: '6' }, { label: 'Slides', value: '48' }],
      description: 'AI-assisted slide creation and presentation design.',
    },
    image: {
      title: 'Image Editor',
      stats: [{ label: 'Projects', value: '12' }, { label: 'Layers', value: '8' }],
      description: 'Professional image editing with AI-powered tools.',
    },
    terminal: {
      title: 'Terminal',
      stats: [{ label: 'Sessions', value: '2' }, { label: 'Commands', value: '156' }],
      description: 'Full terminal emulator with AI command assistance.',
    },
    notes: {
      title: 'Notes & Wiki',
      stats: [{ label: 'Notes', value: '42' }, { label: 'Tags', value: '15' }],
      description: 'Knowledge base with wiki-style linking and AI summarization.',
    },
    browser: {
      title: 'Browser',
      stats: [{ label: 'Tabs', value: '4' }, { label: 'Bookmarks', value: '23' }],
      description: 'Integrated web browser with AI reading assistance.',
    },
    files: {
      title: 'File Manager',
      stats: [{ label: 'Files', value: '256' }, { label: 'Storage', value: '1.2 GB' }],
      description: 'Virtual file system with smart organization.',
    },
  };

  const summary = summaries[pageId] || {
    title: pageId.charAt(0).toUpperCase() + pageId.slice(1),
    stats: [],
    description: 'Quick access to this workspace.',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">{summary.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{summary.description}</p>
        </div>
        
        {summary.stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {summary.stats.map(stat => (
              <div key={stat.label} className="rounded-lg border border-border/30 p-2 bg-background/30">
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => onNavigate(pageId)}
          className="w-full text-xs"
          variant="outline"
        >
          Open {summary.title}
        </Button>
      </div>
    </ScrollArea>
  );
}
