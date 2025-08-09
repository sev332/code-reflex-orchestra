import { useCallback } from 'react';

// Centralized navigation + deep-linking helpers for WisdomNET
// Uses window CustomEvents to coordinate between tabs and visualizations
export function useWisdomLinking() {
  const navigateTab = useCallback((tab: 'dashboard' | 'orchestrator' | 'memory' | 'agents' | 'rag-map') => {
    window.dispatchEvent(new CustomEvent('wisdomnet:navigate-tab', { detail: { tab } }));
  }, []);

  const focusNode = useCallback((nodeId: string, trace?: string[]) => {
    window.dispatchEvent(new CustomEvent('wisdomnet:focus-node', { detail: { nodeId, trace } }));
  }, []);

  const gotoRag = useCallback((nodeId: string, trace?: string[]) => {
    navigateTab('rag-map');
    // Small delay to allow tab mount
    setTimeout(() => focusNode(nodeId, trace), 80);
  }, [navigateTab, focusNode]);

  const gotoAgents = useCallback((nodeId?: string) => {
    navigateTab('agents');
    if (nodeId) {
      setTimeout(() => focusNode(nodeId), 80);
    }
  }, [navigateTab, focusNode]);

  const gotoMemory = useCallback((nodeId?: string, trace?: string[]) => {
    navigateTab('memory');
    if (nodeId || trace) {
      setTimeout(() => focusNode(nodeId ?? 'memory', trace), 80);
    }
  }, [navigateTab, focusNode]);

  return { navigateTab, focusNode, gotoRag, gotoAgents, gotoMemory };
}
