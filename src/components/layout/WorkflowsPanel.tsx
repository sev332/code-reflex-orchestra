// ═══════════════════════════════════════════════════════════════
// WorkflowsPanel — Cross-app workflow orchestration UI
// Displays available templates, execution state, and history
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Play, ChevronRight, CheckCircle2, XCircle, Loader2, Zap, ArrowRight, Clock } from 'lucide-react';
import { workflowEngine, type WorkflowTemplate, type WorkflowExecution } from '@/lib/ai-integration';

const CATEGORY_ICONS: Record<string, string> = {
  productivity: '📋',
  creative: '🎨',
  data: '📊',
  automation: '⚡',
};

const CATEGORY_COLORS: Record<string, string> = {
  productivity: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  creative: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  data: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  automation: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
};

interface WorkflowsPanelProps {
  onNavigate?: (appId: string) => void;
}

export function WorkflowsPanel({ onNavigate }: WorkflowsPanelProps) {
  const [templates] = useState<WorkflowTemplate[]>(workflowEngine.getTemplates());
  const [activeExecution, setActiveExecution] = useState<WorkflowExecution | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentExecutions, setRecentExecutions] = useState<Array<{ name: string; status: string; time: string }>>([]);

  useEffect(() => {
    const unsub = workflowEngine.onExecutionUpdate((exec) => {
      setActiveExecution(exec);
      if (exec.status === 'completed' || exec.status === 'failed') {
        setExecutingId(null);
        // Add to recent
        const wf = workflowEngine.getTemplates().find(t => t.id === exec.workflowId) ||
          { name: exec.workflowId };
        setRecentExecutions(prev => [{
          name: (wf as any).name || exec.workflowId,
          status: exec.status,
          time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 5));
      }
    });
    return unsub;
  }, []);

  const categories = ['all', 'productivity', 'creative', 'data', 'automation'];
  const filtered = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleRun = async (template: WorkflowTemplate) => {
    setExecutingId(template.id);
    const workflow = workflowEngine.createFromTemplate(template);
    await workflowEngine.execute(workflow);
  };

  const getStepApps = (template: WorkflowTemplate) =>
    template.steps.map(s => s.appId);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/50">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Cross-App Workflows</span>
        <span className="ml-auto text-xs text-muted-foreground">{templates.length} templates</span>
      </div>

      {/* Active Execution Banner */}
      {activeExecution && activeExecution.status === 'running' && (
        <div className="mx-3 mt-3 p-3 rounded-lg border border-primary/30 bg-primary/10 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary">Workflow Running</div>
            <div className="text-xs text-muted-foreground truncate">
              Step {activeExecution.currentStep + 1} of{' '}
              {/* estimate from stepResults */}
              {activeExecution.stepResults.size + 1}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-2 py-1 rounded-md text-xs transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat === 'all' ? 'All' : `${CATEGORY_ICONS[cat]} ${cat}`}
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {filtered.map(template => {
          const isRunning = executingId === template.id;
          const stepApps = getStepApps(template);
          return (
            <div
              key={template.id}
              className={`rounded-lg border bg-gradient-to-br p-3 space-y-2 ${
                CATEGORY_COLORS[template.category] || 'from-muted/20 to-muted/10 border-border'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">
                  {CATEGORY_ICONS[template.category]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{template.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                    {template.description}
                  </div>
                </div>
                <button
                  onClick={() => handleRun(template)}
                  disabled={isRunning || !!executingId}
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 hover:bg-background border border-border/50 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {isRunning ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 text-primary" />
                  )}
                  {isRunning ? 'Running' : 'Run'}
                </button>
              </div>

              {/* App Flow */}
              <div className="flex items-center gap-1 flex-wrap">
                {stepApps.map((appId, i) => (
                  <React.Fragment key={i}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border/30 text-muted-foreground font-mono">
                      {appId}
                    </span>
                    {i < stepApps.length - 1 && (
                      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/50" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Trigger hint */}
              <div className="text-[10px] text-muted-foreground/70 italic">
                Say: "{template.trigger[0]}"
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Executions */}
      {recentExecutions.length > 0 && (
        <div className="border-t border-border/50 px-3 py-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Recent
          </div>
          <div className="space-y-1">
            {recentExecutions.map((exec, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {exec.status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                )}
                <span className="truncate text-muted-foreground">{exec.name}</span>
                <span className="flex-shrink-0 text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {exec.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
