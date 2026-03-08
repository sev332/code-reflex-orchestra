// Top bar with pinned app tabs + app launcher + system status + account
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare, Zap, FileText, Code2, Image, Music, Video, Map,
  Table2, CalendarDays, Mail, KanbanSquare, MessageCircle,
  Box, LayoutDashboard, Database, Terminal, Globe, StickyNote,
  FolderOpen, Presentation, Beaker, PenTool,
  User, Settings, LogOut, Bell, Wifi, WifiOff, Activity,
  LayoutGrid,
} from 'lucide-react';
import { LucidLogo } from '@/components/ui/LucidLogo';
import { cn } from '@/lib/utils';

export type PageId =
  | 'chat' | 'orchestration' | 'documents' | 'ide' | 'image' | 'audio' | 'video' | 'map'
  | 'spreadsheet' | 'calendar' | 'email' | 'tasks'
  | 'presentations' | 'studio3d' | 'terminal' | 'apistudio' | 'database' | 'dashboard'
  | 'browser' | 'notes' | 'files' | 'comms';

const iconMap: Record<PageId, React.ComponentType<any>> = {
  chat: MessageSquare, orchestration: Zap, documents: FileText, ide: Code2,
  image: Image, audio: Music, video: Video, map: Map,
  spreadsheet: Table2, calendar: CalendarDays, email: Mail, tasks: KanbanSquare,
  presentations: Presentation, studio3d: Box, terminal: Terminal, apistudio: Beaker,
  database: Database, dashboard: LayoutDashboard, browser: Globe, notes: StickyNote,
  files: FolderOpen, comms: MessageCircle,
};

const labelMap: Record<PageId, string> = {
  chat: 'Chat', orchestration: 'Orchestration', documents: 'Docs', ide: 'Code',
  image: 'Image', audio: 'Audio', video: 'Video', map: 'Map',
  spreadsheet: 'Sheets', calendar: 'Calendar', email: 'Email', tasks: 'Tasks',
  presentations: 'Slides', studio3d: '3D', terminal: 'Term', apistudio: 'API',
  database: 'DB', dashboard: 'Dash', browser: 'Browse', notes: 'Notes',
  files: 'Files', comms: 'Comms',
};

interface PageTopBarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  systemStatus?: 'online' | 'processing' | 'offline';
  activeAgents?: number;
  pinnedApps: PageId[];
  onOpenLauncher: () => void;
  className?: string;
}

export function PageTopBar({
  activePage, onPageChange, systemStatus = 'online', activeAgents = 0,
  pinnedApps, onOpenLauncher, className,
}: PageTopBarProps) {
  const statusColors = {
    online: 'bg-emerald-500',
    processing: 'bg-amber-500 animate-pulse',
    offline: 'bg-destructive',
  };

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 h-12 bg-background/60 backdrop-blur-xl border-b border-border/30 z-50 flex items-center px-3 gap-2',
      className
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 shrink-0">
        <LucidLogo size={28} />
        <span className="font-semibold text-sm tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hidden lg:inline">
          LUCID
        </span>
      </div>

      <div className="w-px h-6 bg-border/40 shrink-0" />

      {/* App Launcher Button */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="sm"
            onClick={onOpenLauncher}
            className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 shrink-0"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">App Launcher</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border/40 shrink-0" />

      {/* Pinned App Tabs */}
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 mx-1">
        {pinnedApps.map((appId) => {
          const Icon = iconMap[appId];
          const label = labelMap[appId];
          const isActive = activePage === appId;
          if (!Icon) return null;

          return (
            <Tooltip key={appId} delayDuration={400}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onPageChange(appId)}
                  className={cn(
                    'h-8 px-2.5 gap-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10 border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isActive && 'text-primary')} />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="w-px h-6 bg-border/40 shrink-0" />

      {/* Status + Account */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className={cn('w-2 h-2 rounded-full', statusColors[systemStatus])} />
          <span className="capitalize">{systemStatus}</span>
        </div>

        {activeAgents > 0 && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-cyan-500/30 text-cyan-400 hidden md:flex">
            <Activity className="w-3 h-3 mr-1" />{activeAgents}
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="w-8 h-8 relative hover:bg-white/5">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/5">
          {systemStatus === 'offline' ? <WifiOff className="w-4 h-4 text-destructive" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/5">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 text-xs border border-cyan-500/30">U</AvatarFallback>
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
