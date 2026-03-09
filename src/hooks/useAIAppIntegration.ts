// ═══════════════════════════════════════════════════════════════
// useAIAppIntegration — Hook for apps to register live context
// and action handlers with the global AI Integration system
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import type { PageId } from '@/components/layout/PageTopBar';
import { appRegistry } from '@/lib/ai-integration';
import type { AppContext, AIAction, AIActionResult, AIIntegration } from '@/lib/ai-integration';

interface UseAIAppIntegrationOptions {
  appId: PageId;
  getContext: () => AppContext;
  onAction?: (action: AIAction) => Promise<AIActionResult>;
}

export function useAIAppIntegration({ appId, getContext, onAction }: UseAIAppIntegrationOptions) {
  const getContextRef = useRef(getContext);
  const onActionRef = useRef(onAction);
  getContextRef.current = getContext;
  onActionRef.current = onAction;

  useEffect(() => {
    const integration: AIIntegration = {
      appId,
      getContext: () => getContextRef.current(),
      getCapabilities: () => appRegistry.getApp(appId)?.capabilities ?? [],
      executeAction: async (action) => {
        if (onActionRef.current) return onActionRef.current(action);
        return { success: false, error: 'No action handler registered' };
      },
      getSystemPromptFragment: () => appRegistry.getApp(appId)?.systemPromptFragment ?? '',
    };

    appRegistry.registerIntegration(integration);
    return () => appRegistry.unregisterIntegration(appId);
  }, [appId]);

  // Notify context change (call when state changes significantly)
  const notifyChange = useCallback(() => {
    const ctx = getContextRef.current();
    appRegistry.notifyContextChange(appId, ctx);
  }, [appId]);

  return { notifyChange };
}
