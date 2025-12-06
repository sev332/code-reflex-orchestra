// Right icon bar for AI systems (Thinking, Agent Discord, Memory, etc.)
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  Users, 
  Database,
  Activity,
  Eye,
  GitBranch,
  Cpu,
  Network,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type RightDrawerType = 'thinking' | 'discord' | 'memory' | 'agents' | 'analytics' | 'context' | 'reasoning' | 'processing' | 'network' | null;

interface RightIconBarProps {
  activeDrawer: RightDrawerType;
  onDrawerChange: (drawer: RightDrawerType) => void;
  isStreaming?: boolean;
  newMessages?: number;
  activeAgents?: number;
  className?: string;
}

const iconBarItems: Array<{
  id: RightDrawerType;
  icon: React.ComponentType<any>;
  label: string;
  badge?: 'streaming' | 'messages' | 'agents';
  activeColor?: string;
}> = [
  { id: 'thinking', icon: Brain, label: 'Live Thinking', badge: 'streaming', activeColor: 'text-amber-500' },
  { id: 'discord', icon: MessageCircle, label: 'Agent Discord', badge: 'messages', activeColor: 'text-purple-500' },
  { id: 'agents', icon: Users, label: 'Active Agents', badge: 'agents', activeColor: 'text-cyan-500' },
  { id: 'memory', icon: Database, label: 'Memory Systems', activeColor: 'text-emerald-500' },
  { id: 'context', icon: Eye, label: 'Context Analysis', activeColor: 'text-blue-500' },
  { id: 'reasoning', icon: GitBranch, label: 'Reasoning Chains', activeColor: 'text-orange-500' },
  { id: 'analytics', icon: Activity, label: 'Analytics', activeColor: 'text-pink-500' },
  { id: 'processing', icon: Cpu, label: 'Processing', activeColor: 'text-red-500' },
  { id: 'network', icon: Network, label: 'Network', activeColor: 'text-indigo-500' },
];

export function RightIconBar({ 
  activeDrawer, 
  onDrawerChange, 
  isStreaming,
  newMessages = 0,
  activeAgents = 0,
  className 
}: RightIconBarProps) {
  const getBadgeValue = (badge?: string) => {
    if (badge === 'streaming' && isStreaming) return '●';
    if (badge === 'messages' && newMessages > 0) return newMessages > 9 ? '9+' : newMessages;
    if (badge === 'agents' && activeAgents > 0) return activeAgents;
    return null;
  };

  const isItemActive = (item: typeof iconBarItems[0]) => {
    if (item.badge === 'streaming' && isStreaming) return true;
    if (item.badge === 'messages' && newMessages > 0) return true;
    if (item.badge === 'agents' && activeAgents > 0) return true;
    return false;
  };

  return (
    <div className={cn(
      "fixed right-0 top-12 bottom-0 w-12 bg-background/60 backdrop-blur-xl border-l border-border/30 z-40 flex flex-col items-center py-3 gap-1",
      className
    )}>
      {iconBarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeDrawer === item.id;
        const hasActivity = isItemActive(item);
        const badgeValue = getBadgeValue(item.badge);
        
        return (
          <Tooltip key={item.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDrawerChange(isActive ? null : item.id)}
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive && "bg-white/10 shadow-lg",
                    hasActivity && !isActive && "bg-white/5"
                  )}
                >
                  {/* Glow effect when active or has activity */}
                  {(isActive || hasActivity) && (
                    <div 
                      className={cn(
                        "absolute inset-0 opacity-20 blur-md",
                        item.activeColor?.replace('text-', 'bg-') || 'bg-primary'
                      )} 
                    />
                  )}
                  
                  <Icon className={cn(
                    "w-5 h-5 relative z-10 transition-all duration-300",
                    isActive && cn("scale-110", item.activeColor),
                    hasActivity && !isActive && cn(item.activeColor, "animate-pulse"),
                    !isActive && !hasActivity && "text-muted-foreground"
                  )} />
                </Button>
                
                {/* Activity ring */}
                {hasActivity && (
                  <div className={cn(
                    "absolute inset-0 rounded-xl border-2 animate-pulse pointer-events-none",
                    item.id === 'thinking' && "border-amber-500/50",
                    item.id === 'discord' && "border-purple-500/50",
                    item.id === 'agents' && "border-cyan-500/50"
                  )} />
                )}
                
                {badgeValue && (
                  <Badge 
                    className={cn(
                      "absolute -top-1 -right-1 px-1.5 py-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center border-0",
                      item.badge === 'streaming' && "bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/50",
                      item.badge === 'messages' && "bg-purple-500 text-white shadow-lg shadow-purple-500/50",
                      item.badge === 'agents' && "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                    )}
                  >
                    {badgeValue}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-background/95 backdrop-blur-xl border-border/50">
              <div className="flex items-center gap-2">
                <span>{item.label}</span>
                {hasActivity && (
                  <span className={cn("text-xs", item.activeColor)}>Active</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
