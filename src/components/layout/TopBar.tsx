// Sleek top bar for account and general info
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Wifi, 
  WifiOff,
  Zap,
  Activity
} from 'lucide-react';
import { WisdomNetLogo } from '@/components/WisdomNET/WisdomNetLogo';
import { cn } from '@/lib/utils';

interface TopBarProps {
  systemStatus?: 'online' | 'processing' | 'offline';
  activeAgents?: number;
  memoryUsage?: string;
  className?: string;
}

export function TopBar({ 
  systemStatus = 'online', 
  activeAgents = 0,
  memoryUsage = '0%',
  className 
}: TopBarProps) {
  const statusColors = {
    online: 'bg-emerald-500',
    processing: 'bg-amber-500 animate-pulse',
    offline: 'bg-destructive'
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 h-12 bg-background/80 backdrop-blur-xl border-b border-border/50 z-50 flex items-center justify-between px-4",
      className
    )}>
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <WisdomNetLogo className="w-7 h-7" />
          <span className="font-semibold text-sm tracking-tight">WisdomNET</span>
        </div>
        
        {/* System Status */}
        <div className="flex items-center gap-2 ml-4">
          <div className={cn("w-2 h-2 rounded-full", statusColors[systemStatus])} />
          <span className="text-xs text-muted-foreground capitalize">{systemStatus}</span>
        </div>
      </div>

      {/* Center: Quick Stats */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>{activeAgents} agents</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>{memoryUsage} memory</span>
        </div>
      </div>

      {/* Right: Notifications & Account */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="w-8 h-8 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Connection Status */}
        <Button variant="ghost" size="icon" className="w-8 h-8">
          {systemStatus === 'offline' ? (
            <WifiOff className="w-4 h-4 text-destructive" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-500" />
          )}
        </Button>

        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}