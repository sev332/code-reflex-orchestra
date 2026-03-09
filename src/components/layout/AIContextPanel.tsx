// ═══════════════════════════════════════════════════════════════
// AI Context Panel — Shows live app context, capabilities, and actions
// Displayed in the right drawer "Context" tab
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { useAIIntegration } from '@/contexts/AIIntegrationContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Eye, Zap, Layers, ChevronRight, Sparkles,
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  read: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  write: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  create: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  delete: 'bg-red-500/20 text-red-400 border-red-500/30',
  navigate: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  transform: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  export: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  import: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  automate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  analyze: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export function AIContextPanel() {
  const { activePage, activeContext, capabilities, allApps } = useAIIntegration();
  const activeApp = allApps.find(a => a.id === activePage);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-background/50">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Context</span>
          <Badge variant="outline" className="text-[10px] ml-auto border-primary/30 text-primary">
            LIVE
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          What the AI knows about the current app
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Active App */}
          {activeApp && (
            <div className="rounded-xl border border-border/30 bg-card/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{activeApp.name}</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">
                  {activeApp.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{activeApp.description}</p>
            </div>
          )}

          {/* Live Context */}
          {activeContext && (
            <div className="rounded-xl border border-border/30 bg-card/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-foreground" />
                <span className="text-xs font-medium text-foreground">Current State</span>
              </div>
              <p className="text-xs text-muted-foreground">{activeContext.summary}</p>
              {activeContext.activeView && (
                <div className="text-xs text-muted-foreground">
                  View: <span className="text-foreground">{activeContext.activeView}</span>
                </div>
              )}
              {activeContext.itemCount !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Items: <span className="text-foreground">{activeContext.itemCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  AI Actions ({capabilities.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {capabilities.map(cap => (
                  <div
                    key={cap.id}
                    className="rounded-lg border border-border/20 bg-card/30 p-2 hover:bg-card/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{cap.name}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-[9px] px-1.5 py-0 h-4 border', categoryColors[cap.category] || 'border-border text-muted-foreground')}
                      >
                        {cap.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-5 mt-0.5">{cap.description}</p>
                    {cap.examples && cap.examples.length > 0 && (
                      <div className="ml-5 mt-1 flex flex-wrap gap-1">
                        {cap.examples.slice(0, 2).map((ex, i) => (
                          <span key={i} className="text-[10px] text-primary/70 bg-primary/10 rounded px-1.5 py-0.5">
                            "{ex}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Apps Summary */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Other Apps Available</span>
            <div className="grid grid-cols-2 gap-1.5">
              {allApps.filter(a => a.id !== activePage).slice(0, 12).map(app => (
                <div key={app.id} className="text-[10px] text-muted-foreground rounded-md bg-card/30 px-2 py-1.5 border border-border/20">
                  <span className="text-foreground">{app.name}</span>
                  <span className="ml-1 text-muted-foreground/60">({app.capabilities.length})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
