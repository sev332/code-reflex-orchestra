// Left icon bar for user-focused tools
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileText, 
  FolderKanban, 
  BookOpen,
  Search,
  Clock,
  Star,
  Settings,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LeftDrawerType = 'documents' | 'projects' | 'orchestration' | 'library' | 'search' | 'history' | 'favorites' | 'settings' | 'builder' | 'dream' | 'code-builder' | null;

const iconBarItems = [
  { id: 'chat' as const, icon: MessageSquare, label: 'AI Chat', shortcut: '⌘1' },
  { id: 'documents' as const, icon: FileText, label: 'Document Storage', shortcut: '⌘2' },
  { id: 'projects' as const, icon: FolderKanban, label: 'Projects', shortcut: '⌘3' },
  { id: 'library' as const, icon: BookOpen, label: 'Knowledge Library', shortcut: '⌘4' },
  { id: 'search' as const, icon: Search, label: 'Search', shortcut: '⌘K' },
  { id: 'history' as const, icon: Clock, label: 'History', shortcut: '⌘H' },
  { id: 'favorites' as const, icon: Star, label: 'Favorites', shortcut: '⌘F' },
];

interface LeftIconBarProps {
  activeDrawer: LeftDrawerType;
  onDrawerChange: (drawer: LeftDrawerType) => void;
  className?: string;
}

export function LeftIconBar({ activeDrawer, onDrawerChange, className }: LeftIconBarProps) {
  return (
    <div className={cn(
      "fixed left-0 top-12 bottom-0 w-12 bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 flex flex-col items-center py-3 gap-1",
      className
    )}>
      {/* Main Tools */}
      <div className="flex flex-col items-center gap-1">
        {iconBarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeDrawer === item.id || (item.id === 'chat' && activeDrawer === null);
          
          return (
            <Tooltip key={item.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDrawerChange(item.id === 'chat' ? null : item.id)}
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10 text-primary shadow-sm"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{item.label}</span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{item.shortcut}</kbd>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings at bottom */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDrawerChange('settings')}
            className={cn(
              "w-10 h-10 rounded-xl transition-all duration-200",
              activeDrawer === 'settings' && "bg-primary/10 text-primary"
            )}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>
    </div>
  );
}
