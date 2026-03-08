// Persistent Bottom Dock: Time, Process, History, and Becoming
// Canon Section 11 — The home of temporal continuity
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  History, Terminal, Activity, GitBranch, Layers,
  ChevronUp, ChevronDown, Play, Pause, Clock,
  AlertCircle, CheckCircle2, Loader2, Cpu,
  RotateCcw, RotateCw, Timer, Workflow,
  ListChecks, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

type DockTab = 'history' | 'terminal' | 'processes' | 'activity' | 'versions';

interface BottomDockProps {
  activePage: PageId;
  leftWidth: number;
  rightWidth: number;
}

// Page-specific extra tabs
const pageExtraTabs: Partial<Record<PageId, { id: DockTab; icon: React.ComponentType<any>; label: string }[]>> = {
  ide: [{ id: 'terminal' as DockTab, icon: Terminal, label: 'Terminal' }],
};

const globalTabs: { id: DockTab; icon: React.ComponentType<any>; label: string }[] = [
  { id: 'history', icon: History, label: 'History' },
  { id: 'processes', icon: Cpu, label: 'Processes' },
  { id: 'activity', icon: Activity, label: 'Activity' },
  { id: 'versions', icon: GitBranch, label: 'Versions' },
];

// Mock data
const mockHistory = [
  { id: '1', action: 'Opened Chat workspace', time: '2m ago', icon: Sparkles },
  { id: '2', action: 'Sent message to AI assistant', time: '5m ago', icon: Sparkles },
  { id: '3', action: 'Navigated to Documents', time: '8m ago', icon: History },
  { id: '4', action: 'Created new document', time: '12m ago', icon: CheckCircle2 },
  { id: '5', action: 'Modified Vault entry', time: '15m ago', icon: History },
];

const mockProcesses = [
  { id: '1', name: 'AI Context Indexing', status: 'running', progress: 67 },
  { id: '2', name: 'Memory Consolidation', status: 'running', progress: 34 },
  { id: '3', name: 'Background Agent Sync', status: 'idle', progress: 100 },
];

const mockActivity = [
  { id: '1', event: 'Agent Alpha completed task', time: '1m ago', severity: 'info' as const },
  { id: '2', event: 'Memory tier promoted 3 entries', time: '3m ago', severity: 'info' as const },
  { id: '3', event: 'API rate limit warning', time: '7m ago', severity: 'warning' as const },
];

export function BottomDock({ activePage, leftWidth, rightWidth }: BottomDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>('history');
  const [dockHeight, setDockHeight] = useState(200);

  const tabs = [
    ...globalTabs,
    ...(pageExtraTabs[activePage] || []),
  ];

  const toggleExpand = useCallback(() => {
    setIsExpanded(v => !v);
  }, []);

  return (
    <>
      {/* Collapsed bar — always visible */}
      <div
        className="fixed bottom-0 z-30 h-8 bg-background/90 backdrop-blur-xl border-t border-border/40 flex items-center px-2 gap-1 transition-all duration-300"
        style={{ left: leftWidth, right: rightWidth }}
      >
        {/* Expand toggle */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="w-6 h-6 rounded-md"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{isExpanded ? 'Collapse' : 'Expand'} Dock</TooltipContent>
        </Tooltip>

        {/* Tab buttons */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => { setActiveTab(tab.id); if (!isExpanded) setIsExpanded(true); }}
                className={cn(
                  'h-6 px-2 text-xs rounded-md gap-1',
                  isActive && isExpanded && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Quick status indicators */}
        <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">2 processes</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Undo</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCw className="w-3 h-3" />
            <span className="hidden md:inline">Redo</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span className="hidden lg:inline">Session: 24m</span>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          className="fixed bottom-8 z-29 bg-background/95 backdrop-blur-xl border-t border-border/40 transition-all duration-300"
          style={{ left: leftWidth, right: rightWidth, height: dockHeight }}
        >
          <ScrollArea className="h-full">
            <div className="p-3">
              {activeTab === 'history' && <HistoryPanel />}
              {activeTab === 'processes' && <ProcessesPanel />}
              {activeTab === 'activity' && <ActivityPanel />}
              {activeTab === 'versions' && <VersionsPanel />}
              {activeTab === 'terminal' && <TerminalMiniPanel />}
            </div>
          </ScrollArea>
        </div>
      )}
    </>
  );
}

function HistoryPanel() {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <History className="w-3 h-3" /> Action History
      </div>
      {mockHistory.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 text-xs group cursor-pointer">
            <Icon className="w-3 h-3 text-muted-foreground" />
            <span className="flex-1 truncate">{item.action}</span>
            <span className="text-muted-foreground shrink-0">{item.time}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProcessesPanel() {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Cpu className="w-3 h-3" /> Background Processes
      </div>
      {mockProcesses.map(proc => (
        <div key={proc.id} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent/50 text-xs">
          {proc.status === 'running' ? (
            <Loader2 className="w-3 h-3 text-primary animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          )}
          <span className="flex-1 truncate">{proc.name}</span>
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', proc.status === 'running' ? 'bg-primary' : 'bg-emerald-500')}
              style={{ width: `${proc.progress}%` }}
            />
          </div>
          <span className="text-muted-foreground w-8 text-right">{proc.progress}%</span>
        </div>
      ))}
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Activity className="w-3 h-3" /> System Activity
      </div>
      {mockActivity.map(item => (
        <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 text-xs">
          {item.severity === 'warning' ? (
            <AlertCircle className="w-3 h-3 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          )}
          <span className="flex-1 truncate">{item.event}</span>
          <span className="text-muted-foreground shrink-0">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

function VersionsPanel() {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <GitBranch className="w-3 h-3" /> Version History
      </div>
      <div className="text-xs text-muted-foreground px-2 py-4 text-center">
        Version tracking will appear here as you work.
      </div>
    </div>
  );
}

function TerminalMiniPanel() {
  return (
    <div className="font-mono text-xs">
      <div className="text-muted-foreground mb-1 flex items-center gap-1">
        <Terminal className="w-3 h-3" /> Mini Terminal
      </div>
      <div className="bg-black/40 rounded-md p-2 text-emerald-400 min-h-[100px]">
        <div>$ lucid --status</div>
        <div className="text-muted-foreground">All systems operational. 2 agents active.</div>
        <div className="mt-1 flex items-center gap-1">
          <span>$</span>
          <span className="animate-pulse">▌</span>
        </div>
      </div>
    </div>
  );
}
