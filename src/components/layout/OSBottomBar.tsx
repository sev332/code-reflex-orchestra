// OS Bottom Bar — Full-width system bar with Git subway map, AI status, and transparency controls
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  History, Terminal, Activity, GitBranch, Layers,
  ChevronUp, ChevronDown, Play, Pause, Clock,
  AlertCircle, CheckCircle2, Loader2, Cpu,
  RotateCcw, RotateCw, Timer, Sparkles,
  Brain, Users, MessageCircle, Database, Eye,
  Network, Settings2, SlidersHorizontal,
  GitCommitHorizontal, GitMerge, GitPullRequest,
  Circle, Dot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

type DockTab = 'git' | 'history' | 'terminal' | 'processes' | 'activity' | 'ai-systems' | 'ui-settings';

interface OSBottomBarProps {
  activePage: PageId;
  leftWidth: number;
  rightWidth: number;
  isStreaming?: boolean;
  agents?: any[];
  discordMessages?: any[];
  uiTransparency: number;
  onTransparencyChange: (v: number) => void;
}

// Git subway map mock data
const gitBranches = [
  { id: 'main', name: 'main', color: 'hsl(193 100% 50%)', commits: [
    { hash: 'a3f2c1', msg: 'Init LUCID OS', time: '3h ago', isMerge: false },
    { hash: 'b7d4e2', msg: 'Add bottom bar system', time: '2h ago', isMerge: false },
    { hash: 'c9e6f3', msg: 'Merge feature/drawers', time: '1h ago', isMerge: true },
    { hash: 'd1a8b4', msg: 'Fix layout spacing', time: '45m ago', isMerge: false },
    { hash: 'e3c0d5', msg: 'HEAD', time: 'now', isMerge: false },
  ]},
  { id: 'feature/drawers', name: 'feature/drawers', color: 'hsl(270 100% 70%)', commits: [
    { hash: 'f5e2a6', msg: 'Refactor right drawer', time: '2.5h ago', isMerge: false },
    { hash: 'g7f4b8', msg: 'Add page mini-drawers', time: '2h ago', isMerge: false },
  ]},
  { id: 'feature/ai-chat', name: 'feature/ai-chat', color: 'hsl(150 100% 60%)', commits: [
    { hash: 'h9g6c0', msg: 'Sphere send button', time: '1.5h ago', isMerge: false },
  ]},
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

const mockHistory = [
  { id: '1', action: 'Opened Chat workspace', time: '2m ago' },
  { id: '2', action: 'Sent message to AI assistant', time: '5m ago' },
  { id: '3', action: 'Navigated to Documents', time: '8m ago' },
  { id: '4', action: 'Created new document', time: '12m ago' },
];

export function OSBottomBar({ activePage, leftWidth, rightWidth, isStreaming, agents, discordMessages, uiTransparency, onTransparencyChange }: OSBottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>('git');
  const [dockHeight, setDockHeight] = useState(220);

  const toggleExpand = useCallback(() => {
    setIsExpanded(v => !v);
  }, []);

  const activeAgentCount = agents?.filter((a: any) => a.status === 'active' || a.status === 'ACTIVE').length || 0;
  const messageCount = discordMessages?.length || 0;

  const tabs: { id: DockTab; icon: React.ComponentType<any>; label: string }[] = [
    { id: 'git', icon: GitBranch, label: 'Git' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'processes', icon: Cpu, label: 'Processes' },
    { id: 'activity', icon: Activity, label: 'Activity' },
    { id: 'ai-systems', icon: Brain, label: 'AI Systems' },
    { id: 'ui-settings', icon: SlidersHorizontal, label: 'UI' },
  ];

  if (activePage === 'ide') {
    tabs.splice(1, 0, { id: 'terminal' as DockTab, icon: Terminal, label: 'Terminal' });
  }

  return (
    <>
      {/* Expanded panel */}
      {isExpanded && (
        <div
          className="fixed z-50 border-t border-border/30 transition-all duration-300"
          style={{ 
            left: 0, 
            right: 0, 
            bottom: 36, 
            height: dockHeight,
            background: `hsl(var(--background) / var(--ui-transparency, 0.5))`,
            backdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <ScrollArea className="h-full">
            <div className="p-4" style={{ marginLeft: leftWidth, marginRight: rightWidth }}>
              {activeTab === 'git' && <GitSubwayMap />}
              {activeTab === 'history' && <HistoryPanel />}
              {activeTab === 'processes' && <ProcessesPanel />}
              {activeTab === 'activity' && <ActivityPanel />}
              {activeTab === 'terminal' && <TerminalMiniPanel />}
              {activeTab === 'ai-systems' && <AISystemsPanel isStreaming={isStreaming} agents={agents} messageCount={messageCount} />}
              {activeTab === 'ui-settings' && <UISettingsPanel transparency={uiTransparency} onTransparencyChange={onTransparencyChange} />}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main bottom bar — full width */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 h-9 flex items-center border-t border-border/30"
        style={{
          background: `hsl(var(--background) / var(--ui-transparency, 0.5))`,
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        {/* Left section: expand toggle + tabs */}
        <div className="flex items-center gap-0.5 px-2">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleExpand} className="w-6 h-6 rounded-md">
                {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{isExpanded ? 'Collapse' : 'Expand'}</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border/30 mx-1" />

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
                  'h-6 px-2 text-[11px] rounded-md gap-1 font-medium',
                  isActive && isExpanded && 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Center: Mini git subway map visualization */}
        <div className="flex-1 flex items-center justify-center gap-0.5 px-4 overflow-hidden">
          <MiniGitSubway />
        </div>

        {/* Right section: AI status indicators + system info */}
        <div className="flex items-center gap-2 px-3 text-[11px] text-muted-foreground">
          {/* AI system indicators */}
          {isStreaming && (
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-amber-500 animate-pulse" />
              <span className="text-amber-400 font-medium">Thinking</span>
            </div>
          )}
          
          {activeAgentCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" />
              <span>{activeAgentCount}</span>
            </div>
          )}

          {messageCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-purple-400" />
              <span>{messageCount}</span>
            </div>
          )}

          <div className="w-px h-4 bg-border/30" />

          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">{mockProcesses.filter(p => p.status === 'running').length} running</span>
          </div>

          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span className="hidden lg:inline">Session: 24m</span>
          </div>

          <div className="flex items-center gap-1">
            <RotateCcw className="w-3 h-3 cursor-pointer hover:text-foreground transition-colors" />
            <RotateCw className="w-3 h-3 cursor-pointer hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </>
  );
}

// Mini git subway visualization for the bottom bar
function MiniGitSubway() {
  return (
    <div className="flex items-center gap-0.5 max-w-[400px] overflow-hidden">
      {/* Main branch line */}
      <div className="flex items-center gap-0">
        {gitBranches[0].commits.map((commit, i) => (
          <div key={commit.hash} className="flex items-center">
            {i > 0 && <div className="w-3 h-[2px] bg-primary/60" />}
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className={cn(
                  "w-2 h-2 rounded-full border transition-all",
                  commit.isMerge 
                    ? "w-2.5 h-2.5 bg-purple-500 border-purple-400" 
                    : i === gitBranches[0].commits.length - 1
                      ? "w-2.5 h-2.5 bg-primary border-primary shadow-lg shadow-primary/50"
                      : "bg-primary/60 border-primary/40"
                )} />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                <p className="font-medium">{commit.msg}</p>
                <p className="text-muted-foreground">{commit.hash} · {commit.time}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
      
      {/* Branch indicators */}
      {gitBranches.slice(1).map(branch => (
        <Tooltip key={branch.id} delayDuration={100}>
          <TooltipTrigger>
            <div className="flex items-center gap-0.5 ml-1">
              <div className="w-1 h-4 rounded-full" style={{ background: branch.color, opacity: 0.5 }} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">
            {branch.name} ({branch.commits.length} commits)
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// Full git subway map panel
function GitSubwayMap() {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-primary" />
        Git Subway Map
        <Badge variant="outline" className="text-[10px] ml-auto">{gitBranches.length} branches</Badge>
      </div>
      
      <div className="relative">
        {gitBranches.map((branch, bi) => (
          <div key={branch.id} className="flex items-start gap-3 mb-3">
            {/* Branch label */}
            <div className="w-32 shrink-0 text-right pr-2">
              <Badge 
                variant="outline" 
                className="text-[10px] font-mono" 
                style={{ borderColor: branch.color, color: branch.color }}
              >
                {branch.name}
              </Badge>
            </div>
            
            {/* Commit line */}
            <div className="flex items-center gap-0 flex-1 overflow-hidden">
              {branch.commits.map((commit, ci) => (
                <div key={commit.hash} className="flex items-center">
                  {ci > 0 && (
                    <div className="w-8 h-[2px]" style={{ background: branch.color, opacity: 0.6 }} />
                  )}
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger>
                      <div className="relative group cursor-pointer">
                        <div className={cn(
                          "rounded-full border-2 transition-all group-hover:scale-150",
                          commit.isMerge ? "w-3.5 h-3.5" : "w-2.5 h-2.5",
                        )} style={{ 
                          borderColor: branch.color, 
                          background: commit.hash === 'e3c0d5' ? branch.color : 'transparent',
                          boxShadow: commit.hash === 'e3c0d5' ? `0 0 8px ${branch.color}` : 'none',
                        }} />
                        {commit.isMerge && (
                          <GitMerge className="w-2 h-2 absolute -top-0.5 -right-0.5" style={{ color: branch.color }} />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium font-mono text-[10px]">{commit.hash}</p>
                      <p>{commit.msg}</p>
                      <p className="text-muted-foreground">{commit.time}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Merge lines (SVG overlay) */}
        <svg className="absolute top-0 left-32 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <path d="M 80 12 C 80 36, 40 36, 40 36" stroke="hsl(270 100% 70%)" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="4 2" />
        </svg>
      </div>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <History className="w-3.5 h-3.5" /> Action History
      </div>
      {mockHistory.map(item => (
        <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/10 text-xs cursor-pointer transition-colors">
          <Sparkles className="w-3 h-3 text-muted-foreground" />
          <span className="flex-1 truncate">{item.action}</span>
          <span className="text-muted-foreground shrink-0">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

function ProcessesPanel() {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Cpu className="w-3.5 h-3.5" /> Background Processes
      </div>
      {mockProcesses.map(proc => (
        <div key={proc.id} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent/10 text-xs transition-colors">
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
        <Activity className="w-3.5 h-3.5" /> System Activity
      </div>
      {mockActivity.map(item => (
        <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/10 text-xs transition-colors">
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

function TerminalMiniPanel() {
  return (
    <div className="font-mono text-xs">
      <div className="text-muted-foreground mb-1 flex items-center gap-1">
        <Terminal className="w-3.5 h-3.5" /> Terminal
      </div>
      <div className="bg-background/80 rounded-lg p-3 text-emerald-400 min-h-[120px] border border-border/30">
        <div>$ lucid --status</div>
        <div className="text-muted-foreground">All systems operational. {mockProcesses.filter(p => p.status === 'running').length} agents active.</div>
        <div className="mt-1 flex items-center gap-1">
          <span>$</span>
          <span className="animate-pulse">▌</span>
        </div>
      </div>
    </div>
  );
}

function AISystemsPanel({ isStreaming, agents, messageCount }: { isStreaming?: boolean; agents?: any[]; messageCount: number }) {
  const activeAgents = agents?.filter((a: any) => a.status === 'active' || a.status === 'ACTIVE') || [];

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Brain className="w-3.5 h-3.5" /> AI Systems Overview
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border/30 p-2 bg-background/30">
          <div className="flex items-center gap-1 mb-1">
            <Brain className={cn("w-3 h-3", isStreaming ? "text-amber-500 animate-pulse" : "text-muted-foreground")} />
            <span className="text-[10px] font-medium">Thinking</span>
          </div>
          <p className="text-lg font-bold">{isStreaming ? 'Active' : 'Idle'}</p>
        </div>
        
        <div className="rounded-lg border border-border/30 p-2 bg-background/30">
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-medium">Agents</span>
          </div>
          <p className="text-lg font-bold">{activeAgents.length}</p>
        </div>
        
        <div className="rounded-lg border border-border/30 p-2 bg-background/30">
          <div className="flex items-center gap-1 mb-1">
            <MessageCircle className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-medium">Messages</span>
          </div>
          <p className="text-lg font-bold">{messageCount}</p>
        </div>
      </div>
      
      {activeAgents.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Active Agents</p>
          {activeAgents.map((agent: any) => (
            <div key={agent.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-background/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{agent.name}</span>
              <Badge variant="outline" className="text-[9px] ml-auto">{agent.role}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UISettingsPanel({ transparency, onTransparencyChange }: { transparency: number; onTransparencyChange: (v: number) => void }) {
  return (
    <div className="space-y-4 max-w-md">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <SlidersHorizontal className="w-3.5 h-3.5" /> UI Settings
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">Shell Transparency</label>
          <span className="text-xs text-muted-foreground">{transparency}%</span>
        </div>
        <Slider
          value={[transparency]}
          onValueChange={(v) => onTransparencyChange(v[0])}
          min={10}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-[10px] text-muted-foreground">
          Controls the opacity of the top bar, side bars, and bottom bar. Lower values show more of the nebula background.
        </p>
      </div>
    </div>
  );
}
