// Sleek top bar for account and general info
import React from 'react';
import { Button } from '@/components/ui/button';
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
import { LucidLogo } from '@/components/ui/LucidLogo';
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
      "fixed top-0 left-0 right-0 h-12 bg-background/60 backdrop-blur-xl border-b border-border/30 z-50 flex items-center justify-between px-4",
      className
    )}>
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <LucidLogo size={32} />
          <span className="font-semibold text-sm tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LUCID
          </span>
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
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>{activeAgents} agents</span>
        </div>
        <div className="w-px h-4 bg-border/50" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{memoryUsage} memory</span>
        </div>
      </div>

      {/* Right: Notifications & Account */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="w-8 h-8 relative hover:bg-white/5">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 text-white text-[10px] rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Connection Status */}
        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/5">
          {systemStatus === 'offline' ? (
            <WifiOff className="w-4 h-4 text-destructive" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400" />
          )}
        </Button>

        {/* Account Dropdown */}
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
