// Top bar with all apps grouped by category, icons only
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
  FolderOpen, Presentation, Beaker, PenTool, Settings,
  User, LogOut, Bell, Wifi, WifiOff, Activity, Command,
} from 'lucide-react';
import { LucidLogo } from '@/components/ui/LucidLogo';
import { cn } from '@/lib/utils';
import { RIGHT_SYSTEM_DRAWER_ITEMS, type RightSystemDrawerTab } from './right-drawer-system';

export type PageId =
  | 'chat' | 'orchestration' | 'documents' | 'ide' | 'image' | 'audio' | 'video' | 'map'
  | 'spreadsheet' | 'calendar' | 'email' | 'tasks'
  | 'presentations' | 'studio3d' | 'terminal' | 'apistudio' | 'database' | 'dashboard'
  | 'browser' | 'notes' | 'files' | 'comms' | 'illustrator' | 'settings';

const iconMap: Record<PageId, React.ComponentType<any>> = {
  chat: MessageSquare, orchestration: Zap, documents: FileText, ide: Code2,
  image: Image, audio: Music, video: Video, map: Map,
  spreadsheet: Table2, calendar: CalendarDays, email: Mail, tasks: KanbanSquare,
  presentations: Presentation, studio3d: Box, terminal: Terminal, apistudio: Beaker,
  database: Database, dashboard: LayoutDashboard, browser: Globe, notes: StickyNote,
  files: FolderOpen, comms: MessageCircle, illustrator: PenTool, settings: Settings,
};

const labelMap: Record<PageId, string> = {
  chat: 'Chat', orchestration: 'Orchestration', documents: 'Docs', ide: 'Code',
  image: 'Image', audio: 'Audio', video: 'Video', map: 'Map',
  spreadsheet: 'Sheets', calendar: 'Calendar', email: 'Email', tasks: 'Tasks',
  presentations: 'Slides', studio3d: '3D', terminal: 'Terminal', apistudio: 'API Studio',
  database: 'Database', dashboard: 'Dashboard', browser: 'Browser', notes: 'Notes',
  files: 'Files', comms: 'Comms', illustrator: 'Illustrator', settings: 'Settings',
};

// Grouped app categories
const appGroups: { label: string; apps: PageId[] }[] = [
  { label: 'AI', apps: ['chat', 'orchestration'] },
  { label: 'Productivity', apps: ['documents', 'spreadsheet', 'calendar', 'email', 'tasks', 'presentations'] },
  { label: 'Creative', apps: ['image', 'illustrator', 'audio', 'video', 'studio3d', 'map'] },
  { label: 'Dev', apps: ['ide', 'terminal', 'apistudio', 'database', 'dashboard'] },
  { label: 'System', apps: ['browser', 'notes', 'files', 'comms'] },
];

interface PageTopBarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  systemStatus?: 'online' | 'processing' | 'offline';
  activeAgents?: number;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  unreadNotifications?: number;
  pinnedApps?: PageId[];
  onOpenLauncher?: () => void;
  activeSystemDrawer?: RightSystemDrawerTab;
  onSystemDrawerChange?: (drawer: RightSystemDrawerTab) => void;
  className?: string;
}

export function PageTopBar({
  activePage, onPageChange, systemStatus = 'online', activeAgents = 0,
  onOpenNotifications, onOpenCommandPalette, unreadNotifications = 0,
  activeSystemDrawer = null, onSystemDrawerChange,
  className,
}: PageTopBarProps) {
  const statusColors = {
    online: 'bg-emerald-500',
    processing: 'bg-amber-500 animate-pulse',
    offline: 'bg-destructive',
  };

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 h-11 border-b border-border/30 z-50 flex items-center px-3 gap-1.5',
      className
    )} style={{
      background: `hsl(var(--background) / var(--ui-transparency, 0.5))`,
      backdropFilter: 'blur(24px) saturate(180%)',
    }}>
      {/* Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <LucidLogo size={26} />
        <span className="font-semibold text-xs tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hidden lg:inline">
          LUCID
        </span>
      </div>

      <div className="w-px h-5 bg-border/40 shrink-0 mx-1" />

      {/* All Apps Grouped */}
      <nav className="flex items-center flex-1 overflow-x-auto scrollbar-none">
        {appGroups.map((group, gi) => (
          <React.Fragment key={group.label}>
            {gi > 0 && <div className="w-2.5 shrink-0" />}
            <div className="flex items-center gap-0.5">
              {group.apps.map((appId) => {
                const Icon = iconMap[appId];
                const isActive = activePage === appId;
                if (!Icon) return null;
                return (
                  <Tooltip key={appId} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onPageChange(appId)}
                        className={cn(
                          'w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0',
                          isActive
                            ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/25'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">{labelMap[appId]}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </React.Fragment>
        ))}

          {onSystemDrawerChange && (
            <>
              <div className="w-px h-4 bg-border/40 shrink-0 mx-2" />
              <div className="flex items-center gap-0.5 pr-2">
                {RIGHT_SYSTEM_DRAWER_ITEMS.map((drawer) => {
                  if (drawer.id === 'chat' && activePage === 'chat') return null;
                  const Icon = drawer.icon;
                  const isActive = activeSystemDrawer === drawer.id;

                  return (
                    <Tooltip key={drawer.id} delayDuration={250}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onSystemDrawerChange(isActive ? null : drawer.id)}
                          className={cn(
                            'w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 shrink-0',
                            isActive
                              ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/25'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{drawer.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </>
          )}
        </nav>

      <div className="w-px h-5 bg-border/40 shrink-0 mx-1" />

      {/* Status + Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Command Palette trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5" onClick={onOpenCommandPalette}>
              <Command className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Command Palette (⌘K)</TooltipContent>
        </Tooltip>

        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <div className={cn('w-1.5 h-1.5 rounded-full', statusColors[systemStatus])} />
        </div>

        {activeAgents > 0 && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-cyan-500/30 text-cyan-400 hidden md:flex">
            <Activity className="w-3 h-3 mr-0.5" />{activeAgents}
          </Badge>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="w-7 h-7 relative hover:bg-white/5" onClick={onOpenNotifications}>
          <Bell className="w-3.5 h-3.5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center font-bold">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5">
          {systemStatus === 'offline' ? <WifiOff className="w-3.5 h-3.5 text-destructive" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
        </Button>

        {/* Settings shortcut */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5" onClick={() => onPageChange('settings' as PageId)}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 text-[10px] border border-cyan-500/30">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="w-4 h-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPageChange('settings' as PageId)}><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 mr-2" />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
