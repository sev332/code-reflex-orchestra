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
  Sparkles,
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
}> = [
  { id: 'thinking', icon: Brain, label: 'Live Thinking', badge: 'streaming' },
  { id: 'discord', icon: MessageCircle, label: 'Agent Discord', badge: 'messages' },
  { id: 'agents', icon: Users, label: 'Active Agents', badge: 'agents' },
  { id: 'memory', icon: Database, label: 'Memory Systems' },
  { id: 'context', icon: Eye, label: 'Context Analysis' },
  { id: 'reasoning', icon: GitBranch, label: 'Reasoning Chains' },
  { id: 'analytics', icon: Activity, label: 'Analytics' },
  { id: 'processing', icon: Cpu, label: 'Processing' },
  { id: 'network', icon: Network, label: 'Network' },
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

  return (
    <div className={cn(
      "fixed right-0 top-12 bottom-0 w-12 bg-background/80 backdrop-blur-xl border-l border-border/50 z-40 flex flex-col items-center py-3 gap-1",
      className
    )}>
      {iconBarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeDrawer === item.id;
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
                    "w-10 h-10 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10 text-primary shadow-sm",
                    item.badge === 'streaming' && isStreaming && "animate-pulse"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive && "scale-110",
                    item.badge === 'streaming' && isStreaming && "text-amber-500"
                  )} />
                </Button>
                {badgeValue && (
                  <Badge 
                    className={cn(
                      "absolute -top-1 -right-1 px-1.5 py-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center",
                      item.badge === 'streaming' ? "bg-amber-500 text-white animate-pulse" : "bg-primary"
                    )}
                  >
                    {badgeValue}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}