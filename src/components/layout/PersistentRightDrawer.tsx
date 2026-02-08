// Persistent right drawer: Side icon bar (always visible) + expandable panel with AI Chat & transparency systems
import React, { useState, useCallback, useEffect } from 'react';
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
  Activity,
  GitBranch,
  Cpu,
  Network,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedPersistentChat } from '@/components/AIChat/AdvancedPersistentChat';
import { EnhancedRightDrawerPanel } from './EnhancedRightDrawerPanel';

export type RightTab = 'chat' | 'thinking' | 'discord' | 'agents' | 'memory' | 'context' | 'reasoning' | 'analytics' | 'processing' | 'network';

interface IconDef {
  id: RightTab;
  icon: React.ComponentType<any>;
  label: string;
  activeColor?: string;
  badge?: 'streaming' | 'messages' | 'agents';
}

const rightIcons: IconDef[] = [
  { id: 'chat', icon: MessageSquare, label: 'AI Chat', activeColor: 'text-cyan-400' },
  { id: 'thinking', icon: Brain, label: 'Live Thinking', activeColor: 'text-amber-500', badge: 'streaming' },
  { id: 'discord', icon: MessageCircle, label: 'Agent Discord', activeColor: 'text-purple-500', badge: 'messages' },
  { id: 'agents', icon: Users, label: 'Active Agents', activeColor: 'text-cyan-500', badge: 'agents' },
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
  const [panelWidth, setPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const getBadgeValue = (badge?: string) => {
    if (badge === 'streaming' && isStreaming) return '●';
    if (badge === 'messages' && (discordMessages?.length || 0) > 0) return discordMessages!.length > 9 ? '9+' : discordMessages!.length;
    if (badge === 'agents' && agents?.some((a: any) => a.status === 'active' || a.status === 'ACTIVE')) return agents!.filter((a: any) => a.status === 'active' || a.status === 'ACTIVE').length;
    return null;
  };

  const hasActivity = (item: IconDef) => {
    if (item.badge === 'streaming' && isStreaming) return true;
    if (item.badge === 'messages' && (discordMessages?.length || 0) > 0) return true;
    if (item.badge === 'agents' && agents?.some((a: any) => a.status === 'active' || a.status === 'ACTIVE')) return true;
    return false;
  };

  const handleIconClick = (id: RightTab) => {
    if (activeTab === id && isOpen) {
      onToggle(); // collapse
    } else {
      setActiveTab(id);
      if (!isOpen) onToggle();
    }
  };

  // Resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      const newW = window.innerWidth - e.clientX - 48; // subtract icon bar
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

  const transparencyDrawerType = activeTab === 'chat' ? null : activeTab;

  return (
    <>
      {/* Expandable Panel — opens beside icon bar */}
      {isOpen && (
        <div
          className="fixed top-12 bottom-0 z-30 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/30"
          style={{ right: 48, width: panelWidth }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute top-0 bottom-0 left-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50',
              isResizing && 'bg-primary/50'
            )}
          />

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
                width={panelWidth}
                onWidthChange={setPanelWidth}
              />
            )}
          </div>
        </div>
      )}

      {/* Side Icon Bar — always on the right edge */}
      <div className="fixed right-0 top-12 bottom-0 w-12 bg-background/80 backdrop-blur-xl border-l border-border/50 z-40 flex flex-col items-center py-3 gap-1">
        {rightIcons.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && isOpen;
          const active = hasActivity(item);
          const badgeValue = getBadgeValue(item.badge);

          return (
            <Tooltip key={item.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleIconClick(item.id)}
                    className={cn(
                      'w-10 h-10 rounded-xl transition-all duration-300 relative overflow-hidden',
                      isActive && 'bg-white/10 shadow-lg',
                      active && !isActive && 'bg-white/5'
                    )}
                  >
                    {(isActive || active) && (
                      <div className={cn(
                        'absolute inset-0 opacity-20 blur-md',
                        item.activeColor?.replace('text-', 'bg-') || 'bg-primary'
                      )} />
                    )}
                    <Icon className={cn(
                      'w-5 h-5 relative z-10 transition-all duration-300',
                      isActive && cn('scale-110', item.activeColor),
                      active && !isActive && cn(item.activeColor, 'animate-pulse'),
                      !isActive && !active && 'text-muted-foreground'
                    )} />
                  </Button>

                  {active && (
                    <div className={cn(
                      'absolute inset-0 rounded-xl border-2 animate-pulse pointer-events-none',
                      item.id === 'thinking' && 'border-amber-500/50',
                      item.id === 'discord' && 'border-purple-500/50',
                      item.id === 'agents' && 'border-cyan-500/50'
                    )} />
                  )}

                  {badgeValue && (
                    <Badge className={cn(
                      'absolute -top-1 -right-1 px-1.5 py-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center border-0',
                      item.badge === 'streaming' && 'bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/50',
                      item.badge === 'messages' && 'bg-purple-500 text-white shadow-lg shadow-purple-500/50',
                      item.badge === 'agents' && 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                    )}>
                      {badgeValue}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-background/95 backdrop-blur-xl border-border/50">
                <div className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {active && <span className={cn('text-xs', item.activeColor)}>Active</span>}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="flex-1" />

        {onOpenBackgroundSettings && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenBackgroundSettings}
                className="w-10 h-10 rounded-xl transition-all duration-300 hover:bg-white/10"
              >
                <Palette className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Background Settings</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}
