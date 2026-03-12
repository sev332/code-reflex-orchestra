// Persistent right drawer: top-bar controlled AI system drawers + mini-page drawers from right app rail
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageSquare, Zap, FileText, Code2, Image, Music, Video, Map,
  Table2, CalendarDays, Mail, KanbanSquare, MessageCircle,
  Box, LayoutDashboard, Database, Terminal, Globe, StickyNote,
  FolderOpen, Presentation, PenTool, Beaker,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedPersistentChat } from '@/components/AIChat/AdvancedPersistentChat';
import { EnhancedRightDrawerPanel } from './EnhancedRightDrawerPanel';
import { VaultPanel } from './VaultPanel';
import { AIContextPanel } from './AIContextPanel';
import { WorkflowsPanel } from './WorkflowsPanel';
import type { RightDrawerType } from './RightIconBar';
import type { PageId } from './PageTopBar';
import {
  defaultPageDrawerConfig,
  DrawerPanelRouter,
  pageConfigs,
  type PageDrawerConfig,
} from './PageLeftDrawer';
import {
  RIGHT_SYSTEM_DRAWER_ITEMS,
  isEnhancedSystemDrawer,
  type RightSystemDrawerTab,
} from './right-drawer-system';

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
  { id: 'apistudio', icon: Beaker, label: 'API Studio' },
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
  activeSystemDrawer: RightSystemDrawerTab;
  onSystemDrawerChange: (drawer: RightSystemDrawerTab) => void;
  onLayoutWidthChange?: (width: number) => void;
  isStreaming?: boolean;
  orchestrationPlan?: any;
  thinkingSteps?: any[];
  agents?: any[];
  discordMessages?: any[];
  discordThreads?: any[];
  currentMode?: string;
  onOpenFullscreen?: (type: string) => void;
}

export function PersistentRightDrawer({
  isOpen,
  onToggle,
  activePage,
  onPageChange,
  activeSystemDrawer,
  onSystemDrawerChange,
  onLayoutWidthChange,
  isStreaming,
  orchestrationPlan,
  thinkingSteps,
  agents,
  discordMessages,
  discordThreads,
  currentMode,
  onOpenFullscreen,
}: PersistentRightDrawerProps) {
  const [selectedPage, setSelectedPage] = useState<PageId | null>(null);
  const [miniPageTabs, setMiniPageTabs] = useState<Partial<Record<PageId, string>>>({});
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);

  const isChatPage = activePage === 'chat';

  const hasPanelContent = Boolean(activeSystemDrawer || selectedPage);
  const showPanel = isOpen && hasPanelContent;

  const selectedPageConfig: PageDrawerConfig = useMemo(() => {
    if (!selectedPage) return defaultPageDrawerConfig;
    return pageConfigs[selectedPage] || defaultPageDrawerConfig;
  }, [selectedPage]);

  const activeMiniTab = selectedPage
    ? miniPageTabs[selectedPage] || selectedPageConfig.sideIcons[0]?.id || 'search'
    : 'search';

  const ensureMiniTab = useCallback((pageId: PageId) => {
    const config = pageConfigs[pageId] || defaultPageDrawerConfig;
    setMiniPageTabs(prev => (
      prev[pageId]
        ? prev
        : { ...prev, [pageId]: config.sideIcons[0]?.id || 'search' }
    ));
  }, []);

  const pageIdSet = useMemo(() => new Set(pageIcons.map(item => item.id)), []);

  const handlePageIconClick = (pageId: PageId) => {
    onSystemDrawerChange(null);
    ensureMiniTab(pageId);

    if (!activeSystemDrawer && selectedPage === pageId && showPanel) {
      onToggle();
      return;
    }

    setSelectedPage(pageId);
    if (!isOpen) onToggle();
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const move = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX - 48;
      setPanelWidth(Math.max(300, Math.min(620, newWidth)));
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

  useEffect(() => {
    if (activeSystemDrawer && !isOpen) {
      onToggle();
    }
  }, [activeSystemDrawer, isOpen, onToggle]);

  useEffect(() => {
    if (isChatPage && activeSystemDrawer === 'chat') {
      onSystemDrawerChange(null);
    }
  }, [activeSystemDrawer, isChatPage, onSystemDrawerChange]);

  useEffect(() => {
    const occupiedWidth = 48 + (showPanel ? panelWidth : 0);
    onLayoutWidthChange?.(occupiedWidth);
  }, [showPanel, panelWidth, onLayoutWidthChange]);

  const activeSystemMeta = activeSystemDrawer
    ? RIGHT_SYSTEM_DRAWER_ITEMS.find(item => item.id === activeSystemDrawer)
    : null;

  const activePageMeta = selectedPage
    ? pageIcons.find(item => item.id === selectedPage)
    : null;

  const headerIcon = activeSystemMeta?.icon || activePageMeta?.icon || MessageSquare;
  const headerLabel = activeSystemMeta?.label || activePageMeta?.label || 'Drawer';
  const HeaderIcon = headerIcon;

  const renderSystemPanel = () => {
    if (!activeSystemDrawer) return null;

    if (activeSystemDrawer === 'chat') return <AdvancedPersistentChat />;
    if (activeSystemDrawer === 'context') return <AIContextPanel />;
    if (activeSystemDrawer === 'workflows') {
      return (
        <WorkflowsPanel
          onNavigate={(appId) => {
            if (pageIdSet.has(appId as PageId)) {
              onPageChange(appId as PageId);
            }
          }}
        />
      );
    }
    if (activeSystemDrawer === 'vault') return <VaultPanel />;

    if (isEnhancedSystemDrawer(activeSystemDrawer)) {
      return (
        <EnhancedRightDrawerPanel
          activeDrawer={activeSystemDrawer as RightDrawerType}
          onClose={() => onSystemDrawerChange(null)}
          onOpenFullscreen={onOpenFullscreen}
          isStreaming={isStreaming}
          orchestrationPlan={orchestrationPlan}
          thinkingSteps={thinkingSteps}
          agents={agents}
          discordMessages={discordMessages}
          discordThreads={discordThreads}
          currentMode={currentMode}
          className="h-full"
        />
      );
    }

    return null;
  };

  return (
    <>
      {showPanel && (
        <div
          className="fixed top-11 z-40 flex flex-col border-l border-border/30"
          style={{
            right: 48,
            width: panelWidth,
            bottom: 36,
            background: 'hsl(var(--background) / var(--ui-transparency, 0.5))',
            backdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute top-0 bottom-0 left-0 w-1 cursor-col-resize transition-colors hover:bg-primary/40',
              isResizing && 'bg-primary/40',
            )}
          />

          <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2 shrink-0">
            <HeaderIcon className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">{headerLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto w-6 h-6"
              onClick={onToggle}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeSystemDrawer ? (
              renderSystemPanel()
            ) : selectedPage ? (
              <MiniPageDrawer
                page={selectedPage}
                config={selectedPageConfig}
                activeTab={activeMiniTab}
                onTabChange={(tab) => {
                  setMiniPageTabs(prev => ({ ...prev, [selectedPage]: tab }));
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      <div
        className="fixed right-0 top-11 z-40 w-12 border-l border-border/30"
        style={{
          bottom: 36,
          background: 'hsl(var(--background) / var(--ui-transparency, 0.5))',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col items-center py-2 gap-0.5 px-1">
            {pageIcons.map((item) => {
              if (item.id === 'chat' && isChatPage) return null;

              const Icon = item.icon;
              const isSelected = !activeSystemDrawer && selectedPage === item.id && showPanel;
              const isCurrentPage = activePage === item.id;

              return (
                <Tooltip key={item.id} delayDuration={250}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageIconClick(item.id)}
                      className={cn(
                        'w-9 h-9 rounded-lg transition-all duration-200 relative',
                        isSelected && 'bg-primary/15 text-primary',
                        !isSelected && isCurrentPage && 'text-primary/70',
                        !isSelected && !isCurrentPage && 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
                      )}
                    >
                      <Icon className={cn('w-4 h-4', isSelected && 'scale-110')} />
                      {isCurrentPage && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

function MiniPageDrawer({
  page,
  config,
  activeTab,
  onTabChange,
}: {
  page: PageId;
  config: PageDrawerConfig;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const sideIcons = config.sideIcons.length ? config.sideIcons : defaultPageDrawerConfig.sideIcons;
  const safeTab = activeTab || sideIcons[0]?.id || 'search';

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="border-b border-border/30 shrink-0">
        <div className="px-2 py-2 flex items-center gap-1 min-w-max">
          {sideIcons.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = safeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'h-7 px-2 gap-1 rounded-md text-[10px]',
                  isActive && 'bg-primary/15 text-primary',
                )}
              >
                <TabIcon className="w-3 h-3" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex-1 overflow-hidden">
        <DrawerPanelRouter page={page} tab={safeTab} />
      </div>
    </div>
  );
}
