// ═══════════════════════════════════════════════════════════════
// AI Integration Context — Provides page awareness to all consumers
// The Right Drawer chat uses this to know the active page and capabilities
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { PageId } from '@/components/layout/PageTopBar';
import { appRegistry, registerAllApps } from '@/lib/ai-integration';
import type { AppContext, AIAction, AIActionResult, AICapability, AppRegistration } from '@/lib/ai-integration';

interface AIIntegrationState {
  activePage: PageId;
  activeContext: AppContext | null;
  capabilities: AICapability[];
  allApps: AppRegistration[];
  systemPrompt: string;
  // Actions
  setActivePage: (id: PageId) => void;
  executeAction: (action: AIAction) => Promise<AIActionResult>;
  refreshContext: () => void;
  getAppSummary: (appId: PageId) => string;
}

const AIIntegrationContext = createContext<AIIntegrationState | null>(null);

export function AIIntegrationProvider({ children, activePage, onPageChange }: {
  children: React.ReactNode;
  activePage: PageId;
  onPageChange: (id: PageId) => void;
}) {
  const initialized = useRef(false);
  const [activeContext, setActiveContext] = useState<AppContext | null>(null);
  const [capabilities, setCapabilities] = useState<AICapability[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [allApps, setAllApps] = useState<AppRegistration[]>([]);

  // Initialize registry once
  useEffect(() => {
    if (!initialized.current) {
      registerAllApps();
      initialized.current = true;
    }
    setAllApps(appRegistry.getAllApps());
  }, []);

  // Update context when active page changes
  const refreshContext = useCallback(() => {
    const ctx = appRegistry.getContext(activePage);
    setActiveContext(ctx);
    setCapabilities(appRegistry.getCapabilities(activePage));
    setSystemPrompt(appRegistry.buildSystemPrompt(activePage));
  }, [activePage]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const setActivePage = useCallback((id: PageId) => {
    onPageChange(id);
  }, [onPageChange]);

  const executeAction = useCallback(async (action: AIAction): Promise<AIActionResult> => {
    return appRegistry.executeAction(action);
  }, []);

  const getAppSummary = useCallback((appId: PageId): string => {
    const app = appRegistry.getApp(appId);
    return app?.description ?? 'Unknown application';
  }, []);

  return (
    <AIIntegrationContext.Provider value={{
      activePage,
      activeContext,
      capabilities,
      allApps,
      systemPrompt,
      setActivePage,
      executeAction,
      refreshContext,
      getAppSummary,
    }}>
      {children}
    </AIIntegrationContext.Provider>
  );
}

export function useAIIntegration() {
  const ctx = useContext(AIIntegrationContext);
  if (!ctx) throw new Error('useAIIntegration must be used within AIIntegrationProvider');
  return ctx;
}
