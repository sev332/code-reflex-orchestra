// Top bar with page navigation tabs + system status + account
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Zap,
  FileText,
  Code2,
  Image,
  Music,
  Video,
  Map,
  User,
  Settings,
  LogOut,
  Bell,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';
import { LucidLogo } from '@/components/ui/LucidLogo';
import { cn } from '@/lib/utils';

export type PageId = 'chat' | 'orchestration' | 'documents' | 'ide' | 'image' | 'audio' | 'video' | 'map';

interface PageTab {
  id: PageId;
  label: string;
  icon: React.ComponentType<any>;
  shortcut?: string;
}

const pageTabs: PageTab[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, shortcut: '⌘1' },
  { id: 'orchestration', label: 'Orchestration', icon: Zap, shortcut: '⌘2' },
  { id: 'documents', label: 'Documents', icon: FileText, shortcut: '⌘3' },
  { id: 'ide', label: 'Code IDE', icon: Code2, shortcut: '⌘4' },
  { id: 'image', label: 'Image', icon: Image, shortcut: '⌘5' },
  { id: 'audio', label: 'Audio', icon: Music, shortcut: '⌘6' },
  { id: 'video', label: 'Video', icon: Video, shortcut: '⌘7' },
  { id: 'map', label: 'Map', icon: Map, shortcut: '⌘8' },
];

interface PageTopBarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  systemStatus?: 'online' | 'processing' | 'offline';
  activeAgents?: number;
  className?: string;
}

export function PageTopBar({
  activePage,
  onPageChange,
  systemStatus = 'online',
  activeAgents = 0,
  className,
}: PageTopBarProps) {
  const statusColors = {
    online: 'bg-emerald-500',
    processing: 'bg-amber-500 animate-pulse',
    offline: 'bg-destructive',
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-12 bg-background/60 backdrop-blur-xl border-b border-border/30 z-50 flex items-center px-3 gap-2',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <LucidLogo size={28} />
        <span className="font-semibold text-sm tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hidden lg:inline">
          LUCID
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border/40 shrink-0" />

      {/* Page Tabs */}
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 mx-1">
        {pageTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id;

          return (
            <Tooltip key={tab.id} delayDuration={400}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(tab.id)}
                  className={cn(
                    'h-8 px-2.5 gap-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10 border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isActive && 'text-primary')} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tab.label}
                {tab.shortcut && (
                  <kbd className="ml-2 px-1 py-0.5 text-[10px] bg-muted rounded">
                    {tab.shortcut}
                  </kbd>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="w-px h-6 bg-border/40 shrink-0" />

      {/* Status + Account */}
      <div className="flex items-center gap-2 shrink-0">
        {/* System Status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className={cn('w-2 h-2 rounded-full', statusColors[systemStatus])} />
          <span className="capitalize">{systemStatus}</span>
        </div>

        {activeAgents > 0 && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-cyan-500/30 text-cyan-400 hidden md:flex">
            <Activity className="w-3 h-3 mr-1" />
            {activeAgents}
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="w-8 h-8 relative hover:bg-white/5">
          <Bell className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/5">
          {systemStatus === 'offline' ? (
            <WifiOff className="w-4 h-4 text-destructive" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/5">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 text-xs border border-cyan-500/30">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="w-4 h-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 mr-2" />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
