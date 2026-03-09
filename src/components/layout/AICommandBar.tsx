// ═══════════════════════════════════════════════════════════════
// AICommandBar — Natural language OS command input
// Appears above the right drawer chat input for OS-level commands
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronRight, Zap, ArrowRight } from 'lucide-react';
import { osCommandParser, getContextualSuggestions, workflowEngine } from '@/lib/ai-integration';
import type { PageId } from '@/components/layout/PageTopBar';
import type { OSCommandResult } from '@/lib/ai-integration';

interface AICommandBarProps {
  activeApp: PageId;
  onNavigate: (appId: PageId) => void;
  onResult?: (result: OSCommandResult, input: string) => void;
  className?: string;
}

export function AICommandBar({ activeApp, onNavigate, onResult, className }: AICommandBarProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<OSCommandResult | null>(null);
  const [pendingWorkflow, setPendingWorkflow] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSuggestions(getContextualSuggestions(activeApp));
  }, [activeApp]);

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    setIsExecuting(true);
    setLastResult(null);
    
    const command = osCommandParser.parse(value);
    if (!command) {
      setIsExecuting(false);
      return;
    }

    const result = await osCommandParser.execute(command);
    setLastResult(result);
    setIsExecuting(false);
    setInput('');
    setIsOpen(false);

    if (result.action === 'navigate' && result.targetApp) {
      onNavigate(result.targetApp);
    } else if (result.action === 'confirm' && command.suggestedWorkflow) {
      setPendingWorkflow(command.suggestedWorkflow);
    }

    onResult?.(result, value);
  };

  const handleConfirmWorkflow = async () => {
    if (!pendingWorkflow) return;
    setIsExecuting(true);
    const workflow = workflowEngine.createFromTemplate(pendingWorkflow);
    await workflowEngine.execute(workflow);
    setPendingWorkflow(null);
    setIsExecuting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInput('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Command Input Trigger */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/30 border border-border/40 rounded-lg hover:border-primary/40 transition-colors group">
        <Sparkles className="w-3 h-3 text-primary/70 group-hover:text-primary transition-colors" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="OS command or workflow..."
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 text-foreground"
        />
        {input && (
          <button
            onClick={() => handleSubmit(input)}
            disabled={isExecuting}
            className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Workflow Confirmation */}
      {pendingWorkflow && (
        <div className="absolute bottom-full left-0 right-0 mb-1 p-2 rounded-lg border border-primary/30 bg-background/95 backdrop-blur shadow-lg z-50">
          <div className="text-xs font-medium mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" />
            Run workflow: {pendingWorkflow.name}?
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">{pendingWorkflow.description}</div>
          <div className="flex gap-1">
            <button
              onClick={handleConfirmWorkflow}
              className="flex-1 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
            >
              Run
            </button>
            <button
              onClick={() => setPendingWorkflow(null)}
              className="flex-1 py-1 rounded bg-muted text-muted-foreground text-[10px] hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && !input && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border/50 bg-background/95 backdrop-blur shadow-lg z-50 overflow-hidden">
          <div className="px-2 py-1.5 border-b border-border/30">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Suggestions for {activeApp}
            </span>
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInput(s); handleSubmit(s); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-muted/50 transition-colors group"
            >
              <ArrowRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              <span className="text-foreground/80">{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Last Result Feedback */}
      {lastResult && !isOpen && (
        <div className={`absolute bottom-full left-0 right-0 mb-1 px-2 py-1.5 rounded-lg text-[10px] border ${
          lastResult.success 
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          {lastResult.message}
        </div>
      )}
    </div>
  );
}
