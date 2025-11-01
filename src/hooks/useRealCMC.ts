// 🔗 CONNECT: React Interface → Real CMC Core
// 🧩 INTENT: Provide React hook for interacting with real memory system
// ✅ SPEC: Interface to CMC with RS-based retrieval

import { useState, useCallback, useEffect } from 'react';
import { cmcCore, CMCMemory, RetrievalQuery } from '@/lib/cmc-core';
import { apoeCore, APOEChain, APOEConfig } from '@/lib/apoe-core';
import { vifCore, VerificationResult } from '@/lib/vif-core';

export interface CMCStats {
  total: number;
  by_tier: Record<string, number>;
  avg_rs_score: number;
  compressed_count: number;
}

export interface useRealCMCReturn {
  // Memory operations
  storeMemory: (content: string, options?: {
    tags?: string[];
    importance?: number;
    source?: string;
  }) => Promise<CMCMemory | null>;
  retrieveMemories: (query: RetrievalQuery) => Promise<CMCMemory[]>;
  compressMemory: (memoryId: string) => Promise<boolean>;
  buildHierarchy: () => Promise<{
    L1: CMCMemory[];
    L2: CMCMemory[];
    L3: CMCMemory[];
  }>;
  
  // Orchestration
  executeReasoning: (query: string, config?: APOEConfig) => Promise<APOEChain>;
  
  // Verification
  verifyChain: (chain: APOEChain) => Promise<VerificationResult>;
  
  // Stats
  stats: CMCStats;
  refreshStats: () => Promise<void>;
  
  // State
  isProcessing: boolean;
  lastChain: APOEChain | null;
  lastVerification: VerificationResult | null;
}

/**
 * React hook for real CMC (Contextual Memory Core)
 * Provides interface to RS-based memory, APOE orchestration, and VIF verification
 */
export function useRealCMC(): useRealCMCReturn {
  const [stats, setStats] = useState<CMCStats>({
    total: 0,
    by_tier: {},
    avg_rs_score: 0,
    compressed_count: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastChain, setLastChain] = useState<APOEChain | null>(null);
  const [lastVerification, setLastVerification] = useState<VerificationResult | null>(null);
  
  // ==================== Memory Operations ====================
  
  const storeMemory = useCallback(async (
    content: string,
    options?: {
      tags?: string[];
      importance?: number;
      source?: string;
    }
  ): Promise<CMCMemory | null> => {
    setIsProcessing(true);
    try {
      const memory = await cmcCore.storeMemory({
        content,
        ...options
      });
      return memory;
    } catch (error) {
      console.error('useRealCMC: Store memory error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const retrieveMemories = useCallback(async (
    query: RetrievalQuery
  ): Promise<CMCMemory[]> => {
    setIsProcessing(true);
    try {
      const memories = await cmcCore.retrieveMemories(query);
      return memories;
    } catch (error) {
      console.error('useRealCMC: Retrieve memories error:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const compressMemory = useCallback(async (
    memoryId: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const result = await cmcCore.compressMemory(memoryId);
      return result;
    } catch (error) {
      console.error('useRealCMC: Compress memory error:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const buildHierarchy = useCallback(async () => {
    setIsProcessing(true);
    try {
      const hierarchy = await cmcCore.buildHierarchy();
      return hierarchy;
    } catch (error) {
      console.error('useRealCMC: Build hierarchy error:', error);
      return { L1: [], L2: [], L3: [] };
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // ==================== Orchestration ====================
  
  const executeReasoning = useCallback(async (
    query: string,
    config?: APOEConfig
  ): Promise<APOEChain> => {
    setIsProcessing(true);
    try {
      const chain = await apoeCore.executeChain(query, config);
      setLastChain(chain);
      
      // Auto-verify
      const verification = await vifCore.verifyChain(chain);
      setLastVerification(verification);
      
      return chain;
    } catch (error) {
      console.error('useRealCMC: Execute reasoning error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // ==================== Verification ====================
  
  const verifyChain = useCallback(async (
    chain: APOEChain
  ): Promise<VerificationResult> => {
    try {
      const verification = await vifCore.verifyChain(chain);
      setLastVerification(verification);
      return verification;
    } catch (error) {
      console.error('useRealCMC: Verify chain error:', error);
      throw error;
    }
  }, []);
  
  // ==================== Stats ====================
  
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await cmcCore.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('useRealCMC: Refresh stats error:', error);
    }
  }, []);
  
  // Load stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  
  return {
    storeMemory,
    retrieveMemories,
    compressMemory,
    buildHierarchy,
    executeReasoning,
    verifyChain,
    stats,
    refreshStats,
    isProcessing,
    lastChain,
    lastVerification
  };
}
