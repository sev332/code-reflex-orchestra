// Persistent right drawer — always present on every page
// Contains: AI Chat (primary) + Thinking, Agents, Discord, Context, Memory tabs
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageSquare,
  Brain,
  Users,
  MessageCircle,
  Eye,
  Database,
  PanelRightClose,
  PanelRightOpen,
  Activity,
  GitBranch,
  Cpu,
  Network,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedPersistentChat } from '@/components/AIChat/AdvancedPersistentChat';

export type RightTab = 'chat' | 'thinking' | 'discord' | 'agents' | 'memory' | 'context' | 'reasoning' | 'analytics' | 'processing' | 'network';

interface TabDef {
  id: RightTab;
  icon: React.ComponentType<any>;
  label: string;
  activeColor?: string;
}

const rightTabs: TabDef[] = [
  { id: 'chat', icon: MessageSquare, label: 'AI Chat', activeColor: 'text-cyan-400' },
  { id: 'thinking', icon: Brain, label: 'Thinking', activeColor: 'text-amber-500' },
  { id: 'discord', icon: MessageCircle, label: 'Discord', activeColor: 'text-purple-500' },
  { id: 'agents', icon: Users, label: 'Agents', activeColor: 'text-cyan-500' },
  { id: 'memory', icon: Database, label: 'Memory', activeColor: 'text-emerald-500' },
  { id: 'context', icon: Eye, label: 'Context', activeColor: 'text-blue-500' },
  { id: 'reasoning', icon: GitBranch, label: 'Reasoning', activeColor: 'text-orange-500' },
  { id: 'analytics', icon: Activity, label: 'Analytics', activeColor: 'text-pink-500' },
  { id: 'processing', icon: Cpu, label: 'Processing', activeColor: 'text-red-500' },
  { id: 'network', icon: Network, label: 'Network', activeColor: 'text-indigo-500' },
];

interface PersistentRightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
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

// Lazy-import the transparency panels from the existing EnhancedRightDrawerPanel
// We'll render them inline based on active tab
import { EnhancedRightDrawerPanel } from './EnhancedRightDrawerPanel';

export function PersistentRightDrawer({
  isOpen,
  onToggle,
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
  const [activeTab, setActiveTab] = useState<RightTab>('chat');
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 320;
  const maxWidth = 600;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      const newW = window.innerWidth - e.clientX;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newW)));
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

  // Collapse button (always visible)
  if (!isOpen) {
    return (
      <div className="fixed right-0 top-12 bottom-0 w-10 bg-background/60 backdrop-blur-xl border-l border-border/30 z-40 flex flex-col items-center py-3">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggle}>
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Open AI Panel</TooltipContent>
        </Tooltip>

        {/* Minimal streaming indicator */}
        {isStreaming && (
          <div className="mt-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}

        {/* Background settings at bottom */}
        <div className="flex-1" />
        {onOpenBackgroundSettings && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onOpenBackgroundSettings}>
                <Palette className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Background</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  // Map right tab to the old RightDrawerType for re-using the transparency panels
  const transparencyDrawerType = activeTab === 'chat' ? null : activeTab;

  return (
    <div
      className="fixed right-0 top-12 bottom-0 z-40 flex bg-background/95 backdrop-blur-xl border-l border-border/30"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute top-0 bottom-0 left-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50',
          isResizing && 'bg-primary/50'
        )}
      />

      {/* Tab icon strip at top */}
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center border-b border-border/30 px-1 py-1 gap-0.5 overflow-x-auto scrollbar-none shrink-0">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasActivity =
              (tab.id === 'thinking' && isStreaming) ||
              (tab.id === 'discord' && (discordMessages?.length || 0) > 0) ||
              (tab.id === 'agents' && agents?.some((a: any) => a.status === 'active' || a.status === 'ACTIVE'));

            return (
              <Tooltip key={tab.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all shrink-0',
                      isActive && 'bg-white/10 shadow-sm',
                      hasActivity && !isActive && 'bg-white/5'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isActive && (tab.activeColor || 'text-primary'),
                        hasActivity && !isActive && cn(tab.activeColor, 'animate-pulse'),
                        !isActive && !hasActivity && 'text-muted-foreground'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tab.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          <div className="flex-1" />

          {/* Collapse */}
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={onToggle}>
            <PanelRightClose className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <AdvancedPersistentChat />
          ) : (
            <EnhancedRightDrawerPanel
              activeDrawer={transparencyDrawerType as any}
              onClose={() => setActiveTab('chat')}
              onOpenFullscreen={onOpenFullscreen}
              isStreaming={isStreaming}
              orchestrationPlan={orchestrationPlan}
              thinkingSteps={thinkingSteps}
              agents={agents}
              discordMessages={discordMessages}
              discordThreads={discordThreads}
              currentMode={currentMode}
              width={width}
              onWidthChange={setWidth}
            />
          )}
        </div>
      </div>
    </div>
  );
}
