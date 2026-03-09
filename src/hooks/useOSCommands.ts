// ═══════════════════════════════════════════════════════════════
// useOSCommands — Hook for natural language OS command execution
// Provides command parsing, execution, and contextual suggestions
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import type { PageId } from '@/components/layout/PageTopBar';
import {
  osCommandParser,
  getContextualSuggestions,
  workflowEngine,
  type OSCommand,
  type OSCommandResult,
  type WorkflowExecution,
} from '@/lib/ai-integration';

interface UseOSCommandsOptions {
  activeApp: PageId;
  onNavigate?: (appId: PageId) => void;
}

interface UseOSCommandsReturn {
  // Parse and execute a command
  executeCommand: (input: string) => Promise<OSCommandResult | null>;
  // Get contextual suggestions for current app
  suggestions: string[];
  // Current execution state
  isExecuting: boolean;
  lastResult: OSCommandResult | null;
  // Workflow state
  activeWorkflow: WorkflowExecution | null;
  // Confirm and execute a pending workflow
  confirmWorkflow: () => Promise<void>;
  cancelWorkflow: () => void;
}

export function useOSCommands({ activeApp, onNavigate }: UseOSCommandsOptions): UseOSCommandsReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<OSCommandResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingCommand, setPendingCommand] = useState<OSCommand | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowExecution | null>(null);

  // Update suggestions when active app changes
  useEffect(() => {
    setSuggestions(getContextualSuggestions(activeApp));
  }, [activeApp]);

  // Subscribe to workflow updates
  useEffect(() => {
    const unsub = workflowEngine.onExecutionUpdate((exec) => {
      setActiveWorkflow(exec);
      if (exec.status === 'completed' || exec.status === 'failed') {
        setIsExecuting(false);
      }
    });
    return unsub;
  }, []);

  const executeCommand = useCallback(async (input: string): Promise<OSCommandResult | null> => {
    const command = osCommandParser.parse(input);
    if (!command) return null;

    setIsExecuting(true);
    
    try {
      const result = await osCommandParser.execute(command);
      setLastResult(result);

      // Handle navigation
      if (result.action === 'navigate' && result.targetApp && onNavigate) {
        onNavigate(result.targetApp);
      }

      // Handle workflow confirmation
      if (result.action === 'confirm' && command.type === 'workflow' && command.suggestedWorkflow) {
        setPendingCommand(command);
        setIsExecuting(false);
        return result;
      }

      setIsExecuting(false);
      return result;
    } catch (err) {
      setIsExecuting(false);
      const errorResult: OSCommandResult = {
        success: false,
        type: command.type,
        message: err instanceof Error ? err.message : 'Command execution failed',
      };
      setLastResult(errorResult);
      return errorResult;
    }
  }, [onNavigate]);

  const confirmWorkflow = useCallback(async () => {
    if (!pendingCommand?.suggestedWorkflow) return;

    setIsExecuting(true);
    const workflow = workflowEngine.createFromTemplate(pendingCommand.suggestedWorkflow);
    await workflowEngine.execute(workflow);
    setPendingCommand(null);
  }, [pendingCommand]);

  const cancelWorkflow = useCallback(() => {
    setPendingCommand(null);
  }, []);

  return {
    executeCommand,
    suggestions,
    isExecuting,
    lastResult,
    activeWorkflow,
    confirmWorkflow,
    cancelWorkflow,
  };
}
